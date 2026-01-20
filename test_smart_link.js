const axios = require('axios');

const BASE_URL = 'https://us-central1-nevado-trek-backend-03.cloudfunctions.net/api';

async function testSmartLink() {
  console.log('--- TESTING BOLD SMART LINK API ---');
  
  try {
    // 1. Create a private booking
    console.log('\n1. Creating Private Booking...');
    const bookingResponse = await axios.post(`${BASE_URL}/public/bookings/private`, {
      tourId: 'test-tour-001', 
      date: '2026-02-01',
      pax: 1,
      customer: {
        name: 'Smart Link Test',
        email: 'link@test.com',
        phone: '+573005554433',
        document: '555444'
      }
    });

    const { bookingId } = bookingResponse.data;
    console.log(`✅ Booking Created: ${bookingId}`);

    // 2. Initialize Payment (Should return URL)
    console.log('\n2. Initializing Payment (Smart Link)...');
    const paymentResponse = await axios.post(`${BASE_URL}/public/payments/init`, {
      bookingId
    });

    const paymentData = paymentResponse.data;
    console.log('✅ RESPONSE:', JSON.stringify(paymentData, null, 2));

    if (paymentData.paymentUrl && paymentData.paymentUrl.includes('bold.co')) {
      console.log('\n🎉 SUCCESS: Received valid Bold Payment URL!');
      console.log(`👉 GO TO: ${paymentData.paymentUrl}`);
    } else {
      console.error('\n❌ FAIL: Did not receive paymentUrl.');
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.response?.data || error.message);
  }
}

testSmartLink();
