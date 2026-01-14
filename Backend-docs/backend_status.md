# Backend Status - Nevado Trek V2.6

**Last Updated**: January 7, 2026  
**Version**: v2.6  
**Status**: 🟢 **Fully Deployed & Verified on Production**

---

## 📊 Executive Summary

El backend está **100% funcional y verificado en producción** con todos los features implementados incluyendo join booking para admin. Sistema completamente testeado con capacidad de 8 pax para todos los departures.

**Production Version**: v2.6  
**Key Feature**: Admin Join Booking Endpoint & Real-time Stats  
**maxPax**: 8 para todos los departures (public y private)

---

## 🆕 Latest Maintenance (Jan 14, 2026)

### 🎯 Staging Environment Setup
**Status**: ✅ Complete  
**Description**: Established a dedicated staging environment to facilitate Admin Dashboard development without risking production data.  
**Details**:
- **Project**: `nevado-trek-backend-03` (Alias: `staging`)
- **Plan**: Upgraded to Blaze (Pay-as-you-go)
- **Configuration**: Added `.env.nevado-trek-backend-03` with distinct Admin Key.
- **Verification**: API endpoints responding correctly.

### 🎯 API Restoration (Jan 7, 2026)
**Status**: ✅ Solved  
**Description**: Reactivated billing for project `nevadotrektest01`. Forced redeployment of the `api` function to clear 503 Service Unavailable errors.  
**Verification**: All public and admin endpoints tested and responding with 200 OK.

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

## 🧪 Testing Status

**Local Emulator Tests**: ✅ 41/41 passing (100%)  
**Production Verification**: ✅ All endpoints verified (Jan 7, 2026)

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

---

## 🚀 Deployment History

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| Maint | Jan 7, 2026 | Billing Reactivation & 503 Fix | ✅ Active |
| v2.6 | Nov 25, 2025 | Fix validation for join booking | ✅ Deployed |
| v2.5 | Nov 25, 2025 | Add admin join booking endpoint | ✅ Deployed |
| v2.4 | Nov 25, 2025 | maxPax=8, irreversible cancellation | ✅ Deployed |
| v2.3 | Nov 22, 2025 | Ghost departure cleanup | ✅ Deployed |
| v2.2 | Nov 21, 2025 | Type field fixes | ✅ Deployed |
| v2.1 | Nov 20, 2025 | Initial production deploy | ✅ Deployed |

---

## 📝 Notes

- **Function URL**: https://api-wgfhwjbpva-uc.a.run.app
- **Firestore Project**: nevadotrektest01
- **Region**: us-central1
- **Runtime**: Node.js 22 (2nd Gen)