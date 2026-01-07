const axios = require('axios');

const API_URL = 'https://api-wgfhwjbpva-uc.a.run.app/admin/tours';
const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

const ID_MAPPING = {
    tourNevado: "Au3wVFDw6Y2YlEtSlLoS",
    tourParamillo: "ONitksK15sinq78pRZYf",
    tourParamo: "CoOdCUSmd5veX1zRN0ut",
    tourTapir: "GqnHKJt5fQ4MpapSeq0r",
    tourCocora: "PXs66XnvyVtcw9Frg5ai",
    tourCarbonera: "WMqIKugakaBN0eVxOyFe"
};

// Generic content for filling gaps
const GENERIC_EXCLUSIONS = [
    { es: "Vuelos nacionales e internacionales", en: "National and international flights" },
    { es: "Equipo personal (ropa, botas)", en: "Personal equipment (clothes, boots)" },
    { es: "Gastos no especificados", en: "Unspecified expenses" },
    { es: "Propinas", en: "Tips" }
];

const GENERIC_FAQS = [
    {
        question: { es: "¿Cuál es la mejor época para ir?", en: "When is the best time to go?" },
        answer: { 
            es: "La mejor época es durante las temporadas secas: Diciembre a Marzo y Julio a Agosto.", 
            en: "The best time is during dry seasons: December to March and July to August." 
        }
    },
    {
        question: { es: "¿Necesito experiencia previa?", en: "Do I need previous experience?" },
        answer: { 
            es: "Es recomendable tener buen estado físico, pero no es obligatoria experiencia técnica previa.", 
            en: "Good physical condition is recommended, but prior technical experience is not mandatory." 
        }
    }
];

// Helper to zip arrays
const mapBilingualList = (listESP, listENG) => {
    if (!listESP || !listENG) return [];
    return listESP.map((item, index) => ({
        es: item,
        en: listENG[index] || item // Fallback to ES if EN missing
    }));
};

// Legacy Data
const legacyTours = {
    tourNevado: {
         includedESP:["Guías de alta montaña.", "Seguro contra todo riesgo.", "Alimentación completa, desde el desayuno del día 1, hasta el almuerzo del día 4."
        ,"Bebidas calientes y snacks en campamentos y refugios.","Alojamiento 2 noches en refugio de montaña (camarotes)."
        ,"Alojamiento 1 noche en campamento de alta montaña (2 personas por carpa).", "Equipo de camping, aislantes y sleeping."
        , "Menaje (plato, cuchara, vaso).", "Equipo completo de glaciar, casco, arnés, crampones, piolet, cuerda y mosquetones."
        , "Transporte de equipaje en mula."],
        includedENG: ["All risk insurance.","High mountain guide.", "Complete feed, from first day breakfast to last day lunch.",
        "Hot drinks and snacks shelters and camps." , "Accomodation 2 night on shelters (bunks).", "Accomodation 1 night on camp (2 people per tent).", 
        "Camping full equipment. " , "Glacier climbing certified equipment.", "Kitchenware (dishes, spoons, glasses).", "Backpack transportation on horses."],
        
        recommendationsESP: ["Buena hidratación antes, durante y después.", "Utilizar anteojos oscuros con alto factor UV.",
        "Llevar agua", "usar protector solar de alta gama.", "Lleve ropa y calzado adecuados para la humedad.",
        "Mantenga su propio ritmo, respire y descanse si lo requiere.", " No ingerir bebidas alcoholicas durante el viaje."],
        recommendationsENG: ["Hydrate before, during and after the tour.", "Wear sunglasses.",
        "Bring water.", "Use sunscreen.", "Wear humidity suitable clohting and shoes.",
        "Keep tour own walking rythm, breath and rest when you need", "Do not consume alcoholic drinks during the trip"],

        itineraryESP:[[`Iniciamos el primer día con el ecuentro del guía a las 6 a.m en tu hostal o lugar definido, tomaremos el desayuno. Después, abordaremos el transporte hacia el valle de cocora (2400 mt). `, `Seguiremos con una caminata de 18km donde nos veremos inmersos en el Bosque de Niebla hasta llegar al Bosque Alto Andino, habitat de una amplia cantidad de especies vegetales, así como muchas especies de mamímeros, insectos, anfibios, aves y reptiles. `, `Llegaremos hasta la Finca la playa, refugio donde podremos descansar y alimentarnos rodeados por un ecosistema 100% natural.`, `Finalmente, podremos realizar la comida final del día y descansar en los camarotes del refugio`],
            [`Iniciamos el segundo día al rededor de las 8:00 a.m. Tomaremos el desayuno y comenzaremos una caminata de 7km. `, `Pasaremos por el páramo, ecosistema más importante de colombia, y, por la Laguna del Encanto , lugar conocido por su belleza natural, si eres lo suficientemente osado, podrás nadar. `, `Llegaremos hasta el campamento base (4500 mt), donde podremos alimentarnos y disfrutar de el hermoso paisaje con una vista 360° sin igual.`, ` Finalmente, en nuestro campamento base, les daremos la inducción de los equipos para progresión en glaciar y tomaremos la última comida del día. `],
            [`Iniciamos el tercer día a las 3:00 a.m con el intento de cumbre, utilizaremos un equipo certificado para el recorrido de 3km.`, `Llegaremos hasta la cima del glaciar (5220 mt) de altura. `, `Estando en una de las montañas más imponentes de colombia, tendremos una vista panorámica del Nevado de santa Isabel, el Volcan Machín y el Volcan Nevado del Ruíz `, `Finalmente, empacaremos el campamento y empezaremos nuestro descenso de vuelta hacia a la Finca la Playa donde podremos alimentarnos y terminar el tercer día. ` ],
            [`Iniciamos el cuarto día al rededor de las 8:00 a.m para descender.`, `Tendremos nuevamente la oportunidad de pasar por el Páramo, el Bosque Alto Andino , y el Bosque de Niebla.  `, `Llegaremos de nuevo a Valle de Cocora donde podremos disfrutar de una bebida y alimentarnos.`, `Finalmente, abordaremos el transporte de regreso a salento, llevandonos la experiencia única de haber estado en uno de los lugares mas hermosos a la par que importantes de colombia. ` ]],
        
        itinenraryENG:[[`First day starts by meeting at  6 a.m  at your hostel or main salentos plaza, we will have breakfast an then we will take our transfer to  valle de cocora (2400 mt above sea level).`, `We will start with a 18km walk where we will be insersed into the  cloud and alto andino forests where different species of mammals, insects, reptils, birds and aphibians  live.`, `   We will arrive to  Finca la Playa , shelter where we can feed and rest sorrounded by this amazin ecosystem.`, `Finally, we will take last day meat and rest on the shelters bunks`],
            [` Second day starts around 8:00 a.m. we will have breakfast and start a 7 km walk. `, ` We will be inmersed into the Paramo,  one of the most important ecosystems in water production in colombia. Also, we will see the frailejones .`, `We will visit Otuns Lake, wich is well known because of its natural charm. `, `Finally, we will reach our base camp (4.500 mt above sea level) where we can feed and prepare for next day glacier climbing progression.`],
            [`Third day starts around 3:00 a.m. We will try to star the glacier climbing progression.`, `We will reach the top of the nevado del tolima (5.220 mt above sea level). `, `Been above one of the most beautiful mountains in colombia, we will have the best panoramic view of other volcanos and nevados.`, `Finally we will start the way back and reach Finca la Playa, shelter where we can feed and rest. `],
            [`Last day starts at 7:00 a.m , and, after having breakfast, we will take the way back through the Páramo.`, `Once again, we will pass through the alto andino and cloud forests.`, `We will reach the valle de cocora where we can enjoy a nice drink and feed. `, `Finally, we will take the trensfer back to salento, accompanied by nice emotions and feelings that one of the prettiest places in colombia leaves on you.`]]
    },
     tourParamillo: {
        includedESP:["Guías de alta montaña.", "Seguro contra todo riesgo.", "Alimentación completa, desde el desayuno del día 1, hasta el almuerzo del día 3.", "Bebidas calientes y snacks en campament refugios.","Alojamiento 2 noches en refugio de montaña (camarotes).",  "Menaje (plato, cuchara, vaso).", "transporte privado desde salento a cocora y visceversa"],
        includedENG: ["All risk insurance.","High mountain guide.", "Complete feed, from first day breakfast to last day lunch.", "Hot drinks and snacks on shelters and camps ." , "Accomodation 2 night on shelters (bunks).", "Kitchenware (dishes, spoons, glasses).", "Transportation from Salento to Cocora and the way back."],
        recommendationsESP: ["Buena hidratación antes, durante y después.", "Utilizar anteojos oscuros con alto factor UV.", "Llevar agua", "usar protector solar de alta gama.", "Lleve ropa y calzado adecuados para la humedad.", "Mantenga su propio ritmo, respire y descanse si lo requiere.", " No ingerir bebidas alcoholicas durante el viaje."],
        recommendationsENG: ["Hydrate before, during and after the tour.", "Wear sunglasses.", "Bring water.", "Use sunscreen.", "Wear humidity suitable clohting and shoes.", "Keep tour own walking rythm, breath and rest when you need", "Do not consume alcoholic drinks during the trip"],
        itineraryESP:[[`Iniciamos el primer día con el ecuentro del guía a las 6 a.m en tu hostal o lugar definido, tomaremos el desayuno. Después, abordaremos el transporte hacia el valle de cocora (2400 mt). `, `Seguiremos con una caminata de 18km donde nos veremos inmersos en el Bosque de Niebla hasta llegar al Bosque Alto Andino, habitat de una amplia cantidad de especies vegetales, así como muchas especies de mamímeros, insectos, anfibios, aves y reptiles. `, `Llegaremos hasta la Finca la Playa (3.700mt), refugio donde podremos descansar y alimentarnos rodeados por un ecosistema 100% natural.`, `Finalmente, podremos realizar la comida final del día y descansar en los camarotes del refugio `],
            [`Iniciamos el segundo día al rededor de las 06:30 a.m. Tomaremos el desayuno y comenzaremos una caminata por los bosques. `, `Nos encontraremos inmersos en el páramo , ecosistema más importante en la producción de agua de colombia y hogar de los frailejones .`, `Legaremos hasta el paramillo, a unos 4.750 mt de altura, encontraremos el paisaje panorámico más alucinante de la región.`, ` Finalmente, llegaremos al refugio la Argentina, donde podremos alimentarnos y prepararnos para el último día`],
            [`Iniciamos el tercer día a las 7:00 a.m y nos preparararemos para iniciar el descenso.`, `Tendremos nuevamente la oportunidad de vernos inmersos en el bosque alto andino y bosque de niebla. `, `Continuaremos el descenso hasta llegar al valle de cocora , allí podremos disfrutar de una bebida y alimentarnos `, `Finalmente, abordaremos el transporte de regreso a salento , llevandonos la experiencia única de haber estado en uno de los lugares mas hermosos e importantes de colombia. ` ]],
        itinenraryENG:[[`First day starts by meeting at 6 a.m at your hostel or main salentos plaza, we will have breakfast an then we will take our transfer to valle de cocora (2400 mt above sea level).`, `We will start with a 18km walk where we will be insersed into the  cloud and alto andino forests where different species of mammals, insects, reptils, birds and aphibians  live.`, `   We will arrive to Finca la Playa (3.700mt above sea level), shelter where we can feed and rest sorrounded by this amazin ecosystem.`, `Finally, we will take last day meat and rest on the shelters bunks`],
            [` Second day starts around 6:30 a.m, we will have breakfast and start a walk through the páramo. `, ` We will be inmersed into one of the most important ecosystems in water production in colombia. Also, we will see the frailejones.`, `We will reach the paramillo, up to 4.750 mt above sea level , here, you will find the best panoramic view. `, `Finally, we will get to Finca la Argentina, shelter where we can feed and get ready to last day.`],
            [`Last day starts at 7:00 a.m ,and after having breakfast, we will prepare for descending`, `Once again, we will pass through the alto andino and cloud forests. `, `We will reach the valle de cocora where we can enjoy a nice drink and feed.`, `Finally, we will take the transfer back to salento, accompanied by nice emotions and feelings that one of the prettiest places in colombia leaves on you. `]]
    },
    tourParamo: {
        includedESP:["Guías de alta montaña.", "Seguro contra todo riesgo.", "Alimentación completa, desde el desayuno del día 1, hasta el almuerzo del día 2.", "Bebidas calientes y snacks en campament refugios.","Alojamiento 1 noches en refugio de montaña (camarotes).",  "Menaje (plato, cuchara, vaso).", "Transporte privado de salento a cocora y visceversa."],
        includedENG: ["All risk insurance.","High mountain guide.", "Complete feed, from first day breakfast to last day lunch.", "Hot drinks and snacks on shelters and camps ." , "Accomodation 1 night on shelter (bunks).",  "Kitchenware (dishes, spoons, glasses).", "Transportation from Salento to Cocora and the way back."],
        recommendationsESP: ["Buena hidratación antes, durante y después.", "Utilizar anteojos oscuros con alto factor UV.", "Llevar agua", "usar protector solar de alta gama.", "Lleve ropa y calzado adecuados para la humedad.", "Mantenga su propio ritmo, respire y descanse si lo requiere.", " No ingerir bebidas alcoholicas durante el viaje."],
        recommendationsENG: ["Hydrate before, during and after the tour.", "Wear sunglasses.", "Bring water.", "Use sunscreen.", "Wear humidity suitable clohting and shoes.", "Keep tour own walking rythm, breath and rest when you need", "Do not consume alcoholic drinks during the trip"],
        itineraryESP:[[`Iniciamos el primer día con el ecuentro del guía a las 6 a.m en tu hostal o lugar definido, tomaremos el desayuno. Después, abordaremos el transporte hacia el valle de cocora (2400 mt). `, `Seguiremos con una caminata de 18km donde nos veremos inmersos en el Bosque de Niebla hasta llegar al Bosque Alto Andino, habitat de una amplia cantidad de especies vegetales, así como muchas especies de mamímeros, insectos, anfibios, aves y reptiles. `, `Llegaremos hasta la Finca la Argentina (3.400mt), refugio donde podremos descansar y alimentarnos rodeados por un ecosistema 100% natural.`, `Finalmente, podremos realizar la comida final del día y descansar en los camarotes del refugio `],
            [`Iniciamos el segundo día al rededor de las 06:30 a.m. Tomaremos el desayuno y comenzaremos una caminata por el paramo. `, `Nos encontraremos inmersos en el páramo , ecosistema más importante en la producción de agua de colombia y hogar de los frailejones .`, `Seguiremos con el descenso, tendremos la oportunidad de pasar nuevamente por el bosque alto andino y el bosque de niebla hasta llegar a cocora.`, ` Finalmente, abordaremos el transporte de regreso a salento, llevandonos la experiencia única de haber estado en uno de los lugares mas hermosos a la par que importantes de colombia`]],
        itinenraryENG:[[`First day starts by meeting at 6 a.m at your hostel or main salentos plaza, we will have breakfast an then we will take our transfer to valle de cocora (2400 mt above sea level).`, `We will start with a 18km walk where we will be insersed into the  cloud and alto andino forests where different species of mammals, insects, reptils, birds and aphibians  live.`, `   We will arrive to Finca la Argentina (3.400mt above sea level), shelter where we can feed and rest sorrounded by this amazin ecosystem.`, `Finally, we will take last day meat and rest on the shelters bunks`],
            [` Second day starts around 6:30 a.m, we will have breakfast and start a walk through the páramo. `, ` We will be inmersed into one of the most important ecosystems in water production in colombia home of the frailejones.`, `We will take the way back through the Alto Andino and Cloud forests until reaching Valle de Cocora. `, `Finally, we will take the trensfer back to salento, accompanied by nice emotions and feelings that one of the prettiest places in colombia leaves on you.`]]
    },
    tourTapir: {
        includedESP:["Guías de alta montaña.", "Seguro contra todo riesgo.", "Alimentación completa, desde el desayuno del día 1, hasta el almuerzo del día 2.", "Bebidas calientes y snacks en campament refugios.","Alojamiento 2 noches en refugio de montaña (camarotes).",  "Menaje (plato, cuchara, vaso).", "Transporte de salento a cocora y visceversa."],
        includedENG: ["All risk insurance.","High mountain guide.", "Complete feed, from first day breakfast to last day lunch.", "Hot drinks and snacks on shelters and camps ." , "Accomodation 2 nights on shelter (bunks).",  "Kitchenware (dishes, spoons, glasses).", "Transportation from Salento to Cocora and the way back."],
        recommendationsESP: ["Buena hidratación antes, durante y después.", "Utilizar anteojos oscuros con alto factor UV.", "Llevar agua", "usar protector solar de alta gama.", "Lleve ropa y calzado adecuados para la humedad.", "Mantenga su propio ritmo, respire y descanse si lo requiere.", " No ingerir bebidas alcoholicas durante el viaje."],
        recommendationsENG: ["Hydrate before, during and after the tour.", "Wear sunglasses.", "Bring water.", "Use sunscreen.", "Wear humidity suitable clohting and shoes.", "Keep tour own walking rythm, breath and rest when you need", "Do not consume alcoholic drinks during the trip"],
        itineraryESP:[[`Iniciamos el primer día con el ecuentro del guía a las 6 a.m en tu hostal o lugar definido, tomaremos el desayuno. Después, abordaremos el transporte hacia el valle de cocora (2400 mt). `, `Seguiremos con una caminata de 18km donde nos veremos inmersos en el Bosque de Niebla hasta llegar al Bosque Alto Andino, habitat de una amplia cantidad de especies vegetales, así como muchas especies de mamímeros, insectos, anfibios, aves y reptiles. `, `Llegaremos hasta la Finca la Argentina (3.400mt), refugio donde podremos descansar y alimentarnos rodeados por un ecosistema 100% natural.`, `Finalmente, podremos realizar la comida final del día y descansar en los camarotes del refugio. `],
            [`Iniciamos el segundo día al rededor de las 7:00 a.m. Tomaremos el desayuno y comenzaremos una caminata hacia la zona de aproximación del Paramillo. `, `Nos encontraremos inmersos en el hogar de la Danta de Páramo, una de las cuatro especies de Tapir existentes en america.`, `Este ecosistema maravilloso, será el lugar perfecto para tomar el almuerzo.`, ` Finalmente, llegaremos a finca El Jordan , donde podremos tomar la última comida del día y descansar`],
            [`Iniciamos el tercer día a las 7:00 a.m y nos preparararemos para iniciar el descenso. `, `Tendremos nuevamente la oportunidad de vernos inmersos en el Páramo, Bosque Alto Andino y Bosque de Niebla .`, `Continuaremos el descenso hasta llegar al Valle de Cocora , allí podremos disfrutar de una bebida y alimentarnos.`, ` Finalmente, abordaremos el transporte de regreso a salento, llevandonos la experiencia única de haber estado en uno de los lugares mas hermosos a la par que importantes de colombia, conociendo una especie tan majestuosa, gentil y exótica como lo es el Tapir.`]],
        itinenraryENG:[[`First day starts by meeting at 6 a.m at your hostel or main salentos plaza, we will have breakfast an then we will take our transfer to valle de cocora (2400 mt above sea level).`, `We will start with a 18km walk where we will be insersed into the  cloud and alto andino forests where different species of mammals, insects, reptils, birds and aphibians  live.`, `   We will arrive to Finca la Argentina (3.400mt above sea level), shelter where we can feed and rest sorrounded by this amazin ecosystem.`, `Finally, we will take last day meat and rest on the shelters bunks`],
            [` Second day starts around 7:00 a.m. we will have breakfast and prepare for a walk on the Paramillos proximities. `, ` We will get inmersed into the Tapirs ecosystem.`, `It will be the perfect time to have lunch sorrounded by outstanding views. `, `Finally, we will reach Finca El Jordan where we can feed and rest.`],
            [`Last day starts at 7:00 a.m , and, after having breakfast, we will take the way back through the Páramo.`, `Once again, we will pass through the alto andino and cloud forests.`, `We will reach the valle de cocora where we can enjoy a nice drink and feed.`, `Finally, we will take the trensfer back to salento, accompanied by nice emotions and feelings that one of the prettiest places in colombia leaves on you.`]]
    },
    tourCocora: {
        includedESP:["Guías de alta montaña.", "Seguro contra todo riesgo.", "Transporte de salento a cocora y visceversa."],
        includedENG: ["All risk insurance.","High mountain guide.", "Transportation from Salento to Cocora and the way back."],
        recommendationsESP: ["Buena hidratación antes, durante y después.", "Utilizar anteojos oscuros con alto factor UV.", "Llevar agua", "usar protector solar de alta gama.", "Lleve ropa y calzado adecuados para la humedad.", "Mantenga su propio ritmo, respire y descanse si lo requiere.", " No ingerir bebidas alcoholicas durante el viaje."],
        recommendationsENG: ["Hydrate before, during and after the tour.", "Wear sunglasses.", "Bring water.", "Use sunscreen.", "Wear humidity suitable clohting and shoes.", "Keep tour own walking rythm, breath and rest when you need", "Do not consume alcoholic drinks during the trip"],
        itineraryESP:[[`Iniciamos con el encuentro del guía a las 7:00 am en la plaza principal. Despues, abordaremos los jeeps hacia el valle de cocora `, `Seguiremos por las atracciones, tendrás la opción de tiempo libre para tomarte excelentes fotos en la estatuas, manos, alas, escaleras, construcciones y mucho más. `, ` Nos veremos inmersos en el bosque de palmas de cera hasta llegar a los miradores con vistas 360.`, `Finalmente, podremos realizar la comida final del día y descansar en los camarotes del refugio. `]],
        itinenraryENG:[[`It all starts by meeting at 7:00 am at salento's main plaza , then, we will take the transportation to the valle de cocora.`, `At the beggining of the valley, you will have time to take some nice pictures of Statues, big hands, wings and more.`, `   We will be surrounded by the palm tree forest until we reach the amazing 360° degree viewpoint.`, `Finally, recorreremos el trayecto final, acompañados del sentimiento y emociones plenas que nos deja uno de los paisajes más alucinantes de colombia`]]
    },
    tourCarbonera: {
        includedESP:["Guías de alta montaña.", "Seguro contra todo riesgo.","Almuerzo casero en Finca el Rocío", "Snacks", "Transporte de salento a cocora y visceversa."],
        includedENG: ["All risk insurance.","High mountain guide.","Colombian housemade lunch at Finca el Rocío","Snacks", "Transportation from Salento to Cocora and the way back."],
        recommendationsESP: ["Buena hidratación antes, durante y después.", "Utilizar anteojos oscuros con alto factor UV.", "Llevar agua", "usar protector solar de alta gama.", "Lleve ropa y calzado adecuados para la humedad.", "Mantenga su propio ritmo, respire y descanse si lo requiere.", " No ingerir bebidas alcoholicas durante el viaje."],
        recommendationsENG: ["Hydrate before, during and after the tour.", "Wear sunglasses.", "Bring water.", "Use sunscreen.", "Wear humidity suitable clohting and shoes.", "Keep tour own walking rythm, breath and rest when you need", "Do not consume alcoholic drinks during the trip"],
        itineraryESP:[[`Iniciamos con el encuentro del guía a las 8:00 am en la plaza principal. Despues, abordaremos el transporte hacia el santuario de palmas. `, `Nos veremos inmersos en el bosque de palmas , esto será un recorrido de 1 hora aproximadamente. `, ` Abordaremos nuevamente nustro transporte e iremos a otra finca llamada El Rocío donde haremos otra caminata de unos 14 km . En este lugar, podremos visualizar un paisaje sin igual y aver majestuosas que lo sobrevuelan.`, `Finalmente, recorreremos el trayecto final, acompañados del sentimiento y emociones plenas que nos deja este hermoso Santuario de palmas. `]],
        itinenraryENG:[[`This adventure starts by meeting at 8:00 am at the main Salento´s plaza, then, we will take the transfer to the palm tree sanctuary.`, `We will get inmersed into the palm tree forest for 1 hour. There are more than 600.000 palm trees there.`, `   We will take our transfer to finca El Rocío where we can have lunch and start a 14 km walk . In this place, we will see an amazin landscape and birds flying over.`, `Finally, we will take the transfer back to salento, accompanied by nice emotions and feelings that this palm tree sanctuary leaves on you`]]
    }
};

async function enrichTours() {
    for (const [key, id] of Object.entries(ID_MAPPING)) {
        console.log(`Processing ${key} (${id})...`);
        const data = legacyTours[key];
        if (!data) continue;

        // Map Content
        const inclusions = mapBilingualList(data.includedESP, data.includedENG);
        const recommendations = mapBilingualList(data.recommendationsESP, data.recommendationsENG);
        
        // Map Itinerary
        let itinerary = null;
        if (data.itineraryESP) {
            itinerary = {
                days: data.itineraryESP.map((dayParas, index) => {
                    const dayParasENG = data.itinenraryENG ? data.itinenraryENG[index] : [];
                    
                    const activities = dayParas.map((para, paraIndex) => ({
                        es: para.trim(),
                        en: (dayParasENG && dayParasENG[paraIndex]) ? dayParasENG[paraIndex].trim() : para.trim()
                    }));

                    return {
                        dayNumber: index + 1,
                        title: { es: `Día ${index + 1}`, en: `Day ${index + 1}` },
                        activities: activities
                    };
                })
            };
        }

        const updateData = {
            inclusions,
            recommendations,
            itinerary,
            exclusions: GENERIC_EXCLUSIONS, // Invented
            faqs: GENERIC_FAQS // Invented
        };

        try {
            await axios.put(`${API_URL}/${id}`, updateData, {
                headers: { 'X-Admin-Secret-Key': ADMIN_KEY }
            });
            console.log(`✅ Enriched ${key} successfully.`);
        } catch (error) {
            console.error(`❌ Error enriching ${key}:`, error.message);
            if (error.response) console.error(error.response.data);
        }
    }
}

enrichTours();
