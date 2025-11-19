# Nevado Trek Backend (V2.0 - Departure Centric)

This is the refactored backend for the Nevado Trek reservation system. It has been re-architected to follow a **Departure-Centric** logic, separating Master Tours, Specific Departures, and Bookings to handle complex scenarios like public/private groups, dynamic pricing, and flexible transfers.

## 📚 Documentation

*   **[ARCHITECTURE.md](ARCHITECTURE.md)**: **(READ THIS FIRST)** The single source of truth for the system architecture, database schema, and API endpoints.
*   **[new-logic-quotes.md](new-logic-quotes.md)**: The business requirements and logic definitions that drove this refactor.

## 🚀 Key Features

*   **Monolithic API**: A single Cloud Function (`api`) serving an Express.js app with 15+ endpoints.
*   **Departure-Centric**: Bookings are linked to specific Departures (dates), not just generic "events".
*   **Public vs Private**: Explicit handling of Open Groups (Public) and Private Trips.
*   **Advanced Management**:
    *   **Split**: Detach a booking from a group to create a private trip.
    *   **Move**: Transfer bookings between dates/tours with automatic capacity handling.
    *   **Safe Delete**: Prevents deleting departures with active passengers.
*   **Versioning**: Tours have version numbers to track changes over time.

## 🛠️ Setup & Development

### Prerequisites
*   Node.js 22
*   Firebase CLI
*   Google Cloud Project (`nevadotrektest01`)

### Installation
```bash
cd functions
npm install
```

### Local Development (Emulator)
```bash
firebase emulators:start
```

### Deployment
```bash
firebase deploy --only functions
```

### Verification
Run the test script to verify the core flows (Create Tour -> Create Booking -> Split -> Move):
```bash
node test_full_endpoints.js
```

## 🔐 Security

*   **Admin Endpoints**: Protected by `X-Admin-Secret-Key` header.
*   **Public Endpoints**: Open for frontend integration.

## 🏗️ Project Structure

```
/functions
  /src
    /controllers   # Logic for Tours, Departures, Bookings
    /middleware    # Auth and validation
    constants.js   # System enums and config
  index.js         # Main Express App Entry Point
```