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

// Function to get event details by ID
async function getEventDetails(eventId) {
    try {
        const response = await axios.get(`${BASE_URL}/adminGetEventsCalendar?limit=1&offset=0`, {
            headers: {
                'X-Admin-Secret-Key': ADMIN_KEY
            },
            params: {
                // Note: we can't filter by ID using the calendar endpoint
                // We'll need to get the event directly or use another approach
            }
        });
        // Since we can't filter by ID with the calendar endpoint, we'll return the first matching event
        // For our test, we'll just check the event IDs in the response
        const matchingEvent = response.data.events.find(event => event.eventId === eventId);
        return matchingEvent;
    } catch (error) {
        console.error('✗ GET /adminGetEventsCalendar Error:', error.response?.data || error.message);
        return null;
    }
}

// Check the booking and its associated event details before and after date update
async function testBookingDateUpdate() {
    console.log('\n=== Testing booking date update functionality ===');
    
    // Get bookings to find one to test with
    const bookingData = await testAdminGetBookings();
    if (!bookingData || bookingData.bookings.length === 0) {
        console.log('No bookings found to test with');
        return;
    }
    
    const testBooking = bookingData.bookings[0];
    console.log('Testing with booking ID:', testBooking.bookingId);
    console.log('Current booking eventId:', testBooking.eventId);
    console.log('Current booking pax:', testBooking.pax);
    
    // Get the current event details
    console.log('Current event ID:', testBooking.eventId);
    
    // Prepare date update
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + 25); // 25 days from now
    const newDateStr = newDate.toISOString().split('T')[0] + 'T00:00:00.000Z';
    
    console.log('Attempting to update booking date to:', newDateStr);
    
    try {
        // Try to update the startDate (the fix we implemented)
        const response = await axios.put(`${BASE_URL}/adminUpdateBookingDetails/${testBooking.bookingId}`, {
            startDate: newDateStr,
            reason: "Test update for date change functionality"
        }, {
            headers: {
                'X-Admin-Secret-Key': ADMIN_KEY,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✓ PUT /adminUpdateBookingDetails Response:', response.data.message);
        console.log('Updated booking has new eventId:', response.data.booking?.eventId);
        console.log('Old eventId was:', testBooking.eventId);
        
        if (response.data.booking && response.data.booking.eventId !== testBooking.eventId) {
            console.log('✅ SUCCESS: Booking was moved to a new event for the new date!');
            console.log('Old event ID:', testBooking.eventId);
            console.log('New event ID:', response.data.booking.eventId);
            
            // Check if previousStates was updated to track the change
            if (response.data.booking.previousStates && response.data.booking.previousStates.length > 0) {
                const lastChange = response.data.booking.previousStates[response.data.booking.previousStates.length - 1];
                if (lastChange.action === 'date_change') {
                    console.log('✅ SUCCESS: Date change was properly tracked in previousStates');
                    console.log('Change details:', lastChange);
                } else {
                    console.log('⚠️  WARNING: Date change was not properly tracked in previousStates');
                }
            } else {
                console.log('⚠️  WARNING: No previousStates tracking found');
            }
        } else {
            console.log('❌ ISSUE: Booking was not moved to a new event');
        }
        
        return response.data;
        
    } catch (error) {
        console.error('✗ PUT /adminUpdateBookingDetails Error:', error.response?.data || error.message);
        console.error('Error details:', error.response?.status, error.response?.statusText);
        return null;
    }
}

// Run a comprehensive test of the API
async function runComprehensiveTest() {
    console.log('Starting comprehensive API test...\n');
    
    // Test admin endpoints
    await testAdminGetBookings();
    
    // Test the date update functionality 
    await testBookingDateUpdate();
    
    console.log('\nComprehensive API Tests Completed');
}

// Run the tests
runComprehensiveTest().catch(console.error);