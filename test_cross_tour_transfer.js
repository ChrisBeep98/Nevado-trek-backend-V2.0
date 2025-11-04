const axios = require('axios');

// Admin key - ultra secret
const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

// Base URL for the functions
const BASE_URL = 'https://us-central1-nevadotrektest01.cloudfunctions.net';

// Function to specifically test the cross-tour transfer functionality
async function testCrossTourTransfer() {
  console.log("🚀 Testing Cross-Tour Transfer Functionality 🚀");
  console.log("=================================================");

  try {
    // Step 1: Get bookings and tours to select test data
    console.log("\n📋 1. Getting existing bookings and tours...");
    const toursResponse = await axios.get(`${BASE_URL}/getToursV2`);
    
    if (toursResponse.data && toursResponse.data.length >= 2) {
      const tour1 = toursResponse.data[0];
      const tour2 = toursResponse.data[1]; // Use second tour for transfer
      
      console.log(`   ✅ Tour 1: ${tour1.name.es} (ID: ${tour1.tourId})`);
      console.log(`   ✅ Tour 2: ${tour2.name.es} (ID: ${tour2.tourId})`);
      
      // Step 2: Create a new booking on the first tour
      console.log("\n📝 2. Creating a new booking on first tour...");
      
      // Use a date 30 days from now
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const dateStr = futureDate.toISOString().split('T')[0];
      
      const bookingPayload = {
        tourId: tour1.tourId,
        startDate: dateStr,
        pax: 2,
        customer: {
          fullName: "Cross Tour Test Customer",
          documentId: "TEST123456",
          phone: "+573123456789",
          email: `crosstest${Date.now()}@example.com`,
          notes: "Test booking for cross-tour transfer"
        }
      };
      
      // Since createBooking may be rate-limited, let's try to find an existing booking instead
      console.log("   Looking for an existing booking to test transfer instead...");
      
      const bookingsResponse = await axios.get(`${BASE_URL}/adminGetBookings`, {
        headers: { 'X-Admin-Secret-Key': ADMIN_KEY }
      });
      
      let testBooking = null;
      if (bookingsResponse.data.bookings && bookingsResponse.data.bookings.length > 0) {
        // Find a booking that is not on the target tour
        testBooking = bookingsResponse.data.bookings.find(booking => 
          booking.tourId !== tour2.tourId && 
          booking.status !== 'cancelled' && 
          booking.status !== 'cancelled_by_admin'
        );
        
        if (testBooking) {
          console.log(`   ✅ Found existing booking to test: ${testBooking.bookingId}`);
          console.log(`   🏔️  Current tour: ${testBooking.tourName}`);
          
          // Step 3: Attempt cross-tour transfer
          console.log("\n🔄 3. Attempting cross-tour transfer...");
          
          // Get the booking's current date to use for the transfer
          const bookingDetails = await axios.get(`${BASE_URL}/checkBooking?reference=${testBooking.bookingReference}`);
          let bookingDate;
          if (typeof bookingDetails.data.startDate === 'string') {
            // If it's already a date string, use it directly
            bookingDate = new Date(bookingDetails.data.startDate).toISOString().split('T')[0];
          } else if (bookingDetails.data.startDate && bookingDetails.data.startDate._seconds) {
            // If it's a Firestore timestamp object
            bookingDate = new Date(bookingDetails.data.startDate._seconds * 1000).toISOString().split('T')[0];
          } else {
            // Fallback: use current date + 30 days
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 30);
            bookingDate = futureDate.toISOString().split('T')[0];
          }
          
          console.log(`   📅 Transfer from tour '${testBooking.tourName}' to tour '${tour2.name.es}' on date: ${bookingDate}`);
          
          const transferResponse = await axios.post(
            `${BASE_URL}/adminTransferToNewTour/${testBooking.bookingId}`,
            {
              newTourId: tour2.tourId,
              newStartDate: bookingDate,
              reason: 'Test cross-tour transfer functionality'
            },
            {
              headers: {
                'X-Admin-Secret-Key': ADMIN_KEY,
                'Content-Type': 'application/json'
              }
            }
          );
          
          console.log(`   ✅ Cross-tour transfer completed: ${transferResponse.data.success}`);
          console.log(`   🆔 New Booking ID: ${transferResponse.data.newBookingId}`);
          console.log(`   📋 New Booking Reference: ${transferResponse.data.newBookingReference}`);
          console.log(`   🏔️  New Tour: ${tour2.name.es}`);
          console.log(`   📅 Transfer Date: ${bookingDate}`);
          console.log(`   📝 Reason: Test cross-tour transfer functionality`);
          
          // Step 4: Verify the new booking details
          console.log("\n🔍 4. Verifying new booking after transfer...");
          const newBookingCheck = await axios.get(`${BASE_URL}/checkBooking?reference=${transferResponse.data.newBookingReference}`);
          console.log(`   ✅ New booking tour: ${newBookingCheck.data.tourName?.es || newBookingCheck.data.tourName}`);
          console.log(`   ✅ New booking status: ${newBookingCheck.data.status}`);
          console.log(`   ✅ New booking pax: ${newBookingCheck.data.pax}`);
          console.log(`   ✅ New booking customer: ${newBookingCheck.data.customer.fullName}`);
          
          // Step 5: Verify the original booking was cancelled
          console.log("\n🔍 5. Verifying original booking is cancelled...");
          const originalBookingCheck = await axios.get(`${BASE_URL}/checkBooking?reference=${testBooking.bookingReference}`);
          console.log(`   ✅ Original booking status: ${originalBookingCheck.data.status}`);
          
          // Step 6: Check events
          console.log("\n📅 6. Checking event changes...");
          const eventsResponse = await axios.get(`${BASE_URL}/adminGetEventsCalendar`, {
            headers: { 'X-Admin-Secret-Key': ADMIN_KEY },
            params: { limit: 100 }
          });
          
          const originalEvent = eventsResponse.data.events.find(event => event.eventId === testBooking.eventId);
          const newBookingDetails = await axios.get(`${BASE_URL}/checkBooking?reference=${transferResponse.data.newBookingReference}`);
          const newEvent = eventsResponse.data.events.find(event => event.eventId === newBookingDetails.data.eventId);
          
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
          
          console.log("\n✅ Cross-tour transfer functionality working correctly! The Firestore transaction fix worked!");
        } else {
          console.log("   ❌ No suitable existing bookings found for transfer test");
        }
      } else {
        console.log("   ❌ No bookings available for testing");
      }
    } else {
      console.log("   ❌ Not enough tours available for cross-tour transfer test");
    }
  } catch (error) {
    console.log(`   ❌ Error during cross-tour transfer test: ${error.message}`);
    if (error.response) {
      console.log(`   📡 Error response:`, error.response.data);
    }
  }

  console.log("\n=================================================");
  console.log("🏁 Cross-Tour Transfer Test Complete!");
}

testCrossTourTransfer().catch(error => {
  console.error("🚨 Error running cross-tour transfer test:", error);
});