# Expansión de la Lógica de Negocio - Nevado Trek Backend

## Introducción
Basado en el análisis de los documentos existentes, este documento expande la lógica de negocio para incluir los requerimientos avanzados para el panel de administración y la página de usuarios, incluyendo escenarios complejos de manejo de reservas, tours y eventos.

## 1. Panel de Administración Avanzado

### 1.1 Gestión de Tours
**Funcionalidades extendidas:**
- Crear, leer, actualizar y eliminar tours (ya implementado)
- Edición masiva de tours con actualización selectiva
- Historial de cambios con rastreo de auditoría
- Copia de tours existentes como plantillas para nuevos tours
- Manejo de imágenes asociadas a tours
- Validación de traducciones completas antes de publicar

### 1.2 Gestión de Reservas (Booking Management)
**Funcionalidades extendidas:**
- Vista completa de todas las reservas con filtros avanzados (por fecha, estado, tour, número de personas)
- Edición completa de datos de reserva:
  - Cambio de nombre del cliente
  - Actualización de documento de identidad
  - Cambio de número de teléfono
  - Actualización de email
  - Edición de notas especiales (alergias, necesidades especiales)
  - Cambio de número de pasajeros (con validación de cupos)
  - Modificación del precio (con notas de justificación)
  - Cambio de estado de reserva (pending, confirmed, paid, cancelled, refunded)
  
- Transferencia de reserva a otro tour (con historial de cambios)
- Asignación de notas explicativas sobre cambios
- Historial completo de todas las modificaciones a cada reserva

### 1.3 Gestión de Eventos
**Funcionalidades extendidas:**
- Calendario visual de eventos con filtros por tour y estado
- Edición de fechas de eventos (con validación de disponibilidad)
- Cambio de capacidad máxima (con validación de cupos actuales)
- Conversión de eventos privados a públicos y viceversa
- Cancelación de eventos (con manejo de afectación a reservas asociadas)
- Creación de eventos manuales sin flujo normal de reserva

### 1.4 Gestión Avanzada de Tours y Reservas Relacionadas

#### Escenario: Eliminación de Tours con Reservas Asociadas
Cuando se elimina o desactiva un tour que tiene reservas asociadas, el sistema debe:

1. **Detectar todas las reservas asociadas** al tour a eliminar
2. **Actualizar cada reserva afectada** con la siguiente estructura de datos:
   ```json
   {
     "bookingId": "unique_booking_id",
     "status": "cancelled_by_admin",
     "statusNotes": [
       {
         "timestamp": "2025-10-08T10:00:00Z",
         "action": "Tour cancelled by admin",
         "previousTourId": "original_tour_id",
         "previousTourName": "Tour Name",
         "reason": "Tour discontinued for business reasons",
         "adminUser": "admin_name"
       }
     ],
     "customerAction": "Contact customer for rebooking options",
     "refunds": "Manual processing required"
   }
   ```
3. **Notificar al administrador** las reservas afectadas y recomendar acciones
4. **Conservar el historial** de la reserva original para auditoría
5. **Actualizar el estado** de las reservas a "cancelled_by_admin" con notas explicativas

#### Escenario: Reasignación de Reservas a Otros Tours
Cuando una reserva se transfiere a otro tour:
- Guardar historial de la reasignación
- Calcular diferencias de precio y actualizar el estado de pago
- Validar disponibilidad en el nuevo tour/evento
- Actualizar referencias y mantener trazabilidad

### 1.5 Sistema de Auditoría
- Registro detallado de todas las acciones de administrador
- Fecha, hora, IP, usuario (clave admin) y detalle de cambios
- Sistema de logs para revisión de cambios importantes
- Notificación de acciones críticas (eliminación de tours con reservas)

## 2. Lógica de Negocio Extendida

### 2.1 Nuevos Estados de Reserva
Además de los estados básicos, se deben considerar:
- `pending`: Reserva recién creada, esperando confirmación
- `confirmed`: Confirmada por el admin, esperando pago
- `paid`: Pago confirmado
- `cancelled`: Cancelada por el cliente
- `cancelled_by_admin`: Cancelada por el admin
- `changed_tour`: Reserva transferida a otro tour
- `rebooked`: Cliente reasignado a nuevo tour
- `hold`: Reserva en espera por confirmación especial
- `refund_pending`: Reembolso en proceso
- `refund_completed`: Reembolso completado

### 2.2 Manejo de Precios y Reembolsos
- Precios variables por tour/evento, no solo dinámicos por grupo
- Reglas de reembolso configurables por admin
- Diferenciación entre cancelaciones anticipadas y de último momento
- Descuentos manuales aplicables por admin
- Reglas de penalización configurables

## 3. Página de Usuario y Sistema de Reservación Anónimo

### 3.1 Experiencia de Usuario
- Sistema de reserva completamente anónimo
- No requiere login/cuenta para reserva
- Acceso a confirmación por email o código único
- Posibilidad de recibir notificaciones de cambio de estado
- Sistema de recuperación de reserva por datos personales

### 3.2 API de Limitación por IP (Rate Limiter Extendido)

#### Sistema Mejorado de Anti-Spam:
1. **Limitación por IP con variaciones:**
   ```
   - Límite de 1 reserva cada 5 minutos por IP
   - Máximo 3 reservas por hora por IP
   - Máximo 5 reservas por día por IP
   - Excepciones para IPs confiables (admin)
   ```

2. **Detección de patrones sospechosos:**
   - Bloqueo temporal por patrones de comportamiento
   - Detección de bots o scripts automatizados
   - Limitación por User-Agent si se detectan automatismos

3. **Sistema de reputación por IP:**
   - IPs con reservas completadas exitosamente: menos limitaciones
   - IPs con múltiples cancelaciones: más vigilancia
   - Sistema de "confianza" que ajusta límites dinámicamente

4. **Excepciones controladas:**
   - Admin puede crear reservas sin limitaciones
   - Admin puede temporalmente exonerar IPs específicas
   - Sistema para "bypass" manual en casos especiales

### 3.3 Flujo de Reserva Anónima
1. Usuario ingresa datos personales (nombre, documento, teléfono, email)
2. Sistema verifica limitaciones de IP
3. Usuario selecciona tour y fecha
4. Sistema calcula precio final
5. Usuario confirma y se crea la reserva como "pending"
6. Sistema envía código de confirmación o acceso
7. Admin contacta al usuario para confirmación final

### 3.4 Recuperación de Información de Reservas
- Sistema para recuperar estado de reserva por:
  - Combinación de nombre + documento + teléfono
  - Código de confirmación único
  - Email + datos parciales

## 4. Escenarios Especiales y Edge Cases

### 4.1 Cancelación de Tours con Reservas
Cuando se cancela un tour:
1. Todas las reservas asociadas se marcan como "cancelled_by_admin"
2. Se agrega nota con razón de cancelación
3. Se registra tour original para histórico
4. Se notifica a los clientes afectados
5. Se inicia proceso de reembolso o reasignación

### 4.2 Administración de Eventos Llenos
- Sistema de lista de espera
- Notificación cuando se libera cupo
- Prioridad para cambios de otros tours

### 4.3 Cambios de Fecha o Tour
- Sistema de reasignación con cálculo diferencial de precios
- Mantenimiento de historial de cambios
- Notificación automática de cambios significativos

### 4.4 Procesos de Reembolso
- Reglas de reembolso configurables por admin
- Diferentes políticas según tiempo de cancelación
- Procesos manuales con seguimiento

## 5. Endpoints Planificados para la Fase 2

### 5.1 Endpoints de Reservas (Usuario)
- `POST /api/createBooking` - Crear reserva anónima
- `POST /api/joinEvent` - Unirse a evento público existente
- `GET /api/checkBooking` - Verificar estado de reserva por código
- `GET /api/bookingsByCustomer` - Recuperar reservas por datos personales

### 5.2 Endpoints de Administración Avanzada
- `GET /admin/bookings` - Listar todas las reservas con filtros
- `PUT /admin/bookings/:bookingId` - Actualizar datos de reserva
- `PUT /admin/bookings/:bookingId/status` - Cambiar estado
- `PUT /admin/bookings/:bookingId/transfer` - Transferir a otro tour
- `PUT /admin/bookings/:bookingId/customer` - Actualizar datos de cliente
- `PUT /admin/tours/:tourId/notes` - Agregar notas administrativas
- `GET /admin/events/calendar` - Calendario visual de eventos
- `PUT /admin/events/:eventId` - Actualizar datos de evento
- `POST /admin/events/:eventId/publish` - Publicar evento
- `POST /admin/events/:eventId/unpublish` - Despublicar evento
- `DELETE /admin/events/:eventId` - Cancelar evento
- `GET /admin/audit` - Consultar historial de acciones de admin

### 5.3 Sistema de Notificaciones (Futuro)
- `POST /admin/notifications` - Enviar notificación manual
- `GET /admin/notifications` - Historial de notificaciones

## 6. Consideraciones Técnicas para Implementación

### 6.1 Estructura Extendida de Reservas
```json
{
  "bookingId": "unique_booking_id",
  "eventId": "unique_event_id",
  "tourId": "tour_identifier",
  "tourName": "Tour Name",
  "customer": {
    "fullName": "Customer Name",
    "documentId": "Document Number",
    "phone": "Phone Number",
    "email": "Email Address",
    "notes": "Special Notes"
  },
  "pax": 2,
  "pricePerPerson": 950000,
  "totalPrice": 1900000,
  "bookingDate": "2025-10-08T10:00:00Z",
  "status": "pending",
  "statusHistory": [
    {
      "timestamp": "2025-10-08T10:00:00Z",
      "status": "pending",
      "note": "Initial booking",
      "adminUser": "system"
    }
  ],
  "isEventOrigin": true,
  "ipAddress": "192.168.1.1",
  "bookingReference": "BK-20251008-001",
  "previousStates": [
    {
      "action": "tour_change",
      "timestamp": "2025-10-08T11:00:00Z",
      "fromTourId": "old_tour_id",
      "toTourId": "new_tour_id",
      "adminUser": "admin_name",
      "reason": "Original tour cancelled"
    }
  ]
}
```

### 6.2 Estructura Extendida de Tours (con historial)
```json
{
  "tourId": "unique_tour_id",
  "name": {"es": "Nombre", "en": "Name"},
  "isActive": true,
  "creationDate": "2025-01-01T00:00:00Z",
  "lastUpdate": "2025-10-08T10:00:00Z",
  "updateHistory": [
    {
      "timestamp": "2025-10-08T10:00:00Z",
      "field": "name",
      "previousValue": {"es": "Nombre Anterior", "en": "Previous Name"},
      "newValue": {"es": "Nombre Actual", "en": "Current Name"},
      "adminUser": "admin_name"
    }
  ]
}
```

## 7. Recomendaciones Técnicas

### 7.1 Optimización para Firestore
- Implementar subcolecciones para historiales para mantener los documentos principales ligeros
- Usar transacciones para operaciones críticas que afecten múltiples colecciones
- Implementar índices apropiados para consultas frecuentes
- Considerar el uso de operaciones batch para actualizaciones masivas

### 7.2 Seguridad
- Validar todos los campos de entrada para prevenir inyecciones
- Implementar control de acceso más granular si se añaden múltiples roles de admin
- Registrar y monitorear intentos de acceso no autorizados
- Considerar el uso de JWT si se requiere un sistema de sesión temporal

### 7.3 Escalabilidad
- Planificar para futuras características como notificaciones por email
- Implementar logging detallado para debugging
- Considerar el uso de Cloud Tasks para operaciones pesadas

## 8. Conclusión

Esta expansión de la lógica de negocio cubre todos los aspectos requeridos para:
- Un panel de administración completo con control total
- Gestión avanzada de reservas y sus cambios
- Manejo de escenarios complejos como eliminación de tours con reservas
- Un sistema de usuario anónimo con limitaciones anti-spam robustas
- Seguimiento completo de todo el historial de cambios

La implementación seguirá manteniendo el enfoque en eficiencia, uso óptimo de la capa gratuita de Firestore y soporte bilingüe completo, mientras se añaden las capacidades avanzadas necesarias para la operación real del negocio.