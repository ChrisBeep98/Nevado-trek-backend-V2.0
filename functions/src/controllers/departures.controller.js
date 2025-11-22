const admin = require("firebase-admin");
const { COLLECTIONS, DEPARTURE_TYPES, DEPARTURE_STATUS } = require("../constants");

const db = admin.firestore();

/**
 * Create Departure
 * Can be created explicitly by admin or implicitly via booking
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @return {Promise<void>}
 */
exports.createDeparture = async (req, res) => {
  try {
    const { tourId, date, type, maxPax } = req.body;

    // Validate Tour exists
    const tourDoc = await db.collection(COLLECTIONS.TOURS).doc(tourId).get();
    if (!tourDoc.exists) {
      return res.status(404).json({ error: "Tour not found" });
    }
    const tourData = tourDoc.data();

    const newDeparture = {
      tourId,
      date: new Date(date), // Ensure date object
      type: type || DEPARTURE_TYPES.PRIVATE,
      status: DEPARTURE_STATUS.OPEN,
      maxPax: maxPax || (type === DEPARTURE_TYPES.PUBLIC ? 8 : 99),
      currentPax: 0,
      pricingSnapshot: tourData.pricingTiers, // Snapshot pricing
      createdAt: new Date(),
    };

    const docRef = await db.collection(COLLECTIONS.DEPARTURES).add(newDeparture);

    return res.status(201).json({
      success: true,
      departureId: docRef.id,
      data: newDeparture,
    });
  } catch (error) {
    console.error("Error creating departure:", error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Get Departures (Calendar View)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @return {Promise<void>}
 */
exports.getDepartures = async (req, res) => {
  try {
    const { start, end } = req.query;
    let query = db.collection(COLLECTIONS.DEPARTURES);

    if (start && end) {
      query = query
        .where("date", ">=", new Date(start))
        .where("date", "<=", new Date(end));
    }

    const snapshot = await query.get();
    const departures = snapshot.docs.map((doc) => ({
      departureId: doc.id,
      ...doc.data(),
      // Convert Timestamp to ISO string for JSON
      date: doc.data().date.toDate().toISOString(),
    }));

    return res.status(200).json(departures);
  } catch (error) {
    console.error("Error getting departures:", error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Get Single Departure
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @return {Promise<void>}
 */
exports.getDeparture = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await db.collection(COLLECTIONS.DEPARTURES).doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Departure not found" });
    }

    const data = doc.data();
    return res.status(200).json({
      departureId: doc.id,
      ...data,
      // Convert Timestamp to ISO string for JSON
      date: data.date.toDate().toISOString(),
    });
  } catch (error) {
    console.error("Error getting departure:", error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Update Departure
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @return {Promise<void>}
 */
exports.updateDeparture = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    await db.runTransaction(async (t) => {
      const depRef = db.collection(COLLECTIONS.DEPARTURES).doc(id);
      const depDoc = await t.get(depRef);

      if (!depDoc.exists) {
        throw new Error("Departure not found");
      }

      const currentData = depDoc.data();

      // 1. Handle Date Change
      // Just update the field. Bookings follow automatically.
      if (updates.date) {
        updates.date = new Date(updates.date);
      }

      // 2. Handle Tour Change -> Update Pricing Snapshot
      if (updates.tourId && updates.tourId !== currentData.tourId) {
        const tourDoc = await t.get(db.collection(COLLECTIONS.TOURS).doc(updates.tourId));
        if (!tourDoc.exists) throw new Error("New Tour not found");

        updates.pricingSnapshot = tourDoc.data().pricingTiers;
      }

      // 3. Handle Type Change -> Update MaxPax
      if (updates.type && updates.type !== currentData.type) {
        if (updates.type === DEPARTURE_TYPES.PUBLIC) {
          // Switching to Public
          const newMax = updates.maxPax || 8;
          if (currentData.currentPax > newMax) {
            throw new Error(
              `Cannot switch to Public: Current bookings (${currentData.currentPax}) exceed limit (${newMax})`,
            );
          }
          updates.maxPax = newMax;
        } else {
          // Switching to Private
          updates.maxPax = updates.maxPax || 99;
        }
      }

      t.update(depRef, updates);
    });

    return res.status(200).json({ success: true, message: "Departure updated" });
  } catch (error) {
    console.error("Error updating departure:", error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Split Booking from Departure (Create new Private Departure)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @return {Promise<void>}
 */
exports.splitDeparture = async (req, res) => {
  try {
    const { id } = req.params; // Departure ID
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ error: "bookingId is required" });
    }

    await db.runTransaction(async (t) => {
      // 1. Get Original Departure
      const depRef = db.collection(COLLECTIONS.DEPARTURES).doc(id);
      const depDoc = await t.get(depRef);
      if (!depDoc.exists) throw new Error("Departure not found");
      const depData = depDoc.data();

      // 2. Get Booking
      const bookingRef = db.collection(COLLECTIONS.BOOKINGS).doc(bookingId);
      const bookingDoc = await t.get(bookingRef);
      if (!bookingDoc.exists) throw new Error("Booking not found");
      const bookingData = bookingDoc.data();

      if (bookingData.departureId !== id) {
        throw new Error("Booking does not belong to this departure");
      }

      // 3. Create New Private Departure
      const newDepRef = db.collection(COLLECTIONS.DEPARTURES).doc();
      const newDepData = {
        ...depData,
        type: DEPARTURE_TYPES.PRIVATE,
        maxPax: 99, // Flexible for private
        currentPax: bookingData.pax,
        createdAt: new Date(),
        // Keep same tour, date, pricing snapshot
      };
      // Remove ID if copied
      delete newDepData.id;

      t.set(newDepRef, newDepData);

      // 4. Update Original Departure (Reduce Pax)
      const newCurrentPax = depData.currentPax - bookingData.pax;
      t.update(depRef, {
        currentPax: newCurrentPax,
        updatedAt: new Date(),
      });

      // 5. Update Booking (Link to new Departure)
      t.update(bookingRef, {
        departureId: newDepRef.id,
        updatedAt: new Date(),
      });
    });

    return res.status(200).json({ success: true, message: "Departure split successfully" });
  } catch (error) {
    console.error("Error splitting departure:", error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Safe Delete Departure
 * Only allowed if currentPax is 0
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @return {Promise<void>}
 */
exports.deleteDeparture = async (req, res) => {
  try {
    const { id } = req.params;
    const depRef = db.collection(COLLECTIONS.DEPARTURES).doc(id);

    await db.runTransaction(async (t) => {
      const doc = await t.get(depRef);
      if (!doc.exists) throw new Error("Departure not found");

      if (doc.data().currentPax > 0) {
        throw new Error("Cannot delete departure with active bookings. Move bookings first.");
      }

      t.delete(depRef);
    });

    return res.status(200).json({ success: true, message: "Departure deleted" });
  } catch (error) {
    console.error("Error deleting departure:", error);
    return res.status(400).json({ error: error.message });
  }
};

/**
 * Update Departure Date
 * Updates departure date and all associated bookings
 */
exports.updateDepartureDate = async (req, res) => {
  try {
    const { id } = req.params;
    const { newDate } = req.body;

    const targetDate = new Date(newDate);

    await db.runTransaction(async (t) => {
      // 1. Update Departure
      const depRef = db.collection(COLLECTIONS.DEPARTURES).doc(id);
      const depDoc = await t.get(depRef);

      if (!depDoc.exists) {
        throw new Error('Departure not found');
      }

      t.update(depRef, {
        date: targetDate,
        updatedAt: new Date()
      });

      // 2. No need to update bookings - they reference departure by ID
      // Date is stored in departure, not duplicated in bookings
    });

    return res.status(200).json({
      success: true,
      message: 'Departure date updated'
    });
  } catch (error) {
    console.error('Error updating departure date:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Update Departure Tour
 * Updates departure tour, pricing snapshot, and recalculates all booking prices
 */
exports.updateDepartureTour = async (req, res) => {
  try {
    const { id } = req.params;
    const { newTourId } = req.body;

    await db.runTransaction(async (t) => {
      // 1. Get new tour for pricing
      const tourRef = db.collection(COLLECTIONS.TOURS).doc(newTourId);
      const tourDoc = await t.get(tourRef);

      if (!tourDoc.exists) {
        throw new Error('Tour not found');
      }

      const tourData = tourDoc.data();

      // 2. Update Departure
      const depRef = db.collection(COLLECTIONS.DEPARTURES).doc(id);
      const depDoc = await t.get(depRef);

      if (!depDoc.exists) {
        throw new Error('Departure not found');
      }

      t.update(depRef, {
        tourId: newTourId,
        pricingSnapshot: tourData.pricingTiers,
        updatedAt: new Date()
      });

      // 3. Recalculate all booking prices
      const bookingsSnapshot = await db.collection(COLLECTIONS.BOOKINGS)
        .where('departureId', '==', id)
        .get();

      bookingsSnapshot.forEach((bookingDoc) => {
        const bookingData = bookingDoc.data();
        const pax = bookingData.pax;

        // Find tier for this pax count
        const tier = tourData.pricingTiers.find(
          t => pax >= t.minPax && pax <= t.maxPax
        );

        if (tier) {
          const newOriginalPrice = tier.priceCOP * pax;
          const discountRatio = bookingData.finalPrice / bookingData.originalPrice;
          const newFinalPrice = Math.round(newOriginalPrice * discountRatio);

          t.update(bookingDoc.ref, {
            originalPrice: newOriginalPrice,
            finalPrice: newFinalPrice,
            updatedAt: new Date()
          });
        }
      });
    });

    return res.status(200).json({
      success: true,
      message: 'Departure tour updated, all booking prices recalculated'
    });
  } catch (error) {
    console.error('Error updating departure tour:', error);
    return res.status(500).json({ error: error.message });
  }
};
