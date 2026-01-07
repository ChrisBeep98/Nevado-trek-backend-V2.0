# Guía Completa de Endpoints Públicos - Nevado Trek API

**Versión**: v2.6.0  
**Última Actualización**: 7 de Enero, 2026  
**Estado**: 🟢 PRODUCCIÓN OPERATIVA

## 📋 Información General

**URL Base de Producción:** `https://api-wgfhwjbpva-uc.a.run.app` (o vía Cloud Functions URL directa)

**Autenticación:** NO se requiere para endpoints públicos.

**Cache & Real-time:** 
- Los endpoints **GET** tienen capas de cache (CDN). 
- **CRÍTICO:** Para obtener datos frescos (ej. tras una reserva), añadir el parámetro `?t=Date.now()` a la URL.

---

## 🌐 Endpoints Disponibles

1. `GET /public/tours` - Lista completa de tours activos.
2. `GET /public/tours/listing` - **NUEVO:** Lista optimizada (ligera) para tarjetas.
3. `GET /public/departures` - Salidas públicas disponibles con cupos.
4. `POST /public/bookings/join` - Unirse a una salida existente.
5. `POST /public/bookings/private` - Solicitar nueva salida privada.

---

## 📖 Endpoint 1: GET /public/tours/listing (Optimizado)

**Propósito:** Obtener solo los datos necesarios para renderizar "Tour Cards" en la web. ~65% más ligero que el endpoint completo.

**URL:** `GET /public/tours/listing`

### Response Format (200 OK)
```json
[
  {
    "tourId": "Au3wVFDw6Y2YlEtSlLoS",
    "name": { "es": "...", "en": "..." },
    "shortDescription": { "es": "...", "en": "..." },
    "altitude": { "es": "4114m", "en": "4114m" },
    "difficulty": "Medium",
    "totalDays": 3,
    "pricingTiers": [...],
    "images": ["https://..."],
    "isActive": true
  }
]
```

---

## 📖 Endpoint 2: GET /public/departures

**Propósito:** Listar salidas públicas que tienen espacio disponible y son futuras.

**URL:** `GET /public/departures`  
**Refresh forzado:** `GET /public/departures?t=17000000000`

### Response Format (200 OK)
```json
[
  {
    "departureId": "wHeL7YEtpqTZfhTDxEtL",
    "tourId": "Au3wVFDw6Y2YlEtSlLoS",
    "date": "2025-12-25T12:00:00.000Z",
    "type": "public",
    "status": "open",
    "maxPax": 8,
    "currentPax": 3,
    "pricingSnapshot": [...]
  }
]
```
*Nota: La propiedad `date` ahora se entrega directamente como **ISO String**.*

---

## 📖 Endpoint 3: POST /public/bookings/join

**Propósito:** Unirse a una salida pública.

**Request Body:**
```json
{
  "departureId": "ID_DE_LA_SALIDA",
  "customer": {
    "name": "Nombre",
    "email": "email@test.com",
    "phone": "+573001234567",
    "document": "12345678"
  },
  "pax": 2
}
```

---

## 📖 Endpoint 4: POST /public/bookings/private

**Propósito:** Solicitar una salida privada en una fecha específica.

**Request Body:**
```json
{
  "tourId": "ID_DEL_TOUR",
  "date": "YYYY-MM-DD",
  "customer": { ... },
  "pax": 4
}
```
*Regla de Oro: Enviar la fecha en formato YYYY-MM-DD. El servidor la normalizará a Noon UTC.*

---

## 💡 Manejo de Fechas (Frontend tips)

A diferencia de versiones anteriores, el backend v2.6+ ya no entrega Timestamps crudos de Firestore en los endpoints de lectura principales.

1. **Formato ISO:** Los campos `date`, `createdAt` y `updatedAt` vienen como strings ISO (ej. `2025-12-25T12:00:00.000Z`).
2. **Uso en JS:** Simplemente hacer `new Date(response.date)`.
3. **Noon UTC Rule:** Todas las salidas se guardan a las 12:00 PM UTC para evitar que el offset de Colombia (UTC-5) las mueva al día anterior.

---

## ⚡ Cache Bypass (Estrategia recomendada)

Para asegurar que el usuario vea la actualización de cupos inmediatamente después de reservar:

```javascript
// Hook o servicio de Departures
async function fetchDepartures(force = false) {
  const url = `/public/departures${force ? '?t=' + Date.now() : ''}`;
  return fetch(url).then(r => r.json());
}

// Tras un booking exitoso:
await createBooking(...);
const freshData = await fetchDepartures(true); // Bypass cache
```

---

## ⚠️ Errores Comunes

| Código | Error | Causa / Solución |
|--------|-------|------------------|
| 429 | Too Many Requests | Límite de 5 reservas por 15 min. |
| 400 | Insufficient capacity | No hay cupos suficientes para el pax solicitado. |
| 503 | Service Unavailable | Problema temporal de facturación o despliegue (Verificado Jan 7). |

---

**Soporte Técnico:** Backend desplegado en Firebase proyecto `nevadotrektest01`.  
**Versión de API:** 2.6.0