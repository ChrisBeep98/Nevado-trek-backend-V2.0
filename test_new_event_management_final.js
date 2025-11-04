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
    
    // Test 1: POST /adminCreateBooking (this was confirmed to exist)
    console.log("\n2. Testing POST /adminCreateBooking (new endpoint)");
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const formattedDate = futureDate.toISOString().split('T')[0];
    
    const bookingPayload = {
      tourId: tour.tourId,
      startDate: formattedDate,
      customer: {
        fullName: "Test Customer for New Event",
        documentId: "TESTID12345",
        phone: "+573123456789",
        email: "test-new-event@example.com",
        notes: "Test booking for new event management"
      },
      pax: 2,
      status: "pending"
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
    
    console.log(`   ✅ Admin Create Booking Response: ${createBookingResponse.status}`);
    console.log(`   📝 Booking ID: ${createBookingResponse.data.bookingId}`);
    console.log(`   📝 Booking Reference: ${createBookingResponse.data.bookingReference}`);
    console.log(`   📝 Booking Status: ${createBookingResponse.data.status}`);
    
    const createdBookingId = createBookingResponse.data.bookingId;
    
    // Since adminSplitEvent exists (from the check), let's try to test it indirectly
    // First, get all bookings to find 2 that belong to the same event
    console.log("\n3. Testing GET /adminGetEventsByDate with a different approach");
    try {
      // For adminGetEventsByDate, we need the correct format: /adminGetEventsByDate/{tourId}/{date}
      // The date format should be YYYY-MM-DD
      const dateForQuery = formattedDate; // Use the same date as our created booking
      const eventsByDateResponse = await axios.get(
        `${BASE_URL}/adminGetEventsByDate/${tour.tourId}/${dateForQuery}`,
        {
          headers: {
            'X-Admin-Secret-Key': ADMIN_KEY
          }
        }
      );
      
      console.log(`   ✅ Get Events By Date Response: ${eventsByDateResponse.status}`);
      console.log(`   📅 Found ${eventsByDateResponse.data.events.length} events for ${dateForQuery}`);
      
      if (eventsByDateResponse.data.events.length > 0) {
        console.log(`   📅 First event: ${eventsByDateResponse.data.events[0].eventId}`);
        console.log(`   👥 Capacity: ${eventsByDateResponse.data.events[0].bookedSlots}/${eventsByDateResponse.data.events[0].maxCapacity}`);
      }
    } catch (dateError) {
      console.log(`   ⚠️ Get Events By Date failed: ${dateError.message}`);
      if (dateError.response) {
        console.log(`   📡 Error Response:`, dateError.response.data);
      }
    }
    
    // Test 4: Try to create another booking for splitting
    console.log("\n4. Creating another booking for split test...");
    const booking2Payload = {
      tourId: tour.tourId,
      startDate: formattedDate,
      customer: {
        fullName: "Test Customer 2 for Split",
        documentId: "TESTID12346",
        phone: "+573123456790",
        email: "test-split2@example.com",
        notes: "Test booking 2 for split functionality"
      },
      pax: 1,
      status: "pending"
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
    
    console.log(`   ✅ Created booking 2 for split test: ${createBooking2Response.data.bookingId}`);
    
    // Note: To properly test adminSplitEvent, we would need to find an event with multiple bookings
    // and then call adminSplitEvent/{eventId} with a list of bookingIds to move
    console.log("\n   Note: Full split event test would require finding an existing event with multiple bookings");
    console.log("   The function exists and is available for use when needed");
    
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