# Expansión de API Endpoints - Nevado Trek Backend

## Introducción
Este documento detalla los endpoints adicionales necesarios para implementar la funcionalidad avanzada del panel de administración y la página de usuarios, como se describe en la expansión de la lógica de negocio.

## 1. Endpoints de Reservas para Usuarios (Anónimos)

### 1.1 Crear Nueva Reserva
- **Endpoint:** `POST /api/createBooking`
- **Descripción:** Crea una reserva inicial para un tour en una fecha específica
- **Autenticación:** No requiere autenticación (anónimo), pero con limitación por IP
- **Headers:** `X-Forwarded-For` (para rate limiting)
- **Body:**
  ```json
  {
    "tourId": "tour_id",
    "startDate": "2025-12-12T07:00:00Z",
    "customer": {
      "fullName": "Nombre Completo",
      "documentId": "Documento de Identidad",
      "phone": "+34 600123456",
      "email": "correo@ejemplo.com",
      "notes": "Notas especiales"
    },
    "pax": 2
  }
  ```
- **Respuesta Exitosa (201):**
  ```json
  {
    "success": true,
    "bookingId": "booking_id",
    "bookingReference": "BK-20251008-001",
    "status": "pending",
    "message": "Booking created successfully. Please note your reference code."
  }
  ```
- **Respuestas de Error:**
  - `400 Bad Request`: Datos incompletos o inválidos
  - `403 Forbidden`: Límite de rate limiting excedido
  - `404 Not Found`: Tour no encontrado o no activo
  - `422 Unprocessable Entity`: Fecha no disponible o cupos llenos

### 1.2 Unirse a Evento Existente
- **Endpoint:** `POST /api/joinEvent`
- **Descripción:** Se une a un evento público existente
- **Autenticación:** No requiere autenticación (anónimo), pero con limitación por IP
- **Headers:** `X-Forwarded-For` (para rate limiting)
- **Body:**
  ```json
  {
    "eventId": "event_id",
    "customer": {
      "fullName": "Nombre Completo",
      "documentId": "Documento de Identidad",
      "phone": "+34 600123456",
      "email": "correo@ejemplo.com",
      "notes": "Notas especiales"
    },
    "pax": 1
  }
  ```
- **Respuesta Exitosa (201):**
  ```json
  {
    "success": true,
    "bookingId": "booking_id",
    "bookingReference": "BK-20251008-002",
    "status": "pending",
    "pricePerPerson": 800000,
    "message": "Successfully joined event"
  }
  ```

### 1.3 Verificar Estado de Reserva
- **Endpoint:** `GET /api/checkBooking`
- **Descripción:** Verifica el estado de una reserva por código de referencia
- **Autenticación:** No requiere autenticación
- **Query Parameters:**
  - `reference`: Código de referencia de la reserva
  - `email`: Email opcional para verificación adicional
- **Respuesta Exitosa (200):**
  ```json
  {
    "bookingId": "booking_id",
    "eventId": "event_id",
    "tourId": "tour_id",
    "tourName": {"es": "Nombre del Tour", "en": "Tour Name"},
    "customer": {
      "fullName": "Nombre Completo"
    },
    "pax": 2,
    "status": "confirmed",
    "bookingDate": "2025-10-08T10:00:00Z",
    "startDate": "2025-12-12T07:00:00Z"
  }
  ```

### 1.4 Recuperar Reservas por Datos del Cliente
- **Endpoint:** `POST /api/bookingsByCustomer`
- **Descripción:** Recupera todas las reservas de un cliente por sus datos personales
- **Autenticación:** No requiere autenticación
- **Body:**
  ```json
  {
    "fullName": "Nombre Completo",
    "documentId": "Documento de Identidad",
    "phone": "+34 600123456"
  }
  ```
- **Respuesta Exitosa (200):**
  ```json
  [
    {
      "bookingId": "booking1",
      "bookingReference": "BK-20251008-001",
      "tourName": {"es": "Tour 1", "en": "Tour 1"},
      "startDate": "2025-12-12T07:00:00Z",
      "status": "pending",
      "pax": 2
    },
    {
      "bookingId": "booking2",
      "bookingReference": "BK-20251008-002",
      "tourName": {"es": "Tour 2", "en": "Tour 2"},
      "startDate": "2025-12-15T07:00:00Z",
      "status": "confirmed",
      "pax": 1
    }
  ]
  ```

## 2. Endpoints de Administración Avanzada

### 2.1 Listar Todas las Reservas con Filtros
- **Endpoint:** `GET /admin/bookings`
- **Descripción:** Lista todas las reservas con múltiples opciones de filtro
- **Autenticación:** Requiere header `X-Admin-Secret-Key`
- **Query Parameters:**
  - `status`: Filtrar por estado (pending, confirmed, paid, cancelled, etc.)
  - `tourId`: Filtrar por tour específico
  - `startDateFrom`: Fecha inicial para filtrar eventos
  - `startDateTo`: Fecha final para filtrar eventos
  - `customerName`: Filtrar por nombre de cliente
  - `limit`: Número máximo de resultados (default: 50)
  - `offset`: Número de resultados a omitir (para paginación)
- **Respuesta Exitosa (200):**
  ```json
  {
    "bookings": [
      {
        "bookingId": "booking_id",
        "eventId": "event_id",
        "tourId": "tour_id",
        "tourName": {"es": "Nombre del Tour", "en": "Tour Name"},
        "customer": {
          "fullName": "Nombre Completo",
          "documentId": "Documento",
          "phone": "+34 600123456",
          "email": "correo@ejemplo.com",
          "notes": "Notas especiales"
        },
        "pax": 2,
        "pricePerPerson": 950000,
        "totalPrice": 1900000,
        "status": "pending",
        "bookingDate": "2025-10-08T10:00:00Z",
        "startDate": "2025-12-12T07:00:00Z",
        "isEventOrigin": true
      }
    ],
    "pagination": {
      "total": 100,
      "limit": 50,
      "offset": 0
    }
  }
  ```

### 2.2 Actualizar Datos de Reserva
- **Endpoint:** `PUT /admin/bookings/:bookingId`
- **Descripción:** Actualiza cualquier campo de la reserva
- **Autenticación:** Requiere header `X-Admin-Secret-Key`
- **Body:**
  ```json
  {
    "customer": {
      "fullName": "Nuevo Nombre",
      "documentId": "Nuevo Documento",
      "phone": "+34 600123457",
      "email": "nuevo@correo.com",
      "notes": "Notas actualizadas"
    },
    "pax": 3,
    "notes": "Actualización por solicitud del cliente"
  }
  ```
- **Respuesta Exitosa (200):**
  ```json
  {
    "success": true,
    "bookingId": "booking_id",
    "message": "Booking updated successfully",
    "previousData": {
      /* datos anteriores guardados para auditoría */
    }
  }
  ```

### 2.3 Cambiar Estado de Reserva
- **Endpoint:** `PUT /admin/bookings/:bookingId/status`
- **Descripción:** Cambia el estado de una reserva
- **Autenticación:** Requiere header `X-Admin-Secret-Key`
- **Body:**
  ```json
  {
    "status": "confirmed",
    "reason": "Pago recibido y confirmado",
    "adminUser": "admin_name"
  }
  ```
- **Respuesta Exitosa (200):**
  ```json
  {
    "success": true,
    "bookingId": "booking_id",
    "previousStatus": "pending",
    "newStatus": "confirmed",
    "message": "Status updated successfully"
  }
  ```

### 2.4 Transferir Reserva a Otro Tour
- **Endpoint:** `PUT /admin/bookings/:bookingId/transfer`
- **Descripción:** Transfiere una reserva a otro tour/evento
- **Autenticación:** Requiere header `X-Admin-Secret-Key`
- **Body:**
  ```json
  {
    "newTourId": "new_tour_id",
    "newEventId": "new_event_id",
    "reason": "Tour original cancelado",
    "adjustPrice": true,
    "adminUser": "admin_name"
  }
  ```
- **Respuesta Exitosa (200):**
  ```json
  {
    "success": true,
    "bookingId": "booking_id",
    "previousTourId": "old_tour_id",
    "newTourId": "new_tour_id",
    "previousPrice": 950000,
    "newPrice": 900000,
    "priceDifference": -50000,
    "message": "Booking transferred successfully",
    "actionRequired": "Refund of $50,000 may be needed"
  }
  ```

### 2.5 Actualizar Datos de Cliente
- **Endpoint:** `PUT /admin/bookings/:bookingId/customer`
- **Descripción:** Actualiza solo los datos del cliente
- **Autenticación:** Requiere header `X-Admin-Secret-Key`
- **Body:**
  ```json
  {
    "customer": {
      "fullName": "Nombre Actualizado",
      "documentId": "Documento Actualizado",
      "phone": "+34 600123458",
      "email": "actualizado@correo.com",
      "notes": "Notas actualizadas"
    },
    "notes": "Actualización por solicitud del cliente"
  }
  ```

### 2.6 Listar Calendario de Eventos
- **Endpoint:** `GET /admin/events/calendar`
- **Descripción:** Devuelve eventos en un rango de fechas
- **Autenticación:** Requiere header `X-Admin-Secret-Key`
- **Query Parameters:**
  - `startDate`: Fecha de inicio del rango (ISO 8601)
  - `endDate`: Fecha de fin del rango (ISO 8601)
  - `tourId`: Filtrar por tour específico
- **Respuesta Exitosa (200):**
  ```json
  [
    {
      "eventId": "event_id",
      "tourId": "tour_id",
      "tourName": {"es": "Tour", "en": "Tour"},
      "startDate": "2025-12-12T07:00:00Z",
      "endDate": "2025-12-15T18:00:00Z",
      "maxCapacity": 8,
      "bookedSlots": 5,
      "type": "public",
      "status": "active",
      "totalBookings": 3
    }
  ]
  ```

### 2.7 Actualizar Datos de Evento
- **Endpoint:** `PUT /admin/events/:eventId`
- **Descripción:** Actualiza datos de evento (excepto fechas)
- **Autenticación:** Requiere header `X-Admin-Secret-Key`
- **Body:**
  ```json
  {
    "maxCapacity": 10,
    "notes": "Aumento de capacidad por solicitud especial"
  }
  ```

### 2.8 Publicar/Despublicar Evento
- **Endpoint:** `POST /admin/events/:eventId/publish` o `POST /admin/events/:eventId/unpublish`
- **Descripción:** Cambia el tipo de evento entre público y privado
- **Autenticación:** Requiere header `X-Admin-Secret-Key`
- **Body:**
  ```json
  {
    "reason": "Aprobación del cliente pionero recibida"
  }
  ```

### 2.9 Cancelar Evento
- **Endpoint:** `DELETE /admin/events/:eventId`
- **Descripción:** Cancela un evento y maneja las reservas asociadas
- **Autenticación:** Requiere header `X-Admin-Secret-Key`
- **Body:**
  ```json
  {
    "reason": "Condiciones climáticas adversas",
    "actionForBookings": "cancel_and_refund",
    "notificationMessage": "Evento cancelado por condiciones climáticas"
  }
  ```
- **Respuesta Exitosa (200):**
  ```json
  {
    "success": true,
    "eventId": "event_id",
    "affectedBookings": 5,
    "message": "Event cancelled and bookings updated",
    "actionsTaken": [
      "Bookings changed to 'cancelled_by_admin'",
      "Refund process initiated for affected customers",
      "Email notifications sent to customers"
    ]
  }
  ```

### 2.10 Historial de Auditoría
- **Endpoint:** `GET /admin/audit`
- **Descripción:** Devuelve historial de acciones de administrador
- **Autenticación:** Requiere header `X-Admin-Secret-Key`
- **Query Parameters:**
  - `adminUser`: Filtrar por usuario admin
  - `actionType`: Tipo de acción (update_tour, update_booking, etc.)
  - `dateFrom`: Fecha inicial
  - `dateTo`: Fecha final
- **Respuesta Exitosa (200):**
  ```json
  [
    {
      "timestamp": "2025-10-08T10:00:00Z",
      "adminUser": "admin1",
      "action": "update_booking",
      "entityType": "booking",
      "entityId": "booking123",
      "details": {
        "field": "status",
        "from": "pending",
        "to": "confirmed"
      }
    }
  ]
  ```

## 3. Manejo de Rate Limiting Extendido

### 3.1 Excepciones de Rate Limiting
- Todos los endpoints de administración (`/admin/*`) deben omitir las limitaciones de rate limiting
- Sistema de bypass manual para IPs confiables
- Configuración de límites variables según la reputación de la IP

### 3.2 Sistema de Reputación por IP
- Las IPs con reservas completadas exitosamente tienen menos limitaciones
- Las IPs con múltiples cancelaciones tienen más vigilancia
- Sistema de "confianza" que ajusta límites dinámicamente

## 4. Consideraciones de Seguridad

### 4.1 Validación de Datos
- Todos los endpoints deben validar exhaustivamente los datos entrantes
- Implementar sanitización para prevenir inyecciones
- Validar rangos y formatos específicos (emails, teléfonos, IDs)

### 4.2 Control de Acceso
- Todos los endpoints de administración requieren autenticación
- Implementar logging de intentos fallidos
- Considerar bloqueos temporales ante múltiples intentos fallidos

## 5. Consideraciones de Rendimiento

### 5.1 Paginación
- Implementar paginación en endpoints que devuelven listas largas
- Usar `limit` y `offset` para control de resultados
- Considerar índices apropiados en Firestore

### 5.2 Caching
- Considerar implementación de caching para datos que no cambian frecuentemente
- Usar ETags para optimizar recursos en consultas repetidas

## 6. Manejo de Errores

### 6.1 Formato Estándar de Errores
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Descripción del error",
    "details": "Información adicional sobre el error",
    "timestamp": "2025-10-08T10:00:00Z"
  }
}
```

### 6.2 Códigos de Error Comunes
- `INVALID_DATA`: Datos de entrada inválidos
- `RATE_LIMIT_EXCEEDED`: Límite de rate limiting excedido
- `RESOURCE_NOT_FOUND`: Recurso no encontrado
- `UNAUTHORIZED`: Autenticación fallida
- `VALIDATION_ERROR`: Error de validación específica
- `CONFLICT`: Conflicto con datos existentes (cupo lleno, etc.)

## 7. Implementación Progresiva

### Fase 2A: Reservas Básicas
- Implementar `POST /api/createBooking`
- Implementar `POST /api/joinEvent`
- Implementar `GET /api/checkBooking`

### Fase 2B: Panel de Administración Básico
- Implementar `GET /admin/bookings`
- Implementar `PUT /admin/bookings/:bookingId/status`
- Implementar `GET /admin/events/calendar`

### Fase 2C: Funcionalidades Avanzadas
- Implementar transferencia de reservas
- Implementar edición completa de reservas
- Implementar manejo avanzado de eventos
- Implementar sistema de auditoría