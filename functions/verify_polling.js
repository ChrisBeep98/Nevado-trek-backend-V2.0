const axios = require('axios');

const API_URL = 'https://api-6ups4cehla-uc.a.run.app';
const ADMIN_KEY = 'ntk_admin_staging_key_2026_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

async function verifyPolling() {
    console.log('🔎 Verificando Endpoint de Polling (/public/bookings/:id)...');
    
    try {
        // 0. Obtener un Tour Real
        const toursRes = await axios.get(`${API_URL}/public/tours`);
        const tourId = toursRes.data[0].tourId;
        console.log(`   ✅ Usando Tour ID: ${tourId}`);

        // 1. Crear Reserva (ADMIN para evitar Rate Limit)
        const bookingData = {
            tourId: tourId,
            date: '2026-08-01',
            type: 'private',
            pax: 2,
            customer: { name: "Polling Tester", email: "poll@test.com", phone: "+573000000000", document: "55555" }
        };
        const createRes = await axios.post(`${API_URL}/admin/bookings`, bookingData, {
            headers: { 'X-Admin-Secret-Key': ADMIN_KEY }
        });
        const bookingId = createRes.data.bookingId || createRes.data.id; // Admin endpoint might return different structure
        console.log(`   ✅ Reserva creada (Admin): ${bookingId}`);

        // 2. Consultar Endpoint de Polling
        console.log(`   📡 Consultando GET /public/bookings/${bookingId}`);
        const pollRes = await axios.get(`${API_URL}/public/bookings/${bookingId}`);
        
        console.log('   📩 Respuesta:', pollRes.data);

        // Validaciones
        if (pollRes.data.bookingId !== bookingId) throw new Error("ID mismatch");
        if (!pollRes.data.status) throw new Error("Missing status");
        if (pollRes.data.customer) throw new Error("⚠️ SECURITY ALERT: PII returned in public endpoint!");

        console.log('   ✅ Polling Endpoint OK (Datos correctos y seguros)');

        // Cleanup
        await axios.put(`${API_URL}/admin/bookings/${bookingId}/status`, { status: 'cancelled' }, { headers: { 'X-Admin-Secret-Key': ADMIN_KEY } });

    } catch (error) {
        console.error('   ❌ FALLO:', error.message);
        if (error.response) console.error(error.response.data);
    }
}

verifyPolling();