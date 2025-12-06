/**
 * Create 5 Additional Tours with Complete Data
 * Professional Colombian trekking tours
 */

const axios = require('axios');

const API_URL = 'https://us-central1-nevadotrektest01.cloudfunctions.net/api';
const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

// 5 New Professional Tours
const newTours = [
  // TOUR 4: Ciudad Perdida
  {
    name: {
      es: "Trek a Ciudad Perdida",
      en: "Lost City Trek"
    },
    subtitle: {
      es: "Descubre la misteriosa ciudad ancestral de los Tayrona",
      en: "Discover the mysterious ancestral city of the Tayrona"
    },
    description: {
      es: "La Ciudad Perdida (Teyuna) es uno de los sitios arqueológicos más importantes de Colombia, construida alrededor del año 800 d.C., 650 años antes que Machu Picchu. Este trek de 4 días te llevará a través de la selva tropical de la Sierra Nevada de Santa Marta, cruzando ríos, visitando comunidades indígenas Kogui y Wiwa, y finalmente ascendiendo las 1,200 escalones de piedra hasta las terrazas circulares de esta antigua ciudad. Una experiencia cultural y de aventura única que combina historia precolombina, biodiversidad y contacto con comunidades ancestrales.",
      en: "Ciudad Perdida (Teyuna) is one of Colombia's most important archaeological sites, built around 800 AD, 650 years before Machu Picchu. This 4-day trek will take you through the tropical rainforest of Sierra Nevada de Santa Marta, crossing rivers, visiting Kogui and Wiwa indigenous communities, and finally ascending the 1,200 stone steps to the circular terraces of this ancient city. A unique cultural and adventure experience combining pre-Columbian history, biodiversity, and contact with ancestral communities."
    },
    shortDescription: {
      es: "Trek de 4 días a través de selva tropical hasta el impresionante sitio arqueológico de Ciudad Perdida, con visitas a comunidades indígenas.",
      en: "4-day trek through tropical rainforest to the impressive archaeological site of Ciudad Perdida, with visits to indigenous communities."
    },
    difficulty: "Moderate",
    totalDays: 4,
    distance: 52,
    temperature: 28,
    altitude: {
      es: "1,200 msnm",
      en: "1,200 masl"
    },
    location: {
      es: "Sierra Nevada de Santa Marta, Magdalena, Colombia",
      en: "Sierra Nevada de Santa Marta, Magdalena, Colombia"
    },
    type: "multi-day",
    isActive: true,
    pricingTiers: [
      { minPax: 1, maxPax: 1, priceCOP: 1200000, priceUSD: 300 },
      { minPax: 2, maxPax: 2, priceCOP: 950000, priceUSD: 240 },
      { minPax: 3, maxPax: 3, priceCOP: 850000, priceUSD: 215 },
      { minPax: 4, maxPax: 8, priceCOP: 780000, priceUSD: 195 }
    ],
    images: [
      "https://images.unsplash.com/photo-1609137144813-7d9921338f24",
      "https://images.unsplash.com/photo-1551244072-5d12893278ab",
      "https://images.unsplash.com/photo-1587974928442-77dc3e0dba72"
    ],
    faqs: [
      {
        question: {
          es: "¿Cuál es el mejor momento para hacer este trek?",
          en: "What's the best time to do this trek?"
        },
        answer: {
          es: "Diciembre a marzo es temporada seca, ideal para el trek. Junio a agosto también es buena época. Evita septiembre-noviembre (época de lluvias intensas).",
          en: "December to March is dry season, ideal for trekking. June to August is also good. Avoid September-November (heavy rain season)."
        }
      },
      {
        question: {
          es: "¿Necesito estar muy en forma?",
          en: "Do I need to be very fit?"
        },
        answer: {
          es: "Se requiere condición física moderada. Caminarás 6-8 horas diarias con calor y humedad. Entrena caminatas de al menos 2-3 horas antes del viaje.",
          en: "Moderate fitness required. You'll walk 6-8 hours daily in heat and humidity. Train with hikes of at least 2-3 hours before the trip."
        }
      },
      {
        question: {
          es: "¿Dónde dormimos?",
          en: "Where do we sleep?"
        },
        answer: {
          es: "En campamentos autorizados con hamacas y mosquiteros. Los campamentos tienen baños básicos y duchas de agua fría. No se permite acampar en carpas.",
          en: "In authorized camps with hammocks and mosquito nets. Camps have basic bathrooms and cold-water showers. Tent camping is not allowed."
        }
      }
    ],
    inclusions: [
      { es: "Guía profesional certificado", en: "Certified professional guide" },
      { es: "Todas las comidas (desayuno, almuerzo, cena)", en: "All meals (breakfast, lunch, dinner)" },
      { es: "Alojamiento en hamacas con mosquiteros", en: "Hammock accommodation with mosquito nets" },
      { es: "Entrada a Ciudad Perdida", en: "Lost City entrance fee" },
      { es: "Seguro de accidentes", en: "Accident insurance" },
      { es: "Mulas para transporte de equipaje (hasta 10kg)", en: "Mules for luggage transport (up to 10kg)" }
    ],
    exclusions: [
      { es: "Transporte Santa Marta - Machete Pelao", en: "Transport Santa Marta - Machete Pelao" },
      { es: "Bebidas alcohólicas", en: "Alcoholic beverages" },
      { es: "Equipo personal (mochila, linterna, etc)", en: "Personal equipment (backpack, flashlight, etc)" },
      { es: "Propinas para guías y cocineros", en: "Tips for guides and cooks" }
    ],
    recommendations: [
      { es: "Usar ropa ligera y de secado rápido", en: "Wear light, quick-dry clothing" },
      { es: "Llevar repelente de insectos fuerte", en: "Bring strong insect repellent" },
      { es: "Proteger documentos y electrónicos del agua", en: "Protect documents and electronics from water" },
      { es: "Llevar linterna frontal con baterías extra", en: "Bring headlamp with extra batteries" }
    ],
    itinerary: {
      days: [
        {
          dayNumber: 1,
          title: {
            es: "Día 1: Santa Marta - Campamento Adán",
            en: "Day 1: Santa Marta - Adán Camp"
          },
          activities: [
            { es: "Transporte a Machete Pelao (2 horas)", en: "Transport to Machete Pelao (2 hours)" },
            { es: "Inicio del trek por sendero selvático", en: "Trek start through jungle trail" },
            { es: "Cruce del Río Buritaca", en: "Buritaca River crossing" },
            { es: "Llegada al Campamento Adán", en: "Arrival at Adán Camp" },
            { es: "Cena y descanso", en: "Dinner and rest" }
          ]
        },
        {
          dayNumber: 2,
          title: {
            es: "Día 2: Campamento Adán - Campamento Mumake",
            en: "Day 2: Adán Camp - Mumake Camp"
          },
          activities: [
            { es: "Ascenso por selva tropical", en: "Ascent through rainforest" },
            { es: "Visita a comunidad indígena Kogui", en: "Visit to Kogui indigenous community" },
            { es: "Almuerzo en ruta", en: "Lunch on route" },
            { es: "Múltiples cruces de río", en: "Multiple river crossings" },
            { es: "Llegada a Campamento Mumake", en: "Arrival at Mumake Camp" }
          ]
        },
        {
          dayNumber: 3,
          title: {
            es: "Día 3: Visita a Ciudad Perdida",
            en: "Day 3: Lost City Visit"
          },
          activities: [
            { es: "Salida temprana (5:30 AM)", en: "Early departure (5:30 AM)" },
            { es: "Ascenso de 1,200 escalones de piedra", en: "1,200 stone steps ascent" },
            { es: "Exploración de terrazas y plazas", en: "Exploration of terraces and plazas" },
            { es: "Charla sobre cultura Tayrona", en: "Talk about Tayrona culture" },
            { es: "Retorno a Campamento Mumake", en: "Return to Mumake Camp" }
          ]
        },
        {
          dayNumber: 4,
          title: {
            es: "Día 4: Retorno a Santa Marta",
            en: "Day 4: Return to Santa Marta"
          },
          activities: [
            { es: "Desayuno y empaque", en: "Breakfast and packing" },
            { es: "Descenso por ruta alternativa", en: "Descent via alternative route" },
            { es: "Almuerzo en comunidad indígena", en: "Lunch at indigenous community" },
            { es: "Llegada a Machete Pelao", en: "Arrival at Machete Pelao" },
            { es: "Transporte a Santa Marta", en: "Transport to Santa Marta" }
          ]
        }
      ]
    }
  },

  // TOUR 5: El Cocuy Circuit
  {
    name: {
      es: "Circuito Sierra Nevada del Cocuy",
      en: "Cocuy Mountain Range Circuit"
    },
    subtitle: {
      es: "Atraviesa la cordillera glaciar más espectacular de Colombia",
      en: "Cross Colombia's most spectacular glacier mountain range"
    },
    description: {
      es: "El Parque Nacional Natural El Cocuy es hogar de la mayor masa glaciar de Colombia, con 25 picos nevados que superan los 5,000 metros. Este circuito de 6 días te permite rodear completamente la cordillera, pasando por valles glaciares, lagunas de alta montaña, y miradores con vistas panorámicas de los nevados. Considerado uno de los treks más hermosos de Sudamérica, combina paisajes alpinos, páramos únicos y la oportunidad de observar fauna andina como el cóndor y el oso de anteojos. Requiere excelente condición física debido a la altitud constante sobre 4,000 msnm.",
      en: "El Cocuy National Natural Park is home to Colombia's largest glacier mass, with 25 snow-capped peaks exceeding 5,000 meters. This 6-day circuit allows you to completely surround the mountain range, passing through glacial valleys, high-altitude lagoons, and viewpoints with panoramic views of the snow-capped peaks. Considered one of South America's most beautiful treks, it combines alpine landscapes, unique páramos, and the opportunity to observe Andean fauna like condors and spectacled bears. Requires excellent physical condition due to constant altitude above 4,000 masl."
    },
    shortDescription: {
      es: "Circuito de 6 días rodeando la cordillera glaciar del Cocuy, atravesando valles, lagunas y páramos de alta montaña.",
      en: "6-day circuit surrounding the Cocuy glacier range, crossing valleys, lagoons, and high-altitude páramos."
    },
    difficulty: "Very Difficult",
    totalDays: 6,
    distance: 65,
    temperature: 0,
    altitude: {
      es: "5,100 msnm (máxima)",
      en: "5,100 masl (maximum)"
    },
    location: {
      es: "Parque Nacional El Cocuy, Boyacá, Colombia",
      en: "El Cocuy National Park, Boyacá, Colombia"
    },
    type: "multi-day",
    isActive: true,
    pricingTiers: [
      { minPax: 1, maxPax: 1, priceCOP: 2400000, priceUSD: 600 },
      { minPax: 2, maxPax: 2, priceCOP: 1800000, priceUSD: 450 },
      { minPax: 3, maxPax: 3, priceCOP: 1500000, priceUSD: 375 },
      { minPax: 4, maxPax: 8, priceCOP: 1350000, priceUSD: 340 }
    ],
    images: [
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
      "https://images.unsplash.com/photo-1519904981063-b0cf448d479e",
      "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99"
    ],
    faqs: [
      {
        question: { es: "¿Cuándo está abierto el parque?", en: "When is the park open?" },
        answer: {
          es: "El parque abre temporadas específicas (enero-febrero, junio-agosto). Siempre verifica fechas actuales ya que puede cerrar por protección glaciar o contingencias.",
          en: "The park opens specific seasons (January-February, June-August). Always verify current dates as it may close for glacier protection or contingencies."
        }
      },
      {
        question: { es: "¿Es necesario aclimatarse?", en: "Is acclimatization necessary?" },
        answer: {
          es: "¡Absolutamente! Recomendamos llegar 2-3 días antes y hacer caminatas de aclimatación en Güicán. La altura constante sobre 4,000m es muy exigente.",
          en: "Absolutely! We recommend arriving 2-3 days early and doing acclimatization hikes in Güicán. The constant altitude above 4,000m is very demanding."
        }
      },
      {
        question: { es: "¿Qué tan frío hace?", en: "How cold does it get?" },
        answer: {
          es: "Las temperaturas nocturnas pueden bajar a -10°C. Necesitas bolsa de dormir -15°C mínimo, ropa térmica de alta calidad y chaqueta impermeable.",
          en: "Night temperatures can drop to -10°C. You need a -15°C minimum sleeping bag, high-quality thermal clothing, and waterproof jacket."
        }
      }
    ],
    inclusions: [
      { es: "Guía de alta montaña certificado", en: "Certified high-mountain guide" },
      { es: "Mulas para transporte de equipaje", en: "Mules for luggage transport" },
      { es: "Carpas de alta montaña 4 estaciones", en: "4-season high-altitude tents" },
      { es: "Todas las comidas (6 días)", en: "All meals (6 days)" },
      { es: "Equipo de cocina y cocinero", en: "Cooking equipment and cook" },
      { es: "Permisos de ingreso al parque", en: "Park entrance permits" },
      { es: "Seguro de montaña", en: "Mountain insurance" }
    ],
    exclusions: [
      { es: "Transporte a Güicán/El Cocuy", en: "Transport to Güicán/El Cocuy" },
      { es: "Bolsa de dormir -15°C (alquiler disponible)", en: "Sleeping bag -15°C (rental available)" },
      { es: "Ropa y equipo personal de alta montaña", en: "Personal high-altitude clothing and equipment" },
      { es: "Medicación para altura", en: "Altitude medication" }
    ],
    recommendations: [
      { es: "Aclimatación obligatoria de 2-3 días", en: "Mandatory 2-3 day acclimatization" },
      { es: "Entrenamiento físico intenso 3 meses antes", en: "Intense physical training 3 months prior" },
      { es: "Examen médico pre-viaje", en: "Pre-trip medical examination" },
      { es: "Seguro de evacuación aérea recomendado", en: "Air evacuation insurance recommended" }
    ],
    itinerary: {
      days: [
        {
          dayNumber: 1,
          title: { es: "Día 1: Güicán - Laguna Grande de la Sierra", en: "Day 1: Güicán - Laguna Grande de la Sierra" },
          activities: [
            { es: "Transporte a inicio del sendero (3,800 msnm)", en: "Transport to trailhead (3,800 masl)" },
            { es: "Ascenso gradual por el Valle de Lagunillas", en: "Gradual ascent through Lagunillas Valley" },
            { es: "Campamento junto a Laguna Grande (4,400 msnm)", en: "Camp at Laguna Grande (4,400 masl)" }
          ]
        },
        {
          dayNumber: 2,
          title: { es: "Día 2: Laguna Grande - Púlpito del Diablo", en: "Day 2: Laguna Grande - Devil's Pulpit" },
          activities: [
            { es: "Cruce del paso alto (4,800 msnm)", en: "High pass crossing (4,800 masl)" },
            { es: "Vistas de nevados Pan de Azúcar y El Castillo", en: "Views of Pan de Azúcar and El Castillo peaks" },
            { es: "Campamento en Púlpito del Diablo (4,600 msnm)", en: "Camp at Devil's Pulpit (4,600 masl)" }
          ]
        },
        {
          dayNumber: 3,
          title: { es: "Día 3: Púlpito - Laguna de la Plaza", en: "Day 3: Púlpito - Plaza Lagoon" },
          activities: [
            { es: "Travesía por valle glacial", en: "Glacial valley traverse" },
            { es: "Paso junto al Nevado Ritacuba Blanco (5,410m)", en: "Pass by Ritacuba Blanco Peak (5,410m)" },
            { es: "Campamento Laguna de la Plaza (4,300 msnm)", en: "Plaza Lagoon Camp (4,300 masl)" }
          ]
        },
        {
          dayNumber: 4,
          title: { es: "Día 4: Laguna de la Plaza - Peña Negra", en: "Day 4: Plaza Lagoon - Black Rock" },
          activities: [
            { es: "Ascenso opcional a mirador 5,100m", en: "Optional viewpoint ascent 5,100m" },
            { es: "Descenso al valle de Cóncavos", en: "Descent to Cóncavos valley" },
            { es: "Campamento Peña Negra (4,200 msnm)", en: "Black Rock Camp (4,200 masl)" }
          ]
        },
        {
          dayNumber: 5,
          title: { es: "Día 5: Peña Negra - Laguna Pintada", en: "Day 5: Black Rock - Painted Lagoon" },
          activities: [
            { es: "Cruce de morrenas glaciares", en: "Glacial moraine crossing" },
            { es: "Paso por Laguna del Avellanal", en: "Pass by Avellanal Lagoon" },
            { es: "Campamento Laguna Pintada (4,100 msnm)", en: "Painted Lagoon Camp (4,100 masl)" }
          ]
        },
        {
          dayNumber: 6,
          title: { es: "Día 6: Laguna Pintada - Güicán", en: "Day 6: Painted Lagoon - Güicán" },
          activities: [
            { es: "Descenso final por Valle de Lagunillas", en: "Final descent through Lagunillas Valley" },
            { es: "Celebración de cierre del circuito", en: "Circuit completion celebration" },
            { es: "Retorno a Güicán", en: "Return to Güicán" }
          ]
        }
      ]
    }
  },

  // TOUR 3: Laguna Verde del Ruiz
  {
    name: {
      es: "Laguna Verde del Nevado del Ruiz",
      en: "Green Lagoon of Nevado del Ruiz"
    },
    subtitle: {
      es: "Descubre una laguna esmeralda en el corazón del volcán activo",
      en: "Discover an emerald lagoon in the heart of an active volcano"
    },
    description: {
      es: "La Laguna Verde es un cráter volcánico inactivo ubicado en las faldas del Nevado del Ruiz, a 4,050 msnm. Sus aguas de un verde esmeralda intenso contrastan dramáticamente con el paisaje volcánico de rocas negras y el glaciar del Ruiz al fondo. Este trek de día completo te lleva por paisajes lunares, fumarolas activas y lagunas de colores variados. Es una excelente opción de aclimatación antes de ascensos más altos y ofrece vistas espectaculares del complejo volcánico Los Nevados. La ruta es técnicamente sencilla pero la altitud la hace moderadamente exigente.",
      en: "Laguna Verde is an inactive volcanic crater located on the slopes of Nevado del Ruiz, at 4,050 masl. Its intense emerald green waters contrast dramatically with the volcanic landscape of black rocks and the Ruiz glacier in the background. This full-day trek takes you through lunar landscapes, active fumaroles, and lagoons of varied colors. It's an excellent acclimatization option before higher ascents and offers spectacular views of the Los Nevados volcanic complex. The route is technically simple but the altitude makes it moderately demanding."
    },
    shortDescription: {
      es: "Trek de día completo a una impresionante laguna verde de origen volcánico, con paisajes lunares y vistas del Nevado del Ruiz.",
      en: "Full-day trek to an impressive volcanic green lagoon, with lunar landscapes and views of Nevado del Ruiz."
    },
    difficulty: "Moderate",
    totalDays: 1,
    distance: 14,
    temperature: 5,
    altitude: {
      es: "4,050 msnm",
      en: "4,050 masl"
    },
    location: {
      es: "Parque Nacional Los Nevados, Caldas, Colombia",
      en: "Los Nevados National Park, Caldas, Colombia"
    },
    type: "single-day",
    isActive: true,
    pricingTiers: [
      { minPax: 1, maxPax: 1, priceCOP: 380000, priceUSD: 95 },
      { minPax: 2, maxPax: 2, priceCOP: 280000, priceUSD: 70 },
      { minPax: 3, maxPax: 3, priceCOP: 240000, priceUSD: 60 },
      { minPax: 4, maxPax: 8, priceCOP: 220000, priceUSD: 55 }
    ],
    images: [
      "https://images.unsplash.com/photo-1506260408121-e353d10b87c7",
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b",
      "https://images.unsplash.com/photo-1519904981063-b0cf448d479e"
    ],
    faqs: [
      {
        question: { es: "¿Es peligroso estar cerca de un volcán activo?", en: "Is it dangerous to be near an active volcano?" },
        answer: {
          es: "El Ruiz es monitoreado 24/7 por el Servicio Geológico. Solo operamos cuando el nivel de alerta es verde. Tenemos protocolos de emergencia y comunicación constante con autoridades.",
          en: "Ruiz is monitored 24/7 by the Geological Service. We only operate when the alert level is green. We have emergency protocols and constant communication with authorities."
        }
      },
      {
        question: { es: "¿Puedo nadar en la laguna?", en: "Can I swim in the lagoon?" },
        answer: {
          es: "No se permite. El agua es extremadamente fría (2-4°C) y puede contener minerales volcánicos. Es un ecosistema frágil que debe ser protegido.",
          en: "Not permitted. Water is extremely cold (2-4°C) and may contain volcanic minerals. It's a fragile ecosystem that must be protected."
        }
      },
      {
        question: { es: "¿Se necesita experiencia previa?", en: "Is previous experience needed?" },
        answer: {
          es: "No se requiere experiencia técnica, pero sí buena condición física. La altitud puede causar mareos y cansancio. Camina lento y mantente hidratado.",
          en: "No technical experience required, but good physical condition is needed. Altitude may cause dizziness and fatigue. Walk slowly and stay hydrated."
        }
      }
    ],
    inclusions: [
      { es: "Guía de montaña certificado", en: "Certified mountain guide" },
      { es: "Transporte 4x4 desde Manizales", en: "4x4 transport from Manizales" },
      { es: "Entrada al Parque Los Nevados", en: "Los Nevados Park entrance" },
      { es: "Almuerzo tipo boxlunch", en: "Boxlunch" },
      { es: "Seguro de accidentes", en: "Accident insurance" }
    ],
    exclusions: [
      { es: "Desayuno y cena", en: "Breakfast and dinner" },
      { es: "Ropa de alta montaña", en: "High-altitude clothing" },
      { es: "Equipo personal (bastones, gafas)", en: "Personal equipment (poles, glasses)" },
      { es: "Propinas", en: "Tips" }
    ],
    recommendations: [
      { es: "Llegar a Manizales 1 día antes", en: "Arrive to Manizales 1 day early" },
      { es: "Usar múltiples capas de ropa", en: "Wear multiple clothing layers" },
      { es: "Bloqueador solar factor 50+", en: "Sunscreen SPF 50+" },
      { es: "Gafas de sol con protección UV", en: "UV protection sunglasses" }
    ],
    itinerary: {
      days: [
        {
          dayNumber: 1,
          title: { es: "Laguna Verde del Ruiz", en: "Ruiz Green Lagoon" },
          activities: [
            { es: "Salida desde Manizales (5:00 AM)", en: "Departure from Manizales (5:00 AM)" },
            { es: "Transporte 4x4 hasta Valle de las Tumbas", en: "4x4 transport to Valle de las Tumbas" },
            { es: "Inicio de caminata por paisaje volcánico", en: "Hike start through volcanic landscape" },
            { es: "Paso por Laguna del Otún", en: "Pass by Otún Lagoon" },
            { es: "Llegada a Laguna Verde (4,050 msnm)", en: "Arrival at Green Lagoon (4,050 masl)" },
            { es: "Almuerzo con vista al glaciar", en: "Lunch with glacier view" },
            { es: "Tiempo libre para fotografía", en: "Free time for photography" },
            { es: "Descenso y retorno a Manizales (6:00 PM)", en: "Descent and return to Manizales (6:00 PM)" }
          ]
        }
      ]
    }
  },

  // TOUR 8: Cerro Kennedy (Chingaza)
  {
    name: {
      es: "Cerro Kennedy - Chingaza",
      en: "Kennedy Peak - Chingaza"
    },
    subtitle: {
      es: "Explora el páramo que abastece de agua a Bogotá",
      en: "Explore the páramo that supplies water to Bogotá"
    },
    description: {
      es: "El Parque Nacional Natural Chingaza es la principal fuente de agua potable para Bogotá, protegiendo un ecosistema de páramo prístino a solo 50km de la capital. El Cerro Kennedy (3,700 msnm) ofrece una caminata de día completo a través de bosques andinos, páramos y lagunas glaciares. La biodiversidad es excepcional: osos de anteojos, venados de cola blanca, y más de 200 especies de aves. Las lagunas de Siecha, de origen glaciar, son el punto culminante del recorrido. Este trek es ideal para observación de flora y fauna, fotografía de naturaleza y como introducción al trekking de altura cerca de Bogotá.",
      en: "Chingaza National Natural Park is the main source of drinking water for Bogotá, protecting a pristine páramo ecosystem just 50km from the capital. Kennedy Peak (3,700 masl) offers a full-day hike through Andean forests, páramos, and glacial lagoons. Biodiversity is exceptional: spectacled bears, white-tailed deer, and over 200 bird species. The Siecha lagoons, of glacial origin, are the highlight of the route. This trek is ideal for flora and fauna observation, nature photography, and as an introduction to high-altitude trekking near Bogotá."
    },
    shortDescription: {
      es: "Trekking de día completo en Chingaza con visita a lagunas glaciares y observación de biodiversidad única del páramo.",
      en: "Full-day trekking in Chingaza with glacial lagoon visit and observation of unique páramo biodiversity."
    },
    difficulty: "Easy-Moderate",
    totalDays: 1,
    distance: 10,
    temperature: 10,
    altitude: {
      es: "3,700 msnm",
      en: "3,700 masl"
    },
    location: {
      es: "Parque Nacional Chingaza, Cundinamarca, Colombia",
      en: "Chingaza National Park, Cundinamarca, Colombia"
    },
    type: "single-day",
    isActive: true,
    pricingTiers: [
      { minPax: 1, maxPax: 1, priceCOP: 320000, priceUSD: 80 },
      { minPax: 2, maxPax: 2, priceCOP: 240000, priceUSD: 60 },
      { minPax: 3, maxPax: 3, priceCOP: 200000, priceUSD: 50 },
      { minPax: 4, maxPax: 8, priceCOP: 180000, priceUSD: 45 }
    ],
    images: [
      "https://images.unsplash.com/photo-1506260408121-e353d10b87c7",
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e",
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b"
    ],
    faqs: [
      {
        question: { es: "¿Se pueden ver osos de anteojos?", en: "Can spectacled bears be seen?" },
        answer: {
          es: "Chingaza tiene una población importante de osos pero son esquivos. Las probabilidades de verlos son bajas (5-10%), pero encontrarás rastros y aprenderás sobre su ecología.",
          en: "Chingaza has a significant bear population but they're elusive. Chances of seeing them are low (5-10%), but you'll find tracks and learn about their ecology."
        }
      },
      {
        question: { es: "¿Qué tan cerca está de Bogotá?", en: "How close is it to Bogotá?" },
        answer: {
          es: "A solo 50km (1.5 horas) desde Bogotá. Es perfecto para una excursión de día desde la ciudad sin necesidad de alojamiento externo.",
          en: "Only 50km (1.5 hours) from Bogotá. Perfect for a day trip from the city without needing external accommodation."
        }
      },
      {
        question: { es: "¿Cuál es la mejor época?", en: "What's the best season?" },
        answer: {
          es: "Diciembre-marzo y junio-agosto son más secos. Sin embargo, el páramo siempre puede tener lluvia. Lleva impermeable en cualquier época.",
          en: "December-March and June-August are drier. However, the páramo can always have rain. Bring rainwear any time."
        }
      }
    ],
    inclusions: [
      { es: "Guía naturalista especializado", en: "Specialized naturalist guide" },
      { es: "Transporte desde/hasta Bogotá", en: "Transport from/to Bogotá" },
      { es: "Entrada a Chingaza", en: "Chingaza entrance fee" },
      { es: "Almuerzo tipo picnic", en: "Picnic lunch" },
      { es: "Binoculares para observación de fauna", en: "Binoculars for wildlife observation" }
    ],
    exclusions: [
      { es: "Desayuno", en: "Breakfast" },
      { es: "Equipo de fotografía profesional", en: "Professional photography equipment" },
      { es: "Ropa impermeable (recomendada)", en: "Rainwear (recommended)" }
    ],
    recommendations: [
      { es: "Llevar ropa en capas y impermeable", en: "Bring layered clothing and rainwear" },
      { es: "Cámara con buen zoom para fauna", en: "Camera with good zoom for wildlife" },
      { es: "Caminar en silencio para observar animales", en: "Walk quietly to observe animals" },
      { es: "No alimentar ningún animal silvestre", en: "Don't feed any wild animals" }
    ],
    itinerary: {
      days: [
        {
          dayNumber: 1,
          title: { es: "Cerro Kennedy y Lagunas de Siecha", en: "Kennedy Peak and Siecha Lagoons" },
          activities: [
            { es: "Salida desde Bogotá (6:00 AM)", en: "Departure from Bogotá (6:00 AM)" },
            { es: "Llegada al Parque Chingaza", en: "Arrival at Chingaza Park" },
            { es: "Caminata por bosque andino", en: "Andean forest hike" },
            { es: "Ascenso al Cerro Kennedy", en: "Kennedy Peak ascent" },
            { es: "Visita a Lagunas de Siecha", en: "Siecha Lagoons visit" },
            { es: "Almuerzo con vista panorámica", en: "Lunch with panoramic view" },
            { es: "Observación de frailejones y fauna", en: "Frailejones and fauna observation" },
            { es: "Retorno a Bogotá (6:00 PM)", en: "Return to Bogotá (6:00 PM)" }
          ]
        }
      ]
    }
  },

  // TOUR 9: Volcán Puracé
  {
    name: {
      es: "Ascenso al Volcán Puracé",
      en: "Puracé Volcano Ascent"
    },
    subtitle: {
      es: "Conquista el volcán activo más accesible del Cauca",
      en: "Conquer Cauca's most accessible active volcano"
    },
    description: {
      es: "El Volcán Puracé (4,780 msnm) es uno de los volcanes activos más accesibles de Colombia, ubicado en el Parque Nacional Natural Puracé, cerca de Popayán. Este ascenso de 2 días ofrece la emoción de llegar al cráter de un volcán activo, con fumarolas sulfurosas y vistas a 360 grados de la Cordillera Central. La ruta atraviesa páramos de frailejones, formaciones volcánicas y paisajes lunares. El parque también es hogar del cóndor andino, y con suerte podrás observar estas majestuosas aves. La cumbre técnica requiere condición física muy buena debido a la altitud y el terreno volcánico suelto.",
      en: "Puracé Volcano (4,780 masl) is one of Colombia's most accessible active volcanoes, located in Puracé National Natural Park, near Popayán. This 2-day ascent offers the thrill of reaching an active volcano's crater, with sulfurous fumaroles and 360-degree views of the Central Cordillera. The route crosses frailejón páramos, volcanic formations, and lunar landscapes. The park is also home to the Andean condor, and with luck you'll observe these majestic birds. The technical summit requires very good physical condition due to altitude and loose volcanic terrain."
    },
    shortDescription: {
      es: "Ascenso de 2 días a un volcán activo con fumarolas, paisajes lunares y posibilidad de avistar cóndores andinos.",
      en: "2-day ascent to an active volcano with fumaroles, lunar landscapes, and chance to spot Andean condors."
    },
    difficulty: "Difficult",
    totalDays: 2,
    distance: 20,
    temperature: 3,
    altitude: {
      es: "4,780 msnm",
      en: "4,780 masl"
    },
    location: {
      es: "Parque Nacional Puracé, Cauca, Colombia",
      en: "Puracé National Park, Cauca, Colombia"
    },
    type: "multi-day",
    isActive: true,
    pricingTiers: [
      { minPax: 1, maxPax: 1, priceCOP: 850000, priceUSD: 215 },
      { minPax: 2, maxPax: 2, priceCOP: 650000, priceUSD: 165 },
      { minPax: 3, maxPax: 3, priceCOP: 550000, priceUSD: 140 },
      { minPax: 4, maxPax: 8, priceCOP: 500000, priceUSD: 125 }
    ],
    images: [
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
      "https://images.unsplash.com/photo-1519904981063-b0cf448d479e",
      "https://images.unsplash.com/photo-1454496522488-7a8e488e8606"
    ],
    faqs: [
      {
        question: { es: "¿Es seguro subir a un volcán activo?", en: "Is it safe to climb an active volcano?" },
        answer: {
          es: "Sí. El Puracé está constantemente monitoreado. Solo operamos con alerta verde. Tenemos protocolos de evacuación y comunicación directa con el Servicio Geológico.",
          en: "Yes. Puracé is constantly monitored. We only operate with green alert. We have evacuation protocols and direct communication with the Geological Service."
        }
      },
      {
        question: { es: "¿Veré cóndores?", en: "Will I see condors?" },
        answer: {
          es: "Puracé tiene una de las poblaciones de cóndores más importantes de Colombia. Las probabilidades de avistamiento son altas (60-70%), especialmente en las mañanas.",
          en: "Puracé has one of Colombia's most important condor populations. Sighting probabilities are high (60-70%), especially in mornings."
        }
      },
      {
        question: { es: "¿Qué tan difícil es la cumbre?", en: "How difficult is the summit?" },
        answer: {
          es: "La altitud es el mayor desafío. El terreno volcánico es suelto y resbaladizo. Requiere excelente condición física y experiencia en altura moderada.",
          en: "Altitude is the biggest challenge. Volcanic terrain is loose and slippery. Requires excellent physical condition and moderate altitude experience."
        }
      }
    ],
    inclusions: [
      { es: "Guía de alta montaña", en: "High-mountain guide" },
      { es: "Transporte desde Popayán", en: "Transport from Popayán" },
      { es: "Todas las comidas (2 días)", en: "All meals (2 days)" },
      { es: "Carpas y equipo de campamento", en: "Tents and camping equipment" },
      { es: "Entrada al Parque Puracé", en: "Puracé Park entrance" },
      { es: "Seguro de accidentes", en: "Accident insurance" }
    ],
    exclusions: [
      { es: "Alojamiento en Popayán", en: "Accommodation in Popayán" },
      { es: "Bolsa de dormir -10°C", en: "Sleeping bag -10°C" },
      { es: "Ropa técnica de alta montaña", en: "Technical high-altitude clothing" },
      { es: "Medicación para altura", en: "Altitude medication" }
    ],
    recommendations: [
      { es: "Llegar a Popayán 1 día antes", en: "Arrive to Popayán 1 day early" },
      { es: "Llevar máscara o pañuelo para gases sulfurosos", en: "Bring mask or bandana for sulfurous gases" },
      { es: "Bastones de trekking muy recomendados", en: "Trekking poles highly recommended" },
      { es: "Protector solar y labial factor alto", en: "High-factor sun and lip protection" }
    ],
    itinerary: {
      days: [
        {
          dayNumber: 1,
          title: { es: "Día 1: Popayán - Campamento Base", en: "Day 1: Popayán - Base Camp" },
          activities: [
            { es: "Transporte desde Popayán (2 horas)", en: "Transport from Popayán (2 hours)" },
            { es: "Inicio de ascenso por páramo de frailejones", en: "Ascent start through frailejón páramo" },
            { es: "Cruce de formaciones volcánicas", en: "Volcanic formation crossing" },
            { es: "Montaje de campamento (4,200 msnm)", en: "Camp setup (4,200 masl)" },
            { es: "Cena y briefing para cumbre", en: "Dinner and summit briefing" }
          ]
        },
        {
          dayNumber: 2,
          title: { es: "Día 2: Cumbre y Retorno", en: "Day 2: Summit and Return" },
          activities: [
            { es: "Salida alpina (4:00 AM)", en: "Alpine start (4:00 AM)" },
            { es: "Ascenso final por terreno volcánico", en: "Final ascent through volcanic terrain" },
            { es: "Cumbre del Volcán Puracé (4,780 msnm)", en: "Puracé Volcano summit (4,780 masl)" },
            { es: "Vista del cráter con fumarolas activas", en: "Crater view with active fumaroles" },
            { es: "Descenso a campamento para desayuno", en: "Descent to camp for breakfast" },
            { es: "Desmontaje y retorno a Popayán", en: "Camp breakdown and return to Popayán" }
          ]
        }
      ]
    }
  }
];

async function createNewTours() {
  try {
    console.log('🚀 Creating 5 new tours with complete data...\n');
    
    let created = 0;
    let failed = 0;
    
    for (const tourData of newTours) {
      try {
        console.log(`\n📝 Creating: "${tourData.name.es}"`);
        
        const response = await axios.post(`${API_URL}/admin/tours`, tourData, {
          headers: { 'X-Admin-Secret-Key': ADMIN_KEY }
        });
        
        console.log(`   ✅ Created successfully!`);
        console.log(`   - ID: ${response.data.tourId}`);
        console.log(`   - Subtitle: "${tourData.subtitle.es}"`);
        console.log(`   - Difficulty: ${tourData.difficulty}`);
        console.log(`   - Days: ${tourData.totalDays}`);
        console.log(`   - Altitude: ${tourData.altitude.es}`);
        
        created++;
        
      } catch (error) {
        console.error(`   ❌ Failed: ${error.response?.data?.error || error.message}`);
        failed++;
      }
    }
    
    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Summary: ${created} tours created, ${failed} failed`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('📋 New Tours:');
    console.log('   1. Trek a Ciudad Perdida (4 días, 52km)');
    console.log('   2. Circuito Sierra Nevada del Cocuy (6 días, 65km)');
    console.log('   3. Laguna Verde del Nevado del Ruiz (1 día, 14km)');
    console.log('   4. Cerro Kennedy - Chingaza (1 día, 10km)');
    console.log('   5. Ascenso al Volcán Puracé (2 días, 20km)');
    
    process.exit(created === 5 ? 0 : 1);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

createNewTours();
