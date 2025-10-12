/**
 * Constants used throughout the API
 */

module.exports = {
  // Firestore Collections
  COLLECTIONS: {
    TOURS: "tours",
    TOUR_EVENTS: "tourEvents",
    BOOKINGS: "bookings",
    RATE_LIMITER: "rateLimiter",
  },

  // Status Constants
  STATUS: {
    EVENT_TYPE_PRIVATE: "private",
    EVENT_TYPE_PUBLIC: "public",
    BOOKING_PENDING: "pending",
    BOOKING_CONFIRMED: "confirmed",
    BOOKING_PAID: "paid",
    BOOKING_CANCELLED: "cancelled",
    BOOKING_CANCELLED_BY_ADMIN: "cancelled_by_admin",
  },

  // Rate Limiting
  RATE_LIMITING: {
    RATE_LIMIT_SECONDS: 300, // 5 minutes between requests
    MAX_BOOKINGS_PER_HOUR: 3, // Maximum 3 bookings per hour per IP
    MAX_BOOKINGS_PER_DAY: 5, // Maximum 5 bookings per day per IP
  },

  // Booking Reference
  BOOKING_REFERENCE_PREFIX: "BK-",
};
