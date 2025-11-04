/**
 * Admin booking details update functionality
 */

const admin = require("firebase-admin");
/* eslint-disable no-unused-vars */
const {validateCustomer, validateTourId, validateDate, validatePax, validatePrice} = require("../validators");
const {addStatusHistoryEntry} = require("../audit");
const {updateEventCapacity, canModifyBooking} = require("../helpers");
const {COLLECTIONS, STATUS} = require("../constants");
/* eslint-enable no-unused-vars */

/**
 * Update core booking information
 * @param {string} bookingId - ID of the booking to update
 * @param {Object} updates - Fields to update
 * @param {string} adminUser - Admin user making the change
 * @param {Object} db - Firestore instance
 * @return {Promise<Object>} - Updated booking data
 */
const updateBookingDetails = async (bookingId, updates, adminUser, db) => {
  // Get the booking document
  const bookingRef = db.collection(COLLECTIONS.BOOKINGS).doc(bookingId);
  const bookingDoc = await bookingRef.get();

  if (!bookingDoc.exists) {
    throw new Error("BOOKING_NOT_FOUND");
  }

  const bookingData = bookingDoc.data();

  // Check if booking can be modified based on status
  if (!canModifyBooking(bookingData.status)) {
    throw new Error("BOOKING_CANNOT_BE_MODIFIED");
  }

  // Process updates
  const updateData = {};

  // Handle customer updates
  if (updates.customer) {
    // Validate customer data
    const customerErrors = validateCustomer(updates.customer);
    if (Object.keys(customerErrors).length > 0) {
      throw new Error(`INVALID_CUSTOMER_DATA: ${JSON.stringify(customerErrors)}`);
    }

    // Merge customer updates
    updateData.customer = {...bookingData.customer, ...updates.customer};
  }

  // Handle tour updates
  if (updates.tourId) {
    const isValidTour = await validateTourId(updates.tourId, db);
    if (!isValidTour) {
      throw new Error("INVALID_TOUR_ID");
    }

    updateData.tourId = updates.tourId;

    // Get new tour name if not provided
    if (!updates.tourName) {
      const tourRef = db.collection(COLLECTIONS.TOURS).doc(updates.tourId);
      const tourDoc = await tourRef.get();
      if (tourDoc.exists) {
        const tourData = tourDoc.data();
        updateData.tourName = tourData.name && tourData.name.es ? tourData.name.es : (tourData.name || null);
      }
    } else {
      updateData.tourName = updates.tourName;
    }
  } else if (updates.tourName) {
    updateData.tourName = updates.tourName;
  }

  // Handle start date updates
  if (updates.startDate) {
    if (!validateDate(updates.startDate)) {
      throw new Error("INVALID_DATE_FORMAT");
    }

    // Parse the date from the request - this is typically an ISO string
    // For tour booking context in Colombia, interpret dates in local context
    let newStartDate;

    // Check if the date string is in date-only format (YYYY-MM-DD) without timezone
    const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (dateOnlyRegex.test(updates.startDate)) {
      // If it's a date-only string, interpret it as the beginning of that day in Colombia timezone
      // Convert to a UTC timestamp that ensures the date shows correctly in Colombia timezone
      const [year, month, day] = updates.startDate.split("-").map(Number);
      // Create date at 05:00:00 UTC which will be 00:00:00 the same day in Colombia (UTC-5)
      newStartDate = new Date(Date.UTC(year, month - 1, day, 5, 0, 0)); // month is 0-indexed
    } else {
      // It's an ISO string with timezone info (like 'Z' or with offset)
      newStartDate = new Date(updates.startDate);
    }

    let newEventId = null;

    // Check if admin wants to create a new event even if one exists for the same date
    if (updates.createNewEvent) {
      // Create a new event for the updated date regardless of existing events
      const newEvent = {
        tourId: bookingData.tourId,
        tourName: bookingData.tourName,
        startDate: newStartDate,
        // Calculate endDate based on tour duration if available, or default to 3 days later
        endDate: new Date(newStartDate.getTime() + 3 * 24 * 60 * 60 * 1000),
        maxCapacity: 8, // Default capacity
        bookedSlots: 0, // Will be updated in transaction
        type: "private", // New events start as private
        status: "active",
        totalBookings: 0, // Will be updated in transaction
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const createdEvent = await db.collection(COLLECTIONS.TOUR_EVENTS).add(newEvent);
      newEventId = createdEvent.id;
    } else {
      // Find an existing event for this tour with the new date
      const tourEventsRef = db.collection(COLLECTIONS.TOUR_EVENTS);
      const existingEventQuery = await tourEventsRef
          .where("tourId", "==", bookingData.tourId)
          .where("startDate", "==", admin.firestore.Timestamp.fromDate(newStartDate))
          .limit(1)
          .get();

      if (!existingEventQuery.empty) {
        // Use existing event
        newEventId = existingEventQuery.docs[0].id;
      } else {
        // Create a new event for the updated date
        const newEvent = {
          tourId: bookingData.tourId,
          tourName: bookingData.tourName,
          startDate: newStartDate,
          // Calculate endDate based on tour duration if available, or default to 3 days later
          endDate: new Date(newStartDate.getTime() + 3 * 24 * 60 * 60 * 1000),
          maxCapacity: 8, // Default capacity
          bookedSlots: 0, // Will be updated in transaction
          type: "private", // New events start as private
          status: "active",
          totalBookings: 0, // Will be updated in transaction
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        const createdEvent = await db.collection(COLLECTIONS.TOUR_EVENTS).add(newEvent);
        newEventId = createdEvent.id;
      }
    }

    // Store the old event ID for capacity adjustment later
    const oldEventId = bookingData.eventId;

    // Update the booking to point to the new event
    updateData.eventId = newEventId;

    // Update the booking's startDate to match the new event's date
    updateData.startDate = admin.firestore.Timestamp.fromDate(newStartDate);

    // Track the change in previousStates for audit purposes
    const previousStates = bookingData.previousStates || [];
    previousStates.push({
      action: "date_change",
      timestamp: new Date().toISOString(), // Using client timestamp since Firestore timestamps can't be in arrays
      fromEventId: oldEventId,
      toEventId: newEventId,
      fromTourId: bookingData.tourId,
      toTourId: bookingData.tourId, // Same tour for date change
      adminUser: adminUser,
      reason: updates.reason || "Date change via adminUpdateBookingDetails",
    });
    updateData.previousStates = previousStates;
  }

  // Handle pax updates
  const oldPax = bookingData.pax;
  let newPax = bookingData.pax;
  if (updates.pax !== undefined) {
    if (!validatePax(updates.pax)) {
      throw new Error("INVALID_PAX_COUNT");
    }

    // If tourId changed or startDate changed, we might need to validate capacity on new event
    // For now, just update pax count
    updateData.pax = updates.pax;
    newPax = updates.pax;
  }

  // Handle price updates
  if (updates.price !== undefined) {
    if (!validatePrice(updates.price)) {
      throw new Error("INVALID_PRICE");
    }

    // Update both pricePerPerson and recalculate totalPrice
    updateData.pricePerPerson = updates.price;
    updateData.totalPrice = updates.price * newPax;
  }

  // Add updated at timestamp
  updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

  // Perform the update in a transaction to ensure consistency
  await db.runTransaction(async (transaction) => {
    // Update booking document
    transaction.update(bookingRef, updateData);

    // Handle capacity adjustments based on what changed
    if (oldPax !== newPax) {
      // Pax count changed, adjust capacity on current event
      await updateEventCapacity(db, bookingData.eventId, oldPax, newPax);
    }

    // If eventId changed (date update), we need to adjust capacity on both old and new events
    if (updateData.eventId && bookingData.eventId !== updateData.eventId) {
      const newEventRef = db.collection(COLLECTIONS.TOUR_EVENTS).doc(updateData.eventId);
      const oldEventRef = db.collection(COLLECTIONS.TOUR_EVENTS).doc(bookingData.eventId);

      // Decrement capacity on old event
      transaction.update(oldEventRef, {
        bookedSlots: admin.firestore.FieldValue.increment(-bookingData.pax),
        totalBookings: admin.firestore.FieldValue.increment(-1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Increment capacity on new event
      transaction.update(newEventRef, {
        bookedSlots: admin.firestore.FieldValue.increment(bookingData.pax),
        totalBookings: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  });

  // Get updated booking data to return
  const updatedBookingDoc = await bookingRef.get();
  const updatedBooking = {...updatedBookingDoc.data(), bookingId: updatedBookingDoc.id};

  return updatedBooking;
};

module.exports = {
  updateBookingDetails,
};
