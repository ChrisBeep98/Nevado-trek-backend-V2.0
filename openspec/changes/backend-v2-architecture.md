# Change Proposal: Backend Architecture v2.0 for Nevado Trek

## Summary

This proposal outlines a comprehensive redesign of the Nevado Trek Backend architecture from v1.0 to v2.0. The current architecture suffers from conceptual ambiguities that affect maintainability and scalability. The new architecture introduces a clear, hierarchical data model with explicit entities for Tours, Departures, Groups, and Bookings.

## Problem Statement

The current backend architecture (v1.0) has several critical issues:

1. **Ambiguous "Event" concept**: The term "event" is overloaded, causing confusion between operational instances and booking dependencies
2. **Tour change management**: No safe mechanism to update tour properties without risking existing booking integrity
3. **Dependency inversion**: Events depend on initial bookings rather than existing independently
4. **Complex transfer logic**: Multiple endpoints required for simple booking transfers between dates or tours

## Proposed Solution

A new architecture with four explicit entities:
- **TOUR**: The catalog/product template with versioning
- **DEPARTURE**: The operational instance of a tour on a specific date
- **GROUP**: The social unit traveling together
- **BOOKING**: The individual customer reservation

## Technical Details

### Entity Relationships
```text
[TOUR (versioned)] 1--< [DEPARTURE] >--* [GROUP] >--* [BOOKING]
```

### New Data Structures

#### TOUR Entity
```javascript
{
  tourId: "string (PK)",
  version: "number (incremental)",
  versionGroupId: "string (groups all versions)",
  name: {es: "string", en: "string"},
  description: {es: "string", en: "string"},
  itinerary: {es: "string", en: "string"},
  inclusions: {es: "string", en: "string"},
  pricingTiers: "array",
  defaultCapacity: {min: "number", max: "number", absoluteMax: "number"},
  status: "enum (ACTIVE, INACTIVE, ARCHIVED)",
  createdAt: "timestamp",
  updatedAt: "timestamp"
}
```

#### DEPARTURE Entity
```javascript
{
  departureId: "string (PK)",
  tourId: "string (FK to specific tour version)",
  startDate: "timestamp",
  endDate: "timestamp",
  status: "enum (DRAFT, PUBLISHED, GUARANTEED, IN_PROGRESS, COMPLETED, CANCELLED)",
  type: "enum (SHARED, PRIVATE)",
  capacity: {max: "number", currentPax: "number"},
  pricing: {type: "'DEFAULT' | 'CUSTOM'", customTiers: "[...]"},
  notes: "string",
  createdAt: "timestamp",
  updatedAt: "timestamp"
}
```

#### GROUP Entity
```javascript
{
  groupId: "string (PK)",
  groupName: "string",
  departureId: "string (FK)",
  totalPax: "number",
  leaderBookingId: "string (FK, optional)"
}
```

#### BOOKING Entity
```javascript
{
  bookingId: "string (PK)",
  bookingReference: "string",
  departureId: "string (FK)",
  groupId: "string (FK)",
  customerDetails: "object",
  pax: "number",
  priceSnapshot: "object (stores final price at booking time)",
  paymentStatus: "enum (PENDING, CONFIRMED, PAID, REFUNDED)",
  status: "enum (ACTIVE, CANCELLED)",
  statusHistory: "array"
}
```

### New Endpoints

#### Tour Endpoints
- `GET /tours`: List latest versions of all tours
- `GET /tours/{versionGroupId}`: Get all versions of a specific tour
- `POST /tours/{versionGroupId}/versions`: Create new tour version
- `PUT /tours/{tourId}`: Update "cosmetic" fields of specific tour version

#### Departure Endpoints
- `GET /departures?tourId=&startDate=`: Search and list departures
- `POST /departures`: Create new departure
- `PUT /departures/{id}/settings`: Update departure properties (capacity, dates, prices, type)
- `PUT /departures/{id}/status`: Change departure status
- `POST /departures/bulk-update-version`: Propagate tour changes to departures

#### Booking Endpoints
- `POST /bookings`: Create new booking
- `PUT /bookings/{id}`: Update booking details
- `POST /bookings/{id}/move`: Move booking to different departure
- `DELETE /bookings/{id}`: Cancel booking

## Implementation Plan

### Phase 1: Schema Definition
- Define Firestore collections for new entities
- Set up indexes for efficient querying
- Create validation rules

### Phase 2: Migration Script
- Create migration script from v1.0 to v2.0 structures
- Map tours → tour versions
- Map tourEvents → departures
- Map bookings → bookings and groups

### Phase 3: New Endpoint Implementation
- Implement all new endpoint functions
- Add transaction handling for data consistency
- Implement cascade update logic

### Phase 4: Testing
- Comprehensive testing of new endpoints
- Migration script validation
- Integration testing

### Phase 5: Deployment
- Deploy to staging with new collections
- Execute migration during maintenance window
- Switch API to use new collections
- Deploy to production

## Migration Strategy

1. Create new collections: `tours_v2`, `departures_v2`, `groups_v2`, `bookings_v2`
2. Write migration script to transform existing data
3. Deploy to staging, test thoroughly
4. Schedule maintenance window for production
5. Execute migration during maintenance window
6. Point API to new collections

## Business Impact

### Benefits
- Clear separation of concerns between tour catalogs and operational instances
- Safe tour modification without affecting existing bookings
- Simplified booking transfer logic with single endpoint
- Better capacity management with explicit departure-based tracking
- Explicit group management for shared bookings

### Disruption
- Requires maintenance window for data migration
- Frontend will need updates to use new endpoints
- Existing API clients will need to be updated

## Risk Assessment

### High Risk
- Data migration complexity and potential for data loss - mitigated by thorough testing in staging

### Medium Risk
- Integration with existing frontend systems - mitigated by maintaining API documentation and testing
- Transaction handling in high-concurrency scenarios - mitigated by Firestore transaction testing

### Low Risk
- Developer learning curve for new architecture - mitigated by comprehensive documentation