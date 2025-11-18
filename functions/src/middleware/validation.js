const {DEPARTURE_TYPES} = require("../constants");

/**
 * Validate Booking Input
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @return {void}
 */
exports.validateBooking = (req, res, next) => {
  const {tourId, date, pax, customer, type} = req.body;

  if (!tourId || typeof tourId !== "string") {
    return res.status(400).json({error: "Invalid or missing 'tourId'"});
  }

  if (!date || isNaN(new Date(date).getTime())) {
    return res.status(400).json({error: "Invalid or missing 'date'"});
  }

  if (!pax || typeof pax !== "number" || pax <= 0) {
    return res.status(400).json({error: "Invalid or missing 'pax' (must be > 0)"});
  }

  if (!customer || typeof customer !== "object") {
    return res.status(400).json({error: "Missing 'customer' object"});
  }

  const requiredCustomerFields = ["name", "email", "phone", "document"];
  for (const field of requiredCustomerFields) {
    if (!customer[field] || typeof customer[field] !== "string") {
      return res.status(400).json({error: `Invalid or missing customer field: '${field}'`});
    }
  }

  // Basic Email Regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(customer.email)) {
    return res.status(400).json({error: "Invalid email format"});
  }

  if (type && !Object.values(DEPARTURE_TYPES).includes(type)) {
    return res.status(400).json({error: "Invalid 'type'. Must be 'private' or 'public'"});
  }

  next();
};

/**
 * Validate Tour Input
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @return {void}
 */
exports.validateTour = (req, res, next) => {
  const {name, pricingTiers, itinerary} = req.body;
  const isCreate = req.method === "POST";

  // Name (Bilingual)
  if (isCreate && (!name || !name.es || !name.en)) {
    return res.status(400).json({error: "Missing 'name' with 'es' and 'en' fields"});
  }
  if (name && (!name.es || !name.en)) {
    return res.status(400).json({error: "Invalid 'name': must have 'es' and 'en'"});
  }

  // Pricing Tiers (Array of 4)
  if (isCreate && (!Array.isArray(pricingTiers) || pricingTiers.length !== 4)) {
    return res.status(400).json({error: "'pricingTiers' must be an array of exactly 4 items"});
  }

  if (pricingTiers) {
    if (!Array.isArray(pricingTiers) || pricingTiers.length !== 4) {
      return res.status(400).json({error: "'pricingTiers' must be an array of exactly 4 items"});
    }

    const requiredTiers = [
      {min: 1, max: 1},
      {min: 2, max: 2},
      {min: 3, max: 3},
      {min: 4, max: 8},
    ];

    // Check structure of each tier
    for (let i = 0; i < 4; i++) {
      const tier = pricingTiers[i];
      const reqTier = requiredTiers[i];

      if (
        tier.minPax !== reqTier.min ||
        tier.maxPax !== reqTier.max ||
        typeof tier.priceCOP !== "number" ||
        typeof tier.priceUSD !== "number"
      ) {
        return res.status(400).json({
          error: `Invalid pricing tier at index ${i}. ` +
            `Expected minPax:${reqTier.min}, maxPax:${reqTier.max}, and valid prices.`,
        });
      }
    }
  }

  // Itinerary (Optional but if present must be valid)
  if (itinerary) {
    if (!itinerary.days || !Array.isArray(itinerary.days)) {
      return res.status(400).json({error: "'itinerary' must contain a 'days' array"});
    }
    // Could add deeper validation for days/activities here
  }

  next();
};
