# Admin Panel API Usage Guide

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Booking Management](#booking-management)
4. [Event Management](#event-management)
5. [Tour Management](#tour-management)
6. [Workflow Examples](#workflow-examples)
7. [Error Handling](#error-handling)

## Overview

This guide explains how to use the admin panel API for managing bookings, events, and tours in the Nevado Trek system.

### Key Concepts:
- **Booking**: A customer's reservation with specific customer details and pax count
- **Event**: A specific instance of a tour on a specific date with capacity
- **Tour**: The general tour experience (like "Nevado del Tolima")

### Booking vs Event Relationship:
- Every initial booking creates a private event
- Events can be toggled between private (not joinable) and public (others can join)
- Multiple bookings can exist on the same public event

## Authentication

All admin endpoints require the `X-Admin-Secret-Key` header:

```bash
curl -X PUT "https://us-central1-nevadotrektest01.cloudfunctions.net/adminUpdateBookingDetails/bookingId123" \
  -H "X-Admin-Secret-Key: YOUR_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d "{...}"
```

## Booking Management

### 1. Update Booking Details
`PUT /adminUpdateBookingDetails/:bookingId`

Update core booking information while maintaining audit trail. When updating the startDate, the booking will be moved to the appropriate event for the new date, and capacity will be automatically adjusted between the old and new events.

**Request Body:**
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
  "reason": "string (optional, reason for the change)"
}
```

**Important Behavior Change:** When updating the `startDate`, the system:
- Finds or creates an appropriate event for the new date and same tour
- Moves the booking to the new event (changing the booking's eventId)
- Adjusts capacity: reduces capacity on the original event and increases it on the new event
- Tracks the event transition in the booking's `previousStates` field
- All capacity adjustments are handled atomically in a Firestore transaction

**Example:**
```bash
curl -X PUT "https://us-central1-nevadotrektest01.cloudfunctions.net/adminUpdateBookingDetails/qcWIadNTt0PcinNTjGxu" \
  -H "X-Admin-Secret-Key: YOUR_ADMIN_KEY" \
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
```

### 2. Update Booking Status (Enhanced)
`PUT /adminUpdateBookingStatus/:bookingId`

Update status with optional additional field updates.

**Request Body:**
```json
{
  "status": "pending|confirmed|paid|cancelled|cancelled_by_admin",
  "reason": "string (optional)",
  "additionalUpdates": {
    "customer": { ... },
    "tourId": "string",
    "startDate": "ISO date string",
    "pax": "number",
    "price": "number"
  }
}
```

**Example:**
```bash
curl -X PUT "https://us-central1-nevadotrektest01.cloudfunctions.net/adminUpdateBookingStatus/qcWIadNTt0PcinNTjGxu" \
  -H "X-Admin-Secret-Key: YOUR_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "confirmed",
    "reason": "Payment received",
    "additionalUpdates": {
      "customer": {
        "phone": "+573123456789"
      }
    }
  }'
```

### 3. Transfer Booking Between Events
`POST /adminTransferBooking/:bookingId`

Move a booking from one event to another.

**Request Body:**
```json
{
  "destinationEventId": "string (required)",
  "reason": "string (optional)"
}
```

**Example:**
```bash
curl -X POST "https://us-central1-nevadotrektest01.cloudfunctions.net/adminTransferBooking/qcWIadNTt0PcinNTjGxu" \
  -H "X-Admin-Secret-Key: YOUR_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "destinationEventId": "newEventId123",
    "reason": "Customer requested date change"
  }'
```

### 4. Get Bookings with Filters
`GET /adminGetBookings`

Retrieve bookings with various filtering options. The startDate in the response reflects the date from the associated event.

**Query Parameters:**
- `status` - Filter by booking status
- `tourId` - Filter by tour ID
- `startDateFrom` - Filter by booking date from (date from associated event)
- `startDateTo` - Filter by booking date to (date from associated event)
- `customerName` - Filter by customer full name
- `limit` - Number of results per page (default: 50, max: 200)
- `offset` - Number of results to skip

### 5. Date Change Tracking
When a booking date is changed via `PUT /adminUpdateBookingDetails/:bookingId` with a new startDate, the change is tracked in the booking's `previousStates` field with the following structure:
```json
{
  "action": "date_change",
  "timestamp": "ISO date string",
  "fromEventId": "original event ID",
  "toEventId": "new event ID", 
  "fromTourId": "tour ID",
  "toTourId": "tour ID",
  "adminUser": "admin identifier",
  "reason": "reason for change"
}
```

## Event Management

### 1. Toggle Event Visibility
`POST /adminPublishEvent/:eventId`

Toggle an event between public and private.

**Request Body:**
```json
{
  "action": "publish|unpublish" // Optional, defaults to "publish"
}
```

**Example:**
```bash
curl -X POST "https://us-central1-nevadotrektest01.cloudfunctions.net/adminPublishEvent/eventId123" \
  -H "X-Admin-Secret-Key: YOUR_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "publish"
  }'
```

### 2. Get Events Calendar
`GET /adminGetEventsCalendar`

Retrieve events with filtering for calendar view.

**Query Parameters:**
- `tourId` - Filter by tour ID
- `startDateFrom` - Filter by event start date from
- `startDateTo` - Filter by event start date to
- `type` - Filter by event type ('private' or 'public')
- `status` - Filter by event status ('active', 'full', 'completed', 'cancelled')
- `limit` - Number of results per page
- `offset` - Number of results to skip

## Tour Management

### 1. Create, Update, Delete Tours
- `POST /adminCreateTourV2` - Create new tour
- `PUT /adminUpdateTourV2/:tourId` - Update existing tour  
- `DELETE /adminDeleteTourV2/:tourId` - Logically delete tour

## Workflow Examples

### Example 1: Making a Private Event Public (Group Booking)
1. Customer creates booking → System creates private event
2. Admin reviews → Makes event public so others can join
3. Other customers can now join using `joinEvent`

```javascript
// First, get the event ID from the booking
const booking = getBookingDetails(bookingId);

// Then publish the event
curl -X POST "https://us-central1-nevadotrektest01.cloudfunctions.net/adminPublishEvent/${booking.eventId}" \
  -H "X-Admin-Secret-Key: YOUR_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "publish"}'
```

### Example 2: Separating a Booking from a Public Event
1. Booking exists on a public event with multiple customers
2. Transfer booking to private event (or new event for one group)

```javascript
// Create a new event for the customer (or use an existing private event)
// Then transfer the booking
curl -X POST "https://us-central1-nevadotrektest01.cloudfunctions.net/adminTransferBooking/bookingId123" \
  -H "X-Admin-Secret-Key: YOUR_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "destinationEventId": "privateEventId456",
    "reason": "Customer requested private group"
  }'
```

### Example 3: Updating Customer Information and Booking Details
```javascript
curl -X PUT "https://us-central1-nevadotrektest01.cloudfunctions.net/adminUpdateBookingDetails/bookingId123" \
  -H "X-Admin-Secret-Key: YOUR_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "customer": {
      "fullName": "New Customer Name",
      "email": "newemail@example.com",
      "phone": "+573123456789"
    },
    "pax": 3,
    "reason": "Customer updated contact info and added participants"
  }'
```

### Example 5: Updating Booking Date (Moving Between Events)
When updating the startDate, the booking is automatically moved to a new event for that date, with capacity adjustments handled automatically:

```javascript
// Move a booking to a new date - this creates or finds an event for the new date
// and moves the booking between events while maintaining capacity
curl -X PUT "https://us-central1-nevadotrektest01.cloudfunctions.net/adminUpdateBookingDetails/bookingId123" \
  -H "X-Admin-Secret-Key: YOUR_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2025-12-25T00:00:00.000Z",
    "reason": "Customer requested date change"
  }'

// The system will:
// 1. Find or create an event for the tour on 2025-12-25
// 2. Move the booking to that event (changing eventId)
// 3. Reduce capacity on old event by the booking's pax count
// 4. Increase capacity on new event by the booking's pax count
// 5. Track this transition in the booking's previousStates field
```

### Example 4: Updating Status and Customer Info Together
```javascript
curl -X PUT "https://us-central1-nevadotrektest01.cloudfunctions.net/adminUpdateBookingStatus/bookingId123" \
  -H "X-Admin-Secret-Key: YOUR_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "confirmed",
    "reason": "Payment confirmed",
    "additionalUpdates": {
      "customer": {
        "notes": "Special dietary requirements noted"
      }
    }
  }'
```

## Error Handling

### Common Error Codes:
- `400`: Invalid data (validation errors)
- `401`: Unauthorized access (invalid admin key)
- `404`: Resource not found (booking, tour, or event not found)
- `422`: Unprocessable entity (capacity exceeded, etc.)
- `500`: Internal server error

### Common Error Responses:
```json
{
  "error": {
    "code": "INVALID_DATA | RESOURCE_NOT_FOUND | CAPACITY_EXCEEDED",
    "message": "User-friendly error message",
    "details": "Technical details about the error"
  }
}
```

### Validation Errors:
When updating customer data, validation errors will return:
```json
{
  "error": {
    "code": "INVALID_DATA",
    "message": "Datos de cliente inválidos",
    "details": "{\"email\":\"Email format is invalid\"}"
  }
}
```

## Business Logic Notes

1. **Every booking creates a private event initially** - When a customer books a new date, a private event is created
2. **Events can be made public** - Admins can toggle events from private to public for group bookings
3. **Capacity management** - System automatically adjusts capacity when pax counts change
4. **Audit trails** - All changes are logged with timestamps, admin user, and reasons
5. **Validation** - All inputs are validated (email format, phone format, tour existence, etc.)
6. **Rate limiting** - Customer-facing endpoints have rate limiting (not admin endpoints)
7. **Cancellation** - Cancelled bookings free up capacity automatically
8. **Date changes move bookings between events** - When updating a booking's startDate via adminUpdateBookingDetails, the booking is moved to a new event for that date, with capacity automatically adjusted between old and new events
9. **Date synchronization** - The booking's startDate field is now properly synchronized with the associated event's date to ensure consistency
10. **Timezone handling** - Date changes properly account for Colombia timezone (UTC-5) to ensure correct calendar day display, with date-only strings interpreted as beginning of day in local timezone

## Important Date Handling Information for Frontend Developers

### Understanding Booking Dates

There are multiple date-related fields in a booking document, and it's crucial to understand how they work to avoid confusion:

#### 1. Booking vs Event Date Concept
- **bookingDate**: When the reservation was originally made (immutable, for historical tracking)
- **Event Date**: When the tour actually takes place (this is the date that matters for the customer experience)

#### 2. How Date Changes Work 
When updating a booking's date via `PUT /adminUpdateBookingDetails`, the system:
- **Moves** the booking to a **new event** for the requested date
- **Updates** the booking's `startDate` field to match the new event's date
- **Changes** the `eventId` field to point to the new event
- **Updates** capacity on both the old and new events
- **Tracks** the change in the booking's `previousStates` field

#### 3. Timezone Handling
The system now properly handles timezone conversions for tour dates:
- **Date-only format** (e.g., "2025-12-31"): Interpreted as the beginning of that day in Colombia timezone (UTC-5)
- **ISO format with 'Z'** (e.g., "2025-12-31T00:00:00.000Z"): Interpreted as the specific moment in UTC
- **Display**: Dates are displayed consistently in the Colombia timezone

#### 4. Getting the Correct Tour Date
To get the actual tour date, you can rely on either field as they are now synchronized:

**For Admin Endpoints** (booking with all details):
1. Get the booking document
2. Extract the `eventId` field
3. Query the `tourEvents` collection for the document with that ID
4. Use the `startDate` from the event document

**For Public Check Endpoint**:
1. The `/checkBooking` endpoint already returns the correct date from the associated event

#### 5. Database Structure
```
Booking Document:
- bookingId: "..."
- eventId: "..."  // Points to the event document
- bookingDate: "..." // When booking was made (unchanging)
- startDate: "..." // The tour date (synchronized with associated event)

Event Document (referenced by eventId):
- eventId: "..."
- startDate: "..." // The ACTUAL tour date (now synchronized with booking)
- endDate: "..."
```

#### 6. Frontend Implementation Recommendation
When displaying tour dates to users, you can now use either the booking's startDate or the event date - both will be consistent:
```
// Option 1: Get date directly from booking (now synchronized)
const booking = await getBooking(bookingId); 
const tourDate = booking.startDate; // This will be the correct date

// Option 2: Get date from associated event
const event = await getEvent(booking.eventId); 
const tourDate = event.startDate; // This will be the same date
```

#### 7. Date Format Recommendations
- **For admin operations**: Use date-only format (e.g., "2025-12-31") for local date interpretation
- **For API operations**: Both date-only and ISO formats are supported
- **For display**: Dates will show consistently in Colombia timezone

This API allows comprehensive management of the booking system while maintaining data integrity and audit compliance.






Let me clarify:

  All bookings are created equal - they differ by the event they're on:

   1. "Group booking": A booking that joins an existing public event with other customers
   2. "Private booking": A booking that creates a private event initially (for a specific customer's group)

  To answer your question: "Can I update a booking that's on a private event to be on a public event?"

  Yes! You can do this using the transfer functionality:

  Example workflow:
   1. Current state: Customer A has a booking on a private event (Event X) for "Nevado del Tolima" on Nov 15, 2025
   2. Action: Admin uses POST /adminTransferBooking/:bookingId to transfer Customer A's booking to a different event
   3. Target event: A public event (Event Y) for "Nevado del Tolima" on Nov 10, 2025 that already has 2 other customers
   4. Result: Customer A's booking is now on the public event with 3 total customers

  What you're asking for is possible:
   - From: Booking on private event (only Customer A's group on it)
   - To: Booking transferred to public event (Customer A's booking now shares the event with other customers)

  This is exactly what the adminTransferBooking endpoint does - it moves a booking from one event to another, regardless of whether the source or destination event is public or private.

  The booking itself doesn't change - it just gets associated with a different event, and that event's visibility (public/private) determines if others can join.





  Every time a single customer creates a booking via the POST /createBooking endpoint:

   1. If no event exists for that tour and date → A new private event is automatically created
   2. The booking is attached to that private event
   3. Later, the admin can use POST /adminPublishEvent/:eventId to make that event public
   4. Once public, other customers can join that event using POST /joinEvent

  Step-by-step example:
   1. Customer A books "Nevado del Tolima" for Nov 10, 2025 via createBooking
   2. System creates:
      - A new private event (Event X) for Nov 10, 2025
      - A booking for Customer A on Event X (2 people)
   3. Event X starts private: Only Customer A on it
   4. Admin makes it public: Uses adminPublishEvent/:eventId for Event X
   5. Now public: Customer B can join Event X via joinEvent
   6. Result: Both Customer A (2 people) and Customer B (1 person) are on Event X (3 of 8 total)

  So yes, every initial booking creates a private event that can be made public later! That's exactly how the system works.


╰────────────────────────────────────────────────────────────────────────────────────╯

✦ Based on the current implementation, here's what you can change in the booking details:

  ✅ Items You Can Change via `PUT /adminUpdateBookingDetails/:bookingId`:

  Customer Information:
   - customer.fullName
   - customer.documentId
   - customer.phone
   - customer.email
   - customer.notes

  Booking Details:
   - pax (number of participants) - adjusts event capacity
   - tourId (moves to a different tour)
   - tourName (if you want to update it separately)
   - startDate (if you want to move to a different date - would need to transfer to new event)
   - price (manual price override)

  With the enhanced `PUT /adminUpdateBookingStatus/:bookingId`:
   - You can update status AND include customer/booking details via additionalUpdates field

  


  ⚠️ What You CAN'T Change:
   - bookingId (immutable)
   - eventId directly (use transfer functionality instead)
   - bookingReference (immutable)
   - createdAt (timestamp - should not be modified)

  📝 Example Request:
    1 PUT /adminUpdateBookingDetails/{bookingId}
    2 {
    3   "customer": {
    4     "fullName": "New Full Name",
    5     "email": "newemail@example.com",
    6     "notes": "Updated due to customer request"
    7   },
    8   "pax": 4,
    9   "tourId": "newTourId123",
   10   "reason": "Customer requested date and tour change"
   11 }

  This gives admins comprehensive control over booking details while keeping customer modifications secure through admin-only access.