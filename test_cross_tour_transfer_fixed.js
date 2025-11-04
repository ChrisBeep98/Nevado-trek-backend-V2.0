const axios = require('axios');

// Configuration
const BASE_URL = 'https://us-central1-nevadotrektest01.cloudfunctions.net';
const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

async function testCrossTourTransferEndpoint() {
  console.log("🚀 Testing Cross-Tour Transfer Endpoint: POST /adminTransferToNewTour...\n");

  try {
    // Get a list of bookings to find a suitable one for cross-tour transfer
    console.log("1. Finding a suitable booking for cross-tour transfer...");
    const bookingsResponse = await axios.get(`${BASE_URL}/adminGetBookings`, {
      headers: {
        'X-Admin-Secret-Key': ADMIN_KEY
      },
      params: {
        status: 'confirmed', // Look for confirmed bookings
        limit: 10
      }
    });
    
    if (bookingsResponse.data.bookings.length > 0) {
      // Find a confirmed booking that's not already cancelled
      const confirmedBooking = bookingsResponse.data.bookings.find(b => 
        b.status === 'confirmed' && b.tourId !== 'WRTfMlLLkhEDJpFvoXK3' // Avoid the paramo tour for this test if we want to transfer to it
      );
      
      if (confirmedBooking) {
        console.log(`   ✅ Found confirmed booking: ${confirmedBooking.bookingId}`);
        console.log(`   📝 Booking Tour: ${confirmedBooking.tourName} (${confirmedBooking.tourId})`);
        console.log(`   📝 Booking Status: ${confirmedBooking.status}`);
        console.log(`   📝 Booking Date: ${confirmedBooking.startDate}`);
        
        // Find a different tour to transfer to
        console.log("\n2. Finding a different tour to transfer to...");
        const toursResponse = await axios.get(`${BASE_URL}/getToursV2`);
        const otherTour = toursResponse.data.find(t => 
          t.tourId !== confirmedBooking.tourId && t.isActive
        );
        
        if (otherTour) {
          console.log(`   ✅ Found other tour: ${otherTour.name.es} (${otherTour.tourId})`);
          
          // Use the original date in ISO string format directly from the booking
          const originalDate = new Date(confirmedBooking.startDate);
          const formattedDate = originalDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
          
          console.log("\n3. Testing POST /adminTransferToNewTour");
          console.log(`   🔄 Transferring booking ${confirmedBooking.bookingId} from ${confirmedBooking.tourName} to ${otherTour.name.es}`);
          console.log(`   📅 Using date: ${formattedDate}`);
          
          const transferResponse = await axios.post(
            `${BASE_URL}/adminTransferToNewTour/${confirmedBooking.bookingId}`,
            { 
              newTourId: otherTour.tourId,
              newStartDate: formattedDate, // Use date-only format
              reason: "Test cross-tour transfer via API test"
            },
            {
              headers: {
                'X-Admin-Secret-Key': ADMIN_KEY,
                'Content-Type': 'application/json'
              }
            }
          );
          
          console.log(`   ✅ Cross-tour Transfer Response: ${transferResponse.status}`);
          console.log(`   📝 Transfer Result: ${transferResponse.data.message}`);
          console.log(`   📝 Original Booking ID: ${transferResponse.data.originalBookingId}`);
          console.log(`   📝 New Booking ID: ${transferResponse.data.newBookingId}`);
          console.log(`   📝 New Booking Reference: ${transferResponse.data.newBookingReference}`);
          console.log(`   📝 New Booking Status: ${transferResponse.data.cancelledBookingStatus}`);
          console.log(`   📝 Pax Count: ${transferResponse.data.pax}`);
          
          console.log("\n   Note: This creates a new booking on the destination tour and cancels the original booking");
        } else {
          console.log("   ⚠️ Could not find a different tour for transfer test");
        }
      } else {
        console.log("   ⚠️ Could not find a confirmed booking for transfer test");
      }
    } else {
      console.log("   ⚠️ No bookings found for transfer test");
    }
    
    console.log("\n🏁 Cross-Tour Transfer Endpoint Testing Complete!");
  } catch (error) {
    console.error("💥 Error in cross-tour transfer test:", error.message);
    if (error.response) {
      console.error("   📡 Response:", error.response.data);
      
      // If it's a logical error (like trying to transfer a booking to the same tour), that's OK
      if (error.response.data.error && 
          (error.response.data.error.code === 'SAME_TOUR_TRANSFER' || 
           error.response.data.error.message.includes('mismo tour'))) {
        console.log("   📝 This error is expected in some cases when trying to transfer to same tour or other business logic constraints.");
      }
    }
  }
}

// Run the test
testCrossTourTransferEndpoint();