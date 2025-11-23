/**
 * Complex Scenarios Verification
 * Tests conversions, split logic, pax updates, and date/tour independence
 * Run against Firebase Emulators
 */

const axios = require('axios');

const API_URL = 'https://api-wgfhwjbpva-uc.a.run.app';
const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

const api = axios.create({
    baseURL: API_URL,
    headers: { 'X-Admin-Secret-Key': ADMIN_KEY }
});

let testResults = {
    passed: 0,
    failed: 0,
    errors: []
};

function logTest(name, passed, details = '') {
    if (passed) {
        console.log(`✅ ${name}`);
        testResults.passed++;
    } else {
        console.log(`❌ ${name}${details ? ': ' + details : ''}`);
        testResults.failed++;
        testResults.errors.push({ test: name, details });
    }
}

async function runTests() {
    console.log('='.repeat(80));
    console.log('COMPLEX SCENARIOS VERIFICATION');
    console.log('='.repeat(80));
    console.log('');

    let tourId, tourId2, privateDepartureId, publicDepartureId, privateBookingId, publicBookingId1, publicBookingId2;

    try {
        // ============================================================
        // SETUP: Create Tours
        // ============================================================
        console.log('📋 SETUP: Creating Tours');
        const tourRes = await api.post('/admin/tours', {
            name: { es: 'Test Tour', en: 'Test Tour' },
            description: { es: 'Test', en: 'Test' },
            type: 'single-day',
            totalDays: 1,
            difficulty: 'easy',
            pricingTiers: [
                { minPax: 1, maxPax: 1, priceCOP: 100000, priceUSD: 30 },
                { minPax: 2, maxPax: 2, priceCOP: 90000, priceUSD: 25 },
                { minPax: 3, maxPax: 3, priceCOP: 80000, priceUSD: 20 },
                { minPax: 4, maxPax: 8, priceCOP: 70000, priceUSD: 15 }
            ],
            isActive: true,
            temperature: 20,
            distance: 10,
            altitude: { es: '100m', en: '100m' },
            location: { es: 'Test', en: 'Test' },
            faqs: [],
            recommendations: [],
            inclusions: [],
            exclusions: []
        });
        tourId = tourRes.data.tourId;

        const tour2Res = await api.post('/admin/tours', {
            name: { es: 'Test Tour 2', en: 'Test Tour 2' },
            description: { es: 'Test', en: 'Test' },
            type: 'single-day',
            totalDays: 1,
            difficulty: 'easy',
            pricingTiers: [
                { minPax: 1, maxPax: 1, priceCOP: 200000, priceUSD: 60 },
                { minPax: 2, maxPax: 2, priceCOP: 180000, priceUSD: 50 },
                { minPax: 3, maxPax: 3, priceCOP: 160000, priceUSD: 40 },
                { minPax: 4, maxPax: 8, priceCOP: 140000, priceUSD: 30 }
            ],
            isActive: true,
            temperature: 20,
            distance: 10,
            altitude: { es: '100m', en: '100m' },
            location: { es: 'Test', en: 'Test' },
            faqs: [],
            recommendations: [],
            inclusions: [],
            exclusions: []
        });
        tourId2 = tour2Res.data.tourId;
        console.log(`   Tours created: ${tourId}, ${tourId2}\n`);

        // ============================================================
        // TEST 1: Pax Updates & Capacity
        // ============================================================
        console.log('TEST 1: Pax Updates & Capacity');

        // Create Public Departure
        const publicDepRes = await api.post('/admin/departures', {
            tourId,
            date: '2025-12-15',
            type: 'public',
            maxPax: 8
        });
        publicDepartureId = publicDepRes.data.departureId;

        // Join Booking (2 pax)
        const pubBooking1Res = await api.post('/public/bookings/join', {
            departureId: publicDepartureId,
            tourId,
            date: '2025-12-15',
            customer: { name: 'Pax Test', email: 'pax@test.com', phone: '+123', document: '123' },
            pax: 2
        });
        publicBookingId1 = pubBooking1Res.data.bookingId;

        let depCheck = await api.get(`/admin/departures/${publicDepartureId}`);
        logTest('1.1 Initial capacity correct', depCheck.data.currentPax === 2, `Expected 2, got ${depCheck.data.currentPax}`);

        // Update Pax to 4 (+2)
        await api.put(`/admin/bookings/${publicBookingId1}/pax`, { pax: 4 });

        depCheck = await api.get(`/admin/departures/${publicDepartureId}`);
        logTest('1.2 Capacity increased correctly', depCheck.data.currentPax === 4, `Expected 4, got ${depCheck.data.currentPax}`);

        // Update Pax to 1 (-3)
        await api.put(`/admin/bookings/${publicBookingId1}/pax`, { pax: 1 });

        depCheck = await api.get(`/admin/departures/${publicDepartureId}`);
        logTest('1.3 Capacity decreased correctly', depCheck.data.currentPax === 1, `Expected 1, got ${depCheck.data.currentPax}`);
        console.log('');

        // ============================================================
        // TEST 2: Public -> Private Conversion (Split Logic)
        // ============================================================
        console.log('TEST 2: Public -> Private Conversion (Split Logic)');

        // Add second booking to public departure (1 pax)
        const pubBooking2Res = await api.post('/public/bookings/join', {
            departureId: publicDepartureId,
            tourId,
            date: '2025-12-15',
            customer: { name: 'Split Test', email: 'split@test.com', phone: '+123', document: '123' },
            pax: 1
        });
        publicBookingId2 = pubBooking2Res.data.bookingId;

        depCheck = await api.get(`/admin/departures/${publicDepartureId}`);
        logTest('2.1 Pre-split capacity correct', depCheck.data.currentPax === 2, `Expected 2, got ${depCheck.data.currentPax}`);

        // Convert Booking 2 to Private
        await api.post(`/admin/bookings/${publicBookingId2}/convert-type`, { targetType: 'private' });

        const booking2Check = await api.get(`/admin/bookings/${publicBookingId2}`);
        const newPrivateDepId = booking2Check.data.departureId;

        depCheck = await api.get(`/admin/departures/${publicDepartureId}`);
        const newDepCheck = await api.get(`/admin/departures/${newPrivateDepId}`);

        logTest('2.2 Original departure capacity reduced', depCheck.data.currentPax === 1, `Expected 1, got ${depCheck.data.currentPax}`);
        logTest('2.3 New private departure created', !!newPrivateDepId && newPrivateDepId !== publicDepartureId);
        logTest('2.4 New departure capacity correct', newDepCheck.data.currentPax === 1, `Expected 1, got ${newDepCheck.data.currentPax}`);
        logTest('2.5 New departure type is private', newDepCheck.data.type === 'private');
        console.log('');

        // ============================================================
        // TEST 3: Private -> Public Conversion
        // ============================================================
        console.log('TEST 3: Private -> Public Conversion');

        // Convert the NEW private departure back to public
        // We can do this by converting the booking back to public
        await api.post(`/admin/bookings/${publicBookingId2}/convert-type`, { targetType: 'public' });

        const booking2CheckBack = await api.get(`/admin/bookings/${publicBookingId2}`);
        const finalDepId = booking2CheckBack.data.departureId;
        const finalDepCheck = await api.get(`/admin/departures/${finalDepId}`);

        logTest('3.1 Converted back to public', booking2CheckBack.data.type === 'public');
        logTest('3.2 Departure type updated to public', finalDepCheck.data.type === 'public');
        logTest('3.3 Max pax updated to 8', finalDepCheck.data.maxPax === 8);
        console.log('');

        // ============================================================
        // TEST 4: Date/Tour Updates (Private vs Public)
        // ============================================================
        console.log('TEST 4: Date/Tour Updates');

        // 4.1 Private: Update Date (Independent)
        // Create new private booking
        const privBookingRes = await api.post('/admin/bookings', {
            tourId,
            date: '2025-12-01',
            type: 'private',
            customer: { name: 'Priv Test', email: 'priv@test.com', phone: '+123', document: '123' },
            pax: 2
        });
        privateBookingId = privBookingRes.data.bookingId;
        privateDepartureId = privBookingRes.data.departureId;

        const newDate = '2025-12-10';
        await api.put(`/admin/departures/${privateDepartureId}/date`, { newDate: new Date(newDate).toISOString() });

        let privDepCheck = await api.get(`/admin/departures/${privateDepartureId}`);
        logTest('4.1 Private date updated', privDepCheck.data.date.split('T')[0] === newDate);

        // 4.2 Private: Update Tour (Independent)
        await api.put(`/admin/departures/${privateDepartureId}/tour`, { newTourId: tourId2 });
        privDepCheck = await api.get(`/admin/departures/${privateDepartureId}`);
        logTest('4.2 Private tour updated', privDepCheck.data.tourId === tourId2);

        // 4.3 Public: Update Date (Affects All)
        // Use the public departure from Test 1 (which has 1 booking left: publicBookingId1)
        const publicNewDate = '2025-12-20';
        await api.put(`/admin/departures/${publicDepartureId}/date`, { newDate: new Date(publicNewDate).toISOString() });

        const pubDepCheck = await api.get(`/admin/departures/${publicDepartureId}`);
        logTest('4.3 Public date updated', pubDepCheck.data.date.split('T')[0] === publicNewDate);

        // Verify booking still linked
        const pubBookingCheck = await api.get(`/admin/bookings/${publicBookingId1}`);
        logTest('4.4 Booking still linked after date update', pubBookingCheck.data.departureId === publicDepartureId);
        console.log('');

        // ============================================================================
        // TEST 5: Move Booking & Ghost Departure Check
        // ============================================================================
        console.log('TEST 5: Move Booking & Ghost Departure Check');

        // 5.1 Create a private booking
        const ghostRes = await api.post('/admin/bookings', {
            tourId,
            date: '2025-12-25',
            type: 'private',
            customer: {
                name: 'Ghost Hunter',
                email: 'ghost@test.com',
                phone: '+1234567890',
                document: 'GHOST123'
            },
            pax: 2
        });
        const ghostBookingId = ghostRes.data.bookingId;
        const ghostDepId = ghostRes.data.departureId;
        logTest('5.1 Private booking created', !!ghostBookingId);

        // 5.2 Move this booking to a new date
        await api.post(`/admin/bookings/${ghostBookingId}/move`, {
            newTourId: tourId,
            newDate: '2025-12-31'
        });

        // 5.3 Check Old Departure
        try {
            const oldDep = await api.get(`/admin/departures/${ghostDepId}`);
            if (oldDep.data.currentPax === 0) {
                logTest('5.3 Old departure is empty (Ghost Departure)', true);
                console.warn('   ⚠️ Warning: Old departure exists with 0 pax. Should it be deleted?');
            } else {
                logTest('5.3 Old departure still has pax (Unexpected)', false);
            }
        } catch (e) {
            if (e.response && e.response.status === 404) {
                logTest('5.3 Old departure deleted (Clean)', true);
            } else {
                console.error(e);
            }
        }

        // 5.4 Check New Departure
        const movedBooking = await api.get(`/admin/bookings/${ghostBookingId}`);
        const newMovedDepId = movedBooking.data.departureId;
        logTest('5.4 Booking moved to new departure', newMovedDepId !== ghostDepId);
        console.log('');

    } catch (error) {
        console.error('\n❌ TEST SUITE FAILED:');
        console.error('Error:', error.response?.data || error.message);
        testResults.failed++;
        testResults.errors.push({ test: 'SUITE', details: error.message });
    }

    // Summary
    console.log('='.repeat(80));
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log('='.repeat(80));

    // Cleanup (Best effort)
    try {
        if (tourId) await api.delete(`/admin/tours/${tourId}`);
        if (tourId2) await api.delete(`/admin/tours/${tourId2}`);
        // Departures/Bookings cleaned up by cascade or manual delete if needed, but for test script we can leave them or add delete logic.
        // Adding basic cleanup
        if (publicDepartureId) await api.delete(`/admin/departures/${publicDepartureId}`);
        if (privateDepartureId) await api.delete(`/admin/departures/${privateDepartureId}`);
    } catch (e) { }

    process.exit(testResults.failed > 0 ? 1 : 0);
}

runTests();
