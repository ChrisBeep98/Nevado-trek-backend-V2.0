# Nevado Trek Backend - Complete Documentation

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Database Schema](#database-schema)
3. [API Endpoints](#api-endpoints)
4. [Business Logic](#business-logic)
5. [Deployment & Testing](#deployment--testing)
6. [Admin Panel Design](#admin-panel-design)

## System Architecture

### Technology Stack
- **Backend**: Firebase Cloud Functions (Node.js 22)
- **Database**: Google Cloud Firestore (NoSQL)
- **SDK**: Firebase Admin SDK
- **Runtime**: Google Cloud Run (2nd Gen)
- **Authentication**: Secret key headers (X-Admin-Secret-Key)

### Deployment Architecture
```
Nevado Trek Backend/
├── functions/                 # Cloud Functions code
│   ├── index.js              # Main function implementations
│   ├── package.json          # Dependencies
│   └── .eslintrc.js          # Code quality rules
├── firestore.rules           # Database security rules
├── firestore.indexes.json    # Database indexes
└── firebase.json             # Firebase configuration
```

## Database Schema

### Collections Structure

#### 1. tours
```json
{
  "tourId": "string (auto-generated)",
  "name": {
    "es": "string",
    "en": "string"
  },
  "description": {
    "es": "string", 
    "en": "string"
  },
  "price": {
    "amount": "number",
    "currency": "string"
  },
  "pricingTiers": [
    {
      "pax": "number",
      "pricePerPerson": "number"
    }
  ],
  "maxParticipants": "number",
  "duration": "string",
  "isActive": "boolean",
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "images": ["string"],
  "details": [
    {
      "label": {
        "es": "string",
        "en": "string"
      },
      "value": {
        "es": "string", 
        "en": "string"
      }
    }
  ],
  "itinerary": {
    "type": "string",
    "days": [
      {
        "day": "number",
        "title": {
          "es": "string",
          "en": "string"
        },
        "activities": [
          {
            "es": "string",
            "en": "string"
          }
        ]
      }
    ]
  },
  "inclusions": [
    {
      "es": "string",
      "en": "string"
    }
  ],
  "recommendations": [
    {
      "es": "string",
      "en": "string"
    }
  ],
  "faqs": [
    {
      "question": {
        "es": "string",
        "en": "string"
      },
      "answer": {
        "es": "string",
        "en": "string"
      }
    }
  ]
}
```

#### 2. tourEvents
```json
{
  "eventId": "string (auto-generated)",
  "tourId": "string",
  "tourName": "string (denormalized)",
  "startDate": "timestamp",
  "endDate": "timestamp", 
  "maxCapacity": "number",
  "bookedSlots": "number",
  "type": "enum ('private', 'public')",
  "status": "enum ('active', 'full', 'completed', 'cancelled')",
  "totalBookings": "number",
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "auditTrail": [
    {
      "timestamp": "timestamp",
      "adminUser": "string",
      "action": "string",
      "previousValue": "any",
      "newValue": "any",
      "reason": "string"
    }
  ]
}
```

#### 3. bookings
```json
{
  "bookingId": "string (auto-generated)",
  "eventId": "string",
  "tourId": "string",
  "tourName": "string (denormalized)",
  "customer": {
    "fullName": "string",
    "documentId": "string", 
    "phone": "string",
    "email": "string",
    "notes": "string"
  },
  "pax": "number",
  "pricePerPerson": "number",
  "totalPrice": "number",
  "bookingDate": "timestamp",
  "status": "enum ('pending', 'confirmed', 'paid', 'cancelled', 'cancelled_by_admin', 'changed_tour', 'rebooked', 'hold', 'refund_pending', 'refund_completed')",
  "statusHistory": [
    {
      "timestamp": "string (ISO date) - client timestamp for arrays",
      "status": "string",
      "note": "string",
      "adminUser": "string"
    }
  ],
  "isEventOrigin": "boolean",
  "ipAddress": "string",
  "bookingReference": "string (BK-YYYYMMDD-XXX)",
  "previousStates": [
    {
      "action": "string",
      "timestamp": "timestamp",
      "fromTourId": "string",
      "toTourId": "string",
      "adminUser": "string",
      "reason": "string"
    }
  ],
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

#### 4. rateLimiter
```json
{
  "ip": "string",
  "lastBookingTimestamp": "timestamp",
  "bookingsThisHour": "number",
  "bookingsThisDay": "number",
  "updatedAt": "timestamp"
}
```

## Constants and Configuration

### System Constants
```javascript
CONSTANTS = {
  ADMIN_SECRET_KEY: "Parameter stored securely in Firebase Functions parameters",  // Now using secure parameters system
  
  COLLECTIONS: {
    TOURS: "tours",
    TOUR_EVENTS: "tourEvents", 
    BOOKINGS: "bookings",
    RATE_LIMITER: "rateLimiter"
  },
  
  STATUS: {
    EVENT_TYPE_PRIVATE: "private",
    EVENT_TYPE_PUBLIC: "public", 
    BOOKING_PENDING: "pending",
    BOOKING_CONFIRMED: "confirmed",
    BOOKING_PAID: "paid", 
    BOOKING_CANCELLED: "cancelled",
    BOOKING_CANCELLED_BY_ADMIN: "cancelled_by_admin"
  },
  
  RATE_LIMITING: {
    RATE_LIMIT_SECONDS: 300,      // 5 minutes
    MAX_BOOKINGS_PER_HOUR: 3,
    MAX_BOOKINGS_PER_DAY: 5
  },
  
  BOOKING_REFERENCE_PREFIX: "BK-"
}
```

## API Endpoints

### Public Tour Endpoints

#### 1. GET /getToursV2
- **URL**: https://gettoursv2-wgfhwjbpva-uc.a.run.app
- **Method**: GET
- **Description**: List all active tours
- **Authentication**: None
- **Response**: `200 OK` with array of active tours or `200 OK` with empty array
- **Example Request**:
  ```bash
  curl https://gettoursv2-wgfhwjbpva-uc.a.run.app
  ```
- **Example Response**:
  ```json
  [
    {
      "tourId": "string",
      "name": { "es": "Tour Name ES", "en": "Tour Name EN" },
      "isActive": true,
      "...": "other fields"
    }
  ]
  ```

#### 2. GET /getTourByIdV2/:tourId
- **URL**: https://gettourbyidv2-wgfhwjbpva-uc.a.run.app
- **Method**: GET
- **Description**: Get specific tour by ID
- **Authentication**: None
- **Parameters**: `tourId` in URL path
- **Response**: `200 OK` with tour data or `404 Not Found`
- **Example Request**:
  ```bash
  curl https://gettourbyidv2-wgfhwjbpva-uc.a.run.app/tours/ABC123
  ```

### Public Booking Endpoints (Phase 2A)

#### 3. POST /createBooking
- **URL**: https://createbooking-wgfhwjbpva-uc.a.run.app
- **Method**: POST
- **Description**: Create new reservation
- **Authentication**: Rate limited by IP (no login required)
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "tourId": "string",
    "startDate": "ISO date string",
    "customer": {
      "fullName": "string",
      "documentId": "string", 
      "phone": "string",
      "email": "string",
      "notes": "string (optional)"
    },
    "pax": "number (positive)"
  }
  ```
- **Response**: 
  - `201 Created` with booking details
  - `400 Bad Request` for invalid data
  - `403 Forbidden` for rate limiting
  - `404 Not Found` for invalid tour
  - `422 Unprocessable Entity` for capacity issues
- **Example Request**:
  ```bash
  curl -X POST https://createbooking-wgfhwjbpva-uc.a.run.app \
    -H "Content-Type: application/json" \
    -d '{
      "tourId": "tour123",
      "startDate": "2025-12-15T07:00:00Z",
      "customer": {
        "fullName": "John Doe",
        "documentId": "ID123456789",
        "phone": "+573123456789", 
        "email": "john@example.com"
      },
      "pax": 2
    }'
  ```
- **Example Response**:
  ```json
  {
    "success": true,
    "bookingId": "string",
    "bookingReference": "BK-YYYYMMDD-XXX",
    "status": "pending",
    "message": "Reserva creada exitosamente..."
  }
  ```

#### 4. POST /joinEvent
- **URL**: https://joinevent-wgfhwjbpva-uc.a.run.app
- **Method**: POST
- **Description**: Join existing public event
- **Authentication**: Rate limited by IP (no login required)
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "eventId": "string",
    "customer": {
      "fullName": "string",
      "documentId": "string",
      "phone": "string", 
      "email": "string",
      "notes": "string (optional)"
    },
    "pax": "number (positive)"
  }
  ```
- **Response**:
  - `201 Created` with booking details
  - `400 Bad Request` for invalid data
  - `403 Forbidden` for rate limiting
  - `404 Not Found` for invalid/non-public event
  - `422 Unprocessable Entity` for capacity issues

#### 5. GET /checkBooking
- **URL**: https://checkbooking-wgfhwjbpva-uc.a.run.app
- **Method**: GET
- **Description**: Verify booking status by reference
- **Authentication**: None (validated by reference)
- **Parameters**: 
  - `reference` (required) - booking reference code
  - `email` (optional) - additional verification
- **Response**:
  - `200 OK` with booking details
  - `404 Not Found` for invalid reference/email combination
- **Example Request**:
  ```bash
  curl "https://checkbooking-wgfhwjbpva-uc.a.run.app?reference=BK-20251008-123&email=test@example.com"
  ```

### Admin Tour Endpoints

#### 6. POST /adminCreateTourV2
- **URL**: https://admincreatetourv2-wgfhwjbpva-uc.a.run.app
- **Method**: POST
- **Description**: Create new tour
- **Authentication**: `X-Admin-Secret-Key` header required
- **Headers**: 
  - `Content-Type: application/json`
  - `X-Admin-Secret-Key: [YOUR_SECURE_ADMIN_KEY]`
- **Response**: `201 Created` or error codes

#### 7. PUT /adminUpdateTourV2/:tourId
- **URL**: https://adminupdatetourv2-wgfhwjbpva-uc.a.run.app
- **Method**: PUT
- **Description**: Update existing tour
- **Authentication**: `X-Admin-Secret-Key` header required
- **Response**: `200 OK` or error codes

#### 8. DELETE /adminDeleteTourV2/:tourId
- **URL**: https://admindeletetourv2-wgfhwjbpva-uc.a.run.app
- **Method**: DELETE
- **Description**: Logically delete tour (set isActive: false)
- **Authentication**: `X-Admin-Secret-Key` header required
- **Response**: `200 OK` or error codes

### Admin Booking Endpoints (Phase 2B)

#### 9. GET /adminGetBookings
- **URL**: https://us-central1-nevadotrektest01.cloudfunctions.net/adminGetBookings
- **Method**: GET
- **Description**: List all bookings with filtering capabilities
- **Authentication**: `X-Admin-Secret-Key` header required
- **Query Parameters**:
  - `status` (optional) - Filter by booking status
  - `tourId` (optional) - Filter by tour ID
  - `startDateFrom` (optional) - Filter by booking date from (ISO date string)
  - `startDateTo` (optional) - Filter by booking date to (ISO date string)
  - `customerName` (optional) - Filter by customer full name
  - `limit` (optional) - Number of results per page (default: 50, max: 200)
  - `offset` (optional) - Number of results to skip (for pagination)
- **Response**: `200 OK` with paginated list of bookings
- **Example Request**:
  ```bash
  curl -H "X-Admin-Secret-Key: [YOUR_SECURE_ADMIN_KEY]" \
    "https://us-central1-nevadotrektest01.cloudfunctions.net/adminGetBookings?status=pending&limit=10"
  ```
- **Example Response**:
  ```json
  {
    "bookings": [
      {
        "bookingId": "string",
        "eventId": "string",
        "tourId": "string",
        "customer": {
          "fullName": "string",
          "documentId": "string",
          "phone": "string",
          "email": "string"
        },
        "pax": "number",
        "status": "pending",
        "...": "other fields"
      }
    ],
    "count": 1,
    "pagination": {
      "limit": 10,
      "offset": 0,
      "hasMore": false
    }
  }
  ```

### Admin Event Endpoints (Phase 2B)

#### 10. GET /adminGetEventsCalendar
- **URL**: https://us-central1-nevadotrektest01.cloudfunctions.net/adminGetEventsCalendar
- **Method**: GET
- **Description**: List all events with filtering capabilities for calendar view
- **Authentication**: `X-Admin-Secret-Key` header required
- **Query Parameters**:
  - `tourId` (optional) - Filter by tour ID
  - `startDateFrom` (optional) - Filter by event start date from (ISO date string)
  - `startDateTo` (optional) - Filter by event start date to (ISO date string)
  - `type` (optional) - Filter by event type ('private' or 'public')
  - `status` (optional) - Filter by event status ('active', 'full', 'completed', 'cancelled')
  - `limit` (optional) - Number of results per page (default: 50, max: 200)
  - `offset` (optional) - Number of results to skip (for pagination)
- **Response**: `200 OK` with paginated list of events
- **Example Request**:
  ```bash
  curl -H "X-Admin-Secret-Key: [YOUR_SECURE_ADMIN_KEY]" \
    "https://us-central1-nevadotrektest01.cloudfunctions.net/adminGetEventsCalendar?startDateFrom=2025-01-01&limit=20"
  ```
- **Example Response**:
  ```json
  {
    "events": [
      {
        "eventId": "string",
        "tourId": "string",
        "tourName": "string",
        "startDate": "ISO date string",
        "endDate": "ISO date string",
        "maxCapacity": "number",
        "bookedSlots": "number",
        "type": "private",
        "status": "active",
        "totalBookings": "number",
        "createdAt": "ISO date string",
        "updatedAt": "ISO date string"
      }
    ],
    "count": 1,
    "pagination": {
      "limit": 20,
      "offset": 0,
      "hasMore": false
    }
  }
  ```
- **Deployment Status**: ✅ Deployed and fully functional

#### 11. POST /adminPublishEvent/:eventId
- **URL**: https://us-central1-nevadotrektest01.cloudfunctions.net/adminPublishEvent/{eventId}
- **Method**: POST
- **Description**: Publish or unpublish an event (toggle between public/private)
- **Authentication**: `X-Admin-Secret-Key` header required
- **Request Body**:
  ```json
  {
    "action": "publish" | "unpublish"  // Optional, defaults to "publish"
  }
  ```
- **URL Parameters**:
  - `eventId` (required) - ID of the event to publish/unpublish
- **Response**: `200 OK` with operation result, or appropriate error code
- **Example Request**:
  ```bash
  curl -X POST -H "X-Admin-Secret-Key: [YOUR_SECURE_ADMIN_KEY]" \
    -H "Content-Type: application/json" \
    -d '{"action":"publish"}' \
    "https://us-central1-nevadotrektest01.cloudfunctions.net/adminPublishEvent/abc123"
  ```
- **Example Response**:
  ```json
  {
    "success": true,
    "eventId": "abc123",
    "message": "Evento actualizado exitosamente a public",
    "previousType": "private",
    "newType": "public"
  }
  ```
- **Deployment Status**: ✅ Deployed and fully functional

#### 12. POST /adminTransferBooking/:bookingId
- **URL**: https://us-central1-nevadotrektest01.cloudfunctions.net/adminTransferBooking/{bookingId}
- **Method**: POST
- **Description**: Transfer a booking from one event to another
- **Authentication**: `X-Admin-Secret-Key` header required
- **Request Body**:
  ```json
  {
    "destinationEventId": "string",  // Required: ID of the destination event
    "reason": "string"               // Optional: Reason for the transfer
  }
  ```
- **URL Parameters**:
  - `bookingId` (required) - ID of the booking to transfer
- **Response**: `200 OK` with transfer result, or appropriate error code
- **Example Request**:
  ```bash
  curl -X POST -H "X-Admin-Secret-Key: miClaveSecreta123" \
    -H "Content-Type: application/json" \
    -d '{"destinationEventId":"def456","reason":"Change of date requested by customer"}' \
    "https://us-central1-nevadotrektest01.cloudfunctions.net/adminTransferBooking/abc123"
  ```
- **Example Response**:
  ```json
  {
    "success": true,
    "bookingId": "abc123",
    "message": "Reserva transferida exitosamente",
    "previousEventId": "oldEventId",
    "newEventId": "def456",
    "pax": 2,
    "reason": "Change of date requested by customer"
  }
  ```
- **Deployment Status**: ✅ Deployed and fully functional

## Error Handling & Response Format

### Standard Error Format
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "User-friendly message",
    "details": "Technical details"
  }
}
```

### Common Error Codes
- `INVALID_DATA`: Validation failed
- `RATE_LIMIT_EXCEEDED`: Too many requests from IP
- `RESOURCE_NOT_FOUND`: Tour/Event/Booking not found
- `UNAUTHORIZED`: Invalid admin key
- `VALIDATION_ERROR`: Specific validation issue
- `CAPACITY_EXCEEDED`: No more capacity available
- `INTERNAL_ERROR`: Server-side issue

## Business Logic

### Overview
Complete reservation system for adventure tour management with:
- Bilingual (Spanish/English) support for all customer-facing content
- Anonymous booking system with rate limiting
- Advanced admin panel for complete reservation/event management
- Support for private groups (created by individuals) and public events (joinable by multiple customers)

## Core Business Processes

### 1. Tour Management
- **Tour Creation**: Admin creates tours with bilingual descriptions and pricing tiers
- **Tour Visibility**: `isActive: true/false` for public availability control
- **Tour Structure**: Contains complete information including names, descriptions, pricing, inclusions, FAQs, etc. in both languages

### 2. Event Management
- **Private Events**: Created when individual customer books a new date
- **Public Events**: Previously private events that become joinable by other customers
- **Capacity Management**: Track available slots with `bookedSlots` vs `maxCapacity`

### 3. Booking System
- **Individual Booking**: Customer books a new tour date, creating private event
- **Event Joining**: Customer joins existing public event
- **Reference System**: Unique booking references in format `BK-YYYYMMDD-XXX`
- **Rate Limiting**: Prevents spam (5 min between requests, 3/hour, 5/day per IP)

### 4. Reservation Management
- **Status Tracking**: `pending` → `confirmed` → `paid` → `cancelled` workflow
- **History Logging**: Complete audit trail of all status changes
- **Customer Management**: Full contact information with special notes

### 5. Event Management & Calendar
- **Calendar View**: Admin calendar view with filtering by date range, tour, type, and status
- **Event Types**: Private (individual booking origin) and public (joinable by multiple customers) events
- **Event Statuses**: active, full, completed, cancelled
- **Capacity Management**: Real-time capacity tracking for events
- **Publish/Unpublish Control**: Admin can toggle event visibility between private and public

### 6. Event Visibility Management
- **Public Events**: Joinable by multiple customers, visible to joinEvent endpoint
- **Private Events**: Only accessible to original booking customer
- **Admin Control**: Administrators can change event visibility at any time
- **Validation**: System prevents invalid state transitions

### 7. Booking Transfer Management
- **Booking Transfer**: Admins can move bookings between events of the same tour
- **Capacity Validation**: System checks destination event has available capacity
- **Data Integrity**: Uses transactions to ensure capacity updates are consistent
- **Audit Trail**: All transfers are logged in booking status history
- **Status Preservation**: Booking status is maintained during transfer
- **Restrictions**: Cannot transfer cancelled bookings

### 8. Cross-Tour Booking Transfer Management (NEW)
- **Cross-Tour Transfer**: Admins can move bookings from one tour to a completely different tour
- **New Endpoint**: POST /adminTransferToNewTour/:bookingId - Handles complete cross-tour transfers
- **Event Creation**: Automatically creates new events on destination tour if needed for the specified date
- **Booking Recreation**: Creates a completely new booking on destination tour with same customer details
- **Original Cancellation**: Cancels the original booking with reference to new booking
- **Pricing Recalculation**: Uses destination tour's pricing tiers for new booking
- **Capacity Management**: Adjusts capacity on both original and destination events
- **Data Preservation**: Maintains all customer information from original booking
- **New Reference Generation**: Creates new booking reference for the new booking
- **Audit Trail**: Complete tracking of cross-tour transfer with references to both bookings
- **Transaction Safety**: All operations occur within Firestore transaction for data consistency
- **Validation**: Ensures destination tour exists and has capacity for pax count

## Business Rules

### Tour Rules
- Tours can be activated/deactivated independently of deletion
- Bilingual content required for all text fields
- Pricing tiers defined by group size (dynamic pricing)

### Event Rules  
- Events start as private when first individual booking is made
- Events can be made public, allowing others to join
- Capacity limits enforced at booking time
- Type changes from private to public (not vice versa)

### Booking Rules
- Rate limiting prevents spam and automated booking
- Real-time capacity checking prevents overbooking
- Reference codes enable tracking without login
- Bookings can be associated with tour events

### Admin Rules
- Secret key authentication for all admin functions
- Complete reservation management capabilities
- Event visibility control
- Customer information access and modification

## Customer Journey Flow

### 1. Browse Tours (Public)
- View active tours with complete descriptions in preferred language
- Review pricing, inclusions, and itinerary
- Check calendar for available dates

### 2. Create Booking or Join Event
- **New Date**: Fill customer details, select date → creates private event
- **Join Existing**: Select public event → join available capacity
- **Rate Limited**: IP blocked if too many requests in timeframe

### 3. Receive Confirmation
- Booking reference code provided
- Confirmation email with details
- Option to check status using reference

### 4. Admin Processing
- Admin reviews pending bookings
- Confirms payment and finalizes details
- Updates status to confirmed/paid as appropriate

## Revenue Model Support
- Dynamic pricing based on group size
- Capacity-based event management
- Anti-spam protection reducing fraud
- Complete booking history for reporting

## Deployment & Testing

### Deployment Issue Resolution

#### Problem & Solution
- **Issue**: Deployment was failing due to ESLint line-ending errors (CRLF vs LF) and missing function discrepancy
- **Solution**: 
  1. Updated `.eslintrc.js` to disable `linebreak-style` rule to accommodate Windows line endings
  2. Fixed all linting errors in `functions/index.js`
  3. Added missing `adminTransferBooking` function that existed in deployed version but was missing locally
  4. Used `FUNCTIONS_DISCOVERY_TIMEOUT=120` environment variable to handle function discovery timeout

### Current Feature: Admin Transfer Booking Endpoint

The new `adminTransferBooking` endpoint has been implemented and deployed.

### Deployment Issue Resolution
After fixing the ESLint issues and adding the missing function, deployment is now successful.

#### Common Deployment Issues & Solutions:
1. **ESLint Line-ending errors**: Disable `linebreak-style` rule in `.eslintrc.js`
2. **Missing functions**: Ensure all deployed functions exist in local code
3. **Function discovery timeouts**: Use `FUNCTIONS_DISCOVERY_TIMEOUT=120` environment variable
4. **Pre-deploy script failures**: Fix all linting errors before deployment

#### Deployment Command:
```bash
set FUNCTIONS_DISCOVERY_TIMEOUT=120 firebase deploy --only functions
```

## Admin Panel Architecture & Design

### Overview
A comprehensive admin panel for managing all aspects of the adventure tour reservation system using only the existing backend capabilities. The panel will provide administrators with tools to manage tours, bookings, events, and customer data with an intuitive, responsive interface.

### Core Principles
- **Bilingual Support**: All UI elements available in both Spanish and English
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Secure Access**: Single admin token authentication (X-Admin-Secret-Key header)
- **Intuitive UX**: Simple navigation with powerful functionality
- **Real-time Data**: Live updates and notifications of system changes

### Current Backend Capabilities & API Usage

#### Public Endpoints
- **GET /getToursV2**: Retrieve all active tours
  - **Usage**: `GET https://gettoursv2-wgfhwjbpva-uc.a.run.app`
  - **Response**: Array of active tours with bilingual content
  - **Authentication**: None required

- **GET /getTourByIdV2/:tourId**: Retrieve specific tour by ID
  - **Usage**: `GET https://gettourbyidv2-wgfhwjbpva-uc.a.run.app/{tourId}`
  - **Response**: Complete tour information
  - **Authentication**: None required

- **POST /createBooking**: Create new reservation
  - **Usage**: `POST https://createbooking-wgfhwjbpva-uc.a.run.app`
  - **Body**: 
    ```json
    {
      "tourId": "string",
      "startDate": "ISO date string",
      "customer": {
        "fullName": "string",
        "documentId": "string",
        "phone": "string", 
        "email": "string",
        "notes": "string (optional)"
      },
      "pax": "number (positive)"
    }
    ```
  - **Response**: 201 with booking details or appropriate error codes
  - **Authentication**: Rate limited by IP

- **POST /joinEvent**: Join existing public event
  - **Usage**: `POST https://joinevent-wgfhwjbpva-uc.a.run.app`
  - **Body**: 
    ```json
    {
      "eventId": "string",
      "customer": {
        "fullName": "string",
        "documentId": "string",
        "phone": "string",
        "email": "string",
        "notes": "string (optional)"
      },
      "pax": "number (positive)"
    }
    ```
  - **Response**: 201 with booking details or appropriate error codes
  - **Authentication**: Rate limited by IP

- **GET /checkBooking**: Verify booking status by reference
  - **Usage**: `GET https://checkbooking-wgfhwjbpva-uc.a.run.app?reference=BK-XXXXX&email=user@example.com`
  - **Response**: Complete booking information
  - **Authentication**: None (validated by reference)

#### Admin Endpoints
- **POST /adminCreateTourV2**: Create new tour (requires admin token)
  - **Usage**: `POST https://us-central1-nevadotrektest01.cloudfunctions.net/adminCreateTourV2`
  - **Headers**: `X-Admin-Secret-Key: [YOUR_TOKEN]`
  - **Body**: Complete tour object with bilingual fields
  - **Response**: 201 with created tour ID
  
- **PUT /adminUpdateTourV2/:tourId**: Update existing tour (requires admin token)
  - **Usage**: `PUT https://us-central1-nevadotrektest01.cloudfunctions.net/adminUpdateTourV2/{tourId}`
  - **Headers**: `X-Admin-Secret-Key: [YOUR_TOKEN]`
  - **Body**: Fields to update
  - **Response**: 200 with success message
  
- **DELETE /adminDeleteTourV2/:tourId**: Logically delete tour (requires admin token)
  - **Usage**: `DELETE https://us-central1-nevadotrektest01.cloudfunctions.net/adminDeleteTourV2/{tourId}`
  - **Headers**: `X-Admin-Secret-Key: [YOUR_TOKEN]`
  - **Response**: 200 with success message (sets isActive to false)
  
- **GET /adminGetBookings**: List all bookings with filtering (requires admin token)
  - **Usage**: `GET https://us-central1-nevadotrektest01.cloudfunctions.net/adminGetBookings`
  - **Headers**: `X-Admin-Secret-Key: [YOUR_TOKEN]`
  - **Query Parameters**:
    - `status` (optional) - Filter by booking status
    - `tourId` (optional) - Filter by tour ID
    - `startDateFrom` (optional) - Filter by booking date from
    - `startDateTo` (optional) - Filter by booking date to
    - `customerName` (optional) - Filter by customer full name
    - `limit` (optional) - Number of results per page (default: 50, max: 200)
    - `offset` (optional) - Number of results to skip (for pagination)
  - **Response**: 200 with paginated bookings list
  
- **PUT /adminUpdateBookingStatus/:bookingId**: Update booking status (requires admin token)
  - **Usage**: `PUT https://us-central1-nevadotrektest01.cloudfunctions.net/adminUpdateBookingStatus/{bookingId}`
  - **Headers**: `X-Admin-Secret-Key: [YOUR_TOKEN]`
  - **Body**: 
    ```json
    {
      "status": "pending|confirmed|paid|cancelled|cancelled_by_admin",
      "reason": "string (optional, reason for status change)"
    }
    ```
  - **Response**: 200 with success message and audit trail
  
- **GET /adminGetEventsCalendar**: List events for calendar view (requires admin token)
  - **Usage**: `GET https://us-central1-nevadotrektest01.cloudfunctions.net/adminGetEventsCalendar`
  - **Headers**: `X-Admin-Secret-Key: [YOUR_TOKEN]`
  - **Query Parameters**:
    - `tourId` (optional) - Filter by tour ID
    - `startDateFrom` (optional) - Filter by event start date from
    - `startDateTo` (optional) - Filter by event start date to
    - `type` (optional) - Filter by event type ('private' or 'public')
    - `status` (optional) - Filter by event status ('active', 'full', 'completed', 'cancelled')
    - `limit` (optional) - Number of results per page (default: 50, max: 200)
    - `offset` (optional) - Number of results to skip (for pagination)
  - **Response**: 200 with paginated events list

- **POST /adminPublishEvent/:eventId**: Toggle event visibility (requires admin token)
  - **Usage**: `POST https://us-central1-nevadotrektest01.cloudfunctions.net/adminPublishEvent/{eventId}`
  - **Headers**: `X-Admin-Secret-Key: [YOUR_TOKEN]`
  - **Body**: 
    ```json
    {
      "action": "publish|unpublish"  // Optional, defaults to "publish"
    }
    ```
  - **Response**: 200 with success message and type change details

- **POST /adminTransferBooking**: Transfer booking between events of the same tour (requires admin token)
  - **Usage**: `POST https://us-central1-nevadotrektest01.cloudfunctions.net/adminTransferBooking/{bookingId}`
  - **Headers**: `X-Admin-Secret-Key: [YOUR_TOKEN]`
  - **URL Parameters**:
    - `bookingId` (required) - ID of the booking to transfer
  - **Body**: 
    ```json
    {
      "destinationEventId": "string (required, must be same tour)",
      "reason": "string (optional, reason for transfer)"
    }
    ```
  - **Response**: 200 with transfer confirmation and details

- **POST /adminTransferToNewTour**: Transfer booking between different tours (NEW!) (requires admin token)
  - **Usage**: `POST https://us-central1-nevadotrektest01.cloudfunctions.net/adminTransferToNewTour/{bookingId}`
  - **Headers**: `X-Admin-Secret-Key: [YOUR_TOKEN]`
  - **URL Parameters**:
    - `bookingId` (required) - ID of the booking to transfer
  - **Body**: 
    ```json
    {
      "newTourId": "string (required)",
      "newStartDate": "ISO date string (optional, defaults to original date)",
      "reason": "string (optional, reason for transfer)"
    }
    ```
  - **Response**: 200 with transfer confirmation and details
  - **Features**: Complete cross-tour transfer functionality that handles creating new events if needed, preserving customer information, adjusting capacity on both events, cancelling the original booking, and maintaining audit trails - all within a single Firestore transaction
  - **Important Behavior**: When called, the system will: 1) Validate the destination tour exists and is active, 2) Find or create an event for the destination tour on the specified date, 3) Create a new booking on the destination tour with the same customer details, 4) Cancel the original booking with a reference to the new booking, 5) Adjust capacity on both events accordingly

- **PUT /adminUpdateBookingDetails/:bookingId**: Update core booking information (requires admin token)
  - **Usage**: `PUT https://us-central1-nevadotrektest01.cloudfunctions.net/adminUpdateBookingDetails/{bookingId}`
  - **Headers**: `X-Admin-Secret-Key: [YOUR_TOKEN]`
  - **Body**: 
    ```json
    {
      "customer": {
        "fullName": "string (optional)",
        "documentId": "string (optional)", 
        "phone": "string (optional)",
        "email": "string (optional)",
        "notes": "string (optional)"
      },
      "tourId": "string (optional)",
      "tourName": "string (optional)", 
      "startDate": "ISO date string (optional)",
      "pax": "number (optional)",
      "price": "number (optional)",
      "createNewEvent": "boolean (optional, if true creates new event even if one exists for same date and tour)",
      "reason": "string (optional, reason for the change)"
    }
    ```
  - **Response**: 200 with success message and updated booking details
  - **Features**: Partial updates for customer information, tour, date, pax, price with full audit trail
  - **Important Behavior**: When updating the `startDate`, the system finds or creates an appropriate event for the new date and moves the booking to the new event, automatically adjusting capacity between the old and new events using Firestore transactions
  - **Date Synchronization**: The booking's startDate field is now properly synchronized with the associated event's date to ensure consistency
  - **Timezone Handling**: Date changes properly account for Colombia timezone (UTC-5) to ensure correct calendar day display, with date-only strings interpreted as beginning of day in local timezone (e.g., "2025-12-31" will be interpreted as December 31st in Colombia timezone)
  - **Multiple Events Support**: When `createNewEvent` is set to `true`, the system creates a new event for the same date and tour even if one already exists, allowing for multiple separate events per date

- **POST /adminCreateEvent**: Create events independently of bookings (requires admin token) (NEW!)
  - **Usage**: `POST https://us-central1-nevadotrektest01.cloudfunctions.net/adminCreateEvent`
  - **Headers**: `X-Admin-Secret-Key: [YOUR_TOKEN]`
  - **Body**: 
    ```json
    {
      "tourId": "string (required)",
      "startDate": "ISO date string (required)",
      "endDate": "ISO date string (optional, defaults to 3 days after start)",
      "maxCapacity": "number (optional, defaults to tour's max capacity or 8)",
      "type": "private|public (optional, defaults to 'private')",
      "status": "active|inactive|completed|cancelled (optional, defaults to 'active')",
      "notes": "string (optional)"
    }
    ```
  - **Response**: 201 with success message and created event details
  - **Features**: Allows admins to create events in advance with specific capacity and visibility settings without requiring a booking
  - **Use Cases**: Creating events ahead of time, preparing private groups, setting up events with specific capacity needs

- **POST /adminSplitEvent/:eventId**: Split an event into multiple events by moving selected bookings (requires admin token) (NEW!)
  - **Usage**: `POST https://us-central1-nevadotrektest01.cloudfunctions.net/adminSplitEvent/{eventId}`
  - **Headers**: `X-Admin-Secret-Key: [YOUR_TOKEN]`
  - **URL Parameters**:
    - `eventId` (required) - ID of the event to split
  - **Body**: 
    ```json
    {
      "bookingIds": "array of booking IDs to move to new event (required)",
      "newEventMaxCapacity": "number (optional, defaults to original capacity)",
      "newEventType": "private|public (optional, defaults to original type)",
      "reason": "string (optional)"
    }
    ```
  - **Response**: 200 with success message and split details
  - **Features**: Splits a single event into multiple events by moving selected bookings to a new event
  - **Use Cases**: Separating large groups into smaller ones, creating private groups from public events

- **GET /adminGetEventsByDate/:tourId/:date**: Get all events for a specific tour on a specific date (requires admin token) (NEW!)
  - **Usage**: `GET https://us-central1-nevadotrektest01.cloudfunctions.net/adminGetEventsByDate/{tourId}/{date}`
  - **Headers**: `X-Admin-Secret-Key: [YOUR_TOKEN]`
  - **URL Parameters**:
    - `tourId` (required) - ID of the tour
    - `date` (required) - Date in YYYY-MM-DD format
  - **Response**: 200 with list of events for the specified tour on the specified date
  - **Features**: Retrieves all events for a specific tour on a specific date, particularly useful when managing multiple events per date
  - **Use Cases**: Checking all events for a tour on a specific date, managing capacity across multiple events

### Architecture

#### Technology Stack
- **Frontend**: React.js with JavaScript/TypeScript
- **Styling**: Tailwind CSS with Material Design principles
- **State Management**: Redux Toolkit or Zustand
- **API Communication**: Axios with interceptors for admin token
- **Authentication**: Single admin token via X-Admin-Secret-Key header
- **Calendar Integration**: FullCalendar or react-big-calendar
- **Charts/Visualizations**: Chart.js or D3.js
- **UI Components**: Headless UI or Radix UI for accessibility
- **Form Handling**: React Hook Form with validation

### Admin Workflow
1. **Tour Management**: Create, update, activate/deactivate tours
2. **Booking Monitoring**: Monitor pending bookings and update statuses
3. **Event Management**: Control event visibility and capacity
4. **Customer Communication**: Manage customer information and special requests
5. **Booking Transfers**: Handle tour change requests from customers

## Current Status

### 🚀 MVP Status: COMPLETE! ✅

**Date**: October 8, 2025  
**Status**: Production Ready  
**Functions Deployed**: 14/14 operational  
**Phases Complete**: 4/5 (Phase 1, 2A, 2B, 2C)  

### Complete Feature Set
- Tour management with bilingual support
- Complete booking system with rate limiting
- Event management with capacity tracking
- Full admin panel with booking transfer capabilities
- Security and data integrity measures
- Production-ready error handling

The system is fully operational and ready for production use with all essential features for a complete tour booking management system.