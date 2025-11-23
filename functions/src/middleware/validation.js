const { DEPARTURE_TYPES } = require("../constants");

/**
 * Validate Booking Input
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @return {void}
 */
exports.validateBooking = (req, res, next) => {
  const { tourId, date, pax, customer, type, departureId } = req.body;

  if (!tourId || typeof tourId !== "string") {
    return res.status(400).json({ error: "Invalid or missing 'tourId'" });
  }

  if (!date || isNaN(new Date(date).getTime())) {
    return res.status(400).json({ error: "Invalid or missing 'date'" });
  }

  if (!pax || typeof pax !== "number" || pax <= 0) {
    return res.status(400).json({ error: "Invalid or missing 'pax' (must be > 0)" });
  }

  if (!customer || typeof customer !== "object") {
    return res.status(400).json({ error: "Missing 'customer' object" });
  }

  const requiredCustomerFields = ["name", "email", "phone", "document"];
  for (const field of requiredCustomerFields) {
    if (!customer[field] || typeof customer[field] !== "string") {
      return res.status(400).json({ error: `Invalid or missing customer field: '${field}'` });
    }
  }

  // Basic Email Regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(customer.email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  // Phone Validation: Must start with +
  if (!customer.phone.startsWith("+")) {
    return res.status(400).json({ error: "Phone number must start with '+' (International format)" });
  }

  // Document Validation: Alphanumeric check (optional, but good practice to ensure it's not empty)
  if (customer.document.trim().length === 0) {
    return res.status(400).json({ error: "Document cannot be empty" });
  }

  // Note is optional, but if present must be string
  if (customer.note && typeof customer.note !== "string") {
    return res.status(400).json({ error: "Invalid 'note'. Must be a string" });
  }

  // Type is optional, but if provided must be valid
  if (type && !Object.values(DEPARTURE_TYPES).includes(type)) {
    return res.status(400).json({ error: "Invalid 'type'. Must be 'private' or 'public'" });
  }

  // DepartureId is optional, but if provided must be a string
  if (departureId && typeof departureId !== "string") {
    return res.status(400).json({ error: "Invalid 'departureId'. Must be a string" });
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
  const {
    name,
    pricingTiers,
    itinerary,
    totalDays,
    difficulty,
    altitude,
    temperature,
    distance,
    location,
    faqs,
    recommendations,
    inclusions,
    exclusions,
  } = req.body;
  const isCreate = req.method === "POST";

  // Helper for bilingual fields
  const isBilingual = (obj) => obj && typeof obj.es === "string" && typeof obj.en === "string";

  // 1. Name (Bilingual)
  if (isCreate && !isBilingual(name)) {
    return res.status(400).json({ error: "Missing or invalid 'name' (requires es/en)" });
  }

  // 2. Description (Bilingual)
  const { description, shortDescription } = req.body;
  if (isCreate && !isBilingual(description)) {
    return res.status(400).json({ error: "Missing or invalid 'description' (requires es/en)" });
  }

  // 3. Short Description (Bilingual)
  if (isCreate && !isBilingual(shortDescription)) {
    return res.status(400).json({ error: "Missing or invalid 'shortDescription' (requires es/en)" });
  }

  // 4. Pricing Tiers (Array of 4)
  if (isCreate || pricingTiers) {
    if (!Array.isArray(pricingTiers) || pricingTiers.length !== 4) {
      return res.status(400).json({ error: "'pricingTiers' must be an array of exactly 4 items" });
    }

    const requiredTiers = [
      { min: 1, max: 1 },
      { min: 2, max: 2 },
      { min: 3, max: 3 },
      { min: 4, max: 8 },
    ];

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
          error: `Invalid pricing tier at index ${i}. Expected minPax:${reqTier.min}, maxPax:${reqTier.max}`,
        });
      }
    }
  }

  // 5. New Required Fields (Only enforced on Create for now to allow partial updates if needed, or strict?)
  // Let's enforce strictness on Create.

  if (isCreate) {
    if (typeof totalDays !== "number") return res.status(400).json({ error: "Missing 'totalDays' (number)" });
    if (typeof difficulty !== "string") return res.status(400).json({ error: "Missing 'difficulty' (string)" });
    if (typeof temperature !== "number") return res.status(400).json({ error: "Missing 'temperature' (number)" });
    if (typeof distance !== "number") return res.status(400).json({ error: "Missing 'distance' (number)" });

    if (!isBilingual(altitude)) return res.status(400).json({ error: "Missing 'altitude' (requires es/en)" });
    if (!isBilingual(location)) return res.status(400).json({ error: "Missing 'location' (requires es/en)" });

    // Lists
    if (!Array.isArray(faqs)) return res.status(400).json({ error: "Missing 'faqs' array" });
    if (!Array.isArray(recommendations)) return res.status(400).json({ error: "Missing 'recommendations' array" });
    if (!Array.isArray(inclusions)) return res.status(400).json({ error: "Missing 'inclusions' array" });
    if (!Array.isArray(exclusions)) return res.status(400).json({ error: "Missing 'exclusions' array" });
  }

  // Itinerary (Optional but if present must be valid)
  if (itinerary) {
    if (!itinerary.days || !Array.isArray(itinerary.days)) {
      return res.status(400).json({ error: "'itinerary' must contain a 'days' array" });
    }
  }

  next();
};
