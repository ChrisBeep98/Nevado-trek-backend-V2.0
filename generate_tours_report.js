const axios = require('axios');

const API_URL = 'https://api-wgfhwjbpva-uc.a.run.app/admin/tours';
const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

async function generateReport() {
    try {
        console.log('Fetching tours...');
        const response = await axios.get(API_URL, {
            headers: {
                'X-Admin-Secret-Key': ADMIN_KEY
            }
        });

        const tours = response.data;
        console.log(`\nFound ${tours.length} tours.\n`);
        console.log('='.repeat(80));

        tours.forEach((tour, index) => {
            console.log(`TOUR #${index + 1}: ${tour.name.es} (${tour.name.en})`);
            console.log(`ID: ${tour.tourId}`);
            console.log(`Active: ${tour.isActive ? 'YES' : 'NO'}`);
            console.log(`Type: ${tour.type} | Days: ${tour.totalDays}`);
            console.log(`Difficulty: ${tour.difficulty}`);
            console.log(`Location: ${tour.location.es}`);
            
            // Images
            const imageCount = tour.images ? tour.images.length : 0;
            console.log(`Images: ${imageCount} total`);
            if (imageCount > 0) {
                 // Inspect first few to see if they look correct
                 console.log(`   Preview: ${tour.images[0].substring(0, 50)}...`);
            }

            // Pricing
            console.log('Pricing Tiers:');
            if (tour.pricingTiers && tour.pricingTiers.length) {
                tour.pricingTiers.forEach(tier => {
                    console.log(`   - ${tier.minPax}-${tier.maxPax} pax: $${tier.priceCOP.toLocaleString()} COP / $${tier.priceUSD} USD`);
                });
            } else {
                console.log('   No pricing tiers defined.');
            }
            
            // Itinerary
             if (tour.itinerary && tour.itinerary.days) {
                console.log(`Itinerary: ${tour.itinerary.days.length} days defined.`);
            } else {
                console.log('Itinerary: Not defined.');
            }

            console.log('-'.repeat(80));
        });

    } catch (error) {
        console.error('Error fetching tours:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

const fs = require('fs');
const util = require('util');
const logFile = fs.createWriteStream('tours_report_output.txt', { flags: 'w' });
const logStdout = process.stdout;

console.log = function () {
  logFile.write(util.format.apply(null, arguments) + '\n');
  logStdout.write(util.format.apply(null, arguments) + '\n');
}

generateReport();
