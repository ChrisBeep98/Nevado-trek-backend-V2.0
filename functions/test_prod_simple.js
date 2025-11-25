const axios = require('axios');

const API = 'https://api-wgfhwjbpva-uc.a.run.app';
const KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

async function test() {
    console.log('\n=== PRODUCTION ENDPOINT TEST ===\n');

    let pass = 0, fail = 0;

    try {
        // 1. GET Tours
        console.log('1. GET /admin/tours');
        const tours = await axios.get(`${API}/admin/tours`, { headers: { 'X-Admin-Secret-Key': KEY } });
        if (tours.status === 200) {
            console.log(`✅ Status: ${tours.status}, Count: ${tours.data.length}`);
            pass++;
        } else {
            console.log(`❌ Status: ${tours.status}`);
            fail++;
        }

        // 2. GET Departures
        console.log('\n2. GET /admin/departures');
        const deps = await axios.get(`${API}/admin/departures?startDate=2025-12-01&endDate=2025-12-31`,
            { headers: { 'X-Admin-Secret-Key': KEY } });
        if (deps.status === 200) {
            console.log(`✅ Status: ${deps.status}, Count: ${deps.data.length}`);
            pass++;
        } else {
            console.log(`❌ Status: ${deps.status}`);
            fail++;
        }

        if (deps.data.length > 0) {
            const depId = deps.data[0].departureId;
            console.log(`\n3. GET /admin/departures/${depId}`);
            const dep = await axios.get(`${API}/admin/departures/${depId}`,
                { headers: { 'X-Admin-Secret-Key': KEY } });
            console.log(`✅ Status: ${dep.status}, maxPax: ${dep.data.maxPax}, currentPax: ${dep.data.currentPax}`);
            pass++;
        }

        // 3. GET Bookings
        console.log('\n4. GET /admin/bookings');
        const bookings = await axios.get(`${API}/admin/bookings`, { headers: { 'X-Admin-Secret-Key': KEY } });
        if (bookings.status === 200) {
            console.log(`✅ Status: ${bookings.status}, Count: ${bookings.data.length}`);
            pass++;
        } else {
            console.log(`❌ Status: ${bookings.status}`);
            fail++;
        }

        if (bookings.data.length > 0) {
            const bookId = bookings.data[0].id;
            console.log(`\n5. GET /admin/bookings/${bookId}`);
            const book = await axios.get(`${API}/admin/bookings/${bookId}`,
                { headers: { 'X-Admin-Secret-Key': KEY } });
            console.log(`✅ Status: ${book.status}, Type: ${book.data.type}, Pax: ${book.data.pax}`);
            pass++;
        }

        // 4. Test New Features
        if (tours.data.length > 0) {
            console.log('\n6. CREATE Private Booking (Test maxPax=8)');
            const newBook = await axios.post(`${API}/admin/bookings`, {
                tourId: tours.data[0].id,
                date: '2025-12-28',
                type: 'private',
                pax: 2,
                customer: { name: 'Test', email: 'test@test.com', phone: '+1234567890', document: 'TEST123' }
            }, { headers: { 'X-Admin-Secret-Key': KEY }, validateStatus: () => true });

            if (newBook.status === 201) {
                const testDepId = newBook.data.departureId;
                const testDep = await axios.get(`${API}/admin/departures/${testDepId}`,
                    { headers: { 'X-Admin-Secret-Key': KEY } });

                if (testDep.data.maxPax === 8) {
                    console.log(`✅ Private departure has maxPax=8`);
                    pass++;
                } else {
                    console.log(`❌ Private departure maxPax=${testDep.data.maxPax} (expected 8)`);
                    fail++;
                }

                // Test cancellation
                const bookId = newBook.data.bookingId;
                console.log('\n7. Cancel Booking');
                await axios.put(`${API}/admin/bookings/${bookId}/status`,
                    { status: 'cancelled' }, { headers: { 'X-Admin-Secret-Key': KEY } });

                const canceledDep = await axios.get(`${API}/admin/departures/${testDepId}`,
                    { headers: { 'X-Admin-Secret-Key': KEY } });

                if (canceledDep.data.status === 'cancelled') {
                    console.log(`✅ Private departure auto-cancelled`);
                    pass++;
                } else {
                    console.log(`❌ Departure status: ${canceledDep.data.status} (expected cancelled)`);
                    fail++;
                }

                // Test irreversible
                console.log('\n8. Try to Un-cancel (should fail)');
                const uncancel = await axios.put(`${API}/admin/bookings/${bookId}/status`,
                    { status: 'confirmed' },
                    { headers: { 'X-Admin-Secret-Key': KEY }, validateStatus: () => true });

                if (uncancel.status === 500) {
                    console.log(`✅ Cancellation is irreversible (status ${uncancel.status})`);
                    pass++;
                } else {
                    console.log(`❌ Un-cancel succeeded (status ${uncancel.status})`);
                    fail++;
                }

                // Cleanup
                await axios.delete(`${API}/admin/departures/${testDepId}`,
                    { headers: { 'X-Admin-Secret-Key': KEY } });
            }
        }

    } catch (error) {
        console.log(`\n❌ ERROR: ${error.message}`);
        if (error.response) {
            console.log(`   Status: ${error.response.status}`);
            console.log(`   Data:`, error.response.data);
        }
        fail++;
    }

    console.log(`\n=== RESULTS ===`);
    console.log(`✅ Passed: ${pass}`);
    console.log(`❌ Failed: ${fail}`);
    console.log(`===============\n`);

    process.exit(fail > 0 ? 1 : 0);
}

test();
