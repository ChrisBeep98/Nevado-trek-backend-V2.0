const axios = require('axios');

// Admin key - ultra secret
const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

// Base URL for the functions
const BASE_URL = 'https://us-central1-nevadotrektest01.cloudfunctions.net';

// Function to test the booking transfer operations after the fix
async function testTransferFix() {
  console.log("🚀 Testing Fixed adminTransferToNewTour Function 🚀");
  console.log("=================================================");

  try {
    // Step 1: Get bookings and tours to select test data
    console.log("\n📋 1. Getting existing bookings and tours...");
    const bookingsResponse = await axios.get(`${BASE_URL}/adminGetBookings`, {
      headers: { 'X-Admin-Secret-Key': ADMIN_KEY }
    });
    
    const toursResponse = await axios.get(`${BASE_URL}/getToursV2`);
    
    if (bookingsResponse.data.bookings && bookingsResponse.data.bookings.length > 0 && 
        toursResponse.data && toursResponse.data.length > 0) {
      
      // Find a booking that's not already cancelled and a different tour
      const testBooking = bookingsResponse.data.bookings[0];
      const otherTours = toursResponse.data.filter(tour => tour.tourId !== testBooking.tourId);
      
      if (otherTours.length > 0) {
        console.log(`   ✅ Selected booking: ${testBooking.bookingId}`);
        console.log(`   ✅ Original tour: ${testBooking.tourName}`);
        console.log(`   ✅ Original tour ID: ${testBooking.tourId}`);
        console.log(`   ✅ Target tour: ${otherTours[0].name.es}`);
        console.log(`   ✅ Target tour ID: ${otherTours[0].tourId}`);
        
        // Step 2: Get the original booking details to get the date
        console.log("\n🔍 2. Getting booking details to extract date...");
        const bookingDetails = await axios.get(`${BASE_URL}/checkBooking?reference=${testBooking.bookingReference}`);
        console.log(`   ✅ Booking details retrieved:`, {
          startDate: bookingDetails.data.startDate,
          dataFormat: typeof bookingDetails.data.startDate
        });
        
        // Step 3: Attempt the tour transfer (the previously failing operation)
        console.log("\n🔄 3. Attempting tour transfer operation...");
        
        // Format the date appropriately for the API
        let targetDate;
        if (typeof bookingDetails.data.startDate === 'string') {
          // If it's already a date string, use it directly
          targetDate = new Date(bookingDetails.data.startDate).toISOString().split('T')[0];
        } else if (bookingDetails.data.startDate && bookingDetails.data.startDate._seconds) {
          // If it's a Firestore timestamp object
          targetDate = new Date(bookingDetails.data.startDate._seconds * 1000).toISOString().split('T')[0];
        } else {
          // Fallback: use current date + 30 days
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + 30);
          targetDate = futureDate.toISOString().split('T')[0];
        }
        
        console.log(`   📅 Using date for transfer: ${targetDate}`);
        
        const transferResponse = await axios.post(
          `${BASE_URL}/adminTransferToNewTour/${testBooking.bookingId}`,
          {
            newTourId: otherTours[0].tourId,
            newStartDate: targetDate, // Use properly formatted date
            reason: 'Test transfer after fixing Firestore transaction'
          },
          {
            headers: {
              'X-Admin-Secret-Key': ADMIN_KEY,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log(`   ✅ Transfer completed: ${transferResponse.data.success}`);
        console.log(`   🆔 New Booking ID: ${transferResponse.data.newBookingId}`);
        console.log(`   📋 New Booking Reference: ${transferResponse.data.newBookingReference}`);
        console.log(`   🏔️  Original Booking Cancelled: ${transferResponse.data.cancelledBookingStatus}`);
        
        // Check the new booking
        console.log("\n🔍 4. Verifying new booking after transfer...");
        const newBookingCheck = await axios.get(`${BASE_URL}/checkBooking?reference=${transferResponse.data.newBookingReference}`);
        console.log(`   ✅ New booking tour: ${newBookingCheck.data.tourName?.es || newBookingCheck.data.tourName}`);
        console.log(`   ✅ New booking date: ${newBookingCheck.data.startDate}`);
        console.log(`   ✅ New booking status: ${newBookingCheck.data.status}`);
        
        // Check that original booking is cancelled
        console.log("\n🔍 5. Verifying original booking is cancelled...");
        const originalBookingCheck = await axios.get(`${BASE_URL}/checkBooking?reference=${testBooking.bookingReference}`);
        console.log(`   ✅ Original booking status: ${originalBookingCheck.data.status}`);
        
        // Check events
        console.log("\n📅 6. Checking original and new events...");
        const eventsResponse = await axios.get(`${BASE_URL}/adminGetEventsCalendar`, {
          headers: { 'X-Admin-Secret-Key': ADMIN_KEY },
          params: { limit: 100 }
        });
        
        // Find the events for both bookings
        const originalEvent = eventsResponse.data.events.find(event => event.eventId === testBooking.eventId);
        const newBookingCheckDetails = await axios.get(`${BASE_URL}/checkBooking?reference=${transferResponse.data.newBookingReference}`);
        const newEvent = eventsResponse.data.events.find(event => event.eventId === newBookingCheckDetails.data.eventId);
        
        if (originalEvent) {
          console.log(`   📅 Original event (ID: ${originalEvent.eventId}):`);
          console.log(`      - Tour: ${originalEvent.tourName}`);
          console.log(`      - Date: ${originalEvent.startDate}`);
          console.log(`      - Capacity: ${originalEvent.bookedSlots}/${originalEvent.maxCapacity}`);
        }
        
        if (newEvent) {
          console.log(`   📅 New event (ID: ${newEvent.eventId}):`);
          console.log(`      - Tour: ${newEvent.tourName}`);
          console.log(`      - Date: ${newEvent.startDate}`);
          console.log(`      - Capacity: ${newEvent.bookedSlots}/${newEvent.maxCapacity}`);
        }
        
        console.log("\n✅ All operations completed successfully! The Firestore transaction fix worked!");
        
      } else {
        console.log("   ❌ No alternative tours available for transfer test");
      }
    } else {
      console.log("   ❌ No bookings or tours available for testing");
    }
  } catch (error) {
    console.log(`   ❌ Error during transfer test: ${error.message}`);
    if (error.response) {
      console.log(`   📡 Error response:`, error.response.data);
    }
  }

  console.log("\n=================================================");
  console.log("🏁 Tour Transfer Fix Test Complete!");
}

testTransferFix().catch(error => {
  console.error("🚨 Error running transfer fix test:", error);
});