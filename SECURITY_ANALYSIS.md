# Análisis de Seguridad - Endpoints Públicos

**Fecha**: 25 de Noviembre, 2025  
**Analista**: Security Review  
**Versión Backend**: v2.6  
**Severidad**: ⚠️ **MEDIA-ALTA**

---

## 📊 RESUMEN EJECUTIVO

**Endpoints Públicos Identificados**: **4**  
**Exposición al Riesgo**: ⚠️ **SÍ - Vulnerable a abuse/DDoS**  
**Mitigación Actual**: ❌ **NO implementada**  
**Recomendación**: 🔴 **URGENTE - Implementar rate limiting**

---

## 🔓 ENDPOINTS PÚBLICOS ACTUALES

### 1. `GET /public/tours`
**Función**: Listar tours activos  
**Autenticación**: ❌ NO requerida  
**Carga en DB**: 🟡 Media (query con where)  
**Exposición**: READ-only  
**Riesgo**: 🟡 Medio

**Request**:
```http
GET /public/tours
```

**Query Firestore**:
```javascript
db.collection("tours").where("isActive", "==", true).get()
```

**Costo por request**: 
- 1 query a Firestore
- ~10-50 reads (dependiendo de tours activos)

---

### 2. `GET /public/departures`
**Función**: Listar departures públicos y abiertos  
**Autenticación**: ❌ NO requerida  
**Carga en DB**: 🟡 Media-Alta (query con 3 where)  
**Exposición**: READ-only  
**Riesgo**: 🟡 Medio

**Request**:
```http
GET /public/departures
```

**Query Firestore**:
```javascript
db.collection("departures")
  .where("type", "==", "public")
  .where("status", "==", "open")
  .where("date", ">=", new Date())
  .get()
```

**Costo por request**:
- 1 query a Firestore
- ~20-100 reads (dependiendo de departures)

---

### 3. `POST /public/bookings/join`
**Función**: Unirse a departure existente (cliente final)  
**Autenticación**: ❌ NO requerida  
**Validación**: ✅ validateBooking middleware  
**Carga en DB**: 🔴 ALTA (writes a DB)  
**Exposición**: WRITE operation  
**Riesgo**: 🔴 **ALTO**

**Request**:
```http
POST /public/bookings/join
Body: { departureId, pax, customer }
```

**Operaciones en DB**:
```javascript
1. Get departure (1 read)
2. Get tour (1 read)
3. Create booking (1 write)
4. Update departure.currentPax (1 write)
```

**Costo por request**:
- 2 reads + 2 writes a Firestore
- Potencial creación de datos basura

---

### 4. `POST /public/bookings/private`
**Función**: Crear booking privado (cliente final)  
**Autenticación**: ❌ NO requerida  
**Validación**: ✅ validateBooking middleware  
**Carga en DB**: 🔴 **MUY ALTA** (writes + creates)  
**Exposición**: WRITE operation  
**Riesgo**: 🔴 **MUY ALTO**

**Request**:
```http
POST /public/bookings/private
Body: { tourId, date, pax, customer }
```

**Operaciones en DB**:
```javascript
1. Get tour (1 read)
2. Create departure (1 write)
3. Create booking (1 write)
```

**Costo por request**:
- 1 read + 2 writes a Firestore
- **Crea nuevos documentos en DB**

---

## ⚠️ ANÁLISIS DE VULNERABILIDADES

### Ataque 1: DDoS sobre GET endpoints

**Escenario**:
```python
# Script de ataque
import requests
for i in range(10000):
    requests.get('https://us-central1-nevadotrektest01.cloudfunctions.net/api/public/tours')
```

**Impacto**:
- ⚠️ **Costo en Firebase**: ~500,000 reads/10k requests (si 50 tours)
- ⚠️ **Latencia**: Cloud Functions se saturan
- ⚠️ **Facturación**: Spike en costos de Firestore + Cloud Functions

**Costo estimado**:
- Firestore: $0.36 por 100k reads = **~$1.80 por 500k reads**
- Cloud Functions: $0.40 por millón invocations + compute time
- **Total por 10k requests**: ~$2-3 USD

**Con 1 millón de requests**:
- Firestore: **~$180 USD**
- Cloud Functions: **~$100 USD**
- **Total**: **~$280 USD en un ataque**

---

### Ataque 2: Spam de POST /bookings/join

**Escenario**:
```python
# Script de ataque
for i in range(1000):
    requests.post('https://...api/public/bookings/join', json={
        'departureId': 'dep_123',
        'pax': 2,
        'customer': {
            'name': f'Fake Customer {i}',
            'email': f'fake{i}@test.com',
            'phone': '+57 300 000 0000',
            'document': f'CC {i}'
        }
    })
```

**Impacto**:
- 🔴 **Base de datos llena de basura**
- 🔴 **Departures marcados como "full" erróneamente**
- 🔴 **1000 bookings falsos creados**
- 🔴 **Operaciones de negocio bloqueadas**

**Costo por 1000 requests**:
- 2 reads + 2 writes = 4 ops × 1000 = 4000 ops
- Firestore: ~$0.72 USD
- Cloud Functions: ~$0.50 USD
- **Total**: ~$1.20 USD + **data corruption**

**Worst case (1 millón)**:
- **$1,200 USD + DB completamente corrupta**

---

### Ataque 3: Spam de POST /bookings/private

**Escenario**: Peor caso - crea departures Y bookings

```python
for i in range(1000):
    requests.post('https://...api/public/bookings/private', json={
        'tourId': 'tour_123',
        'date': '2025-12-15',
        'pax': 1,
        'customer': { ... }
    })
```

**Impacto**:
- 🔴 **1000 departures nuevos creados**
- 🔴 **1000 bookings creados**
- 🔴 **Base de datos colapsada**
- 🔴 **Sistema inusable**

**Costo por 1000 requests**:
- 1 read + 2 writes = 3 ops × 1000 = 3000 ops
- **~$1 USD + sistema destruido**

---

## 🛡️ SOLUCIONES RECOMENDADAS

### Solución 1: Rate Limiting (URGENTE)

**Implementar con Firebase App Check + Cloud Functions**:

```javascript
// functions/src/middleware/rateLimit.js
const rateLimit = require('express-rate-limit');

// Read endpoints: 100 requests por 15 minutos por IP
const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Write endpoints: 10 requests por hora por IP
const writeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests
  message: { error: 'Too many booking attempts, please try again later' },
});

module.exports = { readLimiter, writeLimiter };
```

**Aplicar en index.js**:
```javascript
const { readLimiter, writeLimiter } = require('./src/middleware/rateLimit');

// Public Routes
publicRouter.get('/tours', readLimiter, async (req, res) => { ... });
publicRouter.get('/departures', readLimiter, async (req, res) => { ... });
publicRouter.post('/bookings/join', writeLimiter, validateBooking, ...);
publicRouter.post('/bookings/private', writeLimiter, validateBooking, ...);
```

**Resultado**:
- ✅ Máximo 100 GETs por 15 min por IP
- ✅ Máximo 10 POSTs por hora por IP
- ✅ Bloquea ataques básicos

---

### Solución 2: reCAPTCHA v3 (RECOMENDADO)

**En frontend (sitio público)**:
```html
<script src="https://www.google.com/recaptcha/api.js?render=YOUR_SITE_KEY"></script>

<script>
grecaptcha.ready(function() {
  grecaptcha.execute('YOUR_SITE_KEY', {action: 'booking'}).then(function(token) {
    // Send token to backend
    fetch('/public/bookings/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recaptchaToken: token,
        // ... booking data
      })
    });
  });
});
</script>
```

**En backend**:
```javascript
// functions/src/middleware/recaptcha.js
const axios = require('axios');

const verifyRecaptcha = async (req, res, next) => {
  const { recaptchaToken } = req.body;
  
  if (!recaptchaToken) {
    return res.status(400).json({ error: 'reCAPTCHA token required' });
  }
  
  try {
    const response = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: {
          secret: functions.config().recaptcha.secret,
          response: recaptchaToken
        }
      }
    );
    
    if (response.data.success && response.data.score > 0.5) {
      next();
    } else {
      res.status(403).json({ error: 'reCAPTCHA verification failed' });
    }
  } catch (error) {
    res.status(500).json({ error: 'reCAPTCHA verification error' });
  }
};

module.exports = verifyRecaptcha;
```

**Aplicar**:
```javascript
publicRouter.post('/bookings/join', verifyRecaptcha, writeLimiter, validateBooking, ...);
publicRouter.post('/bookings/private', verifyRecaptcha, writeLimiter, validateBooking, ...);
```

**Resultado**:
- ✅ Bloquea bots automatizados
- ✅ Score-based (0.0-1.0, > 0.5 = probable humano)
- ✅ Invisible para usuarios reales

---

### Solución 3: Firebase App Check (IDEAL)

**Más seguro**, integrado con Firebase:

```javascript
// In functions
const { AppCheck } = require('firebase-admin/app-check');

const verifyAppCheck = async (req, res, next) => {
  const appCheckToken = req.header('X-Firebase-AppCheck');
  
  if (!appCheckToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    await AppCheck().verifyToken(appCheckToken);
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid app check token' });
  }
};

publicRouter.post('/bookings/join', verifyAppCheck, writeLimiter, ...);
```

**Resultado**:
- ✅ Solo requests desde tu app/website verificado
- ✅ Bloquea scripts externos
- ✅ Protección nativa de Firebase

---

### Solución 4: Honeypot Fields

**Anti-bots simple**:

```javascript
// En validación
const validateBooking = (req, res, next) => {
  // Campo honeypot (invisible para humanos, visible para bots)
  if (req.body.website || req.body.url) {
    return res.status(400).json({ error: 'Invalid request' });
  }
  
  // Resto de validación...
};
```

**En frontend**:
```html
<!-- Campo oculto con CSS, bots lo llenan -->
<input type="text" name="website" style="display:none" />
```

**Resultado**:
- ✅ Bloquea bots simples
- ✅ Fácil de implementar
- ✅ Complemento a otras soluciones

---

## 📊 MATRIZ DE PRIORIDADES

| Solución | Complejidad | Efectividad | Costo | Prioridad |
|----------|-------------|-------------|-------|-----------|
| **Rate Limiting** | 🟢 Baja | 🟡 Media | $0 | 🔴 **ALTA** |
| **reCAPTCHA v3** | 🟡 Media | 🟢 Alta | $0* | 🔴 **ALTA** |
| **Firebase App Check** | 🟡 Media | 🟢 Alta | $0 | 🟡 Media |
| **Honeypot** | 🟢 Muy Baja | 🟡 Baja | $0 | 🟢 Baja |

*reCAPTCHA es gratis hasta 1M assessments/mes

---

## 🎯 PLAN DE ACCIÓN RECOMENDADO

### Fase 1: INMEDIATO (Esta Semana)
1. ✅ **Implementar Rate Limiting** (1-2 horas)
   - 100 GET/15min
   - 10 POST/hora
2. ✅ **Agregar Honeypot** (30 min)
3. ✅ **Monitoring**: Configurar alertas en Firebase Console

### Fase 2: PRÓXIMA SEMANA
4. ✅ **Implementar reCAPTCHA v3** (3-4 horas)
   - En sitio público (cuando se cree)
   - Verificación en backend
5. ✅ **Testing**: Probar rate limits

### Fase 3: FUTURO
6. ⚠️ **Firebase App Check** (opcional, cuando se publique app móvil)
7. ⚠️ **WAF (Web Application Firewall)** si se escala mucho

---

## 💰 COSTO-BENEFICIO

### Sin Protección (Actual)
- **Riesgo financiero**: $280 USD por ataque de 1M requests
- **Riesgo operacional**: DB corrupta, sistema inusable
- **Riesgo reputacional**: Bookings falsos, clientes molestos

### Con Rate Limiting + reCAPTCHA
- **Costo de implementación**: 4-6 horas dev (~$200-400 USD)
- **Costo mensual**: $0 (gratis hasta 1M requests)
- **Protección**: Bloquea >95% de ataques automatizados

**ROI**: ✅ Un solo ataque prevenido paga la implementación

---

## 🔍 MONITOREO RECOMENDADO

### Métricas a vigilar:

1. **Requests por endpoint** (Firebase Console)
```
Cloud Functions → Logs → Filter: /public/
```

2. **Firestore reads/writes** (Firebase Console)
```
Firestore → Usage
```

3. **Rate limit hits** (Custom logging)
```javascript
rateLimiter({
  handler: (req, res) => {
    console.warn('Rate limit hit:', req.ip, req.path);
    res.status(429).json({ error: 'Too many requests' });
  }
});
```

4. **Billing alerts** (Google Cloud)
```
Billing → Budgets & Alerts → Set at $50 USD/month
```

---

## ✅ CHECKLIST DE SEGURIDAD

**Corto Plazo**:
- [ ] Implementar rate limiting en GET endpoints
- [ ] Implementar rate limiting más estricto en POST endpoints
- [ ] Agregar honeypot fields
- [ ] Configurar billing alerts
- [ ] Documentar límites en API docs

**Mediano Plazo**:
- [ ] Implementar reCAPTCHA v3
- [ ] Testing de límites
- [ ] Monitoreo de métricas
- [ ] Plan de respuesta a incidentes

**Largo Plazo**:
- [ ] Firebase App Check (si se publica app)
- [ ] WAF (si se escala)
- [ ] Penetration testing

---

## 📞 RESPUESTA A INCIDENTES

**Si detectas un ataque**:

1. **Deshabilitar endpoints temporalmente**:
```javascript
// En index.js
publicRouter.use((req, res) => {
  res.status(503).json({ error: 'Service temporarily unavailable' });
});
```

2. **Revisar logs**:
```bash
firebase functions:log --limit 1000
```

3. **Identificar IPs atacantes**:
```javascript
// En Cloud Functions logs, buscar patrones
```

4. **Limpiar data basura**:
```javascript
// Script de cleanup
const recentBookings = await db.collection('bookings')
  .where('createdAt', '>', lastHour)
  .get();

// Review y delete manualmente
```

5. **Deploy fix + rate limiting**

---

## 🎓 CONCLUSIONES

**Estado Actual**: ⚠️ **VULNERABLE**

**Endpoints Públicos**: 4 (2 GET, 2 POST)

**Riesgo Mayor**: POST endpoints sin rate limiting pueden:
- Crear miles de bookings falsos
- Llenar la DB de basura
- Costar $1000+ en un ataque sostenido
- Hacer el sistema inutilizable

**Acción Requerida**: 🔴 **URGENTE**
- Implementar rate limiting HOY
- reCAPTCHA en próxima semana
- Monitoreo continuo

**Protección Mínima Viable**:
```javascript
Rate Limiting: 100 GET/15min, 10 POST/hora
+ Honeypot fields
+ Billing alerts
```

---

**Documento**: Security Analysis  
**Autor**: Security Review Team  
**Fecha**: November 25, 2025  
**Próxima Revisión**: Después de implementar protecciones
