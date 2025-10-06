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
  // La clave secreta para la autenticación de las funciones de administrador.
  // **NOTA DE SEGURIDAD:** Esto debería estar en Firebase Secrets
  // para producción, pero lo dejamos aquí por simplicidad del MVP.
  ADMIN_SECRET_KEY: "miClaveSecreta123",

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
  },

  // Tiempo mínimo entre reservas de la misma IP (Anti-spam)
  RATE_LIMIT_SECONDS: 10, // Ejemplo: 10 segundos
};

/**
 * Función middleware simple para validar la clave secreta del administrador.
 * @param {functions.https.Request} req - La solicitud HTTP.
 * @return {boolean} - true si la clave es válida, false en caso contrario.
 */
// eslint-disable-next-line no-unused-vars
const isAdminRequest = (req) => {
  // La clave debe venir en un encabezado llamado 'X-Admin-Secret-Key'
  const secretKey = req.headers["x-admin-secret-key"];
  return secretKey === CONSTANTS.ADMIN_SECRET_KEY;
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
    // Extraemos el tourId de la URL (asumiendo que se configura como
    // /admin/tours/{tourId})
    // /admin/tours/{tourId}
    const tourId = req.params.tourId || req.path.split("/")[3];

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

// -----------------------------------------------------------
// Exportación
// -----------------------------------------------------------

// Exporta la función para que se active mediante una solicitud HTTP.
// El nombre de la URL será /tours (ej: /api/getTours)
module.exports = {
  getTours: functions.https.onRequest(getToursList),
  getTourById: functions.https.onRequest(getTourById),
  adminCreateTour: functions.https.onRequest(adminCreateTour),
  adminUpdateTour: functions.https.onRequest(adminUpdateTour),
  // Más funciones se agregarán aquí. Por ejemplo:
  // createBooking: functions.https.onRequest(createBookingFlow)
};
