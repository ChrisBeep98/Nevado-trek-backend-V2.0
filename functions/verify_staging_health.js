const axios = require('axios');

// --- CONFIGURACIÓN STAGING ---
const API_URL = 'https://api-6ups4cehla-uc.a.run.app';
const ADMIN_KEY = 'ntk_admin_staging_key_2026_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

// --- UTILIDADES ---
const log = (msg) => console.log(`\n🔹 ${msg}`);
const success = (msg) => console.log(`   ✅ ${msg}`);
const fail = (msg, err) => {
    console.error(`   ❌ ${msg}`);
    if (err && err.response) console.error(`      Status: ${err.response.status} - ${JSON.stringify(err.response.data)}`);
    else if (err) console.error(`      Error: ${err.message}`);
    process.exit(1);
};

async function runHealthCheck() {
    console.log('🏥 INICIANDO HEALTH CHECK: STAGING ENVIRONMENT');
    console.log('=============================================');

    let testTourId;
    let testBookingId;
    let testDepartureId;

    try {
        // 1. VERIFICAR DATOS PÚBLICOS
        log('1. Verificando API Pública y Datos Semilla...');
        const publicTours = await axios.get(`${API_URL}/public/tours`);
        if (publicTours.data.length < 9) throw new Error(`Se esperaban al menos 9 tours, encontrados: ${publicTours.data.length}`);
        success(`API Pública responde. ${publicTours.data.length} tours activos encontrados.`);

        // 2. CICLO DE VIDA DE TOURS (ADMIN)
        log('2. Probando Gestión de Tours (Admin)...');
        const newTour = {
            name: { es: "Tour de Prueba Staging", en: "Staging Test Tour" },
            description: { es: "Desc de prueba", en: "Test desc" },
            shortDescription: { es: "Corto", en: "Short" },
            difficulty: "easy",
            totalDays: 1,
            distance: 5,
            temperature: 20,
            altitude: { es: "100m", en: "100m" },
            location: { es: "Lab", en: "Lab" },
            faqs: [], recommendations: [], inclusions: [], exclusions: [],
            isActive: true,
            pricingTiers: [
                { minPax: 1, maxPax: 1, priceCOP: 100000, priceUSD: 30 },
                { minPax: 2, maxPax: 2, priceCOP: 90000, priceUSD: 25 },
                { minPax: 3, maxPax: 3, priceCOP: 80000, priceUSD: 20 },
                { minPax: 4, maxPax: 8, priceCOP: 70000, priceUSD: 15 }
            ]
        };
        const createTourRes = await axios.post(`${API_URL}/admin/tours`, newTour, { headers: { 'X-Admin-Secret-Key': ADMIN_KEY } });
        testTourId = createTourRes.data.tourId;
        success(`Tour creado: ${testTourId}`);

        // 3. CICLO DE RESERVAS Y PAGOS
        log('3. Probando Flujo de Reserva y Pagos...');
        
        // A. Crear Reserva (Endpoint Público)
        const bookingData = {
            tourId: testTourId,
            date: '2026-06-01',
            type: 'private',
            pax: 2,
            customer: { name: "Health Check Bot", email: "bot@test.com", phone: "+573000000000", document: "12345" }
        };
        const createBookingRes = await axios.post(`${API_URL}/public/bookings/private`, bookingData);
        testBookingId = createBookingRes.data.bookingId;
        testDepartureId = createBookingRes.data.departureId;
        success(`Reserva creada (Pública): ${testBookingId}`);

        // B. Inicializar Pago Bold (Nuevo Feature)
        const paymentRes = await axios.post(`${API_URL}/public/payments/init`, { bookingId: testBookingId });
        if (!paymentRes.data.integritySignature || !paymentRes.data.paymentReference) throw new Error("Respuesta de pago incompleta");
        success(`Integración Bold OK. Hash: ${paymentRes.data.integritySignature.substring(0, 10)}...`);

        // C. Gestión Admin (Confirmar)
        await axios.put(`${API_URL}/admin/bookings/${testBookingId}/status`, { status: 'confirmed' }, { headers: { 'X-Admin-Secret-Key': ADMIN_KEY } });
        success(`Estado actualizado a CONFIRMED`);

        // D. Descuento
        await axios.post(`${API_URL}/admin/bookings/${testBookingId}/discount`, { discountAmount: 10000, reason: "Test" }, { headers: { 'X-Admin-Secret-Key': ADMIN_KEY } });
        success(`Descuento aplicado correctamente`);

        // 4. MOVIMIENTOS Y LÓGICA COMPLEJA
        log('4. Probando Lógica Compleja (Move Booking)...');
        // Mover a otra fecha
        await axios.post(`${API_URL}/admin/bookings/${testBookingId}/move`, 
            { newTourId: testTourId, newDate: '2026-07-01' }, 
            { headers: { 'X-Admin-Secret-Key': ADMIN_KEY } }
        );
        
        // Verificar cambio consultando la reserva
        const updatedBookingRes = await axios.get(`${API_URL}/admin/bookings/${testBookingId}`, { headers: { 'X-Admin-Secret-Key': ADMIN_KEY } });
        const updatedDepartureId = updatedBookingRes.data.departureId || updatedBookingRes.data.booking.departureId;

        if (updatedDepartureId === testDepartureId) throw new Error("No se movió de departure (ID sigue igual)");
        success(`Reserva movida a nueva fecha (Departure Swap confirmado: ${testDepartureId} -> ${updatedDepartureId})`);

        // 5. LIMPIEZA
        log('5. Limpieza y Soft Delete...');
        await axios.put(`${API_URL}/admin/bookings/${testBookingId}/status`, { status: 'cancelled' }, { headers: { 'X-Admin-Secret-Key': ADMIN_KEY } });
        success(`Reserva cancelada`);
        
        await axios.delete(`${API_URL}/admin/tours/${testTourId}`, { headers: { 'X-Admin-Secret-Key': ADMIN_KEY } });
        success(`Tour desactivado (Soft Delete)`);

        console.log('\n✅✅✅ RESULTADO: STAGING ESTÁ SALUDABLE Y LISTO PARA FRONTEND ✅✅✅');

    } catch (error) {
        fail('Fallo en el Health Check', error);
    }
}

runHealthCheck();
