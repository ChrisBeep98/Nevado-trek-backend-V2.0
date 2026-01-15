const axios = require('axios');

const API_URL = 'https://api-6ups4cehla-uc.a.run.app/admin/bookings';
const ADMIN_KEY = 'ntk_admin_staging_key_2026_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

async function checkBooking() {
  try {
    // Traer todas las reservas (en staging son pocas)
    const res = await axios.get(API_URL, { headers: { 'X-Admin-Secret-Key': ADMIN_KEY } });
    const bookings = res.data.bookings || [];

    // Buscar la de Chris
    const myBooking = bookings.find(b => b.customer.name === "chris test 4 bold");

    if (myBooking) {
      console.log('📋 ESTADO ACTUAL EN BASE DE DATOS:');
      console.log('==================================');
      console.log(`🆔 ID: ${myBooking.bookingId}`);
      console.log(`👤 Cliente: ${myBooking.customer.name}`);
      console.log(`🚦 Status Principal: ${myBooking.status.toUpperCase()}`);
      
      if (myBooking.paymentInfo) {
        console.log('\n💳 INFORMACIÓN DE PAGO (Webhook Recibido):');
        console.log(JSON.stringify(myBooking.paymentInfo, null, 2));
      } else {
        console.log('\n❌ NO hay información de pago aún (Webhook no ha llegado).');
      }
    } else {
      console.log('⚠️ No encontré la reserva.');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkBooking();
