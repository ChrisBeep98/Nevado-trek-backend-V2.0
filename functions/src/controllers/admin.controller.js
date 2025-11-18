const admin = require("firebase-admin");
const {COLLECTIONS, BOOKING_STATUS, DEPARTURE_STATUS} = require("../constants");

const db = admin.firestore();

/**
 * Get Dashboard Statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @return {Promise<void>}
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(now.getDate() + 7);

    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(now.getDate() + 30);

    // 1. Count Active Bookings (Pending or Confirmed)
    // Note: Firestore count() aggregation is efficient
    const bookingsSnapshot = await db.collection(COLLECTIONS.BOOKINGS)
        .where("status", "in", [BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED])
        .count()
        .get();

    const totalActiveBookings = bookingsSnapshot.data().count;

    // 2. Upcoming Departures (Next 7 days)
    const upcomingDeparturesSnapshot = await db.collection(COLLECTIONS.DEPARTURES)
        .where("date", ">=", now)
        .where("date", "<=", sevenDaysLater)
        .where("status", "==", DEPARTURE_STATUS.OPEN)
        .get();

    const upcomingDeparturesCount = upcomingDeparturesSnapshot.size;

    // 3. Total Revenue (Estimate from active bookings)
    // This might be expensive if there are many bookings.
    // For now, let's just sum the 'finalPrice' of the last 50 bookings to avoid reading all.
    // Or we can rely on a separate aggregation function.
    // Let's just return the count for now to be safe and fast.

    return res.status(200).json({
      totalActiveBookings,
      upcomingDeparturesCount,
      next7Days: upcomingDeparturesCount,
      timestamp: now,
    });
  } catch (error) {
    console.error("Error getting dashboard stats:", error);
    return res.status(500).json({error: error.message});
  }
};
