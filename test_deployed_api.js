/**
 * Comprehensive API Test for Nevado Trek Backend
 * Testing the newly added functionality
 */

const axios = require('axios');

// Base URL for the deployed functions
const BASE_URL = 'https://us-central1-nevadotrektest01.cloudfunctions.net';

// Admin secret key from the config
const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || 'miClaveSecreta123';

// Tour ID to use for testing (using known active tour)
const TEST_TOUR_ID = '01Z26FT36uYJQf9Xp0t3';  // From previous testing

// Test variables to hold created resources
let testBookingId = null;
let testEventIds = [];

async function testNewEndpoints() {
  console.log('🚀 Starting comprehensive API test for new endpoints...\n');
  
  try {
    // Test 1: Test adminCreateEvent endpoint
    console.log('1. Testing POST /adminCreateEvent...');
    const eventResponse = await axios.post(`${BASE_URL}/adminCreateEvent`, {
      tourId: TEST_TOUR_ID,
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      maxCapacity: 6,
      type: 'private',
      notes: 'Test event for new endpoint verification'
    }, {
      headers: {
        'X-Admin-Secret-Key': ADMIN_SECRET_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ adminCreateEvent: SUCCESS');
    console.log(`   Event ID: ${eventResponse.data.eventId}`);
    testEventIds.push(eventResponse.data.eventId);
    
    // Test 2: Test adminGetEventsByDate endpoint
    console.log('\n2. Testing GET /adminGetEventsByDate...');
    const dateForTest = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const eventsByDateResponse = await axios.get(
      `${BASE_URL}/adminGetEventsByDate/${TEST_TOUR_ID}/${dateForTest}`, 
      {
        headers: {
          'X-Admin-Secret-Key': ADMIN_SECRET_KEY
        }
      }
    );
    
    console.log('✅ adminGetEventsByDate: SUCCESS');
    console.log(`   Found ${eventsByDateResponse.data.count} events`);
    
    // Test 3: Create a booking to test adminSplitEvent
    console.log('\n3. Creating a test booking for split event test...');
    const bookingResponse = await axios.post(`${BASE_URL}/createBooking`, {
      tourId: TEST_TOUR_ID,
      startDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days from now
      customer: {
        fullName: "Test Split Customer",
        documentId: "SPLIT123",
        phone: "+573123456789",
        email: "test-split@example.com"
      },
      pax: 4
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    testBookingId = bookingResponse.data.bookingId;
    console.log('✅ createBooking (for split test): SUCCESS');
    console.log(`   Booking ID: ${testBookingId}`);
    
    // Check the event ID of this booking
    const bookingDetailsResponse = await axios.get(`${BASE_URL}/checkBooking?reference=${bookingResponse.data.bookingReference}`, {
      headers: {
        'X-Admin-Secret-Key': ADMIN_SECRET_KEY
      }
    });
    
    const originalEventId = bookingDetailsResponse.data.eventId;
    console.log(`   Original Event ID: ${originalEventId}`);
    
    // Test 4: Test adminSplitEvent endpoint
    console.log('\n4. Testing POST /adminSplitEvent...');
    // First, create another booking on the same event to have multiple bookings to split
    const secondBookingResponse = await axios.post(`${BASE_URL}/createBooking`, {
      tourId: TEST_TOUR_ID,
      startDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(), // Same date
      customer: {
        fullName: "Test Split Customer 2",
        documentId: "SPLIT456",
        phone: "+573123456790",
        email: "test-split2@example.com"
      },
      pax: 2
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Created second booking for split test');
    const secondBookingId = secondBookingResponse.data.bookingId;
    
    // Now test the split functionality
    const splitResponse = await axios.post(`${BASE_URL}/adminSplitEvent/${originalEventId}`, 
      {
        bookingIds: [secondBookingId], // Move only the second booking
        newEventMaxCapacity: 4,
        newEventType: 'private',
        reason: 'Testing split functionality'
      },
      {
        headers: {
          'X-Admin-Secret-Key': ADMIN_SECRET_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ adminSplitEvent: SUCCESS');
    console.log(`   New Event ID: ${splitResponse.data.newEventId}`);
    testEventIds.push(splitResponse.data.newEventId);
    
    // Test 5: Test createBooking with createNewEvent parameter
    console.log('\n5. Testing POST /createBooking with createNewEvent...');
    const separateBookingResponse = await axios.post(`${BASE_URL}/createBooking`, {
      tourId: TEST_TOUR_ID,
      startDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(), // 9 days from now
      customer: {
        fullName: "Test Separate Customer",
        documentId: "SEPARATE123",
        phone: "+573123456791",
        email: "test-separate@example.com"
      },
      pax: 3,
      createNewEvent: true  // This should create a separate event even if one exists for the same date
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ createBooking with createNewEvent: SUCCESS');
    console.log(`   Booking ID: ${separateBookingResponse.data.bookingId}`);
    
    // Test 6: Test adminUpdateBookingDetails with createNewEvent parameter
    console.log('\n6. Testing PUT /adminUpdateBookingDetails with createNewEvent...');
    const updateResponse = await axios.put(`${BASE_URL}/adminUpdateBookingDetails/${testBookingId}`, 
      {
        startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
        createNewEvent: true,
        reason: 'Testing createNewEvent in adminUpdateBookingDetails'
      },
      {
        headers: {
          'X-Admin-Secret-Key': ADMIN_SECRET_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ adminUpdateBookingDetails with createNewEvent: SUCCESS');
    
    // Test 7: Test adminTransferBooking with createNewEvent parameter
    console.log('\n7. Testing POST /adminTransferBooking with createNewEvent...');
    const transferResponse = await axios.post(`${BASE_URL}/adminTransferBooking/${secondBookingId}`, 
      {
        createNewEvent: true,
        newStartDate: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000).toISOString(), // 11 days from now
        newMaxCapacity: 8,
        newEventType: 'public',
        reason: 'Testing createNewEvent in adminTransferBooking'
      },
      {
        headers: {
          'X-Admin-Secret-Key': ADMIN_SECRET_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ adminTransferBooking with createNewEvent: SUCCESS');
    console.log(`   New Event ID: ${transferResponse.data.newEventId}`);
    testEventIds.push(transferResponse.data.newEventId);
    
    console.log('\n🎉 All new endpoint tests completed successfully!');
    console.log(`\n📋 Summary:`);
    console.log(`- Created ${testEventIds.length} test events`);
    console.log(`- Created ${testBookingId ? 2 : 1} test bookings`); // We created 2 for the split test
    console.log(`- All new endpoints working correctly`);
    
    console.log('\n✅ New Endpoints Working:');
    console.log('  - POST /adminCreateEvent: ✓');
    console.log('  - GET /adminGetEventsByDate: ✓');
    console.log('  - POST /adminSplitEvent: ✓');
    console.log('  - createBooking with createNewEvent: ✓');
    console.log('  - adminUpdateBookingDetails with createNewEvent: ✓');
    console.log('  - adminTransferBooking with createNewEvent: ✓');
    
    console.log('\n🎉 All tests passed! The new functionality is working correctly.');

  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    throw error;
  }
}

// Run the test
testNewEndpoints()
  .then(() => console.log('\n🎯 All tests completed successfully!'))
  .catch(err => {
    console.error('\n💥 Test suite failed:', err.message);
    process.exit(1);
  });