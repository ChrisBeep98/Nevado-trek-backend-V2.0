const admin = require("firebase-admin");
const crypto = require("crypto");
const { defineString } = require("firebase-functions/params");

// Define parameters (using params instead of process.env for v2 functions)
// In local emulator/staging, these will fallback to .env files if defined there, 
// or can be set via secret manager in production.
const boldApiKey = defineString("BOLD_API_KEY");
const boldSecretKey = defineString("BOLD_SECRET_KEY");
const boldIntegritySecret = defineString("BOLD_INTEGRITY_SECRET");

/**
 * Initialize a Bold Payment for a specific booking
 * Generates the necessary signature/hash and payment reference
 */
exports.initPayment = async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ error: "Missing bookingId" });
    }

    const db = admin.firestore();
    const bookingRef = db.collection("bookings").doc(bookingId);
    const bookingSnap = await bookingRef.get();

    if (!bookingSnap.exists) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const booking = bookingSnap.data();

    // Validations
    if (booking.status === "cancelled") {
      return res.status(400).json({ error: "Cannot pay for a cancelled booking" });
    }
    if (booking.status === "paid") {
      return res.status(400).json({ error: "Booking is already paid" });
    }

    // Prepare Payment Data
    // Reference format: NTK-{bookingId}-{timestamp} to ensure uniqueness if retried
    const timestamp = Date.now();
    const paymentReference = `NTK-${bookingId}-${timestamp}`;
    const amount = booking.finalPrice || booking.originalPrice; // Use final price if discount applied
    const currency = "COP";

    // --- INTEGRITY SIGNATURE GENERATION ---
    // Standard Bold/Wompi formula: SHA256(reference + amount + currency + secret)
    // IMPORTANT: Verify exact concatenation order with Bold Docs
    const integrityString = `${paymentReference}${amount}${currency}${boldIntegritySecret.value()}`;
    const integritySignature = crypto.createHash("sha256").update(integrityString).digest("hex");

    // Return safe data to frontend
    res.json({
      paymentReference,
      amount,
      currency,
      apiKey: boldApiKey.value(),
      integritySignature,
      redirectionUrl: "https://nevado-trek.com/payment-result", // Placeholder
      description: `Reserva Nevado Trek - ${bookingId}`,
      tax: 0, // Tourism usually has specific tax rules, keeping simple for now
    });

  } catch (error) {
    console.error("Error initializing payment:", error);
    res.status(500).json({ error: error.message });
  }
};
