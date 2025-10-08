# API Usage & Testing - Nevado Trek Backend

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
  - `X-Admin-Secret-Key: miClaveSecreta123`
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
  curl -H "X-Admin-Secret-Key: miClaveSecreta123" \
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
  curl -H "X-Admin-Secret-Key: miClaveSecreta123" \
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

## Testing Guide

### Unit Testing
Run existing unit tests:
```bash
node test_functions.js
```

### Manual Testing via cURL

#### Test Public Tours
```bash
# Get all active tours
curl https://gettoursv2-wgfhwjbpva-uc.a.run.app

# Get specific tour
curl https://gettourbyidv2-wgfhwjbpva-uc.a.run.app/Sq59WCxZyMZaSWNovcse
```

#### Test Booking Functions
```bash
# Create booking (use valid tourId from GET /tours)
curl -X POST https://createbooking-wgfhwjbpva-uc.a.run.app \
  -H "Content-Type: application/json" \
  -d '{
    "tourId": "Sq59WCxZyMZaSWNovcse",
    "startDate": "2025-12-15T07:00:00Z",
    "customer": {
      "fullName": "Test Customer",
      "documentId": "CC123456789",
      "phone": "+573123456789",
      "email": "test@example.com"
    },
    "pax": 1
  }'
```

#### Test Admin Functions
```bash
# Create tour (requires admin key)
curl -X POST https://admincreatetourv2-wgfhwjbpva-uc.a.run.app \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret-Key: miClaveSecreta123" \
  -d '{
    "name": { "es": "Test Tour", "en": "Test Tour" },
    "description": { "es": "Descripción", "en": "Description" },
    "isActive": true
  }'
```

### Automated Testing Script
A test script can be created to verify all endpoints work as expected, including:
- Success scenarios for all endpoints
- Error handling validation
- Rate limiting behavior
- Data consistency checks

## Rate Limiting Testing
- After 1 booking, next booking attempt from same IP within 5 minutes will fail
- Maximum 3 bookings per hour per IP
- Maximum 5 bookings per day per IP
- Use different IPs or wait periods to test multiple bookings

## Deployment Verification
After deployment, verify:
1. All 9 endpoints return 200/expected responses
2. Rate limiting is active on booking endpoints
3. Admin authentication blocks unauthorized access
4. Data persists in Firestore collections
5. Error handling returns proper formats