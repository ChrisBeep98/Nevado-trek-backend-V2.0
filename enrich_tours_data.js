/**
 * Enrich Tours Data
 * Adds more FAQs, Inclusions, Exclusions and ensures 10+ images per tour
 */

const axios = require('axios');

const API_URL = 'https://us-central1-nevadotrektest01.cloudfunctions.net/api';
const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

// Helper to get random images for variety if needed, but we will define specific lists
const tourImages = {
  paramo: [
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b",
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e",
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
    "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05",
    "https://images.unsplash.com/photo-1472214103451-9374bd1c798e",
    "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d",
    "https://images.unsplash.com/photo-1501854140884-074bf6b243c7",
    "https://images.unsplash.com/photo-1533240332313-0db49b459ad6",
    "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07"
  ],
  paramillo: [
    "https://images.unsplash.com/photo-1519904981063-b0cf448d479e",
    "https://images.unsplash.com/photo-1454496522488-7a8e488e8606",
    "https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5",
    "https://images.unsplash.com/photo-1520939817895-060bdaf4de1e",
    "https://images.unsplash.com/photo-1502472584811-0a2f2ca8f9cf",
    "https://images.unsplash.com/photo-1491553895911-0055eca6402d",
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b",
    "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99",
    "https://images.unsplash.com/photo-1516939884455-1445c8652f83"
  ],
  santa_isabel: [
    "https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5",
    "https://images.unsplash.com/photo-1519904981063-b0cf448d479e",
    "https://images.unsplash.com/photo-1517760444937-f6397edcbbcd",
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b",
    "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99",
    "https://images.unsplash.com/photo-1520208422220-d12a3c588e6c",
    "https://images.unsplash.com/photo-1516939884455-1445c8652f83",
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
    "https://images.unsplash.com/photo-1454496522488-7a8e488e8606",
    "https://images.unsplash.com/photo-1520939817895-060bdaf4de1e"
  ],
  ciudad_perdida: [
    "https://images.unsplash.com/photo-1609137144813-7d9921338f24",
    "https://images.unsplash.com/photo-1551244072-5d12893278ab",
    "https://images.unsplash.com/photo-1587974928442-77dc3e0dba72",
    "https://images.unsplash.com/photo-1596422846543-75c6fc197f07",
    "https://images.unsplash.com/photo-1534234828563-025317354318",
    "https://images.unsplash.com/photo-1591389703635-e15a07b842d7",
    "https://images.unsplash.com/photo-1544084944-152696a63f72",
    "https://images.unsplash.com/photo-1599582106038-ba92969112f5",
    "https://images.unsplash.com/photo-1518182170546-0766aa6f1a26",
    "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6"
  ],
  cocuy: [
    "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99",
    "https://images.unsplash.com/photo-1519904981063-b0cf448d479e",
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b",
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
    "https://images.unsplash.com/photo-1454496522488-7a8e488e8606",
    "https://images.unsplash.com/photo-1516939884455-1445c8652f83",
    "https://images.unsplash.com/photo-1520208422220-d12a3c588e6c",
    "https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5",
    "https://images.unsplash.com/photo-1520939817895-060bdaf4de1e",
    "https://images.unsplash.com/photo-1502472584811-0a2f2ca8f9cf"
  ],
  laguna_verde: [
    "https://images.unsplash.com/photo-1506260408121-e353d10b87c7",
    "https://images.unsplash.com/photo-1534234828563-025317354318",
    "https://images.unsplash.com/photo-1470770841072-f978cf4d019e",
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b",
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
    "https://images.unsplash.com/photo-1519904981063-b0cf448d479e",
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e",
    "https://images.unsplash.com/photo-1472214103451-9374bd1c798e",
    "https://images.unsplash.com/photo-1501854140884-074bf6b243c7",
    "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07"
  ],
  chingaza: [
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e",
    "https://images.unsplash.com/photo-1506260408121-e353d10b87c7",
    "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05",
    "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d",
    "https://images.unsplash.com/photo-1501854140884-074bf6b243c7",
    "https://images.unsplash.com/photo-1472214103451-9374bd1c798e",
    "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07",
    "https://images.unsplash.com/photo-1533240332313-0db49b459ad6",
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b"
  ],
  purace: [
    "https://images.unsplash.com/photo-1454496522488-7a8e488e8606",
    "https://images.unsplash.com/photo-1519904981063-b0cf448d479e",
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b",
    "https://images.unsplash.com/photo-1516939884455-1445c8652f83",
    "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99",
    "https://images.unsplash.com/photo-1520208422220-d12a3c588e6c",
    "https://images.unsplash.com/photo-1502472584811-0a2f2ca8f9cf",
    "https://images.unsplash.com/photo-1520939817895-060bdaf4de1e",
    "https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5"
  ]
};

const extraData = {
  paramo: {
    faqs: [
      { q: { es: "¿Hay señal de celular?", en: "Is there cell signal?" }, a: { es: "La señal es intermitente. Hay buena señal en Monguí, pero en el páramo se pierde la mayor parte del tiempo.", en: "Signal is intermittent. Good signal in Monguí, but mostly lost in the páramo." } },
      { q: { es: "¿Pueden ir niños?", en: "Can children go?" }, a: { es: "Recomendamos niños mayores de 10 años que estén acostumbrados a caminar. La altura puede afectarles.", en: "We recommend children over 10 who are used to walking. Altitude may affect them." } },
      { q: { es: "¿Hay baños en el camino?", en: "Are there restrooms on the way?" }, a: { es: "No hay baños establecidos en la ruta. Se debe usar la naturaleza siguiendo principios de No Deje Rastro.", en: "No established restrooms on the route. Must use nature following Leave No Trace principles." } }
    ],
    inclusions: [
      { es: "Refrigerio de media mañana", en: "Mid-morning snack" },
      { es: "Préstamo de bastones de trekking", en: "Trekking poles loan" },
      { es: "Souvenir local", en: "Local souvenir" }
    ],
    exclusions: [
      { es: "Transporte hasta Monguí", en: "Transport to Monguí" },
      { es: "Hotel en Monguí", en: "Hotel in Monguí" }
    ]
  },
  paramillo: {
    faqs: [
      { q: { es: "¿Hay electricidad en el campamento?", en: "Is there electricity at camp?" }, a: { es: "No hay electricidad. Recomendamos llevar power banks para cargar tus dispositivos.", en: "No electricity. We recommend bringing power banks to charge your devices." } },
      { q: { es: "¿Cómo es el baño?", en: "How is the bathroom?" }, a: { es: "Usamos una carpa baño portátil o 'cat-holes' lejos de fuentes de agua. Todo el papel higiénico debe regresar contigo.", en: "We use a portable toilet tent or 'cat-holes' away from water sources. All toilet paper must return with you." } }
    ],
    inclusions: [
      { es: "Radios de comunicación", en: "Communication radios" },
      { es: "Botiquín avanzado de montaña", en: "Advanced mountain first aid kit" },
      { es: "Agua purificada ilimitada", en: "Unlimited purified water" }
    ],
    exclusions: [
      { es: "Ducha caliente", en: "Hot shower" },
      { es: "Porteador personal extra", en: "Extra personal porter" }
    ]
  },
  santa_isabel: {
    faqs: [
      { q: { es: "¿Qué tipo de botas necesito?", en: "What type of boots do I need?" }, a: { es: "Botas de caña alta, impermeables y con suela rígida o semirígida. Deben ser compatibles con crampones de correas.", en: "High-cut, waterproof boots with rigid or semi-rigid soles. Must be compatible with strap crampons." } },
      { q: { es: "¿Puedo alquilar ropa allá?", en: "Can I rent clothes there?" }, a: { es: "Sí, en Manizales hay tiendas de alquiler donde te ayudamos a conseguir chaqueta, pantalón y guantes.", en: "Yes, in Manizales there are rental shops where we help you get jacket, pants, and gloves." } }
    ],
    inclusions: [
      { es: "Charla técnica previa", en: "Pre-trip technical talk" },
      { es: "Certificado de cumbre (si se logra)", en: "Summit certificate (if achieved)" },
      { es: "Fotos profesionales digitales", en: "Professional digital photos" }
    ],
    exclusions: [
      { es: "Gafas de glaciar (obligatorias)", en: "Glacier glasses (mandatory)" },
      { es: "Gastos por evacuación médica", en: "Medical evacuation expenses" }
    ]
  },
  ciudad_perdida: {
    faqs: [
      { q: { es: "¿Hay muchos mosquitos?", en: "Are there many mosquitoes?" }, a: { es: "Sí, es selva húmeda. Es indispensable llevar repelente fuerte y aplicarlo constantemente. También recomendamos pantalón largo.", en: "Yes, it's humid jungle. Strong repellent is essential, apply constantly. Long pants also recommended." } },
      { q: { es: "¿Cómo dormimos?", en: "How do we sleep?" }, a: { es: "En camas o hamacas con mosquitero, según disponibilidad en los campamentos. Se asignan por orden de llegada.", en: "In beds or hammocks with mosquito nets, depending on camp availability. Assigned on first-come basis." } },
      { q: { es: "¿Puedo cargar mi celular?", en: "Can I charge my phone?" }, a: { es: "Sí, hay enchufes en los campamentos, pero son limitados y hay mucha gente. Lleva power bank.", en: "Yes, there are outlets in camps, but limited and many people. Bring power bank." } }
    ],
    inclusions: [
      { es: "Aporte a comunidades indígenas", en: "Contribution to indigenous communities" },
      { es: "Servicio de guardaequipaje en oficina", en: "Luggage storage at office" },
      { es: "Frutas frescas diarias", en: "Daily fresh fruits" }
    ],
    exclusions: [
      { es: "Mula de carga personal (opcional)", en: "Personal cargo mule (optional)" },
      { es: "Bebidas hidratantes (Gatorade, etc)", en: "Hydrating drinks (Gatorade, etc)" }
    ]
  },
  cocuy: {
    faqs: [
      { q: { es: "¿Es verdad que el parque cierra a veces?", en: "Is it true the park closes sometimes?" }, a: { es: "Sí, por razones ambientales o decisiones de la comunidad U'wa. Siempre verificamos el estado antes de confirmar.", en: "Yes, for environmental reasons or U'wa community decisions. We always verify status before confirming." } },
      { q: { es: "¿Hay señal de celular?", en: "Is there cell signal?" }, a: { es: "Solo en puntos muy específicos y altos. En los campamentos generalmente no hay señal. Es una desconexión total.", en: "Only at very specific high points. Camps usually have no signal. It's a total disconnection." } }
    ],
    inclusions: [
      { es: "Carpa comedor y carpa cocina", en: "Dining tent and kitchen tent" },
      { es: "Silla rimax para campamento", en: "Camp chair" },
      { es: "Bolsa para residuos humanos (WAG bag)", en: "Human waste bag (WAG bag)" }
    ],
    exclusions: [
      { es: "Ducha durante el trekking", en: "Shower during trek" },
      { es: "Hotel en Bogotá o punto de origen", en: "Hotel in Bogotá or origin point" }
    ]
  },
  laguna_verde: {
    faqs: [
      { q: { es: "¿Huele a azufre?", en: "Does it smell like sulfur?" }, a: { es: "Sí, al ser un cráter volcánico hay olor a azufre. Si eres sensible, recomendamos llevar una mascarilla N95.", en: "Yes, being a volcanic crater there is sulfur smell. If sensitive, we recommend an N95 mask." } },
      { q: { es: "¿Cuánto tiempo caminamos?", en: "How long do we walk?" }, a: { es: "Aproximadamente 4-5 horas en total, ida y regreso. El ritmo es suave debido a la altura.", en: "Approximately 4-5 hours total, round trip. Pace is slow due to altitude." } }
    ],
    inclusions: [
      { es: "Préstamo de capa para lluvia", en: "Rain poncho loan" },
      { es: "Bebida caliente tradicional", en: "Traditional hot drink" }
    ],
    exclusions: [
      { es: "Almuerzo en restaurante", en: "Restaurant lunch" }
    ]
  },
  chingaza: {
    faqs: [
      { q: { es: "¿Necesito permiso especial?", en: "Do I need a special permit?" }, a: { es: "Sí, Parques Nacionales exige reserva previa. Nosotros nos encargamos de todo el trámite con tus datos.", en: "Yes, National Parks requires prior reservation. We handle all paperwork with your data." } },
      { q: { es: "¿Qué calzado llevo?", en: "What footwear to bring?" }, a: { es: "Botas de trekking impermeables o botas de caucho (pantaneras). El terreno suele ser muy húmedo y fangoso.", en: "Waterproof trekking boots or rubber boots (wellingtons). Terrain is usually very wet and muddy." } }
    ],
    inclusions: [
      { es: "Seguro hotelero", en: "Hotel insurance" },
      { es: "Guía de aves (si se solicita)", en: "Bird guide (if requested)" }
    ],
    exclusions: [
      { es: "Transporte desde tu casa al punto de encuentro", en: "Transport from home to meeting point" }
    ]
  },
  purace: {
    faqs: [
      { q: { es: "¿Hace mucho viento?", en: "Is it very windy?" }, a: { es: "Sí, en la cima los vientos son fuertes. Es indispensable una buena chaqueta cortavientos y gorro.", en: "Yes, winds are strong at the summit. A good windbreaker jacket and hat are essential." } },
      { q: { es: "¿Podemos ver el cráter?", en: "Can we see the crater?" }, a: { es: "Sí, llegamos al borde del cráter principal. Es impresionante ver las fumarolas y el tamaño de la caldera.", en: "Yes, we reach the rim of the main crater. It's impressive to see fumaroles and caldera size." } }
    ],
    inclusions: [
      { es: "Visita a termales al finalizar", en: "Hot springs visit at the end" },
      { es: "Refrigerio típico de la región", en: "Typical regional snack" }
    ],
    exclusions: [
      { es: "Traje de baño y toalla", en: "Swimsuit and towel" }
    ]
  }
};

async function enrichTours() {
  try {
    console.log('🚀 Enriching all tours with more data and images...\n');

    // Get all tours
    const response = await axios.get(`${API_URL}/admin/tours`, {
      headers: { 'X-Admin-Secret-Key': ADMIN_KEY }
    });
    
    const tours = response.data;
    
    for (const tour of tours) {
      const tourId = tour.tourId;
      const tourName = tour.name?.es?.toLowerCase() || '';
      
      console.log(`📝 Processing: "${tour.name?.es}"`);
      
      let key = null;
      if (tourName.includes('paramo') && !tourName.includes('paramillo')) key = 'paramo';
      else if (tourName.includes('paramillo')) key = 'paramillo';
      else if (tourName.includes('santa isabel')) key = 'santa_isabel';
      else if (tourName.includes('ciudad perdida')) key = 'ciudad_perdida';
      else if (tourName.includes('cocuy')) key = 'cocuy';
      else if (tourName.includes('laguna verde')) key = 'laguna_verde';
      else if (tourName.includes('chingaza') || tourName.includes('kennedy')) key = 'chingaza';
      else if (tourName.includes('puracé') || tourName.includes('purace')) key = 'purace';
      
      if (!key) {
        console.log('   ⚠️  No match found, skipping...');
        continue;
      }

      const extra = extraData[key];
      const images = tourImages[key];

      // Merge data
      const newFaqs = [...(tour.faqs || [])];
      extra.faqs.forEach(f => {
        newFaqs.push({ question: f.q, answer: f.a });
      });

      const newInclusions = [...(tour.inclusions || [])];
      extra.inclusions.forEach(i => newInclusions.push(i));

      const newExclusions = [...(tour.exclusions || [])];
      extra.exclusions.forEach(e => newExclusions.push(e));

      // Update tour
      await axios.put(`${API_URL}/admin/tours/${tourId}`, {
        faqs: newFaqs,
        inclusions: newInclusions,
        exclusions: newExclusions,
        images: images
      }, {
        headers: { 'X-Admin-Secret-Key': ADMIN_KEY }
      });

      console.log(`   ✅ Updated successfully!`);
      console.log(`   - Images: ${images.length}`);
      console.log(`   - Total FAQs: ${newFaqs.length}`);
      console.log(`   - Total Inclusions: ${newInclusions.length}`);
      console.log(`   - Total Exclusions: ${newExclusions.length}`);
    }

    console.log('\n✅ All tours enriched successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

enrichTours();
