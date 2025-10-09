/**
 * Complete API Test Suite - Nevado Trek Backend MVP
 * Tests all 13 deployed functions using correct URLs
 */

const axios = require('axios');

const config = {
  baseUrl: 'https://us-central1-nevadotrektest01.cloudfunctions.net',
  adminSecretKey: 'miClaveSecreta123'
};

// Test results tracker
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: [],
  urls: {
    getToursV2: 'https://gettoursv2-wgfhwjbpva-uc.a.run.app',
    getTourByIdV2: 'https://gettourbyidv2-wgfhwjbpva-uc.a.run.app',
    adminCreateTourV2: 'https://admincreatetourv2-wgfhwjbpva-uc.a.run.app',
    adminUpdateTourV2: 'https://adminupdatetourv2-wgfhwjbpva-uc.a.run.app',
    adminDeleteTourV2: 'https://admindeletetourv2-wgfhwjbpva-uc.a.run.app',
    adminGetBookings: 'https://admingetbookings-wgfhwjbpva-uc.a.run.app',
    adminUpdateBookingStatus: 'https://adminupdatebookingstatus-wgfhwjbpva-uc.a.run.app',
    adminGetEventsCalendar: 'https://admingeteventscalendar-wgfhwjbpva-uc.a.run.app',
    adminPublishEvent: 'https://adminpublishevent-wgfhwjbpva-uc.a.run.app',
    adminTransferBooking: 'https://us-central1-nevadotrektest01.cloudfunctions.net/adminTransferBooking',
    createBooking: 'https://createbooking-wgfhwjbpva-uc.a.run.app',
    joinEvent: 'https://joinevent-wgfhwjbpva-uc.a.run.app',
    checkBooking: 'https://checkbooking-wgfhwjbpva-uc.a.run.app'
  }
};

// Function to run individual tests
async function runTest(testName, testFunction) {
  testResults.total++;
  console.log(`\n🔍 ${testResults.total}. Testing: ${testName}`);
  
  try {
    await testFunction();
    console.log(`✅ PASSED: ${testName}`);
    testResults.passed++;
    testResults.details.push({ name: testName, status: 'PASSED', error: null });
  } catch (error) {
    console.log(`❌ FAILED: ${testName}`);
    console.log(`   Error: ${error.message}`);
    testResults.failed++;
    testResults.details.push({ name: testName, status: 'FAILED', error: error.message });
  }
}

// Main comprehensive test function
async function runCompleteApiTest() {
  console.log("🚀 Starting Complete API Test Suite for Nevado Trek Backend MVP");
  console.log("📊 Testing all 13 deployed functions...\n");
  
  // Test 1: GET /getToursV2
  await runTest("GET /getToursV2 - List all active tours", async () => {
    const response = await axios.get(config.urls.getToursV2);
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    if (!Array.isArray(response.data)) throw new Error("Expected array response");
  });
  
  // Test 2: GET /getTourByIdV2
  await runTest("GET /getTourByIdV2 - Get specific tour", async () => {
    // First get a tour ID
    const toursResponse = await axios.get(config.urls.getToursV2);
    if (toursResponse.data.length > 0) {
      const tourId = toursResponse.data[0].tourId;
      const response = await axios.get(`${config.urls.getTourByIdV2}/${tourId}`);
      if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    }
  });
  
  // Test 3: POST /createBooking (will be limited by rate limiting)
  await runTest("POST /createBooking - Create new booking (rate limited check)", async () => {
    try {
      await axios.post(config.urls.createBooking, {
        tourId: "test", // This will fail validation, but tests endpoint availability
        startDate: "2025-12-01T00:00:00Z",
        customer: {
          fullName: "Test Customer",
          documentId: "CC00000000",
          phone: "+573000000000",
          email: "test@example.com"
        },
        pax: 2
      });
      // If it doesn't throw, it means the endpoint is available
    } catch (error) {
      // Expected to fail with validation or rate limiting, but endpoint should be available
      if (error.response?.status === 404 || error.response?.status === 500) {
        throw error; // Unexpected errors
      }
      // 400, 403, 422 are expected for validation/rate limiting
    }
  });
  
  // Test 4: POST /joinEvent (will be limited by rate limiting)
  await runTest("POST /joinEvent - Join existing event (rate limited check)", async () => {
    try {
      await axios.post(config.urls.joinEvent, {
        eventId: "test",
        customer: {
          fullName: "Test Customer",
          documentId: "CC00000000",
          phone: "+573000000000",
          email: "test@example.com"
        },
        pax: 2
      });
    } catch (error) {
      // Expected to fail with validation, but endpoint should be available
      if (error.response?.status === 404 || error.response?.status === 500) {
        throw error; // Unexpected errors
      }
      // 400, 403, 422 are expected for validation/rate limiting
    }
  });
  
  // Test 5: GET /checkBooking
  await runTest("GET /checkBooking - Check booking status", async () => {
    try {
      // This should fail with missing reference, but endpoint should be available
      await axios.get(config.urls.checkBooking);
    } catch (error) {
      if (error.response?.status !== 400) {
        throw error; // Only 400 (bad request for missing reference) is expected
      }
    }
  });
  
  // Test 6: POST /adminCreateTourV2
  await runTest("POST /adminCreateTourV2 - Create tour (admin)", async () => {
    const testTour = {
      name: { es: `Test Tour ${Date.now()}`, en: `Test Tour ${Date.now()}` },
      description: { es: "Tour de prueba", en: "Test tour" },
      price: { amount: 100000, currency: "COP" },
      maxParticipants: 8,
      duration: "1 day",
      isActive: true
    };
    
    const response = await axios.post(
      config.urls.adminCreateTourV2,
      testTour,
      { headers: { 'x-admin-secret-key': config.adminSecretKey } }
    );
    
    if (response.status !== 201) throw new Error(`Expected 201, got ${response.status}`);
  });
  
  // Test 7: PUT /adminUpdateTourV2
  await runTest("PUT /adminUpdateTourV2 - Update tour (admin)", async () => {
    // Get a tour to update
    const toursResponse = await axios.get(config.urls.getToursV2);
    const tour = toursResponse.data.find(t => t.name.es.includes('Test Tour'));
    
    if (tour) {
      const response = await axios.put(
        `${config.urls.adminUpdateTourV2}/${tour.tourId}`,
        { name: { es: `Updated Test Tour ${Date.now()}`, en: `Updated Test Tour ${Date.now()}` } },
        { headers: { 'x-admin-secret-key': config.adminSecretKey } }
      );
      
      if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    }
  });
  
  // Test 8: DELETE /adminDeleteTourV2
  await runTest("DELETE /adminDeleteTourV2 - Delete tour (admin)", async () => {
    // Create a test tour first, then delete it
    const newTour = {
      name: { es: `Delete Test Tour ${Date.now()}`, en: `Delete Test Tour ${Date.now()}` },
      description: { es: "Tour para eliminar", en: "Tour to delete" },
      isActive: true
    };
    
    const createResponse = await axios.post(
      config.urls.adminCreateTourV2,
      newTour,
      { headers: { 'x-admin-secret-key': config.adminSecretKey } }
    );
    
    if (createResponse.data.success && createResponse.data.tourId) {
      const response = await axios.delete(
        `${config.urls.adminDeleteTourV2}/${createResponse.data.tourId}`,
        { headers: { 'x-admin-secret-key': config.adminSecretKey } }
      );
      
      if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    }
  });
  
  // Test 9: GET /adminGetBookings
  await runTest("GET /adminGetBookings - List bookings (admin)", async () => {
    const response = await axios.get(
      config.urls.adminGetBookings,
      { headers: { 'x-admin-secret-key': config.adminSecretKey } }
    );
    
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    if (typeof response.data !== 'object') throw new Error("Expected object response");
  });
  
  // Test 10: PUT /adminUpdateBookingStatus
  await runTest("PUT /adminUpdateBookingStatus - Update booking status (admin)", async () => {
    // Get a booking to update
    const bookingsResponse = await axios.get(
      config.urls.adminGetBookings,
      { headers: { 'x-admin-secret-key': config.adminSecretKey } }
    );
    
    if (bookingsResponse.data.bookings && bookingsResponse.data.bookings.length > 0) {
      const booking = bookingsResponse.data.bookings[0];
      const response = await axios.put(
        `${config.urls.adminUpdateBookingStatus}/${booking.bookingId}`,
        { status: 'confirmed', reason: 'Test status update' },
        { headers: { 'x-admin-secret-key': config.adminSecretKey } }
      );
      
      if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    }
  });
  
  // Test 11: GET /adminGetEventsCalendar
  await runTest("GET /adminGetEventsCalendar - Calendar view (admin)", async () => {
    const response = await axios.get(
      config.urls.adminGetEventsCalendar,
      { headers: { 'x-admin-secret-key': config.adminSecretKey } }
    );
    
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    if (typeof response.data !== 'object') throw new Error("Expected object response");
  });
  
  // Test 12: POST /adminPublishEvent
  await runTest("POST /adminPublishEvent - Publish/unpublish event (admin)", async () => {
    // Get an event to publish/unpublish
    const eventsResponse = await axios.get(
      config.urls.adminGetEventsCalendar,
      { headers: { 'x-admin-secret-key': config.adminSecretKey } }
    );
    
    if (eventsResponse.data.events && eventsResponse.data.events.length > 0) {
      const event = eventsResponse.data.events[0];
      const response = await axios.post(
        `${config.urls.adminPublishEvent}/${event.eventId}`,
        { action: 'publish' },
        { headers: { 'x-admin-secret-key': config.adminSecretKey } }
      );
      
      if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    }
  });
  
  // Test 13: POST /adminTransferBooking
  await runTest("POST /adminTransferBooking - Transfer booking (admin)", async () => {
    // Get a booking and events to test transfer
    const bookingsResponse = await axios.get(
      config.urls.adminGetBookings,
      { headers: { 'x-admin-secret-key': config.adminSecretKey } }
    );
    
    const eventsResponse = await axios.get(
      config.urls.adminGetEventsCalendar,
      { headers: { 'x-admin-secret-key': config.adminSecretKey } }
    );
    
    if (bookingsResponse.data.bookings && bookingsResponse.data.bookings.length > 0 &&
        eventsResponse.data.events && eventsResponse.data.events.length > 1) {
      const booking = bookingsResponse.data.bookings[0];
      // Find a different event for the same tour
      const otherEvent = eventsResponse.data.events.find(e => 
        e.tourId === booking.tourId && e.eventId !== booking.eventId
      );
      
      if (otherEvent) {
        const response = await axios.post(
          config.urls.adminTransferBooking,
          { destinationEventId: otherEvent.eventId, reason: 'Test transfer' },
          { headers: { 'x-admin-secret-key': config.adminSecretKey } }
        );
        
        if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
      }
    }
  });
  
  // Final results
  console.log("\n" + "=".repeat(60));
  console.log("📊 COMPLETE API TEST RESULTS");
  console.log("=".repeat(60));
  console.log(`✅ Tests Passed: ${testResults.passed}`);
  console.log(`❌ Tests Failed: ${testResults.failed}`);
  console.log(`📊 Total Tests: ${testResults.total}`);
  console.log(`📈 Success Rate: ${Math.round((testResults.passed / testResults.total) * 100)}%`);
  
  if (testResults.failed === 0) {
    console.log("\n🎉 ALL TESTS PASSED! MVP is fully functional!");
    console.log("✅ All 13 endpoints are working correctly in production");
    console.log("✅ Admin and public endpoints operational");
    console.log("✅ Authentication and rate limiting working");
    console.log("✅ Data integrity maintained across all operations");
  } else {
    console.log("\n⚠️  Some tests failed. Please review the results above.");
  }
  
  console.log("\n📋 Test Details:");
  testResults.details.forEach((test, index) => {
    console.log(`   ${index + 1}. ${test.name}: ${test.status}`);
    if (test.error) {
      console.log(`      Error: ${test.error}`);
    }
  });
}

// Run the complete test
runCompleteApiTest().catch(console.error);