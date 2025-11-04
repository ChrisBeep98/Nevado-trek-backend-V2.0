// index.js

/**
 * Módulo de Firebase Admin SDK.
 * Proporciona acceso privilegiado a los recursos de Firebase.
 */
const admin = require("firebase-admin");

/**
 * Módulo de Firebase Functions SDK.
 * Se usa para crear y desplegar funciones en la nube.
 */
const functions = require("firebase-functions");
const {defineString} = require("firebase-functions/params");

// Import our modularized code
/* eslint-disable no-unused-vars */
const {COLLECTIONS, STATUS, RATE_LIMITING, BOOKING_REFERENCE_PREFIX} = require("./src/constants");
const {validateCustomer, validateTourId, validateDate, validatePax, validatePrice} = require("./src/validators");
const {addStatusHistoryEntry} = require("./src/audit");
const {updateEventCapacity, canModifyBooking, generateBookingReference, getClientIP} = require("./src/helpers");
/* eslint-enable no-unused-vars */
const {updateBookingDetails} = require("./src/admin/booking-details");

// Define parameter for admin secret key using the new parameters system
// This replaces the deprecated functions.config() and will be required after March 2026
const adminSecretKey = defineString("ADMIN_SECRET_KEY", {
  default: "miClaveSecreta123", // Production key set via Firebase parameters during deployment
});

// Inicializa la app de Firebase Admin.
// Esto utiliza las credenciales predeterminadas del entorno de Cloud Functions.
admin.initializeApp();

// Referencia global a la base de datos Firestore.
// Esto evita inicializarlo en cada llamada a una función.
const db = admin.firestore();

// -----------------------------------------------------------
// Sección de Funciones de Utilidad y Constantes
// -----------------------------------------------------------

/**
 * Constantes utilizadas en toda la API.
 */
const CONSTANTS = {
  // La clave secreta para la autenticación de las funciones de administrador
  // está ahora manejada por la función isAdminRequest para usar el sistema de parámetros
  // que reemplaza al obsoleto functions.config()

  // Colecciones de Firestore.
  COLLECTIONS: {
    TOURS: "tours",
    TOUR_EVENTS: "tourEvents", // Salidas específicas [cite: 101, 103]
    BOOKINGS: "bookings",
    RATE_LIMITER: "rateLimiter", // Anti-spam [cite: 159, 161]
  },

  // Estado de los eventos y reservas.
  STATUS: {
    EVENT_TYPE_PRIVATE: "private", // Evento creado por una reserva inicial
    // [cite: 121]
    EVENT_TYPE_PUBLIC: "public", // Evento visible en el calendario
    // [cite: 123]
    BOOKING_PENDING: "pending", // Estado inicial de la reserva [cite: 149, 155]
    BOOKING_CONFIRMED: "confirmed",
    BOOKING_PAID: "paid",
    BOOKING_CANCELLED: "cancelled",
    BOOKING_CANCELLED_BY_ADMIN: "cancelled_by_admin",
  },

  // Tiempo mínimo entre reservas de la misma IP (Anti-spam)
  RATE_LIMITING: {
    RATE_LIMIT_SECONDS: 300, // 5 minutos entre reservas por IP
    MAX_BOOKINGS_PER_HOUR: 3, // Máximo 3 reservas por hora por IP
    MAX_BOOKINGS_PER_DAY: 5, // Máximo 5 reservas por día por IP
  },

  // Nombres para los índices de búsqueda
  BOOKING_REFERENCE_PREFIX: "BK-",
};

/**
 * Función middleware simple para validar la clave secreta del administrador.
 * @param {functions.https.Request} req - La solicitud HTTP.
 * @return {boolean} - true si la clave es válida, false en caso contrario.
 */
const isAdminRequest = (req) => {
  // La clave debe venir en un encabezado llamado 'X-Admin-Secret-Key'
  const secretKey = req.headers["x-admin-secret-key"];
  return secretKey === adminSecretKey.value();
};

/**
 * Obtiene la IP del cliente, manejando cabeceras de proxy
 * @param {functions.https.Request} req - La solicitud HTTP
 * @return {string} La dirección IP del cliente
 */
/**
 * Verifica si una IP ha superado las limitaciones de tasa
 * @param {string} clientIP - Dirección IP del cliente
 * @return {Promise<boolean>} - true si está permitido, false si está bloqueado
 */
const isRateLimited = async (clientIP) => {
  if (!clientIP) {
    console.warn(
        "No se pudo obtener la IP del cliente para verificación de rate limiting",
    );
    return false; // Permitir si no hay IP (no debería pasar en producción)
  }

  try {
    // Obtener referencias a la colección de rate limiting
    const rateLimiterRef = db.collection(COLLECTIONS.RATE_LIMITER);
    const now = new Date();

    // Verificar si el registro existe para esta IP
    const docRef = rateLimiterRef.doc(clientIP);
    const docSnapshot = await docRef.get();

    if (!docSnapshot.exists) {
      // Primera solicitud de esta IP, permitir
      return false;
    }

    const rateData = docSnapshot.data();
    const lastBookingTime = rateData.lastBookingTimestamp ?
      rateData.lastBookingTimestamp.toDate() : new Date(0);
    const bookingsThisHour = rateData.bookingsThisHour || 0;
    const bookingsThisDay = rateData.bookingsThisDay || 0;

    // Verificar límite de tiempo entre reservas
    const timeSinceLastBooking = now.getTime() - lastBookingTime.getTime();
    if (timeSinceLastBooking < RATE_LIMITING.RATE_LIMIT_SECONDS * 1000) {
      return true; // Bloqueado por frecuencia de solicitud
    }

    // Verificar límite de reservas por hora
    if (bookingsThisHour >= RATE_LIMITING.MAX_BOOKINGS_PER_HOUR) {
      return true; // Bloqueado por límite de frecuencia por hora
    }

    // Verificar límite de reservas por día
    if (bookingsThisDay >= RATE_LIMITING.MAX_BOOKINGS_PER_DAY) {
      return true; // Bloqueado por límite de frecuencia por día
    }

    return false;
  } catch (error) {
    console.error("Error al verificar rate limiting:", error);
    // En caso de error, permitir la solicitud para no interrumpir el servicio
    return false;
  }
};

/**
 * Registra una nueva reserva para propósitos de rate limiting
 * @param {string} clientIP - Dirección IP del cliente
 * @return {Promise<void>}
 */
const recordBookingAttempt = async (clientIP) => {
  if (!clientIP) {
    return; // No registrar si no hay IP
  }

  try {
    const rateLimiterRef = db.collection(COLLECTIONS.RATE_LIMITER);
    const docRef = rateLimiterRef.doc(clientIP);
    const now = admin.firestore.FieldValue.serverTimestamp();

    // Usar una transacción para actualizar de forma segura
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(docRef);
      const currentData = doc.exists ? doc.data() : {};

      transaction.set(docRef, {
        lastBookingTimestamp: now,
        bookingsThisHour: (currentData.bookingsThisHour || 0) + 1,
        bookingsThisDay: (currentData.bookingsThisDay || 0) + 1,
        updatedAt: now,
        ip: clientIP, // Para consultas futuras
      }, {merge: true});
    });
  } catch (error) {
    console.error("Error al registrar intento de reserva:", error);
  }
};

/**
 * Limpia los registros antiguos de rate limiting para liberar espacio
 * @return {Promise<void>}
 */
// eslint-disable-next-line no-unused-vars
const cleanupRateLimiting = async () => {
  try {
    // Esto podría ser implementado como una Cloud Function programada
    // o como parte de las operaciones de mantenimiento, pero para
    // simplicidad lo dejamos como función auxiliar
  } catch (error) {
    console.error("Error en limpieza de rate limiting:", error);
  }
};

/**
 * Genera un código de referencia único para una reserva
 * @return {string} Código de referencia en formato BK-YYYYMMDD-XXX
 */


// -----------------------------------------------------------
// Sección de Endpoints Públicos (Lectura de Datos)
// -----------------------------------------------------------

// A continuación implementaremos la función para obtener la lista de tours.
// Endpoint: GET /tours
// Propósito: Obtener el catálogo maestro de experiencias. [cite: 25, 26]
// Esto será la base de tu arquitectura bilingüe. [cite: 97, 98]

/**
 * Obtiene la lista de todos los tours activos.
 * @param {functions.https.Request} req - La solicitud HTTP.
 * @param {functions.Response} res - La respuesta HTTP.
 * @return {Promise<void>} - La respuesta con la lista de tours.
 */
const getToursList = async (req, res) => {
  // Solo permitiremos el método GET para esta función de lectura
  if (req.method !== "GET") {
    return res.status(405).send("Method Not Allowed");
  }

  try {
    // Obtenemos una referencia a la colección de tours
    const toursRef = db.collection(CONSTANTS.COLLECTIONS.TOURS);

    // Filtramos solo por los tours activos [cite: 35, 95]
    const snapshot = await toursRef
        .where("isActive", "==", true)
        .get();

    if (snapshot.empty) {
      // No hay tours activos
      return res.status(200).json([]);
    }

    // Mapeamos los documentos de Firestore a un array de objetos JSON
    const tours = snapshot.docs.map((doc) => ({
      // El tourId es el ID del documento en Firestore
      tourId: doc.id,
      ...doc.data(),
    }));

    // Devolvemos el array de tours.
    // Contienen la estructura bilingüe {name: {es: "...", en: "..."}}
    // [cite: 36]
    return res.status(200).json(tours);
  } catch (error) {
    console.error("Error al obtener la lista de tours:", error);
    // Devolvemos un error 500 (Internal Server Error)
    return res.status(500).send({
      message: "Internal Server Error",
      details: error.message,
    });
  }
};

/**
 * Obtiene un tour específico por su ID.
 * @param {functions.https.Request} req - La solicitud HTTP.
 * @param {functions.Response} res - La respuesta HTTP.
 * @return {Promise<void>} - La respuesta con el tour específico.
 */
const getTourById = async (req, res) => {
  // Verificamos que sea una solicitud GET
  if (req.method !== "GET") {
    return res.status(405).send("Method Not Allowed");
  }

  try {
    // Extraemos el tourId de la URL (asumiendo que se configura como
    // /tours/{tourId})
    const tourId = req.params.tourId || req.path.split("/")[1]; // This is a
    // simplification
    // For a real implementation with proper routing, the tourId would come
    // from a proper route parameter

    if (!tourId) {
      return res.status(400).send({
        message: "Bad Request: tourId is required in the URL path",
      });
    }

    // Obtenemos el tour de Firestore
    const tourRef = db.collection(CONSTANTS.COLLECTIONS.TOURS).doc(tourId);
    const docSnapshot = await tourRef.get();

    if (!docSnapshot.exists) {
      return res.status(404).send({
        message: "Tour not found",
      });
    }

    const tourData = docSnapshot.data();

    // Solo devolvemos el tour si está activo
    if (!tourData.isActive) {
      return res.status(404).send({
        message: "Tour not found",
      });
    }

    // Devolvemos el tour con su ID
    return res.status(200).json({
      tourId: docSnapshot.id,
      ...tourData,
    });
  } catch (error) {
    console.error("Error al obtener el tour por ID:", error);
    return res.status(500).send({
      message: "Internal Server Error",
      details: error.message,
    });
  }
};


// -----------------------------------------------------------
// Sección de Endpoints de Administración
// -----------------------------------------------------------

// A continuación implementaremos las funciones de gestión para
// el panel de control. [cite: 213, 218]

/**
 * Crea un nuevo tour.
 * @param {functions.https.Request} req - La solicitud HTTP.
 * @param {functions.Response} res - La respuesta HTTP.
 * @return {Promise<void>} - La respuesta de creación del tour.
 */
const adminCreateTour = async (req, res) => {
  // Verificamos que sea una solicitud POST
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  // Verificamos la autenticación de administrador
  if (!isAdminRequest(req)) {
    return res.status(401).send("Unauthorized: Invalid admin secret key");
  }

  try {
    // Obtenemos el cuerpo de la solicitud
    const tourData = req.body;

    // Validamos que el tour tenga los campos necesarios
    // La estructura debe incluir campos bilingües {es: "...", en: "..."}
    if (!tourData.name || !tourData.name.es || !tourData.name.en) {
      return res.status(400).send({
        message: "Bad Request: Tour must include a name object " +
                 "with both 'es' and 'en' properties",
      });
    }

    // Aseguramos que el campo isActive esté presente (por defecto true)
    if (tourData.isActive === undefined) {
      tourData.isActive = true;
    }

    // Añadimos marca de tiempo de creación
    tourData.createdAt = admin.firestore.FieldValue.serverTimestamp();
    tourData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    // Creamos el tour en Firestore
    const toursRef = db.collection(CONSTANTS.COLLECTIONS.TOURS);
    const docRef = await toursRef.add(tourData);

    // Devolvemos el ID del tour recién creado
    return res.status(201).json({
      success: true,
      tourId: docRef.id,
      message: "Tour created successfully",
    });
  } catch (error) {
    console.error("Error al crear el tour:", error);
    return res.status(500).send({
      message: "Internal Server Error",
      details: error.message,
    });
  }
};

/**
 * Actualiza un tour existente.
 * @param {functions.https.Request} req - La solicitud HTTP.
 * @param {functions.Response} res - La respuesta HTTP.
 * @return {Promise<void>} - La respuesta de actualización del tour.
 */
const adminUpdateTour = async (req, res) => {
  // Verificamos que sea una solicitud PUT
  if (req.method !== "PUT") {
    return res.status(405).send("Method Not Allowed");
  }

  // Verificamos la autenticación de administrador
  if (!isAdminRequest(req)) {
    return res.status(401).send("Unauthorized: Invalid admin secret key");
  }

  try {
    // Extraemos el tourId de la URL. Con las Cloud Functions HTTP,
    // el formato de URL es
    // https://region-project.cloudfunctions.net/functionName/{tourId}
    // Entonces usamos req.path para obtener la parte después del nombre
    const pathParts = req.path.split("/");
    // El tourId debería ser el último segmento no vacío de la URL
    let tourId = null;
    for (let i = pathParts.length - 1; i >= 0; i--) {
      if (pathParts[i] && pathParts[i].trim() !== "") {
        tourId = pathParts[i];
        break;
      }
    }

    if (!tourId) {
      return res.status(400).send({
        message: "Bad Request: tourId is required in the URL path",
      });
    }

    // Obtenemos los datos actualizados del cuerpo de la solicitud
    const updatedData = req.body;

    // Validamos que no se esté intentando cambiar el ID del tour
    if (updatedData.id || updatedData.tourId) {
      return res.status(400).send({
        message: "Bad Request: Cannot update tour ID",
      });
    }

    // Si se proporciona un nombre, aseguramos que tenga la estructura bilingüe
    if (updatedData.name) {
      if (!updatedData.name.es || !updatedData.name.en) {
        return res.status(400).send({
          message: "Bad Request: Name must include both 'es' and 'en' " +
                   "properties",
        });
      }
    }

    // Añadimos marca de tiempo de actualización
    updatedData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    // Actualizamos el tour en Firestore
    const tourRef = db.collection(CONSTANTS.COLLECTIONS.TOURS).doc(tourId);
    const docSnapshot = await tourRef.get();

    if (!docSnapshot.exists) {
      return res.status(404).send({
        message: "Tour not found",
      });
    }

    await tourRef.update(updatedData);

    // Devolvemos confirmación de actualización exitosa
    return res.status(200).json({
      success: true,
      tourId: tourId,
      message: "Tour updated successfully",
    });
  } catch (error) {
    console.error("Error al actualizar el tour:", error);
    return res.status(500).send({
      message: "Internal Server Error",
      details: error.message,
    });
  }
};

/**
 * Elimina lógicamente un tour existente (marca como inactivo).
 * @param {functions.https.Request} req - La solicitud HTTP.
 * @param {functions.Response} res - La respuesta HTTP.
 * @return {Promise<void>} - La respuesta de eliminación del tour.
 */
const adminDeleteTour = async (req, res) => {
  // Verificamos que sea una solicitud DELETE
  if (req.method !== "DELETE") {
    return res.status(405).send("Method Not Allowed");
  }

  // Verificamos la autenticación de administrador
  if (!isAdminRequest(req)) {
    return res.status(401).send("Unauthorized: Invalid admin secret key");
  }

  try {
    // Extraemos el tourId de la URL. Con las Cloud Functions HTTP,
    // el formato de URL es
    // https://region-project.cloudfunctions.net/functionName/{tourId}
    // Entonces usamos req.path para obtener la parte después del nombre
    const pathParts = req.path.split("/");
    // El tourId debería ser el último segmento no vacío de la URL
    let tourId = null;
    for (let i = pathParts.length - 1; i >= 0; i--) {
      if (pathParts[i] && pathParts[i].trim() !== "") {
        tourId = pathParts[i];
        break;
      }
    }

    if (!tourId) {
      return res.status(400).send({
        message: "Bad Request: tourId is required in the URL path",
      });
    }

    // Marcamos el tour como inactivo (eliminación lógica)
    const tourRef = db.collection(CONSTANTS.COLLECTIONS.TOURS).doc(tourId);
    const docSnapshot = await tourRef.get();

    if (!docSnapshot.exists) {
      return res.status(404).send({
        message: "Tour not found",
      });
    }

    // Actualizamos el tour estableciendo isActive a false
    // y actualizamos la fecha
    await tourRef.update({
      isActive: false,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Devolvemos confirmación de eliminación exitosa
    return res.status(200).json({
      success: true,
      tourId: tourId,
      message: "Tour deleted successfully (marked as inactive)",
    });
  } catch (error) {
    console.error("Error al eliminar el tour:", error);
    return res.status(500).send({
      message: "Internal Server Error",
      details: error.message,
    });
  }
};

/**
 * Se une a un evento público existente
 * @param {functions.https.Request} req - La solicitud HTTP.
 * @param {functions.Response} res - La respuesta HTTP.
 * @return {Promise<void>} - La respuesta con la información de la unión al evento.
 */
const joinEvent = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  try {
    // Obtener IP del cliente para rate limiting
    const clientIP = getClientIP(req);

    // Verificar rate limiting
    const isLimited = await isRateLimited(clientIP);
    if (isLimited) {
      return res.status(403).send({
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Demasiadas solicitudes desde esta dirección IP. Intente de nuevo más tarde.",
          details: "Rate limit exceeded",
        },
      });
    }

    // Validar datos de entrada
    const bookingData = req.body;

    // Validar campos requeridos
    if (!bookingData.eventId) {
      return res.status(400).send({
        error: {
          code: "INVALID_DATA",
          message: "El eventId es obligatorio",
          details: "eventId is required",
        },
      });
    }

    if (!bookingData.customer || !bookingData.customer.fullName ||
        !bookingData.customer.documentId || !bookingData.customer.phone ||
        !bookingData.customer.email) {
      return res.status(400).send({
        error: {
          code: "INVALID_DATA",
          message: "La información del cliente es incompleta",
          details: "fullName, documentId, phone, and email are required in customer object",
        },
      });
    }

    if (!bookingData.pax || bookingData.pax <= 0) {
      return res.status(400).send({
        error: {
          code: "INVALID_DATA",
          message: "El número de participantes debe ser un número positivo",
          details: "pax must be a positive number",
        },
      });
    }

    // Verificar que el evento exista y sea público
    const eventRef = db.collection(CONSTANTS.COLLECTIONS.TOUR_EVENTS).doc(bookingData.eventId);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      return res.status(404).send({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Evento no encontrado",
          details: "The specified event does not exist",
        },
      });
    }

    const event = eventDoc.data();

    // Solo permitir unirse a eventos públicos
    if (event.type !== CONSTANTS.STATUS.EVENT_TYPE_PUBLIC) {
      return res.status(404).send({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Evento no disponible para unirse",
          details: "The specified event is not public",
        },
      });
    }

    if (event.status !== "active") {
      return res.status(404).send({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Evento no disponible",
          details: "The specified event is not active",
        },
      });
    }

    // Verificar capacidad disponible
    const newBookedSlots = event.bookedSlots + bookingData.pax;
    if (newBookedSlots > event.maxCapacity) {
      return res.status(422).send({
        error: {
          code: "CAPACITY_EXCEEDED",
          message: "Capacidad excedida para este evento",
          details: "Not enough capacity available for the requested number of participants",
        },
      });
    }

    // Obtener información del tour asociado
    const tourRef = db.collection(CONSTANTS.COLLECTIONS.TOURS).doc(event.tourId);
    const tourDoc = await tourRef.get();

    if (!tourDoc.exists) {
      return res.status(500).send({
        error: {
          code: "INTERNAL_ERROR",
          message: "Error interno: tour asociado no encontrado",
          details: "Associated tour does not exist",
        },
      });
    }

    const tour = tourDoc.data();
    if (!tour.isActive) {
      return res.status(404).send({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Tour asociado al evento no disponible",
          details: "The associated tour is not active",
        },
      });
    }

    // Crear la reserva en una transacción para garantizar consistencia
    const bookingId = await db.runTransaction(async (transaction) => {
      // Obtener datos actualizados del evento
      const eventSnapshot = await transaction.get(eventRef);
      const eventData = eventSnapshot.data();

      // Verificar capacidad nuevamente (double-check para concurrencia)
      const newBookedSlots = eventData.bookedSlots + bookingData.pax;
      if (newBookedSlots > eventData.maxCapacity) {
        throw new Error("CAPACITY_EXCEEDED");
      }

      // Calcular precio basado en el número de participantes
      let pricePerPerson = 1000000; // Valor por defecto
      if (tour.pricingTiers && Array.isArray(tour.pricingTiers)) {
        // Buscar el precio adecuado según el número total de personas en el evento
        const totalPax = newBookedSlots; // Número total de participantes en el evento
        const pricingTier = tour.pricingTiers.find((tier) =>
          totalPax >= (tier.paxFrom || tier.pax) && totalPax <= (tier.paxTo || tier.pax),
        );
        if (pricingTier) {
          pricePerPerson = pricingTier.pricePerPerson || pricePerPerson;
        }
      }

      // Calcular total
      const totalPrice = pricePerPerson * bookingData.pax;

      // Actualizar el evento para incrementar los slots reservados
      transaction.update(eventRef, {
        bookedSlots: newBookedSlots,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Crear la reserva
      const bookingRef = db.collection(CONSTANTS.COLLECTIONS.BOOKINGS).doc();

      const bookingDoc = {
        bookingId: bookingRef.id,
        eventId: eventRef.id,
        tourId: event.tourId,
        tourName: event.tourName, // Ya está denormalizado
        customer: bookingData.customer,
        pax: bookingData.pax,
        pricePerPerson: pricePerPerson,
        totalPrice: totalPrice,
        bookingDate: admin.firestore.FieldValue.serverTimestamp(),
        status: STATUS.BOOKING_PENDING,
        statusHistory: [{
          timestamp: new Date().toISOString(), // Using client timestamp since Firestore timestamps can't be in arrays
          status: STATUS.BOOKING_PENDING,
          note: "Joined to existing event",
          adminUser: "system",
        }],
        isEventOrigin: false, // No creó el evento
        ipAddress: clientIP,
        bookingReference: generateBookingReference(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      transaction.set(bookingRef, bookingDoc);

      return bookingRef.id;
    });

    // Registrar intento de reserva para rate limiting
    await recordBookingAttempt(clientIP);

    // Devolver éxit
    return res.status(201).json({
      success: true,
      bookingId: bookingId,
      bookingReference: generateBookingReference(),
      status: CONSTANTS.STATUS.BOOKING_PENDING,
      pricePerPerson: 1000000, // Temporal - debería ser el precio calculado
      message: "Se ha unido exitosamente al evento.",
    });
  } catch (error) {
    if (error.message === "CAPACITY_EXCEEDED") {
      return res.status(422).send({
        error: {
          code: "CAPACITY_EXCEEDED",
          message: "Capacidad excedida para este evento",
          details: "Not enough capacity available for the requested number of participants",
        },
      });
    }

    console.error("Error al unirse al evento:", error);
    return res.status(500).send({
      error: {
        code: "INTERNAL_ERROR",
        message: "Error interno al procesar la unión al evento",
        details: error.message,
      },
    });
  }
};

/**
 * Verifica el estado de una reserva por código de referencia
 * @param {functions.https.Request} req - La solicitud HTTP.
 * @param {functions.Response} res - La respuesta HTTP.
 * @return {Promise<void>} - La respuesta con la información de la reserva.
 */
const checkBooking = async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).send("Method Not Allowed");
  }

  try {
    // Obtener parámetros de consulta
    const {reference, email} = req.query;

    if (!reference) {
      return res.status(400).send({
        error: {
          code: "INVALID_DATA",
          message: "El código de referencia es obligatorio",
          details: "reference parameter is required",
        },
      });
    }

    // Buscar la reserva por código de referencia
    // En Firestore no se puede hacer una búsqueda directa por bookingReference
    // así que buscaremos en la colección BOOKINGS
    const bookingsQuery = await db.collection(CONSTANTS.COLLECTIONS.BOOKINGS)
        .where("bookingReference", "==", reference)
        .limit(1)
        .get();

    if (bookingsQuery.empty) {
      return res.status(404).send({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Reserva no encontrada",
          details: "No booking found with the provided reference",
        },
      });
    }

    const bookingDoc = bookingsQuery.docs[0];
    const booking = {...bookingDoc.data(), bookingId: bookingDoc.id};

    // Si se proporciona email, verificar que coincida (para seguridad adicional)
    if (email && booking.customer.email !== email) {
      return res.status(404).send({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Reserva no encontrada",
          details: "No booking found with the provided reference and email combination",
        },
      });
    }

    // Obtener información adicional del tour y evento
    let tour = null;
    try {
      const tourRef = db.collection(CONSTANTS.COLLECTIONS.TOURS).doc(booking.tourId);
      const tourDoc = await tourRef.get();
      if (tourDoc.exists) {
        tour = tourDoc.data();
      }
    } catch (e) {
      console.warn("Error fetching tour info for booking:", e);
    }

    // Formatear respuesta
    const response = {
      bookingId: booking.bookingId,
      eventId: booking.eventId,
      tourId: booking.tourId,
      tourName: tour ? tour.name : {es: booking.tourName, en: booking.tourName}, // Si no se pudo obtener el tour,
      // usar el denormalizado
      customer: {
        fullName: booking.customer.fullName,
      },
      pax: booking.pax,
      status: booking.status,
      bookingDate: booking.bookingDate,
      startDate: booking.startDate, // Esto estaría en el evento
      pricePerPerson: booking.pricePerPerson,
      totalPrice: booking.totalPrice,
      bookingReference: booking.bookingReference,
      isEventOrigin: booking.isEventOrigin,
    };

    // Obtener la fecha del evento
    try {
      const eventRef = db.collection(CONSTANTS.COLLECTIONS.TOUR_EVENTS).doc(booking.eventId);
      const eventDoc = await eventRef.get();
      if (eventDoc.exists) {
        const event = eventDoc.data();
        response.startDate = event.startDate;
        response.endDate = event.endDate;
      }
    } catch (e) {
      console.warn("Error fetching event info for booking:", e);
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error al verificar la reserva:", error);
    return res.status(500).send({
      error: {
        code: "INTERNAL_ERROR",
        message: "Error interno al procesar la verificación de reserva",
        details: error.message,
      },
    });
  }
};

/**
 * Crea una nueva reserva para un tour en una fecha específica
 * @param {functions.https.Request} req - La solicitud HTTP.
 * @param {functions.Response} res - La respuesta HTTP.
 * @return {Promise<void>} - La respuesta con la información de la reserva.
 */
const createBooking = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  try {
    // Obtener IP del cliente para rate limiting
    const clientIP = getClientIP(req);

    // Verificar rate limiting
    const isLimited = await isRateLimited(clientIP);
    if (isLimited) {
      return res.status(403).send({
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Demasiadas solicitudes desde esta dirección IP. Intente de nuevo más tarde.",
          details: "Rate limit exceeded",
        },
      });
    }

    // Validar datos de entrada
    const bookingData = req.body;

    // Validar campos requeridos
    if (!bookingData.tourId) {
      return res.status(400).send({
        error: {
          code: "INVALID_DATA",
          message: "El tourId es obligatorio",
          details: "tourId is required",
        },
      });
    }

    if (!bookingData.startDate) {
      return res.status(400).send({
        error: {
          code: "INVALID_DATA",
          message: "La fecha de inicio es obligatoria",
          details: "startDate is required",
        },
      });
    }

    if (!bookingData.customer || !bookingData.customer.fullName ||
        !bookingData.customer.documentId || !bookingData.customer.phone ||
        !bookingData.customer.email) {
      return res.status(400).send({
        error: {
          code: "INVALID_DATA",
          message: "La información del cliente es incompleta",
          details: "fullName, documentId, phone, and email are required in customer object",
        },
      });
    }

    if (!bookingData.pax || bookingData.pax <= 0) {
      return res.status(400).send({
        error: {
          code: "INVALID_DATA",
          message: "El número de participantes debe ser un número positivo",
          details: "pax must be a positive number",
        },
      });
    }

    // Validar que la fecha sea válida
    const startDate = new Date(bookingData.startDate);
    if (isNaN(startDate.getTime())) {
      return res.status(400).send({
        error: {
          code: "INVALID_DATA",
          message: "La fecha proporcionada no es válida",
          details: "startDate is not a valid date",
        },
      });
    }

    // Verificar que el tour exista y esté activo
    const tourRef = db.collection(CONSTANTS.COLLECTIONS.TOURS).doc(bookingData.tourId);
    const tourDoc = await tourRef.get();

    if (!tourDoc.exists) {
      return res.status(404).send({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Tour no encontrado o no disponible",
          details: "The specified tour does not exist or is inactive",
        },
      });
    }

    const tour = tourDoc.data();
    if (!tour.isActive) {
      return res.status(404).send({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Tour no disponible",
          details: "The specified tour is not active",
        },
      });
    }

    // Crear o encontrar un evento para esta fecha
    let eventRef;
    let eventExists = false;

    // Check if admin wants to create a new event regardless of existing events
    if (bookingData.createNewEvent) {
      // Create a new event for this booking regardless of any existing event
      const newEvent = {
        tourId: bookingData.tourId,
        tourName: tour.name.es, // Denormalizado para optimización
        startDate: startDate,
        endDate: new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 días después, por ejemplo
        maxCapacity: 8, // Capacidad por defecto
        bookedSlots: 0, // Inicializado en 0
        type: STATUS.EVENT_TYPE_PRIVATE, // Privado inicialmente
        status: "active",
        totalBookings: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const createdEvent = await db.collection(CONSTANTS.COLLECTIONS.TOUR_EVENTS).add(newEvent);
      eventRef = createdEvent;
      eventExists = false;
    } else {
      // Buscar si ya existe un evento para este tour y fecha
      const eventsQuery = await db.collection(CONSTANTS.COLLECTIONS.TOUR_EVENTS)
          .where("tourId", "==", bookingData.tourId)
          .where("startDate", "==", startDate)
          .limit(1)
          .get();

      if (!eventsQuery.empty) {
        // Usar evento existente
        eventRef = eventsQuery.docs[0].ref;
        eventExists = true;
      } else {
        // Crear nuevo evento privado
        const newEvent = {
          tourId: bookingData.tourId,
          tourName: tour.name.es, // Denormalizado para optimización
          startDate: startDate,
          endDate: new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 días después, por ejemplo
          maxCapacity: 8, // Capacidad por defecto
          bookedSlots: 0, // Inicializado en 0
          type: STATUS.EVENT_TYPE_PRIVATE, // Privado inicialmente
          status: "active",
          totalBookings: 0,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        const createdEvent = await db.collection(CONSTANTS.COLLECTIONS.TOUR_EVENTS).add(newEvent);
        eventRef = createdEvent;
        eventExists = false;
      }
    }

    // Ahora crear la reserva en una transacción para garantizar consistencia
    const bookingId = await db.runTransaction(async (transaction) => {
      // Obtener datos actualizados del evento
      const eventSnapshot = await transaction.get(eventRef);
      const eventData = eventSnapshot.data();

      // Verificar capacidad
      const newBookedSlots = eventData.bookedSlots + bookingData.pax;
      if (newBookedSlots > eventData.maxCapacity) {
        throw new Error("CAPACITY_EXCEEDED");
      }

      // Calcular precio basado en el número de participantes (usando precios predefinidos del tour si existen)
      // Por ahora, usamos un precio por defecto o el del tour si está disponible
      let pricePerPerson = 1000000; // Valor por defecto
      if (tour.pricingTiers && Array.isArray(tour.pricingTiers)) {
        // Buscar el precio adecuado según el número de personas
        const pricingTier = tour.pricingTiers.find((tier) =>
          bookingData.pax >= (tier.paxFrom || tier.pax) && bookingData.pax <= (tier.paxTo || tier.pax),
        );
        if (pricingTier) {
          pricePerPerson = pricingTier.pricePerPerson || pricePerPerson;
        }
      }

      // Calcular total
      const totalPrice = pricePerPerson * bookingData.pax;

      // Actualizar el evento para incrementar los slots reservados
      transaction.update(eventRef, {
        bookedSlots: newBookedSlots,
        totalBookings: (eventData.totalBookings || 0) + 1,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Crear la reserva
      const bookingRef = db.collection(CONSTANTS.COLLECTIONS.BOOKINGS).doc();

      const bookingDoc = {
        bookingId: bookingRef.id,
        eventId: eventRef.id,
        tourId: bookingData.tourId,
        tourName: tour.name.es, // Denormalizado
        customer: bookingData.customer,
        pax: bookingData.pax,
        pricePerPerson: pricePerPerson,
        totalPrice: totalPrice,
        bookingDate: admin.firestore.FieldValue.serverTimestamp(),
        status: CONSTANTS.STATUS.BOOKING_PENDING,
        statusHistory: [{
          timestamp: new Date().toISOString(), // Using client timestamp since Firestore timestamps can't be in arrays
          status: CONSTANTS.STATUS.BOOKING_PENDING,
          note: "Initial booking created",
          adminUser: "system",
        }],
        isEventOrigin: !eventExists, // Indica si esta reserva creó el evento
        ipAddress: clientIP,
        bookingReference: generateBookingReference(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      transaction.set(bookingRef, bookingDoc);

      return bookingRef.id;
    });

    // Registrar intento de reserva para rate limiting
    await recordBookingAttempt(clientIP);

    // Devolver éxito
    return res.status(201).json({
      success: true,
      bookingId: bookingId,
      bookingReference: generateBookingReference(),
      status: CONSTANTS.STATUS.BOOKING_PENDING,
      message: "Reserva creada exitosamente. Por favor tome nota de su código de referencia.",
    });
  } catch (error) {
    if (error.message === "CAPACITY_EXCEEDED") {
      return res.status(422).send({
        error: {
          code: "CAPACITY_EXCEEDED",
          message: "Capacidad excedida para esta fecha",
          details: "Not enough capacity available for the requested number of participants",
        },
      });
    }

    console.error("Error al crear la reserva:", error);
    return res.status(500).send({
      error: {
        code: "INTERNAL_ERROR",
        message: "Error interno al procesar la reserva",
        details: error.message,
      },
    });
  }
};

/**
 * Obtiene la lista de todas las reservas con capacidades de filtrado
 * @param {functions.https.Request} req - La solicitud HTTP.
 * @param {functions.Response} res - La respuesta HTTP.
 * @return {Promise<void>} - La respuesta con la lista de reservas filtradas.
 */
const adminGetBookings = async (req, res) => {
  // Verificamos que sea una solicitud GET
  if (req.method !== "GET") {
    return res.status(405).send("Method Not Allowed");
  }

  // Verificamos la autenticación de administrador
  if (!isAdminRequest(req)) {
    return res.status(401).send("Unauthorized: Invalid admin secret key");
  }

  try {
    // Extraemos los parámetros de consulta para filtrado y paginación
    const {
      status,
      tourId,
      startDateFrom,
      startDateTo,
      customerName,
      limit: limitParam,
      offset: offsetParam,
    } = req.query;

    // Inicializamos la consulta base
    let bookingsQuery = db.collection(CONSTANTS.COLLECTIONS.BOOKINGS);

    // Aplicamos los filtros según los parámetros recibidos
    if (status) {
      // Asumimos que status es un solo valor; en el futuro podría extenderse para múltiples valores
      bookingsQuery = bookingsQuery.where("status", "==", status);
    }

    if (tourId) {
      bookingsQuery = bookingsQuery.where("tourId", "==", tourId);
    }

    // Filtrar por rango de fechas (asumiendo bookingDate en la reserva)
    if (startDateFrom) {
      const from = new Date(startDateFrom);
      if (!isNaN(from.getTime())) {
        bookingsQuery = bookingsQuery.where("bookingDate", ">=", admin.firestore.Timestamp.fromDate(from));
      }
    }

    if (startDateTo) {
      // Ajustamos para que cubra toda la fecha final (hasta el final del día)
      const to = new Date(startDateTo);
      to.setDate(to.getDate() + 1); // Agregamos un día
      if (!isNaN(to.getTime())) {
        bookingsQuery = bookingsQuery.where("bookingDate", "<", admin.firestore.Timestamp.fromDate(to));
      }
    }

    // Filtrar por nombre de cliente (búsqueda exacta por ahora,
    // las búsquedas de texto completo requieren índices especiales en Firestore)
    if (customerName) {
      // Para búsquedas parciales, necesitaríamos índices de texto o almacenar
      // variantes del nombre, por ahora usamos coincidencia exacta
      bookingsQuery = bookingsQuery.where("customer.fullName", "==", customerName);
    }

    // Aplicar paginación si se proporciona
    let limit = 50; // Límite por defecto
    if (limitParam && !isNaN(parseInt(limitParam))) {
      limit = parseInt(limitParam);
      // Establecer un límite máximo para prevenir consultas muy pesadas
      limit = Math.min(limit, 200);
    }

    bookingsQuery = bookingsQuery.limit(limit);

    // Aplicar offset si se proporciona (usando startAfter)
    if (offsetParam && !isNaN(parseInt(offsetParam)) && parseInt(offsetParam) > 0) {
      const offset = parseInt(offsetParam);
      // Para usar startAfter, necesitamos el documento en la posición offset-1
      const offsetQuery = bookingsQuery.limit(offset);
      const offsetSnapshot = await offsetQuery.get();

      if (!offsetSnapshot.empty && offsetSnapshot.docs.length === offset) {
        const lastDoc = offsetSnapshot.docs[offset - 1];
        bookingsQuery = bookingsQuery.startAfter(lastDoc);
      }
    }

    // Ejecutamos la consulta
    const snapshot = await bookingsQuery.get();

    if (snapshot.empty) {
      // No hay reservas que coincidan con los filtros
      return res.status(200).json({
        bookings: [],
        count: 0,
        pagination: {
          limit: limit,
          offset: offsetParam ? parseInt(offsetParam) : 0,
          hasMore: false,
        },
      });
    }

    // Mapeamos los documentos de Firestore a un array de objetos JSON
    const bookings = snapshot.docs.map((doc) => ({
      bookingId: doc.id,
      ...doc.data(),
    }));

    // Determinamos si hay más resultados para paginación
    let hasMore = false;
    if (bookings.length === limit) {
      // Verificamos si hay un documento adicional para indicar si hay más resultados
      const nextQuery = bookingsQuery.limit(1);
      const nextSnapshot = await nextQuery.get();
      hasMore = !nextSnapshot.empty;
    }

    // Devolvemos la lista de reservas con información de paginación
    return res.status(200).json({
      bookings: bookings,
      count: bookings.length,
      pagination: {
        limit: limit,
        offset: offsetParam ? parseInt(offsetParam) : 0,
        hasMore: hasMore,
      },
    });
  } catch (error) {
    console.error("Error al obtener la lista de reservas:", error);
    return res.status(500).send({
      message: "Internal Server Error",
      details: error.message,
    });
  }
};

/**
 * Actualiza el estado de una reserva existente
 * @param {functions.https.Request} req - La solicitud HTTP.
 * @param {functions.Response} res - La respuesta HTTP.
 * @return {Promise<void>} - La respuesta de actualización del estado de la reserva.
 */
// eslint-disable-next-line no-unused-vars
const adminUpdateBookingStatus = async (req, res) => {
  // Verificamos que sea una solicitud PUT
  if (req.method !== "PUT") {
    return res.status(405).send("Method Not Allowed");
  }

  // Verificamos la autenticación de administrador
  if (!isAdminRequest(req)) {
    return res.status(401).send("Unauthorized: Invalid admin secret key");
  }

  try {
    // Extraer el bookingId de la URL
    const pathParts = req.path.split("/");
    let bookingId = null;
    for (let i = pathParts.length - 1; i >= 0; i--) {
      if (pathParts[i] && pathParts[i].trim() !== "" && pathParts[i] !== "status") {
        bookingId = pathParts[i];
        break;
      }
    }

    if (!bookingId) {
      return res.status(400).send({
        error: {
          code: "INVALID_DATA",
          message: "El bookingId es obligatorio en la URL",
          details: "bookingId is required in the URL path",
        },
      });
    }

    // Obtener el nuevo estado del cuerpo de la solicitud
    const {status: newStatus, reason} = req.body; // reason is optional for additional context

    if (!newStatus) {
      return res.status(400).send({
        error: {
          code: "INVALID_DATA",
          message: "El nuevo estado (status) es obligatorio",
          details: "New status is required in the request body",
        },
      });
    }

    // Validar que el nuevo estado sea uno de los permitidos
    const validStatuses = [
      CONSTANTS.STATUS.BOOKING_PENDING,
      CONSTANTS.STATUS.BOOKING_CONFIRMED,
      CONSTANTS.STATUS.BOOKING_PAID,
      CONSTANTS.STATUS.BOOKING_CANCELLED,
      CONSTANTS.STATUS.BOOKING_CANCELLED_BY_ADMIN,
    ];

    if (!validStatuses.includes(newStatus)) {
      return res.status(400).send({
        error: {
          code: "INVALID_DATA",
          message: `Estado no válido. Los estados válidos son: ${validStatuses.join(", ")}`,
          details: `Valid statuses are: ${validStatuses.join(", ")}`,
        },
      });
    }

    // Verificar que la reserva exista
    const bookingRef = db.collection(CONSTANTS.COLLECTIONS.BOOKINGS).doc(bookingId);
    const bookingDoc = await bookingRef.get();

    if (!bookingDoc.exists) {
      return res.status(404).send({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Reserva no encontrada",
          details: "The specified booking does not exist",
        },
      });
    }

    const bookingData = bookingDoc.data();
    const currentStatus = bookingData.status;

    // No permitimos ciertos cambios de estado, por ejemplo, de cancelled a paid
    // Permitiremos solo transiciones lógicas de estado
    // De cancelled no se debería de poder cambiar a otro estado normalmente
    if (currentStatus === CONSTANTS.STATUS.BOOKING_CANCELLED &&
        ![CONSTANTS.STATUS.BOOKING_CANCELLED].includes(newStatus)) {
      // Si la reserva ya está cancelada, solo se puede dejarla cancelada o marcar como cancelada por admin
      if (newStatus !== CONSTANTS.STATUS.BOOKING_CANCELLED_BY_ADMIN) {
        return res.status(400).send({
          error: {
            code: "INVALID_DATA",
            message: "No se puede cambiar el estado de una reserva cancelada a otro estado diferente",
            details: "Cannot change status of a cancelled booking",
          },
        });
      }
    }

    // Crear nuevo historial de estado con la actualización
    const newStatusHistoryEntry = {
      timestamp: new Date().toISOString(),
      status: newStatus,
      note: reason || `Status updated by admin`,
      adminUser: "system", // En una implementación más completa, aquí iría el ID del admin real
    };

    // Actualizar la reserva: estado y agregar al historial
    const updatedStatusHistory = [...(bookingData.statusHistory || []), newStatusHistoryEntry];

    // Si el estado cambia a "cancelled_by_admin" o "cancelled", podría requerir actualizaciones de capacidad
    let capacityUpdate = {};
    if (newStatus === CONSTANTS.STATUS.BOOKING_CANCELLED ||
        newStatus === CONSTANTS.STATUS.BOOKING_CANCELLED_BY_ADMIN) {
      // Si la reserva se cancela, incrementamos la capacidad disponible en el evento
      // Primero obtenemos el evento para actualizar la capacidad
      const eventRef = db.collection(CONSTANTS.COLLECTIONS.TOUR_EVENTS).doc(bookingData.eventId);
      const eventDoc = await eventRef.get();

      if (eventDoc.exists) {
        const eventData = eventDoc.data();
        const newBookedSlots = Math.max(0, (eventData.bookedSlots || 0) - bookingData.pax);
        capacityUpdate = {bookedSlots: newBookedSlots};
      }
    }

    // Actualizar la reserva en Firestore
    await bookingRef.update({
      status: newStatus,
      statusHistory: updatedStatusHistory,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      ...capacityUpdate,
    });

    // Si se requirió actualización de capacidad, también la aplicamos al evento
    if (Object.keys(capacityUpdate).length > 0) {
      const eventRef = db.collection(CONSTANTS.COLLECTIONS.TOUR_EVENTS).doc(bookingData.eventId);
      await eventRef.update({
        ...capacityUpdate,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // Devolver confirmación de actualización exitosa
    return res.status(200).json({
      success: true,
      bookingId: bookingId,
      message: "Estado de la reserva actualizado exitosamente",
      previousStatus: currentStatus,
      newStatus: newStatus,
    });
  } catch (error) {
    console.error("Error al actualizar el estado de la reserva:", error);
    return res.status(500).send({
      error: {
        code: "INTERNAL_ERROR",
        message: "Error interno al procesar la actualización de estado",
        details: error.message,
      },
    });
  }
};

/**
 * Obtiene la lista de eventos con capacidades de filtrado para vista de calendario
 * @param {functions.https.Request} req - La solicitud HTTP.
 * @param {functions.Response} res - La respuesta HTTP.
 * @return {Promise<void>} - La respuesta con la lista de eventos filtrados.
 */
const adminGetEventsCalendar = async (req, res) => {
  // Verificamos que sea una solicitud GET
  if (req.method !== "GET") {
    return res.status(405).send("Method Not Allowed");
  }

  // Verificamos la autenticación de administrador
  if (!isAdminRequest(req)) {
    return res.status(401).send("Unauthorized: Invalid admin secret key");
  }

  try {
    // Extraemos los parámetros de consulta para filtrado y paginación
    const {
      tourId,
      startDateFrom,
      startDateTo,
      type, // 'private' or 'public'
      status, // 'active', 'full', 'completed', 'cancelled'
      limit: limitParam,
      offset: offsetParam,
    } = req.query;

    // Inicializamos la consulta base
    let eventsQuery = db.collection(CONSTANTS.COLLECTIONS.TOUR_EVENTS);

    // Aplicamos los filtros según los parámetros recibidos
    if (tourId) {
      eventsQuery = eventsQuery.where("tourId", "==", tourId);
    }

    if (type) {
      // Validar que el tipo sea válido
      if ([STATUS.EVENT_TYPE_PRIVATE, STATUS.EVENT_TYPE_PUBLIC].includes(type)) {
        eventsQuery = eventsQuery.where("type", "==", type);
      }
    }

    if (status) {
      eventsQuery = eventsQuery.where("status", "==", status);
    }

    // Filtrar por rango de fechas
    if (startDateFrom) {
      const from = new Date(startDateFrom);
      if (!isNaN(from.getTime())) {
        eventsQuery = eventsQuery.where("startDate", ">=", admin.firestore.Timestamp.fromDate(from));
      }
    }

    if (startDateTo) {
      // Ajustamos para que cubra toda la fecha final (hasta el final del día)
      const to = new Date(startDateTo);
      to.setDate(to.getDate() + 1); // Agregamos un día
      if (!isNaN(to.getTime())) {
        eventsQuery = eventsQuery.where("startDate", "<", admin.firestore.Timestamp.fromDate(to));
      }
    }

    // Aplicar paginación si se proporciona
    let limit = 50; // Límite por defecto
    if (limitParam && !isNaN(parseInt(limitParam))) {
      limit = parseInt(limitParam);
      // Establecer un límite máximo para prevenir consultas muy pesadas
      limit = Math.min(limit, 200);
    }

    eventsQuery = eventsQuery.limit(limit);

    // Aplicar offset si se proporciona (usando startAfter)
    if (offsetParam && !isNaN(parseInt(offsetParam)) && parseInt(offsetParam) > 0) {
      const offset = parseInt(offsetParam);
      // Para usar startAfter, necesitamos el documento en la posición offset-1
      const offsetQuery = eventsQuery.limit(offset);
      const offsetSnapshot = await offsetQuery.get();

      if (!offsetSnapshot.empty && offsetSnapshot.docs.length === offset) {
        const lastDoc = offsetSnapshot.docs[offset - 1];
        eventsQuery = eventsQuery.startAfter(lastDoc);
      }
    }

    // Ejecutamos la consulta
    const snapshot = await eventsQuery.get();

    if (snapshot.empty) {
      // No hay eventos que coincidan con los filtros
      return res.status(200).json({
        events: [],
        count: 0,
        pagination: {
          limit: limit,
          offset: offsetParam ? parseInt(offsetParam) : 0,
          hasMore: false,
        },
      });
    }

    // Mapeamos los documentos de Firestore a un array de objetos JSON
    const events = snapshot.docs.map((doc) => {
      const eventData = doc.data();
      return {
        eventId: doc.id,
        ...eventData,
        // Convertir timestamps a strings para mejor manejo en el frontend
        startDate: eventData.startDate ? eventData.startDate.toDate().toISOString() : null,
        endDate: eventData.endDate ? eventData.endDate.toDate().toISOString() : null,
        createdAt: eventData.createdAt ? eventData.createdAt.toDate().toISOString() : null,
        updatedAt: eventData.updatedAt ? eventData.updatedAt.toDate().toISOString() : null,
      };
    });

    // Determinamos si hay más resultados para paginación
    let hasMore = false;
    if (events.length === limit) {
      // Verificamos si hay un documento adicional para indicar si hay más resultados
      const nextQuery = eventsQuery.limit(1);
      const nextSnapshot = await nextQuery.get();
      hasMore = !nextSnapshot.empty;
    }

    // Devolvemos la lista de eventos con información de paginación
    return res.status(200).json({
      events: events,
      count: events.length,
      pagination: {
        limit: limit,
        offset: offsetParam ? parseInt(offsetParam) : 0,
        hasMore: hasMore,
      },
    });
  } catch (error) {
    console.error("Error al obtener la lista de eventos:", error);
    return res.status(500).send({
      message: "Internal Server Error",
      details: error.message,
    });
  }
};

/**
 * Publica o despublica un evento (cambia entre privado y público)
 * @param {functions.https.Request} req - La solicitud HTTP.
 * @param {functions.Response} res - La respuesta HTTP.
 * @return {Promise<void>} - La respuesta con el resultado de la operación.
 */
const adminPublishEvent = async (req, res) => {
  // Verificamos que sea una solicitud POST
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  // Verificamos la autenticación de administrador
  if (!isAdminRequest(req)) {
    return res.status(401).send("Unauthorized: Invalid admin secret key");
  }

  try {
    // Extraer el eventId de la URL
    const pathParts = req.path.split("/");
    let eventId = null;
    for (let i = pathParts.length - 1; i >= 0; i--) {
      if (pathParts[i] && pathParts[i].trim() !== "") {
        // Verificar si este segmento es parte del endpoint publish
        if (pathParts[i] !== "publish" && pathParts[i] !== "unpublish") {
          eventId = pathParts[i];
          break;
        }
      }
    }

    if (!eventId) {
      return res.status(400).send({
        error: {
          code: "INVALID_DATA",
          message: "El eventId es obligatorio en la URL",
          details: "eventId is required in the URL path",
        },
      });
    }

    // Obtener la acción del cuerpo de la solicitud o usar publish por defecto
    const {action} = req.body; // action can be 'publish' or 'unpublish'
    let newType;

    if (action === "unpublish" || action === "private") {
      newType = STATUS.EVENT_TYPE_PRIVATE;
    } else {
      // Default to publish/public if action is 'publish', 'public', or not specified
      newType = CONSTANTS.STATUS.EVENT_TYPE_PUBLIC;
    }

    // Verificar que el evento exista
    const eventRef = db.collection(CONSTANTS.COLLECTIONS.TOUR_EVENTS).doc(eventId);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      return res.status(404).send({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Evento no encontrado",
          details: "The specified event does not exist",
        },
      });
    }

    const eventData = eventDoc.data();
    const currentType = eventData.type;

    // No permitir ciertas transiciones que no tienen sentido
    if (currentType === newType) {
      return res.status(400).send({
        error: {
          code: "INVALID_DATA",
          message: `El evento ya está en el estado deseado (${newType})`,
          details: `Event is already ${newType}`,
        },
      });
    }

    // Actualizar el evento tipo
    await eventRef.update({
      type: newType,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Devolver confirmación de actualización exitosa
    return res.status(200).json({
      success: true,
      eventId: eventId,
      message: `Evento actualizado exitosamente a ${newType}`,
      previousType: currentType,
      newType: newType,
    });
  } catch (error) {
    console.error("Error al publicar/despublicar el evento:", error);
    return res.status(500).send({
      error: {
        code: "INTERNAL_ERROR",
        message: "Error interno al procesar la solicitud de publicación",
        details: error.message,
      },
    });
  }
};

/**
 * Transfiere una reserva de un evento a otro
 * @param {functions.https.Request} req - La solicitud HTTP.
 * @param {functions.Response} res - La respuesta HTTP.
 * @return {Promise<void>} - La respuesta con el resultado de la transferencia.
 */
const adminTransferBooking = async (req, res) => {
  // Verificamos que sea una solicitud POST
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  // Verificamos la autenticación de administrador
  if (!isAdminRequest(req)) {
    return res.status(401).send("Unauthorized: Invalid admin secret key");
  }

  try {
    // Extraer el bookingId de la URL
    const pathParts = req.path.split("/");
    let bookingId = null;
    for (let i = pathParts.length - 1; i >= 0; i--) {
      if (pathParts[i] && pathParts[i].trim() !== "" && pathParts[i] !== "transfer") {
        bookingId = pathParts[i];
        break;
      }
    }

    if (!bookingId) {
      return res.status(400).send({
        error: {
          code: "INVALID_DATA",
          message: "El bookingId es obligatorio en la URL",
          details: "bookingId is required in the URL path",
        },
      });
    }

    // Obtener los datos de transferencia del cuerpo de la solicitud
    const {destinationEventId, reason, createNewEvent, newStartDate, newMaxCapacity, newEventType} = req.body;

    // If createNewEvent is true, we'll create a new event instead of using destinationEventId
    if (!createNewEvent && !destinationEventId) {
      return res.status(400).send({
        error: {
          code: "INVALID_DATA",
          message: "El destino (destinationEventId) es obligatorio o se debe especificar createNewEvent=true",
          details: "destinationEventId is required in the request body or createNewEvent must be true",
        },
      });
    }

    // If createNewEvent is true, we'll create a new event for the same tour as the booking
    let destinationEventIdForTransfer = destinationEventId;
    if (createNewEvent) {
      // We need to create a new event, so we'll use the booking's tourId and the newStartDate
      const bookingRef = db.collection(CONSTANTS.COLLECTIONS.BOOKINGS).doc(bookingId);
      const bookingDoc = await bookingRef.get();
      const bookingData = bookingDoc.data();

      if (!bookingData) {
        return res.status(404).send({
          error: {
            code: "RESOURCE_NOT_FOUND",
            message: "Reserva no encontrada",
            details: "The specified booking does not exist",
          },
        });
      }

      // Use newStartDate if provided, otherwise use the original booking date
      let newEventDate = bookingData.startDate;
      if (newStartDate) {
        newEventDate = new Date(newStartDate);
        if (isNaN(newEventDate.getTime())) {
          return res.status(400).send({
            error: {
              code: "INVALID_DATA",
              message: "La nueva fecha no es válida",
              details: "New start date is not valid",
            },
          });
        }
      } else {
        // Get the original event date to use as default
        const originalEventRef = db.collection(CONSTANTS.COLLECTIONS.TOUR_EVENTS).doc(bookingData.eventId);
        const originalEventDoc = await originalEventRef.get();
        if (originalEventDoc.exists) {
          const originalEvent = originalEventDoc.data();
          newEventDate = originalEvent.startDate.toDate ? originalEvent.startDate.toDate() : originalEvent.startDate;
        }
      }

      // Get tour info for the new event
      const tourRef = db.collection(CONSTANTS.COLLECTIONS.TOURS).doc(bookingData.tourId);
      const tourDoc = await tourRef.get();

      if (!tourDoc.exists) {
        return res.status(404).send({
          error: {
            code: "RESOURCE_NOT_FOUND",
            message: "Tour no encontrado",
            details: "The tour for the booking does not exist",
          },
        });
      }

      const tour = tourDoc.data();

      // Create the new event
      const newEvent = {
        tourId: bookingData.tourId,
        tourName: tour.name && tour.name.es ? tour.name.es :
                  (tour.name || `Tour ${bookingData.tourId}`), // Denormalized for optimization
        startDate: newEventDate,
        endDate: new Date(newEventDate.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days after as default
        maxCapacity: newMaxCapacity || tour.maxParticipants || 8, // Use provided capacity,
        // tour's capacity, or default to 8
        bookedSlots: 0, // Will be updated in transaction
        type: newEventType ||
             CONSTANTS.STATUS.EVENT_TYPE_PRIVATE, // Default to private if not specified
        status: "active",
        totalBookings: 0, // Will be updated in transaction
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const createdEvent = await db.collection(CONSTANTS.COLLECTIONS.TOUR_EVENTS).add(newEvent);
      destinationEventIdForTransfer = createdEvent.id;
    }

    // Verificar que la reserva exista
    const bookingRef = db.collection(CONSTANTS.COLLECTIONS.BOOKINGS).doc(bookingId);
    const bookingDoc = await bookingRef.get();

    if (!bookingDoc.exists) {
      return res.status(404).send({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Reserva no encontrada",
          details: "The specified booking does not exist",
        },
      });
    }

    const bookingData = bookingDoc.data();

    // No permitir transferir reservas canceladas
    if (bookingData.status === CONSTANTS.STATUS.BOOKING_CANCELLED ||
        bookingData.status === CONSTANTS.STATUS.BOOKING_CANCELLED_BY_ADMIN) {
      return res.status(400).send({
        error: {
          code: "INVALID_DATA",
          message: "No se puede transferir una reserva cancelada",
          details: "Cannot transfer a cancelled booking",
        },
      });
    }

    // Verificar que el evento destino exista
    const destinationEventRef = db.collection(CONSTANTS.COLLECTIONS.TOUR_EVENTS).doc(destinationEventIdForTransfer);
    const destinationEventDoc = await destinationEventRef.get();

    if (!destinationEventDoc.exists) {
      return res.status(404).send({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Evento destino no encontrado",
          details: "The destination event does not exist",
        },
      });
    }

    const destinationEventData = destinationEventDoc.data();

    // Verificar que el evento destino tenga capacidad disponible
    const newBookedSlots = destinationEventData.bookedSlots + bookingData.pax;
    if (newBookedSlots > destinationEventData.maxCapacity) {
      return res.status(422).send({
        error: {
          code: "CAPACITY_EXCEEDED",
          message: "Capacidad excedida en el evento destino",
          details: "Not enough capacity available in the destination event",
        },
      });
    }

    // Verificar que el tour del evento destino sea compatible con el tour de la reserva
    if (destinationEventData.tourId !== bookingData.tourId) {
      return res.status(400).send({
        error: {
          code: "INVALID_DATA",
          message: "El tour del evento destino no coincide con el tour de la reserva",
          details: "Destination event tour does not match booking tour",
        },
      });
    }

    // Obtener el evento origen para actualizar su capacidad después
    const sourceEventRef = db.collection(CONSTANTS.COLLECTIONS.TOUR_EVENTS).doc(bookingData.eventId);

    // Realizar la transferencia en una transacción para garantizar consistencia
    await db.runTransaction(async (transaction) => {
      // Obtener los datos actuales del evento origen
      const sourceEventSnapshot = await transaction.get(sourceEventRef);
      if (!sourceEventSnapshot.exists) {
        throw new Error("SOURCE_EVENT_NOT_FOUND");
      }

      const sourceEventData = sourceEventSnapshot.data();

      // Actualizar la reserva para apuntar al nuevo evento
      const newStatusHistoryEntry = {
        timestamp: new Date().toISOString(),
        status: bookingData.status, // Keep the same status, just changing event
        note: `Transferido al evento ${destinationEventId}` + (reason ? ` - Razón: ${reason}` : ""),
        adminUser: "system",
      };

      const updatedStatusHistory = [...(bookingData.statusHistory || []), newStatusHistoryEntry];

      transaction.update(bookingRef, {
        eventId: destinationEventId,
        statusHistory: updatedStatusHistory,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Actualizar la capacidad: decrementar en el evento origen, incrementar en el destino
      transaction.update(sourceEventRef, {
        bookedSlots: Math.max(0, (sourceEventData.bookedSlots || 0) - bookingData.pax),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      transaction.update(destinationEventRef, {
        bookedSlots: newBookedSlots,
        totalBookings: (destinationEventData.totalBookings || 0) + 1,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    // Devolver confirmación de transferencia exitosa
    return res.status(200).json({
      success: true,
      bookingId: bookingId,
      message: "Reserva transferida exitosamente",
      previousEventId: bookingData.eventId,
      newEventId: destinationEventIdForTransfer,
      pax: bookingData.pax,
      reason: reason || null,
    });
  } catch (error) {
    if (error.message === "SOURCE_EVENT_NOT_FOUND") {
      return res.status(404).send({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Evento origen no encontrado",
          details: "The source event does not exist",
        },
      });
    }

    console.error("Error al transferir la reserva:", error);
    return res.status(500).send({
      error: {
        code: "INTERNAL_ERROR",
        message: "Error interno al procesar la transferencia de reserva",
        details: error.message,
      },
    });
  }
};

/**
 * Updates core booking information while maintaining audit trail
 * @param {functions.https.Request} req - The HTTP request.
 * @param {functions.Response} res - The HTTP response.
 * @return {Promise<void>} - The response with updated booking information.
 */
const adminUpdateBookingDetails = async (req, res) => {
  // Verify this is a PUT request
  if (req.method !== "PUT") {
    return res.status(405).send("Method Not Allowed");
  }

  // Verify admin authentication
  if (!isAdminRequest(req)) {
    return res.status(401).send("Unauthorized: Invalid admin secret key");
  }

  try {
    // Extract bookingId from URL
    const pathParts = req.path.split("/");
    let bookingId = null;
    for (let i = pathParts.length - 1; i >= 0; i--) {
      if (pathParts[i] && pathParts[i].trim() !== "") {
        bookingId = pathParts[i];
        break;
      }
    }

    if (!bookingId) {
      return res.status(400).send({
        error: {
          code: "INVALID_DATA",
          message: "El bookingId es obligatorio en la URL",
          details: "bookingId is required in the URL path",
        },
      });
    }

    // Get update data from request body
    const updates = req.body;

    // Get admin user from headers or default to system
    const adminUser = "system"; // In a more complete implementation, extract admin ID from auth

    // Call the modularized update function
    const updatedBooking = await updateBookingDetails(bookingId, updates, adminUser, db);

    // Return success response
    return res.status(200).json({
      success: true,
      bookingId: bookingId,
      message: "Detalles de la reserva actualizados exitosamente",
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Error al actualizar los detalles de la reserva:", error);

    // Handle specific error types
    if (error.message === "BOOKING_NOT_FOUND") {
      return res.status(404).send({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Reserva no encontrada",
          details: "The specified booking does not exist",
        },
      });
    } else if (error.message === "BOOKING_CANNOT_BE_MODIFIED") {
      return res.status(400).send({
        error: {
          code: "INVALID_DATA",
          message: "La reserva no puede ser modificada",
          details: "Cannot modify a cancelled booking",
        },
      });
    } else if (error.message.startsWith("INVALID_CUSTOMER_DATA")) {
      return res.status(400).send({
        error: {
          code: "INVALID_DATA",
          message: "Datos de cliente inválidos",
          details: error.message.replace("INVALID_CUSTOMER_DATA: ", ""),
        },
      });
    } else if (error.message === "INVALID_TOUR_ID") {
      return res.status(400).send({
        error: {
          code: "INVALID_DATA",
          message: "Tour ID inválido o no activo",
          details: "The tour ID does not exist or is not active",
        },
      });
    } else if (error.message === "INVALID_DATE_FORMAT") {
      return res.status(400).send({
        error: {
          code: "INVALID_DATA",
          message: "Formato de fecha inválido",
          details: "Date format is invalid",
        },
      });
    } else if (error.message === "INVALID_PAX_COUNT") {
      return res.status(400).send({
        error: {
          code: "INVALID_DATA",
          message: "Cantidad de participantes inválida",
          details: "Pax count must be a positive integer not exceeding 100",
        },
      });
    } else if (error.message === "INVALID_PRICE") {
      return res.status(400).send({
        error: {
          code: "INVALID_DATA",
          message: "Precio inválido",
          details: "Price must be a non-negative number",
        },
      });
    } else {
      return res.status(500).send({
        error: {
          code: "INTERNAL_ERROR",
          message: "Error interno al procesar la actualización de detalles",
          details: error.message,
        },
      });
    }
  }
};

// Enhanced adminUpdateBookingStatus to support additional updates
const adminUpdateBookingStatusExtended = async (req, res) => {
  // Verify this is a PUT request
  if (req.method !== "PUT") {
    return res.status(405).send("Method Not Allowed");
  }

  // Verify admin authentication
  if (!isAdminRequest(req)) {
    return res.status(401).send("Unauthorized: Invalid admin secret key");
  }

  try {
    // Extract bookingId from URL
    const pathParts = req.path.split("/");
    let bookingId = null;
    for (let i = pathParts.length - 1; i >= 0; i--) {
      if (pathParts[i] && pathParts[i].trim() !== "" && pathParts[i] !== "status") {
        bookingId = pathParts[i];
        break;
      }
    }

    if (!bookingId) {
      return res.status(400).send({
        error: {
          code: "INVALID_DATA",
          message: "El bookingId es obligatorio en la URL",
          details: "bookingId is required in the URL path",
        },
      });
    }

    // Get request body
    const {status: newStatus, reason, additionalUpdates} = req.body;

    if (!newStatus) {
      return res.status(400).send({
        error: {
          code: "INVALID_DATA",
          message: "El nuevo estado (status) es obligatorio",
          details: "New status is required in the request body",
        },
      });
    }

    // First update the status using existing logic
    const bookingRef = db.collection(COLLECTIONS.BOOKINGS).doc(bookingId);
    const bookingDoc = await bookingRef.get();

    if (!bookingDoc.exists) {
      return res.status(404).send({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Reserva no encontrada",
          details: "The specified booking does not exist",
        },
      });
    }

    const bookingData = bookingDoc.data();
    const currentStatus = bookingData.status;

    // Validate new status
    const validStatuses = [
      STATUS.BOOKING_PENDING,
      STATUS.BOOKING_CONFIRMED,
      STATUS.BOOKING_PAID,
      STATUS.BOOKING_CANCELLED,
      STATUS.BOOKING_CANCELLED_BY_ADMIN,
    ];

    if (!validStatuses.includes(newStatus)) {
      return res.status(400).send({
        error: {
          code: "INVALID_DATA",
          message: `Estado no válido. Los estados válidos son: ${validStatuses.join(", ")}`,
          details: `Valid statuses are: ${validStatuses.join(", ")}`,
        },
      });
    }

    // Check if status change is allowed
    if (currentStatus === STATUS.BOOKING_CANCELLED &&
        ![STATUS.BOOKING_CANCELLED].includes(newStatus)) {
      if (newStatus !== STATUS.BOOKING_CANCELLED_BY_ADMIN) {
        return res.status(400).send({
          error: {
            code: "INVALID_DATA",
            message: "No se puede cambiar el estado de una reserva cancelada a otro estado diferente",
            details: "Cannot change status of a cancelled booking",
          },
        });
      }
    }

    // Create status history entry
    const newStatusHistoryEntry = {
      timestamp: new Date().toISOString(),
      status: newStatus,
      note: reason || `Status updated by admin`,
      adminUser: "system",
    };

    // Update booking status
    const updatedStatusHistory = [...(bookingData.statusHistory || []), newStatusHistoryEntry];
    let capacityUpdate = {};

    if (newStatus === STATUS.BOOKING_CANCELLED ||
        newStatus === STATUS.BOOKING_CANCELLED_BY_ADMIN) {
      const eventRef = db.collection(COLLECTIONS.TOUR_EVENTS).doc(bookingData.eventId);
      const eventDoc = await eventRef.get();

      if (eventDoc.exists) {
        const eventData = eventDoc.data();
        const newBookedSlots = Math.max(0, (eventData.bookedSlots || 0) - bookingData.pax);
        capacityUpdate = {bookedSlots: newBookedSlots};
      }
    }

    // Prepare update object
    const updateObj = {
      status: newStatus,
      statusHistory: updatedStatusHistory,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      ...capacityUpdate,
    };

    // If additional updates are provided, merge them
    if (additionalUpdates) {
      // Use the updateBookingDetails function for additional updates
      await updateBookingDetails(bookingId, additionalUpdates, "system", db);
    } else {
      // Only update status and related fields
      await bookingRef.update(updateObj);

      // Update capacity if needed
      if (Object.keys(capacityUpdate).length > 0) {
        const eventRef = db.collection(COLLECTIONS.TOUR_EVENTS).doc(bookingData.eventId);
        await eventRef.update({
          ...capacityUpdate,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }

    return res.status(200).json({
      success: true,
      bookingId: bookingId,
      message: "Estado de la reserva actualizado exitosamente",
      previousStatus: currentStatus,
      newStatus: newStatus,
    });
  } catch (error) {
    console.error("Error al actualizar el estado de la reserva:", error);
    return res.status(500).send({
      error: {
        code: "INTERNAL_ERROR",
        message: "Error interno al procesar la actualización de estado",
        details: error.message,
      },
    });
  }
};

/**
 * Creates a new booking as an admin (without rate limiting)
 * @param {functions.https.Request} req - The HTTP request.
 * @param {functions.Response} res - The HTTP response.
 * @return {Promise<void>} - The response with the new booking information.
 */
const adminCreateBooking = async (req, res) => {
  // Verify this is a POST request
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  // Verify admin authentication
  if (!isAdminRequest(req)) {
    return res.status(401).send("Unauthorized: Invalid admin secret key");
  }

  try {
    // Validate input data (same as createBooking but without rate limiting)
    const bookingData = req.body;

    // Validate required fields
    if (!bookingData.tourId) {
      return res.status(400).send({
        error: {
          code: "INVALID_DATA",
          message: "El tourId es obligatorio",
          details: "tourId is required",
        },
      });
    }

    if (!bookingData.startDate) {
      return res.status(400).send({
        error: {
          code: "INVALID_DATA",
          message: "La fecha de inicio es obligatoria",
          details: "startDate is required",
        },
      });
    }

    if (!bookingData.customer || !bookingData.customer.fullName ||
        !bookingData.customer.documentId || !bookingData.customer.phone ||
        !bookingData.customer.email) {
      return res.status(400).send({
        error: {
          code: "INVALID_DATA",
          message: "La información del cliente es incompleta",
          details: "fullName, documentId, phone, and email are required in customer object",
        },
      });
    }

    if (!bookingData.pax || bookingData.pax <= 0) {
      return res.status(400).send({
        error: {
          code: "INVALID_DATA",
          message: "El número de participantes debe ser un número positivo",
          details: "pax must be a positive number",
        },
      });
    }

    // Validate date format
    const startDate = new Date(bookingData.startDate);
    if (isNaN(startDate.getTime())) {
      return res.status(400).send({
        error: {
          code: "INVALID_DATA",
          message: "La fecha proporcionada no es válida",
          details: "startDate is not a valid date",
        },
      });
    }

    // Verify tour exists and is active
    const tourRef = db.collection(CONSTANTS.COLLECTIONS.TOURS).doc(bookingData.tourId);
    const tourDoc = await tourRef.get();

    if (!tourDoc.exists) {
      return res.status(404).send({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Tour no encontrado o no disponible",
          details: "The specified tour does not exist or is inactive",
        },
      });
    }

    const tour = tourDoc.data();
    if (!tour.isActive) {
      return res.status(404).send({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Tour no disponible",
          details: "The specified tour is not active",
        },
      });
    }

    // Create or find event for this date
    let eventRef;
    let eventExists = false;

    // Check if an event already exists for this tour and date
    const eventsQuery = await db.collection(CONSTANTS.COLLECTIONS.TOUR_EVENTS)
        .where("tourId", "==", bookingData.tourId)
        .where("startDate", "==", startDate)
        .limit(1)
        .get();

    if (!eventsQuery.empty) {
      // Use existing event
      eventRef = eventsQuery.docs[0].ref;
      eventExists = true;
    } else {
      // Create new event (private by default)
      const newEvent = {
        tourId: bookingData.tourId,
        tourName: tour.name.es, // Denormalized for optimization
        startDate: startDate,
        endDate: new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days after, for example
        maxCapacity: tour.maxParticipants || 8, // Use tour's max capacity or default to 8
        bookedSlots: 0, // Initialized to 0
        type: CONSTANTS.STATUS.EVENT_TYPE_PRIVATE, // Private initially by admin
        status: "active",
        totalBookings: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const createdEvent = await db.collection(CONSTANTS.COLLECTIONS.TOUR_EVENTS).add(newEvent);
      eventRef = createdEvent;
      eventExists = false;
    }

    // Create booking in transaction for data consistency
    const bookingId = await db.runTransaction(async (transaction) => {
      // Get updated event data
      const eventSnapshot = await transaction.get(eventRef);
      const eventData = eventSnapshot.data();

      // Check capacity
      const newBookedSlots = eventData.bookedSlots + bookingData.pax;
      if (newBookedSlots > eventData.maxCapacity) {
        throw new Error("CAPACITY_EXCEEDED");
      }

      // Calculate price based on participants (using tour's pricing if available)
      let pricePerPerson = 1000000; // Default value
      if (tour.pricingTiers && Array.isArray(tour.pricingTiers)) {
        // Find appropriate pricing tier based on number of people
        const pricingTier = tour.pricingTiers.find((tier) =>
          bookingData.pax >= (tier.paxFrom || tier.pax) && bookingData.pax <= (tier.paxTo || tier.pax),
        );
        if (pricingTier) {
          pricePerPerson = (typeof pricingTier.pricePerPerson === "object") ?
            (pricingTier.pricePerPerson.COP || pricingTier.pricePerPerson.USD || 1000000) :
            (pricingTier.pricePerPerson || 1000000);
        }
      }

      // Calculate total
      const totalPrice = pricePerPerson * bookingData.pax;

      // Update event to increase booked slots
      transaction.update(eventRef, {
        bookedSlots: newBookedSlots,
        totalBookings: (eventData.totalBookings || 0) + 1,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Create the booking
      const bookingRef = db.collection(CONSTANTS.COLLECTIONS.BOOKINGS).doc();

      const statusToSet = bookingData.status || CONSTANTS.STATUS.BOOKING_PENDING;

      const bookingDoc = {
        bookingId: bookingRef.id,
        eventId: eventRef.id,
        tourId: bookingData.tourId,
        tourName: tour.name.es, // Denormalized
        customer: bookingData.customer,
        pax: bookingData.pax,
        pricePerPerson: pricePerPerson,
        totalPrice: totalPrice,
        bookingDate: admin.firestore.FieldValue.serverTimestamp(),
        status: statusToSet, // Use provided status or default to pending
        statusHistory: [{
          timestamp: new Date().toISOString(), // Using client timestamp since Firestore timestamps can't be in arrays
          status: statusToSet,
          note: "Booking created by admin",
          adminUser: "system", // In a complete implementation, use actual admin ID
        }],
        isEventOrigin: !eventExists, // Indicates if this booking created the event
        ipAddress: "admin_created", // Mark as admin-created
        bookingReference: generateBookingReference(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      transaction.set(bookingRef, bookingDoc);

      return bookingRef.id;
    });

    // Return success response
    return res.status(201).json({
      success: true,
      bookingId: bookingId,
      bookingReference: generateBookingReference(),
      status: bookingData.status || CONSTANTS.STATUS.BOOKING_PENDING,
      message: "Reserva creada exitosamente por administrador.",
    });
  } catch (error) {
    if (error.message === "CAPACITY_EXCEEDED") {
      return res.status(422).send({
        error: {
          code: "CAPACITY_EXCEEDED",
          message: "Capacidad excedida para esta fecha",
          details: "Not enough capacity available for the requested number of participants",
        },
      });
    }

    console.error("Error al crear la reserva por admin:", error);
    return res.status(500).send({
      error: {
        code: "INTERNAL_ERROR",
        message: "Error interno al procesar la reserva",
        details: error.message,
      },
    });
  }
};

/**
 * Transfers a booking to a different tour (with optional new date)
 * This function handles all operations: cancelling the old booking,
 * creating a new event if needed, and creating a new booking on the new tour
 * @param {functions.https.Request} req - The HTTP request.
 * @param {functions.Response} res - The HTTP response.
 * @return {Promise<void>} - The response with the result of the tour transfer.
 */
const adminTransferToNewTour = async (req, res) => {
  // Verificamos que sea una solicitud POST
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  // Verificamos la autenticación de administrador
  if (!isAdminRequest(req)) {
    return res.status(401).send("Unauthorized: Invalid admin secret key");
  }

  try {
    // Extraer el bookingId de la URL
    const pathParts = req.path.split("/");
    let bookingId = null;
    for (let i = pathParts.length - 1; i >= 0; i--) {
      if (pathParts[i] && pathParts[i].trim() !== "" && pathParts[i] !== "transferToNewTour") {
        bookingId = pathParts[i];
        break;
      }
    }

    if (!bookingId) {
      return res.status(400).send({
        error: {
          code: "INVALID_DATA",
          message: "El bookingId es obligatorio en la URL",
          details: "bookingId is required in the URL path",
        },
      });
    }

    // Obtener los datos de transferencia del cuerpo de la solicitud
    const {newTourId, newStartDate, reason} = req.body;

    if (!newTourId) {
      return res.status(400).send({
        error: {
          code: "INVALID_DATA",
          message: "El nuevo tourId es obligatorio",
          details: "newTourId is required in the request body",
        },
      });
    }

    // Verificar que la reserva exista
    const bookingRef = db.collection(CONSTANTS.COLLECTIONS.BOOKINGS).doc(bookingId);
    const bookingDoc = await bookingRef.get();

    if (!bookingDoc.exists) {
      return res.status(404).send({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Reserva no encontrada",
          details: "The specified booking does not exist",
        },
      });
    }

    const originalBookingData = bookingDoc.data();

    // No permitir transferir reservas ya canceladas
    if (originalBookingData.status === CONSTANTS.STATUS.BOOKING_CANCELLED ||
        originalBookingData.status === CONSTANTS.STATUS.BOOKING_CANCELLED_BY_ADMIN) {
      return res.status(400).send({
        error: {
          code: "INVALID_DATA",
          message: "No se puede transferir una reserva ya cancelada",
          details: "Cannot transfer an already cancelled booking",
        },
      });
    }

    // Verificar que el nuevo tour exista y esté activo
    const newTourRef = db.collection(CONSTANTS.COLLECTIONS.TOURS).doc(newTourId);
    const newTourDoc = await newTourRef.get();

    if (!newTourDoc.exists) {
      return res.status(404).send({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "El tour de destino no existe",
          details: "The destination tour does not exist",
        },
      });
    }

    const newTour = newTourDoc.data();
    if (!newTour.isActive) {
      return res.status(400).send({
        error: {
          code: "INVALID_DATA",
          message: "El tour de destino no está activo",
          details: "The destination tour is not active",
        },
      });
    }

    // Validar fecha si se proporciona
    let targetDate = originalBookingData.startDate;
    if (newStartDate) {
      targetDate = new Date(newStartDate);
      if (isNaN(targetDate.getTime())) {
        return res.status(400).send({
          error: {
            code: "INVALID_DATA",
            message: "La nueva fecha no es válida",
            details: "New start date is not valid",
          },
        });
      }
    } else {
      // If no new date is provided, use the original booking's event date
      const originalEventRef = db.collection(CONSTANTS.COLLECTIONS.TOUR_EVENTS).doc(originalBookingData.eventId);
      const originalEventDoc = await originalEventRef.get();

      if (originalEventDoc.exists) {
        const originalEvent = originalEventDoc.data();
        targetDate = originalEvent.startDate.toDate ? originalEvent.startDate.toDate() : originalEvent.startDate;
      }
    }

    // Buscar o crear un evento para el nuevo tour en la fecha deseada
    let targetEventRef;
    let eventExists = false;

    // Buscar si ya existe un evento para este tour y fecha
    const eventsQuery = await db.collection(CONSTANTS.COLLECTIONS.TOUR_EVENTS)
        .where("tourId", "==", newTourId)
        .where("startDate", "==", targetDate)
        .limit(1)
        .get();

    if (!eventsQuery.empty) {
      // Usar evento existente
      targetEventRef = eventsQuery.docs[0].ref;
      eventExists = true;
    } else {
      // Crear nuevo evento con la misma configuración del tour
      const newEvent = {
        tourId: newTourId,
        tourName: newTour.name.es || `Tour ${newTourId}`, // Denormalizado para optimización
        startDate: targetDate,
        endDate: new Date(targetDate.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 días después, por ejemplo
        maxCapacity: newTour.maxParticipants || 8, // Usar capacidad del tour o 8 por defecto
        bookedSlots: 0, // Inicializado en 0
        type: CONSTANTS.STATUS.EVENT_TYPE_PRIVATE, // Inicialmente privado
        status: "active",
        totalBookings: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const createdEvent = await db.collection(CONSTANTS.COLLECTIONS.TOUR_EVENTS).add(newEvent);
      targetEventRef = createdEvent;
      eventExists = false;
    }

    // Realizar todas las operaciones en una transacción para garantizar consistencia
    const result = await db.runTransaction(async (transaction) => {
      // 1. Realizar TODAS las lecturas primero
      const targetEventSnapshot = await transaction.get(targetEventRef);
      const originalEventSnapshot = await transaction.get(
          db.collection(CONSTANTS.COLLECTIONS.TOUR_EVENTS).doc(originalBookingData.eventId),
      );

      if (!targetEventSnapshot.exists) {
        throw new Error("TARGET_EVENT_NOT_FOUND");
      }

      // 2. Obtener datos de los eventos
      const targetEventData = targetEventSnapshot.data();
      const originalEventData = originalEventSnapshot.exists ? originalEventSnapshot.data() : null;

      // 3. Verificar capacidad en el evento destino
      const newBookedSlots = targetEventData.bookedSlots + originalBookingData.pax;
      if (newBookedSlots > targetEventData.maxCapacity) {
        throw new Error("CAPACITY_EXCEEDED");
      }

      // 4. Calcular precio para el nuevo tour
      let pricePerPerson = 1000000; // Valor por defecto
      if (newTour.pricingTiers && Array.isArray(newTour.pricingTiers)) {
        // Buscar el precio adecuado según el número de personas
        const pricingTier = newTour.pricingTiers.find((tier) =>
          originalBookingData.pax >= (tier.paxFrom || tier.pax) &&
          originalBookingData.pax <= (tier.paxTo || tier.pax),
        );
        if (pricingTier) {
          // Use the pricePerPerson object which might contain multiple currencies
          if (typeof pricingTier.pricePerPerson === "object") {
            pricePerPerson = pricingTier.pricePerPerson.COP || pricingTier.pricePerPerson.USD || 1000000;
          } else {
            pricePerPerson = pricingTier.pricePerPerson || 1000000;
          }
        }
      }

      // Calcular total
      const totalPrice = pricePerPerson * originalBookingData.pax;

      // 5. Actualizar la capacidad del evento destino
      transaction.update(targetEventRef, {
        bookedSlots: newBookedSlots,
        totalBookings: (targetEventData.totalBookings || 0) + 1,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 6. Crear la nueva reserva en el nuevo tour
      const newBookingRef = db.collection(CONSTANTS.COLLECTIONS.BOOKINGS).doc();

      const newBookingDoc = {
        bookingId: newBookingRef.id,
        eventId: targetEventRef.id,
        tourId: newTourId,
        tourName: newTour.name.es || `Tour ${newTourId}`, // Denormalizado
        customer: originalBookingData.customer,
        pax: originalBookingData.pax,
        pricePerPerson: pricePerPerson,
        totalPrice: totalPrice,
        bookingDate: admin.firestore.FieldValue.serverTimestamp(),
        status: originalBookingData.status, // Mantener el mismo estado
        statusHistory: [{
          ...originalBookingData.statusHistory[originalBookingData.statusHistory.length - 1], // Copy last status
          note: `Transferido desde tour ${originalBookingData.tourId} al tour ` +
                `${newTourId}` + (reason ? ` - Razón: ${reason}` : ""),
        }],
        isEventOrigin: !eventExists, // Indica si esta reserva creó el evento
        ipAddress: originalBookingData.ipAddress || getClientIP(req),
        bookingReference: generateBookingReference(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        // Agregar información de la transferencia
        transferInfo: {
          originalBookingId: bookingId,
          originalTourId: originalBookingData.tourId,
          transferDate: admin.firestore.FieldValue.serverTimestamp(),
          reason: reason || null,
        },
      };

      transaction.set(newBookingRef, newBookingDoc);

      // 7. Cancelar la reserva original
      const cancellationNote = `Transferido al tour ${newTourId}, nueva reserva: ${newBookingRef.id}` +
                               (reason ? ` - Razón: ${reason}` : "");
      const newStatusHistoryEntry = {
        timestamp: new Date().toISOString(),
        status: CONSTANTS.STATUS.BOOKING_CANCELLED_BY_ADMIN,
        note: cancellationNote,
        adminUser: "system",
      };

      const updatedStatusHistory = [...(originalBookingData.statusHistory || []), newStatusHistoryEntry];

      transaction.update(bookingRef, {
        status: CONSTANTS.STATUS.BOOKING_CANCELLED_BY_ADMIN,
        statusHistory: updatedStatusHistory,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 8. Actualizar la capacidad del evento original
      if (originalEventData) {
        const newOriginalBookedSlots = Math.max(0, (originalEventData.bookedSlots || 0) - originalBookingData.pax);
        const originalEventRef = db.collection(CONSTANTS.COLLECTIONS.TOUR_EVENTS).doc(originalBookingData.eventId);
        transaction.update(originalEventRef, {
          bookedSlots: newOriginalBookedSlots,
          totalBookings: Math.max(0, (originalEventData.totalBookings || 0) - 1),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      return {
        newBookingId: newBookingRef.id,
        newBookingReference: newBookingDoc.bookingReference,
        originalBookingId: bookingId,
        cancelledStatus: CONSTANTS.STATUS.BOOKING_CANCELLED_BY_ADMIN,
      };
    });

    // Devolver confirmación de transferencia exitosa
    return res.status(200).json({
      success: true,
      message: "Reserva transferida exitosamente a nuevo tour",
      originalBookingId: result.originalBookingId,
      newBookingId: result.newBookingId,
      newBookingReference: result.newBookingReference,
      cancelledBookingStatus: result.cancelledStatus,
      pax: originalBookingData.pax,
      reason: reason || null,
    });
  } catch (error) {
    if (error.message === "CAPACITY_EXCEEDED") {
      return res.status(422).send({
        error: {
          code: "CAPACITY_EXCEEDED",
          message: "Capacidad excedida en el evento de destino",
          details: "Not enough capacity available in the destination event",
        },
      });
    }

    console.error("Error al transferir la reserva a nuevo tour:", error);
    return res.status(500).send({
      error: {
        code: "INTERNAL_ERROR",
        message: "Error interno al procesar la transferencia a nuevo tour",
        details: error.message,
      },
    });
  }
};

/**
 * Creates a new event independently of any booking
 * @param {functions.https.Request} req - The HTTP request.
 * @param {functions.Response} res - The HTTP response.
 * @return {Promise<void>} - The response with the new event information.
 */
const adminCreateEvent = async (req, res) => {
  // Verify this is a POST request
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  // Verify admin authentication
  if (!isAdminRequest(req)) {
    return res.status(401).send("Unauthorized: Invalid admin secret key");
  }

  try {
    // Get event data from request body
    const eventData = req.body;

    // Validate required fields
    if (!eventData.tourId) {
      return res.status(400).send({
        error: {
          code: "INVALID_DATA",
          message: "El tourId es obligatorio",
          details: "tourId is required",
        },
      });
    }

    if (!eventData.startDate) {
      return res.status(400).send({
        error: {
          code: "INVALID_DATA",
          message: "La fecha de inicio es obligatoria",
          details: "startDate is required",
        },
      });
    }

    // Validate date format
    const startDate = new Date(eventData.startDate);
    if (isNaN(startDate.getTime())) {
      return res.status(400).send({
        error: {
          code: "INVALID_DATA",
          message: "La fecha proporcionada no es válida",
          details: "startDate is not a valid date",
        },
      });
    }

    // Verify tour exists and is active
    const tourRef = db.collection(CONSTANTS.COLLECTIONS.TOURS).doc(eventData.tourId);
    const tourDoc = await tourRef.get();

    if (!tourDoc.exists) {
      return res.status(404).send({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Tour no encontrado o no disponible",
          details: "The specified tour does not exist or is inactive",
        },
      });
    }

    const tour = tourDoc.data();
    if (!tour.isActive) {
      return res.status(404).send({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Tour no disponible",
          details: "The specified tour is not active",
        },
      });
    }

    // Create the new event
    const newEvent = {
      tourId: eventData.tourId,
      tourName: tour.name && tour.name.es ? tour.name.es :
                (tour.name || `Tour ${eventData.tourId}`), // Denormalized for optimization
      startDate: startDate,
      endDate: eventData.endDate ? new Date(eventData.endDate) :
               new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days after if not specified
      maxCapacity: eventData.maxCapacity || tour.maxParticipants || 8, // Use provided capacity,
      // tour's capacity, or default to 8
      bookedSlots: 0, // Initialized to 0
      type: eventData.type ||
           CONSTANTS.STATUS.EVENT_TYPE_PRIVATE, // Default to private if not specified
      status: eventData.status || "active", // Default to active if not specified
      totalBookings: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Add any additional fields from the request
    if (eventData.notes) {
      newEvent.notes = eventData.notes;
    }

    const createdEvent = await db.collection(CONSTANTS.COLLECTIONS.TOUR_EVENTS).add(newEvent);

    // Return success response
    return res.status(201).json({
      success: true,
      eventId: createdEvent.id,
      message: "Evento creado exitosamente",
      event: {
        eventId: createdEvent.id,
        ...newEvent,
        startDate: newEvent.startDate.toISOString(),
        endDate: newEvent.endDate.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error al crear el evento:", error);
    return res.status(500).send({
      error: {
        code: "INTERNAL_ERROR",
        message: "Error interno al procesar la creación del evento",
        details: error.message,
      },
    });
  }
};

/**
 * Splits an event into multiple events by moving selected bookings to new events
 * @param {functions.https.Request} req - The HTTP request.
 * @param {functions.Response} res - The HTTP response.
 * @return {Promise<void>} - The response with the result of the event split.
 */
const adminSplitEvent = async (req, res) => {
  // Verify this is a POST request
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  // Verify admin authentication
  if (!isAdminRequest(req)) {
    return res.status(401).send("Unauthorized: Invalid admin secret key");
  }

  try {
    // Extract eventId from URL
    const pathParts = req.path.split("/");
    let eventId = null;
    for (let i = pathParts.length - 1; i >= 0; i--) {
      if (pathParts[i] && pathParts[i].trim() !== "" && pathParts[i] !== "split") {
        eventId = pathParts[i];
        break;
      }
    }

    if (!eventId) {
      return res.status(400).send({
        error: {
          code: "INVALID_DATA",
          message: "El eventId es obligatorio en la URL",
          details: "eventId is required in the URL path",
        },
      });
    }

    // Get request body
    const {bookingIds, newEventMaxCapacity, newEventType, reason} = req.body;

    if (!bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0) {
      return res.status(400).send({
        error: {
          code: "INVALID_DATA",
          message: "bookingIds es obligatorio y debe ser un array no vacío",
          details: "bookingIds is required and must be a non-empty array",
        },
      });
    }

    // Verify the source event exists
    const sourceEventRef = db.collection(CONSTANTS.COLLECTIONS.TOUR_EVENTS).doc(eventId);
    const sourceEventDoc = await sourceEventRef.get();

    if (!sourceEventDoc.exists) {
      return res.status(404).send({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Evento origen no encontrado",
          details: "The source event does not exist",
        },
      });
    }

    const sourceEventData = sourceEventDoc.data();

    // Verify all bookings exist and belong to this event
    const bookingsCollection = db.collection(CONSTANTS.COLLECTIONS.BOOKINGS);
    const bookingPromises = bookingIds.map((bookingId) => bookingsCollection.doc(bookingId).get());
    const bookingDocs = await Promise.all(bookingPromises);

    const bookingsToMove = [];
    let totalPaxToMove = 0;

    for (let i = 0; i < bookingDocs.length; i++) {
      const bookingDoc = bookingDocs[i];
      const bookingId = bookingIds[i];

      if (!bookingDoc.exists) {
        return res.status(404).send({
          error: {
            code: "RESOURCE_NOT_FOUND",
            message: `Reserva no encontrada: ${bookingId}`,
            details: `Booking ${bookingId} does not exist`,
          },
        });
      }

      const bookingData = bookingDoc.data();
      if (bookingData.eventId !== eventId) {
        return res.status(400).send({
          error: {
            code: "INVALID_DATA",
            message: `La reserva ${bookingId} no pertenece al evento especificado`,
            details: `Booking ${bookingId} does not belong to the specified event`,
          },
        });
      }

      if (bookingData.status === CONSTANTS.STATUS.BOOKING_CANCELLED ||
          bookingData.status === CONSTANTS.STATUS.BOOKING_CANCELLED_BY_ADMIN) {
        return res.status(400).send({
          error: {
            code: "INVALID_DATA",
            message: `La reserva ${bookingId} está cancelada y no se puede mover`,
            details: `Booking ${bookingId} is cancelled and cannot be moved`,
          },
        });
      }

      bookingsToMove.push({docRef: bookingDoc.ref, data: bookingData});
      totalPaxToMove += bookingData.pax;
    }

    // Create a new event for the bookings to be moved
    const newEvent = {
      tourId: sourceEventData.tourId,
      tourName: sourceEventData.tourName,
      startDate: sourceEventData.startDate.toDate ? sourceEventData.startDate.toDate() : sourceEventData.startDate,
      endDate: sourceEventData.endDate.toDate ? sourceEventData.endDate.toDate() : sourceEventData.endDate,
      maxCapacity: newEventMaxCapacity || sourceEventData.maxCapacity || 8,
      bookedSlots: totalPaxToMove, // Start with the pax that will be moved
      type: newEventType || sourceEventData.type, // Default to same type as source
      status: sourceEventData.status,
      totalBookings: bookingIds.length,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Add any additional fields from the source event
    if (sourceEventData.notes) {
      newEvent.notes = sourceEventData.notes;
    }

    const createdEvent = await db.collection(CONSTANTS.COLLECTIONS.TOUR_EVENTS).add(newEvent);
    const newEventId = createdEvent.id;

    // Move the selected bookings to the new event in a transaction
    await db.runTransaction(async (transaction) => {
      // Update each booking to point to the new event
      for (const {docRef, data} of bookingsToMove) {
        // Create status history entry for the move
        const newStatusHistoryEntry = {
          timestamp: new Date().toISOString(),
          status: data.status, // Keep the same status
          note: `Movido al evento ${newEventId} como parte de división de evento` +
                (reason ? ` - Razón: ${reason}` : ""),
          adminUser: "system",
        };

        const updatedStatusHistory = [...(data.statusHistory || []), newStatusHistoryEntry];

        transaction.update(docRef, {
          eventId: newEventId,
          statusHistory: updatedStatusHistory,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      // Update capacity: reduce from source event and it will be added to the new event
      transaction.update(sourceEventRef, {
        bookedSlots: admin.firestore.FieldValue.increment(-totalPaxToMove),
        totalBookings: admin.firestore.FieldValue.increment(-bookingIds.length),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    // Return success response
    return res.status(200).json({
      success: true,
      message: "Evento dividido exitosamente",
      sourceEventId: eventId,
      newEventId: newEventId,
      movedBookingsCount: bookingIds.length,
      movedPaxCount: totalPaxToMove,
      bookingIds: bookingIds,
      reason: reason || null,
    });
  } catch (error) {
    console.error("Error al dividir el evento:", error);
    return res.status(500).send({
      error: {
        code: "INTERNAL_ERROR",
        message: "Error interno al procesar la división del evento",
        details: error.message,
      },
    });
  }
};

/**
 * Gets all events for a specific date and tour
 * @param {functions.https.Request} req - The HTTP request.
 * @param {functions.Response} res - The HTTP response.
 * @return {Promise<void>} - The response with the list of events.
 */
const adminGetEventsByDate = async (req, res) => {
  // Verify this is a GET request
  if (req.method !== "GET") {
    return res.status(405).send("Method Not Allowed");
  }

  // Verify admin authentication
  if (!isAdminRequest(req)) {
    return res.status(401).send("Unauthorized: Invalid admin secret key");
  }

  try {
    // Extract tourId and date from URL
    const pathParts = req.path.split("/");

    // We expect the format to be: /adminGetEventsByDate/:tourId/:date
    // The last two non-empty parts should be the tourId and date
    const nonEmptyParts = pathParts.filter((part) => part.trim() !== "");

    if (nonEmptyParts.length < 2) {
      return res.status(400).send({
        error: {
          code: "INVALID_DATA",
          message: "tourId y fecha son obligatorios en la URL",
          details: "tourId and date are required in the URL path in format /adminGetEventsByDate/:tourId/:date",
        },
      });
    }

    // Extract tourId and date from the path (last two segments)
    const dateParam = nonEmptyParts[nonEmptyParts.length - 1]; // Last part is the date
    const tourId = nonEmptyParts[nonEmptyParts.length - 2]; // Second to last is the tourId

    if (!tourId) {
      return res.status(400).send({
        error: {
          code: "INVALID_DATA",
          message: "El tourId es obligatorio en la URL",
          details: "tourId is required in the URL path",
        },
      });
    }

    if (!dateParam) {
      return res.status(400).send({
        error: {
          code: "INVALID_DATA",
          message: "La fecha es obligatoria en la URL",
          details: "date is required in the URL path",
        },
      });
    }

    // Parse the date parameter
    const requestedDate = new Date(dateParam);
    if (isNaN(requestedDate.getTime())) {
      return res.status(400).send({
        error: {
          code: "INVALID_DATA",
          message: "Formato de fecha inválido",
          details: "Date format is invalid. Use YYYY-MM-DD format.",
        },
      });
    }

    // Verify tour exists and is active
    const tourRef = db.collection(CONSTANTS.COLLECTIONS.TOURS).doc(tourId);
    const tourDoc = await tourRef.get();

    if (!tourDoc.exists) {
      return res.status(404).send({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Tour no encontrado o no disponible",
          details: "The specified tour does not exist or is inactive",
        },
      });
    }

    const tour = tourDoc.data();
    if (!tour.isActive) {
      return res.status(404).send({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Tour no disponible",
          details: "The specified tour is not active",
        },
      });
    }

    // Create date range for the query (from start of day to end of day)
    const startOfDay = new Date(requestedDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(requestedDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Query all events for the tour on the specified date
    const eventsQuery = await db.collection(CONSTANTS.COLLECTIONS.TOUR_EVENTS)
        .where("tourId", "==", tourId)
        .where("startDate", ">=", admin.firestore.Timestamp.fromDate(startOfDay))
        .where("startDate", "<=", admin.firestore.Timestamp.fromDate(endOfDay))
        .get();

    if (eventsQuery.empty) {
      // No events for this date
      return res.status(200).json({
        events: [],
        count: 0,
        tourId: tourId,
        date: requestedDate.toISOString().split("T")[0],
        message: "No events found for the specified tour and date",
      });
    }

    // Map the Firestore documents to a JSON array
    const events = eventsQuery.docs.map((doc) => {
      const eventData = doc.data();
      return {
        eventId: doc.id,
        ...eventData,
        // Convert Firestore timestamps to ISO strings for better handling in the frontend
        startDate: eventData.startDate ? eventData.startDate.toDate().toISOString() : null,
        endDate: eventData.endDate ? eventData.endDate.toDate().toISOString() : null,
        createdAt: eventData.createdAt ? eventData.createdAt.toDate().toISOString() : null,
        updatedAt: eventData.updatedAt ? eventData.updatedAt.toDate().toISOString() : null,
      };
    });

    // Return the list of events
    return res.status(200).json({
      events: events,
      count: events.length,
      tourId: tourId,
      date: requestedDate.toISOString().split("T")[0],
      message: `Found ${events.length} events for tour ${tourId} on date ${requestedDate.toISOString().split("T")[0]}`,
    });
  } catch (error) {
    console.error("Error al obtener los eventos por fecha:", error);
    return res.status(500).send({
      error: {
        code: "INTERNAL_ERROR",
        message: "Error interno al procesar la solicitud de eventos por fecha",
        details: error.message,
      },
    });
  }
};

// -----------------------------------------------------------
// Exportación
// -----------------------------------------------------------

// Exporta la función para que se active mediante una solicitud HTTP.
// El nombre de la URL será /tours (ej: /api/getTours)
module.exports = {
  getToursV2: functions.https.onRequest(getToursList),
  getTourByIdV2: functions.https.onRequest(getTourById),
  adminCreateTourV2: functions.https.onRequest(adminCreateTour),
  adminUpdateTourV2: functions.https.onRequest(adminUpdateTour),
  adminDeleteTourV2: functions.https.onRequest(adminDeleteTour),
  adminGetBookings: functions.https.onRequest(adminGetBookings), // Nuevo endpoint
  adminUpdateBookingStatus: functions.https.onRequest(adminUpdateBookingStatusExtended), // Updated endpoint
  adminUpdateBookingDetails: functions.https.onRequest(adminUpdateBookingDetails), // New endpoint
  adminCreateBooking: functions.https.onRequest(adminCreateBooking), // New endpoint for admin booking creation
  adminTransferBooking: functions.https.onRequest(adminTransferBooking), // Nuevo endpoint
  adminTransferToNewTour: functions.https.onRequest(adminTransferToNewTour), // New endpoint for cross-tour transfers
  adminGetEventsCalendar: functions.https.onRequest(adminGetEventsCalendar), // Nuevo endpoint
  adminPublishEvent: functions.https.onRequest(adminPublishEvent), // Nuevo endpoint
  adminCreateEvent: functions.https.onRequest(adminCreateEvent), // New endpoint for creating events independently
  adminSplitEvent: functions.https.onRequest(adminSplitEvent), // New endpoint for splitting events
  adminGetEventsByDate: functions.https.onRequest(adminGetEventsByDate), // New endpoint for getting events by date
  createBooking: functions.https.onRequest(createBooking),
  joinEvent: functions.https.onRequest(joinEvent),
  checkBooking: functions.https.onRequest(checkBooking),
  // Más funciones se agregarán aquí
};
