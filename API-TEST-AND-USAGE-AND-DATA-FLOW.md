  # Complete API Endpoints Documentation

  ## Table of Contents
  - [Overview](#overview)
  - [Architecture & Technology Stack](#architecture--technology-stack)
  - [Authentication](#authentication)
  - [Rate Limiting](#rate-limiting)
  - [System Constants](#system-constants)
  - [Database Schema](#database-schema)
  - [API Endpoints](#api-endpoints)
    - [Public Tour Endpoints](#public-tour-endpoints)
    - [Public Booking Endpoints](#public-booking-endpoints)
    - [Tour Management](#tour-management)
    - [Booking Management](#booking-management)
    - [Event Management](#event-management)
    - [Data Flow Examples](#data-flow-examples)
  - [Business Logic & Data Flow](#business-logic--data-flow)
    - [Tour-Event-Booking Relationship](#tour-event-booking-relationship)
    - [Capacity Management](#capacity-management)
    - [Pricing & Date Handling](#pricing--date-handling)
    - [Audit Trails](#audit-trails)
    - [Booking Status Transitions](#booking-status-transitions)
    - [Cross-Tour Transfers](#cross-tour-transfers)
    - [Event Splitting](#event-splitting)
  - [Frontend Implementation](#frontend-implementation)
  - [Best Practices](#best-practices)

  ## Overview

  The Nevado Trek Backend provides a complete reservation system for adventure tour management with:

  ### Core Features
  - Bilingual (Spanish/English) support for all customer-facing content
  - Anonymous booking system with rate limiting
  - Advanced admin panel for complete reservation/event management
  - Support for private groups (created by individuals) and public events (joinable by multiple customers)
  - Advanced booking management capabilities including cross-tour transfers
  - Event splitting functionality for better group management
  - Complete audit trails for all administrative actions

  ### Architecture & Technology Stack
  - **Backend Framework**: Firebase Cloud Functions (Node.js 22)
  - **Database**: Google Cloud Firestore (NoSQL)
  - **Authentication**: Secret key headers (X-Admin-Secret-Key)
  - **Runtime Environment**: Google Cloud Run (2nd Gen)
  - **SDKs**: Firebase Admin SDK, Firebase Functions SDK

  ### Complete Endpoint Count
  - **Public Endpoints**: 5 (for customer booking flow)
  - **Admin Endpoints**: 17 (for complete management)
  - **Total**: 22 endpoints

  ## Architecture & Technology Stack

  ### Backend Architecture
  - **Framework**: Firebase Cloud Functions (Node.js 22)
  - **Database**: Google Cloud Firestore (NoSQL document database)
  - **Authentication**: Secret key validation using Firebase Parameters (replacing deprecated functions.config())
  - **Runtime**: Google Cloud Run (2nd Generation)
  - **SDKs**: Firebase Admin SDK for server-side access to Google Cloud services

  ### Security Architecture
  - All admin endpoints require authentication via `X-Admin-Secret-Key` header
  - Secret key stored securely via Firebase Parameters system
  - Rate limiting applied only to customer-facing endpoints (not admin endpoints)
  - IP-based rate limiting for public endpoints (5 minutes between requests, 3/hour, 5/day per IP)

  ### Data Architecture
  - **Firestore Collections**:
    - `tours`: Master catalog of available tours with bilingual content
    - `tourEvents`: Specific instances of tours on specific dates with capacity tracking
    - `bookings`: Customer reservations with complete audit trail
    - `rateLimiter`: Rate limiting records for IP-based limits
  - **Denormalization Strategy**: Tour names and key information stored in events and bookings for optimized queries
  - **Audit Trail Structure**: All changes tracked with timestamps, admin users, and reasons

  ## Authentication

  All admin endpoints require authentication using the `X-Admin-Secret-Key` header:

  ### Header Format
  ```
  X-Admin-Secret-Key: {your_admin_secret_key}
  ```

  ### Example Request
  ```javascript
  const headers = {
    'X-Admin-Secret-Key': 'your_secret_key_here',
    'Content-Type': 'application/json'
  };

  fetch('https://us-central1-nevadotrektest01.cloudfunctions.net/adminGetBookings', {
    method: 'GET',
    headers: headers
  });
  ```

  ### Frontend Implementation
  ```javascript
  // For Vite-based projects, set VITE_API_BASE_URL in your .env file:
  // VITE_API_BASE_URL=https://us-central1-nevadotrektest01.cloudfunctions.net

  const BASE_API_URL = import.meta.env.VITE_API_BASE_URL || 'https://us-central1-nevadotrektest01.cloudfunctions.net';

  const makeAdminRequest = async (endpoint, method = 'GET', data = null) => {
    const headers = {
      'X-Admin-Secret-Key': import.meta.env.VITE_ADMIN_SECRET_KEY || process.env.REACT_APP_ADMIN_SECRET_KEY || ADMIN_SECRET_KEY,
      'Content-Type': 'application/json'
    };

    const config = {
      method,
      headers
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(`${BASE_API_URL}${endpoint}`, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Admin API Error:', error);
      throw error;
    }
  };
  ```

  ## Rate Limiting

  Admin endpoints have special rate limiting considerations:
  - No rate limiting applied to admin endpoints (only to customer-facing endpoints)
  - Admin functions can perform multiple operations during administrative tasks

  ## System Constants

  ### Server Configuration Constants
  ```javascript
  CONSTANTS = {
    // Authentication system uses Firebase Parameters
    ADMIN_SECRET_KEY: "Parameter stored securely in Firebase Functions parameters",
    
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
      RATE_LIMIT_SECONDS: 300,      // 5 minutes between requests per IP
      MAX_BOOKINGS_PER_HOUR: 3,     // Maximum 3 bookings per hour per IP
      MAX_BOOKINGS_PER_DAY: 5       // Maximum 5 bookings per day per IP
    },
    
    BOOKING_REFERENCE_PREFIX: "BK-"
  }
  ```

  ### Business Logic Constants
  - **Event Types**: Events can be `private` (created by individual bookings) or `public` (joinable by multiple customers)
  - **Booking Statuses**: `pending` → `confirmed` → `paid` → `cancelled` with specific transition rules
  - **Booking References**: Format `BK-YYYYMMDD-XXX` for unique identification
  - **Capacity Management**: Real-time tracking of booked slots vs max capacity

  ## Database Schema

  ### Collections Structure

  #### 1. tours
  ```json
  {
    "tourId": "string (auto-generated Firestore document ID)",
    "name": {
      "es": "string (bilingual name)",
      "en": "string (bilingual name)"
    },
    "description": {
      "es": "string (bilingual description)", 
      "en": "string (bilingual description)"
    },
    "price": {
      "amount": "number",
      "currency": "string"
    },
    "pricingTiers": [
      {
        "paxFrom": "number (minimum pax for this tier)",
        "paxTo": "number (maximum pax for this tier)",
        "pricePerPerson": {
          "COP": "number (price in Colombian Pesos)",
          "USD": "number (price in US Dollars)"
        }
      }
    ],
    "maxParticipants": "number (maximum participants per event)",
    "duration": "string (tour duration)",
    "isActive": "boolean (logical delete flag)",
    "createdAt": "timestamp (Firestore server timestamp)",
    "updatedAt": "timestamp (Firestore server timestamp)",
    "images": ["string (array of image URLs)"],
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
    "eventId": "string (auto-generated Firestore document ID)",
    "tourId": "string (reference to tours collection)",
    "tourName": "string (denormalized for query optimization)",
    "startDate": "timestamp (Firestore server timestamp)",
    "endDate": "timestamp (Firestore server timestamp)", 
    "maxCapacity": "number (maximum participants for this event)",
    "bookedSlots": "number (number of participants currently booked)",
    "type": "enum ('private', 'public') (visibility for joining)",
    "status": "enum ('active', 'full', 'completed', 'cancelled') (event lifecycle)",
    "totalBookings": "number (count of bookings on this event)",
    "createdAt": "timestamp (Firestore server timestamp)",
    "updatedAt": "timestamp (Firestore server timestamp)",
    "notes": "string (optional admin notes)",
    "auditTrail": [
      {
        "timestamp": "timestamp (Firestore server timestamp)",
        "adminUser": "string (admin identifier)",
        "action": "string (description of action)",
        "previousValue": "any (previous value before change)",
        "newValue": "any (new value after change)",
        "reason": "string (reason for change)"
      }
    ]
  }
  ```

  #### 3. bookings
  ```json
  {
    "bookingId": "string (auto-generated Firestore document ID)",
    "eventId": "string (reference to tourEvents collection)",
    "tourId": "string (reference to tours collection)",
    "tourName": "string (denormalized for query optimization)",
    "customer": {
      "fullName": "string (customer name)",
      "documentId": "string (ID document number)", 
      "phone": "string (customer phone number)",
      "email": "string (customer email)",
      "notes": "string (customer-specific notes)"
    },
    "pax": "number (number of participants)",
    "pricePerPerson": "number (price per person for this booking)",
    "totalPrice": "number (total price for the booking)",
    "bookingDate": "timestamp (when the booking was made)",
    "startDate": "timestamp (start date for the tour, synchronized with event)",
    "status": "enum ('pending', 'confirmed', 'paid', 'cancelled', 'cancelled_by_admin', 'changed_tour', 'rebooked', 'hold', 'refund_pending', 'refund_completed')",
    "statusHistory": [
      {
        "timestamp": "string (ISO date) - client timestamp for arrays",
        "status": "string (status at this point in time)",
        "note": "string (description of the status change)",
        "adminUser": "string (admin who made the change)",
        "reason": "string (reason for the status change)"
      }
    ],
    "isEventOrigin": "boolean (whether this booking created the event)",
    "ipAddress": "string (IP address of the booking request)",
    "bookingReference": "string (BK-YYYYMMDD-XXX format)",
    "previousStates": [
      {
        "action": "string (type of action)",
        "timestamp": "timestamp (when the action occurred)",
        "fromEventId": "string (previous event ID after change)",
        "toEventId": "string (new event ID after change)",
        "fromTourId": "string (previous tour ID)",
        "toTourId": "string (new tour ID)",
        "adminUser": "string (admin who made the change)",
        "reason": "string (reason for the change)"
      }
    ],
    "transferInfo": {
      "originalBookingId": "string (for cross-tour transfers)",
      "originalTourId": "string (for cross-tour transfers)",
      "transferDate": "timestamp (when transfer occurred)",
      "reason": "string (reason for transfer)"
    },
    "createdAt": "timestamp (Firestore server timestamp)",
    "updatedAt": "timestamp (Firestore server timestamp)"
  }
  ```

  #### 4. rateLimiter
  ```json
  {
    "ip": "string (IP address being rate limited)",
    "lastBookingTimestamp": "timestamp (when the last booking was made)",
    "bookingsThisHour": "number (count of bookings in the current hour)",
    "bookingsThisDay": "number (count of bookings in the current day)",
    "updatedAt": "timestamp (Firestore server timestamp)"
  }
  ```

  ## API Endpoints

  ### Public Tour Endpoints

  #### 1. GET /getToursV2
  - **URL**: https://gettoursv2-wgfhwjbpva-uc.a.run.app
  - **Method**: GET
  - **Description**: List all active tours with complete bilingual information
  - **Authentication**: None required
  - **Response**: `200 OK` with array of active tours or `200 OK` with empty array
  - **Rate Limiting**: None
  - **Caching**: Response may be cached by CDN
  - **Database Operations**: Single query to tours collection with active filter
  - **Business Logic**: Retrieves only tours where `isActive: true`

  **Response Format**:
  ```json
  [
    {
      "tourId": "string",
      "name": { "es": "Tour Name ES", "en": "Tour Name EN" },
      "isActive": true,
      "...": "other tour fields"
    }
  ]
  ```

  #### 2. GET /getTourByIdV2/:tourId
  - **URL**: https://gettourbyidv2-wgfhwjbpva-uc.a.run.app/{tourId}
  - **Method**: GET  
  - **Description**: Get specific tour by ID with complete details
  - **Authentication**: None required
  - **Parameters**: `tourId` in URL path
  - **Response**: `200 OK` with tour data or `404 Not Found`
  - **Rate Limiting**: None
  - **Database Operations**: Single document read from tours collection
  - **Business Logic**: Returns only active tours (`isActive: true`)

  **Example Request**:
  ```bash
  curl https://gettourbyidv2-wgfhwjbpva-uc.a.run.app/ABC123
  ```

  ### Public Booking Endpoints (Phase 2A)

  #### 3. POST /createBooking
  - **URL**: https://createbooking-wgfhwjbpva-uc.a.run.app
  - **Method**: POST
  - **Description**: Create new reservation with rate limiting
  - **Authentication**: Rate limited by IP (no login required)
  - **Headers**: `Content-Type: application/json`
  - **Rate Limiting**: Applied (5 min between requests, 3/hour, 5/day per IP)
  - **Database Operations**: Multi-document transaction (tour read, event read/create, booking create, rate limiter update)
  - **Business Logic**: Creates private event if none exists for date, calculates pricing, validates capacity

  **Request Body**:
  ```json
  {
    "tourId": "string (required, must be active tour)",
    "startDate": "ISO date string (required, validates format and future dates)",
    "customer": {
      "fullName": "string (required)",
      "documentId": "string (required)", 
      "phone": "string (required)",
      "email": "string (required)",
      "notes": "string (optional)"
    },
    "pax": "number (required, positive)",
    "createNewEvent": "boolean (optional, create new event even if one exists for same date and tour)"
  }
  ```

  **Response**: 
  - `201 Created` with booking details
  - `400 Bad Request` for invalid data
  - `403 Forbidden` for rate limiting
  - `404 Not Found` for invalid tour
  - `422 Unprocessable Entity` for capacity issues

  **Example Request**:
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

  **Response Format**:
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
  - **Description**: Join existing public event with rate limiting
  - **Authentication**: Rate limited by IP (no login required)
  - **Headers**: `Content-Type: application/json`
  - **Rate Limiting**: Applied (5 min between requests, 3/hour, 5/day per IP)
  - **Database Operations**: Multi-document transaction (event read, booking create, capacity update, rate limiter update)
  - **Business Logic**: Only joins events with `type: 'public'`, validates capacity

  **Request Body**:
  ```json
  {
    "eventId": "string (required, must be public event)",
    "customer": {
      "fullName": "string (required)",
      "documentId": "string (required)",
      "phone": "string (required)", 
      "email": "string (required)",
      "notes": "string (optional)"
    },
    "pax": "number (required, positive)"
  }
  ```

  **Response**:
  - `201 Created` with booking details
  - `400 Bad Request` for invalid data
  - `403 Forbidden` for rate limiting
  - `404 Not Found` for invalid/non-public event
  - `422 Unprocessable Entity` for capacity issues

  #### 5. GET /checkBooking
  - **URL**: https://checkbooking-wgfhwjbpva-uc.a.run.app
  - **Method**: GET
  - **Description**: Verify booking status by reference with additional security
  - **Authentication**: Validated by reference + email combination
  - **Parameters**: 
    - `reference` (required) - booking reference code
    - `email` (optional) - additional verification (recommended)
  - **Rate Limiting**: None
  - **Database Operations**: Single query to bookings collection with reference filter
  - **Business Logic**: Optionally validates email matches the booking to prevent unauthorized access

  **Response**:
  - `200 OK` with booking details
  - `404 Not Found` for invalid reference/email combination

  **Example Request**:
  ```bash
  curl "https://checkbooking-wgfhwjbpva-uc.a.run.app?reference=BK-20251008-123&email=test@example.com"
  ```

  **Response Format**:
  ```json
  {
    "bookingId": "string",
    "eventId": "string",
    "tourId": "string",
    "tourName": "string",
    "customer": {
      "fullName": "string"
    },
    "pax": "number",
    "status": "string",
    "bookingDate": "timestamp",
    "startDate": "timestamp (synchronized with associated event)",
    "pricePerPerson": "number",
    "totalPrice": "number",
    "bookingReference": "string",
    "isEventOrigin": "boolean"
  }
  ```

  ### Tour Management

  #### 6. POST /adminCreateTourV2

  **Purpose**: Retrieve all active tours.

  **Headers Required**: 
  - `X-Admin-Secret-Key` (optional for public access)

  **Parameters**: None

  **Response**:
  ```json
  [
    {
      "tourId": "string",
      "name": {
        "es": "string",
        "en": "string"
      },
      "description": {
        "es": "string",
        "en": "string"
      },
      "duration": "string",
      "maxParticipants": "number",
      "isActive": "boolean",
      "pricingTiers": [
        {
          "paxFrom": "number",
          "paxTo": "number",
          "pricePerPerson": {
            "COP": "number",
            "USD": "number"
          }
        }
      ],
      "includes": {
        "es": ["string"],
        "en": ["string"]
      },
      "createdAt": "timestamp",
      "updatedAt": "timestamp"
    }
  ]
  ```

  #### 2. GET /getTourByIdV2/{tourId}

  **Purpose**: Retrieve a specific tour by ID.

  **Headers Required**: 
  - `X-Admin-Secret-Key` (optional for public access)

  **URL Parameters**: 
  - `tourId`: The ID of the tour to retrieve

  **Response**:
  ```json
  {
    "tourId": "string",
    "name": {
      "es": "string", 
      "en": "string"
    },
    // ... same as getToursV2 response
  }
  ```

  #### 6. POST /adminCreateTourV2
  - **URL**: https://us-central1-nevadotrektest01.cloudfunctions.net/adminCreateTourV2
  - **Method**: POST
  - **Description**: Create a new tour with complete bilingual information
  - **Authentication**: `X-Admin-Secret-Key` header required
  - **Headers**: 
    - `Content-Type: application/json`
    - `X-Admin-Secret-Key: [YOUR_SECURE_ADMIN_KEY]`
  - **Rate Limiting**: None (admin endpoint)
  - **Database Operations**: Single document creation in tours collection
  - **Business Logic**: Sets `isActive: true` by default if not specified, adds timestamps

  **Request Body**:
  ```json
  {
    "name": {
      "es": "string (required, Spanish name)",
      "en": "string (required, English name)"
    },
    "description": {
      "es": "string (required, Spanish description)",
      "en": "string (required, English description)"  
    },
    "duration": "string (required, e.g., '4 Days')",
    "maxParticipants": "number (required, maximum capacity per event)",
    "isActive": "boolean (optional, defaults to true)",
    "pricingTiers": [
      {
        "paxFrom": "number (required, minimum participants for tier)",
        "paxTo": "number (required, maximum participants for tier)",
        "pricePerPerson": {
          "COP": "number (price in Colombian Pesos)",
          "USD": "number (price in US Dollars)"
        }
      }
    ],
    "includes": {
      "es": ["string (array of Spanish inclusions)"],
      "en": ["string (array of English inclusions)"]
    }
  }
  ```

  **Response**:
  ```json
  {
    "success": true,
    "tourId": "string (auto-generated Firestore document ID)",
    "message": "Tour created successfully"
  }
  ```

  **Example Request**:
  ```bash
  curl -X POST "https://us-central1-nevadotrektest01.cloudfunctions.net/adminCreateTourV2" \
    -H "X-Admin-Secret-Key: [YOUR_SECURE_ADMIN_KEY]" \
    -H "Content-Type: application/json" \
    -d '{
      "name": {
        "es": "Nueva Aventura",
        "en": "New Adventure"
      },
      "description": {
        "es": "Descripción en español",
        "en": "Description in English"
      },
      "duration": "3 Days",
      "maxParticipants": 10,
      "pricingTiers": [
        {
          "paxFrom": 1,
          "paxTo": 4,
          "pricePerPerson": {
            "COP": 1500000,
            "USD": 350
          }
        }
      ]
    }'
  ```

  #### 7. PUT /adminUpdateTourV2/{tourId}
  - **URL**: https://us-central1-nevadotrektest01.cloudfunctions.net/adminUpdateTourV2/{tourId}
  - **Method**: PUT
  - **Description**: Update an existing tour with partial or complete data
  - **Authentication**: `X-Admin-Secret-Key` header required
  - **URL Parameters**: 
    - `tourId`: The ID of the tour to update
  - **Rate Limiting**: None (admin endpoint)
  - **Database Operations**: Single document update in tours collection
  - **Business Logic**: Updates only specified fields, maintains existing values for unspecified fields, adds updatedAt timestamp

  **Request Body**: Partial or complete tour data to update
  ```json
  {
    "name": {
      "es": "string (optional, Spanish name)",
      "en": "string (optional, English name)"
    },
    "description": {
      "es": "string (optional, Spanish description)",
      "en": "string (optional, English description)"  
    },
    "duration": "string (optional, e.g., '4 Days')",
    "maxParticipants": "number (optional, maximum capacity per event)",
    "isActive": "boolean (optional)",
    "pricingTiers": [
      {
        "paxFrom": "number (optional, minimum participants for tier)",
        "paxTo": "number (optional, maximum participants for tier)",
        "pricePerPerson": {
          "COP": "number (price in Colombian Pesos)",
          "USD": "number (price in US Dollars)"
        }
      }
    ],
    "includes": {
      "es": ["string (optional, array of Spanish inclusions)"],
      "en": ["string (optional, array of English inclusions)"]
    }
  }
  ```

  **Response**:
  ```json
  {
    "success": true,
    "tourId": "string (auto-generated Firestore document ID)", 
    "message": "Tour updated successfully"
  }
  ```

  #### 8. DELETE /adminDeleteTourV2/{tourId}
  - **URL**: https://us-central1-nevadotrektest01.cloudfunctions.net/adminDeleteTourV2/{tourId}
  - **Method**: DELETE
  - **Description**: Logically delete a tour (sets isActive to false, preserving data for audit)
  - **Authentication**: `X-Admin-Secret-Key` header required
  - **URL Parameters**: 
    - `tourId`: The ID of the tour to delete
  - **Rate Limiting**: None (admin endpoint)
  - **Database Operations**: Single document update in tours collection (sets isActive to false)
  - **Business Logic**: Performs logical delete rather than physical deletion, maintains data for audit trails, events and bookings remain associated with the tour

  **Response**:
  ```json
  {
    "success": true,
    "tourId": "string (auto-generated Firestore document ID)",
    "message": "Tour deleted successfully (marked as inactive)"
  }
  ```

  ### Booking Management

  #### 9. POST /adminCreateBooking
  - **URL**: https://us-central1-nevadotrektest01.cloudfunctions.net/adminCreateBooking
  - **Method**: POST
  - **Description**: Create a new booking as an admin (without rate limiting)
  - **Authentication**: `X-Admin-Secret-Key` header required
  - **Headers**: 
    - `Content-Type: application/json`
    - `X-Admin-Secret-Key: [YOUR_SECURE_ADMIN_KEY]`
  - **Rate Limiting**: None (admin endpoint)
  - **Database Operations**: Multi-document transaction (tour read, event read/create, booking create)
  - **Business Logic**: Creates booking without rate limiting, calculates pricing based on tour tiers, creates private event if none exists for date

  **Request Body**:
  ```json
  {
    "tourId": "string (required, must be active tour)",
    "startDate": "string (required, ISO date string, validates format and future dates)", // ISO date string (YYYY-MM-DD or ISO format)
    "customer": {
      "fullName": "string (required)",
      "documentId": "string (required)", 
      "phone": "string (required)",
      "email": "string (required)",
      "notes": "string (optional)"
    },
    "pax": "number (required, positive)",
    "status": "string (optional, default: pending, values: pending|confirmed|paid|cancelled|cancelled_by_admin)",
    "createNewEvent": "boolean (optional, create new event even if one exists for same date and tour)"
  }
  ```

  **Response**:
  ```json
  {
    "success": true,
    "bookingId": "string (auto-generated Firestore document ID)",
    "bookingReference": "string (format: BK-YYYYMMDD-XXX)",
    "status": "string (booking status)",
    "message": "Reserva creada exitosamente por administrador."
  }
  ```

  #### 10. GET /adminGetBookings

  **Purpose**: Retrieve all bookings with filtering capabilities.

  **Headers Required**: 
  - `X-Admin-Secret-Key`

  **Query Parameters**:
  - `status`: Filter by booking status
  - `tourId`: Filter by tour ID
  - `startDateFrom`: Filter by start date from
  - `startDateTo`: Filter by start date to
  - `customerName`: Filter by customer name
  - `limit`: Number of results per page (max 200)
  - `offset`: Pagination offset

  **Response**:
  ```json
  {
    "bookings": [
      {
        "bookingId": "string",
        "eventId": "string",
        "tourId": "string",
        "tourName": "string",
        "customer": {
          "fullName": "string",
          "documentId": "string",
          "phone": "string",
          "email": "string"
        },
        "pax": "number",
        "pricePerPerson": "number",
        "totalPrice": "number",
        "bookingDate": "timestamp",
        "status": "string",
        "bookingReference": "string",
        "isEventOrigin": "boolean",
        "statusHistory": [
          {
            "timestamp": "string",
            "status": "string",
            "note": "string",
            "adminUser": "string"
          }
        ]
      }
    ],
    "count": "number",
    "pagination": {
      "limit": "number",
      "offset": "number", 
      "hasMore": "boolean"
    }
  }
  ```

  #### 7. PUT /adminUpdateBookingStatus/{bookingId}

  **Purpose**: Update the status of a booking.

  **Headers Required**: 
  - `X-Admin-Secret-Key`

  **URL Parameters**: 
  - `bookingId`: The ID of the booking to update

  **Request Body**:
  ```json
  {
    "status": "string", // Valid: pending, confirmed, paid, cancelled, cancelled_by_admin
    "reason": "string"  // Optional reason for the status change
  }
  ```

  **Response**:
  ```json
  {
    "success": true,
    "bookingId": "string",
    "message": "Estado de la reserva actualizado exitosamente",
    "previousStatus": "string",
    "newStatus": "string"
  }
  ```

  #### 12. PUT /adminUpdateBookingDetails/{bookingId}
  - **URL**: https://us-central1-nevadotrektest01.cloudfunctions.net/adminUpdateBookingDetails/{bookingId}
  - **Method**: PUT
  - **Description**: Update booking details (customer info, pax, etc.) with advanced options including date changes and event creation
  - **Authentication**: `X-Admin-Secret-Key` header required
  - **URL Parameters**: 
    - `bookingId`: The ID of the booking to update
  - **Rate Limiting**: None (admin endpoint)
  - **Database Operations**: Multi-document transaction (booking update, potential event read/create/update, capacity adjustments)
  - **Business Logic**: When updating the startDate, finds or creates an appropriate event for the new date and moves the booking to the new event, adjusts capacity automatically, tracks event transitions in booking history

  **Request Body**:
  ```json
  {
    "customer": {
      "fullName": "string (optional, customer name)",
      "documentId": "string (optional, document ID)", 
      "phone": "string (optional, phone number)",
      "email": "string (optional, email address)",
      "notes": "string (optional, customer notes)"
    },
    "tourId": "string (optional, tour identifier)",
    "tourName": "string (optional, tour name)",
    "startDate": "ISO date string (optional, new start date)",
    "pax": "number (optional, number of participants)",
    "price": "number (optional, price per person)",
    "createNewEvent": "boolean (optional, if true creates new event even if one exists for same date and tour)",
    "reason": "string (optional, reason for the change)"
  }
  ```

  **Important Behavior**: When updating the `startDate`, the system:
  - Finds or creates an appropriate event for the new date and same tour
  - Moves the booking to the new event (changing the booking's eventId)
  - Reduces capacity on the original event by the booking's pax count
  - Increases capacity on the new event by the booking's pax count
  - Tracks this transition in the booking's `previousStates` field

  **Multiple Events Per Date Support**: The `createNewEvent` parameter allows creating separate events even when one already exists for the same date:
  ```json
  {
    "startDate": "2025-12-25T00:00:00.000Z",
    "createNewEvent": true,
    "reason": "Creating separate private group for this booking"
  }
  ```

  **Response**:
  ```json
  {
    "success": true,
    "bookingId": "string (auto-generated Firestore document ID)",
    "message": "Detalles de la reserva actualizados exitosamente",
    "booking": {
      "bookingId": "string",
      "eventId": "string",
      "tourId": "string", 
      "tourName": "string",
      "startDate": "timestamp (synchronized with event)",
      "customer": {
        "fullName": "string",
        "documentId": "string",
        "phone": "string", 
        "email": "string"
      },
      "pax": "number",
      "pricePerPerson": "number",
      "totalPrice": "number",
      "status": "string",
      "bookingReference": "string",
      "statusHistory": ["..."],
      "previousStates": [
        {
          "action": "date_change",
          "timestamp": "timestamp",
          "fromEventId": "string (original event ID)",
          "toEventId": "string (new event ID)",
          "fromTourId": "string",
          "toTourId": "string",
          "adminUser": "string",
          "reason": "string"
        }
      ]
    }
  }
  ```

  **Example Request**:
  ```bash
  curl -X PUT "https://us-central1-nevadotrektest01.cloudfunctions.net/adminUpdateBookingDetails/qcWIadNTt0PcinNTjGxu" \
    -H "X-Admin-Secret-Key: [YOUR_SECURE_ADMIN_KEY]" \
    -H "Content-Type: application/json" \
    -d '{
      "customer": {
        "fullName": "Updated Test Customer",
        "email": "updated@example.com"
      },
      "startDate": "2025-12-20T00:00:00.000Z",
      "pax": 4,
      "reason": "Customer requested date and participant change"
    }'
  ````

  #### 13. POST /adminTransferBooking/{bookingId}
  - **URL**: https://us-central1-nevadotrektest01.cloudfunctions.net/adminTransferBooking/{bookingId}
  - **Method**: POST
  - **Description**: Transfer a booking to a different event within the same tour with advanced options including new event creation
  - **Authentication**: `X-Admin-Secret-Key` header required
  - **URL Parameters**: 
    - `bookingId`: The ID of the booking to transfer
  - **Rate Limiting**: None (admin endpoint)
  - **Database Operations**: Multi-document transaction (booking update, event capacity updates)
  - **Business Logic**: Updates capacity on both source and destination events, maintains audit trail, validates destination event compatibility

  **Request Body**:
  ```json
  {
    "destinationEventId": "string (required unless createNewEvent is true)",
    "createNewEvent": "boolean (optional, if true creates new event with booking parameters)",
    "newStartDate": "ISO date string (optional, used when createNewEvent is true, defaults to original event date)",
    "newMaxCapacity": "number (optional, used when createNewEvent is true, defaults to tour's max capacity or 8)",
    "newEventType": "private|public (optional, used when createNewEvent is true, defaults to 'private')",
    "reason": "string (optional, reason for the transfer)"
  }
  ```

  **Important Features**:
  - **New Event Creation**: When `createNewEvent` is `true`, creates a new separate event for the same tour instead of using an existing event
  - **Flexible Destination**: Can either specify a `destinationEventId` or let the system create a new event with `createNewEvent: true`
  - **Custom Event Properties**: When creating new events, can specify capacity and type

  **Example 1 - Transfer to existing event**:
  ```bash
  curl -X POST "https://us-central1-nevadotrektest01.cloudfunctions.net/adminTransferBooking/qcWIadNTt0PcinNTjGxu" \
    -H "X-Admin-Secret-Key: [YOUR_SECURE_ADMIN_KEY]" \
    -H "Content-Type: application/json" \
    -d '{
      "destinationEventId": "newEventId123",
      "reason": "Customer requested date change"
    }'
  ```

  **Example 2 - Create new event during transfer**:
  ```bash
  curl -X POST "https://us-central1-nevadotrektest01.cloudfunctions.net/adminTransferBooking/qcWIadNTt0PcinNTjGxu" \
    -H "X-Admin-Secret-Key: [YOUR_SECURE_ADMIN_KEY]" \
    -H "Content-Type: application/json" \
    -d '{
      "createNewEvent": true,
      "newStartDate": "2025-12-25T00:00:00.000Z", 
      "newMaxCapacity": 6,
      "newEventType": "private",
      "reason": "Moving to new private group"
    }'
  ```

  **Response**:
  ```json
  {
    "success": true,
    "bookingId": "string (auto-generated Firestore document ID)",
    "message": "Reserva transferida exitosamente",
    "previousEventId": "string (original event ID)",
    "newEventId": "string (new event ID after transfer)",
    "pax": "number (number of participants transferred)",
    "reason": "string (transfer reason if provided)"
  }
  ````

  #### 14. POST /adminTransferToNewTour/{bookingId}
  - **URL**: https://us-central1-nevadotrektest01.cloudfunctions.net/adminTransferToNewTour/{bookingId}
  - **Method**: POST
  - **Description**: Transfer a booking to a different tour (with optional new date) - complete cross-tour transfer functionality
  - **Authentication**: `X-Admin-Secret-Key` header required
  - **URL Parameters**: 
    - `bookingId`: The ID of the booking to transfer
  - **Rate Limiting**: None (admin endpoint)
  - **Database Operations**: Multi-document transaction (original booking update, new event read/create, new booking creation, capacity adjustments)
  - **Business Logic**: Creates new booking on destination tour with same customer details, cancels original booking, adjusts capacity, calculates pricing based on destination tour

  **Request Body**:
  ```json
  {
    "newTourId": "string (required, destination tour ID)",
    "newStartDate": "string (optional, new start date in ISO format, defaults to original date)",
    "reason": "string (optional, reason for the transfer)"
  }
  ```

  **Detailed Behavior**:
  - Creates a new event on the destination tour if one doesn't already exist for the target date
  - Creates a new booking on the destination tour with the same customer details
  - Cancels the original booking with a reference to the new booking in the status history
  - Adjusts capacity on both the original and destination events
  - Uses pricing from the destination tour for the new booking
  - Maintains the same booking status as the original booking
  - Creates a complete audit trail of the transfer operation

  **Example**:
  ```bash
  curl -X POST "https://us-central1-nevadotrektest01.cloudfunctions.net/adminTransferToNewTour/qcWIadNTt0PcinNTjGxu" \
    -H "X-Admin-Secret-Key: [YOUR_SECURE_ADMIN_KEY]" \
    -H "Content-Type: application/json" \
    -d '{
      "newTourId": "newTourId123",
      "newStartDate": "2025-12-25T00:00:00.000Z",
      "reason": "Customer requested to switch tours"
    }'
  ```

  **Response**:
  ```json
  {
    "success": true,
    "message": "Reserva transferida exitosamente a nuevo tour",
    "originalBookingId": "string (ID of original booking that was cancelled)",
    "newBookingId": "string (ID of new booking created on destination tour)",
    "newBookingReference": "string (new reference code for new booking)",
    "cancelledBookingStatus": "string (status under which original booking was cancelled)",
    "pax": "number (number of participants transferred)",
    "reason": "string (transfer reason if provided)"
  }
  ```

  **Important Notes**:
  - The destination tour must exist and be active
  - The destination event must have sufficient capacity for the booking's pax count
  - If no newStartDate is provided, the original booking's event date is used
  - The original booking is cancelled with status "cancelled_by_admin"
  - A new booking is created on the destination tour with the same customer details
  - The new booking receives a new reference code
  - Both events (original and destination) have their capacity adjusted accordingly
  - The new booking uses pricing from the destination tour
  - All operations happen within a Firestore transaction to ensure data consistency`

  ### Event Management

  #### 15. GET /adminGetEventsCalendar
  - **URL**: https://us-central1-nevadotrektest01.cloudfunctions.net/adminGetEventsCalendar
  - **Method**: GET
  - **Description**: Retrieve all events with filtering capabilities for calendar view
  - **Authentication**: `X-Admin-Secret-Key` header required
  - **Headers**: `X-Admin-Secret-Key: [YOUR_SECURE_ADMIN_KEY]`
  - **Rate Limiting**: None (admin endpoint)
  - **Database Operations**: Query with optional filters and pagination
  - **Business Logic**: Retrieves events with denormalized tour information, applies filters based on query parameters, handles pagination

  **Query Parameters**:
  - `tourId`: Filter by tour ID
  - `startDateFrom`: Filter by start date from (ISO date string)
  - `startDateTo`: Filter by start date to (ISO date string)
  - `type`: Filter by event type ('private' or 'public')
  - `status`: Filter by event status ('active', 'full', 'completed', 'cancelled')
  - `limit`: Number of results per page (default: 50, max: 200)
  - `offset`: Number of results to skip (for pagination)

  **Response**:
  ```json
  {
    "events": [
      {
        "eventId": "string (Firestore document ID)",
        "tourId": "string (reference to tour)",
        "tourName": "string (denormalized for query optimization)",
        "startDate": "string (ISO date string)", // ISO date string
        "endDate": "string (ISO date string)", // ISO date string
        "maxCapacity": "number (maximum participants)",
        "bookedSlots": "number (current number of participants)",
        "type": "string ('private' or 'public')", // private/public
        "status": "string (active, full, completed, cancelled)",
        "totalBookings": "number (total number of bookings on this event)",
        "createdAt": "string (ISO date string)", // ISO date string
        "updatedAt": "string (ISO date string)" // ISO date string
      }
    ],
    "count": "number (total events returned)",
    "pagination": {
      "limit": "number",
      "offset": "number",
      "hasMore": "boolean"
    }
  }
  ```

  **Example Request**:
  ```bash
  curl -H "X-Admin-Secret-Key: [YOUR_SECURE_ADMIN_KEY]" \
    "https://us-central1-nevadotrektest01.cloudfunctions.net/adminGetEventsCalendar?startDateFrom=2025-01-01&limit=20"
  ```

  #### 16. POST /adminPublishEvent/{eventId}
  - **URL**: https://us-central1-nevadotrektest01.cloudfunctions.net/adminPublishEvent/{eventId}
  - **Method**: POST
  - **Description**: Publish or unpublish an event (toggle between public and private)
  - **Authentication**: `X-Admin-Secret-Key` header required
  - **URL Parameters**: 
    - `eventId`: The ID of the event to publish/unpublish
  - **Rate Limiting**: None (admin endpoint)
  - **Database Operations**: Single document update in tourEvents collection
  - **Business Logic**: Changes event `type` field between 'private' and 'public', maintains audit trail

  **Request Body**:
  ```json
  {
    "action": "publish | unpublish | private" // Optional, defaults to "publish"
  }
  ```

  **Response**:
  ```json
  {
    "success": true,
    "eventId": "string (auto-generated Firestore document ID)",
    "message": "Evento actualizado exitosamente a {type}",
    "previousType": "string ('private' or 'public')",
    "newType": "string ('private' or 'public')"
  }
  ```

  **Example Request**:
  ```bash
  curl -X POST -H "X-Admin-Secret-Key: [YOUR_SECURE_ADMIN_KEY]" \
    -H "Content-Type: application/json" \
    -d '{"action":"publish"}' \
    "https://us-central1-nevadotrektest01.cloudfunctions.net/adminPublishEvent/abc123"
  ```

  #### 17. POST /adminCreateEvent
  - **URL**: https://us-central1-nevadotrektest01.cloudfunctions.net/adminCreateEvent
  - **Method**: POST
  - **Description**: Create a new event independently of any booking (for advance planning)
  - **Authentication**: `X-Admin-Secret-Key` header required
  - **Headers**: 
    - `X-Admin-Secret-Key: [YOUR_SECURE_ADMIN_KEY]`
    - `Content-Type: application/json`
  - **Rate Limiting**: None (admin endpoint)
  - **Database Operations**: Single document creation in tourEvents collection
  - **Business Logic**: Creates event with specified parameters, initializes capacity tracking

  **Request Body**:
  ```json
  {
    "tourId": "string (required, reference to tour)",
    "startDate": "ISO date string (required, start date for event)",
    "endDate": "ISO date string (optional, defaults to 3 days after start)",
    "maxCapacity": "number (optional, defaults to tour's max capacity or 8)",
    "type": "string (optional, enum: 'private' | 'public', defaults to 'private')",
    "status": "string (optional, enum: 'active' | 'inactive' | 'completed' | 'cancelled', defaults to 'active')",
    "notes": "string (optional, admin notes about the event)"
  }
  ```

  **Response**:
  ```json
  {
    "success": true,
    "eventId": "string (auto-generated Firestore document ID)",
    "message": "Evento creado exitosamente",
    "event": {
      "eventId": "string",
      "tourId": "string",
      "tourName": "string",
      "startDate": "timestamp",
      "endDate": "timestamp", 
      "maxCapacity": "number",
      "bookedSlots": "number",
      "type": "string",
      "status": "string",
      "totalBookings": "number",
      "createdAt": "timestamp",
      "updatedAt": "timestamp"
    }
  }
  ```

  **Example Request**:
  ```bash
  curl -X POST "https://us-central1-nevadotrektest01.cloudfunctions.net/adminCreateEvent" \
    -H "X-Admin-Secret-Key: [YOUR_SECURE_ADMIN_KEY]" \
    -H "Content-Type: application/json" \
    -d '{
      "tourId": "tourId123",
      "startDate": "2025-12-25T00:00:00.000Z",
      "maxCapacity": 6,
      "type": "private",
      "notes": "Special private group"
    }'
  ```

  #### 18. POST /adminSplitEvent/{eventId}
  - **URL**: https://us-central1-nevadotrektest01.cloudfunctions.net/adminSplitEvent/{eventId}
  - **Method**: POST
  - **Description**: Split a single event into multiple events by moving selected bookings to a new event
  - **Authentication**: `X-Admin-Secret-Key` header required
  - **URL Parameters**: 
    - `eventId`: The ID of the event to split
  - **Rate Limiting**: None (admin endpoint)
  - **Database Operations**: Multi-document transaction (booking updates, new event creation, capacity adjustments)
  - **Business Logic**: Creates new event with selected bookings, updates all affected bookings and events, adjusts capacities

  **Request Body**:
  ```json
  {
    "bookingIds": "array of booking IDs to move to new event (required)",
    "newEventMaxCapacity": "number (optional, defaults to original capacity)",
    "newEventType": "private|public (optional, defaults to original type)",
    "reason": "string (optional, reason for the split)"
  }
  ```

  **Response**:
  ```json
  {
    "success": true,
    "message": "Evento dividido exitosamente",
    "sourceEventId": "string (original event that was split)",
    "newEventId": "string (new event created with moved bookings)",
    "movedBookingsCount": "number (count of bookings moved)",
    "movedPaxCount": "number (total pax count of moved bookings)",
    "bookingIds": "array of booking IDs that were moved",
    "reason": "string (reason if provided)"
  }
  ```

  **Example Request**:
  ```bash
  curl -X POST "https://us-central1-nevadotrektest01.cloudfunctions.net/adminSplitEvent/eventId123" \
    -H "X-Admin-Secret-Key: [YOUR_SECURE_ADMIN_KEY]" \
    -H "Content-Type: application/json" \
    -d '{
      "bookingIds": ["bookingId456", "bookingId789"],
      "newEventMaxCapacity": 4,
      "newEventType": "private",
      "reason": "Separating into smaller groups for better experience"
    }'
  ```

  #### 19. GET /adminGetEventsByDate/{tourId}/{date}
  - **URL**: https://us-central1-nevadotrektest01.cloudfunctions.net/adminGetEventsByDate/{tourId}/{date}
  - **Method**: GET
  - **Description**: Get all events for a specific tour on a specific date (for managing multiple events per date)
  - **Authentication**: `X-Admin-Secret-Key` header required
  - **URL Parameters**: 
    - `tourId`: The ID of the tour
    - `date`: The date in YYYY-MM-DD format
  - **Rate Limiting**: None (admin endpoint)
  - **Database Operations**: Query with date range and tour filter
  - **Business Logic**: Retrieves all events matching the tour and date, useful for managing multiple events per date

  **Response**:
  ```json
  {
    "events": [
      {
        "eventId": "string",
        "tourId": "string",
        "tourName": "string", 
        "startDate": "timestamp",
        "endDate": "timestamp",
        "maxCapacity": "number",
        "bookedSlots": "number",
        "type": "string",
        "status": "string",
        "totalBookings": "number",
        "createdAt": "timestamp",
        "updatedAt": "timestamp"
      }
    ],
    "count": "number (total events found)",
    "tourId": "string",
    "date": "string (date in YYYY-MM-DD format)",
    "message": "string (description of results)"
  }
  ```

  **Example Request**:
  ```bash
  curl -H "X-Admin-Secret-Key: [YOUR_SECURE_ADMIN_KEY]" \
    "https://us-central1-nevadotrektest01.cloudfunctions.net/adminGetEventsByDate/tourId123/2025-12-25"
  ````

  ## Data Flow Examples

  ### 1. Complete Tour Transfer Flow

  When a booking is transferred from one tour to another (using `adminTransferToNewTour`):

  1. **Original Booking**: ID `123` on "Tour A" with 2 pax
  2. **Transfer Request**: Use `adminTransferToNewTour` with new tour ID
  3. **System Actions**:
    - Validates destination tour exists and is active
    - Finds or creates an event for the destination tour on the specified date
    - Creates a new booking on the destination tour with the same customer details
    - Cancels the original booking with a reference to the new booking in status history
    - Calculates new pricing based on destination tour's pricing tiers
    - Adjusts capacity: reduces capacity on original event by 2, increases on new event by 2
    - Creates complete audit trail of the transfer operation
  4. **Result**: New booking ID `456` on "Tour B" with new reference code, original booking cancelled

  ### 2. Date Change Flow (Using adminUpdateBookingDetails)

  When a booking date changes via adminUpdateBookingDetails:

  1. **Original Booking**: ID `123` on "Tour A" for Nov 15 (Event X)
  2. **Update Request**: Use `adminUpdateBookingDetails` with new startDate
  3. **System Actions**:
    - Finds or creates an appropriate event for the new date on same tour
    - Updates booking to point to the new event (changing eventId)
    - Reduces capacity on original event (Event X) by booking's pax count
    - Increases capacity on new event (Event Y) by booking's pax count
    - Updates booking's startDate to match the new event date
    - Adds transition to booking's `previousStates` array
  4. **Result**: Booking ID `123` now associated with Event Y for Dec 20

  ### 3. Booking Status Update Flow

  When updating booking status:

  1. **Get Booking**: Retrieve booking to check current status
  2. **Validate Transition**: Ensure status change is allowed (e.g., can't change cancelled to confirmed)
  3. **Update Status**: Change status in booking document
  4. **Update Capacity**: If cancelling, increase event capacity appropriately
  5. **Add History**: Log status change in booking's statusHistory with timestamp, admin user, and reason
  6. **Response**: Return confirmation with previous and new status

  ### 4. Event Splitting Flow

  When splitting an event into multiple events using adminSplitEvent:

  1. **Source Event**: Event with 10 bookings across 12 pax total
  2. **Split Request**: Move bookings [A, B, C] with 5 pax to new event
  3. **System Actions**:
    - Creates new event with same tour, date, and custom parameters
    - Updates bookings A, B, C to point to new event
    - Updates capacity: reduces source event by 5 pax, new event starts with 5 pax
    - Updates booking status histories to reflect the move
    - Maintains audit trails for both events
  4. **Result**: Source event now has 7 bookings (7 pax), new event has 3 bookings (5 pax)

  ## Business Logic & Data Flow

  ### Tour-Event-Booking Relationship

  #### Core Relationship Structure
  The system follows a three-tier relationship model:
  - **Tours**: Master catalog items that define tour experiences (bilingual content, pricing, capacity)
  - **Events**: Specific instances of tours on specific dates with capacity tracking
  - **Bookings**: Individual customer reservations that link to specific events

  #### Event Creation Logic
  1. **Initial Booking**: When a customer books a new tour date, a private event is automatically created
  2. **Joining Events**: Customers can join existing public events (not private ones)
  3. **Capacity Management**: Events track both maxCapacity and bookedSlots in real-time
  4. **Event Types**: Private (created by initial booking) or Public (joinable by multiple customers)

  #### Booking-to-Event Mapping
  - Every booking is connected to exactly one event via eventId
  - Events can have multiple bookings (for group events)
  - When booking date changes, the booking is moved to a different event
  - Event date changes affect all bookings associated with that event

  ### Capacity Management

  #### Real-Time Capacity Tracking
  - **Capacity Calculation**: `maxCapacity - bookedSlots = availableCapacity`
  - **Concurrent Safety**: All capacity changes use Firestore transactions to prevent overbooking
  - **Automatic Adjustments**: Capacity updates automatically when bookings are created, modified, or cancelled

  #### Capacity Validation Points
  1. **Booking Creation**: Validates availability before creating booking
  2. **Pax Updates**: Adjusts capacity when number of participants changes
  3. **Event Transfers**: Updates capacity on both source and destination events
  4. **Booking Cancellations**: Increases capacity when bookings are cancelled

  #### Multiple Events Per Date Support
  - **Enhanced Logic**: System now supports multiple separate events for the same tour on the same date
  - **createNewEvent Parameter**: When set to `true`, creates new events even if one exists for the same date and tour
  - **Use Cases**: Private groups, special arrangements, capacity management flexibility

  ### Pricing & Date Handling

  #### Dynamic Pricing
  - **Tier-Based Calculation**: Pricing determined by number of participants using tour's pricingTiers
  - **Currency Support**: Prices stored in both COP (Colombian Pesos) and USD (US Dollars)
  - **Cross-Tour Transfers**: New bookings use pricing from destination tour's pricing tiers

  #### Date Handling & Timezone Management
  - **Colombian Locale**: Dates interpreted in Colombia timezone (UTC-5)
  - **Date-Only Format**: When using "YYYY-MM-DD" format, interpreted as beginning of day in local timezone
  - **ISO Format**: When using ISO format with timezone, interpreted as exact moment in time
  - **Synchronization**: Booking startDate now properly synchronized with associated event date
  - **Client Timestamps**: Status changes use client-side formatted timestamps for arrays

  ### Audit Trails

  #### Comprehensive Logging
  - **Status Changes**: Every status update logged in booking's statusHistory array
  - **Detailed Information**: Each log entry includes timestamp, status, note, and adminUser
  - **Reason Tracking**: Optional reasons captured for all significant changes
  - **Event Transitions**: Date changes and event moves logged in previousStates array

  #### Audit Trail Structure
  ```javascript
  // Status History - tracks booking status changes
  statusHistory: [
    {
      timestamp: "ISO date string",
      status: "booking status",
      note: "description of change",
      adminUser: "admin identifier",
      reason: "reason for change"
    }
  ]

  // Previous States - tracks booking movement between events/tours
  previousStates: [
    {
      action: "action type (e.g., date_change, tour_change)",
      timestamp: "timestamp",
      fromEventId: "previous event ID",
      toEventId: "new event ID", 
      fromTourId: "previous tour ID",
      toTourId: "new tour ID",
      adminUser: "admin identifier",
      reason: "reason for change"
    }
  ]
  ```

  ### Booking Status Transitions

  #### Valid Status Transitions
  - **Normal Flow**: `pending` → `confirmed` → `paid`
  - **Cancellation**: Any status can transition to `cancelled` or `cancelled_by_admin`
  - **Restrictions**: Cannot move from `cancelled` to other statuses (to prevent invalid transitions)

  #### Status Validation Rules
  1. **Cancelled Protection**: Cannot modify cancelled bookings
  2. **Logical Transitions**: Prevent impossible status transitions
  3. **Capacity Adjustment**: Cancelled bookings automatically free up capacity
  4. **Audit Trail**: All status changes maintain complete history

  ### Cross-Tour Transfers

  #### Transfer Mechanics
  - **Complete Process**: Creates new booking on destination tour, cancels original booking
  - **Data Preservation**: All customer information copied to new booking
  - **Pricing Recalculation**: New booking uses destination tour's pricing tiers
  - **Reference Generation**: New booking receives new reference code
  - **Capacity Management**: Adjusts capacity on both source and destination events

  #### Transaction Safety
  - **Atomic Operations**: All transfer operations happen within Firestore transactions
  - **Data Consistency**: Ensures data integrity across multiple document changes
  - **Rollback Capability**: If any part fails, entire operation is rolled back

  ### Event Splitting

  #### Split Operation Logic
  - **Bookings Migration**: Selected bookings moved to new event with specified parameters
  - **Capacity Distribution**: Pax counts properly distributed between events
  - **History Maintenance**: All booking histories preserved during split
  - **Audit Trail**: Complete record of split operation maintained

  #### Use Cases
  1. **Group Size Management**: Separating large groups into smaller ones
  2. **Private Arrangements**: Creating private events from public ones
  3. **Guide Allocation**: Managing guides for different group sizes
  4. **Operational Flexibility**: Adjusting to operational requirements

  ## Deprecated Files

  The following deprecated test files have been removed from the project:

  - `test_admin_create_booking.js` - Removed: Basic functionality test (replaced by comprehensive tests)
  - `verify_status_booking.js` - Removed: Verification test (replaced by comprehensive tests)
  - `full_system_test.js` - Removed: Complete system integration test (replaced by comprehensive tests)
  - `active_booking_tests.js` - Removed: Outdated active booking tests
  - `admin_endpoint_tests.js` - Removed: Outdated admin endpoint tests
  - `booking_transfer_test.js` - Removed: Outdated booking transfer tests
  - `comprehensive_test_sync.js` - Removed: Outdated comprehensive sync tests
  - `comprehensive_test.js` - Removed: Outdated comprehensive tests
  - `date_change_test.js` - Removed: Outdated date change tests
  - `date_change_verification.js` - Removed: Outdated date change verification tests
  - `date_test.js` - Removed: Outdated date tests
  - `detailed_test.js` - Removed: Outdated detailed tests
  - `final_api_test.js` - Removed: Outdated API tests
  - `final_comprehensive_test.js` - Removed: Outdated comprehensive tests
  - `final_test_dec31.js` - Removed: Outdated end-of-year tests
  - `final_validation_tests.js` - Removed: Outdated validation tests
  - `final_verification.js` - Removed: Outdated verification tests
  - `full_api_test.js` - Removed: Outdated API tests
  - `quick_test.js` - Removed: Outdated quick tests
  - `test_deployed_api.js` - Removed: Outdated deployed API tests
  - `test_fix.js` - Removed: Outdated fix tests
  - `test_new_endpoint.js` - Removed: Outdated new endpoint tests
  - `test_new_features.js` - Removed: Outdated new features tests
  - `test_publish.js` - Removed: Outdated publish tests
  - `test_sync_fix.js` - Removed: Outdated sync fix tests
  - `test_transfer_fix.js` - Removed: Outdated transfer fix tests
  - `timezone_test_fixed.js` - Removed: Outdated timezone tests
  - `timezone_test.js` - Removed: Outdated timezone tests
  - `tour_transfer_test_fixed.js` - Removed: Outdated tour transfer tests
  - `tour_transfer_test.js` - Removed: Outdated tour transfer tests
  - `update_specific_booking.js` - Removed: Outdated booking update tests
  - `update_timezone_aware.js` - Removed: Outdated timezone-aware tests
  - `update_to_dec15.js` - Removed: Outdated December 15 update tests
  - `update_to_dec5.js` - Removed: Outdated December 5 update tests

  ## Current Test Files

  The project now maintains only the following up-to-date test files:

  - `comprehensive_api_test_v2.js` - Comprehensive API test suite
  - `comprehensive_admin_tests.js` - Comprehensive admin endpoint tests
  - `comprehensive_admin_create_booking_test.js` - Admin create booking tests
  - `test_api.js` - API functionality tests
  - `booking_info.js` - Booking information retrieval tests
  - `test_admin_booking_endpoints.js` - Admin booking endpoint tests
  - `test_admin_endpoints.js` - Admin endpoint tests
  - `test_admin_event_endpoints.js` - Admin event endpoint tests
  - `test_cross_tour_transfer_final.js` - Cross-tour transfer tests
  - `test_cross_tour_transfer_fixed.js` - Fixed cross-tour transfer tests
  - `test_cross_tour_transfer.js` - Cross-tour transfer tests
  - `test_new_event_endpoints_updated.js` - Updated new event endpoint tests
  - `test_new_event_endpoints.js` - New event endpoint tests
  - `test_new_event_management_final.js` - Final new event management tests
  - `check_functions.js` - Function checking tests
  - `verify_deployed.js` - Deployed verification tests
  - `check_date_change.js` - Date change verification tests
  - `analysis.js` - Analysis tests
    - New booking created on "Tour A" for new date (e.g., Dec 20)
    - New event created for Dec 20 if needed
    - Original event capacity increased
    - New event capacity decreased
  4. **Result**: New booking ID `789` on "Tour A" for Dec 20

  ### 3. Status Update Flow

  When updating booking status:

  1. **Get Booking**: Retrieve booking to check current status
  2. **Validate Transition**: Ensure status change is allowed (e.g., can't change cancelled to confirmed)
  3. **Update Status**: Change status in database
  4. **Update Capacity**: If cancelling, increase event capacity
  5. **Add History**: Log status change in booking history
  6. **Response**: Return confirmation with previous and new status

  ## Frontend Implementation

  ### 1. Admin Panel Structure

  ```javascript
  // Example Admin Panel Component
  const AdminPanel = () => {
    const [activeTab, setActiveTab] = useState('bookings');
    const [bookings, setBookings] = useState([]);
    const [tours, setTours] = useState([]);
    
    // Fetch bookings
    const fetchBookings = async () => {
      try {
        const data = await makeAdminRequest('/adminGetBookings');
        setBookings(data.bookings);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      }
    };
    
    // Update booking status
    const updateBookingStatus = async (bookingId, newStatus, reason) => {
      try {
        const response = await makeAdminRequest(
          `/adminUpdateBookingStatus/${bookingId}`, 
          'PUT', 
          { status: newStatus, reason }
        );
        // Update local state or refetch bookings
        fetchBookings();
      } catch (error) {
        console.error('Error updating booking status:', error);
      }
    };
    
    return (
      <div className="admin-panel">
        {/* Navigation tabs */}
        <nav>
          <button onClick={() => setActiveTab('bookings')}>Bookings</button>
          <button onClick={() => setActiveTab('tours')}>Tours</button>
          <button onClick={() => setActiveTab('events')}>Events</button>
        </nav>
        
        {/* Content based on active tab */}
        {activeTab === 'bookings' && (
          <BookingsView 
            bookings={bookings} 
            onUpdateStatus={updateBookingStatus}
            onTransfer={handleTransfer}
          />
        )}
        {/* Other tabs... */}
      </div>
    );
  };
  ```

  ### 2. Tour Management Component

  ```javascript
  const TourManager = () => {
    const [tours, setTours] = useState([]);
    const [editingTour, setEditingTour] = useState(null);
    
    const createTour = async (tourData) => {
      try {
        const response = await makeAdminRequest('/adminCreateTourV2', 'POST', tourData);
        // Refresh tours list
        fetchTours();
      } catch (error) {
        console.error('Error creating tour:', error);
      }
    };
    
    const updateTour = async (tourId, updateData) => {
      try {
        const response = await makeAdminRequest(`/adminUpdateTourV2/${tourId}`, 'PUT', updateData);
        // Refresh tours list
        fetchTours();
      } catch (error) {
        console.error('Error updating tour:', error);
      }
    };
    
    const deleteTour = async (tourId) => {
      if (window.confirm('Are you sure you want to delete this tour?')) {
        try {
          const response = await makeAdminRequest(`/adminDeleteTourV2/${tourId}`, 'DELETE');
          // Refresh tours list
          fetchTours();
        } catch (error) {
          console.error('Error deleting tour:', error);
        }
      }
    };
  };
  ```

  ### 3. Booking Transfer Component

  ```javascript
  const BookingTransferModal = ({ bookingId, onClose, onTransferComplete }) => {
    const [selectedEvent, setSelectedEvent] = useState('');
    const [selectedTour, setSelectedTour] = useState('');
    const [events, setEvents] = useState([]);
    const [tours, setTours] = useState([]);
    const [reason, setReason] = useState('');

    useEffect(() => {
      // Load tours and events
      loadTours();
      loadEvents();
    }, []);

    const loadTours = async () => {
      try {
        const response = await makeAdminRequest('/getToursV2');
        setTours(response);
      } catch (error) {
        console.error('Error loading tours:', error);
      }
    };

    const loadEvents = async (tourId) => {
      try {
        const response = await makeAdminRequest('/adminGetEventsCalendar', 'GET', null, {
          tourId: tourId
        });
        setEvents(response.events);
      } catch (error) {
        console.error('Error loading events:', error);
      }
    };

    const handleTourChange = (tourId) => {
      setSelectedTour(tourId);
      loadEvents(tourId);
    };

    const transferBooking = async () => {
      try {
        const response = await makeAdminRequest(`/adminTransferToNewTour/${bookingId}`, 'POST', {
          newTourId: selectedTour,
          reason: reason || 'Booking transfer'
        });
        
        onTransferComplete(response);
        onClose();
      } catch (error) {
        console.error('Error transferring booking:', error);
      }
    };

    return (
      <div className="modal">
        <div className="modal-content">
          <h2>Transfer Booking</h2>
          <div className="form-group">
            <label>Select Tour:</label>
            <select onChange={(e) => handleTourChange(e.target.value)}>
              <option value="">Select Tour</option>
              {tours.map(tour => (
                <option key={tour.tourId} value={tour.tourId}>
                  {tour.name.es}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Select Event:</label>
            <select 
              value={selectedEvent} 
              onChange={(e) => setSelectedEvent(e.target.value)}
            >
              <option value="">Select Event</option>
              {events.map(event => (
                <option key={event.eventId} value={event.eventId}>
                  {new Date(event.startDate).toLocaleDateString()} ({event.bookedSlots}/{event.maxCapacity})
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Transfer Reason:</label>
            <input 
              type="text" 
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          
          <button onClick={transferBooking}>Transfer Booking</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    );
  };
  ```

  ## Best Practices

  ### 1. Security

  - Never expose the admin secret key in client-side code or public repositories
  - Use environment variables for the secret key
  - Implement proper admin authentication on top of API key validation
  - Log all admin actions for audit trails
  - Validate and sanitize all user inputs

  ### 2. Error Handling

  - Implement proper error handling for all API calls
  - Show user-friendly error messages
  - Handle network errors gracefully
  - Use loading states during API calls

  ### 3. Data Validation

  - Validate data on the frontend before sending to the backend
  - Provide clear feedback when data is invalid
  - Use proper form validation

  ### 4. Performance

  - Use pagination for large datasets
  - Implement caching where appropriate
  - Optimize network requests
  - Consider using GraphQL for complex queries instead of multiple REST calls

  ### 5. User Experience

  - Provide clear feedback when operations are successful or fail
  - Implement undo functionality where possible
  - Show loading indicators during operations
  - Use appropriate confirmation dialogs for destructive operations

  ## Common Implementation Patterns

  ### 1. Admin Dashboard Layout

  ```javascript
  // Layout structure
  const AdminDashboard = () => {
    return (
      <div className="admin-dashboard">
        <Sidebar />
        <main className="content">
          <Header />
          <Route path="/admin/bookings" component={BookingManager} />
          <Route path="/admin/tours" component={TourManager} />
          <Route path="/admin/events" component={EventManager} />
        </main>
      </div>
    );
  };
  ```

  ### 2. Authentication Wrapper

  ```javascript
  const withAdminAuth = (WrappedComponent) => {
    return (props) => {
      const [isAuthenticated, setIsAuthenticated] = useState(false);
      const [checkingAuth, setCheckingAuth] = useState(true);

      useEffect(() => {
        checkAdminAuth();
      }, []);

      const checkAdminAuth = async () => {
        try {
          const response = await makeAdminRequest('/adminGetBookings');
          setIsAuthenticated(true);
        } catch (error) {
          setIsAuthenticated(false);
          // Redirect to login or show error
        } finally {
          setCheckingAuth(false);
        }
      };

      if (checkingAuth) {
        return <div>Loading...</div>;
      }

      if (!isAuthenticated) {
        return <AdminLogin onLoginSuccess={() => setIsAuthenticated(true)} />;
      }

      return <WrappedComponent {...props} />;
    };
  };
  ```

  This documentation provides a comprehensive guide for implementing and using all admin endpoints in the Nevado Trek Backend system.