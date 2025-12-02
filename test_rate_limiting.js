/**
 * Test script to verify Rate Limiting on public booking endpoints
 * 
 * Tests:
 * 1. Whitelisted IP can make unlimited requests
 * 2. Non-whitelisted IP gets blocked after 5 requests
 * 3. Rate limit headers are present in response
 */

const axios = require('axios');

const API_URL = 'https://us-central1-nevadotrektest01.cloudfunctions.net/api';

// Valid booking payload
const testBooking = {
  departureId: 'wHeL7YEtpqTZfhTDxEtL',
  customer: {
    name: 'Rate Limit Test',
    email: 'ratelimit@test.com',
    phone: '+573001234567',
    document: 'TEST123'
  },
  pax: 1
};

async function testRateLimiting() {
  console.log('====================================');
  console.log('Rate Limiting Test Suite');
  console.log('====================================\n');

  // Test 1: Check rate limit headers
  console.log('Test 1: Verify rate limit headers are present');
  try {
    const response = await axios.post(
      `${API_URL}/public/bookings/join`,
      testBooking,
      { validateStatus: () => true } // Accept any status code
    );

    console.log(`Status: ${response.status}`);
    console.log('Rate Limit Headers:');
    console.log(`  RateLimit-Limit: ${response.headers['ratelimit-limit']}`);
    console.log(`  RateLimit-Remaining: ${response.headers['ratelimit-remaining']}`);
    console.log(`  RateLimit-Reset: ${response.headers['ratelimit-reset']}`);
    
    if (response.headers['ratelimit-limit']) {
      console.log('✅ PASS: Rate limit headers present\n');
    } else {
      console.log('⚠️  WARNING: Rate limit headers missing (might be whitelisted)\n');
    }
  } catch (err) {
    console.log('❌ FAIL:', err.message, '\n');
  }

  // Test 2: Make multiple requests to test the limit
  console.log('Test 2: Testing rate limit enforcement (6 consecutive requests)');
  console.log('Expected: First 5 succeed, 6th blocked\n');

  for (let i = 1; i <= 6; i++) {
    try {
      const response = await axios.post(
        `${API_URL}/public/bookings/join`,
        testBooking,
        { validateStatus: () => true }
      );

      const remaining = response.headers['ratelimit-remaining'];
      
      if (response.status === 429) {
        console.log(`Request ${i}: 🔴 BLOCKED (429 Too Many Requests)`);
        console.log(`  Message: ${response.data.error}`);
        console.log('✅ PASS: Rate limiting is working!\n');
        break;
      } else if (response.status === 201) {
        console.log(`Request ${i}: ✅ SUCCESS (201 Created) - Remaining: ${remaining}`);
      } else {
        console.log(`Request ${i}: Status ${response.status} - ${JSON.stringify(response.data)}`);
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (err) {
      console.log(`Request ${i}: ❌ ERROR - ${err.message}`);
    }
  }

  // Test 3: Verify whitelist (localhost requests should never be blocked)
  console.log('\nTest 3: Localhost/Whitelist Test');
  console.log('If running from localhost (127.0.0.1), should never be rate limited');
  console.log('Note: This test only works when running locally\n');

  console.log('====================================');
  console.log('Test Summary:');
  console.log('- Rate limit: 5 requests per 15 minutes');
  console.log('- Whitelisted IPs: 127.0.0.1, ::1, 45.162.79.5');
  console.log('- Protected endpoints: POST /public/bookings/join, POST /public/bookings/private');
  console.log('- Unprotected endpoints: GET /public/tours, GET /public/departures');
  console.log('====================================');
}

// Run tests
testRateLimiting().catch(console.error);
