import type { Borough } from "@/types/provider";
import { DEFAULT_LOCALE, type AppLocale } from "@/lib/i18n/config";

/** Active operating regions for compare (EU rollout). */
export const BOROUGHS: Borough[] = [
  "Hungary",
];

export const LEGACY_HIGHLIGHT_BOROUGHS = [
  "Manhattan",
  "Brooklyn",
  "Queens",
  "Bronx",
  "Staten Island",
] as const;

export const COUNTRY_LABELS: Record<string, Record<AppLocale, string>> = {
  Hungary: {
    en: "Hungary",
    hu: "Magyarország",
    it: "Ungheria",
  },
};

export function formatBoroughLabel(borough: string, locale: AppLocale = DEFAULT_LOCALE) {
  return COUNTRY_LABELS[borough]?.[locale] ?? COUNTRY_LABELS[borough]?.[DEFAULT_LOCALE] ?? borough;
}

export function formatGeoRow(borough: string, neighborhood: string) {
  const prettyBorough = formatBoroughLabel(borough);
  return `${neighborhood}, ${prettyBorough}`;
}

/** Recognized regions per country (Discover / Clubs chips, admin locations, seed). */
export const NEIGHBORHOODS: Record<string, string[]> = {
  Hungary: ["Budapest", "Pest", "Bács-Kiskun", "Heves", "Borsod-Abaúj-Zemplén", "Zala"],
};
