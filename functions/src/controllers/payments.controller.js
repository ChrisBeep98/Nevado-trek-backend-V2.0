const admin = require("firebase-admin");
const crypto = require("crypto");
const { defineString } = require("firebase-functions/params");
const { sendTelegramAlert } = require("../utils/notifications");

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
    
    // Calculate 30% Deposit + 5% Tax logic
    const totalBookingValue = booking.finalPrice || booking.originalPrice;
    const depositBase = Math.round(totalBookingValue * 0.30); // 30% Base Deposit
    const tax = Math.round(depositBase * 0.05); // 5% Tax on the deposit
    const amount = depositBase + tax; // Total amount to charge in Bold (Deposit + Tax)
    
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
      description: `Reserva Nevado Trek (Depósito 30%) - ${bookingId}`,
      tax: tax,
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

    switch (eventType) {
        case "SALE_APPROVED":
            paymentInfoStatus = "paid";
            bookingStatus = "paid";
            break;
        case "SALE_REJECTED":
            paymentInfoStatus = "failed";
            break;
        case "VOID_APPROVED":
            paymentInfoStatus = "voided";
            bookingStatus = "cancelled";
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
        "paymentInfo.amountPaid": paymentData.amount?.total || paymentData.amount?.total_amount || 0, // 💰 Exact amount from gateway
        "paymentInfo.currency": paymentData.amount?.currency || "COP",
        "paymentInfo.lastUpdate": new Date(),
        "updatedAt": new Date()
    };

    if (paymentData.payment_method) {
        updateData["paymentInfo.paymentMethod"] = paymentData.payment_method;
    }

    if (paymentInfoStatus === "paid") {
        updateData["paymentInfo.paidAt"] = new Date();
        updateData.status = "paid";

        // Fetch booking data for richer notification
        try {
            const bookingSnap = await bookingRef.get();
            const bookingData = bookingSnap.data();
            const customerName = bookingData?.customer?.name || "Desconocido";

            // 🔔 Notify Admin (Telegram)
            const paymentMsg = `🤑 <b>PAGO RECIBIDO (Bold)</b>\n\n` +
              `👤 <b>Cliente:</b> ${customerName}\n` +
              `🆔 <b>Booking ID:</b> <code>${bookingId}</code>\n` +
              `🧾 <b>Ref Pago:</b> <code>${reference}</code>\n` +
              `💰 <b>Monto:</b> $${(updateData["paymentInfo.amountPaid"] || 0).toLocaleString()}\n` +
              `💳 <b>Método:</b> ${updateData["paymentInfo.paymentMethod"] || 'N/A'}\n` +
              `✅ <b>Estado:</b> APROBADO`;
            
            sendTelegramAlert(paymentMsg).catch(console.error);
        } catch (err) {
            console.error("Error fetching booking details for notification:", err);
            // Fallback notification if fetch fails
             const fallbackMsg = `🤑 <b>PAGO RECIBIDO (Bold)</b>\n\n` +
              `🆔 <b>Ref:</b> <code>${reference}</code>\n` +
              `💰 <b>Monto:</b> $${(updateData["paymentInfo.amountPaid"] || 0).toLocaleString()}\n` +
              `✅ <b>Estado:</b> APROBADO`;
             sendTelegramAlert(fallbackMsg).catch(console.error);
        }
    }

    await bookingRef.update(updateData);
    console.log(`✅ [WEBHOOK SUCCESS] Booking ${bookingId} updated to ${paymentInfoStatus}. Amount: ${updateData["paymentInfo.amountPaid"]}`);

    res.status(200).json({ received: true });

  } catch (error) {
    console.error("❌ [WEBHOOK ERROR]:", error.message);
    res.status(500).json({ error: error.message });
  }
};