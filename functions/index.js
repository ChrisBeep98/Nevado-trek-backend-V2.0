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
  RATE_LIMIT_SECONDS: 300, // 5 minutos entre reservas por IP
  MAX_BOOKINGS_PER_HOUR: 3, // Máximo 3 reservas por hora por IP
  MAX_BOOKINGS_PER_DAY: 5, // Máximo 5 reservas por día por IP

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
const getClientIP = (req) => {
  // Prioridad: X-Forwarded-For > X-Real-IP > req.ip
  return req.headers["x-forwarded-for"] ||
         req.headers["x-real-ip"] ||
         req.ip;
};

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
    const rateLimiterRef = db.collection(CONSTANTS.COLLECTIONS.RATE_LIMITER);
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
    if (timeSinceLastBooking < CONSTANTS.RATE_LIMIT_SECONDS * 1000) {
      return true; // Bloqueado por frecuencia de solicitud
    }

    // Verificar límite de reservas por hora
    if (bookingsThisHour >= CONSTANTS.MAX_BOOKINGS_PER_HOUR) {
      return true; // Bloqueado por límite de frecuencia por hora
    }

    // Verificar límite de reservas por día
    if (bookingsThisDay >= CONSTANTS.MAX_BOOKINGS_PER_DAY) {
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
    const rateLimiterRef = db.collection(CONSTANTS.COLLECTIONS.RATE_LIMITER);
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
const generateBookingReference = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const datePart = `${year}${month}${day}`;
  const randomPart = String(Math.floor(Math.random() * 900) + 100).padStart(3, "0");
  return `${CONSTANTS.BOOKING_REFERENCE_PREFIX}${datePart}-${randomPart}`;
};

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
        status: CONSTANTS.STATUS.BOOKING_PENDING,
        statusHistory: [{
          timestamp: new Date().toISOString(), // Using client timestamp since Firestore timestamps can't be in arrays
          status: CONSTANTS.STATUS.BOOKING_PENDING,
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
        type: CONSTANTS.STATUS.EVENT_TYPE_PRIVATE, // Privado inicialmente
        status: "active",
        totalBookings: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const createdEvent = await db.collection(CONSTANTS.COLLECTIONS.TOUR_EVENTS).add(newEvent);
      eventRef = createdEvent;
      eventExists = false;
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
      if ([CONSTANTS.STATUS.EVENT_TYPE_PRIVATE, CONSTANTS.STATUS.EVENT_TYPE_PUBLIC].includes(type)) {
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
/**
 * Transfiere una reserva de un tour/fecha a otro tour/fecha
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
    // Obtener los datos del cuerpo de la solicitud
    const {bookingId, fromTourId, toTourId, toEventId, reason} = req.body;

    // Validar campos requeridos
    if (!bookingId) {
      return res.status(400).send({
        error: {
          code: "INVALID_DATA",
          message: "El bookingId es obligatorio",
          details: "bookingId is required in request body",
        },
      });
    }

    if (!fromTourId && !toTourId) {
      return res.status(400).send({
        error: {
          code: "INVALID_DATA",
          message: "Se requiere al menos fromTourId o toTourId",
          details: "Either fromTourId or toTourId (or both) are required",
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

    const booking = bookingDoc.data();

    // Verificar estado actual de la reserva
    if (booking.status !== CONSTANTS.STATUS.BOOKING_PENDING &&
        booking.status !== CONSTANTS.STATUS.BOOKING_CONFIRMED) {
      return res.status(400).send({
        error: {
          code: "INVALID_DATA",
          message: "Solo se pueden transferir reservas pendientes o confirmadas",
          details: "Only pending or confirmed bookings can be transferred",
        },
      });
    }

    // Si se proporciona toTourId pero no toEventId, crear un nuevo evento
    let targetEventId = toEventId;
    if (toTourId && !toEventId) {
      // Buscar un evento disponible para la fecha deseada o crear uno nuevo
      // Por ahora, simplemente crearemos un nuevo evento privado
      const tourRef = db.collection(CONSTANTS.COLLECTIONS.TOURS).doc(toTourId);
      const tourDoc = await tourRef.get();

      if (!tourDoc.exists || !tourDoc.data().isActive) {
        return res.status(404).send({
          error: {
            code: "RESOURCE_NOT_FOUND",
            message: "Tour destino no encontrado o no disponible",
            details: "The destination tour does not exist or is not active",
          },
        });
      }

      const newEvent = {
        tourId: toTourId,
        tourName: tourDoc.data().name.es, // Denormalizado para optimización
        startDate: booking.startDate || admin.firestore.FieldValue.serverTimestamp(), // Usar la fecha original o ahora
        endDate: new Date(), // Ajustar según duración del tour
        maxCapacity: 8, // Capacidad por defecto
        bookedSlots: booking.pax, // Inicializado con los pax de la reserva
        type: CONSTANTS.STATUS.EVENT_TYPE_PRIVATE, // Privado inicialmente
        status: "active",
        totalBookings: 1,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const createdEvent = await db.collection(CONSTANTS.COLLECTIONS.TOUR_EVENTS).add(newEvent);
      targetEventId = createdEvent.id;
    } else if (toEventId) {
      // Verificar que el evento destino exista y tenga capacidad
      const eventRef = db.collection(CONSTANTS.COLLECTIONS.TOUR_EVENTS).doc(toEventId);
      const eventDoc = await eventRef.get();

      if (!eventDoc.exists) {
        return res.status(404).send({
          error: {
            code: "RESOURCE_NOT_FOUND",
            message: "Evento destino no encontrado",
            details: "The destination event does not exist",
          },
        });
      }

      const event = eventDoc.data();

      // Verificar capacidad disponible en el evento destino
      const newBookedSlots = event.bookedSlots + booking.pax;
      if (newBookedSlots > event.maxCapacity) {
        return res.status(422).send({
          error: {
            code: "CAPACITY_EXCEEDED",
            message: "Capacidad excedida para el evento destino",
            details: "Not enough capacity available in the destination event",
          },
        });
      }
    }

    // Realizar la transferencia en una transacción
    await db.runTransaction(async (transaction) => {
      // Actualizar la reserva con los nuevos datos
      const updatedFields = {
        tourId: toTourId || booking.tourId,
        tourName: toTourId ?
          (await db.collection(CONSTANTS.COLLECTIONS.TOURS).doc(toTourId).get()).data().name.es :
          booking.tourName,
        eventId: targetEventId || booking.eventId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      // Actualizar estado de la reserva con historial
      const newStatusHistoryEntry = {
        timestamp: new Date().toISOString(),
        status: booking.status, // Mantener el mismo estado
        note: "Transferido " + (reason ? "(" + reason + ")" : "sin razón específica"),
        adminUser: "system", // En una implementación completa, aquí iría el ID del admin real
      };

      const updatedStatusHistory = [...(booking.statusHistory || []), newStatusHistoryEntry];

      transaction.update(bookingRef, {
        ...updatedFields,
        statusHistory: updatedStatusHistory,
      });

      // Actualizar capacidades de los eventos origen y destino
      if (booking.eventId && booking.eventId !== targetEventId) {
        // Disminuir la capacidad en el evento origen
        const fromEventRef = db.collection(CONSTANTS.COLLECTIONS.TOUR_EVENTS).doc(booking.eventId);
        transaction.update(fromEventRef, {
          bookedSlots: admin.firestore.FieldValue.increment(-booking.pax),
          totalBookings: admin.firestore.FieldValue.increment(-1),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      if (targetEventId && targetEventId !== booking.eventId) {
        // Aumentar la capacidad en el evento destino
        const toEventRef = db.collection(CONSTANTS.COLLECTIONS.TOUR_EVENTS).doc(targetEventId);
        transaction.update(toEventRef, {
          bookedSlots: admin.firestore.FieldValue.increment(booking.pax),
          totalBookings: admin.firestore.FieldValue.increment(1),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    });

    // Devolver confirmación de transferencia exitosa
    return res.status(200).json({
      success: true,
      bookingId: bookingId,
      message: "Reserva transferida exitosamente",
      fromTourId: booking.tourId,
      toTourId: toTourId,
      toEventId: targetEventId,
    });
  } catch (error) {
    console.error("Error al transferir la reserva:", error);
    return res.status(500).send({
      error: {
        code: "INTERNAL_ERROR",
        message: "Error interno al procesar la transferencia",
        details: error.message,
      },
    });
  }
};

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
      newType = CONSTANTS.STATUS.EVENT_TYPE_PRIVATE;
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
  adminUpdateBookingStatus: functions.https.onRequest(adminUpdateBookingStatus), // Nuevo endpoint
  adminTransferBooking: functions.https.onRequest(adminTransferBooking), // Nuevo endpoint
  adminGetEventsCalendar: functions.https.onRequest(adminGetEventsCalendar), // Nuevo endpoint
  adminPublishEvent: functions.https.onRequest(adminPublishEvent), // Nuevo endpoint
  createBooking: functions.https.onRequest(createBooking),
  joinEvent: functions.https.onRequest(joinEvent),
  checkBooking: functions.https.onRequest(checkBooking),
  // Más funciones se agregarán aquí
};
