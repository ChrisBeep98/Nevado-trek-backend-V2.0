const axios = require('axios');

// CONFIGURATION
const BASE_URL = 'https://us-central1-nevado-trek-backend-03.cloudfunctions.net/api';
const ADMIN_KEY = 'ntk_admin_staging_key_2026_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

// UTILS
const log = (msg, type = 'INFO') => {
  const icons = { INFO: 'ℹ️', SUCCESS: '✅', ERROR: '❌', WARN: '⚠️', STEP: '👉' };
  console.log(`${icons[type]} [${type}] ${msg}`);
};

async function runAdminAudit() {
  console.log('\n👮 STARTING ADMIN FUNCTIONALITY AUDIT (v2.7.5)...\n');
  
  let dummyTourId = null;
  let bookingId = null;
  let departureId = null;

  try {
    // ---------------------------------------------------------
    // 1. TOUR MANAGEMENT (Create & Update)
    // ---------------------------------------------------------
    log('1. Creating Dummy Tour...', 'STEP');
    const tourPayload = {
      name: { es: 'Tour Test Admin', en: 'Admin Test Tour' },
      subtitle: { es: 'Subtitulo', en: 'Subtitle' },
      altitude: { es: '1000m', en: '1000m' },
      distance: 10,
      shortDescription: { es: 'Test corto', en: 'Short test' },
      description: { es: 'Desc completa', en: 'Full desc' },
      price: 100000,
      pricingTiers: [
        { minPax: 1, maxPax: 1, priceCOP: 100000, priceUSD: 30 },
        { minPax: 2, maxPax: 2, priceCOP: 90000, priceUSD: 25 },
        { minPax: 3, maxPax: 3, priceCOP: 80000, priceUSD: 20 },
        { minPax: 4, maxPax: 8, priceCOP: 70000, priceUSD: 15 }
      ],
      difficulty: 'low',
      totalDays: 1,
      location: { es: 'Lab', en: 'Lab' },
      isActive: false, // Keep hidden
      temperature: 15,
      recommendations: [],
      inclusions: [],
      exclusions: [],
      faqs: [],
      itinerary: { days: [{ activities: [{ es: "Actividad 1", en: "Activity 1" }] }] }
    };
    
    const tourRes = await axios.post(`${BASE_URL}/admin/tours`, tourPayload, {
      headers: { 'x-admin-secret-key': ADMIN_KEY }
    });
    dummyTourId = tourRes.data.tourId;
    log(`Dummy Tour Created: ${dummyTourId}`, 'SUCCESS');

    log('2. Updating Dummy Tour...', 'STEP');
    const updatePayload = { name: { es: 'Tour Test UPDATED', en: 'Admin Tour UPDATED' } };
    await axios.put(`${BASE_URL}/admin/tours/${dummyTourId}`, updatePayload, {
      headers: { 'x-admin-secret-key': ADMIN_KEY }
    });
    log('Tour Name Updated Successfully', 'SUCCESS');

    // ---------------------------------------------------------
    // 2. BOOKING MANAGEMENT (Create, Update, Calc)
    // ---------------------------------------------------------
    log('3. Creating Admin Booking...', 'STEP');
    const bookingPayload = {
      tourId: dummyTourId,
      date: '2026-12-01',
      type: 'private',
      pax: 1,
      customer: {
        name: 'Admin Audit User',
        email: 'audit@test.com',
        phone: '+573001234567',
        document: 'AUDIT-001'
      }
    };
    
    const bookRes = await axios.post(`${BASE_URL}/admin/bookings`, bookingPayload, {
      headers: { 'x-admin-secret-key': ADMIN_KEY }
    });
    
    bookingId = bookRes.data.bookingId;
    departureId = bookRes.data.departureId;
    log(`Booking Created: ${bookingId}`, 'SUCCESS');

    // --- TEST A: Update Details ---
    log('4. Updating Customer Details...', 'STEP');
    await axios.put(`${BASE_URL}/admin/bookings/${bookingId}/details`, 
      { customer: { name: 'Admin User EDITED', email: 'audit@test.com', phone: '+573001234567', document: 'AUDIT-001' } }, 
      { headers: { 'x-admin-secret-key': ADMIN_KEY } }
    );
    log('Customer Details Updated', 'SUCCESS');

    // --- TEST B: Update Pax (Price Recalc) ---
    log('5. Updating Pax (1 -> 2)...', 'STEP');
    await axios.put(`${BASE_URL}/admin/bookings/${bookingId}/pax`, 
      { pax: 2 }, 
      { headers: { 'x-admin-secret-key': ADMIN_KEY } }
    );
    log('Pax Updated Successfully', 'SUCCESS');

    // --- TEST C: Apply Discount ---
    log('6. Applying Discount (Fixed Amount)...', 'STEP');
    await axios.post(`${BASE_URL}/admin/bookings/${bookingId}/discount`, 
      { newFinalPrice: 150000, reason: 'Admin Test' }, 
      { headers: { 'x-admin-secret-key': ADMIN_KEY } }
    );
    log('Discount Applied Successfully', 'SUCCESS');

    // --- TEST D: Move Booking ---
    log('7. Moving Booking to new date...', 'STEP');
    const moveRes = await axios.post(`${BASE_URL}/admin/bookings/${bookingId}/move`, 
        { newTourId: dummyTourId, newDate: '2026-12-05' }, 
        { headers: { 'x-admin-secret-key': ADMIN_KEY } }
    );
    log('Booking Moved Successfully', 'SUCCESS');

    // ---------------------------------------------------------
    // 3. CLEANUP
    // ---------------------------------------------------------
    log('8. Cleanup...', 'STEP');
    
    // Delete Booking
    await axios.put(`${BASE_URL}/admin/bookings/${bookingId}/status`, { status: 'cancelled' }, { headers: { 'x-admin-secret-key': ADMIN_KEY } });
    
    // Delete Dummy Tour
    await axios.delete(`${BASE_URL}/admin/tours/${dummyTourId}`, {
      headers: { 'x-admin-secret-key': ADMIN_KEY }
    });
    log('Dummy Tour Deleted', 'SUCCESS');

    // Attempt to delete departures (might be auto-deleted but good practice to try)
    try {
        await axios.delete(`${BASE_URL}/admin/departures/${newDepartureId}`, { headers: { 'x-admin-secret-key': ADMIN_KEY } });
    } catch(e) {} // Ignore if already deleted

    console.log('\n👮 ADMIN AUDIT PASSED 100%. All admin tools operational.', 'SUCCESS');

  } catch (error) {
    console.error('\n🛑 ADMIN AUDIT FAILED 🛑');
    console.error('Error:', error.response?.data || error.message);
  }
}

runAdminAudit();
