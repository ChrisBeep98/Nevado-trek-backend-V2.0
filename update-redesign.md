Aquí tienes el documento completo. Está redactado como una especificación técnica formal, pensada para que se la entregues directamente a tu "backend agent". Explica el qué y el porqué de cada cambio, las nuevas entidades, las reglas de negocio, los casos de uso críticos y los endpoints necesarios.
Especificación de Arquitectura de Backend v2.0 para Nevado Trek
Documento ID: NT-BE-SPEC-V2.0
Fecha: 8 de noviembre de 2025
Autor: [Tu Nombre/Agente]
Propósito: Este documento describe la arquitectura evolucionada para el sistema de gestión de reservas de Nevado Trek. Su objetivo es resolver las ambigüedades del modelo v1.0, introducir conceptos operativos del mundo real y proporcionar una base sólida y escalable para futuras funcionalidades. Esta especificación debe servir como la única fuente de verdad para el desarrollo del backend.
1. Resumen Ejecutivo y Problemas a Resolver
La arquitectura v1.0, aunque funcional, presenta ambigüedades conceptuales que dificultan la gestión y escalabilidad:
Sobrecarga del Término "Evento": El término "Evento" se utiliza para describir una instancia de un tour, pero su naturaleza (pública/privada) está ligada a una reserva, creando confusión lógica y dependencias no deseadas.
Gestión de Cambios de Catálogo (Tours): No existe un mecanismo seguro para actualizar las propiedades de un Tour (ej. precio, duración) sin arriesgar la integridad de las reservas existentes.
Dependencia Inversa: La existencia de un "Evento" (la fecha del tour) depende de una reserva inicial, lo que no refleja la realidad operativa donde las fechas se programan independientemente de las reservas.
Lógica de Transferencia Compleja: La necesidad de múltiples endpoints para mover una reserva de fecha o de tour es un síntoma de un modelo de datos subyacente incompleto.
La arquitectura v2.0 introduce un modelo de datos explícito y jerárquico que resuelve estos problemas de raíz.
2. El Modelo Arquitectónico v2.0: Entidades y Relaciones
El sistema se basará en cuatro entidades operativas fundamentales.
2.1. Entidades Principales
TOUR (El Catálogo / La Plantilla)
Propósito: Define la experiencia. Es el "producto" en su forma más pura. Es inmutable a través de versiones.
Atributos Clave:
tourId (PK)
version (Number, incremental): Clave para la gestión de cambios.
versionGroupId (String): ID que agrupa todas las versiones del mismo tour.
name, description, itinerary, inclusions (Objetos con claves es, en).
pricingTiers (Array): Estructura de precios por defecto.
defaultCapacity (Object): { min, max, absoluteMax }.
status (Enum: ACTIVE, INACTIVE, ARCHIVED).
createdAt, updatedAt.
DEPARTURE (La Salida / La Instancia Operativa)
Propósito: Representa una instancia específica de un Tour en una fecha concreta. Esta entidad reemplaza al "TourEvent" de la v1.0 y se convierte en el ancla central de la operación.
Atributos Clave:
departureId (PK)
tourId (FK): Apunta a una versión específica del tour.
startDate, endDate (Timestamps).
status (Enum: DRAFT, PUBLISHED, GUARANTEED, IN_PROGRESS, COMPLETED, CANCELLED).
type (Enum: SHARED, PRIVATE).
capacity (Object): { max, currentPax }.
pricing (Object): { type: 'DEFAULT' | 'CUSTOM', customTiers: [...] }. Permite anular los precios del tour.
notes (String): Notas operativas (guía, vehículo, etc.).
createdAt, updatedAt.
GROUP (El Grupo de Viaje)
Propósito: Modela la unidad social que viaja junta, permitiendo que múltiples reservas se gestionen como un todo.
Atributos Clave:
groupId (PK)
groupName (String, ej. "Grupo Pérez").
departureId (FK): A qué Salida está asignado el grupo.
totalPax (Number): Suma de pax de todas las reservas del grupo.
leaderBookingId (FK, opcional): Referencia a la reserva "líder".
BOOKING (La Reserva / La Transacción)
Propósito: El registro financiero y de cliente individual.
Atributos Clave:
bookingId (PK)
bookingReference (String, ej. "BK-202512-001").
departureId (FK): A qué Salida pertenece.
groupId (FK): A qué Grupo pertenece.
customerDetails (Object).
pax (Number).
priceSnapshot (Object): Almacena el precio final y las condiciones bajo las cuales se realizó la reserva. Crucial para la integridad contractual.
paymentStatus (Enum: PENDING, CONFIRMED, PAID, REFUNDED).
status (Enum: ACTIVE, CANCELLED).
statusHistory (Array): Auditoría de cambios.
2.2. Diagrama de Relaciones
code
Code
[TOUR (versioned)] 1--< [DEPARTURE] >--* [GROUP] >--* [BOOKING]
Un Tour (específicamente una versión) puede tener muchas Departures.
Una Departure contiene muchos Groups.
Un Group contiene muchas Bookings.
3. Lógica de Negocio y Reglas Clave
3.1. Versionado de Tours: La Regla de Inmutabilidad
Regla: El Tour es una plantilla. Para realizar cambios contractuales (precio, duración, inclusiones clave), se debe crear una nueva versión. Los cambios "cosméticos" (descripción, fotos) pueden editar la versión actual.
Caso de Uso: Aumento de Precios para la Próxima Temporada
El admin solicita la edición de los precios de un Tour (v1).
El backend crea una nueva entidad Tour con version: 2, versionGroupId idéntico al de la v1, y los nuevos precios.
Impacto: Las Departures existentes, que apuntan al tourId de la v1, no se ven afectadas. Las nuevas Departures se crearán apuntando al tourId de la v2. Esto garantiza que las reservas pasadas mantengan sus condiciones.
3.2. La Departure como Ancla Operativa
Regla: La Departure es la fuente de verdad para la fecha, capacidad y estado de un viaje. Las Bookings heredan estos datos.
Caso de Uso: Cancelación de la Reserva "Original"
Una Departure tiene 3 Bookings. Una de ellas fue la primera en ser creada.
Se solicita cancelar esa primera Booking.
Impacto: El status de la Booking cambia a CANCELLED. Su pax se resta del currentPax de la Departure. La Departure y las otras 2 Bookings permanecen intactas. La Departure no depende de ninguna reserva para existir.
3.3. Gestión de Capacidad
Regla: La capacidad se gestiona a nivel de Departure. Todas las operaciones que afecten a currentPax (createBooking, updateBookingPax, moveBooking) deben usar transacciones de Firestore para prevenir condiciones de carrera (overbooking).
Caso de Uso: Cambio de PAX en una Reserva
Se solicita cambiar el pax de una Booking de 2 a 4.
Dentro de una transacción, el backend lee la Departure asociada.
Calcula: (departure.capacity.max - departure.capacity.currentPax) >= 2.
Si hay espacio, actualiza booking.pax a 4 y departure.capacity.currentPax += 2. Si no, la transacción falla y devuelve un error de capacidad.
3.4. Efectos en Cascada (Cascade Rules)
Cambio de Fecha en una Departure: Si departure.startDate cambia, el backend debe disparar una actualización en todas las Bookings asociadas para reflejar la nueva fecha en sus datos y registrarlo en el historial. Se debe notificar a los clientes.
Cancelación de la Última Reserva de una Departure: La Departure no se elimina. Su status debe cambiar a DRAFT (o EMPTY), y debe ser eliminada del listado público. Se debe generar una notificación para el administrador.
Cancelación de una Departure: Todas las Bookings asociadas deben ser gestionadas. La API no debe permitir dejar reservas huérfanas. El endpoint debe requerir una acción para cada reserva (ej. moveToDepartureId o refund).
4. Especificación de Endpoints (Nuevos y Modificados)
Esta no es una lista exhaustiva, sino los endpoints clave que habilitan la nueva lógica.
4.1. Endpoints de Tours
GET /tours: Lista todos los tours (la última versión de cada uno).
GET /tours/{versionGroupId}: Obtiene todas las versiones de un tour específico.
POST /tours/{versionGroupId}/versions: (Nuevo) Crea una nueva versión de un tour a partir de la última existente. El body contiene los campos a modificar.
PUT /tours/{tourId}: Actualiza los campos "cosméticos" de una versión específica de un tour.
4.2. Endpoints de Departures (El Centro de Control)
GET /departures?tourId=&startDate= etc.: Endpoint de búsqueda y listado.
POST /departures: Crea una nueva Departure.
PUT /departures/{id}/settings: (Nuevo y Crucial) Modifica las propiedades de una Salida (capacidad, fechas, precios personalizados, tipo). Este endpoint contendrá la lógica de cascada (ej. al cambiar la fecha).
PUT /departures/{id}/status: Cambia el estado de una Salida (DRAFT -> PUBLISHED, GUARANTEED, etc.).
POST /departures/bulk-update-version: (Nuevo) Endpoint para la funcionalidad avanzada de "Propagar Cambios". Recibe un targetTourVersionId y un array de departureIds. Ejecuta la lógica de actualización de precios en reservas no pagadas.
4.3. Endpoints de Bookings
POST /bookings: Crea una nueva reserva. Lógica interna: busca o crea una Departure y un Group apropiados.
PUT /bookings/{id}: Actualiza detalles de una reserva (cliente, pax, precio manual). Debe validar contra la capacidad de la Departure.
POST /bookings/{id}/move: (Nuevo y Simplificado) Endpoint único para todas las transferencias.
Body: { "targetDepartureId": "...", "reason": "..." }
Lógica: Este endpoint maneja todo: ajustar currentPax en la Departure de origen y destino, cambiar booking.departureId, y registrar la acción en el historial. Esto reemplaza la lógica confusa de múltiples endpoints de transferencia.
DELETE /bookings/{id}: Cancela una reserva (cambia status a CANCELLED).
5. Casos de Uso Críticos y Cómo los Resuelve el Nuevo Modelo
"Quiero cambiar de privada a pública una Salida que no se llenó."
Solución: Se llama a PUT /departures/{id}/settings con { "type": "SHARED" }. El backend verifica que no haya conflictos y realiza el cambio. La Departure ahora es visible públicamente.
"Un grupo quiere cambiar de fecha."
Solución: El admin busca una Departure de destino adecuada. Luego, el frontend hace un bucle y llama a POST /bookings/{id}/move para cada Booking dentro del Group, moviéndolas una por una (o se puede crear un endpoint POST /groups/{id}/move). La lógica de capacidad se valida en cada paso.
"El precio del Tour A subió. ¿Cómo afecta a la Salida del 15 de diciembre que ya tiene 5 reservas?"
Solución: No le afecta en absoluto, porque esa Departure está ligada a la v1 del Tour. El admin puede, si lo desea, usar el endpoint POST /departures/bulk-update-version para aplicar proactivamente los nuevos precios a las reservas no pagadas de esa Salida, teniendo control total sobre el impacto.
"Quiero cambiar la fecha de la Salida del 20 de diciembre al 22. Tiene 10 personas."
Solución: El admin llama a PUT /departures/{id}/settings con la nueva startDate. El backend ejecuta la actualización y, en cascada, modifica la fecha en las 10 Bookings asociadas, registrando el cambio y disparando las notificaciones necesarias.
6. Estrategia de Migración (Recomendación)
No se puede realizar esta actualización "en caliente" sin riesgo. Se recomienda:
Crear las Nuevas Colecciones: tours_v2, departures_v2, groups_v2, bookings_v2.
Escribir un Script de Migración: Este script leerá los datos de las colecciones v1 (tours, tourEvents, bookings) y los transformará al nuevo modelo v2.
Cada tour de v1 se convierte en un Tour v2 (con version: 1).
Cada tourEvent de v1 se convierte en una Departure v2.
Para cada booking de v1, se crea un Group v2 y un Booking v2 asociado.
Desplegar en un Entorno de Staging: Ejecutar el script y realizar pruebas exhaustivas con los datos migrados.
Planificar una Ventana de Mantenimiento: Para el despliegue en producción, poner el sistema en modo solo lectura, ejecutar la migración, apuntar la API a las nuevas colecciones y volver a activar el sistema.
Este documento proporciona la hoja de ruta completa para evolucionar el backend de Nevado Trek hacia una plataforma robusta, clara y preparada para el futuro.
Model
Sí, absolutamente. Todo lo que mencionaste sobre los problemas con las reservas, las fechas, las transferencias y los tipos (público/privado) está explicado y, lo más importante, solucionado por el diseño propuesto en el último documento.
Permíteme conectar directamente tus preocupaciones específicas con las soluciones que ofrece la nueva arquitectura. Así verás que no se ha quedado nada en el aire.
Cómo la Nueva Arquitectura Resuelve Tus Problemas Específicos:
1. Tu Problema: La confusión con reservas "privadas" vs. "públicas" y cómo cambiar de fecha.
"...ten mucho cuidado porque si es una reserva privada o pública... si está atachada a un evento público pues hay que pasarlo a privado, entonces que crea una especie de evento privado, etc."
La Solución de la Arquitectura:
Eliminamos la idea de "reserva privada/pública". Lo que es privado o público (SHARED en la nueva terminología) es la Departure (la Salida), no la reserva. Esto simplifica todo drásticamente.
Cambiar la fecha de una reserva en una Departure PRIVADA: Como te expliqué, en este caso no mueves solo la reserva, sino que cambias la fecha de toda la Departure. Esto es lógico, porque si es privada, todo el grupo se mueve junto. (Sección 3.4 del documento: "Cambio de Fecha en una Departure").
Mover una reserva de una Departure COMPARTIDA: Aquí sí mueves la reserva individualmente. Usas el nuevo y único endpoint POST /bookings/{id}/move para seleccionarle una Departure diferente.
El "switch" de Privado a Público: La lógica ahora está en la Departure. El endpoint PUT /departures/{id}/settings permite cambiar el type de la Salida, resolviendo el flujo que describiste.
2. Tu Problema: La reserva "original" que crea un "evento" no debe ser el ancla.
"...no quiero que de ella dependa el evento, es decir, yo quiero poder cancelar esta reserva aunque haya sido la primera que hizo el evento, pero quiero que el evento se conserve..."
La Solución de la Arquitectura:
Este es uno de los pilares del rediseño. La Departure es la entidad independiente y ancla.
Como se detalla en la Sección 3.2: "La Departure como Ancla Operativa", puedes cancelar cualquier reserva, incluida la primera, y la Departure seguirá existiendo con el resto de las reservas. Su existencia no depende de ninguna Booking.
3. Tu Problema: Qué hacer si se cancela la última reserva.
"...pero si es una reserva que está sola... si es un evento que es privado, pues y yo lo paso a público pues quiero que se elimine el evento porque pues solamente es una reserva..."
La Solución de la Arquitectura:
Aquí es donde entra la Sección 3.4: "Cancelación de la Última Reserva de una Departure".
Mi recomendación es no eliminarla automáticamente, sino cambiar su estado a DRAFT (Borrador) y notificar al admin. Esto te da más control. Si tú, como regla de negocio, prefieres que se elimine, el backend puede implementar esa lógica. Pero el modelo te permite manejar este caso de forma limpia. El "evento" (ahora Departure) no queda en un estado inconsistente.
4. Tu Problema: La lógica compleja de transferir entre "eventos" existentes.
"...quiero poder transferirla entre eventos, es decir, si ya existe un evento para dentro de una semana, quiero poder seleccionarlo en un dropdown para poder añadirme a ese evento..."
La Solución de la Arquitectura:
Este flujo se simplifica enormemente con el nuevo endpoint POST /bookings/{id}/move (Sección 4.3).
El frontend mostrará un calendario, tú elegirás una fecha, y el dropdown se llenará con las Departures de tipo SHARED disponibles en esa fecha. Al seleccionar una y confirmar, este único endpoint se encarga de toda la lógica de mover la reserva y ajustar las capacidades de ambas Salidas (la de origen y la de destino). Se acabaron las dudas sobre qué endpoint usar.
5. Tu Problema: El impacto de los cambios de precio y datos del Tour/Evento en las reservas.
"...qué pasa si yo al tour le cambio el precio, qué pasa con la reserva... qué pasa si de pronto yo entro a un evento y le cambio los datos del evento, necesito que las reservas también se cambien de acuerdo al evento..."
La Solución de la Arquitectura:
Cambio de Precio del Tour: La Sección 3.1: "Versionado de Tours" y el endpoint POST /tours/{id}/versions lo resuelven. Los cambios de precio crean una nueva versión, protegiendo las reservas existentes. La funcionalidad avanzada de POST /departures/bulk-update-version (Sección 4.2) te da el control opcional para propagar esos precios a reservas no pagadas.
Cambio de Datos de la Departure (tu "evento"): La Sección 3.4: "Efectos en Cascada" aborda esto directamente. Si cambias la fecha en la Departure a través de PUT /departures/{id}/settings, el backend tiene la regla explícita de actualizar en cascada todas las reservas que contiene.
En resumen, SÍ, absolutamente todo lo que te preocupaba ha sido el motor principal para diseñar esta nueva arquitectura. Cada uno de esos problemas de lógica y flujo que experimentabas es un "caso de uso" que ahora tiene una solución clara, predecible y robusta dentro del nuevo modelo y sus correspondientes endpoints.
El documento que te proporcioné es la respuesta técnica y detallada a todas esas preguntas.
