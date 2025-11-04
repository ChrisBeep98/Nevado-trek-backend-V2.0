const axios = require('axios');

// Admin key - ultra secret
const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

// Base URL for the functions
const BASE_URL = 'https://us-central1-nevadotrektest01.cloudfunctions.net';

// Function to test the booking operations
async function testBookingOperations() {
  console.log("🚀 Testing Booking Date Change and Tour Transfer Operations 🚀");
  console.log("=============================================================");

  // Step 1: Get bookings to find one to test with
  console.log("\n📋 1. Getting existing bookings to select one for testing...");
  try {
    const bookingsResponse = await axios.get(`${BASE_URL}/adminGetBookings`, {
      headers: { 'X-Admin-Secret-Key': ADMIN_KEY }
    });
    
    if (bookingsResponse.data.bookings && bookingsResponse.data.bookings.length > 0) {
      const testBooking = bookingsResponse.data.bookings[0]; // Use first booking
      console.log(`   ✅ Found test booking with ID: ${testBooking.bookingId}`);
      console.log(`   📅 Current date: ${testBooking.startDate}`);
      console.log(`   🏔️  Current tour: ${testBooking.tourName}`);
      console.log(`   📅 Current event ID: ${testBooking.eventId}`);
      
      // Get the original event details
      console.log("\n📅 2. Getting original event details...");
      const eventsResponse = await axios.get(`${BASE_URL}/adminGetEventsCalendar`, {
        headers: { 'X-Admin-Secret-Key': ADMIN_KEY },
        params: { limit: 100 }
      });
      
      const originalEvent = eventsResponse.data.events.find(event => event.eventId === testBooking.eventId);
      if (originalEvent) {
        console.log(`   ✅ Original event date: ${originalEvent.startDate}`);
        console.log(`   ✅ Original event capacity: ${originalEvent.bookedSlots}/${originalEvent.maxCapacity}`);
      }
      
      // Step 2: Update booking date (this should create a new event)
      console.log("\n📅 3. Changing booking date to a new day...");
      const newDate = new Date();
      newDate.setDate(newDate.getDate() + 15); // 15 days from now
      const newDateStr = newDate.toISOString().split('T')[0];
      
      const updateDateResponse = await axios.put(
        `${BASE_URL}/adminUpdateBookingDetails/${testBooking.bookingId}`,
        { 
          startDate: newDateStr,
          reason: 'Test date change'
        },
        {
          headers: {
            'X-Admin-Secret-Key': ADMIN_KEY,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log(`   ✅ Booking date updated: ${updateDateResponse.data.success}`);
      console.log(`   📅 New date: ${newDateStr}`);
      
      // Step 3: Check what happened to the event after date change
      console.log("\n🔎 4. Checking event after date change...");
      const checkBookingAfterDateResponse = await axios.get(`${BASE_URL}/checkBooking?reference=${testBooking.bookingReference}`);
      console.log(`   ✅ Booking details after date change: ${checkBookingAfterDateResponse.status}`);
      console.log(`   📅 Updated booking date: ${checkBookingAfterDateResponse.data.startDate}`);
      console.log(`   📅 Booking event ID: ${checkBookingAfterDateResponse.data.eventId}`);
      
      // Step 4: Now transfer to a different tour
      console.log("\n🏔️ 5. Getting available tours for transfer test...");
      const toursResponse = await axios.get(`${BASE_URL}/getToursV2`);
      const availableTours = toursResponse.data.filter(tour => tour.tourId !== testBooking.tourId);
      
      if (availableTours.length > 0) {
        const newTour = availableTours[0];
        console.log(`   ✅ Found alternative tour: ${newTour.name.es}`);
        
        // Create a new event date for the transfer
        const transferDate = new Date();
        transferDate.setDate(transferDate.getDate() + 20); // 20 days from now
        const transferDateStr = transferDate.toISOString().split('T')[0];
        
        console.log("\n🔄 6. Transferring booking to new tour and date...");
        const transferResponse = await axios.post(
          `${BASE_URL}/adminTransferToNewTour/${testBooking.bookingId}`,
          {
            newTourId: newTour.tourId,
            newStartDate: transferDateStr,
            reason: 'Test tour transfer'
          },
          {
            headers: {
              'X-Admin-Secret-Key': ADMIN_KEY,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log(`   ✅ Transfer completed: ${transferResponse.data.success}`);
        console.log(`   🏔️  New tour: ${newTour.name.es}`);
        console.log(`   📅 New date: ${transferDateStr}`);
        
        // Step 5: Check the final state of the booking
        console.log("\n🔍 7. Checking final booking state...");
        const finalCheckResponse = await axios.get(`${BASE_URL}/checkBooking?reference=${testBooking.bookingReference}`);
        console.log(`   ✅ Final booking details: ${finalCheckResponse.status}`);
        console.log(`   🏔️  Final tour: ${finalCheckResponse.data.tourName?.es || finalCheckResponse.data.tourName}`);
        console.log(`   📅 Final date: ${finalCheckResponse.data.startDate}`);
        console.log(`   📅 Final event ID: ${finalCheckResponse.data.eventId}`);
        
        // Step 6: Check the state of original and new events
        console.log("\n📊 8. Checking original and new event states...");
        
        // Get all events to see the impact
        const allEventsResponse = await axios.get(`${BASE_URL}/adminGetEventsCalendar`, {
          headers: { 'X-Admin-Secret-Key': ADMIN_KEY },
          params: { limit: 100 }
        });
        
        // Find events related to our test
        const originalEventAfter = allEventsResponse.data.events.find(event => event.eventId === testBooking.eventId);
        const newEventAfter = allEventsResponse.data.events.find(event => event.eventId === finalCheckResponse.data.eventId);
        
        if (originalEventAfter) {
          console.log(`   📅 Original event (ID: ${originalEventAfter.eventId}):`);
          console.log(`      - Date: ${originalEventAfter.startDate}`);
          console.log(`      - Capacity: ${originalEventAfter.bookedSlots}/${originalEventAfter.maxCapacity}`);
          console.log(`      - Status: ${originalEventAfter.status}`);
        }
        
        if (newEventAfter) {
          console.log(`   📅 New event (ID: ${newEventAfter.eventId}):`);
          console.log(`      - Date: ${newEventAfter.startDate}`);
          console.log(`      - Capacity: ${newEventAfter.bookedSlots}/${newEventAfter.maxCapacity}`);
          console.log(`      - Status: ${newEventAfter.status}`);
          console.log(`      - Tour: ${newEventAfter.tourName}`);
        }
        
        console.log("\n✅ All operations completed successfully!");
        
      } else {
        console.log("   ❌ No alternative tours available for transfer test");
      }
    } else {
      console.log("   ❌ No bookings available for testing");
    }
  } catch (error) {
    console.log(`   ❌ Error during operations: ${error.message}`);
    if (error.response) {
      console.log(`   📡 Error response:`, error.response.data);
    }
  }

  console.log("\n=============================================================");
  console.log("🏁 Booking Date Change and Tour Transfer Test Complete!");
}

// Run the test
testBookingOperations().catch(error => {
  console.error("🚨 Error running test:", error);
});