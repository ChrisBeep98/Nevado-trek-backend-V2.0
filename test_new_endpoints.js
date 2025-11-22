
const axios = require('axios');

const API_URL = 'https://us-central1-nevadotrektest01.cloudfunctions.net/api';
const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'X-Admin-Secret-Key': ADMIN_KEY
    }
});

async function runTests() {
    try {
        console.log('Starting verification of new endpoints...');

        // 1. Create a test tour
        console.log('Creating test tour...');
        const tourRes = await api.post('/admin/tours', {
            name: { es: 'Test Tour', en: 'Test Tour' },
            description: { es: 'Desc', en: 'Desc' },
            type: 'single-day',
            totalDays: 1,
            difficulty: 'easy',
            isActive: true,
            pricingTiers: [
                { minPax: 1, maxPax: 1, priceCOP: 100000, priceUSD: 30 },
                { minPax: 2, maxPax: 2, priceCOP: 90000, priceUSD: 25 },
                { minPax: 3, maxPax: 3, priceCOP: 80000, priceUSD: 20 },
                { minPax: 4, maxPax: 8, priceCOP: 70000, priceUSD: 15 }
            ],
            altitude: { es: '1000m', en: '1000m' },
            location: { es: 'Nevado', en: 'Nevado' },
            temperature: 15,
            distance: 10,
            faqs: [],
            recommendations: [],
            inclusions: [],
            exclusions: [],
            version: 1
        });
        const tourId = tourRes.data.tourId;
        console.log('Tour created:', tourId);

        // 2. Create a test departure
        console.log('Creating test departure...');
        const depRes = await api.post('/admin/departures', {
            tourId: tourId,
            date: '2025-12-01',
            type: 'private',
            maxPax: 10
        });
        const depId = depRes.data.departureId;
        console.log('Departure created:', depId);

        // 3. Test Update Departure Date
        console.log('Testing Update Departure Date...');
        const newDate = '2025-12-25';
        await api.put(`/admin/departures/${depId}/date`, { newDate });
        console.log('Date updated successfully');

        // Verify update
        const depCheck = await api.get('/admin/departures');
        const updatedDep = depCheck.data.find(d => d.departureId === depId);
        if (updatedDep.date.includes('2025-12-25')) {
            console.log('✅ Date verification passed');
        } else {
            console.error('❌ Date verification failed:', updatedDep.date);
        }

        // 4. Create another tour for switching
        console.log('Creating second test tour...');
        const tour2Res = await api.post('/admin/tours', {
            name: { es: 'Test Tour 2', en: 'Test Tour 2' },
            description: { es: 'Desc', en: 'Desc' },
            type: 'single-day',
            totalDays: 1,
            difficulty: 'medium',
            isActive: true,
            pricingTiers: [
                { minPax: 1, maxPax: 1, priceCOP: 200000, priceUSD: 60 },
                { minPax: 2, maxPax: 2, priceCOP: 190000, priceUSD: 55 },
                { minPax: 3, maxPax: 3, priceCOP: 180000, priceUSD: 50 },
                { minPax: 4, maxPax: 8, priceCOP: 170000, priceUSD: 45 }
            ],
            altitude: { es: '2000m', en: '2000m' },
            location: { es: 'Nevado 2', en: 'Nevado 2' },
            temperature: 10,
            distance: 20,
            faqs: [],
            recommendations: [],
            inclusions: [],
            exclusions: [],
            version: 1
        });
        const tour2Id = tour2Res.data.tourId;
        console.log('Second tour created:', tour2Id);

        // 5. Test Update Departure Tour
        console.log('Testing Update Departure Tour...');
        await api.put(`/admin/departures/${depId}/tour`, { newTourId: tour2Id });
        console.log('Tour updated successfully');

        // Verify update
        const depCheck2 = await api.get('/admin/departures');
        const updatedDep2 = depCheck2.data.find(d => d.departureId === depId);
        if (updatedDep2.tourId === tour2Id) {
            console.log('✅ Tour verification passed');
        } else {
            console.error('❌ Tour verification failed:', updatedDep2.tourId);
        }

        // Cleanup
        console.log('Cleaning up...');
        await api.delete(`/admin/departures/${depId}`);
        await api.delete(`/admin/tours/${tourId}`);
        await api.delete(`/admin/tours/${tour2Id}`);
        console.log('Cleanup complete');

    } catch (error) {
        console.error('Test failed:', error.response ? error.response.data : error.message);
    }
}

runTests();
