const axios = require('axios');

// Configuration
const API_URL = 'http://127.0.0.1:5001/nevadotrektest01/us-central1/api'; // Adjust if needed
const ADMIN_KEY = 'miClaveSecreta123'; // Default local key

async function testBackend() {
    try {
        console.log('--- Starting Backend Verification ---');

        // 1. Create Tour
        console.log('\n1. Creating Tour...');
        const tourRes = await axios.post(`${API_URL}/admin/tours`, {
            name: { es: "Nevado del Tolima", en: "Tolima Volcano" },
            description: { es: "Increíble", en: "Amazing" },
            pricingTiers: [
                { minPax: 1, maxPax: 1, priceCOP: 500000, priceUSD: 150 },
                { minPax: 2, maxPax: 8, priceCOP: 300000, priceUSD: 90 }
            ]
        }, { headers: { 'x-admin-secret-key': ADMIN_KEY } });
        const tourId = tourRes.data.tourId;
        console.log('✅ Tour Created:', tourId);

        // 2. Create Booking (Should create Private Departure)
        console.log('\n2. Creating Private Booking...');
        const bookingRes = await axios.post(`${API_URL}/public/bookings`, {
            tourId: tourId,
            date: "2025-12-25",
            pax: 2,
            customer: { name: "Juan Perez", email: "juan@test.com" },
            type: "private"
        });
        console.log('✅ Booking Created:', bookingRes.data);

        // 3. Create Public Departure
        console.log('\n3. Creating Public Departure...');
        const depRes = await axios.post(`${API_URL}/admin/departures`, {
            tourId: tourId,
            date: "2025-12-31",
            type: "public"
        }, { headers: { 'x-admin-secret-key': ADMIN_KEY } });
        const publicDepId = depRes.data.departureId;
        console.log('✅ Public Departure Created:', publicDepId);

        // 4. Join Public Departure
        console.log('\n4. Joining Public Departure...');
        const joinRes = await axios.post(`${API_URL}/public/bookings`, {
            tourId: tourId,
            date: "2025-12-31",
            pax: 1,
            customer: { name: "Maria", email: "maria@test.com" },
            type: "public"
        });
        console.log('✅ Joined Public Departure:', joinRes.data);

        // 5. Test Split (Advanced Logic)
        // Note: We need bookingId to test split. Currently createBooking returns { success, departureId }
        // We should update createBooking to return bookingId as well.
        // For now, we can't test split without bookingId.

        console.log('\n--- Verification Complete ---');
    } catch (error) {
        console.error('❌ Error:', error.response ? error.response.data : error.message);
    }
}

testBackend();
