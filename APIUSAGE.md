# Admin Panel API Usage Guide

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Booking Management](#booking-management)
4. [Event Management](#event-management)
5. [Tour Management](#tour-management)
6. [Cross-Tour Transfer](#cross-tour-transfer)
7. [Workflow Examples](#workflow-examples)
8. [Error Handling](#error-handling)

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

**Multiple Events Per Date Support:** The `adminUpdateBookingDetails` endpoint now supports creating new events even when an event already exists for the same tour and date:

```json
{
  "startDate": "2025-12-25T00:00:00.000Z",
  "createNewEvent": true,
  "reason": "Creating separate private group for this booking"
}
```

When `createNewEvent` is set to `true`, a new event will be created for the specified date and tour, regardless of whether an event already exists for that date. This allows for multiple separate events for the same tour on the same date.

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

### 3. Transfer Booking Between Events (Same Tour)
`POST /adminTransferBooking/:bookingId`

Move a booking from one event to another within the same tour.

**Request Body:**
```json
{
  "destinationEventId": "string (required unless createNewEvent is true)",
  "createNewEvent": "boolean (optional, if true creates new event with booking parameters)",
  "newStartDate": "ISO date string (optional, used when createNewEvent is true, defaults to original event date)",
  "newMaxCapacity": "number (optional, used when createNewEvent is true, defaults to tour's max capacity or 8)",
  "newEventType": "private|public (optional, used when createNewEvent is true, defaults to 'private')",
  "reason": "string (optional)"
}
```

**Important Features:**
- **New Event Creation**: When `createNewEvent` is `true`, creates a new separate event for the same tour instead of using an existing event
- **Flexible Destination**: Can either specify a `destinationEventId` or let the system create a new event with `createNewEvent: true`
- **Custom Event Properties**: When creating new events, can specify capacity and type

**Example 1 - Transfer to existing event:**
```bash
curl -X POST "https://us-central1-nevadotrektest01.cloudfunctions.net/adminTransferBooking/qcWIadNTt0PcinNTjGxu" \
  -H "X-Admin-Secret-Key: YOUR_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "destinationEventId": "newEventId123",
    "reason": "Customer requested date change"
  }'
```

**Example 2 - Create new event during transfer:**
```bash
curl -X POST "https://us-central1-nevadotrektest01.cloudfunctions.net/adminTransferBooking/qcWIadNTt0PcinNTjGxu" \
  -H "X-Admin-Secret-Key: YOUR_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "createNewEvent": true,
    "newStartDate": "2025-12-25T00:00:00.000Z", 
    "newMaxCapacity": 6,
    "newEventType": "private",
    "reason": "Moving to new private group"
  }'
```

### 4. Transfer Booking Between Tours (Cross-Tour Transfer) NEW!
`POST /adminTransferToNewTour/:bookingId`

Move a booking from one tour to another tour, with optional new date. This endpoint handles all necessary operations including creating new events if needed, preserving customer details, adjusting capacity, and maintaining audit trails.

**Request Body:**
```json
{
  "newTourId": "string (required)",
  "newStartDate": "ISO date string (optional, defaults to original date)",
  "reason": "string (optional)"
}
```

**Detailed Behavior:**
- Creates a new event on the destination tour if one doesn't already exist for the target date
- Creates a new booking on the destination tour with the same customer details as the original booking
- Cancels the original booking with a reference to the new booking in the status history
- Adjusts capacity on both the original and destination events
- Uses pricing from the destination tour for the new booking
- Maintains the same booking status as the original booking
- Creates a complete audit trail of the transfer operation

**Example:**
```bash
curl -X POST "https://us-central1-nevadotrektest01.cloudfunctions.net/adminTransferToNewTour/qcWIadNTt0PcinNTjGxu" \
  -H "X-Admin-Secret-Key: YOUR_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "newTourId": "newTourId123",
    "newStartDate": "2025-12-25T00:00:00.000Z",
    "reason": "Customer requested to switch tours"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Reserva transferida exitosamente a nuevo tour",
  "originalBookingId": "qcWIadNTt0PcinNTjGxu",
  "newBookingId": "newlyCreatedBookingId123",
  "newBookingReference": "BK-YYYYMMDD-XXX",
  "cancelledBookingStatus": "cancelled_by_admin",
  "pax": 2,
  "reason": "Customer requested to switch tours"
}
```

**Important Notes:**
- The destination tour must exist and be active
- The destination event must have sufficient capacity for the booking's pax count
- If no newStartDate is provided, the original booking's event date is used
- The original booking is cancelled with status "cancelled_by_admin"
- A new booking is created on the destination tour with the same customer details
- The new booking receives a new reference code
- Both events (original and destination) have their capacity adjusted accordingly
- The new booking uses pricing from the destination tour
- All operations happen within a Firestore transaction to ensure data consistency

### 5. Get Bookings with Filters
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

### 6. Admin Create Booking (NEW!)
`POST /adminCreateBooking`

Create a new booking directly as an admin, without rate limiting. This endpoint has the same functionality as the public createBooking endpoint but is available to admins without rate limiting and allows specifying an initial booking status.

**Request Body:**
```json
{
  "tourId": "string (required)",
  "startDate": "ISO date string (required)",
  "customer": {
    "fullName": "string (required)",
    "documentId": "string (required)",
    "phone": "string (required)",
    "email": "string (required)",
    "notes": "string (optional)"
  },
  "pax": "number (required)",
  "status": "pending|confirmed|paid|cancelled|cancelled_by_admin (optional, defaults to 'pending')",
  "createNewEvent": "boolean (optional, if true creates new event even if one exists for same date and tour)"
}
```

**Important Features:**
- **No Rate Limiting**: Unlike the public booking endpoint, this endpoint has no rate limiting for admins
- **Initial Status**: Can specify the initial booking status instead of defaulting to 'pending'
- **New Event Creation**: Uses the `createNewEvent` flag to create a separate event even if one already exists for the same date and tour

**Example:**
```bash
curl -X POST "https://us-central1-nevadotrektest01.cloudfunctions.net/adminCreateBooking" \
  -H "X-Admin-Secret-Key: YOUR_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "tourId": "tourId123",
    "startDate": "2025-12-25T00:00:00.000Z",
    "customer": {
      "fullName": "Admin Created Customer",
      "documentId": "123456789",
      "phone": "+573123456789",
      "email": "admin-customer@example.com"
    },
    "pax": 4,
    "status": "confirmed",
    "createNewEvent": true
  }'
```

### 7. Date Change Tracking
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

### 3. Create Event Independently (NEW!)
`POST /adminCreateEvent`

Create a new event independently of any booking, allowing admins to prepare events in advance with specific capacity and visibility settings.

**Request Body:**
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

**Example:**
```bash
curl -X POST "https://us-central1-nevadotrektest01.cloudfunctions.net/adminCreateEvent" \
  -H "X-Admin-Secret-Key: YOUR_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "tourId": "tourId123",
    "startDate": "2025-12-25T00:00:00.000Z",
    "maxCapacity": 6,
    "type": "private",
    "notes": "Special private group"
  }'
```

### 4. Get Events by Date (NEW!)
`GET /adminGetEventsByDate/:tourId/:date`

Retrieve all events for a specific tour on a specific date. This endpoint is particularly useful when managing multiple events per date for the same tour.

**URL Parameters:**
- `tourId`: The ID of the tour
- `date`: The date in YYYY-MM-DD format

**Example:**
```bash
curl -X GET "https://us-central1-nevadotrektest01.cloudfunctions.net/adminGetEventsByDate/tourId123/2025-12-25" \
  -H "X-Admin-Secret-Key: YOUR_ADMIN_KEY"
```

### 5. Split Event (NEW!)
`POST /adminSplitEvent/:eventId`

Split a single event into multiple events by moving selected bookings to a new event. This allows admins to separate groups within a larger event.

**Request Body:**
```json
{
  "bookingIds": "array of booking IDs to move to new event (required)",
  "newEventMaxCapacity": "number (optional, defaults to original capacity)",
  "newEventType": "private|public (optional, defaults to original type)",
  "reason": "string (optional)"
}
```

**Example:**
```bash
curl -X POST "https://us-central1-nevadotrektest01.cloudfunctions.net/adminSplitEvent/eventId123" \
  -H "X-Admin-Secret-Key: YOUR_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingIds": ["bookingId456", "bookingId789"],
    "newEventMaxCapacity": 4,
    "newEventType": "private",
    "reason": "Separating into smaller groups for better experience"
  }'
```

## Multiple Events Per Date Support

### Overview
The system now supports multiple events for the same tour on the same date, providing greater operational flexibility:

1. **Creating Separate Events**: Use the `createNewEvent` parameter when updating booking details
2. **Transferring to New Events**: Use the `createNewEvent` parameter in transfer operations
3. **Direct Event Creation**: Create events independently using `adminCreateEvent`
4. **Event Splitting**: Separate existing events using `adminSplitEvent`

### Using Multiple Events in Booking Updates
When updating booking details via `PUT /adminUpdateBookingDetails/:bookingId`, you can now create a new event for the same date and tour:

```json
{
  "startDate": "2025-12-25T00:00:00.000Z",
  "createNewEvent": true,
  "reason": "Creating separate group for this booking"
}
```

### Using Multiple Events in Booking Transfers
When transferring bookings via `POST /adminTransferBooking/:bookingId`, you can now create a new event:

```json
{
  "createNewEvent": true,
  "newStartDate": "2025-12-25T00:00:00.000Z", 
  "newMaxCapacity": 6,
  "newEventType": "private",
  "reason": "Moving to new private group"
}
```

This will create a new event for the same tour on the specified date and transfer the booking to it.

## Tour Management

### 1. Create, Update, Delete Tours
- `POST /adminCreateTourV2` - Create new tour
- `PUT /adminUpdateTourV2/:tourId` - Update existing tour  
- `DELETE /adminDeleteTourV2/:tourId` - Logically delete tour

## Cross-Tour Transfer

### Complete Workflow for Cross-Tour Transfers

The new `POST /adminTransferToNewTour/:bookingId` endpoint provides complete functionality for moving bookings between different tours. Here's the complete workflow:

1. **Validation**: The system validates that:
   - The original booking exists and is not already cancelled
   - The destination tour exists and is active
   - The destination event has sufficient capacity

2. **Event Creation**: If no event exists on the destination tour for the target date, one is automatically created as a private event

3. **Pricing Calculation**: The system calculates the booking price based on the destination tour's pricing tiers

4. **Booking Creation**: A new booking is created on the destination tour with the same customer details

5. **Original Booking Cancellation**: The original booking is cancelled with status "cancelled_by_admin" and includes a reference to the new booking

6. **Capacity Management**: Capacity is reduced on the original event and increased on the destination event

7. **Audit Trail**: Complete audit trail is maintained with references to both bookings

### Use Cases for Cross-Tour Transfer

1. **Customer Request**: Customer wants to switch from one tour to another (e.g., from "Nevado del Tolima" to "Tour al Páramo")
2. **Tour Availability**: Original tour date is no longer available, but the same tour is available on a different date
3. **Group Changes**: Customer wants to join a different tour instead of their original booking
4. **Operational Needs**: Admin needs to consolidate bookings or manage capacity across different tours

### Important Considerations

- **Pricing**: The new booking will be priced according to the destination tour's pricing tiers
- **Capacity**: The destination event must have enough available slots for the booking's pax count
- **Dates**: The transfer can happen on the same date or a different date
- **Customer Details**: All customer information is preserved from the original booking
- **Booking Reference**: A new booking reference is generated for the new booking
- **Audit Trail**: Both the original and new bookings maintain complete audit trails

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

### Example 3: Cross-Tour Transfer (NEW FUNCTIONALITY)
1. Booking exists on one tour (e.g., "Nevado del Tolima")
2. Customer wants to switch to a different tour (e.g., "Tour al Páramo")
3. Use the new endpoint to transfer between tours

```javascript
curl -X POST "https://us-central1-nevadotrektest01.cloudfunctions.net/adminTransferToNewTour/bookingId123" \
  -H "X-Admin-Secret-Key: YOUR_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "newTourId": "destinationTourId456",
    "newStartDate": "2025-12-25T00:00:00.000Z",
    "reason": "Customer requested to switch to different tour"
  }'
```

The system will:
1. Validate the destination tour exists and is active
2. Find or create an event for the destination tour on the specified date
3. Create a new booking on the destination tour with the same customer details
4. Cancel the original booking with a reference to the new booking
5. Adjust capacity on both events accordingly
6. Return details about both the original and new bookings

### Example 4: Updating Customer Information and Booking Details
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

### Example 5: Updating Booking Date (Moving Between Events of Same Tour)
When updating the startDate via adminUpdateBookingDetails, the booking is automatically moved to a new event for that date on the same tour, with capacity adjustments handled automatically:

```javascript
// Move a booking to a new date on the same tour - this creates or finds an event for the new date
// and moves the booking between events while maintaining capacity
curl -X PUT "https://us-central1-nevadotrektest01.cloudfunctions.net/adminUpdateBookingDetails/bookingId123" \
  -H "X-Admin-Secret-Key: YOUR_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2025-12-25T00:00:00.000Z",
    "reason": "Customer requested date change"
  }'

// The system will:
// 1. Find or create an event for the same tour on 2025-12-25
// 2. Move the booking to that event (changing eventId)
// 3. Reduce capacity on old event by the booking's pax count
// 4. Increase capacity on new event by the booking's pax count
// 5. Track this transition in the booking's previousStates field
```

### Example 6: Updating Status and Customer Info Together
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
8. **Date changes move bookings between events of the same tour** - When updating a booking's startDate via adminUpdateBookingDetails, the booking is moved to a new event for that date on the same tour, with capacity automatically adjusted between old and new events
9. **Cross-tour transfers** - NEW: The adminTransferToNewTour endpoint allows moving bookings between different tours with all necessary operations handled automatically

## Important Date Handling Information for Frontend Developers

### Understanding Booking Dates

There are multiple date-related fields in a booking document, and it's crucial to understand how they work to avoid confusion:

#### 1. Booking vs Event Date Concept
- **bookingDate**: When the reservation was originally made (immutable, for historical tracking)
- **Event Date**: When the tour actually takes place (this is the date that matters for the customer experience)

#### 2. How Date Changes Work 
When updating a booking's date via `PUT /adminUpdateBookingDetails`, the system:
- **Moves** the booking to a **new event** for the requested date (on the same tour)
- **Updates** the booking's `startDate` field to match the new event's date
- **Changes** the `eventId` field to point to the new event
- **Updates** capacity on both the old and new events
- **Tracks** the change in the booking's `previousStates` field

#### 3. Cross-Tour Date Changes
When using the new `POST /adminTransferToNewTour` endpoint:
- **Moves** the booking to a **new tour and new event** for the requested date (or original date)
- **Creates** a completely new booking on the destination tour
- **Cancels** the original booking
- **Calculates** new pricing based on the destination tour's pricing tiers
- **Adjusts** capacity on both original and destination events

#### 4. Timezone Handling
The system now properly handles timezone conversions for tour dates:
- **Date-only format** (e.g., "2025-12-31"): Interpreted as the beginning of that day in Colombia timezone (UTC-5)
- **ISO format with 'Z'** (e.g., "2025-12-31T00:00:00.000Z"): Interpreted as the specific moment in UTC
- **Display**: Dates are displayed consistently in the Colombia timezone

#### 5. Getting the Correct Tour Date
To get the actual tour date, you can rely on either field as they are now synchronized:

**For Admin Endpoints** (booking with all details):
1. Get the booking document
2. Use either the `startDate` field in the booking OR query the event document via `eventId`
3. Both will provide the correct tour date

**For Public Check Endpoint**:
1. The `/checkBooking` endpoint returns the correct date synchronized with the associated event

#### 6. Database Structure
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

#### 7. Frontend Implementation Recommendation
When displaying tour dates to users, you can now use either the booking's startDate or the event date - both will be consistent:
```
// Option 1: Get date directly from booking (now synchronized)
const booking = await getBooking(bookingId); 
const tourDate = booking.startDate; // This will be the correct date

// Option 2: Get date from associated event
const event = await getEvent(booking.eventId); 
const tourDate = event.startDate; // This will be the same date
```

#### 8. Date Format Recommendations
- **For admin operations**: Use date-only format (e.g., "2025-12-31") for local date interpretation
- **For API operations**: Both date-only and ISO formats are supported
- **For display**: Dates will show consistently in Colombia timezone

#### 9. Legacy Data Handling
All new date changes are properly synchronized between booking and event documents. Previously existing bookings may have been fixed during date updates to ensure consistency.

This API allows comprehensive management of the booking system while maintaining data integrity, audit compliance, and proper timezone handling.

The new cross-tour transfer functionality (adminTransferToNewTour) expands the system's capabilities to allow complete flexibility in moving bookings between different tours, with all necessary operations handled automatically including event creation, capacity management, and audit trail maintenance.