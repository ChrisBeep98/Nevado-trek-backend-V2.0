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
            reason: "Requested date update to December 5th, 2025"
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

// Run the update to December 5th
async function runUpdate() {
    console.log('Starting update to December 5th, 2025...\n');
    
    // Requesting Dec 5, 2025 in UTC
    const targetDate = new Date(Date.UTC(2025, 11, 5, 0, 0, 0)); // month is 0-indexed, so 11 = December
    console.log('Target date (UTC):', targetDate.toISOString());
    
    const result = await updateBookingToDate('LpI81AfgtjmdX2FzZgpV', targetDate.toISOString());
    
    if (result) {
        console.log('\n✅ Booking successfully updated to December 5th, 2025!');
        console.log('New event ID:', result.booking.eventId);
        console.log('Booking is now associated with the new event.');
    } else {
        console.log('\n❌ Booking date update failed!');
    }
}

runUpdate().catch(console.error);