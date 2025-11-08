## ADDED Requirements

### Requirement: Tour Versioning
The system SHALL support versioned tour definitions to enable safe modification of tour properties without affecting existing bookings.

#### Scenario: Create New Tour Version
- **WHEN** admin updates "cosmetic" fields of an existing tour
- **THEN** a new version of the tour is created while preserving the original for existing bookings

#### Scenario: Book Against Specific Tour Version
- **WHEN** customer creates a booking
- **THEN** the booking references the specific tour version that was current at booking time

### Requirement: Explicit Departure Entity
The system SHALL have a dedicated Departure entity representing operational instances of tours on specific dates.

#### Scenario: Create Departure from Tour Template
- **WHEN** admin creates a departure
- **THEN** the departure references a specific tour version and has its own operational properties (capacity, pricing, status)

#### Scenario: Update Departure Properties
- **WHEN** admin updates departure properties (capacity, dates, prices, type)
- **THEN** only that specific departure is affected, not other departures of the same tour

### Requirement: Group Management
The system SHALL support Group entities to represent social units traveling together.

#### Scenario: Create Group for Booking
- **WHEN** a booking is created
- **THEN** the system creates or assigns the booking to a group representing the social unit traveling together

#### Scenario: Manage Group Members
- **WHEN** bookings need to be grouped or separated
- **THEN** the system updates Group memberships appropriately

### Requirement: Simplified Booking Transfer
The system SHALL provide a single endpoint to move bookings between departures.

#### Scenario: Move Booking Between Departures
- **WHEN** admin or customer requests to move a booking to a different departure
- **THEN** the booking is transferred to the new departure with appropriate capacity validation

## MODIFIED Requirements

### Requirement: Tour Change Management
The system SHALL NOT allow tour changes to inadvertently affect existing bookings.

#### Scenario: Update Tour Properties
- **WHEN** admin updates tour properties (description, inclusions, etc.)
- **THEN** existing bookings continue to reference the original tour version at the time of booking

#### Scenario: Propagate Tour Changes
- **WHEN** admin explicitly requests to propagate tour changes to existing departures
- **THEN** a bulk update operation is performed using the dedicated endpoint