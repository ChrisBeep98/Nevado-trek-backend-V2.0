## 1. Schema Definition
- [ ] 1.1 Define Firestore collections for new entities (tours_v2, departures_v2, groups_v2, bookings_v2)
- [ ] 1.2 Set up indexes for efficient querying
- [ ] 1.3 Create validation rules for new data structures

## 2. Migration Script
- [ ] 2.1 Create migration script from v1.0 to v2.0 structures
- [ ] 2.2 Map tours → tour versions
- [ ] 2.3 Map tourEvents → departures
- [ ] 2.4 Map bookings → bookings and groups
- [ ] 2.5 Test migration script in staging environment

## 3. New Endpoint Implementation
- [ ] 3.1 Implement tour endpoints (GET /tours, GET /tours/{versionGroupId}, POST /tours/{versionGroupId}/versions, PUT /tours/{tourId})
- [ ] 3.2 Implement departure endpoints (GET /departures, POST /departures, PUT /departures/{id}/settings, PUT /departures/{id}/status, POST /departures/bulk-update-version)
- [ ] 3.3 Implement booking endpoints (POST /bookings, PUT /bookings/{id}, POST /bookings/{id}/move, DELETE /bookings/{id})
- [ ] 3.4 Add transaction handling for data consistency
- [ ] 3.5 Implement cascade update logic

## 4. Testing
- [ ] 4.1 Comprehensive testing of new endpoints
- [ ] 4.2 Migration script validation
- [ ] 4.3 Integration testing
- [ ] 4.4 Load testing for transaction handling

## 5. Deployment
- [ ] 5.1 Deploy to staging with new collections
- [ ] 5.2 Execute migration during maintenance window
- [ ] 5.3 Switch API to use new collections
- [ ] 5.4 Deploy to production
- [ ] 5.5 Update API documentation