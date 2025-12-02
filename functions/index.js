/* eslint-disable new-cap */
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

// Initialize Admin SDK first
admin.initializeApp();

const { validateAdminKey } = require("./src/middleware/auth");
const { validateBooking, validateTour } = require("./src/middleware/validation");

const toursController = require("./src/controllers/tours.controller");
const departuresController = require("./src/controllers/departures.controller");
const bookingsController = require("./src/controllers/bookings.controller");
const adminController = require("./src/controllers/admin.controller");

const app = express();
app.use(cors({ origin: true }));
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
adminRouter.get("/departures/:id", departuresController.getDeparture); // Get single departure
adminRouter.put("/departures/:id", departuresController.updateDeparture);
adminRouter.post("/departures/:id/split", departuresController.splitDeparture);
adminRouter.delete("/departures/:id", departuresController.deleteDeparture);
adminRouter.put("/departures/:id/date", departuresController.updateDepartureDate);
adminRouter.put("/departures/:id/tour", departuresController.updateDepartureTour);

// Bookings
adminRouter.get("/bookings", bookingsController.getBookings);
adminRouter.get("/bookings/:id", bookingsController.getBooking);
adminRouter.post("/bookings", validateBooking, bookingsController.createBooking);
adminRouter.post("/bookings/join", validateBooking, bookingsController.joinBooking); // NEW: Join existing departure
adminRouter.put("/bookings/:id/status", bookingsController.updateBookingStatus);
adminRouter.put("/bookings/:id/pax", bookingsController.updateBookingPax);
adminRouter.put("/bookings/:id/details", bookingsController.updateBookingDetails);
adminRouter.post("/bookings/:id/convert-type", bookingsController.convertBookingType);
adminRouter.post("/bookings/:id/move", bookingsController.moveBooking);
adminRouter.post("/bookings/:id/discount", bookingsController.applyDiscount);

app.use("/admin", adminRouter);


// --- Public Routes ---
const publicRouter = express.Router();

// Rate Limiting for Public Booking Endpoints
// Prevents spam attacks while allowing legitimate users
// Whitelist: localhost + developer IP (45.162.79.5)
const bookingRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 booking requests per windowMs
  skip: (req) => {
    // Whitelist: Always allow these IPs (no rate limit)
    const whitelistedIPs = [
      "127.0.0.1",      // localhost IPv4
      "::1",            // localhost IPv6
      "::ffff:127.0.0.1", // localhost IPv6-mapped IPv4
      "45.162.79.5"     // Developer IP (for testing)
    ];
    return whitelistedIPs.includes(req.ip);
  },
  message: {
    error: "Demasiados intentos de reserva. Por favor intenta de nuevo en 15 minutos."
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false // Disable `X-RateLimit-*` headers
});

// Public Tours (Active only)
publicRouter.get("/tours", async (req, res) => {
  try {
    const db = admin.firestore();
    const snapshot = await db.collection("tours").where("isActive", "==", true).get();
    const tours = snapshot.docs.map((doc) => ({ tourId: doc.id, ...doc.data() }));
    
    // Cache for 5 minutes (browser) / 10 minutes (CDN)
    res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    res.json(tours);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    const deps = snapshot.docs.map((doc) => ({ departureId: doc.id, ...doc.data() }));
    
    // Cache for 5 minutes (browser) / 10 minutes (CDN)
    res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    res.json(deps);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Public Booking - Join Existing Departure (WITH RATE LIMITING)
publicRouter.post("/bookings/join", bookingRateLimiter, validateBooking, bookingsController.joinBooking);

// Public Booking - Create Private Departure (WITH RATE LIMITING)
publicRouter.post("/bookings/private", bookingRateLimiter, validateBooking, bookingsController.createPrivateBooking);

app.use("/public", publicRouter);

// Export the API
exports.api = functions.https.onRequest(app);
