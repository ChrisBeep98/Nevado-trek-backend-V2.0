/* eslint-disable new-cap */
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");

// Initialize Admin SDK first
admin.initializeApp();

const {validateAdminKey} = require("./src/middleware/auth");
const {validateBooking, validateTour} = require("./src/middleware/validation");

const toursController = require("./src/controllers/tours.controller");
const departuresController = require("./src/controllers/departures.controller");
const bookingsController = require("./src/controllers/bookings.controller");
const adminController = require("./src/controllers/admin.controller");

const app = express();
app.use(cors({origin: true}));
app.use(express.json());

// --- Admin Routes (Protected) ---
const adminRouter = express.Router();
adminRouter.use(validateAdminKey);

// Dashboard Stats
adminRouter.get("/stats", adminController.getDashboardStats);

// Tours
adminRouter.post("/tours", validateTour, toursController.createTour);
adminRouter.get("/tours", toursController.getAllTours); // Includes inactive
adminRouter.get("/tours/:id", toursController.getTour);
adminRouter.put("/tours/:id", validateTour, toursController.updateTour);
adminRouter.delete("/tours/:id", toursController.deleteTour);

// Departures
adminRouter.post("/departures", departuresController.createDeparture);
adminRouter.get("/departures", departuresController.getDepartures); // Calendar view
adminRouter.put("/departures/:id", departuresController.updateDeparture);
adminRouter.post("/departures/:id/split", departuresController.splitDeparture);
adminRouter.delete("/departures/:id", departuresController.deleteDeparture);

// Bookings
adminRouter.put("/bookings/:id", bookingsController.updateBooking);
adminRouter.post("/bookings/:id/move", bookingsController.moveBooking);
adminRouter.post("/bookings/:id/discount", bookingsController.applyDiscount);

app.use("/admin", adminRouter);


// --- Public Routes ---
const publicRouter = express.Router();

// Public Tours (Active only)
publicRouter.get("/tours", async (req, res) => {
  try {
    const db = admin.firestore();
    const snapshot = await db.collection("tours").where("isActive", "==", true).get();
    const tours = snapshot.docs.map((doc) => ({tourId: doc.id, ...doc.data()}));
    res.json(tours);
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

// Public Departures (Open Public ones)
publicRouter.get("/departures", async (req, res) => {
  try {
    const db = admin.firestore();
    const snapshot = await db.collection("departures")
        .where("type", "==", "public")
        .where("status", "==", "open")
        .where("date", ">=", new Date())
        .get();
    const deps = snapshot.docs.map((doc) => ({departureId: doc.id, ...doc.data()}));
    res.json(deps);
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

// Public Booking
publicRouter.post("/bookings", validateBooking, bookingsController.createBooking);

app.use("/public", publicRouter);

// Export the API
exports.api = functions.https.onRequest(app);
