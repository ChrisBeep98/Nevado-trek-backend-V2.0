# Admin Panel Architecture & Design - Nevado Trek Backend

## Overview
A comprehensive admin panel for managing all aspects of the adventure tour reservation system using only the existing backend capabilities. The panel will provide administrators with tools to manage tours, bookings, events, and customer data with an intuitive, responsive interface.

## Core Principles
- **Bilingual Support**: All UI elements available in both Spanish and English
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Secure Access**: Single admin token authentication (X-Admin-Secret-Key header)
- **Intuitive UX**: Simple navigation with powerful functionality
- **Real-time Data**: Live updates and notifications of system changes

## Current Backend Capabilities & API Usage

### Public Endpoints
- **GET /getToursV2**: Retrieve all active tours
  - **Usage**: `GET https://gettoursv2-wgfhwjbpva-uc.a.run.app`
  - **Response**: Array of active tours with bilingual content
  - **Authentication**: None required

- **GET /getTourByIdV2/:tourId**: Retrieve specific tour by ID
  - **Usage**: `GET https://gettourbyidv2-wgfhwjbpva-uc.a.run.app/{tourId}`
  - **Response**: Complete tour information
  - **Authentication**: None required

- **POST /createBooking**: Create new reservation
  - **Usage**: `POST https://createbooking-wgfhwjbpva-uc.a.run.app`
  - **Body**: 
    ```json
    {
      "tourId": "string",
      "startDate": "ISO date string",
      "customer": {
        "fullName": "string",
        "documentId": "string",
        "phone": "string", 
        "email": "string",
        "notes": "string (optional)"
      },
      "pax": "number (positive)"
    }
    ```
  - **Response**: 201 with booking details or appropriate error codes
  - **Authentication**: Rate limited by IP

- **POST /joinEvent**: Join existing public event
  - **Usage**: `POST https://joinevent-wgfhwjbpva-uc.a.run.app`
  - **Body**: 
    ```json
    {
      "eventId": "string",
      "customer": {
        "fullName": "string",
        "documentId": "string",
        "phone": "string",
        "email": "string",
        "notes": "string (optional)"
      },
      "pax": "number (positive)"
    }
    ```
  - **Response**: 201 with booking details or appropriate error codes
  - **Authentication**: Rate limited by IP

- **GET /checkBooking**: Verify booking status by reference
  - **Usage**: `GET https://checkbooking-wgfhwjbpva-uc.a.run.app?reference=BK-XXXXX&email=user@example.com`
  - **Response**: Complete booking information
  - **Authentication**: None (validated by reference)

### Admin Endpoints
- **POST /adminCreateTourV2**: Create new tour (requires admin token)
  - **Usage**: `POST https://us-central1-nevadotrektest01.cloudfunctions.net/adminCreateTourV2`
  - **Headers**: `X-Admin-Secret-Key: [YOUR_TOKEN]`
  - **Body**: Complete tour object with bilingual fields
  - **Response**: 201 with created tour ID
  
- **PUT /adminUpdateTourV2/:tourId**: Update existing tour (requires admin token)
  - **Usage**: `PUT https://us-central1-nevadotrektest01.cloudfunctions.net/adminUpdateTourV2/{tourId}`
  - **Headers**: `X-Admin-Secret-Key: [YOUR_TOKEN]`
  - **Body**: Fields to update
  - **Response**: 200 with success message
  
- **DELETE /adminDeleteTourV2/:tourId**: Logically delete tour (requires admin token)
  - **Usage**: `DELETE https://us-central1-nevadotrektest01.cloudfunctions.net/adminDeleteTourV2/{tourId}`
  - **Headers**: `X-Admin-Secret-Key: [YOUR_TOKEN]`
  - **Response**: 200 with success message (sets isActive to false)
  
- **GET /adminGetBookings**: List all bookings with filtering (requires admin token)
  - **Usage**: `GET https://us-central1-nevadotrektest01.cloudfunctions.net/adminGetBookings`
  - **Headers**: `X-Admin-Secret-Key: [YOUR_TOKEN]`
  - **Query Parameters**:
    - `status` (optional) - Filter by booking status
    - `tourId` (optional) - Filter by tour ID
    - `startDateFrom` (optional) - Filter by booking date from
    - `startDateTo` (optional) - Filter by booking date to
    - `customerName` (optional) - Filter by customer full name
    - `limit` (optional) - Number of results per page (default: 50, max: 200)
    - `offset` (optional) - Number of results to skip (for pagination)
  - **Response**: 200 with paginated bookings list
  
- **PUT /adminUpdateBookingStatus/:bookingId**: Update booking status (requires admin token)
  - **Usage**: `PUT https://us-central1-nevadotrektest01.cloudfunctions.net/adminUpdateBookingStatus/{bookingId}`
  - **Headers**: `X-Admin-Secret-Key: [YOUR_TOKEN]`
  - **Body**: 
    ```json
    {
      "status": "pending|confirmed|paid|cancelled|cancelled_by_admin",
      "reason": "string (optional, reason for status change)"
    }
    ```
  - **Response**: 200 with success message and audit trail
  
- **GET /adminGetEventsCalendar**: List events for calendar view (requires admin token)
  - **Usage**: `GET https://us-central1-nevadotrektest01.cloudfunctions.net/adminGetEventsCalendar`
  - **Headers**: `X-Admin-Secret-Key: [YOUR_TOKEN]`
  - **Query Parameters**:
    - `tourId` (optional) - Filter by tour ID
    - `startDateFrom` (optional) - Filter by event start date from
    - `startDateTo` (optional) - Filter by event start date to
    - `type` (optional) - Filter by event type ('private' or 'public')
    - `status` (optional) - Filter by event status ('active', 'full', 'completed', 'cancelled')
    - `limit` (optional) - Number of results per page (default: 50, max: 200)
    - `offset` (optional) - Number of results to skip (for pagination)
  - **Response**: 200 with paginated events list

- **POST /adminPublishEvent/:eventId**: Toggle event visibility (requires admin token)
  - **Usage**: `POST https://us-central1-nevadotrektest01.cloudfunctions.net/adminPublishEvent/{eventId}`
  - **Headers**: `X-Admin-Secret-Key: [YOUR_TOKEN]`
  - **Body**: 
    ```json
    {
      "action": "publish|unpublish"  // Optional, defaults to "publish"
    }
    ```
  - **Response**: 200 with success message and type change details

- **POST /adminTransferBooking**: Transfer booking between tours (requires admin token)
  - **Usage**: `POST https://us-central1-nevadotrektest01.cloudfunctions.net/adminTransferBooking`
  - **Headers**: `X-Admin-Secret-Key: [YOUR_TOKEN]`
  - **Body**: 
    ```json
    {
      "bookingId": "string",
      "fromTourId": "string (optional)",
      "toTourId": "string (required to change tour)",
      "toEventId": "string (optional, if not provided, creates new event)",
      "reason": "string (optional, reason for transfer)"
    }
    ```
  - **Response**: 200 with transfer confirmation and details

## Business Logic

### Tour Management Business Rules
- Tours can be activated/deactivated independently of deletion
- Bilingual content required for all text fields
- Pricing tiers defined by group size (dynamic pricing)
- Tours are logically deleted (isActive set to false) rather than permanently removed
- Tours cannot be deleted if they have active events or bookings

### Event Management Business Rules
- Events start as private when first individual booking is made
- Events can be made public, allowing others to join
- Capacity limits enforced at booking time
- Type changes from private to public (not vice versa in current implementation)
- Events cannot be deleted if they have confirmed bookings

### Booking System Business Rules
- Rate limiting prevents spam (5 min between requests, 3/hour, 5/day per IP)
- Real-time capacity checking prevents overbooking
- Reference codes enable tracking without login (format: BK-YYYYMMDD-XXX)
- Bookings follow status workflow: pending → confirmed → paid → cancelled
- Complete audit trail of all status changes maintained
- Bookings can be transferred between tours/dates with admin approval

### Customer Journey Flow
1. **Browse Tours**: View active tours with complete bilingual descriptions
2. **Create Booking or Join Event**: Fill customer details and select options
3. **Receive Confirmation**: Booking reference code provided
4. **Admin Processing**: Admin reviews and updates booking status
5. **Event Participation**: Customer participates in the tour event

### Admin Workflow
1. **Tour Management**: Create, update, activate/deactivate tours
2. **Booking Monitoring**: Monitor pending bookings and update statuses
3. **Event Management**: Control event visibility and capacity
4. **Customer Communication**: Manage customer information and special requests
5. **Booking Transfers**: Handle tour change requests from customers

## Architecture

### Technology Stack
- **Frontend**: React.js with JavaScript/TypeScript
- **Styling**: Tailwind CSS with Material Design principles
- **State Management**: Redux Toolkit or Zustand
- **API Communication**: Axios with interceptors for admin token
- **Authentication**: Single admin token via X-Admin-Secret-Key header
- **Calendar Integration**: FullCalendar or react-big-calendar
- **Charts/Visualizations**: Chart.js or D3.js
- **UI Components**: Headless UI or Radix UI for accessibility
- **Form Handling**: React Hook Form with validation

### Application Structure
```
Admin Panel/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── common/          # Shared components (modals, forms, etc.)
│   │   ├── tours/           # Tour-specific components
│   │   ├── bookings/        # Booking-specific components
│   │   ├── events/          # Event-specific components
│   │   └── ui/              # Generic UI components
│   ├── pages/               # Main application pages
│   │   ├── Dashboard/
│   │   ├── Tours/
│   │   ├── Bookings/ 
│   │   ├── Events/
│   │   └── Settings/
│   ├── hooks/               # Custom React hooks
│   ├── services/            # API service wrappers
│   ├── store/               # Redux store configuration
│   ├── utils/               # Utility functions
│   └── types/               # TypeScript interfaces
```

## Authentication & Security

### Single Admin Token System
- **Token Storage**: Securely stored in Redux store after initial validation
- **Request Headers**: All admin API calls include `X-Admin-Secret-Key: [TOKEN]`
- **Token Validation**: Initial token validation on login
- **Session Management**: Simple token-based system (no complex session management)
- **Token Security**: Token not stored in localStorage to prevent XSS attacks

## User Interface Design

### Navigation Structure
```
┌─────────────────────────────────────────────────┐
│  Logo | Dashboard | Tours | Bookings | Events  │
│         Settings | User                        │
└─────────────────────────────────────────────────┘
```

### Main Dashboard
- **System Overview**: Current booking status counts
- **Quick Stats**: Total tours, upcoming events, pending bookings
- **Recent Activity**: Latest bookings and status changes
- **Quick Access**: Buttons to most common tasks

### Tours Management Section

#### Tours List Page
- **Tour Cards**: Visual cards with tour names in both languages
- **Status Indicators**: Active/inactive status display
- **Quick Actions**: Edit, delete, view details
- **Search**: Search by tour name (both languages)
- **Bulk Actions**: Planned for future (currently not in API)

#### Tour Detail View with Tabs
When clicking on a tour, open a modal/detail view with 4 tabs:

**Tab 1 - Full Information**
- Complete tour details (name, description, duration, capacity)
- Bilingual content display
- Status toggle (active/inactive)
- Creation and update timestamps

**Tab 2 - Manage Itinerary**
- Dynamic itinerary builder with day-by-day editing
- Add/remove days and activities
- Bilingual activity descriptions
- Visual timeline of the tour
- Save and preview functionality

**Tab 3 - Manage Pricing**
- Pricing tier management table
- Add/edit/remove pricing tiers
- Group size ranges and per-person prices
- Bulk import/export pricing options

**Tab 4 - Manage Images**
- Image gallery with URL thumbnails
- Drag-and-drop reordering
- Add/remove image URLs
- Image preview and validation
- Primary image selection

### Bookings Management Section

#### Bookings List Page
- **Data Grid**: Display all bookings with filtering capabilities
- **Filter Controls**: 
  - Status (pending, confirmed, paid, cancelled)
  - Tour ID
  - Date range (startDateFrom, startDateTo)
  - Customer name
  - Pagination (limit, offset)
- **Booking Details**: Customer info, tour, date, status, reference
- **Quick Actions**: View details, update status, transfer booking
- **Expandable Rows**: Click row to expand and view full details
- **Modal Expansion**: Click booking to open modal with all details and update options

#### Booking Modal (Expanded View)
When clicking a booking, open a modal with:
- **Customer Information**: Full name, document ID, phone, email, notes
- **Booking Details**: Tour name, date, number of participants, price
- **Status Timeline**: All status changes with timestamps and reasons
- **Actions Panel**: 
  - Update status dropdown
  - Reason input field for status change
  - Transfer to different tour button
  - Cancel booking button
  - View related event details

### Events Management Section

#### Events Calendar Page with Tabs
- **Tab Navigation**: "Bookings Calendar" and "Events Calendar" tabs

**Bookings Calendar Tab:**
- **Full Calendar View**: Month, week, and day views
- **Booking Indicators**: Each booking shown as a calendar event
- **Color Coding**: Different colors by booking status
- **Click to Expand**: Click any booking to see full details and update options in modal
- **Booking Filtering**: Filter by status, tour, customer
- **Booking Actions**: Quick status updates directly from calendar view

**Events Calendar Tab:**
- **Event Calendar View**: Month, week, and day views
- **Event Indicators**: Each event shown with tour name and capacity
- **Color Coding**: Different colors by event type (private/public) and status
- **Event Details**: Capacity utilization, number of bookings
- **Quick Actions**: Publish/unpublish event directly from calendar
- **Event Filtering**: By tour, type (private/public), status

#### Events List Page
- **Table View**: Same information as calendar but in table format
- **Capacity Indicators**: Visual indicators for booking levels
- **Quick Actions**: Publish/unpublish, view details

## Core Functionalities (Based on Current API)

### Tour Management
- **Create Tours**: Form with bilingual fields (name, description, etc.)
- **Update Tours**: Edit existing tour details
- **Manage Tour Status**: Toggle active/inactive (logical delete)
- **View Tour Details**: Complete tour information in both languages
- **Dynamic Itinerary Management**: Edit tour activities day-by-day
- **Pricing Tier Management**: Configure group-based pricing
- **Image Management**: Upload and manage tour images via URLs

### Booking Management
- **View All Bookings**: Filtered list with pagination
- **Update Booking Status**: Change status with reason tracking
- **Booking Transfers**: Move bookings between tours/dates
- **View Booking Details**: Complete customer and booking information
- **Status History**: Complete audit trail of status changes
- **Calendar View**: Visual booking calendar with expandable details

### Event Management
- **Calendar View**: Visual calendar with filter capabilities
- **Event Publishing**: Toggle between private/public with audit trail
- **Capacity Management**: View capacity status (booked vs max)
- **Event Details**: Complete event information
- **Booking Calendar**: Separate calendar view for bookings

### Settings/Authentication
- **Token Management**: Secure token entry and validation
- **Logout/Token Clear**: Clear token from browser storage

## User Experience Flows (Based on Current API)

### Tour Management Flow
1. **View Tours**: Access tour list from navigation
2. **Create Tour**: Fill form with bilingual content
3. **Update Tour**: Select tour and modify details
4. **Toggle Status**: Change active/inactive status
5. **Manage Details**: Click tour to expand and manage itinerary, pricing, and images

### Booking Management Flow
1. **View Bookings**: Access with filters from navigation
2. **Filter Bookings**: Apply status, date, customer filters
3. **Update Status**: Select booking and change status
4. **Transfer Booking**: Move booking to different tour/date
5. **Calendar View**: Switch to calendar to see bookings visually
6. **Expand Booking**: Click booking in list or calendar to see all details

### Event Management Flow
1. **Calendar View**: See all events visually
2. **Filter Events**: Apply tour, date, type, status filters
3. **Toggle Visibility**: Change event from private to public or vice versa
4. **View Details**: See event information and associated bookings
5. **Switch Tabs**: Toggle between bookings calendar and events calendar

## Security Features

### Single Token Authentication
- **Global Header**: X-Admin-Secret-Key added to all admin requests
- **Token Validation**: Validate token on startup
- **Secure Storage**: Token stored in Redux store (not local storage for better security)
- **Token Expiration**: No expiration (static token system)

### API Communication
- **Secure Headers**: All requests include admin token
- **Error Handling**: Proper handling of 401 unauthorized responses
- **Retry Logic**: Handle failed requests gracefully
- **No Rate Limiting**: Admin operations are not subject to rate limiting (only customer booking actions are rate limited)

## Implementation Based on Current Capabilities

### Phase 1: Core Functionality
- Dashboard with quick stats
- Tour management (create, update, status toggle)
- Booking listing with filtering
- Basic event calendar view
- Admin token authentication system

### Phase 2: Advanced Features
- Booking status updates with detailed logging
- Booking transfers between tours
- Event publish/unpublish controls
- Enhanced filtering and pagination

### Phase 3: Enhanced UX Features
- Tour detail views with 4 tabs (info, itinerary, pricing, images)
- Booking detail modals with complete information
- Dual-calendar view (bookings and events tabs)
- Expanded booking calendar with interactive features

---

## Success Metrics
- **Task Completion**: Time to complete common admin tasks
- **Error Rate**: % of API calls that fail due to authentication or other issues
- **User Satisfaction**: Feedback on UI/UX for common operations
- **System Performance**: Page load times and API response times
- **Security**: Successful authentication and proper access control