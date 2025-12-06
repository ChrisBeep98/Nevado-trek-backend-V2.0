/**
 * Date Utilities for consistent timezone handling
 * 
 * Problem: When frontend sends "2025-12-31", new Date("2025-12-31") creates
 * midnight UTC. In Colombia (UTC-5), this shows as Dec 30 at 7PM.
 * 
 * Solution: Parse dates as noon UTC so any timezone sees the correct date.
 */

/**
 * Parse a date string to a Date object at noon UTC
 * This ensures the date displays correctly in any timezone
 * 
 * @param {string} dateString - Date in format "YYYY-MM-DD" or ISO string
 * @returns {Date} Date object at 12:00:00 UTC on the specified day
 */
function parseToNoonUTC(dateString) {
  if (!dateString) return null;
  
  // If already a Date object, extract the date parts
  if (dateString instanceof Date) {
    dateString = dateString.toISOString().split('T')[0];
  }
  
  // Extract just the date part if it's an ISO string
  const datePart = dateString.split('T')[0];
  
  // Parse as noon UTC to avoid timezone issues
  return new Date(`${datePart}T12:00:00.000Z`);
}

module.exports = { parseToNoonUTC };
