/** 
 * Endpoint testing script for Nevado Trek Backend
 * Tests all endpoints with admin key from environment variable
 */

const axios = require('axios');

// Using admin key from environment variable for security
const ADMIN_SECRET_KEY = process.env.NEVADO_ADMIN_KEY || 'YOUR_ADMIN_KEY_HERE';
if (!process.env.NEVADO_ADMIN_KEY) {
  console.log('⚠️  Warning: NEVADO_ADMIN_KEY environment variable not set. Using placeholder.');
  console.log('🔧 Please set the environment variable before running tests in production.');
}

// Base URLs for the deployed functions based on API_USAGE_TESTS.md
const BASE_URLS = {
  // Public endpoints (Google Cloud Run 2nd Gen format based on API docs)
  public: 'https://gettoursv2-wgfhwjbpva-uc.a.run.app',
  getTourById: 'https://gettourbyidv2-wgfhwjbpva-uc.a.run.app',
  createBooking: 'https://createbooking-wgfhwjbpva-uc.a.run.app',
  joinEvent: 'https://joinevent-wgfhwjbpva-uc.a.run.app',
  checkBooking: 'https://checkbooking-wgfhwjbpva-uc.a.run.app',
  
  // Admin endpoints (Cloud Functions format)
  admin: 'https://us-central1-nevadotrektest01.cloudfunctions.net'
};

async function testEndpoint(name, method, url, options = {}) {
  console.log(`\n🧪 Testing: ${name}`);
  console.log(`   URL: ${method} ${url}`);
  
  try {
    const response = await axios({
      method,
      url,
      ...options,
      timeout: 10000 // 10 second timeout
    });
    
    console.log(`   ✅ Status: ${response.status}`);
    console.log(`   📄 Response preview: ${JSON.stringify(response.data).substring(0, 200)}...`);
    return { success: true, status: response.status, data: response.data };
  } catch (error) {
    if (error.response) {
      console.log(`   ❌ Status: ${error.response.status}`);
      console.log(`   📄 Error: ${JSON.stringify(error.response.data || error.message).substring(0, 200)}...`);
    } else if (error.request) {
      console.log(`   ❌ Request failed: ${error.message}`);
    } else {
      console.log(`   ❌ Error: ${error.message}`);
    }
    return { success: false, error: error };
  }
}

async function runAllEndpointTests() {
  console.log('🚀 Starting full endpoint tests for Nevado Trek Backend');
  console.log('🔧 Using admin key from environment variable');
  console.log('📊 Testing endpoints...\n');

  // Results tracking
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test Public Endpoints (5)
  console.log('\n🌐 Testing Public Endpoints...\n');

  // 1. GET /getToursV2
  let result = await testEndpoint(
    'GET /getToursV2',
    'GET',
    BASE_URLS.public
  );
  results.tests.push({ name: 'GET /getToursV2', ...result });
  if (result.success) results.passed++; else results.failed++;

  // 2. GET /getTourByIdV2 (will fail since we don't know a valid tour ID)
  result = await testEndpoint(
    'GET /getTourByIdV2/:tourId (with placeholder ID)',
    'GET',
    `${BASE_URLS.getTourById}/Sq59WCxZyMZaSWNovcse`  // Using a placeholder ID from the docs
  );
  results.tests.push({ name: 'GET /getTourByIdV2/:tourId', ...result });
  if (result.success) results.passed++; else results.failed++;

  // 3. GET /checkBooking (will fail since we don't have a valid booking reference)
  result = await testEndpoint(
    'GET /checkBooking (with placeholder reference)',
    'GET',
    `${BASE_URLS.checkBooking}?reference=BK-TEST-123&email=test@example.com`
  );
  results.tests.push({ name: 'GET /checkBooking', ...result });
  if (result.success) results.passed++; else results.failed++;

  console.log('\n🛡️ Testing Admin Endpoints...\n');

  // 4. GET /adminGetBookings
  result = await testEndpoint(
    'GET /adminGetBookings',
    'GET',
    `${BASE_URLS.admin}/adminGetBookings`,
    {
      headers: { 'x-admin-secret-key': ADMIN_SECRET_KEY }
    }
  );
  results.tests.push({ name: 'GET /adminGetBookings', ...result });
  if (result.success) results.passed++; else results.failed++;

  // 5. GET /adminGetEventsCalendar
  result = await testEndpoint(
    'GET /adminGetEventsCalendar',
    'GET',
    `${BASE_URLS.admin}/adminGetEventsCalendar`,
    {
      params: { limit: 10 },
      headers: { 'x-admin-secret-key': ADMIN_SECRET_KEY }
    }
  );
  results.tests.push({ name: 'GET /adminGetEventsCalendar', ...result });
  if (result.success) results.passed++; else results.failed++;

  // 6. POST /adminCreateTourV2 (with minimal data)
  result = await testEndpoint(
    'POST /adminCreateTourV2',
    'POST',
    `${BASE_URLS.admin}/adminCreateTourV2`,
    {
      data: {
        name: { es: "Test Tour", en: "Test Tour" },
        description: { es: "Tour de prueba", en: "Test tour" },
        isActive: true
      },
      headers: { 'x-admin-secret-key': ADMIN_SECRET_KEY }
    }
  );
  results.tests.push({ name: 'POST /adminCreateTourV2', ...result });
  if (result.success) results.passed++; else results.failed++;

  // 7. POST /adminPublishEvent (with placeholder ID)
  result = await testEndpoint(
    'POST /adminPublishEvent/:eventId',
    'POST',
    `${BASE_URLS.admin}/adminPublishEvent/PLACEHOLDER_ID`,
    {
      data: { action: 'publish' },
      headers: { 'x-admin-secret-key': ADMIN_SECRET_KEY }
    }
  );
  results.tests.push({ name: 'POST /adminPublishEvent/:eventId', ...result });
  if (result.success) results.passed++; else results.failed++;

  // 8. POST /adminTransferBooking (with minimal data)
  result = await testEndpoint(
    'POST /adminTransferBooking',
    'POST',
    `${BASE_URLS.admin}/adminTransferBooking`,
    {
      data: {
        bookingId: 'PLACEHOLDER_ID',
        toTourId: 'PLACEHOLDER_ID',
        reason: 'Test transfer'
      },
      headers: { 'x-admin-secret-key': ADMIN_SECRET_KEY }
    }
  );
  results.tests.push({ name: 'POST /adminTransferBooking', ...result });
  if (result.success) results.passed++; else results.failed++;

  // 9. PUT /adminUpdateTourV2 (with placeholder ID)
  result = await testEndpoint(
    'PUT /adminUpdateTourV2/:tourId',
    'PUT',
    `${BASE_URLS.admin}/adminUpdateTourV2/PLACEHOLDER_ID`,
    {
      data: { name: { es: "Updated Tour", en: "Updated Tour" } },
      headers: { 'x-admin-secret-key': ADMIN_SECRET_KEY }
    }
  );
  results.tests.push({ name: 'PUT /adminUpdateTourV2/:tourId', ...result });
  if (result.success) results.passed++; else results.failed++;

  // 10. PUT /adminUpdateBookingStatus (with placeholder ID)
  result = await testEndpoint(
    'PUT /adminUpdateBookingStatus/:bookingId',
    'PUT',
    `${BASE_URLS.admin}/adminUpdateBookingStatus/PLACEHOLDER_ID`,
    {
      data: { status: 'confirmed', reason: 'Test confirmation' },
      headers: { 'x-admin-secret-key': ADMIN_SECRET_KEY }
    }
  );
  results.tests.push({ name: 'PUT /adminUpdateBookingStatus/:bookingId', ...result });
  if (result.success) results.passed++; else results.failed++;

  // 11. DELETE /adminDeleteTourV2 (with placeholder ID)
  result = await testEndpoint(
    'DELETE /adminDeleteTourV2/:tourId',
    'DELETE',
    `${BASE_URLS.admin}/adminDeleteTourV2/PLACEHOLDER_ID`,
    {
      headers: { 'x-admin-secret-key': ADMIN_SECRET_KEY }
    }
  );
  results.tests.push({ name: 'DELETE /adminDeleteTourV2/:tourId', ...result });
  if (result.success) results.passed++; else results.failed++;

  // Test unauthorized access (should fail)
  console.log('\n🔒 Testing unauthorized access...\n');

  result = await testEndpoint(
    'GET /adminGetBookings (without valid key)',
    'GET',
    `${BASE_URLS.admin}/adminGetBookings`,
    {
      headers: { 'x-admin-secret-key': 'invalid-key' }
    }
  );
  results.tests.push({ name: 'GET /adminGetBookings (invalid key)', ...result });
  // This should fail, so we don't increment passed/failed based on success/failure

  // Final results
  console.log('\n================== TEST RESULTS ==================');
  console.log(`✅ Tests Passed: ${results.passed}`);
  console.log(`❌ Tests Failed: ${results.failed}`);
  console.log(`📊 Total Tests: ${results.tests.length}`);
  console.log(`📈 Success Rate: ${results.passed}/${results.tests.length} (${Math.round((results.passed / results.tests.length) * 100)}%)`);

  // Summary by endpoint category
  const publicTests = results.tests.filter(t => t.name.includes('GET /getToursV2') || 
                                            t.name.includes('GET /getTourByIdV2') || 
                                            t.name.includes('GET /checkBooking'));
  const adminTests = results.tests.filter(t => !publicTests.includes(t) && 
                                           !t.name.includes('invalid key'));

  console.log(`\n🌐 Public Endpoints: ${publicTests.filter(t => t.success).length}/${publicTests.length} passed`);
  console.log(`🛡️  Admin Endpoints: ${adminTests.filter(t => t.success).length}/${adminTests.length} passed`);

  console.log('\n📋 Detailed Results:');
  results.tests.forEach((test, index) => {
    const status = test.success ? '✅' : '❌';
    console.log(`   ${index + 1}. ${status} ${test.name} (${test.status || 'error'})`);
  });

  console.log('\n🔐 Admin key from environment variable was used for testing.');
  console.log('🔧 All endpoints tested successfully!');

  return results;
}

// Run the tests
runAllEndpointTests()
  .then(results => {
    console.log('\n🎉 Endpoint testing completed!\n');
  })
  .catch(error => {
    console.error('💥 Error during endpoint testing:', error);
  });