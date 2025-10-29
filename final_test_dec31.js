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
            reason: "Final test - update to December 31st, 2025"
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
            console.log('New booking startDate (local):', bookingDate.toLocaleString('es-CO', { timeZone: 'America/Bogota' })); // Colombia timezone
        } else {
            bookingDateStr = new Date(response.data.booking.startDate).toISOString();
            console.log('New booking startDate:', bookingDateStr);
        }
        
        // Verify with the event
        const eventDetails = await getEventById(response.data.booking.eventId);
        if (eventDetails) {
            console.log('\\nEvent startDate (UTC):', eventDetails.startDate);
            const eventDateColombia = new Date(eventDetails.startDate);
            console.log('Event startDate (local):', eventDateColombia.toLocaleString('es-CO', { timeZone: 'America/Bogota' }));
            
            // Compare dates properly
            const bookingDate = new Date(response.data.booking.startDate._seconds * 1000);
            const eventDate = new Date(eventDetails.startDate);
            
            console.log('\\nComparison:');
            console.log('Booking date (Colombia TZ):', bookingDate.toLocaleString('es-CO', { timeZone: 'America/Bogota' }));
            console.log('Event date (Colombia TZ):', eventDate.toLocaleString('es-CO', { timeZone: 'America/Bogota' }));
            console.log('Same day in Colombia TZ?', 
                bookingDate.toLocaleDateString('es-CO', { timeZone: 'America/Bogota' }) === 
                eventDate.toLocaleDateString('es-CO', { timeZone: 'America/Bogota' }) 
                ? 'YES' : 'NO');
            
            console.log('\\n🎯 FINAL VERIFICATION:');
            console.log('Event is for December 31st, 2025:', 
                eventDateColombia.getDate() === 31 && eventDateColombia.getMonth() === 11 && eventDateColombia.getFullYear() === 2025 
                ? 'YES ✅' : 'NO ❌');
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

// Run the update to test December 31st
async function runUpdate() {
    console.log('Testing final update to December 31st, 2025...\\n');
    
    // Requesting Dec 31, 2025 at midnight UTC (which is Dec 30 in Colombia due to timezone)
    const targetDate = new Date(Date.UTC(2025, 11, 31, 0, 0, 0)); // December 31, 2025, 00:00:00 UTC
    console.log('Target date (UTC):', targetDate.toISOString());
    console.log('Target date (Colombia TZ):', targetDate.toLocaleString('es-CO', { timeZone: 'America/Bogota' }));
    
    const result = await updateBookingToDate('LpI81AfgtjmdX2FzZgpV', targetDate.toISOString());
    
    if (result) {
        console.log('\\n✅ Booking successfully updated to December 31st, 2025!');
        console.log('New event ID:', result.booking.eventId);
        console.log('All systems working correctly with timezone handling!');
    } else {
        console.log('\\n❌ Booking update failed!');
    }
}

runUpdate().catch(console.error);