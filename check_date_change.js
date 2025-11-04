const axios = require('axios');

// Admin key - ultra secret
const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

// Base URL for the functions
const BASE_URL = 'https://us-central1-nevadotrektest01.cloudfunctions.net';

// Function to specifically check what happened after the date change
async function checkDateChangeResults() {
  console.log("🔍 Checking Results After Date Change Operation 🔍");
  console.log("=================================================");

  // Check the original booking that was modified
  console.log("\n📋 1. Checking the booking that had its date changed...");
  try {
    const bookingId = "1U2Daf4vDTMziR2dEL9N";
    const checkBookingResponse = await axios.get(`${BASE_URL}/checkBooking?reference=BK-20251029-442`);
    
    console.log(`   ✅ Booking details retrieved: ${checkBookingResponse.status}`);
    console.log(`   🆔 Booking ID: ${checkBookingResponse.data.bookingId}`);
    console.log(`   🏔️  Tour: ${checkBookingResponse.data.tourName?.es || checkBookingResponse.data.tourName}`);
    console.log(`   📅 New Date: ${checkBookingResponse.data.startDate}`);
    console.log(`   📅 New Event ID: ${checkBookingResponse.data.eventId}`);
    
    // Check the original and new events specifically
    console.log("\n📅 2. Checking original event (5w3MUL3HYi4CDvp5wXV6) details...");
    const eventsResponse = await axios.get(`${BASE_URL}/adminGetEventsCalendar`, {
      headers: { 'X-Admin-Secret-Key': ADMIN_KEY },
      params: { limit: 100 }
    });
    
    // Find the specific events
    const originalEvent = eventsResponse.data.events.find(event => event.eventId === "5w3MUL3HYi4CDvp5wXV6");
    const newEvent = eventsResponse.data.events.find(event => event.eventId === "MMoXe91ZNHYBMm4ZpxAg");
    
    if (originalEvent) {
      console.log(`   ✅ Original event found:`);
      console.log(`      - Event ID: ${originalEvent.eventId}`);
      console.log(`      - Tour: ${originalEvent.tourName}`);
      console.log(`      - Date: ${originalEvent.startDate}`);
      console.log(`      - Capacity: ${originalEvent.bookedSlots}/${originalEvent.maxCapacity}`);
      console.log(`      - Status: ${originalEvent.status}`);
      console.log(`      - Type: ${originalEvent.type || 'N/A'}`);
    } else {
      console.log("   ❌ Original event not found in calendar");
    }
    
    if (newEvent) {
      console.log(`\n   ✅ New event (after date change) found:`);
      console.log(`      - Event ID: ${newEvent.eventId}`);
      console.log(`      - Tour: ${newEvent.tourName}`);
      console.log(`      - Date: ${newEvent.startDate}`);
      console.log(`      - Capacity: ${newEvent.bookedSlots}/${newEvent.maxCapacity}`);
      console.log(`      - Status: ${newEvent.status}`);
      console.log(`      - Type: ${newEvent.type || 'N/A'}`);
    } else {
      console.log("\n   ❌ New event not found in calendar");
    }
    
  } catch (error) {
    console.log(`   ❌ Error checking results: ${error.message}`);
    if (error.response) {
      console.log(`   📡 Error response:`, error.response.data);
    }
  }

  console.log("\n=================================================");
  console.log("🏁 Date Change Results Check Complete!");
}

checkDateChangeResults().catch(error => {
  console.error("🚨 Error checking results:", error);
});