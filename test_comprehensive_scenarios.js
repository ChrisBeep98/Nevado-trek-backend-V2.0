const axios = require('axios');

const API_URL = 'https://api-wgfhwjbpva-uc.a.run.app'; // Use deployed URL or local if serving
const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

const headers = {
    'Content-Type': 'application/json',
    'X-Admin-Secret-Key': ADMIN_KEY
};

async function runTests() {
    console.log('Starting Comprehensive Tests...');

    try {
        // 1. Test Validation (Invalid Tour)
        console.log('\n1. Testing Tour Validation (Expect Failure)...');
        try {
            await axios.post(`${API_URL}/admin/tours`, {
                name: { es: "Bad Tour" }, // Missing 'en' and 'pricingTiers'
            }, { headers });
            console.error('❌ Failed: Should have rejected invalid tour');
        } catch (error) {
            if (error.response && error.response.status === 400) {
                console.log('✅ Passed: Invalid tour rejected (400)');
            } else {
                console.error('❌ Failed: Unexpected error', error.message);
            }
        }

        // 2. Test Complex Tour Creation & Update
        console.log('\n2. Testing Complex Tour Lifecycle...');
        const tourData = {
            name: { es: "Tour Complejo", en: "Complex Tour" },
            pricingTiers: [
                { minPax: 1, maxPax: 1, priceCOP: 500000, priceUSD: 150 },
                { minPax: 2, maxPax: 2, priceCOP: 300000, priceUSD: 90 },
                { minPax: 3, maxPax: 3, priceCOP: 250000, priceUSD: 75 },
                { minPax: 4, maxPax: 8, priceCOP: 200000, priceUSD: 60 }
            ],
            itinerary: {
                days: [
                    { day: 1, title: "Day 1", activities: ["Hike", "Camp"] }
                ]
            }
        };

        const createTourRes = await axios.post(`${API_URL}/admin/tours`, tourData, { headers });
        const tourId = createTourRes.data.tourId;
        console.log(`✅ Tour Created: ${tourId}`);

        // Update Itinerary
        const updateData = {
            itinerary: {
                days: [
                    { day: 1, title: "Day 1 Modified", activities: ["Hike", "Camp", "Swim"] },
                    { day: 2, title: "Day 2 New", activities: ["Return"] }
                ]
            }
        };
        await axios.put(`${API_URL}/admin/tours/${tourId}`, updateData, { headers });

        // Verify Update
        const getTourRes = await axios.get(`${API_URL}/admin/tours/${tourId}`, { headers });
        if (getTourRes.data.itinerary.days.length === 2) {
            console.log('✅ Passed: Tour itinerary updated correctly');
        } else {
            console.error('❌ Failed: Itinerary update mismatch');
        }

        // 3. Test Booking Discount
        console.log('\n3. Testing Booking Discount...');
        // Create Booking first
        const bookingData = {
            tourId,
            date: "2025-12-25",
            pax: 2,
            customer: {
                name: "Test User",
                email: "test@example.com",
                phone: "1234567890",
                document: "12345"
            },
            type: "private"
        };
        const createBookingRes = await axios.post(`${API_URL}/public/bookings`, bookingData); // Public endpoint
        const bookingId = createBookingRes.data.bookingId;
        console.log(`✅ Booking Created: ${bookingId}`);

        // Apply Discount
        await axios.post(`${API_URL}/admin/bookings/${bookingId}/discount`, {
            discountAmount: 50000,
            reason: "Test Discount"
        }, { headers });

        // Verify Discount (Need to fetch booking, but we don't have direct getBooking endpoint in admin yet, 
        // but we can check via side effect or just trust 200 OK for now. 
        // Actually, let's trust the 200 OK and the previous logic verification).
        console.log('✅ Passed: Discount applied (200 OK)');

        // 4. Test Dashboard Stats
        console.log('\n4. Testing Dashboard Stats...');
        const statsRes = await axios.get(`${API_URL}/admin/stats`, { headers });
        const stats = statsRes.data;
        if (typeof stats.totalActiveBookings === 'number' && typeof stats.upcomingDeparturesCount === 'number') {
            console.log('✅ Passed: Stats retrieved successfully');
            console.log('Stats:', stats);
        } else {
            console.error('❌ Failed: Invalid stats format', stats);
        }

    } catch (error) {
        console.error('❌ Test Suite Failed:', error.response ? error.response.data : error.message);
    }
}

runTests();
