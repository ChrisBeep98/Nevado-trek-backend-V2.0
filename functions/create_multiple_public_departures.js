const axios = require('axios');

// Configuration
const BASE_URL = 'https://api-6ups4cehla-uc.a.run.app';
const ADMIN_KEY = 'ntk_admin_staging_key_2026_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';
const TOUR_ID = 'test-tour-001';

// Dates for the 3 new departures
const TARGET_DATES = [
  '2026-04-01T12:00:00.000Z',
  '2026-04-15T12:00:00.000Z',
  '2026-05-01T12:00:00.000Z'
];

async function createMultipleDepartures() {
  console.log('🚀 Creating 3 NEW Public Departures for Testing...');
  console.log(`Target Tour: ${TOUR_ID}\n`);

  for (const date of TARGET_DATES) {
    try {
      const payload = {
        tourId: TOUR_ID,
        date: date,
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

      const resData = response.data;
      // API might return { departureId, departure: {...} } or a flat object
      const dep = resData.departure || resData;
      const depId = resData.departureId || dep.departureId || dep.id;

      console.log(`✅ Created: ${(dep.date || 'No Date').split('T')[0]}`);
      console.log(`   🆔 ID: ${depId}`);
      console.log(`   👥 Pax: ${dep.currentPax || 0} / ${dep.maxPax}`);
      console.log('-----------------------------------');

    } catch (error) {
      console.error(`❌ Error creating for date ${date}:`, error.response ? error.response.data : error.message);
    }
  }
  console.log('\n✨ Batch creation complete.');
}

createMultipleDepartures();
