# Backend Status - November 2025

**Last Updated**: 2025-11-22  
**Version**: 2.0  
**Status**: ✅ Production Ready

---

## 🎯 Current State

### Backend Health
- ✅ All API endpoints functional
- ✅ Firebase Functions deployed to `nevadotrektest01`
- ✅ Comprehensive endpoint tests: **18/18 passing (100%)**
- ✅ Price calculation logic fixed and verified
- ✅ Type consistency across bookings and departures
- ✅ All CRUD operations tested

### Recent Bug Fixes (2025-11-22)

#### Bug #1: Missing `type` Field in Public Bookings
**File**: `functions/src/controllers/bookings.controller.js:146`  
**Issue**: Public bookings created via `joinBooking` lacked `type` field  
**Fix**: Added `type: DEPARTURE_TYPES.PUBLIC` to booking creation  
**Status**: ✅ Fixed & Deployed

#### Bug #2: Type Field Not Updated on Conversion
**File**: `functions/src/controllers/bookings.controller.js:523, 551, 572`  
**Issue**: `convertBookingType` updated departure type but not booking type  
**Fix**: Added booking type updates to all 3 conversion scenarios  
**Status**: ✅ Fixed & Deployed

#### Bug #3: Price Recalculation Doubling Prices
**File**: `functions/src/controllers/departures.controller.js:356`  
**Issue**: `updateDepartureTour` multiplied `tier.priceCOP * pax` (incorrect - tier is TOTAL price)  
**Fix**: Changed to `const newOriginalPrice = tier.priceCOP;` (removed `* pax`)  
**Status**: ✅ Fixed & Deployed

---

## 📁 Project Structure

```
nevado-trek-backend/
├── functions/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── admin.controller.js       # Dashboard stats
│   │   │   ├── bookings.controller.js    # Booking CRUD & logic
│   │   │   ├── departures.controller.js  # Departure management
│   │   │   └── tours.controller.js       # Tour management
│   │   ├── middleware/
│   │   │   ├── auth.js                   # Admin key validation
│   │   │   └── validation.js             # Request validation
│   │   └── constants.js                  # Shared constants
│   ├── index.js                          # Express app & routes
│   ├── test_booking_endpoints.js         # Comprehensive endpoint tests
│   └── test_emulator.js                  # Emulator-specific tests
├── backend-docs/
│   ├── backend_status.md                 # This file
│   ├── emulator_setup.md                 # Emulator configuration guide
│   └── booking_logic_fixes_2025-11-22.md # Detailed bug report
├── firebase.json                         # Firebase configuration
└── firestore.rules                       # Security rules
```

---

## 🔑 Key Endpoints

### Admin Routes (Protected by `X-Admin-Secret-Key`)

#### Tours
- `POST /admin/tours` - Create tour
- `GET /admin/tours` - List all tours (including inactive)
- `GET /admin/tours/:id` - Get single tour
- `PUT /admin/tours/:id` - Update tour
- `DELETE /admin/tours/:id` - Delete tour

#### Departures
- `POST /admin/departures` - Create departure
- `GET /admin/departures` - List departures (calendar view)
- `GET /admin/departures/:id` - Get single departure
- `PUT /admin/departures/:id` - Update departure
- `PUT /admin/departures/:id/date` - ✅ **Update date only (independent)**
- `PUT /admin/departures/:id/tour` - ✅ **Update tour only (independent, recalculates prices)**
- `POST /admin/departures/:id/split` - Split booking to new private departure
- `DELETE /admin/departures/:id` - Delete departure (only if empty)

#### Bookings
- `GET /admin/bookings` - List bookings (with filters)
- `GET /admin/bookings/:id` - Get single booking
- `POST /admin/bookings` - ✅ **Create booking (ALWAYS creates new departure)**
- `PUT /admin/bookings/:id/status` - Update booking status
- `PUT /admin/bookings/:id/pax` - Update booking pax count
- `PUT /admin/bookings/:id/details` - Update customer details
- `POST /admin/bookings/:id/convert-type` - ✅ **Convert booking type (public↔private)**
- `POST /admin/bookings/:id/move` - Move booking to different tour/date
- `POST /admin/bookings/:id/discount` - Apply discount

#### Stats
- `GET /admin/stats` - Dashboard statistics

### Public Routes

#### Tours
- `GET /public/tours` - List active tours only

#### Departures
- `GET /public/departures` - List open public departures (future dates only)

#### Bookings
- `POST /public/bookings/join` - ✅ **Join existing public departure**
- `POST /public/bookings/private` - Create private booking (new departure)

---

## 🧪 Testing

### Endpoint Tests
**Location**: `functions/test_booking_endpoints.js`  
**Coverage**: 18 comprehensive tests  
**Status**: ✅ 18/18 passing (100%)

**Run Tests**:
```bash
node functions/test_booking_endpoints.js
```

**Test Coverage**:
- ✅ Private booking creation
- ✅ Private booking date updates (independent)
- ✅ Private booking tour updates (independent, price recalculation)
- ✅ Public departure creation
- ✅ Public booking type verification
- ✅ Public→Private conversion
- ✅ Post-conversion update abilities

### Emulator Tests
**Location**: `functions/test_emulator.js`  
**Coverage**: 4 focused tests  
**Status**: ✅ 4/4 passing (100%)

**Run Tests** (see `emulator_setup.md` for configuration):
```bash
firebase emulators:exec --project nevadotrektest01 "node functions/test_emulator.js"
```

---

## 🔐 Authentication

**Admin Routes**: Protected by `X-Admin-Secret-Key` header  
**Public Routes**: No authentication required  
**Admin Key**: Stored in Firebase Secret Manager as `ADMIN_SECRET_KEY`

---

## 💾 Data Models

### Tour
```javascript
{
  name: { es: String, en: String },
  description: { es: String, en: String },
  type: 'single-day' | 'multi-day',
  totalDays: Number,
  difficulty: 'easy' | 'moderate' | 'hard',
  pricingTiers: [
    { minPax: Number, maxPax: Number, priceCOP: Number, priceUSD: Number }
  ],
  isActive: Boolean,
  temperature: Number,
  distance: Number,
  altitude: { es: String, en: String },
  location: { es: String, en: String },
  faqs: Array,
  recommendations: Array,
  inclusions: Array,
  exclusions: Array
}
```

**IMPORTANT**: `pricingTiers[].priceCOP` is **TOTAL PRICE** for the pax range, NOT per-pax price.

### Departure
```javascript
{
  tourId: String,
  date: Timestamp,
  type: 'private' | 'public',
  status: 'open' | 'confirmed' | 'completed' | 'cancelled',
  maxPax: Number,
  currentPax: Number,
  pricingSnapshot: Array // Snapshot of tour's pricingTiers at creation
}
```

### Booking
```javascript
{
  departureId: String,
  type: 'private' | 'public', // ✅ NOW ALWAYS PRESENT
  customer: {
    name: String,
    email: String,
    phone: String,  // Must start with +
    document: String,
    note: String (optional)
  },
  pax: Number,
  originalPrice: Number,
  finalPrice: Number,
  status: 'pending' | 'confirmed' | 'paid' | 'cancelled',
  discountReason: String (optional)
}
```

---

## 🚀 Deployment

**Current Environment**: Production (`nevadotrektest01`)  
**API URL**: `https://api-wgfhwjbpva-uc.a.run.app`

**Deploy Commands**:
```bash
# Deploy functions only
firebase deploy --only functions --project nevadotrektest01

# Deploy everything
firebase deploy --project nevadotrektest01
```

---

## ⚠️ Known Limitations

1. **Admin Booking Creation**: `POST /admin/bookings` ALWAYS creates a new departure, even if `departureId` is provided. This is by design.
2. **Public Booking Join**: Public users must use existing departures via `POST /public/bookings/join`
3. **Type Consistency**: Booking type MUST match departure type (now enforced via bug fixes)

---

## 📚 Related Documentation

- [`emulator_setup.md`](./emulator_setup.md) - Firebase emulator configuration
- [`booking_logic_fixes_2025-11-22.md`](./booking_logic_fixes_2025-11-22.md) - Detailed bug report
- [`api_reference.md`](./api_reference.md) - Comprehensive API documentation

---

## 🔄 Next Steps

1. ✅ ~~Fix booking type field bugs~~
2. ✅ ~~Fix price recalculation~~
3. ✅ ~~Deploy to production~~
4. ✅ ~~Verify with comprehensive tests~~
5. ⏳ Frontend E2E test refactoring (in progress)
6. ⏳ Add database triggers for type consistency validation

---

**Maintained by**: Development Team  
**Contact**: Backend issues → Check logs in Firebase Console
