/**
 * Test Cache Bypass with Date.now()
 * Verifies that GET /public/departures?t=... bypasses cache and shows updated currentPax
 */

const axios = require('axios');

const API_URL = 'https://us-central1-nevadotrektest01.cloudfunctions.net/api';

async function testCacheBypass() {
  console.log('🧪 Testing Cache Bypass for Departures\n');
  console.log('═'.repeat(60));
  
  try {
    // Step 1: Get departures (normal - may use cache)
    console.log('\n📥 Step 1: GET /public/departures (initial)');
    const initialResponse = await axios.get(`${API_URL}/public/departures`);
    const departures = initialResponse.data;
    
    if (departures.length === 0) {
      console.log('❌ No departures found. Cannot test.');
      return;
    }
    
    // Find a departure with available spots
    const targetDep = departures.find(d => d.currentPax < d.maxPax);
    
    if (!targetDep) {
      console.log('❌ No departures with available spots. Cannot test.');
      return;
    }
    
    console.log(`   Found departure: ${targetDep.departureId}`);
    console.log(`   Current Pax: ${targetDep.currentPax} / ${targetDep.maxPax}`);
    const originalPax = targetDep.currentPax;
    
    // Step 2: Make a booking
    console.log('\n📝 Step 2: POST /public/bookings/join (reserve 1 pax)');
    const bookingPayload = {
      departureId: targetDep.departureId,
      customer: {
        name: 'Test Cache User',
        email: 'testcache@example.com',
        phone: '+573001234567',
        document: '12345678'
      },
      pax: 1
    };
    
    const bookingResponse = await axios.post(
      `${API_URL}/public/bookings/join`,
      bookingPayload,
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    console.log(`   ✅ Booking created: ${bookingResponse.data.bookingId}`);
    
    // Step 3: Get departures WITHOUT cache bypass (may show old data)
    console.log('\n📥 Step 3: GET /public/departures (without bypass)');
    const cachedResponse = await axios.get(`${API_URL}/public/departures`);
    const cachedDep = cachedResponse.data.find(d => d.departureId === targetDep.departureId);
    console.log(`   Current Pax (possibly cached): ${cachedDep?.currentPax}`);
    
    // Step 4: Get departures WITH cache bypass using Date.now()
    console.log('\n📥 Step 4: GET /public/departures?t=Date.now() (WITH BYPASS)');
    const freshUrl = `${API_URL}/public/departures?t=${Date.now()}`;
    console.log(`   URL: ${freshUrl}`);
    const freshResponse = await axios.get(freshUrl);
    const freshDep = freshResponse.data.find(d => d.departureId === targetDep.departureId);
    console.log(`   Current Pax (fresh): ${freshDep?.currentPax}`);
    
    // Step 5: Verify
    console.log('\n═'.repeat(60));
    console.log('📊 RESULTS:');
    console.log(`   Original Pax:    ${originalPax}`);
    console.log(`   Cached Pax:      ${cachedDep?.currentPax}`);
    console.log(`   Fresh Pax:       ${freshDep?.currentPax}`);
    console.log(`   Expected Pax:    ${originalPax + 1}`);
    
    if (freshDep?.currentPax === originalPax + 1) {
      console.log('\n✅ SUCCESS: Cache bypass works! Fresh data shows updated currentPax');
    } else {
      console.log('\n❌ FAILED: Fresh data does not show expected currentPax');
    }
    
    if (cachedDep?.currentPax !== freshDep?.currentPax) {
      console.log('ℹ️  Note: Cached response differs from fresh response (cache was stale)');
    } else {
      console.log('ℹ️  Note: Both responses match (cache was already fresh or CDN bypassed)');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testCacheBypass();
