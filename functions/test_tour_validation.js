const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Read admin key from file
const SECRET_FILE_PATH = path.resolve(__dirname, '../secret_value.txt');
const ADMIN_KEY = fs.readFileSync(SECRET_FILE_PATH, 'utf-8').trim();

const API_URL = 'http://127.0.0.1:5001/nevadotrektest01/us-central1/api'; // Emulator

const headers = {
    'X-Admin-Secret-Key': ADMIN_KEY,
    'Content-Type': 'application/json'
};

async function testTourCreation() {
    console.log('🧪 Testing Tour Creation with shortDescription field...\n');

    const testTour = {
        name: { en: 'Test Tour', es: 'Tour de Prueba' },
        description: {
            en: 'This is a full test description in English',
            es: 'Esta es una descripción completa de prueba en español'
        },
        shortDescription: {
            en: 'Short test description',
            es: 'Descripción corta de prueba'
        },
        type: 'multi-day',
        totalDays: 2,
        difficulty: 'Medium',
        isActive: true,
        version: 1,
        temperature: 10,
        distance: 20,
        location: { en: 'Test Location', es: 'Ubicación de Prueba' },
        altitude: { en: '4,000m', es: '4.000m' },
        faqs: [],
        recommendations: [],
        inclusions: [],
        exclusions: [],
        pricingTiers: [
            { minPax: 1, maxPax: 1, priceCOP: 400000, priceUSD: 105 },
            { minPax: 2, maxPax: 2, priceCOP: 320000, priceUSD: 85 },
            { minPax: 3, maxPax: 3, priceCOP: 280000, priceUSD: 75 },
            { minPax: 4, maxPax: 8, priceCOP: 230000, priceUSD: 60 }
        ]
    };

    try {
        console.log('Sending POST request to:', `${API_URL}/admin/tours`);
        const response = await axios.post(`${API_URL}/admin/tours`, testTour, { headers });
        console.log('✅ Test PASSED - Tour created successfully!');
        console.log('Tour ID:', response.data.tourId);
        return true;
    } catch (error) {
        console.log('❌ Test FAILED');
        console.log('Error:', error.response?.data || error.message);
        return false;
    }
}

testTourCreation()
    .then(success => {
        if (success) {
            console.log('\n🎉 All tests passed!');
            process.exit(0);
        } else {
            console.log('\n💥 Tests failed!');
            process.exit(1);
        }
    })
    .catch(error => {
        console.error('💥 Unexpected error:', error);
        process.exit(1);
    });
