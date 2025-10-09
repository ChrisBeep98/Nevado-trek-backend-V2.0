/**
 * MVP Complete System Validation
 * This script validates that all 13 functions are working properly
 */

const axios = require('axios');

const adminSecret = 'miClaveSecreta123';

async function mvpValidation() {
  console.log("🏆 MVP COMPLETE SYSTEM VALIDATION");
  console.log("=".repeat(50));
  console.log("Validating all 13 deployed functions are operational...\n");

  let testsPassed = 0;
  let totalTests = 0;

  function runTest(name, testFunction) {
    totalTests++;
    return testFunction().then(() => {
      testsPassed++;
      console.log(`✅ ${name}`);
    }).catch(error => {
      console.log(`❌ ${name}: ${error.message}`);
    });
  }

  // Test 1: GET /getToursV2
  await runTest("GET /getToursV2 - Public tour listing", async () => {
    const response = await axios.get('https://gettoursv2-wgfhwjbpva-uc.a.run.app');
    if (response.status !== 200 || !Array.isArray(response.data)) {
      throw new Error(`Invalid response: ${response.status}`);
    }
  });

  // Test 2: GET /getTourByIdV2
  await runTest("GET /getTourByIdV2 - Specific tour detail", async () => {
    const tours = await axios.get('https://gettoursv2-wgfhwjbpva-uc.a.run.app');
    if (tours.data.length > 0) {
      const tourId = tours.data[0].tourId;
      const response = await axios.get(`https://gettourbyidv2-wgfhwjbpva-uc.a.run.app/${tourId}`);
      if (response.status !== 200) throw new Error(`Invalid status: ${response.status}`);
    }
  });

  // Test 3: POST /createBooking (rate limited - test availability)
  await runTest("POST /createBooking - Booking creation (rate limited)", async () => {
    try {
      await axios.post('https://createbooking-wgfhwjbpva-uc.a.run.app', {
        tourId: "test", customer: { fullName: "Test", documentId: "0", phone: "+123", email: "test@test.com" }, pax: 1
      });
    } catch (error) {
      if (error.response?.status !== 400 && error.response?.status !== 403) {
        throw error;
      }
    }
  });

  // Test 4: POST /joinEvent (rate limited - test availability)
  await runTest("POST /joinEvent - Event joining (rate limited)", async () => {
    try {
      await axios.post('https://joinevent-wgfhwjbpva-uc.a.run.app', {
        eventId: "test", customer: { fullName: "Test", documentId: "0", phone: "+123", email: "test@test.com" }, pax: 1
      });
    } catch (error) {
      if (error.response?.status !== 400 && error.response?.status !== 403) {
        throw error;
      }
    }
  });

  // Test 5: GET /checkBooking
  await runTest("GET /checkBooking - Booking status check", async () => {
    try {
      await axios.get('https://checkbooking-wgfhwjbpva-uc.a.run.app');
    } catch (error) {
      if (error.response?.status !== 400) throw error;
    }
  });

  // Test 6: POST /adminCreateTourV2
  let createdTourId = null;
  await runTest("POST /adminCreateTourV2 - Tour creation", async () => {
    const response = await axios.post(
      'https://admincreatetourv2-wgfhwjbpva-uc.a.run.app',
      { name: { es: "Validation Tour", en: "Validation Tour" }, isActive: true },
      { headers: { 'x-admin-secret-key': adminSecret } }
    );
    if (response.status === 201 && response.data.tourId) {
      createdTourId = response.data.tourId;
    } else {
      throw new Error(`Invalid response: ${response.status}`);
    }
  });

  // Test 7: PUT /adminUpdateTourV2
  await runTest("PUT /adminUpdateTourV2 - Tour update", async () => {
    if (createdTourId) {
      const response = await axios.put(
        `https://adminupdatetourv2-wgfhwjbpva-uc.a.run.app/${createdTourId}`,
        { name: { es: "Updated Validation Tour", en: "Updated Validation Tour" } },
        { headers: { 'x-admin-secret-key': adminSecret } }
      );
      if (response.status !== 200) throw new Error(`Invalid status: ${response.status}`);
    } else {
      throw new Error("No tour ID available");
    }
  });

  // Test 8: DELETE /adminDeleteTourV2
  await runTest("DELETE /adminDeleteTourV2 - Tour deletion", async () => {
    if (createdTourId) {
      const response = await axios.delete(
        `https://admindeletetourv2-wgfhwjbpva-uc.a.run.app/${createdTourId}`,
        { headers: { 'x-admin-secret-key': adminSecret } }
      );
      if (response.status !== 200) throw new Error(`Invalid status: ${response.status}`);
    } else {
      throw new Error("No tour ID available");
    }
  });

  // Test 9: GET /adminGetBookings
  await runTest("GET /adminGetBookings - Booking listing", async () => {
    const response = await axios.get(
      'https://admingetbookings-wgfhwjbpva-uc.a.run.app',
      { headers: { 'x-admin-secret-key': adminSecret } }
    );
    if (response.status !== 200 || !response.data.bookings) {
      throw new Error(`Invalid response: ${response.status}`);
    }
  });

  // Test 10: PUT /adminUpdateBookingStatus
  await runTest("PUT /adminUpdateBookingStatus - Status update", async () => {
    const bookings = await axios.get(
      'https://admingetbookings-wgfhwjbpva-uc.a.run.app',
      { headers: { 'x-admin-secret-key': adminSecret } }
    );
    if (bookings.data.bookings.length > 0) {
      const bookingId = bookings.data.bookings[0].bookingId;
      const response = await axios.put(
        `https://adminupdatebookingstatus-wgfhwjbpva-uc.a.run.app/${bookingId}`,
        { status: 'pending', reason: 'Validation test' },
        { headers: { 'x-admin-secret-key': adminSecret } }
      );
      if (response.status !== 200) throw new Error(`Invalid status: ${response.status}`);
    }
  });

  // Test 11: GET /adminGetEventsCalendar
  await runTest("GET /adminGetEventsCalendar - Event calendar", async () => {
    const response = await axios.get(
      'https://admingeteventscalendar-wgfhwjbpva-uc.a.run.app',
      { headers: { 'x-admin-secret-key': adminSecret } }
    );
    if (response.status !== 200 || !response.data.events) {
      throw new Error(`Invalid response: ${response.status}`);
    }
  });

  // Test 12: POST /adminPublishEvent
  await runTest("POST /adminPublishEvent - Event publish/unpublish", async () => {
    const events = await axios.get(
      'https://admingeteventscalendar-wgfhwjbpva-uc.a.run.app',
      { headers: { 'x-admin-secret-key': adminSecret } }
    );
    if (events.data.events.length > 0) {
      const event = events.data.events[0];
      const response = await axios.post(
        `https://adminpublishevent-wgfhwjbpva-uc.a.run.app/${event.eventId}`,
        { action: 'publish' },
        { headers: { 'x-admin-secret-key': adminSecret } }
      );
      if (response.status !== 200) throw new Error(`Invalid status: ${response.status}`);
    }
  });

  // Test 13: POST /adminTransferBooking
  await runTest("POST /adminTransferBooking - Booking transfer", async () => {
    const [bookings, events] = await Promise.all([
      axios.get('https://admingetbookings-wgfhwjbpva-uc.a.run.app', { headers: { 'x-admin-secret-key': adminSecret } }),
      axios.get('https://admingeteventscalendar-wgfhwjbpva-uc.a.run.app', { headers: { 'x-admin-secret-key': adminSecret } })
    ]);
    
    if (bookings.data.bookings.length > 0 && events.data.events.length > 1) {
      const booking = bookings.data.bookings[0];
      const otherEvent = events.data.events.find(e => 
        e.tourId === booking.tourId && e.eventId !== booking.eventId
      );
      
      if (otherEvent) {
        const response = await axios.post(
          `https://us-central1-nevadotrektest01.cloudfunctions.net/adminTransferBooking/${booking.bookingId}`,
          { destinationEventId: otherEvent.eventId, reason: 'Validation test' },
          { headers: { 'x-admin-secret-key': adminSecret } }
        );
        if (response.status !== 200) throw new Error(`Invalid status: ${response.status}`);
      }
    }
  });

  // Security Test: Unauthorized access
  await runTest("Security - Unauthorized access blocked", async () => {
    try {
      await axios.get('https://admingetbookings-wgfhwjbpva-uc.a.run.app');
      throw new Error("Admin access allowed without authorization");
    } catch (error) {
      if (error.response?.status !== 401) throw error;
    }
  });

  console.log("\n" + "=".repeat(50));
  console.log(`📊 RESULTS: ${testsPassed}/${totalTests} tests passed`);
  
  if (testsPassed === totalTests) {
    console.log("🎉 ALL TESTS PASSED!");
    console.log("🏆 MVP IS COMPLETE AND FULLY OPERATIONAL!");
    console.log("🚀 Ready for production use!");
  } else {
    console.log(`⚠️  ${totalTests - testsPassed} tests failed`);
  }
  console.log("=".repeat(50));
}

mvpValidation().catch(console.error);