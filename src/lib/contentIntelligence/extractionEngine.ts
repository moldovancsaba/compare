import { NEIGHBORHOODS } from "@/data/locations";
import type { NormalizedListingInput, NormalizedScheduleBlock } from "@/lib/contentIntelligence/rangeScoutAdapter";
import type { DiscoveryArtifact } from "@/lib/contentIntelligence/discoveryWorker";
import type { ImageProcessingRequest } from "@/lib/contentIntelligence/mediaPipeline";

export interface EvidenceRef {
  sourceUrl: string;
  note?: string;
}

export interface ExtractionResult {
  normalizedListing: NormalizedListingInput;
  evidenceMap: Record<string, EvidenceRef[]>;
  missingOrUncertain: string[];
  mediaRequest: ImageProcessingRequest | null;
  extractorVersion: string;
}

const EXTRACTOR_VERSION = "compare-range-extractor@v1";

function splitSentences(text: string) {
  return text
    .split(/(?<=[.?!])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function findEmail(text: string) {
  return text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
}

function findPhone(text: string) {
  return text.match(/(?:\+1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}/)?.[0];
}

function inferBorough(text: string, fallback?: string) {
  const lower = text.toLowerCase();
  const matches = Object.keys(NEIGHBORHOODS).find((borough) => lower.includes(borough.toLowerCase()));
  return matches ?? fallback ?? "";
}

function inferNeighborhood(text: string, borough: string, fallback?: string) {
  const list = NEIGHBORHOODS[borough as keyof typeof NEIGHBORHOODS] ?? [];
  const lower = text.toLowerCase();
  const match = list.find((neighborhood) => lower.includes(neighborhood.toLowerCase()));
  return match ?? fallback ?? "";
}

function inferAgeRanges(text: string, fallback: string[]) {
  const ages = new Set(fallback);
  const lower = text.toLowerCase();
  if (/\b(infant|baby|babies|toddler|0[-–]2)\b/.test(lower)) ages.add("0–2");
  if (/\b(preschool|pre-k|3 ?[-–] ?5|ages? 3 ?to ?5)\b/.test(lower)) ages.add("3–5");
  if (/\b(ages? 5 ?[-–] ?8|6 ?[-–] ?8|elementary)\b/.test(lower)) ages.add("6–8");
  if (/\b(ages? 9 ?[-–] ?12|9 ?[-–] ?12|middle school)\b/.test(lower)) ages.add("9–12");
  if (/\b(teen|teens|high school|ages? 13)\b/.test(lower)) ages.add("Teens");
  return [...ages];
}

const ACTIVITY_KEYWORDS: Array<[string, RegExp]> = [
  ["Sports", /\bsport|athletic\b/i],
  ["Dance", /\bdance|ballet|hip hop\b/i],
  ["Gymnastics", /\bgymnastics\b/i],
  ["Art", /\bart|craft|painting|drawing\b/i],
  ["Music", /\bmusic|sing|piano|guitar|drum\b/i],
  ["STEM", /\bstem|coding|robot|engineering\b/i],
  ["Martial Arts", /\bkarate|taekwondo|jiu jitsu|martial arts|mma\b/i],
  ["Swimming", /\bswim|swimming|aquatic\b/i],
  ["Theater", /\btheater|theatre|acting|drama\b/i],
  ["Language", /\blanguage|spanish|mandarin|bilingual\b/i],
  ["Tutoring", /\btutoring|academic support\b/i],
  ["Indoor Play", /\bindoor play|play space|open play\b/i],
  ["Outdoor Activities", /\boutdoor|garden|park\b/i],
  ["Yoga", /\byoga\b/i],
  ["Soccer", /\bsoccer\b/i],
  ["Basketball", /\bbasketball\b/i],
  ["Science", /\bscience\b/i],
  ["Birthday Entertainment", /\bbirthday\b/i],
];

function inferActivityTypes(text: string, fallback: string[]) {
  const activities = new Set(fallback);
  for (const [activity, pattern] of ACTIVITY_KEYWORDS) {
    if (pattern.test(text)) activities.add(activity);
  }
  return [...activities];
}

function inferCategory(text: string, fallback: string) {
  const lower = text.toLowerCase();
  if (lower.includes("birthday")) return "Birthday Parties";
  if (lower.includes("camp")) return "Camps";
  if (lower.includes("drop-in") || lower.includes("drop in") || lower.includes("open play")) return "Drop-In Activities";
  return fallback || "Classes";
}

function extractScheduleBlocks(text: string): NormalizedScheduleBlock[] {
  const blocks: NormalizedScheduleBlock[] = [];
  const lower = text.toLowerCase();
  const timeMatches = [...text.matchAll(/\b(\d{1,2}(?::\d{2})?\s*(?:a|p)\.?m\.?)(?:\s*(?:-|to)\s*(\d{1,2}(?::\d{2})?\s*(?:a|p)\.?m\.?))?/gi)];

  const maybePush = (daysOfWeek: NormalizedScheduleBlock["daysOfWeek"], timeText: string) => {
    if (daysOfWeek.length === 0) return;
    blocks.push({
      daysOfWeek,
      timeText,
      startTime: timeMatches[0]?.[1],
      endTime: timeMatches[0]?.[2],
    });
  };

  if (/\bmonday\b|\btuesday\b|\bwednesday\b|\bthursday\b|\bfriday\b/i.test(lower)) {
    const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].filter((day) =>
      lower.includes(day.toLowerCase()),
    ) as NormalizedScheduleBlock["daysOfWeek"];
    maybePush(weekdays.length ? weekdays : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], timeMatches[0]?.[0] ?? "Weekday schedule");
  }
  if (/\bsaturday\b|\bsunday\b|\bweekend\b/i.test(lower)) {
    const weekendDays = ["Saturday", "Sunday"].filter((day) => lower.includes(day.toLowerCase())) as NormalizedScheduleBlock["daysOfWeek"];
    maybePush(weekendDays.length ? weekendDays : ["Saturday", "Sunday"], timeMatches[1]?.[0] ?? timeMatches[0]?.[0] ?? "Weekend schedule");
  }

  return blocks.slice(0, 4);
}

function inferDescriptionFacts(text: string) {
  const candidates = splitSentences(text).filter((sentence) =>
    /\b(kids|children|family|camp|class|program|lesson|party|meetup|workshop|drop-in)\b/i.test(sentence),
  );
  return candidates.slice(0, 4);
}

export function extractRangeScoutCandidate(discoveryArtifact: DiscoveryArtifact): ExtractionResult {
  const text = `${discoveryArtifact.title}. ${discoveryArtifact.snippet}. ${discoveryArtifact.rawText}`.replace(/\s+/g, " ").trim();
  const borough = inferBorough(text, discoveryArtifact.boroughGuess);
  const neighborhood = inferNeighborhood(text, borough, discoveryArtifact.neighborhoodGuess);
  const descriptionFacts = inferDescriptionFacts(text);
  const ageRangesRaw = inferAgeRanges(text, discoveryArtifact.ageRangesRaw);
  const activityTypesRaw = inferActivityTypes(text, discoveryArtifact.activityTypesRaw);
  const scheduleBlocks = extractScheduleBlocks(text);
  const missingOrUncertain: string[] = [];

  if (!borough) missingOrUncertain.push("Borough could not be confidently extracted from the official source.");
  if (!neighborhood) missingOrUncertain.push("Neighborhood could not be confidently mapped from the official source.");
  if (ageRangesRaw.length === 0) missingOrUncertain.push("No explicit age guidance was found on the source.");
  if (scheduleBlocks.length === 0) missingOrUncertain.push("No recurring schedule blocks were confidently extracted from the source.");
  if (!discoveryArtifact.ogImageUrl) missingOrUncertain.push("No clear official image candidate was found on the source page.");

  const normalizedListing: NormalizedListingInput = {
    title: discoveryArtifact.title,
    listingKindHint: discoveryArtifact.listingKindHint,
    categoryHint: inferCategory(text, discoveryArtifact.categoryHint),
    boroughRaw: borough,
    neighborhoodRaw: neighborhood,
    activityTypesRaw,
    ageRangesRaw,
    scheduleBlocks,
    descriptionFacts,
    contactFacts: {
      website: discoveryArtifact.sourceUrl,
      email: findEmail(text),
      phone: findPhone(text),
    },
    imageCandidates: [],
    sourceUrls: {
      canonical: discoveryArtifact.sourceUrl,
    },
    missingOrUncertain,
  };

  const evidenceMap: Record<string, EvidenceRef[]> = {
    title: [{ sourceUrl: discoveryArtifact.sourceUrl, note: "Search result title and fetched page text." }],
    descriptionFacts: descriptionFacts.map(() => ({ sourceUrl: discoveryArtifact.sourceUrl, note: "Matched sentence from fetched official page." })),
    ageRangesRaw: ageRangesRaw.map(() => ({ sourceUrl: discoveryArtifact.sourceUrl, note: "Age keywords detected in fetched official page." })),
    activityTypesRaw: activityTypesRaw.map(() => ({ sourceUrl: discoveryArtifact.sourceUrl, note: "Activity keywords detected in fetched official page." })),
    scheduleBlocks: scheduleBlocks.map(() => ({ sourceUrl: discoveryArtifact.sourceUrl, note: "Schedule keywords and times detected in fetched official page." })),
    contactFacts: [{ sourceUrl: discoveryArtifact.sourceUrl, note: "Contact info extracted from official page text." }],
  };

  const mediaRequest: ImageProcessingRequest | null = discoveryArtifact.ogImageUrl
    ? {
        candidateId: discoveryArtifact.artifactId,
        sourceImageUrl: discoveryArtifact.ogImageUrl,
        sourceDocumentUrl: discoveryArtifact.sourceUrl,
        destinationEntityKind: discoveryArtifact.listingKindHint === "meetupGroup" ? "meetupGroup" : "provider",
        requestedBy: "compare-range-extraction-engine",
      }
    : null;

  return {
    normalizedListing,
    evidenceMap,
    missingOrUncertain,
    mediaRequest,
    extractorVersion: EXTRACTOR_VERSION,
  };
}
