# Plan de Implementación - Fase 2: Sistema de Reservas y Panel de Administración

## 1. Resumen Ejecutivo

Con base en los documentos de lógica de negocio expandida y la definición de endpoints, este plan detalla la implementación de la Fase 2 del sistema Nevado Trek Backend, enfocada en:

- Sistema completo de reservas anónimas
- Panel de administración avanzado con control total
- Gestión completa de eventos y su relación con tours y reservas
- Sistema de auditoría y manejo de escenarios complejos

## 2. Objetivos de la Fase 2

### 2.1 Objetivos Principales
- Implementar el sistema de reservas completo (creación, unión a eventos, verificación)
- Desarrollar panel de administración con funcionalidades avanzadas
- Implementar manejo avanzado de tours, eventos y reservas con historial
- Asegurar la trazabilidad completa de todas las operaciones

### 2.2 Métricas de Éxito
- Sistema de reservas completamente funcional
- Panel de administración operativo con todas las funcionalidades descritas
- Capacidad de manejar escenarios complejos (cancelación de tours con reservas, transferencias, etc.)
- Satisfacción del administrador con las funcionalidades proporcionadas

## 3. Arquitectura Técnica

### 3.1 Estructura de Datos Actualizada

#### 3.1.1 Documento de Reserva Extendido
```javascript
// Colección: bookings
{
  id: "booking_id",
  eventId: "event_id",
  tourId: "tour_id", 
  tourName: "Tour Name", // Denormalizado
  customer: {
    fullName: "Nombre Completo",
    documentId: "Documento de Identidad",
    phone: "+34 600123456",
    email: "correo@ejemplo.com",
    notes: "Notas especiales"
  },
  pax: 2,
  pricePerPerson: 950000,
  totalPrice: 1900000,
  bookingDate: "timestamp",
  status: "pending", // pending, confirmed, paid, cancelled, cancelled_by_admin, etc.
  statusHistory: [
    {
      timestamp: "timestamp",
      status: "pending",
      note: "Initial booking",
      adminUser: "system" // o nombre de admin si fue por admin
    }
  ],
  isEventOrigin: true,
  ipAddress: "IP address", // Para rate limiting
  bookingReference: "BK-YYYYMMDD-XXX",
  previousStates: [ // Para historial de cambios importantes
    {
      action: "tour_change", // tour_change, customer_update, etc.
      timestamp: "timestamp",
      fromTourId: "old_tour_id",
      toTourId: "new_tour_id", 
      adminUser: "admin_name",
      reason: "Tour cancelled, rebooked to alternative"
    }
  ],
  createdAt: "timestamp",
  updatedAt: "timestamp"
}
```

#### 3.1.2 Documento de Evento Extendido
```javascript
// Colección: tourEvents
{
  id: "event_id",
  tourId: "tour_id",
  tourName: "Tour Name", // Denormalizado
  startDate: "2025-12-12T07:00:00Z",
  endDate: "2025-12-15T18:00:00Z", 
  maxCapacity: 8,
  bookedSlots: 2,
  type: "private", // private, public
  status: "active", // active, full, completed, cancelled
  totalBookings: 1, // Número total de bookings para este evento
  createdAt: "timestamp",
  updatedAt: "timestamp",
  auditTrail: [ // Para seguimiento de cambios
    {
      timestamp: "timestamp",
      adminUser: "admin_name",
      action: "capacity_change",
      previousValue: 6,
      newValue: 8,
      reason: "Special request approved"
    }
  ]
}
```

### 3.2 Colección de Auditoría
```javascript
// Colección: auditLog
{
  id: "audit_id",
  timestamp: "timestamp",
  adminUser: "admin_identifier",
  resourceType: "tour|booking|event", // Tipo de recurso afectado
  resourceId: "resource_id", // ID del recurso afectado
  action: "create|update|delete|transfer", // Acción realizada
  details: {
    field: "field_name", // Campo específico si aplica
    previousValue: "previous_value", // Valor anterior
    newValue: "new_value", // Nuevo valor
    reason: "reason_for_change" // Razón del cambio
  },
  ipAddress: "IP address"
}
```

## 4. Plan de Implementación Detallada

### 4.1 Fase 2A: Infraestructura Básica de Reservas (Semana 1-2) - ✅ COMPLETADA

#### 4.1.1 Tareas Completadas
1. ✅ **Funciones de rate limiting avanzado implementadas**
   - Lógica de rateLimiter con configuración parametrizable  
   - Sistema de límites: 5 minutos entre solicitudes, 3 por hora, 5 por día
   - Logging de intentos de reserva por IP

2. ✅ **Endpoint de creación de reservas implementado**
   - `POST /api/createBooking` - Desplegado en https://createbooking-wgfhwjbpva-uc.a.run.app
   - Validación completa de datos
   - Integración con rate limiting
   - Creación de evento privado si es necesario
   - Generación de bookingReference único (formato: BK-YYYYMMDD-XXX)

3. ✅ **Endpoint de unión a eventos implementado**
   - `POST /api/joinEvent` - Desplegado en https://joinevent-wgfhwjbpva-uc.a.run.app
   - Validación de disponibilidad
   - Verificación de eventos públicos
   - Actualización atómica de bookedSlots

4. ✅ **Endpoint de verificación de reservas implementado**
   - `GET /api/checkBooking` - Desplegado en https://checkbooking-wgfhwjbpva-uc.a.run.app
   - Búsqueda por reference code
   - Validación de seguridad opcional con email

#### 4.1.2 Pruebas Completadas
- ✅ Pruebas unitarias para validación de datos
- ✅ Pruebas de rate limiting
- ✅ Pruebas de integración con colecciones Firestore
- ✅ Pruebas de despliegue y funcionalidad en producción

### 4.2 Fase 2B: Panel de Administración Básico (Semana 3-4)

#### 4.2.1 Tareas
1. **Implementar lista de reservas con filtros**
   - `GET /admin/bookings`
   - Filtros por status, tour, fechas
   - Paginación
   - Búsqueda por nombre de cliente

2. **Implementar cambio de estado de reservas**
   - `PUT /admin/bookings/:bookingId/status`
   - Actualización con historial
   - Validación de transiciones válidas
   - Actualización correspondiente de bookedSlots

3. **Implementar calendario de eventos**
   - `GET /admin/events/calendar`
   - Filtrado por rangos de fechas
   - Visualización de disponibilidad
   - Integración con tours activos

4. **Implementar publicación/despublicación de eventos**
   - `POST /admin/events/:eventId/publish` y `unpublish`
   - Validación de estado actual
   - Actualización de visibilidad

#### 4.2.2 Pruebas Requeridas
- Pruebas de autorización para endpoints admin
- Pruebas de filtros y paginación
- Pruebas de integridad de datos (bookedSlots)
- Pruebas de estado de eventos

### 4.3 Fase 2C: Funcionalidades Avanzadas (Semana 5-6)

#### 4.3.1 Tareas
1. **Implementar transferencia de reservas**
   - `PUT /admin/bookings/:bookingId/transfer`
   - Validación de disponibilidad en nuevo tour/evento
   - Cálculo de diferencias de precio
   - Actualización de historial completo
   - Manejo de excepciones y rollback

2. **Implementar edición completa de reservas**
   - `PUT /admin/bookings/:bookingId` y `PUT /admin/bookings/:bookingId/customer`
   - Actualización de cualquier campo
   - Historial detallado de cambios
   - Validación de datos

3. **Implementar manejo de cancelación de tours con reservas**
   - Lógica para procesar reservas afectadas cuando se cancela un tour
   - Actualización masiva de estados
   - Generación de informes de impacto
   - Recomendaciones para acción manual

4. **Implementar sistema de auditoría**
   - Registro de todas las acciones de admin
   - Búsqueda y filtrado en historial
   - Exportación de logs si es necesario

#### 4.3.2 Pruebas Requeridas
- Pruebas de transferencia de reservas con diferentes escenarios
- Pruebas de manejo de errores y rollback
- Pruebas de impacto de cancelación de tours
- Pruebas de integridad de auditoría

## 5. Consideraciones Técnicas

### 5.1 Transacciones Firestore
- Usar transacciones para operaciones críticas que afectan múltiples documentos
- Ejemplos: joinEvent (actualizar evento + crear booking), transfer booking (actualizar eventos origen y destino + booking)
- Manejar correctamente los límites de Firestore para operaciones de escritura

### 5.2 Indexación
- Asegurar índices apropiados para consultas frecuentes:
  - bookings: por status, tourId, startDate (compuesto)
  - tourEvents: por tourId, startDate (compuesto), status
  - auditLog: por resourceType, timestamp

### 5.3 Manejo de Errores y Logging
- Implementar logging detallado para debugging
- Mensajes de error claros y descriptivos
- Manejo elegante de casos límite
- Notificaciones para el admin en casos críticos

### 5.4 Seguridad
- Validar todos los inputs para prevenir inyecciones
- Asegurar que la autenticación admin es robusta
- Implementar control de acceso basado en roles si se requiere en el futuro
- Validar que las operaciones solo afecten recursos válidos

## 6. Recursos Requeridos

### 6.1 Desarrollo
- 2-3 semanas de desarrollo backend
- Pruebas exhaustivas (1 semana)
- Documentación de la API (2-3 días)
- Integración con frontend (coordinación con equipo frontend)

### 6.2 Infraestructura
- Asegurar cuotas adecuadas en Firestore
- Considerar monitoreo de uso para optimizar costos
- Backup y recuperación de desastres (si aplica)

## 7. Riesgos y Mitigaciones

### 7.1 Riesgos Técnicos
- **Riesgo:** Race conditions en operaciones concurrentes
  - **Mitigación:** Uso adecuado de transacciones Firestore
- **Riesgo:** Sobrecarga de operaciones de lectura/escritura
  - **Mitigación:** Optimización de consultas y uso de denormalización
- **Riesgo:** Fallos en la lógica de precios dinámicos
  - **Mitigación:** Pruebas exhaustivas y validación matemática

### 7.2 Riesgos de Negocio
- **Riesgo:** Cambios rápidos en requisitos durante el desarrollo
  - **Mitigación:** Implementación incremental con revisiones frecuentes
- **Riesgo:** Dificultad de uso del panel de administración
  - **Mitigación:** Pruebas de usabilidad y feedback frecuente

## 8. Indicadores de Progreso

### 8.1 Métricas Técnicas
- Número de endpoints implementados y probados
- Cobertura de pruebas unitarias (objetivo: >80%)
- Tiempo de respuesta promedio de endpoints
- Número de errores detectados y resueltos

### 8.2 Métricas de Negocio
- Número de reservas exitosas
- Tiempo promedio de procesamiento de reservas
- Número de operaciones administrativas completadas
- Feedback del administrador sobre la experiencia de uso

## 9. Conclusión

Este plan provee una hoja de ruta clara para la implementación del sistema avanzado de reservas y panel de administración. La estructura modular y la implementación incremental permitirán una entrega funcional temprana mientras se desarrollan las funcionalidades más complejas.

El enfoque mantiene el compromiso con la eficiencia y optimización para la capa gratuita de Firebase, al tiempo que proporciona las funcionalidades avanzadas necesarias para la operación real del negocio de tours de aventura.