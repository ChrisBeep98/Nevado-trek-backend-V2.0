const axios = require('axios');
const API_URL = 'https://us-central1-nevadotrektest01.cloudfunctions.net/api';
const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

async function test() {
  console.log('Testing timezone fix...\n');
  
  // Get a tour
  const tours = await axios.get(`${API_URL}/admin/tours`, {
    headers: { 'X-Admin-Secret-Key': ADMIN_KEY }
  });
  const tourId = tours.data[0].tourId;
  
  // Create departure for Dec 31
  const create = await axios.post(`${API_URL}/admin/departures`, {
    tourId, date: '2025-12-31', type: 'public', maxPax: 8
  }, { headers: { 'X-Admin-Secret-Key': ADMIN_KEY } });
  
  const depId = create.data.departureId;
  console.log(`Created departure: ${depId}`);
  console.log(`Stored date from response: ${JSON.stringify(create.data.data.date)}`);
  
  // Check via departures list
  const list = await axios.get(`${API_URL}/admin/departures`, {
    headers: { 'X-Admin-Secret-Key': ADMIN_KEY }
  });
  const found = list.data.find(d => d.departureId === depId);
  console.log(`Date from list: ${found.date}`);
  
  // Parse and check
  const d = new Date(found.date);
  console.log(`\nParsed: ${d.toISOString()}`);
  console.log(`UTC Day: ${d.getUTCDate()}`);
  console.log(`Is Noon UTC: ${d.getUTCHours() === 12 ? '✅ YES' : '❌ NO'}`);
  
  // Cleanup
  await axios.delete(`${API_URL}/admin/departures/${depId}`, {
    headers: { 'X-Admin-Secret-Key': ADMIN_KEY }
  });
  console.log('\nTest departure deleted');
  console.log(d.getUTCDate() === 31 && d.getUTCHours() === 12 ? '\n✅ SUCCESS' : '\n❌ FAILED');
}

test().catch(e => console.error(e.response?.data || e.message));
