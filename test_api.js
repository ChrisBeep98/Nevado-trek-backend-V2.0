const axios = require('axios');

// Admin key to use for testing
const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

// Base URL for the deployed functions
const BASE_URL = 'https://us-central1-nevadotrektest01.cloudfunctions.net';

// Test getting tours to see if public endpoints work
async function testGetTours() {
    try {
        console.log('Testing GET /getToursV2...');
        const response = await axios.get(`${BASE_URL.replace('/us-central1-', '/gettoursv2-')}-wgfhwjbpva-uc.a.run.app`);
        console.log('✓ GET /getToursV2 Response:', response.data.length, 'tours found');
        return response.data;
    } catch (error) {
        console.error('✗ GET /getToursV2 Error:', error.response?.data || error.message);
        return null;
    }
}

// Test admin endpoint 
async function testAdminGetBookings() {
    try {
        console.log('\nTesting GET /adminGetBookings...');
        const response = await axios.get(`${BASE_URL}/adminGetBookings`, {
            headers: {
                'X-Admin-Secret-Key': ADMIN_KEY
            }
        });
        console.log('✓ GET /adminGetBookings Response:', response.data.bookings.length, 'bookings found');
        return response.data;
    } catch (error) {
        console.error('✗ GET /adminGetBookings Error:', error.response?.data || error.message);
        return null;
    }
}

// Test admin update booking details with startDate
async function testAdminUpdateBookingDetails(bookingId, updates) {
    try {
        console.log('\nTesting PUT /adminUpdateBookingDetails...');
        console.log('Booking ID:', bookingId);
        console.log('Updates:', updates);
        
        const response = await axios.put(`${BASE_URL}/adminUpdateBookingDetails/${bookingId}`, updates, {
            headers: {
                'X-Admin-Secret-Key': ADMIN_KEY,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✓ PUT /adminUpdateBookingDetails Response:', response.data.message);
        console.log('Updated Booking startDate in response:', response.data.booking?.startDate);
        return response.data;
    } catch (error) {
        console.error('✗ PUT /adminUpdateBookingDetails Error:', error.response?.data || error.message);
        return null;
    }
}

// Test the specific issue with startDate update
async function testStartDateUpdate() {
    console.log('\n=== Testing the specific issue with startDate update ===');
    
    // First get bookings to find one to test with
    const bookingData = await testAdminGetBookings();
    if (!bookingData || bookingData.bookings.length === 0) {
        console.log('No bookings found to test with');
        return;
    }
    
    const testBooking = bookingData.bookings[0];
    console.log('Testing with booking ID:', testBooking.bookingId || testBooking.bookingId);
    
    // Get the current booking details first
    console.log('Current booking startDate:', testBooking.startDate);
    
    // Try to update the startDate (this is the bug we're testing)
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + 30); // 30 days from now
    const newDateStr = newDate.toISOString().split('T')[0] + 'T00:00:00.000Z';
    
    console.log('Attempting to update startDate to:', newDateStr);
    
    const updateResponse = await testAdminUpdateBookingDetails(
        testBooking.bookingId || testBooking.bookingId, 
        {
            startDate: newDateStr,
            reason: "Test update for startDate issue"
        }
    );
    
    if (updateResponse) {
        console.log('Update response received');
        // Check if the startDate was actually updated in the response
        if (updateResponse.booking && updateResponse.booking.startDate) {
            console.log('Updated booking startDate in response:', updateResponse.booking.startDate);
            
            // If the date still matches the original, the issue exists
            if (JSON.stringify(updateResponse.booking.startDate) === JSON.stringify(testBooking.startDate)) {
                console.log('🐛 CONFIRMED: startDate was not updated in the database despite successful response');
            } else {
                console.log('✅ startDate was successfully updated');
            }
        }
    }
}

// Run tests
async function runTests() {
    console.log('Starting API Tests...\n');
    
    // Test public endpoint first
    await testGetTours();
    
    // Test admin endpoints
    await testAdminGetBookings();
    
    // Test the specific issue
    await testStartDateUpdate();
    
    console.log('\nAPI Tests Completed');
}

// Run the tests
runTests().catch(console.error);