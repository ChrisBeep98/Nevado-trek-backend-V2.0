const axios = require('axios');

// Configuration
const BASE_URL = 'https://us-central1-nevadotrektest01.cloudfunctions.net';
const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

async function testCrossTourTransferEndpoint() {
  console.log("🚀 Testing Cross-Tour Transfer Endpoint: POST /adminTransferToNewTour...\n");

  try {
    // Get a specific booking to test with
    const bookingReference = 'BK-20251029-576';
    console.log(`1. Getting booking details for reference: ${bookingReference}`);
    
    const bookingDetails = await axios.get(`${BASE_URL}/checkBooking?reference=${bookingReference}`);
    console.log(`   ✅ Retrieved booking: ${bookingDetails.data.bookingId}`);
    console.log(`   📝 Tour: ${bookingDetails.data.tourName.en}`);
    
    // Convert timestamp to date
    const startDateTimestamp = bookingDetails.data.startDate._seconds;
    const startDate = new Date(startDateTimestamp * 1000); // Convert seconds to milliseconds
    const formattedDate = startDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    
    console.log(`   📅 Original Date: ${startDate.toISOString()} (${formattedDate})`);
    
    // Find a different tour to transfer to
    console.log("\n2. Finding a different tour to transfer to...");
    const toursResponse = await axios.get(`${BASE_URL}/getToursV2`);
    const originalTourId = bookingDetails.data.tourId;
    const otherTour = toursResponse.data.find(t => 
      t.tourId !== originalTourId && t.isActive
    );
    
    if (otherTour) {
      console.log(`   ✅ Found other tour: ${otherTour.name.es} (${otherTour.tourId})`);
      
      // Test the cross-tour transfer
      console.log("\n3. Testing POST /adminTransferToNewTour");
      console.log(`   🔄 Transferring booking ${bookingDetails.data.bookingId} from ${bookingDetails.data.tourName.es} to ${otherTour.name.es}`);
      console.log(`   📅 Using date: ${formattedDate}`);
      
      const transferResponse = await axios.post(
        `${BASE_URL}/adminTransferToNewTour/${bookingDetails.data.bookingId}`,
        { 
          newTourId: otherTour.tourId,
          newStartDate: formattedDate, // Use the same date in YYYY-MM-DD format
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