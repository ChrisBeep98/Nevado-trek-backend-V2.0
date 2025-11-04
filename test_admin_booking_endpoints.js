const axios = require('axios');

// Configuration
const BASE_URL = 'https://us-central1-nevadotrektest01.cloudfunctions.net';
const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

async function testAdminBookingEndpoints() {
  console.log("🚀 Testing Admin Booking Endpoints...\n");

  try {
    // Use a confirmed booking ID from the booking_info output
    const bookingId = '1U2Daf4vDTMziR2dEL9N'; // This is a confirmed booking
    
    // Test 1: GET /adminGetBookings with filters
    console.log("1. Testing GET /adminGetBookings with filters");
    const bookingsResponse = await axios.get(`${BASE_URL}/adminGetBookings`, {
      headers: {
        'X-Admin-Secret-Key': ADMIN_KEY
      },
      params: {
        status: 'confirmed',
        limit: 5
      }
    });
    console.log(`   ✅ Get Bookings Response: ${bookingsResponse.status}`);
    console.log(`   📝 Found ${bookingsResponse.data.bookings.length} confirmed bookings`);
    
    // Test 2: PUT /adminUpdateBookingStatus
    console.log("\n2. Testing PUT /adminUpdateBookingStatus");
    const statusUpdateResponse = await axios.put(
      `${BASE_URL}/adminUpdateBookingStatus/${bookingId}`,
      { 
        status: "confirmed",
        reason: "Status confirmed via API test"
      },
      {
        headers: {
          'X-Admin-Secret-Key': ADMIN_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log(`   ✅ Update Status Response: ${statusUpdateResponse.status}`);
    console.log(`   📝 Update Result: ${statusUpdateResponse.data.message}`);
    console.log(`   📝 Previous Status: ${statusUpdateResponse.data.previousStatus}`);
    console.log(`   📝 New Status: ${statusUpdateResponse.data.newStatus}`);
    
    // Test 3: PUT /adminUpdateBookingDetails
    console.log("\n3. Testing PUT /adminUpdateBookingDetails");
    const detailsUpdateResponse = await axios.put(
      `${BASE_URL}/adminUpdateBookingDetails/${bookingId}`,
      { 
        customer: {
          fullName: "Updated Test Customer via API",
          email: "updated-via-api@example.com"
        },
        pax: 5,  // Increase pax from 4 to 5
        reason: "Details updated via API test"
      },
      {
        headers: {
          'X-Admin-Secret-Key': ADMIN_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log(`   ✅ Update Details Response: ${detailsUpdateResponse.status}`);
    console.log(`   📝 Update Result: ${detailsUpdateResponse.data.message}`);
    console.log(`   📝 Updated Pax: ${detailsUpdateResponse.data.booking.pax}`);
    console.log(`   📝 Updated Customer: ${detailsUpdateResponse.data.booking.customer.fullName}`);
    
    console.log("\n🏁 Admin Booking Endpoints Testing Complete!");
  } catch (error) {
    console.error("💥 Error in admin booking tests:", error.message);
    if (error.response) {
      console.error("   📡 Response:", error.response.data);
    }
  }
}

// Run the tests
testAdminBookingEndpoints();