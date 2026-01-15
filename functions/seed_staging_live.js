const axios = require('axios');

// URLs y Keys
const PROD_API_URL = 'https://us-central1-nevadotrektest01.cloudfunctions.net/api/admin/tours';
const PROD_ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

const STAGING_API_URL = 'https://api-6ups4cehla-uc.a.run.app/admin/tours';
const STAGING_ADMIN_KEY = 'ntk_admin_staging_key_2026_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

async function mirrorData() {
  console.log('🚀 Iniciando Espejo de Datos (Producción -> Staging)...');

  try {
    // 1. Obtener tours de Producción
    console.log('📡 Descargando tours de Producción...');
    const prodRes = await axios.get(PROD_API_URL, {
      headers: { 'X-Admin-Secret-Key': PROD_ADMIN_KEY }
    });

    const tours = prodRes.data;
    console.log(`✅ ${tours.length} tours descargados.`);

    // 2. Subir a Staging
    for (const tour of tours) {
      console.log(`\n🔄 Procesando: ${tour.name.es}`);

      // Limpieza profunda
      const cleanTour = { ...tour };
      delete cleanTour.tourId;
      delete cleanTour.createdAt;
      delete cleanTour.updatedAt;
      delete cleanTour.version;

      // Ajustar Pricing Tiers al formato v2.6 (minPax, maxPax, priceCOP, priceUSD)
      if (cleanTour.pricingTiers) {
          const requiredTiers = [
            { min: 1, max: 1 },
            { min: 2, max: 2 },
            { min: 3, max: 3 },
            { min: 4, max: 8 }
          ];

          const newTiers = requiredTiers.map((req, i) => {
              const original = cleanTour.pricingTiers[i] || cleanTour.pricingTiers[cleanTour.pricingTiers.length - 1];
              return {
                  minPax: req.min,
                  maxPax: req.max,
                  priceCOP: original.priceCOP || original.pricePerPerson || 0,
                  priceUSD: original.priceUSD || 0
              };
          });
          cleanTour.pricingTiers = newTiers;
      }

      try {
        const res = await axios.post(STAGING_API_URL, cleanTour, {
          headers: { 
            'X-Admin-Secret-Key': STAGING_ADMIN_KEY,
            'Content-Type': 'application/json'
          }
        });
        console.log(`   ✅ Creado en Staging (ID: ${res.data.tourId})`);
      } catch (err) {
        console.error(`   ❌ Error al subir:`, err.response ? err.response.data : err.message);
      }
    }

    console.log('\n✨ Proceso de clonación completado.');

  } catch (error) {
    console.error('💥 Error fatal:', error.message);
  }
}

mirrorData();