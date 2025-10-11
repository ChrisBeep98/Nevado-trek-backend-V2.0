const axios = require('axios');

// Configuration
const BASE_URL = 'https://admincreatetourv2-wgfhwjbpva-uc.a.run.app'; // Production endpoint
const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7'; // Your API key

async function createCorrectedNevadoDelTolimaTour() {
  console.log('Creating corrected production tour: Nevado del Tolima...');

  const tourData = {
    name: {
      es: "Nevado del Tolima",
      en: "Nevado del Tolima"
    },
    subtitle: {
      es: "una experiencia de altura",
      en: "an experience of altitude"
    },
    description: {
      es: "Ruta poco concurrida hacia la cumbre mas vertiginosa de la región",
      en: "Less traveled route to the most impressive summit of the region"
    },
    longDescription: {
      es: [
        "En esta expedición de 4 días alcanzaremos la cima del Nevado del Tolima que se encuentra a unos 5.220 mt sobre el nivel del mar. Es sin duda, una de las mejores montañas para escalar en Colombia. Su forma de cono volcánico, hace de ella una montaña que genera un escenario único a la par que majestuoso. Nos veremos inmersos en el Páramo ecosistema más importante de la región debido a sus nacimientos de agua. Conoceremos diferentes y majestuosas especies de flora y fauna en el trayecto, además, podremos visualizar un paisaje panorámico sin igual.",
        "Durante la travesía atravesaremos distintos pisos térmicos, desde bosques de niebla hasta los paisajes áridos del páramo altoandino. Cada jornada será una oportunidad para conectar con la naturaleza y con el desafío personal que implica llegar a la cima. Las caminatas estarán guiadas por expertos locales, quienes compartirán historias, datos curiosos y técnicas de montaña que harán de la experiencia algo tanto educativo como inspirador.",
        "Al llegar a la cumbre, seremos recompensados con una vista impresionante de los nevados del Ruiz, Santa Isabel y el Quindío, un espectáculo natural que pocas personas tienen la fortuna de presenciar. Este ascenso no solo representa una conquista física, sino también un viaje interior: un recordatorio de la fuerza, la perseverencia y el respeto que la montaña nos inspira."
      ],
      en: [
        "In this 4-day expedition we will reach the summit of Nevado del Tolima at 5,220 meters above sea level. It is undoubtedly one of the best mountains to climb in Colombia. Its volcanic cone shape makes it a mountain that creates a unique and majestic scenario. We will be immersed in the Páramo, the most important ecosystem in the region due to its water sources. We will learn about different and magnificent species of flora and fauna along the way, in addition, we can view an unmatched panoramic landscape.",
        "During the journey we will cross different thermal floors, from cloud forests to the arid landscapes of the high Andean páramo. Each day will be an opportunity to connect with nature and with the personal challenge that reaching the summit involves. The walks will be guided by local experts, who will share stories, interesting facts and mountain techniques that will make the experience both educational and inspiring.",
        "Upon reaching the summit, we will be rewarded with an impressive view of the Ruiz, Santa Isabel and Quindío snow-capped mountains, a natural spectacle that few people have the fortune to witness. This ascent represents not only a physical conquest, but also an inner journey: a reminder of the strength, perseverance and respect that the mountain inspires in us."
      ]
    },
    temperature: "Muy Frío",
    duration: "4 Días",
    difficulty: "5/5",
    distance: "60 km",
    elevation: "5.220 mt",
    departure: "Salento",
    price: {
      amount: 1000000,
      currency: "COP"
    },
    pricingTiers: [
      {
        pax: 1,
        pricePerPerson: {
          COP: 2780000,
          USD: 660
        }
      },
      {
        pax: 2,
        pricePerPerson: {
          COP: 1660000,
          USD: 395
        }
      },
      {
        pax: 3,
        pricePerPerson: {
          COP: 1200000,
          USD: 285
        }
      },
      {
        paxFrom: 4,
        paxTo: 8,
        pricePerPerson: {
          COP: 1000000,
          USD: 235
        }
      }
    ],
    maxParticipants: 8,
    images: [
      "https://res.cloudinary.com/nevado-trek/image/upload/c_limit,h_800,q_100,w_1200/v1657649637/Nevado/nevado16_vmg8tl.jpg",
      "https://res.cloudinary.com/nevado-trek/image/upload/c_limit,h_800,w_1200/v1657649635/Nevado/nevado11_bntklr.jpg",
      "https://res.cloudinary.com/nevado-trek/image/upload/c_scale,h_800,w_1200/v1659032505/Paramo/paramo001_qkakel.jpg",
      "https://res.cloudinary.com/nevado-trek/image/upload/c_scale,w_1200/v1657649637/Nevado/nevado14_ab2ath.jpg",
      "https://res.cloudinary.com/nevado-trek/image/upload/c_scale,w_1200/v1657649641/Nevado/nevado05_anbrcb.jpg",
      "https://res.cloudinary.com/nevado-trek/image/upload/c_scale,w_1200/v1657649642/Nevado/nevado07_xxunum.jpg",
      "https://res.cloudinary.com/nevado-trek/image/upload/c_scale,q_90,w_1200/v1657649642/Nevado/nevado09_nlejbk.jpg"
    ],
    details: [
      {
        label: { es: "Temperatura", en: "Temperature" },
        value: { es: "Muy Frío", en: "Very Cold" }
      },
      {
        label: { es: "Duración", en: "Duration" },
        value: { es: "4 Días", en: "4 Days" }
      },
      {
        label: { es: "Dificultad", en: "Difficulty" },
        value: { es: "5/5", en: "5/5" }
      },
      {
        label: { es: "Distancia", en: "Distance" },
        value: { es: "60 km", en: "60 km" }
      },
      {
        label: { es: "Altitud", en: "Altitude" },
        value: { es: "5.220 mt", en: "5,220 mt" }
      },
      {
        label: { es: "Salida desde", en: "Departure from" },
        value: { es: "Salento", en: "Salento" }
      }
    ],
    inclusions: [
      { es: "Guías de alta montaña.", en: "High mountain guides." },
      { es: "Seguro contra todo riesgo.", en: "All-risk insurance." },
      { es: "Alimentación completa, desde el desayuno del día 1, hasta el almuerzo del día 4.", en: "Complete meals, from breakfast on day 1 to lunch on day 4." },
      { es: "Bebidas calientes y snacks en campamentos y refugios.", en: "Hot drinks and snacks at campsites and refuges." },
      { es: "Alojamiento 2 noches en refugio de montaña (camarotes).", en: "Accommodation for 2 nights in mountain refuge (bunks)." },
      { es: "Alojamiento 1 noche en campamento de alta montaña (2 personas por carpa).", en: "Accommodation for 1 night in high mountain camp (2 people per tent)." },
      { es: "Equipo de camping, aislantes y sleeping.", en: "Camping equipment, sleeping pads and sleeping bags." },
      { es: "Menaje (plato, cuchara, vaso).", en: "Tableware (plate, spoon, glass)." },
      { es: "Equipo completo de glaciar, casco, arnés, crampones, piolet, cuerda y mosquetones.", en: "Complete glacier equipment, helmet, harness, crampons, ice axe, rope and carabiners." },
      { es: "Transporte de equipaje en mula.", en: "Luggage transportation by mule." }
    ],
    recommendations: [
      { es: "Buena hidratación antes, durante y después.", en: "Good hydration before, during and after." },
      { es: "Utilizar anteojos oscuros con alto factor UV.", en: "Use dark glasses with high UV factor." },
      { es: "Llevar agua", en: "Bring water" },
      { es: "Usar protector solar de alta gama.", en: "Use high-grade sunscreen." },
      { es: "Lleve ropa y calzado adecuados para la humedad.", en: "Wear appropriate clothing and footwear for humidity." },
      { es: "Mantenga su propio ritmo, respire y descanse si lo requiere.", en: "Keep your own pace, breathe and rest if needed." },
      { es: "No ingerir bebidas alcohólicas durante el viaje.", en: "Do not consume alcoholic beverages during the trip." }
    ],
    itinerary: {
      type: "structured",
      days: [
        {
          day: 1,
          title: { 
            es: "Día 1: Inicio del viaje - Nevado del Tolima", 
            en: "Day 1: Journey Start - Nevado del Tolima" 
          },
          activities: [
            { es: "Encuentro del guía a las 6 a.m en tu hostal o lugar definido, desayuno", en: "Guide meeting at 6 a.m. at your hostel or defined place, breakfast" },
            { es: "Transporte hacia el valle de Cocora (2400 mt)", en: "Transport to Cocora Valley (2400 mt)" },
            { es: "Caminata de 18km por el Bosque de Niebla y Bosque Alto Andino", en: "18km hike through Cloud Forest and High Andean Forest" },
            { es: "Llegada a la Finca la Playa, descanso", en: "Arrival at Finca La Playa, rest" },
            { es: "Comida y descanso en camarotes del refugio", en: "Lunch and rest in refuge bunks" }
          ]
        },
        {
          day: 2,
          title: { 
            es: "Día 2: Páramo y Laguna del Encanto - Nevado del Tolima", 
            en: "Day 2: Páramo and Laguna del Encanto - Nevado del Tolima" 
          },
          activities: [
            { es: "Desayuno a las 8:00 a.m. y caminata de 7km", en: "Breakfast at 8:00 a.m. and 7km hike" },
            { es: "Paseo por el páramo y Laguna del Encanto", en: "Walk through the páramo and Laguna del Encanto" },
            { es: "Llegada al campamento base (4500 mt)", en: "Arrival at base camp (4500 mt)" },
            { es: "Inducción de equipos para progresión en glaciar", en: "Equipment induction for glacier progression" }
          ]
        },
        {
          day: 3,
          title: { 
            es: "Día 3: Intento de cumbre - Nevado del Tolima", 
            en: "Day 3: Summit Attempt - Nevado del Tolima" 
          },
          activities: [
            { es: "Inicio a las 3:00 a.m con intento de cumbre", en: "Start at 3:00 a.m. with summit attempt" },
            { es: "Llegada a la cima del glaciar (5220 mt)", en: "Arrival at glacier summit (5220 mt)" },
            { es: "Vista panorámica de Nevados del Ruiz, Santa Isabel y Nevado del Ruíz", en: "Panoramic view of Ruiz, Santa Isabel and Nevado del Ruíz snow-capped mountains" },
            { es: "Descenso hacia Finca la Playa", en: "Descent to Finca la Playa" }
          ]
        },
        {
          day: 4,
          title: { 
            es: "Día 4: Descenso final - Nevado del Tolima", 
            en: "Day 4: Final Descent - Nevado del Tolima" 
          },
          activities: [
            { es: "Inicio a las 8:00 a.m. para descender", en: "Start at 8:00 a.m. to descend" },
            { es: "Descenso por Páramo, Bosque Alto Andino y Bosque de Niebla", en: "Descent through Páramo, High Andean Forest and Cloud Forest" },
            { es: "Llegada a Valle de Cocora", en: "Arrival at Cocora Valley" },
            { es: "Retorno a Salento", en: "Return to Salento" }
          ]
        }
      ]
    },
    faqs: [
      {
        question: { es: "¿Qué nivel de dificultad tiene esta expedición?", en: "What level of difficulty does this expedition have?" },
        answer: { 
          es: "Esta expedición es de dificultad 5/5, lo que la clasifica como muy exigente. Requiere un buen estado físico y experiencia previa en actividades de alta montaña.", 
          en: "This expedition has a difficulty level of 5/5, making it very demanding. It requires good physical condition and previous experience in high mountain activities." 
        }
      },
      {
        question: { es: "¿Qué equipo está incluido?", en: "What equipment is included?" },
        answer: { 
          es: "Incluimos todo el equipo de alta montaña: arnés, casco, crampones, piolet, cuerdas, mosquetones, carpas, sleeping bags y aislantes. También el transporte de equipaje en mula.", 
          en: "We include all high mountain equipment: harness, helmet, crampons, ice axe, ropes, carabiners, tents, sleeping bags and sleeping pads. We also include luggage transportation by mule." 
        }
      },
      {
        question: { es: "¿Cuál es el precio del tour?", en: "What is the tour price?" },
        answer: { 
          es: "El precio varía según el número de personas: 1 pax: 2,780,000 COP, 2 pax: 1,660,000 COP c/u, 3 pax: 1,200,000 COP c/u, 4-8 pax: 1,000,000 COP c/u.", 
          en: "Price varies by group size: 1 pax: $660 USD, 2 pax: $395 USD each, 3 pax: $285 USD each, 4-8 pax: $235 USD each." 
        }
      }
    ],
    isActive: true
  };

  try {
    console.log('Sending request to create corrected tour...');
    const response = await axios.post(BASE_URL, tourData, {
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Secret-Key': ADMIN_KEY
      }
    });

    console.log('✅ Corrected tour created successfully!');
    console.log('Tour ID:', response.data.tourId);
    console.log('Response:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('❌ Error creating tour:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      console.error('Request:', error.request);
    } else {
      console.error('Error:', error.message);
    }
    throw error;
  }
}

// Run the function
createCorrectedNevadoDelTolimaTour()
  .then(() => console.log('\n🎉 Corrected production tour creation process completed!'))
  .catch(error => console.error('\n💥 Error during tour creation:', error));