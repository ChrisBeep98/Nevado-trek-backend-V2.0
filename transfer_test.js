/**
 * Test booking transfer with correct URL format
 */

const axios = require('axios');

const adminSecret = 'miClaveSecreta123';

async function testBookingTransferCorrect() {
  console.log("🔧 Testing booking transfer with correct URL format\n");

  try {
    // Get bookings and events
    const [bookingsResponse, eventsResponse] = await Promise.all([
      axios.get('https://admingetbookings-wgfhwjbpva-uc.a.run.app', {
        headers: { 'x-admin-secret-key': adminSecret }
      }),
      axios.get('https://admingeteventscalendar-wgfhwjbpva-uc.a.run.app', {
        headers: { 'x-admin-secret-key': adminSecret }
      })
    ]);

    if (bookingsResponse.data.bookings.length === 0 || eventsResponse.data.events.length < 2) {
      console.log("❌ Not enough data for transfer test");
      return;
    }

    const booking = bookingsResponse.data.bookings[0];
    // Find a different event for the same tour
    const otherEvent = eventsResponse.data.events.find(e => 
      e.tourId === booking.tourId && e.eventId !== booking.eventId
    );
    
    if (!otherEvent) {
      console.log("❌ No suitable event found for transfer test");
      return;
    }

    console.log(`📝 Booking: ${booking.bookingId} (Event: ${booking.eventId})`);
    console.log(`📝 Destination Event: ${otherEvent.eventId}`);
    
    // Test the transfer with correct URL format (bookingId in URL path)
    const response = await axios.post(
      `https://us-central1-nevadotrektest01.cloudfunctions.net/adminTransferBooking/${booking.bookingId}`,
      { destinationEventId: otherEvent.eventId, reason: 'Correct URL format test' },
      { headers: { 'x-admin-secret-key': adminSecret } }
    );

    console.log(`✅ Transfer successful!`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Message: ${response.data.message}`);
    console.log(`   Previous event: ${response.data.previousEventId}`);
    console.log(`   New event: ${response.data.newEventId}`);
    
  } catch (error) {
    console.log(`❌ Transfer failed: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data:`, error.response.data);
    }
  }
}

testBookingTransferCorrect().catch(console.error);