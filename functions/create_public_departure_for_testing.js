const axios = require('axios');

// Configuration
const BASE_URL = 'https://api-6ups4cehla-uc.a.run.app';
const ADMIN_KEY = 'ntk_admin_staging_key_2026_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';
const TOUR_ID = 'test-tour-001';

// Future date for the test departure (e.g., March 15, 2026)
const DEPARTURE_DATE = '2026-03-15T12:00:00.000Z'; 

async function createPublicDeparture() {
  console.log('🚀 Creating Public Departure for Testing...');
  console.log(`Target Tour: ${TOUR_ID}`);
  console.log(`Target Date: ${DEPARTURE_DATE}`);

  try {
    const payload = {
      tourId: TOUR_ID,
      date: DEPARTURE_DATE,
      type: 'public',
      maxPax: 8,
      status: 'open'
    };

    const response = await axios.post(`${BASE_URL}/admin/departures`, payload, {
      headers: { 
        'X-Admin-Secret-Key': ADMIN_KEY,
        'Content-Type': 'application/json'
      }
    });

    const newDeparture = response.data;
    console.log('\n✅ Departure Created Successfully!');
    console.log('-----------------------------------');
    console.log(`🆔 ID: ${newDeparture.departureId}`);
    console.log(`📅 Date: ${newDeparture.date}`);
    console.log(`Type: ${newDeparture.type}`);
    console.log(`Pax: ${newDeparture.currentPax} / ${newDeparture.maxPax}`);
    console.log('-----------------------------------');
    console.log('Use this ID for your "Join Booking" tests.');

  } catch (error) {
    console.error('\n❌ Error creating departure:', error.response ? error.response.data : error.message);
  }
}

createPublicDeparture();
