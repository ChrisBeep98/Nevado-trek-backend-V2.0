<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

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

### Admin Endpoints (13)
6. `POST /adminCreateTourV2` - Create new tour
7. `PUT /adminUpdateTourV2/:tourId` - Update existing tour
8. `DELETE /adminDeleteTourV2/:tourId` - Logically delete tour
9. `GET /adminGetBookings` - List bookings with filters
10. `PUT /adminUpdateBookingStatus/:bookingId` - Update booking status
11. `PUT /adminUpdateBookingDetails/:bookingId` - Update core booking information
12. `POST /adminTransferBooking/:bookingId` - Transfer bookings between tours
13. `GET /adminGetEventsCalendar` - Event calendar view
14. `POST /adminPublishEvent/:eventId` - Toggle event visibility
15. `POST /adminTransferToNewTour/:bookingId` - Transfer booking to different tour (NEW!)
16. `POST /adminCreateEvent` - Create events independently of bookings (NEW!)
17. `POST /adminSplitEvent/:eventId` - Split events into multiple events by moving selected bookings (NEW!)
18. `GET /adminGetEventsByDate/:tourId/:date` - Get all events for a specific tour on a specific date (NEW!)

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
node comprehensive_api_test.js
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
- `comprehensive_api_test_v2.js` - Main API testing
- `comprehensive_admin_tests.js` - Admin functionality testing
- `comprehensive_test.js` - General functionality tests
- `comprehensive_test_sync.js` - Synchronization tests
- `admin_endpoint_tests.js` - Admin endpoint tests

## Production Status
- MVP is complete and operational
- 17/17 functions deployed (with 3 new endpoints added)
- Active tour "Nevado del Tolima" in production
- Timezone-aware date handling for Colombian locale

## Documentation
- `APIUSAGE.md`: Detailed API endpoint documentation
- `BUSINESS_LOGIC.md`: Complete business rules and workflows
- `COMPLETE_DOCUMENTATION.md`: Full system documentation
- `README.md`: Project overview and setup instructions

## Configuration
The system uses Firebase parameters (replacing the deprecated functions.config()) for configuration, including the admin secret key which is set via Firebase parameters during deployment.

## Deployment Notes
- Firebase location: southamerica-east1
- Node.js runtime: version 22
- Secret management via Firebase secret parameter system

## New Features
### Cross-Tour Transfer (adminTransferToNewTour)
- NEW endpoint that allows moving bookings between different tours
- Automatically handles event creation, capacity management, and audit trails
- Maintains customer details while recalculating pricing based on destination tour
- All operations happen within a Firestore transaction for data consistency

### Multiple Events Per Date Support
- **Enhanced adminUpdateBookingDetails**: Added `createNewEvent` parameter to create new events even when one exists for the same date and tour
- **Enhanced createBooking**: Added `createNewEvent` parameter to create separate events during booking
- **Enhanced adminTransferBooking**: Added `createNewEvent`, `newStartDate`, `newMaxCapacity`, and `newEventType` parameters for creating events during transfers
- **New adminCreateEvent endpoint**: Allows admins to create events independently of bookings
- **New adminSplitEvent endpoint**: Splits an event into multiple events by moving selected bookings to new events
- **New adminGetEventsByDate endpoint**: Retrieves all events for a specific tour on a specific date
- These features enable multiple separate events for the same tour on the same date, providing operational flexibility

## Qwen Added Memories
- Nevado Trek Backend superadmin token: ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7
