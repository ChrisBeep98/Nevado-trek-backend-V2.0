// Testing date processing behavior
const testDate1 = new Date('2025-11-31T00:00:00.000Z');
console.log('Date created from "2025-11-31T00:00:00.000Z":', testDate1.toISOString());

// What I sent in the API call
const targetDate = new Date('2025-11-31T00:00:00.000Z'); 
console.log('Target date I sent to API:', targetDate.toISOString());

// The JavaScript Date object should automatically normalize Nov 31 to Dec 1
// But the actual result in the DB was Nov 30
console.log('\\nJavaScript normalizes invalid dates:');
console.log('Nov 31, 2025 becomes:', new Date(2025, 10, 31).toISOString()); // month is 0-indexed, so 10 = November
console.log('Nov 30, 2025 is:', new Date(2025, 10, 30).toISOString());

// This could be related to timezone handling in the system
console.log('\\nTimezone considerations:');
console.log('UTC time of requested date:', targetDate.toISOString());
console.log('Local time of requested date:', targetDate.toString());

// The issue might be timezone conversion in the backend
console.log('\\nThe event in the database shows Nov 30, not Dec 1.');
console.log('This suggests there might be a timezone conversion or date processing issue in the backend.');