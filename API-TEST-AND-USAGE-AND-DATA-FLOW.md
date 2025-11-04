# Admin API Endpoints Documentation

## Table of Contents
- [Overview](#overview)
- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Admin Endpoints](#admin-endpoints)
  - [Tour Management](#tour-management)
  - [Booking Management](#booking-management)
  - [Event Management](#event-management)
  - [Data Flow Examples](#data-flow-examples)
- [Frontend Implementation](#frontend-implementation)
- [Best Practices](#best-practices)

## Overview

The Nevado Trek Backend provides 15 admin endpoints for managing tours, bookings, and events. All admin endpoints require authentication via a secret key header and are built using Firebase Cloud Functions with Firestore as the database.

## Authentication

All admin endpoints require authentication using the `X-Admin-Secret-Key` header:

### Header Format
```
X-Admin-Secret-Key: {your_admin_secret_key}
```

### Example Request
```javascript
const headers = {
  'X-Admin-Secret-Key': 'your_secret_key_here',
  'Content-Type': 'application/json'
};

fetch('https://us-central1-nevadotrektest01.cloudfunctions.net/adminGetBookings', {
  method: 'GET',
  headers: headers
});
```

### Frontend Implementation
```javascript
// For Vite-based projects, set VITE_API_BASE_URL in your .env file:
// VITE_API_BASE_URL=https://us-central1-nevadotrektest01.cloudfunctions.net

const BASE_API_URL = import.meta.env.VITE_API_BASE_URL || 'https://us-central1-nevadotrektest01.cloudfunctions.net';

const makeAdminRequest = async (endpoint, method = 'GET', data = null) => {
  const headers = {
    'X-Admin-Secret-Key': import.meta.env.VITE_ADMIN_SECRET_KEY || process.env.REACT_APP_ADMIN_SECRET_KEY || ADMIN_SECRET_KEY,
    'Content-Type': 'application/json'
  };

  const config = {
    method,
    headers
  };

  if (data && (method === 'POST' || method === 'PUT')) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${BASE_API_URL}${endpoint}`, config);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Admin API Error:', error);
    throw error;
  }
};
```

## Rate Limiting

Admin endpoints have special rate limiting considerations:
- No rate limiting applied to admin endpoints (only to customer-facing endpoints)
- Admin functions can perform multiple operations during administrative tasks

## Admin Endpoints

### Tour Management

#### 1. GET /getToursV2

**Purpose**: Retrieve all active tours.

**Headers Required**: 
- `X-Admin-Secret-Key` (optional for public access)

**Parameters**: None

**Response**:
```json
[
  {
    "tourId": "string",
    "name": {
      "es": "string",
      "en": "string"
    },
    "description": {
      "es": "string",
      "en": "string"
    },
    "duration": "string",
    "maxParticipants": "number",
    "isActive": "boolean",
    "pricingTiers": [
      {
        "paxFrom": "number",
        "paxTo": "number",
        "pricePerPerson": {
          "COP": "number",
          "USD": "number"
        }
      }
    ],
    "includes": {
      "es": ["string"],
      "en": ["string"]
    },
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
]
```

#### 2. GET /getTourByIdV2/{tourId}

**Purpose**: Retrieve a specific tour by ID.

**Headers Required**: 
- `X-Admin-Secret-Key` (optional for public access)

**URL Parameters**: 
- `tourId`: The ID of the tour to retrieve

**Response**:
```json
{
  "tourId": "string",
  "name": {
    "es": "string", 
    "en": "string"
  },
  // ... same as getToursV2 response
}
```

#### 3. POST /adminCreateTourV2

**Purpose**: Create a new tour.

**Headers Required**: 
- `X-Admin-Secret-Key`

**Request Body**:
```json
{
  "name": {
    "es": "string",
    "en": "string"
  },
  "description": {
    "es": "string",
    "en": "string"  
  },
  "duration": "string",
  "maxParticipants": "number",
  "isActive": "boolean",
  "pricingTiers": [
    {
      "paxFrom": "number",
      "paxTo": "number",
      "pricePerPerson": {
        "COP": "number",
        "USD": "number"
      }
    }
  ],
  "includes": {
    "es": ["string"],
    "en": ["string"]
  }
}
```

**Response**:
```json
{
  "success": true,
  "tourId": "string",
  "message": "Tour created successfully"
}
```

#### 4. PUT /adminUpdateTourV2/{tourId}

**Purpose**: Update an existing tour.

**Headers Required**: 
- `X-Admin-Secret-Key`

**URL Parameters**: 
- `tourId`: The ID of the tour to update

**Request Body**: Partial tour data to update

**Response**:
```json
{
  "success": true,
  "tourId": "string", 
  "message": "Tour updated successfully"
}
```

#### 5. DELETE /adminDeleteTourV2/{tourId}

**Purpose**: Logically delete a tour (sets isActive to false).

**Headers Required**: 
- `X-Admin-Secret-Key`

**URL Parameters**: 
- `tourId`: The ID of the tour to delete

**Response**:
```json
{
  "success": true,
  "tourId": "string",
  "message": "Tour deleted successfully (marked as inactive)"
}
```

### Booking Management

#### 6. POST /adminCreateBooking

**Purpose**: Create a new booking as an admin (without rate limiting).

**Headers Required**: 
- `X-Admin-Secret-Key`

**Request Body**:
```json
{
  "tourId": "string",
  "startDate": "string", // ISO date string (YYYY-MM-DD or ISO format)
  "customer": {
    "fullName": "string",
    "documentId": "string", 
    "phone": "string",
    "email": "string"
  },
  "pax": "number",
  "status": "string" // Optional: pending (default), confirmed, paid, etc.
}
```

**Response**:
```json
{
  "success": true,
  "bookingId": "string",
  "bookingReference": "string",
  "status": "string",
  "message": "Reserva creada exitosamente por administrador."
}
```

#### 7. GET /adminGetBookings

**Purpose**: Retrieve all bookings with filtering capabilities.

**Headers Required**: 
- `X-Admin-Secret-Key`

**Query Parameters**:
- `status`: Filter by booking status
- `tourId`: Filter by tour ID
- `startDateFrom`: Filter by start date from
- `startDateTo`: Filter by start date to
- `customerName`: Filter by customer name
- `limit`: Number of results per page (max 200)
- `offset`: Pagination offset

**Response**:
```json
{
  "bookings": [
    {
      "bookingId": "string",
      "eventId": "string",
      "tourId": "string",
      "tourName": "string",
      "customer": {
        "fullName": "string",
        "documentId": "string",
        "phone": "string",
        "email": "string"
      },
      "pax": "number",
      "pricePerPerson": "number",
      "totalPrice": "number",
      "bookingDate": "timestamp",
      "status": "string",
      "bookingReference": "string",
      "isEventOrigin": "boolean",
      "statusHistory": [
        {
          "timestamp": "string",
          "status": "string",
          "note": "string",
          "adminUser": "string"
        }
      ]
    }
  ],
  "count": "number",
  "pagination": {
    "limit": "number",
    "offset": "number", 
    "hasMore": "boolean"
  }
}
```

#### 7. PUT /adminUpdateBookingStatus/{bookingId}

**Purpose**: Update the status of a booking.

**Headers Required**: 
- `X-Admin-Secret-Key`

**URL Parameters**: 
- `bookingId`: The ID of the booking to update

**Request Body**:
```json
{
  "status": "string", // Valid: pending, confirmed, paid, cancelled, cancelled_by_admin
  "reason": "string"  // Optional reason for the status change
}
```

**Response**:
```json
{
  "success": true,
  "bookingId": "string",
  "message": "Estado de la reserva actualizado exitosamente",
  "previousStatus": "string",
  "newStatus": "string"
}
```

#### 8. PUT /adminUpdateBookingDetails/{bookingId}

**Purpose**: Update booking details (customer info, pax, etc.).

**Headers Required**: 
- `X-Admin-Secret-Key`

**URL Parameters**: 
- `bookingId`: The ID of the booking to update

**Request Body**:
```json
{
  "customer": {
    "fullName": "string",
    "documentId": "string",
    "phone": "string",
    "email": "string"
  },
  "pax": "number",
  "pricePerPerson": "number",
  "totalPrice": "number"
}
```

**Response**:
```json
{
  "success": true,
  "bookingId": "string",
  "message": "Detalles de la reserva actualizados exitosamente",
  "booking": {
    // Complete booking object
  }
}
```

#### 9. POST /adminTransferBooking/{bookingId}

**Purpose**: Transfer a booking to a different event within the same tour.

**Headers Required**: 
- `X-Admin-Secret-Key`

**URL Parameters**: 
- `bookingId`: The ID of the booking to transfer

**Request Body**:
```json
{
  "destinationEventId": "string",
  "reason": "string" // Optional reason for the transfer
}
```

**Response**:
```json
{
  "success": true,
  "bookingId": "string",
  "message": "Reserva transferida exitosamente",
  "previousEventId": "string",
  "newEventId": "string",
  "pax": "number",
  "reason": "string"
}
```

#### 10. POST /adminTransferToNewTour/{bookingId}

**Purpose**: Transfer a booking to a different tour (and optionally a different date).

**Headers Required**: 
- `X-Admin-Secret-Key`

**URL Parameters**: 
- `bookingId`: The ID of the booking to transfer

**Request Body**:
```json
{
  "newTourId": "string",
  "newStartDate": "string", // Optional new start date in ISO format
  "reason": "string" // Optional reason for the transfer
}
```

**Response**:
```json
{
  "success": true,
  "message": "Reserva transferida exitosamente a nuevo tour",
  "originalBookingId": "string",
  "newBookingId": "string",
  "newBookingReference": "string",
  "cancelledBookingStatus": "string",
  "pax": "number",
  "reason": "string"
}
```

### Event Management

#### 11. GET /adminGetEventsCalendar

**Purpose**: Retrieve all events with filtering capabilities (for calendar view).

**Headers Required**: 
- `X-Admin-Secret-Key`

**Query Parameters**:
- `tourId`: Filter by tour ID
- `startDateFrom`: Filter by start date from
- `startDateTo`: Filter by start date to
- `type`: Filter by event type (private/public)
- `status`: Filter by status (active, full, completed, cancelled)
- `limit`: Number of results per page (max 200)
- `offset`: Pagination offset

**Response**:
```json
{
  "events": [
    {
      "eventId": "string",
      "tourId": "string",
      "tourName": "string",
      "startDate": "string", // ISO date string
      "endDate": "string", // ISO date string
      "maxCapacity": "number",
      "bookedSlots": "number",
      "type": "string", // private/public
      "status": "string",
      "totalBookings": "number",
      "createdAt": "string", // ISO date string
      "updatedAt": "string" // ISO date string
    }
  ],
  "count": "number",
  "pagination": {
    "limit": "number",
    "offset": "number",
    "hasMore": "boolean"
  }
}
```

#### 12. POST /adminPublishEvent/{eventId}

**Purpose**: Publish or unpublish an event (change between private and public).

**Headers Required**: 
- `X-Admin-Secret-Key`

**URL Parameters**: 
- `eventId`: The ID of the event to publish/unpublish

**Request Body**:
```json
{
  "action": "string" // 'publish' to make public, 'unpublish'/'private' to make private
}
```

**Response**:
```json
{
  "success": true,
  "eventId": "string",
  "message": "Evento actualizado exitosamente a {type}",
  "previousType": "string",
  "newType": "string"
}
```

## Data Flow Examples

### 1. Complete Tour Transfer Flow

When a booking is transferred from one tour to another:

1. **Original Booking**: ID `123` on "Tour A" with 2 pax
2. **Transfer Request**: Use `adminTransferToNewTour` with new tour ID
3. **System Actions**:
   - Original booking marked as cancelled (`cancelled_by_admin`)
   - New booking created on "Tour B" with same customer details
   - New event created on "Tour B" if needed
   - Original event capacity increased by 2
   - New event capacity decreased by 2
4. **Result**: New booking ID `456` on "Tour B"

### 2. Date Change Flow

When a booking date changes:

1. **Original Booking**: ID `123` on "Tour A" for Nov 15
2. **Transfer Request**: Use `adminTransferToNewTour` with new date
3. **System Actions**:
   - Original booking marked as cancelled
   - New booking created on "Tour A" for new date (e.g., Dec 20)
   - New event created for Dec 20 if needed
   - Original event capacity increased
   - New event capacity decreased
4. **Result**: New booking ID `789` on "Tour A" for Dec 20

### 3. Status Update Flow

When updating booking status:

1. **Get Booking**: Retrieve booking to check current status
2. **Validate Transition**: Ensure status change is allowed (e.g., can't change cancelled to confirmed)
3. **Update Status**: Change status in database
4. **Update Capacity**: If cancelling, increase event capacity
5. **Add History**: Log status change in booking history
6. **Response**: Return confirmation with previous and new status

## Frontend Implementation

### 1. Admin Panel Structure

```javascript
// Example Admin Panel Component
const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('bookings');
  const [bookings, setBookings] = useState([]);
  const [tours, setTours] = useState([]);
  
  // Fetch bookings
  const fetchBookings = async () => {
    try {
      const data = await makeAdminRequest('/adminGetBookings');
      setBookings(data.bookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };
  
  // Update booking status
  const updateBookingStatus = async (bookingId, newStatus, reason) => {
    try {
      const response = await makeAdminRequest(
        `/adminUpdateBookingStatus/${bookingId}`, 
        'PUT', 
        { status: newStatus, reason }
      );
      // Update local state or refetch bookings
      fetchBookings();
    } catch (error) {
      console.error('Error updating booking status:', error);
    }
  };
  
  return (
    <div className="admin-panel">
      {/* Navigation tabs */}
      <nav>
        <button onClick={() => setActiveTab('bookings')}>Bookings</button>
        <button onClick={() => setActiveTab('tours')}>Tours</button>
        <button onClick={() => setActiveTab('events')}>Events</button>
      </nav>
      
      {/* Content based on active tab */}
      {activeTab === 'bookings' && (
        <BookingsView 
          bookings={bookings} 
          onUpdateStatus={updateBookingStatus}
          onTransfer={handleTransfer}
        />
      )}
      {/* Other tabs... */}
    </div>
  );
};
```

### 2. Tour Management Component

```javascript
const TourManager = () => {
  const [tours, setTours] = useState([]);
  const [editingTour, setEditingTour] = useState(null);
  
  const createTour = async (tourData) => {
    try {
      const response = await makeAdminRequest('/adminCreateTourV2', 'POST', tourData);
      // Refresh tours list
      fetchTours();
    } catch (error) {
      console.error('Error creating tour:', error);
    }
  };
  
  const updateTour = async (tourId, updateData) => {
    try {
      const response = await makeAdminRequest(`/adminUpdateTourV2/${tourId}`, 'PUT', updateData);
      // Refresh tours list
      fetchTours();
    } catch (error) {
      console.error('Error updating tour:', error);
    }
  };
  
  const deleteTour = async (tourId) => {
    if (window.confirm('Are you sure you want to delete this tour?')) {
      try {
        const response = await makeAdminRequest(`/adminDeleteTourV2/${tourId}`, 'DELETE');
        // Refresh tours list
        fetchTours();
      } catch (error) {
        console.error('Error deleting tour:', error);
      }
    }
  };
};
```

### 3. Booking Transfer Component

```javascript
const BookingTransferModal = ({ bookingId, onClose, onTransferComplete }) => {
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedTour, setSelectedTour] = useState('');
  const [events, setEvents] = useState([]);
  const [tours, setTours] = useState([]);
  const [reason, setReason] = useState('');

  useEffect(() => {
    // Load tours and events
    loadTours();
    loadEvents();
  }, []);

  const loadTours = async () => {
    try {
      const response = await makeAdminRequest('/getToursV2');
      setTours(response);
    } catch (error) {
      console.error('Error loading tours:', error);
    }
  };

  const loadEvents = async (tourId) => {
    try {
      const response = await makeAdminRequest('/adminGetEventsCalendar', 'GET', null, {
        tourId: tourId
      });
      setEvents(response.events);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const handleTourChange = (tourId) => {
    setSelectedTour(tourId);
    loadEvents(tourId);
  };

  const transferBooking = async () => {
    try {
      const response = await makeAdminRequest(`/adminTransferToNewTour/${bookingId}`, 'POST', {
        newTourId: selectedTour,
        reason: reason || 'Booking transfer'
      });
      
      onTransferComplete(response);
      onClose();
    } catch (error) {
      console.error('Error transferring booking:', error);
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Transfer Booking</h2>
        <div className="form-group">
          <label>Select Tour:</label>
          <select onChange={(e) => handleTourChange(e.target.value)}>
            <option value="">Select Tour</option>
            {tours.map(tour => (
              <option key={tour.tourId} value={tour.tourId}>
                {tour.name.es}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label>Select Event:</label>
          <select 
            value={selectedEvent} 
            onChange={(e) => setSelectedEvent(e.target.value)}
          >
            <option value="">Select Event</option>
            {events.map(event => (
              <option key={event.eventId} value={event.eventId}>
                {new Date(event.startDate).toLocaleDateString()} ({event.bookedSlots}/{event.maxCapacity})
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label>Transfer Reason:</label>
          <input 
            type="text" 
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        
        <button onClick={transferBooking}>Transfer Booking</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};
```

## Best Practices

### 1. Security

- Never expose the admin secret key in client-side code or public repositories
- Use environment variables for the secret key
- Implement proper admin authentication on top of API key validation
- Log all admin actions for audit trails
- Validate and sanitize all user inputs

### 2. Error Handling

- Implement proper error handling for all API calls
- Show user-friendly error messages
- Handle network errors gracefully
- Use loading states during API calls

### 3. Data Validation

- Validate data on the frontend before sending to the backend
- Provide clear feedback when data is invalid
- Use proper form validation

### 4. Performance

- Use pagination for large datasets
- Implement caching where appropriate
- Optimize network requests
- Consider using GraphQL for complex queries instead of multiple REST calls

### 5. User Experience

- Provide clear feedback when operations are successful or fail
- Implement undo functionality where possible
- Show loading indicators during operations
- Use appropriate confirmation dialogs for destructive operations

## Common Implementation Patterns

### 1. Admin Dashboard Layout

```javascript
// Layout structure
const AdminDashboard = () => {
  return (
    <div className="admin-dashboard">
      <Sidebar />
      <main className="content">
        <Header />
        <Route path="/admin/bookings" component={BookingManager} />
        <Route path="/admin/tours" component={TourManager} />
        <Route path="/admin/events" component={EventManager} />
      </main>
    </div>
  );
};
```

### 2. Authentication Wrapper

```javascript
const withAdminAuth = (WrappedComponent) => {
  return (props) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);

    useEffect(() => {
      checkAdminAuth();
    }, []);

    const checkAdminAuth = async () => {
      try {
        const response = await makeAdminRequest('/adminGetBookings');
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
        // Redirect to login or show error
      } finally {
        setCheckingAuth(false);
      }
    };

    if (checkingAuth) {
      return <div>Loading...</div>;
    }

    if (!isAuthenticated) {
      return <AdminLogin onLoginSuccess={() => setIsAuthenticated(true)} />;
    }

    return <WrappedComponent {...props} />;
  };
};
```

This documentation provides a comprehensive guide for implementing and using all admin endpoints in the Nevado Trek Backend system.