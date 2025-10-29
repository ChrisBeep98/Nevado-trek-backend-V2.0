const axios = require('axios');

// Admin key - ultra secret
const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

// Base URL for the functions - you'll need to update this with your actual Firebase project URL
// Example: 'https://us-central1-yours-project-id.cloudfunctions.net'
const BASE_URL = 'https://us-central1-nevadotrektest01.cloudfunctions.net';

// Test data
const testTour = {
  name: {
    es: "Tour de Prueba API Test",
    en: "API Test Tour"
  },
  description: {
    es: "Descripción del tour de prueba para testing",
    en: "Test tour description for API testing"
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

const testCustomer = {
  fullName: "API Test Customer",
  documentId: "API123456789",
  phone: "+573123456789",
  email: "api-test@example.com"
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
      console.log(`   Response preview: ${JSON.stringify(response.data, null, 2).substring(0, 500)}...`);
    }
    return response;
  } catch (error) {
    console.log(`   ❌ Error: ${error.response?.data ? JSON.stringify(error.response.data) : error.message}`);
    return error.response || { error: true, message: error.message };
  }
}

async function runComprehensiveTest() {
  console.log("🚀 Starting Comprehensive API Test for Nevado Trek Backend 🚀");
  console.log("=========================================================");
  
  // Store IDs for use in subsequent tests
  let createdTourId = null;
  let createdBookingId = null;
  let bookingReference = null;
  let createdEventId = null;

  // 1. TEST: Get Tours (Public Endpoint)
  console.log("\n📋 1. Testing GET /getToursV2 (Public Endpoint)");
  await testEndpoint(
    'GET Tours',
    'GET',
    `${BASE_URL}/getToursV2`
  );

  // 2. TEST: Create Tour (Admin Endpoint)
  console.log("\n📝 2. Testing POST /adminCreateTourV2 (Admin Endpoint)");
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
  } else {
    console.log("   ❌ Failed to create tour, stopping test sequence");
    return;
  }

  // 3. TEST: Get Tour by ID (Public Endpoint)
  if (createdTourId) {
    console.log("\n📋 3. Testing GET /getTourByIdV2/:tourId (Public Endpoint)");
    await testEndpoint(
      'GET Tour by ID',
      'GET',
      `${BASE_URL}/getTourByIdV2/${createdTourId}`
    );
  }

  // 4. TEST: Update Tour (Admin Endpoint)
  if (createdTourId) {
    console.log("\n✏️ 4. Testing PUT /adminUpdateTourV2/:tourId (Admin Endpoint)");
    await testEndpoint(
      'Update Tour',
      'PUT',
      `${BASE_URL}/adminUpdateTourV2/${createdTourId}`,
      { 'X-Admin-Secret-Key': ADMIN_KEY, 'Content-Type': 'application/json' },
      { 
        name: { 
          es: "Tour Actualizado API Test", 
          en: "Updated API Test Tour" 
        },
        description: {
          es: "Descripción actualizada para testing",
          en: "Updated description for testing"
        }
      }
    );
  }

  // 5. TEST: Create Booking (Public Endpoint)
  if (createdTourId) {
    const testBooking = {
      tourId: createdTourId,
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
      customer: testCustomer,
      pax: 2
    };
    
    console.log("\n🎫 5. Testing POST /createBooking (Public Endpoint)");
    const createBookingResponse = await testEndpoint(
      'Create Booking',
      'POST',
      `${BASE_URL}/createBooking`,
      { 'Content-Type': 'application/json' },
      testBooking
    );
    
    if (createBookingResponse.data?.bookingId) {
      createdBookingId = createBookingResponse.data.bookingId;
      bookingReference = createBookingResponse.data.bookingReference;
      console.log(`   🆔 Created Booking ID: ${createdBookingId}`);
      console.log(`   📋 Booking Reference: ${bookingReference}`);
    } else {
      console.log("   ❌ Failed to create booking, continuing with other tests");
    }
  }

  // 6. TEST: Check Booking (Public Endpoint)
  if (bookingReference) {
    console.log("\n🔍 6. Testing GET /checkBooking (Public Endpoint)");
    await testEndpoint(
      'Check Booking',
      'GET',
      `${BASE_URL}/checkBooking?reference=${bookingReference}`
    );
  }

  // 7. TEST: Get Bookings (Admin Endpoint)
  console.log("\n📋 7. Testing GET /adminGetBookings (Admin Endpoint)");
  await testEndpoint(
    'Get Bookings',
    'GET',
    `${BASE_URL}/adminGetBookings`,
    { 'X-Admin-Secret-Key': ADMIN_KEY }
  );

  // 8. TEST: Get Events Calendar (Admin Endpoint)
  console.log("\n📅 8. Testing GET /adminGetEventsCalendar (Admin Endpoint)");
  await testEndpoint(
    'Get Events Calendar',
    'GET',
    `${BASE_URL}/adminGetEventsCalendar`,
    { 'X-Admin-Secret-Key': ADMIN_KEY }
  );

  // 9. TEST: Update Booking Status (Admin Endpoint)
  if (createdBookingId) {
    console.log("\n🏷️ 9. Testing PUT /adminUpdateBookingStatus/:bookingId (Admin Endpoint)");
    await testEndpoint(
      'Update Booking Status',
      'PUT',
      `${BASE_URL}/adminUpdateBookingStatus/${createdBookingId}`,
      { 'X-Admin-Secret-Key': ADMIN_KEY, 'Content-Type': 'application/json' },
      { 
        status: 'confirmed',
        reason: 'API test confirmation'
      }
    );
  }

  // 10. TEST: Update Booking Details (Admin Endpoint)
  if (createdBookingId) {
    console.log("\n✏️ 10. Testing PUT /adminUpdateBookingDetails/:bookingId (Admin Endpoint)");
    await testEndpoint(
      'Update Booking Details',
      'PUT',
      `${BASE_URL}/adminUpdateBookingDetails/${createdBookingId}`,
      { 'X-Admin-Secret-Key': ADMIN_KEY, 'Content-Type': 'application/json' },
      { 
        customer: {
          fullName: "Updated API Test Customer",
          email: "updated-api-test@example.com"
        },
        pax: 3,
        reason: 'API test update'
      }
    );
  }

  // 11. TEST: Create another booking for joinEvent test
  if (createdTourId) {
    console.log("\n🎫 11. Creating additional booking for join event test...");
    const additionalBooking = {
      tourId: createdTourId,
      startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days from now
      customer: {
        ...testCustomer,
        fullName: "Second API Test Customer"
      },
      pax: 1
    };
    
    const additionalBookingResponse = await testEndpoint(
      'Create Additional Booking',
      'POST',
      `${BASE_URL}/createBooking`,
      { 'Content-Type': 'application/json' },
      additionalBooking
    );
    
    if (additionalBookingResponse.data?.bookingId && additionalBookingResponse.data?.eventId) {
      // Get the event ID from this booking to test joinEvent on this event
      createdEventId = additionalBookingResponse.data.eventId;
      console.log(`   🆔 Created additional booking with event ID: ${createdEventId}`);
    } else {
      console.log("   ❌ Could not get event ID for join test");
    }
  }

  // 12. TEST: Publish Event (Admin Endpoint)
  if (createdEventId) {
    console.log("\n📢 12. Testing POST /adminPublishEvent/:eventId (Admin Endpoint)");
    await testEndpoint(
      'Publish Event',
      'POST',
      `${BASE_URL}/adminPublishEvent/${createdEventId}`,
      { 'X-Admin-Secret-Key': ADMIN_KEY, 'Content-Type': 'application/json' },
      { action: 'publish' }
    );
  }

  // 13. TEST: Join Event (Public Endpoint) - Only if we have a published event
  if (createdEventId) {
    console.log("\n🤝 13. Testing POST /joinEvent (Public Endpoint)");
    const joinEventData = {
      eventId: createdEventId,
      customer: {
        fullName: "Join Event Test Customer",
        documentId: "JOIN123456789",
        phone: "+573123456799",
        email: "join-test@example.com"
      },
      pax: 1
    };
    
    await testEndpoint(
      'Join Event',
      'POST',
      `${BASE_URL}/joinEvent`,
      { 'Content-Type': 'application/json' },
      joinEventData
    );
  }

  // 14. TEST: Transfer Booking (Admin Endpoint)
  if (createdBookingId && createdEventId) {
    console.log("\n🔄 14. Testing POST /adminTransferBooking/:bookingId (Admin Endpoint)");
    await testEndpoint(
      'Transfer Booking',
      'POST',
      `${BASE_URL}/adminTransferBooking/${createdBookingId}`,
      { 'X-Admin-Secret-Key': ADMIN_KEY, 'Content-Type': 'application/json' },
      { 
        destinationEventId: createdEventId,
        reason: 'API test transfer'
      }
    );
  }

  // 15. TEST: Delete Tour (Admin Endpoint)
  if (createdTourId) {
    console.log("\n🗑️ 15. Testing DELETE /adminDeleteTourV2/:tourId (Admin Endpoint)");
    await testEndpoint(
      'Delete Tour',
      'DELETE',
      `${BASE_URL}/adminDeleteTourV2/${createdTourId}`,
      { 'X-Admin-Secret-Key': ADMIN_KEY }
    );
  }

  console.log("\n=========================================================");
  console.log("✅ Comprehensive API Test Complete!");
  console.log(`📋 Created Tour ID: ${createdTourId || 'None'}`);
  console.log(`🎫 Created Booking ID: ${createdBookingId || 'None'}`);
  console.log(`📋 Booking Reference: ${bookingReference || 'None'}`);
  console.log(`📅 Created Event ID: ${createdEventId || 'None'}`);
  console.log("=========================================================\n");
}

// Run the comprehensive test
runComprehensiveTest().catch(error => {
  console.error("🚨 Error running comprehensive test:", error);
});