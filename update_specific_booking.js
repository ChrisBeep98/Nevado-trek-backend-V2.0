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
            reason: "Requested date update to November 31st (will become Dec 1st since Nov has 30 days)"
        }, {
            headers: {
                'X-Admin-Secret-Key': ADMIN_KEY,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Date update successful!');
        console.log('Response message:', response.data.message);
        console.log('New Event ID:', response.data.booking.eventId);
        console.log('Previous states length:', response.data.booking.previousStates?.length || 0);
        
        // Check if the date is reflected correctly
        if (response.data.booking.previousStates && response.data.booking.previousStates.length > 0) {
            const lastChange = response.data.booking.previousStates[response.data.booking.previousStates.length - 1];
            if (lastChange.action === 'date_change') {
                console.log('Date change tracked:', lastChange.fromEventId, '→', lastChange.toEventId);
            }
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

// Run the specific update
async function runUpdate() {
    console.log('Starting specific date update...\n');
    
    // Note: November only has 30 days, so November 31st will become December 1st
    const targetDate = new Date('2025-11-31T00:00:00.000Z'); 
    console.log('Target date (will be adjusted):', targetDate.toISOString());
    
    const result = await updateBookingToDate('LpI81AfgtjmdX2FzZgpV', targetDate.toISOString());
    
    if (result) {
        console.log('\nBooking date update completed!');
        console.log('New event ID:', result.booking.eventId);
    } else {
        console.log('\nBooking date update failed!');
    }
}

runUpdate().catch(console.error);