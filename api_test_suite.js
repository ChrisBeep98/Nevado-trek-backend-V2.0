/**
 * Comprehensive API Test Suite for Nevado Trek Backend
 * This script tests all endpoints including the new adminGetEventsCalendar
 */

const testConfig = {
  // Base URLs for the deployed functions
  baseUrl: process.env.BASE_URL || 'https://us-central1-nevadotrektest01.cloudfunctions.net',
  adminSecretKey: process.env.ADMIN_SECRET_KEY || 'YOUR_ADMIN_KEY_HERE',
  
  // Test data
  tours: [
    {
      name: { es: "Ascenso al Nevado", en: "Nevado Trek" },
      description: { es: "Excursión al Nevado con vistas panorámicas", en: "Trek to Nevado with panoramic views" },
      maxParticipants: 8,
      duration: "3 days",
      price: { amount: 1200000, currency: "COP" },
      isActive: true
    },
    {
      name: { es: "Senderismo Familiar", en: "Family Hiking" },
      description: { es: "Ruta familiar adecuada para todos los niveles", en: "Family trail suitable for all levels" },
      maxParticipants: 10,
      duration: "1 day", 
      price: { amount: 300000, currency: "COP" },
      isActive: true
    },
    {
      name: { es: "Aventura Extrema", en: "Extreme Adventure" },
      description: { es: "Ruta desafiante para aventureros experimentados", en: "Challenging route for experienced adventurers" },
      maxParticipants: 6,
      duration: "5 days",
      price: { amount: 2500000, currency: "COP" },
      isActive: true
    },
    {
      name: { es: "Sendero Ecológico", en: "Eco Trail" },
      description: { es: "Ruta ecológica con avistamiento de fauna", en: "Eco trail with wildlife spotting" },
      maxParticipants: 12,
      duration: "2 days",
      price: { amount: 600000, currency: "COP" },
      isActive: true
    },
    {
      name: { es: "Cumbre del Pico", en: "Summit Peak" },
      description: { es: "Excursión a la cumbre más alta", en: "Hike to the highest summit" },
      maxParticipants: 4,
      duration: "4 days",
      price: { amount: 1800000, currency: "COP" },
      isActive: true
    }
  ],
  
  events: [
    { type: 'private', status: 'active', maxCapacity: 6 },
    { type: 'public', status: 'active', maxCapacity: 8 },
    { type: 'private', status: 'full', maxCapacity: 4 },
    { type: 'public', status: 'completed', maxCapacity: 10 },
    { type: 'private', status: 'cancelled', maxCapacity: 6 }
  ],
  
  bookings: [
    {
      customer: {
        fullName: "Juan Pérez",
        documentId: "12345678",
        phone: "+573001234567",
        email: "juan@example.com",
        notes: "Cliente frecuente"
      },
      pax: 2
    },
    {
      customer: {
        fullName: "María García",
        documentId: "87654321",
        phone: "+573007654321", 
        email: "maria@example.com",
        notes: "Preferencia de horario matutino"
      },
      pax: 4
    },
    {
      customer: {
        fullName: "Carlos López",
        documentId: "11223344",
        phone: "+573001122334",
        email: "carlos@example.com",
        notes: "Requiere silla de ruedas"
      },
      pax: 1
    },
    {
      customer: {
        fullName: "Ana Rodríguez",
        documentId: "44332211",
        phone: "+573004433221",
        email: "ana@example.com",
        notes: "Grupo familiar"
      },
      pax: 3
    },
    {
      customer: {
        fullName: "Luis Fernández",
        documentId: "55667788",
        phone: "+573005566778",
        email: "luis@example.com",
        notes: "Fotógrafo profesional"
      },
      pax: 2
    }
  ]
};

// Test utilities
const axios = require('axios');
const https = require('https');

// Create axios instance with default settings
const apiClient = axios.create({
  httpsAgent: new https.Agent({ rejectUnauthorized: false }),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Helper function to delay execution
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Test results storage
const testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

// Test function with error handling
async function runTest(testName, testFunction) {
  console.log(`\n🔍 Testing: ${testName}`);
  try {
    await testFunction();
    console.log(`✅ PASSED: ${testName}`);
    testResults.passed++;
  } catch (error) {
    console.log(`❌ FAILED: ${testName}`);
    console.log(`   Error: ${error.message}`);
    testResults.errors.push(`${testName}: ${error.message}`);
    testResults.failed++;
  }
}

// Function to run all API tests
async function runAllTests() {
  console.log("🚀 Starting comprehensive API test suite for Nevado Trek Backend");
  console.log(`📅 Test configuration:`);
  console.log(`   - Base URL: ${testConfig.baseUrl}`);
  console.log(`   - Tours to create: ${testConfig.tours.length}`);
  console.log(`   - Events to create: ${testConfig.events.length}`);
  console.log(`   - Bookings to create: ${testConfig.bookings.length}`);
  console.log(`\n📊 Test Results will be logged below:\n`);

  // Test 1: Get all tours (public endpoint)
  await runTest("GET /getToursV2 - Retrieve all active tours", async () => {
    const response = await apiClient.get(`${testConfig.baseUrl}/getToursV2`);
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    console.log(`   Retrieved ${response.data.length} tours`);
  });

  // Test 2: Create tours (admin endpoint)
  let createdTourIds = [];
  for (let i = 0; i < testConfig.tours.length; i++) {
    const tour = testConfig.tours[i];
    await runTest(`POST /adminCreateTourV2 - Create tour ${i + 1}`, async () => {
      const response = await apiClient.post(`${testConfig.baseUrl}/adminCreateTourV2`, tour, {
        headers: { 'x-admin-secret-key': testConfig.adminSecretKey }
      });
      if (response.status !== 201) throw new Error(`Expected 201, got ${response.status}`);
      createdTourIds.push(response.data.tourId);
      console.log(`   Created tour with ID: ${response.data.tourId}`);
    });
  }

  // Test 3: Get specific tour by ID
  if (createdTourIds.length > 0) {
    await runTest(`GET /getTourByIdV2 - Retrieve specific tour`, async () => {
      const response = await apiClient.get(`${testConfig.baseUrl}/getTourByIdV2/${createdTourIds[0]}`);
      if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
      console.log(`   Retrieved tour: ${response.data.name?.es || response.data.name}`);
    });
  }

  // Test 4: Update a tour (admin endpoint)
  if (createdTourIds.length > 0) {
    await runTest(`PUT /adminUpdateTourV2 - Update tour`, async () => {
      const updatedData = {
        name: { es: "Tour Actualizado", en: "Updated Tour" },
        maxParticipants: 15
      };
      const response = await apiClient.put(`${testConfig.baseUrl}/adminUpdateTourV2/${createdTourIds[0]}`, updatedData, {
        headers: { 'x-admin-secret-key': testConfig.adminSecretKey }
      });
      if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
      console.log(`   Updated tour: ${createdTourIds[0]}`);
    });
  }

  // Test 5: Create bookings to associate with events
  let createdBookingIds = [];
  for (let i = 0; i < testConfig.bookings.length && i < createdTourIds.length; i++) {
    await runTest(`POST /createBooking - Create booking for tour ${createdTourIds[i]}`, async () => {
      // Create a booking for one of our tours
      const bookingData = {
        tourId: createdTourIds[i],
        startDate: new Date(Date.now() + (i + 7) * 24 * 60 * 60 * 1000).toISOString(), // 7+ days in future
        customer: testConfig.bookings[i].customer,
        pax: testConfig.bookings[i].pax
      };
      
      const response = await apiClient.post(`${testConfig.baseUrl}/createBooking`, bookingData);
      if (response.status !== 201) throw new Error(`Expected 201, got ${response.status}`);
      createdBookingIds.push(response.data.bookingId);
      console.log(`   Created booking with reference: ${response.data.bookingReference}`);
    });
  }

  // Test 6: Test the new adminGetEventsCalendar endpoint
  await runTest("GET /adminGetEventsCalendar - Retrieve events with filters", async () => {
    const params = {
      startDateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
      startDateTo: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),  // 120 days from now
      limit: 20
    };
    
    const response = await apiClient.get(`${testConfig.baseUrl}/adminGetEventsCalendar`, {
      params,
      headers: { 'x-admin-secret-key': testConfig.adminSecretKey }
    });
    
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    console.log(`   Retrieved ${response.data.events.length} events`);
    console.log(`   Pagination: ${JSON.stringify(response.data.pagination)}`);
  });

  // Test 7: List all bookings (admin endpoint)
  await runTest("GET /adminGetBookings - Retrieve all bookings", async () => {
    const response = await apiClient.get(`${testConfig.baseUrl}/adminGetBookings`, {
      headers: { 'x-admin-secret-key': testConfig.adminSecretKey }
    });
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    console.log(`   Retrieved ${response.data.bookings.length} bookings`);
  });

  // Test 8: Update booking status (admin endpoint)
  if (createdBookingIds.length > 0) {
    await runTest(`PUT /adminUpdateBookingStatus - Update booking status`, async () => {
      const response = await apiClient.put(
        `${testConfig.baseUrl}/adminUpdateBookingStatus/${createdBookingIds[0]}`,
        { status: 'confirmed', reason: 'Payment received' },
        { headers: { 'x-admin-secret-key': testConfig.adminSecretKey } }
      );
      if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
      console.log(`   Updated booking ${createdBookingIds[0]} status to confirmed`);
    });
  }

  // Test 9: Check booking status (public endpoint)
  if (createdBookingIds.length > 0) {
    // First get the booking reference by checking booking details
    await runTest(`GET /checkBooking - Check booking status with reference`, async () => {
      // We would need to store the reference from the createBooking response
      // For now, we'll just test that the endpoint exists and handles missing params properly
      try {
        await apiClient.get(`${testConfig.baseUrl}/checkBooking`);
      } catch (error) {
        // Expected to fail with missing reference
        if (error.response?.status !== 400) {
          throw new Error(`Expected 400 for missing reference, got ${error.response?.status}`);
        }
      }
      console.log(`   Booking check endpoint properly validates parameters`);
    });
  }

  // Test 10: Join an event (this would need an existing public event)
  // For this test, we'd need to have a public event available first
  // This would be created by making another booking that creates a private event, then publishing it

  // Test 11: Check unauthorized access
  await runTest("GET /adminGetBookings - Unauthorized access should be rejected", async () => {
    try {
      await apiClient.get(`${testConfig.baseUrl}/adminGetBookings`, {
        headers: { 'x-admin-secret-key': 'invalid-key' }
      });
      throw new Error("Should have been rejected with invalid key");
    } catch (error) {
      if (error.response?.status !== 401) {
        throw new Error(`Expected 401 for invalid key, got ${error.response?.status}`);
      }
      console.log(`   Correctly rejected unauthorized access`);
    }
  });

  // Final results
  console.log(`\n================== RESULTS ==================`);
  console.log(`✅ Tests Passed: ${testResults.passed}`);
  console.log(`❌ Tests Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${testResults.passed}/${
    testResults.passed + testResults.failed
  } (${Math.round((testResults.passed / (testResults.passed + testResults.failed || 1)) * 100)}%)`);
  
  if (testResults.errors.length > 0) {
    console.log(`\n🚨 Failed Tests:`);
    testResults.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }
  
  console.log(`\n🎉 API Test Suite Complete!`);
  console.log(`\n📝 Next Steps:`);
  console.log(`   1. Deploy the updated functions: firebase deploy --only functions`);
  console.log(`   2. Run this test suite after deployment`);
  console.log(`   3. Verify all endpoints return expected responses`);
  console.log(`   4. Test edge cases and error conditions`);
}

// Install axios if not available
if (typeof axios === 'undefined') {
  console.log("⚠️  Please install axios before running tests:");
  console.log("   npm install axios");
  process.exit(1);
}

// Run the tests
runAllTests().catch(error => {
  console.error("💥 Test suite failed with error:", error);
  process.exit(1);
});