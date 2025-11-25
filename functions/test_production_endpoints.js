const axios = require('axios');

// PRODUCTION API URL
const API_URL = 'https://api-wgfhwjbpva-uc.a.run.app';
const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

const client = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'X-Admin-Secret-Key': ADMIN_KEY
    },
    validateStatus: () => true
});

let results = { passed: 0, failed: 0, errors: [] };

function logTest(name, passed, details = '', data = null) {
    if (passed) {
        console.log(`✅ ${name}`);
        results.passed++;
    } else {
        console.log(`❌ ${name}`);
        if (details) console.log(`   Error: ${details}`);
        if (data) console.log(`   Data:`, JSON.stringify(data, null, 2));
        results.failed++;
        results.errors.push({ test: name, details, data });
    }
}

async function testAllEndpoints() {
    console.log('\n================================================================================');
    console.log('PRODUCTION ENDPOINT TESTING - Nov 25, 2025');
    console.log('API URL:', API_URL);
    console.log('================================================================================\n');

    params: {
        startDate: '2025-12-01',
            endDate: '2025-12-31'
    }
});
logTest('2.1 GET /admin/departures', depsRes.status === 200);

if (depsRes.data.length > 0) {
    departureId = depsRes.data[0].departureId;
    const depRes = await client.get(`/admin/departures/${departureId}`);
    logTest('2.2 GET /admin/departures/:id', depRes.status === 200);
    logTest('2.3 Departure has maxPax field', depRes.data.maxPax !== undefined);
    logTest('2.4 Departure has currentPax field', depRes.data.currentPax !== undefined);
}
console.log('');

// TEST 3: Bookings Endpoints
console.log('TEST 3: Bookings Endpoints');
const bookingsRes = await client.get('/admin/bookings');
logTest('3.1 GET /admin/bookings', bookingsRes.status === 200);

if (bookingsRes.data.length > 0) {
    bookingId = bookingsRes.data[0].id;
    const bookingRes = await client.get(`/admin/bookings/${bookingId}`);
    logTest('3.2 GET /admin/bookings/:id', bookingRes.status === 200);
    logTest('3.3 Booking has type field', bookingRes.data.type !== undefined);
    logTest('3.4 Booking has pax field', bookingRes.data.pax !== undefined);
    logTest('3.5 Booking has status field', bookingRes.data.status !== undefined);
}
console.log('');

// TEST 4: New Features - Cancellation Logic
console.log('TEST 4: New Features Testing');

// Create a test private booking to verify maxPax = 8
const testBookingRes = await client.post('/admin/bookings', {
    tourId: tourId || toursRes.data[0].id,
    date: '2025-12-28',
    type: 'private',
    pax: 2,
    customer: {
        name: 'Production Test',
        email: 'test@production.com',
        phone: '+1234567890',
        document: 'PROD123'
    }
});

if (testBookingRes.status === 201) {
    const testDepId = testBookingRes.data.departureId;
    const testDepRes = await client.get(`/admin/departures/${testDepId}`);
    logTest('4.1 Private departure created with maxPax=8', testDepRes.data.maxPax === 8);

    const testBookId = testBookingRes.data.bookingId;

    // Test cancellation
    const cancelRes = await client.put(`/admin/bookings/${testBookId}/status`, {
        status: 'cancelled'
    });
    logTest('4.2 Booking cancellation works', cancelRes.status === 200);

    // Test irreversible cancellation
    const uncancelRes = await client.put(`/admin/bookings/${testBookId}/status`, {
        status: 'confirmed'
    });
    logTest('4.3 Cancellation is irreversible', uncancelRes.status === 500 && uncancelRes.data.error.includes('Cannot reactivate'));

    // Check if private departure was cancelled
    const finalDepRes = await client.get(`/admin/departures/${testDepId}`);
    logTest('4.4 Private departure auto-cancelled', finalDepRes.data.status === 'cancelled');

    // Cleanup
    await client.delete(`/admin/departures/${testDepId}`);
}
console.log('');

// TEST 5: Public Endpoints
console.log('TEST 5: Public Endpoints (non-admin)');
const publicToursRes = await axios.get(`${API_URL}/tours`);
logTest('5.1 GET /tours (public)', publicToursRes.status === 200);

const publicDepsRes = await axios.get(`${API_URL}/departures`, {
    params: {
        tourId: tourId || toursRes.data[0].id,
        startDate: '2025-12-01',
        endDate: '2025-12-31'
    }
});
logTest('5.2 GET /departures (public)', publicDepsRes.status === 200);
console.log('');

    } catch (error) {
    console.error('\n❌ TEST SUITE ERROR:');
    console.error('Error:', error.response?.data || error.message);
    results.failed++;
    results.errors.push({ test: 'SUITE', details: error.message });
}

// SUMMARY
console.log('================================================================================');
console.log('TEST SUMMARY');
console.log('================================================================================');
console.log(`✅ Passed: ${results.passed}`);
console.log(`❌ Failed: ${results.failed}`);

if (results.errors.length > 0) {
    console.log('\nFailed Tests:');
    results.errors.forEach(err => {
        console.log(`  - ${err.test}: ${err.details}`);
    });
}
console.log('================================================================================\n');

process.exit(results.failed > 0 ? 1 : 0);
}

testAllEndpoints();
