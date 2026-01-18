# Backend API - Ejemplos Detallados y Casos de Uso

**Version**: v2.6  
**Last Updated**: November 25, 2025  
**Audience**: Developers, API consumers

---

## 📚 TABLA DE CONTENIDOS

1. [Autenticación](#autenticación)
2. [Tours - Ejemplos Completos](#tours)
3. [Departures - Ejemplos Completos](#departures)
4. [Bookings - Ejemplos Completos](#bookings)
5. [Casos de Uso Completos](#casos-de-uso)
6. [Error Handling](#error-handling)
7. [Troubleshooting](#troubleshooting)

---

## 🔐 AUTENTICACIÓN

### Admin Key Setup

**Header requerido en TODOS los endpoints `/admin/*`**:

```http
X-Admin-Secret-Key: nevadotrek2025
```

### Ejemplo con cURL

```bash
curl -X GET \
  https://us-central1-nevadotrektest01.cloudfunctions.net/api/admin/tours \
  -H "X-Admin-Secret-Key: nevadotrek2025"
```

### Ejemplo con JavaScript (Axios)

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://us-central1-nevadotrektest01.cloudfunctions.net/api'
});

// Interceptor global para admin key
api.interceptors.request.use((config) => {
  config.headers['X-Admin-Secret-Key'] = 'nevadotrek2025';
  return config;
});

// Uso
const tours = await api.get('/admin/tours');
```

### Ejemplo con Postman

**Environment Variables**:
```
BASE_URL = https://us-central1-nevadotrektest01.cloudfunctions.net/api
ADMIN_KEY = nevadotrek2025
```

**Headers** (Pre-request script):
```javascript
pm.request.headers.add({
    key: 'X-Admin-Secret-Key',
    value: pm.environment.get('ADMIN_KEY')
});
```

---

## 🎯 TOURS

### 1. Crear Tour Completo

**Request**:
```http
POST /admin/tours
Content-Type: application/json
X-Admin-Secret-Key: nevadotrek2025
```

**Body**:
```json
{
  "name": {
    "es": "Trekking Nevado del Ruiz",
    "en": "Nevado del Ruiz Trekking"
  },
  "description": {
    "es": "Expedición de 3 días al volcán nevado más alto de Colombia",
    "en": "3-day expedition to Colombia's highest snow-capped volcano"
  },
  "duration": 3,
  "difficulty": "challenging",
  "location": "Parque Nacional Natural Los Nevados, Colombia",
  "itinerary": [
    {
      "day": 1,
      "title": {
        "es": "Llegada y aclimatación",
        "en": "Arrival and acclimatization"
      },
      "activities": {
        "es": "Llegada a Manizales, traslado al refugio, caminata de aclimatación",
        "en": "Arrival in Manizales, transfer to refuge, acclimatization hike"
      }
    },
    {
      "day": 2,
      "title": {
        "es": "Ascenso al cráter",
        "en": "Crater ascent"
      },
      "activities": {
        "es": "Inicio a las 2 AM, ascenso de 6-8 horas, retorno al refugio",
        "en": "Start at 2 AM, 6-8 hour ascent, return to refuge"
      }
    },
    {
      "day": 3,
      "title": {
        "es": "Descenso y retorno",
        "en": "Descent and return"
      },
      "activities": {
        "es": "Descenso al valle, traslado a Manizales",
        "en": "Descent to valley, transfer to Manizales"
      }
    }
  ],
  "pricing": [
    {
      "minPax": 1,
      "maxPax": 2,
      "pricePerPerson": 1500000
    },
    {
      "minPax": 3,
      "maxPax": 5,
      "pricePerPerson": 1200000
    },
    {
      "minPax": 6,
      "maxPax": 8,
      "pricePerPerson": 1000000
    }
  ],
  "images": {
    "main": "https://example.com/images/nevado-ruiz-main.jpg",
    "gallery": [
      "https://example.com/images/nevado-ruiz-1.jpg",
      "https://example.com/images/nevado-ruiz-2.jpg",
      "https://example.com/images/nevado-ruiz-3.jpg"
    ]
  },
  "isActive": true
}
```

**Response** (201 Created):
```json
{
  "tourId": "tour_abc123",
  "name": {
    "es": "Trekking Nevado del Ruiz",
    "en": "Nevado del Ruiz Trekking"
  },
  "description": { "es": "...", "en": "..." },
  "duration": 3,
  "difficulty": "challenging",
  "location": "Parque Nacional Natural Los Nevados, Colombia",
  "itinerary": [...],
  "pricing": [...],
  "images": {...},
  "isActive": true,
  "createdAt": "2025-11-25T22:00:00.000Z",
  "updatedAt": "2025-11-25T22:00:00.000Z"
}
```

### 2. Obtener Todos los Tours

**Request**:
```http
GET /admin/tours
X-Admin-Secret-Key: nevadotrek2025
```

**Response** (200 OK):
```json
{
  "tours": [
    {
      "tourId": "tour_abc123",
      "name": { "es": "...", "en": "..." },
      "duration": 3,
      "difficulty": "challenging",
      "isActive": true
    },
    {
      "tourId": "tour_def456",
      "name": { "es": "...", "en": "..." },
      "duration": 5,
      "difficulty": "moderate",
      "isActive": true
    }
  ]
}
```

### 3. Actualizar Tour (Partial Update)

**Request**:
```http
PUT /admin/tours/tour_abc123
Content-Type: application/json
X-Admin-Secret-Key: nevadotrek2025
```

**Body** (Solo los campos a actualizar):
```json
{
  "pricing": [
    {
      "minPax": 1,
      "maxPax": 2,
      "pricePerPerson": 1600000
    },
    {
      "minPax": 3,
      "maxPax": 5,
      "pricePerPerson": 1300000
    },
    {
      "minPax": 6,
      "maxPax": 8,
      "pricePerPerson": 1100000
    }
  ]
}
```

**Response** (200 OK):
```json
{
  "message": "Tour updated successfully",
  "tour": {
    "tourId": "tour_abc123",
    "name": { "es": "...", "en": "..." },
    "pricing": [
      { "minPax": 1, "maxPax": 2, "pricePerPerson": 1600000 },
      { "minPax": 3, "maxPax": 5, "pricePerPerson": 1300000 },
      { "minPax": 6, "maxPax": 8, "pricePerPerson": 1100000 }
    ],
    "updatedAt": "2025-11-25T22:30:00.000Z"
  }
}
```

### 4. Soft Delete (Desactivar Tour)

**Request**:
```http
DELETE /admin/tours/tour_abc123
X-Admin-Secret-Key: nevadotrek2025
```

**Response** (200 OK):
```json
{
  "message": "Tour deactivated successfully",
  "tourId": "tour_abc123"
}
```

**Nota**: El tour se marca como `isActive: false`, NO se elimina de la BD.

---

## 📅 DEPARTURES

### 1. Crear Departure (Private)

**Request**:
```http
POST /admin/departures
Content-Type: application/json
X-Admin-Secret-Key: nevadotrek2025
```

**Body**:
```json
{
  "tourId": "tour_abc123",
  "date": "2025-12-15T00:00:00.000Z",
  "type": "private",
  "status": "confirmed",
  "maxPax": 8
}
```

**Response** (201 Created):
```json
{
  "departureId": "dep_xyz789",
  "tourId": "tour_abc123",
  "date": "2025-12-15T00:00:00.000Z",
  "type": "private",
  "status": "confirmed",
  "currentPax": 0,
  "maxPax": 8,
  "pricing": {
    "basePrice": 0,
    "finalPrice": 0
  },
  "createdAt": "2025-11-25T22:00:00.000Z",
  "updatedAt": "2025-11-25T22:00:00.000Z"
}
```

### 2. Obtener Departures (Calendar View)

**Request**:
```http
GET /admin/departures?month=2025-12
X-Admin-Secret-Key: nevadotrek2025
```

**Response** (200 OK):
```json
{
  "departures": [
    {
      "departureId": "dep_xyz789",
      "tourId": "tour_abc123",
      "tourName": {
        "es": "Trekking Nevado del Ruiz",
        "en": "Nevado del Ruiz Trekking"
      },
      "date": "2025-12-15T00:00:00.000Z",
      "type": "private",
      "status": "confirmed",
      "currentPax": 4,
      "maxPax": 8
    },
    {
      "departureId": "dep_abc456",
      "tourId": "tour_def456",
      "tourName": { "es": "...", "en": "..." },
      "date": "2025-12-20T00:00:00.000Z",
      "type": "public",
      "status": "open",
      "currentPax": 6,
      "maxPax": 8
    }
  ]
}
```

### 3. Update Departure Date

**Request**:
```http
PUT /admin/departures/dep_xyz789/date
Content-Type: application/json
X-Admin-Secret-Key: nevadotrek2025
```

**Body**:
```json
{
  "newDate": "2025-12-20T00:00:00.000Z"
}
```

**Response** (200 OK):
```json
{
  "message": "Departure date updated successfully",
  "departure": {
    "departureId": "dep_xyz789",
    "date": "2025-12-20T00:00:00.000Z",
    "updatedAt": "2025-11-25T22:30:00.000Z"
  }
}
```

### 4. Update Departure Tour

**Request**:
```http
PUT /admin/departures/dep_xyz789/tour
Content-Type: application/json
X-Admin-Secret-Key: nevadotrek2025
```

**Body**:
```json
{
  "newTourId": "tour_def456"
}
```

**Response** (200 OK):
```json
{
  "message": "Departure tour updated successfully",
  "departure": {
    "departureId": "dep_xyz789",
    "tourId": "tour_def456",
    "pricing": {
      "basePrice": 1200000,
      "finalPrice": 1200000
    },
    "updatedAt": "2025-11-25T22:30:00.000Z"
  }
}
```

### 5. Split Departure

**Request**:
```http
POST /admin/departures/dep_xyz789/split
Content-Type: application/json
X-Admin-Secret-Key: nevadotrek2025
```

**Body**:
```json
{
  "bookingId": "book_123456"
}
```

**Response** (200 OK):
```json
{
  "message": "Departure split successfully",
  "newDeparture": {
    "departureId": "dep_new123",
    "tourId": "tour_abc123",
    "date": "2025-12-15T00:00:00.000Z",
    "type": "private",
    "currentPax": 2,
    "maxPax": 8
  },
  "originalDeparture": {
    "departureId": "dep_xyz789",
    "currentPax": 2
  }
}
```

---

## 📋 BOOKINGS

### 1. Crear Booking (Nuevo Departure)

**Request**:
```http
POST /admin/bookings
Content-Type: application/json
X-Admin-Secret-Key: nevadotrek2025
```

**Body**:
```json
{
  "tourId": "tour_abc123",
  "date": "2025-12-15T00:00:00.000Z",
  "pax": 4,
  "type": "private",
  "customer": {
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "phone": "+57 300 123 4567",
    "document": "CC 12345678",
    "note": "Grupo familiar"
  }
}
```

**Response** (201 Created):
```json
{
  "bookingId": "book_abc123",
  "departureId": "dep_new456",
  "tourId": "tour_abc123",
  "date": "2025-12-15T00:00:00.000Z",
  "type": "private",
  "status": "pending",
  "pax": 4,
  "customer": {
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "phone": "+57 300 123 4567",
    "document": "CC 12345678",
    "note": "Grupo familiar"
  },
  "pricing": {
    "basePrice": 1200000,
    "discountAmount": 0,
    "discountReason": "",
    "finalPrice": 4800000
  },
  "createdAt": "2025-11-25T22:00:00.000Z",
  "updatedAt": "2025-11-25T22:00:00.000Z"
}
```

### 2. Join Existing Departure ⭐ NEW (v2.5-v2.6)

**Request**:
```http
POST /admin/bookings/join
Content-Type: application/json
X-Admin-Secret-Key: nevadotrek2025
```

**Body**:
```json
{
  "departureId": "dep_xyz789",
  "pax": 2,
  "customer": {
    "name": "María González",
    "email": "maria@example.com",
    "phone": "+57 301 987 6543",
    "document": "CC 98765432"
  }
}
```

**Response** (200 OK):
```json
{
  "bookingId": "book_def456",
  "departureId": "dep_xyz789",
  "tourId": "tour_abc123",
  "date": "2025-12-15T00:00:00.000Z",
  "type": "public",
  "status": "pending",
  "pax": 2,
  "customer": {
    "name": "María González",
    "email": "maria@example.com",
    "phone": "+57 301 987 6543",
    "document": "CC 98765432"
  },
  "pricing": {
    "basePrice": 1000000,
    "discountAmount": 0,
    "discountReason": "",
    "finalPrice": 2000000
  },
  "createdAt": "2025-11-25T22:00:00.000Z",
  "updatedAt": "2025-11-25T22:00:00.000Z"
}
```

**Validación automática**: El sistema verifica que `currentPax + pax <= maxPax` antes de crear.

### 3. Get Single Booking

**Request**:
```http
GET /admin/bookings/book_abc123
X-Admin-Secret-Key: nevadotrek2025
```

**Response** (200 OK):
```json
{
  "bookingId": "book_abc123",
  "departureId": "dep_new456",
  "tourId": "tour_abc123",
  "tourName": {
    "es": "Trekking Nevado del Ruiz",
    "en": "Nevado del Ruiz Trekking"
  },
  "date": "2025-12-15T00:00:00.000Z",
  "type": "private",
  "status": "confirmed",
  "pax": 4,
  "customer": {...},
  "pricing": {...},
  "createdAt": "2025-11-25T22:00:00.000Z",
  "updatedAt": "2025-11-25T22:30:00.000Z"
}
```

### 4. Update Booking Status

**Request**:
```http
PUT /admin/bookings/book_abc123/status
Content-Type: application/json
X-Admin-Secret-Key: nevadotrek2025
```

**Body**:
```json
{
  "status": "confirmed"
}
```

**Response** (200 OK):
```json
{
  "message": "Booking status updated successfully",
  "booking": {
    "bookingId": "book_abc123",
    "status": "confirmed",
    "updatedAt": "2025-11-25T22:30:00.000Z"
  }
}
```

**Status options**: `"pending"`, `"confirmed"`, `"paid"`, `"cancelled"`

**⚠ Warning**: `"cancelled"` is **irreversible** - once cancelled, cannot be reactivated.

### 5. Update Booking Pax

**Request**:
```http
PUT /admin/bookings/book_abc123/pax
Content-Type: application/json
X-Admin-Secret-Key: nevadotrek2025
```

**Body**:
```json
{
  "pax": 5
}
```

**Response** (200 OK):
```json
{
  "message": "Booking pax updated successfully",
  "booking": {
    "bookingId": "book_abc123",
    "pax": 5,
    "pricing": {
      "basePrice": 1200000,
      "finalPrice": 6000000
    },
    "updatedAt": "2025-11-25T22:30:00.000Z"
  }
}
```

**Validación**: Verifica capacidad disponible antes de aumentar pax.

### 6. Apply Discount (By Amount)

**Request**:
```http
POST /admin/bookings/book_abc123/discount
Content-Type: application/json
X-Admin-Secret-Key: nevadotrek2025
```

**Body**:
```json
{
  "discountAmount": 500000,
  "reason": "Descuento por cliente frecuente"
}
```

**Response** (200 OK):
```json
{
  "message": "Discount applied successfully",
  "booking": {
    "bookingId": "book_abc123",
    "pricing": {
      "basePrice": 4800000,
      "discountAmount": 500000,
      "discountReason": "Descuento por cliente frecuente",
      "finalPrice": 4300000
    },
    "updatedAt": "2025-11-25T22:30:00.000Z"
  }
}
```

### 7. Apply Discount (Direct Final Price)

**Request**:
```http
POST /admin/bookings/book_abc123/discount
Content-Type: application/json
X-Admin-Secret-Key: nevadotrek2025
```

**Body**:
```json
{
  "newFinalPrice": 4000000,
  "reason": "Precio negociado corporativo"
}
```

**Response** (200 OK):
```json
{
  "message": "Discount applied successfully",
  "booking": {
    "bookingId": "book_abc123",
    "pricing": {
      "basePrice": 4800000,
      "discountAmount": 800000,
      "discountReason": "Precio negociado corporativo",
      "finalPrice": 4000000
    },
    "updatedAt": "2025-11-25T22:30:00.000Z"
  }
}
```

### 8. Convert Booking Type (Private → Public)

**Request**:
```http
POST /admin/bookings/book_abc123/convert-type
Content-Type: application/json
X-Admin-Secret-Key: nevadotrek2025
```

**Body**:
```json
{
  "targetType": "public"
}
```

**Response** (200 OK):
```json
{
  "message": "Booking converted successfully",
  "booking": {
    "bookingId": "book_abc123",
    "type": "public",
    "departureId": "dep_xyz789",
    "updatedAt": "2025-11-25T22:30:00.000Z"
  },
  "departure": {
    "departureId": "dep_xyz789",
    "type": "public",
    "updatedAt": "2025-11-25T22:30:00.000Z"
  }
}
```

### 9. Move Booking to Different Departure

**Request**:
```http
POST /admin/bookings/book_abc123/move
Content-Type: application/json
X-Admin-Secret-Key: nevadotrek2025
```

**Body**:
```json
{
  "newTourId": "tour_def456",
  "newDate": "2025-12-20T00:00:00.000Z"
}
```

**Response** (200 OK):
```json
{
  "message": "Booking moved successfully",
  "booking": {
    "bookingId": "book_abc123",
    "departureId": "dep_new789",
    "tourId": "tour_def456",
    "date": "2025-12-20T00:00:00.000Z",
    "pricing": {
      "basePrice": 1100000,
      "finalPrice": 4400000
    },
    "updatedAt": "2025-11-25T22:30:00.000Z"
  },
  "oldDeparture": {
    "departureId": "dep_xyz789",
    "currentPax": 0,
    "deleted": true
  },
  "newDeparture": {
    "departureId": "dep_new789",
    "currentPax": 4
  }
}
```

**Lógica**:
1. Encuentra o crea departure destino
2. Valida capacidad
3. Mueve booking
4. Actualiza currentPax en ambos
5. Si old departure queda en 0, se elimina automáticamente

---

## 🎬 CASOS DE USO COMPLETOS

### Caso 1: Booking Privado Completo

**Flujo**:
```
1. Admin crea booking privado
   → POST /admin/bookings
   → Sistema crea departure automáticamente
   
2. Cliente confirma
   → PUT /admin/bookings/:id/status {"status": "confirmed"}
   
3. Cliente paga depósito
   → PUT /admin/bookings/:id/status {"status": "paid"}
   → POST /admin/bookings/:id/discount (opcional)
   
4. Cliente cancela (última hora)
   → PUT /admin/bookings/:id/status {"status": "cancelled"}
   → Sistema cancela departure también
```

### Caso 2: Join Public Departure

**Flujo**:
```
1. Admin identifica departure público disponible
   → GET /admin/departures?month=2025-12
   → Encuentra dep_xyz789 con 6/8 pax
   
2. Cliente quiere unirse
   → POST /admin/bookings/join
   → Body: { departureId: "dep_xyz789", pax: 2, customer: {...} }
   → Sistema valida: 6 + 2 = 8 ≤ 8 maxPax ✅
   
3. Booking creado
   → tipo "public" automáticamente
   → departure.currentPax actualizado a 8
   → status "full" automático al llegar a maxPax
```

### Caso 3: Convert Private to Public

**Flujo**:
```
1. Cliente privado quiere compartir costos
   → POST /admin/bookings/:id/convert-type
   → Body: { targetType: "public" }
   
2. Sistema convierte
   → booking.type = "public"
   → departure.type = "public"
   → departure.status = "open"
   
3. Otros clientes pueden unirse
   → POST /admin/bookings/join
   → Mismo departure ahora público
```

### Caso 4: Move Booking (Transfer)

**Flujo**:
```
1. Cliente público quiere cambiar fecha
   → POST /admin/bookings/:id/move
   → Body: { newTourId: "tour_abc123", newDate: "2025-12-25" }
   
2. Sistema busca/crea departure destino
   → Encuentra dep_new123 o crea nuevo
   → Valida capacidad
   
3. Transfer ejecutado
   → Booking sale de old departure
   → Booking entra a new departure
   → old departure.currentPax -= pax
   → new departure.currentPax += pax
   → Si old departure queda en 0 → se elimina
```

### Caso 5: Cancellation con Ghost Cleanup

**Flujo**:
```
1. Booking público se cancela
   → PUT /admin/bookings/:id/status {"status": "cancelled"}
   → departure.currentPax -= pax
   
2. Era el único booking
   → currentPax ahora = 0
   → Sistema detecta "ghost departure"
   → Deletion automática del departure
   
Resultado: Base de datos limpia, sin departures vacíos
```

---

## ⚠️ ERROR HANDLING

### Errores Comunes

#### 1. Unauthorized (401)
```json
{
  "error": "Unauthorized"
}
```
**Causa**: Missing o invalid admin key  
**Solución**: Verificar header `X-Admin-Secret-Key`

#### 2. Not Found (404)
```json
{
  "error": "Tour not found"
}
```
**Causa**: ID no existe  
**Solución**: Verificar tourId/departureId/bookingId

#### 3. Validation Error (400)
```json
{
  "error": "Invalid or missing 'pax'"
}
```
**Causa**: Payload incorrecto  
**Solución**: Revisar request body structure

#### 4. Capacity Error (400)
```json
{
  "error": "Not enough capacity. Only 2 space(s) available"
}
```
**Causa**: Excede maxPax  
**Solución**: Reducir pax o elegir otro departure

#### 5. Irreversible Action (400)
```json
{
  "error": "Cancelled bookings cannot be reactivated"
}
```
**Causa**: Intentando reactivar cancelled booking  
**Solución**: El cancellation es permanente

---

## 🔧 TROUBLESHOOTING

### Problem: "Booking no se crea"

**Checklist**:
1. ✅ Admin key correcto?
2. ✅ tourId existe?
3. ✅ date es válido ISO 8601?
4. ✅ pax >= 1?
5. ✅ customer.email válido?
6. ✅ type es "public" o "private"?

### Problem: "Join booking falla"

**Checklist**:
1. ✅ departureId existe?
2. ✅ Departure status es "open"?
3. ✅ currentPax + pax <= maxPax?
4. ✅ Date no es pasado?

### Problem: "API Returns 500 Internal Server Error on Staging"

**Posible Causa 1: Falta de Índices en Firestore**
Si el log muestra: `FAILED_PRECONDITION: The query requires an index.`
*   **Contexto**: Sucede al crear un entorno nuevo (e.g., Staging) donde los índices compuestos no existen automáticamente.
*   **Solución**: Abrir el link que proporciona el error en los logs y hacer clic en "Crear Índice". Se requieren índices para `departures` filtrando por `status`, `type` y `date`.

**Posible Causa 2: ReferenceError en Código**
Si el log muestra: `pricePerPax is not defined`
*   **Causa**: Bug en `bookings.controller.js` (v2.6) donde se intentaba usar una variable definida dentro de una transacción (`db.runTransaction`) fuera de su scope para enviar notificaciones.
*   **Solución**: Mover la declaración `let pricePerPax;` al inicio de la función, fuera de la transacción.

### Problem: "Convert type no funciona"

**Para Public → Private**:
- ✅ Es el ÚNICO booking en departure?
- ✅ No hay otros bookings en ese departure?

**Para Private → Public**:
- ✅ Siempre debería funcionar

### Problem: "Move booking falla"

**Checklist**:
1. ✅ newTourId existe?
2. ✅ newDate es futuro?
3. ✅ Departure destino tiene capacidad?
4. ✅ Booking no está cancelled?

---

## 📊 RESPONSE CODES SUMMARY

| Code | Meaning | When |
|------|---------|------|
| 200 | OK | Successful GET/PUT/DELETE |
| 201 | Created | Successful POST (create) |
| 400 | Bad Request | Validation error, business logic error |
| 401 | Unauthorized | Missing/invalid admin key |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Unexpected server error |

---

## 📚 RESOURCE RELATIONSHIPS

```
Tour (1) ──────> (N) Departures
                     │
                     └────> (N) Bookings
                     
1 Tour → Many Departures
1 Departure → Many Bookings (max 8)
```

---

**Document**: API Complete Examples  
**Version**: 1.0  
**Last Updated**: November 25, 2025
