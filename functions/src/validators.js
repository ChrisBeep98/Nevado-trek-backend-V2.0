/**
 * Validation utility functions
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @return {boolean} - True if valid, false otherwise
 */
const validateEmail = (email) => {
  if (!email || typeof email !== "string") {
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // eslint-disable-line no-useless-escape
  return emailRegex.test(email);
};

/**
 * Validate phone number format (international format +XX-XXXXXXXX)
 * @param {string} phone - Phone number to validate
 * @return {boolean} - True if valid, false otherwise
 */
const validatePhone = (phone) => {
  if (!phone || typeof phone !== "string") {
    return false;
  }
  // Allow international format +XXXXXXXXXX or +XX-XXXXXXXX or +XX XXXXXXXX
  const phoneRegex = /^\+[\d\s\-\(\)]{8,15}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate document ID format (alphanumeric with common separators)
 * @param {string} docId - Document ID to validate
 * @return {boolean} - True if valid, false otherwise
 */
const validateDocumentId = (docId) => {
  if (!docId || typeof docId !== "string") {
    return false;
  }
  // Basic validation for document IDs (alphanumeric with common separators)
  const docIdRegex = /^[A-Za-z0-9\s\-\._]{5,20}$/;
  return docIdRegex.test(docId);
};

/**
 * Validate tour ID exists and is active
 * @param {string} tourId - Tour ID to validate
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @return {Promise<boolean>} - True if valid and active, false otherwise
 */
const validateTourId = async (tourId, db) => {
  if (!tourId || typeof tourId !== "string") {
    return false;
  }

  try {
    const tourRef = db.collection("tours").doc(tourId);
    const tourDoc = await tourRef.get();

    if (!tourDoc.exists) {
      return false;
    }

    const tourData = tourDoc.data();
    return tourData.isActive === true;
  } catch (error) {
    console.error("Error validating tour ID:", error);
    return false;
  }
};

/**
 * Validate date string
 * @param {string} dateString - Date string to validate
 * @return {boolean} - True if valid ISO date, false otherwise
 */
const validateDate = (dateString) => {
  if (!dateString || typeof dateString !== "string") {
    return false;
  }

  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

/**
 * Validate pax count
 * @param {number} pax - Number of participants
 * @return {boolean} - True if valid, false otherwise
 */
const validatePax = (pax) => {
  return Number.isInteger(pax) && pax > 0 && pax <= 100; // Max 100 pax per booking
};

/**
 * Validate price
 * @param {number} price - Price to validate
 * @return {boolean} - True if valid, false otherwise
 */
const validatePrice = (price) => {
  return typeof price === "number" && price >= 0;
};

/**
 * Validate all customer information
 * @param {Object} customer - Customer object to validate
 * @return {Object} - Validation errors object
 */
const validateCustomer = (customer) => {
  const errors = {};

  if (customer.fullName && (typeof customer.fullName !== "string" || customer.fullName.trim().length === 0)) {
    errors.fullName = "Full name must be a non-empty string";
  }

  if (customer.documentId && !validateDocumentId(customer.documentId)) {
    errors.documentId = "Document ID format is invalid";
  }

  if (customer.phone && !validatePhone(customer.phone)) {
    errors.phone = "Phone number format is invalid (should be in +XX-XXXXXXXX format)";
  }

  if (customer.email && !validateEmail(customer.email)) {
    errors.email = "Email format is invalid";
  }

  if (customer.notes && typeof customer.notes !== "string") {
    errors.notes = "Notes must be a string";
  }

  return errors;
};

module.exports = {
  validateEmail,
  validatePhone,
  validateDocumentId,
  validateTourId,
  validateDate,
  validatePax,
  validatePrice,
  validateCustomer,
};
