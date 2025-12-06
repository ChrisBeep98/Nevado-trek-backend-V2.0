/**
 * Test Timezone Fix for Departures
 * Verifies that dates are stored and returned correctly after the noon UTC fix
 */

const axios = require('axios');

const API_URL = 'https://us-central1-nevadotrektest01.cloudfunctions.net/api';
const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

async function testTimezoneFix() {
  console.log('🧪 Testing Timezone Fix for Departures\n');
  console.log('═'.repeat(60));
  
  try {
    // Get a tour ID first
    const toursRes = await axios.get(`${API_URL}/admin/tours`, {
      headers: { 'X-Admin-Secret-Key': ADMIN_KEY }
    });
    const tourId = toursRes.data[0].tourId;
    console.log(`Using tour: ${tourId}`);
    
    // Test date: December 31, 2025
    const testDate = '2025-12-31';
    console.log(`\n📅 Creating departure for: ${testDate}`);
    
    // Create departure
    const createRes = await axios.post(`${API_URL}/admin/departures`, {
      tourId,
      date: testDate,
      type: 'public',
      maxPax: 8
    }, {
      headers: { 'X-Admin-Secret-Key': ADMIN_KEY }
    });
    
    const departureId = createRes.data.departureId;
    console.log(`   Created departure: ${departureId}`);
    
    // Fetch it back
    const getRes = await axios.get(`${API_URL}/admin/departures/${departureId}`, {
      headers: { 'X-Admin-Secret-Key': ADMIN_KEY }
    });
    
    const storedDate = getRes.data.departure.date;
    console.log(`   Stored date (raw): ${storedDate}`);
    
    // Parse the stored date
    const dateObj = new Date(storedDate);
    console.log(`   Stored date (ISO): ${dateObj.toISOString()}`);
    
    // Check if it's at noon UTC (12:00:00.000Z)
    const isNoonUTC = dateObj.toISOString().includes('T12:00:00.000Z');
    console.log(`   Is noon UTC: ${isNoonUTC ? '✅ YES' : '❌ NO'}`);
    
    // Check what date it shows in different timezones
    const utcDate = dateObj.getUTCDate();
    console.log(`\n🌍 Date Display Test:`);
    console.log(`   UTC date:     December ${utcDate}`);
    
    // Simulate Colombia (UTC-5)
    const colombiaOffset = -5;
    const colombiaDate = new Date(dateObj.getTime() + (colombiaOffset * 60 * 60 * 1000));
    console.log(`   Colombia (-5): December ${colombiaDate.getUTCDate()}`);
    
    // Simulate Japan (UTC+9)
    const japanOffset = 9;
    const japanDate = new Date(dateObj.getTime() + (japanOffset * 60 * 60 * 1000));
    console.log(`   Japan (+9):   December ${japanDate.getUTCDate()}`);
    
    // Verify
    console.log('\n═'.repeat(60));
    if (utcDate === 31 && isNoonUTC) {
      console.log('✅ SUCCESS: Date stored as December 31 at noon UTC');
      console.log('   → Will display as December 31 in any timezone from UTC-12 to UTC+12');
    } else {
      console.log('❌ FAILED: Date not stored correctly');
    }
    
    // Cleanup - delete the test departure
    await axios.delete(`${API_URL}/admin/departures/${departureId}`, {
      headers: { 'X-Admin-Secret-Key': ADMIN_KEY }
    });
    console.log('\n🗑️ Test departure deleted');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testTimezoneFix();
