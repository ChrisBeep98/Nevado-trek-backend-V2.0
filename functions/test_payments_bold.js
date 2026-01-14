const axios = require('axios');
const crypto = require('crypto');

// URL de Staging
const BASE_URL = 'https://api-6ups4cehla-uc.a.run.app';
const ADMIN_KEY = 'ntk_admin_staging_key_2026_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

async function runTest() {
  console.log('🚀 Iniciando prueba de integración de pagos con Bold (Staging)...');
  console.log(`📡 Conectando a: ${BASE_URL}`);

  let bookingId;
  let amount;

  try {
    // PASO 1: Crear una reserva de prueba
    console.log('\n1️⃣ Creando reserva de prueba...');
    const bookingData = {
      tourId: 'test-tour-001',
      date: '2026-12-25',
      type: 'private',
      pax: 2,
      customer: {
        name: 'Test Payment User',
        email: 'test@bold.co',
        phone: '+573001234567',
        document: '123456789'
      }
    };

    const createRes = await axios.post(`${BASE_URL}/admin/bookings`, bookingData, {
      headers: { 'X-Admin-Secret-Key': ADMIN_KEY }
    });

    bookingId = createRes.data.bookingId || createRes.data.id;
    console.log(`✅ Reserva creada. ID: ${bookingId}`);

    // PASO 1.5: Obtener detalles de la reserva para saber el precio
    console.log('\n1.5️⃣ Obteniendo detalles de precio...');
    const getRes = await axios.get(`${BASE_URL}/admin/bookings/${bookingId}`, {
        headers: { 'X-Admin-Secret-Key': ADMIN_KEY }
    });
    
    const booking = getRes.data.booking || getRes.data;
    
    // CORRECCIÓN: Los precios están en la raíz del objeto
    amount = booking.finalPrice || booking.originalPrice; 
    console.log(`💰 Monto confirmado: $${amount} COP`);


    // PASO 2: Inicializar el pago
    console.log('\n2️⃣ Inicializando pago con Bold...');
    
    const paymentInitRes = await axios.post(`${BASE_URL}/public/payments/init`, {
      bookingId: bookingId
    });

    const paymentData = paymentInitRes.data;
    console.log('✅ Respuesta del backend recibida:', paymentData);

    // PASO 3: Validaciones
    console.log('\n3️⃣ Validando respuesta...');
    
    if (!paymentData.integritySignature) throw new Error('Falta integritySignature');
    if (!paymentData.paymentReference) throw new Error('Falta paymentReference');
    if (paymentData.amount !== amount) throw new Error(`Monto incorrecto. Esperado: ${amount}, Recibido: ${paymentData.amount}`);
    if (paymentData.currency !== 'COP') throw new Error('Moneda incorrecta');
    if (paymentData.apiKey) throw new Error('Falta apiKey pública');

    console.log('🔍 Análisis de integridad:');
    console.log(`   Referencia: ${paymentData.paymentReference}`);
    console.log(`   Hash generado: ${paymentData.integritySignature.substring(0, 10)}...`);

    console.log('\n🎉 ¡PRUEBA EXITOSA! El backend está listo para procesar pagos con Bold.');

  } catch (error) {
    console.error('\n❌ ERROR EN LA PRUEBA:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
  }
}

runTest();