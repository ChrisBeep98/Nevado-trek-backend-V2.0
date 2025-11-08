Backend Architecture Redesign - Complete Specification
Document Purpose
This document provides a complete specification for redesigning the Nevado Trek backend system. It focuses on:

Conceptual architecture and data model
Comprehensive use cases and edge cases
Impact analysis and cascade rules
Business logic requirements
NOT implementation code (that's for the AI developer)


Table of Contents

Problems with Current Architecture
New Mental Model
Core Entities and Relationships
Complete Use Cases
Impact Analysis: Tour Changes
Impact Analysis: Departure Changes
Impact Analysis: Booking Changes
Events System (Marketing)
Cascade Rules and Dependencies
Business Logic Requirements
Edge Cases to Handle
Data Integrity Rules
API Endpoint Requirements
Migration Strategy
Frontend Implications


1. Problems with Current Architecture
1.1 Ambiguous Terminology
Problem: "Events" is overloaded

Are events the same as tour dates?
Is an event a marketing promotion?
Can events be "private" or "public"?
This creates confusion in code, UI, and communication

Impact:

Developers unsure what "event" means in context
Frontend UX is confusing for admins
Database queries become unclear
Documentation is ambiguous

1.2 Unclear Relationships
Problem: How tours connect to bookings is fuzzy

Do bookings connect directly to tours?
What happens when tour properties change?
How do multiple bookings on the same date relate?
What is a "private" vs "public" event really?

Impact:

Cannot predict behavior of operations
Risk of data inconsistencies
Difficult to implement features correctly

1.3 Tour Changes Have Unknown Impact
Problem: When you edit a tour, what happens?

Do existing departures/bookings update?
Do prices change for confirmed bookings?
Do capacity limits apply retroactively?
How do you track what changed?

Impact:

Fear of editing tours (might break bookings)
No audit trail of changes
Cannot communicate changes to customers
Business logic is unclear

1.4 Duplicate Functionality
Problem: Multiple ways to do the same thing

adminUpdateBookingDetails can change dates
adminTransferBooking can move between events
Both seem to do similar things
Unclear when to use which

Impact:

Code duplication
Bugs from using wrong endpoint
Confused developers and admins

1.5 Missing Concepts
Problem: Real-world concepts not modeled

Groups traveling together (families, friends)
Guaranteed vs tentative departures
Tour versions (when properties change)
Marketing events separate from operational events

Impact:

Cannot handle complex scenarios
Workarounds in code
Limited business capabilities


2. New Mental Model
2.1 The Four Core Concepts
TOUR (The Product)

What: Template/catalog item defining the experience
Example: "Nevado del Ruiz Trek - 4 days"
Properties: Name, description, itinerary, pricing tiers, capacity defaults
Lifecycle: Created → Active → Inactive → Archived
Changes: Create new version when major changes occur

DEPARTURE (The Scheduled Instance)

What: Specific occurrence of a tour on specific dates
Example: "Nevado del Ruiz Trek departing Dec 15, 2025"
Properties: Dates, capacity, pricing (inherited or custom), status
Lifecycle: Draft → Published → Confirmed → In Progress → Completed
Changes: Can be modified until confirmed

GROUP (The Travel Unit)

What: Set of people traveling together
Example: "Pérez Family - 4 people"
Properties: Leader, members, preferences, booking IDs
Lifecycle: Created with first booking → Active → Completed
Changes: Can add/remove members, change preferences

BOOKING (The Transaction Record)

What: Individual customer reservation
Example: "Juan Pérez booked 4 spots"
Properties: Customer details, payment status, price
Lifecycle: Pending → Confirmed → Paid → Completed
Changes: Status changes, payment updates

EVENT (Marketing/Promotional)

What: Blog posts, webinars, social media campaigns
Example: "Webinar: Preparing for High Altitude Treks"
Properties: Content, dates, related tours
Lifecycle: Draft → Scheduled → Published → Completed
Changes: Independent of operational system

2.2 Relationship Hierarchy
TOUR (1) ────────> DEPARTURE (many)
                        │
                        └────> GROUP (many)
                                  │
                                  └────> BOOKING (many)

EVENT (marketing) ─ ─ ─> Can reference TOUR (optional link)
2.3 Key Principles

Tours are immutable templates: When you need to change pricing or capacity significantly, create a new version
Departures inherit from tours: But can override properties for specific instances
Groups are explicit: Don't infer who's traveling together; track it explicitly
Bookings are atomic: One booking = one customer's transaction
Events are separate: Marketing events don't affect operational data


3. Core Entities and Relationships
3.1 TOUR Entity
Purpose: Define what the experience is
Key Properties:

Identity: tourId, slug, version number
Bilingual content: name, descriptions, itinerary
Capacity rules: defaultMin, defaultMax, absoluteMax
Pricing tiers: paxFrom, paxTo, prices per tier
Detailed content: day-by-day itinerary, inclusions, FAQs
Media: images, videos
Status: active, inactive, archived

Versioning:

Every significant change creates a new version
Old versions remain for historical departures
Version history tracks all changes

Why Versioning Matters:

Existing bookings remain valid with their original terms
Can compare what changed between versions
Legal/contractual protection
Clear audit trail

3.2 DEPARTURE Entity
Purpose: Represent a specific scheduled instance
Key Properties:

Identity: departureId, departureCode
Tour reference: tourId, tourVersion
Dates: startDate, endDate, timezone
Availability type: "shared" or "private_group"
Status: draft, published, confirmed, in_progress, completed, cancelled
Capacity: min, max, current, available, reserved
Pricing: use tour pricing or custom pricing
Groups: list of group IDs in this departure
Operational details: guide, vehicle, special notes

Availability Types:

Shared: Multiple groups can join, published on website
Private Group: Exclusive for one group, not published publicly

Status Lifecycle:

Draft: Created but not ready for bookings
Published: Live on website, accepting bookings
Confirmed: Guaranteed to depart (min participants reached)
In Progress: Currently happening
Completed: Finished
Cancelled: Not happening

Why This Matters:

Clear separation between "tour template" and "actual trip"
Can have different pricing for different dates (seasons)
Can override capacity for specific departures
Complete operational information per departure

3.3 GROUP Entity
Purpose: Track people traveling together
Key Properties:

Identity: groupId, groupCode
Name: "Pérez Family" (auto-generated or custom)
Leader: bookingId and contact info
Members: array of bookingIds
Total PAX: sum across all bookings
Preferences: can share departure, dietary restrictions
Current assignment: departureId, tourId
History: previous departures, changes

Why Groups Matter:

Families/friends book separately but travel together
Need to keep groups together when changing dates
Communication happens at group level
Special requests apply to whole group
Pricing might depend on total group size

3.4 BOOKING Entity
Purpose: Record of customer transaction
Key Properties:

Identity: bookingId, bookingReference
Relationships: tourId, departureId, groupId
Customer: full details, emergency contact
PAX: number of people
Participants: individual details (optional)
Pricing: breakdown, discounts, taxes
Payment: status, transactions, installments
Status: pending, confirmed, paid, cancelled, completed
History: all status changes and transfers
Documents: waivers, insurance

Status Lifecycle:

Pending: Created, awaiting confirmation
Confirmed: Admin confirmed, awaiting payment
Paid: Fully paid
Cancelled: Customer or admin cancelled
No Show: Didn't show up
Completed: Trip finished

Why Booking Details Matter:

Legal record of transaction
Payment tracking
Customer communication
Refund calculations
Review collection

3.5 EVENT Entity (Marketing)
Purpose: Marketing and promotional content
Key Properties:

Identity: eventId
Type: webinar, blog_post, promotion, social_media, email_campaign
Content: title, description, media
Dates: scheduled date, published date
Related tours: optional references to tour catalog
Status: draft, scheduled, published, completed
Analytics: views, conversions, engagement

Why Separate from Departures:

Marketing events != operational trips
Different lifecycle and management
Can reference multiple tours or none
Different permissions and workflows
Separate analytics and tracking


4. Complete Use Cases
4.1 Customer Books a Tour
Scenario: Juan wants to book Nevado trek for Dec 15 with his family (4 people)
Flow:

Customer selects tour and date on website
System searches for departures on that date
Case A: Shared departure exists with space

Show that departure with current participants
Explain it's a shared tour
If customer accepts, create booking and add to existing group


Case B: No departure exists

Create new departure (shared type by default)
Create new group with customer as leader
Create booking


Case C: Only private departure exists

Cannot join (it's private)
Offer to create new departure for customer


Calculate pricing based on tour's pricing tiers
Create booking with "pending" status
Send confirmation email

Questions to Handle:

What if departure is almost full? (show "only X spots left")
What if customer wants private tour? (create private departure)
What if pricing tier changes based on total group size? (recalculate)

4.2 Admin Changes Tour Pricing
Scenario: Tour pricing needs to increase for next season
Flow:

Admin edits tour pricing tiers
System asks: "Create new version or update existing?"
Option A: Create new version

Increment version number
Save old version in history
New departures use new version
Existing departures stay on old version


Option B: Update existing version

Warn about existing departures
Show list of affected departures
Admin decides what to do:

Keep old prices for existing departures
Update prices for unpaid bookings only
Update all prices (requires customer notification)





Impact Analysis:

How many departures exist?
How many bookings are affected?
Which bookings are already paid?
What's the revenue impact?

Required Actions:

Update tour version
Mark affected departures
Notify admins of changes needed
Optional: notify customers of price changes

4.3 Admin Creates a Departure
Scenario: Admin wants to create a guaranteed departure for Christmas
Flow:

Admin selects tour and date
Admin sets properties:

Availability type: shared or private_group
Capacity: use defaults or override
Pricing: use tour pricing or custom
Is guaranteed: yes/no
Guide assignment
Special notes


Admin sets status: draft or published
System creates departure
If published, appears on website immediately

Questions to Handle:

What if departure already exists for that date? (allow multiple)
What if guide is already assigned elsewhere? (warn conflict)
What if custom pricing is lower than cost? (warn low margin)

4.4 Customer Wants to Change Date
Scenario: Juan (booked for Dec 15) wants to move to Dec 20
Flow:

Admin receives request
Admin searches for departures on Dec 20
Case A: Shared departure exists with space

Show departure details
Show who else is in that departure
Explain it's shared (if original was private)
Admin confirms change
System moves booking to new departure
System adjusts capacities
System updates group assignment
System records change in history


Case B: Private departure exists

Explain it's private for another group
Offer to create new departure
Or offer to contact other group about sharing


Case C: No departure exists

Create new departure
Move booking there
Decide if shared or private based on customer preference



Impact Analysis:

Original departure capacity: before/after
New departure capacity: before/after
Group: keep together or split?
Pricing: stays same or recalculate?
Payment: difference to charge/refund?

Required Actions:

Update booking's departureId
Update both departures' capacities
Update group assignment
Record in booking's transfer history
Notify customer of change
If price difference, handle payment

4.5 Entire Group Wants to Change Together
Scenario: Pérez family (4 bookings, 10 people total) wants to change date
Flow:

Admin identifies all bookings in group
Admin searches for new date with space for 10 people
System shows suitable departures
Admin selects target departure
System moves all bookings atomically
System updates both departures
System keeps group together
System records change for each booking

Questions to Handle:

What if new departure doesn't have space for whole group? (offer to split or create new departure)
What if some bookings are paid and some aren't? (handle separately)
What if pricing is different? (calculate per booking)

4.6 Admin Cancels a Departure
Scenario: Dec 25 departure has only 2 people, below minimum
Flow:

Admin marks departure as cancelled
System identifies all bookings on that departure
System shows options:

Move all bookings to another date
Cancel all bookings with refunds
Split: some move, some cancel


Admin selects action
For moves:

Search available departures
Move bookings
Notify customers of new date


For cancels:

Mark bookings as cancelled
Process refunds per policy
Notify customers


System records cancellation reason
Departure marked as cancelled (not deleted)

Impact Analysis:

How many bookings affected?
Total revenue impact
Refund amounts per policy
Alternative dates available
Customer communication needed

4.7 Departure Reaches Minimum and Gets Guaranteed
Scenario: Dec 30 departure reaches 4 people (minimum)
Flow:

System detects current participants >= minimum
System marks departure as confirmed
System sets isGuaranteedDeparture = true
System records when and by whom
System sends notifications:

To all customers: "Your trip is guaranteed!"
To admin: "Departure confirmed"


Guide assignment becomes mandatory
Cancellation policy changes (stricter)

Business Impact:

Commitment made to customers
Can advertise as "guaranteed departure"
Operational planning must begin
Refund policy changes

4.8 Customer Cancels Booking
Scenario: Juan cancels his booking 30 days before departure
Flow:

Customer requests cancellation
System calculates refund:

Check cancellation policy
Calculate fees based on days before departure
Calculate refund amount


Admin reviews and approves
System marks booking as cancelled
System updates departure capacity
System checks if departure still meets minimum
If below minimum:

Warn admin
Consider cancelling departure


Process refund
Remove from group (or dissolve group if leader)
Notify customer

Questions to Handle:

What if this person was group leader? (transfer leadership or dissolve)
What if departure goes below minimum? (warn other customers)
What if refund policy doesn't allow refunds? (store credit instead)

4.9 Admin Splits a Departure
Scenario: Dec 15 departure has 16 people (too big), admin wants to split into two groups
Flow:

Admin selects departure to split
System shows all groups in departure
Admin selects which groups go to new departure
System creates new departure:

Same tour
Same dates
Same base properties
New departureId


System moves selected bookings to new departure
System updates capacities on both
System assigns different guide to new departure
System notifies affected customers

Business Logic:

Try to keep groups intact (don't split families)
Consider guide capacity for each departure
Ensure both departures meet minimum
Update operational assignments

4.10 Customer Books Multi-Day Tour While Another is In Progress
Scenario: Juan is currently on a Dec 10-14 tour and wants to book Dec 20-24
Flow:

System allows the booking
System shows overlap warning (none in this case)
Customer proceeds with second booking
System links bookings (returning customer flag)
Potential discount for returning customer
Communication mentions both bookings

Questions to Handle:

What if dates overlap? (warn customer)
What if same departure? (warn duplicate)
Loyalty program benefits?

4.11 Admin Publishes a Private Departure
Scenario: Private departure for Dec 15 has only 4 people, admin wants to fill remaining spots
Flow:

Admin selects private departure
Admin clicks "Make Public"
System shows impact:

Current group will share tour
Remaining capacity available
Will appear on website


Admin confirms
System changes availabilityType to "shared"
System publishes to website
System notifies original group about sharing
New customers can now book

Ethical Considerations:

Must inform original group
They booked private, now it's shared
Consider offering discount or compensation
Get consent if possible

4.12 Admin Creates Recurring Departures
Scenario: Admin wants departures every Saturday for 3 months
Flow:

Admin selects tour
Admin sets recurrence pattern:

Every Saturday
From Dec 1 to Feb 28
All shared type
All use standard pricing


System calculates dates (13 Saturdays)
System creates 13 departures
Admin reviews and confirms
System publishes all at once

Considerations:

Holiday conflicts (skip or flag)
Guide availability
Bulk operations on multiple departures
Easy to cancel/modify series

4.13 Tour Gets Deactivated
Scenario: Admin deactivates "Beginner Trek" tour
Flow:

Admin marks tour as inactive
System shows existing departures
Admin decides:

Keep existing departures (honor commitments)
Cancel all future departures
Move bookings to different tour


System updates tour status
Tour removed from website
Existing bookings unaffected
Cannot create new departures
Historical data preserved

Impact:

Website: tour hidden from catalog
Departures: can complete but can't create new ones
Bookings: honored as normal
Analytics: data still available


5. Impact Analysis: Tour Changes
5.1 Changing Tour Name/Description
What Changes:

Tour entity updated
Version incremented

Impact on Departures:

None (departures have denormalized name)
Future departures can use new name
Can optionally update departure names

Impact on Bookings:

None (bookings have denormalized tour name)
Historical records preserved

Recommendation:

Update tour only
Leave departures/bookings with original names
Only update if critical error (typo, legal issue)

5.2 Changing Pricing Tiers
What Changes:

Tour pricing structure modified
Major change = new version recommended

Impact on Departures:

Existing departures: keep old pricing (they reference old version)
New departures: use new pricing (reference new version)
Admin can force update specific departures

Impact on Bookings:

Paid bookings: never change (contractual)
Pending bookings on old departures: keep old price unless admin forces update
New bookings: use departure's pricing

Decision Tree:
Price Change Requested
├── Minor adjustment (<5%)
│   ├── Update current version
│   └── Apply to new bookings only
└── Major change (≥5%)
    ├── Create new version
    ├── Old departures stay on old version
    └── Admin can migrate specific departures
Required Actions:

Calculate revenue impact
List affected departures
Admin decides: version or update
If update: notify customers with pending payments
Record change reason

5.3 Changing Capacity Limits
What Changes:

Tour capacity defaults modified

Impact on Departures:

Existing departures: keep their capacity
New departures: use new capacity
Can optionally increase/decrease existing departures

Impact on Bookings:

No direct impact
If capacity decreased below current bookings: warn but don't break

Edge Cases:

Departure has 12 bookings, new max is 10: allow (grandfathered)
Departure has 6 bookings, new max is 10: can accept 4 more
Departure has 6 bookings, new max is 5: warn admin but allow existing

Recommendation:

Never decrease capacity below current bookings
Can increase capacity of existing departures easily
Decreasing requires admin review

5.4 Changing Itinerary
What Changes:

Tour itinerary updated
Significant change = new version

Impact on Departures:

None directly
Departures inherit tour content
Can override for specific departure

Impact on Bookings:

Customer expectations might change
If significant: must notify customers

Notification Requirements:
Minor changes (timing, meals): No notification needed
Moderate changes (activities): Email notification recommended
Major changes (route, duration): Email notification + confirmation required
5.5 Adding/Removing Inclusions
What Changes:

Tour inclusions/exclusions list modified

Impact on Departures:

Future departures: updated list
Existing departures: decision needed

Impact on Bookings:

Contractual issue: customer booked with certain inclusions
Cannot remove inclusions from paid bookings
Can add inclusions (value-add)

Rules:

Adding inclusion: ok to apply to all
Removing inclusion: only for new bookings
Changing inclusion: treat as remove + add

5.6 Changing Duration
What Changes:

Tour duration changed (e.g., 4 days → 5 days)
This is a MAJOR change

Impact on Departures:

Existing departures: keep old duration
MUST create new version
Cannot apply to existing bookings

Impact on Bookings:

Existing: honored with original duration
Customers must be contacted if they want new duration
Price recalculation required

Required Actions:

Create new tour version
Mark old version as deprecated
Existing departures complete normally
New departures use new duration
Clear communication about changes


6. Impact Analysis: Departure Changes
6.1 Changing Departure Dates
What Changes:

Departure's startDate and/or endDate

Impact on Bookings:

ALL bookings on this departure affected
Customers MUST be notified
Some may not accept new date

Process:

Admin requests date change
System lists all bookings
System shows:

Who needs notification
Cancellation policy if they decline


Admin confirms
System updates departure
System sends notifications
Customers can accept or request cancellation

Edge Cases:

Some customers accept, some decline
Handle cancellations appropriately
Consider moving declining customers to other date

6.2 Changing Departure Capacity
Scenario A: Increasing Capacity

Easy: just update max capacity
More spots available
Can accept more bookings
No customer impact

Scenario B: Decreasing Capacity

Check current bookings
If current > new max: cannot decrease
If current < new max: can decrease but limit new bookings
Explain reason to admin

6.3 Changing Departure Type (Shared ↔ Private)
Shared to Private:

Only allow if exactly 1 group
Check all bookings belong to same group
If multiple groups: cannot change
Update availabilityType
Remove from website

Private to Shared:

Always possible
Must notify original group
They booked private, now sharing
Ethical consideration: offer compensation
Publish to website

6.4 Cancelling a Departure
What Happens:

Departure marked as cancelled
All bookings must be handled
Options for each booking:

Move to alternative date
Full refund
Partial refund + credit


Guide reassignment

Process:

Admin initiates cancellation
System shows all bookings
Admin selects option for each:

Move to: [select departure]
Cancel with refund


System executes
Notifications sent
Refunds processed

Financial Impact:

Calculate total refunds
Calculate lost revenue
Track cancellation reason
Update forecasts

6.5 Guaranteeing a Departure
What Happens:

isGuaranteedDeparture set to true
Commitment made to customers
Can advertise publicly
Cancellation becomes very costly

Automatic Trigger:

When current participants >= minimum
System can auto-guarantee or admin approves

Impact:

Operational planning must start
Guide assignment required
Equipment reservation required
Cannot cancel without major cost


7. Impact Analysis: Booking Changes
7.1 Changing Booking Status
Status Transitions:
pending → confirmed → paid → completed
                ↓
          cancelled (can cancel from any state)
          no_show (only from paid)
Each Transition:

Pending → Confirmed:

Admin approval
May require deposit
Capacity reserved (not just pending)


Confirmed → Paid:

Full payment received
Confirmed participation
Stricter cancellation policy applies


Paid → Completed:

Departure finished
Can request review
Archive booking


Any → Cancelled:

Refund calculation
Capacity freed
Group impact check
Departure minimum check



7.2 Changing Customer Details
What Changes:

Customer name, email, phone, etc.

Impact:

Booking updated
Group updated (if leader)
No impact on departure or tour
Communication preferences update

Validation:

If name changes significantly: verify identity
If email changes: confirm both old and new
If phone changes: update emergency contact

7.3 Changing PAX Count
Increase PAX:

Check departure capacity
If space available: update
Recalculate price (tier might change)
Update payment amount
Update group total
Update departure capacity

Decrease PAX:

Always possible
Recalculate price
Handle refund if already paid
Update group total
Free departure capacity
Check if departure still meets minimum

7.4 Changing Booking Price
When Allowed:

Admin discretion for discounts
Corrections for errors
Special circumstances

Process:

Requires reason
Audit trail required
If already paid: refund difference or store credit
If pending: just update
Customer notification

7.5 Moving Booking to Different Departure (Same Tour)
What Happens:

Booking's departureId changes
Source departure capacity decreases
Target departure capacity increases
Group assignment might change
Price might change based on departure pricing

Validation:

Target departure must have space
Check if dates work for customer
Price difference handling
Group consideration (keep together?)

Process:

Select target departure
Check compatibility
Calculate price difference
Move booking
Update capacities
Update group if needed
Notify customer

7.6 Moving Booking to Different Tour (Cross-Tour Transfer)
What Happens:

Booking's tourId changes
Booking's departureId changes
Price recalculation required
New group created or joined
Old group membership ended

Use Cases:

Customer wants different experience
Original tour unavailable
Upsell/downsell

Process:

Select new tour
Find or create suitable departure
Calculate new price
Handle price difference
Create/assign new group
Move booking
Adjust capacities on both departures
Record transfer reason
Notify customer


8. Events System (Marketing)
8.1 Purpose and Scope
What Marketing Events Are:

Blog posts about destinations
Webinars about preparation
Social media campaigns
Email newsletters
Promotional offers
Partnership announcements

What They Are NOT:

Operational departures
Tour dates
Booking-related entities

8.2 Event Types
Blog Post:

Written content
Can reference multiple tours
SEO focused
Long-lived content

Webinar:

Live session
Scheduled date/time
Registration required
Can promote tours

Promotion:

Discount campaign
Time-limited
Applies to specific tours
Tracking code

Social Media:

Instagram/Facebook posts
Stories, reels
Engagement tracking
Tour awareness

Email Campaign:

Newsletter
Promotional email
Tour announcements
Customer nurturing

8.3 Event Lifecycle
draft → scheduled → published → completed → archived
Draft:

Being created/edited
Not visible publicly
Can be deleted

Scheduled:

Ready to go
Has publish date
Automatic or manual publish

Published:

Live on website
Active campaign
Tracking active

Completed:

Finished
Analytics final
Archived content

8.4 Relationship to Tours
Loose Coupling:

Event CAN reference tours
Tours don't reference events
Event can promote multiple tours
Event can exist without tours

Use Cases:

Blog post about "Top 5 Colombian Treks" references 5 tours
Webinar "Altitude Preparation" references all high-altitude tours
Promotion "Summer Sale" applies discount to all tours
Social post showcases one specific tour

8.5 Event Management
Creating an Event:

Select event type
Add content (bilingual)
Set schedule (if applicable)
Link related tours (optional)
Set tracking parameters
Publish or schedule