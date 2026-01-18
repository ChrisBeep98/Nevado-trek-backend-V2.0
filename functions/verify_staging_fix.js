const axios = require('axios');

const BASE_URL = 'https://api-6ups4cehla-uc.a.run.app';
const ADMIN_KEY = 'ntk_admin_staging_key_2026_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

async function verifyFixes() {
  console.log('🔍 Iniciando Verificación de Staging...');

  try {
    // 1. Obtener un Tour Válido
    console.log('\n1️⃣ Obteniendo Tours...');
    const toursRes = await axios.get(`${BASE_URL}/public/tours`);
    const tours = toursRes.data.tours || toursRes.data; // Handle both structures if needed
    
    if (!tours || tours.length === 0) {
      throw new Error('No se encontraron tours activos.');
    }
    
    const validTour = tours[0];
    console.log(`   ✅ Tour encontrado: ${validTour.name.es} (ID: ${validTour.tourId})`);

    // 2. Probar Creación de Reserva Privada (El que fallaba)
    console.log('\n2️⃣ Probando POST /public/bookings/private ...');
    const privatePayload = {
      tourId: validTour.tourId,
      date: '2026-03-20',
      pax: 2,
      customer: {
        name: "Test Telegram Bot",
        email: "test@telegram.com",
        phone: "+573009999999",
        document: "123456789"
      }
    };

    const privateRes = await axios.post(`${BASE_URL}/public/bookings/private`, privatePayload);
    console.log(`   ✅ ÉXITO: Reserva Privada creada. ID: ${privateRes.data.bookingId}`);
    console.log('   📱 Revisa tu Telegram, debería haber llegado un mensaje.');

    // 3. Probar Admin Booking (Para verificar lógica compartida)
    console.log('\n3️⃣ Probando POST /admin/bookings ...');
    const adminPayload = {
      tourId: validTour.tourId,
      date: '2026-04-15',
      pax: 4,
      type: 'public',
      customer: {
        name: "Test Admin Telegram",
        email: "admin@telegram.com",
        phone: "+573008888888",
        document: "987654321"
      }
    };

    const adminRes = await axios.post(`${BASE_URL}/admin/bookings`, adminPayload, {
      headers: { 'X-Admin-Secret-Key': ADMIN_KEY }
    });
    console.log(`   ✅ ÉXITO: Reserva Admin creada. ID: ${adminRes.data.bookingId}`);
    console.log('   📱 Revisa tu Telegram, debería haber llegado OTRO mensaje.');
    
    const departureId = adminRes.data.departureId;

    // 4. Probar Join Booking (Unirse a la departure pública creada arriba)
    console.log('\n4️⃣ Probando POST /public/bookings/join ...');
    const joinPayload = {
        departureId: departureId,
        pax: 1,
        customer: {
            name: "Test Join Telegram",
            email: "join@telegram.com",
            phone: "+573007777777",
            document: "111222333"
        }
    };
    
    const joinRes = await axios.post(`${BASE_URL}/public/bookings/join`, joinPayload);
    console.log(`   ✅ ÉXITO: Join exitoso. ID: ${joinRes.data.bookingId}`);
    console.log('   📱 Revisa tu Telegram, debería haber llegado un TERCER mensaje.');

    console.log('\n🎉 PRUEBA COMPLETADA EXITOSAMENTE');
    console.log('El error "pricePerPax is not defined" ha sido solucionado.');

  } catch (error) {
    console.error('\n❌ FALLÓ LA PRUEBA:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Data:', error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

verifyFixes();
