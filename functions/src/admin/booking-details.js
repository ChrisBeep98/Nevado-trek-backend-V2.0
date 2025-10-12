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

    // In a real implementation, we would also need to validate date availability
    // and potentially move the booking to a different event
    updateData.startDate = new Date(updates.startDate);
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
    // First, update the capacity of the old event if pax count changed
    if (oldPax !== newPax) {
      await updateEventCapacity(db, bookingData.eventId, oldPax, newPax);
    }

    // Update booking document
    transaction.update(bookingRef, updateData);

    // If tour changed, we may need to change the event as well
    // For a complete implementation, we would need to find/create appropriate event
    // based on new tour and date, but for now, we just update the tour fields
  });

  // Get updated booking data to return
  const updatedBookingDoc = await bookingRef.get();
  const updatedBooking = {...updatedBookingDoc.data(), bookingId: updatedBookingDoc.id};

  return updatedBooking;
};

module.exports = {
  updateBookingDetails,
};
