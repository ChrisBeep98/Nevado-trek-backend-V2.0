✅ Paso 1: Preparar el Código Base en functions/index.js
Vamos a establecer la estructura fundamental para tus 

Cloud Functions. Esto incluye la importación de las librerías necesarias (Firebase Admin SDK y Firebase Functions) y la inicialización de la app de Firebase Admin, que es lo que le permite a tu código interactuar con la base de datos (Firestore) y otros servicios de Firebase.

Acción: Reemplaza todo el contenido de tu archivo functions/index.js con el siguiente código:

JavaScript

// index.js

/**
 * Módulo de Firebase Admin SDK.
 * Proporciona acceso privilegiado a los recursos de Firebase.
 */
const admin = require('firebase-admin');

/**
 * Módulo de Firebase Functions SDK.
 * Se usa para crear y desplegar funciones en la nube.
 */
const functions = require('firebase-functions');

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
    // **NOTA DE SEGURIDAD:** Esto debería estar en Firebase Secrets para producción,
    // pero lo dejamos aquí por simplicidad del MVP.
    ADMIN_SECRET_KEY: "miClaveSecreta123", 

    // Colecciones de Firestore.
    COLLECTIONS: {
        TOURS: 'tours',
        TOUR_EVENTS: 'tourEvents', // Salidas específicas [cite: 101, 103]
        BOOKINGS: 'bookings',
        RATE_LIMITER: 'rateLimiter' // Anti-spam [cite: 159, 161]
    },

    // Estado de los eventos y reservas.
    STATUS: {
        EVENT_TYPE_PRIVATE: 'private', // Evento creado por una reserva inicial [cite: 121]
        EVENT_TYPE_PUBLIC: 'public',   // Evento visible en el calendario [cite: 123]
        BOOKING_PENDING: 'pending'     // Estado inicial de la reserva [cite: 149, 155]
    },

    // Tiempo mínimo entre reservas de la misma IP (Anti-spam)
    RATE_LIMIT_SECONDS: 10 // Ejemplo: 10 segundos
};

/**
 * Función middleware simple para validar la clave secreta del administrador.
 * @param {functions.https.Request} req - La solicitud HTTP.
 * @returns {boolean} - true si la clave es válida, false en caso contrario.
 */
const isAdminRequest = (req) => {
    // La clave debe venir en un encabezado llamado 'X-Admin-Secret-Key' 
    const secretKey = req.headers['x-admin-secret-key'];
    return secretKey === CONSTANTS.ADMIN_SECRET_KEY;
};


// -----------------------------------------------------------
// Sección de Endpoints Públicos (Lectura de Datos)
// -----------------------------------------------------------

// A continuación implementaremos la función para obtener la lista de tours.
// Endpoint: GET /tours
// Propósito: Obtener el catálogo maestro de experiencias. [cite: 25, 26]
// Esto será la base de tu arquitectura bilingüe. [cite: 97, 98]

// ... (Aquí irá la primera función: getToursList)


// -----------------------------------------------------------
// Sección de Endpoints de Administración
// -----------------------------------------------------------

// A continuación implementaremos las funciones de gestión para el panel de control. [cite: 213, 218]

// ... (Aquí irá la primera función de admin: createTour)

// -----------------------------------------------------------
// Exportación
// -----------------------------------------------------------

// Debes exportar tus funciones al final para que Firebase las reconozca.
// module.exports = {
//     getTours: functions.https.onRequest(getToursList),
//     // ... otras funciones
// };
🧠 Conceptos Clave del Código Base

admin.initializeApp(): Esta línea es vital. Le dice a tu código de Cloud Function que se está ejecutando dentro de Firebase y le da las credenciales para interactuar con todos tus servicios (Firestore, Authentication, etc.).


const db = admin.firestore(): Crea una referencia directa y fácil de usar a tu base de datos NoSQL, Cloud Firestore. Usaremos 

db para todas las operaciones de lectura y escritura.


isAdminRequest(req): Implementamos el control de acceso inicial para tus funciones de administrador. Revisa el 


header X-Admin-Secret-Key  de la solicitud para verificar la autenticación.


CONSTANTS: Centraliza nombres de colecciones (tours, tourEvents, etc.) , que son propensos a errores tipográficos, y la clave secreta de administración.


✅ Paso 2: Implementar Función Pública de Lectura (Catálogo de Tours)
Ahora, creemos la primera función RESTful: GET /tours. Esta función leerá todos los documentos de la colección tours y los devolverá al frontend.

Recuerda que esta función devolverá los tours con 

ambos idiomas (es y en) dentro, permitiendo que el frontend decida qué mostrar.

Acción: Agrega el siguiente bloque de código debajo de la sección de "Endpoints Públicos" en functions/index.js.

JavaScript

/**
 * Obtiene la lista de todos los tours activos.
 * Endpoint: GET /tours
 */
const getToursList = async (req, res) => {
    // Solo permitiremos el método GET para esta función de lectura
    if (req.method !== 'GET') {
        return res.status(405).send('Method Not Allowed');
    }

    try {
        // Obtenemos una referencia a la colección de tours
        const toursRef = db.collection(CONSTANTS.COLLECTIONS.TOURS);

        // Filtramos solo por los tours activos [cite: 35, 95]
        const snapshot = await toursRef
            .where('isActive', '==', true)
            .get();

        if (snapshot.empty) {
            // No hay tours activos
            return res.status(200).json([]);
        }

        // Mapeamos los documentos de Firestore a un array de objetos JSON
        const tours = snapshot.docs.map(doc => ({
            // El tourId es el ID del documento en Firestore
            tourId: doc.id,
            ...doc.data()
        }));

        // Devolvemos el array de tours.
        // Contienen la estructura bilingüe {name: {es: "...", en: "..."}} [cite: 36]
        return res.status(200).json(tours);

    } catch (error) {
        console.error("Error al obtener la lista de tours:", error);
        // Devolvemos un error 500 (Internal Server Error)
        return res.status(500).send({
            message: 'Internal Server Error',
            details: error.message
        });
    }
};
✅ Paso 3: Exportar la Función para que sea un Endpoint
Para que Firebase pueda ejecutar la función getToursList como una URL, debemos exportarla.

Acción: Reemplaza la sección "Exportación" (las líneas comentadas) al final de functions/index.js con el siguiente código:

JavaScript

// -----------------------------------------------------------
// Exportación
// -----------------------------------------------------------

// Exporta la función para que se active mediante una solicitud HTTP.
// El nombre de la URL será /tours (ej: /api/getTours)
module.exports = {
    getTours: functions.https.onRequest(getToursList)
    // Más funciones se agregarán aquí. Por ejemplo:
    // adminTours: functions.https.onRequest(adminTourManagement)
    // createBooking: functions.https.onRequest(createBookingFlow)
};
Próximo Paso: Prueba Local
Con este código, ya tienes tu primera Cloud Function lista. El siguiente paso es probarla en tu entorno local antes de desplegar.

Acción Sugerida:

Asegúrate de haber guardado functions/index.js.

Abre tu terminal en la raíz de tu proyecto de Firebase.

Ejecuta los emuladores para probar la función:

Bash

firebase emulators:start --only functions,firestore
Una vez que los emuladores estén corriendo, la terminal te dará una URL local para la función getTours, similar a:
http://localhost:5001/[project-id]/us-central1/getTours

Copia esa URL y pégala en tu navegador o úsala con una herramienta como Postman para verificar que te devuelve el documento de 

nevado-del-tolima que creaste.

¿El resultado es correcto? Si es así, podemos continuar con las funciones de administración para crear y editar tours.


Fuentes

✅ Paso 4: Ajustes y Validaciones de Calidad de Código
Hemos realizado ajustes necesarios para asegurar que el código cumpla con los estándares de calidad y pase las validaciones de linting.

Principales cambios realizados para cumplir con el linting:
- Se cambiaron las comillas simples a dobles para cumplir con las reglas de estilo
- Se ajustó la indentación para mantener consistencia
- Se agregaron comas finales (trailing commas) donde era necesario
- Se dividieron líneas largas para cumplir con el límite de 80 caracteres
- Se añadió la anotación eslint-disable-next-line no-unused-vars para la función isAdminRequest que aún no se está usando pero que se usará en funcionalidades futuras
- Se mejoraron los JSDoc para cumplir con las reglas de validación

✅ Paso 5: Prueba Local y Despliegue
Con este código, ya tienes tu primera Cloud Function lista. El siguiente paso es probarla en tu entorno local antes de desplegar.

Opción 1: Prueba local (necesita Java instalado)
Asegúrate de tener Java instalado en tu sistema para ejecutar los emuladores Firestore. Luego:

Abre tu terminal en la raíz de tu proyecto de Firebase.
Ejecuta los emuladores para probar la función:

Bash


firebase emulators:start --only functions,firestore
Una vez que los emuladores estén corriendo, la terminal te dará una URL local para la función getTours, similar a:
http://localhost:5001/[project-id]/us-central1/getTours

Copia esa URL y pégala en tu navegador o úsala con una herramienta como Postman para verificar que te devuelve los documentos de tours activos disponibles en Firestore.

Opción 2: Despliegue directo
Si no tienes Java instalado, puedes desplegar directamente a Firebase:

Bash


firebase deploy --only functions
Después del despliegue, la función estará disponible en una URL como:
https://[project-id].cloudfunctions.net/getTours

¿El resultado es correcto? Si es así, podemos continuar con las funciones de administración para crear y editar tours.






