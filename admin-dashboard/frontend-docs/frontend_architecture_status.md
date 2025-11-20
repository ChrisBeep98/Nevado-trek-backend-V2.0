# Admin Frontend - Current State & Architecture

**Date:** November 20, 2025
**Status:** In Progress (Alpha)

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

## 3. Core Architecture

### Authentication
- **Mechanism:** `X-Admin-Secret-Key` header authentication.
- **Implementation:**
  - `AuthContext.tsx`: Manages the key in `localStorage` and provides `isAuthenticated` state.
  - `api.ts`: Axios interceptor automatically injects the key into every request.
  - `ProtectedRoute`: Wrapper component in `App.tsx` that redirects unauthenticated users to `/login`.

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
- **Calendar View:** Displays departures, color-coded by status.
- **Stats Dashboard:** Fetches and displays basic metrics from `/admin/stats`.
- **Basic CRUD Views:** Skeletons and basic list views for Bookings and Tours.
- **Modals:**
  - `DepartureModal`: Basic tabs for Overview, Bookings, and Settings.
  - `BookingModal`: Edit existing bookings, basic validation.
  - `TourModal`: Basic info (Name, Description) and Pricing Tiers.

### 🚧 Incomplete / Pending Features (Known Gaps)
The following features are partially implemented or missing and require immediate attention:

#### **1. Tour Management (`TourModal`)**
- **Missing Fields:** The current modal only handles basic info and pricing. It **lacks**:
  - **FAQs:** Array of Question/Answer pairs.
  - **Inclusions/Exclusions:** Lists of strings.
  - **Dynamic Itinerary:** Complex structure allowing day-by-day activity management (currently just a "Total Days" number).
  - **Recommendations:** List of tips/gear.
  - **Location/Temperature/Distance:** specific metadata fields.

#### **2. Departure Management (`DepartureModal`)**
- **Edit Logic:** Ability to change dates or max pax is not fully wired up.
- **Split Departure:** UI and logic for splitting a departure are missing.
- **Delete:** Delete button exists but needs robust validation (ensure no active bookings).

#### **3. Booking Management**
- **Add to Existing:** Admin logic to add a new booking to a specific *existing* departure is WIP.
- **Move/Convert:** UI for moving a booking to another date or converting to private is pending.

#### **4. Technical & Testing**
- **Routing Issue:** The `/tours` route was experiencing redirect loops/crashes (temporarily renamed to `/admin-tours` for debugging).
- **Validation:** Zod schemas need to be expanded to cover the complex Tour fields.
- **Tailwind v4:** Successfully migrated, but requires verifying all custom `@apply` directives work as expected.

## 5. Next Steps
1.  **Expand Tour Data Structure:** Update `TourModal` to support the complex nested fields (Itinerary, FAQs).
2.  **Fix Routing:** Resolve the `/tours` vs `/admin-tours` routing instability.
3.  **Complete Modal Logic:** Finish the "Split" and "Move" functionality in their respective modals.
4.  **Full End-to-End Testing:** Verify all flows against the live backend.
