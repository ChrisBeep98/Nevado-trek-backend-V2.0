# Architecture & Schema - Nevado Trek Backend

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

## Security Architecture

### Authentication
- Admin endpoints: `X-Admin-Secret-Key` header required
- Secret key: Parameter stored securely in Firebase Functions parameters (using new parameters system)
- Customer endpoints: No authentication required (rate limited by IP)

### Rate Limiting
- IP-based tracking in rateLimiter collection
- Time-based restrictions to prevent spam
- Logging of booking attempts for analytics

## Data Flow Architecture

### Write Operations (Transactions)
- `createBooking`: Updates tourEvent (capacity) and creates booking atomically
- `joinEvent`: Updates tourEvent (capacity) and creates booking atomically  
- All capacity modifications in Firestore transactions to prevent race conditions

### Read Operations (Denormalization)
- Tour names copied to tourEvents and bookings for efficient reading
- Event data denormalized in booking records for fast retrieval
- Optimized for read-heavy public API usage