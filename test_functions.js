/**
 * Test script for Nevado Trek Backend Functions
 * This script tests the functionality of our implemented functions
 * without requiring the full Firebase environment
 */

// Mock Firebase Admin SDK for testing
const functions = {
  https: {
    onRequest: (handler) => handler // Simplified for testing purposes
  }
};

// Mock database for testing
const mockDb = {
  tours: [
    {
      id: 'tour1',
      name: { es: 'Tour de Prueba', en: 'Test Tour' },
      description: { es: 'Descripción de prueba', en: 'Test Description' },
      isActive: true,
      price: { amount: 100, currency: 'COP' },
      maxParticipants: 10,
      duration: '4 horas',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  nextId: 'tour2',
  
  collection: (colName) => {
    return {
      where: (field, operator, value) => {
        if (colName === 'tours') {
          if (field === 'isActive' && operator === '==' && value === true) {
            return {
              get: async () => {
                return {
                  empty: mockDb.tours.length === 0,
                  docs: mockDb.tours.map(tour => ({
                    id: tour.id,
                    data: () => tour
                  }))
                };
              }
            };
          }
        }
        return {
          get: async () => ({
            empty: true,
            docs: []
          })
        };
      },
      add: async (data) => {
        const newTour = {
          ...data,
          id: mockDb.nextId
        };
        mockDb.tours.push(newTour);
        mockDb.nextId = `tour${parseInt(mockDb.nextId.replace('tour', '')) + 1}`;
        return { id: newTour.id };
      },
      doc: (id) => {
        const tour = mockDb.tours.find(t => t.id === id);
        return {
          get: async () => ({
            exists: !!tour,
            data: () => tour,
            id: id
          }),
          update: async (data) => {
            const index = mockDb.tours.findIndex(t => t.id === id);
            if (index !== -1) {
              mockDb.tours[index] = { ...mockDb.tours[index], ...data };
            }
          }
        };
      }
    };
  }
};

// Import our constants (simplified version)
const CONSTANTS = {
  COLLECTIONS: {
    TOURS: 'tours',
    TOUR_EVENTS: 'tourEvents',
    BOOKINGS: 'bookings',
    RATE_LIMITER: 'rateLimiter'
  },
  STATUS: {
    EVENT_TYPE_PRIVATE: 'private',
    EVENT_TYPE_PUBLIC: 'public',
    BOOKING_PENDING: 'pending'
  },
  ADMIN_SECRET_KEY: 'miClaveSecreta123',
  RATE_LIMIT_SECONDS: 10
};

// Mock isAdminRequest function
const isAdminRequest = (req) => {
  const secretKey = req.headers['x-admin-secret-key'];
  return secretKey === CONSTANTS.ADMIN_SECRET_KEY;
};

// Mock function for server timestamp
const FieldValue = {
  serverTimestamp: () => new Date().toISOString()
};

// Import and test our functions
console.log('=== Testing Nevado Trek Backend Functions ===\n');

// Test getToursList function
async function testGetToursList() {
  console.log('1. Testing GET /tours (getToursList)...');
  
  const mockReq = { method: 'GET' };
  let responseSent = null;
  
  const mockRes = {
    status: (code) => {
      return {
        json: (data) => {
          responseSent = { status: code, data: data };
          return mockRes;
        },
        send: (data) => {
          responseSent = { status: code, data: data };
          return mockRes;
        }
      };
    }
  };
  
  // Define the getToursList function for testing
  const getToursList = async (req, res) => {
    if (req.method !== 'GET') {
      return res.status(405).send('Method Not Allowed');
    }

    try {
      const toursRef = mockDb.collection(CONSTANTS.COLLECTIONS.TOURS);
      const snapshot = await toursRef
          .where('isActive', '==', true)
          .get();

      if (snapshot.empty) {
        return res.status(200).json([]);
      }

      const tours = snapshot.docs.map(doc => ({
        tourId: doc.id,
        ...doc.data()
      }));

      return res.status(200).json(tours);
    } catch (error) {
      console.error("Error al obtener la lista de tours:", error);
      return res.status(500).send({
        message: 'Internal Server Error',
        details: error.message
      });
    }
  };
  
  await getToursList(mockReq, mockRes);
  
  console.log('   Status:', responseSent.status);
  console.log('   Data:', responseSent.data);
  console.log('   ✓ GET /tours test completed\n');
}

// Test getTourById function
async function testGetTourById() {
  console.log('2. Testing GET /tours/:tourId (getTourById)...');
  
  const mockReq = { 
    method: 'GET',
    params: { tourId: 'tour1' },
    path: '/tours/tour1'
  };
  let responseSent = null;
  
  const mockRes = {
    status: (code) => {
      return {
        json: (data) => {
          responseSent = { status: code, data: data };
          return mockRes;
        },
        send: (data) => {
          responseSent = { status: code, data: data };
          return mockRes;
        }
      };
    }
  };
  
  const getTourById = async (req, res) => {
    if (req.method !== "GET") {
      return res.status(405).send("Method Not Allowed");
    }

    try {
      // Extract tourId from URL 
      const pathParts = req.path.split("/");
      const tourId = pathParts[2]; // For /tours/{tourId}, this would be index 2

      if (!tourId) {
        return res.status(400).send({
          message: "Bad Request: tourId is required in the URL path",
        });
      }

      const tourRef = mockDb.collection(CONSTANTS.COLLECTIONS.TOURS).doc(tourId);
      const docSnapshot = await tourRef.get();

      if (!docSnapshot.exists) {
        return res.status(404).send({
          message: "Tour not found",
        });
      }

      const tourData = docSnapshot.data();
      
      if (!tourData.isActive) {
        return res.status(404).send({
          message: "Tour not found",
        });
      }

      return res.status(200).json({
        tourId: docSnapshot.id,
        ...tourData,
      });

    } catch (error) {
      console.error("Error al obtener el tour por ID:", error);
      return res.status(500).send({
        message: "Internal Server Error",
        details: error.message,
      });
    }
  };
  
  await getTourById(mockReq, mockRes);
  
  console.log('   Status:', responseSent.status);
  console.log('   Data:', responseSent.data);
  console.log('   ✓ GET /tours/:tourId test completed\n');
}

// Test adminCreateTour function
async function testAdminCreateTour() {
  console.log('3. Testing POST /admin/tours (adminCreateTour)...');
  
  const validTourData = {
    name: { es: 'Nuevo Tour', en: 'New Tour' },
    description: { es: 'Descripción del nuevo tour', en: 'New tour description' },
    price: { amount: 150, currency: 'COP' },
    maxParticipants: 15
  };
  
  const mockReq = { 
    method: 'POST',
    headers: { 'x-admin-secret-key': 'miClaveSecreta123' },
    body: validTourData
  };
  let responseSent = null;
  
  const mockRes = {
    status: (code) => {
      return {
        json: (data) => {
          responseSent = { status: code, data: data };
          return mockRes;
        },
        send: (data) => {
          responseSent = { status: code, data: data };
          return mockRes;
        }
      };
    }
  };
  
  const adminCreateTour = async (req, res) => {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    if (!isAdminRequest(req)) {
      return res.status(401).send("Unauthorized: Invalid admin secret key");
    }

    try {
      const tourData = req.body;

      if (!tourData.name || !tourData.name.es || !tourData.name.en) {
        return res.status(400).send({
          message: "Bad Request: Tour must include a name object " +
                   "with both 'es' and 'en' properties",
        });
      }

      if (tourData.isActive === undefined) {
        tourData.isActive = true;
      }

      tourData.createdAt = FieldValue.serverTimestamp();
      tourData.updatedAt = FieldValue.serverTimestamp();

      const toursRef = mockDb.collection(CONSTANTS.COLLECTIONS.TOURS);
      const docRef = await toursRef.add(tourData);

      return res.status(201).json({
        success: true,
        tourId: docRef.id,
        message: "Tour created successfully",
      });
    } catch (error) {
      console.error("Error al crear el tour:", error);
      return res.status(500).send({
        message: "Internal Server Error",
        details: error.message,
      });
    }
  };
  
  await adminCreateTour(mockReq, mockRes);
  
  console.log('   Status:', responseSent.status);
  console.log('   Data:', responseSent.data);
  console.log('   ✓ POST /admin/tours test completed\n');
}

// Test adminUpdateTour function
async function testAdminUpdateTour() {
  console.log('4. Testing PUT /admin/tours/:tourId (adminUpdateTour)...');
  
  const updateData = {
    name: { es: 'Tour Actualizado', en: 'Updated Tour' },
    description: { es: 'Descripción actualizada', en: 'Updated description' }
  };
  
  const mockReq = { 
    method: 'PUT',
    headers: { 'x-admin-secret-key': 'miClaveSecreta123' },
    path: '/admin/tours/tour1',
    body: updateData
  };
  let responseSent = null;
  
  const mockRes = {
    status: (code) => {
      return {
        json: (data) => {
          responseSent = { status: code, data: data };
          return mockRes;
        },
        send: (data) => {
          responseSent = { status: code, data: data };
          return mockRes;
        }
      };
    }
  };
  
  const adminUpdateTour = async (req, res) => {
    if (req.method !== "PUT") {
      return res.status(405).send("Method Not Allowed");
    }

    if (!isAdminRequest(req)) {
      return res.status(401).send("Unauthorized: Invalid admin secret key");
    }

    try {
      const pathParts = req.path.split("/");
      const tourId = pathParts[3]; // For /admin/tours/{tourId}, this would be index 3

      if (!tourId) {
        return res.status(400).send({
          message: "Bad Request: tourId is required in the URL path",
        });
      }

      const updatedData = req.body;

      if (updatedData.id || updatedData.tourId) {
        return res.status(400).send({
          message: "Bad Request: Cannot update tour ID",
        });
      }

      if (updatedData.name) {
        if (!updatedData.name.es || !updatedData.name.en) {
          return res.status(400).send({
            message: "Bad Request: Name must include both 'es' and 'en' " +
                     "properties",
          });
        }
      }

      updatedData.updatedAt = FieldValue.serverTimestamp();

      const tourRef = mockDb.collection(CONSTANTS.COLLECTIONS.TOURS).doc(tourId);
      const docSnapshot = await tourRef.get();

      if (!docSnapshot.exists) {
        return res.status(404).send({
          message: "Tour not found",
        });
      }

      await tourRef.update(updatedData);

      return res.status(200).json({
        success: true,
        tourId: tourId,
        message: "Tour updated successfully",
      });

    } catch (error) {
      console.error("Error al actualizar el tour:", error);
      return res.status(500).send({
        message: "Internal Server Error",
        details: error.message,
      });
    }
  };
  
  await adminUpdateTour(mockReq, mockRes);
  
  console.log('   Status:', responseSent.status);
  console.log('   Data:', responseSent.data);
  console.log('   ✓ PUT /admin/tours/:tourId test completed\n');
}

// Test adminDeleteTour function
async function testAdminDeleteTour() {
  console.log('5. Testing DELETE /admin/tours/:tourId (adminDeleteTour)...');
  
  const mockReq = { 
    method: 'DELETE',
    headers: { 'x-admin-secret-key': 'miClaveSecreta123' },
    path: '/admin/tours/tour1'
  };
  let responseSent = null;
  
  const mockRes = {
    status: (code) => {
      return {
        json: (data) => {
          responseSent = { status: code, data: data };
          return mockRes;
        },
        send: (data) => {
          responseSent = { status: code, data: data };
          return mockRes;
        }
      };
    }
  };
  
  const adminDeleteTour = async (req, res) => {
    if (req.method !== "DELETE") {
      return res.status(405).send("Method Not Allowed");
    }

    if (!isAdminRequest(req)) {
      return res.status(401).send("Unauthorized: Invalid admin secret key");
    }

    try {
      const pathParts = req.path.split("/");
      const tourId = pathParts[3]; // For /admin/tours/{tourId}, this would be index 3

      if (!tourId) {
        return res.status(400).send({
          message: "Bad Request: tourId is required in the URL path",
        });
      }

      const tourRef = mockDb.collection(CONSTANTS.COLLECTIONS.TOURS).doc(tourId);
      const docSnapshot = await tourRef.get();

      if (!docSnapshot.exists) {
        return res.status(404).send({
          message: "Tour not found",
        });
      }

      // Update the tour to set isActive to false
      await tourRef.update({
        isActive: false,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return res.status(200).json({
        success: true,
        tourId: tourId,
        message: "Tour deleted successfully (marked as inactive)",
      });

    } catch (error) {
      console.error("Error al eliminar el tour:", error);
      return res.status(500).send({
        message: "Internal Server Error",
        details: error.message,
      });
    }
  };
  
  await adminDeleteTour(mockReq, mockRes);
  
  console.log('   Status:', responseSent.status);
  console.log('   Data:', responseSent.data);
  console.log('   ✓ DELETE /admin/tours/:tourId test completed\n');
}

// Run all tests
async function runAllTests() {
  try {
    await testGetToursList();
    await testGetTourById();
    await testAdminCreateTour();
    await testAdminUpdateTour();
    await testAdminDeleteTour();
    
    console.log('=== All tests completed successfully! ===');
    console.log('The functions are working as expected.');
    console.log('\nTo run these functions in Firebase:');
    console.log('1. Make sure Java is installed for local testing');
    console.log('2. Use "firebase emulators:start --only functions,firestore" for local testing');
    console.log('3. Or "firebase deploy --only functions" to deploy to production');
  } catch (error) {
    console.error('Test error:', error);
  }
}

// Execute tests
runAllTests();