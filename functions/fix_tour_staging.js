const axios = require('axios');

const API_URL = 'https://api-6ups4cehla-uc.a.run.app/admin/tours/test-tour-001';
const ADMIN_KEY = 'ntk_admin_staging_key_2026_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

async function fixTour() {
  console.log('🔧 Reparando estructura de precios del tour...');
  try {
    const response = await axios.put(API_URL, {
      pricingTiers: [
        { minPax: 1, maxPax: 1, priceCOP: 500000, priceUSD: 150 },
        { minPax: 2, maxPax: 2, priceCOP: 450000, priceUSD: 130 },
        { minPax: 3, maxPax: 3, priceCOP: 400000, priceUSD: 110 },
        { minPax: 4, maxPax: 8, priceCOP: 350000, priceUSD: 100 }
      ]
    }, {
      headers: { 'X-Admin-Secret-Key': ADMIN_KEY }
    });

    console.log('✅ Tour reparado:', response.data);
  } catch (error) {
    console.error('❌ Error reparando tour:', error.response ? error.response.data : error.message);
  }
}

fixTour();