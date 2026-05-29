import type { Borough } from "@/types/provider";

/** Active operating regions for compare (EU rollout). */
export const BOROUGHS: Borough[] = [
  "Hungary",
  "Germany",
  "France",
  "Spain",
  "Italy",
  "Poland",
];

export const LEGACY_HIGHLIGHT_BOROUGHS = [
  "Manhattan",
  "Brooklyn",
  "Queens",
  "Bronx",
  "Staten Island",
] as const;

export const COUNTRY_LABELS: Record<string, string> = {
  Hungary: "Hungary",
  Germany: "Germany",
  France: "France",
  Spain: "Spain",
  Italy: "Italy",
  Poland: "Poland",
};

export function formatBoroughLabel(borough: string) {
  return COUNTRY_LABELS[borough] ?? borough;
}

export function formatGeoRow(borough: string, neighborhood: string) {
  const prettyBorough = formatBoroughLabel(borough);
  return `${neighborhood}, ${prettyBorough}`;
}

/** Recognized regions per country (Discover / Clubs chips, admin locations, seed). */
export const NEIGHBORHOODS: Record<string, string[]> = {
  Hungary: ["Budapest", "Pest", "Bács-Kiskun", "Heves", "Borsod-Abaúj-Zemplén", "Zala"],
  Germany: ["Bavaria", "North Rhine-Westphalia", "Saxony", "Brandenburg", "Lower Saxony"],
  France: ["Nouvelle-Aquitaine", "Occitanie", "Grand Est", "Normandy", "Brittany"],
  Spain: ["Andalusia", "Catalonia", "Castile and Leon", "Valencian Community", "Aragon"],
  Italy: ["Lombardy", "Tuscany", "Veneto", "Piedmont", "Emilia-Romagna"],
  Poland: ["Masovian", "Lesser Poland", "Silesian", "Pomeranian", "Lower Silesian"],
};
