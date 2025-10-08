
/**
 * Test Data Setup for Nevado Trek Backend
 * Run this script to create initial test data for API testing
 * 
 * Usage:
 *   1. Make sure Firebase functions are deployed
 *   2. Set ADMIN_SECRET_KEY environment variable (or use default)
 *   3. Run: node setup_test_data.js
 */

const axios = require('axios');
const https = require('https');

const config = {
  baseUrl: process.env.BASE_URL || 'https://us-central1-nevadotrektest01.cloudfunctions.net',
  adminSecretKey: process.env.ADMIN_SECRET_KEY || 'miClaveSecreta123',
};

const apiClient = axios.create({
  httpsAgent: new https.Agent({ rejectUnauthorized: false }),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

const testTours = [
  {
    "name": {
      "es": "Ascenso al Nevado",
      "en": "Nevado Trek"
    },
    "description": {
      "es": "Excursión al Nevado con vistas panorámicas",
      "en": "Trek to Nevado with panoramic views"
    },
    "maxParticipants": 8,
    "duration": "3 días",
    "price": {
      "amount": 1200000,
      "currency": "COP"
    },
    "isActive": true,
    "pricingTiers": [
      {
        "pax": 1,
        "paxTo": 2,
        "pricePerPerson": 1500000
      },
      {
        "paxFrom": 3,
        "paxTo": 5,
        "pricePerPerson": 1200000
      },
      {
        "paxFrom": 6,
        "paxTo": 8,
        "pricePerPerson": 1000000
      }
    ],
    "images": [
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg"
    ],
    "details": [
      {
        "label": {
          "es": "Dificultad",
          "en": "Difficulty"
        },
        "value": {
          "es": "Alta",
          "en": "High"
        }
      },
      {
        "label": {
          "es": "Altitud",
          "en": "Altitude"
        },
        "value": {
          "es": "4,200 msnm",
          "en": "4,200 masl"
        }
      }
    ],
    "inclusions": [
      {
        "es": "Guiado profesional",
        "en": "Professional guide"
      },
      {
        "es": "Equipo básico",
        "en": "Basic equipment"
      },
      {
        "es": "Alimentación",
        "en": "Meals"
      }
    ],
    "recommendations": [
      {
        "es": "Llevar protector solar",
        "en": "Bring sunscreen"
      },
      {
        "es": "Ropa abrigada",
        "en": "Wear warm clothes"
      }
    ],
    "faqs": [
      {
        "question": {
          "es": "¿Qué edad mínima?",
          "en": "What is the minimum age?"
        },
        "answer": {
          "es": "12 años",
          "en": "12 years"
        }
      }
    ]
  },
  {
    "name": {
      "es": "Senderismo Familiar",
      "en": "Family Hiking"
    },
    "description": {
      "es": "Ruta familiar adecuada para todos los niveles",
      "en": "Family trail suitable for all levels"
    },
    "maxParticipants": 10,
    "duration": "1 día",
    "price": {
      "amount": 300000,
      "currency": "COP"
    },
    "isActive": true,
    "pricingTiers": [
      {
        "pax": 1,
        "paxTo": 4,
        "pricePerPerson": 350000
      },
      {
        "paxFrom": 5,
        "paxTo": 8,
        "pricePerPerson": 280000
      },
      {
        "paxFrom": 9,
        "paxTo": 10,
        "pricePerPerson": 250000
      }
    ],
    "images": [
      "https://example.com/family1.jpg",
      "https://example.com/family2.jpg"
    ],
    "details": [
      {
        "label": {
          "es": "Dificultad",
          "en": "Difficulty"
        },
        "value": {
          "es": "Baja",
          "en": "Low"
        }
      },
      {
        "label": {
          "es": "Distancia",
          "en": "Distance"
        },
        "value": {
          "es": "5 km",
          "en": "5 km"
        }
      }
    ],
    "inclusions": [
      {
        "es": "Almuerzo incluido",
        "en": "Lunch included"
      },
      {
        "es": "Seguro de accidentes",
        "en": "Accident insurance"
      }
    ],
    "recommendations": [
      {
        "es": "Calzado cómodo",
        "en": "Comfortable shoes"
      },
      {
        "es": "Cámara fotográfica",
        "en": "Camera"
      }
    ],
    "faqs": [
      {
        "question": {
          "es": "¿Apto para niños?",
          "en": "Suitable for children?"
        },
        "answer": {
          "es": "Sí, desde 5 años",
          "en": "Yes, from 5 years"
        }
      }
    ]
  },
  {
    "name": {
      "es": "Aventura Extrema",
      "en": "Extreme Adventure"
    },
    "description": {
      "es": "Ruta desafiante para aventureros experimentados",
      "en": "Challenging route for experienced adventurers"
    },
    "maxParticipants": 6,
    "duration": "5 días",
    "price": {
      "amount": 2500000,
      "currency": "COP"
    },
    "isActive": true,
    "pricingTiers": [
      {
        "pax": 1,
        "paxTo": 2,
        "pricePerPerson": 3000000
      },
      {
        "paxFrom": 3,
        "paxTo": 5,
        "pricePerPerson": 2500000
      },
      {
        "paxFrom": 6,
        "paxTo": 6,
        "pricePerPerson": 2200000
      }
    ],
    "images": [
      "https://example.com/extreme1.jpg",
      "https://example.com/extreme2.jpg"
    ],
    "details": [
      {
        "label": {
          "es": "Dificultad",
          "en": "Difficulty"
        },
        "value": {
          "es": "Muy alta",
          "en": "Very high"
        }
      },
      {
        "label": {
          "es": "Altitud",
          "en": "Altitude"
        },
        "value": {
          "es": "5,200 msnm",
          "en": "5,200 masl"
        }
      }
    ],
    "inclusions": [
      {
        "es": "Equipo completo",
        "en": "Complete equipment"
      },
      {
        "es": "Certificado de logro",
        "en": "Achievement certificate"
      },
      {
        "es": "Video profesional",
        "en": "Professional video"
      }
    ],
    "recommendations": [
      {
        "es": "Entrenamiento previo",
        "en": "Previous training recommended"
      },
      {
        "es": "Buen estado físico",
        "en": "Good physical condition required"
      }
    ],
    "faqs": [
      {
        "question": {
          "es": "¿Requiere experiencia?",
          "en": "Requires experience?"
        },
        "answer": {
          "es": "Sí, recomendado",
          "en": "Yes, recommended"
        }
      }
    ]
  },
  {
    "name": {
      "es": "Sendero Ecológico",
      "en": "Eco Trail"
    },
    "description": {
      "es": "Ruta ecológica con avistamiento de fauna",
      "en": "Eco trail with wildlife spotting"
    },
    "maxParticipants": 12,
    "duration": "2 días",
    "price": {
      "amount": 600000,
      "currency": "COP"
    },
    "isActive": true,
    "pricingTiers": [
      {
        "pax": 1,
        "paxTo": 4,
        "pricePerPerson": 700000
      },
      {
        "paxFrom": 5,
        "paxTo": 8,
        "pricePerPerson": 600000
      },
      {
        "paxFrom": 9,
        "paxTo": 12,
        "pricePerPerson": 500000
      }
    ],
    "images": [
      "https://example.com/ecotrail1.jpg",
      "https://example.com/ecotrail2.jpg"
    ],
    "details": [
      {
        "label": {
          "es": "Dificultad",
          "en": "Difficulty"
        },
        "value": {
          "es": "Media",
          "en": "Medium"
        }
      },
      {
        "label": {
          "es": "Wildlife",
          "en": "Wildlife"
        },
        "value": {
          "es": "Fauna diversa",
          "en": "Diverse fauna"
        }
      }
    ],
    "inclusions": [
      {
        "es": "Guía experto en fauna",
        "en": "Wildlife expert guide"
      },
      {
        "es": "Kit ecológico",
        "en": "Eco-kit"
      },
      {
        "es": "Documentación",
        "en": "Documentation"
      }
    ],
    "recommendations": [
      {
        "es": "Ropa camuflaje",
        "en": "Camouflage clothing"
      },
      {
        "es": "Binoculares",
        "en": "Binoculars"
      }
    ],
    "faqs": [
      {
        "question": {
          "es": "¿Qué animales veré?",
          "en": "What animals will I see?"
        },
        "answer": {
          "es": "Diversidad de aves y mamíferos",
          "en": "Diversity of birds and mammals"
        }
      }
    ]
  },
  {
    "name": {
      "es": "Cumbre del Pico",
      "en": "Summit Peak"
    },
    "description": {
      "es": "Excursión a la cumbre más alta",
      "en": "Hike to the highest summit"
    },
    "maxParticipants": 4,
    "duration": "4 días",
    "price": {
      "amount": 1800000,
      "currency": "COP"
    },
    "isActive": true,
    "pricingTiers": [
      {
        "pax": 1,
        "paxTo": 1,
        "pricePerPerson": 2500000
      },
      {
        "paxFrom": 2,
        "paxTo": 3,
        "pricePerPerson": 2000000
      },
      {
        "paxFrom": 4,
        "paxTo": 4,
        "pricePerPerson": 1800000
      }
    ],
    "images": [
      "https://example.com/summit1.jpg",
      "https://example.com/summit2.jpg"
    ],
    "details": [
      {
        "label": {
          "es": "Dificultad",
          "en": "Difficulty"
        },
        "value": {
          "es": "Extrema",
          "en": "Extreme"
        }
      },
      {
        "label": {
          "es": "Altitud",
          "en": "Altitude"
        },
        "value": {
          "es": "5,800 msnm",
          "en": "5,800 masl"
        }
      }
    ],
    "inclusions": [
      {
        "es": "Soporte médico",
        "en": "Medical support"
      },
      {
        "es": "Equipo especializado",
        "en": "Specialized equipment"
      },
      {
        "es": "Certificación oficial",
        "en": "Official certification"
      }
    ],
    "recommendations": [
      {
        "es": "Acclimatización previa",
        "en": "Previous acclimatization"
      },
      {
        "es": "Seguro de vida",
        "en": "Life insurance"
      }
    ],
    "faqs": [
      {
        "question": {
          "es": "¿Cuál es el mínimo?",
          "en": "What is the minimum?"
        },
        "answer": {
          "es": "2 personas para operar",
          "en": "2 people minimum to operate"
        }
      }
    ]
  }
];
let createdTourIds = [];

async function createTours() {
  console.log('🚀 Creating test tours...');
  
  for (let i = 0; i < testTours.length; i++) {
    console.log(`Creating tour ${i + 1}/${testTours.length}: ${testTours[i].name.es}`);
    
    try {
      const response = await apiClient.post(
        `${config.baseUrl}/adminCreateTourV2`,
        testTours[i],
        {
          headers: { 'x-admin-secret-key': config.adminSecretKey }
        }
      );
      
      if (response.status === 201) {
        console.log(`✅ Tour created with ID: ${response.data.tourId}`);
        createdTourIds.push(response.data.tourId);
      } else {
        console.log(`❌ Failed to create tour: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ Error creating tour: ${error.message}`);
    }
  }
  
  return createdTourIds;
}

async function scheduleBookings(tourIds) {
  console.log('\n📅 Scheduling test bookings...');
  
  const customers = [
    {
      fullName: "Ana María López",
      documentId: "CC123456789",
      phone: "+573001234567",
      email: "ana@example.com",
      notes: "Cliente VIP"
    },
    {
      fullName: "Carlos Rodríguez",
      documentId: "CC987654321", 
      phone: "+573009876543",
      email: "carlos@example.com",
      notes: "Primer viaje"
    },
    {
      fullName: "María Fernanda Gómez",
      documentId: "CC456789123",
      phone: "+573004567891", 
      email: "maria@example.com",
      notes: "Fotógrafa profesional"
    },
    {
      fullName: "Luis Eduardo Martínez",
      documentId: "CC321654987",
      phone: "+573003216549",
      email: "luis@example.com", 
      notes: "Grupo escolar"
    },
    {
      fullName: "Sofía Valentina Herrera",
      documentId: "CC654123789",
      phone: "+573006541237",
      email: "sofia@example.com",
      notes: "Cumpleaños especial"
    }
  ];

  for (let i = 0; i < customers.length && i < tourIds.length; i++) {
    console.log(`Creating booking for tour ${tourIds[i]} with customer ${customers[i].fullName}`);
    
    try {
      // Create booking for each tour
      const bookingData = {
        tourId: tourIds[i],
        startDate: new Date(Date.now() + (10 + i * 5) * 24 * 60 * 60 * 1000).toISOString(), // Future dates
        customer: customers[i],
        pax: Math.floor(Math.random() * 4) + 1 // 1-4 people
      };
      
      const response = await apiClient.post(
        `${config.baseUrl}/createBooking`,
        bookingData
      );
      
      if (response.status === 201) {
        console.log(`✅ Booking created: ${response.data.bookingReference}`);
      } else {
        console.log(`❌ Failed to create booking: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ Error creating booking: ${error.message}`);
    }
  }
}

async function runSetup() {
  console.log('🎯 Starting test data setup for Nevado Trek Backend');
  console.log('📋 This will create:');
  console.log(`   - ${testTours.length} test tours`);
  console.log(`   - Multiple bookings associated with tours`);
  console.log(`   - Events based on bookings`);
  console.log('');
  
  const tourIds = await createTours();
  
  if (tourIds.length > 0) {
    console.log('\n📋 Created Tour IDs:');
    tourIds.forEach((id, index) => console.log(`   ${index + 1}. ${id}`));
    
    await scheduleBookings(tourIds);
  } else {
    console.log('❌ No tours were created, so no bookings could be scheduled');
  }
  
  console.log('\n🎉 Test data setup complete! You can now run the API test suite.');
  console.log('\n📊 To test the calendar endpoint, use these tour IDs for filtering.');
  console.log('\n🔍 Next, run the API test suite: node api_test_suite.js');
}

// Install axios if needed and run setup
if (typeof require !== 'undefined') {
  runSetup().catch(console.error);
} else {
  console.log('This script needs to run in Node.js environment');
}
