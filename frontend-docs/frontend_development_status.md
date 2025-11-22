# Frontend Development Status - Nevado Trek Admin Dashboard

**Last Updated**: 2025-11-22  
**Current Focus**: Booking Management Refactoring  
**Status**: 🟡 In Progress - E2E Testing Refactoring Needed

---

## 📍 Current Development Stage

### Active Work: Booking Reservations Module

**Phase**: Backend Integration Complete, E2E Test Refactoring Pending

**What We're Building**:
- ✅ Private booking date/tour updates (independent)
- ✅ Public booking restrictions and conversion flow
- ⏳ E2E test suite refactoring to match new backend behavior

---

## 🎯 User Requirements (Original Prompts)

### Booking Update Functionality

**Goal**: Ensure correct functionality for changing tour and date of bookings

**Key Requirements**:

1. **Private Bookings**:
   - ✅ Allow **independent** changes to date
   - ✅ Allow **independent** changes to tour
   - ✅ Database updates must reflect changes in the linked departure
   - ✅ Price recalculation when tour changes

2. **Public Bookings**:
   - ✅ Display clear UX message: **Must convert to private before date/tour changes**
   - ✅ Show "Convert to Private" button
   - ✅ Once converted → link to new private departure
   - ✅ Enable date/tour modifications after conversion

3. **E2E Testing**:
   - ⏳ **PENDING**: Refactor comprehensive E2E tests for all booking scenarios
   - ⏳ **PENDING**: Update tests to match new backend behavior
   - ⏳ **PENDING**: Ensure tests cover:
     - Private booking: independent date updates
     - Private booking: independent tour updates
     - Public booking: blocked state verification
     - Public booking: conversion flow
     - Post-conversion: update abilities

4. **Backend Updates**:
   - ✅ Modified backend logic to support frontend changes
   - ✅ Ensured data integrity
   - ✅ Comprehensive endpoint testing (18/18 passing)
   - ✅ Deployed to production

5. **Testing Requirements**:
   - ⏳ **PENDING**: E2E tests with emulators
   - ⏳ **PENDING**: Post-deployment endpoint verification
   - ✅ Backend endpoint tests passing

---

## 🏗️ Current Implementation Status

### Components

#### ✅ BookingModal.tsx
**Location**: `admin-dashboard/src/components/modals/BookingModal.tsx`

**Implemented Features**:
- ✅ Separate "Update Date" and "Update Tour" fields for **private** bookings
- ✅ Independent mutation calls:
  - `useDepartureMutations().updateDate`
  - `useDepartureMutations().updateTour`
- ✅ **Public** bookings: Blocked state UI
  - Shows warning message: "Change Date/Tour - Blocked"
  - Displays "Convert to Private" button with explanation
  - Hides date/tour update inputs
- ✅ Type-based conditional rendering:
  - `booking.type === 'private'` → Shows update options
  - `booking.type === 'public'` → Shows blocked state + convert button
- ✅ Proper `data-testid` attributes for Playwright selectors

**Test IDs Used**:
```typescript
// Actions tab
data-testid="tab-actions"

// Private booking update fields
data-testid="input-update-date"
data-testid="button-update-date"
data-testid="input-update-tour"
data-testid="button-update-tour"

// Public booking blocked state
data-testid="inline-convert-private-button"
data-testid="booking-type-chip"
```

---

### Backend Integration

#### ✅ API Endpoints Used

**Update Departure Date** (Independent):
```typescript
PUT /admin/departures/:id/date
Body: { newDate: ISO8601 }
```

**Update Departure Tour** (Independent + Price Recalculation):
```typescript
PUT /admin/departures/:id/tour
Body: { newTourId: string }
```

**Convert Booking Type**:
```typescript
POST /admin/bookings/:id/convert-type
Body: { targetType: 'private' | 'public' }
```

#### ✅ Backend Changes (Deployed)

**Files Modified**:
1. `functions/src/controllers/bookings.controller.js`
   - Line 146: Added `type: 'public'` to `joinBooking`
   - Lines 523, 551, 572: Added booking type updates to `convertBookingType`

2. `functions/src/controllers/departures.controller.js`
   - Line 356: Fixed price calculation (removed `* pax`)

**Test Results**: 18/18 endpoint tests passing ✅

---

## ⏳ Pending Work: E2E Test Refactoring

### Test File to Update
**Location**: `admin-dashboard/src/__tests__/e2e/booking_date_tour_update.spec.ts`

### Current Test Issues
- ❌ Tests were written before backend fixes
- ❌ Timing issues and race conditions in CI
- ❌ Need to align with new backend behavior:
  - `booking.type` field now always present
  - `convertBookingType` now updates booking type correctly
  - Price recalculation working correctly

### Required Refactoring

**Test Suite Structure** (Keep):
```typescript
describe('BookingModal Date/Tour Update Functionality', () => {
  // Test 1: Private booking - Update date independently
  // Test 2: Private booking - Update tour independently  
  // Test 3: Public shared booking - Show blocked state
  // Test 4: Public booking - Convert to private → Unlock options
});
```

**Improvements Needed**:
1. ✅ Use `data-testid` selectors (already implemented)
2. ⏳ Add more robust waiting strategies:
   ```typescript
   // Wait for modal to close
   await expect(page.getByTestId('submit-booking-button'))
     .not.toBeVisible({ timeout: 15000 });
   
   // Wait for page reload
   await page.waitForLoadState('networkidle');
   
   // Debounce search
   await page.waitForTimeout(2000);
   ```
3. ⏳ Use unique test data (timestamps) to avoid conflicts
4. ⏳ Add retry logic for flaky elements:
   ```typescript
   const row = page.locator('[data-testid^="booking-row-"]').first();
   try {
     await expect(row).toBeVisible({ timeout: 5000 });
   } catch (e) {
     await page.reload();
     await expect(row).toBeVisible({ timeout: 10000 });
   }
   ```
5. ⏳ Verify backend changes:
   - Check `booking.type` field exists
   - Verify type updates after conversion
   - Confirm prices are correct (not doubled)

### Test Execution Strategy

**Local Development**:
```bash
# Run against local dev server
npm run dev

# In another terminal
npx playwright test src/__tests__/e2e/booking_date_tour_update.spec.ts --project=chromium
```

**CI/CD**:
```bash
# Run all E2E tests
npx playwright test --project=chromium

# Run specific suite
npx playwright test src/__tests__/e2e/booking_date_tour_update.spec.ts
```

---

## 📂 Project Structure

```
admin-dashboard/
├── src/
│   ├── components/
│   │   └── modals/
│   │       └── BookingModal.tsx          # ✅ Updated with new logic
│   ├── hooks/
│   │   └── useDepartureMutations.ts      # ✅ Date/tour update mutations
│   └── __tests__/
│       └── e2e/
│           ├── bookings.spec.ts          # ✅ General bookings tests passing
│           └── booking_date_tour_update.spec.ts  # ⏳ NEEDS REFACTORING
├── playwright.config.ts
└── package.json
```

---

## 🧪 Test Coverage Status

### ✅ Passing E2E Tests
- General booking management (`bookings.spec.ts`)
- Tours management
- Departures management  
- Auth flows

### ⏳ Needs Refactoring
- `booking_date_tour_update.spec.ts` - **This is our current focus**

### Target Coverage
After refactoring, we should have:
- ✅ Private booking: date update (independent)
- ✅ Private booking: tour update (independent)  
- ✅ Private booking: price recalculation verification
- ✅ Public booking: blocked state UI
- ✅ Public booking: type field verification
- ✅ Public→Private: conversion flow
- ✅ Post-conversion: update abilities unlocked

---

## 🎨 UI/UX Implementation

### Private Booking State
```
┌─────────────────────────────────────┐
│ Actions Tab                          │
├─────────────────────────────────────┤
│ Change Date                          │
│ ┌────────────────┐  ┌─────────────┐│
│ │ 2025-12-15     │  │ Update Date ││
│ └────────────────┘  └─────────────┘│
│                                      │
│ Change Tour                          │
│ ┌────────────────┐  ┌─────────────┐│
│ │ Tour ID        │  │ Update Tour ││
│ └────────────────┘  └─────────────┘│
└─────────────────────────────────────┘
```

### Public Booking State (Blocked)
```
┌─────────────────────────────────────┐
│ Actions Tab                          │
├─────────────────────────────────────┤
│ ⚠️ Change Date/Tour - Blocked       │
│                                      │
│ This is a public departure with     │
│ other bookings. To change the date  │
│ or tour, convert to private first.  │
│                                      │
│ ┌─────────────────────────────────┐│
│ │ Convert to Private               ││
│ └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

---

## 🔄 Next Steps (Priority Order)

1. **⏳ E2E Test Refactoring** (Current Priority)
   - Update `booking_date_tour_update.spec.ts`
   - Add robust waiting strategies
   - Verify against new backend behavior
   - Run full test suite to ensure no regressions

2. **📝 Documentation**
   - Keep this file updated as tests are refactored
   - Document any new UX changes
   - Update test coverage matrix

3. **🚀 Deployment**
   - Once E2E tests pass → Deploy to staging
   - User acceptance testing
   - Production deployment

---

## 💡 Important Notes for Future Development

### Backend Behavior to Remember

1. **Admin Booking Creation** (`POST /admin/bookings`):
   - ALWAYS creates a NEW departure
   - Even if `departureId` is provided
   - This is by design for admin workflow

2. **Public Booking Join** (`POST /public/bookings/join`):
   - Used for public users joining EXISTING departures
   - Requires valid `departureId`
   - Now correctly sets `type: 'public'` ✅

3. **Price Calculation**:
   - `tier.priceCOP` is **TOTAL price** for pax range
   - NOT per-pax price
   - Do not multiply by pax ✅

4. **Type Consistency**:
   - `booking.type` must match `departure.type`
   - `convertBookingType` now updates BOTH ✅
   - Frontend should always check `booking.type` for UI logic

### Testing Best Practices

1. **Use Unique Data**: Generate unique customer names with timestamps
2. **Wait for Backend**: Add appropriate waits after mutations
3. **Reload Before Search**: Ensure fresh data after modal close
4. **Retry Failed Selectors**: Network latency can cause flakiness
5. **Verify Type Field**: Always check `booking.type` in assertions

---

## 📞 Questions to Address

When refactoring E2E tests, consider:

1. **Timing**: How long should we wait for backend sync?
2. **Retry Strategy**: How many retries for flaky selectors?
3. **Test Data Cleanup**: Should we clean up test bookings after?
4. **CI Environment**: Any special config needed for CI vs local?
5. **Error Messages**: What specific error messages should we test for?

---

**Maintained by**: Frontend Team  
**Contact**: Frontend issues → Check this doc first, then escalate

**Related Docs**:
- Backend: `backend-docs/backend_status.md`
- E2E Tests: `admin-dashboard/src/__tests__/e2e/README.md` (if exists)
- Component Docs: See inline comments in `BookingModal.tsx`
