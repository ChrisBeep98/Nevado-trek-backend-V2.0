plan general para construir el MVP de "Nevado Trek" y ubicar nuestro progreso actual. El objetivo es una 

API RESTful serverless, bilingüe y optimizada para la capa gratuita de Firebase.


Plan Consolidado del Proyecto "Nevado Trek" MVP 🗺️
Este plan se basa en la arquitectura definida, que utiliza 

Firebase Cloud Functions para la lógica de negocio y Cloud Firestore como base de datos bilingüe.

Fase 0: Configuración y Modelo de Datos (Completada ✅)
Tarea	Estado	Observaciones
Inicializar Proyecto Firebase	✅ Completada	Proyecto creado, CLI y dependencias instaladas.
Definir Modelo de Datos	✅ Completada	
Se definieron las colecciones clave: 

tours, tourEvents, bookings, rateLimiter.




Implementar Estructura Bilingüe	✅ Completada	
El modelo 

tours usa objetos {es: "...", en: "..."} para todo el contenido textual.

Crear Datos de Prueba	✅ Completada	
Documentos de ejemplo en la colección 

tours (ej. "Nevado del Tolima") .


Exportar a Hojas de cálculo
Fase 1: Endpoints de Lectura y Administración (En Curso 🛠️)
El enfoque aquí es exponer el contenido al público y crear las herramientas de gestión para el administrador.

Tarea	Estado	Observaciones
1.1. Leer Tours (Público)	✅ Completada	
Implementación de GET /tours (getToursList). Devuelve el catálogo activo y bilingüe .


1.2. Crear Tours (Admin)	✅ Completada	
Implementación de POST /admin/tours (adminCreateTour). Protegida con 

X-Admin-Secret-Key.



1.3. Leer Tour Específico (Público)	⬜ Pendiente	GET /tours/:tourId. Necesario para la página de detalles de un tour.
1.4. Actualizar Tour (Admin)	⬜ Pendiente	
PUT /admin/tours/:tourId. Para editar descripciones, precios y el estado 

isActive.


1.5. Eliminar Tour (Admin)	⬜ Pendiente		
DELETE /admin/tours/:tourId.


Fase 2: Lógica de Reservas (Núcleo del Negocio ⚙️)
Esta es la fase más compleja, que implementa la lógica de precios dinámicos, eventos privados/públicos, y el sistema anti-spam.

Tarea	Estado	Observaciones
2.1. Validar Anti-Spam	⬜ Pendiente	
Lógica de 

rateLimiter .


2.2. Flujo 1: Reserva Inicial	⬜ Pendiente	
Implementación de createBooking. Crea un 

tourEvent con type: private y la booking asociada .

2.3. Lógica de Calendario (Público)	⬜ Pendiente	
GET /tourEvents. Devuelve solo los eventos con 

type: public y status: active.

2.4. Flujo 2: Unirse a Evento	⬜ Pendiente	
Implementación de joinEvent. Lógica de 

precio dinámico y actualización atómica del bookedSlots .


2.5. Flujo 3: Publicar Evento (Admin)	⬜ Pendiente	
POST /admin/events/:eventId/publish. Cambia el evento de 

private a public .



Fase 3: Gestión de Reservas y Finalización (Control Total 🔒)
El último paso para el administrador y optimizaciones de infraestructura.

Tarea	Estado	Observaciones
3.1. Gestionar Reservas (Admin)	⬜ Pendiente		
GET /admin/bookings, PUT /admin/bookings/:bookingId/status, etc. .

3.2. Gestión de Eventos (Admin)	⬜ Pendiente		
GET /admin/events/calendar para el panel de fechas.

3.3. Actualizar Reglas de Seguridad	⬜ Pendiente	Configurar firestore.rules para asegurar que solo las Cloud Functions escriban en colecciones clave (tourEvents, bookings).
3.4. Refinar Denormalización	⬜ Pendiente	
Asegurar que 

tourName y otros datos denormalizados se manejen correctamente en las escrituras.





¿Dónde Estamos Ahora? 📍
Hemos completado la base del manejo de contenido (crear y leer tours).

El siguiente paso más lógico es terminar el módulo de gestión de tours, lo cual significa implementar la función para actualizar un tour existente (PUT /admin/tours/:tourId). Esto es vital para el día a día, ya que permitirá al administrador corregir errores en las descripciones bilingües, ajustar precios o cambiar el estado de un tour de 

isActive: true a false.


Siguiente Paso Sugerido: Implementar PUT /admin/tours/:tourId para actualizar tours. ¿Estás de acuerdo en seguir con las funciones de administración?


Fuentes






