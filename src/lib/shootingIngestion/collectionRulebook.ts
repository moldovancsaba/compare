import type { ClassifiedSource } from "@/lib/shootingIngestion/types";

export type ShootingRulebookLeadType = "competition" | "cup" | "class" | "group" | "event_series" | "event_instance" | "range" | "club";

export interface ShootingCollectionRule {
  leadType: ShootingRulebookLeadType;
  id: string;
  sourceClassHints: ClassifiedSource["sourceClass"][];
  extractorHints: ClassifiedSource["extractorHint"][];
  signalTerms: string[];
  sourceFeatureMustInclude?: string[];
  allowIfManualReviewRequired: boolean;
  maxRecords: 1 | 2;
  rationale: string;
  precedence: 0 | 1 | 2 | 3;
}

const CORE_HINT_MAP: ShootingCollectionRule[] = [
  {
    leadType: "cup",
    id: "shooting-rulebook-cup-from-competition-hints",
    sourceClassHints: ["competition_surface", "registration_surface"],
    extractorHints: ["competition_calendar", "competition_notice", "registration_page", "document"],
    signalTerms: ["cup", "kup", "series", "liga", "ligasegéd", "championship", "bajnoksag", "grand prix", "gps"],
    allowIfManualReviewRequired: true,
    maxRecords: 1,
    rationale: "Cup/series pages usually publish one lead anchor with explicit schedule and membership constraints.",
    precedence: 3,
  },
  {
    leadType: "competition",
    id: "shooting-rulebook-competition-calendar",
    sourceClassHints: ["competition_surface", "federation", "registration_surface", "document_surface", "document"],
    extractorHints: ["competition_calendar", "competition_notice", "registration_page", "document"],
    signalTerms: ["competition", "verseny", "event", "match", "rali", "tournament", "versenyek"],
    sourceFeatureMustInclude: ["official-operator"],
    allowIfManualReviewRequired: false,
    maxRecords: 2,
    rationale: "Official competition feeds are highest-priority leads and should be promoted when evidence is present.",
    precedence: 2,
  },
  {
    leadType: "event_series",
    id: "shooting-rulebook-club-event-series",
    sourceClassHints: ["event_surface", "club_surface"],
    extractorHints: ["club_events", "club_profile", "range_profile", "document"],
    signalTerms: ["serie", "series", "weekly", "recurring", "every", "het", "every friday", "training cycle"],
    allowIfManualReviewRequired: true,
    maxRecords: 1,
    rationale: "Recurring community activity indicates a lead series with periodic publish relevance.",
    precedence: 2,
  },
  {
    leadType: "event_instance",
    id: "shooting-rulebook-single-event",
    sourceClassHints: ["event_surface", "club_surface", "range_surface", "course_surface", "competition_surface"],
    extractorHints: ["club_events", "competition_calendar", "competition_notice", "registration_page", "document", "range_profile", "course_offer"],
    signalTerms: ["session", "workshop", "demo", "open day", "training", "class", "practice", "event"],
    allowIfManualReviewRequired: true,
    maxRecords: 1,
    rationale: "Non-recurring activity/events from official or trainer surfaces are good next-surface candidates.",
    precedence: 1,
  },
  {
    leadType: "class",
    id: "shooting-rulebook-training-class",
    sourceClassHints: ["course_surface", "event_surface", "federation"],
    extractorHints: ["course_offer", "club_events", "competition_notice", "document"],
    signalTerms: ["course", "tanfolyam", "training", "oktat", "workshop", "academy", "beginner"],
    allowIfManualReviewRequired: true,
    maxRecords: 1,
    rationale: "Training/class leads are high conversion for onboarding and should be surfaced explicitly.",
    precedence: 2,
  },
  {
    leadType: "group",
    id: "shooting-rulebook-club-or-squad",
    sourceClassHints: ["club_surface", "federation", "registration_surface"],
    extractorHints: ["club_profile", "registration_page", "club_events", "range_profile"],
    signalTerms: ["club", "squad", "association", "tag", "egyesulet", "csapat", "group", "sekcio"],
    allowIfManualReviewRequired: false,
    maxRecords: 1,
    rationale: "Club and squad pages are strong onboarding surfaces for first-time participants.",
    precedence: 2,
  },
  {
    leadType: "range",
    id: "shooting-rulebook-range-profile",
    sourceClassHints: ["range_surface", "club_surface", "competition_surface"],
    extractorHints: ["range_profile", "club_profile", "club_events"],
    signalTerms: ["range", "range safety", "paly", "loter", "ipsc", "rifle", "pistol", "shotgun", "facility"],
    allowIfManualReviewRequired: true,
    maxRecords: 1,
    rationale: "Range profiles provide location-capability data needed by downstream discovery and readiness checks.",
    precedence: 1,
  },
  {
    leadType: "club",
    id: "shooting-rulebook-club-profile",
    sourceClassHints: ["club_surface", "federation"],
    extractorHints: ["club_profile", "club_events", "registration_page"],
    signalTerms: ["club", "members", "egylet", "sport shooting club", "shooting club", "időpont"],
    allowIfManualReviewRequired: false,
    maxRecords: 1,
    rationale: "Club pages are primary anchors for trust, location, and practice access conditions.",
    precedence: 1,
  },
];

export function getRulebook() {
  return CORE_HINT_MAP;
}

export type ShootingRuleMatch = {
  rule: ShootingCollectionRule;
  score: number;
};

const SIGNAL_MAX_BONUS = 8;

function normalizeText(value: string) {
  return value.toLowerCase();
}

function normalizeSourceText(source: ClassifiedSource) {
  return normalizeText(`${source.sourceId} ${source.canonicalUrl} ${source.features.join(" ")} ${source.extractorHint}`);
}

function scoreMatch(source: ClassifiedSource, rule: ShootingCollectionRule, sourceText: string) {
  let score = 0;
  score += rule.precedence * 20;
  score += rule.maxRecords * 5;

  if (rule.sourceClassHints.includes(source.sourceClass)) score += 12;
  if (rule.extractorHints.includes(source.extractorHint)) score += 8;
  if (rule.sourceFeatureMustInclude?.every((feature) => source.features.includes(feature))) score += 12;
  if (!rule.allowIfManualReviewRequired && source.manualReviewRequired) score -= 20;

  const matchCount = rule.signalTerms.filter((term) => sourceText.includes(normalizeText(term))).length;
  score += Math.min(SIGNAL_MAX_BONUS, matchCount);

  return score;
}

function sortMatches(a: ShootingRuleMatch, b: ShootingRuleMatch) {
  if (b.score !== a.score) return b.score - a.score;
  if (b.rule.precedence !== a.rule.precedence) return b.rule.precedence - a.rule.precedence;
  if (b.rule.maxRecords !== a.rule.maxRecords) return b.rule.maxRecords - a.rule.maxRecords;
  return a.rule.id.localeCompare(b.rule.id);
}

export function findMatches(source: ClassifiedSource): ShootingRuleMatch[] {
  const sourceText = normalizeSourceText(source);
  return CORE_HINT_MAP.filter((rule) => {
    if (!rule.sourceClassHints.includes(source.sourceClass)) return false;
    if (!rule.extractorHints.includes(source.extractorHint) && source.sourceClass !== "federation") return false;
    if (rule.sourceFeatureMustInclude && !rule.sourceFeatureMustInclude.every((feature) => source.features.includes(feature))) {
      return false;
    }
    if (!rule.allowIfManualReviewRequired && source.manualReviewRequired) return false;
    if (rule.signalTerms.length === 0) return true;
    return rule.signalTerms.some((term) => sourceText.includes(normalizeText(term)));
  }).map((rule) => ({
    rule,
    score: scoreMatch(source, rule, sourceText),
  })).sort(sortMatches);
}

export function findPrimaryMatch(source: ClassifiedSource) {
  const matches = findMatches(source);
  if (matches.length === 0) return null;
  return matches[0].rule;
}

export function findTypedMatches(source: ClassifiedSource) {
  const matches = findMatches(source);
  const unique = new Map<string, ShootingRuleMatch>();
  for (const match of matches) {
    if (!unique.has(match.rule.leadType)) {
      unique.set(match.rule.leadType, match);
    }
  }

  return Array.from(unique.values()).map((entry) => entry.rule);
}
