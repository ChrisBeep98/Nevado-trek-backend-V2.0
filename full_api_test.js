const axios = require('axios');

// Configuration
const BASE_URL = 'https://us-central1-nevadotrektest01.cloudfunctions.net';
const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7'; // ultra secret

// Test data
const testTour = {
  name: {
    es: `Test Tour ${Date.now()}`,
    en: `Test Tour ${Date.now()}`
  },
  description: {
    es: "Descripción del tour de prueba",
    en: "Test tour description"
  },
  duration: "4 Days",
  difficulty: 3,
  maxParticipants: 8,
  pricingTiers: [
    {
      paxFrom: 1,
      paxTo: 4,
      pricePerPerson: {
        COP: 900000,
        USD: 210
      }
    },
    {
      paxFrom: 5,
      paxTo: 8,
      pricePerPerson: {
        COP: 800000, 
        USD: 190
      }
    }
  ],
  images: [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ],
  itinerary: {
    es: [
      {
        day: 1,
        title: "Día 1: Llegada",
        description: "Actividades del día 1..."
      },
      {
        day: 2, 
        title: "Día 2: Excursión",
        description: "Actividades del día 2..."
      }
    ],
    en: [
      {
        day: 1,
        title: "Day 1: Arrival",
        description: "Day 1 activities..."
      },
      {
        day: 2,
        title: "Day 2: Excursion", 
        description: "Day 2 activities..."
      }
    ]
  },
  inclusions: {
    es: ["Alimentación", "Transporte", "Guía"],
    en: ["Meals", "Transport", "Guide"]
  },
  faqs: {
    es: [
      {
        question: "¿Qué incluye el tour?",
        answer: "Incluye alimentación, transporte y guía"
      }
    ],
    en: [
      {
        question: "What is included in the tour?",
        answer: "Includes meals, transport and guide"
      }
    ]
  },
  isActive: true
};

const testCustomer = {
  fullName: "Test Customer",
  documentId: "123456789",
  phone: "+573123456789",
  email: `test${Date.now()}@example.com`,
  notes: "Test booking for API validation"
};

const testBooking = {
  tourId: "", // Will be set after tour creation
  startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
  pax: 2,
  customer: testCustomer
};

let createdTourId = null;
let createdBookingId = null;
let createdBookingReference = null;
let createdEventId = null;

// Function to delay execution
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Function to extract tour ID from URL
function extractTourIdFromUrl(url) {
  const parts = url.split('/');
  return parts[parts.length - 1];
}

// Function to extract booking ID from URL
function extractBookingIdFromUrl(url) {
  const parts = url.split('/');
  return parts[parts.length - 1];
}

// Function to extract event ID from URL
function extractEventIdFromUrl(url) {
  const parts = url.split('/');
  return parts[parts.length - 1];
}

// Test all public endpoints
async function testPublicEndpoints() {
  console.log("🧪 Testing Public Endpoints...\n");
  
  try {
    // 1. Test GET /getToursV2
    console.log("1. Testing GET /getToursV2");
    try {
      const toursResponse = await axios.get(`${BASE_URL}/getToursV2`);
      console.log(`   ✅ Status: ${toursResponse.status}`);
      console.log(`   📄 Tours count: ${toursResponse.data.length}`);
      if (toursResponse.data.length > 0) {
        console.log(`   🏔️  First tour: ${toursResponse.data[0].name?.es || toursResponse.data[0].name}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    // 2. Test GET /getTourByIdV2/:tourId (using first tour from the list)
    console.log("\n2. Testing GET /getTourByIdV2/:tourId");
    try {
      // First, get a tour ID to test with
      const toursResponse = await axios.get(`${BASE_URL}/getToursV2`);
      if (toursResponse.data && toursResponse.data.length > 0) {
        const tourId = toursResponse.data[0].tourId;
        const tourResponse = await axios.get(`${BASE_URL}/getTourByIdV2/${tourId}`);
        console.log(`   ✅ Status: ${tourResponse.status}`);
        console.log(`   🏔️  Tour name: ${tourResponse.data.name?.es || tourResponse.data.name}`);
        console.log(`   📅 Duration: ${tourResponse.data.duration}`);
      } else {
        console.log("   ⚠️  No tours available to test");
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    // 3. Test POST /createBooking
    console.log("\n3. Testing POST /createBooking");
    try {
      // First, create a test tour for this booking
      console.log("   Creating test tour for booking...");
      const createTourResponse = await axios.post(`${BASE_URL}/adminCreateTourV2`, testTour, {
        headers: {
          'X-Admin-Secret-Key': ADMIN_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      if (createTourResponse.data && createTourResponse.data.tourId) {
        createdTourId = createTourResponse.data.tourId;
        console.log(`   ✅ Created test tour: ${createdTourId}`);
        
        // Now create a booking using the new tour ID
        const bookingPayload = {
          ...testBooking,
          tourId: createdTourId
        };
        
        const bookingResponse = await axios.post(`${BASE_URL}/createBooking`, bookingPayload);
        console.log(`   ✅ Status: ${bookingResponse.status}`);
        console.log(`   📝 Response:`, bookingResponse.data);
        
        if (bookingResponse.data && bookingResponse.data.bookingId) {
          createdBookingId = bookingResponse.data.bookingId;
          createdBookingReference = bookingResponse.data.bookingReference;
          console.log(`   🆔 Booking ID: ${createdBookingId}`);
          console.log(`   🔗 Booking Reference: ${createdBookingReference}`);
        }
      } else {
        console.log("   ❌ Failed to create test tour for booking test");
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      if (error.response) {
        console.log(`   📡 Response data:`, error.response.data);
      }
    }
    
    // 4. Test GET /checkBooking
    console.log("\n4. Testing GET /checkBooking");
    if (createdBookingReference) {
      try {
        const checkResponse = await axios.get(`${BASE_URL}/checkBooking?reference=${createdBookingReference}`);
        console.log(`   ✅ Status: ${checkResponse.status}`);
        console.log(`   📄 Booking details:`, {
          bookingId: checkResponse.data.bookingId,
          status: checkResponse.data.status,
          tourName: checkResponse.data.tourName,
          pax: checkResponse.data.pax
        });
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        if (error.response) {
          console.log(`   📡 Response data:`, error.response.data);
        }
      }
    } else {
      console.log("   ⚠️  Cannot test checkBooking without a valid booking reference");
    }
    
    // 5. Test POST /joinEvent (will use the event created with the booking)
    console.log("\n5. Testing POST /joinEvent");
    if (createdBookingId) {
      try {
        // First, get the event ID from the booking
        const checkResponse = await axios.get(`${BASE_URL}/checkBooking?reference=${createdBookingReference}`);
        
        if (checkResponse.data && checkResponse.data.eventId) {
          createdEventId = checkResponse.data.eventId;
          console.log(`   📅 Using event ID: ${createdEventId}`);
          
          // Now publish the event to make it joinable
          console.log("   Publishing event to make it joinable...");
          const publishResponse = await axios.post(`${BASE_URL}/adminPublishEvent/${createdEventId}`, {}, {
            headers: {
              'X-Admin-Secret-Key': ADMIN_KEY,
              'Content-Type': 'application/json'
            }
          });
          console.log(`   ✅ Event published: ${publishResponse.data.success}`);
          
          // Wait a moment for the event to be published
          await delay(2000);
          
          // Now try to join the event with a different customer
          const joinPayload = {
            eventId: createdEventId,
            pax: 1,
            customer: {
              fullName: "Joining Customer",
              documentId: "987654321",
              phone: "+573987654321",
              email: `joining${Date.now()}@example.com`
            }
          };
          
          const joinResponse = await axios.post(`${BASE_URL}/joinEvent`, joinPayload);
          console.log(`   ✅ Status: ${joinResponse.status}`);
          console.log(`   📝 Join response:`, joinResponse.data);
        } else {
          console.log("   ⚠️  Could not get event ID from booking");
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        if (error.response) {
          console.log(`   📡 Response data:`, error.response.data);
        }
      }
    } else {
      console.log("   ⚠️  Cannot test joinEvent without a valid booking");
    }
    
    console.log("\n🏁 Public Endpoints Testing Complete!");
    
  } catch (error) {
    console.error("💥 Unexpected error in public endpoint tests:", error.message);
  }
}

// Test all admin endpoints
async function testAdminEndpoints() {
  console.log("\n🔐 Testing Admin Endpoints...\n");
  
  try {
    // 1. Test GET /adminGetBookings
    console.log("1. Testing GET /adminGetBookings");
    try {
      const bookingsResponse = await axios.get(`${BASE_URL}/adminGetBookings`, {
        headers: {
          'X-Admin-Secret-Key': ADMIN_KEY
        }
      });
      console.log(`   ✅ Status: ${bookingsResponse.status}`);
      console.log(`   📄 Bookings count: ${bookingsResponse.data.bookings.length}`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      if (error.response) {
        console.log(`   📡 Response data:`, error.response.data);
      }
    }
    
    // 2. Test PUT /adminUpdateBookingStatus/:bookingId
    console.log("\n2. Testing PUT /adminUpdateBookingStatus/:bookingId");
    if (createdBookingId) {
      try {
        const statusUpdateResponse = await axios.put(
          `${BASE_URL}/adminUpdateBookingStatus/${createdBookingId}`,
          { 
            status: "confirmed",
            reason: "Test confirmation"
          },
          {
            headers: {
              'X-Admin-Secret-Key': ADMIN_KEY,
              'Content-Type': 'application/json'
            }
          }
        );
        console.log(`   ✅ Status: ${statusUpdateResponse.status}`);
        console.log(`   📝 Response:`, statusUpdateResponse.data);
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        if (error.response) {
          console.log(`   📡 Response data:`, error.response.data);
        }
      }
    } else {
      console.log("   ⚠️  Cannot test booking status update without a valid booking ID");
    }
    
    // 3. Test PUT /adminUpdateBookingDetails/:bookingId
    console.log("\n3. Testing PUT /adminUpdateBookingDetails/:bookingId");
    if (createdBookingId) {
      try {
        const detailsUpdateResponse = await axios.put(
          `${BASE_URL}/adminUpdateBookingDetails/${createdBookingId}`,
          { 
            customer: {
              fullName: "Updated Test Customer",
              email: `updated${Date.now()}@example.com`
            },
            pax: 3,
            reason: "Test details update"
          },
          {
            headers: {
              'X-Admin-Secret-Key': ADMIN_KEY,
              'Content-Type': 'application/json'
            }
          }
        );
        console.log(`   ✅ Status: ${detailsUpdateResponse.status}`);
        console.log(`   📝 Response:`, detailsUpdateResponse.data);
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        if (error.response) {
          console.log(`   📡 Response data:`, error.response.data);
        }
      }
    } else {
      console.log("   ⚠️  Cannot test booking details update without a valid booking ID");
    }
    
    // 4. Test GET /adminGetEventsCalendar
    console.log("\n4. Testing GET /adminGetEventsCalendar");
    try {
      const eventsResponse = await axios.get(`${BASE_URL}/adminGetEventsCalendar`, {
        headers: {
          'X-Admin-Secret-Key': ADMIN_KEY
        }
      });
      console.log(`   ✅ Status: ${eventsResponse.status}`);
      console.log(`   📅 Events count: ${eventsResponse.data.events.length}`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      if (error.response) {
        console.log(`   📡 Response data:`, error.response.data);
      }
    }
    
    // 5. Test POST /adminPublishEvent/:eventId
    console.log("\n5. Testing POST /adminPublishEvent/:eventId");
    if (createdEventId) {
      try {
        // First, unpublish the event (since it's currently published)
        const unpubResponse = await axios.post(
          `${BASE_URL}/adminPublishEvent/${createdEventId}`,
          { action: "unpublish" },
          {
            headers: {
              'X-Admin-Secret-Key': ADMIN_KEY,
              'Content-Type': 'application/json'
            }
          }
        );
        console.log(`   ✅ Event unpublished: ${unpubResponse.data.success}`);
        
        // Then publish it again
        const pubResponse = await axios.post(
          `${BASE_URL}/adminPublishEvent/${createdEventId}`,
          { action: "publish" },
          {
            headers: {
              'X-Admin-Secret-Key': ADMIN_KEY,
              'Content-Type': 'application/json'
            }
          }
        );
        console.log(`   ✅ Event published again: ${pubResponse.data.success}`);
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        if (error.response) {
          console.log(`   📡 Response data:`, error.response.data);
        }
      }
    } else {
      console.log("   ⚠️  Cannot test event publishing without a valid event ID");
    }
    
    // 6. Test POST /adminTransferBooking/:bookingId
    console.log("\n6. Testing POST /adminTransferBooking/:bookingId");
    if (createdBookingId && createdEventId) {
      try {
        // First, create a second event for the same tour to transfer to
        const secondEventPayload = {
          tourId: createdTourId,
          tourName: testTour.name.es,
          startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days from now
          endDate: new Date(Date.now() + 17 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 17 days from now
          maxCapacity: 8,
          bookedSlots: 0,
          type: "private",
          status: "active"
        };
        
        const newEventResponse = await axios.post(`${BASE_URL}/adminCreateTourV2`, secondEventPayload, {
          headers: {
            'X-Admin-Secret-Key': ADMIN_KEY,
            'Content-Type': 'application/json'
          }
        });
        
        // Actually, for transfer, we need to create a new event using the tourEvents collection
        // This is a simplification - in real usage we'd create an event properly
        console.log("   ⚠️  Transfer test skipped - requires proper event creation on the same tour");
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        if (error.response) {
          console.log(`   📡 Response data:`, error.response.data);
        }
      }
    } else {
      console.log("   ⚠️  Cannot test booking transfer without valid booking and event IDs");
    }
    
    // 7. Test POST /adminTransferToNewTour/:bookingId
    console.log("\n7. Testing POST /adminTransferToNewTour/:bookingId");
    if (createdBookingId && createdTourId) {
      try {
        // First, create a second tour to transfer to
        const secondTour = {
          ...testTour,
          name: {
            es: `Second Test Tour ${Date.now()}`,
            en: `Second Test Tour ${Date.now()}`
          }
        };
        
        const createSecondTourResponse = await axios.post(`${BASE_URL}/adminCreateTourV2`, secondTour, {
          headers: {
            'X-Admin-Secret-Key': ADMIN_KEY,
            'Content-Type': 'application/json'
          }
        });
        
        if (createSecondTourResponse.data && createSecondTourResponse.data.tourId) {
          const secondTourId = createSecondTourResponse.data.tourId;
          console.log(`   Created second tour: ${secondTourId}`);
          
          // Now attempt to transfer the booking to the new tour
          const transferResponse = await axios.post(
            `${BASE_URL}/adminTransferToNewTour/${createdBookingId}`,
            {
              newTourId: secondTourId,
              newStartDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              reason: "Test cross-tour transfer"
            },
            {
              headers: {
                'X-Admin-Secret-Key': ADMIN_KEY,
                'Content-Type': 'application/json'
              }
            }
          );
          
          console.log(`   ✅ Status: ${transferResponse.status}`);
          console.log(`   📝 Transfer response:`, transferResponse.data);
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        if (error.response) {
          console.log(`   📡 Response data:`, error.response.data);
        }
      }
    } else {
      console.log("   ⚠️  Cannot test cross-tour transfer without valid booking and tour IDs");
    }
    
    // 8. Test admin tour management endpoints
    console.log("\n8. Testing admin tour management endpoints");
    
    // Test PUT /adminUpdateTourV2/:tourId
    if (createdTourId) {
      try {
        const updatePayload = {
          name: {
            es: `Updated Test Tour ${Date.now()}`,
            en: `Updated Test Tour ${Date.now()}`
          },
          difficulty: 4
        };
        
        const updateResponse = await axios.put(
          `${BASE_URL}/adminUpdateTourV2/${createdTourId}`,
          updatePayload,
          {
            headers: {
              'X-Admin-Secret-Key': ADMIN_KEY,
              'Content-Type': 'application/json'
            }
          }
        );
        console.log(`   ✅ Tour updated: ${updateResponse.data.success}`);
      } catch (error) {
        console.log(`   ❌ Error updating tour: ${error.message}`);
        if (error.response) {
          console.log(`   📡 Response data:`, error.response.data);
        }
      }
    }
    
    console.log("\n🏁 Admin Endpoints Testing Complete!");
    
  } catch (error) {
    console.error("💥 Unexpected error in admin endpoint tests:", error.message);
  }
}

// Test authentication and security
async function testAdminAuthentication() {
  console.log("\n🛡️ Testing Admin Authentication & Security...\n");
  
  try {
    // Test with invalid admin key
    console.log("1. Testing with invalid admin key");
    try {
      const response = await axios.get(`${BASE_URL}/adminGetBookings`, {
        headers: {
          'X-Admin-Secret-Key': 'invalid_key_123'
        }
      });
      console.log(`   ❌ Unexpected success - should have failed: ${response.status}`);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log(`   ✅ Correctly rejected invalid key: ${error.response.status}`);
      } else {
        console.log(`   ⚠️  Unexpected error: ${error.message}`);
      }
    }
    
    // Test with valid admin key
    console.log("\n2. Testing with valid admin key");
    try {
      const response = await axios.get(`${BASE_URL}/adminGetBookings`, {
        headers: {
          'X-Admin-Secret-Key': ADMIN_KEY
        }
      });
      console.log(`   ✅ Valid key accepted: ${response.status}`);
    } catch (error) {
      console.log(`   ❌ Valid key rejected: ${error.message}`);
    }
    
    // Test without admin key on admin endpoint
    console.log("\n3. Testing without admin key on admin endpoint");
    try {
      const response = await axios.get(`${BASE_URL}/adminGetBookings`);
      console.log(`   ❌ Unexpected success without key: ${response.status}`);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log(`   ✅ Correctly rejected missing key: ${error.response.status}`);
      } else {
        console.log(`   ⚠️  Unexpected error: ${error.message}`);
      }
    }
    
    console.log("\n🏁 Authentication Testing Complete!");
    
  } catch (error) {
    console.error("💥 Unexpected error in auth tests:", error.message);
  }
}

// Main execution function
async function runAllTests() {
  console.log("🚀 Starting Full API Test Suite for Nevado Trek Backend\n");
  console.log("📅 Test Date:", new Date().toISOString());
  console.log("🌐 Base URL:", BASE_URL);
  console.log("🔑 Admin Key: ***PROTECTED***\n");
  
  // Test public endpoints
  await testPublicEndpoints();
  
  // Test admin authentication
  await testAdminAuthentication();
  
  // Test admin endpoints
  await testAdminEndpoints();
  
  // Final summary
  console.log("\n📊 Final Test Summary:");
  console.log("- Public endpoints: Tested");
  console.log("- Admin endpoints: Tested"); 
  console.log("- Authentication: Tested");
  
  if (createdTourId) {
    console.log(`- Created tour for testing: ${createdTourId}`);
  }
  if (createdBookingId) {
    console.log(`- Created booking for testing: ${createdBookingId}`);
  }
  
  console.log("\n🏁 Full API Test Suite Complete!");
  
  // Cleanup test data
  console.log("\n🧹 Starting cleanup of test data...");
  
  if (createdTourId) {
    try {
      await axios.delete(`${BASE_URL}/adminDeleteTourV2/${createdTourId}`, {
        headers: {
          'X-Admin-Secret-Key': ADMIN_KEY
        }
      });
      console.log(`   ✅ Cleaned up test tour: ${createdTourId}`);
    } catch (error) {
      console.log(`   ⚠️  Failed to clean up tour ${createdTourId}:`, error.message);
    }
  }
  
  console.log("\n🎊 Testing complete with cleanup!");
}

// Run the tests
runAllTests().catch(error => {
  console.error("💥 Error running tests:", error);
  process.exit(1);
});