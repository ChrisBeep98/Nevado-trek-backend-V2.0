const axios = require('axios');

// Configuration
const BASE_URL = 'https://us-central1-nevadotrektest01.cloudfunctions.net';
const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

async function checkIfFunctionExists(functionName) {
  try {
    const response = await axios.post(
      `${BASE_URL}/${functionName}`,
      {},
      {
        headers: {
          'X-Admin-Secret-Key': ADMIN_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    return { exists: true, response: response.status };
  } catch (error) {
    if (error.response) {
      // Function exists but returned an error (like 400 for missing params)
      return { exists: true, response: error.response.status, error: error.response.data };
    } else if (error.code === 'ECONNABORTED') {
      // Timeout - function might exist but taking too long
      return { exists: true, response: 'timeout' };
    } else {
      // Network error, likely 404 - function doesn't exist
      return { exists: false, response: 'network_error', error: error.message };
    }
  }
}

async function testDeployedFunctions() {
  console.log("🔍 Checking deployed functions...\n");
  
  const functionsToTest = [
    'adminCreateEvent',
    'adminSplitEvent', 
    'adminGetEventsByDate',
    'adminCreateBooking'
  ];
  
  for (const functionName of functionsToTest) {
    console.log(`Testing ${functionName}...`);
    const result = await checkIfFunctionExists(functionName);
    
    if (result.exists) {
      console.log(`  ✅ ${functionName} exists - Response: ${result.response}`);
      if (result.error) {
        console.log(`     Error details:`, result.error);
      }
    } else {
      console.log(`  ❌ ${functionName} does NOT exist - ${result.response}`);
    }
    console.log('');
  }
}

// Run the check
testDeployedFunctions();