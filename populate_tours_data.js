/**
 * Populate Tours with Real Data
 * Updates all 3 existing tours with realistic content:
 * - Subtitles
 * - FAQs
 * - Inclusions/Exclusions
 * - Itineraries
 * - Recommendations
 */

const axios = require('axios');

const API_URL = 'https://us-central1-nevadotrektest01.cloudfunctions.net/api';
const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

// Real tour data based on Colombian trekking experiences
const tourUpdates = {
  // Tour 1: Páramo
  'paramo': {
    subtitle: {
      es: "Explora los ecosistemas únicos del páramo colombiano",
      en: "Explore the unique ecosystems of the Colombian páramo"
    },
    faqs: [
      {
        question: {
          es: "¿Qué es un páramo?",
          en: "What is a páramo?"
        },
        answer: {
          es: "El páramo es un ecosistema único de alta montaña, encontrado solo en los Andes tropicales. Es crucial para la regulación del agua y alberga especies únicas como los frailejones.",
          en: "The páramo is a unique high-mountain ecosystem found only in the tropical Andes. It's crucial for water regulation and hosts unique species like frailejones."
        }
      },
      {
        question: {
          es: "¿Qué nivel de dificultad tiene este trek?",
          en: "What difficulty level is this trek?"
        },
        answer: {
          es: "Moderado. Requiere buena condición física debido a la altitud (3000-4000 msnm) y terreno irregular. No se necesita experiencia técnica.",
          en: "Moderate. Requires good physical condition due to altitude (3000-4000 masl) and uneven terrain. No technical experience needed."
        }
      },
      {
        question: {
          es: "¿Qué debo llevar?",
          en: "What should I bring?"
        },
        answer: {
          es: "Ropa abrigada en capas, chaqueta impermeable, botas de montaña, gorro, guantes, bloqueador solar, y abundante agua. El clima puede cambiar rápidamente.",
          en: "Warm layered clothing, waterproof jacket, hiking boots, hat, gloves, sunscreen, and plenty of water. Weather can change quickly."
        }
      }
    ],
    inclusions: [
      { es: "Guía profesional certificado", en: "Certified professional guide" },
      { es: "Seguro de accidentes", en: "Accident insurance" },
      { es: "Transporte desde punto de encuentro", en: "Transport from meeting point" },
      {es: "Alimentación (desayuno, almuerzo, snacks)", en: "Meals (breakfast, lunch, snacks)" },
      { es: "Equipo de seguridad (botiquín, radio)", en: "Safety equipment (first aid kit, radio)" }
    ],
    exclusions: [
      { es: "Alojamiento antes/después del trek", en: "Accommodation before/after trek" },
      { es: "Bebidas alcohólicas", en: "Alcoholic beverages" },
      { es: "Propinas", en: "Tips" },
      { es: "Gastos personales", en: "Personal expenses" }
    ],
    recommendations: [
      { es: "Aclimatarse 1-2 días antes en Bogotá", en: "Acclimatize 1-2 days prior in Bogotá" },
      { es: "Mantenerse hidratado constantemente", en: "Stay constantly hydrated" },
      { es: "Caminar a paso pausado", en: "Walk at a slow pace" },
      { es: "Informar al guía de cualquier malestar", en: "Inform guide of any discomfort" }
    ]
  },

  // Tour 2: Paramillo
  'paramillo': {
    subtitle: {
      es: "Conquista una de las cumbres más desafiantes de Colombia",
      en: "Conquer one of Colombia's most challenging peaks"
    },
    faqs: [
      {
        question: {
          es: "¿Necesito experiencia previa en montañismo?",
          en: "Do I need prior mountaineering experience?"
        },
        answer: {
          es: "Sí, se recomienda experiencia básica en trekking de altura. Estaremos a más de 4000 msnm y el terreno puede ser técnico en algunos tramos.",
          en: "Yes, basic high-altitude trekking experience is recommended. We'll be above 4000 masl and terrain can be technical in sections."
        }
      },
      {
        question: {
          es: "¿Cuál es la mejor época para este trek?",
          en: "What's the best season for this trek?"
        },
        answer: {
          es: "Diciembre a marzo y julio a agosto son las épocas más secas. Sin embargo, el clima de montaña es impredecible, prepárate para lluvia en cualquier momento.",
          en: "December to March and July to August are the driest seasons. However, mountain weather is unpredictable, be prepared for rain anytime."
        }
      },
      {
        question: {
          es: "¿Hay refugios en la ruta?",
          en: "Are there shelters on the route?"
        },
        answer: {
          es: "No hay refugios establecidos. Dormiremos en carpas que proporcionamos nosotros. El campamento base está a aproximadamente 3800 msnm.",
          en: "There are no established shelters. We'll sleep in tents that we provide. Base camp is at approximately 3800 masl."
        }
      }
    ],
    inclusions: [
      { es: "Guía de montaña certificado UIAGM", en: "UIAGM certified mountain guide" },
      { es: "Porteo de equipo técnico", en: "Technical equipment portage" },
      { es: "Carpas de alta montaña", en: "High-altitude tents" },
      { es: "Todas las comidas durante el trek", en: "All meals during the trek" },
      { es: "Equipo de cocina y cocinero", en: "Cooking equipment and cook" },
      { es: "Equipo de seguridad (cuerdas, comunicación)", en: "Safety equipment (ropes, communication)" }
    ],
    exclusions: [
      { es: "Equipo personal (botas, ropa técnica)", en: "Personal gear (boots, technical clothing)" },
      { es: "Sleeping bag (se puede alquilar)", en: "Sleeping bag (can be rented)" },
      { es: "Seguro de evacuación aérea", en: "Air evacuation insurance" },
      { es: "Alojamiento en ciudad base", en: "Accommodation in base city" }
    ],
    recommendations: [
      { es: "Entrenamiento cardiovascular 2-3 meses antes", en: "Cardiovascular training 2-3 months prior" },
      { es: "Consultar médico antes del viaje", en: "Consult doctor before trip" },
      { es: "Llevar medicación para mal de altura", en: "Bring altitude sickness medication" },
      { es: "Practicar con tu mochila antes del trek", en: "Practice with your backpack before trek" }
    ]
  },

  // Tour 3: Glaciar Santa Isabel
  'santa_isabel': {
    subtitle: {
      es: "Alcanza el techo del Parque Nacional Natural Los Nevados",
      en: "Reach the summit of Los Nevados National Natural Park"
    },
    faqs: [
      {
        question: {
          es: "¿Llegaremos hasta el glaciar?",
          en: "Will we reach the glacier?"
        },
        answer: {
          es: "Sí, el objetivo es llegar hasta el nevado Santa Isabel (4965 msnm). Sin embargo, las condiciones climáticas y el estado del grupo determinarán el punto final exacto.",
          en: "Yes, the goal is to reach Nevado Santa Isabel (4965 masl). However, weather conditions and group status will determine the exact endpoint."
        }
      },
      {
        question: {
          es: "¿Necesito equipo de nieve?",
          en: "Do I need snow equipment?"
        },
        answer: {
          es: "Sí, proporcionamos crampones, piolet y arnés. Debes traer botas rígidas compatibles con crampones. Podemos alquilarlas si no tienes.",
          en: "Yes, we provide crampones, ice axe, and harness. You must bring rigid boots compatible with crampons. We can rent them if you don't have."
        }
      },
      {
        question: {
          es: "¿Qué tan frío hace?",
          en: "How cold does it get?"
        },
        answer: {
          es: "Las temperaturas van desde 15°C en el valle hasta -5°C o menos en la cumbre. El viento puede hacer que se sienta más frío. Lleva ropa térmica adecuada.",
          en: "Temperatures range from 15°C in the valley to -5°C or less at the summit. Wind can make it feel colder. Bring appropriate thermal clothing."
        }
      }
    ],
    inclusions: [
      { es: "Guía certificado en glaciares", en: "Glacier-certified  guide" },
      { es: "Equipo de glaciar (crampones, piolet, arnés)", en: "Glacier equipment (crampons, ice axe, harness)" },
      { es: "Transporte 4x4 hasta base de montaña", en: "4x4 transport to mountain base" },
      { es: "Permisos de ingreso al parque", en: "Park entrance permits" },
      { es: "Alimentación completa (3 días)", en: "Full meals (3 days)" },
      { es: "Carpas y equipo de campamento", en: "Tents and camping equipment" }
    ],
    exclusions: [
      { es: "Botas de alta montaña (alquiler disponible)", en: "High-altitude boots (rental available)" },
      { es: "Bolsa de dormir -15°C (alquiler disponible)", en: "Sleeping bag -15°C (rental available)" },
      { es: "Ropa técnica personal", en: "Personal technical clothing" },
      { es: "Seguro de montaña", en: "Mountain insurance" }
    ],
    recommendations: [
      { es: "Llegar a Manizales/Pereira 2 días antes", en: "Arrive to Manizales/Pereira 2 days early" },
      { es: "Realizar caminatas de aclimatación previas", en: "Do prior acclimatization hikes" },
      { es: "Llevar lentes de sol con protección UV alta", en: "Bring sunglasses with high UV protection" },
      { es: "Aplicar protector solar cada 2 horas", en: "Apply sunscreen every 2 hours" }
    ]
  }
};

async function populateTours() {
  try {
    console.log('🚀 Starting tour population...\n');

    // Get all tours from API
    const response = await axios.get(`${API_URL}/admin/tours`, {
      headers: { 'X-Admin-Secret-Key': ADMIN_KEY }
    });
    
    const tours = response.data;
    console.log(`Found ${tours.length} tours\n`);

    for (const tour of tours) {
      const tourId = tour.tourId;
      const tourName = tour.name?.es?.toLowerCase() || '';

      console.log(`📝 Processing: "${tour.name?.es}" (${tourId})`);

      let updateData = null;

      // Match tour to update data
      if (tourName.includes('paramo') && !tourName.includes('paramillo')) {
        updateData = tourUpdates.paramo;
        console.log('   → Matched: Páramo tour');
      } else if (tourName.includes('paramillo')) {
        updateData = tourUpdates.paramillo;
        console.log('   → Matched: Paramillo trek');
      } else if (tourName.includes('santa isabel') || tourName.includes('glaciar')) {
        updateData = tourUpdates.santa_isabel;
        console.log('   → Matched: Santa Isabel glacier');
      } else {
        console.log('   ⚠️  No match found, skipping...\n');
        continue;
      }

      // Update the tour via API
      await axios.put(`${API_URL}/admin/tours/${tourId}`, {
        subtitle: updateData.subtitle,
        faqs: updateData.faqs,
        inclusions: updateData.inclusions,
        exclusions: updateData.exclusions,
        recommendations: updateData.recommendations
      }, {
        headers: { 'X-Admin-Secret-Key': ADMIN_KEY }
      });

      console.log('   ✅ Updated successfully!');
      console.log(`   - Subtitle: "${updateData.subtitle.es}"`);
      console.log(`   - FAQs: ${updateData.faqs.length}`);
      console.log(`   - Inclusions: ${updateData.inclusions.length}`);
      console.log(`   - Exclusions: ${updateData.exclusions.length}`);
      console.log(`   - Recommendations: ${updateData.recommendations.length}\n`);
    }

    console.log('✅ All tours populated successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error populating tours:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run the script
populateTours();
