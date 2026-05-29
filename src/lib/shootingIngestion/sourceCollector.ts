import type {
  ClassifiedSource,
  ShootingCompetitionReport,
  ShootingCompetitionSourceRecord,
  ShootingEntityLeadRecord,
  ShootingLeadReport,
  ShootingLeadType,
  ShootingEventRecord,
  ShootingEventReport,
} from "@/lib/shootingIngestion/types";
import { findPrimaryMatch, findTypedMatches } from "@/lib/shootingIngestion/collectionRulebook";
import { normalizeDateFromText, normalizeTimeFromText } from "@/lib/shootingIngestion/sourceCollectorText";

export interface ShootingCollectionInput {
  sources: ClassifiedSource[];
  nowIso?: string;
  defaultTimezone?: string;
  maxRecordsPerSource?: number;
}

function cleanSourceUrl(url: string, fallback: string) {
  try {
    return new URL(url).toString();
  } catch {
    return fallback;
  }
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

function inferDiscipline(source: ClassifiedSource) {
  const searchable = `${source.canonicalUrl} ${source.sourceId} ${source.features.join(" ")}`.toLowerCase();
  if (searchable.includes("ipsc")) return "IPSC";
  if (searchable.includes("idpa")) return "IDPA";
  if (searchable.includes("trap")) return "trap";
  if (searchable.includes("skeet")) return "skeet";
  if (searchable.includes("prs")) return "PRS";
  if (searchable.includes("cowboy")) return "Cowboy Action Shooting";
  if (searchable.includes("hunter") || searchable.includes("mdlsz")) return "Hunter";
  if (searchable.includes("shotgun") || searchable.includes("pigeon")) return "Shotgun";
  if (searchable.includes("long range")) return "Long Range";
  if (searchable.includes("pistol")) return "Pistol";
  if (searchable.includes("rifle")) return "Rifle";
  return "mixed";
}

type LeadPlanItem = {
  leadType: ShootingLeadType;
  maxRecords: 1 | 2;
  ruleId: string;
};

function inferLeadTypesFromSource(source: ClassifiedSource): LeadPlanItem[] {
  const rules = findTypedMatches(source);
  if (rules.length > 0) {
    return rules.map((rule) => ({ leadType: rule.leadType, maxRecords: rule.maxRecords, ruleId: rule.id }));
  }

  if (source.extractorHint === "competition_calendar" || source.extractorHint === "competition_notice") {
    return [{ leadType: "competition", maxRecords: 1, ruleId: "shooting-rulebook-fallback-competition" }];
  }
  if (source.sourceClass === "course_surface") return [{ leadType: "class", maxRecords: 1, ruleId: "shooting-rulebook-fallback-class" }];
  if (source.sourceClass === "range_surface") return [{ leadType: "range", maxRecords: 1, ruleId: "shooting-rulebook-fallback-range" }];
  if (source.sourceClass === "club_surface") {
    return [
      { leadType: "club", maxRecords: 1, ruleId: "shooting-rulebook-fallback-club" },
      { leadType: "group", maxRecords: 1, ruleId: "shooting-rulebook-fallback-group" },
    ];
  }
  if (source.extractorHint === "club_events") {
    return [
      { leadType: "event_series", maxRecords: 1, ruleId: "shooting-rulebook-fallback-event-series" },
      { leadType: "event_instance", maxRecords: 1, ruleId: "shooting-rulebook-fallback-event-instance" },
    ];
  }
  return [{ leadType: "event_instance", maxRecords: 1, ruleId: "shooting-rulebook-fallback-event-instance" }];
}

function pickConfidence(source: ClassifiedSource, leadType: ShootingLeadType, ruleBoost = 0) {
  let score = 64 + ruleBoost;

  if (source.sourceClass === "federation") score += 10;
  if (source.sourceClass === "competition_surface") score += 8;
  if (source.sourceClass === "registration_surface") score += 12;
  if (source.sourceClass === "document_surface" || source.sourceClass === "document") score -= 10;
  if (source.manualReviewRequired) score -= 12;
  if (source.features.includes("official-operator")) score += 4;
  if (source.sourceId.includes("cup")) score += 2;
  if (leadType === "cup") score += 2;

  const normalized = Math.max(34, Math.min(97, score));
  if (normalized >= 75) return { confidence: "high" as const, score: normalized };
  if (normalized >= 58) return { confidence: "medium" as const, score: normalized };
  return { confidence: "low" as const, score: normalized };
}

function inferRecurrenceText(source: ClassifiedSource) {
  const text = `${source.canonicalUrl} ${source.features.join(" ")}`.toLowerCase();
  if (/\bweekly\b|\breccur|\beach\s+week|\bhet.*\s*kent|\bheti/.test(text)) {
    return { recurrenceRuleText: "weekly", recurrenceDays: ["Weekday"] };
  }
  return { recurrenceRuleText: undefined, recurrenceDays: undefined };
}

function toEntityRecord(
  source: ClassifiedSource,
  nowIso: string,
  timezone: string,
  leadType: ShootingLeadType,
  plan: LeadPlanItem,
  index = 0,
) {
  const canonicalUrl = cleanSourceUrl(source.canonicalUrl, source.canonicalUrl);
  const normalizedTitle = guessTitleFromUrl(canonicalUrl);
  const title = index > 0 ? `${normalizedTitle} (${index + 1})` : normalizedTitle;
  const date = normalizeDateFromText(canonicalUrl);
  const time = normalizeTimeFromText(canonicalUrl);
  const confidence = pickConfidence(source, leadType, plan.leadType === "competition" && source.sourceClass === "competition_surface" ? 4 : 0);
  const matched = findPrimaryMatch(source);
  const ruleId = plan.ruleId ?? matched?.id ?? "shooting-rulebook-fallback";
  const discipline = inferDiscipline(source);
  const recurrence = inferRecurrenceText(source);
  const isGeoHun = source.features.some((feature) => feature.includes("geo:HU"));

  return {
    sourceId: source.sourceId,
    sourceUrl: canonicalUrl,
    leadType,
    title,
    description: `Heuristic ${leadType} extraction from ${source.extractorHint} (${source.extractorHint === "registration_page" ? "registration-first" : "source-first"}).`,
    sourceDiscipline: discipline,
    timezone: timezone as "Europe/Budapest",
    locationHint: isGeoHun ? "Hungary" : "Europe",
    locationFallbackCity: source.canonicalUrl.includes("budapest") ? "Budapest" : "Central Europe",
    ageBand: source.features.includes("age:Youth") ? "Youth" : "All levels",
    registrationUrl: source.extractorHint === "registration_page" ? canonicalUrl : undefined,
    registrationMethod: source.extractorHint === "registration_page" ? "form" : "unknown",
    membershipRequirement: source.features.includes("official-operator") ? "required" : "optional",
    paymentRequired: source.features.includes("paid") || leadType === "competition" || leadType === "cup",
    sourceStatus: source.sourceId.includes("inactive") ? "inactive" : "active",
    confidence: confidence.confidence,
    confidenceScore: confidence.score,
    evidenceUrl: [canonicalUrl],
    rationale: `Mapped by ${ruleId}.`,
    canonicalRule: ruleId,
    startDate: date,
    startTime: time,
    recurrenceRuleText: recurrence.recurrenceRuleText,
    recurrenceDays: recurrence.recurrenceDays,
    scrapedAt: nowIso,
  } as ShootingEntityLeadRecord;
}

function toCompetitionRecord(lead: ShootingEntityLeadRecord): ShootingCompetitionSourceRecord {
  const nowIso = lead.scrapedAt;
  return {
    sourceId: lead.sourceId,
    sourceUrl: lead.sourceUrl,
    canonicalUrl: lead.sourceUrl,
    title: lead.title,
    federationCode: "MSSZ",
    discipline: lead.sourceDiscipline,
    venueHint: lead.locationHint ?? "Hungary",
    dateFrom: lead.startDate,
    dateTo: undefined,
    registrationUrl: lead.registrationUrl,
    registrationMethod: lead.registrationMethod,
    membershipRequirement: lead.membershipRequirement,
    capacity: undefined,
    capacityUnit: "participants",
    squadSystem: undefined,
    paymentRequired: lead.paymentRequired,
    documents: lead.leadType === "cup" ? ["competition-regulation", "series-brief"] : ["competition-notice"],
    evidenceUrl: lead.evidenceUrl,
    sourceStatus: lead.sourceStatus,
    confidence: lead.confidence,
    confidenceScore: lead.confidenceScore,
    scrapedAt: nowIso,
  };
}

function inferCompetitionFederationCode(sourceId: string, sourceUrl: string) {
  const combined = `${sourceId} ${sourceUrl}`.toLowerCase();
  if (combined.includes("mdlsz")) return "MDLSZ";
  if (combined.includes("ipsch")) return "IPSC";
  if (combined.includes("idpa")) return "IDPA";
  if (combined.includes("hun") || combined.includes("mssz")) return "MSSZ";
  return "MSSZ";
}

function dedupe<T extends { sourceUrl: string; title: string; leadType: string }>(rows: T[]) {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = `${row.leadType}::${row.sourceUrl}::${row.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function runLeadType(
  sources: ClassifiedSource[],
  nowIso: string,
  timezone: string,
  supported: ShootingLeadType[],
  maxRecordsPerSource?: number,
) {
  const rows: ShootingEntityLeadRecord[] = [];

  for (const source of sources) {
    let remaining = maxRecordsPerSource ?? Number.MAX_SAFE_INTEGER;
    const leadPlan = inferLeadTypesFromSource(source);
    for (const lead of leadPlan.filter((lead) => supported.includes(lead.leadType))) {
      if (remaining <= 0) break;
      const runTimes = Math.min(remaining, lead.maxRecords);
      for (let index = 0; index < runTimes; index++) {
        const row = toEntityRecord(source, nowIso, timezone, lead.leadType, lead, index);
        if (index > 0 && lead.leadType === "event_instance") {
          rows.push({ ...row, confidence: "medium", confidenceScore: Math.max(48, row.confidenceScore - 12) });
        } else {
          rows.push(row);
        }
        remaining -= 1;
        if (remaining <= 0) break;
      }
    }
  }

  return dedupe(rows);
}

function summarize(rows: ShootingEntityLeadRecord[]) {
  const byType = {
    competition: 0,
    cup: 0,
    class: 0,
    group: 0,
    event_series: 0,
    event_instance: 0,
    range: 0,
    club: 0,
  };

  for (const row of rows) byType[row.leadType] += 1;

  return {
    byType,
    highConfidenceCount: rows.filter((row) => row.confidence === "high").length,
    mediumConfidenceCount: rows.filter((row) => row.confidence === "medium").length,
    lowConfidenceCount: rows.filter((row) => row.confidence === "low").length,
    blockedOrSkippedCount: rows.filter((row) => row.sourceStatus !== "active").length,
  };
}

export async function collectCompetitionLeads(input: ShootingCollectionInput): Promise<ShootingCompetitionReport> {
  const nowIso = input.nowIso ?? new Date().toISOString();
  const maxRecordsPerSource = input.maxRecordsPerSource ?? 1;
  const timezone = input.defaultTimezone ?? "Europe/Budapest";
  const candidates: ShootingCompetitionSourceRecord[] = [];

  const competitionRows = runLeadType(input.sources, nowIso, timezone, ["competition", "cup"], maxRecordsPerSource).filter(
    (row): row is ShootingEntityLeadRecord & { leadType: "competition" | "cup" } => row.leadType === "competition" || row.leadType === "cup",
  );

  for (const row of competitionRows) {
    const sourceTypeCode = inferCompetitionFederationCode(row.sourceId, row.sourceUrl);
    const competition = toCompetitionRecord(row);
    candidates.push({
      ...competition,
      federationCode: sourceTypeCode,
      squadSystem: row.leadType === "cup" ? "Series" : competition.squadSystem,
      documents: row.leadType === "cup" ? ["competition-regulation", "prize-list"] : competition.documents,
      confidence: row.confidence,
      confidenceScore: row.confidenceScore,
      sourceStatus: row.sourceStatus,
    });
  }

  return {
    generatedAt: nowIso,
    sourceInventoryFile: undefined,
    totalCandidates: candidates.length,
    highConfidenceCount: candidates.filter((item) => item.confidence === "high").length,
    mediumConfidenceCount: candidates.filter((item) => item.confidence === "medium").length,
    lowConfidenceCount: candidates.filter((item) => item.confidence === "low").length,
    blockedOrSkippedCount: candidates.filter((item) => item.sourceStatus !== "active").length,
    rows: candidates,
  };
}

export async function collectEventLeads(input: ShootingCollectionInput): Promise<ShootingEventReport> {
  const nowIso = input.nowIso ?? new Date().toISOString();
  const timezone = input.defaultTimezone ?? "Europe/Budapest";
  const maxRecordsPerSource = input.maxRecordsPerSource ?? 2;
  const rows = runLeadType(input.sources, nowIso, timezone, ["event_series", "event_instance", "group"], maxRecordsPerSource).filter(
    (row) => row.leadType === "event_series" || row.leadType === "event_instance" || row.leadType === "group",
  );

  const capped = rows.slice(0, Math.max(1, input.sources.length * maxRecordsPerSource));
  const byType = {
    event_series: 0,
    event_instance: 0,
    group: 0,
  } as Record<ShootingEventRecord["leadType"], number>;

  for (const row of capped) {
    byType[row.leadType as "event_series" | "event_instance" | "group"] += 1;
  }

  const converted: ShootingEventRecord[] = capped.map((row) => ({
    sourceId: row.sourceId,
    sourceUrl: row.sourceUrl,
    leadType: row.leadType === "group" ? "group" : "event_instance",
    title: row.title,
    description: row.description,
    timezone: row.timezone,
    locationHint: row.locationHint,
    startDate: row.startDate,
    startTime: row.startTime,
    recurrenceRuleText: row.recurrenceRuleText,
    recurrenceDays: row.recurrenceDays,
    registrationUrl: row.registrationUrl,
    evidenceUrl: row.evidenceUrl,
    sourceStatus: row.sourceStatus,
    confidence: row.confidence,
    confidenceScore: row.confidenceScore,
    scrapedAt: row.scrapedAt,
  }));

  return {
    generatedAt: nowIso,
    sourceInventoryFile: undefined,
    totalCandidates: capped.length,
    byType,
    highConfidenceCount: converted.filter((row) => row.confidence === "high").length,
    mediumConfidenceCount: converted.filter((row) => row.confidence === "medium").length,
    lowConfidenceCount: converted.filter((row) => row.confidence === "low").length,
    events: converted,
  };
}

export async function collectArtifactsFromClassifiedSources(
  sources: ClassifiedSource[],
  nowIso: string,
  timezone = "Europe/Budapest",
) {
  const all = runLeadType(sources, nowIso, timezone, [
    "competition",
    "cup",
    "class",
    "group",
    "event_series",
    "event_instance",
    "range",
    "club",
  ]);
  const summary = summarize(all);

  return {
    competitions: await collectCompetitionLeads({ sources, nowIso }),
    events: await collectEventLeads({ sources, nowIso, defaultTimezone: timezone }),
    entityLeads: {
      generatedAt: nowIso,
      sourceInventoryFile: undefined,
      totalCandidates: all.length,
      byType: summary.byType,
      highConfidenceCount: summary.highConfidenceCount,
      mediumConfidenceCount: summary.mediumConfidenceCount,
      lowConfidenceCount: summary.lowConfidenceCount,
      blockedOrSkippedCount: summary.blockedOrSkippedCount,
      rows: all,
    } as ShootingLeadReport,
  };
}
