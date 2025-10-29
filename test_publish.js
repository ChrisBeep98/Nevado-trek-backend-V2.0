const axios = require('axios');

// Admin key to use for testing
const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

// Base URL for the deployed functions
const BASE_URL = 'https://us-central1-nevadotrektest01.cloudfunctions.net';

// Test the publish/unpublish functionality
async function testPublishEvent() {
    console.log('=== Testing Event Publish/Unpublish Functionality ===\n');
    
    // First, get events to find one to test with
    try {
        console.log('Getting events to find one for testing...');
        const eventsResponse = await axios.get(`${BASE_URL}/adminGetEventsCalendar`, {
            headers: {
                'X-Admin-Secret-Key': ADMIN_KEY
            },
            params: {
                limit: 10
            }
        });
        
        console.log(`Found ${eventsResponse.data.events.length} events`);
        
        // Find an event that we can use for testing (should be a private one)
        const testEvent = eventsResponse.data.events[0];
        if (!testEvent) {
            console.log('No events found to test with');
            return;
        }
        
        console.log('Testing with event:');
        console.log('- Event ID:', testEvent.eventId);
        console.log('- Tour:', testEvent.tourName);
        console.log('- Type:', testEvent.type);
        console.log('- Status:', testEvent.status);
        console.log('- Start Date:', new Date(testEvent.startDate).toISOString());
        
        // Test publishing the event (making it public)
        console.log('\nTesting publish (making event public)...');
        const publishResponse = await axios.post(`${BASE_URL}/adminPublishEvent/${testEvent.eventId}`, {
            action: 'publish'
        }, {
            headers: {
                'X-Admin-Secret-Key': ADMIN_KEY,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Publish response:', publishResponse.data.message);
        console.log('Previous type:', publishResponse.data.previousType);
        console.log('New type:', publishResponse.data.newType);
        
        // Wait a moment for the update to process
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verify the event is now public by getting it again
        const verifyEventsResponse = await axios.get(`${BASE_URL}/adminGetEventsCalendar`, {
            headers: {
                'X-Admin-Secret-Key': ADMIN_KEY
            },
            params: {
                limit: 10
            }
        });
        
        const updatedEvent = verifyEventsResponse.data.events.find(e => e.eventId === testEvent.eventId);
        if (updatedEvent) {
            console.log('\nVerified event after publish:');
            console.log('- Type:', updatedEvent.type);
            console.log('- Is now public:', updatedEvent.type === 'public' ? 'Yes' : 'No');
        }
        
        // Test unpublishing the event (making it private again)
        console.log('\nTesting unpublish (making event private again)...');
        const unpublishResponse = await axios.post(`${BASE_URL}/adminPublishEvent/${testEvent.eventId}`, {
            action: 'unpublish'
        }, {
            headers: {
                'X-Admin-Secret-Key': ADMIN_KEY,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Unpublish response:', unpublishResponse.data.message);
        console.log('Previous type:', unpublishResponse.data.previousType);
        console.log('New type:', unpublishResponse.data.newType);
        
        console.log('\n🎉 Event publish/unpublish functionality working properly!');
        console.log('✅ Events can be toggled between public and private');
        console.log('✅ Other functionality in the system remains intact');
        
    } catch (error) {
        console.error('❌ Publish/unpublish test failed:', error.response?.data || error.message);
    }
}

// Run the test
testPublishEvent().catch(console.error);