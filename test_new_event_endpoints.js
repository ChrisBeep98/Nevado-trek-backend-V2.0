const axios = require('axios');

// Configuration
const BASE_URL = 'https://us-central1-nevadotrektest01.cloudfunctions.net';
const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

async function testNewEventManagementEndpoints() {
  console.log("🚀 Testing New Event Management Endpoints...\n");

  try {
    // Get a tour ID to use for testing
    console.log("1. Finding a tour for event creation tests...");
    const toursResponse = await axios.get(`${BASE_URL}/getToursV2`);
    const tour = toursResponse.data.find(t => t.isActive);
    
    if (!tour) {
      throw new Error("No active tours found for testing");
    }
    
    console.log(`   ✅ Using tour: ${tour.name.es} (${tour.tourId})`);
    
    // Test 1: POST /adminCreateEvent
    console.log("\n2. Testing POST /adminCreateEvent");
    
    // Create an event for 30 days from now
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const formattedDate = futureDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    
    const createEventPayload = {
      tourId: tour.tourId,
      startDate: formattedDate,
      maxCapacity: 6,
      type: 'private',
      notes: 'Test event created via API test'
    };
    
    console.log(`   📅 Creating event for: ${formattedDate}`);
    
    const createEventResponse = await axios.post(
      `${BASE_URL}/adminCreateEvent`,
      createEventPayload,
      {
        headers: {
          'X-Admin-Secret-Key': ADMIN_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`   ✅ Create Event Response: ${createEventResponse.status}`);
    console.log(`   📝 Event ID: ${createEventResponse.data.eventId}`);
    console.log(`   📝 Event Created: ${createEventResponse.data.message}`);
    
    const createdEventId = createEventResponse.data.eventId;
    
    // Test 2: GET /adminGetEventsByDate
    console.log("\n3. Testing GET /adminGetEventsByDate");
    
    const eventsByDateResponse = await axios.get(
      `${BASE_URL}/adminGetEventsByDate/${tour.tourId}/${formattedDate}`,
      {
        headers: {
          'X-Admin-Secret-Key': ADMIN_KEY
        }
      }
    );
    
    console.log(`   ✅ Get Events By Date Response: ${eventsByDateResponse.status}`);
    console.log(`   📅 Found ${eventsByDateResponse.data.events.length} events for ${formattedDate}`);
    
    if (eventsByDateResponse.data.events.length > 0) {
      const eventOnDate = eventsByDateResponse.data.events.find(e => e.eventId === createdEventId);
      if (eventOnDate) {
        console.log(`   ✅ Found our created event in the date query`);
        console.log(`   📅 Event Start Date: ${eventOnDate.startDate}`);
        console.log(`   👥 Event Capacity: ${eventOnDate.bookedSlots}/${eventOnDate.maxCapacity}`);
        console.log(`   🔖 Event Type: ${eventOnDate.type}`);
      } else {
        console.log(`   ⚠️ Our created event was not found in the date query`);
      }
    }
    
    // Test 3: POST /adminSplitEvent
    console.log("\n4. Testing POST /adminSplitEvent");
    
    // To test splitting an event, we need an event with multiple bookings
    // First, let's create a booking on our new event
    console.log("   Creating a booking on the new event for split test...");
    
    // First create an admin booking on our new event
    const bookingPayload = {
      tourId: tour.tourId,
      startDate: formattedDate,
      customer: {
        fullName: "Test Customer for Split",
        documentId: "TESTID123",
        phone: "+573123456789",
        email: "test-split@example.com"
      },
      pax: 2
    };
    
    const createBookingResponse = await axios.post(
      `${BASE_URL}/adminCreateBooking`,
      bookingPayload,
      {
        headers: {
          'X-Admin-Secret-Key': ADMIN_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`   ✅ Created booking for split test: ${createBookingResponse.data.bookingId}`);
    
    // Now to test the split, we'd need another booking on the same event
    // Let's create another booking
    const booking2Payload = {
      tourId: tour.tourId,
      startDate: formattedDate,
      customer: {
        fullName: "Test Customer 2 for Split",
        documentId: "TESTID124",
        phone: "+573123456790",
        email: "test-split2@example.com"
      },
      pax: 1
    };
    
    const createBooking2Response = await axios.post(
      `${BASE_URL}/adminCreateBooking`,
      booking2Payload,
      {
        headers: {
          'X-Admin-Secret-Key': ADMIN_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`   ✅ Created 2nd booking for split test: ${createBooking2Response.data.bookingId}`);
    
    // Now try to split the event - this will move the second booking to a new event
    console.log(`   Attempting to split event ${createdEventId} by moving booking ${createBooking2Response.data.bookingId}...`);
    
    const splitResponse = await axios.post(
      `${BASE_URL}/adminSplitEvent/${createdEventId}`,
      {
        bookingIds: [createBooking2Response.data.bookingId],
        newEventMaxCapacity: 4,
        newEventType: "private",
        reason: "Test event split via API"
      },
      {
        headers: {
          'X-Admin-Secret-Key': ADMIN_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`   ✅ Split Event Response: ${splitResponse.status}`);
    console.log(`   📝 Split Result: ${splitResponse.data.message}`);
    console.log(`   📝 Original Event ID: ${splitResponse.data.originalEventId}`);
    console.log(`   📝 New Event ID: ${splitResponse.data.newEventId}`);
    console.log(`   📝 Moved Booking IDs: ${splitResponse.data.movedBookingIds.join(', ')}`);
    
    console.log("\n🏁 New Event Management Endpoints Testing Complete!");
    
  } catch (error) {
    console.error("💥 Error in new event management tests:", error.message);
    if (error.response) {
      console.error("   📡 Response:", error.response.data);
    }
  }
}

// Run the tests
testNewEventManagementEndpoints();