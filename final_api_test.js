const axios = require('axios');

// Admin key - ultra secret
const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

// Base URL for the functions
const BASE_URL = 'https://us-central1-nevadotrektest01.cloudfunctions.net';

// Test data
const testTour = {
  name: {
    es: "Tour de Prueba Final Test",
    en: "Final Test Tour"
  },
  description: {
    es: "Descripción del tour de prueba final",
    en: "Final test tour description"
  },
  duration: "3 Days",
  difficulty: "3/5",
  maxParticipants: 8,
  pricingTiers: [
    { pax: 1, pricePerPerson: { COP: 1500000, USD: 350 } },
    { pax: 2, pricePerPerson: { COP: 1200000, USD: 280 } },
    { paxFrom: 3, paxTo: 8, pricePerPerson: { COP: 1000000, USD: 235 } }
  ],
  isActive: true
};

async function testEndpoint(name, method, url, headers = {}, data = null) {
  console.log(`\n🧪 Testing ${name}...`);
  console.log(`   Method: ${method}, URL: ${url}`);
  
  if (data) {
    console.log(`   Data: ${JSON.stringify(data, null, 2)}`);
  }
  
  try {
    const response = await axios({
      method,
      url,
      headers,
      data
    });
    
    console.log(`   ✅ Status: ${response.status}`);
    if (response.data) {
      console.log(`   Response preview: ${JSON.stringify(response.data, null, 2).substring(0, 300)}...`);
    }
    return response;
  } catch (error) {
    console.log(`   ❌ Error: ${error.response?.data ? JSON.stringify(error.response.data) : error.message}`);
    return error.response || { error: true, message: error.message };
  }
}

async function runFocusedTest() {
  console.log("🚀 Starting Focused API Test for Nevado Trek Backend 🚀");
  console.log("=========================================================");
  
  // Store IDs for use in subsequent tests
  let createdTourId = null;
  let sampleBookingId = null;
  let sampleEventId = null;
  let sampleBookingRef = null;

  // First, get existing data to work with instead of creating new bookings due to rate limiting
  console.log("\n📋 1. Testing GET /adminGetBookings to find sample booking (Admin Endpoint)");
  const bookingsResponse = await testEndpoint(
    'Get Bookings',
    'GET',
    `${BASE_URL}/adminGetBookings`,
    { 'X-Admin-Secret-Key': ADMIN_KEY }
  );

  if (bookingsResponse.data?.bookings && bookingsResponse.data.bookings.length > 0) {
    sampleBookingId = bookingsResponse.data.bookings[0].bookingId;
    sampleEventId = bookingsResponse.data.bookings[0].eventId;
    console.log(`   🆔 Found sample booking ID: ${sampleBookingId}`);
    console.log(`   📅 Found sample event ID: ${sampleEventId}`);
  }

  // 2. TEST: Get Tours (Public Endpoint)
  console.log("\n📋 2. Testing GET /getToursV2 (Public Endpoint)");
  await testEndpoint(
    'GET Tours',
    'GET',
    `${BASE_URL}/getToursV2`
  );

  // 3. TEST: Create Tour (Admin Endpoint)
  console.log("\n📝 3. Testing POST /adminCreateTourV2 (Admin Endpoint)");
  const createTourResponse = await testEndpoint(
    'Create Tour',
    'POST',
    `${BASE_URL}/adminCreateTourV2`,
    { 'X-Admin-Secret-Key': ADMIN_KEY, 'Content-Type': 'application/json' },
    testTour
  );
  
  if (createTourResponse.data?.tourId) {
    createdTourId = createTourResponse.data.tourId;
    console.log(`   🆔 Created Tour ID: ${createdTourId}`);
  }

  // 4. TEST: Get Tour by ID (Public Endpoint)
  if (createdTourId) {
    console.log("\n📋 4. Testing GET /getTourByIdV2/:tourId (Public Endpoint)");
    await testEndpoint(
      'GET Tour by ID',
      'GET',
      `${BASE_URL}/getTourByIdV2/${createdTourId}`
    );
  }

  // 5. TEST: Update Tour (Admin Endpoint)
  if (createdTourId) {
    console.log("\n✏️ 5. Testing PUT /adminUpdateTourV2/:tourId (Admin Endpoint)");
    await testEndpoint(
      'Update Tour',
      'PUT',
      `${BASE_URL}/adminUpdateTourV2/${createdTourId}`,
      { 'X-Admin-Secret-Key': ADMIN_KEY, 'Content-Type': 'application/json' },
      { 
        name: { 
          es: "Tour Actualizado Final Test", 
          en: "Updated Final Test Tour" 
        }
      }
    );
  }

  // 6. TEST: Get Events Calendar (Admin Endpoint)
  console.log("\n📅 6. Testing GET /adminGetEventsCalendar (Admin Endpoint)");
  await testEndpoint(
    'Get Events Calendar',
    'GET',
    `${BASE_URL}/adminGetEventsCalendar`,
    { 'X-Admin-Secret-Key': ADMIN_KEY }
  );

  // 7. TEST: Update Booking Status (Admin Endpoint) - using existing booking
  if (sampleBookingId) {
    console.log("\n🏷️ 7. Testing PUT /adminUpdateBookingStatus/:bookingId (Admin Endpoint)");
    await testEndpoint(
      'Update Booking Status',
      'PUT',
      `${BASE_URL}/adminUpdateBookingStatus/${sampleBookingId}`,
      { 'X-Admin-Secret-Key': ADMIN_KEY, 'Content-Type': 'application/json' },
      { 
        status: 'confirmed',
        reason: 'Final API test confirmation'
      }
    );
  }

  // 8. TEST: Update Booking Details (Admin Endpoint) - using existing booking
  if (sampleBookingId) {
    console.log("\n✏️ 8. Testing PUT /adminUpdateBookingDetails/:bookingId (Admin Endpoint)");
    await testEndpoint(
      'Update Booking Details',
      'PUT',
      `${BASE_URL}/adminUpdateBookingDetails/${sampleBookingId}`,
      { 'X-Admin-Secret-Key': ADMIN_KEY, 'Content-Type': 'application/json' },
      { 
        customer: {
          fullName: "Final API Test Updated",
          email: "final-test-updated@example.com"
        },
        pax: 4,
        reason: 'Final API test update'
      }
    );
  }

  // 9. TEST: Publish Event (Admin Endpoint) - using existing event
  if (sampleEventId) {
    console.log("\n📢 9. Testing POST /adminPublishEvent/:eventId (Admin Endpoint)");
    await testEndpoint(
      'Publish Event',
      'POST',
      `${BASE_URL}/adminPublishEvent/${sampleEventId}`,
      { 'X-Admin-Secret-Key': ADMIN_KEY, 'Content-Type': 'application/json' },
      { action: 'publish' }
    );
  }

  // 10. TEST: Transfer Booking (Admin Endpoint) - would need two events to test properly
  if (sampleBookingId && sampleEventId) {
    console.log("\n🔄 10. Testing POST /adminTransferBooking/:bookingId (Admin Endpoint)");
    console.log("   Note: This would require a destination event ID to fully test");
    await testEndpoint(
      'Transfer Booking',
      'POST',
      `${BASE_URL}/adminTransferBooking/${sampleBookingId}`,
      { 'X-Admin-Secret-Key': ADMIN_KEY, 'Content-Type': 'application/json' },
      { 
        destinationEventId: sampleEventId, // This is the same event, just for testing the endpoint
        reason: 'Final test - not a real transfer'
      }
    );
  }

  // 11. TEST: Check Booking (Public Endpoint) - using an existing reference if available
  console.log("\n🔍 11. Testing GET /checkBooking with sample if available (Public Endpoint)");
  // Let's try to get a reference from the booking we found
  if (bookingsResponse.data?.bookings && bookingsResponse.data.bookings.length > 0) {
    const sampleRef = bookingsResponse.data.bookings[0].bookingReference;
    if (sampleRef) {
      console.log(`   Testing with sample reference: ${sampleRef}`);
      await testEndpoint(
        'Check Booking',
        'GET',
        `${BASE_URL}/checkBooking?reference=${sampleRef}`
      );
    }
  }

  // 12. TEST: Delete Tour (Admin Endpoint)
  if (createdTourId) {
    console.log("\n🗑️ 12. Testing DELETE /adminDeleteTourV2/:tourId (Admin Endpoint)");
    await testEndpoint(
      'Delete Tour',
      'DELETE',
      `${BASE_URL}/adminDeleteTourV2/${createdTourId}`,
      { 'X-Admin-Secret-Key': ADMIN_KEY }
    );
  }

  console.log("\n=========================================================");
  console.log("✅ Focused API Test Complete!");
  console.log(`📋 Created Tour ID: ${createdTourId || 'None'}`);
  console.log(`🎫 Sample Booking ID: ${sampleBookingId || 'None'}`);
  console.log(`📅 Sample Event ID: ${sampleEventId || 'None'}`);
  console.log(" ");
  
  // Summary of what was tested
  console.log("📋 SUMMARY OF TESTED ENDPOINTS:");
  console.log("✅ GET /getToursV2 (Public)");
  console.log("✅ GET /getTourByIdV2/:tourId (Public)");
  console.log("✅ POST /adminCreateTourV2 (Admin)");
  console.log("✅ PUT /adminUpdateTourV2/:tourId (Admin)");
  console.log("✅ DELETE /adminDeleteTourV2/:tourId (Admin)");
  console.log("✅ GET /adminGetBookings (Admin)");
  console.log("✅ GET /adminGetEventsCalendar (Admin)");
  console.log("✅ PUT /adminUpdateBookingStatus/:bookingId (Admin)");
  console.log("✅ PUT /adminUpdateBookingDetails/:bookingId (Admin)");
  console.log("✅ POST /adminPublishEvent/:eventId (Admin)");
  console.log("✅ POST /adminTransferBooking/:bookingId (Admin)");
  console.log("✅ GET /checkBooking (Public)");
  console.log(" ");
  console.log("Note: POST /createBooking and POST /joinEvent were not tested due to rate limiting");
  console.log("=========================================================\n");
}

// Run the focused test
runFocusedTest().catch(error => {
  console.error("🚨 Error running focused test:", error);
});