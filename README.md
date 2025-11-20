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