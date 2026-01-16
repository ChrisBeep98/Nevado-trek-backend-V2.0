const axios = require('axios');
require('dotenv').config({ path: '.env.nevado-trek-backend-03' });

const STAGING_API_URL = 'https://api-6ups4cehla-uc.a.run.app';
// Admin Key for Staging (from FIREBASE_PROJECT.md)
const ADMIN_KEY = 'ntk_admin_staging_key_2026_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

async function testBookingStatus() {
  try {
    console.log('🔍 Testing Staging API: ' + STAGING_API_URL);

    // 1. Get a list of bookings to find a valid ID
    console.log('\n1. Fetching recent bookings (Admin)...');
    const bookingsRes = await axios.get(`${STAGING_API_URL}/admin/bookings`, {
      headers: { 'X-Admin-Secret-Key': ADMIN_KEY }
    });
    
    const bookings = bookingsRes.data;
    if (bookings.length === 0) {
      console.log('⚠️ No bookings found in Staging. Creating a test booking...');
      // Code to create booking if needed, but for now let's hope there are some.
      return;
    }

    const testBooking = bookings[0];
    console.log(`✅ Found booking: ${testBooking.bookingId} (Status: ${testBooking.status})`);

    // 2. Test the NEW Public Endpoint
    console.log(`\n2. Testing GET /public/bookings/${testBooking.bookingId}...`);
    const statusRes = await axios.get(`${STAGING_API_URL}/public/bookings/${testBooking.bookingId}`);
    
    console.log('✅ Response:', JSON.stringify(statusRes.data, null, 2));

    // Verify fields
    if (!statusRes.data.bookingId || !statusRes.data.status || !statusRes.data.paymentStatus) {
      console.error('❌ Missing standard fields in response!');
    } else {
      console.log('✅ Standard fields verified.');
    }

    if (statusRes.data.paymentRef === undefined) {
       console.error('❌ Missing paymentRef field!');
    } else {
       console.log(`✅ paymentRef field present: ${statusRes.data.paymentRef}`);
    }

    // 3. Test 404
    console.log('\n3. Testing non-existent booking...');
    try {
      await axios.get(`${STAGING_API_URL}/public/bookings/NON_EXISTENT_123`);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        console.log('✅ Correctly returned 404 for missing booking.');
      } else {
        console.error('❌ Expected 404, got:', err.response ? err.response.status : err.message);
      }
    }

  } catch (error) {
    console.error('❌ Test Failed:', error.message);
    if (error.response) {
      console.error('   Data:', error.response.data);
    }
  }
}

testBookingStatus();
