# Guía Completa de Endpoints Públicos - Nevado Trek API

## 📋 Información General

**URL Base de Producción:** `https://us-central1-nevadotrektest01.cloudfunctions.net/api`

**Autenticación:** NO se requiere para endpoints públicos

**Rate Limiting:** 
- **GET** endpoints: Sin límite (cacheados)
- **POST** endpoints: 5 requests por IP cada 15 minutos

---

## 🌐 Endpoints Disponibles

### 1. GET /public/tours
### 2. GET /public/departures  
### 3. POST /public/bookings/join
### 4. POST /public/bookings/private

---

## 📖 Endpoint 1: GET /public/tours

**Propósito:** Obtener lista de todos los tours activos disponibles para reserva.

**URL:** `GET https://us-central1-nevadotrektest01.cloudfunctions.net/api/public/tours`

**Headers:**
```
No se requieren headers especiales
```

**Response Headers:**
```
Cache-Control: public, max-age=300, s-maxage=600
```
*Significa: Los datos se pueden cachear 5 minutos en browser, 10 minutos en CDN*

### Response Format

**Status:** `200 OK`

**Body:** Array de objetos Tour

```json
[
  {
    "tourId": "Au3wVFDw6Y2YlEtSlLoS",
    "name": {
      "es": "Trekking Glaciar Santa Isabel",
      "en": "Santa Isabel Glacier Trekking"
    },
    "description": {
      "es": "Descripción completa en español...",
      "en": "Full description in English..."
    },
    "shortDescription": {
      "es": "Descripción corta",
      "en": "Short description"
    },
    "subtitle": {
      "es": "Alcanza el techo del Parque Nacional Natural Los Nevados",
      "en": "Reach the summit of Los Nevados National Natural Park"
    },
    "difficulty": "Medium",
    "totalDays": 3,
    "distance": "15km",
    "altitude": {
      "es": "4114m",
      "en": "4114m"
    },
    "temperature": {
      "es": "0-15°C",
      "en": "32-59°F"  
    },
    "images": [
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg"
    ],
    "pricingTiers": [
      {
        "minPax": 1,
        "maxPax": 1,
        "priceCOP": 980000,
        "priceUSD": 250
      },
      {
        "minPax": 2,
        "maxPax": 2,
        "priceCOP": 720000,
        "priceUSD": 180
      },
      {
        "minPax": 3,
        "maxPax": 3,
        "priceCOP": 600000,
        "priceUSD": 150
      },
      {
        "minPax": 4,
        "maxPax": 8,
        "priceCOP": 540000,
        "priceUSD": 135
      }
    ],
    "inclusions": {
      "es": ["Guía profesional", "Equipo de seguridad", "Alimentación"],
      "en": ["Professional guide", "Safety equipment", "Meals"]
    },
    "exclusions": {
      "es": ["Transporte a punto de encuentro", "Seguro personal"],
      "en": ["Transport to meeting point", "Personal insurance"]
    },
    "itinerary": [
      {
        "day": 1,
        "title": {
          "es": "Día 1: Ascenso al campamento base",
          "en": "Day 1: Ascent to base camp"
        },
        "description": {
          "es": "Descripción del día 1...",
          "en": "Day 1 description..."
        }
      }
    ],
    "faqs": [
      {
        "question": { "es": "¿Qué debo llevar?", "en": "What should I bring?" },
        "answer": { "es": "Lista de equipamiento...", "en": "Equipment list..." }
      }
    ],
    "recommendations": {
      "es": ["Ropa abrigada", "Botas de montaña"],
      "en": ["Warm clothing", "Hiking boots"]
    },
    "isActive": true,
    "version": 1,
    "createdAt": { "_seconds": 1700000000, "_nanoseconds": 0 },
    "updatedAt": { "_seconds": 1700000000, "_nanoseconds": 0 }
  }
]
```

### Ejemplo de Uso (JavaScript)

```javascript
// Función para obtener tours
async function getTours() {
  try {
    const response = await fetch(
      'https://us-central1-nevadotrektest01.cloudfunctions.net/api/public/tours'
    );
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const tours = await response.json();
    return tours;
  } catch (error) {
    console.error('Error fetching tours:', error);
    throw error;
  }
}

// Usar la función
getTours()
  .then(tours => {
    console.log(`Se encontraron ${tours.length} tours`);
    tours.forEach(tour => {
      console.log(`- ${tour.name.es} (${tour.difficulty})`);
    });
  })
  .catch(error => {
    console.error('No se pudieron cargar los tours');
  });
```

### Notas Importantes

1. **Precios por PAX:** El precio depende del número de personas (pax)
   - 1 persona: precio más alto (tour privado)
   - 4-8 personas: precio más bajo (economía de escala)

2. **Campos Bilingües:** Todos los textos tienen versión `es` y `en`
   - `name`, `description`, `shortDescription`, `subtitle`, `altitude`, `location` son bilingües
   - `subtitle` es **opcional** - puede estar ausente en algunos tours

3. **Dates de Firestore:** Los campos `createdAt` y `updatedAt` vienen en formato Firestore Timestamp con `_seconds` y `_nanoseconds`. Convertir a Date:
   ```javascript
   const date = new Date(timestamp._seconds * 1000);
   ```

---

## 📖 Endpoint 2: GET /public/departures

**Propósito:** Obtener salidas públicas disponibles para unirse (próximas fechas con cupos).

**URL:** `GET https://us-central1-nevadotrektest01.cloudfunctions.net/api/public/departures`

**Query Parameters:** Ninguno requerido

**Response Headers:**
```
Cache-Control: public, max-age=300, s-maxage=600
```

### Response Format

**Status:** `200 OK`

**Body:** Array de objetos Departure

```json
[
  {
    "departureId": "wHeL7YEtpqTZfhTDxEtL",
    "tourId": "Au3wVFDw6Y2YlEtSlLoS",
    "date": {
      "_seconds": 1733356800,
      "_nanoseconds": 0
    },
    "type": "public",
    "status": "open",
    "maxPax": 8,
    "currentPax": 3,
    "pricingSnapshot": [
      {
        "minPax": 1,
        "maxPax": 1,
        "priceCOP": 980000,
        "priceUSD": 250
      },
      {
        "minPax": 2,
        "maxPax": 2,
        "priceCOP": 720000,
        "priceUSD": 180
      },
      {
        "minPax": 3,
        "maxPax": 3,
        "priceCOP": 600000,
        "priceUSD": 150
      },
      {
        "minPax": 4,
        "maxPax": 8,
        "priceCOP": 540000,
        "priceUSD": 135
      }
    ],
    "createdAt": { "_seconds": 1700000000, "_nanoseconds": 0 }
  }
]
```

### Ejemplo de Uso (JavaScript)

```javascript
async function getAvailableDepartures() {
  try {
    const response = await fetch(
      'https://us-central1-nevadotrektest01.cloudfunctions.net/api/public/departures'
    );
    
    const departures = await response.json();
    
    // Filtrar solo las que tienen cupos disponibles
    const availableDepartures = departures.filter(dep => 
      dep.currentPax < dep.maxPax
    );
    
    return availableDepartures.map(dep => ({
      id: dep.departureId,
      tourId: dep.tourId,
      date: new Date(dep.date._seconds * 1000),
      availableSlots: dep.maxPax - dep.currentPax,
      currentPax: dep.currentPax,
      maxPax: dep.maxPax,
      pricing: dep.pricingSnapshot
    }));
  } catch (error) {
    console.error('Error fetching departures:', error);
    throw error;
  }
}

// Ejemplo de uso
getAvailableDepartures()
  .then(departures => {
    departures.forEach(dep => {
      console.log(`Salida ${dep.date.toLocaleDateString()}`);
      console.log(`  Cupos: ${dep.availableSlots} disponibles de ${dep.maxPax}`);
      console.log(`  Precio actual: $${getCurrentPrice(dep.currentPax, dep.pricing)} COP`);
    });
  });

// Helper para calcular precio según participantes actuales
function getCurrentPrice(currentPax, pricingTiers) {
  // Encontrar el tier correcto según currentPax + 1 (nuevo participante)
  const totalPax = currentPax + 1;
  const tier = pricingTiers.find(t => 
    totalPax >= t.minPax && totalPax <= t.maxPax
  );
  return tier ? tier.priceCOP : pricingTiers[0].priceCOP;
}
```

### Notas Importantes

1. **Solo Salidas Públicas y Abiertas:**
   - `type: "public"` (no se muestran privadas)
   - `status: "open"` (no se muestran cerradas/completadas/canceladas)
   - `date >= hoy` (solo futuras)

2. **Cupos Disponibles:**
   - `currentPax`: Personas ya inscritas
   - `maxPax`: Capacidad máxima
   - Disponibles: `maxPax - currentPax`

3. **Precio Dinámico:** El precio por persona depende de cuántos ya están inscritos. A más personas, menor precio individual.

---

## 📖 Endpoint 3: POST /public/bookings/join

**Propósito:** Unirse a una salida pública existente.

**URL:** `POST https://us-central1-nevadotrektest01.cloudfunctions.net/api/public/bookings/join`

**Headers:**
```
Content-Type: application/json
```

**Rate Limiting:** 5 requests por IP cada 15 minutos

### Request Body

```json
{
  "departureId": "wHeL7YEtpqTZfhTDxEtL",
  "customer": {
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "phone": "+573001234567",
    "document": "1234567890",
    "note": "Soy vegetariano" // Opcional
  },
  "pax": 2
}
```

### Validaciones Automáticas

El backend valida automáticamente:
- ✅ La salida existe y es pública
- ✅ La salida está abierta (no cerrada/cancelada)
- ✅ Hay suficientes cupos disponibles
- ✅ El formato del email es válido
- ✅ El teléfono tiene formato internacional
- ✅ `pax` es un número positivo

### Response Format

**Success:** `201 Created`

```json
{
  "success": true,
  "bookingId": "218jrrriZAaXUCI6fprv",
  "departureId": "wHeL7YEtpqTZfhTDxEtL"
}
```

**Errors:**

```json
// Sin cupos disponibles
{
  "error": "No enough space. Available: 2, requested: 3"
}

// Salida no existe
{
  "error": "Departure not found"
}

// Rate limit excedido
{
  "error": "Demasiados intentos de reserva. Por favor intenta de nuevo en 15 minutos."
}
```

### Ejemplo Completo (JavaScript)

```javascript
async function joinPublicDeparture(departureId, customerData, pax) {
  try {
    const response = await fetch(
      'https://us-central1-nevadotrektest01.cloudfunctions.net/api/public/bookings/join',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          departureId: departureId,
          customer: {
            name: customerData.name,
            email: customerData.email,
            phone: customerData.phone, // Formato: +57300...
            document: customerData.document,
            note: customerData.note || '' // Opcional
          },
          pax: parseInt(pax)
        })
      }
    );

    // Verificar rate limiting
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      throw new Error(`Demasiadas solicitudes. Intenta en ${retryAfter} segundos.`);
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Error ${response.status}`);
    }

    const result = await response.json();
    console.log(`✅ Reserva creada: ${result.bookingId}`);
    return result;

  } catch (error) {
    console.error('Error al crear reserva:', error);
    throw error;
  }
}

// Ejemplo de uso en un formulario
document.getElementById('joinForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = {
    name: document.getElementById('name').value,
    email: document.getElementById('email').value,
    phone: document.getElementById('phone').value,
    document: document.getElementById('document').value,
    note: document.getElementById('note').value
  };
  
  const departureId = document.getElementById('departure').value;
  const pax = document.getElementById('pax').value;
  
  try {
    const result = await joinPublicDeparture(departureId, formData, pax);
    alert(`¡Reserva exitosa! ID: ${result.bookingId}`);
    // Redirigir a página de confirmación
    window.location.href = `/confirmacion?booking=${result.bookingId}`;
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
});
```

### Flujo Recomendado

1. Usuario selecciona un tour → `/public/tours`
2. Usuario ve fechas disponibles → `/public/departures?tourId=...`
3. Usuario llena formulario con sus datos
4. Frontend valida datos antes de enviar
5. Se envía request a `/public/bookings/join`
6. Si éxito → mostrar confirmación con `bookingId`
7. Enviar email de confirmación (tu sistema)

---

## 📖 Endpoint 4: POST /public/bookings/private

**Propósito:** Solicitar una nueva salida privada (crea departure + booking).

**URL:** `POST https://us-central1-nevadotrektest01.cloudfunctions.net/api/public/bookings/private`

**Headers:**
```
Content-Type: application/json
```

**Rate Limiting:** 5 requests por IP cada 15 minutos

### Request Body

```json
{
  "tourId": "Au3wVFDw6Y2YlEtSlLoS",
  "date": "2025-12-25",
  "customer": {
    "name": "María García",
    "email": "maria@example.com",
    "phone": "+573009876543",
    "document": "9876543210",
    "note": "Queremos guía bilingüe"
  },
  "pax": 4
}
```

### Validaciones Automáticas

- ✅ El tour existe y está activo
- ✅ La fecha es futura
- ✅ `pax` está entre 1 y el máximo permitido
- ✅ Datos del customer son válidos

### Response Format

**Success:** `201 Created`

```json
{
  "success": true,
  "bookingId": "abc123xyz",
  "departureId": "def456uvw"
}
```

**Errors:**

```json
// Tour inactivo
{
  "error": "Tour not active or not found"
}

// Fecha inválida
{
  "error": "Date must be in the future"
}
```

### Ejemplo Completo (JavaScript)

```javascript
async function createPrivateBooking(tourId, date, customerData, pax) {
  try {
    const response = await fetch(
      'https://us-central1-nevadotrektest01.cloudfunctions.net/api/public/bookings/private',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tourId,
          date, // Formato: YYYY-MM-DD
          customer: {
            name: customerData.name,
            email: customerData.email,
            phone: customerData.phone,
            document: customerData.document,
            note: customerData.note || ''
          },
          pax: parseInt(pax)
        })
      }
    );

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      throw new Error(`Demasiadas solicitudes. Espera ${retryAfter} segundos.`);
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Error ${response.status}`);
    }

    const result = await response.json();
    return result;

  } catch (error) {
    console.error('Error creando reserva privada:', error);
    throw error;
  }
}

// Ejemplo con selector de fecha
document.getElementById('privateForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const tourId = document.getElementById('tour').value;
  const date = document.getElementById('date').value; // input type="date"
  const pax = document.getElementById('pax').value;
  
  const customerData = {
    name: document.getElementById('name').value,
    email: document.getElementById('email').value,
    phone: document.getElementById('phone').value,
    document: document.getElementById('document').value,
    note: document.getElementById('specialRequests').value
  };
  
  try {
    const result = await createPrivateBooking(tourId, date, customerData, pax);
    alert(`¡Salida privada creada!\nBooking: ${result.bookingId}\nSalida: ${result.departureId}`);
    window.location.href = `/confirmacion?booking=${result.bookingId}`;
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
});
```

---

## 🔐 Rate Limiting - Manejo de Errores

### Response cuando se excede el límite

**Status:** `429 Too Many Requests`

**Headers:**
```
RateLimit-Limit: 5
RateLimit-Remaining: 0
RateLimit-Reset: 441
Retry-After: 441
```

**Body:**
```json
{
  "error": "Demasiados intentos de reserva. Por favor intenta de nuevo en 15 minutos."
}
```

### Ejemplo de Manejo en Frontend

```javascript
async function handleBookingRequest(requestFn) {
  try {
    const result = await requestFn();
    return { success: true, data: result };
  } catch (error) {
    // Verificar si es rate limit
    if (error.message.includes('Demasiados intentos')) {
      return {
        success: false,
        rateLimited: true,
        message: 'Has realizado demasiadas reservas. Por favor espera 15 minutos e intenta nuevamente.'
      };
    }
    
    // Otro tipo de error
    return {
      success: false,
      rateLimited: false,
      message: error.message
    };
  }
}

// Uso
const result = await handleBookingRequest(() => 
  joinPublicDeparture(depId, customerData, pax)
);

if (!result.success) {
  if (result.rateLimited) {
    showRateLimitWarning(result.message);
  } else {
    showError(result.message);
  }
}
```

---

## 💡 Mejores Prácticas

### 1. Validación en Frontend

```javascript
function validateCustomerData(data) {
  const errors = [];
  
  // Nombre
  if (!data.name || data.name.length < 3) {
    errors.push('El nombre debe tener al menos 3 caracteres');
  }
  
  // Email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    errors.push('Email inválido');
  }
  
  // Teléfono (formato internacional)
  const phoneRegex = /^\+\d{10,15}$/;
  if (!phoneRegex.test(data.phone)) {
    errors.push('Teléfono debe estar en formato internacional (+57300...)');
  }
  
  // Documento
  if (!data.document || data.document.length < 5) {
    errors.push('Documento inválido');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

### 2. Caching de Tours y Departures

```javascript
// Cache simple con localStorage
class TourCache {
  static CACHE_KEY = 'nevado_tours';
  static CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
  
  static async getTours() {
    const cached = localStorage.getItem(this.CACHE_KEY);
    
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      const age = Date.now() - timestamp;
      
      if (age < this.CACHE_DURATION) {
        console.log('Using cached tours');
        return data;
      }
    }
    
    // Fetch fresh data
    const tours = await fetch('/api/public/tours').then(r => r.json());
    
    // Save to cache
    localStorage.setItem(this.CACHE_KEY, JSON.stringify({
      data: tours,
      timestamp: Date.now()
    }));
    
    return tours;
  }
}
```

### 3. Formato de Fechas

```javascript
// Convertir Firestore Timestamp a Date
function firestoreToDate(timestamp) {
  if (!timestamp || !timestamp._seconds) return null;
  return new Date(timestamp._seconds * 1000);
}

// Formatear fecha para display
function formatDate(timestamp, locale = 'es-CO') {
  const date = firestoreToDate(timestamp);
  if (!date) return '';
  
  return date.toLocaleDateString(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Ejemplo: "miércoles, 25 de diciembre de 2025"
```

### 4. Cálculo de Precio Dinámico

```javascript
function calculatePrice(currentPax, newPax, pricingTiers, currency = 'COP') {
  const totalPax = currentPax + newPax;
  
  // Encontrar el tier correcto
  const tier = pricingTiers.find(t => 
    totalPax >= t.minPax && totalPax <= t.maxPax
  );
  
  if (!tier) {
    // Fallback al primer tier si no coincide
    return {
      pricePerPerson: pricingTiers[0][`price${currency}`],
      total: pricingTiers[0][`price${currency}`] * newPax,
      tier: pricingTiers[0]
    };
  }
  
  return {
    pricePerPerson: tier[`price${currency}`],
    total: tier[`price${currency}`] * newPax,
    tier
  };
}

// Ejemplo de uso
const departure = { currentPax: 2, pricingSnapshot: [...] };
const quote = calculatePrice(
  departure.currentPax,
  2, // nuevo grupo de 2 personas
  departure.pricingSnapshot,
  'COP'
);

console.log(`Precio por persona: $${quote.pricePerPerson.toLocaleString()}`);
console.log(`Total para 2 personas: $${quote.total.toLocaleString()}`);
```

---

## 🧪 Testing

### Datos de Prueba

```javascript
// Tour ID válido (producción)
const TEST_TOUR_ID = 'Au3wVFDw6Y2YlEtSlLoS';

// Departure ID válido (producción)
const TEST_DEPARTURE_ID = 'wHeL7YEtpqTZfhTDxEtL';

// Customer de prueba
const TEST_CUSTOMER = {
  name: 'Test Frontend User',
  email: 'test@nevadotrek.com',
  phone: '+573001234567',
  document: 'TEST123456'
};
```

### Script de Prueba Completo

```javascript
// Test completo del flujo de reserva
async function testBookingFlow() {
  console.log('=== Testing Public API Flow ===\n');
  
  // 1. Obtener tours
  console.log('1. Fetching tours...');
  const tours = await fetch('https://us-central1-nevadotrektest01.cloudfunctions.net/api/public/tours')
    .then(r => r.json());
  console.log(`✅ Found ${tours.length} tours\n`);
  
  // 2. Obtener salidas
  console.log('2. Fetching departures...');
  const departures = await fetch('https://us-central1-nevadotrektest01.cloudfunctions.net/api/public/departures')
    .then(r => r.json());
  console.log(`✅ Found ${departures.length} departures\n`);
  
  // 3. Crear reserva de prueba (CUIDADO: crea datos reales)
  console.log('3. Creating test booking...');
  console.warn('⚠️  This will create REAL booking data!');
  
  // Descomentar para probar:
  /*
  const booking = await fetch(
    'https://us-central1-nevadotrektest01.cloudfunctions.net/api/public/bookings/join',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        departureId: departures[0].departureId,
        customer: TEST_CUSTOMER,
        pax: 1
      })
    }
  ).then(r => r.json());
  
  console.log(`✅ Booking created: ${booking.bookingId}\n`);
  */
  
  console.log('=== Test Complete ===');
}
```

---

## 📞 Soporte y Troubleshooting

### Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `429 Too Many Requests` | Rate limit excedido | Esperar 15 minutos o usar IP diferente |
| `Departure not found` | ID de salida inválido | Verificar que el ID existe en `/public/departures` |
| `No enough space` | Sin cupos disponibles | Mostrar mensaje al usuario de buscar otra fecha |
| `Tour not active` | Tour desactivado | Verificar `/public/tours` para tours activos |
| `Invalid email format` | Email mal formateado | Validar con regex antes de enviar |
| `Phone must start with +` | Teléfono sin formato internacional | Agregar `+` y código de país |

### Headers Útiles para Debug

```javascript
fetch(url, options)
  .then(response => {
    console.log('Status:', response.status);
    console.log('Rate Limit:', response.headers.get('RateLimit-Remaining'));
    console.log('Cache:', response.headers.get('Cache-Control'));
    return response.json();
  });
```

---

## 📝 Checklist de Implementación

- [ ] Implementar fetch de `/public/tours` con caching
- [ ] Implementar fetch de `/public/departures` con caching
- [ ] Crear formulario de reserva con validaciones
- [ ] Implementar función `joinPublicDeparture`
- [ ] Implementar función `createPrivateBooking`
- [ ] Manejar rate limiting (429 responses)
- [ ] Convertir Firestore timestamps a Date
- [ ] Calcular precios dinámicos según pax
- [ ] Mostrar cupos disponibles en tiempo real
- [ ] Implementar página de confirmación
- [ ] Testing end-to-end del flujo completo

---

**Última Actualización:** Diciembre 2, 2025  
**API Version:** 2.4.0  
**Contact:** Backend deployed at `nevadotrektest01` Firebase project
