const admin = require("firebase-admin");
const {COLLECTIONS, BOOKING_STATUS, DEPARTURE_TYPES, DEPARTURE_STATUS} = require("../constants");

const db = admin.firestore();

/**
 * Create Booking
 * Handles logic for joining Public or creating Private departures
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @return {Promise<void>}
 */
exports.createBooking = async (req, res) => {
  try {
    const {tourId, date, pax, customer, type} = req.body;
    const bookingDate = new Date(date);

    let departureId;
    let pricePerPax = 0;
    let bookingRef;

    await db.runTransaction(async (t) => {
      // 1. Find or Create Departure
      let departureRef;
      let departureData;

      if (type === DEPARTURE_TYPES.PUBLIC) {
        // Search for existing OPEN Public departure
        const existing = await db.collection(COLLECTIONS.DEPARTURES)
            .where("tourId", "==", tourId)
            .where("date", "==", bookingDate)
            .where("type", "==", DEPARTURE_TYPES.PUBLIC)
            .where("status", "==", DEPARTURE_STATUS.OPEN)
            .get();

        if (!existing.empty) {
          // Check capacity
          const dep = existing.docs[0];
          if (dep.data().currentPax + pax <= dep.data().maxPax) {
            departureRef = dep.ref;
            departureData = dep.data();
          }
        }
      }

      // If no suitable departure found, create one
      if (!departureRef) {
        // Get Tour for pricing snapshot
        const tourDoc = await t.get(db.collection(COLLECTIONS.TOURS).doc(tourId));
        if (!tourDoc.exists) throw new Error("Tour not found");

        const newDepData = {
          tourId,
          date: bookingDate,
          type: type || DEPARTURE_TYPES.PRIVATE,
          status: DEPARTURE_STATUS.OPEN,
          maxPax: type === DEPARTURE_TYPES.PUBLIC ? 8 : 99,
          currentPax: 0,
          pricingSnapshot: tourDoc.data().pricingTiers,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        departureRef = db.collection(COLLECTIONS.DEPARTURES).doc();
        t.set(departureRef, newDepData);
        departureData = newDepData;
      }

      // 2. Calculate Price
      const tiers = departureData.pricingSnapshot;
      const tier = tiers.find((t) => pax >= t.minPax && pax <= t.maxPax);
      pricePerPax = tier ? tier.priceCOP : 0;

      // 3. Create Booking
      const newBooking = {
        departureId: departureRef.id,
        customer,
        pax,
        originalPrice: pricePerPax * pax,
        finalPrice: pricePerPax * pax,
        status: BOOKING_STATUS.PENDING,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      bookingRef = db.collection(COLLECTIONS.BOOKINGS).doc();
      t.set(bookingRef, newBooking);

      // 4. Update Departure Capacity
      t.update(departureRef, {
        currentPax: admin.firestore.FieldValue.increment(pax),
      });

      departureId = departureRef.id;
    });

    return res.status(201).json({success: true, departureId, bookingId: bookingRef.id});
  } catch (error) {
    console.error("Error creating booking:", error);
    return res.status(500).json({error: error.message});
  }
};

/**
 * Update Booking (Admin)
 * Can update price (discount) or customer info
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @return {Promise<void>}
 */
exports.updateBooking = async (req, res) => {
  try {
    const {id} = req.params;
    const updates = req.body;

    await db.collection(COLLECTIONS.BOOKINGS).doc(id).update(updates);

    return res.status(200).json({success: true, message: "Booking updated"});
  } catch (error) {
    console.error("Error updating booking:", error);
    return res.status(500).json({error: error.message});
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
    const {id} = req.params; // Booking ID
    const {newTourId, newDate} = req.body;

    if (!newTourId || !newDate) {
      return res.status(400).json({error: "newTourId and newDate are required"});
    }

    const targetDate = new Date(newDate);

    await db.runTransaction(async (t) => {
      // 1. Get Booking
      const bookingRef = db.collection(COLLECTIONS.BOOKINGS).doc(id);
      const bookingDoc = await t.get(bookingRef);
      if (!bookingDoc.exists) throw new Error("Booking not found");
      const bookingData = bookingDoc.data();
      const oldDepartureId = bookingData.departureId;

      // 2. Find or Create Target Departure
      let targetDepRef;

      const existing = await db.collection(COLLECTIONS.DEPARTURES)
          .where("tourId", "==", newTourId)
          .where("date", "==", targetDate)
          .where("type", "==", DEPARTURE_TYPES.PUBLIC)
          .where("status", "==", DEPARTURE_STATUS.OPEN)
          .get();

      if (!existing.empty) {
        const dep = existing.docs[0];
        if (dep.data().currentPax + bookingData.pax <= dep.data().maxPax) {
          targetDepRef = dep.ref;
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
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        targetDepRef = db.collection(COLLECTIONS.DEPARTURES).doc();
        t.set(targetDepRef, newDepData);
      }

      // 3. Update Old Departure (Decrement)
      const oldDepRef = db.collection(COLLECTIONS.DEPARTURES).doc(oldDepartureId);
      t.update(oldDepRef, {
        currentPax: admin.firestore.FieldValue.increment(-bookingData.pax),
      });

      // 4. Update Target Departure (Increment)
      t.update(targetDepRef, {
        currentPax: admin.firestore.FieldValue.increment(bookingData.pax),
      });

      // 5. Update Booking
      t.update(bookingRef, {
        departureId: targetDepRef.id,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    return res.status(200).json({success: true, message: "Booking moved successfully"});
  } catch (error) {
    console.error("Error moving booking:", error);
    return res.status(500).json({error: error.message});
  }
};
