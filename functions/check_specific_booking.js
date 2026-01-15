const axios = require('axios');

const API_URL = 'https://api-6ups4cehla-uc.a.run.app/admin/bookings/uoGI9AnsVvB4mkXTMeFS';
const ADMIN_KEY = 'ntk_admin_staging_key_2026_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

async function checkSpecificBooking() {
  try {
    console.log('🔍 Consultando reserva uoGI9AnsVvB4mkXTMeFS...');
    const res = await axios.get(API_URL, { headers: { 'X-Admin-Secret-Key': ADMIN_KEY } });
    const booking = res.data.booking || res.data;

    console.log('📋 ESTADO ACTUAL:');
    console.log(`   Status: ${booking.status.toUpperCase()}`);
    
    if (booking.paymentInfo) {
        console.log('   💳 Payment Info:', JSON.stringify(booking.paymentInfo, null, 2));
    } else {
        console.log('   ❌ No hay paymentInfo (Webhook no recibido aún)');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkSpecificBooking();
