import type { Provider } from "@/types/provider";
import type { MeetupGroup } from "@/types/meetup";

const FAMILY_KEYWORDS = [
  "child",
  "children",
  "kid",
  "kids",
  "toddler",
  "preschool",
  "baby",
  "babies",
  "daycare",
  "parent",
  "playdate",
  "family",
  "families",
  "birthday",
  "party",
  "after-school",
  "school",
  "playground",
];

const SHOOTING_KEYWORDS = [
  "shooting",
  "shoot",
  "range",
  "rifle",
  "pistol",
  "shotgun",
  "airgun",
  "air gun",
  "archery",
  "clay",
  "ipsc",
  "idpa",
  "hunt",
  "hunting",
  "target",
  "firearm",
  "competition",
  "long range",
];

const LEGACY_CHILD_CATEGORIES = new Set([
  "Birthday Parties",
  "Drop-In Activities",
]);

const LEGACY_CHILD_AGE_RANGES = new Set(["0–2", "0–3", "0–5", "0–6", "2–5", "2–8", "3–5", "6–8", "9–12", "Teens"]);

const LEGACY_CHILD_MEETUP_TYPES = new Set([
  "Parent Meetup",
  "Mom Group",
  "Playdate Group",
  "New Parents",
  "Neighborhood Families",
]);

function normalizeText(value: string) {
  return value.replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
}

function hasWord(value: string, token: string) {
  return new RegExp(`\\b${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(value);
}

function hasChildAgeSignalFromProvider(provider: Provider) {
  return provider.ageRanges?.some((ageRange) => LEGACY_CHILD_AGE_RANGES.has(ageRange)) ?? false;
}

function hasChildAgeSignalFromMeetup(meetup: MeetupGroup) {
  return LEGACY_CHILD_AGE_RANGES.has(meetup.ageRange) || meetup.ageRange === "All ages";
}

function textTokens(provider: { name?: string; shortDescription?: string; longDescription?: string; category?: string; activityTypes?: string[] }) {
  return normalizeText([
    provider.name ?? "",
    provider.shortDescription ?? "",
    provider.longDescription ?? "",
    provider.category ?? "",
    ...(provider.activityTypes ?? []),
  ].join(" "));
}

function textTokensFromMeetup(meetup: MeetupGroup) {
  return normalizeText(`${meetup.name} ${meetup.description} ${meetup.groupType} ${meetup.ageRange}`);
}

function hasFamilyKeyword(text: string) {
  return FAMILY_KEYWORDS.some((keyword) => hasWord(text, keyword));
}

function hasShootingKeyword(text: string) {
  return SHOOTING_KEYWORDS.some((keyword) => text.includes(keyword));
}

export function isObsoleteFamilyProvider(provider: Provider) {
  const text = textTokens(provider);
  if (hasFamilyKeyword(text)) return true;
  if (LEGACY_CHILD_CATEGORIES.has(provider.category) && !hasShootingKeyword(text)) return true;
  if (hasChildAgeSignalFromProvider(provider) && !hasShootingKeyword(text)) return true;
  return false;
}

export function isObsoleteFamilyMeetup(meetup: MeetupGroup) {
  if (LEGACY_CHILD_MEETUP_TYPES.has(meetup.groupType)) return true;
  const text = textTokensFromMeetup(meetup);
  if (hasFamilyKeyword(text)) return true;
  if (hasChildAgeSignalFromMeetup(meetup) && !hasShootingKeyword(text)) return true;
  return false;
}

export function filterObsoleteContent<T extends Provider | MeetupGroup>(entities: T[]): T[] {
  return entities.filter((entity) =>
    !("ageRanges" in entity
      ? isObsoleteFamilyProvider(entity as Provider)
      : isObsoleteFamilyMeetup(entity as MeetupGroup)),
  );
}
