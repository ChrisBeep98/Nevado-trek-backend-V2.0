// Remove admin SDK dependency to avoid service account issues
// const admin = require("firebase-admin");
const axios = require("axios");
const API_URL = "http://127.0.0.1:5001/nevadotrektest01/us-central1/api";
const ADMIN_KEY = "ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7"; // Updated with correct key
// const serviceAccount = require("./serviceAccountKey.json");
// ...

async function runTest() {
  try {
    console.log("🚀 Starting Move Booking Bug Reproduction...");

    // 1. Create a Target Public Departure (The one we want to join)
    // We'll use a specific date: 2025-12-30
    const targetDate = "2025-12-30T00:00:00.000Z";
    const moveTargetDate = "2025-12-30T05:00:00.000Z"; // Same day, different time
    let tourId = "TOUR_TEST_MOVE"; 
    
    // Create dummy tour via API
    console.log("0. Creating Test Tour...");
    try {
        const tourRes = await axios.post(
          `${API_URL}/admin/tours`,
          {
            name: { es: "Test Tour", en: "Test Tour" },
            description: { es: "Test Description", en: "Test Description" },
            shortDescription: { es: "Short Desc", en: "Short Desc" },
            location: { es: "Test Loc", en: "Test Loc" },
            isActive: true,
            pricingTiers: [
                { minPax: 1, maxPax: 1, priceCOP: 100000, priceUSD: 30 },
                { minPax: 2, maxPax: 2, priceCOP: 90000, priceUSD: 25 },
                { minPax: 3, maxPax: 3, priceCOP: 80000, priceUSD: 20 },
                { minPax: 4, maxPax: 8, priceCOP: 70000, priceUSD: 15 }
            ],
            totalDays: 1,
            difficulty: "Medium",
            temperature: 15,
            distance: 10,
            altitude: { es: "3000m", en: "3000m" },
            faqs: [],
            recommendations: [],
            inclusions: [],
            exclusions: []
          },
          { headers: { "X-Admin-Secret-Key": ADMIN_KEY } }
        );
        tourId = tourRes.data.tourId;
        console.log(`   -> Created Tour: ${tourId}`);
    } catch (err) {
        console.log("   -> Tour creation failed/skipped:", err.response?.data || err.message);
        // If failed, we might be using the hardcoded one, but likely it will fail later.
        // Let's assume it worked or we proceed with the hardcoded one if it was a "exists" error (though API usually creates new)
    }

    console.log("1. Creating Target Public Departure...");
    const createDepRes = await axios.post(
      `${API_URL}/admin/departures`,
      {
        tourId,
        date: targetDate,
        type: "public",
        maxPax: 8,
        status: "open"
      },
      { headers: { "X-Admin-Secret-Key": ADMIN_KEY } }
    );
    const targetDepId = createDepRes.data.departureId;
    console.log(`   -> Created Target Departure: ${targetDepId}`);

    // 2. Create a Booking in a DIFFERENT Departure (Private)
    console.log("2. Creating Source Booking (Private)...");
    const createBookingRes = await axios.post(
      `${API_URL}/admin/bookings`,
      {
        tourId,
        date: "2025-12-29T00:00:00.000Z", // Different date
        type: "private",
        pax: 2,
        customer: {
          name: "Mover Tester",
          email: "mover@test.com",
          phone: "+1234567890",
          document: "12345"
        }
      },
      { headers: { "X-Admin-Secret-Key": ADMIN_KEY } }
    );
    const bookingId = createBookingRes.data.bookingId;
    const sourceDepId = createBookingRes.data.departureId;
    console.log(`   -> Created Booking: ${bookingId} in Departure: ${sourceDepId}`);

    // 3. Attempt to Move Booking to the Target Date (with offset)
    console.log("3. Moving Booking to Target Date (with offset)...");
    await axios.post(
      `${API_URL}/admin/bookings/${bookingId}/move`,
      {
        newTourId: tourId,
        newDate: moveTargetDate
      },
      { headers: { "X-Admin-Secret-Key": ADMIN_KEY } }
    );
    console.log("   -> Move request successful.");

    // 4. Verify Result via API
    console.log("4. Verifying Result via API...");
    const bookingRes = await axios.get(
      `${API_URL}/admin/bookings/${bookingId}`,
      { headers: { "X-Admin-Secret-Key": ADMIN_KEY } }
    );
    const newDepId = bookingRes.data.departureId;

    console.log(`   -> Booking is now in Departure: ${newDepId}`);
    console.log(`   -> Expected Target Departure: ${targetDepId}`);

    if (newDepId === targetDepId) {
      console.log("✅ SUCCESS: Booking joined the existing departure.");
    } else {
      console.error("❌ FAILURE: Booking created a NEW departure instead of joining the existing one.");
      
      // Get departure details to see dates
      const newDepRes = await axios.get(`${API_URL}/admin/departures/${newDepId}`, { headers: { "X-Admin-Secret-Key": ADMIN_KEY } });
      const targetDepRes = await axios.get(`${API_URL}/admin/departures/${targetDepId}`, { headers: { "X-Admin-Secret-Key": ADMIN_KEY } });
      
      console.log("   Debug Info:");
      console.log("   Target Date (API):", targetDepRes.data.date);
      console.log("   New Dep Date (API):", newDepRes.data.date);
    }

  } catch (error) {
    console.error("❌ Error:", error.response ? error.response.data : error.message);
  }
}

runTest();
