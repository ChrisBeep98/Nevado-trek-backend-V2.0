# Deployment and Testing Instructions - Nevado Trek Backend

## Deployment Issue Resolution

### Problem & Solution
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
FUNCTIONS_DISCOVERY_TIMEOUT=120 firebase deploy --only functions
```

### Endpoints Summary (Total: 13)

#### Public Endpoints
1. **GET** `/getToursV2` - List all active tours
2. **GET** `/getTourByIdV2/:tourId` - Get specific tour by ID
3. **POST** `/createBooking` - Create new reservation
4. **POST** `/joinEvent` - Join existing public event
5. **GET** `/checkBooking` - Verify booking status by reference

#### Admin Endpoints
6. **POST** `/adminCreateTourV2` - Create new tour (requires admin key)
7. **PUT** `/adminUpdateTourV2/:tourId` - Update existing tour (requires admin key)
8. **DELETE** `/adminDeleteTourV2/:tourId` - Delete tour (requires admin key)
9. **GET** `/adminGetBookings` - List all bookings with filters (requires admin key)
10. **PUT** `/adminUpdateBookingStatus/:bookingId` - Update booking status (requires admin key)
11. **GET** `/adminGetEventsCalendar` - List events for calendar view (requires admin key) - *NEW*

### Deployment Instructions

1. **Deploy Functions:**
   ```bash
   firebase deploy --only functions
   ```

2. **Verify Deployed Functions:**
   ```bash
   firebase functions:list
   ```

### Setup Test Data

1. **Install dependencies:**
   ```bash
   cd functions && npm install
   # or globally if not in functions directory
   npm install axios
   ```

2. **Create test data:**
   ```bash
   node setup_test_data.js
   ```

### Comprehensive API Testing

1. **Run the test suite:**
   ```bash
   node api_test_suite.js
   ```

### New Endpoint Documentation: adminGetEventsCalendar

**URL:** `GET /adminGetEventsCalendar`
**Description:** List all events with filtering capabilities for calendar view
**Authentication:** `X-Admin-Secret-Key` header required

#### Query Parameters
- `tourId` (optional) - Filter by tour ID
- `startDateFrom` (optional) - Filter by event start date from (ISO date string)
- `startDateTo` (optional) - Filter by event start date to (ISO date string)
- `type` (optional) - Filter by event type ('private' or 'public')
- `status` (optional) - Filter by event status ('active', 'full', 'completed', 'cancelled')
- `limit` (optional) - Number of results per page (default: 50, max: 200)
- `offset` (optional) - Number of results to skip (for pagination)

#### Example Request
```bash
curl -H "X-Admin-Secret-Key: [YOUR_SECURE_ADMIN_KEY]" \
  "https://us-central1-nevadotrektest01.cloudfunctions.net/adminGetEventsCalendar?startDateFrom=2025-01-01&limit=20"
```

#### Example Response
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
      "createdAt": "ISO date string",
      "updatedAt": "ISO date string",
      "...": "other fields"
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

### Manual Testing Steps

#### 1. Test New Calendar Endpoint
```bash
# Get all events
curl -H "X-Admin-Secret-Key: [YOUR_SECURE_ADMIN_KEY]" \
  "https://[PROJECT-ID].cloudfunctions.net/adminGetEventsCalendar"

# Get events with date range
curl -H "X-Admin-Secret-Key: [YOUR_SECURE_ADMIN_KEY]" \
  "https://[PROJECT-ID].cloudfunctions.net/adminGetEventsCalendar?startDateFrom=2025-01-01&startDateTo=2025-12-31"

# Get events for specific tour
curl -H "X-Admin-Secret-Key: [YOUR_SECURE_ADMIN_KEY]" \
  "https://[PROJECT-ID].cloudfunctions.net/adminGetEventsCalendar?tourId=[TOUR_ID]&type=public"

# Get events with pagination
curl -H "X-Admin-Secret-Key: [YOUR_SECURE_ADMIN_KEY]" \
  "https://[PROJECT-ID].cloudfunctions.net/adminGetEventsCalendar?limit=10&offset=0"
```

#### 2. Test All Admin Endpoints
```bash
# Test admin bookings endpoint
curl -H "X-Admin-Secret-Key: [YOUR_SECURE_ADMIN_KEY]" \
  "https://[PROJECT-ID].cloudfunctions.net/adminGetBookings"

# Test booking status update
curl -X PUT -H "X-Admin-Secret-Key: [YOUR_SECURE_ADMIN_KEY]" \
  -H "Content-Type: application/json" \
  -d '{"status":"confirmed","reason":"Payment received"}' \
  "https://[PROJECT-ID].cloudfunctions.net/adminUpdateBookingStatus/[BOOKING_ID]"
```

#### 3. Test All Public Endpoints
```bash
# Test public endpoints (no auth required)
curl "https://[PROJECT-ID].cloudfunctions.net/getToursV2"
curl "https://[PROJECT-ID].cloudfunctions.net/getTourByIdV2/[TOUR_ID]"

# Test booking functionality
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"tourId":"[TOUR_ID]","startDate":"2025-12-15T07:00:00Z","customer":{"fullName":"Test User","documentId":"CC123456","phone":"+573001234567","email":"test@example.com"},"pax":2}' \
  "https://[PROJECT-ID].cloudfunctions.net/createBooking"
```

### Security & Authentication Testing
- Verify that admin endpoints reject requests without proper `X-Admin-Secret-Key`
- Verify that admin endpoints reject requests with invalid keys
- Verify that public endpoints work without authentication

### Error Handling Testing
- Test endpoints with invalid parameters
- Test endpoints with malformed data
- Test rate limiting on booking endpoints

### Expected Response Codes
- **200**: Success for GET requests
- **201**: Created for POST requests
- **400**: Bad Request for invalid data
- **401**: Unauthorized for missing/invalid admin key
- **404**: Not Found for non-existent resources
- **405**: Method Not Allowed for wrong HTTP method
- **422**: Unprocessable Entity for validation errors (like capacity exceeded)
- **403**: Forbidden for rate limiting
- **500**: Internal Server Error for server issues