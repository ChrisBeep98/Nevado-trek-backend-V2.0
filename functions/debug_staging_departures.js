const axios = require('axios');

const BASE_URL = 'https://api-6ups4cehla-uc.a.run.app';
const ADMIN_KEY = 'ntk_admin_staging_key_2026_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

async function debugStaging() {
  console.log('🐞 INICIANDO DEBUGGING DE STAGING (Departures & Join)...');

  try {
    // 1. Obtener un Tour ID válido
    console.log('1. Buscando un Tour activo...');
    const toursRes = await axios.get(`${BASE_URL}/public/tours`);
    const tours = toursRes.data.tours || toursRes.data;
    if (!tours.length) throw new Error("No hay tours en staging");
    const tourId = tours[0].tourId;
    console.log(`   OK Tour ID: ${tourId} (${tours[0].name.es})`);

    // 2. Crear una Departure Pública NUEVA (Admin)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 5);
    const dateStr = tomorrow.toISOString().split('T')[0];

    console.log(`2. Creando Departure Publica de prueba para el ${dateStr}...`);
    const createDepRes = await axios.post(`${BASE_URL}/admin/departures`, {
      tourId: tourId,
      date: dateStr,
      type: 'public',
      maxPax: 8
    }, { headers: { 'X-Admin-Secret-Key': ADMIN_KEY } });
    
    const newDepId = createDepRes.data.departureId;
    console.log(`   OK Departure Creada ID: ${newDepId}`);

    // 3. Probar GET /public/departures
    console.log('3. Probando GET /public/departures (Sin filtros)...');
    try {
        const getAllRes = await axios.get(`${BASE_URL}/public/departures?t=${Date.now()}`);
        console.log(`   OK Status: ${getAllRes.status}`);
        console.log(`   OK Departures encontradas: ${getAllRes.data.departures.length}`);
        
        const found = getAllRes.data.departures.find(d => d.departureId === newDepId);
        if (found) console.log('   OK La departure creada aparece en la lista.');
        else console.warn('   WARN La departure creada NO aparece');

    } catch (err) {
        console.error('   ERROR CRITICO EN GET /public/departures:');
        console.error(`   Status: ${err.response?.status}`);
        console.error(`   Data: ${JSON.stringify(err.response?.data)}`);
    }

    // 4. Probar GET /public/departures?tourId=...
    console.log(`4. Probando GET /public/departures?tourId=${tourId}...`);
    try {
        const getFilterRes = await axios.get(`${BASE_URL}/public/departures?tourId=${tourId}&t=${Date.now()}`);
        console.log(`   OK Status: ${getFilterRes.status}`);
        console.log(`   OK Departures encontradas: ${getFilterRes.data.departures.length}`);
    } catch (err) {
        console.error('   ERROR CRITICO EN GET /public/departures (con filtro):');
        console.error(`   Status: ${err.response?.status}`);
        console.error(`   Data: ${JSON.stringify(err.response?.data)}`);
    }

    // 5. Probar JOIN a esa departure
    console.log(`5. Probando POST /public/bookings/join (ID: ${newDepId})...`);
    try {
        const joinRes = await axios.post(`${BASE_URL}/public/bookings/join`, {
            departureId: newDepId,
            pax: 1,
            customer: {
                name: "Debug Join User",
                email: "debug@test.com",
                phone: "+573001234567",
                document: "123456789"
            }
        });
        console.log(`   OK Status: ${joinRes.status}`);
        console.log(`   OK Booking ID: ${joinRes.data.bookingId}`);
    } catch (err) {
        console.error('   ERROR EN JOIN:');
        console.error(`   Status: ${err.response?.status}`);
        console.error(`   Data: ${JSON.stringify(err.response?.data)}`);
    }

  } catch (error) {
    console.error('Error general en el script:', error.message);
    if (error.response) console.error(error.response.data);
  }
}

debugStaging();