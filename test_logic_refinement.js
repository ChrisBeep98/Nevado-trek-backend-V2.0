const axios = require('axios');

// Configuration
const BASE_URL = 'https://api-wgfhwjbpva-uc.a.run.app'; // New Cloud Run URL
const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

const headers = {
    'X-Admin-Secret-Key': ADMIN_KEY,
    'Content-Type': 'application/json'
};

async function runTests() {
    try {
        console.log('🚀 Starting Logic Refinement Tests...');

        // --- 1. Setup: Create Tour A ---
        console.log('\n1. Creating Tour A...');
        const tourA = {
            name: { es: 'Tour A', en: 'Tour A' },
            pricingTiers: [{ minPax: 1, maxPax: 8, priceCOP: 100000, priceUSD: 30 }]
        };
        const tourARes = await axios.post(`${BASE_URL}/admin/tours`, tourA, { headers });
        const tourAId = tourARes.data.tourId;
        console.log(`   ✅ Tour A created: ${tourAId}`);

        // --- 2. Setup: Create Departure (Private) ---
        console.log('\n2. Creating Private Departure for Tour A...');
        const depData = {
            tourId: tourAId,
            date: '2025-12-01',
            type: 'private'
        };
        const depRes = await axios.post(`${BASE_URL}/admin/departures`, depData, { headers });
        const depId = depRes.data.departureId;
        console.log(`   ✅ Departure created: ${depId}`);

        // --- 3. Test: Date Change ---
        console.log('\n3. Testing Date Change...');
        const newDate = '2025-12-02';
        await axios.put(`${BASE_URL}/admin/departures/${depId}`, { date: newDate }, { headers });
        // Verify
        // Note: We can't easily GET a single departure by ID in the current API (only calendar view), 
        // but we can check the calendar or trust the 200 OK for now. 
        // Actually, let's use the calendar view to verify.
        const calRes = await axios.get(`${BASE_URL}/admin/departures?start=2025-12-01&end=2025-12-03`, { headers });
        const updatedDep = calRes.data.find(d => d.departureId === depId);
        if (updatedDep && updatedDep.date.startsWith(newDate)) {
            console.log(`   ✅ Date updated correctly to ${updatedDep.date}`);
        } else {
            console.error(`   ❌ Date update failed. Found: ${JSON.stringify(updatedDep)}`);
        }

        // --- 4. Test: Type Change (Private -> Public) ---
        console.log('\n4. Testing Type Change (Private -> Public)...');
        await axios.put(`${BASE_URL}/admin/departures/${depId}`, { type: 'public' }, { headers });
        // Verify maxPax
        const calRes2 = await axios.get(`${BASE_URL}/admin/departures?start=2025-12-01&end=2025-12-03`, { headers });
        const publicDep = calRes2.data.find(d => d.departureId === depId);
        if (publicDep && publicDep.type === 'public' && publicDep.maxPax === 8) {
            console.log(`   ✅ Type updated to Public, MaxPax set to 8`);
        } else {
            console.error(`   ❌ Type update failed. Found: ${JSON.stringify(publicDep)}`);
        }

        // --- 5. Test: Tour Change ---
        console.log('\n5. Testing Tour Change...');
        // Create Tour B
        const tourB = {
            name: { es: 'Tour B', en: 'Tour B' },
            pricingTiers: [{ minPax: 1, maxPax: 8, priceCOP: 200000, priceUSD: 60 }] // Higher price
        };
        const tourBRes = await axios.post(`${BASE_URL}/admin/tours`, tourB, { headers });
        const tourBId = tourBRes.data.tourId;
        console.log(`   ✅ Tour B created: ${tourBId}`);

        // Update Departure to Tour B
        await axios.put(`${BASE_URL}/admin/departures/${depId}`, { tourId: tourBId }, { headers });

        // Verify Pricing Snapshot
        const calRes3 = await axios.get(`${BASE_URL}/admin/departures?start=2025-12-01&end=2025-12-03`, { headers });
        const tourBDep = calRes3.data.find(d => d.departureId === depId);

        const snapshotPrice = tourBDep.pricingSnapshot[0].priceCOP;
        if (snapshotPrice === 200000) {
            console.log(`   ✅ Tour updated, PricingSnapshot updated to 200000`);
        } else {
            console.error(`   ❌ PricingSnapshot update failed. Found: ${snapshotPrice}`);
        }

        console.log('\n✨ All tests completed!');

    } catch (error) {
        console.error('❌ Test Failed:', error.response ? error.response.data : error.message);
    }
}

runTests();
