# Cache Bypass para Departures - Guía de Implementación Frontend

## 📋 Problema

Después de crear un booking via `POST /public/bookings/join`, el endpoint `GET /public/departures` puede devolver datos cacheados (hasta 30 segundos) mostrando el `currentPax` anterior.

**Ejemplo del bug:**
1. Usuario ve "8 cupos disponibles"
2. Usuario reserva 2 plazas → POST exitoso
3. Modal se refresca → Sigue mostrando "8 cupos" (debería mostrar "6")

---

## ✅ Solución

Añadir `?t=Date.now()` al fetch de departures **inmediatamente después** de una acción de booking exitosa.

### Antes (puede mostrar datos cacheados)
```javascript
const response = await fetch('/public/departures');
```

### Después (siempre datos frescos)
```javascript
const response = await fetch(`/public/departures?t=${Date.now()}`);
```

---

## 🛠️ Implementación Recomendada

### Opción 1: Hook/Service con Flag

```typescript
// departures.service.ts o useDepartures.ts

export async function fetchDepartures(forceRefresh = false): Promise<Departure[]> {
  let url = `${API_BASE_URL}/public/departures`;
  
  // Bypass cache si se requiere refresh forzado
  if (forceRefresh) {
    url += `?t=${Date.now()}`;
  }
  
  const response = await fetch(url);
  return response.json();
}
```

```typescript
// Uso normal (aprovecha cache)
const departures = await fetchDepartures();

// Después de booking exitoso (fuerza datos frescos)
const freshDepartures = await fetchDepartures(true);
```

### Opción 2: En el Booking Handler

```typescript
// BookingModal.tsx o similar

async function handleSubmitBooking(formData: BookingFormData) {
  try {
    // 1. Crear booking
    const result = await createJoinBooking({
      departureId: selectedDeparture.id,
      customer: formData.customer,
      pax: formData.pax
    });
    
    if (result.success) {
      // 2. Refrescar departures CON cache bypass
      await refetchDepartures(true); // ← Pasa flag forceRefresh
      
      // 3. Mostrar confirmación
      showSuccess(`Reserva creada: ${result.bookingId}`);
    }
    
  } catch (error) {
    showError(error.message);
  }
}
```

### Opción 3: Query Param Automático en Mutations

Si usas React Query o similar:

```typescript
// Con React Query
const queryClient = useQueryClient();

const bookingMutation = useMutation({
  mutationFn: createJoinBooking,
  onSuccess: () => {
    // Invalidar cache de departures
    queryClient.invalidateQueries({ queryKey: ['departures'] });
    
    // O refetch con bypass
    queryClient.refetchQueries({ 
      queryKey: ['departures'],
      // Añadir timestamp al refetch
    });
  }
});
```

---

## 📊 Configuración Actual del Backend

| Endpoint | Cache Browser | Cache CDN |
|----------|---------------|-----------|
| `GET /public/tours` | 5 min | 10 min |
| `GET /public/departures` | **30 seg** | **60 seg** |

El cache de departures se redujo a 30 segundos específicamente para este caso de uso.

---

## 🧪 Verificación

Ejecuta esta prueba en consola del navegador:

```javascript
// 1. Obtener estado inicial
let r1 = await fetch('/public/departures?t=' + Date.now()).then(r => r.json());
let dep = r1.find(d => d.currentPax < d.maxPax);
console.log('ANTES:', dep.departureId, dep.currentPax + '/' + dep.maxPax);

// 2. Después de hacer un booking manualmente...

// 3. Verificar con bypass
let r2 = await fetch('/public/departures?t=' + Date.now()).then(r => r.json());
let updated = r2.find(d => d.departureId === dep.departureId);
console.log('DESPUÉS:', updated.currentPax + '/' + updated.maxPax);
```

---

## 📝 Resumen

| Cuándo | Qué hacer |
|--------|-----------|
| Carga inicial de página | `fetch('/departures')` (usa cache, rápido) |
| Después de POST booking | `fetch('/departures?t=Date.now()')` (bypass) |
| Refresh manual del usuario | `fetch('/departures?t=Date.now()')` (bypass) |
| Polling automático (si aplica) | `fetch('/departures')` (usa cache) |

**Resultado esperado:** El `currentPax` se actualiza inmediatamente después de cualquier booking exitoso.
