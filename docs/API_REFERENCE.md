# Nevado Trek Backend - API Reference V2.0

> [!NOTE]
> **Base URL**: `https://api-wgfhwjbpva-uc.a.run.app`
> **Auth Header**: `X-Admin-Secret-Key` (Required for Admin routes)

## 🔐 Admin Endpoints
**Authentication Required**

### Tours Management

#### Create Tour
*   **Method**: `POST`
*   **URL**: `/admin/tours`
*   **Body**:
    ```json
    {
      "name": { "en": "Tour Name", "es": "Nombre Tour" },
      "pricingTiers": [ ... ],
      "type": "multi-day",
      "totalDays": 3,
      "difficulty": "Medium",
      "altitude": { "en": "3000m", "es": "3000m" },
      "temperature": 15,
      "distance": 20,
      "location": { "en": "Nevado", "es": "Nevado" },
      "faqs": [],
      "recommendations": [],
      "inclusions": [],
      "exclusions": []
    }
    ```

#### Get All Tours
*   **Method**: `GET`
*   **URL**: `/admin/tours`
*   **Description**: Lists all tours, including inactive ones.

#### Update Tour
*   **Method**: `PUT`
*   **URL**: `/admin/tours/:id`
*   **Description**: Updates tour details. Increments version. Does **not** affect existing departures.

#### Delete Tour
*   **Method**: `DELETE`
*   **URL**: `/admin/tours/:id`
*   **Description**: Soft deletes the tour (`isActive: false`).

---

### Departures Management

#### Create Departure
*   **Method**: `POST`
*   **URL**: `/admin/departures`
*   **Body**:
    ```json
    {
      "tourId": "TOUR_ID",
      "date": "2025-12-25",
      "type": "public", // or "private"
      "maxPax": 8 // Optional override
    }
    ```

#### Get Calendar
*   **Method**: `GET`
*   **URL**: `/admin/departures?start=2025-01-01&end=2025-01-31`

#### Update Departure
*   **Method**: `PUT`
*   **URL**: `/admin/departures/:id`
*   **Body**: `{ "date": "2025-12-26" }`
*   **Effect**: Moves all linked bookings to the new date automatically.

#### Split Departure
*   **Method**: `POST`
*   **URL**: `/admin/departures/:id/split`
*   **Body**: `{ "bookingId": "BOOKING_ID" }`
*   **Effect**: Creates a new Private Departure for the specified booking and removes it from the original.

#### Delete Departure
*   **Method**: `DELETE`
*   **URL**: `/admin/departures/:id`
*   **Condition**: Only allowed if `currentPax` is 0.

---

### Bookings Management

#### Create Booking (Admin)
*   **Method**: `POST`
*   **URL**: `/admin/bookings`
*   **Description**: **ALWAYS** creates a new departure.
*   **Body**:
    ```json
    {
      "tourId": "TOUR_ID",
      "date": "2025-12-25",
      "pax": 2,
      "type": "private", // or "public"
      "customer": {
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+1234567890",
        "document": "123456789"
      }
    }
    ```

#### Update Status
*   **Method**: `PUT`
*   **URL**: `/admin/bookings/:id/status`
*   **Body**: `{ "status": "cancelled" }`
*   **Effect**: Updates departure capacity.

#### Update Pax
*   **Method**: `PUT`
*   **URL**: `/admin/bookings/:id/pax`
*   **Body**: `{ "pax": 4 }`
*   **Effect**: Updates departure capacity and recalculates price (preserving discount).

#### Update Details
*   **Method**: `PUT`
*   **URL**: `/admin/bookings/:id/details`
*   **Body**: `{ "customer": { ... } }`

#### Apply Discount
*   **Method**: `POST`
*   **URL**: `/admin/bookings/:id/discount`
*   **Body**: `{ "discountAmount": 50000, "reason": "Loyalty" }`

#### Move Booking
*   **Method**: `POST`
*   **URL**: `/admin/bookings/:id/move`
*   **Body**: `{ "newTourId": "ID", "newDate": "2025-12-30" }`

#### Convert Type
*   **Method**: `POST`
*   **URL**: `/admin/bookings/:id/convert-type`
*   **Body**: `{ "targetType": "public" }`

---

### Dashboard

#### Get Stats
*   **Method**: `GET`
*   **URL**: `/admin/stats`

---

## 🌍 Public Endpoints
**No Authentication Required**

#### Get Active Tours
*   **Method**: `GET`
*   **URL**: `/public/tours`

#### Get Open Departures
*   **Method**: `GET`
*   **URL**: `/public/departures`
*   **Description**: Lists future public departures with available space.

#### Join Public Departure
*   **Method**: `POST`
*   **URL**: `/public/bookings/join`
*   **Body**:
    ```json
    {
      "departureId": "DEP_ID",
      "tourId": "TOUR_ID",
      "date": "2025-12-25",
      "pax": 2,
      "customer": { ... }
    }
    ```

#### Create Private Request
*   **Method**: `POST`
*   **URL**: `/public/bookings/private`
*   **Body**: Same as Create Booking, but always creates Private Departure.
