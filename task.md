# Task Plan for Nevado Trek Backend Improvements

## Project Context

This is the Nevado Trek Backend, a comprehensive reservation system for adventure tour management built with Firebase Cloud Functions. The system currently handles booking management, tour management, event management, and has both customer-facing and admin-facing endpoints.

## Current Architecture

- **Backend Framework**: Firebase Cloud Functions (Node.js 22)
- **Database**: Google Cloud Firestore (NoSQL)
- **Authentication**: Secret key headers (X-Admin-Secret-Key)
- **Runtime Environment**: Google Cloud Run (2nd Gen)
- **SDKs**: Firebase Admin SDK, Firebase Functions SDK

## Identified Issues and Required Improvements

### 1. Event Creation Logic Issue
**Problem**: The system currently assumes there's only one event per tour per date. When a booking is made for a date that already has an event for the same tour, the system automatically joins the existing event instead of creating a new separate event if desired.

**Root Cause**: The event lookup logic in `adminUpdateBookingDetails` and `createBooking` functions uses a query that finds any existing event for a tour on a given date and joins it, without options for creating separate events.

### 2. Lack of Multiple Events Per Date Support
**Problem**: The system does not support multiple events for the same tour on the same date, limiting operational flexibility.

**Impact**: 
- Cannot run multiple separate groups for the same tour on the same date
- Customers expecting private tours may end up in public groups
- No way to accommodate different group sizes or special requests on the same date

### 3. No Direct Event Creation API
**Problem**: There's no endpoint to create events independently of bookings.

**Impact**: 
- Cannot create events in advance with specific capacity or visibility settings
- No way to prepare events before getting the first booking

### 4. Missing Admin Tools for Event Management
**Problem**: No admin interface or API to:
- Create separate events for the same tour on the same date
- Split existing bookings into separate events
- Manage multiple events per date

### 5. Visibility Change Implications
**Problem**: When an event changes from private to public, existing customers may be unaware they'll be sharing the tour with others.

**Impact**: 
- Customer experience issues
- Privacy expectation mismatches

## Required Changes

### Phase 1: Modify Event Creation Logic
1. **Update `adminUpdateBookingDetails` function** in `functions/src/admin/booking-details.js`:
   - Add an optional parameter to specify whether to create a new event or join an existing one
   - Default behavior should still join existing events for backward compatibility
   - Add a flag like `createNewEvent: true` to force creation of a new event

2. **Update `createBooking` function** in `functions/index.js`:
   - Similar optional parameter to force creation of a new event
   - Allow creating new events even if one already exists for the same tour and date

3. **Update `joinEvent` function** in `functions/index.js`:
   - Consider how this change affects joining existing public events
   - Ensure existing functionality remains intact

### Phase 2: Add Direct Event Creation API
4. **Create new endpoint**: `adminCreateEvent`
   - `POST /adminCreateEvent` that allows admins to create events independently of bookings
   - Parameters: `tourId`, `startDate`, `maxCapacity`, `type` (private/public)
   - Returns new `eventId` for future bookings

### Phase 3: Enhance Event Transfer Capabilities
5. **Enhance `adminTransferBooking` function**:
   - Support transfers to new events of the same tour on the same date
   - Allow creation of new events during the transfer process

6. **Update `adminTransferToNewTour` function**:
   - Maintain existing functionality but ensure it works with the new multiple events per date capability

### Phase 4: Admin Event Management Tools
7. **Create `adminSplitEvent` endpoint**:
   - `POST /adminSplitEvent/:eventId` to split a single event into multiple events with selected bookings

8. **Create `adminGetEventsByDate` endpoint**:
   - `GET /adminGetEventsByDate/:tourId/:date` to get all events for a tour on a specific date

### Phase 5: Update Documentation and Error Handling
9. **Update API documentation** in `APIUSAGE.md`:
   - Document new endpoints and parameters
   - Update examples and workflow descriptions

10. **Add validation and error handling**:
    - For capacity limits when creating new events
    - For invalid date/tour combinations
    - For scenarios where capacity would be exceeded

## Implementation Plan

### Step 1: Database Schema Updates (if needed)
- Review if any additional fields are needed in the events collection to support multiple events per date
- Currently the schema looks sufficient but need to verify

### Step 2: Modify Core Functions
- Update the `booking-details.js` file to include new functionality
- Update the main `index.js` file with new endpoints
- Maintain backward compatibility

### Step 3: Add New Endpoints
- Create new functions in `index.js` for direct event management
- Implement the new API endpoints as per the requirements

### Step 4: Update Validation and Error Handling
- Add new validation functions for the new features
- Update error responses to be clear and informative

### Step 5: Testing
- Add unit tests for new functionality
- Test existing functionality still works
- Test edge cases and error conditions

## Technical Considerations
1. **Firestore Indexes**: Need to verify that existing indexes are adequate for the new query patterns
2. **Transaction Safety**: Maintain transactional integrity for all capacity and booking operations
3. **Backward Compatibility**: Changes should not break existing functionality
4. **Capacity Management**: Ensure capacity is properly managed across multiple events for the same tour on the same date
5. **Audit Trail**: Maintain proper audit trails for all event creation and modification operations

## Priority Order for Implementation

1. [x] Modify `adminUpdateBookingDetails` to add new event creation option (Handled via new logic)
2. [x] Create direct event creation endpoint (`adminCreateEvent`) (Implemented via `createDeparture`)
3. [x] Update `createBooking` with new event creation option (Implemented)
4. [x] Add event transfer enhancements (Implemented via `updateDeparture` date change)
5. [x] Create event management endpoints (`adminSplitEvent`, `adminGetEventsByDate`) (Implemented)
# Task Plan for Nevado Trek Backend Improvements

## Project Context

This is the Nevado Trek Backend, a comprehensive reservation system for adventure tour management built with Firebase Cloud Functions. The system currently handles booking management, tour management, event management, and has both customer-facing and admin-facing endpoints.

## Current Architecture

- **Backend Framework**: Firebase Cloud Functions (Node.js 22)
- **Database**: Google Cloud Firestore (NoSQL)
- **Authentication**: Secret key headers (X-Admin-Secret-Key)
- **Runtime Environment**: Google Cloud Run (2nd Gen)
- **SDKs**: Firebase Admin SDK, Firebase Functions SDK

## Identified Issues and Required Improvements

### 1. Event Creation Logic Issue
**Problem**: The system currently assumes there's only one event per tour per date. When a booking is made for a date that already has an event for the same tour, the system automatically joins the existing event instead of creating a new separate event if desired.

**Root Cause**: The event lookup logic in `adminUpdateBookingDetails` and `createBooking` functions uses a query that finds any existing event for a tour on a given date and joins it, without options for creating separate events.

### 2. Lack of Multiple Events Per Date Support
**Problem**: The system does not support multiple events for the same tour on the same date, limiting operational flexibility.

**Impact**: 
- Cannot run multiple separate groups for the same tour on the same date
- Customers expecting private tours may end up in public groups
- No way to accommodate different group sizes or special requests on the same date

### 3. No Direct Event Creation API
**Problem**: There's no endpoint to create events independently of bookings.

**Impact**: 
- Cannot create events in advance with specific capacity or visibility settings
- No way to prepare events before getting the first booking

### 4. Missing Admin Tools for Event Management
**Problem**: No admin interface or API to:
- Create separate events for the same tour on the same date
- Split existing bookings into separate events
- Manage multiple events per date

### 5. Visibility Change Implications
**Problem**: When an event changes from private to public, existing customers may be unaware they'll be sharing the tour with others.

**Impact**: 
- Customer experience issues
- Privacy expectation mismatches

## Required Changes

### Phase 1: Modify Event Creation Logic
1. **Update `adminUpdateBookingDetails` function** in `functions/src/admin/booking-details.js`:
   - Add an optional parameter to specify whether to create a new event or join an existing one
   - Default behavior should still join existing events for backward compatibility
   - Add a flag like `createNewEvent: true` to force creation of a new event

2. **Update `createBooking` function** in `functions/index.js`:
   - Similar optional parameter to force creation of a new event
   - Allow creating new events even if one already exists for the same tour and date

3. **Update `joinEvent` function** in `functions/index.js`:
   - Consider how this change affects joining existing public events
   - Ensure existing functionality remains intact

### Phase 2: Add Direct Event Creation API
4. **Create new endpoint**: `adminCreateEvent`
   - `POST /adminCreateEvent` that allows admins to create events independently of bookings
   - Parameters: `tourId`, `startDate`, `maxCapacity`, `type` (private/public)
   - Returns new `eventId` for future bookings

### Phase 3: Enhance Event Transfer Capabilities
5. **Enhance `adminTransferBooking` function**:
   - Support transfers to new events of the same tour on the same date
   - Allow creation of new events during the transfer process

6. **Update `adminTransferToNewTour` function**:
   - Maintain existing functionality but ensure it works with the new multiple events per date capability

### Phase 4: Admin Event Management Tools
7. **Create `adminSplitEvent` endpoint**:
   - `POST /adminSplitEvent/:eventId` to split a single event into multiple events with selected bookings

8. **Create `adminGetEventsByDate` endpoint**:
   - `GET /adminGetEventsByDate/:tourId/:date` to get all events for a tour on a specific date

### Phase 5: Update Documentation and Error Handling
9. **Update API documentation** in `APIUSAGE.md`:
   - Document new endpoints and parameters
   - Update examples and workflow descriptions

10. **Add validation and error handling**:
    - For capacity limits when creating new events
    - For invalid date/tour combinations
    - For scenarios where capacity would be exceeded

## Implementation Plan

### Step 1: Database Schema Updates (if needed)
- Review if any additional fields are needed in the events collection to support multiple events per date
- Currently the schema looks sufficient but need to verify

### Step 2: Modify Core Functions
- Update the `booking-details.js` file to include new functionality
- Update the main `index.js` file with new endpoints
- Maintain backward compatibility

### Step 3: Add New Endpoints
- Create new functions in `index.js` for direct event management
- Implement the new API endpoints as per the requirements

### Step 4: Update Validation and Error Handling
- Add new validation functions for the new features
- Update error responses to be clear and informative

### Step 5: Testing
- Add unit tests for new functionality
- Test existing functionality still works
- Test edge cases and error conditions

## Technical Considerations
1. **Firestore Indexes**: Need to verify that existing indexes are adequate for the new query patterns
2. **Transaction Safety**: Maintain transactional integrity for all capacity and booking operations
3. **Backward Compatibility**: Changes should not break existing functionality
4. **Capacity Management**: Ensure capacity is properly managed across multiple events for the same tour on the same date
5. **Audit Trail**: Maintain proper audit trails for all event creation and modification operations

## Priority Order for Implementation

1. [x] Modify `adminUpdateBookingDetails` to add new event creation option (Handled via new logic)
2. [x] Create direct event creation endpoint (`adminCreateEvent`) (Implemented via `createDeparture`)
3. [x] Update `createBooking` with new event creation option (Implemented)
4. [x] Add event transfer enhancements (Implemented via `updateDeparture` date change)
5. [x] Create event management endpoints (`adminSplitEvent`, `adminGetEventsByDate`) (Implemented)
6. [x] Implement Strict Validation Middleware (`validateBooking`, `validateTour`)
   - Allow creation of new events during the transfer process

6. **Update `adminTransferToNewTour` function**:
   - Maintain existing functionality but ensure it works with the new multiple events per date capability

### Phase 4: Admin Event Management Tools
7. **Create `adminSplitEvent` endpoint**:
   - `POST /adminSplitEvent/:eventId` to split a single event into multiple events with selected bookings

8. **Create `adminGetEventsByDate` endpoint**:
   - `GET /adminGetEventsByDate/:tourId/:date` to get all events for a tour on a specific date

### Phase 5: Update Documentation and Error Handling
9. **Update API documentation** in `APIUSAGE.md`:
   - Document new endpoints and parameters
   - Update examples and workflow descriptions

10. **Add validation and error handling**:
    - For capacity limits when creating new events
    - For invalid date/tour combinations
    - For scenarios where capacity would be exceeded

## Implementation Plan

### Step 1: Database Schema Updates (if needed)
- Review if any additional fields are needed in the events collection to support multiple events per date
- Currently the schema looks sufficient but need to verify

### Step 2: Modify Core Functions
- Update the `booking-details.js` file to include new functionality
- Update the main `index.js` file with new endpoints
- Maintain backward compatibility

### Step 3: Add New Endpoints
- Create new functions in `index.js` for direct event management
- Implement the new API endpoints as per the requirements

### Step 4: Update Validation and Error Handling
- Add new validation functions for the new features
- Update error responses to be clear and informative

### Step 5: Testing
- Add unit tests for new functionality
- Test existing functionality still works
- Test edge cases and error conditions

## Technical Considerations
1. **Firestore Indexes**: Need to verify that existing indexes are adequate for the new query patterns
2. **Transaction Safety**: Maintain transactional integrity for all capacity and booking operations
3. **Backward Compatibility**: Changes should not break existing functionality
4. **Capacity Management**: Ensure capacity is properly managed across multiple events for the same tour on the same date
5. **Audit Trail**: Maintain proper audit trails for all event creation and modification operations

## Priority Order for Implementation

1. [x] Modify `adminUpdateBookingDetails` to add new event creation option (Handled via new logic)
2. [x] Create direct event creation endpoint (`adminCreateEvent`) (Implemented via `createDeparture`)
3. [x] Update `createBooking` with new event creation option (Implemented)
4. [x] Add event transfer enhancements (Implemented via `updateDeparture` date change)
5. [x] Create event management endpoints (`adminSplitEvent`, `adminGetEventsByDate`) (Implemented)
6. [x] Implement Strict Validation Middleware (`validateBooking`, `validateTour`)
7. [x] Refine Tour Management (Complex Structures & Partial Updates)
8. [x] Implement Booking Discounts (`applyDiscount`)
9. [x] Implement Dashboard Statistics (`getDashboardStats`)
10. [x] Verify all endpoints with comprehensive testing (`test_full_endpoints.js`)

### Phase 6: Data Structure Enhancements
[x] Add strict validation for new Tour fields (difficulty, altitude, etc.)
[x] Update test scripts to support new Tour schema
[x] Verify new Tour creation with full details

### Phase 7: Admin Frontend Setup (Next)
15. [ ] Initialize Vite Project (`admin-dashboard`)
16. [ ] Setup Routing & Auth Context
17. [ ] Create API Client (Axios with Interceptor)
18. [ ] Develop Admin Views (Calendar, Bookings, Tours)