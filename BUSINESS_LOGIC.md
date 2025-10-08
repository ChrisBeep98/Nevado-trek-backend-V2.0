# Business Logic - Nevado Trek Backend

## Overview
Complete reservation system for adventure tour management with:
- Bilingual (Spanish/English) support for all customer-facing content
- Anonymous booking system with rate limiting
- Advanced admin panel for complete reservation/event management
- Support for private groups (created by individuals) and public events (joinable by multiple customers)

## Core Business Processes

### 1. Tour Management
- **Tour Creation**: Admin creates tours with bilingual descriptions and pricing tiers
- **Tour Visibility**: `isActive: true/false` for public availability control
- **Tour Structure**: Contains complete information including names, descriptions, pricing, inclusions, FAQs, etc. in both languages

### 2. Event Management
- **Private Events**: Created when individual customer books a new date
- **Public Events**: Previously private events that become joinable by other customers
- **Capacity Management**: Track available slots with `bookedSlots` vs `maxCapacity`

### 3. Booking System
- **Individual Booking**: Customer books a new tour date, creating private event
- **Event Joining**: Customer joins existing public event
- **Reference System**: Unique booking references in format `BK-YYYYMMDD-XXX`
- **Rate Limiting**: Prevents spam (5 min between requests, 3/hour, 5/day per IP)

### 4. Reservation Management
- **Status Tracking**: `pending` → `confirmed` → `paid` → `cancelled` workflow
- **History Logging**: Complete audit trail of all status changes
- **Customer Management**: Full contact information with special notes

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

## Business Rules

### Tour Rules
- Tours can be activated/deactivated independently of deletion
- Bilingual content required for all text fields
- Pricing tiers defined by group size (dynamic pricing)

### Event Rules  
- Events start as private when first individual booking is made
- Events can be made public, allowing others to join
- Capacity limits enforced at booking time
- Type changes from private to public (not vice versa)

### Booking Rules
- Rate limiting prevents spam and automated booking
- Real-time capacity checking prevents overbooking
- Reference codes enable tracking without login
- Bookings can be associated with tour events

### Admin Rules
- Secret key authentication for all admin functions
- Complete reservation management capabilities
- Event visibility control
- Customer information access and modification

## Customer Journey Flow

### 1. Browse Tours (Public)
- View active tours with complete descriptions in preferred language
- Review pricing, inclusions, and itinerary
- Check calendar for available dates

### 2. Create Booking or Join Event
- **New Date**: Fill customer details, select date → creates private event
- **Join Existing**: Select public event → join available capacity
- **Rate Limited**: IP blocked if too many requests in timeframe

### 3. Receive Confirmation
- Booking reference code provided
- Confirmation email with details
- Option to check status using reference

### 4. Admin Processing
- Admin reviews pending bookings
- Confirms payment and finalizes details
- Updates status to confirmed/paid as appropriate

## Revenue Model Support
- Dynamic pricing based on group size
- Capacity-based event management
- Anti-spam protection reducing fraud
- Complete booking history for reporting