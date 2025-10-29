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
            reason: "Requested date update to ensure proper timezone handling"
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

// Run the update with a clear date
async function runUpdate() {
    console.log('Starting timezone-aware date update...\n');
    
    // Requesting Nov 30, 2025 in a timezone-aware way
    const targetDate = new Date(Date.UTC(2025, 10, 30, 0, 0, 0)); // month is 0-indexed, so 10 = November
    console.log('Target date (UTC):', targetDate.toISOString());
    
    const result = await updateBookingToDate('LpI81AfgtjmdX2FzZgpV', targetDate.toISOString());
    
    if (result) {
        console.log('\nBooking date update completed!');
        console.log('New event ID:', result.booking.eventId);
    } else {
        console.log('\nBooking date update failed!');
    }
}

runUpdate().catch(console.error);