const axios = require('axios');
const fs = require('fs');

function log(msg) {
    console.log(msg);
    fs.appendFileSync('test_deployed_results.log', msg + '\n');
}

// Clear previous log
fs.writeFileSync('test_deployed_results.log', '');

// CONFIGURATION
const API_BASE_URL = 'https://api-wgfhwjbpva-uc.a.run.app'; // Deployed URL
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
    log(`🚀 Starting Meticulous API Test against ${API_BASE_URL}`);
    log('--------------------------------------------------');

    const state = {
        tourId: null,
        departureId: null,
        bookingId: null,
        publicDepartureId: null,
        privateDepartureId: null,
        privateBookingId: null
    };

    // ===========================================================================
    // 1. TOUR MANAGEMENT
    // ===========================================================================
    log('\n📦 1. TOUR MANAGEMENT');

    // 1.1 Create Tour
    log('   [POST] /admin/tours - Creating new tour...');
    const newTour = {
        name: { en: 'Meticulous Test Tour', es: 'Tour de Prueba Meticulosa' },
        description: { en: 'A test tour for full coverage', es: 'Un tour de prueba para cobertura total' },
        type: 'multi-day',
        pricingTiers: [
            { minPax: 1, maxPax: 1, priceCOP: 200000, priceUSD: 60 },
            { minPax: 2, maxPax: 2, priceCOP: 180000, priceUSD: 50 },
            { minPax: 3, maxPax: 3, priceCOP: 160000, priceUSD: 45 },
            { minPax: 4, maxPax: 8, priceCOP: 140000, priceUSD: 40 }
        ],
        isActive: true
    };
    let res = await client.post('/admin/tours', newTour);
    logResult(res);
    if (res.status === 201) state.tourId = res.data.tourId;

    if (!state.tourId) {
        log('❌ Critical: Failed to create tour. Aborting.');
        return;
    }

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
            { minPax: 1, maxPax: 1, priceCOP: 210000, priceUSD: 65 },
            { minPax: 2, maxPax: 2, priceCOP: 190000, priceUSD: 55 },
            { minPax: 3, maxPax: 3, priceCOP: 170000, priceUSD: 50 },
            { minPax: 4, maxPax: 8, priceCOP: 150000, priceUSD: 45 }
        ]
    });
    logResult(res);


    // ===========================================================================
    // 2. DEPARTURE MANAGEMENT (PUBLIC)
    // ===========================================================================
    log('\n📅 2. DEPARTURE MANAGEMENT (PUBLIC)');

    // 2.1 Create Public Departure
    log('   [POST] /admin/departures - Creating PUBLIC departure...');
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);
    const dateStr = nextMonth.toISOString().split('T')[0];

    res = await client.post('/admin/departures', {
        tourId: state.tourId,
        date: dateStr,
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
    // 3. BOOKING FLOW (PUBLIC JOIN)
    // ===========================================================================
    log('\n🎫 3. BOOKING FLOW (PUBLIC JOIN)');

    // 3.1 Create Booking (Join Public)
    log('   [POST] /public/bookings/join - Joining Public Departure...');
    res = await client.post('/public/bookings/join', {
        tourId: state.tourId,
        date: dateStr,
        pax: 2,
        customer: {
            name: 'John Public',
            email: 'john.public@example.com',
            phone: '+1234567890',
            document: '123456789'
        },
        departureId: state.publicDepartureId
    });
    logResult(res);
    if (res.status === 201) state.bookingId = res.data.bookingId;


    // ===========================================================================
    // 4. BOOKING FLOW (PRIVATE)
    // ===========================================================================
    log('\n🎫 4. BOOKING FLOW (PRIVATE)');

    // 4.1 Create Booking (New Private)
    log('   [POST] /public/bookings/private - Creating Private Departure...');
    const privateDate = new Date();
    privateDate.setDate(privateDate.getDate() + 45);
    const privateDateStr = privateDate.toISOString().split('T')[0];

    res = await client.post('/public/bookings/private', {
        tourId: state.tourId,
        date: privateDateStr,
        pax: 4,
        customer: {
            name: 'Jane Private',
            email: 'jane.private@example.com',
            phone: '+0987654321',
            document: '987654321'
        }
    });
    logResult(res);
    if (res.status === 201) {
        state.privateBookingId = res.data.bookingId;
        state.privateDepartureId = res.data.departureId;
    }


    // ===========================================================================
    // 5. ADMIN BOOKING ACTIONS (COMPREHENSIVE)
    // ===========================================================================
    log('\n🔧 5. ADMIN BOOKING ACTIONS (COMPREHENSIVE)');

    if (state.bookingId) {
        // 5.1 Update Booking Pax
        log(`   [PUT] /admin/bookings/${state.bookingId}/pax - Updating Pax to 3...`);
        res = await client.put(`/admin/bookings/${state.bookingId}/pax`, { pax: 3 });
        logResult(res);

        // 5.2 Update Booking Details
        log(`   [PUT] /admin/bookings/${state.bookingId}/details - Updating Customer Details...`);
        res = await client.put(`/admin/bookings/${state.bookingId}/details`, {
            customer: {
                name: 'John Public Updated',
                email: 'john.updated@example.com',
                phone: '+1234567890',
                document: '123456789'
            }
        });
        logResult(res);

        // 5.3 Apply Discount
        log(`   [POST] /admin/bookings/${state.bookingId}/discount - Applying discount...`);
        res = await client.post(`/admin/bookings/${state.bookingId}/discount`, {
            discountAmount: 50000,
            reason: 'Loyalty Bonus'
        });
        logResult(res);

        // 5.4 Cancel Booking
        log(`   [PUT] /admin/bookings/${state.bookingId}/status - Cancelling booking...`);
        res = await client.put(`/admin/bookings/${state.bookingId}/status`, { status: 'cancelled' });
        logResult(res);

        // 5.5 Un-cancel Booking
        log(`   [PUT] /admin/bookings/${state.bookingId}/status - Un-cancelling booking...`);
        res = await client.put(`/admin/bookings/${state.bookingId}/status`, { status: 'confirmed' });
        logResult(res);
    }


    // ===========================================================================
    // 6. ADVANCED DEPARTURE OPERATIONS
    // ===========================================================================
    log('\n🚀 6. ADVANCED DEPARTURE OPERATIONS');

    if (state.privateBookingId) {
        // 6.1 Convert Private to Public
        log(`   [POST] /admin/bookings/${state.privateBookingId}/convert-type - Converting Private to Public...`);
        res = await client.post(`/admin/bookings/${state.privateBookingId}/convert-type`, {
            targetType: 'public'
        });
        logResult(res);
    }

    if (state.bookingId) {
        // 6.2 Move Booking
        log(`   [POST] /admin/bookings/${state.bookingId}/move - Moving to new date...`);
        const moveDate = new Date();
        moveDate.setDate(moveDate.getDate() + 60);
        const moveDateStr = moveDate.toISOString().split('T')[0];

        res = await client.post(`/admin/bookings/${state.bookingId}/move`, {
            newDate: moveDateStr,
            newTourId: state.tourId // Keep same tour
        });
        logResult(res);
    }


    // ===========================================================================
    // 7. CLEANUP & STATS
    // ===========================================================================
    log('\n🧹 7. CLEANUP & STATS');

    // 7.1 Get Stats
    log('   [GET] /admin/stats - Fetching dashboard stats...');
    res = await client.get('/admin/stats');
    logResult(res);

    // 7.2 Delete Tour (Should soft delete)
    if (state.tourId) {
        log(`   [DELETE] /admin/tours/${state.tourId} - Deleting test tour...`);
        res = await client.delete(`/admin/tours/${state.tourId}`);
        logResult(res);
    }

    log('\n--------------------------------------------------');
    log('✅ Meticulous Test Sequence Complete');
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
