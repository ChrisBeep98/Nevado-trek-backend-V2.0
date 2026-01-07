const axios = require('axios');
const fs = require('fs');
const path = require('path');

// --- CONFIGURATION ---
const API_BASE_URL = "http://127.0.0.1:5001/nevadotrektest01/us-central1/api/admin/tours";
const SECRET_FILE_PATH = path.join(__dirname, 'secret_value.txt');

// --- HELPER FUNCTIONS ---

// 1. Read API Key
function getAdminKey() {
    try {
        if (!fs.existsSync(SECRET_FILE_PATH)) {
            throw new Error(`Secret file not found at ${SECRET_FILE_PATH}`);
        }
        return fs.readFileSync(SECRET_FILE_PATH, 'utf8').trim();
    } catch (error) {
        console.error("Error reading secret key:", error.message);
        process.exit(1);
    }
}

// 2. Transform Itinerary
const transformItinerary = (itineraryESP, itineraryENG) => {
    if (!itineraryESP || !Array.isArray(itineraryESP)) return { days: [] };
    
    return {
        days: itineraryESP.map((dayItems, index) => {
            const dayNum = index + 1;
            // User provided arrays of paragraphs strings for each day
            const descES = Array.isArray(dayItems) ? dayItems.join('\n\n') : dayItems;
            
            // Try to get matching EN day. Note user typo 'itinenraryENG' in some objects
            const dayItemsEN = (itineraryENG && itineraryENG[index]);
            const descEN = Array.isArray(dayItemsEN) ? dayItemsEN.join('\n\n') : (dayItemsEN || descES);

            return {
                dayNumber: dayNum,
                title: { es: `Día ${dayNum}`, en: `Day ${dayNum}` },
                description: { es: descES, en: descEN }
            };
        })
    };
};

// 3. Generate FAQs (Invented per user request)
const generateFAQs = (tourName) => {
    return [
        {
            question: { es: "¿Qué nivel de experiencia necesito?", en: "What experience level do I need?" },
            answer: { 
                es: "Recomendamos tener una buena condición física y experiencia previa en caminatas de montaña, aunque varía según la dificultad del tour.", 
                en: "We recommend having good physical condition and previous hiking experience, although it varies depending on the tour difficulty." 
            }
        },
        {
            question: { es: "¿Qué equipo está incluido?", en: "What equipment is included?" },
            answer: { 
                es: "Incluimos equipo técnico especializado si es necesario (casco, arnés, etc.) y equipo de camping. Debes traer tu ropa y calzado personal.", 
                en: "We include specialized technical gear if needed (helmet, harness, etc.) and camping gear. You must bring your personal clothing and footwear." 
            }
        },
        {
            question: { es: "¿La comida es apta para vegetarianos?", en: "Is the food suitable for vegetarians?" },
            answer: { 
                es: "Sí, podemos adaptar el menú a requerimientos dietéticos especiales si nos avisas con anticipación.", 
                en: "Yes, we can adapt the menu to special dietary requirements if you notify us in advance." 
            }
        },
        {
            question: { es: "¿Cuál es la mejor época para ir?", en: "When is the best time to go?" },
            answer: { 
                es: "Se puede visitar todo el año, pero los meses secos (Diciembre-Marzo, Julio-Agosto) suelen ofrecer mejores vistas.", 
                en: "It can be visited year-round, but dry months (December-March, July-August) usually offer better views." 
            }
        }
    ];
};

// 4. Generate Exclusions (Invented if missing)
const generateExclusions = () => {
    return {
        es: [
            "Vuelos nacionales e internacionales.",
            "Gastos personales y propinas.",
            "Equipo personal (ropa, botas, mochila pequeña).",
            "Gastos médicos no cubiertos por la póliza."
        ],
        en: [
            "Domestic and international flights.",
            "Personal expenses and tips.",
            "Personal gear (clothing, boots, daypack).",
            "Medical expenses not covered by insurance."
        ]
    };
};

// 5. Clean Price
const cleanPrice = (priceStr) => {
    if (typeof priceStr === 'number') return priceStr;
    if (!priceStr) return 0;
    // Remove '$', '.', ',', ' COP', ' USD' and trim
    // Example: "$ 1.480.000 COP" -> 1480000
    // Example: "$ 478,22 USD" -> 478.22 (replace comma with dot for decimals)
    let cleaned = priceStr.toString().replace(/\$/g, '').replace(/COP/g, '').replace(/USD/g, '').trim();
    // For COP, usually dots are thousands separators, remove them.
    // For USD, commas might be decimals or thousands. 
    // Heuristic: If it has 'USD', replace comma with dot. If 'COP', remove dots.
    if (priceStr.includes('USD')) {
        cleaned = cleaned.replace(/\./g, '').replace(/,/g, '.');
    } else {
        cleaned = cleaned.replace(/\./g, '').replace(/,/g, '');
    }
    return parseFloat(cleaned) || 0;
};

// --- DATA MAPPING ---

// Helper to collect all images from img1High...img10High
const collectImages = (sourceObj) => {
    const images = [];
    const maxImages = 10;
    for (let i = 1; i <= maxImages; i++) {
        const keyHigh = `img${i}High`;
        if (sourceObj[keyHigh]) images.push(sourceObj[keyHigh]);
    }
    // If no High images found (unlikely based on user data), try normal
    if (images.length === 0) {
        for (let i = 1; i <= maxImages; i++) {
            const key = `img${i}`;
            if (sourceObj[key]) images.push(sourceObj[key]);
        }
    }
    return images;
};

// Helper to map 1, 2-4, 5-8 pricing to 1, 2, 3, 4-8 tiers
const mapPricingTiers = (obj) => {
    const p1 = cleanPrice(obj.price1PaxESP);
    const p1USD = cleanPrice(obj.price1PaxUSD);
    
    const p2to4 = cleanPrice(obj.price2to4);
    const p2to4USD = cleanPrice(obj.price2to4USD);
    
    const p5to8 = cleanPrice(obj.price5to8);
    const p5to8USD = cleanPrice(obj.price5to8USD);

    return [
        { minPax: 1, maxPax: 1, priceCOP: p1, priceUSD: p1USD },
        { minPax: 2, maxPax: 2, priceCOP: p2to4, priceUSD: p2to4USD }, // 2 pax uses 2to4 price
        { minPax: 3, maxPax: 3, priceCOP: p2to4, priceUSD: p2to4USD }, // 3 pax uses 2to4 price
        { minPax: 4, maxPax: 8, priceCOP: p5to8, priceUSD: p5to8USD }  // 4-8 users 5to8 price
    ];
};

// Definition of the raw user data objects
const rawUserTours = [
    {
        matcher: /tolima/i,
        obj: {
            nameESP: "Nevado del Tolima",
            nameENG: "Nevado del tolima",
            priceCOP: "$ 1.480.000 COP",
            priceUSD: "$ 478,22 USD",
            timeShortESP: "4 Días",
            timeShortENG: "4 Days",
            timeESP: "4 Días | 3 Noches",
            timeENG: "4 Days | 3 Nights",
            img1High: "https://res.cloudinary.com/nevado-trek/image/upload/c_limit,h_800,w_1200/v1657649635/Nevado/nevado11_bntklr.jpg",
            img2High: "https://res.cloudinary.com/nevado-trek/image/upload/c_limit,h_800,q_100,w_1200/v1657649637/Nevado/nevado16_vmg8tl.jpg",
            img3High: "https://res.cloudinary.com/nevado-trek/image/upload/c_scale,h_800,w_1200/v1659032505/Paramo/paramo001_qkakel.jpg",
            img4High: "https://res.cloudinary.com/nevado-trek/image/upload/c_limit,h_800,w_600/v1657649637/Nevado/nevado14_ab2ath.jpg",
            img5High: "https://res.cloudinary.com/nevado-trek/image/upload/c_scale,h_900,w_1200/v1657649637/Nevado/nevado17_pv6ycc.jpg",
            img6High: "https://res.cloudinary.com/nevado-trek/image/upload/c_scale,w_1200/v1657649641/Nevado/nevado05_anbrcb.jpg",
            img7High: "https://res.cloudinary.com/nevado-trek/image/upload/c_scale,w_1200/v1657649642/Nevado/nevado07_xxunum.jpg",
            img8High: "https://res.cloudinary.com/nevado-trek/image/upload/c_scale,w_1200/v1657649642/Nevado/nevado08_vlacxa.jpg",
            img9High: "https://res.cloudinary.com/nevado-trek/image/upload/c_scale,q_90,w_1200/v1657649642/Nevado/nevado09_nlejbk.jpg",
            img10High: "https://res.cloudinary.com/nevado-trek/image/upload/c_scale,w_1200/v1657649642/Nevado/nevado10_iq38dt.jpg",
            shortDescriptionESP: "Una de las montañas más altas del parque nacional natural los nevados, encontrarás gran variedad de ecosistemas tales como bosque de niebla, páramo, paramillo y glaciar.",
            shortDescriptionENG: "It is one of the highest mountains within  Los Nevados National Natural Park where you can find a great variety of ecosystems such as: Fog Forests, Paramos, Super Paramos and Glaciers.",
            temperatureESP: "Muy Frío",
            difficulty: "5/5",
            distance: "60 km",
            altitude: "5.220 mt",
            price1PaxESP: "1.480.000 COP", price1PaxUSD: "478,22 USD",
            price2to4: "620.000 COP", price2to4USD: "550 USD",
            price5to8: "420.000 COP", price5to8USD: "450 USD",
            experienceENG: `We will guide you on this absolutely epic, awesome, challenging and 
    rewarding  4 day trek. We will experience the cloud and alto andino forests, the Paramo,
    amazin vegetation, valleys, rivers, outstanding landscapes and much more.`,
            experienceESP: `    En esta expedición de  4 días alcanzaremos la cima del Nevado del Tolima que se encuentra a unos 5.220 mt sobre el nivel del mar.
        Es sin duda, una de las mejores montañas para escalar en colombia. Su forma de cono volcánico, hace de ella una montaña que genera un escenario único a la par que majestuoso.
        
        Nos veremos inmersos en el Páramo ecosistema más importante de la región debido a sus nacimientos de agua. Conoceremos diferentes y majestuosas especies de 
        flora y fauna en el trayecto, además, podremos visualizar un paisaje panorámico sin igual. `,
            includedENG: ["All risk insurance.","High mountain guide.", "Complete feed, from first day breakfast to last day lunch.",
        "Hot drinks and snacks shelters and camps." , "Accomodation 2 night on shelters (bunks).", "Accomodation 1 night on camp (2 people per tent).", 
        "Camping full equipment. " , "Glacier climbing certified equipment.", "Kitchenware (dishes, spoons, glasses).", "Backpack transportation on horses.",
        "Transportation from Salento to Cocora and the way back."],
            includedESP: ["Guías de alta montaña.", "Seguro contra todo riesgo.", "Alimentación completa, desde el desayuno del día 1, hasta el almuerzo del día 4."
        ,"Bebidas calientes y snacks en campamentos y refugios.","Alojamiento 2 noches en refugio de montaña (camarotes)."
        ,"Alojamiento 1 noche en campamento  de alta montaña (2 personas por carpa).", "Equipo de camping, aislantes y sleeping."
        , "Menaje (plato, cuchara, vaso).", "Equipo completo de glaciar, casco, arnés, crampones, piolet, cuerda y mosquetones."
        , "Transporte de equipaje en mula."],
            // Note: Use raw arrays here, transform later
            itineraryESP: [[`Iniciamos el primer día con el ecuentro del guía a las 6 a.m en tu hostal o 
            lugar definido, tomaremos el desayuno. Después, abordaremos el transporte hacia el valle de cocora 
            (2400 mt). `, `Seguiremos con una caminata de 18km donde nos veremos inmersos en el 
            Bosque de Niebla hasta llegar al Bosque Alto Andino, habitat de una amplia cantidad de 
            especies vegetales, así como muchas especies de mamímeros, insectos, anfibios, aves y reptiles. `, `
            Llegaremos hasta la Finca la playa, refugio donde podremos descansar y alimentarnos rodeados por un
            ecosistema 100% natural.`, `Finalmente, podremos realizar la comida final del día y descansar en 
            los camarotes del refugio`],
            [`Iniciamos el segundo día al rededor de las 8:00 a.m. Tomaremos el desayuno y 
            comenzaremos una caminata de 7km. `, 
            `Pasaremos por el páramo, ecosistema más importante de colombia, y, por la Laguna del Encanto , 
            lugar conocido por su belleza natural, si eres lo suficientemente osado, podrás nadar. `,
            `Llegaremos hasta el campamento base (4500 mt), donde podremos alimentarnos y disfrutar de el 
            hermoso paisaje con una vista 360° sin igual.`,
            ` Finalmente, en nuestro campamento base, les daremos la inducción de los equipos para progresión
            en glaciar y tomaremos la última comida del día. `],
            [`Iniciamos el tercer día a las 3:00 a.m con el intento de cumbre, utilizaremos 
            un equipo certificado para el recorrido de 3km.`,
            `Llegaremos hasta la cima del glaciar (5220 mt) de altura. `,
            `Estando en una de las montañas más imponentes de colombia, tendremos una vista panorámica del
            Nevado de santa Isabel, el Volcan Machín y el Volcan Nevado del Ruíz `,
            `Finalmente, empacaremos el campamento y empezaremos nuestro descenso de vuelta hacia a la
            Finca la Playa donde podremos alimentarnos y terminar el tercer día. ` ],
            [`Iniciamos el cuarto día al rededor de las 8:00 a.m para descender.`,
            `Tendremos nuevamente la oportunidad de pasar por el Páramo, el Bosque Alto Andino , y el Bosque
            de Niebla.  `,
            `Llegaremos de nuevo a Valle de Cocora donde podremos disfrutar de una bebida y alimentarnos.`,
            `Finalmente, abordaremos el transporte de regreso a salento, llevandonos la experiencia única
            de haber estado en uno de los lugares mas hermosos a la par que importantes de colombia. ` ]],
            itinenraryENG: [[`First day starts by meeting at  6 a.m  at your hostel or main salentos plaza, 
    we will have breakfast an then
    we will take our transfer to  valle de cocora (2400 mt above sea level).`, `We will start with a 18km walk where 
    we will be insersed into the  cloud and alto andino forests where different 
    species of mammals, insects, reptils, birds and aphibians  live.`, `   We will arrive to  Finca la Playa ,
     shelter where we can feed and rest sorrounded by this amazin ecosystem.`, `Finally, we will take last day meat and rest 
     on the shelters bunks`],[` Second day starts around 8:00 a.m. we will have breakfast and start a 7 km walk. `,
    ` We will be inmersed into the Paramo,  one of the most important ecosystems in water production in colombia. 
    Also, we will see the frailejones .`, `We will visit Otuns Lake, wich is well known because of its natural charm. `,
    `Finally, we will reach our base camp (4.500 mt above sea level) where we can feed and prepare for next day 
    glacier climbing progression.`],
    [`Third day starts around 3:00 a.m. We will try to star the glacier climbing progression.`,
    `We will reach the top of the nevado del tolima (5.220 mt above sea level). `,
    `Been above one of the most beautiful mountains in colombia, we will have the best panoramic view of other volcanos
     and nevados.`,
    `Finally we will start the way back and reach Finca la Playa, shelter where we can feed and rest. `],
    [`Last day starts at 7:00 a.m , and, after having breakfast, we will take the way back through the Páramo.`,
    `Once again, we will pass through the alto andino and cloud forests.`,
    `We will reach the valle de cocora where we can enjoy a nice drink and feed. `,
    `Finally, we will take the trensfer back to salento, accompanied by nice emotions and feelings that one of the 
    prettiest places in colombia leaves on you.`]],
            recommendationsESP: ["Buena hidratación antes, durante y después.", "Utilizar anteojos oscuros con alto factor UV.",
    "Llevar agua", "usar protector solar de alta gama.", "Lleve ropa y calzado adecuados para la humedad.",
    "Mantenga su propio ritmo, respire y descanse si lo requiere.", " No ingerir bebidas alcoholicas durante el viaje."
    ],
            recommendationsENG: ["Hydrate before, during and after the tour.", "Wear sunglasses.",
    "Bring water.", "Use sunscreen.", "Wear humidity suitable clohting and shoes.",
    "Keep tour own walking rythm, breath and rest when you need", "Do not consume alcoholic drinks during the trip"]
        }
    },
    {
        matcher: /paramillo/i,
        obj: {
            nameESP: "Paramillo del Quindío",
            nameENG: "Paramillo del Quindío",
            img1High: "https://res.cloudinary.com/nevado-trek/image/upload/c_fill,h_900,q_86,w_1200/v1657816320/Paramillo/paramillo09_hdu22r.jpg",
            img2High: "https://res.cloudinary.com/nevado-trek/image/upload/c_fill,h_900,w_1200/v1657816316/Paramillo/paramillo05_xobrk2.jpg",
            img3High: "https://res.cloudinary.com/nevado-trek/image/upload/c_fill,h_900,q_86,w_1200,y_0/v1657816507/Paramo/paramo002_azlpkb.jpg",
            img4High: "https://res.cloudinary.com/nevado-trek/image/upload/c_scale,w_1200/v1659032505/Paramo/paramo001_qkakel.jpg",
            img5High: "https://res.cloudinary.com/nevado-trek/image/upload/c_scale,w_1200/v1657816316/Paramillo/paramillo04_wlztch.jpg",
            img6High: "https://res.cloudinary.com/nevado-trek/image/upload/c_fill,h_900,w_1200/v1657816315/Paramillo/paramillo03_bccvbs.jpg",
            img7High: "https://res.cloudinary.com/nevado-trek/image/upload/c_fill,h_900,w_1200/v1657816313/Paramillo/paramillo11_aunffy.jpg",
            img8High: "https://res.cloudinary.com/nevado-trek/image/upload/c_fill,h_900,w_1200/v1657816320/Paramillo/paramillo07_ijbkci.jpg",
            img9High: "https://res.cloudinary.com/nevado-trek/image/upload/c_fill,h_900,w_1200/v1657816316/Paramillo/paramillo01_engtnk.jpg",
            img10High: "https://res.cloudinary.com/nevado-trek/image/upload/c_scale,h_900,q_86,w_1200/v1657816318/Paramillo/paramillo06_ikqiez.jpg",
            shortDescriptionESP: "Ven y conquista esta hermosa montaña a 4.750 mt sobre el nivel del mar.",
            shortDescriptionENG: "Come and conquer this beautiful mountain at 4.750 mt above sea level, get to know the magic of its unique colors",
            temperatureESP: "Muy Frío", difficulty: "4/5", distance: "40 km", altitude: "4.750 mt",
            price1PaxESP: "880.000 COP", price1PaxUSD: "233,35 USD",
            price2to4: "620.000 COP", price2to4USD: "550 USD",
            price5to8: "420.000 COP", price5to8USD: "450 USD",
            experienceENG: `Come with us to enjoy the best panoramic view. This mountain was a snow covered mountain that lost its snow, thats why is now called paramillo.
    This mountain has an elevation up to 4.750 mt above sea level , we will be sorrounded by important Biomes, outstanding landscapes and unique biodiversity.`,
            experienceESP: `   Ven con nosotros a disfutar de tal vez la mejor vista panorámica. Esta montaña, fué en el pasado un nevado que perdió su hielo, de ahí su estatus de paramillo. Con una altura de
     4.750 mt , nos encontraremos rodeados de ecosistemas importantes, paisajes alucinantes y biodiversidad única. `,
            includedENG: ["All risk insurance.","High mountain guide.", "Complete feed, from first day breakfast to last day lunch.",
        "Hot drinks and snacks on shelters and camps ." , "Accomodation 2 night on shelters (bunks).",  
          "Kitchenware (dishes, spoons, glasses).",
        "Transportation from Salento to Cocora and the way back."],
            includedESP: ["Guías de alta montaña.", "Seguro contra todo riesgo.", "Alimentación completa, desde el desayuno del día 1, hasta el almuerzo del día 3."
        ,"Bebidas calientes y snacks en campament refugios.","Alojamiento 2 noches en refugio de montaña (camarotes)."
        ,  "Menaje (plato, cuchara, vaso).", "transporte privado desde salento a cocora y visceversa"],
            itineraryESP: [[`Iniciamos el primer día con el ecuentro del guía a las 6 a.m en tu hostal o 
            lugar definido, tomaremos el desayuno. Después, abordaremos el transporte hacia el valle de cocora 
            (2400 mt). `, `Seguiremos con una caminata de 18km donde nos veremos inmersos en el 
            Bosque de Niebla hasta llegar al Bosque Alto Andino, habitat de una amplia cantidad de 
            especies vegetales, así como muchas especies de mamímeros, insectos, anfibios, aves y reptiles. `, `
            Llegaremos hasta la Finca la Playa (3.700mt), refugio donde podremos descansar y alimentarnos rodeados por un ecosistema 100% natural.`,
             `Finalmente, podremos realizar la comida final del día y descansar en los camarotes del refugio `],
            [`Iniciamos el segundo día al rededor de las 06:30 a.m. Tomaremos el desayuno y comenzaremos una caminata por los bosques. `, 
            `Nos encontraremos inmersos en el páramo , ecosistema más importante en la producción de agua de colombia y hogar de los frailejones .`,
            `Legaremos hasta el paramillo, a unos 4.750 mt de altura, encontraremos el paisaje panorámico más alucinante de la región.`,
            ` Finalmente, llegaremos al refugio la Argentina, donde podremos alimentarnos y prepararnos para el último día`],
            [`Iniciamos el tercer día a las 7:00 a.m y nos preparararemos para iniciar el descenso.`,
            `Tendremos nuevamente la oportunidad de vernos inmersos en el bosque alto andino y bosque de niebla. `,
            `Continuaremos el descenso hasta llegar al valle de cocora , allí podremos disfrutar de una bebida y alimentarnos `,
            `Finalmente, abordaremos el transporte de regreso a salento , llevandonos la experiencia única de haber estado en uno de los lugares mas hermosos e importantes de colombia. ` ]],
            itinenraryENG: [[`First day starts by meeting at 6 a.m at your hostel or main salentos plaza, we will have breakfast an then we will take our transfer to valle de cocora (2400 mt above sea level).`,
     `We will start with a 18km walk where 
    we will be insersed into the  cloud and alto andino forests where different 
    species of mammals, insects, reptils, birds and aphibians  live.`, `   We will arrive to Finca la Playa (3.700mt above sea level), shelter where we can feed and rest sorrounded by this amazin ecosystem.`,
     `Finally, we will take last day meat and rest on the shelters bunks`],[` Second day starts around 6:30 a.m, we will have breakfast and start a walk through the páramo. `,
    ` We will be inmersed into one of the most important ecosystems in water production in colombia. Also, we will see the frailejones.`, `We will reach the paramillo, up to 4.750 mt above sea level , here, you will find the best panoramic view. `,
    `Finally, we will get to Finca la Argentina, shelter where we can feed and get ready to last day.`],
    [`Last day starts at 7:00 a.m ,and after having breakfast, we will prepare for descending`,
    `Once again, we will pass through the alto andino and cloud forests. `,
    `We will reach the valle de cocora where we can enjoy a nice drink and feed.`,
    `Finally, we will take the transfer back to salento, accompanied by nice emotions and feelings that one of the prettiest places in colombia leaves on you. `]],
            recommendationsESP: ["Buena hidratación antes, durante y después.", "Utilizar anteojos oscuros con alto factor UV.",
    "Llevar agua", "usar protector solar de alta gama.", "Lleve ropa y calzado adecuados para la humedad.",
    "Mantenga su propio ritmo, respire y descanse si lo requiere.", " No ingerir bebidas alcoholicas durante el viaje."
    ],
            recommendationsENG: ["Hydrate before, during and after the tour.", "Wear sunglasses.",
    "Bring water.", "Use sunscreen.", "Wear humidity suitable clohting and shoes.",
    "Keep tour own walking rythm, breath and rest when you need", "Do not consume alcoholic drinks during the trip"]
        }
    },
    {
        matcher: /paramo/i,
        obj: {
            nameESP: "Páramo", nameENG: "Páramo",
            img1High: "https://res.cloudinary.com/nevado-trek/image/upload/v1659207688/Paramo/WhatsApp-Image-2021-06-25-at-9.19.06-PM_aptx9r.jpg",
            img2High: "https://res.cloudinary.com/nevado-trek/image/upload/c_scale,w_1200/v1659032505/Paramo/paramo001_qkakel.jpg",
            img3High: "https://res.cloudinary.com/nevado-trek/image/upload/c_scale,w_1200/v1657816502/Paramo/paramo05_uox5f6.jpg",
            img4High: "https://res.cloudinary.com/nevado-trek/image/upload/c_scale,w_1200/v1657816502/Paramo/paramo06_arh0gd.jpg",
            img5High: "https://res.cloudinary.com/nevado-trek/image/upload/c_fill,h_900,q_91,w_1200/v1657816507/Paramo/paramo002_azlpkb.jpg",
            img6High: "https://res.cloudinary.com/nevado-trek/image/upload/c_scale,w_1200/v1659033555/Paramo/20191225_100744_w46pku.jpg",
            img7High: "https://res.cloudinary.com/nevado-trek/image/upload/c_scale,w_1200/v1657816503/Paramo/paramo01_iyhzca.jpg",
            img8High: "https://res.cloudinary.com/nevado-trek/image/upload/c_fill,h_900,w_1200/v1657816506/Paramo/paramo02_r0llc1.jpg",
            img9High: "https://res.cloudinary.com/nevado-trek/image/upload/c_scale,h_900,w_1200/v1657816507/Paramo/paramo004_rrjyau.jpg",
            img10High: "https://res.cloudinary.com/nevado-trek/image/upload/c_fill,h_900,q_91,w_1200/v1657816507/Paramo/paramo002_azlpkb.jpg",
            shortDescriptionESP: "Ven y conoce el Páramo, ecosistema más importante en la producción de agua en colombia.",
            shortDescriptionENG: "Come and visit el Páramo, most important ecosystem in colombia",
            temperatureESP: "Muy Frío", difficulty: "4/5", distance: "30 km", altitude: "4.000 mt",
            price1PaxESP: "550.000 COP", price1PaxUSD: "145,84 USD",
            price2to4: "620.000 COP", price2to4USD: "550 USD",
            price5to8: "420.000 COP", price5to8USD: "450 USD",
            experienceENG: `This amazin trek will take us deep into the paramo, most important ecosystem in water production in colombia and home of different species of mammals, insects, reptils, birds and aphibians.`,
            experienceESP: `   El Parque Nacional Natural Los Nevados de altísimas y majestuosas cumbres andinas, está conformado por los picos Nevado Quindío, Santa Isabel, El Cisne, El Ruíz y Tolima , todos por encima de los 4.800 mt sobre el nivel del mar.
    El lugar de visita, se ubica en un sector estratégico del parque, cuyo complejo paisajístico, integra los ecosistemas de bosque, páramo y super páramo , pasando por las morrenas que asemejan paisajes lunares. Además, ofrece una vista panorámica sin igual. `,
            includedENG: ["All risk insurance.","High mountain guide.", "Complete feed, from first day breakfast to last day lunch.",
        "Hot drinks and snacks on shelters and camps ." , "Accomodation 1 night on shelter (bunks).",  
          "Kitchenware (dishes, spoons, glasses).", 
        "Transportation from Salento to Cocora and the way back."],
            includedESP: ["Guías de alta montaña.", "Seguro contra todo riesgo.", "Alimentación completa, desde el desayuno del día 1, hasta el almuerzo del día 2."
        ,"Bebidas calientes y snacks en campament refugios.","Alojamiento 1 noches en refugio de montaña (camarotes)."
        ,  "Menaje (plato, cuchara, vaso)."
        , "Transporte privado de salento a cocora y visceversa."],
            itineraryESP: [[`Iniciamos el primer día con el ecuentro del guía a las 6 a.m en tu hostal o 
            lugar definido, tomaremos el desayuno. Después, abordaremos el transporte hacia el valle de cocora 
            (2400 mt). `, `Seguiremos con una caminata de 18km donde nos veremos inmersos en el 
            Bosque de Niebla hasta llegar al Bosque Alto Andino, habitat de una amplia cantidad de 
            especies vegetales, así como muchas especies de mamímeros, insectos, anfibios, aves y reptiles. `, `
            Llegaremos hasta la Finca la Argentina (3.400mt), refugio donde podremos descansar y alimentarnos rodeados por un ecosistema 100% natural.`,
             `Finalmente, podremos realizar la comida final del día y descansar en los camarotes del refugio `],
            [`Iniciamos el segundo día al rededor de las 06:30 a.m. Tomaremos el desayuno y comenzaremos una caminata por el paramo. `, 
            `Nos encontraremos inmersos en el páramo , ecosistema más importante en la producción de agua de colombia y hogar de los frailejones .`,
            `Seguiremos con el descenso, tendremos la oportunidad de pasar nuevamente por el bosque alto andino y el bosque de niebla hasta llegar a cocora.`,
            ` Finalmente, abordaremos el transporte de regreso a salento, llevandonos la experiencia única de haber estado en uno de los lugares mas hermosos a la par que importantes de colombia`]],
            itinenraryENG: [[`First day starts by meeting at 6 a.m at your hostel or main salentos plaza, we will have breakfast an then we will take our transfer to valle de cocora (2400 mt above sea level).`,
     `We will start with a 18km walk where 
    we will be insersed into the  cloud and alto andino forests where different 
    species of mammals, insects, reptils, birds and aphibians  live.`, `   We will arrive to Finca la Argentina (3.400mt above sea level), shelter where we can feed and rest sorrounded by this amazin ecosystem.`,
     `Finally, we will take last day meat and rest on the shelters bunks`],[` Second day starts around 6:30 a.m, we will have breakfast and start a walk through the páramo. `,
    ` We will be inmersed into one of the most important ecosystems in water production in colombia home of the frailejones.`, `We will take the way back through the Alto Andino and Cloud forests until reaching Valle de Cocora. `,
    `Finally, we will take the trensfer back to salento, accompanied by nice emotions and feelings that one of the prettiest places in colombia leaves on you.`]],
            recommendationsESP: ["Buena hidratación antes, durante y después.", "Utilizar anteojos oscuros con alto factor UV.",
    "Llevar agua", "usar protector solar de alta gama.", "Lleve ropa y calzado adecuados para la humedad.",
    "Mantenga su propio ritmo, respire y descanse si lo requiere.", " No ingerir bebidas alcoholicas durante el viaje."
    ],
            recommendationsENG: ["Hydrate before, during and after the tour.", "Wear sunglasses.",
    "Bring water.", "Use sunscreen.", "Wear humidity suitable clohting and shoes.",
    "Keep tour own walking rythm, breath and rest when you need", "Do not consume alcoholic drinks during the trip"]
        }
    },
    {
        matcher: /tapir|danta/i,
        obj: {
            nameESP: "Ruta Tapir", nameENG: "Ruta Tapir",
            img1High: "https://res.cloudinary.com/nevado-trek/image/upload/c_scale,q_100,w_1200/v1657816756/Danta/tapir08_sorrju.jpg",
            img2High: "https://res.cloudinary.com/nevado-trek/image/upload/c_fill,h_900,w_1200/v1657816760/Danta/tapir03_auhiet.jpg",
            img3High: "https://res.cloudinary.com/nevado-trek/image/upload/c_fill,h_900,w_1200/v1657816760/Danta/tapir06_nfpo97.jpg",
            img4High: "https://res.cloudinary.com/nevado-trek/image/upload/c_scale,w_1200/v1657816759/Danta/tapir09_yxr6pz.jpg",
            img5High: "https://res.cloudinary.com/nevado-trek/image/upload/c_lpad,h_900,w_1200/v1657816758/Danta/tapir02_j9ax5f.jpg",
            img6High: "https://res.cloudinary.com/nevado-trek/image/upload/c_lpad,h_900,w_1200,x_0/v1657816758/Danta/tapir01_b3gotr.jpg",
            img7High: "https://res.cloudinary.com/nevado-trek/image/upload/c_scale,q_95,w_1200/v1657816756/Danta/tapir07_eru2i2.jpg",
            img8High: "https://res.cloudinary.com/nevado-trek/image/upload/c_lpad,h_900,w_1200/v1657816765/Danta/20191216_144316_llrkhc.jpg",
            img9High: "https://res.cloudinary.com/nevado-trek/image/upload/c_fill,h_900,w_1200/v1657816761/Danta/tapir05_ftl8tb.jpg",
            img10High: "https://res.cloudinary.com/nevado-trek/image/upload/c_scale,w_1200/v1657816756/Danta/tapir10_z1pkqy.jpg",
            shortDescriptionESP: "Ven y conoce la Danta de Páramo, una de las 4 especies de Tapir existentes en América.",
            shortDescriptionENG: "Come and discover the Danta de Paramo, one of the 4 existing Tapirs species around America.",
            temperatureESP: "Frío", difficulty: "4/5", distance: "45 km", altitude: "4.300 mt",
            price1PaxESP: "990.000 COP", price1PaxUSD: "260 USD",
            price2to4: "620.000 COP", price2to4USD: "550 USD",
            price5to8: "420.000 COP", price5to8USD: "450 USD",
            experienceENG: `Come and experience Tapir's ecosystem , we will get inmersed into forests with unique biodiversity and oustanding landscapes.`,
            experienceESP: `   Ven con nosotros a conocer el ecosistema de la Danta de Páramo o Tapir, nos veremos inmersos en bosques con una biodiversidad única y podremos visualizar vistas panorámicas alucinantes.
    Al final del recorrido, nos llevaremos la sensación de haber conocido una especie tan majestuosa, gentil y exótica como lo es el Tapir`,
            includedENG: ["All risk insurance.","High mountain guide.", "Complete feed, from first day breakfast to last day lunch.",
        "Hot drinks and snacks on shelters and camps ." , "Accomodation 2 nights on shelter (bunks).",  
          "Kitchenware (dishes, spoons, glasses).", 
        "Transportation from Salento to Cocora and the way back."],
            includedESP: ["Guías de alta montaña.", "Seguro contra todo riesgo.", "Alimentación completa, desde el desayuno del día 1, hasta el almuerzo del día 2."
        ,"Bebidas calientes y snacks en campament refugios.","Alojamiento 2 noches en refugio de montaña (camarotes)."
        ,  "Menaje (plato, cuchara, vaso)."
        , "Transporte de salento a cocora y visceversa."],
            itineraryESP: [[`Iniciamos el primer día con el ecuentro del guía a las 6 a.m en tu hostal o 
            lugar definido, tomaremos el desayuno. Después, abordaremos el transporte hacia el valle de cocora 
            (2400 mt). `, `Seguiremos con una caminata de 18km donde nos veremos inmersos en el 
            Bosque de Niebla hasta llegar al Bosque Alto Andino, habitat de una amplia cantidad de 
            especies vegetales, así como muchas especies de mamímeros, insectos, anfibios, aves y reptiles. `, `
            Llegaremos hasta la Finca la Argentina (3.400mt), refugio donde podremos descansar y alimentarnos rodeados por un ecosistema 100% natural.`,
             `Finalmente, podremos realizar la comida final del día y descansar en los camarotes del refugio. `],
            [`Iniciamos el segundo día al rededor de las 7:00 a.m. Tomaremos el desayuno y comenzaremos una caminata hacia la zona de aproximación del Paramillo. `, 
            `Nos encontraremos inmersos en el hogar de la Danta de Páramo, una de las cuatro especies de Tapir existentes en america.`,
            `Este ecosistema maravilloso, será el lugar perfecto para tomar el almuerzo.`,
            ` Finalmente, llegaremos a finca El Jordan , donde podremos tomar la última comida del día y descansar`],
            [`Iniciamos el tercer día a las 7:00 a.m y nos preparararemos para iniciar el descenso. `, 
            `Tendremos nuevamente la oportunidad de vernos inmersos en el Páramo, Bosque Alto Andino y Bosque de Niebla .`,
            `Continuaremos el descenso hasta llegar al Valle de Cocora , allí podremos disfrutar de una bebida y alimentarnos.`,
            ` Finalmente, abordaremos el transporte de regreso a salento, llevandonos la experiencia única de haber estado en uno de los lugares mas hermosos a la par que importantes de colombia, conociendo una especie tan majestuosa, gentil y exótica como lo es el Tapir.`]],
            itinenraryENG: [[`First day starts by meeting at 6 a.m at your hostel or main salentos plaza, we will have breakfast an then we will take our transfer to valle de cocora (2400 mt above sea level).`,
     `We will start with a 18km walk where 
    we will be insersed into the  cloud and alto andino forests where different 
    species of mammals, insects, reptils, birds and aphibians  live.`, `   We will arrive to Finca la Argentina (3.400mt above sea level), shelter where we can feed and rest sorrounded by this amazin ecosystem.`,
     `Finally, we will take last day meat and rest on the shelters bunks`],[` Second day starts around 7:00 a.m. we will have breakfast and prepare for a walk on the Paramillos proximities. `,
    ` We will get inmersed into the Tapirs ecosystem.`, `It will be the perfect time to have lunch sorrounded by outstanding views. `,
    `Finally, we will reach Finca El Jordan where we can feed and rest.`],
    [`Last day starts at 7:00 a.m , and, after having breakfast, we will take the way back through the Páramo.`, `Once again, we will pass through the alto andino and cloud forests.`,
    `We will reach the valle de cocora where we can enjoy a nice drink and feed.`, `Finally, we will take the trensfer back to salento, accompanied by nice emotions and feelings that one of the prettiest places in colombia leaves on you.`]],
            recommendationsESP: ["Buena hidratación antes, durante y después.", "Utilizar anteojos oscuros con alto factor UV.",
    "Llevar agua", "usar protector solar de alta gama.", "Lleve ropa y calzado adecuados para la humedad.",
    "Mantenga su propio ritmo, respire y descanse si lo requiere.", " No ingerir bebidas alcoholicas durante el viaje."
    ],
            recommendationsENG: ["Hydrate before, during and after the tour.", "Wear sunglasses.",
    "Bring water.", "Use sunscreen.", "Wear humidity suitable clohting and shoes.",
    "Keep tour own walking rythm, breath and rest when you need", "Do not consume alcoholic drinks during the trip"]
        }
    },
    {
        matcher: /cocora/i,
        obj: {
            nameESP: "Valle de Cocora", nameENG: "Valle de Cocora",
            img1High: "https://res.cloudinary.com/nevado-trek/image/upload/c_fill,h_900,w_1200/v1659211299/Cocora/188621298_2932615863642648_2412688555026943222_n_hbx3m6.jpg",
            img2High: "https://res.cloudinary.com/nevado-trek/image/upload/c_scale,w_1200/v1659210770/Cocora/cocora05_wyutzi.jpg",
            img3High: "https://res.cloudinary.com/nevado-trek/image/upload/c_fill,h_900,w_1200/v1659211299/Cocora/125118665_2723064054621390_336035995996606345_n_gonwca.jpg",
            img4High: "https://res.cloudinary.com/nevado-trek/image/upload/c_scale,w_1200/v1659210770/Cocora/cocora02_luouz6.jpg",
            img5High: "https://res.cloudinary.com/nevado-trek/image/upload/c_scale,w_1200/v1659210769/Cocora/cocora01_trnl4o.jpg",
            img6High: "https://res.cloudinary.com/nevado-trek/image/upload/c_scale,w_1200/v1659210771/Cocora/cocora06_svcqqf.jpg",
            img7High: "https://res.cloudinary.com/nevado-trek/image/upload/c_lpad,h_800,w_1200/v1659211299/Cocora/e648342235402786053db7082b1dcc66_xbiutq.jpg",
            img8High: "https://res.cloudinary.com/nevado-trek/image/upload/c_lpad,h_800,w_1200/v1659210772/Cocora/cocora10_laua0s.jpg",
            img9High: "https://res.cloudinary.com/nevado-trek/image/upload/c_scale,w_1200/v1659210770/Cocora/cocora08_mtmgjn.jpg",
            img10High: "https://res.cloudinary.com/nevado-trek/image/upload/c_fill,h_900,w_1200/v1659210770/Cocora/cocora03_dnb2th.jpg",
            shortDescriptionESP: "Ven y conoce el hogar del árbol nacional e inspiraciones de Disney (Encanto).",
            shortDescriptionENG: "A visit to the national symbol of Colombia is by far an attraction at the top of any travellers list.",
            temperatureESP: "Ambiente", difficulty: "3/5", distance: "13 km", altitude: "2.400 mt",
            price1PaxESP: "300.000 COP", price1PaxUSD: "79.55 USD",
            price2to4: "620.000 COP", price2to4USD: "550 USD",
            price5to8: "420.000 COP", price5to8USD: "450 USD",
            experienceENG: `Cocora is known for giving life to the world’s highest palm trees, the so called “palmas de cera” (wax palms), considered Colombia’s national 
    tree. They can reach a height of up to 60 meters and they only grow between 1.500 and 3.000 metres above sea level. In
     the Cocora Valley you will discover the entire chromatic scale of green among its mountains and stunning views that won’t let you down.`,
            experienceESP: `   Ven con nosotros a conocer el principal atractivo turístico de salento, tendremos la oportunidad de experimentar de primera mano, el bosque de palmas de cera, los hermosos bosques de niebla y la biodiversidad de este entorno sin igual`,
            includedENG: ["All risk insurance.","High mountain guide.", 
        "Transportation from Salento to Cocora and the way back."],
            includedESP: ["Guías de alta montaña.", "Seguro contra todo riesgo.",
        "Transporte de salento a cocora y visceversa."],
            itineraryESP: [[`Iniciamos con el encuentro del guía a las 7:00 am en la plaza principal. Despues, abordaremos los jeeps hacia el valle de cocora `, 
        `Seguiremos por las atracciones, tendrás la opción de tiempo libre para tomarte excelentes fotos en la estatuas, manos, alas, escaleras, construcciones y mucho más. `,
         ` Nos veremos inmersos en el bosque de palmas de cera hasta llegar a los miradores con vistas 360.`,
             `Finalmente, podremos realizar la comida final del día y descansar en los camarotes del refugio. `]],
            itinenraryENG: [[`It all starts by meeting at 7:00 am at salento's main plaza , then, we will take the transportation to the valle de cocora.`,
     `At the beggining of the valley, you will have time to take some nice pictures of Statues, big hands, wings and more.`, `   We will be surrounded by the palm tree forest until we reach the amazing 360° degree viewpoint.`,
     `Finalmente, recorreremos el trayecto final, acompañados del sentimiento y emociones plenas que nos deja uno de los paisajes más alucinantes de colombia`]],
            recommendationsESP: ["Buena hidratación antes, durante y después.", "Utilizar anteojos oscuros con alto factor UV.",
    "Llevar agua", "usar protector solar de alta gama.", "Lleve ropa y calzado adecuados para la humedad.",
    "Mantenga su propio ritmo, respire y descanse si lo requiere.", " No ingerir bebidas alcoholicas durante el viaje."
    ],
            recommendationsENG: ["Hydrate before, during and after the tour.", "Wear sunglasses.",
    "Bring water.", "Use sunscreen.", "Wear humidity suitable clohting and shoes.",
    "Keep tour own walking rythm, breath and rest when you need", "Do not consume alcoholic drinks during the trip"]
        }
    },
    {
        matcher: /carbonera/i,
        obj: {
            nameESP: "La Carbonera", nameENG: "La Carbonera",
            img1High: "https://res.cloudinary.com/nevado-trek/image/upload/c_fill,h_800,w_1200/v1659293663/Carbonera/carbonera06_rkmo5k.jpg",
            img2High: "https://res.cloudinary.com/nevado-trek/image/upload/c_fill,q_95,w_1200/v1659293661/Carbonera/carbonera01_sywyf1.jpg",
            img3High: "https://res.cloudinary.com/nevado-trek/image/upload/c_fill,h_800,w_1200/v1659293664/Carbonera/carbonera10_zjk2ga.jpg",
            img4High: "https://res.cloudinary.com/nevado-trek/image/upload/c_scale,w_1200/v1659293661/Carbonera/carbonera09_xwtwfn.jpg",
            img5High: "https://res.cloudinary.com/nevado-trek/image/upload/c_fill,h_800,w_1200/v1659293662/Carbonera/carbonera08_ntlyez.jpg",
            img6High: "https://res.cloudinary.com/nevado-trek/image/upload/c_lpad,h_800,w_1200/v1659293663/Carbonera/carbonera04_cmg9ct.jpg",
            img7High: "https://res.cloudinary.com/nevado-trek/image/upload/c_scale,w_1200/v1659293661/Carbonera/carbonera03_wxtzpf.jpg",
            img8High: "https://res.cloudinary.com/nevado-trek/image/upload/c_lpad,h_800,w_1200/v1659293662/Carbonera/carbonera11_pxi4me.jpg",
            img9High: "https://res.cloudinary.com/nevado-trek/image/upload/c_fill,w_1200/v1659293661/Carbonera/carbonera02_fdhalz.jpg",
            img10High: "https://res.cloudinary.com/nevado-trek/image/upload/c_lpad,h_800,w_1200/v1659293663/Carbonera/carbonera05_rw3jou.jpg",
            shortDescriptionESP: "Visita el lugar con más palmas de cera en el mundo y las mejores presevadas.",
            shortDescriptionENG: "A visit to the highest Palm tree concentration in the world.",
            temperatureESP: "Cold", difficulty: "3/5", distance: "15 km", altitude: "3.280 mt",
            price1PaxESP: "310.000 COP", price1PaxUSD: "82,20 USD",
            price2to4: "620.000 COP", price2to4USD: "550 USD",
            price5to8: "420.000 COP", price5to8USD: "450 USD",
            experienceENG: `600 times more In this tour you will visit the highest concentration of wax palms that Colombia has and the best preserved ones.
    This sanctuary has over 600 times more palm trees than Valle de Cocora. And, we will also enjoy an amazing panoramic view.`,
            experienceESP: `   En esta aventura, conoceremos el bosque de palmas en La Carbonera . En este santuario natural, se estima que puede haber 600 veces más palmas que en el valle de cocora.
    Además de los bosques, su posición geográfica, nos permitirá disfrutar de un hermoso paisaje que te sorprenderá.`,
            includedENG: ["All risk insurance.","High mountain guide.","Colombian housemade lunch at Finca el Rocío","Snacks", 
        "Transportation from Salento to Cocora and the way back."],
            includedESP: ["Guías de alta montaña.", "Seguro contra todo riesgo.","Almuerzo casero en Finca el Rocío", "Snacks",
        "Transporte de salento a cocora y visceversa."],
            itineraryESP: [[`Iniciamos con el encuentro del guía a las 8:00 am en la plaza principal. Despues, abordaremos el transporte hacia el santuario de palmas. `, 
        `Nos veremos inmersos en el bosque de palmas , esto será un recorrido de 1 hora aproximadamente. `,
         ` Abordaremos nuevamente nustro transporte e iremos a otra finca llamada El Rocío donde haremos otra caminata de unos 14 km . En este lugar, podremos visualizar un paisaje sin igual y aver majestuosas que lo sobrevuelan.`,
             `Finalmente, recorreremos el trayecto final, acompañados del sentimiento y emociones plenas que nos deja este hermoso Santuario de palmas. `]],
            itinenraryENG: [[`This adventure starts by meeting at 8:00 am at the main Salento´s plaza, then, we will take the transfer to the palm tree sanctuary.`,
     `We will get inmersed into the palm tree forest for 1 hour. There are more than 600.000 palm trees there.`, `   We will take our transfer to finca El Rocío where we can have lunch and start a 14 km walk . In this place, we will see an amazin landscape and birds flying over.`,
     `Finally, we will take the transfer back to salento, accompanied by nice emotions and feelings that this palm tree sanctuary leaves on you`]],
            recommendationsESP: ["Buena hidratación antes, durante y después.", "Utilizar anteojos oscuros con alto factor UV.",
    "Llevar agua", "usar protector solar de alta gama.", "Lleve ropa y calzado adecuados para la humedad.",
    "Mantenga su propio ritmo, respire y descanse si lo requiere.", " No ingerir bebidas alcoholicas durante el viaje."
    ],
            recommendationsENG: ["Hydrate before, during and after the tour.", "Wear sunglasses.",
    "Bring water.", "Use sunscreen.", "Wear humidity suitable clohting and shoes.",
    "Keep tour own walking rythm, breath and rest when you need", "Do not consume alcoholic drinks during the trip"]
        }
    }
];


// --- MAIN EXECUTION ---

const main = async () => {
    const adminKey = getAdminKey();
    
    console.log("Fetching existing tours...");
    
    try {
        const response = await axios.get(API_BASE_URL, {
            headers: { 'X-Admin-Secret-Key': adminKey }
        });
        
        const existingTours = response.data.tours || [];
        console.log(`Found ${existingTours.length} existing tours.`);

        for (const rawTour of rawUserTours) {
            const match = existingTours.find(t => rawTour.matcher.test(t.name.en));
            
            if (match) {
                console.log(`Updating Tour: ${match.name.en} -> ${rawTour.obj.nameENG}`);
                
                const obj = rawTour.obj;
                const images = collectImages(obj);
                const itinerary = transformItinerary(obj.itineraryESP, obj.itinenraryENG); // Use user's typo prop name
                const pricingTiers = mapPricingTiers(obj);
                
                // Construct payload
                const payload = {
                    name: { es: obj.nameESP, en: obj.nameENG },
                    subtitle: { 
                        es: obj.shortDescriptionESP.split('.')[0], // Use first sentence as subtitle or full shortDesc? User said "cambia todo la info", so let's use shortDesc as shortDescription and maybe derive a subtitle
                        en: obj.shortDescriptionENG.split('.')[0]
                    },
                    description: { es: obj.experienceESP.trim(), en: obj.experienceENG.trim() },
                    shortDescription: { es: obj.shortDescriptionESP, en: obj.shortDescriptionENG },
                    // Set type based on itinerary length
                    type: itinerary.days.length > 1 ? "multi-day" : "single-day",
                    difficulty: "moderate", // Default to moderate, or parse '4/5'
                    totalDays: itinerary.days.length,
                    duration: { days: itinerary.days.length, nights: Math.max(0, itinerary.days.length - 1) },
                    maxPax: 8,
                    minPax: 1,
                    pricingTiers: pricingTiers,
                    altitude: { es: obj.altitude, en: obj.altitude }, // It's a string in user data "5.220 mt"
                    temperature: 10, // Default safely if "Muy Frío" is not a number. The DB wants a number.
                    distance: typeof obj.distance === 'string' ? parseFloat(obj.distance) : obj.distance,
                    location: { es: "Salento", en: "Salento" }, // Default if not inferable
                    images: images,
                    inclusions: { es: obj.includedESP || [], en: obj.includedENG || [] },
                    exclusions: generateExclusions(),
                    itinerary: itinerary,
                    faqs: generateFAQs(obj.nameESP),
                    recommendations: { es: obj.recommendationsESP || [], en: obj.recommendationsENG || [] }
                };

                // Parsing temperature ("Muy Frío" -> approx number)
                if (obj.temperatureESP.toLowerCase().includes("frío") || obj.temperatureESP.toLowerCase().includes("cold")) {
                    payload.temperature = 5;
                } else if (obj.temperatureESP.toLowerCase().includes("ambiente")) {
                    payload.temperature = 18;
                }

                 // Refine location based on known data
                 if (rawTour.matcher.source.includes('tolima')) payload.location = { es: "Parque los Nevados", en: "Los Nevados Park" };
                 if (rawTour.matcher.source.includes('paramillo')) payload.location = { es: "Quindío", en: "Quindio" };
                 if (rawTour.matcher.source.includes('paramo')) payload.location = { es: "Salento", en: "Salento" };
                 if (rawTour.matcher.source.includes('tapir')) payload.location = { es: "Andes Centrales", en: "Central Andes" };
                 if (rawTour.matcher.source.includes('cocora')) payload.location = { es: "Valle de Cocora", en: "Cocora Valley" };
                 if (rawTour.matcher.source.includes('carbonera')) payload.location = { es: "La Carbonera", en: "La Carbonera" };

                // console.log("Payload:", JSON.stringify(payload, null, 2));

                try {
                    await axios.put(`${API_BASE_URL}/${match.id}`, payload, {
                        headers: { 
                            'Content-Type': 'application/json',
                            'X-Admin-Secret-Key': adminKey 
                        }
                    });
                    console.log(`✅ Success: ${match.name.en} updated.`);
                } catch (putError) {
                    console.error(`❌ Failed to update ${match.name.en}:`, putError.response?.data || putError.message);
                }

            }
        }
        
    } catch (error) {
        console.error("Script failed:", error.message);
        if (error.config) console.error("URL:", error.config.url);
    }
};

main();
