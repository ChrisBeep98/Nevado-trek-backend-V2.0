# Change: Backend Architecture v2.0 for Nevado Trek

## Why
The current backend architecture (v1.0) has several critical issues including ambiguous "event" concept, complex tour change management, dependency inversion, and complex transfer logic that affect maintainability and scalability of the Nevado Trek reservation system.

## What Changes
- **RESTRUCTURE** architecture with four explicit entities (TOUR, DEPARTURE, GROUP, BOOKING)
- **REPLACE** overloaded "event" concept with clear DEPARTURE entity
- **ADD** versioning system for TOUR entities to safely update tour properties
- **IMPLEMENT** new endpoint structure with clear separation of concerns
- **CREATE** migration strategy from v1.0 to v2.0 structures

## Impact
- Affected specs: architecture, tour management, booking management, departure scheduling
- Affected code: All backend functions, data models, API endpoints
- Affected systems: Frontend applications, existing API clients