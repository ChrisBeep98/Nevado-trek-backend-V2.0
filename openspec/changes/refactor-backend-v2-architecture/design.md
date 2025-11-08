## Context
The current Nevado Trek Backend architecture (v1.0) has conceptual ambiguities that affect maintainability and scalability. The overloaded "event" concept causes confusion between operational instances and booking dependencies, making it difficult to update tour properties without risking existing booking integrity.

## Goals / Non-Goals
- Goals: 
  - Create clear separation between tour templates and operational instances
  - Enable safe modification of tour properties without affecting existing bookings
  - Simplify booking transfer logic between dates/tours
  - Better capacity management with explicit departure-based tracking
- Non-Goals: 
  - Change the core business logic of tour operations
  - Modify customer-facing functionality (except where necessary for the new architecture)

## Decisions
- Decision: Introduce four explicit entities (TOUR, DEPARTURE, GROUP, BOOKING) with clear relationships to eliminate ambiguity
  - Rationale: This provides a clear mental model and separates concerns appropriately
- Decision: Implement versioning for TOUR entities to preserve booking integrity when tours change
  - Rationale: Enables safe updates to tour properties without affecting existing bookings
- Decision: Use Firestore transactions for all operations that modify multiple entities
  - Rationale: Ensures data consistency across the new entity relationships

## Risks / Trade-offs
- Complexity risk → Mitigation: Comprehensive documentation and clear API boundaries
- Migration risk → Mitigation: Thorough testing in staging environment with backup/rollback procedures
- Performance impact → Mitigation: Proper indexing and testing of new query patterns

## Migration Plan
- Create new collections (tours_v2, departures_v2, groups_v2, bookings_v2) alongside existing ones
- Execute migration during scheduled maintenance window
- Validate all data integrity before switching API to use new collections
- Rollback plan: Switch API back to original collections if critical issues arise

## Open Questions
- How should we handle concurrent bookings during the migration window?
- Should we maintain backward compatibility during transition period?