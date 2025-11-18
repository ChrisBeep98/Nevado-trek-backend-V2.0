const admin = require("firebase-admin");
const {COLLECTIONS} = require("../constants");

const db = admin.firestore();

/**
 * Create a new Tour
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @return {Promise<void>}
 */
exports.createTour = async (req, res) => {
  try {
    const tourData = req.body;

    // Basic validation
    if (!tourData.name) {
      return res.status(400).json({error: "Missing required fields: name"});
    }

    const newTour = {
      ...tourData,
      isActive: true,
      version: 1,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection(COLLECTIONS.TOURS).add(newTour);

    return res.status(201).json({
      success: true,
      tourId: docRef.id,
      data: newTour,
    });
  } catch (error) {
    console.error("Error creating tour:", error);
    return res.status(500).json({error: error.message});
  }
};

/**
 * Get all tours (Admin view - includes inactive)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @return {Promise<void>}
 */
exports.getAllTours = async (req, res) => {
  try {
    const snapshot = await db.collection(COLLECTIONS.TOURS).get();
    const tours = snapshot.docs.map((doc) => ({
      tourId: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json(tours);
  } catch (error) {
    console.error("Error getting tours:", error);
    return res.status(500).json({error: error.message});
  }
};

/**
 * Get single tour
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @return {Promise<void>}
 */
exports.getTour = async (req, res) => {
  try {
    const {id} = req.params;
    const doc = await db.collection(COLLECTIONS.TOURS).doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({error: "Tour not found"});
    }

    return res.status(200).json({
      tourId: doc.id,
      ...doc.data(),
    });
  } catch (error) {
    console.error("Error getting tour:", error);
    return res.status(500).json({error: error.message});
  }
};

/**
 * Update Tour
 * Note: In a strict versioning system, this might create a new document.
 * For now, we update in place but increment version.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @return {Promise<void>}
 */
exports.updateTour = async (req, res) => {
  try {
    const {id} = req.params;
    const updates = req.body;

    const tourRef = db.collection(COLLECTIONS.TOURS).doc(id);

    await db.runTransaction(async (t) => {
      const doc = await t.get(tourRef);
      if (!doc.exists) {
        throw new Error("Tour not found");
      }

      const currentVersion = doc.data().version || 1;

      t.update(tourRef, {
        ...updates,
        version: currentVersion + 1,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    return res.status(200).json({success: true, message: "Tour updated"});
  } catch (error) {
    console.error("Error updating tour:", error);
    return res.status(500).json({error: error.message});
  }
};

/**
 * Delete Tour (Soft delete)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @return {Promise<void>}
 */
exports.deleteTour = async (req, res) => {
  try {
    const {id} = req.params;

    await db.collection(COLLECTIONS.TOURS).doc(id).update({
      isActive: false,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({success: true, message: "Tour deactivated"});
  } catch (error) {
    console.error("Error deleting tour:", error);
    return res.status(500).json({error: error.message});
  }
};
