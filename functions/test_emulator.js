/**
 * Local Emulator Test Script
 * Tests booking endpoints against LOCAL Firebase Emulators
 */

const axios = require('axios');

const API_URL = 'http://localhost:5001/nevadotrektest01/us-central1/api';
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
    console.log('EMULATOR BOOKING ENDPOINTS TEST');
    console.log('='.repeat(80));
    console.log('');

    let tourId, privateDepartureId, publicDepartureId, privateBookingId, publicBookingId1, publicBookingId2;

    try {
        // Wait for emulators to be ready
        await new Promise(resolve => setTimeout(resolve, 3000));

        // ============================================================
        // SETUP: Create Tour
        // ============================================================
        console.log('📋 SETUP: Creating Tour');
        const tourRes = await api.post('/admin/tours', {
            name: { es: 'EMU Test Tour', en: 'EMU Test Tour' },
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
        console.log(`   ✅ Tour created: ${tourId}\n`);

        // ============================================================
        // TEST 1: joinBooking sets type = 'public'
        // ============================================================
        console.log('TEST 1: joinBooking Type Field');

        // Create public departure
        const pubDepRes = await api.post('/admin/departures', {
            tourId,
            date: '2025-12-15',
            type: 'public',
            maxPax: 8
        });
        publicDepartureId = pubDepRes.data.departureId;

        // Join via public endpoint
        const joinRes = await api.post('/public/bookings/join', {
            departureId: publicDepartureId,
            tourId,
            date: '2025-12-15',
            customer: {
                name: 'Public Test',
                email: 'pub@test.com',
                phone: '+123',
                document: '123'
            },
            pax: 1
        });
        publicBookingId1 = joinRes.data.bookingId;

        // Verify type field exists and is 'public'
        const booking1 = await api.get(`/admin/bookings/${publicBookingId1}`);
        logTest('1.1 Public booking has type field', booking1.data.type !== undefined);
        logTest('1.2 Public booking type = PUBLIC', booking1.data.type === 'public', `Got: ${booking1.data.type}`);
        console.log('');

        // ============================================================
        // TEST 2: convertBookingType updates booking.type
        // ============================================================
        console.log('TEST 2: Convert Booking Type Field Update');

        // Convert to private
        await api.post(`/admin/bookings/${publicBookingId1}/convert-type`, {
            targetType: 'private'
        });

        // Verify type changed
        const booking1After = await api.get(`/admin/bookings/${publicBookingId1}`);
        logTest('2.1 Booking type changed to PRIVATE', booking1After.data.type === 'private', `Got: ${booking1After.data.type}`);
        console.log('');

        // ============================================================
        // TEST 3: Price recalculation correct
        // ============================================================
        console.log('TEST 3: Price Recalculation on Tour Update');

        // Create private booking
        const privBookingRes = await api.post('/admin/bookings', {
            tourId,
            date: '2025-12-01',
            type: 'private',
            customer: {
                name: 'Private Test',
                email: 'priv@test.com',
                phone: '+123',
                document: '123'
            },
            pax: 2
        });
        privateBookingId = privBookingRes.data.bookingId;
        privateDepartureId = privBookingRes.data.departureId;

        // Create second tour with different price
        const tour2Res = await api.post('/admin/tours', {
            name: { es: 'EMU Test Tour 2', en: 'EMU Test Tour 2' },
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

        // Update tour
        await api.put(`/admin/departures/${privateDepartureId}/tour`, {
            newTourId: tourId2
        });

        // Verify price
        const privBookingAfter = await api.get(`/admin/bookings/${privateBookingId}`);
        logTest('3.1 Price recalculated correctly', privBookingAfter.data.originalPrice === 180000,
            `Expected 180000, got ${privBookingAfter.data.originalPrice}`);
        console.log('');

    } catch (error) {
        console.error('\n❌ TEST SUITE FAILED:');
        console.error('Error:', error.response?.data || error.message);
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
