const axios = require('axios');
const API_URL = 'https://us-central1-nevadotrektest01.cloudfunctions.net/api';

async function test() {
  // 1. Get initial state
  const r1 = await axios.get(`${API_URL}/public/departures?t=${Date.now()}`);
  const dep = r1.data.find(d => d.currentPax < d.maxPax);
  if (!dep) { console.log('No departures available'); return; }
  
  console.log(`BEFORE: ${dep.departureId} has ${dep.currentPax}/${dep.maxPax} pax`);
  
  // 2. Make booking
  await axios.post(`${API_URL}/public/bookings/join`, {
    departureId: dep.departureId,
    customer: { name: 'Test', email: 'test@test.com', phone: '+573001234567', document: '123' },
    pax: 1
  });
  console.log('BOOKING: Created for 1 pax');
  
  // 3. Check with cache bypass
  const r2 = await axios.get(`${API_URL}/public/departures?t=${Date.now()}`);
  const updated = r2.data.find(d => d.departureId === dep.departureId);
  
  console.log(`AFTER:  ${dep.departureId} has ${updated.currentPax}/${updated.maxPax} pax`);
  console.log(updated.currentPax === dep.currentPax + 1 ? '✅ SUCCESS' : '❌ FAILED');
}

test().catch(e => console.error(e.response?.data || e.message));
