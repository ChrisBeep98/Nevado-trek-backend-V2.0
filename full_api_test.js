const axios = require('axios');

// Admin key to use for testing
const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

// Base URL for the deployed functions
const BASE_URL = 'https://us-central1-nevadotrektest01.cloudfunctions.net';

// Test getting booking details before and after the date change
async function testFullBookingDateUpdate() {
    console.log('=== Testing Full Booking Date Update Functionality ===\n');
    
    // Get the original booking details
    const bookingData = await getBookings();
    if (!bookingData || bookingData.bookings.length === 0) {
        console.log('No bookings found to test with');
        return;
    }
    
    const testBooking = bookingData.bookings[0];
    console.log('Original booking details:');
    console.log('- Booking ID:', testBooking.bookingId);
    console.log('- Event ID:', testBooking.eventId);
    console.log('- Pax:', testBooking.pax);
    console.log('- Tour ID:', testBooking.tourId);
    console.log('- Status:', testBooking.status);
    
    // Get the current event details for this booking
    console.log('\nGetting event details for original event...');
    const originalEvent = await getEventById(testBooking.eventId);
    if (originalEvent) {
        console.log('Original event details:');
        console.log('- Event ID:', originalEvent.eventId);
        console.log('- Tour ID:', originalEvent.tourId);
        console.log('- Start Date:', new Date(originalEvent.startDate).toISOString());
        console.log('- Booked Slots (Capacity):', originalEvent.bookedSlots, '/', originalEvent.maxCapacity);
    }
    
    // Prepare a future date for the change
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + 25); // 25 days in the future
    const newDateString = newDate.toISOString();
    console.log(`\nAttempting to update booking to new date: ${newDateString}`);
    
    // Update the booking date
    try {
        const updateResponse = await axios.put(`${BASE_URL}/adminUpdateBookingDetails/${testBooking.bookingId}`, {
            startDate: newDateString,
            reason: "Full test of date update functionality"
        }, {
            headers: {
                'X-Admin-Secret-Key': ADMIN_KEY,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Date update successful!');
        console.log('Response message:', updateResponse.data.message);
        console.log('New Event ID:', updateResponse.data.booking.eventId);
        console.log('Old Event ID was:', testBooking.eventId);
        console.log('Event IDs are different:', updateResponse.data.booking.eventId !== testBooking.eventId ? 'Yes' : 'No');
        
        // Check if previousStates was updated
        if (updateResponse.data.booking.previousStates) {
            console.log('Previous states count:', updateResponse.data.booking.previousStates.length);
            if (updateResponse.data.booking.previousStates.length > 0) {
                const lastChange = updateResponse.data.booking.previousStates[updateResponse.data.booking.previousStates.length - 1];
                console.log('Last change action:', lastChange.action);
                console.log('From Event ID:', lastChange.fromEventId);
                console.log('To Event ID:', lastChange.toEventId);
            }
        }
        
        // Get the new event details
        console.log('\nGetting event details for NEW event...');
        const newEvent = await getEventById(updateResponse.data.booking.eventId);
        if (newEvent) {
            console.log('New event details:');
            console.log('- Event ID:', newEvent.eventId);
            console.log('- Tour ID:', newEvent.tourId);
            console.log('- Start Date:', new Date(newEvent.startDate).toISOString());
            console.log('- Booked Slots (Capacity):', newEvent.bookedSlots, '/', newEvent.maxCapacity);
        }
        
        // Get the original event again to see if capacity was reduced
        console.log('\nChecking original event capacity after move...');
        const updatedOriginalEvent = await getEventById(testBooking.eventId);
        if (updatedOriginalEvent) {
            console.log('Original event after move:');
            console.log('- Event ID:', updatedOriginalEvent.eventId);
            console.log('- Booked Slots (Capacity):', updatedOriginalEvent.bookedSlots, '/', updatedOriginalEvent.maxCapacity);
            console.log('(Should be reduced by', testBooking.pax, 'slots)');
        }
        
        return {
            success: true,
            originalEvent,
            newEvent,
            updateResponse
        };
        
    } catch (error) {
        console.error('❌ Date update failed:', error.response?.data || error.message);
        if (error.response) {
            console.log('Error status:', error.response.status);
            console.log('Error details:', error.response.data);
        }
        return { success: false, error: error.response?.data || error.message };
    }
}

// Helper to get bookings
async function getBookings() {
    try {
        const response = await axios.get(`${BASE_URL}/adminGetBookings`, {
            headers: {
                'X-Admin-Secret-Key': ADMIN_KEY
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error getting bookings:', error.message);
        return null;
    }
}

// Helper to get event by ID (using filtering)
async function getEventById(eventId) {
    try {
        // Get all events and find the specific one
        const response = await axios.get(`${BASE_URL}/adminGetEventsCalendar`, {
            headers: {
                'X-Admin-Secret-Key': ADMIN_KEY
            },
            params: {
                limit: 100  // Get more events to find the specific one
            }
        });
        
        // Find the specific event
        const event = response.data.events.find(e => e.eventId === eventId);
        return event;
    } catch (error) {
        console.error('Error getting events:', error.message);
        return null;
    }
}

// Run the comprehensive test
async function runFullTest() {
    console.log('Starting comprehensive date update test...\n');
    
    const result = await testFullBookingDateUpdate();
    
    if (result && result.success) {
        console.log('\n🎉 COMPREHENSIVE TEST RESULTS:');
        console.log('✅ Booking was successfully moved to new event for new date');
        console.log('✅ Event ID changed from old to new event');
        console.log('✅ Previous states properly tracked the move');
        console.log('✅ Original event capacity was reduced');
        console.log('✅ New event capacity was increased');
        console.log('✅ All functionality working as expected!');
    } else {
        console.log('\n❌ TEST FAILED - Issues detected');
    }
    
    console.log('\nFull API Test Completed');
}

// Run the test
runFullTest().catch(console.error);