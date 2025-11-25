const axios = require('axios');

// Configuration
const API_URL = 'http://127.0.0.1:5001/nevadotrektest01/us-central1/api'; // Emulator URL
// const API_URL = 'https://api-wgfhwjbpva-uc.a.run.app'; // Production URL
const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

const client = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'X-Admin-Secret-Key': ADMIN_KEY
    },
    validateStatus: () => true // Don't throw on error status
});

async function runTests() {
    console.log(`\n🧪 Testing Cancellation Logic & Capacity on ${API_URL}\n`);

    let tourId;

    // 0. Get a Tour ID
    const toursRes = await client.get('/admin/tours');
    if (toursRes.data.length > 0) {
        tourId = toursRes.data[0].id;
        console.log(`✅ Using Tour ID: ${tourId}`);
    } else {
        console.log('⚠️ No tours found. Creating a test tour...');
        const createTourRes = await client.post('/admin/tours', {
            name: { en: 'Test Tour', es: 'Tour de Prueba' },
            description: { en: 'Test Description', es: 'Descripción de Prueba' },
            shortDescription: { en: 'Short Desc', es: 'Desc Corta' },
            pricingTiers: [
                { minPax: 1, maxPax: 1, priceCOP: 100000, priceUSD: 30 },
                { minPax: 2, maxPax: 2, priceCOP: 90000, priceUSD: 25 },
                { minPax: 3, maxPax: 3, priceCOP: 80000, priceUSD: 20 },
                { minPax: 4, maxPax: 8, priceCOP: 70000, priceUSD: 15 }
            ],
            totalDays: 1,
            difficulty: 'Easy',
            temperature: 20,
            distance: 10,
            altitude: { en: '1000m', es: '1000m' },
            location: { en: 'Test Location', es: 'Ubicación de Prueba' },
            faqs: [],
            recommendations: [],
            inclusions: [],
            exclusions: []
        });

        if (createTourRes.status === 201) {
            tourId = createTourRes.data.tourId;
            console.log(`✅ Created Test Tour ID: ${tourId}`);
        } else {
            console.error('❌ Failed to create test tour', createTourRes.data);
            return;
        }
    }

    // TEST 1: Private Booking Capacity (Should be 8)
    console.log('\n--- TEST 1: Private Booking Capacity ---');
    const privateBookingRes = await client.post('/admin/bookings', {
        tourId,
        date: '2025-12-25',
        pax: 2,
        type: 'private',
        customer: {
            name: 'Test Private',
            email: 'test@private.com',
            phone: '+1234567890',
            document: '12345'
        }
    });

    let privateBookingId;
    let privateDepartureId;

    if (privateBookingRes.status === 201) {
        const depId = privateBookingRes.data.departureId;
        const depRes = await client.get(`/admin/departures/${depId}`);

        if (depRes.data.maxPax === 8) {
            console.log('✅ PASS: Private Departure maxPax is 8');
        } else {
            console.error(`❌ FAIL: Private Departure maxPax is ${depRes.data.maxPax} (Expected 8)`);
        }

        // Store for cancellation test
        privateBookingId = privateBookingRes.data.bookingId;
        privateDepartureId = depId;
    } else {
        console.error('❌ FAIL: Could not create private booking', privateBookingRes.data);
    }

    // TEST 2: Private Cancellation (Should cancel departure)
    console.log('\n--- TEST 2: Private Cancellation Sync ---');
    if (privateBookingId) {
        const cancelRes = await client.put(`/admin/bookings/${privateBookingId}/status`, {
            status: 'cancelled'
        });

        if (cancelRes.status === 200) {
            console.log('✅ Booking cancelled successfully');

            // Check Departure Status
            const depRes = await client.get(`/admin/departures/${privateDepartureId}`);
            if (depRes.data.status === 'cancelled') {
                console.log('✅ PASS: Private Departure status is "cancelled"');
            } else {
                console.error(`❌ FAIL: Private Departure status is "${depRes.data.status}" (Expected "cancelled")`);
            }
        } else {
            console.error('❌ FAIL: Could not cancel booking', cancelRes.data);
        }
    }

    // TEST 3: Irreversible Cancellation
    console.log('\n--- TEST 3: Irreversible Cancellation ---');
    if (privateBookingId) {
        const uncancelRes = await client.put(`/admin/bookings/${privateBookingId}/status`, {
            status: 'confirmed'
        });

        if (uncancelRes.status === 500 && uncancelRes.data.error.includes('Cannot reactivate')) {
            console.log('✅ PASS: Prevented un-cancellation');
        } else {
            console.error(`❌ FAIL: Allowed un-cancellation or wrong error. Status: ${uncancelRes.status}`, uncancelRes.data);
        }
    }

    // TEST 4: Public Cancellation (Should free slot, keep departure open)
    console.log('\n--- TEST 4: Public Cancellation Logic ---');
    // Create Public Booking 1
    const publicBooking1 = await client.post('/admin/bookings', {
        tourId,
        date: '2025-12-30',
        pax: 2,
        type: 'public',
        customer: { name: 'Public 1', email: 'p1@test.com', phone: '+111', document: '111' }
    });

    const publicDepId = publicBooking1.data.departureId;
    const pBookingId1 = publicBooking1.data.bookingId;

    // Join Public Booking 2
    const publicBooking2 = await client.post('/public/bookings/join', {
        tourId,
        date: '2025-12-30',
        pax: 2,
        departureId: publicDepId,
        customer: { name: 'Public 2', email: 'p2@test.com', phone: '+222', document: '222' }
    });

    // Check Capacity (Should be 4)
    let depRes = await client.get(`/admin/departures/${publicDepId}`);
    console.log(`Current Pax: ${depRes.data.currentPax} (Expected 4)`);

    // Cancel Booking 1
    await client.put(`/admin/bookings/${pBookingId1}/status`, { status: 'cancelled' });
    console.log('Cancelled Booking 1');

    // Check Capacity (Should be 2) and Status (Should be open)
    depRes = await client.get(`/admin/departures/${publicDepId}`);

    if (depRes.data.currentPax === 2) {
        console.log('✅ PASS: Capacity reduced to 2');
    } else {
        console.error(`❌ FAIL: Capacity is ${depRes.data.currentPax} (Expected 2)`);
    }

    if (depRes.data.status === 'open') {
        console.log('✅ PASS: Public Departure remains open');
    } else {
        console.error(`❌ FAIL: Public Departure status is ${depRes.data.status}`);
    }

}

runTests();
