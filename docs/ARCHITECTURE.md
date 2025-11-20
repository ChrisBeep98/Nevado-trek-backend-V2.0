# Nevado Trek Backend - Architecture Documentation V2.0

## Overview

The Nevado Trek backend is a **Departure-Centric** reservation management system built on **Firebase Cloud Functions (2nd Gen)** using **Node.js 22**. It implements a refined booking logic with proper cascade effects, separated admin/public flows, and full emulator compatibility.

### Technology Stack
- **Runtime**: Node.js 22
- **Platform**: Firebase Cloud Functions (2nd Gen) on Google Cloud Run
- **Framework**: Express.js (Monolithic API pattern)
- **Database**: Firestore (NoSQL)
- **Authentication**: Header-based secret key (`X-Admin-Secret-Key`)
- **Deployment**: Automated via Firebase CLI

---

## Core Architecture Principles

### 1. Departure-Centric Model
The system revolves around **Departures** as the operational anchor, not bookings. This ensures:
- Departures exist independently of bookings
- Clear separation between tour templates and actual trips
- Proper capacity management at the departure level
- Simplified date/tour change operations

### 2. Immutable Pricing Snapshots
- Tours define pricing templates
- Departures capture a **pricing snapshot** at creation time
- Changing tour prices doesn't affect existing departures
- Provides contractual protection for confirmed bookings

### 3. Explicit Flow Separation
- **Admin Flow**: Always creates new departures (no auto-join)
- **Public Join Flow**: Joins specific existing public departures
- **Public Private Flow**: Creates new private departures
- Clear distinction prevents logic ambiguity

### 4. Cascade Effects
All operations that affect capacity or status properly cascade to related entities:
- Cancelling booking → Decrements departure capacity
- Changing pax → Updates departure capacity + recalculates price
- Moving booking → Updates both source and target departures
- Type conversion → Handles all three scenarios correctly

---

## Data Model

### Entity Relationship Diagram

```
TOUR (Template)
  │
  ├─→ DEPARTURE (Instance)
  │     │
  │     ├─→ BOOKING (Reservation)
  │     ├─→ BOOKING
  │     └─→ BOOKING
  │
  └─→ DEPARTURE
        │
        └─→ BOOKING
```

### 1. Tours Collection (`tours`)

**Purpose**: Master catalog of tour products. Defines the experience template.

```typescript
interface Tour {
  // Identity
  tourId: string;
  isActive: boolean;
  version: number;
  
  // Bilingual Content
  name: { es: string, en: string };
  description: { es: string, en: string };
  shortDescription?: { es: string, en: string };
  
  // Pricing Structure (EXACTLY 4 tiers)
  pricingTiers: [
    { minPax: 1, maxPax: 1, priceCOP: number, priceUSD: number },
    { minPax: 2, maxPax: 2, priceCOP: number, priceUSD: number },
    { minPax: 3, maxPax: 3, priceCOP: number, priceUSD: number },
    { minPax: 4, maxPax: 8, priceCOP: number, priceUSD: number }
  ];
  
  // Content
  type: 'multi-day' | 'single-day';
  itinerary?: {
    days: Array<{
      dayNumber: number;
      title: { es: string, en: string };
      activities: Array<{ es: string, en: string }>;
    }>;
  };
  images?: string[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}
```

**Business Rules**:
- Pricing tiers are strictly validated (exactly 4 tiers with specific ranges)
- Bilingual content required for name and description
- Soft delete via `isActive: false`
- Version increments on significant changes

### 2. Departures Collection (`departures`)

**Purpose**: Specific instances of a tour on a specific date. The operational anchor.

```typescript
interface Departure {
  // Identity
  departureId: string;
  tourId: string; // Reference to tour
  
  // Scheduling
  date: Date; // Departure date
  
  // Type & Status
  type: 'private' | 'public';
  status: 'open' | 'closed' | 'completed' | 'cancelled';
  
  // Capacity Management
  maxPax: number; // 8 for public, 99 for private
  currentPax: number; // Current occupied capacity
  
  // Pricing Snapshot (Immutable)
  pricingSnapshot: PricingTier[]; // Copied from tour at creation
  
  // Metadata
  createdAt: Date;
  updatedAt?: Date;
}
```

**Business Rules**:
- Public departures: `maxPax = 8`, visible on website
- Private departures: `maxPax = 99`, not publicly listed
- `currentPax` managed via transactions (prevents overbooking)
- Pricing snapshot ensures price stability
- Can convert between public/private types

### 3. Bookings Collection (`bookings`)

**Purpose**: Individual customer reservations. Links customers to departures.

```typescript
interface Booking {
  // Identity
  bookingId: string;
  departureId: string; // Reference to departure
  
  // Customer Information (All Required)
  customer: {
    name: string;
    email: string; // Validated format
    phone: string; // International format
    document: string; // Required for insurance
  };
  
  // Capacity
  pax: number; // Number of passengers
  
  // Pricing
  originalPrice: number; // Calculated from tier
  finalPrice: number; // After discounts
  discountReason?: string; // Optional discount explanation
  
  // Status
  status: 'pending' | 'confirmed' | 'paid' | 'cancelled';
  
  // Metadata
  createdAt: Date;
  updatedAt?: Date;
}
```

**Business Rules**:
- All customer fields are required and validated
- Price calculated from departure's pricing snapshot
- Discounts preserved proportionally when pax changes
- Status changes cascade to departure capacity
- Pax changes cascade to departure capacity

---

## API Endpoints

### Admin Routes (Protected)

**Authentication**: Header `X-Admin-Secret-Key: ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7`

#### Tours Management

| Method | Endpoint | Description | Cascade Effects |
|--------|----------|-------------|-----------------|
| `POST` | `/admin/tours` | Create new tour | None |
| `GET` | `/admin/tours` | List all tours (including inactive) | None |
| `GET` | `/admin/tours/:id` | Get specific tour | None |
| `PUT` | `/admin/tours/:id` | Update tour (increments version) | None (existing departures unaffected) |
| `DELETE` | `/admin/tours/:id` | Soft delete tour | None |

#### Departures Management

| Method | Endpoint | Description | Cascade Effects |
|--------|----------|-------------|-----------------|
| `POST` | `/admin/departures` | Create departure | None |
| `GET` | `/admin/departures` | Calendar view (query: start, end) | None |
| `PUT` | `/admin/departures/:id` | Update departure properties | Updates all bookings if date changes |
| `POST` | `/admin/departures/:id/split` | Split booking to new private departure | Updates both departures' capacity |
| `DELETE` | `/admin/departures/:id` | Safe delete (only if empty) | Fails if bookings exist |

#### Bookings Management

| Method | Endpoint | Description | Cascade Effects |
|--------|----------|-------------|-----------------|
| `POST` | `/admin/bookings` | **Create booking (ALWAYS new departure)** | Creates new departure |
| `PUT` | `/admin/bookings/:id/status` | Update booking status | Updates departure `currentPax` |
| `PUT` | `/admin/bookings/:id/pax` | Update passenger count | Updates departure `currentPax`, recalculates price |
| `PUT` | `/admin/bookings/:id/details` | Update customer information | None |
| `POST` | `/admin/bookings/:id/discount` | Apply discount to booking | None |
| `POST` | `/admin/bookings/:id/move` | Move booking to different date/tour | Updates both source and target departures |
| `POST` | `/admin/bookings/:id/convert-type` | Convert departure type | Varies by scenario (see below) |

#### Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/stats` | Get dashboard statistics (counts) |

### Public Routes (Unprotected)

#### Tours & Departures

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/public/tours` | List active tours only |
| `GET` | `/public/departures` | List open public departures (future dates) |

#### Bookings

| Method | Endpoint | Description | Cascade Effects |
|--------|----------|-------------|-----------------|
| `POST` | `/public/bookings/join` | Join existing public departure | Updates departure `currentPax` |
| `POST` | `/public/bookings/private` | Create new private departure | Creates new departure |

---

## Business Logic Rules

### 1. Admin Booking Creation

**Rule**: Admin ALWAYS creates a new departure when creating a booking.

**Flow**:
1. Admin specifies `type` (public/private)
2. System creates NEW departure with that type
3. System creates booking linked to new departure
4. Departure `currentPax` set to booking's `pax`

**Why**: Prevents accidental joining of existing departures, gives admin full control.

### 2. Public Booking Flows

#### Join Flow (`POST /public/bookings/join`)
- Requires `departureId` parameter
- Validates departure is public and open
- Validates capacity available
- Updates departure `currentPax`

#### Private Flow (`POST /public/bookings/private`)
- Always creates new private departure
- No search for existing departures
- Sets `maxPax = 99`

### 3. Departure Type Conversion

**Endpoint**: `POST /admin/bookings/:id/convert-type`

#### Scenario 1: Private → Public
- Changes departure `type` to 'public'
- Sets `maxPax = 8`
- Validates `currentPax <= 8`
- Opens for public joining

#### Scenario 2: Public (with others) → Private (Split)
- Creates NEW private departure
- Moves selected booking to new departure
- Updates old departure `currentPax` (decrements)
- New departure gets booking's `pax`

#### Scenario 3: Public (alone) → Private (Convert)
- Changes departure `type` to 'private'
- Sets `maxPax = 99`
- No capacity changes needed

### 4. Cascade Effects Matrix

| Operation | Booking Changes | Departure Changes | Validation |
|-----------|----------------|-------------------|------------|
| **Create (Admin)** | All fields | Creates new departure | Tour exists |
| **Join (Public)** | All fields | `currentPax += pax` | Capacity available |
| **Private (Public)** | All fields | Creates new departure | Tour exists |
| **Cancel Status** | `status = 'cancelled'` | `currentPax -= pax` | None |
| **Un-cancel Status** | `status = 'confirmed'` | `currentPax += pax` | Capacity available |
| **Increase Pax** | `pax`, prices | `currentPax += diff` | Capacity available |
| **Decrease Pax** | `pax`, prices | `currentPax -= diff` | None |
| **Update Details** | `customer` | None | Valid fields |
| **Apply Discount** | `finalPrice`, `discountReason` | None | None |
| **Move Booking** | `departureId` | Old: `-= pax`, New: `+= pax` | Capacity in new |
| **Convert Type** | Varies | Varies by scenario | Varies |

### 5. Capacity Management

**Critical Rules**:
- All capacity operations use Firestore transactions
- Read-before-write pattern enforced
- Manual calculations (no `FieldValue.increment()` for emulator compatibility)
- Validation happens before any writes

**Example Transaction Pattern**:
```javascript
await db.runTransaction(async (t) => {
  // 1. ALL READS FIRST
  const bookingDoc = await t.get(bookingRef);
  const depDoc = await t.get(depRef);
  
  // 2. VALIDATE
  const bookingData = bookingDoc.data();
  const depData = depDoc.data();
  if (depData.currentPax + pax > depData.maxPax) {
    throw new Error("Insufficient capacity");
  }
  
  // 3. CALCULATE NEW VALUES
  const newCurrentPax = depData.currentPax + pax;
  
  // 4. ALL WRITES AT THE END
  t.update(bookingRef, { ... });
  t.update(depRef, { currentPax: newCurrentPax });
});
```

### 6. Pricing Rules

**Tier Selection**:
- Based on `pax` count
- Finds tier where `pax >= minPax && pax <= maxPax`
- Uses departure's `pricingSnapshot` (not tour's current pricing)

**Price Calculation**:
```javascript
const tier = pricingSnapshot.find(t => pax >= t.minPax && pax <= t.maxPax);
const originalPrice = tier.priceCOP * pax;
```

**Discount Preservation**:
When pax changes, discount ratio is preserved:
```javascript
const discountRatio = oldFinalPrice / oldOriginalPrice;
const newFinalPrice = newOriginalPrice * discountRatio;
```

---

## Emulator Compatibility

All code is compatible with Firebase Emulators:

**Replaced**:
- `admin.firestore.FieldValue.serverTimestamp()` → `new Date()`
- `admin.firestore.FieldValue.increment(n)` → Manual calculation

**Transaction Pattern**:
- All reads BEFORE all writes
- Manual calculations for all numeric updates
- Explicit error handling

---

## Deployment

**Production URL**: `https://api-wgfhwjbpva-uc.a.run.app`

**Deployment Command**:
```bash
firebase deploy --only functions
```

**Environment**:
- Project: `nevadotrektest01`
- Region: `us-central1`
- Memory: 256 MB
- Runtime: Node.js 22

---

## Testing

### Local Testing (Emulators)
```bash
# Start emulators
firebase emulators:start

# Run comprehensive tests
node test_booking_logic.js
node test_full_endpoints.js
```

### Test Coverage
- ✅ Admin booking creation (always new departure)
- ✅ Public join flow (capacity validation)
- ✅ Public private flow (new departure creation)
- ✅ Status update cascade (cancel/un-cancel)
- ✅ Pax update cascade (increase/decrease)
- ✅ Details update (no cascade)
- ✅ Type conversion (all 3 scenarios)
- ✅ Capacity validation (all operations)
- ✅ Discount preservation (pax changes)
- ✅ Move booking (dual capacity updates)

---

## Migration Notes

### From V1.0 to V2.0

**Key Changes**:
1. Removed generic `updateBooking` endpoint
2. Added separated booking update endpoints
3. Implemented proper cascade effects
4. Added departure type conversion
5. Fixed emulator compatibility

**Breaking Changes**:
- `POST /public/bookings` removed
- `PUT /admin/bookings/:id` removed
- New endpoints required for all booking updates

**Data Migration**: Not required (schema compatible)

---

## Future Considerations

### Planned Features
- Group entity for managing families/friends traveling together
- Tour versioning for price change management
- Recurring departure creation
- Bulk operations on multiple bookings
- Enhanced analytics and reporting

### Scalability
- Current architecture supports horizontal scaling
- Firestore handles concurrent operations via transactions
- Cloud Functions auto-scale based on load
- No single points of failure

---

## References

- [Firebase Cloud Functions Documentation](https://firebase.google.com/docs/functions)
- [Firestore Transactions](https://firebase.google.com/docs/firestore/manage-data/transactions)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)

---

**Document Version**: 2.0  
**Last Updated**: November 19, 2025  
**Status**: Production-Ready
