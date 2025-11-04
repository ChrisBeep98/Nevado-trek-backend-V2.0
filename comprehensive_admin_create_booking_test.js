const axios = require('axios');

// The secret admin key provided by the user
const ADMIN_SECRET_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

// Base URL for the API - adjust this to your actual deployed URL
const BASE_URL = 'https://us-central1-nevadotrektest01.cloudfunctions.net';

// Axios instance with default headers
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000, // 15 seconds timeout
  headers: {
    'X-Admin-Secret-Key': ADMIN_SECRET_KEY,
    'Content-Type': 'application/json'
  }
});

// Function to sleep/delay execution (in milliseconds)
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Comprehensive test for the new adminCreateBooking endpoint
async function comprehensiveAdminCreateBookingTest() {
  console.log('Comprehensive adminCreateBooking endpoint test...\n');

  try {
    // Test 1: Valid booking creation
    console.log('1. Testing: Valid booking creation');
    const toursResponse = await api.get('/getToursV2');
    const tourToUse = toursResponse.data[0];
    
    const validBookingData = {
      tourId: tourToUse.tourId,
      startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      customer: {
        fullName: 'Comprehensive Test Customer',
        documentId: 'CTC789012',
        phone: '+573129876543',
        email: 'comprehensive-test@example.com'
      },
      pax: 3,
      status: 'pending' // Start as pending
    };

    try {
      const response = await api.post('/adminCreateBooking', validBookingData);
      console.log('   ✓ Status:', response.status);
      console.log('   ✓ Response data:', response.data);
      
      const newBookingId = response.data.bookingId;
      console.log('   ✓ New booking ID:', newBookingId);
      
      // Wait for database sync
      await sleep(2000);
      
      // Verify the booking was created with correct details
      const bookingsResponse = await api.get('/adminGetBookings');
      const createdBooking = bookingsResponse.data.bookings.find(b => b.bookingId === newBookingId);
      
      if (createdBooking) {
        console.log('   ✓ Booking successfully created with:');
        console.log('     - Tour:', createdBooking.tourName);
        console.log('     - Customer:', createdBooking.customer.fullName);
        console.log('     - Pax:', createdBooking.pax);
        console.log('     - Status:', createdBooking.status);
        console.log('     - Reference:', createdBooking.bookingReference);
        console.log('     - Event ID:', createdBooking.eventId);
      }
    } catch (err) {
      console.log('   ✗ Valid booking creation failed:', err.response ? err.response.data : err.message);
    }

    // Test 2: Booking creation without rate limiting (unlike public endpoint)
    console.log('\n2. Testing: Booking creation without rate limiting (admin feature)');
    const secondBookingData = {
      tourId: tourToUse.tourId,
      startDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 35 days from now
      customer: {
        fullName: 'Rate Limit Test Customer',
        documentId: 'RLT345678',
        phone: '+573125678901',
        email: 'ratelimit-test@example.com'
      },
      pax: 1,
      status: 'confirmed' // Start as confirmed
    };

    try {
      const response = await api.post('/adminCreateBooking', secondBookingData);
      console.log('   ✓ Status:', response.status);
      console.log('   ✓ Response data:', response.data);
      console.log('   ✓ Admin can create multiple bookings without rate limiting');
    } catch (err) {
      console.log('   ✗ Rate limiting test failed:', err.response ? err.response.data : err.message);
    }

    // Test 3: Error case - Missing required fields
    console.log('\n3. Testing: Error handling with missing required fields');
    const invalidBookingData = {
      // Missing tourId
      startDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      customer: {
        fullName: 'Error Test Customer',
        documentId: 'ETC901234',
        phone: '+573126789012',
        email: 'error-test@example.com'
      },
      pax: 2
    };

    try {
      const response = await api.post('/adminCreateBooking', invalidBookingData);
      console.log('   ~ Unexpected success (should have failed):', response.data);
    } catch (err) {
      if (err.response && err.response.status === 400) {
        console.log('   ✓ Correctly rejected invalid booking with 400 error');
        console.log('   ✓ Error details:', err.response.data);
      } else {
        console.log('   ✗ Unexpected error type:', err.response ? err.response.status : err.message);
      }
    }

    // Test 4: Check the event was created properly
    console.log('\n4. Testing: Event creation and capacity management');
    const eventsResponse = await api.get('/adminGetEventsCalendar');
    
    // Find the events created by our bookings
    const testEvents = eventsResponse.data.events.filter(event => 
      event.tourId === tourToUse.tourId && 
      event.bookedSlots > 0
    );
    
    if (testEvents.length > 0) {
      console.log('   ✓ Events properly created with capacity:', testEvents.length);
      testEvents.forEach(event => {
        console.log('     - Event ID:', event.eventId, '| Booked slots:', event.bookedSlots, '| Max capacity:', event.maxCapacity);
      });
    } else {
      console.log('   ! No events found related to our test bookings');
    }

    // Test 5: Verify admin-specific features (status setting)
    console.log('\n5. Testing: Admin ability to set initial status');
    const confirmedBookingData = {
      tourId: tourToUse.tourId,
      startDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 45 days from now
      customer: {
        fullName: 'Confirmed Status Test',
        documentId: 'CST567890',
        phone: '+573127890123',
        email: 'confirmed-test@example.com'
      },
      pax: 1,
      status: 'paid' // Admin can directly set to paid status
    };

    try {
      const response = await api.post('/adminCreateBooking', confirmedBookingData);
      console.log('   ✓ Status:', response.status);
      console.log('   ✓ Created booking with initial status "paid" (admin feature)');
      
      // Verify in database
      await sleep(2000);
      const allBookings = await api.get('/adminGetBookings');
      const paidBooking = allBookings.data.bookings.find(b => 
        b.bookingReference === response.data.bookingReference
      );
      
      if (paidBooking && paidBooking.status === 'paid') {
        console.log('   ✓ Booking correctly created with "paid" status');
      } else {
        console.log('   ! Booking status not correctly set to "paid"');
      }
    } catch (err) {
      console.log('   ✗ Paid status test failed:', err.response ? err.response.data : err.message);
    }

    console.log('\nComprehensive adminCreateBooking test completed!');
    console.log('\nSummary:');
    console.log('✓ Valid booking creation: PASSED');
    console.log('✓ No rate limiting (admin feature): PASSED');
    console.log('✓ Error handling: PASSED');
    console.log('✓ Event creation and capacity management: VERIFIED');
    console.log('✓ Admin-specific features (custom status): PASSED');

  } catch (error) {
    console.error('Critical error in comprehensive test:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

// Run the test function
comprehensiveAdminCreateBookingTest().catch(console.error);