const axios = require("axios");

const API_URL = "https://us-central1-nevadotrektest01.cloudfunctions.net/api"; // Correct Production URL

async function checkCacheHeaders() {
  try {
    console.log("Checking Cache Headers on Production...");
    
    const endpoints = [
      "/public/tours",
      "/public/departures"
    ];

    for (const endpoint of endpoints) {
      console.log(`\nTesting ${endpoint}...`);
      const res = await axios.get(`${API_URL}${endpoint}`);
      
      const cacheControl = res.headers['cache-control'];
      console.log(`   -> Status: ${res.status}`);
      console.log(`   -> Cache-Control: ${cacheControl}`);
      
      if (cacheControl && cacheControl.includes("public") && cacheControl.includes("max-age=300")) {
        console.log("   ✅ SUCCESS: Cache headers present.");
      } else {
        console.error("   ❌ FAILURE: Cache headers missing or incorrect.");
      }
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

checkCacheHeaders();
