const axios = require('axios');

// CONFIGURATION
const API_BASE_URL = 'http://127.0.0.1:5001/nevadotrektest01/us-central1/api';
const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

const client = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'X-Admin-Secret-Key': ADMIN_KEY
    },
    validateStatus: () => true
});

function log(msg, indent = 0) {
    const prefix = '  '.repeat(indent);
    console.log(prefix + msg);
}

function logResult(res, testName) {
    const isSuccess = res.status >= 200 && res.status < 300;
    const icon = isSuccess ? '✅' : '❌';
    log(`${icon} ${testName}: ${res.status} ${res.statusText}`, 1);
    if (!isSuccess) {
        log(`Error: ${JSON.stringify(res.data)}`, 2);
    }
    return isSuccess;
}

async function getDeparture(departureId) {
    const res = await client.get('/admin/departures');
    const departure = res.data.find(d => d.departureId === departureId);
    return departure;
}

async function getBooking(bookingId) {
    // We don't have a get single booking endpoint, so we'll need to check via departure
    return null; // Placeholder
}

async function runComprehensiveTests() {
    log('🚀 COMPREHENSIVE BOOKING LOGIC TESTS');
    log('=====================================\n');

    const state = {
        tourId: null,
        publicDepId: null,
        booking1Id: null,
        booking2Id: null,
        booking3Id: null,
    };

    try {
        // ========================================
        // SETUP: Create Tour
        // ========================================
        log('📦 SETUP: Creating Test Tour');
        const tourRes = await client.post('/admin/tours', {
            name: { en: 'Test Trek', es: 'Trek de Prueba' },
            description: { en: 'Test', es: 'Prueba' },
            type: 'multi-day',
            pricingTiers: [
                { minPax: 1, maxPax: 1, priceCOP: 150000, priceUSD: 45 },
                { minPax: 2, maxPax: 2, priceCOP: 120000, priceUSD: 35 },
                { minPax: 3, maxPax: 3, priceCOP: 100000, priceUSD: 30 },
                { minPax: 4, maxPax: 8, priceCOP: 80000, priceUSD: 25 }
            ],
            isActive: true
        });

        if (!logResult(tourRes, 'Create Tour')) return;
        state.tourId = tourRes.data.tourId;
        log(`Tour ID: ${state.tourId}\n`, 1);

        // ========================================
        // TEST 1: Admin Creates Booking (Always New Departure)
        // ========================================
        log('TEST 1: Admin Booking Creation');
        const date1 = new Date();
        date1.setDate(date1.getDate() + 30);
        const dateStr1 = date1.toISOString().split('T')[0];

        const adminBooking1 = await client.post('/admin/bookings', {
            tourId: state.tourId,
            date: dateStr1,
            pax: 2,
            type: 'public',
            customer: {
                name: 'Admin Test 1',
                email: 'admin1@test.com',
                phone: '+1234567890',
                document: 'DOC001'
            }
        });

        if (!logResult(adminBooking1, 'Admin creates PUBLIC booking')) return;
        state.booking1Id = adminBooking1.data.bookingId;
        const dep1Id = adminBooking1.data.departureId;
        log(`Booking ID: ${state.booking1Id}, Departure ID: ${dep1Id}`, 1);

        // Verify departure was created
        const dep1 = await getDeparture(dep1Id);
        log(`Departure currentPax: ${dep1.currentPax} (expected: 2)`, 1);
        if (dep1.currentPax !== 2) {
            log('❌ FAILED: Departure currentPax should be 2', 1);
            return;
        }

        // Admin creates ANOTHER booking for same date/tour - should create NEW departure
        const adminBooking2 = await client.post('/admin/bookings', {
            tourId: state.tourId,
            date: dateStr1,
            pax: 3,
            type: 'public',
            customer: {
                name: 'Admin Test 2',
                email: 'admin2@test.com',
                phone: '+0987654321',
                document: 'DOC002'
            }
        });

        if (!logResult(adminBooking2, 'Admin creates 2nd booking (should create NEW departure)')) return;
        state.booking2Id = adminBooking2.data.bookingId;
        const dep2Id = adminBooking2.data.departureId;

        if (dep1Id === dep2Id) {
            log('❌ FAILED: Admin should create NEW departure, not join existing', 1);
            return;
        }
        log(`✅ PASSED: Created new departure ${dep2Id} instead of joining ${dep1Id}\n`, 1);

        // Save the first public departure for join tests
        state.publicDepId = dep1Id;

        // ========================================
        // TEST 2: Public User Joins Existing Departure
        // ========================================
        log('TEST 2: Public Join Booking');
        const publicJoin = await client.post('/public/bookings/join', {
            tourId: state.tourId,
            date: dateStr1,
            pax: 2,
            departureId: state.publicDepId,
            customer: {
                name: 'Public Join',
                email: 'public@test.com',
                phone: '+1111111111',
                document: 'DOC003'
            }
        });

        if (!logResult(publicJoin, 'Public joins existing departure')) return;
        state.booking3Id = publicJoin.data.bookingId;

        // Verify departure currentPax increased
        const dep1After = await getDeparture(state.publicDepId);
        log(`Departure currentPax: ${dep1After.currentPax} (expected: 4)`, 1);
        if (dep1After.currentPax !== 4) {
            log('❌ FAILED: Departure currentPax should be 4 (2 + 2)', 1);
            return;
        }
        log('✅ PASSED: Departure capacity updated correctly\n', 1);

        // ========================================
        // TEST 3: Public Creates Private Booking
        // ========================================
        log('TEST 3: Public Private Booking');
        const date2 = new Date();
        date2.setDate(date2.getDate() + 45);
        const dateStr2 = date2.toISOString().split('T')[0];

        const publicPrivate = await client.post('/public/bookings/private', {
            tourId: state.tourId,
            date: dateStr2,
            pax: 4,
            customer: {
                name: 'Private User',
                email: 'private@test.com',
                phone: '+2222222222',
                document: 'DOC004'
            }
        });

        if (!logResult(publicPrivate, 'Public creates private booking')) return;
        const privateDep = await getDeparture(publicPrivate.data.departureId);
        log(`Private departure type: ${privateDep.type}, maxPax: ${privateDep.maxPax}`, 1);
        if (privateDep.type !== 'private' || privateDep.maxPax !== 99) {
            log('❌ FAILED: Should create private departure with maxPax 99', 1);
            return;
        }
        log('✅ PASSED: Private departure created correctly\n', 1);

        // ========================================
        // TEST 4: Update Booking Status (Cascade)
        // ========================================
        log('TEST 4: Update Booking Status (Cascade Effects)');

        // Cancel booking
        const cancelRes = await client.put(`/admin/bookings/${state.booking3Id}/status`, {
            status: 'cancelled'
        });
        if (!logResult(cancelRes, 'Cancel booking')) return;

        // Verify departure currentPax decreased
        const depAfterCancel = await getDeparture(state.publicDepId);
        log(`Departure currentPax after cancel: ${depAfterCancel.currentPax} (expected: 2)`, 1);
        if (depAfterCancel.currentPax !== 2) {
            log('❌ FAILED: Departure should decrement by 2 when booking cancelled', 1);
            return;
        }

        // Un-cancel booking
        const uncancelRes = await client.put(`/admin/bookings/${state.booking3Id}/status`, {
            status: 'confirmed'
        });
        if (!logResult(uncancelRes, 'Un-cancel booking')) return;

        // Verify departure currentPax increased
        const depAfterUncancel = await getDeparture(state.publicDepId);
        log(`Departure currentPax after un-cancel: ${depAfterUncancel.currentPax} (expected: 4)`, 1);
        if (depAfterUncancel.currentPax !== 4) {
            log('❌ FAILED: Departure should increment by 2 when booking un-cancelled', 1);
            return;
        }
        log('✅ PASSED: Status changes cascade correctly\n', 1);

        // ========================================
        // TEST 5: Update Booking Pax (Cascade)
        // ========================================
        log('TEST 5: Update Booking Pax (Cascade Effects)');

        // Increase pax from 2 to 3
        const paxRes = await client.put(`/admin/bookings/${state.booking1Id}/pax`, {
            pax: 3
        });
        if (!logResult(paxRes, 'Increase pax from 2 to 3')) return;

        // Verify departure currentPax increased
        const depAfterPaxIncrease = await getDeparture(state.publicDepId);
        log(`Departure currentPax after pax increase: ${depAfterPaxIncrease.currentPax} (expected: 5)`, 1);
        if (depAfterPaxIncrease.currentPax !== 5) {
            log('❌ FAILED: Departure should increase by 1 (diff)', 1);
            return;
        }
        log('✅ PASSED: Pax increase cascades correctly\n', 1);

        // ========================================
        // TEST 6: Update Booking Details (No Cascade)
        // ========================================
        log('TEST 6: Update Booking Details (No Cascade)');

        const detailsRes = await client.put(`/admin/bookings/${state.booking1Id}/details`, {
            customer: {
                name: 'Updated Name',
                email: 'updated@test.com',
                phone: '+9999999999',
                document: 'NEWDOC'
            }
        });
        if (!logResult(detailsRes, 'Update customer details')) return;

        // Verify departure currentPax unchanged
        const depAfterDetails = await getDeparture(state.publicDepId);
        if (depAfterDetails.currentPax !== 5) {
            log('❌ FAILED: Departure currentPax should not change when updating details', 1);
            return;
        }
        log('✅ PASSED: Details update does not cascade\n', 1);

        // ========================================
        // TEST 7: Convert Booking Type
        // ========================================
        log('TEST 7: Convert Booking Type');

        // Convert booking in public departure (with others) to private
        const convertRes = await client.post(`/admin/bookings/${state.booking1Id}/convert-type`);
        if (!logResult(convertRes, 'Convert public booking to private (split)')) return;

        log(`Scenario: ${convertRes.data.scenario}`, 1);
        if (convertRes.data.scenario !== 'public_to_private_split') {
            log('❌ FAILED: Should split to new private departure', 1);
            return;
        }

        // Verify old departure decremented
        const depAfterSplit = await getDeparture(state.publicDepId);
        log(`Old departure currentPax: ${depAfterSplit.currentPax} (expected: 2)`, 1);
        if (depAfterSplit.currentPax !== 2) {
            log('❌ FAILED: Old departure should have 2 pax remaining', 1);
            return;
        }

        // Verify new departure created
        const newDepId = convertRes.data.newDepartureId;
        const newDep = await getDeparture(newDepId);
        log(`New departure type: ${newDep.type}, currentPax: ${newDep.currentPax}`, 1);
        if (newDep.type !== 'private' || newDep.currentPax !== 3) {
            log('❌ FAILED: New departure should be private with 3 pax', 1);
            return;
        }
        log('✅ PASSED: Type conversion works correctly\n', 1);

        // ========================================
        // TEST 8: Capacity Validation
        // ========================================
        log('TEST 8: Capacity Validation');

        // Try to join a departure that would exceed capacity
        const fullDepRes = await client.post('/public/bookings/join', {
            tourId: state.tourId,
            date: dateStr1,
            pax: 10, // Way over limit
            departureId: state.publicDepId,
            customer: {
                name: 'Overflow Test',
                email: 'overflow@test.com',
                phone: '+3333333333',
                document: 'DOC999'
            }
        });

        if (fullDepRes.status === 500 && fullDepRes.data.error.includes('Insufficient capacity')) {
            log('✅ PASSED: Capacity validation works', 1);
        } else {
            log('❌ FAILED: Should reject booking that exceeds capacity', 1);
            return;
        }

        log('\n=====================================');
        log('✅ ALL TESTS PASSED!');
        log('=====================================');

    } catch (error) {
        console.error('Test failed with error:', error.message);
    }
}

runComprehensiveTests().catch(console.error);
