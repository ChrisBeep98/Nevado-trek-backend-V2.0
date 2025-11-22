import axios from 'axios';

const API_URL = 'https://api-wgfhwjbpva-uc.a.run.app';
const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

const api = axios.create({
    baseURL: API_URL,
    headers: { 'X-Admin-Secret-Key': ADMIN_KEY }
});

async function runTest() {
    try {
        console.log('1. Creating Tour...');
        const tourRes = await api.post('/admin/tours', {
            name: { es: 'Test Tour', en: 'Test Tour' },
            description: { es: 'Desc', en: 'Desc' },
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
            location: { es: 'Loc', en: 'Loc' },
            faqs: [],
            recommendations: [],
            inclusions: [],
            exclusions: []
        });
        const tourId = tourRes.data.tourId;
        console.log('Tour created:', tourId);

        console.log('2. Creating Private Departure (Initial)...');
        const depRes = await api.post('/admin/departures', {
            tourId,
            date: new Date().toISOString().split('T')[0],
            type: 'private',
            maxPax: 10
        });
        const initialDepartureId = depRes.data.departureId;
        console.log('Initial Departure created:', initialDepartureId);

        console.log('3. Creating Booking (Creates NEW Departure)...');
        const bookingRes = await api.post('/admin/bookings', {
            tourId,
            date: new Date().toISOString().split('T')[0],
            type: 'private',
            customer: {
                name: 'Backend Test',
                email: 'test@test.com',
                phone: '+1234567890',
                document: '123456'
            },
            pax: 2
        });
        const bookingId = bookingRes.data.bookingId;
        // IMPORTANT: Use the departure created by the booking!
        const bookingDepartureId = bookingRes.data.departureId;
        console.log('Booking created:', bookingId, 'Departure created:', bookingDepartureId);

        console.log('4. Updating Date (Private)...');
        const newDate = new Date();
        newDate.setDate(newDate.getDate() + 10);
        await api.put(`/admin/departures/${bookingDepartureId}/date`, {
            newDate: newDate.toISOString()
        });
        console.log('Date updated successfully');

        console.log('5. Verifying Date Update...');
        const updatedDep = await api.get(`/admin/departures/${bookingDepartureId}`);
        const serverDate = new Date(updatedDep.data.date).toISOString().split('T')[0];
        const expectedDate = newDate.toISOString().split('T')[0];

        if (serverDate === expectedDate) {
            console.log('✅ Date verification PASSED');
        } else {
            console.error('❌ Date verification FAILED', { serverDate, expectedDate });
        }

        console.log('6. Creating Second Tour...');
        const tour2Res = await api.post('/admin/tours', {
            name: { es: 'Test Tour 2', en: 'Test Tour 2' },
            description: { es: 'Desc', en: 'Desc' },
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
            location: { es: 'Loc', en: 'Loc' },
            faqs: [],
            recommendations: [],
            inclusions: [],
            exclusions: []
        });
        const tourId2 = tour2Res.data.tourId;
        console.log('Tour 2 created:', tourId2);

        console.log('7. Updating Tour...');
        await api.put(`/admin/departures/${bookingDepartureId}/tour`, {
            newTourId: tourId2
        });
        console.log('Tour updated successfully');

        console.log('8. Verifying Tour Update & Price Recalculation...');
        const updatedDep2 = await api.get(`/admin/departures/${bookingDepartureId}`);
        const updatedBooking = await api.get(`/admin/bookings/${bookingId}`);

        if (updatedDep2.data.tourId === tourId2) {
            console.log('✅ Tour ID verification PASSED');
        } else {
            console.error('❌ Tour ID verification FAILED');
        }

        // Price check: 2 pax * 180000 = 360000
        if (updatedBooking.data.originalPrice === 360000) {
            console.log('✅ Price recalculation verification PASSED');
        } else {
            console.error('❌ Price recalculation verification FAILED', updatedBooking.data.originalPrice);
        }

        console.log('9. Cleanup...');
        try {
            await api.put(`/admin/bookings/${bookingId}/status`, { status: 'cancelled' });
            await api.delete(`/admin/departures/${bookingDepartureId}`);
            await api.delete(`/admin/departures/${initialDepartureId}`);
            await api.delete(`/admin/tours/${tourId}`);
            await api.delete(`/admin/tours/${tourId2}`);
        } catch (e) {
            console.log('Cleanup partial error (ignoring):', e.message);
        }
        console.log('Cleanup done');

    } catch (error) {
        console.error('Test Failed:', error.response?.data || error.message);
    }
}

runTest();
