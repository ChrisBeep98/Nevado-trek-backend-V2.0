# Backend Status - Nevado Trek V2.0

**Last Updated**: November 25, 2025  
**Version**: v2.6  
**Status**: 🟢 **Fully Deployed & Verified on Production**

---

## 📊 Executive Summary

El backend está **100% funcional y verificado en producción** con todos los features implementados incluyendo join booking para admin. Sistema completamente testeado con capacidad de 8 pax para todos los departures.

**Production Version**: v2.6  
**Key Feature**: Admin Join Booking Endpoint  
**maxPax**: 8 para todos los departures (public y private)

---

## 🆕 Latest Changes (v2.5 - v2.6, Nov 25, 2025)

### 🎯 v2.6: Admin Join Booking Validation Fix (Nov 25)
**Files Modified**:
- `functions/src/middleware/validation.js:13-23`

**Change**: Fixed validation middleware to allow join booking without tourId/date  
**Reason**: When joining an existing departure, tourId and date are not needed (departure already exists)  
**Implementation**:
```javascript
// For join booking (departureId provided), tourId and date are not required
if (!departureId) {
    if (!tourId || typeof tourId !== "string") {
        return res.status(400).json({ error: "Invalid or missing 'tourId'" });
    }
    if (!date || isNaN(new Date(date).getTime())) {
        return res.status(400).json({ error: "Invalid or missing 'date'" });
    }
}
```

**Status**: ✅ Deployed to production

---

### 🎯 v2.5: Admin Join Booking Endpoint (Nov 25)
**Files Modified**:
- `functions/index.js:50`

**Change**: Added `/admin/bookings/join` endpoint for admin users  
**Reason**: Admin dashboard needed ability to add bookings to existing departures (not just create new ones)  
**Implementation**:
```javascript
adminRouter.post("/bookings/join", validateBooking, bookingsController.joinBooking);
```

**Reuses**: Existing `joinBooking` controller function (previously only exposed for public users)  
**Functionality**:
- Validates departure exists and is open
- Checks capacity before adding booking
- Creates booking in existing departure
- Updates `currentPax` count

**Status**: ✅ Deployed to production

---

## 🔧 Previous Changes (v2.4, Nov 25, 2025)

### Change #1: Private Departure maxPax = 8
**Ubicaciones**:
- `functions/src/controllers/bookings.controller.js:42`
- `functions/src/controllers/bookings.controller.js:212`
- `functions/src/controllers/departures.controller.js:29`

**Cambio**: Cambiado `maxPax` de `99` a `8` para private departures  
**Estado**: ✅ Implementado

### Change #2: Irreversible Cancellation Logic
**Ubicación**: `functions/src/controllers/bookings.controller.js:301-303`

**Cambio**: Una vez cancelled, booking NO puede reactivarse  
**Estado**: ✅ Implementado

### Change #3: Private Departure Cancellation Sync
**Ubicación**: `functions/src/controllers/bookings.controller.js:308-317`

**Cambio**: Cancelar private booking cancela el departure  
**Estado**: ✅ Implementado

### Change #4: Public Departure Slot Release
**Ubicación**: `functions/src/controllers/bookings.controller.js:308-311`

**Cambio**: Cancelar public booking libera capacidad  
**Estado**: ✅ Implementado

---

## 📡 API Endpoints - Admin Routes

### Bookings
```
GET    /admin/bookings                  - List all bookings
GET    /admin/bookings/:id              - Get single booking
POST   /admin/bookings                  - Create NEW booking (creates new departure)
POST   /admin/bookings/join             - Join EXISTING departure (NEW in v2.5)
PUT    /admin/bookings/:id/status       - Update booking status
PUT    /admin/bookings/:id/pax          - Update pax count
PUT    /admin/bookings/:id/details      - Update customer details
POST   /admin/bookings/:id/convert-type - Convert private ↔ public
POST   /admin/bookings/:id/move         - Move booking to different departure
POST   /admin/bookings/:id/discount     - Apply discount
```

### Departures
```
GET    /admin/departures           - List all departures
GET    /admin/departures/:id       - Get single departure
POST   /admin/departures           - Create departure
PUT    /admin/departures/:id       - Update departure
DELETE /admin/departures/:id       - Delete departure
PUT    /admin/departures/:id/date  - Update departure date
PUT    /admin/departures/:id/tour  - Update departure tour
POST   /admin/departures/:id/split - Split departure
```

### Tours
```
GET    /admin/tours      - List all tours (including inactive)
GET    /admin/tours/:id  - Get single tour
POST   /admin/tours      - Create tour
PUT    /admin/tours/:id  - Update tour
DELETE /admin/tours/:id  - Delete tour
```

---

## 🔐 Request/Response Examples

### Join Existing Departure (NEW)
**Endpoint**: `POST /admin/bookings/join`  
**Headers**: `X-Admin-Secret-Key: <admin_key>`

**Request Body**:
```json
{
  "departureId": "DAVtZXHf3P0tzhQsBLRv",
  "customer": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "document": "PASSPORT123",
    "note": "Optional note"
  },
  "pax": 2,
  "date": "2025-12-01T00:00:00.000Z",
  "type": "public"
}
```

**Response** (201):
```json
{
  "success": true,
  "booking": {
    "bookingId": "BK_xyz123",
    "departureId": "DAVtZXHf3P0tzhQsBLRv",
    "customer": { ... },
    "pax": 2,
    "status": "pending",
    "originalPrice": 1000000,
    "finalPrice": 1000000,
    "type": "public",
    "createdAt": "2025-11-25T..."
  }
}
```

**Validation**:
- ✅ `departureId` required
- ✅ `customer` object required (name, email, phone, document)
- ✅ `pax` > 0 required
- ❌ `tourId` NOT required (departure already exists)
- ❌ `date` NOT required (uses departure's date)

### Create New Booking (Original)
**Endpoint**: `POST /admin/bookings`  
**Headers**: `X-Admin-Secret-Key: <admin_key>`

**Request Body**:
```json
{
  "tourId": "TOUR_rainbowmountain",
  "date": "2025-12-15T00:00:00.000Z",
  "type": "private",
  "customer": {
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "+9876543210",
    "document": "ID456789"
  },
  "pax": 4
}
```

**Response** (201):
```json
{
  "success": true,
  "booking": {
    "bookingId": "BK_abc789",
    "departureId": "DEP_new123",
    ...
  },
  "departure": {
    "departureId": "DEP_new123",
    "tourId": "TOUR_rainbowmountain",
    "date": "2025-12-15T00:00:00.000Z",
    "type": "private",
    "maxPax": 8,
    "currentPax": 4,
    "status": "open"
  }
}
```

---

## 🧪 Testing Status

**Local Emulator Tests**: ✅ 41/41 passing (100%)  
**Production Verification**: ✅ All endpoints verified

**Test Coverage**:
- ✅ Create booking (new departure)
- ✅ Join booking (existing departure) - NEW
- ✅ Update booking status
- ✅ Update pax with capacity validation
- ✅ Cancellation logic (irreversible)
- ✅ Private departure cancellation sync
- ✅ Public slot release on cancellation
- ✅ Convert booking type
- ✅ Move booking (ghost departure cleanup)

---

## 🗂️ Data Schema

### Booking Document
```javascript
{
  departureId: string,        // FK to departure
  type: 'public' | 'private', // IMPORTANT: Added in v2.4
  customer: {
    name: string,
    email: string,
    phone: string,            // Must start with '+'
    document: string,
    note?: string
  },
  pax: number,                // > 0
  originalPrice: number,      // COP
  finalPrice: number,         // COP (after discounts)
  status: 'pending' | 'confirmed' | 'paid' | 'cancelled',
  createdAt: timestamp,
  updatedAt?: timestamp,
  discountHistory?: [{
    amount?: number,
    newFinalPrice?: number,
    reason: string,
    appliedAt: timestamp,
    appliedBy: 'admin'
  }]
}
```

### Departure Document
```javascript
{
  tourId: string,
  date: timestamp,
  type: 'public' | 'private',
  status: 'open' | 'closed' | 'cancelled',
  maxPax: 8,                  // FIXED at 8 for all types
  currentPax: number,         // Calculated from bookings
  pricingSnapshot: [{         // Snapshot from tour at creation
    minPax: number,
    maxPax: number,
    priceCOP: number
  }],
  createdAt: timestamp,
  updatedAt?: timestamp
}
```

---

## 🔄 Business Logic

### Join Booking Flow (NEW - v2.5)
1. Admin calls `POST /admin/bookings/join` with `departureId`
2. Validation skips `tourId`/`date` requirements (departure exists)
3. Backend validates:
   - Departure exists
   - Departure is PUBLIC and OPEN
   - Sufficient capacity available
4. Create booking in existing departure
5. Update `currentPax` count
6. Return booking object

### Create Booking Flow (Original)
1. Admin calls `POST /admin/bookings` with `tourId`, `date`, `type`
2. Validation requires `tourId` and `date`
3. Backend ALWAYS creates NEW departure
4. Create booking in new departure
5. Return both booking and departure objects

### Cancellation Logic
**Private Booking**:
- Set booking status = 'cancelled'
- Set departure status = 'cancelled'
- Irreversible (cannot reactivate)

**Public Booking**:
- Set booking status = 'cancelled'
- Decrement departure `currentPax`
- Departure stays 'open'
- Irreversible (cannot reactivate)

---

## 🚀 Deployment History

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| v2.6 | Nov 25, 2025 | Fix validation for join booking | ✅ Deployed |
| v2.5 | Nov 25, 2025 | Add admin join booking endpoint | ✅ Deployed |
| v2.4 | Nov 25, 2025 | maxPax=8, irreversible cancellation | ✅ Deployed |
| v2.3 | Nov 22, 2025 | Ghost departure cleanup | ✅ Deployed |
| v2.2 | Nov 21, 2025 | Type field fixes | ✅ Deployed |
| v2.1 | Nov 20, 2025 | Initial production deploy | ✅ Deployed |

---

## 📝 Notes

- **Function URL**: https://us-central1-nevadotrektest01.cloudfunctions.net/api
- **Firestore Project**: nevadotrektest01
- **Region**: us-central1
- **Runtime**: Node.js 22 (2nd Gen)

**Key Differences Between Endpoints**:
- `/admin/bookings` (POST) → Creates NEW departure
- `/admin/bookings/join` (POST) → Joins EXISTING departure

Both use same validation middleware with conditional logic based on `departureId` presence.
