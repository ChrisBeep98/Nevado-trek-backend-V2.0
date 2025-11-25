/**
 * COMPREHENSIVE BACKEND TEST
 * Tests all booking functionality including type field and capacity management
 */

const axios = require('axios');

// Emulator URL
const BASE_URL = 'http://127.0.0.1:5001/nevadotrektest01/us-central1/api';
const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

const headers = {
    'Content-Type': 'application/json',
    'X-Admin-Secret-Key': ADMIN_KEY,
};

// Test results tracker
const results = {
    passed: 0,
    failed: 0,
    tests: [],
};

function logTest(name, passed, details = '') {
    results.tests.push({ name, passed, details });
    if (passed) {
        console.log(`✅ ${name}`);
        results.passed++;
    } else {
        console.log(`❌ ${name}`);
        console.log(`   ${details}`);
        results.failed++;
    }
}

async function runTests() {
    console.log('\n🧪 COMPREHENSIVE BACKEND TESTING\n');
    console.log('Testing booking type field + capacity management\n');

    let tourId, departureId, bookingId;

    try {
        { minPax: 6, maxPax: 15, priceCOP: 500000 },
                ],
        isActive: true,
            },
    { headers }
        );
    tourId = tourRes.data.tourId;
    logTest('Create Tour', !!tourId, `Tour ID: ${tourId}`);

    // ========================================
    // TEST 2: Create PRIVATE Booking (with type field)
    // ========================================
    console.log('\n📝 TEST 2: Create Private Booking with type field');
    const bookingRes = await axios.post(
        `${BASE_URL}/admin/bookings`,
        {
            tourId,
            date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            type: 'private', // CRITICAL: Testing type field
            pax: 2,
            customer: {
                name: 'Test Customer',
                email: 'test@test.com',
                phone: '+123456789',
                document: '123456',
            },
        },
        { headers }
    );
    bookingId = bookingRes.data.bookingId;
    departureId = bookingRes.data.departureId;
    logTest('Create Private Booking', !!bookingId && !!departureId);

    // ========================================
    // TEST 3: Verify type field in booking
    // ========================================
    console.log('\n📝 TEST 3: Verify booking has type=private');
    const getBookingRes = await axios.get(`${BASE_URL}/admin/bookings/${bookingId}`, { headers });
    const booking = getBookingRes.data;
    logTest(
        'Booking has type field',
        booking.type === 'private',
        `Expected: private, Got: ${booking.type}`
    );

    // ========================================
    // TEST 4: Verify departure was created
    // ========================================
    console.log('\n📝 TEST 4: Verify departure created with correct capacity');
    const getDepRes = await axios.get(`${BASE_URL}/admin/departures/${departureId}`, { headers });
    const departure = getDepRes.data;
    logTest(
        'Departure currentPax matches booking',
        departure.currentPax === 2,
        `Expected: 2, Got: ${departure.currentPax}`
    );

    // ========================================
    // TEST 5: Update pax and verify capacity updates
    // ========================================
    console.log('\n📝 TEST 5: Update pax from 2 to 4 and verify capacity');
    await axios.put(
        `${BASE_URL}/admin/bookings/${bookingId}/pax`,
        { pax: 4 },
        { headers }
    );

    const getDepRes2 = await axios.get(`${BASE_URL}/admin/departures/${departureId}`, { headers });
    const departure2 = getDepRes2.data;
    logTest(
        'Departure currentPax updated correctly',
        departure2.currentPax === 4,
        `Expected: 4, Got: ${departure2.currentPax}`
    );

    // ========================================
    // TEST 6: Verify price recalculated
    // ========================================
    console.log('\n📝 TEST 6: Verify price recalculated for new tier');
    const getBookingRes2 = await axios.get(`${BASE_URL}/admin/bookings/${bookingId}`, { headers });
    const booking2 = getBookingRes2.data;
    logTest(
        'Price recalculated to tier 3-5',
        booking2.originalPrice === 250000,
        `Expected: 250000, Got: ${booking2.originalPrice}`
    );

    // ========================================
    // TEST 7: Test capacity limit (should fail)
    // ========================================
    console.log('\n📝 TEST 7: Test capacity limit error message');
    try {
        // Try to increase pax beyond maxPax (99 for private)
        await axios.put(
            `${BASE_URL}/admin/bookings/${bookingId}/pax`,
            { pax: 100 },
            { headers }
        );
        logTest('Capacity limit validation', false, 'Should have thrown error');
    } catch (error) {
        const hasMessage = error.response?.data?.error?.includes('Insufficient capacity');
        logTest(
            'Capacity limit with error message',
            hasMessage,
            `Error: ${error.response?.data?.error}`
        );
    }

    // ========================================
    // TEST 8: Create PUBLIC Booking
    // ========================================
    console.log('\n📝 TEST 8: Create Public Booking with type field');
    const publicBookingRes = await axios.post(
        `${BASE_URL}/admin/bookings`,
        {
            tourId,
            date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            type: 'public', // PUBLIC
            pax: 3,
            customer: {
                name: 'Public Customer',
                email: 'public@test.com',
                phone: '+987654321',
                document: '789012',
            },
        },
        { headers }
    );
    const publicBookingId = publicBookingRes.data.bookingId;
    const publicDepartureId = publicBookingRes.data.departureId;

    const getPublicBookingRes = await axios.get(
        `${BASE_URL}/admin/bookings/${publicBookingId}`,
        { headers }
    );
    const publicBooking = getPublicBookingRes.data;
    logTest(
        'Public booking has type=public',
        publicBooking.type === 'public',
        `Expected: public, Got: ${publicBooking.type}`
    );

    // ========================================
    // TEST 9: Join existing public departure
    // ========================================
    console.log('\n📝 TEST 9: Join existing public departure');
    const joinRes = await axios.post(
        `${BASE_URL}/public/bookings/join`,
        {
            departureId: publicDepartureId,
            pax: 2,
            customer: {
                name: 'Joiner Customer',
                email: 'joiner@test.com',
                phone: '+111222333',
                document: '111222',
            },
        },
        { headers }
    );
    const joinedBookingId = joinRes.data.bookingId;

    const getJoinedBookingRes = await axios.get(
        `${BASE_URL}/admin/bookings/${joinedBookingId}`,
        { headers }
    );
    const joinedBooking = getJoinedBookingRes.data;
    logTest(
        'Joined booking has type=public',
        joinedBooking.type === 'public',
        `Expected: public, Got: ${joinedBooking.type}`
    );

    // ========================================
    // TEST 10: Verify capacity after join
    // ========================================
    console.log('\n📝 TEST 10: Verify capacity after joining');
    const getPublicDepRes = await axios.get(
        `${BASE_URL}/admin/departures/${publicDepartureId}`,
        { headers }
    );
    const publicDeparture = getPublicDepRes.data;
    logTest(
        'Public departure capacity = 5 (3+2)',
        publicDeparture.currentPax === 5,
        `Expected: 5, Got: ${publicDeparture.currentPax}`
    );

} catch (error) {
    console.error('\n❌ Test suite error:', error.response?.data || error.message);
    process.exit(1);
}

// ========================================
// SUMMARY
// ========================================
console.log('\n' + '='.repeat(50));
console.log('📊 TEST RESULTS SUMMARY');
console.log('='.repeat(50));
console.log(`✅ Passed: ${results.passed}`);
console.log(`❌ Failed: ${results.failed}`);
console.log(`📝 Total: ${results.tests.length}`);

if (results.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.tests
        .filter((t) => !t.passed)
        .forEach((t) => console.log(`   - ${t.name}: ${t.details}`));
    process.exit(1);
} else {
    console.log('\n🎉 ALL TESTS PASSED!');
    process.exit(0);
}
}

// Run tests
runTests().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
