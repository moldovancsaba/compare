/** Shared with ingest automation + Zod curator schema (keep in sync). */
export const CURATOR_CATEGORIES = ["Classes", "Camps", "Birthday Parties", "Drop-In Activities"] as const;
export const CURATOR_BOROUGHS = ["Hungary", "Germany", "France", "Spain", "Italy", "Poland"] as const;
export const CURATOR_AGE_RANGES = ["0–2", "3–5", "6–8", "9–12", "Teens", "Youth", "Beginner", "Licensed Adult", "Competition", "Hunter Prep"] as const;
export const CURATOR_DAY_TAGS = ["Weekday", "Weekend", "Morning", "Afternoon", "Evening", "After-school", "Seasonal"] as const;
export const CURATOR_BADGES = [
  "Featured",
  "Popular",
  "New",
  "Staff Pick",
  "Competition Ready",
  "Weekend Friendly",
  "Beginner Friendly",
] as const;

export const CURATOR_SEARCH_QUERIES = [
  "MSSZ official competition calendar federation",
  "Hungarian shooting competition registration portal",
  "IPSC Hungary range course training official",
  "IDPA match notice and schedule",
  "club event calendar shooting matches",
  "hunt club training and hunter safety",
  "Hungary shooting range capability and booking",
] as const;
