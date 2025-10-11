const axios = require('axios');

// Configuration
const TOUR_ID = '9ujvQOODur1hEOMoLjEq'; // Your Nevado del Tolima tour ID
const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

// Function to create events for the tour
async function createEventsForTour() {
  console.log('Creating events for tour:', TOUR_ID);
  
  // Define some future dates for events
  const eventDates = [
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
    new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
    new Date(Date.now() + 75 * 24 * 60 * 60 * 1000), // 75 days from now
  ];

  for (const [index, date] of eventDates.entries()) {
    try {
      // First, we need to create a booking which will automatically create an event
      console.log(`Creating booking for event on ${date.toISOString().split('T')[0]}...`);
      
      const bookingData = {
        tourId: TOUR_ID,
        startDate: date.toISOString(),
        customer: {
          fullName: `Test Customer ${index + 1}`,
          documentId: `CC12345678${index + 1}`,
          phone: `+57312345678${index + 1}`,
          email: `test${index + 1}@example.com`,
          notes: `Test booking for tour ${TOUR_ID}`
        },
        pax: 2 // 2 people per booking
      };

      // Make the booking request (this will create the event at the same time)
      const response = await axios.post('https://createbooking-wgfhwjbpva-uc.a.run.app', bookingData);
      console.log(`✅ Event created via booking. Booking ID: ${response.data.bookingId}, Reference: ${response.data.bookingReference}`);
      
      // Wait a bit before creating the next booking to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('❌ Error creating event/booking:', error.response?.data || error.message);
    }
  }
}

// Function to create additional bookings that join existing events
async function createJoiningBookings() {
  console.log('Creating additional bookings that join existing events...');
  
  try {
    // Get all events for the tour to find public events to join
    const eventsResponse = await axios.get('https://us-central1-nevadotrektest01.cloudfunctions.net/adminGetEventsCalendar', {
      headers: { 'x-admin-secret-key': ADMIN_KEY },
      params: { tourId: TOUR_ID }
    });

    console.log(`Found ${eventsResponse.data.events.length} events for tour ${TOUR_ID}`);

    // Find a public event to join (if one exists)
    const publicEvents = eventsResponse.data.events.filter(event => event.type === 'public' && event.status === 'active');
    
    if (publicEvents.length > 0) {
      const eventToJoin = publicEvents[0]; // Use the first public event
      console.log(`Found public event to join: ${eventToJoin.eventId}`);
      
      // Publish the event first if it's private
      try {
        const publishResponse = await axios.post(`https://us-central1-nevadotrektest01.cloudfunctions.net/adminPublishEvent/${eventToJoin.eventId}`, 
          { action: 'publish' },
          { headers: { 'x-admin-secret-key': ADMIN_KEY } }
        );
        console.log('✅ Event published successfully');
      } catch (publishError) {
        console.log('Event might already be published or another issue:', publishError.response?.data || publishError.message);
      }

      // Create a booking that joins the existing event
      for (let i = 0; i < 2; i++) {  // Create 2 additional bookings
        const joinData = {
          eventId: eventToJoin.eventId,
          customer: {
            fullName: `Joining Customer ${i + 1}`,
            documentId: `CC98765432${i + 1}`,
            phone: `+57398765432${i + 1}`,
            email: `join${i + 1}@example.com`,
            notes: `Joining existing event ${eventToJoin.eventId}`
          },
          pax: 1
        };

        try {
          const joinResponse = await axios.post('https://joinevent-wgfhwjbpva-uc.a.run.app', joinData);
          console.log(`✅ Customer joined event. Booking ID: ${joinResponse.data.bookingId}, Reference: ${joinResponse.data.bookingReference}`);
        } catch (joinError) {
          console.error('❌ Error joining event:', joinError.response?.data || joinError.message);
        }

        // Wait a bit before creating the next booking
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } else {
      console.log('No public events found to join. Creating bookings will create new private events.');
    }
  } catch (error) {
    console.error('❌ Error in joining process:', error.response?.data || error.message);
  }
}

// Main function to orchestrate the creation of events and bookings
async function setupTourEventsAndBookings() {
  console.log('🚀 Setting up events and bookings for Nevado del Tolima tour...');
  console.log(`Tour ID: ${TOUR_ID}`);
  
  // First create events by making initial bookings
  await createEventsForTour();
  
  // Then create additional bookings that join existing events (if available)
  await createJoiningBookings();
  
  console.log('✅ Setup process completed!');
  console.log('Check your admin panel to view the created events and bookings.');
}

// Run the setup
setupTourEventsAndBookings().catch(console.error);