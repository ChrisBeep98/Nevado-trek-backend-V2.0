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


// -----------------------------------------------------------
// Sección de Endpoints de Administración
// -----------------------------------------------------------

// A continuación implementaremos las funciones de gestión para
// el panel de control. [cite: 213, 218]

// ... (Aquí irá la primera función de admin: createTour)

// -----------------------------------------------------------
// Exportación
// -----------------------------------------------------------

// Exporta la función para que se active mediante una solicitud HTTP.
// El nombre de la URL será /tours (ej: /api/getTours)
module.exports = {
  getTours: functions.https.onRequest(getToursList),
  // Más funciones se agregarán aquí. Por ejemplo:
  // adminTours: functions.https.onRequest(adminTourManagement)
  // createBooking: functions.https.onRequest(createBookingFlow)
};
