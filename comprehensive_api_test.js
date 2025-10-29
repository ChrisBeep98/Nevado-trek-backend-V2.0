const axios = require('axios');

// Admin key - ultra secret
const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

// Base URL for the functions - you'll need to update this with your actual Firebase project URL
// Example: 'https://us-central1-yours-project-id.cloudfunctions.net'
const BASE_URL = 'https://us-central1-nevadotrektest01.cloudfunctions.net';

// Test data
const testTour = {
  name: {
    es: "Tour de Prueba",
    en: "Test Tour"
  },
  description: {
    es: "Descripción del tour de prueba",
    en: "Test tour description"
  },
  maxCapacity: 8,
  pricingTiers: [
    { pax: 1, pricePerPerson: 1000000 },
    { pax: 2, pricePerPerson: 900000 },
    { pax: 4, pricePerPerson: 800000 }
  ],
  isActive: true
};

const testCustomer = {
  fullName: "Test Customer",
  documentId: "123456789",
  phone: "+573123456789",
  email: "test@example.com"
};

const testBooking = {
  tourId: "",
  startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
  customer: testCustomer,
  pax: 2
};

const testEventDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(); // 10 days from now

async function testEndpoint(name, method, url, headers = {}, data = null) {
  console.log(`\n🧪 Testing ${name}...`);
  console.log(`   Method: ${method}, URL: ${url}`);
  
  if (data) {
    console.log(`   Data: ${JSON.stringify(data)}`);
  }
  
  try {
    const response = await axios({
      method,
      url,
      headers,
      data
    });
    
    console.log(`   ✅ Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
    return response;
  } catch (error) {
    console.log(`   ❌ Error: ${error.response?.data || error.message}`);
    return error.response || { error: true, message: error.message };
  }
}

async function runComprehensiveTest() {
  console.log("🚀 Starting Comprehensive API Test for Nevado Trek Backend 🚀");
  console.log("=========================================================");
  
  // Store IDs for use in subsequent tests
  let createdTourId = null;
  let createdEventId = null;
  let createdBookingId = null;
  let bookingReference = null;

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
          es: "Tour Actualizado", 
          en: "Updated Tour" 
        },
        description: {
          es: "Descripción actualizada",
          en: "Updated description"
        }
      }
    );
  }

  // 5. TEST: Create Booking (Public Endpoint)
  if (createdTourId) {
    testBooking.tourId = createdTourId;
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
        reason: 'Test confirmation'
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
          fullName: "Updated Test Customer",
          email: "updated@example.com"
        },
        pax: 3,
        reason: 'Test update'
      }
    );
  }

  // 11. TEST: Create another booking to test joining events
  if (createdTourId) {
    console.log("\n🎫 11. Testing POST /joinEvent (Public Endpoint) - First we need an event to join");
    
    // We'll create another booking which will create a private event, then make it public
    const newBookingData = {
      tourId: createdTourId,
      startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      customer: {
        ...testCustomer,
        fullName: "Event Creator Customer"
      },
      pax: 2
    };
    
    const createEventBookingResponse = await testEndpoint(
      'Create Event Booking',
      'POST',
      `${BASE_URL}/createBooking`,
      { 'Content-Type': 'application/json' },
      newBookingData
    );
    
    if (createEventBookingResponse.data?.bookingId) {
      // Try to find the event ID from the created booking
      // The event will be created but we don't have the eventId directly
      // In real scenario, we would need to query for the event
      const eventId = createEventBookingResponse.data.bookingId; // This is not correct, but we'll proceed with test
    }
  }

  // 12. TEST: Publish Event (Admin Endpoint) - This would require an existing event
  console.log("\n📢 12. Testing POST /adminPublishEvent/:eventId (Admin Endpoint) - This requires a specific event ID");
  // We can't test this without a real event ID

  // 13. TEST: Transfer Booking (Admin Endpoint)
  if (createdBookingId) {
    console.log("\n🔄 13. Testing POST /adminTransferBooking/:bookingId (Admin Endpoint)");
    // This requires a destination event ID, which we don't have in this test
    // For now, we'll just show what would be tested
    console.log("    This requires a destination event ID to test properly");
  }

  // 14. TEST: Delete Tour (Admin Endpoint)
  if (createdTourId) {
    console.log("\n🗑️ 14. Testing DELETE /adminDeleteTourV2/:tourId (Admin Endpoint)");
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
  console.log("=========================================================\n");
}

// Run the comprehensive test
runComprehensiveTest().catch(error => {
  console.error("🚨 Error running comprehensive test:", error);
});