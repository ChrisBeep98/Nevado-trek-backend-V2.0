const {defineString} = require("firebase-functions/params");

const adminSecretKey = defineString("ADMIN_SECRET_KEY");

/**
 * Middleware to validate Admin Secret Key
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @return {Object|Function} - Returns error response or calls next()
 */
const validateAdminKey = (req, res, next) => {
  const key = req.headers["x-admin-secret-key"];

  // Check if key matches the defined secret
  // Note: In local emulator, defineString might need .value() or fallback
  if (key === adminSecretKey.value()) {
    return next();
  }

  return res.status(401).json({
    error: {
      code: "UNAUTHORIZED",
      message: "Invalid or missing admin secret key",
    },
  });
};

module.exports = {validateAdminKey};
