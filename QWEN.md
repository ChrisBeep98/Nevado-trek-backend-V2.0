# Nevado Trek Backend - Project Overview

## Project Summary

Nevado Trek Backend is a comprehensive reservation system for adventure tour management built with Firebase Cloud Functions. The system provides bilingual support (Spanish/English), anonymous booking capabilities, and advanced admin management features for adventure tour businesses. It follows a microservices architecture using Firebase Cloud Functions with Firestore as the backend database.

## Architecture & Technology Stack

- **Backend Framework**: Firebase Cloud Functions (Node.js 22)
- **Database**: Google Cloud Firestore (NoSQL)
- **Authentication**: Secret key headers (X-Admin-Secret-Key)
- **Runtime Environment**: Google Cloud Run (2nd Gen)
- **SDKs**: Firebase Admin SDK, Firebase Functions SDK

## Core Features

### Public Endpoints (5)
1. `GET /getToursV2` - List all active tours
2. `GET /getTourByIdV2/:tourId` - Get specific tour by ID  
3. `POST /createBooking` - Create new reservation
4. `POST /joinEvent` - Join existing public event
5. `GET /checkBooking` - Verify booking status by reference

### Admin Endpoints (10)
6. `POST /adminCreateTourV2` - Create new tour
7. `PUT /adminUpdateTourV2/:tourId` - Update existing tour
8. `DELETE /adminDeleteTourV2/:tourId` - Logically delete tour
9. `GET /adminGetBookings` - List bookings with filters
10. `PUT /adminUpdateBookingStatus/:bookingId` - Update booking status
11. `PUT /adminUpdateBookingDetails/:bookingId` - Update core booking information
12. `POST /adminTransferBooking/:bookingId` - Transfer bookings between tours
13. `GET /adminGetEventsCalendar` - Event calendar view
14. `POST /adminPublishEvent/:eventId` - Toggle event visibility

## Project Structure

```
nevado-trek-backend/
├── functions/                 # Main Firebase Functions implementation
│   ├── index.js              # Main entry point with all API functions
│   ├── src/                  # Modularized code
│   │   ├── constants.js      # System constants and configuration
│   │   ├── validators.js     # Input validation utilities
│   │   ├── audit.js          # Audit trail utilities
│   │   ├── helpers.js        # Helper functions
│   │   └── admin/            # Admin-specific utilities
│   ├── package.json          # Dependencies for Cloud Functions
├── node_modules/             # NPM dependencies
├── functions/node_modules/   # Cloud Functions dependencies
├── APIUSAGE.md               # Detailed API documentation
├── BUSINESS_LOGIC.md         # Business logic documentation
├── README.md                 # Project overview and setup
├── package.json              # Main project dependencies
├── firebase.json             # Firebase configuration
├── firestore.rules          # Security rules for Firestore
└── ...                      # Test files and documentation
```

## Key Development Concepts

### Booking vs Event Relationship
- Every initial booking creates a private event
- Events can be toggled between private (not joinable) and public (others can join)
- Multiple bookings can exist on the same public event

### Bilingual Support
- All user-facing content is stored in both Spanish and English
- Tours have bilingual names, descriptions, and other content
- Example: `name: {es: "...", en: "..."}`

### Rate Limiting
- Implemented for customer-facing endpoints to prevent spam
- 5 minutes between requests from same IP
- Maximum 3 bookings per hour per IP
- Maximum 5 bookings per day per IP

### Timezone Handling
- Proper timezone handling for Colombia locale (UTC-5)
- Date synchronization between booking and event documents
- Date-only format interpreted as beginning of day in local timezone

### Audit Trails
- Complete history of all booking status changes
- Logging of all admin actions with timestamps
- Tracking of event transitions when booking dates change

## Development Commands

### Deployment
```bash
firebase deploy --only functions
```

### Testing
```bash
node api_test_suite.js
```

### Local Development
```bash
npm run serve  # Start Firebase emulators
npm run shell  # Start functions shell
```

### Admin Access
All admin endpoints require the `X-Admin-Secret-Key` header with a valid admin token.

## Business Logic

The system manages three main concepts:
1. **Tours**: General tour experiences (like "Nevado del Tolima")
2. **Events**: Specific instances of tours on specific dates with capacity limits
3. **Bookings**: Customer reservations with specific customer details and participant counts

Events can be:
- **Private**: Created when individual customer books a new date
- **Public**: Made joinable by other customers after admin approval

## Security Features
- Secret key authentication for all admin endpoints
- IP-based rate limiting for public endpoints
- Capacity validation to prevent overbooking
- Transaction-based operations for data consistency

## Testing & Verification
The project includes comprehensive test files:
- `api_test_suite.js` - Main API testing
- `comprehensive_test.js` - Comprehensive functionality tests  
- `comprehensive_test_sync.js` - Synchronization tests
- `full_api_test.js` - Complete API functionality verification

## Production Status
- MVP is complete and operational
- 14/14 functions deployed
- Active tour "Nevado del Tolima" in production
- Timezone-aware date handling for Colombian locale

## Documentation
- `APIUSAGE.md`: Detailed API endpoint documentation
- `BUSINESS_LOGIC.md`: Complete business rules and workflows
- `COMPLETE_DOCUMENTATION.md`: Full system documentation
- `PLANNING_TASKS.md`: Project planning and current status

## Configuration
The system uses Firebase parameters (replacing the deprecated functions.config()) for configuration, including the admin secret key which is set via Firebase parameters during deployment.

## Deployment Notes
- Firebase location: southamerica-east1
- Node.js runtime: version 22
- Secret management via Firebase secret parameter system