const axios = require('axios');

// Configuración Staging
const BASE_URL = 'https://api-6ups4cehla-uc.a.run.app';
const ADMIN_KEY = 'ntk_admin_staging_key_2026_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

// ID de la reserva REAL creada por Chris desde el Frontend
const REAL_BOOKING_ID = 'uoGI9AnsVvB4mkXTMeFS';

async function forceWebhook() {
  console.log(`⚡ FORZANDO WEBHOOK PARA RESERVA: ${REAL_BOOKING_ID}`);
  console.log('================================================');

  try {
    // 1. Construir el Payload que enviaría Bold
    const timestamp = Date.now();
    const reference = `NTK-${REAL_BOOKING_ID}-${timestamp}`;
    
    const boldPayload = {
      payment_status: "APPROVED",
      payment_method: "CARD",
      reference: reference,
      tx_id: `TX-FORCED-${timestamp}`,
      currency: "COP",
      amount: 500000
    };

    console.log(`📡 Enviando POST a: ${BASE_URL}/public/payments/webhook`);
    console.log(`📦 Payload:`, JSON.stringify(boldPayload, null, 2));

    const webhookRes = await axios.post(`${BASE_URL}/public/payments/webhook`, boldPayload, {
      headers: {
        'Content-Type': 'application/json',
        'Bold-Signature': 'simulated_signature_hash'
      }
    });

    console.log(`✅ Respuesta del Webhook: ${webhookRes.status} ${webhookRes.statusText}`);

    // 2. Verificar en Base de Datos
    console.log('\n🔍 Verificando resultado en Firestore...');
    await new Promise(r => setTimeout(r, 2000)); // Esperar propagación

    const verifyRes = await axios.get(`${BASE_URL}/admin/bookings/${REAL_BOOKING_ID}`, {
      headers: { 'X-Admin-Secret-Key': ADMIN_KEY }
    });

    const booking = verifyRes.data.booking || verifyRes.data;
    
    console.log(`   Status Principal: ${booking.status.toUpperCase()}`);
    if (booking.paymentInfo) {
        console.log(`   Payment Info Status: ${booking.paymentInfo.status.toUpperCase()}`);
        console.log(`   Transaction ID: ${booking.paymentInfo.transactionId}`);
    } else {
        console.log('   ❌ paymentInfo sigue ausente.');
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.response) console.error('   Data:', error.response.data);
  }
}

forceWebhook();
