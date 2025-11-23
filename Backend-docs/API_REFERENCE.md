# API Reference - Nevado Trek Backend V2.0

## Base URL
**Production**: `https://api-wgfhwjbpva-uc.a.run.app`

## Authentication
All admin endpoints require the `X-Admin-Secret-Key` header:
```
X-Admin-Secret-Key: ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7
```

---

## Admin Endpoints (19)

### Tours (5 endpoints)

#### GET /admin/tours
List all tours.
- **Response**: `{ tours: Tour[] }`

#### POST /admin/tours
Create a new tour.
- **Body**: `Tour` object (without `tourId`, `createdAt`, `updatedAt`)
- **Response**: `{ tourId: string, tour: Tour }`

#### GET /admin/tours/:id
Get a specific tour.
- **Response**: `{ tour: Tour }`

#### PUT /admin/tours/:id
Update a tour.
- **Body**: Partial `Tour` object
- **Response**: `{ message: "Tour updated", tour: Tour }`

#### DELETE /admin/tours/:id
Delete a tour.
- **Response**: `{ message: "Tour deleted" }`

---

### Departures (7 endpoints)

#### GET /admin/departures
List all departures with optional date filtering.
- **Query**: `?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
- **Response**: `{ departures: Departure[] }`

#### GET /admin/departures/:id
Get a specific departure by ID.
- **Response**: `{ departure: Departure }`
- **Use Case**: Used by BookingModal to fetch departure data when displaying booking details
- **Date Format**: Returns date as ISO string for JSON compatibility

#### POST /admin/departures
Create a new departure.
- **Body**: 
  ```json
  {
    "tourId": "string",
    "date": "YYYY-MM-DD",
    "type": "public" | "private",
    "maxPax": number
  }
  ```
- **Response**: `{ departureId: string, departure: Departure }`

#### PUT /admin/departures/:id
Update a departure.
- **Body**: 
  ```json
  {
    "date"?: "YYYY-MM-DD",
    "maxPax"?: number,
    "status"?: "open" | "closed" | "completed" | "cancelled"
  }
  ```
- **Response**: `{ message: "Departure updated", departure: Departure }`

#### POST /admin/departures/:id/update-date
Update departure date (for Private bookings or all bookings in Public departure).
- **Body**: `{ newDate: "YYYY-MM-DD" }`
- **Response**: `{ message: "Departure date updated" }`
- **Use Case**: 
  - **Private**: Used from BookingModal to update date independently
  - **Public**: Updates date for ALL associated bookings (used from DepartureModal)

#### POST /admin/departures/:id/update-tour
Update departure tour and recalculate all booking prices.
- **Body**: `{ newTourId: "string" }`
- **Response**: `{ message: "Departure tour updated, all booking prices recalculated" }`
- **Side Effect**: Recalculates prices for all associated bookings based on new tour's pricing tiers
- **Use Case**:
  - **Private**: Used from BookingModal to update tour independently
  - **Public**: Updates tour for ALL associated bookings (used from DepartureModal)

#### DELETE /admin/departures/:id
Delete a departure (only if no bookings).
- **Response**: `{ message: "Departure deleted" }`
- **Validation**: Returns error if any bookings exist

---

### Bookings (8 endpoints)

#### GET /admin/bookings
List all bookings with optional filtering.
- **Query**: `?departureId=string`
- **Response**: `{ bookings: Booking[] }`

#### GET /admin/bookings/:id
**NEW** - Get a specific booking by ID.
- **Response**: `{ booking: Booking }`
- **Use Case**: Used by BookingModal to fetch existing booking data

#### POST /admin/bookings
Create a new booking (always creates new departure).
- **Body**: 
  ```json
  {
    "tourId": "string",
    "date": "YYYY-MM-DD",
    "type": "public" | "private",
    "customer": {
      "name": "string",
      "email": "string",
      "phone": "+1234567890",
      "document": "string",
      "note"?: "string"
    },
    "pax": number
  }
  ```
- **Response**: `{ bookingId: string, departureId: string, booking: Booking }`

#### PUT /admin/bookings/:id/status
Update booking status.
- **Body**: `{ status: "pending" | "confirmed" | "paid" | "cancelled" }`
- **Response**: `{ message: "Status updated", booking: Booking }`
- **Side Effect**: Updates `currentPax` on departure (with safeguard to prevent negative values)

#### PUT /admin/bookings/:id/pax
Update booking pax count.
- **Body**: `{ pax: number }`
- **Response**: `{ message: "Pax updated", booking: Booking }`
- **Side Effect**: Updates `currentPax`, recalculates prices, preserves discount ratio

#### PUT /admin/bookings/:id/details
Update customer details.
- **Body**: Partial `customer` object
- **Response**: `{ message: "Details updated", booking: Booking }`

#### POST /admin/bookings/:id/discount
Apply a discount to a booking.
- **Body**: `{ discountAmount: number, discountReason: string }`
- **Response**: `{ message: "Discount applied", booking: Booking }`

#### POST /admin/bookings/:id/move
Move booking to a different departure.
- **Body**: `{ newTourId: string, newDate: string }` (creates/finds target departure)
- **Response**: `{ message: "Booking moved", booking: Booking }`
- **Side Effects**: 
  - Atomically updates `currentPax` on both old and new departures
  - **Auto-cleanup**: If old departure becomes empty (`currentPax = 0`), it is automatically deleted
- **Use Case**: Move booking between departures (e.g., change date/tour for private booking)

#### POST /admin/bookings/:id/convert-type
Convert booking type (and potentially split/join departure).
- **Body**: `{ targetType: "public" | "private" }`
- **Response**: `{ message: "Type converted", booking: Booking, newDepartureId?: string }`
- **Logic**: 
  - **Private→Public**: Validates max 8 pax, joins existing public departure or creates new one
  - **Public→Private**: Splits booking to new private departure if multiple bookings exist
- **Auto-cleanup**: 
  - If source departure becomes empty after conversion, it is automatically deleted
  - Prevents "ghost departures" (empty departures polluting the database)

---

### Stats (1 endpoint)

#### GET /admin/stats
Get dashboard statistics.
- **Response**: 
  ```json
  {
    "totalTours": number,
    "activeTours": number,
    "totalDepartures": number,
    "upcomingDepartures": number,
    "totalBookings": number,
    "confirmedBookings": number,
    "totalRevenue": number
  }
  ```

---

## Public Endpoints (4)

### Tours (1 endpoint)

#### GET /public/tours
List all active tours.
- **Response**: `{ tours: Tour[] }` (only `isActive: true`)

---

### Departures (1 endpoint)

#### GET /public/departures
List public departures with optional tour filtering.
- **Query**: `?tourId=string`
- **Response**: `{ departures: Departure[] }` (only `type: "public"` and `status: "open"`)

---

### Bookings (2 endpoints)

#### POST /public/bookings/join
Join an existing public departure.
- **Body**: 
  ```json
  {
    "departureId": "string",
    "customer": {
      "name": "string",
      "email": "string",
      "phone": "+1234567890",
      "document": "string",
      "note"?: "string"
    },
    "pax": number
  }
  ```
- **Response**: `{ bookingId: string, booking: Booking }`
- **Validation**: Checks capacity, public status, open status

#### POST /public/bookings/private
Request a new private departure.
- **Body**: Same as `/join` but without `departureId`
  ```json
  {
    "tourId": "string",
    "date": "YYYY-MM-DD",
    "customer": { ... },
    "pax": number
  }
  ```
- **Response**: `{ bookingId: string, departureId: string, booking: Booking }`
- **Side Effect**: Creates new private departure

---

## Recent Changes

### November 22, 2025 - Ghost Departure Fix \u0026 Logic Refinement
- ✅ **POST /admin/bookings/:id/move**: Updated to use `{newTourId, newDate}` instead of `newDepartureId`
  - Finds/creates target departure automatically
  - Implements ghost departure auto-cleanup
- ✅ **POST /admin/bookings/:id/convert-type**: Updated body to use `targetType` instead of `newType`
  - Implements ghost departure auto-cleanup for both directions
- ✅ **Ghost Departure Prevention**: All endpoints that modify departure occupancy now include:
  - Automatic deletion of departures when `currentPax` reaches 0
  - Prevents database pollution with empty departures
- ✅ **Comprehensive Testing**: 18/18 tests passing on both emulators and live production

### November 21, 2025 - Evening Update  
- ✅ **GET /admin/departures/:id**: Added endpoint to fetch single departure details
- ✅ **GET /admin/bookings/:id**: Added endpoint to fetch single booking details
- ✅ **POST /admin/departures/:id/update-date**: Clarified use cases for Public vs Private
- ✅ **POST /admin/departures/:id/update-tour**: Clarified use cases for Public vs Private
- ✅ **Negative Capacity Prevention**: Added `Math.max(0, ...)` safeguards

### Deployment
- ✅ All 26 endpoints deployed to production  
- ✅ Backend URL: `https://api-wgfhwjbpva-uc.a.run.app`
- ✅ Integration tests: 100% passing (18/18)

---

## Endpoint Summary

| Category | Admin | Public | Total |
|----------|-------|--------|-------|
| Tours | 5 | 1 | 6 |
| Departures | 8 | 1 | 9 |
| Bookings | 8 | 2 | 10 |
| Stats | 1 | 0 | 1 |
| **Total** | **22** | **4** | **26** |

**Status**: ✅ All endpoints operational (100%)

---

**Document Version**: 2.3.0  
**Last Updated**: November 22, 2025  
**Status**: ✅ All endpoints verified & documented  
**Next Review**: December 2025
