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
            reason: "Testing timezone fix with date-only format"
        }, {
            headers: {
                'X-Admin-Secret-Key': ADMIN_KEY,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Date update successful!');
        console.log('Response message:', response.data.message);
        console.log('New Event ID:', response.data.booking.eventId);
        
        // Check the updated startDate
        let bookingDateStr;
        if (response.data.booking.startDate && response.data.booking.startDate._seconds) {
            const bookingDate = new Date(response.data.booking.startDate._seconds * 1000);
            bookingDateStr = bookingDate.toISOString();
            console.log('New booking startDate (UTC):', bookingDateStr);
            console.log('New booking startDate (Colombia):', bookingDate.toLocaleString('es-CO', { timeZone: 'America/Bogota' }));
        } else {
            bookingDateStr = new Date(response.data.booking.startDate).toISOString();
            console.log('New booking startDate:', bookingDateStr);
        }
        
        // Verify with the event
        const eventDetails = await getEventById(response.data.booking.eventId);
        if (eventDetails) {
            console.log('\\nEvent startDate (UTC):', eventDetails.startDate);
            const eventDateColombia = new Date(eventDetails.startDate);
            console.log('Event startDate (Colombia):', eventDateColombia.toLocaleString('es-CO', { timeZone: 'America/Bogota' }));
            
            // Compare dates properly
            const bookingDate = new Date(response.data.booking.startDate._seconds * 1000);
            const eventDate = new Date(eventDetails.startDate);
            
            console.log('\\nComparison:');
            const bookingColombiaDate = bookingDate.toLocaleDateString('es-CO', { timeZone: 'America/Bogota' });
            const eventColombiaDate = eventDate.toLocaleDateString('es-CO', { timeZone: 'America/Bogota' });
            console.log('Booking date (Colombia):', bookingColombiaDate);
            console.log('Event date (Colombia):', eventColombiaDate);
            console.log('Same day in Colombia?', bookingColombiaDate === eventColombiaDate ? 'YES' : 'NO');
            
            console.log('\\n🎯 FINAL CHECK:');
            const isDec31 = eventColombiaDate.getDate() === 31 && 
                           eventColombiaDate.getMonth() === 11 && // month is 0-indexed 
                           eventColombiaDate.getFullYear() === 2025;
            console.log('Is the date December 31st, 2025 in Colombia timezone?', 
                isDec31 ? 'YES ✅' : 'NO ❌', 
                '(' + eventColombiaDate.toLocaleDateString('es-CO', { timeZone: 'America/Bogota' }) + ')');
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

// Run the update to test timezone fix with date-only format
async function runUpdate() {
    console.log('Testing timezone fix with December 31st, 2025...\\n');
    
    // Using date-only format to trigger the timezone handling
    const targetDate = "2025-12-31"; // Date-only format
    console.log('Target date (date-only format):', targetDate);
    
    const result = await updateBookingToDate('LpI81AfgtjmdX2FzZgpV', targetDate);
    
    if (result) {
        console.log('\\n✅ Booking successfully updated to December 31st, 2025 in Colombia timezone!');
        console.log('New event ID:', result.booking.eventId);
    } else {
        console.log('\\n❌ Booking update failed!');
    }
}

runUpdate().catch(console.error);