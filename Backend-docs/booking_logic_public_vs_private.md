# Booking Logic - Public vs Private

**Last Updated**: November 22, 2025  
**Status**: ✅ Verified & Deployed

---

## 🎯 Overview

El sistema de bookings de Nevado Trek maneja dos tipos fundamentales de reservas: **Públicas** y **Privadas**. Cada tipo tiene comportamientos y restricciones específicas que garantizan la integridad de los datos y la correcta gestión de capacidad.

---

## 📋 Tipos de Reservas

### Public Bookings (Reservas Públicas)

**Definición**: Múltiples clientes comparten un mismo departure (salida).

**Características**:
- Múltiples bookings ligados al mismo `departureId`
- `departure.maxPax` típicamente 8 (configurable)
- `departure.type = 'public'`
- `booking.type = 'public'`

**Restricciones**:
- ❌ **NO** se puede cambiar fecha individualmente
- ❌ **NO** se puede cambiar tour individualmente  
- ✅ **SÍ** se puede cambiar pax (dentro de capacidad disponible)
- ✅ **SÍ** se puede convertir a privada

**Ejemplo de Uso**:
```
Tour: Nevado del Ruiz
Departure: 2025-12-25 (Public, maxPax: 8)
├─ Booking 1: Juan Pérez (2 pax) ← Public
├─ Booking 2: María López (3 pax) ← Public
└─ Booking 3: Carlos García (2 pax) ← Public
Total: 7/8 pax ocupados
```

---

### Private Bookings (Reservas Privadas)

**Definición**: Un cliente tiene un departure exclusivo para su grupo.

**Características**:
- **Un solo booking** por departure
- `departure.maxPax = 99` (prácticamente ilimitado)
- `departure.type = 'private'`
- `booking.type = 'private'`

**Sin Restricciones**:
- ✅ **SÍ** se puede cambiar fecha independientemente
- ✅ **SÍ** se puede cambiar tour independientemente
- ✅ **SÍ** se puede cambiar pax sin límite práctico
- ✅ **SÍ** se puede convertir a pública (si cabe)

**Ejemplo de Uso**:
```
Tour: Nevado del Ruiz
Departure: 2025-12-25 (Private, maxPax: 99)
└─ Booking: Familia Rodríguez (15 pax) ← Private
Total: 15/99 pax ocupados (departure exclusivo)
```

---

## 🔄 Conversión de Tipos

### Public → Private (Split Logic)

**Proceso**:
1. Se crea **nuevo departure privado** con la misma fecha/tour
2. Booking seleccionada se mueve al nuevo departure
3. Departure público original mantiene otros bookings
4. **Auto-cleanup**: Si departure público queda vacío (`currentPax = 0`), se **elimina automáticamente**

**Código Backend** (`bookings.controller.js:230-320`):
```javascript
// 1. Crear nuevo departure privado
const newDepartureData = {
  tourId: oldDeparture.tourId,
  date: oldDeparture.date,
  type: DEPARTURE_TYPES.PRIVATE,
  maxPax: 99,
  currentPax: booking.pax,
  // ...
};
const newDepRef = admin.firestore().collection('departures').doc();
t.create(newDepRef, newDepartureData);

// 2. Mover booking
t.update(bookingRef, {
  departureId: newDepRef.id,
  type: DEPARTURE_TYPES.PRIVATE,
  // ...
});

// 3. Actualizar departure original
const newCurrentPax = oldDeparture.currentPax - booking.pax;
if (newCurrentPax <= 0) {
  t.delete(oldDepRef);  // ✨ Auto-cleanup
} else {
  t.update(oldDepRef, { currentPax: newCurrentPax });
}
```

**Ejemplo**:
```
ANTES:
Departure A (Public, 8 pax max):
├─ Booking 1: Juan (2 pax)
├─ Booking 2: María (3 pax)
└─ Booking 3: Carlos (2 pax)

Juan solicita convertir a privado

DESPUÉS:
Departure A (Public, 8 pax max):
├─ Booking 2: María (3 pax)
└─ Booking 3: Carlos (2 pax)

Departure B (Private, 99 pax max): ← NUEVO
└─ Booking 1: Juan (2 pax)
```

---

### Private → Public (Join Logic)

**Proceso**:
1. Se busca departure público existente con espacio disponible
2. Booking se mueve al departure público
3. Departure privado original se **elimina automáticamente** (siempre queda vacío)

**Código Backend** (`bookings.controller.js:230-320`):
```javascript
// 1. Buscar departure público con espacio
const availablePublicDeparture = /* buscar en base de datos */;

// 2. Mover booking
t.update(bookingRef, {
  departureId: availablePublicDeparture.id,
  type: DEPARTURE_TYPES.PUBLIC,
  // ...
});

// 3. Actualizar departure público
t.update(publicDepRef, {
  currentPax: availablePublicDeparture.currentPax + booking.pax,
});

// 4. Eliminar departure privado
t.delete(oldDepRef);  // ✨ Auto-cleanup (siempre queda vacío)
```

**Ejemplo**:
```
ANTES:
Departure A (Private, 99 pax max):
└─ Booking 1: Juan (2 pax)

Departure B (Public, 8 pax max):
└─ Booking 2: María (3 pax)

Juan solicita convertir a público

DESPUÉS:
Departure B (Public, 8 pax max):
├─ Booking 2: María (3 pax)
└─ Booking 1: Juan (2 pax)

Departure A eliminado ✨
```

---

## 🔧 Actualización de Fecha/Tour

### Para Public Bookings

**Desde Departure Modal**:
- Cambiar fecha/tour afecta a **TODOS** los bookings ligados al departure
- Se usa `POST /admin/departures/:id/update-date`
- Se usa `POST /admin/departures/:id/update-tour`

**Ejemplo**:
```javascript
// Actualizar fecha del departure (afecta a todos)
POST /admin/departures/abc123/update-date
{
  "newDate": "2025-12-26"
}

// Resultado: TODOS los bookings ahora tienen fecha 2025-12-26
```

**UI Behavior**:
- En `BookingModal`: Campos de fecha/tour están **bloqueados** (`disabled`)
- Mensaje: "Esta reserva está en un departure público. Para cambiar fecha/tour, hazlo desde el Departure Modal"
- Botón: "Convertir a Privado" (para permitir edición individual)

---

### Para Private Bookings

**Desde Booking Modal**:
- Cambiar fecha/tour afecta **SOLO** a esa booking
- Se usan los mismos endpoints pero solo hay 1 booking en el departure
- Se usa `POST /admin/departures/:id/update-date`
- Se usa `POST /admin/departures/:id/update-tour`

**Ejemplo**:
```javascript
// Actualizar fecha del departure (solo 1 booking)
POST /admin/departures/xyz789/update-date
{
  "newDate": "2025-12-26"
}

// Resultado: Solo la booking en ese departure cambia de fecha
```

**UI Behavior**:
- En `BookingModal`: Campos de fecha/tour están **habilitados** (`enabled`)
- Inputs: `<input type="date" data-testid="input-update-date">`
- Botones: "Update Date", "Update Tour"

---

## 🎨 UI/UX Guidelines

### BookingModal - Public Booking

**Sección "Actions" Tab**:
```tsx
{!isPrivateBooking && (
  <div className="blocked-state">
    <h3>Change Date/Tour - Blocked</h3>
    <p>⚠️ This booking is in a public departure with {relatedBookings.length} other booking(s).</p>
    <p>To change the date or tour for this booking only, convert it to private first.</p>
    <button onClick={convertToPrivate}>Convert to Private</button>
    <p>💡 Or change date/tour in the Departure modal to update all bookings</p>
  </div>
)}
```

**Visual Indicators**:
- 🟦 Badge "Public" en el header del modal
- ⚠️ Warning icon en sección bloqueada
- 🔒 Lock icon en inputs deshabilitados

---

### BookingModal - Private Booking

**Sección "Actions" Tab**:
```tsx
{isPrivateBooking && (
  <div className="edit-enabled">
    <h3>Change Date/Tour</h3>
    <p>This is a private booking. You can change the date and tour independently.</p>
    
    {/* Update Date */}
    <input type="date" value={newDate} onChange={...} />
    <button onClick={handleUpdateDate}>Update Date</button>
    
    {/* Update Tour */}
    <select value={newTourId} onChange={...}>
      {tours.map(t => <option value={t.id}>{t.name}</option>)}
    </select>
    <button onClick={handleUpdateTour}>Update Tour</button>
  </div>
)}
```

**Visual Indicators**:
- 🟪 Badge "Private" en el header del modal
- ✏️ Edit icon en inputs habilitados
- 🔓 Unlock icon indicando flexibilidad

---

## ✅ Validaciones y Reglas de Negocio

### Capacity Validation

**Regla**: `currentPax <= maxPax`

**Implementación**:
```javascript
// Al cambiar pax de una booking
const otherBookingsPax = departure.currentPax - booking.pax;
const availableSpace = departure.maxPax - otherBookingsPax;

if (newPax > availableSpace) {
  throw new Error(`Cannot increase to ${newPax} pax. Only ${availableSpace} space(s) available.`);
}
```

**Mensaje de Error**:
```
"Cannot increase to 5 pax. Only 3 space(s) available in this departure."
```

---

### Type Consistency

**Regla**: `booking.type === departure.type`

**Implementación**:
```javascript
// Al convertir booking
t.update(bookingRef, { type: newType });
t.update(departureRef, { type: newType });  // Si es 1-to-1
```

**Validación**:
```javascript
if (booking.type !== departure.type) {
  console.error('Type mismatch detected!');
  // Auto-fix o reportar
}
```

---

### Auto-Cleanup

**Regla**: Departures vacíos se eliminan automáticamente

**Triggers**:
1. `moveBooking`: Departure original queda vacío
2. `convertBookingType` (Private → Public): Departure privado queda vacío
3. `deleteBooking`: Último booking en departure

**Implementación**:
```javascript
if (newCurrentPax <= 0) {
  t.delete(departureRef);  // ✨ Ghost departure prevention
} else {
  t.update(departureRef, { currentPax: newCurrentPax });
}
```

---

## 🧪 Test Coverage

### Casos Cubiertos (18/18 passing)

**Capacity Management**:
- ✅ Initial capacity correct
- ✅ Capacity increase/decrease
- ✅ Overflow prevention

**Public → Private**:
- ✅ Split creates new departure
- ✅ Original departure updated
- ✅ Types set correctly

**Private → Public**:
- ✅ Join existing departure
- ✅ Types updated
- ✅ MaxPax enforced

**Date/Tour Updates**:
- ✅ Private: Independent updates
- ✅ Public: Group updates

**Ghost Departures**:
- ✅ No leftovers after move
- ✅ No leftovers after conversion
- ✅ Cleanup verified

---

## 📚 Referencias

- `backend_status.md` - Estado general del backend
- `API_REFERENCE.md` - Endpoints detallados
- `test_complex_scenarios.js` - Suite de tests
- `BookingModal.tsx` - Implementación frontend
- `bookings.controller.js` - Lógica backend

---

**Última Verificación**: November 22, 2025  
**Tests**: 18/18 passing ✅  
**Estado**: 🟢 Production Ready
