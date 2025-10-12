/**
 * Helper utility functions
 */

const admin = require("firebase-admin");
const {COLLECTIONS, BOOKING_REFERENCE_PREFIX} = require("./constants");

/**
 * Generate a booking reference code
 * @return {string} Booking reference in format BK-YYYYMMDD-XXX
 */
const generateBookingReference = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const datePart = `${year}${month}${day}`;
  const randomPart = String(Math.floor(Math.random() * 900) + 100).padStart(3, "0");
  return `${BOOKING_REFERENCE_PREFIX}${datePart}-${randomPart}`;
};

/**
 * Get client IP from request, handling proxy headers
 * @param {Object} req - Express request object
 * @return {string} Client IP address
 */
const getClientIP = (req) => {
  return req.headers["x-forwarded-for"] ||
         req.headers["x-real-ip"] ||
         req.ip;
};

/**
 * Check if booking can be modified based on its status
 * @param {string} status - Current booking status
 * @return {boolean} True if booking can be modified, false otherwise
 */
const canModifyBooking = (status) => {
  // Allow modifications for pending and confirmed bookings
  // Don't allow modifications for cancelled bookings
  return status !== "cancelled" && status !== "cancelled_by_admin";
};

/**
 * Update event capacity based on pax change
 * @param {Object} db - Firestore instance
 * @param {string} eventId - Event ID to update
 * @param {number} oldPax - Previous pax count
 * @param {number} newPax - New pax count
 * @return {Promise<void>}
 */
const updateEventCapacity = async (db, eventId, oldPax, newPax) => {
  if (oldPax === newPax) {
    // No change needed
    return;
  }

  const eventRef = db.collection(COLLECTIONS.TOUR_EVENTS).doc(eventId);
  const paxChange = newPax - oldPax;

  await eventRef.update({
    bookedSlots: admin.firestore.FieldValue.increment(paxChange),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
};

module.exports = {
  generateBookingReference,
  getClientIP,
  canModifyBooking,
  updateEventCapacity,
};
