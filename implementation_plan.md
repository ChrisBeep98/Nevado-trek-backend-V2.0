# Implementation Plan - Data Structure Enhancements

## Goal Description
Update the `Tour` and `Booking` data models to include new fields requested by the user. This includes comprehensive validation for the new Tour fields (FAQs, recommendations, etc.) and stricter validation for Booking customer details (phone format, alphanumeric document).

## User Review Required
> [!IMPORTANT]
> **Breaking Change**: Creating a new Tour will now REQUIRE all the new fields.
> **Validation Update**: Phone numbers MUST start with `+`.

## Proposed Changes

### Middleware

#### [MODIFY] [validation.js](file:///d:/Nevado%20Trek%20Development/nevado-trek-backend/functions/src/middleware/validation.js)
-   **`validateTour`**:
    -   Add validation for `totalDays` (number).
    -   Add validation for `difficulty` (string).
    -   Add validation for `temperature` (number).
    -   Add validation for `distance` (number).
    -   Add validation for `location` { es, en }.
    -   Add validation for `faqs` (Array of { question: {es,en}, answer: {es,en} }).
    -   Add validation for `recommendations` (Array of { es, en }).
    -   Add validation for `inclusions` (Array of { es, en }).
    -   Add validation for `exclusions` (Array of { es, en }).
-   **`validateBooking`**:
    -   Update `phone` validation: Must start with `+`.
    -   Update `document` validation: Allow alphanumeric (already implicitly allowed as string, but will ensure no strict numeric regex is applied).
    -   Allow optional `note` field in `customer` object.

### Tests

#### [MODIFY] [test_deployed_endpoints.js](file:///d:/Nevado%20Trek%20Development/nevado-trek-backend/test_deployed_endpoints.js)
-   Update "Create Tour" payload with valid dummy data for all new fields.
-   Update "Create Booking" payload with a valid international phone number (e.g., `+1234567890`).

## Verification Plan

### Automated Tests
-   Run `node test_deployed_endpoints.js` against the deployed environment.
-   Verify that creating a tour with the new fields succeeds.
-   Verify that creating a booking with the new phone format succeeds.

### Manual Verification
-   I will use the updated `test_deployed_endpoints.js` as the primary verification method.
