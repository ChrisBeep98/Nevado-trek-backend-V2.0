const axios = require('axios');

const API_URL = 'https://us-central1-nevadotrektest01.cloudfunctions.net/api';
const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

async function verifyImages() {
  try {
    const response = await axios.get(`${API_URL}/admin/tours`, {
      headers: { 'X-Admin-Secret-Key': ADMIN_KEY }
    });
    
    response.data.forEach(tour => {
      console.log(`Tour: ${tour.name.es}`);
      console.log(`  - Images: ${tour.images ? tour.images.length : 0}`);
      console.log(`  - FAQs: ${tour.faqs ? tour.faqs.length : 0}`);
      console.log(`  - Inclusions: ${tour.inclusions ? tour.inclusions.length : 0}`);
      console.log(`  - Exclusions: ${tour.exclusions ? tour.exclusions.length : 0}`);
    });
    
  } catch (error) {
    console.error(error);
  }
}

verifyImages();
