const axios = require('axios');

// The secret admin key provided by the user
const ADMIN_SECRET_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

// Base URL for the API - adjust this to your actual deployed URL
const BASE_URL = 'https://us-central1-nevadotrektest01.cloudfunctions.net';

// Axios instance with default headers
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000, // 15 seconds timeout
  headers: {
    'X-Admin-Secret-Key': ADMIN_SECRET_KEY,
    'Content-Type': 'application/json'
  }
});

// Function to verify the booking with "paid" status
async function verifyPaidStatusBooking() {
  console.log('Verifying the booking created with "paid" status...\n');

  try {
    // Get all bookings to find the one with paid status
    const bookingsResponse = await api.get('/adminGetBookings');
    
    // Find bookings with our test customer name
    const testBookings = bookingsResponse.data.bookings.filter(booking => 
      booking.customer.fullName.includes('Confirmed Status Test')
    );
    
    if (testBookings.length > 0) {
      console.log('Found', testBookings.length, 'test booking(s) with "Confirmed Status Test"');
      
      testBookings.forEach(booking => {
        console.log('\nBooking details:');
        console.log('  - Booking ID:', booking.bookingId);
        console.log('  - Customer:', booking.customer.fullName);
        console.log('  - Status:', booking.status);
        console.log('  - Reference:', booking.bookingReference);
        console.log('  - Created at:', new Date(booking.createdAt._seconds * 1000).toISOString());
        console.log('  - Status history:', booking.statusHistory);
      });
    } else {
      console.log('No bookings found with "Confirmed Status Test" customer name');
      
      // Let's check the most recent bookings regardless
      const recentBookings = bookingsResponse.data.bookings.slice(0, 5);
      console.log('\nMost recent bookings:');
      recentBookings.forEach(booking => {
        console.log('  - Booking ID:', booking.bookingId, '| Customer:', booking.customer.fullName, '| Status:', booking.status);
      });
    }
  } catch (error) {
    console.error('Error verifying booking:', error.message);
  }
}

// Run the verification
verifyPaidStatusBooking().catch(console.error);