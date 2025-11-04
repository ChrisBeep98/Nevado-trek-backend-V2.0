const axios = require('axios');

// Configuration
const BASE_URL = 'https://us-central1-nevadotrektest01.cloudfunctions.net';
const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

async function testAdminEndpoints() {
  console.log("🚀 Testing Admin Tour Endpoints...\n");

  try {
    // Test 1: POST /adminCreateTourV2
    console.log("1. Testing POST /adminCreateTourV2");
    const newTour = {
      name: {
        es: "Tour de Prueba",
        en: "Test Tour"
      },
      description: {
        es: "Tour de prueba para testing",
        en: "Test tour for testing"
      },
      duration: "2 Days",
      maxParticipants: 8,
      pricingTiers: [
        {
          paxFrom: 1,
          paxTo: 4,
          pricePerPerson: {
            COP: 800000,
            USD: 200
          }
        }
      ],
      isActive: true
    };

    const createResponse = await axios.post(`${BASE_URL}/adminCreateTourV2`, newTour, {
      headers: {
        'X-Admin-Secret-Key': ADMIN_KEY,
        'Content-Type': 'application/json'
      }
    });
    console.log(`   ✅ Create Tour Response: ${createResponse.status}`);
    console.log(`   📝 Tour ID: ${createResponse.data.tourId}`);
    
    const createdTourId = createResponse.data.tourId;
    
    // Test 2: PUT /adminUpdateTourV2
    console.log("\n2. Testing PUT /adminUpdateTourV2");
    const updateData = {
      name: {
        es: "Tour de Prueba Actualizado",
        en: "Updated Test Tour"
      },
      maxParticipants: 10
    };
    
    const updateResponse = await axios.put(`${BASE_URL}/adminUpdateTourV2/${createdTourId}`, updateData, {
      headers: {
        'X-Admin-Secret-Key': ADMIN_KEY,
        'Content-Type': 'application/json'
      }
    });
    console.log(`   ✅ Update Tour Response: ${updateResponse.status}`);
    console.log(`   📝 Update Result: ${updateResponse.data.message}`);
    
    // Test 3: DELETE /adminDeleteTourV2
    console.log("\n3. Testing DELETE /adminDeleteTourV2");
    const deleteResponse = await axios.delete(`${BASE_URL}/adminDeleteTourV2/${createdTourId}`, {
      headers: {
        'X-Admin-Secret-Key': ADMIN_KEY
      }
    });
    console.log(`   ✅ Delete Tour Response: ${deleteResponse.status}`);
    console.log(`   📝 Delete Result: ${deleteResponse.data.message}`);
    
    console.log("\n🏁 Admin Tour Endpoints Testing Complete!");
  } catch (error) {
    console.error("💥 Error in admin tour tests:", error.message);
    if (error.response) {
      console.error("   📡 Response:", error.response.data);
    }
  }
}

// Run the tests
testAdminEndpoints();