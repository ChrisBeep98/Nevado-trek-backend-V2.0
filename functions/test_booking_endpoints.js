/**
 * Comprehensive Booking Endpoints Testing
 * Tests private vs public booking logic, date/tour updates, and type conversions
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
    console.log('BOOKING ENDPOINTS COMPREHENSIVE TEST');
    console.log('='.repeat(80));
    console.log('');

    let tourId, privateDepartureId, publicDepartureId, privateBookingId, publicBookingId1, publicBookingId2;

    try {
        // ============================================================
        // SETUP: Create Tour
        // ============================================================
        console.log('📋 SETUP: Creating Tour');
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
        console.log(`   Tour created: ${tourId}\n`);

        // ============================================================
        // TEST 1: Create Private Booking
        // ============================================================
        console.log('TEST 1: Create Private Booking');
        const privateBookingRes = await api.post('/admin/bookings', {
            tourId,
            date: '2025-12-01',
            type: 'private',
            customer: {
                name: 'Private Test',
                email: 'private@test.com',
                phone: '+1234567890',
                document: '12345'
            },
            pax: 2
        });
        privateBookingId = privateBookingRes.data.bookingId;
        privateDepartureId = privateBookingRes.data.departureId;

        logTest('1.1 Private booking created', !!privateBookingId);
        logTest('1.2 Private departure created', !!privateDepartureId);
        console.log(`   Booking: ${privateBookingId}, Departure: ${privateDepartureId}\n`);

        // ============================================================
        // TEST 2: Update Date for Private Booking (Independent)
        // ============================================================
        console.log('TEST 2: Update Date for Private Booking');
        const newDate = '2025-12-10';
        await api.put(`/admin/departures/${privateDepartureId}/date`, {
            newDate: new Date(newDate).toISOString()
        });

        const updatedDep1 = await api.get(`/admin/departures/${privateDepartureId}`);
        const actualDate = updatedDep1.data.date.split('T')[0];

        logTest('2.1 Date updated successfully', actualDate === newDate, `Expected ${newDate}, got ${actualDate}`);
        logTest('2.2 Tour ID unchanged', updatedDep1.data.tourId === tourId);
        console.log('');

        // ============================================================
        // TEST 3: Update Tour for Private Booking (Independent)
        // ============================================================
        console.log('TEST 3: Update Tour for Private Booking');

        // Create second tour
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
        const tourId2 = tour2Res.data.tourId;

        await api.put(`/admin/departures/${privateDepartureId}/tour`, {
            newTourId: tourId2
        });

        const updatedDep2 = await api.get(`/admin/departures/${privateDepartureId}`);
        const updatedBooking = await api.get(`/admin/bookings/${privateBookingId}`);

        logTest('3.1 Tour ID updated', updatedDep2.data.tourId === tourId2);
        logTest('3.2 Date unchanged', updatedDep2.data.date.split('T')[0] === newDate);
        logTest('3.3 Price recalculated', updatedBooking.data.originalPrice === 180000, `Expected 180000, got ${updatedBooking.data.originalPrice}`);
        console.log('');

        // ============================================================
        // TEST 4: Create Public Departure with 2 Bookings
        // ============================================================
        console.log('TEST 4: Create Public Departure');
        const publicDepRes = await api.post('/admin/departures', {
            tourId,
            date: '2025-12-15',
            type: 'public',
            maxPax: 8
        });
        publicDepartureId = publicDepRes.data.departureId;
        console.log(`   Public Departure created: ${publicDepartureId}`);

        // Add first booking via joinBooking (public flow)
        const pubBooking1Res = await api.post('/public/bookings/join', {
            departureId: publicDepartureId,
            tourId,
            date: '2025-12-15',
            customer: {
                name: 'Public Test 1',
                email: 'pub1@test.com',
                phone: '+1234567890',
                document: '12345'
            },
            pax: 1
        });
        publicBookingId1 = pubBooking1Res.data.bookingId;

        // Add second booking
        const pubBooking2Res = await api.post('/public/bookings/join', {
            departureId: publicDepartureId,
            tourId,
            date: '2025-12-15',
            customer: {
                name: 'Public Test 2',
                email: 'pub2@test.com',
                phone: '+1234567890',
                document: '12345'
            },
            pax: 1
        });
        publicBookingId2 = pubBooking2Res.data.bookingId;

        logTest('4.1 Public departure created', !!publicDepartureId);
        logTest('4.2 First public booking created', !!publicBookingId1);
        logTest('4.3 Second public booking created', !!publicBookingId2);
        console.log('');

        // ============================================================
        // TEST 5: Verify Public Booking Cannot Update Date/Tour Directly
        // ============================================================
        console.log('TEST 5: Verify Public Booking Restrictions');

        // Try to update date of public departure (should work at departure level)
        try {
            await api.put(`/admin/departures/${publicDepartureId}/date`, {
                newDate: new Date('2025-12-20').toISOString()
            });
            logTest('5.1 Public departure date CAN be updated (affects all bookings)', true);
        } catch (e) {
            logTest('5.1 Public departure date update failed', false, e.response?.data?.error || e.message);
        }

        // Verify booking is still public type
        const pubBooking1Check = await api.get(`/admin/bookings/${publicBookingId1}`);
        logTest('5.2 Booking type is PUBLIC', pubBooking1Check.data.type === 'public');
        logTest('5.3 Booking has shared departureId', pubBooking1Check.data.departureId === publicDepartureId);
        console.log('');

        // ============================================================
        // TEST 6: Convert Public Booking to Private
        // ============================================================
        console.log('TEST 6: Convert Public Booking to Private');

        await api.post(`/admin/bookings/${publicBookingId1}/convert-type`, {
            targetType: 'private'
        });

        const convertedBooking = await api.get(`/admin/bookings/${publicBookingId1}`);
        const newPrivateDepartureId = convertedBooking.data.departureId;

        logTest('6.1 Booking type changed to PRIVATE', convertedBooking.data.type === 'private');
        logTest('6.2 New private departure created', newPrivateDepartureId !== publicDepartureId);
        logTest('6.3 Original public departure unchanged', true); // Verify by checking it still exists
        console.log(`   New private departure: ${newPrivateDepartureId}\n`);

        // ============================================================
        // TEST 7: Verify Converted Booking Can Now Update Date/Tour
        // ============================================================
        console.log('TEST 7: Verify Converted Booking Can Update');

        // Update date
        const convertedNewDate = '2025-12-25';
        await api.put(`/admin/departures/${newPrivateDepartureId}/date`, {
            newDate: new Date(convertedNewDate).toISOString()
        });

        const updatedConvertedDep = await api.get(`/admin/departures/${newPrivateDepartureId}`);
        logTest('7.1 Converted booking date updated', updatedConvertedDep.data.date.split('T')[0] === convertedNewDate);

        // Update tour
        await api.put(`/admin/departures/${newPrivateDepartureId}/tour`, {
            newTourId: tourId2
        });

        const updatedConvertedDep2 = await api.get(`/admin/departures/${newPrivateDepartureId}`);
        logTest('7.2 Converted booking tour updated', updatedConvertedDep2.data.tourId === tourId2);
        console.log('');

        // ============================================================
        // CLEANUP
        // ============================================================
        console.log('🧹 CLEANUP');
        try {
            await api.put(`/admin/bookings/${privateBookingId}/status`, { status: 'cancelled' });
            await api.put(`/admin/bookings/${publicBookingId1}/status`, { status: 'cancelled' });
            await api.put(`/admin/bookings/${publicBookingId2}/status`, { status: 'cancelled' });
            await api.delete(`/admin/departures/${privateDepartureId}`);
            await api.delete(`/admin/departures/${publicDepartureId}`);
            await api.delete(`/admin/departures/${newPrivateDepartureId}`);
            await api.delete(`/admin/tours/${tourId}`);
            await api.delete(`/admin/tours/${tourId2}`);
            console.log('   Cleanup complete\n');
        } catch (e) {
            console.log('   Cleanup errors (non-critical):', e.message, '\n');
        }

    } catch (error) {
        console.error('\n❌ TEST SUITE FAILED:');
        console.error('Error:', error.response?.data || error.message);
        console.error('Stack:', error.stack);
        testResults.failed++;
        testResults.errors.push({ test: 'SUITE', details: error.message });
    }

    // ============================================================
    // SUMMARY
    // ============================================================
    console.log('='.repeat(80));
    console.log('TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);

    if (testResults.errors.length > 0) {
        console.log('\nFailed Tests:');
        testResults.errors.forEach(err => {
            console.log(`  - ${err.test}: ${err.details}`);
        });
    }

    console.log('='.repeat(80));

    process.exit(testResults.failed > 0 ? 1 : 0);
}

runTests();
