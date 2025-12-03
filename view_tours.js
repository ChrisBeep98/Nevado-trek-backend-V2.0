const axios = require('axios');

const API_URL = 'https://us-central1-nevadotrektest01.cloudfunctions.net/api';
const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

async function viewCurrentTours() {
  try {
    const response = await axios.get(`${API_URL}/admin/tours`, {
      headers: { 'X-Admin-Secret-Key': ADMIN_KEY }
    });
    
    const tours = response.data;
    console.log(`\n📊 Current Tours (${tours.length}):\n`);
    
    tours.forEach((tour, index) => {
      console.log(`\n━━━━ Tour ${index + 1}: ${tour.name?.es || 'N/A'} ━━━━`);
      console.log(`ID: ${tour.tourId}`);
      console.log(`Name ES: ${tour.name?.es || 'N/A'}`);
      console.log(`Name EN: ${tour.name?.en || 'N/A'}`);
      console.log(`Subtitle ES: ${tour.subtitle?.es || 'N/A'}`);
      console.log(`Subtitle EN: ${tour.subtitle?.en || 'N/A'}`);
      console.log(`Description ES: ${tour.description?.es?.substring(0, 100) || 'N/A'}...`);
      console.log(`Short Desc ES: ${tour.shortDescription?.es || 'N/A'}`);
      console.log(`Difficulty: ${tour.difficulty || 'N/A'}`);
      console.log(`Total Days: ${tour.totalDays || 'N/A'}`);
      console.log(`Distance: ${tour.distance || 'N/A'}`);
      console.log(`Temperature: ${tour.temperature || 'N/A'}`);
      console.log(`Altitude ES: ${tour.altitude?.es || 'N/A'}`);
      console.log(`Location ES: ${tour.location?.es || 'N/A'}`);
      console.log(`FAQs: ${tour.faqs?.length || 0}`);
      console.log(`Inclusions: ${tour.inclusions?.length || 0}`);
      console.log(`Exclusions: ${tour.exclusions?.length || 0}`);
      console.log(`Recommendations: ${tour.recommendations?.length || 0}`);
      console.log(`Images: ${tour.images?.length || 0}`);
      console.log(`Active: ${tour.isActive ? '✅' : '❌'}`);
    });
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

viewCurrentTours();
