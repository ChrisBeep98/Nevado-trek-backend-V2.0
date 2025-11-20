# Nevado Trek V2.0 - Concepts & Mental Model

## The Core Problem Solved
In the previous version, "Events" were ambiguous. They mixed the concept of a "Trip Date" with a "Customer Reservation". This caused confusion:
- "Is this event public or private?" (It depended on the booking)
- "If I cancel the first booking, does the event disappear?" (It shouldn't)
- "How do I move a booking to another date?" (It was complex)

**V2.0 introduces a clean separation of concerns.**

---

## The New Mental Model

### 1. The Product: `Tour`
*   **What is it?** The template or catalog item.
*   **Analogy:** A menu item in a restaurant (e.g., "Burger").
*   **Properties:** Name, Description, Base Price, Itinerary.
*   **Behavior:** Changing a Tour (e.g., price) affects *future* trips, but not existing confirmed ones (thanks to Versioning/Snapshots).

### 2. The Instance: `Departure` (The Anchor)
*   **What is it?** A specific trip happening on a specific date.
*   **Analogy:** A specific dinner reservation for Friday night.
*   **Key Concept:** **Departures exist independently of Bookings.**
    *   You can have a Departure with 0 people (an open trip).
    *   You can have a Departure with 10 people.
*   **Types:**
    *   **Public:** Open to anyone. Max 8 people. Visible on the website.
    *   **Private:** Exclusive to a specific group. Max 99 people. Hidden.

### 3. The Transaction: `Booking`
*   **What is it?** A customer securing a spot on a Departure.
*   **Analogy:** The receipt for the customer's seat.
*   **Behavior:** A Booking *must* belong to a Departure. It cannot float alone.

---

## Key Workflows (The "How To")

### A. Creating a Booking (Admin)
**"I want to book Juan for the Nevado Trek on Dec 15th."**

1.  **Admin decides:** Is this a *new* private trip, or is he joining an *existing* group?
2.  **System Action:**
    *   **New Private/Public:** System creates a NEW Departure + NEW Booking.
    *   **Join Existing:** System finds the Departure + Adds NEW Booking.
    *   **Result:** Admin has total control. No "auto-magic" joining that causes mistakes.

### B. The "Private to Public" Switch
**"I have a private trip with only 2 people. They want to open it up to others to save money."**

1.  **Action:** Convert Departure Type: `Private` → `Public`.
2.  **System Check:** Are there 8 or fewer people? (Public limit).
3.  **Result:** The Departure is now visible on the website. New people can join.

### C. The "Public to Private" Split
**"I have a public group of 6. A couple (2 people) wants to split off and go private."**

1.  **Action:** Convert Booking Type for that couple.
2.  **System Action:**
    *   Creates a **NEW Private Departure** for the same date/tour.
    *   Moves the couple's Booking to the new Departure.
    *   Updates capacity on the old Departure (now 4 people).
3.  **Result:** Two separate trips running on the same day.

### D. Cancellations & Capacity
**"Juan cancels his trip."**

1.  **Action:** Cancel Booking.
2.  **System Action:**
    *   Booking status → `Cancelled`.
    *   Departure `currentPax` → Decreases by Juan's group size.
    *   **Crucial:** The Departure *remains* open for others. It does not disappear.

---

## Pricing Logic
**"What happens if I change the Tour price?"**

*   **Tours** have "Pricing Tiers" (e.g., 1 person = $100, 2 people = $90).
*   **Departures** take a **Snapshot** of these prices when created.
*   **Bookings** use the Departure's snapshot.
*   **Result:** Changing the global Tour price *does not* break existing contracts. Your confirmed bookings are safe.

---

## Summary of Improvements
| Feature | Old Way (V1) | New Way (V2.0) |
| :--- | :--- | :--- |
| **Data Structure** | "Events" mixed with bookings | **Departures** (Time) separated from **Bookings** (People) |
| **Admin Booking** | Auto-joined if date matched | **Explicit Choice** (New vs Join) |
| **Private Trips** | Confusing "Private Event" flag | **Departure Type** (Public/Private) |
| **Capacity** | Often broken/manual | **Automatic Cascade** (Updates on every change) |
| **Price Changes** | Risky (could change old bookings) | **Safe** (Snapshots protect history) |
