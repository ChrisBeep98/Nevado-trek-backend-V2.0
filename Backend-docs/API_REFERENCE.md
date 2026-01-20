# API Reference - Nevado Trek Backend V2.7.5

## Base URL
- **Production (LIVE)**: `https://api-wgfhwjbpva-uc.a.run.app` (Project: `nevadotrektest01`)
- **Staging**: `https://us-central1-nevado-trek-backend-03.cloudfunctions.net/api` (Project: `nevado-trek-backend-03`)

## Authentication
All admin endpoints require the `X-Admin-Secret-Key` header. Keys differ by environment:
- **Production**: `ntk_admin_prod_key_...` (See Secret Manager)
- **Staging**: `ntk_admin_staging_key_2026_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7`

## Date Handling (Timezones)
⚠️ **CRITICAL RULE**: All dates sent to the API must be parsed to **Noon UTC** (12:00 PM UTC) to avoid timezone shifts.
- **Input**: Use the utility `parseToNoonUTC(dateString)` (or equivalent logic) before sending updates.
- **Reason**: Clients in UTC-5 (Colombia) sending midnight dates often result in the previous day in UTC. Setting the time to 12:00 UTC ensures the date remains correct regardless of western hemisphere offsets.
- **Output**: Most date fields are returned as **ISO Strings** for standard frontend processing.

---

## Admin Endpoints (20)

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

### Bookings (9 endpoints)

#### GET /admin/bookings
List all bookings with optional filtering.
- **Query**: `?departureId=string`
- **Response**: `{ bookings: Booking[] }`

#### GET /admin/bookings/:id
Get a specific booking by ID.
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

#### POST /admin/bookings/join ⭐ NEW (v2.5)
Admin joins a customer to an existing public departure.
- **Body**: 
  ```json
  {
    "departureId": "string",
    "customer": { ... },
    "pax": number
  }
  ```
- **Response**: `{ success: true, bookingId: string, departureId: string }`
- **Logic**: Validates capacity and public status.

#### PUT /admin/bookings/:id/status
Update booking status.
- **Body**: `{ status: "pending" | "confirmed" | "paid" | "cancelled" }`
- **Response**: `{ message: "Status updated", booking: Booking }`
- **Side Effect**: Updates `currentPax` on departure (with safeguard to prevent negative values)
- **CRITICAL**: Cancellation is **irreversible**.

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
- **Body**: `{ discountAmount?: number, newFinalPrice?: number, reason: string }`
- **Response**: `{ message: "Discount applied", booking: Booking }`

#### POST /admin/bookings/:id/move
Move booking to a different departure.
- **Body**: `{ newTourId: string, newDate: string }` (creates/finds target departure)
- **Response**: `{ message: "Booking moved", booking: Booking }`
- **Side Effects**: 
  - Atomically updates `currentPax` on both old and new departures
  - **Auto-cleanup**: If old departure becomes empty (`currentPax = 0`), it is automatically deleted

#### POST /admin/bookings/:id/convert-type
Convert booking type (and potentially split/join departure).
- **Body**: `{ targetType: "public" | "private" }`
- **Response**: `{ message: "Type converted", booking: Booking, newDepartureId?: string }`
- **Logic**: 
  - **Private→Public**: Validates max 8 pax, joins existing public departure or creates new one
  - **Public→Private**: Splits booking to new private departure if multiple bookings exist
- **Auto-cleanup**: 
  - If source departure becomes empty after conversion, it is automatically deleted

---

### Stats (1 endpoint)

#### GET /admin/stats
Get dashboard statistics.
- **Response**: 
  ```json
  {
    "totalActiveBookings": number,
    "upcomingDeparturesCount": number,
    "next7Days": number,
    "timestamp": "ISO Date String"
  }
  ```

---

## Public Endpoints (4)

### Tours (2 endpoints)

#### GET /public/tours
List all active tours (Full details).
- **Response**: `{ tours: Tour[] }` (only `isActive: true`)

#### GET /public/tours/listing
List all active tours (Lightweight).
- **Purpose**: Optimized for listing pages/cards.
- **Payload Reduction**: ~65% smaller than `/public/tours`.
- **Response**: `TourListing[]`
- **Fields included**: `tourId`, `name`, `shortDescription`, `altitude`, `difficulty`, `totalDays`, `pricingTiers`, `images` (First one only), `isActive`.

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
    "customer": { ... },
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

#### GET /public/bookings/:id
Check booking status (polling endpoint for Payment Gateway).
- **Response**: 
  ```json
  {
    "bookingId": "string",
    "status": "pending" | "confirmed" | "cancelled",
    "paymentStatus": "pending" | "approved" | "rejected" | "expired" | "voided",
    "paymentRef": "string"
  }
  ```
- **Mapping (paymentStatus)**:
  - `approved`: Payment successful (Bold SALE_APPROVED).
  - `rejected`: Payment declined (Bold SALE_REJECTED or SALE_FAILED).
  - `expired`: User failed to complete payment in time (Bold SALE_EXPIRED).
  - `voided`: Transaction was voided (Bold VOID_APPROVED).
- **Privacy**: **NO PII returned**. Only status fields and reference.
- **Security**: Publicly accessible (no rate limit for polling).

### Payments (1 endpoint)

#### POST /public/payments/init
Initialize a payment with Bold (Smart Link API).
- **Body**: `{ bookingId: "string" }`
- **Response**: 
  ```json
  {
    "paymentUrl": "https://checkout.bold.co/payment/LNK_XXXX",
    "paymentReference": "LNK_XXXX",
    "amount": number,
    "currency": "COP",
    "description": "string"
  }
  ```
- **Logic**: Creates a server-to-server payment link via Bold's API. This link is hosted by Bold, ensuring all payment methods (Credit Cards, PSE) are correctly displayed.
- **Frontend Action**: The frontend should perform a redirect to `paymentUrl`.

#### POST /public/payments/webhook
Bold Webhook endpoint for automated payment notifications.
- **Payload**: Standard Bold Webhook JSON (CloudEvents format).
- **Logic**: 
  - Extracts `bookingId` from the internal reference logic.
  - Updates `paymentInfo` object in Firestore with status and **amount paid**.
  - Sets main booking `status` to `"paid"` upon success.
  - Sends comprehensive alerts to Telegram (Approved, Rejected, Expired, Voided).

---

## Recent Changes

### January 19, 2026 - Production Release (v2.7.5)
- 🚀 **Live Deployment**: System updated to production environment.
- 💳 **Universal Payments**: Smart Links integration enabled for all production bookings.
- 🔐 **Credentials**: Production keys configured.

### January 19, 2026 - Bold Smart Links (v2.7.5)
- 💳 **Smart Links**: Replaced widget signature logic with server-to-server Bold API calls (`/online/link/v1`).
- 🔐 **Reliability**: Guarantees Credit Card availability by using Bold's hosted checkout.
- 📉 **Deposit Logic**: Automatically calculates 30% Deposit + 5% Fee for the link amount.
- 🔔 **Notifications**: Enhanced Telegram alerts for all payment states (Success, Fail, Expire).

---

## Endpoint Summary

| Category | Admin | Public | Total |
|----------|-------|--------|-------|
| Tours | 5 | 2 | 7 |
| Departures | 7 | 1 | 8 |
| Bookings | 9 | 3 | 12 |
| Payments | 0 | 2 | 2 |
| Stats | 1 | 0 | 1 |
| **Total** | **22** | **8** | **30** |

**Status**: ✅ All endpoints operational (100%)

---

**Document Version**: 2.7.5  
**Last Updated**: January 19, 2026  
**Status**: ✅ LIVE (Production)