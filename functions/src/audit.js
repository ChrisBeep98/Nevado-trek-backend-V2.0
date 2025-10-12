/**
 * Audit trail management functions
 */

/**
 * Create an audit trail entry
 * @param {string} adminUser - Admin user ID or identifier
 * @param {string} action - Action performed
 * @param {any} previousValue - Previous value before change
 * @param {any} newValue - New value after change
 * @param {string} reason - Reason for the change
 * @return {Object} - Audit trail entry
 */
const createAuditEntry = (adminUser, action, previousValue, newValue, reason = "") => {
  return {
    timestamp: new Date().toISOString(),
    adminUser: adminUser || "system",
    action: action,
    previousValue: previousValue,
    newValue: newValue,
    reason: reason,
  };
};

/**
 * Add audit trail entry to booking
 * @param {Array} statusHistory - Existing status history
 * @param {string} status - New status
 * @param {string} reason - Reason for status change
 * @param {string} adminUser - Admin user making the change
 * @return {Array} - Updated status history
 */
const addStatusHistoryEntry = (statusHistory = [], status, reason = "", adminUser = "system") => {
  const newEntry = {
    timestamp: new Date().toISOString(),
    status: status,
    note: reason || "Updated by admin",
    adminUser: adminUser,
  };

  return [...statusHistory, newEntry];
};

module.exports = {
  createAuditEntry,
  addStatusHistoryEntry,
};
