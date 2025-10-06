Guía Consolidada de la Arquitectura Bilingüe "Nevado Trek" (MVP)
Este documento consolida la información de los tres archivos proporcionados: la versión inicial de la arquitectura backend, la explicación detallada con contexto, y la versión actualizada con soporte bilingüe completo. Se integra todo el contenido sin perder detalles, eliminando redundancias pero preservando explicaciones, ejemplos, estructuras de datos, flujos y razonamientos. El enfoque se mantiene en construir un MVP robusto sobre la capa gratuita de Firebase, ahora con soporte para inglés y español en el contenido textual.
1. Visión General y Pila Tecnológica
Este plan detalla la arquitectura para el MVP de "Nevado Trek", diseñada específicamente para operar dentro de la capa gratuita de Firebase. El objetivo es crear una API RESTful serverless que sea minimalista en consumo de recursos (lecturas/escrituras) y robusta en su funcionalidad.
Base de Datos: Cloud Firestore (NoSQL).
Backend (Lógica de Negocio): Firebase Cloud Functions (Node.js).
Autenticación:
Usuarios: Anónima (Firebase Anonymous Auth) para seguimiento temporal.
Administrador: Acceso mediante una Clave Secreta (Secret Key).
Los bloques de texto que parecen código son esquemas en formato JSON. No son para ejecutar, sino para representar la estructura de la información que guardaremos en nuestra base de datos Firestore. Imagina que Firestore es un gran archivador digital. El esquema define la organización de ese archivador:
Colecciones (tours, tourEvents, etc.): Son los cajones del archivador. Cada uno guarda un tipo específico de información.
Documentos (los bloques {...}): Son las fichas o expedientes dentro de cada cajón. Cada ficha representa un elemento único: un tour específico, un evento en una fecha concreta, una reserva, etc.
Esta organización es la base de todo el sistema. Si la base de datos está bien diseñada, el resto del código (las Cloud Functions) será mucho más simple y eficiente.
2. El Modelo de Datos: Adaptado para un Mundo Bilingüe
La estructura de la base de datos se ha refinado para reflejar la lógica de negocio, incorporando soporte completo para idiomas inglés (en) y español (es). La estrategia es simple: en lugar de tener un campo de texto, tendremos un objeto que contiene ambos idiomas. Esto asegura eficiencia al obtener todos los idiomas en una sola lectura de base de datos, fundamental para mantenernos dentro de la capa gratuita. La alternativa (documentos separados por idioma) duplicaría las lecturas y los costos.
Colección: tours (La Clave del Soporte Multi-idioma)
Es tu catálogo maestro de experiencias. Aquí no hay fechas ni reservas, solo la información "plantilla" de cada tour que ofreces. Si tienes 10 tours diferentes, tendrás 10 documentos en esta colección. Cada campo de texto se convierte en un pequeño diccionario bilingüe.
Propósito: Contener toda la información "plantilla" de cada tour, con su contenido textual disponible tanto en inglés (en) como en español (es). Esto centraliza el contenido y facilita la gestión, evitando inconsistencias.
Ejemplo de un documento de tour:
text
{
  "tourId": "nevado-del-tolima",
  "isActive": true,
  "name": {
    "es": "Nevado del Tolima",
    "en": "Tolima Snowy Peak"
  },
  "shortDescription": {
    "es": "Asciende a una de las cumbres más icónicas...",
    "en": "Ascend to one of the most iconic summits..."
  },
  "longDescription": {
    "es": "Una expedición de 4 días y 3 noches...",
    "en": "A 4-day, 3-night expedition..."
  },
  "details": [
    { 
      "label": { "es": "Temperatura", "en": "Temperature" },
      "value": { "es": "-15 Grados", "en": "-15 Degrees" }
    },
    { 
      "label": { "es": "Dificultad", "en": "Difficulty" },
      "value": { "es": "5/5 Difícil", "en": "5/5 Difficult" }
    }
  ],
  "itinerary": {
    "type": "byDay",
    "days": [
      {
        "day": 1,
        "title": { 
          "es": "Salento al Refugio de Montaña", 
          "en": "Salento to the Mountain Refuge"
        },
        "activities": [
          { "es": "Salida en Jeep...", "en": "Departure by Jeep..." },
          { "es": "Caminata de aclimatación...", "en": "Acclimatization hike..." }
        ]
      }
    ]
  },
  "inclusions": [
    { "es": "Guías de alta montaña", "en": "High mountain guides" },
    { "es": "Seguro contra todo riesgo", "en": "All-risk insurance" }
  ],
  "recommendations": [
    { "es": "Buena hidratación...", "en": "Good hydration..." }
  ],
  "faqs": [
    {
      "question": { "es": "¿Necesito experiencia?", "en": "Do I need experience?" },
      "answer": { "es": "No, pero sí una excelente condición física.", "en": "No, but you do need excellent physical condition." }
    }
  ],
  "pricingTiers": [ 
    { "pax": 1, "pricePerPerson": 950000 },
    { "pax": 2, "pricePerPerson": 850000 },
    { "pax": 3, "pricePerPerson": 800000 },
    { "pax": 4, "pricePerPerson": 780000 } // De 4 a 8
  ]
}
Campos Clave:
isActive: Un simple interruptor para que tú, como administrador, puedas "apagar" un tour y que no se muestre al público sin tener que borrarlo.
pricingTiers: Definimos la matriz de precios explícitamente para 1 persona, 2, 3 y el de 4 a 8. Esto hace que el cálculo posterior sea rápido y directo.
¿Por qué esta estructura?
Eficiencia: Al pedir la información de un tour, obtenemos todos los idiomas en una sola lectura. Simplicidad para el Frontend: La aplicación web o móvil solo tiene que elegir qué campo mostrar (e.g., si en español, tour.name.es; si en inglés, tour.name.en).
Flexibilidad: Si en el futuro quieres añadir un tercer idioma (ej. francés, fr), simplemente añade un nuevo campo a los objetos de texto, sin reestructurar la base de datos.
Colección: tourEvents (Reemplaza a scheduledTours)
Esta es la colección más importante y central para la lógica de reservas. No guarda tours, sino salidas o viajes específicos. Si el "Nevado del Tolima" sale el 12 de Diciembre y también el 18 de Diciembre, habrá dos documentos aquí, ambos apuntando al mismo tour del catálogo. ¡Esta es la clave para tu calendario!
Propósito: Un "evento" es una instancia de un tour en una fecha específica.
Ejemplo de documento:
text
{
  "eventId": "unique_event_id",
  "tourId": "nevado-del-tolima",
  "tourName": "Nevado del Tolima", // Denormalizado para optimizar lecturas
  "startDate": "2025-12-12T07:00:00Z",
  "endDate": "2025-12-15T18:00:00Z",
  "maxCapacity": 8, // Límite máximo
  "bookedSlots": 1,
  "type": "private", // "private" o "public"
  "status": "active" // "active", "full", "completed", "cancelled"
}
Campos Clave:
type: "private" | "public": Este es el interruptor mágico que resuelve tu lógica. Cuando alguien hace una reserva para una fecha nueva, se crea un evento private. Solo tú y esa persona saben que existe. Si hablas con el cliente y te da el "OK", tú como admin cambias este campo a public. ¡Listo! El evento ahora aparece en el calendario público para que más gente se una.
bookedSlots: Un contador en tiempo real de cuántas personas se han inscrito en este evento específico. Es fundamental para calcular los precios dinámicos y saber cuándo se llena el cupo.
No necesita cambios para bilingüe, ya que almacena datos operativos (fechas, cupos) que no se presentan directamente al usuario en diferentes idiomas.
Colección: bookings
Propósito: Aquí se registra cada reserva individual, sea de una persona o de un grupo pequeño que reserva junto. Cada vez que alguien pulsa "Reservar", se crea un nuevo documento aquí. Se amplía para incluir los datos del cliente y un historial de estados.
Ejemplo de documento:
text
{
  "bookingId": "unique_booking_id",
  "eventId": "unique_event_id", // Referencia al evento
  "tourId": "nevado-del-tolima",
  "tourName": "Nevado del Tolima", // Denormalizado
  "customer": {
    "fullName": "Ana Rodríguez",
    "documentId": "CC 123456789",
    "phone": "+34 600123456",
    "email": "ana.r@email.com",
    "notes": "Alergia a los frutos secos."
  },
  "pax": 1, // Pasajeros en esta reserva específica
  "pricePerPerson": 950000,
  "totalPrice": 950000,
  "bookingDate": "2025-10-06T18:00:00Z",
  "status": "pending", // "pending", "confirmed", "paid", "cancelled"
  "isEventOrigin": true // Indica si esta reserva creó el evento
}
Campos Clave:
eventId: El enlace directo al evento específico al que pertenece esta reserva.
customer: Un objeto que agrupa toda la información del cliente que necesitas (nombre, teléfono, documento, etc.).
status: El estado de la reserva (pending, confirmed, etc.). Te permite a ti, como admin, gestionar el flujo de trabajo: recibes la reserva en pending, hablas con el cliente, confirmas el pago y la cambias a confirmed.
isEventOrigin: Una bandera booleana (true/false). Nos dice si esta reserva fue la que creó el tourEvent. Es muy útil para saber quién fue el "pionero" del grupo.
No necesita cambios para bilingüe, ya que opera sobre datos no textuales.
Colección: rateLimiter (Tu Guarda de Seguridad Anti-Spam)
Propósito: Como no tienes un sistema de login de usuarios, no podemos bloquear a un "usuario" malicioso. En su lugar, usamos su dirección IP. Esta colección es un registro simple.
Ejemplo de documento:
text
{
  "ipAddress": "192.168.1.1",
  "lastBookingTimestamp": "2025-10-06T18:01:00Z"
}
Cómo funciona: Cuando alguien con la IP 123.45.67.89 hace una reserva, guardamos su IP y la hora. Si esa misma IP intenta hacer otra reserva 10 segundos después, nuestra Cloud Function revisará esta colección, vera que es demasiado pronto y rechazará la solicitud. Es una medida de seguridad simple pero efectiva y, lo más importante, gratuita de implementar.
No necesita cambios para bilingüe.
3. La Lógica y los Flujos (Cloud Functions)
Las Cloud Functions son el "cerebro" del sistema que opera sobre los datos. Son pequeños programas que se ejecutan en la nube de Firebase cada vez que se les llama. El "cerebro" apenas necesita ajustes para el bilingüe.
Flujo de Cara al Usuario (Leer Información):
El frontend (tu página web) le pregunta al backend (Cloud Functions) por la información del tour "Nevado del Tolima".
La Cloud Function lee el documento completo del tour (con ambos idiomas dentro) de Firestore y se lo devuelve al frontend.
El frontend se encarga de mostrar los textos en el idioma que el usuario haya seleccionado en la página.
Flujo de Reservas (createBooking y joinEvent):
Sin cambios significativos. La lógica para crear eventos, calcular precios dinámicos y actualizar cupos no depende del idioma del contenido, por lo que sigue funcionando exactamente como lo planeamos.
Flujo 1: La Reserva Inicial (Privada)
Usuario: Elige el "Nevado del Tolima" y selecciona una fecha que no está en el calendario público, para 2 personas.
Frontend: Llama a la Cloud Function createBooking.
Cloud Function createBooking:
Revisa la IP en rateLimiter. ¿Todo en orden? Continúa.
Crea un nuevo tourEvent con type: "private" y bookedSlots: 2.
Crea una nueva booking para 2 personas, con status: "pending".
Actualiza el rateLimiter con la IP del usuario.
Tú recibes una notificación (manual) y contactas al cliente.
Flujo 2: Conversión a Evento Público (Admin)
El administrador contacta al cliente y obtiene permiso para abrir el grupo.
Cloud Function publishEvent (Admin):
El admin llama a esta función con el eventId.
La función cambia el campo type del tourEvent de "private" a "public".
Ahora, este evento será visible en el frontend para que otros se unan.
Flujo 3: La Magia del Precio Dinámico (Unirse a un Evento Público)
Contexto: Ya existe un evento público para el "Nevado del Tolima" con bookedSlots: 2.
Nuevo Usuario: Ve el evento en el calendario y quiere unirse él solo (1 persona). El frontend le muestra el precio para un grupo de 3 personas (los 2 que ya están + él).
Frontend: Llama a la Cloud Function joinEvent.
Cloud Function joinEvent:
Revisa el rateLimiter. ¿Todo OK? Sigue.
Lee el tourEvent y ve que bookedSlots es 2.
Calcula el nuevo total: 2 (actual) + 1 (nuevo) = 3.
Busca en los pricingTiers del tour y encuentra el precio para pax: 3.
Crea la nueva booking para 1 persona, pero con el precio reducido de un grupo de 3.
Actualiza atómicamente el tourEvent, estableciendo bookedSlots a 3. Esto es crucial para que el próximo que entre vea el precio para un grupo de 4.
Verificación de Cupo: Asegura que newTotalSlots no exceda maxCapacity.
Si los cupos se llenan, cambia el status a "full".
Lógica de Cancelación: Si el estado cambia a cancelled, la función debe decrementar bookedSlots en el tourEvent asociado.
4. Tu Panel de Control Bilingüe
Para tu panel de administrador, no necesitas un sistema de login complejo. La Llave Maestra (X-Admin-Secret-Key) es simplemente una contraseña larga y secreta que solo tú conoces. Tu aplicación de administrador enviará esta "llave" con cada petición. Las Cloud Functions de admin lo primero que harán es verificar si la llave es correcta. Si no lo es, rechazan la petición. Es una forma segura y sencilla para un MVP.
El admin interactuará con un conjunto de Cloud Functions protegidas por una clave secreta. Autenticación: Cada llamada a una función de admin debe incluir un header X-Admin-Secret-Key. La función validará esta clave antes de ejecutar cualquier lógica.
Gestión de Tours:
Al crear o editar un tour, tu panel de control ahora deberá mostrarte campos de texto para ambos idiomas, lado a lado. Por ejemplo, un campo para "Nombre (Español)" y otro para "Nombre (Inglés)".
Cuando guardes los cambios, la Cloud Function (POST /admin/tours o PUT /admin/tours/:tourId) esperará recibir el objeto completo con la estructura bilingüe que definimos arriba.
Endpoints:
GET /admin/tours: Devuelve la lista de todos los tours.
POST /admin/tours: Crea un nuevo tour.
PUT /admin/tours/:tourId: Actualiza un tour existente.
DELETE /admin/tours/:tourId: Elimina un tour.
Gestión de Reservas y Calendario:
Sin cambios. La gestión de reservas, estados, cupos y el calendario se mantiene igual, ya que opera sobre los datos no textuales.
Endpoints:
GET /admin/bookings: Lista todas las reservas con filtros (por fecha, por estado).
GET /admin/bookings/:bookingId: Obtiene los detalles de una reserva.
PUT /admin/bookings/:bookingId/status: Cambia el estado de una reserva (pending -> confirmed, etc.).
PUT /admin/bookings/:bookingId/details: Actualiza los datos del cliente.
Gestión de Eventos:
GET /admin/events/calendar: Devuelve todos los eventos (tourEvents) en un rango de fechas para pintar el calendario.
POST /admin/events/:eventId/publish: Cambia un evento de private a public.
Los Endpoints son las diferentes "puertas" que tu panel puede tocar para pedir o modificar información (/admin/tours, /admin/bookings, etc.). Cada una activa una Cloud Function específica que hace el trabajo.
5. Optimizaciones para la Capa Gratuita
Denormalización: Como se ve en el modelo, datos como tourName se duplican en tourEvents y bookings. Esto aumenta ligeramente el costo de escritura pero reduce drásticamente las lecturas, que suelen ser más costosas y frecuentes (especialmente para listar reservas en el admin panel).
Lecturas Mínimas: Las funciones están diseñadas para realizar el mínimo de lecturas necesarias. Por ejemplo, al unirse a un evento, solo se lee 1 tourEvent y 1 tour.
Operaciones Atómicas: Usar transacciones y operaciones increment de Firestore para actualizar cupos de forma segura y eficiente, evitando condiciones de carrera sin necesidad de múltiples lecturas.
Sin Notificaciones Automáticas: Se omite el uso de servicios de correo (que tienen costo) en este MVP. Toda la comunicación es manual.
Verificación Anti-Spam: Consulta la colección rateLimiter. Si la IP del usuario ha reservado hace poco (ej: < 5 minutos), deniega la solicitud.
6. Conclusión: Una Arquitectura Robusta y Global
Como puedes ver, este diseño no es genérico. Está pensado y optimizado para tus reglas de negocio específicas: la dualidad privado/público, la compleja lógica de precios dinámicos y la necesidad de operar sin costo inicial. Cada pieza, desde la estructura de datos hasta la lógica de las funciones, está diseñada para ser eficiente, minimizar las operaciones de lectura/escritura y darte el control total que necesitas como administrador.
Al integrar el soporte multi-idioma de esta manera:
Mantenemos la Eficiencia: Respetamos la restricción más importante: minimizar las lecturas de Firestore para permanecer en la capa gratuita.
Centralizamos el Contenido: Toda la información de un tour, en todos sus idiomas, vive en un único lugar. Esto facilita la gestión y evita inconsistencias.
Somos Flexibles: Si en el futuro quieres añadir un tercer idioma, simplemente tendrías que añadir un nuevo campo a los objetos de texto, sin necesidad de reestructurar toda la base de datos.
Este ajuste hace que la arquitectura sea mucho más completa y esté preparada para un público internacional, sin sacrificar el rendimiento ni la simplicidad de la lógica central que ya habíamos diseñado. Este plan de acción te proporciona una base sólida y optimizada. Responde a toda la complejidad que planteaste y está diseñado para ser implementado eficientemente sobre la infraestructura de Firebase.
