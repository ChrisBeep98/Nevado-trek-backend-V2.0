# Admin Frontend - Current State & Architecture

**Date:** November 20, 2025  
**Status:** In Progress (Beta)

## 1. Project Overview
The **Nevado Trek Admin Dashboard** is a modern, single-page application (SPA) built to manage tours, departures, and bookings. It features a "Liquid Glass" aesthetic with a focus on visual excellence and smooth interactions.

## 2. Technology Stack
- **Framework:** React 18 + Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 (using `@import "tailwindcss";`), Vanilla CSS for custom glass effects.
- **State Management & Data Fetching:** TanStack Query (React Query) v5.
- **Routing:** React Router DOM v6.
- **Forms:** React Hook Form + Zod Validation.
- **UI Components:** Radix UI (Dialog, Tabs), Lucide React (Icons), FullCalendar.
- **HTTP Client:** Axios (with interceptors for Auth).
- **Testing:** Vitest (unit tests), Playwright (e2e tests - configured but not yet implemented).

## 3. Core Architecture

### Authentication
- **Mechanism:** `X-Admin-Secret-Key` header authentication.
- **Implementation:**
  - `AuthContext.tsx`: Manages the key in `localStorage` and provides `isAuthenticated` state.
  - `api.ts`: Axios interceptor automatically injects the key into every request.
  - `ProtectedRoute`: Wrapper component in `App.tsx` that redirects unauthenticated users to `/login`.

### Data Layer
- **Service Layer:** Centralized API calls in `src/services/` (tours.service.ts, departures.service.ts, bookings.service.ts).
- **Custom Hooks:** TanStack Query hooks in `src/hooks/` (useTours, useDepartures, useBookings) for data fetching and mutations.
- **Type Safety:** Complete TypeScript interfaces in `src/types/index.ts` for Tour, Departure, Booking, and related types.

### Layout & Design
- **DashboardLayout:** Features a persistent sidebar, top bar, and a main content area with a dynamic background.
- **Glassmorphism:** Extensive use of `backdrop-filter: blur()`, semi-transparent backgrounds, and white borders to create a premium "glass" look.
- **Components:** Reusable UI components like `GlassCard`, `LiquidButton`, and `GlassInput` ensure consistency.

### Routing Structure
- `/login`: Admin authentication page.
- `/`: **Home (Calendar View)** - Displays departures on a monthly calendar.
- `/bookings`: **Bookings Management** - List of all bookings with filtering/search.
- `/admin-tours`: **Tour Management** - Grid view of available tours.
- `/stats`: **Dashboard Stats** - Key performance metrics (Revenue, Pax, etc.).

## 4. Current Feature Status

### ✅ Implemented Features
- **Authentication Flow:** Login, Logout, Persistence.
- **Calendar View:** Displays departures, color-coded by status, using FullCalendar.
- **Stats Dashboard:** Fetches and displays metrics from `/admin/stats`.
- **Tours Management:**
  - List view with search/filter
  - Comprehensive TourModal with tabs for Basic Info, Pricing, Itinerary, Details
  - Support for all Tour fields including FAQs, Inclusions, Exclusions, Recommendations
  - Dynamic itinerary editor with day-by-day activities
- **Departures Management:**
  - Calendar integration
  - DepartureModal with Overview, Bookings, and Settings tabs
  - Edit departure details (date, maxPax, status)
  - Split departure functionality
  - Delete with validation
- **Bookings Management:**
  - List view with filtering by status and search
  - BookingModal with Details, Status, and Actions tabs
  - Update booking status and pax count
  - Apply discounts
  - Move bookings to different departures
  - Convert between public/private types

### 🧪 Testing Infrastructure
- **Unit Tests:** Vitest configured with custom test utilities (`src/test-utils.tsx`)
  - ✅ Hook tests for `useTours`, `useDepartures`, `useBookings`
  - All unit tests passing (5/5)
- **Integration Tests:** Live backend testing configured
  - ✅ Public endpoints accessible
  - ✅ Admin authentication working
  - ✅ GET endpoints functional
  - ⚠️ POST endpoint has validation requirements (see Known Issues)
- **E2E Tests:** Playwright configured but not yet implemented

### 🚧 Known Issues & Limitations

#### **1. Routing Issue**
- **Problem:** The `/tours` route was experiencing redirect loops/crashes.
- **Workaround:** Temporarily renamed to `/admin-tours` for debugging.
- **Status:** Needs investigation and permanent fix.

#### **2. Backend Validation Requirements**
- **Problem:** Tour creation via POST `/admin/tours` requires additional fields beyond what's in the UI.
- **Missing Fields:** The backend expects all fields to be present, including optional ones.
- **Impact:** Integration tests for tour creation currently fail.
- **Next Step:** Either update backend validation to make fields truly optional, or update frontend forms to include all required fields.

#### **3. Incomplete Features**
- No error boundaries implemented yet
- E2E tests not written
- Some edge cases in booking/departure flows not fully tested

## 5. Testing Strategy

### Unit Tests
Located in `src/__tests__/unit/hooks/`
- Test individual hooks in isolation
- Mock service layer calls
- Verify data transformations and state management
- **Run:** `npm test -- run src/__tests__/unit`

### Integration Tests
Located in `src/__tests__/integration/`
- Test against live backend API
- Verify authentication and authorization
- Test full request/response cycles
- **Run:** `npx vitest run src/__tests__/integration/live-backend.test.ts`
- **Note:** Requires `secret_value.txt` in project root with admin key

### Test Utilities
`src/test-utils.tsx` provides:
- `AllTheProviders`: Wraps components with QueryClient, AuthProvider, and Router
- `customRender`: Renders components with all providers
- Custom `renderHook`: For testing hooks with providers

## 6. API Integration

### Endpoints Used
- **Public:**
  - `GET /public/tours` - List active tours
  - `GET /public/departures` - List public departures
  - `POST /public/bookings/join` - Create public booking
  - `POST /public/bookings/private` - Create private booking

- **Admin:**
  - `GET /admin/stats` - Dashboard statistics
  - `GET /admin/tours` - List all tours
  - `POST /admin/tours` - Create tour
  - `PUT /admin/tours/:id` - Update tour
  - `DELETE /admin/tours/:id` - Delete tour
  - `GET /admin/departures` - List departures (with date range)
  - `POST /admin/departures` - Create departure
  - `PUT /admin/departures/:id` - Update departure
  - `DELETE /admin/departures/:id` - Delete departure
  - `POST /admin/departures/:id/split` - Split departure
  - `GET /admin/bookings` - List all bookings
  - `PUT /admin/bookings/:id/status` - Update booking status
  - `PUT /admin/bookings/:id/pax` - Update booking pax
  - `PUT /admin/bookings/:id/details` - Update customer details
  - `POST /admin/bookings/:id/discount` - Apply discount
  - `POST /admin/bookings/:id/move` - Move to different departure
  - `POST /admin/bookings/:id/convert-type` - Convert public/private

## 7. Next Steps

### High Priority
1. **Fix Routing Issue:** Resolve `/tours` vs `/admin-tours` routing instability.
2. **Implement Error Boundaries:** Add robust error boundaries throughout the application.
3. **Complete E2E Tests:** Write Playwright tests for critical user flows.
4. **Backend Validation Alignment:** Ensure frontend forms match backend validation requirements.

### Medium Priority
5. **Browser Testing:** Perform thorough manual testing, monitoring console and network.
6. **Performance Optimization:** Implement code splitting and lazy loading where beneficial.
7. **Accessibility:** Ensure WCAG compliance for all interactive elements.

### Low Priority
8. **Documentation:** Keep this document and other docs updated as features evolve.
9. **Code Cleanup:** Remove any unused code, consolidate duplicate logic.
10. **Design Polish:** Fine-tune animations, transitions, and responsive behavior.

## 8. Development Workflow

### Running the App
```bash
npm run dev
```

### Building for Production
```bash
npm run build
```

### Running Tests
```bash
# All tests
npm test

# Unit tests only
npm test -- run src/__tests__/unit

# Integration tests (requires admin key)
npx vitest run src/__tests__/integration/live-backend.test.ts

# Watch mode
npm test
```

### Linting
```bash
npm run lint
```

## 9. Important Notes

- **Admin Key Security:** The `X-Admin-Secret-Key` is stored in `localStorage` and automatically injected into requests. Never commit the actual key to version control.
- **Backend URL:** Currently hardcoded to `https://api-wgfhwjbpva-uc.a.run.app` in `src/lib/api.ts`.
- **Tailwind v4:** Using the new `@import "tailwindcss";` syntax. Custom utilities are defined in `src/index.css`.
- **Type Safety:** All API responses and data structures are fully typed. Avoid using `any` types.
- **Query Keys:** TanStack Query keys follow the pattern `['resource', ...params]` for consistency.
