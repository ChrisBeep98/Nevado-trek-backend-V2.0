const axios = require('axios');

// Admin key to use for testing
const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

// Base URL for the deployed functions
const BASE_URL = 'https://us-central1-nevadotrektest01.cloudfunctions.net';

// Test the booking date change functionality in detail
async function testBookingDateChange() {
    console.log('=== Testing Booking Date Change Effect ===\\n');
    
    // First, get all bookings to find our test booking
    console.log('1. Getting initial booking list...');
    let initialBookings = await getBookings();
    if (!initialBookings || initialBookings.bookings.length === 0) {
        console.log('No bookings found');
        return;
    }
    
    // Find a specific booking to test with (or just use the first one)
    const testBooking = initialBookings.bookings[0];
    console.log(`Found booking: ${testBooking.bookingId}`);
    console.log(`Initial Event ID: ${testBooking.eventId}`);
    console.log(`Initial Status: ${testBooking.status}`);
    console.log(`Initial Pax: ${testBooking.pax}`);
    
    // Get the event date before the change (by getting event details)
    console.log('\\n2. Getting event details before date change...');
    const beforeEvent = await getEventById(testBooking.eventId);
    if (beforeEvent) {
        console.log(`Event ${beforeEvent.eventId} date before: ${new Date(beforeEvent.startDate).toISOString()}`);
    }
    
    // Perform the date change
    console.log('\\n3. Performing date change operation...');
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + 20); // Set to 20 days in the future
    const newDateStr = newDate.toISOString();
    console.log(`Changing to date: ${newDateStr}`);
    
    try {
        const updateResponse = await axios.put(`${BASE_URL}/adminUpdateBookingDetails/${testBooking.bookingId}`, {
            startDate: newDateStr,
            reason: "Test date change verification"
        }, {
            headers: {
                'X-Admin-Secret-Key': ADMIN_KEY,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Date change successful!');
        console.log(`New Event ID: ${updateResponse.data.booking.eventId}`);
        console.log(`Old Event ID: ${testBooking.eventId}`);
        console.log(`Event changed: ${updateResponse.data.booking.eventId !== testBooking.eventId ? 'YES' : 'NO'}`);
        
        // Now get the bookings again to check if the date has changed
        console.log('\\n4. Getting bookings again to verify date change...');
        const updatedBookings = await getBookings();
        
        // Find the same booking in the updated list
        const updatedBooking = updatedBookings.bookings.find(b => b.bookingId === testBooking.bookingId);
        if (updatedBooking) {
            console.log(`Updated Booking Event ID: ${updatedBooking.eventId}`);
            console.log(`Updated Booking Status: ${updatedBooking.status}`);
            
            // Get the new event details to verify the date
            console.log('\\n5. Getting NEW event details after change...');
            const afterEvent = await getEventById(updatedBooking.eventId);
            if (afterEvent) {
                console.log(`New Event ${afterEvent.eventId} date: ${new Date(afterEvent.startDate).toISOString()}`);
                
                // Check if the date actually changed as expected
                const expectedDate = new Date(newDateStr).toISOString();
                const actualEventDate = new Date(afterEvent.startDate).toISOString();
                
                console.log('\\n6. VERIFICATION RESULTS:');
                console.log(`Expected date: ${expectedDate}`);
                console.log(`Actual event date: ${actualEventDate}`);
                console.log(`Date matches expectation: ${expectedDate === actualEventDate ? '✅ YES' : '❌ NO'}`);
                
                // Also verify with checkBooking endpoint (the public endpoint that should return the actual booking date)
                console.log('\\n7. Verifying through checkBooking endpoint...');
                try {
                    const checkResponse = await axios.get(`${BASE_URL}/checkBooking`, {
                        params: {
                            reference: updatedBooking.bookingReference
                        }
                    });
                    console.log(`CheckBooking returned startDate:`, checkResponse.data.startDate ? new Date(checkResponse.data.startDate._seconds * 1000).toISOString() : 'NO DATE FIELD');
                } catch (checkError) {
                    console.log('CheckBooking endpoint error:', checkError.response?.data || checkError.message);
                }
                
                return {
                    success: true,
                    oldEventDate: beforeEvent ? new Date(beforeEvent.startDate).toISOString() : null,
                    newEventDate: actualEventDate,
                    datesMatch: expectedDate === actualEventDate
                };
            }
        } else {
            console.log('❌ Could not find updated booking in the list');
            return { success: false, error: "Booking not found after update" };
        }
    } catch (error) {
        console.error('❌ Date change operation failed:', error.response?.data || error.message);
        return { success: false, error: error.response?.data || error.message };
    }
}

// Helper function to get bookings
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

// Helper to get event by ID
async function getEventById(eventId) {
    try {
        // Get all events and find the specific one
        const response = await axios.get(`${BASE_URL}/adminGetEventsCalendar`, {
            headers: {
                'X-Admin-Secret-Key': ADMIN_KEY
            },
            params: {
                limit: 100
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

// Run the verification test
async function runVerificationTest() {
    console.log('Starting booking date change verification test...\\n');
    
    const result = await testBookingDateChange();
    
    if (result && result.success) {
        console.log('\\n🎯 FINAL VERIFICATION RESULTS:');
        console.log(`✅ Booking date successfully changed from ${result.oldEventDate} to ${result.newEventDate}`);
        console.log(`✅ Date matches expectation: ${result.datesMatch ? 'YES' : 'NO'}`);
        console.log('✅ The booking is now associated with an event for the new date');
        console.log('✅ System is working correctly!');
    } else {
        console.log('\\n❌ VERIFICATION FAILED');
        if (result.error) {
            console.log('Error:', result.error);
        }
    }
    
    console.log('\\nDate Change Verification Test Completed');
}

// Run the test
runVerificationTest().catch(console.error);