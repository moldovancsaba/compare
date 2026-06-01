import type { MeetupGroup } from "@/types/meetup";
import type { Provider } from "@/types/provider";

const INTERNAL_INLINE_PATTERNS = [
  /\bsource[-\s]?backed\b/i,
  /\bsource\s+backed/i,
  /\bcheck\s+local\b/i,
  /\bsource\s+only\b/i,
  /\bofficial\s+source\b/i,
  /\bofficially\s+sourced/i,
  /\bverified\s+discovery\s+metadata\b/i,
  /\bshould\s+refresh\b/i,
  /\bshould\s+be\s+refreshed\b/i,
  /\bshould\s+not\s+be\s+shown\b/i,
  /\bshould\s+update\b/i,
  /\bpublished\s+this\b/i,
  /\bfake\b/i,
  /\bplaceholder\b/i,
  /\bsample\s+listing\b/i,
  /\btest\s+listing\b/i,
  /\blorem\s+ipsum\b/i,
  /\btbd\b/i,
  /\bdummy\b/i,
  /\bcoming\s+soon\b/i,
];

const SUSPICIOUS_PHRASE_PATTERNS = [
  /\bsource[-\s]?backed\b/i,
  /\bofficially\s+sourced\b/i,
  /\bofficial\s+source\b/i,
  /\bverified\s+discovery\s+metadata\b/i,
  /\bfor\s+source[-\s]?backed\b/i,
];

const BLOCKED_PUBLIC_BADGE_PATTERNS = [
  /\bbirthday\b/i,
  /\bparty\b/i,
  /\bkid(s)?\b/i,
  /\bchild(ren)?\b/i,
  /\bfamily\b/i,
  /\bparent(s)?\b/i,
  /\bplaydate\b/i,
];

interface PublicCopySanitizeResult {
  removedTerms: string[];
}

type ProviderLocalizedValue = Provider["localized"];

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asSanitizerInput(value: unknown): string[] {
  const text = asString(value);
  if (!text) return [];

  const tokens = text
    .split(/(?<=[.!?])\s+|\n+/u)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .filter((sentence) => !SUSPICIOUS_PHRASE_PATTERNS.some((pattern) => pattern.test(sentence)));

  return tokens;
}

function normalizeSpaces(value: string): string {
  return value
    .replace(/\s+/gu, " ")
    .replace(/\s+([.,;:!?)])/gu, "$1")
    .replace(/([({\[])\s+/gu, "$1")
    .trim();
}

function sanitizeCopyText(input: string, fallback: string, result: PublicCopySanitizeResult): string {
  const sentences = asSanitizerInput(input);
  const inlineCleaned = sentences
    .map((sentence) =>
      INTERNAL_INLINE_PATTERNS.reduce((next, pattern) => next.replace(pattern, " "), sentence)
        .replace(/\s{2,}/gu, " ")
        .trim(),
    )
    .filter(Boolean);
  const previous = asString(input);

  if (inlineCleaned.length > 0) {
    const output = normalizeSpaces(inlineCleaned.join(" "));
    const containsLeakyPhrases = INTERNAL_INLINE_PATTERNS.some((pattern) => pattern.test(previous));
    if (containsLeakyPhrases && output.toLowerCase() !== previous.toLowerCase()) {
      result.removedTerms.push("internal_copy_terms");
    }

    return output;
  }

  result.removedTerms.push("internal_copy_terms");
  return normalizeSpaces(fallback);
}

function sanitizePublicBadge(input: string | undefined, result: PublicCopySanitizeResult): string | undefined {
  const badge = asString(input);
  if (!badge) return undefined;
  if (BLOCKED_PUBLIC_BADGE_PATTERNS.some((pattern) => pattern.test(badge))) {
    result.removedTerms.push("blocked_public_badge");
    return undefined;
  }
  return sanitizeCopyText(badge, "", result) || undefined;
}

function buildProviderFallback(provider: Provider): { short: string; long: string } {
  const title = asString(provider.name);
  const neighborhood = asString(provider.neighborhood);
  const borough = asString(provider.borough);
  const anchor = neighborhood || borough ? `${title} in ${neighborhood || borough}` : title;
  const short = anchor ? `${anchor} offers activities.` : "New listing is available in the current catalog.";
  const long = anchor
    ? `${anchor} is listed in the public catalog and includes local details, contacts, and schedule information when available.`
    : "This listing is available in the public catalog with operational details and contacts when available.";
  return { short, long };
}

function buildMeetupFallback(group: MeetupGroup): string {
  const neighborhood = asString(group.neighborhood);
  const borough = asString(group.borough);
  const anchor = neighborhood || borough ? `${group.name} in ${neighborhood || borough}` : group.name;
  return `${anchor} is available in the public catalog with group details and upcoming activity updates when available.`;
}

function sanitizeLocaleCopy(
  value: unknown,
  fallback: { short: string; long: string },
  result: PublicCopySanitizeResult,
): { shortDescription?: string; longDescription?: string; announcementBadge?: string } | undefined {
  const copy = asRecord(value);
  if (!copy) return undefined;

  const next: { shortDescription?: string; longDescription?: string; announcementBadge?: string } = {};

  if ("shortDescription" in copy) {
    const shortDescription = sanitizeCopyText(asString(copy.shortDescription), fallback.short, result);
    next.shortDescription = shortDescription;
  }

  if ("longDescription" in copy) {
    const longDescription = sanitizeCopyText(asString(copy.longDescription), fallback.long, result);
    next.longDescription = longDescription;
  }

  if ("announcementBadge" in copy) {
    const announcementBadge = sanitizePublicBadge(asString(copy.announcementBadge), result);
    if (announcementBadge) next.announcementBadge = announcementBadge;
  }

  return next;
}

export interface PublicPayloadSanitizeResult<T extends Provider | MeetupGroup> {
  payload: T;
  changed: boolean;
  removedTerms: string[];
}

export function sanitizeProviderForPublic(payload: Provider): PublicPayloadSanitizeResult<Provider> {
  const result: PublicCopySanitizeResult = { removedTerms: [] };
  const fallback = buildProviderFallback(payload);
  const next: Provider = {
    ...payload,
    shortDescription: sanitizeCopyText(payload.shortDescription, fallback.short, result),
    longDescription: sanitizeCopyText(payload.longDescription, fallback.long, result),
  };

  if (asString(payload.announcementTitle).length > 0) {
    next.announcementTitle = sanitizeCopyText(payload.announcementTitle, "", result) || asString(payload.announcementTitle);
  }
  if (asString(payload.announcementDescription).length > 0) {
    next.announcementDescription =
      sanitizeCopyText(payload.announcementDescription, "", result) || asString(payload.announcementDescription);
  }
  next.announcementBadge = sanitizePublicBadge(payload.announcementBadge, result);

  if (payload.localized) {
    const localized: ProviderLocalizedValue = asRecord(payload.localized) as ProviderLocalizedValue;
    const nextLocalized: NonNullable<ProviderLocalizedValue> = {};
    for (const [locale, localeValue] of Object.entries(localized)) {
      if (!localeValue || typeof localeValue !== "object" || Array.isArray(localeValue)) continue;
      const localeCopy = sanitizeLocaleCopy(localeValue, fallback, result);
      if (localeCopy) {
        nextLocalized[locale] = {
          ...(localeValue as Record<string, string>),
          ...localeCopy,
        };
      }
    }
    next.localized = Object.keys(nextLocalized).length > 0 ? nextLocalized : payload.localized;
  }

  return {
    payload: next,
    changed:
      next.shortDescription !== payload.shortDescription ||
      next.longDescription !== payload.longDescription ||
      next.announcementTitle !== payload.announcementTitle ||
      next.announcementDescription !== payload.announcementDescription ||
      next.announcementBadge !== payload.announcementBadge ||
      JSON.stringify(next.localized) !== JSON.stringify(payload.localized),
    removedTerms: [...new Set(result.removedTerms)],
  };
}

export function sanitizeMeetupForPublic(payload: MeetupGroup): PublicPayloadSanitizeResult<MeetupGroup> {
  const result: PublicCopySanitizeResult = { removedTerms: [] };
  const next: MeetupGroup = {
    ...payload,
    description: sanitizeCopyText(payload.description, buildMeetupFallback(payload), result),
  };

  return {
    payload: next,
    changed: next.description !== payload.description,
    removedTerms: [...new Set(result.removedTerms)],
  };
}

export function hasLeakyPublicCopy(value: unknown) {
  const text = asString(value).toLowerCase();
  return SUSPICIOUS_PHRASE_PATTERNS.some((pattern) => pattern.test(text));
}
