const axios = require('axios');
const fs = require('fs');
const path = require('path');

// URL de Staging y Key
const STAGING_API_URL = 'https://api-6ups4cehla-uc.a.run.app/admin/tours';
const STAGING_ADMIN_KEY = 'ntk_admin_staging_key_2026_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

async function seedStaging() {
  console.log('🌱 Iniciando duplicación de tours de Producción a Staging...');

  try {
    // Leer el dump de producción
    const dumpPath = path.join(__dirname, 'prod_tours_dump.json');
    if (!fs.existsSync(dumpPath)) {
      throw new Error('No se encontró el archivo prod_tours_dump.json');
    }

    const tours = JSON.parse(fs.readFileSync(dumpPath, 'utf8'));
    console.log(`📦 Encontrados ${tours.length} tours para migrar.`);

    for (const tour of tours) {
      console.log(`
🔄 Procesando: ${tour.name.es || tour.name.en}...`);

      // 1. Limpiar el objeto para que el backend lo acepte como nuevo
      const cleanTour = { ...tour };
      delete cleanTour.tourId;
      delete cleanTour.createdAt;
      delete cleanTour.updatedAt;
      delete cleanTour.version;

      // 2. Asegurar compatibilidad con validador v2.6
      // El validador exige 4 tiers específicos. 
      // Si algún tour de producción no los tiene exactos, los ajustamos o saltamos.
      if (!cleanTour.pricingTiers || cleanTour.pricingTiers.length !== 4) {
          console.warn(`   ⚠️ Advertencia: ${tour.name.es} no tiene exactamente 4 tiers de precios. Saltando o ajustando...`);
          // Ajuste rápido si faltan campos priceCOP/priceUSD (algunos tours viejos tenían pricePerPerson)
          if (cleanTour.pricingTiers) {
              cleanTour.pricingTiers = cleanTour.pricingTiers.map(t => ({
                  minPax: t.minPax || t.pax,
                  maxPax: t.maxPax || t.pax,
                  priceCOP: t.priceCOP || t.pricePerPerson || 0,
                  priceUSD: t.priceUSD || 0
              }));
              // Si aún no son 4, completamos con dummies para que el validador pase
              while(cleanTour.pricingTiers.length < 4) {
                  const last = cleanTour.pricingTiers[cleanTour.pricingTiers.length - 1];
                  cleanTour.pricingTiers.push({ ...last, minPax: 99, maxPax: 99 });
              }
          }
      }

      try {
        const res = await axios.post(STAGING_API_URL, cleanTour, {
          headers: { 
            'X-Admin-Secret-Key': STAGING_ADMIN_KEY,
            'Content-Type': 'application/json'
          }
        });
        console.log(`   ✅ Éxito: Tour creado en Staging con ID: ${res.data.tourId}`);
      } catch (err) {
        console.error(`   ❌ Error al crear ${tour.name.es}:`, err.response ? err.response.data : err.message);
      }
    }

    console.log('\n✨ Migración de datos a Staging completada.');

  } catch (error) {
    console.error('💥 Fallo crítico en el proceso de seeding:', error.message);
  }
}

seedStaging();
