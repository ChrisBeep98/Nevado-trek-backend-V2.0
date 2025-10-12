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

Update core booking information while maintaining audit trail.

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
    "pax": 4,
    "reason": "Customer requested additional participants"
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

Retrieve bookings with various filtering options.

**Query Parameters:**
- `status` - Filter by booking status
- `tourId` - Filter by tour ID
- `startDateFrom` - Filter by booking date from
- `startDateTo` - Filter by booking date to
- `customerName` - Filter by customer full name
- `limit` - Number of results per page (default: 50, max: 200)
- `offset` - Number of results to skip

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

This API allows comprehensive management of the booking system while maintaining data integrity and audit compliance.