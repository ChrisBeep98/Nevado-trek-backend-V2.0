const axios = require('axios');

const BASE_URL = 'https://us-central1-nevado-trek-backend-03.cloudfunctions.net/api';

async function testPaymentLogic() {
  console.log('--- TESTING PAYMENT LOGIC (30% + 5% TAX) ---');
  
  try {
    // 1. Create a private booking
    console.log('\n1. Creating Private Booking...');
    const bookingResponse = await axios.post(`${BASE_URL}/public/bookings/private`, {
      tourId: 'IkfInBl74W0cQYsjxJ48', // Staging Test Tour (100k for 1 pax)
      date: '2025-12-25',
      pax: 1,
      customer: {
        name: 'Test Payment',
        email: 'test@payment.com',
        phone: '+573000000000',
        document: '123456'
      }
    });

    const { bookingId } = bookingResponse.data;
    console.log(`✅ Booking Created: ${bookingId}`);

    // 2. Initialize Payment
    console.log('\n2. Initializing Payment (init)...');
    const paymentResponse = await axios.post(`${BASE_URL}/public/payments/init`, {
      bookingId
    });

    const paymentData = paymentResponse.data;
    console.log('✅ Payment Data Received:', JSON.stringify(paymentData, null, 2));

    // 3. Verification
    // Tour Price: 100,000
    // Deposit (30%): 30,000
    // Tax (5% of 30,000): 1,500
    // Expected Total: 31,500
    
    const expectedDeposit = 100000 * 0.30;
    const expectedTax = expectedDeposit * 0.05;
    const expectedTotal = expectedDeposit + expectedTax;

    console.log('\n--- VERIFICATION ---');
    console.log(`Expected Base Price: 100,000`);
    console.log(`Expected Deposit (30%): ${expectedDeposit}`);
    console.log(`Expected Tax (5% on deposit): ${expectedTax}`);
    console.log(`Expected Total (Bold Amount): ${expectedTotal}`);
    console.log(`Actual Amount: ${paymentData.amount}`);
    console.log(`Actual Tax: ${paymentData.tax}`);

    if (paymentData.amount === expectedTotal && paymentData.tax === expectedTax) {
      console.log('\n✨ TEST PASSED: Calculation is correct!');
    } else {
      console.error('\n❌ TEST FAILED: Calculation mismatch');
    }

  } catch (error) {
    console.error('\n❌ ERROR during test:', error.response?.data || error.message);
  }
}

testPaymentLogic();
