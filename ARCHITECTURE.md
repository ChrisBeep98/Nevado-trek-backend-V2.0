# Nevado Trek Backend - Architecture & API

## Overview
This backend is built on **Firebase Cloud Functions (2nd Gen)** using **Node.js 22**. It uses a "Monolithic API" approach where a single Cloud Function (`api`) hosts an **Express.js** application that routes all requests.

## Architecture
- **Runtime**: Node.js 22
- **Framework**: Express.js
- **Database**: Firestore (NoSQL)
- **Authentication**: `X-Admin-Secret-Key` header for admin routes.

## Database Schema

### 1. `tours` (Master Catalog)
Defines the product. Contains versioning, bilingual content, and pricing templates.
```typescript
interface Tour {
  tourId: string;
  isActive: boolean;
  version: number;
  name: { es: string, en: string };
  description: { es: string, en: string };
  pricingTiers: PricingTier[]; // [1pax, 2pax, 3pax, 4-8pax]
  itinerary: Itinerary; // Dynamic days/activities
  images: string[];
  // ... other details
}
```

### 2. `departures` (Event Instances)
Specific instances of a tour on a date.
```typescript
interface Departure {
  departureId: string;
  tourId: string;
  date: Date;
  type: 'private' | 'public';
  status: 'open' | 'closed' | 'completed' | 'cancelled';
  maxPax: number;
  currentPax: number;
  pricingSnapshot: PricingTier[]; // Copied from Tour at creation
}
```

### 3. `bookings` (Reservations)
Links a customer to a departure.
```typescript
interface Booking {
  bookingId: string;
  departureId: string;
  customer: CustomerInfo;
  pax: number;
  originalPrice: number;
  finalPrice: number; // Allow admin discounts
  status: 'pending' | 'confirmed' | 'paid' | 'cancelled';
}
```

## API Endpoints

### Admin Routes (Header: `x-admin-secret-key`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/admin/tours` | Create a new Tour |
| `GET` | `/admin/tours` | List all tours |
| `PUT` | `/admin/tours/:id` | Update Tour (Increments version) |
| `DELETE` | `/admin/tours/:id` | Soft delete Tour |
| `POST` | `/admin/departures` | Create Departure (Public/Private) |
| `GET` | `/admin/departures` | Calendar View (Query: `start`, `end`) |
| `PUT` | `/admin/departures/:id` | Update Departure (Date, Status) |
| `POST` | `/admin/departures/:id/split` | **Split**: Move booking to new Private Departure |
| `DELETE` | `/admin/departures/:id` | **Safe Delete**: Only if empty |
| `PUT` | `/admin/bookings/:id` | Update Booking (Price, Info) |
| `POST` | `/admin/bookings/:id/move` | **Move**: Transfer to different Tour/Date |

### Public Routes
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/public/tours` | List Active Tours |
| `GET` | `/public/departures` | List Open Public Departures |
| `POST` | `/public/bookings` | Create Booking (Joins Public or Creates Private) |

## Business Logic Rules
1.  **Pricing**: Departures take a snapshot of Tour pricing. Changing the Tour price does NOT affect existing Departures.
2.  **Booking**: 
    - If `type=public` and open slot exists -> Join.
    - Else -> Create new Private Departure.
3.  **Split**: Admin can "detach" a booking from a Public group into its own Private trip.
4.  **Move**: Changing a booking's date automatically moves it to a new Departure (Find or Create).
