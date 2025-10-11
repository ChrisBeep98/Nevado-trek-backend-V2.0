const axios = require('axios');

// Configuration
const BASE_URL = 'https://us-central1-nevadotrektest01.cloudfunctions.net';
const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7'; // Your API key
const HEADERS = { 'x-admin-secret-key': ADMIN_KEY };

// Note: Based on your API documentation, you only have:
// - DELETE /adminDeleteTourV2/:tourId (logical delete - sets isActive to false)
// - No direct endpoints to delete events or bookings
// So we'll update bookings to cancelled status and events to cancelled

async function cancelAllBookings() {
  console.log('Fetching all bookings...');
  
  try {
    const response = await axios.get(`${BASE_URL}/adminGetBookings`, {
      headers: HEADERS,
      params: { limit: 200 } // Get as many as possible
    });
    
    const bookings = response.data.bookings;
    console.log(`Found ${bookings.length} bookings to cancel...`);
    
    for (const booking of bookings) {
      try {
        // Update booking status to cancelled
        await axios.put(`${BASE_URL}/adminUpdateBookingStatus/${booking.bookingId}`, {
          status: 'cancelled',
          reason: 'Data cleanup - cancelling test booking'
        }, {
          headers: HEADERS
        });
        console.log(`Cancelled booking: ${booking.bookingId} (Reference: ${booking.bookingReference})`);
      } catch (updateError) {
        console.log(`Failed to cancel booking ${booking.bookingId}:`, updateError.response?.data || updateError.message);
      }
    }
    
    console.log('Booking cancellation process completed.');
  } catch (error) {
    console.log('Error fetching bookings:', error.response?.data || error.message);
  }
}

async function cancelAllEvents() {
  console.log('Fetching all events...');
  
  try {
    const response = await axios.get(`${BASE_URL}/adminGetEventsCalendar`, {
      headers: HEADERS,
      params: { limit: 200 } // Get as many as possible
    });
    
    const events = response.data.events;
    console.log(`Found ${events.length} events to cancel...`);
    
    // Note: Your API doesn't have a direct delete event endpoint, 
    // but you have adminPublishEvent which can change event type
    // For cancellation, we'll make them private and update status if possible
    for (const event of events) {
      try {
        // First try to publish/unpublish to trigger any needed updates
        await axios.post(`${BASE_URL}/adminPublishEvent/${event.eventId}`, {
          action: 'unpublish'  // Make it private
        }, {
          headers: HEADERS
        });
        console.log(`Unpublished event: ${event.eventId} (Tour: ${event.tourId})`);
      } catch (updateError) {
        console.log(`Failed to update event ${event.eventId}:`, updateError.response?.data || updateError.message);
      }
    }
    
    console.log('Event update process completed.');
  } catch (error) {
    console.log('Error fetching events:', error.response?.data || error.message);
  }
}

async function deleteAllTours() {
  console.log('Fetching all tours...');
  
  try {
    // First get all tours using the public endpoint
    const toursResponse = await axios.get(`${BASE_URL}/getToursV2`);
    const tours = toursResponse.data;
    console.log(`Found ${tours.length} tours to logically delete...`);
    
    for (const tour of tours) {
      try {
        // Use the logical delete endpoint which sets isActive to false
        await axios.delete(`${BASE_URL}/adminDeleteTourV2/${tour.tourId}`, {
          headers: HEADERS
        });
        console.log(`Logically deleted tour: ${tour.tourId} (${tour.name?.es || tour.name})`);
      } catch (deleteError) {
        console.log(`Failed to delete tour ${tour.tourId}:`, deleteError.response?.data || deleteError.message);
      }
    }
    
    console.log('Tour deletion process completed.');
  } catch (error) {
    console.log('Error fetching tours:', error.response?.data || error.message);
  }
}

async function cleanupAllData() {
  console.log('Starting cleanup of all test data...');
  console.log('This will:');
  console.log('1. Logically delete all tours (set isActive to false)');
  console.log('2. Cancel all bookings (update status to cancelled)');
  console.log('3. Unpublish all events (set type to private)');
  
  // Delete tours first (since events and bookings reference tours)
  await deleteAllTours();
  
  // Cancel events first to avoid issues with active events
  await cancelAllEvents();
  
  // Cancel bookings (this may fail if tours are already deleted, but we'll try)
  await cancelAllBookings();
  
  console.log('\nData cleanup process completed!');
  console.log('All test data has been marked for removal:');
  console.log('- Tours: logically deleted (isActive = false)');
  console.log('- Bookings: cancelled status');
  console.log('- Events: unpublished (private)');
}

// Check if the admin endpoints work with your API key
async function checkAvailableEndpoints() {
  console.log('Checking your API for available endpoints...');

  // Check if admin bookings endpoint works
  try {
    const response = await axios.get(`${BASE_URL}/adminGetBookings`, { headers: HEADERS });
    console.log(`✓ Admin bookings endpoint working - found ${response.data.bookings.length} bookings`);
  } catch (e) {
    console.log(`✗ Admin bookings endpoint error:`, e.response?.data || e.message);
    return false;
  }

  // Check if admin calendar endpoint works
  try {
    const response = await axios.get(`${BASE_URL}/adminGetEventsCalendar`, { headers: HEADERS });
    console.log(`✓ Admin events calendar endpoint working - found ${response.data.events.length} events`);
  } catch (e) {
    console.log(`✗ Admin events calendar endpoint error:`, e.response?.data || e.message);
    return false;
  }

  // Check if tours endpoint works
  try {
    const response = await axios.get(`${BASE_URL}/getToursV2`);
    console.log(`✓ Tours endpoint working - found ${response.data.length} tours`);
  } catch (e) {
    console.log(`✗ Tours endpoint error:`, e.message);
    return false;
  }

  console.log('All endpoints accessible. Proceeding with data cleanup...\n');
  return true;
}

// Run the cleanup
async function main() {
  console.log('Nevado Trek Backend - Data Cleanup Tool');
  console.log('=========================================');
  
  const endpointsAccessible = await checkAvailableEndpoints();
  
  if (!endpointsAccessible) {
    console.log('\n❌ Error: Could not access all required endpoints. Please check your API key.');
    return;
  }
  
  await cleanupAllData();
  
  console.log('\nCleanup completed! Please verify the data has been properly cleaned up by checking your database.');
}

main().catch(console.error);