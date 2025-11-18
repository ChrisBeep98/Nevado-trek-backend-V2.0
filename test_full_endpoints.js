const axios = require('axios');
const fs = require('fs');

function log(msg) {
    console.log(msg);
    fs.appendFileSync('test_results.log', msg + '\n');
}

// Clear previous log
fs.writeFileSync('test_results.log', '');

// CONFIGURATION
// const API_BASE_URL = 'http://127.0.0.1:5001/nevadotrektest01/us-central1/api'; // Emulator URL
const API_BASE_URL = 'https://us-central1-nevadotrektest01.cloudfunctions.net/api'; // Deployed URL (Uncomment to use)
const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

const client = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'X-Admin-Secret-Key': ADMIN_KEY
    },
    validateStatus: () => true // Don't throw on error status
});

async function runTests() {
    log(`🚀 Starting Comprehensive API Test against ${API_BASE_URL}`);
    log('--------------------------------------------------');

    const state = {
        tourId: null,
        departureId: null,
        bookingId: null,
        publicDepartureId: null
    };

    // ===========================================================================
    // 1. TOUR MANAGEMENT
    // ===========================================================================
    log('\n📦 1. TOUR MANAGEMENT');

    // 1.1 Create Tour
    log('   [POST] /admin/tours - Creating new tour...');
    const newTour = {
        name: { en: 'Test Tour', es: 'Tour de Prueba' },
        description: { en: 'A test tour', es: 'Un tour de prueba' },
        type: 'multi-day',
        pricingTiers: [
            { minPax: 1, maxPax: 1, priceCOP: 100000, priceUSD: 30 },
            { minPax: 2, maxPax: 2, priceCOP: 90000, priceUSD: 28 },
            { minPax: 3, maxPax: 3, priceCOP: 85000, priceUSD: 26 },
            { minPax: 4, maxPax: 8, priceCOP: 80000, priceUSD: 25 }
        ],
        isActive: true
    };
    let res = await client.post('/admin/tours', newTour);
    logResult(res);
    if (res.status === 201) state.tourId = res.data.tourId;

    // 1.2 Get Tours (Admin)
    log('   [GET] /admin/tours - Fetching all tours...');
    res = await client.get('/admin/tours');
    logResult(res, (d) => Array.isArray(d) && d.length > 0);

    // 1.3 Get Tours (Public)
    log('   [GET] /public/tours - Fetching public tours...');
    res = await client.get('/public/tours');
    logResult(res, (d) => Array.isArray(d) && d.some(t => t.tourId === state.tourId));

    // 1.4 Update Tour
    log(`   [PUT] /admin/tours/${state.tourId} - Updating tour price...`);
    res = await client.put(`/admin/tours/${state.tourId}`, {
        ...newTour,
        pricingTiers: [
            { minPax: 1, maxPax: 1, priceCOP: 120000, priceUSD: 35 }, // Price increase
            { minPax: 2, maxPax: 2, priceCOP: 110000, priceUSD: 32 },
            { minPax: 3, maxPax: 3, priceCOP: 100000, priceUSD: 30 },
            { minPax: 4, maxPax: 8, priceCOP: 90000, priceUSD: 28 }
        ]
    });
    logResult(res);


    // ===========================================================================
    // 2. DEPARTURE MANAGEMENT
    // ===========================================================================
    log('\n📅 2. DEPARTURE MANAGEMENT');

    // 2.1 Create Public Departure
    log('   [POST] /admin/departures - Creating PUBLIC departure...');
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);

    res = await client.post('/admin/departures', {
        tourId: state.tourId,
        date: nextMonth.toISOString().split('T')[0],
        type: 'public',
        maxPax: 8
    });
    logResult(res);
    if (res.status === 201) state.publicDepartureId = res.data.departureId;

    // 2.2 Get Calendar
    log('   [GET] /admin/departures - Fetching calendar...');
    res = await client.get('/admin/departures');
    logResult(res, (d) => Array.isArray(d) && d.some(dep => dep.departureId === state.publicDepartureId));

    // 2.3 Get Public Departures
    log('   [GET] /public/departures - Fetching open departures...');
    res = await client.get('/public/departures');
    logResult(res, (d) => Array.isArray(d) && d.some(dep => dep.departureId === state.publicDepartureId));


    // ===========================================================================
    // 3. BOOKING FLOW
    // ===========================================================================
    log('\n🎫 3. BOOKING FLOW');

    // 3.1 Create Booking (Join Public)
    log('   [POST] /public/bookings - Joining Public Departure...');
    res = await client.post('/public/bookings', {
        tourId: state.tourId,
        date: nextMonth.toISOString().split('T')[0], // Same date as public dep
        pax: 2,
        customer: {
            name: 'John Doe',
            email: 'john@example.com',
            phone: '+1234567890',
            document: '123456789'
        }
    });
    logResult(res);
    if (res.status === 201) state.bookingId = res.data.bookingId;

    // 3.2 Create Booking (New Private)
    log('   [POST] /public/bookings - Creating Private Departure...');
    const privateDate = new Date();
    privateDate.setDate(privateDate.getDate() + 45);

    res = await client.post('/public/bookings', {
        tourId: state.tourId,
        date: privateDate.toISOString().split('T')[0],
        pax: 4,
        customer: {
            name: 'Jane Smith',
            email: 'jane@example.com',
            phone: '+0987654321',
            document: '987654321'
        }
    });
    logResult(res);
    // We won't track this one for now, just verifying creation works


    // ===========================================================================
    // 4. ADMIN BOOKING ACTIONS
    // ===========================================================================
    log('\n🔧 4. ADMIN BOOKING ACTIONS');

    if (state.bookingId) {
        // 4.1 Update Booking (Pax)
        log(`   [PUT] /admin/bookings/${state.bookingId} - Updating Pax to 3...`);
        res = await client.put(`/admin/bookings/${state.bookingId}`, {
            pax: 3
        });
        logResult(res);

        // 4.2 Apply Discount
        log(`   [POST] /admin/bookings/${state.bookingId}/discount - Applying discount...`);
        res = await client.post(`/admin/bookings/${state.bookingId}/discount`, {
            discountAmount: 50000,
            reason: 'Loyalty Bonus'
        });
        logResult(res);

        // 4.3 Move Booking
        log(`   [POST] /admin/bookings/${state.bookingId}/move - Moving to new date...`);
        const moveDate = new Date();
        moveDate.setDate(moveDate.getDate() + 60);

        res = await client.post(`/admin/bookings/${state.bookingId}/move`, {
            newDate: moveDate.toISOString().split('T')[0],
            newTourId: state.tourId // Keep same tour
        });
        logResult(res);
    }


    // ===========================================================================
    // 5. CLEANUP & STATS
    // ===========================================================================
    log('\n🧹 5. CLEANUP & STATS');

    // 5.1 Get Stats
    console.log('   [GET] /admin/stats - Fetching dashboard stats...');
    res = await client.get('/admin/stats');
    logResult(res);

    // 5.2 Delete Tour (Should soft delete)
    if (state.tourId) {
        console.log(`   [DELETE] /admin/tours/${state.tourId} - Deleting test tour...`);
        res = await client.delete(`/admin/tours/${state.tourId}`);
        logResult(res);
    }

    console.log('\n--------------------------------------------------');
    console.log('✅ Test Sequence Complete');
}

function logResult(res, validator = null) {
    const isSuccess = res.status >= 200 && res.status < 300;
    const isValid = validator ? validator(res.data) : true;
    const icon = isSuccess && isValid ? '✅' : '❌';

    log(`      ${icon} Status: ${res.status} ${res.statusText}`);
    if (!isSuccess) {
        log(`         Error: ${JSON.stringify(res.data)}`);
    }
}

runTests().catch(console.error);
