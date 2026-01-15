const admin = require("firebase-admin");
const crypto = require("crypto");
const { defineString } = require("firebase-functions/params");

// Define parameters
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
    const timestamp = Date.now();
    const paymentReference = `NTK-${bookingId}-${timestamp}`;
    const amount = booking.finalPrice || booking.originalPrice;
    const currency = "COP";

    // --- INTEGRITY SIGNATURE GENERATION ---
    // Formula: SHA256(reference + amount + currency + secret)
    const integrityString = `${paymentReference}${amount}${currency}${boldIntegritySecret.value()}`;
    const integritySignature = crypto.createHash("sha256").update(integrityString).digest("hex");

    res.json({
      paymentReference,
      amount,
      currency,
      apiKey: boldApiKey.value(),
      integritySignature,
      redirectionUrl: "https://nevado-trek.com/payment-result",
      description: `Reserva Nevado Trek - ${bookingId}`,
      tax: 0,
    });

  } catch (error) {
    console.error("Error initializing payment:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Handle Bold Webhook Notifications
 * Updates booking status based on payment result
 */
exports.webhookHandler = async (req, res) => {
  try {
    const payload = req.body;
    const signature = req.headers["bold-signature"] || req.headers["x-signature"]; // Check documentation for exact header name

    console.log("🔔 Bold Webhook received:", JSON.stringify(payload));

    // 1. Extract Data
    // Payload structure depends on Bold version. Usually contains 'payment_status' and 'reference'
    // Bold Example Payload: { "status": "APPROVED", "reference": "NTK-...", "tx_id": "...", ... }
    const { payment_status, reference, tx_id, payment_method } = payload;

    if (!reference || !payment_status) {
        console.warn("⚠️ Invalid webhook payload: Missing reference or status");
        return res.status(400).json({ error: "Invalid payload" });
    }

    // 2. Parse Reference to get Booking ID
    // Format: NTK-{bookingId}-{timestamp}
    const parts = reference.split("-");
    if (parts.length < 3 || parts[0] !== "NTK") {
        console.warn("⚠️ Unknown reference format:", reference);
        return res.status(200).json({ message: "Ignored: Not a Nevado Trek reference" });
    }
    const bookingId = parts[1];

    // 3. Map Bold Status to System Status
    let paymentInfoStatus = "processing";
    let bookingStatus = null; // Only update main status if definitive

    switch (String(payment_status).toUpperCase()) {
        case "APPROVED":
        case "PAID":
        case "SUCCEEDED":
            paymentInfoStatus = "paid";
            bookingStatus = "paid";
            break;
        case "REJECTED":
        case "FAILED":
        case "DECLINED":
            paymentInfoStatus = "failed";
            // We do NOT cancel the booking automatically on failure, user can retry
            break;
        case "VOIDED":
            paymentInfoStatus = "voided";
            break;
        default:
            paymentInfoStatus = "processing";
    }

    // 4. Update Firestore
    const db = admin.firestore();
    const bookingRef = db.collection("bookings").doc(bookingId);

    // Prepare update object
    const updateData = {
        "paymentInfo.status": paymentInfoStatus,
        "paymentInfo.provider": "bold",
        "paymentInfo.transactionId": tx_id || "unknown",
        "paymentInfo.reference": reference,
        "paymentInfo.lastUpdate": new Date(),
        "updatedAt": new Date() // Standard audit field
    };

    if (payment_method) {
        updateData["paymentInfo.paymentMethod"] = payment_method;
    }

    if (paymentInfoStatus === "paid") {
        updateData["paymentInfo.paidAt"] = new Date();
    }

    // Only update the main booking status if the payment was successful
    if (bookingStatus) {
        updateData.status = bookingStatus;
    }

    await bookingRef.update(updateData);
    console.log(`✅ Booking ${bookingId} updated. Payment Status: ${paymentInfoStatus}`);

    // 5. Respond to Bold (Always 200 to verify receipt)
    res.status(200).json({ received: true });

  } catch (error) {
    console.error("❌ Error processing webhook:", error);
    // Return 500 so Bold retries later if it was a system error
    res.status(500).json({ error: error.message });
  }
};