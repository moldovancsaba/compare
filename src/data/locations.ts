import type { Borough } from "@/types/provider";

/** EU operating countries (fixed set for filters, ingest, and Mongo `locations`). */
export const BOROUGHS: Borough[] = ["Germany", "France", "Spain", "Italy", "Poland"];

/**
 * Recognized regions per country (Discover / Clubs chips, admin locations, seed).
 */
export const NEIGHBORHOODS: Record<Borough, string[]> = {
  Manhattan: ["Upper West Side", "Upper East Side", "Chelsea", "Harlem", "SoHo", "Tribeca", "Flatiron"],
  Brooklyn: ["Brooklyn Heights", "DUMBO", "Williamsburg", "Park Slope", "Sunset Park"],
  Queens: ["Astoria", "Long Island City", "Jackson Heights", "Flushing", "Forest Hills"],
  Bronx: ["Mott Haven", "Fordham", "Kingsbridge", "Riverdale", "Pelham Bay"],
  "Staten Island": ["St. George", "Stapleton", "New Dorp", "Great Kills", "Tottenville"],
  Germany: ["Bavaria", "North Rhine-Westphalia", "Saxony", "Brandenburg", "Lower Saxony"],
  France: ["Nouvelle-Aquitaine", "Occitanie", "Grand Est", "Normandy", "Brittany"],
  Spain: ["Andalusia", "Catalonia", "Castile and Leon", "Valencian Community", "Aragon"],
  Italy: ["Lombardy", "Tuscany", "Veneto", "Piedmont", "Emilia-Romagna"],
  Poland: ["Masovian", "Lesser Poland", "Silesian", "Pomeranian", "Lower Silesian"],
};
