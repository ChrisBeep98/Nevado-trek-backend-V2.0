const axios = require('axios');

const API_URL = 'https://api-wgfhwjbpva-uc.a.run.app';
const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

const headers = {
    'X-Admin-Secret-Key': ADMIN_KEY,
    'Content-Type': 'application/json'
};

const tours = [
    {
        name: { en: 'Nevado del Ruiz Summit', es: 'Cumbre del Nevado del Ruiz' },
        description: {
            en: 'Climb to the summit of Nevado del Ruiz volcano',
            es: 'Asciende a la cumbre del volcán Nevado del Ruiz'
        },
        type: 'multi-day',
        totalDays: 2,
        difficulty: 'Hard',
        isActive: true,
        version: 1,
        temperature: 5,
        distance: 15,
        location: { en: 'Nevado del Ruiz, Colombia', es: 'Nevado del Ruiz, Colombia' },
        altitude: { en: '5,321m', es: '5.321m' },
        faqs: [],
        recommendations: [],
        inclusions: [],
        exclusions: [],
        pricingTiers: [
            { minPax: 1, maxPax: 1, priceCOP: 450000, priceUSD: 120 },
            { minPax: 2, maxPax: 2, priceCOP: 350000, priceUSD: 90 },
            { minPax: 3, maxPax: 3, priceCOP: 300000, priceUSD: 80 },
            { minPax: 4, maxPax: 8, priceCOP: 250000, priceUSD: 65 }
        ]
    },
    {
        name: { en: 'Santa Isabel Glacier Trek', es: 'Trekking Glaciar Santa Isabel' },
        description: {
            en: 'Explore the beautiful glaciers of Santa Isabel',
            es: 'Explora los hermosos glaciares del Santa Isabel'
        },
        type: 'multi-day',
        totalDays: 3,
        difficulty: 'Medium',
        isActive: true,
        version: 1,
        temperature: 10,
        distance: 25,
        location: { en: 'Santa Isabel, Colombia', es: 'Santa Isabel, Colombia' },
        altitude: { en: '4,965m', es: '4.965m' },
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
    },
    {
        name: { en: 'Tolima Volcano Expedition', es: 'Expedición al Volcán Tolima' },
        description: {
            en: 'Adventure to the top of Nevado del Tolima',
            es: 'Aventura a la cima del Nevado del Tolima'
        },
        type: 'multi-day',
        totalDays: 4,
        difficulty: 'Hard',
        isActive: true,
        version: 1,
        temperature: 8,
        distance: 30,
        location: { en: 'Nevado del Tolima, Colombia', es: 'Nevado del Tolima, Colombia' },
        altitude: { en: '5,215m', es: '5.215m' },
        faqs: [],
        recommendations: [],
        inclusions: [],
        exclusions: [],
        pricingTiers: [
            { minPax: 1, maxPax: 1, priceCOP: 500000, priceUSD: 130 },
            { minPax: 2, maxPax: 2, priceCOP: 380000, priceUSD: 100 },
            { minPax: 3, maxPax: 3, priceCOP: 330000, priceUSD: 88 },
            { minPax: 4, maxPax: 8, priceCOP: 280000, priceUSD: 73 }
        ]
    }
];

async function createTours() {
    console.log('🏔️  Creating test tours...\n');

    for (const tour of tours) {
        try {
            const response = await axios.post(`${API_URL}/admin/tours`, tour, { headers });
            console.log(`✅ Created: ${tour.name.en} (ID: ${response.data.tourId})`);
        } catch (error) {
            console.error(`❌ Failed to create ${tour.name.en}:`, error.response?.data || error.message);
        }
    }

    console.log('\n🎉 Tours created successfully!');
}

createTours()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('💥 Error:', error);
        process.exit(1);
    });
