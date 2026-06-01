import type { Borough } from "@/types/provider";
import { DEFAULT_LOCALE, type AppLocale } from "@/lib/i18n/config";

/** Active operating country for Compare. Regions must come from published catalog content. */
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

/** Empty by design: public region chips are derived from published catalog content. */
export const NEIGHBORHOODS: Record<string, string[]> = {
  Hungary: [],
};
