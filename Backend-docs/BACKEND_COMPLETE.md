# Nevado Trek Backend - Complete Documentation

**Version**: v2.6.0  
**Last Updated**: January 7, 2026  
**Status**: 🟢 **Production Ready & Deployed**  
**Firebase Project**: nevadotrektest01  
**Region**: us-central1

---

## 📊 EXECUTIVE SUMMARY

El backend de Nevado Trek es una **API RESTful Firebase Cloud Functions (2nd Gen)** que gestiona tours, departures y bookings (reservas) para el sistema de gestión turística. 

**Tech Stack**:
- Firebase Cloud Functions (Node.js 22)
- Express.js REST API
- Cloud Firestore (Database)
- Firebase Admin SDK

**Key Metrics**:
- **Endpoints**: 27 total (22 admin, 5 public)
- **Controllers**: 4 (tours, departures, bookings, admin)
- **Middleware**: 2 (auth, validation)
- **Status**: 100% functional
- **Test Coverage**: Comprehensive automated and manual testing
- **Deployment**: Automated via Firebase CLI

---

## 🏗️ ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────┐
│         Admin Dashboard (React)             │
│      or Public Website (Vite/React)         │
└────────────┬────────────────────────────────┘
             │ HTTPS
             ▼
┌─────────────────────────────────────────────┐
│      Firebase Cloud Functions (2nd Gen)     │
│      Region: us-central1                    │
│                                             │
│  ┌────────────────────────────────────┐    │
│  │  Express.js API Router             │    │
│  │                                     │    │
│  │  ┌──────────┐      ┌────────────┐  │    │
│  │  │  Admin   │      │   Public   │  │    │
│  │  │  Routes  │      │   Routes   │  │    │
│  │  └────┬─────┘      └─────┬──────┘  │    │
│  │       │                  │          │    │
│  │       ▼                  ▼          │    │
│  │  ┌─────────────────────────────┐   │    │
│  │  │ Middleware Layer            │   │    │
│  │  │ - validateAdminKey          │   │    │
│  │  │ - validateBooking           │   │    │
│  │  │ - validateTour              │   │    │
│  │  └────────────┬────────────────┘   │    │
│  │               ▼                     │    │
│  │  ┌─────────────────────────────┐   │    │
│  │  │ Controllers                 │   │    │
│  │  │ - tours.controller.js       │   │    │
│  │  │ - departures.controller.js  │   │    │
│  │  │ - bookings.controller.js    │   │    │
│  │  │ - admin.controller.js       │   │    │
│  │  └────────────┬────────────────┘   │    │
│  └───────────────┼─────────────────────┘    │
└────────────────┼──────────────────────────┘
                 │
                 ▼
    ┌─────────────────────────┐
    │   Cloud Firestore       │
    │                         │
    │   Collections:          │
    │   - tours               │
    │   - departures          │
    │   - bookings            │
    └─────────────────────────┘
```

---

## 📁 PROJECT STRUCTURE

```
functions/
├── index.js                    # Main entry point, route definitions
├── package.json                # Dependencies
├── .eslintrc.js               # Linting config
│
├── src/
│   ├── constants.js           # Shared constants
│   │
│   ├── middleware/
│   │   ├── auth.js           # Admin key validation
│   │   └── validation.js     # Request payload validation
│   │
│   └── controllers/
│       ├── admin.controller.js       # Dashboard stats
│       ├── tours.controller.js       # Tour CRUD
│       ├── departures.controller.js  # Departure CRUD
│       └── bookings.controller.js    # Booking CRUD + logic
│
└── Utility Scripts/
    ├── create_complete_tours.js      # Seed complete tour data
    ├── test_production_endpoints.js  # Main prod test
    └── ...
```

---

## 🔌 API ENDPOINTS

### Base URL
**Production**: `https://api-wgfhwjbpva-uc.a.run.app`

### Admin Endpoints (Protected)

**Authentication**: All admin endpoints require `X-Admin-Secret-Key` header

#### Dashboard
```
GET  /admin/stats
     → Dashboard statistics (total bookings, upcoming departures, etc.)
     Returns: { totalActiveBookings, upcomingDeparturesCount, next7Days, timestamp }
```

#### Tours
```
POST   /admin/tours
       → Create new tour
GET    /admin/tours
       → Get all tours (including inactive)
GET    /admin/tours/:id
       → Get single tour by ID
PUT    /admin/tours/:id
       → Update tour (auto-increments version)
DELETE /admin/tours/:id
       → Delete tour (soft delete - sets isActive: false)
```

#### Departures
```
POST   /admin/departures
       → Create new departure
GET    /admin/departures
       → Get all departures (calendar view)
GET    /admin/departures/:id
       → Get single departure
PUT    /admin/departures/:id
       → Update departure fields
DELETE /admin/departures/:id
       → Delete departure (allowed if currentPax is 0)
PUT    /admin/departures/:id/date
       → Update departure date
PUT    /admin/departures/:id/tour
       → Update departure tour & recalculate prices
POST   /admin/departures/:id/split
       → Split specific booking to new private departure
```

#### Bookings
```
POST   /admin/bookings
       → Create new booking (ALWAYS creates new departure)
POST   /admin/bookings/join        ⭐ NEW v2.5
       → Join existing public departure
GET    /admin/bookings
       → Get all bookings
GET    /admin/bookings/:id
       → Get single booking by ID
PUT    /admin/bookings/:id/status
       → Update status (irreversible cancellation)
PUT    /admin/bookings/:id/pax
       → Update pax (recalculates prices, checks capacity)
PUT    /admin/bookings/:id/details
       → Update customer details
POST   /admin/bookings/:id/convert-type
       → Convert booking type (private ↔ public)
POST   /admin/bookings/:id/move
       → Move booking to different tour/date
POST   /admin/bookings/:id/discount
       → Apply discount (by amount or final price)
```

---

### Public Endpoints (No Auth Required)

#### Tours
```
GET  /public/tours
     → Get active tours only (Full details)
GET  /public/tours/listing  ⭐ NEW
     → Get active tours only (Lightweight summary)
```

#### Departures
```
GET  /public/departures
     → Get public, open, future departures with available spots
```

#### Bookings
```
POST /public/bookings/join
     → Join existing public departure
POST /public/bookings/private
     → Create private booking (new departure)
```

---

## 🔄 BUSINESS LOGIC

### Date Handling
- **Noon UTC Rule**: All dates are normalized to 12:00 PM UTC to prevent timezone shifts.
- **ISO Strings**: API returns dates as ISO strings for standard processing.

### Capacity & Cleanup
- **maxPax = 8**: Standard limit for all departures.
- **Ghost Cleanup**: Departures are automatically deleted if their `currentPax` reaches 0 (after move/cancel).

---

## 🚀 MAINTENANCE & RESTORATION (Jan 7, 2026)
- ✅ **Billing Restored**: Fixed 503 errors caused by billing suspension.
- ✅ **Redeployed**: Forced update of all functions.
- ✅ **Healthy**: 100% of tested endpoints passing.

---

**Document Owner**: Chris Dukes / Antigravity AI  
**Last Verified**: January 7, 2026  
**Version**: v2.6.0