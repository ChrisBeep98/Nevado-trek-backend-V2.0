const axios = require('axios');

// Configuration
const BASE_URL = 'https://us-central1-nevadotrektest01.cloudfunctions.net';
const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

async function testAdminEventEndpoints() {
  console.log("🚀 Testing Admin Event Endpoints...\n");

  try {
    // Test 1: GET /adminGetEventsCalendar with filters
    console.log("1. Testing GET /adminGetEventsCalendar with filters");
    const eventsResponse = await axios.get(`${BASE_URL}/adminGetEventsCalendar`, {
      headers: {
        'X-Admin-Secret-Key': ADMIN_KEY
      },
      params: {
        limit: 5
      }
    });
    console.log(`   ✅ Get Events Response: ${eventsResponse.status}`);
    console.log(`   📅 Found ${eventsResponse.data.events.length} events`);
    
    if (eventsResponse.data.events.length > 0) {
      const eventId = eventsResponse.data.events[0].eventId;
      console.log(`   📅 First Event ID: ${eventId}`);
      console.log(`   🏔️  First Event Tour: ${eventsResponse.data.events[0].tourName}`);
      console.log(`   📅 First Event Date: ${eventsResponse.data.events[0].startDate}`);
      console.log(`   👥 First Event Capacity: ${eventsResponse.data.events[0].bookedSlots}/${eventsResponse.data.events[0].maxCapacity}`);
      console.log(`   🔖 First Event Type: ${eventsResponse.data.events[0].type}`);
      
      // Test 2: POST /adminPublishEvent (toggle event visibility)
      console.log("\n2. Testing POST /adminPublishEvent to toggle event visibility");
      
      // First, check the current type
      console.log(`   📝 Current event type: ${eventsResponse.data.events[0].type}`);
      
      // Toggle the event type (publish/unpublish)
      const toggleAction = eventsResponse.data.events[0].type === 'public' ? 'unpublish' : 'publish';
      
      const publishResponse = await axios.post(
        `${BASE_URL}/adminPublishEvent/${eventId}`,
        { action: toggleAction },
        {
          headers: {
            'X-Admin-Secret-Key': ADMIN_KEY,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log(`   ✅ Publish Event Response: ${publishResponse.status}`);
      console.log(`   📝 Result: ${publishResponse.data.message}`);
      console.log(`   📝 Previous Type: ${publishResponse.data.previousType}`);
      console.log(`   📝 New Type: ${publishResponse.data.newType}`);
      
      // Toggle back to original type to maintain state
      const revertAction = toggleAction === 'publish' ? 'unpublish' : 'publish';
      await axios.post(
        `${BASE_URL}/adminPublishEvent/${eventId}`,
        { action: revertAction },
        {
          headers: {
            'X-Admin-Secret-Key': ADMIN_KEY,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log(`   🔄 Reverted event type back to original`);
      
      // Test 3: POST /adminTransferBooking (this requires 2 bookings and an event)
      console.log("\n3. Testing POST /adminTransferBooking");
      
      // For this test, we need to find another booking from the same tour as our event
      // and transfer it to the event we're working with
      
      // Let's get bookings for the same tour as our event
      const tourId = eventsResponse.data.events[0].tourId;
      const bookingsResponse = await axios.get(`${BASE_URL}/adminGetBookings`, {
        headers: {
          'X-Admin-Secret-Key': ADMIN_KEY
        },
        params: {
          tourId: tourId,
          limit: 2  // Get at least 2 bookings to perform a transfer
        }
      });
      
      if (bookingsResponse.data.bookings.length >= 2) {
        const sourceBookingId = bookingsResponse.data.bookings[0].bookingId;
        const targetBookingId = bookingsResponse.data.bookings[1].bookingId;
        
        console.log(`   📝 Found ${bookingsResponse.data.bookings.length} bookings for tour ${tourId}`);
        console.log(`   📝 Source Booking: ${sourceBookingId} (Event: ${bookingsResponse.data.bookings[0].eventId})`);
        console.log(`   📝 Target Booking: ${targetBookingId} (Event: ${bookingsResponse.data.bookings[1].eventId})`);
        
        // We'll try to transfer one booking to the same event as the other booking
        // First, get another event ID from the same tour to transfer to
        const otherEventsResponse = await axios.get(`${BASE_URL}/adminGetEventsCalendar`, {
          headers: {
            'X-Admin-Secret-Key': ADMIN_KEY
          },
          params: {
            tourId: tourId,
            limit: 5
          }
        });
        
        if (otherEventsResponse.data.events.length > 1) {
          const differentEventId = otherEventsResponse.data.events.find(e => e.eventId !== eventId)?.eventId;
          
          if (differentEventId) {
            console.log(`   🔄 Attempting to transfer booking ${sourceBookingId} to event ${differentEventId}`);
            
            try {
              const transferResponse = await axios.post(
                `${BASE_URL}/adminTransferBooking/${sourceBookingId}`,
                { 
                  destinationEventId: differentEventId,
                  reason: "Test transfer via API test"
                },
                {
                  headers: {
                    'X-Admin-Secret-Key': ADMIN_KEY,
                    'Content-Type': 'application/json'
                  }
                }
              );
              console.log(`   ✅ Transfer Response: ${transferResponse.status}`);
              console.log(`   📝 Transfer Result: ${transferResponse.data.message}`);
              console.log(`   📝 Previous Event: ${transferResponse.data.previousEventId}`);
              console.log(`   📝 New Event: ${transferResponse.data.newEventId}`);
            } catch (transferError) {
              console.log(`   ⚠️ Transfer failed (this is normal in some cases): ${transferError.message}`);
              if (transferError.response) {
                console.log(`   📡 Error Response:`, transferError.response.data);
              }
            }
          } else {
            console.log("   ⚠️ Could not find a different event on the same tour for transfer test");
          }
        } else {
          console.log("   ⚠️ Only one event found for this tour, cannot test transfer between events");
        }
      } else {
        console.log("   ⚠️ Not enough bookings on this tour to test transfer functionality");
      }
    } else {
      console.log("   ⚠️ No events found to test with");
    }
    
    console.log("\n🏁 Admin Event Endpoints Testing Complete!");
  } catch (error) {
    console.error("💥 Error in admin event tests:", error.message);
    if (error.response) {
      console.error("   📡 Response:", error.response.data);
    }
  }
}

// Run the tests
testAdminEventEndpoints();