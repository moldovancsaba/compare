export const locales = ["en", "hu", "it"] as const;

export type AppLocale = (typeof locales)[number];

export const DEFAULT_LOCALE: AppLocale = "en";

export const localeCookieName = "site-locale";

export const localeLabels: Record<AppLocale, string> = {
  en: "English",
  hu: "Magyar",
  it: "Italiano",
};

export function isSupportedLocale(value: string | null | undefined): value is AppLocale {
  if (!value) return false;
  return (locales as readonly string[]).includes(value);
}

export function normalizeLocale(value: string | null | undefined): AppLocale {
  return isSupportedLocale(value) ? value : DEFAULT_LOCALE;
}

