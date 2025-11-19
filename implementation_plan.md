# Implementation Plan - Booking & Departure Logic Refinement

## Goal Description
Refine the booking and departure logic to strictly follow user requirements:
1.  **Admin Booking Creation**: Must explicitly choose to create a NEW departure (Private/Public) or join an existing one. The current "auto-join" logic is incorrect for Admin.
2.  **Public Endpoints**: Separate "Create Private Booking" (creates new Private Departure) from "Join Public Departure" (joins existing).
3.  **Departure Type Switching**:
    *   **Booking Public -> Private**: Split a booking from a shared departure into a NEW private departure.
    *   **Departure Private -> Public**: Open a private departure to be public (allow more bookings).
    *   **Departure Public -> Private**: Close a public departure (with multiple bookings) to become private (keep existing bookings, stop new joins).
4.  **Fix Cascade Gaps**: Implement `cancelBooking` and `updateBooking` (pax change) with proper capacity updates.

## User Review Required
> [!IMPORTANT]
> **Admin Booking Flow Change**: Admin `createBooking` will now require a flag (e.g., `forceNewDeparture: true`) or we will split it into `createBookingWithNewDeparture` and `addToDeparture`. For simplicity, we will add `createNewDeparture` (boolean) to the request body. If true, it IGNORES existing departures and creates a new one.

> [!IMPORTANT]
> **Public API Split**: We will have:
> *   `POST /public/bookings/private`: Creates booking + NEW Private Departure.
> *   `POST /public/bookings/join`: Requires `departureId`. Joins existing Public Departure.

## Proposed Changes

### Controllers

#### [MODIFY] [bookings.controller.js](file:///d:/Nevado%20Trek%20Development/nevado-trek-backend/functions/src/controllers/bookings.controller.js)
-   **Update `createBooking`**:
    -   Add logic: If `createNewDeparture` is true (or implied by endpoint), skip search and create new.
    -   If `departureId` is provided, try to join that specific departure.
-   **Refactor `updateBooking`**: Split into specific endpoints to ensure data integrity and cascade handling:
    -   `updateBookingStatus`: Handles cancellation (restores capacity) and other status changes.
    -   `updateBookingPax`: Handles pax changes (checks capacity, updates departure `currentPax`).
    -   `updateBookingPrice`: (Already exists as `applyDiscount`, but will standardize).
    -   `updateBookingDetails`: Updates customer info only (no cascade needed).


#### [MODIFY] [departures.controller.js](file:///d:/Nevado%20Trek%20Development/nevado-trek-backend/functions/src/controllers/departures.controller.js)
-   **Update `updateDeparture`**:
    -   **Private -> Public**: Already exists, verify logic.
    -   **Public -> Private**: Add logic to allow this even if multiple bookings exist (just sets type to Private, effectively closing it).
-   **Verify `splitDeparture`**: Ensure it covers "Booking Public -> Private" case (it does).

### Routes

#### [MODIFY] [index.js](file:///d:/Nevado%20Trek%20Development/nevado-trek-backend/functions/index.js)
-   **Admin Routes**:
    -   `PUT /admin/bookings/:id/status` -> `bookingsController.updateBookingStatus`
    -   `PUT /admin/bookings/:id/pax` -> `bookingsController.updateBookingPax`
    -   `PUT /admin/bookings/:id/details` -> `bookingsController.updateBookingDetails`
    -   (Keep `discount` and `move` as they are specific actions)
-   **Public Routes**:
    -   `POST /public/bookings/private` -> `bookingsController.createPrivateBooking` (Wrapper around create)
    -   `POST /public/bookings/join` -> `bookingsController.joinBooking` (Wrapper around create)

## Verification Plan

### Automated Tests
-   Run `test_full_endpoints.js` (will need updates to match new API structure).
-   Create new test `test_logic_refinement.js` to verify:
    -   Admin creating new Public Departure (0 pax) vs joining.
    -   Public user creating Private trip.
    -   Public user joining specific Departure.
    -   Switching Departure Public -> Private with 3 bookings.
    -   Cancelling booking updates capacity.
