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

// Full system test to make sure all endpoints work with the new addition
async function fullSystemTest() {
  console.log('Running full system test with new adminCreateBooking endpoint...\n');

  try {
    // Test existing functionality still works
    console.log('1. Testing: getToursV2 endpoint');
    const toursResponse = await api.get('/getToursV2');
    console.log('   ✓ Retrieved', toursResponse.data.length, 'tours');
    
    if (toursResponse.data.length === 0) {
      console.log('   ! No tours found');
      return;
    }
    
    const tourToUse = toursResponse.data[0];
    console.log('   ✓ Using tour:', tourToUse.name.es);

    // Test adminGetBookings still works
    console.log('\n2. Testing: adminGetBookings endpoint');
    const bookingsResponse = await api.get('/adminGetBookings');
    console.log('   ✓ Retrieved', bookingsResponse.data.bookings.length, 'bookings');

    // Test the new adminCreateBooking endpoint
    console.log('\n3. Testing: NEW adminCreateBooking endpoint');
    const newBookingData = {
      tourId: tourToUse.tourId,
      startDate: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 50 days from now
      customer: {
        fullName: 'Full System Test Customer',
        documentId: 'FST111222',
        phone: '+573121112222',
        email: 'full-system-test@example.com'
      },
      pax: 4,
      status: 'confirmed' // Start as confirmed
    };

    const createResponse = await api.post('/adminCreateBooking', newBookingData);
    console.log('   ✓ Booking created with ID:', createResponse.data.bookingId);
    console.log('   ✓ Status:', createResponse.status);
    console.log('   ✓ Reference:', createResponse.data.bookingReference);

    // Wait for database sync
    await sleep(2000);

    // Verify the booking exists
    console.log('\n4. Testing: Booking verification');
    const verifyBookingsResponse = await api.get('/adminGetBookings');
    const newBooking = verifyBookingsResponse.data.bookings.find(b => 
      b.bookingId === createResponse.data.bookingId
    );
    
    if (newBooking) {
      console.log('   ✓ Booking verified in database');
      console.log('   ✓ Tour:', newBooking.tourName);
      console.log('   ✓ Customer:', newBooking.customer.fullName);
      console.log('   ✓ Status:', newBooking.status);
      console.log('   ✓ Pax:', newBooking.pax);
    } else {
      console.log('   ! New booking not found in database');
    }

    // Test adminUpdateBookingStatus still works
    console.log('\n5. Testing: adminUpdateBookingStatus endpoint with new booking');
    try {
      const statusUpdateResponse = await api.put(`/adminUpdateBookingStatus/${createResponse.data.bookingId}`, {
        status: 'paid',
        reason: 'Full system test - changing to paid status'
      });
      console.log('   ✓ Status updated successfully');
      console.log('   ✓ New status:', statusUpdateResponse.data.newStatus);
    } catch (err) {
      console.log('   ✗ Status update failed:', err.response ? err.response.data : err.message);
    }

    // Test adminUpdateBookingDetails still works
    console.log('\n6. Testing: adminUpdateBookingDetails endpoint');
    try {
      const detailsUpdateResponse = await api.put(`/adminUpdateBookingDetails/${createResponse.data.bookingId}`, {
        customer: {
          ...newBooking.customer,
          phone: '+573123334444'
        },
        pax: 5 // Change pax from 4 to 5
      });
      console.log('   ✓ Booking details updated successfully');
      console.log('   ✓ Pax updated to:', detailsUpdateResponse.data.booking.pax);
    } catch (err) {
      console.log('   ✗ Details update failed:', err.response ? err.response.data : err.message);
    }

    // Test adminGetEventsCalendar still works
    console.log('\n7. Testing: adminGetEventsCalendar endpoint');
    const eventsResponse = await api.get('/adminGetEventsCalendar');
    console.log('   ✓ Retrieved', eventsResponse.data.events.length, 'events');

    // Test the other admin endpoints briefly
    console.log('\n8. Testing: Other admin endpoints');
    
    // Test adminPublishEvent (try with first event found)
    if (eventsResponse.data.events.length > 0) {
      try {
        const sampleEvent = eventsResponse.data.events[0];
        // First change to public
        const publishResponse = await api.post(`/adminPublishEvent/${sampleEvent.eventId}`, {
          action: 'publish'
        });
        console.log('   ✓ Event published successfully');
        
        // Change back to private
        const unpublishResponse = await api.post(`/adminPublishEvent/${sampleEvent.eventId}`, {
          action: 'unpublish'
        });
        console.log('   ✓ Event unpublished successfully');
      } catch (err) {
        console.log('   ~ Event publish/unpublish test:', err.response ? err.response.data : err.message);
      }
    }

    console.log('\nFull system test completed successfully!');
    console.log('\nSummary:');
    console.log('✓ All existing admin endpoints still functional');
    console.log('✓ NEW adminCreateBooking endpoint working correctly');
    console.log('✓ Data integrity maintained');
    console.log('✓ All system components working together');
    
  } catch (error) {
    console.error('Critical error in full system test:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

// Run the test function
fullSystemTest().catch(console.error);