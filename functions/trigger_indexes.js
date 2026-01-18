const axios = require('axios');

const BASE_URL = 'https://api-6ups4cehla-uc.a.run.app';
const ADMIN_KEY = 'ntk_admin_staging_key_2026_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

async function triggerIndexes() {
  console.log('🚀 Triggering missing indexes in Staging...\n');

  // Query 1: Public Departures (Triggered by GET /public/departures)
  console.log('--- Index 1: Public Departures ---');
  try {
    await axios.get(`${BASE_URL}/public/departures`);
  } catch (err) {
    console.log('Link 1:', err.response?.data?.error?.split('here: ')[1] || 'No error/link');
  }

  // Query 2: Move Booking (tourId, type, status, date range)
  // We need a booking to move. Let's use an ID from previous test or just try to hit the endpoint with dummy data
  // to see if validation happens after or before the query. 
  // In moveBooking, query happens AFTER reading booking.
  console.log('\n--- Index 2: Move Booking (tourId, type, status, date) ---');
  try {
    // We need a real booking ID to reach the query
    const bookings = await axios.get(`${BASE_URL}/admin/bookings`, { headers: { 'X-Admin-Secret-Key': ADMIN_KEY } });
    if (bookings.data.length > 0) {
        const bid = bookings.data[0].bookingId;
        await axios.post(`${BASE_URL}/admin/bookings/${bid}/move`, {
            newTourId: 'any',
            newDate: '2026-01-01'
        }, { headers: { 'X-Admin-Secret-Key': ADMIN_KEY } });
    }
  } catch (err) {
    const msg = err.response?.data?.error || '';
    if (msg.includes('index')) {
        console.log('Link 2:', msg.split('here: ')[1]);
    } else {
        console.log('Note: Could not trigger Link 2 (maybe needs valid tourId)');
    }
  }

  // Query 3: Admin Bookings filter (departureId, status)
  console.log('\n--- Index 3: Admin Bookings (departureId, status) ---');
  try {
    await axios.get(`${BASE_URL}/admin/bookings?departureId=test&status=pending`, { 
        headers: { 'X-Admin-Secret-Key': ADMIN_KEY } 
    });
  } catch (err) {
    const msg = err.response?.data?.error || '';
    if (msg.includes('index')) {
        console.log('Link 3:', msg.split('here: ')[1]);
    } else {
        console.log('Note: Link 3 not needed or already exists.');
    }
  }
}

triggerIndexes();
