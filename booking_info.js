const axios = require('axios');

// The secret admin key provided by the user
const ADMIN_SECRET_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

// Base URL for the API - adjust this to your actual deployed URL
const BASE_URL = 'https://us-central1-nevadotrektest01.cloudfunctions.net';

// Axios instance with default headers
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'X-Admin-Secret-Key': ADMIN_SECRET_KEY,
    'Content-Type': 'application/json'
  }
});

// Function to get booking information
async function getBookingInfo() {
  console.log('Fetching booking information...\n');

  try {
    // Get all bookings
    const response = await api.get('/adminGetBookings');
    
    console.log('Total Booking Count:', response.data.bookings.length);
    console.log('Has More Results:', response.data.pagination.hasMore);
    console.log('Pagination Limit:', response.data.pagination.limit);
    console.log('Pagination Offset:', response.data.pagination.offset);
    
    console.log('\nBooking Status Breakdown:');
    const statusCounts = {};
    response.data.bookings.forEach(booking => {
      statusCounts[booking.status] = (statusCounts[booking.status] || 0) + 1;
    });
    
    for (const [status, count] of Object.entries(statusCounts)) {
      console.log(`  - ${status}: ${count}`);
    }
    
    console.log('\nTour Breakdown:');
    const tourCounts = {};
    response.data.bookings.forEach(booking => {
      const tourName = booking.tourName;
      tourCounts[tourName] = (tourCounts[tourName] || 0) + 1;
    });
    
    for (const [tourName, count] of Object.entries(tourCounts)) {
      console.log(`  - ${tourName}: ${count}`);
    }
    
    console.log('\nDetailed Booking Information:');
    console.log('----------------------------------');
    
    response.data.bookings.forEach((booking, index) => {
      console.log(`\n${index + 1}. Booking ID: ${booking.bookingId}`);
      console.log(`   Reference: ${booking.bookingReference}`);
      console.log(`   Tour: ${booking.tourName}`);
      console.log(`   Status: ${booking.status}`);
      console.log(`   Pax: ${booking.pax}`);
      console.log(`   Price per person: ${JSON.stringify(booking.pricePerPerson)}`);
      console.log(`   Total price: ${booking.totalPrice}`);
      console.log(`   Customer: ${booking.customer?.fullName}`);
      console.log(`   Email: ${booking.customer?.email}`);
      console.log(`   Phone: ${booking.customer?.phone}`);
      console.log(`   Created: ${booking.createdAt ? new Date(booking.createdAt._seconds * 1000).toISOString() : 'N/A'}`);
      console.log(`   Updated: ${booking.updatedAt ? new Date(booking.updatedAt._seconds * 1000).toISOString() : 'N/A'}`);
      console.log(`   Event Origin: ${booking.isEventOrigin ? 'Yes' : 'No'}`);
      console.log(`   IP Address: ${booking.ipAddress}`);
    });

  } catch (error) {
    console.error('Error fetching booking information:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

// Run the function
getBookingInfo().catch(console.error);