# Business Logic - Nevado Trek Backend

## Overview
Complete reservation system for adventure tour management with:
- Bilingual (Spanish/English) support for all customer-facing content
- Anonymous booking system with rate limiting
- Advanced admin panel for complete reservation/event management
- Support for private groups (created by individuals) and public events (joinable by multiple customers)
- Comprehensive booking transfer capabilities
- Real-time capacity management and audit trails

## Core Business Processes

### 1. Tour Management
- **Tour Creation**: Admin creates tours with bilingual descriptions and pricing tiers
- **Tour Visibility**: `isActive: true/false` for public availability control
- **Tour Structure**: Contains complete information including names, descriptions, pricing, inclusions, FAQs, etc. in both languages
- **Pricing Tiers**: Dynamic pricing based on group size with dual currency support (COP/USD)

### 2. Event Management
- **Private Events**: Created when individual customer books a new date
- **Public Events**: Previously private events that become joinable by other customers
- **Capacity Management**: Track available slots with `bookedSlots` vs `maxCapacity`
- **Event Lifecycle**: Private (individual booking) → Public (joinable) → Active → Completed/Cancelled

### 3. Booking System
- **Individual Booking**: Customer books a new tour date, creating private event
- **Event Joining**: Customer joins existing public event
- **Reference System**: Unique booking references in format `BK-YYYYMMDD-XXX`
- **Rate Limiting**: Prevents spam (5 min between requests, 3/hour, 5/day per IP)
- **Capacity Validation**: Real-time checking prevents overbooking

### 4. Reservation Management
- **Status Tracking**: `pending` → `confirmed` → `paid` → `cancelled` workflow
- **History Logging**: Complete audit trail of all status changes
- **Customer Management**: Full contact information with special notes
- **Pricing Recalculation**: Automatic when group size changes

### 5. Event Management & Calendar
- **Calendar View**: Admin calendar view with filtering by date range, tour, type, and status
- **Event Types**: Private (individual booking origin) and public (joinable by multiple customers) events
- **Event Statuses**: active, full, completed, cancelled
- **Capacity Management**: Real-time capacity tracking for events
- **Publish/Unpublish Control**: Admin can toggle event visibility between private and public

### 6. Event Visibility Management
- **Public Events**: Joinable by multiple customers, visible to joinEvent endpoint
- **Private Events**: Only accessible to original booking customer
- **Admin Control**: Administrators can change event visibility at any time
- **Validation**: System prevents invalid state transitions
- **Capacity Validation**: Ensures events don't exceed max capacity when published

### 7. Booking Transfer Management
- **Booking Transfer**: Admins can move bookings between events of the same tour
- **Capacity Validation**: System checks destination event has available capacity
- **Data Integrity**: Uses transactions to ensure capacity updates are consistent
- **Audit Trail**: All transfers are logged in booking status history
- **Status Preservation**: Booking status is maintained during transfer
- **Restrictions**: Cannot transfer cancelled bookings
- **Pricing Updates**: Automatic recalculation if pricing differs on destination event

### 8. Booking Details Management (Implemented)
- **Customer Updates**: Admins can update customer information (name, document ID, phone, email, notes)
- **Booking Modifications**: Change tour, date, pax count, pricing
- **Validation Rules**: All changes must pass business rule validation
- **Conflict Resolution**: Handle capacity, availability, and pricing conflicts
- **Audit Trail**: Complete tracking of all booking detail modifications
- **New Endpoint**: PUT /adminUpdateBookingDetails/:bookingId - Updates core booking information while maintaining audit trail
- **Enhanced Capability**: Additional fields can now be updated during status changes via the additionalUpdates parameter

## Business Rules

### Tour Rules
- Tours can be activated/deactivated independently of deletion
- Bilingual content required for all text fields
- Pricing tiers defined by group size (dynamic pricing)
- Tours are logically deleted (isActive set to false) rather than permanently removed
- Tours cannot be deleted if they have active events or bookings

### Event Rules  
- Events start as private when first individual booking is made
- Events can be made public, allowing others to join
- Capacity limits enforced at booking time
- Type changes from private to public (not vice versa)
- Events with no bookings may be automatically cancelled after threshold period
- Events automatically change to 'full' status when capacity is reached

### Booking Rules
- Rate limiting prevents spam and automated booking
- Real-time capacity checking prevents overbooking
- Reference codes enable tracking without login
- Bookings can be associated with tour events
- Group size changes trigger pricing recalculation
- Maximum and minimum pax limits enforced per tour
- Customers can only join events with available capacity

### Admin Rules
- Secret key authentication for all admin functions
- Complete reservation management capabilities
- Event visibility control
- Customer information access and modification (future enhancement)
- Booking transfer and modification capabilities (future enhancement)
- Audit trail maintenance for all admin actions

## Customer Journey Flow

### 1. Browse Tours (Public)
- View active tours with complete descriptions in preferred language
- Review pricing, inclusions, and itinerary
- Check calendar for available dates
- Access tour details with complete 4-day itinerary

### 2. Create Booking or Join Event
- **New Date**: Fill customer details, select date → creates private event
- **Join Existing**: Select public event → join available capacity
- **Rate Limited**: IP blocked if too many requests in timeframe
- **Capacity Check**: Real-time availability validation

### 3. Receive Confirmation
- Booking reference code provided
- Confirmation email with details
- Option to check status using reference
- Access to booking details via reference check

### 4. Admin Processing
- Admin reviews pending bookings
- Confirms payment and finalizes details
- Updates status to confirmed/paid as appropriate
- Manages customer requests for changes via transfer system

## Admin Management Flow

### 1. Tour Management
- Create new tours with complete bilingual information
- Update tour details, pricing, and availability
- Activate/deactivate tours as needed
- Manage tour itineraries and images

### 2. Booking Management
- View all bookings with filtering capabilities
- Update booking statuses with detailed audit trails
- Transfer bookings between events
- Handle customer change requests
- Manage customer information updates (planned)

### 3. Event Management
- Monitor event capacity and availability
- Publish/unpublish events as needed
- Manage event status (active, full, completed, cancelled)
- Calendar-based event management interface

### 4. Customer Service
- Update booking details (planned)
- Handle transfer requests
- Manage special customer requests
- Audit all customer interactions

## Data Consistency Rules

### Transaction Management
- All capacity updates use Firestore transactions
- Booking and event updates are atomic operations
- Price calculations happen consistently across system
- Capacity validation occurs before any booking is confirmed

### Denormalization Strategy
- Tour names copied to tourEvents and bookings for efficient reading
- Event data denormalized in booking records for fast retrieval
- Customer information maintained per booking with potential for future consolidation

### Audit Requirements
- All admin actions logged with timestamp and user
- Customer information changes tracked with reason
- Booking status changes maintained in history
- Transfer operations fully documented

## Security Considerations

### Authentication & Authorization
- Admin endpoints require valid X-Admin-Secret-Key header
- Customer endpoints rate-limited by IP
- Sensitive customer information protected
- All API calls validated for proper permissions

### Rate Limiting
- 5-minute minimum between booking attempts from same IP
- Maximum 3 bookings per hour per IP
- Maximum 5 bookings per day per IP
- Adaptive rate limiting based on system load and usage patterns

## Revenue Model Support
- Dynamic pricing based on group size
- Dual currency support (COP/USD)
- Capacity-based event management
- Anti-spam protection reducing fraudulent bookings
- Complete booking history for reporting and analytics
- Flexible pricing tiers based on demand and seasonality

## Integration Points
- Calendar systems for event management
- Payment gateways (future implementation)
- Email/SMS notification systems (future implementation)
- Customer review platforms (future implementation)
- Analytics and reporting tools
- Mobile platform support (future implementation)