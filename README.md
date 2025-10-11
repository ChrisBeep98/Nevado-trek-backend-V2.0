# Nevado Trek Backend

Complete reservation system for adventure tour management with bilingual support, anonymous booking, and advanced admin management.

## 📁 File Structure

### Documentation
- `COMPLETE_DOCUMENTATION.md` - Complete system documentation (architecture, API, business logic, etc.)
- `BUSINESS_LOGIC.md` - Business rules and processes
- `PLANNING_TASKS.md` - Project planning and current status

### Core System
- `functions/index.js` - Main backend functions (in functions directory)

### Tours & Data
- `tour-info.md` - Current tour information and events

### Testing & Setup
- `api_test_suite.js` - Comprehensive API testing suite
- `test_functions.js` - General test functions
- `setup_test_data.js` - Test data setup script
- `final_mvp_verification.js` - Final system verification

### Production Utilities
- `cleanup_data.js` - Data cleanup script
- `create_corrected_tour.js` - Tour creation with proper formatting
- `create_production_tour.js` - Initial tour creation script
- `create_tour_events.js` - Event and booking creation script
- `direct_cleanup.js` - Direct database cleanup (alternative approach)

## 🚀 Features

### Public Endpoints (5)
1. `GET /getToursV2` - List all active tours
2. `GET /getTourByIdV2/:tourId` - Get specific tour by ID  
3. `POST /createBooking` - Create new reservation
4. `POST /joinEvent` - Join existing public event
5. `GET /checkBooking` - Verify booking status by reference

### Admin Endpoints (8)
6. `POST /adminCreateTourV2` - Create new tour
7. `PUT /adminUpdateTourV2/:tourId` - Update existing tour
8. `DELETE /adminDeleteTourV2/:tourId` - Logically delete tour
9. `GET /adminGetBookings` - List bookings with filters
10. `PUT /adminUpdateBookingStatus/:bookingId` - Update booking status
11. `POST /adminTransferBooking/:bookingId` - Transfer bookings between tours
12. `GET /adminGetEventsCalendar` - Event calendar view
13. `POST /adminPublishEvent/:eventId` - Toggle event visibility

## 🌐 Technology Stack

- **Backend**: Firebase Cloud Functions (Node.js 22)
- **Database**: Google Cloud Firestore (NoSQL)
- **SDK**: Firebase Admin SDK
- **Runtime**: Google Cloud Run (2nd Gen)
- **Authentication**: Secret key headers (X-Admin-Secret-Key)

## 📋 Current Production Status

- **MVP**: Complete and operational
- **Functions Deployed**: 13/13
- **Active Tour**: "Nevado del Tolima" (ID: 9ujvQOODur1hEOMoLjEq)
- **Active Event**: November 10, 2025 with 2 of 8 participants booked

## 🛠️ Development Commands

Deploy functions:
```bash
firebase deploy --only functions
```

Run tests:
```bash
node api_test_suite.js
```

Setup test data:
```bash
node setup_test_data.js
```

## 🔐 Admin Access

All admin endpoints require the `X-Admin-Secret-Key` header with a valid admin token.

## 🏗️ Architecture

The system follows a microservices architecture using Firebase Cloud Functions with Firestore backend, supporting:
- Bilingual (Spanish/English) content
- Rate limiting to prevent spam
- Real-time capacity management
- Comprehensive audit trails
- Event publishing/unpublishing
- Booking transfers between events