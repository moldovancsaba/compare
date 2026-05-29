/** Shared with ingest automation + Zod curator schema (keep in sync). */
export const CURATOR_CATEGORIES = ["Classes", "Camps", "Birthday Parties", "Drop-In Activities"] as const;
export const CURATOR_BOROUGHS = ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"] as const;
export const CURATOR_AGE_RANGES = ["0–2", "3–5", "6–8", "9–12", "Teens"] as const;
export const CURATOR_DAY_TAGS = ["Weekday", "Weekend", "Morning", "Afternoon", "Evening", "After-school"] as const;
export const CURATOR_BADGES = [
  "Featured",
  "Popular",
  "New",
  "Staff Pick",
  "Great for Toddlers",
  "Weekend Friendly",
] as const;

export const CURATOR_SEARCH_QUERIES = [
  "NYC children museum official admission hours",
  "Brooklyn kids art class studio official site",
  "Queens NYC summer day camp official registration",
  "Manhattan toddler music class official schedule price",
  "NYC indoor play space drop in official",
  "Bronx kids sports program official youth",
  "Park Slope family playdate parent group official",
] as const;
