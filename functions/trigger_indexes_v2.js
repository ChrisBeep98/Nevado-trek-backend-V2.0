const axios = require('axios');

const BASE_URL = 'https://api-6ups4cehla-uc.a.run.app';
const ADMIN_KEY = 'ntk_admin_staging_key_2026_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

async function triggerIndexes() {
  console.log('🚀 Triggering missing indexes in Staging...\n');

  try {
    const toursRes = await axios.get(`${BASE_URL}/public/tours`);
    const tours = toursRes.data.tours || toursRes.data;
    const tourId = tours[0].tourId;

    const bookingsRes = await axios.get(`${BASE_URL}/admin/bookings`, { headers: { 'X-Admin-Secret-Key': ADMIN_KEY } });
    const bookingId = bookingsRes.data[0].bookingId;

    // Trigger Link 2: Move Booking
    console.log('--- Index 2: Move Booking ---\n');
    try {
        await axios.post(`${BASE_URL}/admin/bookings/${bookingId}/move`, {
            newTourId: tourId,
            newDate: '2026-12-31'
        }, { headers: { 'X-Admin-Secret-Key': ADMIN_KEY } });
    } catch (err) {
        const msg = err.response?.data?.error || '';
        if (msg.includes('index')) {
            console.log('Link 2:', msg.split('here: ')[1]);
        } else {
            console.log('Error triggering link 2:', msg);
        }
    }

  } catch (err) {
    console.error('Error in script:', err.message);
  }
}

triggerIndexes();
