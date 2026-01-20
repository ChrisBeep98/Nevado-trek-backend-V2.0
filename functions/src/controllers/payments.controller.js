const admin = require("firebase-admin");
const crypto = require("crypto");
const axios = require("axios"); // Added axios
const { defineString } = require("firebase-functions/params");
const { sendTelegramAlert } = require("../utils/notifications");

// Define parameters
const boldApiKey = defineString("BOLD_API_KEY");
const boldSecretKey = defineString("BOLD_SECRET_KEY");
const boldIntegritySecret = defineString("BOLD_INTEGRITY_SECRET");

/**
 * Initialize a Bold Payment using Smart Links (API)
 * Creates a server-to-server link to guarantee credit card availability
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

    // Calculate 30% Deposit + 5% Processing Fee logic
    const totalBookingValue = booking.finalPrice || booking.originalPrice;
    const depositBase = Math.round(totalBookingValue * 0.30); // 30% Base Deposit
    const processingFee = Math.round(depositBase * 0.05); // 5% Fee to cover transaction costs
    const amountToCharge = depositBase + processingFee; // Total amount to charge in Bold
    
    // Bold API Configuration
    const BOLD_API_URL = "https://integrations.api.bold.co/online/link/v1";
    
    // Use the API Key (Identity Key) for Authorization
    // Note: In some Bold integrations, the header is "Authorization: x-api-key <KEY>"
    const apiKey = boldApiKey.value(); 
    
    const payload = {
      name: `Reserva Nevado Trek`,
      description: `Booking ID: ${bookingId} (Depósito 30%)`,
      amount_type: "CLOSE", // Fixed amount
      amount: {
        currency: "COP",
        total_amount: amountToCharge
      },
      // Pass our internal reference so the Webhook can identify the booking
      reference: `NTK-${bookingId}-${Date.now()}`, 
      // Determine Redirect URL based on environment (staging vs prod)
      callback_url: "https://nevado-trek.com/payment-result",
      // Webhook URL to receive updates automatically
      webhook_url: "https://us-central1-nevado-trek-backend-03.cloudfunctions.net/api/public/payments/webhook",
      payer_email: booking.customer?.email || undefined
    };

    console.log(`🔗 [BOLD API] Creating Smart Link for Booking ${bookingId}. Amount: ${amountToCharge}`);

    const boldResponse = await axios.post(BOLD_API_URL, payload, {
      headers: {
        "Authorization": `x-api-key ${apiKey}`,
        "Content-Type": "application/json"
      }
    });

    const linkData = boldResponse.data.payload;
    
    // Return the hosted payment URL to the frontend
    res.json({
      paymentUrl: linkData.url, 
      paymentReference: linkData.uid, // Bold's unique ID for this link
      amount: amountToCharge,
      currency: "COP",
      description: payload.description
    });

  } catch (error) {
    console.error("Error initializing payment (Bold API):", error.response?.data || error.message);
    res.status(500).json({ 
      error: "Failed to create payment link",
      details: error.response?.data || error.message
    });
  }
};

/**
 * Handle Bold Webhook Notifications
 * Updates booking status based on payment result
 */
exports.webhookHandler = async (req, res) => {
  try {
    const payload = req.body;
    const headers = req.headers;

    console.log(`🔔 [WEBHOOK] Processing notification for reference: ${payload.data?.metadata?.reference || "unknown"}`);

    if (!payload.data || !payload.type) {
        console.warn("⚠️ [WEBHOOK ABORT] Invalid payload structure");
        return res.status(400).json({ error: "Invalid payload structure" });
    }

    const eventType = payload.type;
    const paymentData = payload.data;
    const reference = paymentData.metadata?.reference || paymentData.reference;

    if (!reference) {
        console.warn("⚠️ [WEBHOOK ABORT] No reference found");
        return res.status(200).json({ message: "Ignored: No reference" });
    }

    // Parse Reference: NTK-{bookingId}-{timestamp}
    const parts = reference.split("-");
    if (parts.length < 3 || parts[0] !== "NTK") {
        return res.status(200).json({ message: "Ignored: Not a Nevado Trek reference" });
    }
    const bookingId = parts[1];

    // Map Status
    let paymentInfoStatus = "processing";
    let bookingStatus = null; 
    let notificationEmoji = "ℹ️";
    let statusText = "PROCESANDO";

    switch (eventType) {
        case "SALE_APPROVED":
            paymentInfoStatus = "paid";
            bookingStatus = "paid";
            notificationEmoji = "🤑";
            statusText = "APROBADO";
            break;
        case "SALE_REJECTED":
            paymentInfoStatus = "failed";
            notificationEmoji = "❌";
            statusText = "RECHAZADO";
            break;
        case "SALE_FAILED":
            paymentInfoStatus = "failed";
            notificationEmoji = "⚠️";
            statusText = "ERROR TÉCNICO";
            break;
        case "SALE_EXPIRED":
            paymentInfoStatus = "expired";
            notificationEmoji = "⏳";
            statusText = "EXPIRADO";
            break;
        case "VOID_APPROVED":
            paymentInfoStatus = "voided";
            bookingStatus = "cancelled";
            notificationEmoji = "🚫";
            statusText = "ANULADO";
            break;
        default:
            return res.status(200).json({ message: "Event type ignored" });
    }

    // Update Firestore
    const db = admin.firestore();
    const bookingRef = db.collection("bookings").doc(bookingId);

    const updateData = {
        "paymentInfo.status": paymentInfoStatus,
        "paymentInfo.provider": "bold",
        "paymentInfo.transactionId": paymentData.payment_id || "unknown",
        "paymentInfo.reference": reference,
        "paymentInfo.amountPaid": paymentData.amount?.total || paymentData.amount?.total_amount || 0,
        "paymentInfo.currency": paymentData.amount?.currency || "COP",
        "paymentInfo.lastUpdate": new Date(),
        "updatedAt": new Date()
    };

    if (paymentData.payment_method) {
        updateData["paymentInfo.paymentMethod"] = paymentData.payment_method;
    }

    if (bookingStatus) {
        updateData.status = bookingStatus;
        if (bookingStatus === "paid") {
            updateData["paymentInfo.paidAt"] = new Date();
        }
    }

    await bookingRef.update(updateData);

    // 🔔 Notify Admin (Telegram) - For all critical statuses
    try {
        const bookingSnap = await bookingRef.get();
        const bookingData = bookingSnap.data();
        const customerName = bookingData?.customer?.name || "Desconocido";

        const paymentMsg = `${notificationEmoji} <b>ACTUALIZACIÓN DE PAGO (Bold)</b>\n\n` +
          `👤 <b>Cliente:</b> ${customerName}\n` +
          `🆔 <b>Booking ID:</b> <code>${bookingId}</code>\n` +
          `🧾 <b>Ref Pago:</b> <code>${reference}</code>\n` +
          `💰 <b>Monto:</b> $${(updateData["paymentInfo.amountPaid"] || 0).toLocaleString()}\n` +
          `💳 <b>Método:</b> ${updateData["paymentInfo.paymentMethod"] || 'N/A'}\n` +
          `📢 <b>Estado:</b> ${statusText}`;
        
        sendTelegramAlert(paymentMsg).catch(console.error);
    } catch (err) {
        console.error("Error sending notification:", err);
    }

    console.log(`✅ [WEBHOOK SUCCESS] Booking ${bookingId} updated to ${paymentInfoStatus}.`);

    res.status(200).json({ received: true });

  } catch (error) {
    console.error("❌ [WEBHOOK ERROR]:", error.message);
    res.status(500).json({ error: error.message });
  }
};