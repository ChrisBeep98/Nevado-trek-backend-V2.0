const axios = require('axios');

// Configuración Staging
const BASE_URL = 'https://api-6ups4cehla-uc.a.run.app';
const ADMIN_KEY = 'ntk_admin_staging_key_2026_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

async function simulateWebhook() {
  console.log('🧪 INICIANDO SIMULACIÓN DE WEBHOOK (BOLD -> BACKEND)');
  console.log('====================================================');

  try {
    // 1. Crear una Reserva "Pendiente"
    console.log('\n1️⃣ Creando reserva preliminar...');
    const bookingData = {
      tourId: 'test-tour-001',
      date: '2026-12-31',
      type: 'private',
      pax: 2,
      customer: { name: "Webhook Tester", email: "hook@test.com", phone: "+573001234567", document: "999999" }
    };

    const createRes = await axios.post(`${BASE_URL}/admin/bookings`, bookingData, {
      headers: { 'X-Admin-Secret-Key': ADMIN_KEY }
    });
    
    // Ajuste para obtener ID (la respuesta simplificada devuelve bookingId o id)
    const bookingId = createRes.data.bookingId || createRes.data.id;
    console.log(`   ✅ Reserva creada: ${bookingId} (Estado: pending)`);

    // 2. Construir el Payload que enviaría Bold
    const timestamp = Date.now();
    const reference = `NTK-${bookingId}-${timestamp}`;
    
    const boldPayload = {
      payment_status: "APPROVED",
      payment_method: "CARD",
      reference: reference,
      tx_id: `TX-${timestamp}`,
      currency: "COP",
      amount: 500000
    };

    console.log('\n2️⃣ Disparando Webhook (Simulando ser Bold)...');
    console.log(`   Enviando a: ${BASE_URL}/public/payments/webhook`);
    console.log(`   Payload: ${JSON.stringify(boldPayload)}`);

    const webhookRes = await axios.post(`${BASE_URL}/public/payments/webhook`, boldPayload, {
      headers: {
        'Content-Type': 'application/json',
        'Bold-Signature': 'simulated_signature_hash' // Simulamos el header
      }
    });

    console.log(`   ✅ Respuesta del Webhook: ${webhookRes.status} ${webhookRes.statusText}`);

    // 3. Verificar en Base de Datos
    console.log('\n3️⃣ Verificando impacto en la Base de Datos...');
    // Esperamos un momento para asegurar que Firestore haya procesado (aunque suele ser rápido)
    await new Promise(r => setTimeout(r, 2000));

    const verifyRes = await axios.get(`${BASE_URL}/admin/bookings/${bookingId}`, {
      headers: { 'X-Admin-Secret-Key': ADMIN_KEY }
    });

    const updatedBooking = verifyRes.data.booking || verifyRes.data;
    
    // Verificaciones
    const mainStatus = updatedBooking.status;
    const paymentStatus = updatedBooking.paymentInfo?.status;

    console.log(`   Estado Actual Reserva: ${mainStatus.toUpperCase()}`);
    console.log(`   Estado Info Pago:      ${paymentStatus?.toUpperCase() || 'N/A'}`);

    if (mainStatus === 'paid' && paymentStatus === 'paid') {
      console.log('\n🎉 ¡ÉXITO! El Webhook procesó el pago y actualizó la reserva.');
    } else {
      console.error('\n❌ FALLO: La reserva no se actualizó correctamente.');
    }

  } catch (error) {
    console.error('\n❌ ERROR CRÍTICO:', error.message);
    if (error.response) console.error('   Data:', error.response.data);
  }
}

simulateWebhook();
