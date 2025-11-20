# Referencia de Endpoints y Efectos en Cascada

Esta tabla detalla cada endpoint disponible en la API, su función principal y, lo más importante, **qué otros datos se ven afectados automáticamente** (Efecto en Cascada) cuando se ejecuta.

## 🔐 Endpoints Administrativos (Requieren Key)

### Gestión de Reservas (Bookings)

| Método | Endpoint | Explicación | 🌊 Efecto en Cascada Completo |
| :--- | :--- | :--- | :--- |
| `POST` | `/admin/bookings` | Crea una reserva manual. **Siempre** crea una nueva Salida (Departure). | 1. Crea `Departure` nueva.<br>2. Crea `Booking` vinculada.<br>3. Establece `currentPax` de la Salida = Pax de la Reserva.<br>4. Copia `pricingSnapshot` del Tour a la Salida. |
| `PUT` | `/admin/bookings/:id/status` | Cambia estado (Confirmado, Cancelado, Pagado). | **Si se Cancela:** Resta pax a la capacidad de la Salida (`currentPax - pax`).<br>**Si se Descancela:** Suma pax a la Salida (valida capacidad disponible). |
| `PUT` | `/admin/bookings/:id/pax` | Cambia la cantidad de personas en una reserva. | 1. Calcula diferencia de pax.<br>2. Actualiza `currentPax` en la Salida (valida capacidad).<br>3. **Recalcula Precio:** Busca el nuevo rango de precios en el snapshot y actualiza `originalPrice` y `finalPrice` (manteniendo % descuento). |
| `POST` | `/admin/bookings/:id/move` | Mueve una reserva a otra fecha o tour. | 1. **Salida Antigua:** Resta pax (`currentPax - pax`).<br>2. **Salida Nueva:** Busca existente o crea nueva.<br>3. **Salida Nueva:** Suma pax (`currentPax + pax`).<br>4. Actualiza vínculo en la Reserva. |
| `POST` | `/admin/bookings/:id/convert-type` | Convierte entre Público y Privado. | **Privado -> Público:** Cambia tipo de Salida, valida max 8 pax.<br>**Público -> Privado (Split):** Crea NUEVA Salida privada, mueve la reserva ahí, resta pax a la Salida pública original.<br>**Público -> Privado (Solo):** Simplemente cambia el tipo de la Salida existente. |
| `POST` | `/admin/bookings/:id/discount` | Aplica un descuento manual. | Actualiza `finalPrice` y `discountReason`. No afecta a la Salida. |
| `PUT` | `/admin/bookings/:id/details` | Actualiza datos del cliente (nombre, email). | Ninguno. Solo actualiza el documento de la reserva. |

### Gestión de Salidas (Departures)

| Método | Endpoint | Explicación | 🌊 Efecto en Cascada Completo |
| :--- | :--- | :--- | :--- |
| `POST` | `/admin/departures` | Crea una Salida vacía (sin reservas). | Crea documento `Departure` con snapshot de precios del Tour actual. |
| `PUT` | `/admin/departures/:id` | Edita fecha, tour o capacidad máxima. | **Si cambia Fecha:** Todas las reservas vinculadas se "mueven" automáticamente (porque solo guardan el ID de la Salida).<br>**Si cambia Tour:** Actualiza el `pricingSnapshot` de la Salida (pero NO recalcula precios de reservas existentes). |
| `POST` | `/admin/departures/:id/split` | Separa una reserva específica a una nueva Salida Privada. | 1. Crea NUEVA Salida privada.<br>2. Mueve la reserva a esa nueva Salida.<br>3. Resta pax a la Salida original. |
| `DELETE` | `/admin/departures/:id` | Elimina una Salida. | **Solo permitido si `currentPax` es 0.** No tiene efecto en cascada porque no puede haber reservas. |
| `GET` | `/admin/departures` | Obtiene salidas para el calendario. | N/A (Lectura) |

### Gestión de Tours (Catálogo)

| Método | Endpoint | Explicación | 🌊 Efecto en Cascada Completo |
| :--- | :--- | :--- | :--- |
| `POST` | `/admin/tours` | Crea un nuevo Tour. | N/A |
| `PUT` | `/admin/tours/:id` | Actualiza información del Tour (precios, itinerario). | **NO afecta Salidas existentes:** Las salidas ya creadas mantienen su `pricingSnapshot` original (protección de precios). Solo afecta a Salidas creadas en el futuro. |
| `DELETE` | `/admin/tours/:id` | Desactiva un Tour (Soft Delete). | El Tour deja de aparecer en la API Pública. Las reservas existentes no se ven afectadas. |
| `GET` | `/admin/tours` | Lista todos los tours. | N/A (Lectura) |

---

## 🌍 Endpoints Públicos (Sin Key)

| Método | Endpoint | Explicación | 🌊 Efecto en Cascada Completo |
| :--- | :--- | :--- | :--- |
| `POST` | `/public/bookings/join` | Cliente se une a una Salida Pública existente. | 1. Valida capacidad disponible.<br>2. Crea `Booking`.<br>3. Suma pax a `currentPax` de la Salida. |
| `POST` | `/public/bookings/private` | Cliente solicita nueva Salida Privada. | 1. Crea NUEVA Salida Privada.<br>2. Crea `Booking`.<br>3. Establece capacidad inicial. |
| `GET` | `/public/tours` | Lista tours activos. | N/A |
| `GET` | `/public/departures` | Lista salidas públicas futuras con cupo. | N/A |
