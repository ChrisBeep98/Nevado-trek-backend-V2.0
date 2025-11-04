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

// Test the new adminCreateBooking endpoint
async function testAdminCreateBooking() {
  console.log('Testing adminCreateBooking endpoint...\n');

  try {
    // First, get available tours to use for the booking
    console.log('1. Fetching available tours...');
    const toursResponse = await api.get('/getToursV2');
    console.log('   ✓ Retrieved', toursResponse.data.length, 'tours');
    
    if (toursResponse.data.length === 0) {
      console.log('   ! No tours available for testing');
      return;
    }
    
    const tourToUse = toursResponse.data[0]; // Use the first available tour
    console.log('   ✓ Using tour:', tourToUse.name.es, '(ID:', tourToUse.tourId + ')');

    // Prepare booking data
    const bookingData = {
      tourId: tourToUse.tourId,
      startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      customer: {
        fullName: 'Admin Test Customer',
        documentId: 'ATC123456',
        phone: '+573123456789',
        email: 'admintest@example.com'
      },
      pax: 2,
      status: 'confirmed' // Start as confirmed since admin created it
    };

    console.log('\n2. Creating booking via adminCreateBooking endpoint...');
    try {
      const response = await api.post('/adminCreateBooking', bookingData);
      console.log('   ✓ Status:', response.status);
      console.log('   ✓ Response data:', response.data);
      
      const newBookingId = response.data.bookingId;
      console.log('   ✓ New booking ID:', newBookingId);
      
      // Wait for database sync
      await sleep(2000);
      
      // Verify the booking was created by fetching it
      console.log('\n3. Verifying booking was created...');
      const bookingsResponse = await api.get('/adminGetBookings');
      const createdBooking = bookingsResponse.data.bookings.find(b => b.bookingId === newBookingId);
      
      if (createdBooking) {
        console.log('   ✓ Booking found in database');
        console.log('   ✓ Tour:', createdBooking.tourName);
        console.log('   ✓ Customer:', createdBooking.customer.fullName);
        console.log('   ✓ Pax:', createdBooking.pax);
        console.log('   ✓ Status:', createdBooking.status);
        console.log('   ✓ Reference:', createdBooking.bookingReference);
        console.log('   ✓ Event ID:', createdBooking.eventId);
        console.log('   ✓ Created at:', new Date(createdBooking.createdAt._seconds * 1000).toISOString());
      } else {
        console.log('   ! Booking was not found in the database');
      }
      
    } catch (err) {
      console.log('   ✗ Error creating booking:', err.response ? err.response.data : err.message);
      console.log('   ✗ Error status:', err.response ? err.response.status : 'No response');
    }

    console.log('\nadminCreateBooking test completed!');
    
  } catch (error) {
    console.error('Critical error in adminCreateBooking test:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

// Run the test function
testAdminCreateBooking().catch(console.error);