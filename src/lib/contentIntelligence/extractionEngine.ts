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
  if (/\b(beginner|entry|intro|first class|new shooter|newcomer|newcomers|novice)\b/.test(lower)) ages.add("Beginner");
  if (/\b(youth|junior|teen|teens|16|17|18|under.?18|13 ?[-–] ?17)\b/.test(lower)) ages.add("Youth");
  if (/\b(licen[sc]e|licensed|membership|hunter|hunterly|licence)\b/.test(lower)) ages.add("Licensed Adult");
  if (/\b(competi|match|ranking|advanced|elite|team|championship)\b/.test(lower)) ages.add("Competition");
  if (/\b(hunter prep|hunter qualification|hunter.?exam|vadaszat|hunting)\b/.test(lower)) ages.add("Hunter Prep");
  return [...ages];
}

const ACTIVITY_KEYWORDS: Array<[string, RegExp]> = [
  ["Rifle", /\brifle|small[- ]?bore|air rifle|precision\b/i],
  ["Pistol", /\bpistol|handgun|air pistol|service pistol\b/i],
  ["Shotgun", /\bshotgun|skeet|trap|clay\b/i],
  ["IPSC", /\bipsc|practical|dynamic\b/i],
  ["IDPA", /\bidpa|defensiv|self.?defense\b/i],
  ["Field Shooting", /\bfield\s+shoot|hunting\s+shoot|outdoor\s+shoot/i],
  ["Long Range", /\blong\s+range|1000m|300m|distance\s+rifle\b/i],
  ["Range Training", /\btraining|course|clinic|coaching|lessons?\b/i],
  ["Competitions", /\bcompetition|cup|match|tournament|championship\b/i],
  ["Hunter Safety", /\bhunter safety|hunting\s+license|szabad.?s?f|szabadulás|vadászat\b/i],
  ["Registration", /\bregister|registration|sign[\- ]?up|signup|jelentkeze/i],
];

function inferActivityTypes(text: string, fallback: string[]) {
  const activities = new Set(fallback);
  const lower = text.toLowerCase();
  for (const [activity, pattern] of ACTIVITY_KEYWORDS) {
    if (pattern.test(text)) activities.add(activity);
  }
  if (lower.includes("mdlsz")) {
    ["IPSC", "IDPA", "Pistol", "Rifle", "Shotgun", "Competitions"].forEach((activity) => activities.add(activity));
  }
  if (lower.includes("hunshooting")) {
    ["Rifle", "Pistol", "Shotgun", "Competitions"].forEach((activity) => activities.add(activity));
  }
  return [...activities];
}

function inferCategory(text: string, fallback: string) {
  const lower = text.toLowerCase();
  const normalizedFallback = fallback.toLowerCase();
  if (lower.includes("competition") || lower.includes("match") || lower.includes("cup")) return "Competitions";
  if (lower.includes("range") || lower.includes("facility") || lower.includes("facility")) return "Camps";
  if (lower.includes("club") || lower.includes("hunting") || lower.includes("membership")) return "Drop-In Activities";
  if (lower.includes("meetup") || lower.includes("association") || lower.includes("group")) return "Meet-Up Groups";
  if (normalizedFallback.includes("course") || normalizedFallback.includes("training")) return "Classes";
  if (normalizedFallback.includes("range")) return "Camps";
  if (normalizedFallback.includes("competition")) return "Competitions";
  if (normalizedFallback.includes("club") || normalizedFallback.includes("association")) return "Meet-Up Groups";
  if (normalizedFallback.includes("hunting")) return "Drop-In Activities";
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

  if (
    blocks.length === 0 &&
    /\b(calendar|competition|match|cup|championship|federation|registration|versenynaptár|verseny|bajnokság|szövetség|mdlsz|hunshooting)\b/i.test(lower)
  ) {
    blocks.push({
      daysOfWeek: [],
      timeText: "Seasonal schedule on official source",
      title: "Official source schedule",
      registrationUrl: undefined,
      summary: "The source publishes federation, competition, registration, or calendar signals. Exact dates must be checked on the official source before booking claims.",
    });
  }

  return blocks.slice(0, 4);
}

function inferDescriptionFacts(text: string) {
  const candidates = splitSentences(text).filter((sentence) =>
    /\b(shooting|competition|match|range|course|training|registration|club|hunting|licence|discipline)\b/i.test(sentence),
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
    imageCandidates: discoveryArtifact.ogImageUrl
      ? [
          {
            sourceUrl: discoveryArtifact.ogImageUrl,
            sourceDocumentUrl: discoveryArtifact.sourceUrl,
            alt: `${discoveryArtifact.title} image`,
          },
        ]
      : [],
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
