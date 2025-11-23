const axios = require('axios');
const fs = require('fs');
const path = require('path');

//Read admin key from file
const SECRET_FILE_PATH = path.resolve(__dirname, '../secret_value.txt');
const ADMIN_KEY = fs.readFileSync(SECRET_FILE_PATH, 'utf-8').trim();

const API_URL = 'https://api-wgfhwjbpva-uc.a.run.app'; // Production

const headers = {
    'X-Admin-Secret-Key': ADMIN_KEY,
    'Content-Type': 'application/json'
};

const completeTours = [
    {
        name: {
            en: 'Nevado del Ruiz Summit Expedition',
            es: 'Expedición a la Cumbre del Nevado del Ruiz'
        },
        description: {
            en: 'Embark on an unforgettable journey to the summit of Nevado del Ruiz, one of Colombia\'s most iconic active volcanoes. This multi-day expedition takes you through diverse ecosystems, from lush cloud forests to barren volcanic landscapes, culminating in a challenging ascent to the 5,321-meter summit. Experience breathtaking panoramic views, walk on ancient glaciers, and witness the raw power of nature in this bucket-list adventure.',
            es: 'Embárcate en un viaje inolvidable a la cumbre del Nevado del Ruiz, uno de los volcanes activos más icónicos de Colombia. Esta expedición de varios días te lleva a través de diversos ecosistemas, desde bosques nublados exuberantes hasta paisajes volcánicos áridos, culminando en un ascenso desafiante a la cumbre de 5.321 metros. Experimenta vistas panorámicas impresionantes, camina sobre glaciares antiguos y presencia el poder crudo de la naturaleza en esta aventura de ensueño.'
        },
        shortDescription: {
            en: 'Summit Colombia\'s iconic active volcano with glacier trekking and stunning views',
            es: 'Conquista el icónico volcán activo de Colombia con trekking glaciar y vistas impresionantes'
        },
        type: 'multi-day',
        totalDays: 2,
        difficulty: 'Hard',
        isActive: true,
        version: 1,
        temperature: 5,
        distance: 15,
        location: { en: 'Los Nevados National Park, Colombia', es: 'Parque Nacional Los Nevados, Colombia' },
        altitude: { en: '5,321m', es: '5.321m' },
        faqs: [
            {
                question: { en: 'What fitness level is required?', es: '¿Qué nivel de condición física se requiere?' },
                answer: {
                    en: 'You should be in excellent physical condition with prior high-altitude trekking experience. We recommend training for at least 2-3 months before the expedition.',
                    es: 'Debes estar en excelente condición física con experiencia previa en trekking de alta altitud. Recomendamos entrenar durante al menos 2-3 meses antes de la expedición.'
                }
            },
            {
                question: { en: 'Is altitude sickness a concern?', es: '¿Es el mal de altura una preocupación?' },
                answer: {
                    en: 'Yes, due to the high altitude. We include acclimatization time and our guides are trained to recognize and manage altitude sickness. We recommend consulting your doctor before the trip.',
                    es: 'Sí, debido a la gran altitud. Incluimos tiempo de aclimatación y nuestros guías están capacitados para reconocer y manejar el mal de altura. Recomendamos consultar a tu médico antes del viaje.'
                }
            },
            {
                question: { en: 'What is the best season to climb?', es: '¿Cuál es la mejor temporada para escalar?' },
                answer: {
                    en: 'December to March and July to September offer the best weather conditions with clearer skies and less precipitation.',
                    es: 'Diciembre a marzo y julio a septiembre ofrecen las mejores condiciones climáticas con cielos más despejados y menos precipitación.'
                }
            }
        ],
        recommendations: [
            { en: 'Bring warm layers (temperatures can drop to -10°C)', es: 'Trae capas abrigadas (las temperaturas pueden bajar a -10°C)' },
            { en: 'Acclimatize in Bogotá (2,600m) for 2-3 days before', es: 'Aclimátate en Bogotá (2.600m) durante 2-3 días antes' },
            { en: 'Hydrate constantly and avoid alcohol 48h before', es: 'Hidrátate constantemente y evita el alcohol 48h antes' },
            { en: 'Pack sunscreen (SPF 50+) and UV-protective sunglasses', es: 'Empaca protector solar (FPS 50+) y gafas de sol con protección UV' },
            { en: 'Bring your own trekking poles and gaiters', es: 'Trae tus propios bastones de trekking y polainas' }
        ],
        inclusions: [
            { en: '2 days guided expedition with certified mountain guide', es: '2 días de expedición guiada con guía de montaña certificado' },
            { en: 'Round-trip transportation from Manizales', es: 'Transporte ida y vuelta desde Manizales' },
            { en: 'Mountain refuge accommodation (1 night)', es: 'Alojamiento en refugio de montaña (1 noche)' },
            { en: 'All meals during the expedition', es: 'Todas las comidas durante la expedición' },
            { en: 'Technical climbing equipment (crampons, ice axe, harness)', es: 'Equipo técnico de escalada (crampones, piolet, arnés)' },
            { en: 'National park entrance fees', es: 'Tarifas de entrada al parque nacional' },
            { en: 'Travel insurance', es: 'Seguro de viaje' },
            { en: 'Emergency oxygen supply', es: 'Suministro de oxígeno de emergencia' }
        ],
        exclusions: [
            { en: 'Personal clothing and gear', es: 'Ropa y equipo personal' },
            { en: 'Alcoholic beverages', es: 'Bebidas alcohólicas' },
            { en: 'Tips for guides (optional but appreciated)', es: 'Propinas para guías (opcional pero apreciado)' },
            { en: 'Extra snacks and energy bars', es: 'Snacks extra y barras energéticas' },
            { en: 'Accommodation before/after the expedition', es: 'Alojamiento antes/después de la expedición' }
        ],
        itinerary: {
            days: [
                {
                    dayNumber: 1,
                    title: { en: 'Base Camp to Refuge', es: 'Campamento Base al Refugio' },
                    activities: [
                        {
                            time: '06:00',
                            description: {
                                en: 'Depart from Manizales and drive to Los Nevados National Park entrance',
                                es: 'Salida desde Manizales y traslado a la entrada del Parque Nacional Los Nevados'
                            }
                        },
                        {
                            time: '09:00',
                            description: {
                                en: 'Begin trek from base camp (4,000m) through volcanic landscape',
                                es: 'Inicio del trekking desde el campamento base (4.000m) a través del paisaje volcánico'
                            }
                        },
                        {
                            time: '13:00',
                            description: {
                                en: 'Lunch break at scenic viewpoint overlooking valley',
                                es: 'Descanso para almorzar en mirador panorámico con vista al valle'
                            }
                        },
                        {
                            time: '16:00',
                            description: {
                                en: 'Arrive at mountain refuge (4,800m), settle in and rest',
                                es: 'Llegada al refugio de montaña (4.800m), instalación y descanso'
                            }
                        },
                        {
                            time: '18:00',
                            description: {
                                en: 'Dinner and expedition briefing for summit day',
                                es: 'Cena y charla informativa para el día de cumbre'
                            }
                        },
                        {
                            time: '20:00',
                            description: {
                                en: 'Early bedtime to rest before summit attempt',
                                es: 'Descanso temprano para prepararse para el intento de cumbre'
                            }
                        }
                    ]
                },
                {
                    dayNumber: 2,
                    title: { en: 'Summit Day and Return', es: 'Día de Cumbre y Regreso' },
                    activities: [
                        {
                            time: '02:00',
                            description: {
                                en: 'Wake up, light breakfast, and equipment check',
                                es: 'Despertar, desayuno ligero y revisión de equipo'
                            }
                        },
                        {
                            time: '03:00',
                            description: {
                                en: 'Begin summit push with headlamps through glacier terrain',
                                es: 'Inicio del ascenso a cumbre con linternas frontales a través del terreno glaciar'
                            }
                        },
                        {
                            time: '07:00',
                            description: {
                                en: 'Reach the summit (5,321m) and celebrate with panoramic sunrise views',
                                es: 'Alcanzar la cumbre (5.321m) y celebrar con vistas panorámicas del amanecer'
                            }
                        },
                        {
                            time: '08:00',
                            description: {
                                en: 'Begin descent back to refuge for breakfast',
                                es: 'Inicio del descenso de regreso al refugio para desayunar'
                            }
                        },
                        {
                            time: '11:00',
                            description: {
                                en: 'Pack up and continue descent to base camp',
                                es: 'Empacar y continuar descenso al campamento base'
                            }
                        },
                        {
                            time: '15:00',
                            description: {
                                en: 'Return to Manizales, end of expedition',
                                es: 'Regreso a Manizales, fin de la expedición'
                            }
                        }
                    ]
                }
            ]
        },
        pricingTiers: [
            { minPax: 1, maxPax: 1, priceCOP: 1200000, priceUSD: 300 },
            { minPax: 2, maxPax: 2, priceCOP: 900000, priceUSD: 225 },
            { minPax: 3, maxPax: 3, priceCOP: 750000, priceUSD: 188 },
            { minPax: 4, maxPax: 8, priceCOP: 650000, priceUSD: 163 }
        ]
    },
    {
        name: {
            en: 'Santa Isabel Glacier Trek',
            es: 'Trekking Glaciar Santa Isabel'
        },
        description: {
            en: 'Discover the pristine beauty of Santa Isabel\'s ancient glaciers on this immersive 3-day trekking adventure. Located in the heart of Los Nevados National Park, this expedition offers a perfect blend of challenge and natural wonder. Trek through páramo ecosystems, camp under star-filled skies, and witness the dramatic ice formations that have shaped this landscape for millennia.',
            es: 'Descubre la belleza prístina de los antiguos glaciares del Santa Isabel en esta inmersiva aventura de trekking de 3 días. Ubicada en el corazón del Parque Nacional Los Nevados, esta expedición ofrece una mezcla perfecta de desafío y maravilla natural. Camina a través de ecosistemas de páramo, acampa bajo cielos estrellados y presencia las dramáticas formaciones de hielo que han moldeado este paisaje durante milenios.'
        },
        shortDescription: {
            en: 'Explore ancient glaciers and páramo ecosystems on a 3-day camping adventure',
            es: 'Explora glaciares antiguos y ecosistemas de páramo en una aventura de camping de 3 días'
        },
        type: 'multi-day',
        totalDays: 3,
        difficulty: 'Medium',
        isActive: true,
        version: 1,
        temperature: 10,
        distance: 25,
        location: { en: 'Los Nevados National Park, Colombia', es: 'Parque Nacional Los Nevados, Colombia' },
        altitude: { en: '4,965m', es: '4.965m' },
        faqs: [
            {
                question: { en: 'Is camping experience required?', es: '¿Se requiere experiencia de camping?' },
                answer: {
                    en: 'Basic camping experience is helpful but not required. Our guides will assist with tent setup and provide all necessary equipment.',
                    es: 'La experiencia básica de camping es útil pero no requerida. Nuestros guías ayudarán con la instalación de carpas y proporcionarán todo el equipo necesario.'
                }
            },
            {
                question: { en: 'What about wildlife?', es: '¿Qué hay de la vida silvestre?' },
                answer: {
                    en: 'You may encounter Andean condors, spectacled bears (rare), white-tailed deer, and unique páramo flora. All wildlife viewing is from a respectful distance.',
                    es: 'Puedes encontrar cóndores andinos, osos de anteojos (raro), venados de cola blanca y flora única del páramo. Toda observación de vida silvestre es desde una distancia respetuosa.'
                }
            }
        ],
        recommendations: [
            { en: 'Bring a -10°C rated sleeping bag', es: 'Trae un saco de dormir con clasificación de -10°C' },
            { en: 'Pack waterproof layers for unpredictable weather', es: 'Empaca capas impermeables para clima impredecible' },
            { en: 'Carry reusable water bottles (we purify water on trail)', es: 'Lleva botellas de agua reutilizables (purificamos agua en el camino)' },
            { en: 'Bring camera with extra batteries (cold drains them fast)', es: 'Trae cámara con baterías extra (el frío las agota rápido)' }
        ],
        inclusions: [
            { en: '3 days guided trek with expert naturalist guide', es: '3 días de trekking guiado con guía naturalista experto' },
            { en: 'Round-trip transportation from Pereira', es: 'Transporte ida y vuelta desde Pereira' },
            { en: 'Camping equipment (tent, sleeping mat, stove)', es: 'Equipo de camping (carpa, colchoneta, estufa)' },
            { en: 'All meals (breakfast, lunch, dinner, snacks)', es: 'Todas las comidas (desayuno, almuerzo, cena, snacks)' },
            { en: 'Water purification tablets', es: 'Tabletas de purificación de agua' },
            { en: 'National park fees', es: 'Tarifas del parque nacional' },
            { en: 'First aid kit', es: 'Botiquín de primeros auxilios' }
        ],
        exclusions: [
            { en: 'Personal sleeping bag', es: 'Saco de dormir personal' },
            { en: 'Personal trekking gear', es: 'Equipo personal de trekking' },
            { en: 'Tips for guides', es: 'Propinas para guías' },
            { en: 'Extra snacks', es: 'Snacks extra' }
        ],
        itinerary: {
            days: [
                {
                    dayNumber: 1,
                    title: { en: 'Journey to Base Camp', es: 'Viaje al Campamento Base' },
                    activities: [
                        {
                            time: '07:00',
                            description: {
                                en: 'Pickup from Pereira, drive to trailhead',
                                es: 'Recogida desde Pereira, traslado al inicio del sendero'
                            }
                        },
                        {
                            time: '10:00',
                            description: {
                                en: 'Begin trek through cloud forest and páramo',
                                es: 'Inicio del trekking a través del bosque nublado y páramo'
                            }
                        },
                        {
                            time: '14:00',
                            description: {
                                en: 'Arrive at base camp, set up tents',
                                es: 'Llegada al campamento base, instalación de carpas'
                            }
                        },
                        {
                            time: '18:00',
                            description: {
                                en: 'Dinner around campfire, stargazing session',
                                es: 'Cena alrededor de la fogata, sesión de observación de estrellas'
                            }
                        }
                    ]
                },
                {
                    dayNumber: 2,
                    title: { en: 'Glacier Exploration Day', es: 'Día de Exploración Glaciar' },
                    activities: [
                        {
                            time: '06:00',
                            description: {
                                en: 'Sunrise breakfast, pack day gear',
                                es: 'Desayuno al amanecer, empacar equipo del día'
                            }
                        },
                        {
                            time: '07:00',
                            description: {
                                en: 'Trek to glacier viewing point',
                                es: 'Caminata al mirador del glaciar'
                            }
                        },
                        {
                            time: '12:00',
                            description: {
                                en: 'Lunch with glacier panorama views',
                                es: 'Almuerzo con vistas panorámicas del glaciar'
                            }
                        },
                        {
                            time: '15:00',
                            description: {
                                en: 'Return to camp via alternative route',
                                es: 'Regreso al campamento por ruta alternativa'
                            }
                        },
                        {
                            time: '19:00',
                            description: {
                                en: 'Traditional Colombian dinner, storytelling',
                                es: 'Cena tradicional colombiana, narración de historias'
                            }
                        }
                    ]
                },
                {
                    dayNumber: 3,
                    title: { en: 'Return Journey', es: 'Viaje de Regreso' },
                    activities: [
                        {
                            time: '07:00',
                            description: {
                                en: 'Break camp, final breakfast',
                                es: 'Desmontar campamento, desayuno final'
                            }
                        },
                        {
                            time: '09:00',
                            description: {
                                en: 'Begin descent through diverse ecosystems',
                                es: 'Inicio del descenso a través de diversos ecosistemas'
                            }
                        },
                        {
                            time: '13:00',
                            description: {
                                en: 'Reach trailhead, return to Pereira',
                                es: 'Llegada al inicio del sendero, regreso a Pereira'
                            }
                        }
                    ]
                }
            ]
        },
        pricingTiers: [
            { minPax: 1, maxPax: 1, priceCOP: 1500000, priceUSD: 375 },
            { minPax: 2, maxPax: 2, priceCOP: 1100000, priceUSD: 275 },
            { minPax: 3, maxPax: 3, priceCOP: 950000, priceUSD: 238 },
            { minPax: 4, maxPax: 8, priceCOP: 850000, priceUSD: 213 }
        ]
    },
    {
        name: {
            en: 'Tolima Volcano Complete Circuit',
            es: 'Circuito Completo del Volcán Tolima'
        },
        description: {
            en: 'Experience the ultimate Andean adventure on this challenging 4-day circuit around Nevado del Tolima. This comprehensive expedition combines technical mountaineering, wilderness camping, and cultural immersion as you traverse one of Colombia\'s most spectacular volcanic landscapes. From thermal hot springs to glacial peaks, this journey offers the complete mountain experience for seasoned trekkers.',
            es: 'Experimenta la aventura andina definitiva en este desafiante circuito de 4 días alrededor del Nevado del Tolima. Esta expedición integral combina montañismo técnico, camping en naturaleza salvaje e inmersión cultural mientras atraviesas uno de los paisajes volcánicos más espectaculares de Colombia. Desde aguas termales hasta picos glaciares, este viaje ofrece la experiencia de montaña completa para trekkers experimentados.'
        },
        shortDescription: {
            en: 'Complete 4-day circuit combining technical mountaineering and wilderness camping',
            es: 'Circuito completo de 4 días combinando montañismo técnico y camping salvaje'
        },
        type: 'multi-day',
        totalDays: 4,
        difficulty: 'Hard',
        isActive: true,
        version: 1,
        temperature: 8,
        distance: 35,
        location: { en: 'Nevado del Tolima, Colombia', es: 'Nevado del Tolima, Colombia' },
        altitude: { en: '5,215m', es: '5.215m' },
        faqs: [
            {
                question: { en: 'Do I need mountaineering experience?', es: '¿Necesito experiencia en montañismo?' },
                answer: {
                    en: 'Yes, previous high-altitude trekking and basic mountaineering skills are required. We provide technical training before the summit attempt.',
                    es: 'Sí, se requiere trekking previo de alta altitud y habilidades básicas de montañismo. Proporcionamos entrenamiento técnico antes del intento de cumbre.'
                }
            },
            {
                question: { en: 'What makes this different from other tours?', es: '¿Qué hace esto diferente de otros tours?' },
                answer: {
                    en: 'The complete circuit offers 360° views of the volcano and includes visits to thermal hot springs. It\'s the most comprehensive Tolima experience available.',
                    es: 'El circuito completo ofrece vistas de 360° del volcán e incluye visitas a aguas termales. Es la experiencia más completa de Tolima disponible.'
                }
            }
        ],
        recommendations: [
            { en: 'Train with 20kg backpack for 3 months before', es: 'Entrena con mochila de 20kg durante 3 meses antes' },
            { en: 'Get altitude pre-acclimatization in Bogotá or Medellín', es: 'Consigue pre-aclimatación de altitud en Bogotá o Medellín' },
            { en: 'Bring extra batteries or solar charger', es: 'Trae baterías extra o cargador solar' },
            { en: 'Pack biodegradable toiletries (Leave No Trace)', es: 'Empaca artículos de tocador biodegradables (No Dejar Rastro)' }
        ],
        inclusions: [
            { en: '4 days expedition with 2 certified guides', es: '4 días de expedición con 2 guías certificados' },
            { en: 'Round-trip from Ibagué including 4x4 transport', es: 'Ida y vuelta desde Ibagué incluyendo transporte 4x4' },
            { en: 'All camping and technical equipment', es: 'Todo el equipo de camping y técnico' },
            { en: 'All meals plus energy snacks', es: 'Todas las comidas más snacks energéticos' },
            { en: 'Satellite communication device', es: 'Dispositivo de comunicación satelital' },
            { en: 'National park permits', es: 'Permisos del parque nacional' },
            { en: 'Thermal hot springs access', es: 'Acceso a aguas termales' },
            { en: 'Emergency evacuation insurance', es: 'Seguro de evacuación de emergencia' }
        ],
        exclusions: [
            { en: 'Personal mountaineering boots', es: 'Botas personales de montañismo' },
            { en: 'Personal climbing harness and helmet', es: 'Arnés y casco personal de escalada' },
            { en: 'Sleeping bag (-15°C minimum)', es: 'Saco de dormir (-15°C mínimo)' },
            { en: 'Tips for guides and porters', es: 'Propinas para guías y porteadores' }
        ],
        itinerary: {
            days: [
                {
                    dayNumber: 1,
                    title: { en: 'Ibagué to High Camp', es: 'Ibagué a Campamento Alto' },
                    activities: [
                        {
                            time: '05:00',
                            description: {
                                en: 'Depart Ibagué, 4x4 transport to trailhead',
                                es: 'Salida de Ibagué, transporte 4x4 al inicio del sendero'
                            }
                        },
                        {
                            time: '08:00',
                            description: {
                                en: 'Begin trek through coffee plantations and cloud forest',
                                es: 'Inicio del trekking a través de plantaciones de café y bosque nublado'
                            }
                        },
                        {
                            time: '12:00',
                            description: {
                                en: 'Lunch stop at scenic waterfall',
                                es: 'Parada para almorzar en cascada panorámica'
                            }
                        },
                        {
                            time: '16:00',
                            description: {
                                en: 'Arrive at high camp (4,200m), set up base',
                                es: 'Llegada al campamento alto (4.200m), instalación de base'
                            }
                        },
                        {
                            time: '18:00',
                            description: {
                                en: 'Equipment check and summit preparation briefing',
                                es: 'Revisión de equipo y charla de preparación para cumbre'
                            }
                        }
                    ]
                },
                {
                    dayNumber: 2,
                    title: { en: 'Summit Attempt', es: 'Intento de Cumbre' },
                    activities: [
                        {
                            time: '01:00',
                            description: {
                                en: 'Alpine start, hot breakfast and gear check',
                                es: 'Salida alpina, desayuno caliente y revisión de equipo'
                            }
                        },
                        {
                            time: '02:00',
                            description: {
                                en: 'Begin summit push under stars',
                                es: 'Inicio del ascenso a cumbre bajo las estrellas'
                            }
                        },
                        {
                            time: '08:00',
                            description: {
                                en: 'Summit Nevado del Tolima (5,215m)!',
                                es: '¡Cumbre del Nevado del Tolima (5.215m)!'
                            }
                        },
                        {
                            time: '09:30',
                            description: {
                                en: 'Descend to high camp',
                                es: 'Descenso al campamento alto'
                            }
                        },
                        {
                            time: '12:00',
                            description: {
                                en: 'Rest and recovery lunch',
                                es: 'Almuerzo de descanso y recuperación'
                            }
                        },
                        {
                            time: '14:00',
                            description: {
                                en: 'Pack up and continue circuit to thermal springs camp',
                                es: 'Empacar y continuar circuito al campamento de aguas termales'
                            }
                        },
                        {
                            time: '18:00',
                            description: {
                                en: 'Relax in natural thermal hot springs',
                                es: 'Relajarse en aguas termales naturales'
                            }
                        }
                    ]
                },
                {
                    dayNumber: 3,
                    title: { en: 'Circuit Traverse', es: 'Travesía del Circuito' },
                    activities: [
                        {
                            time: '07:00',
                            description: {
                                en: 'Breakfast and continue circuit around volcano',
                                es: 'Desayuno y continuar circuito alrededor del volcán'
                            }
                        },
                        {
                            time: '11:00',
                            description: {
                                en: 'Cross high-altitude pass with 360° views',
                                es: 'Cruzar paso de alta altitud con vistas 360°'
                            }
                        },
                        {
                            time: '14:00',
                            description: {
                                en: 'Descend through unique páramo ecosystem',
                                es: 'Descenso a través del ecosistema único de páramo'
                            }
                        },
                        {
                            time: '17:00',
                            description: {
                                en: 'Set up camp at scenic lagoon',
                                es: 'Instalación de campamento en laguna panorámica'
                            }
                        },
                        {
                            time: '19:00',
                            description: {
                                en: 'Celebratory dinner and campfire stories',
                                es: 'Cena de celebración e historias alrededor de la fogata'
                            }
                        }
                    ]
                },
                {
                    dayNumber: 4,
                    title: { en: 'Return to Civilization', es: 'Regreso a la Civilización' },
                    activities: [
                        {
                            time: '07:00',
                            description: {
                                en: 'Final breakfast, break camp',
                                es: 'Desayuno final, desmontar campamento'
                            }
                        },
                        {
                            time: '08:30',
                            description: {
                                en: 'Descend through diverse forest zones',
                                es: 'Descenso a través de diversas zonas de bosque'
                            }
                        },
                        {
                            time: '12:00',
                            description: {
                                en: 'Reach trailhead, 4x4 transport',
                                es: 'Llegada al inicio del sendero, transporte 4x4'
                            }
                        },
                        {
                            time: '15:00',
                            description: {
                                en: 'Traditional Colombian lunch in Ibagué',
                                es: 'Almuerzo tradicional colombiano en Ibagué'
                            }
                        },
                        {
                            time: '17:00',
                            description: {
                                en: 'Drop-off in Ibagué, end of expedition',
                                es: 'Dej ada en Ibagué, fin de la expedición'
                            }
                        }
                    ]
                }
            ]
        },
        pricingTiers: [
            { minPax: 1, maxPax: 1, priceCOP: 2000000, priceUSD: 500 },
            { minPax: 2, maxPax: 2, priceCOP: 1500000, priceUSD: 375 },
            { minPax: 3, maxPax: 3, priceCOP: 1300000, priceUSD: 325 },
            { minPax: 4, maxPax: 8, priceCOP: 1100000, priceUSD: 275 }
        ]
    }
];

async function createCompleteTours() {
    console.log('🏔️  Creating COMPLETE tours with all fields...\n');

    const results = [];

    for (const tour of completeTours) {
        try {
            console.log(`Creating: ${tour.name.en}...`);
            const response = await axios.post(`${API_URL}/admin/tours`, tour, { headers });
            console.log(`✅ SUCCESS - ID: ${response.data.tourId}`);
            results.push({ success: true, tour: tour.name.en, id: response.data.tourId });
        } catch (error) {
            console.log(`❌ FAILED - ${tour.name.en}`);
            console.log('Error:', error.response?.data || error.message);
            results.push({ success: false, tour: tour.name.en, error: error.response?.data || error.message });
        }
        console.log(''); // Empty line between tours
    }

    console.log('\n📊 SUMMARY:');
    console.log(`✅ Successful: ${results.filter(r => r.success).length}`);
    console.log(`❌ Failed: ${results.filter(r => !r.success).length}`);

    if (results.filter(r => !r.success).length > 0) {
        console.log('\nFailed tours:');
        results.filter(r => !r.success).forEach(r => {
            console.log(`- ${r.tour}: ${JSON.stringify(r.error)}`);
        });
    }

    return results.every(r => r.success);
}

createCompleteTours()
    .then(allSuccess => {
        if (allSuccess) {
            console.log('\n🎉 All tours created successfully!');
            process.exit(0);
        } else {
            console.log('\n⚠️  Some tours failed to create.');
            process.exit(1);
        }
    })
    .catch(error => {
        console.error('💥 Unexpected error:', error);
        process.exit(1);
    });
