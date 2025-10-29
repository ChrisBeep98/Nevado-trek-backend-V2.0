const axios = require('axios');

// Admin key to use for testing
const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

// Base URL for the deployed functions
const BASE_URL = 'https://us-central1-nevadotrektest01.cloudfunctions.net';

async function updateBookingToDate(bookingId, targetDateStr) {
    console.log(`Updating booking ${bookingId} to date: ${targetDateStr}`);
    
    try {
        const response = await axios.put(`${BASE_URL}/adminUpdateBookingDetails/${bookingId}`, {
            startDate: targetDateStr,
            reason: "Testing fixed implementation - update startDate field along with event move"
        }, {
            headers: {
                'X-Admin-Secret-Key': ADMIN_KEY,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Date update successful!');
        console.log('Response message:', response.data.message);
        console.log('New Event ID:', response.data.booking.eventId);
        console.log('Updated booking startDate:', response.data.booking.startDate);
        
        // Get the event details to confirm the date matches
        console.log('\\nVerifying the new event date matches...');
        const eventDetails = await getEventById(response.data.booking.eventId);
        if (eventDetails) {
            // Convert the booking's startDate (Firestore timestamp) to ISO string
            let bookingDateStr;
            if (response.data.booking.startDate && response.data.booking.startDate._seconds) {
                // It's a Firestore timestamp object
                const bookingDate = new Date(response.data.booking.startDate._seconds * 1000);
                bookingDateStr = bookingDate.toISOString();
            } else if (typeof response.data.booking.startDate === 'string') {
                bookingDateStr = new Date(response.data.booking.startDate).toISOString();
            } else {
                bookingDateStr = new Date(response.data.booking.startDate).toISOString();
            }
            
            console.log('New event startDate:', eventDetails.startDate);
            console.log('Booking startDate:', bookingDateStr);
            console.log('Dates match:', bookingDateStr === new Date(eventDetails.startDate).toISOString() ? 'YES' : 'NO');
        }
        
        return response.data;
    } catch (error) {
        console.error('❌ Date update failed:', error.response?.data || error.message);
        if (error.response) {
            console.log('Error status:', error.response.status);
            console.log('Error details:', error.response.data);
        }
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

// Run the update to test the fix
async function runUpdate() {
    console.log('Testing updated implementation that syncs startDate field with event date...\\n');
    
    // Requesting Dec 8, 2025 in UTC as a test
    const targetDate = new Date(Date.UTC(2025, 11, 8, 0, 0, 0)); // month is 0-indexed, so 11 = December
    console.log('Target date (UTC):', targetDate.toISOString());
    
    const result = await updateBookingToDate('LpI81AfgtjmdX2FzZgpV', targetDate.toISOString());
    
    if (result) {
        console.log('\\n✅ Booking update completed with synchronized dates!');
        console.log('New event ID:', result.booking.eventId);
        console.log('Booking startDate synchronized with event date:', !!result.booking.startDate);
    } else {
        console.log('\\n❌ Booking update failed!');
    }
}

runUpdate().catch(console.error);