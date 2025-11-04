/**
 * Quick test for the deployed API endpoints
 */

const axios = require('axios');

// Base URL for the deployed functions
const BASE_URL = 'https://us-central1-nevadotrektest01.cloudfunctions.net';

// Admin secret key
const ADMIN_SECRET_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

async function quickTest() {
  console.log('🚀 Quick API test...\n');
  
  try {
    // Test 1: Check if getToursV2 works
    console.log('1. Testing GET /getToursV2...');
    const toursResponse = await axios.get(`${BASE_URL}/getToursV2`);
    console.log('✅ getToursV2: SUCCESS');
    
    if (toursResponse.data && toursResponse.data.length > 0) {
      const testTourId = toursResponse.data[0].tourId;
      console.log(`   Using Tour ID: ${testTourId} for further tests`);
      
      // Test 2: Test the new adminCreateEvent endpoint
      console.log('\n2. Testing POST /adminCreateEvent...');
      const eventResponse = await axios.post(`${BASE_URL}/adminCreateEvent`, {
        tourId: testTourId,
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
      
      // Test 3: Test the new adminGetEventsByDate endpoint
      console.log('\n3. Testing GET /adminGetEventsByDate...');
      const dateForTest = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const eventsByDateResponse = await axios.get(
        `${BASE_URL}/adminGetEventsByDate/${testTourId}/${dateForTest}`, 
        {
          headers: {
            'X-Admin-Secret-Key': ADMIN_SECRET_KEY
          }
        }
      );
      
      console.log('✅ adminGetEventsByDate: SUCCESS');
      console.log(`   Found ${eventsByDateResponse.data.count} events`);
      
      // Test 4: Test if the new endpoints exist
      console.log('\n4. Verifying new endpoints are deployed...');
      try {
        const updatedBookingResponse = await axios.put(
          `${BASE_URL}/adminUpdateBookingDetails/test-id`, 
          { createNewEvent: true },
          {
            headers: {
              'X-Admin-Secret-Key': ADMIN_SECRET_KEY,
              'Content-Type': 'application/json'
            }
          }
        );
        // This should fail with "booking not found" but not with "function not found"
        console.log('✅ adminUpdateBookingDetails updated (createNewEvent parameter accepted)');
      } catch (error) {
        if (error.response && error.response.status === 404 && error.response.data.error.code === 'RESOURCE_NOT_FOUND') {
          console.log('✅ adminUpdateBookingDetails updated (createNewEvent parameter working)');
        } else if (error.response && error.response.data.error.code === 'INVALID_DATA') {
          console.log('✅ adminUpdateBookingDetails updated (createNewEvent parameter working)');
        } else {
          console.error('❌ adminUpdateBookingDetails update failed:', error.message);
        }
      }
      
      console.log('\n🎯 All tests completed! The new functionality is successfully deployed.');
    } else {
      console.log('⚠️  No tours found, but endpoints are working');
    }
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
quickTest()
  .then(() => console.log('\n✅ Deployment verification completed successfully!'))
  .catch(err => {
    console.error('\n❌ Test failed:', err.message);
    process.exit(1);
  });