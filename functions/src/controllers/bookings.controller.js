const admin = require("firebase-admin");
const { COLLECTIONS, BOOKING_STATUS, DEPARTURE_TYPES, DEPARTURE_STATUS } = require("../constants");
const { parseToNoonUTC } = require("../utils/dateUtils");
const { sendTelegramAlert } = require("../utils/notifications");

const db = admin.firestore();

/**
 * Create Booking (Admin Flow)
 * ALWAYS creates a new departure - never joins existing ones
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @return {Promise<void>}
 */
exports.createBooking = async (req, res) => {
  try {
    const { tourId, date, pax, customer, type } = req.body;
    const bookingDate = parseToNoonUTC(date);

    if (!type || !Object.values(DEPARTURE_TYPES).includes(type)) {
      return res.status(400).json({ error: "Invalid 'type'. Must be 'private' or 'public'" });
    }

    let departureId;
    let bookingId;
    let pricePerPax;
    let tourName;

    await db.runTransaction(async (t) => {
      // 1. Get Tour for pricing snapshot
      const tourRef = db.collection(COLLECTIONS.TOURS).doc(tourId);
      const tourDoc = await t.get(tourRef);

      if (!tourDoc.exists) {
        throw new Error("Tour not found");
      }

      const tourData = tourDoc.data();
      tourName = tourData.name?.es || tourData.name?.en || "Tour Desconocido";

      // 2. Create NEW Departure (Admin ALWAYS creates new)
      const newDepData = {
        tourId,
        date: bookingDate,
        type: type,
        status: DEPARTURE_STATUS.OPEN,
        maxPax: 8, // FIXED: Always 8 per user request (Public & Private)
        currentPax: pax, // Start with booking's pax
        pricingSnapshot: tourData.pricingTiers,
        createdAt: new Date(),
      };

      const departureRef = db.collection(COLLECTIONS.DEPARTURES).doc();
      t.set(departureRef, newDepData);
      departureId = departureRef.id;

      // 3. Calculate Price from tour's pricing tiers
      const tiers = tourData.pricingTiers;
      const tier = tiers.find((t) => pax >= t.minPax && pax <= t.maxPax);

      if (!tier) {
        throw new Error(`Invalid pax count (${pax}) for pricing tiers`);
      }

      pricePerPax = tier.priceCOP;

      // 4. Create Booking
      const newBooking = {
        departureId: departureRef.id,
        type: type, // FIXED: Added type field to match schema
        customer,
        pax,
        originalPrice: pricePerPax * pax,
        finalPrice: pricePerPax * pax,
        status: BOOKING_STATUS.PENDING,
        createdAt: new Date(),
      };

      const bookingRef = db.collection(COLLECTIONS.BOOKINGS).doc();
      t.set(bookingRef, newBooking);
      bookingId = bookingRef.id;
    });

    // 🔔 Notify Admin (Telegram)
    const alertMsg = `👮‍♂️ <b>Nueva Reserva (Admin)</b>\n\n` +
      `👤 <b>Cliente:</b> ${customer.name}\n` +
      `🏔 <b>Tour:</b> ${tourName}\n` +
      `📞 <b>Tel:</b> ${customer.phone}\n` +
      `📅 <b>Fecha:</b> ${date}\n` +
      `👥 <b>Pax:</b> ${pax}\n` +
      `💰 <b>Total:</b> $${(pricePerPax * pax).toLocaleString()} (Pendiente)\n` +
      `🆔 <b>ID:</b> <code>${bookingId}</code>`;

    // Note: We don't await this so the client doesn't wait
    sendTelegramAlert(alertMsg).catch(console.error);

    return res.status(201).json({
      success: true,
      departureId,
      bookingId,
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Join Booking (Public Flow - Join Existing Departure)
 * Public users join a specific existing public departure
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @return {Promise<void>}
 */
exports.joinBooking = async (req, res) => {
  try {
    const { tourId, date, pax, customer, departureId } = req.body;

    if (!departureId) {
      return res.status(400).json({ error: "departureId is required to join a departure" });
    }

    let bookingId;
    let pricePerPax;
    let tourName;

    await db.runTransaction(async (t) => {
      // 1. Get Departure
      const depRef = db.collection(COLLECTIONS.DEPARTURES).doc(departureId);
      const depDoc = await t.get(depRef);

      if (!depDoc.exists) {
        throw new Error("Departure not found");
      }

      const depData = depDoc.data();

      // 1.1 Fetch Tour Name (for notification)
      const tourRef = db.collection(COLLECTIONS.TOURS).doc(depData.tourId);
      const tourDoc = await t.get(tourRef);
      if (tourDoc.exists) {
        const tourData = tourDoc.data();
        tourName = tourData.name?.es || tourData.name?.en || "Tour Desconocido";
      } else {
        tourName = "Tour Desconocido";
      }

      // 2. Validate Departure is Public and Open
      if (depData.type !== DEPARTURE_TYPES.PUBLIC) {
        throw new Error("Can only join public departures");
      }

      if (depData.status !== DEPARTURE_STATUS.OPEN) {
        throw new Error("Departure is not open for bookings");
      }

      // 3. Validate Capacity
      if (depData.currentPax + pax > depData.maxPax) {
        throw new Error(
          `Insufficient capacity. Available: ${depData.maxPax - depData.currentPax}, Requested: ${pax}`,
        );
      }

      // 4. Calculate Price from departure's pricing snapshot
      const tiers = depData.pricingSnapshot;
      const tier = tiers.find((t) => pax >= t.minPax && pax <= t.maxPax);

      if (!tier) {
        throw new Error(`Invalid pax count (${pax}) for pricing tiers`);
      }

      pricePerPax = tier.priceCOP;

      // 5. Create Booking
      const newBooking = {
        departureId: departureId,
        type: DEPARTURE_TYPES.PUBLIC,
        customer,
        pax,
        originalPrice: pricePerPax * pax,
        finalPrice: pricePerPax * pax,
        status: BOOKING_STATUS.PENDING,
        createdAt: new Date(),
      };

      const bookingRef = db.collection(COLLECTIONS.BOOKINGS).doc();
      t.set(bookingRef, newBooking);
      bookingId = bookingRef.id;

      // 6. Update Departure Capacity (manual calculation)
      const newCurrentPax = depData.currentPax + pax;
      t.update(depRef, {
        currentPax: newCurrentPax,
        updatedAt: new Date(),
      });
    });

    // 🔔 Notify Admin (Telegram)
    const alertMsg = `🚀 <b>Nueva Reserva (Public Join)</b>\n\n` +
      `👤 <b>Cliente:</b> ${customer.name}\n` +
      `🏔 <b>Tour:</b> ${tourName}\n` +
      `📞 <b>Tel:</b> ${customer.phone}\n` +
      `📅 <b>Fecha:</b> ${new Date(date || Date.now()).toISOString().split('T')[0]}\n` + // Date might be missing in join, careful
      `👥 <b>Pax:</b> ${pax}\n` +
      `💰 <b>Total:</b> $${(pricePerPax * pax).toLocaleString()} (Pendiente)\n` +
      `🆔 <b>ID:</b> <code>${bookingId}</code>`;

    sendTelegramAlert(alertMsg).catch(console.error);

    return res.status(201).json({
      success: true,
      bookingId,
      departureId,
    });
  } catch (error) {
    console.error("Error joining booking:", error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Create Private Booking (Public Flow - Always New Private Departure)
 * Public users create a new private departure
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @return {Promise<void>}
 */
exports.createPrivateBooking = async (req, res) => {
  try {
    const { tourId, date, pax, customer } = req.body;
    const bookingDate = parseToNoonUTC(date);

    let departureId;
    let bookingId;
    let pricePerPax;
    let tourName;

    await db.runTransaction(async (t) => {
      // 1. Get Tour for pricing
      const tourRef = db.collection(COLLECTIONS.TOURS).doc(tourId);
      const tourDoc = await t.get(tourRef);

      if (!tourDoc.exists) {
        throw new Error("Tour not found");
      }

      const tourData = tourDoc.data();
      tourName = tourData.name?.es || tourData.name?.en || "Tour Desconocido";

      // 2. Create NEW Private Departure
      const newDepData = {
        tourId,
        date: bookingDate,
        type: DEPARTURE_TYPES.PRIVATE,
        status: DEPARTURE_STATUS.OPEN,
        maxPax: 8, // FIXED: Changed from 99 to 8 per user request
        currentPax: pax,
        pricingSnapshot: tourData.pricingTiers,
        createdAt: new Date(),
      };

      const departureRef = db.collection(COLLECTIONS.DEPARTURES).doc();
      t.set(departureRef, newDepData);
      departureId = departureRef.id;

      // 3. Calculate Price
      const tiers = tourData.pricingTiers;
      const tier = tiers.find((t) => pax >= t.minPax && pax <= t.maxPax);

      if (!tier) {
        throw new Error(`Invalid pax count (${pax}) for pricing tiers`);
      }

      pricePerPax = tier.priceCOP;

      // 4. Create Booking
      const newBooking = {
        departureId: departureRef.id,
        customer,
        pax,
        originalPrice: pricePerPax * pax,
        finalPrice: pricePerPax * pax,
        status: BOOKING_STATUS.PENDING,
        createdAt: new Date(),
      };

      const bookingRef = db.collection(COLLECTIONS.BOOKINGS).doc();
      t.set(bookingRef, newBooking);
      bookingId = bookingRef.id;
    });

    // 🔔 Notify Admin (Telegram)
    const alertMsg = `💎 <b>Nueva Reserva (Privada)</b>\n\n` +
      `👤 <b>Cliente:</b> ${customer.name}\n` +
      `🏔 <b>Tour:</b> ${tourName}\n` +
      `📞 <b>Tel:</b> ${customer.phone}\n` +
      `📅 <b>Fecha:</b> ${date}\n` +
      `👥 <b>Pax:</b> ${pax}\n` +
      `💰 <b>Total:</b> $${(pricePerPax * pax).toLocaleString()} (Pendiente)\n` +
      `🆔 <b>ID:</b> <code>${bookingId}</code>`;

    sendTelegramAlert(alertMsg).catch(console.error);

    return res.status(201).json({
      success: true,
      departureId,
      bookingId,
    });
  } catch (error) {
    console.error("Error creating private booking:", error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Update Booking Status
 * Handles cascade effects on departure capacity
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @return {Promise<void>}
 */
exports.updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !Object.values(BOOKING_STATUS).includes(status)) {
      return res.status(400).json({
        error: "Invalid status. Must be: pending, confirmed, paid, or cancelled",
      });
    }

    await db.runTransaction(async (t) => {
      // 1. Read Booking
      const bookingRef = db.collection(COLLECTIONS.BOOKINGS).doc(id);
      const bookingDoc = await t.get(bookingRef);

      if (!bookingDoc.exists) {
        throw new Error("Booking not found");
      }

      const bookingData = bookingDoc.data();
      const oldStatus = bookingData.status;

      // 2. Read Departure
      const depRef = db.collection(COLLECTIONS.DEPARTURES).doc(bookingData.departureId);
      const depDoc = await t.get(depRef);

      if (!depDoc.exists) {
        throw new Error("Departure not found");
      }

      const depData = depDoc.data();

      // 3. Calculate capacity changes & Validate Irreversibility

      // CRITICAL: Cancellation is IRREVERSIBLE
      if (oldStatus === BOOKING_STATUS.CANCELLED && status !== BOOKING_STATUS.CANCELLED) {
        throw new Error("Cannot reactivate a cancelled booking. Please create a new booking.");
      }

      let newCurrentPax = depData.currentPax;
      let shouldCancelDeparture = false;

      // Changing TO cancelled
      if (status === BOOKING_STATUS.CANCELLED && oldStatus !== BOOKING_STATUS.CANCELLED) {
        // Free up space
        newCurrentPax = Math.max(0, depData.currentPax - bookingData.pax);

        // If Private Departure -> Cancel Departure too
        if (depData.type === DEPARTURE_TYPES.PRIVATE) {
          shouldCancelDeparture = true;
        }
      }

      // 4. Update Booking
      t.update(bookingRef, {
        status,
        updatedAt: new Date(),
      });

      // 5. Update Departure
      const depUpdates = {
        updatedAt: new Date(),
      };

      if (newCurrentPax !== depData.currentPax) {
        depUpdates.currentPax = newCurrentPax;
      }

      if (shouldCancelDeparture) {
        depUpdates.status = DEPARTURE_STATUS.CANCELLED;
      }

      if (shouldCancelDeparture) {
        depUpdates.status = DEPARTURE_STATUS.CANCELLED;
      }

      t.update(depRef, depUpdates);
    });

    return res.status(200).json({ success: true, message: "Booking status updated" });
  } catch (error) {
    console.error("Error updating booking status:", error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Update Booking Pax
 * Handles cascade effects on departure capacity and price recalculation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @return {Promise<void>}
 */
exports.updateBookingPax = async (req, res) => {
  try {
    const { id } = req.params;
    const { pax } = req.body;

    if (!pax || typeof pax !== "number" || pax <= 0) {
      return res.status(400).json({ error: "Invalid pax. Must be a positive number" });
    }

    await db.runTransaction(async (t) => {
      // 1. Read Booking
      const bookingRef = db.collection(COLLECTIONS.BOOKINGS).doc(id);
      const bookingDoc = await t.get(bookingRef);

      if (!bookingDoc.exists) {
        throw new Error("Booking not found");
      }

      const bookingData = bookingDoc.data();
      const oldPax = bookingData.pax;
      const diff = pax - oldPax;

      // 2. Read Departure
      const depRef = db.collection(COLLECTIONS.DEPARTURES).doc(bookingData.departureId);
      const depDoc = await t.get(depRef);

      if (!depDoc.exists) {
        throw new Error("Departure not found");
      }

      const depData = depDoc.data();

      // 3. Validate capacity if increasing
      if (diff > 0) {
        if (depData.currentPax + diff > depData.maxPax) {
          throw new Error(
            `Insufficient capacity. Available: ${depData.maxPax - depData.currentPax}, Requested increase: ${diff}`,
          );
        }
      }

      // 4. Recalculate price based on new tier
      const tiers = depData.pricingSnapshot;
      const tier = tiers.find((t) => pax >= t.minPax && pax <= t.maxPax);

      if (!tier) {
        throw new Error(`Invalid pax count (${pax}) for pricing tiers`);
      }

      const newOriginalPrice = tier.priceCOP * pax;

      // Preserve discount ratio
      const discountRatio = bookingData.finalPrice / bookingData.originalPrice;
      const newFinalPrice = Math.round(newOriginalPrice * discountRatio);

      // 5. Update Booking
      t.update(bookingRef, {
        pax,
        originalPrice: newOriginalPrice,
        finalPrice: newFinalPrice,
        updatedAt: new Date(),
      });

      // 6. Update Departure capacity
      const newCurrentPax = depData.currentPax + diff;
      t.update(depRef, {
        currentPax: Math.max(0, newCurrentPax),
        updatedAt: new Date(),
      });
    });

    return res.status(200).json({ success: true, message: "Booking pax updated" });
  } catch (error) {
    console.error("Error updating booking pax:", error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Update Booking Details (Customer Info Only)
 * No cascade effects
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @return {Promise<void>}
 */
exports.updateBookingDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { customer } = req.body;

    if (!customer || typeof customer !== "object") {
      return res.status(400).json({ error: "Missing 'customer' object" });
    }

    // Validate required customer fields
    const requiredFields = ["name", "email", "phone", "document"];
    for (const field of requiredFields) {
      if (!customer[field] || typeof customer[field] !== "string") {
        return res.status(400).json({
          error: `Invalid or missing customer field: '${field}'`,
        });
      }
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customer.email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    await db.collection(COLLECTIONS.BOOKINGS).doc(id).update({
      customer,
      updatedAt: new Date(),
    });

    return res.status(200).json({ success: true, message: "Booking details updated" });
  } catch (error) {
    console.error("Error updating booking details:", error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Convert Booking Type (Public <-> Private)
 * Handles three scenarios based on current state
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @return {Promise<void>}
 */
exports.convertBookingType = async (req, res) => {
  try {
    const { id } = req.params;

    let scenario = "";
    let newDepartureId = null;

    await db.runTransaction(async (t) => {
      // 1. Read Booking
      const bookingRef = db.collection(COLLECTIONS.BOOKINGS).doc(id);
      const bookingDoc = await t.get(bookingRef);

      if (!bookingDoc.exists) {
        throw new Error("Booking not found");
      }

      const bookingData = bookingDoc.data();

      // 2. Read Departure
      const depRef = db.collection(COLLECTIONS.DEPARTURES).doc(bookingData.departureId);
      const depDoc = await t.get(depRef);

      if (!depDoc.exists) {
        throw new Error("Departure not found");
      }

      const depData = depDoc.data();

      // 3. Determine scenario and execute conversion
      if (depData.type === DEPARTURE_TYPES.PRIVATE) {
        // CASE 1: Private -> Public
        scenario = "private_to_public";

        // Validate capacity fits in public limit
        if (depData.currentPax > 8) {
          throw new Error(
            `Cannot convert to public: Current capacity (${depData.currentPax}) exceeds public limit (8)`,
          );
        }

        // Convert departure to public
        t.update(depRef, {
          type: DEPARTURE_TYPES.PUBLIC,
          maxPax: 8,
          updatedAt: new Date(),
        });

        // Update booking type
        t.update(bookingRef, {
          type: DEPARTURE_TYPES.PUBLIC,
          updatedAt: new Date(),
        });
      } else {
        // Departure is PUBLIC
        if (depData.currentPax > bookingData.pax) {
          // CASE 2: Public (with others) -> Split to Private
          scenario = "public_to_private_split";

          // Create new private departure
          const newDepRef = db.collection(COLLECTIONS.DEPARTURES).doc();
          const newDepData = {
            tourId: depData.tourId,
            date: depData.date,
            type: DEPARTURE_TYPES.PRIVATE,
            status: depData.status,
            maxPax: 99,
            currentPax: bookingData.pax,
            pricingSnapshot: depData.pricingSnapshot,
            createdAt: new Date(),
          };

          t.set(newDepRef, newDepData);
          newDepartureId = newDepRef.id;

          // Update old departure (reduce capacity)
          const newCurrentPax = depData.currentPax - bookingData.pax;
          t.update(depRef, {
            currentPax: newCurrentPax,
            updatedAt: new Date(),
          });

          // Update booking to point to new departure
          t.update(bookingRef, {
            departureId: newDepRef.id,
            type: DEPARTURE_TYPES.PRIVATE,
            updatedAt: new Date(),
          });
        } else {
          // CASE 3: Public (alone) -> Convert to Private
          scenario = "public_to_private_convert";

          // Convert departure to private
          t.update(depRef, {
            type: DEPARTURE_TYPES.PRIVATE,
            maxPax: 99,
            updatedAt: new Date(),
          });

          // Update booking type
          t.update(bookingRef, {
            type: DEPARTURE_TYPES.PRIVATE,
            updatedAt: new Date(),
          });
        }
      }
    });

    return res.status(200).json({
      success: true,
      message: "Booking type converted",
      scenario,
      newDepartureId,
    });
  } catch (error) {
    console.error("Error converting booking type:", error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Move Booking to another Tour/Date
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @return {Promise<void>}
 */
exports.moveBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { newTourId, newDate } = req.body;

    if (!newTourId || !newDate) {
      return res.status(400).json({ error: "newTourId and newDate are required" });
    }

    const targetDate = new Date(newDate);

    await db.runTransaction(async (t) => {
      // 1. ALL READS FIRST
      const bookingRef = db.collection(COLLECTIONS.BOOKINGS).doc(id);
      const bookingDoc = await t.get(bookingRef);

      if (!bookingDoc.exists) {
        throw new Error("Booking not found");
      }

      const bookingData = bookingDoc.data();
      const oldDepartureId = bookingData.departureId;

      const oldDepRef = db.collection(COLLECTIONS.DEPARTURES).doc(oldDepartureId);
      const oldDepDoc = await t.get(oldDepRef);

      if (!oldDepDoc.exists) {
        throw new Error("Old departure not found");
      }

      const oldDepData = oldDepDoc.data();

      // 2. Find or Create Target Departure
      let targetDepRef;
      let targetDepData;

      // Create start and end of day for range query (UTC)
      const startOfDay = new Date(targetDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      
      const endOfDay = new Date(targetDate);
      endOfDay.setUTCHours(23, 59, 59, 999);

      const existing = await db.collection(COLLECTIONS.DEPARTURES)
        .where("tourId", "==", newTourId)
        .where("date", ">=", startOfDay)
        .where("date", "<=", endOfDay)
        .where("type", "==", DEPARTURE_TYPES.PUBLIC)
        .where("status", "==", DEPARTURE_STATUS.OPEN)
        .get();

      if (!existing.empty) {
        const dep = existing.docs[0];
        const depData = dep.data();
        if (depData.currentPax + bookingData.pax <= depData.maxPax) {
          targetDepRef = dep.ref;
          targetDepData = depData;
        }
      }

      if (!targetDepRef) {
        const tourDoc = await t.get(db.collection(COLLECTIONS.TOURS).doc(newTourId));
        if (!tourDoc.exists) throw new Error("Target Tour not found");

        const newDepData = {
          tourId: newTourId,
          date: targetDate,
          type: DEPARTURE_TYPES.PRIVATE,
          status: DEPARTURE_STATUS.OPEN,
          maxPax: 99,
          currentPax: 0,
          pricingSnapshot: tourDoc.data().pricingTiers,
          createdAt: new Date(),
        };
        targetDepRef = db.collection(COLLECTIONS.DEPARTURES).doc();
        targetDepData = newDepData;
        t.set(targetDepRef, newDepData);
      }

      // 3. ALL WRITES AT THE END
      // Update Old Departure (Decrement)
      const newOldCurrentPax = oldDepData.currentPax - bookingData.pax;

      if (newOldCurrentPax <= 0) {
        // Delete if empty
        t.delete(oldDepRef);
      } else {
        t.update(oldDepRef, {
          currentPax: newOldCurrentPax,
          updatedAt: new Date(),
        });
      }

      // Update Target Departure (Increment)
      const newTargetCurrentPax = targetDepData.currentPax + bookingData.pax;
      t.update(targetDepRef, {
        currentPax: newTargetCurrentPax,
        updatedAt: new Date(),
      });

      // Update Booking
      t.update(bookingRef, {
        departureId: targetDepRef.id,
        updatedAt: new Date(),
      });
    });

    return res.status(200).json({ success: true, message: "Booking moved successfully" });
  } catch (error) {
    console.error("Error moving booking:", error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Apply Discount to Booking
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @return {Promise<void>}
 */
exports.applyDiscount = async (req, res) => {
  try {
    const { id } = req.params;
    const { discountAmount, newFinalPrice, reason } = req.body;

    if (newFinalPrice === undefined && discountAmount === undefined) {
      return res.status(400).json({ error: "Must provide discountAmount or newFinalPrice" });
    }

    await db.runTransaction(async (t) => {
      const bookingRef = db.collection(COLLECTIONS.BOOKINGS).doc(id);
      const doc = await t.get(bookingRef);

      if (!doc.exists) {
        throw new Error("Booking not found");
      }

      const currentData = doc.data();
      let finalPrice = currentData.finalPrice;

      if (newFinalPrice !== undefined) {
        finalPrice = newFinalPrice;
      } else if (discountAmount !== undefined) {
        finalPrice = currentData.originalPrice - discountAmount;
      }

      if (finalPrice < 0) finalPrice = 0;

      t.update(bookingRef, {
        finalPrice,
        discountReason: reason || "Admin applied discount",
        updatedAt: new Date(),
      });
    });

    return res.status(200).json({ success: true, message: "Discount applied" });
  } catch (error) {
    console.error("Error applying discount:", error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Get Bookings (Admin)
 * Optional filters: departureId, status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @return {Promise<void>}
 */
exports.getBookings = async (req, res) => {
  try {
    const { departureId, status } = req.query;
    const db = admin.firestore();
    let query = db.collection(COLLECTIONS.BOOKINGS);

    if (departureId) {
      query = query.where("departureId", "==", departureId);
    }

    if (status) {
      query = query.where("status", "==", status);
    }

    const snapshot = await query.get();
    const bookings = snapshot.docs.map((doc) => ({ bookingId: doc.id, ...doc.data() }));

    res.json(bookings);
  } catch (error) {
    console.error("Error getting bookings:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get Single Booking
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @return {Promise<void>}
 */
exports.getBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const db = admin.firestore();
    const doc = await db.collection(COLLECTIONS.BOOKINGS).doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.json({ bookingId: doc.id, ...doc.data() });
  } catch (error) {
    console.error("Error getting booking:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Public: Get basic booking status for polling (No PII)
 * GET /public/bookings/:bookingId
 */
exports.getBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const db = admin.firestore();

    const bookingSnap = await db.collection("bookings").doc(bookingId).get();

    if (!bookingSnap.exists) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const booking = bookingSnap.data();

    // Mapping internal payment info to public status
    let paymentStatus = "pending";
    const internalPaymentStatus = booking.paymentInfo?.status;

    if (internalPaymentStatus === "paid") {
      paymentStatus = "approved";
    } else if (internalPaymentStatus === "failed") {
      paymentStatus = "rejected";
    } else if (internalPaymentStatus === "expired") {
      paymentStatus = "expired";
    } else if (internalPaymentStatus === "voided") {
      paymentStatus = "voided";
    }

    // Response strictly limited to non-PII data
    res.json({
      bookingId: bookingId,
      status: booking.status === "paid" ? "confirmed" : booking.status,
      paymentStatus: paymentStatus,
      paymentRef: booking.paymentInfo?.reference || null
    });

  } catch (error) {
    console.error("Error fetching booking status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};