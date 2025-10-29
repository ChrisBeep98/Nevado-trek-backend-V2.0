const axios = require('axios');

// Admin key to use for testing
const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

// Base URL for the deployed functions
const BASE_URL = 'https://us-central1-nevadotrektest01.cloudfunctions.net';

// Test admin get bookings to find a booking to test with
async function testAdminGetBookings() {
    try {
        console.log('Testing GET /adminGetBookings...');
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

// Test a simple update that should work (like customer info) to make sure basic functionality works
async function testSimpleUpdate() {
    console.log('\n=== Testing simple booking update (customer info) ===');
    
    const bookingData = await testAdminGetBookings();
    if (!bookingData || bookingData.bookings.length === 0) {
        console.log('No bookings found to test with');
        return;
    }
    
    const testBooking = bookingData.bookings[0];
    console.log('Testing with booking ID:', testBooking.bookingId);
    
    try {
        // Try to update customer name (this should work)
        const response = await axios.put(`${BASE_URL}/adminUpdateBookingDetails/${testBooking.bookingId}`, {
            customer: {
                ...testBooking.customer,
                fullName: testBooking.customer.fullName + " - Updated"
            },
            reason: "Test simple update"
        }, {
            headers: {
                'X-Admin-Secret-Key': ADMIN_KEY,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✓ Simple update successful:', response.data.message);
        console.log('EventId unchanged (as expected):', response.data.booking?.eventId === testBooking.eventId ? "Yes" : "No");
        return true;
    } catch (error) {
        console.error('✗ Simple update failed:', error.response?.data || error.message);
        return false;
    }
}

// Test a date update with extra debugging
async function testDateUpdateWithDebugging() {
    console.log('\n=== Testing date update with debugging ===');
    
    const bookingData = await testAdminGetBookings();
    if (!bookingData || bookingData.bookings.length === 0) {
        console.log('No bookings found to test with');
        return;
    }
    
    const testBooking = bookingData.bookings[0];
    console.log('Testing with booking ID:', testBooking.bookingId);
    console.log('Current eventId:', testBooking.eventId);
    
    // Check the tour ID to create a different date for the same tour
    console.log('Booking tourId:', testBooking.tourId);
    
    // Prepare a future date that should create a new event
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + 30); // 30 days in the future
    const newDateStr = newDate.toISOString();
    
    console.log('Attempting to update to date:', newDateStr);
    
    try {
        const response = await axios.put(`${BASE_URL}/adminUpdateBookingDetails/${testBooking.bookingId}`, {
            startDate: newDateStr,
            reason: "Debug date update"
        }, {
            headers: {
                'X-Admin-Secret-Key': ADMIN_KEY,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✓ Date update response:', response.data.message);
        console.log('Old eventId:', testBooking.eventId);
        console.log('New eventId:', response.data.booking?.eventId);
        console.log('EventId changed:', response.data.booking?.eventId !== testBooking.eventId ? "Yes" : "No");
        
        // Log more details about the updated booking
        if (response.data.booking) {
            console.log('Updated booking keys:', Object.keys(response.data.booking));
            // Check if there's a startDate field in the response
            if (response.data.booking.startDate) {
                console.log('Booking has startDate field:', response.data.booking.startDate);
            }
        }
        
        return response.data;
    } catch (error) {
        console.error('✗ Date update failed:', error.response?.data || error.message);
        if (error.response) {
            console.log('Error status:', error.response.status);
            console.log('Error data:', error.response.data);
        }
        return null;
    }
}

// Run the tests
async function runDetailedTests() {
    console.log('Starting detailed API tests...\n');
    
    await testSimpleUpdate();
    await testDateUpdateWithDebugging();
    
    console.log('\nDetailed API Tests Completed');
}

// Run the tests
runDetailedTests().catch(console.error);