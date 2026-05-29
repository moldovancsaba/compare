import type {
  ClassifiedSource,
  ShootingCompetitionSourceRecord,
  ShootingCompetitionReport,
  ShootingEventRecord,
  ShootingEventReport,
} from "@/lib/shootingIngestion/types";
import { normalizeDateFromText, normalizeTimeFromText } from "@/lib/shootingIngestion/sourceCollectorText";

export interface ShootingCollectionInput {
  sources: ClassifiedSource[];
  nowIso?: string;
  defaultTimezone?: string;
  maxRecordsPerSource?: number;
}

function guessTitleFromUrl(url: string) {
  return (
    url
      .split("/")
      .filter(Boolean)
      .at(-1)
      ?.replace(/-|_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase()) ?? "Untitled Source"
  );
}

function cleanSourceUrl(url: string, fallback: string) {
  try {
    return new URL(url).toString();
  } catch {
    return fallback;
  }
}

function toCompetitionRecord(source: ClassifiedSource, nowIso: string): ShootingCompetitionSourceRecord {
  const canonicalUrl = cleanSourceUrl(source.canonicalUrl, source.canonicalUrl);
  const title = guessTitleFromUrl(canonicalUrl);
  const dateFrom = normalizeDateFromText(canonicalUrl);
  const venueHint = source.canonicalUrl.includes("budapest") ? "Budapest" : "Hungary";
  return {
    sourceId: source.sourceId,
    sourceUrl: canonicalUrl,
    canonicalUrl,
    title,
    federationCode: "MSSZ",
    discipline: source.features.includes("disciplines:0")
      ? "multi-discipline"
      : source.features
          .find((feature) => feature.startsWith("disciplines:"))
          ?.replace("disciplines:", "sports-") ?? "mixed",
    venueHint,
    dateFrom,
    dateTo: undefined,
    registrationUrl: source.extractorHint === "registration_page" ? canonicalUrl : undefined,
    registrationMethod: source.extractorHint === "registration_page" ? "form" : "unknown",
    membershipRequirement: source.features.includes("official-operator") ? "unknown" : "optional",
    capacity: undefined,
    capacityUnit: "participants",
    squadSystem: undefined,
    paymentRequired: false,
    documents: [],
    evidenceUrl: [canonicalUrl],
    sourceStatus: source.sourceId.includes("inactive") ? "inactive" : "active",
    confidence: source.manualReviewRequired || source.confidence === "low" ? "medium" : source.confidence,
    confidenceScore: source.confidence === "high" ? 82 : source.confidence === "medium" ? 64 : 46,
    scrapedAt: nowIso,
  };
}

function toEventRecord(source: ClassifiedSource, nowIso: string, timezone: string): ShootingEventRecord {
  const canonicalUrl = cleanSourceUrl(source.canonicalUrl, source.canonicalUrl);
  const title = guessTitleFromUrl(canonicalUrl);
  return {
    sourceId: source.sourceId,
    sourceUrl: canonicalUrl,
    leadType: "event_instance",
    title,
    description: `Heuristic event extraction from ${source.extractorHint} surface.`,
    timezone: timezone as "Europe/Budapest",
    locationHint: source.features.includes("geo:HU") ? "Hungary" : "Hungary",
    startDate: normalizeDateFromText(canonicalUrl),
    startTime: normalizeTimeFromText(canonicalUrl),
    recurrenceRuleText: undefined,
    recurrenceDays: undefined,
    registrationUrl: source.extractorHint === "registration_page" ? canonicalUrl : undefined,
    evidenceUrl: [canonicalUrl],
    sourceStatus: source.sourceId.includes("inactive") ? "inactive" : "active",
    confidence: source.manualReviewRequired || source.confidence === "low" ? "medium" : source.confidence,
    confidenceScore: source.confidence === "high" ? 78 : source.confidence === "medium" ? 60 : 44,
    scrapedAt: nowIso,
  };
}

export async function collectCompetitionLeads(input: ShootingCollectionInput): Promise<ShootingCompetitionReport> {
  const nowIso = input.nowIso ?? new Date().toISOString();
  const maxRecordsPerSource = input.maxRecordsPerSource ?? 1;
  const supported = new Set(["competition_calendar", "competition_notice", "registration_page", "document"]);
  const candidates: ShootingCompetitionSourceRecord[] = [];

  for (const source of input.sources) {
    if (!supported.has(source.extractorHint)) {
      continue;
    }
    const runTimes = Math.min(maxRecordsPerSource, 1);
    for (let index = 0; index < runTimes; index++) {
      const candidate = toCompetitionRecord(source, nowIso);
      const confidence = index > 0 ? "medium" : candidate.confidence;
      const confidenceScore =
        index > 0 ? 62 : candidate.confidence === "high" ? 80 : candidate.confidence === "medium" ? 62 : 42;
      candidates.push({
        ...candidate,
        confidence,
        confidenceScore,
        sourceStatus: "active",
      });
    }
  }

  const highConfidenceCount = candidates.filter((item) => item.confidence === "high").length;
  const mediumConfidenceCount = candidates.filter((item) => item.confidence === "medium").length;
  const lowConfidenceCount = candidates.filter((item) => item.confidence === "low").length;

  const blockedOrSkippedCount = candidates.filter((item) => item.sourceStatus !== "active").length;

  return {
    generatedAt: nowIso,
    sourceInventoryFile: undefined,
    totalCandidates: candidates.length,
    highConfidenceCount,
    mediumConfidenceCount,
    lowConfidenceCount,
    blockedOrSkippedCount,
    rows: candidates,
  };
}

export async function collectEventLeads(input: ShootingCollectionInput): Promise<ShootingEventReport> {
  const nowIso = input.nowIso ?? new Date().toISOString();
  const timezone = input.defaultTimezone ?? "Europe/Budapest";
  const maxRecordsPerSource = input.maxRecordsPerSource ?? 2;
  const candidates: ShootingEventRecord[] = [];

  for (const source of input.sources) {
    const repeats = source.manualReviewRequired ? 0 : 1;
    const runTimes = Math.min(maxRecordsPerSource, repeats || 1);
    for (let index = 0; index < runTimes; index++) {
      const base = toEventRecord(source, nowIso, timezone);
      candidates.push({
        ...base,
        confidence: index > 0 ? "medium" : base.confidence,
        confidenceScore: index > 0 ? 58 : base.confidenceScore,
      });
    }
  }

  const byType = { event_series: 0, event_instance: 0, group: 0 } as Record<ShootingEventRecord["leadType"], number>;
  for (const row of candidates) byType[row.leadType] += 1;

  return {
    generatedAt: nowIso,
    sourceInventoryFile: undefined,
    totalCandidates: candidates.length,
    byType,
    highConfidenceCount: candidates.filter((row) => row.confidence === "high").length,
    mediumConfidenceCount: candidates.filter((row) => row.confidence === "medium").length,
    lowConfidenceCount: candidates.filter((row) => row.confidence === "low").length,
    events: candidates,
  };
}

export async function collectArtifactsFromClassifiedSources(
  sources: ClassifiedSource[],
  nowIso: string,
  timezone = "Europe/Budapest",
) {
  return {
    competitions: await collectCompetitionLeads({ sources, nowIso }),
    events: await collectEventLeads({ sources, nowIso, defaultTimezone: timezone }),
  };
}
