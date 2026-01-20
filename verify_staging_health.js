const axios = require('axios');

// CONFIGURATION
const BASE_URL = 'https://us-central1-nevado-trek-backend-03.cloudfunctions.net/api';
const ADMIN_KEY = 'ntk_admin_staging_key_2026_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';
const TEST_TOUR_ID = 'test-tour-001'; // Ensure this exists or use a real one like 'nevado-santa-isabel'

// UTILS
const log = (msg, type = 'INFO') => {
  const icons = { INFO: 'ℹ️', SUCCESS: '✅', ERROR: '❌', WARN: '⚠️', STEP: '👉' };
  console.log(`${icons[type]} [${type}] ${msg}`);
};

const wait = (ms) => new Promise(r => setTimeout(r, ms));

async function runHealthCheck() {
  console.log('\n🏥 STARTING STAGING HEALTH CHECK (v2.7.5)...\n');
  const createdBookings = [];
  const createdDepartures = [];

  try {
    // ---------------------------------------------------------
    // 1. ADMIN AUTH & STATS
    // ---------------------------------------------------------
    log('Testing Admin Access & Stats...', 'STEP');
    const statsRes = await axios.get(`${BASE_URL}/admin/stats`, {
      headers: { 'x-admin-secret-key': ADMIN_KEY }
    });
    
    if (statsRes.status === 200 && statsRes.data.timestamp) {
      log('Admin Access Confirmed', 'SUCCESS');
      log(`Active Bookings in DB: ${statsRes.data.totalActiveBookings}`, 'INFO');
    } else {
      throw new Error('Stats response invalid');
    }

    // ---------------------------------------------------------
    // 2. PUBLIC CATALOG
    // ---------------------------------------------------------
    log('Testing Public Tour Listing...', 'STEP');
    const toursRes = await axios.get(`${BASE_URL}/public/tours/listing`);
    if (Array.isArray(toursRes.data) && toursRes.data.length > 0) {
      log(`Catalog loaded. Found ${toursRes.data.length} active tours.`, 'SUCCESS');
    } else {
      throw new Error('Tours listing failed or empty');
    }

    // ---------------------------------------------------------
    // 3. PRIVATE BOOKING FLOW (Bold Smart Link)
    // ---------------------------------------------------------
    log('Testing Private Booking & Payment Generation...', 'STEP');
    const privatePayload = {
      tourId: TEST_TOUR_ID,
      date: '2026-05-20', // Future date
      pax: 2,
      customer: {
        name: 'Staging Bot Private',
        email: 'bot_private@nevadotrek.com',
        phone: '+573000000001',
        document: 'BOT-101'
      }
    };

    const privateRes = await axios.post(`${BASE_URL}/public/bookings/private`, privatePayload);
    const privateBookingId = privateRes.data.bookingId;
    createdBookings.push(privateBookingId);
    log(`Private Booking Created: ${privateBookingId}`, 'SUCCESS');

    // TEST PAYMENT LINK
    log('Generating Bold Smart Link (Private)...', 'STEP');
    const payPrivateRes = await axios.post(`${BASE_URL}/public/payments/init`, {
      bookingId: privateBookingId
    });

    const linkUrl = payPrivateRes.data.paymentUrl;
    if (linkUrl && linkUrl.includes('bold.co')) {
      log(`Payment URL Generated: ${linkUrl}`, 'SUCCESS');
      log(`Amount to Charge: ${payPrivateRes.data.amount} COP`, 'INFO');
    } else {
      throw new Error('Failed to generate valid Bold URL');
    }

    // ---------------------------------------------------------
    // 4. PUBLIC DEPARTURE FLOW (Admin Create -> Public Join)
    // ---------------------------------------------------------
    log('Testing Public Departure Cycle...', 'STEP');
    
    // A. Create Departure (Admin)
    const depPayload = {
      tourId: TEST_TOUR_ID,
      date: '2026-06-15',
      type: 'public',
      maxPax: 8
    };
    const depRes = await axios.post(`${BASE_URL}/admin/departures`, depPayload, {
      headers: { 'x-admin-secret-key': ADMIN_KEY }
    });
    const departureId = depRes.data.departureId;
    createdDepartures.push(departureId);
    log(`Public Departure Created: ${departureId}`, 'SUCCESS');

    // B. Join Departure (Public)
    const joinPayload = {
      departureId: departureId,
      pax: 1,
      customer: {
        name: 'Staging Bot Join',
        email: 'bot_join@nevadotrek.com',
        phone: '+573000000002',
        document: 'BOT-102'
      }
    };
    const joinRes = await axios.post(`${BASE_URL}/public/bookings/join`, joinPayload);
    const joinBookingId = joinRes.data.bookingId;
    createdBookings.push(joinBookingId);
    log(`Joined Public Departure: ${joinBookingId}`, 'SUCCESS');

    // C. Payment Link (Public Join)
    const payJoinRes = await axios.post(`${BASE_URL}/public/payments/init`, {
      bookingId: joinBookingId
    });
    
    if (payJoinRes.data.paymentUrl.includes('bold.co')) {
      log(`Payment URL for Join Generated: ${payJoinRes.data.paymentUrl}`, 'SUCCESS');
    } else {
      throw new Error('Failed to generate URL for Join booking');
    }

    // ---------------------------------------------------------
    // 5. CLEANUP
    // ---------------------------------------------------------
    log('Cleaning up test data...', 'STEP');
    for (const bookingId of createdBookings) {
      await axios.put(`${BASE_URL}/admin/bookings/${bookingId}/status`, 
        { status: 'cancelled' }, 
        { headers: { 'x-admin-secret-key': ADMIN_KEY } }
      );
      process.stdout.write('.');
    }
    console.log(''); // Newline
    log('Test Bookings Cancelled', 'SUCCESS');

    // Note: Departures auto-cleanup when empty usually, or we can leave them closed.
    // We explicitly delete the departure we created to be clean.
    if (departureId) {
        try {
             await axios.delete(`${BASE_URL}/admin/departures/${departureId}`, {
                headers: { 'x-admin-secret-key': ADMIN_KEY }
             });
             log('Test Departure Deleted', 'SUCCESS');
        } catch (e) {
            log('Departure auto-deleted or could not delete', 'WARN');
        }
    }

    log('\n🎉 ALL SYSTEMS GO! Staging is fully operational.', 'SUCCESS');

  } catch (error) {
    console.error('\n🛑 CRITICAL FAILURE 🛑');
    console.error('Error:', error.response?.data || error.message);
    if (error.response?.data) console.error(JSON.stringify(error.response.data, null, 2));
  }
}

runHealthCheck();
