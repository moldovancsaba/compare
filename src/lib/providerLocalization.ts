import type { AppLocale } from "@/lib/i18n/config";
import type { Provider } from "@/types/provider";

const BLOCKED_PUBLIC_BADGE = /\b(birthday|party|kids?|children|family|parent|playdate)\b/i;

export function getLocalizedProviderCopy(provider: Provider, locale: AppLocale) {
  const localized = provider.localized?.[locale] ?? provider.localized?.en;
  const localizedBadge = localized?.announcementBadge?.trim() || "";
  const fallbackBadge = provider.announcementBadge?.trim() || "";
  const rawBadge = localizedBadge || fallbackBadge;
  const announcementBadge = rawBadge && !BLOCKED_PUBLIC_BADGE.test(rawBadge) ? rawBadge : "";
  return {
    shortDescription: localized?.shortDescription?.trim() || provider.shortDescription,
    longDescription: localized?.longDescription?.trim() || provider.longDescription,
    announcementBadge,
  };
}
