import { NEIGHBORHOODS } from "@/data/locations";
import { fetchText, extractMetaContent, slugify, stripHtml, unique } from "@/lib/mommyPoppins/shared";
import type { ExternalLead, MommyPoppinsInventoryReport, MommyPoppinsSourceRecord, NormalizedExternalEvent } from "@/lib/mommyPoppins/types";

const ACTIVITY_PATTERNS: Array<[string, RegExp]> = [
  ["Sports", /\bsport|athletic\b/i],
  ["Dance", /\bdance|ballet|hip hop\b/i],
  ["Gymnastics", /\bgymnastics\b/i],
  ["Art", /\bart|craft|painting|drawing\b/i],
  ["Music", /\bmusic|sing|piano|guitar|drum\b/i],
  ["STEM", /\bstem|coding|robot|engineering|science\b/i],
  ["Martial Arts", /\bkarate|taekwondo|jiu jitsu|mma|martial arts\b/i],
  ["Swimming", /\bswim|swimming|aquatic\b/i],
  ["Theater", /\btheater|theatre|acting|drama|show\b/i],
  ["Indoor Play", /\bopen play|indoor play|play space\b/i],
  ["Outdoor Activities", /\bpark|garden|nature|outdoor\b/i],
];

const BOROUGH_PATTERNS = Object.keys(NEIGHBORHOODS) as Array<keyof typeof NEIGHBORHOODS>;

function firstMatches(text: string, regex: RegExp, limit: number) {
  return [...text.matchAll(regex)].map((match) => match[0].trim()).slice(0, limit);
}

function inferBorough(text: string) {
  const lower = text.toLowerCase();
  return BOROUGH_PATTERNS.find((borough) => lower.includes(borough.toLowerCase())) ?? null;
}

function inferNeighborhood(text: string, borough: keyof typeof NEIGHBORHOODS | null) {
  if (!borough) return null;
  const lower = text.toLowerCase();
  return NEIGHBORHOODS[borough].find((neighborhood) => lower.includes(neighborhood.toLowerCase())) ?? null;
}

function directoryTaxonomyHint(url: string) {
  const path = new URL(url).pathname;
  if (path.includes("/directory/camps/")) return "Camps";
  if (path.includes("/directory/classes/")) return "Classes";
  if (path.includes("/directory/party/")) return "Competitions";
  if (path.includes("/directory/family-fun/")) return "Drop-In Activities";
  return null;
}

function inferCategory(record: MommyPoppinsSourceRecord, text: string): ExternalLead["classScoutCategoryHint"] {
  const lower = text.toLowerCase();
  if (record.surfaceType === "directory") {
    const taxonomyHint = directoryTaxonomyHint(record.canonicalUrl);
    if (taxonomyHint) return taxonomyHint;
    if (record.mommyPoppinsCategoryId === 644 || lower.includes("camp")) return "Camps";
    if (record.mommyPoppinsCategoryId === 645 || lower.includes("class")) return "Classes";
    if (record.mommyPoppinsCategoryId === 648 || lower.includes("party")) return "Competitions";
    if (record.mommyPoppinsCategoryId === 1365 || lower.includes("open play") || lower.includes("drop in")) return "Drop-In Activities";
  }
  if (record.surfaceType === "event") {
    if (lower.includes("birthday")) return "Competitions";
    if (lower.includes("open play") || lower.includes("drop-in") || lower.includes("drop in")) return "Drop-In Activities";
    return null;
  }
  if (lower.includes("camp")) return "Camps";
  if (lower.includes("birthday")) return "Competitions";
  if (lower.includes("open play") || lower.includes("drop-in") || lower.includes("drop in")) return "Drop-In Activities";
  if (lower.includes("class") || lower.includes("lesson") || lower.includes("program")) return "Classes";
  return null;
}

function inferAgeHints(text: string) {
  const lower = text.toLowerCase();
  const ages = new Set<string>();
  if (/\b(infant|baby|babies|toddler|0[-–]2)\b/.test(lower)) ages.add("0–2");
  if (/\b(preschool|pre-k|3 ?[-–] ?5|ages? 3 ?to ?5)\b/.test(lower)) ages.add("3–5");
  if (/\b(ages? 5 ?[-–] ?8|6 ?[-–] ?8|elementary)\b/.test(lower)) ages.add("6–8");
  if (/\b(ages? 9 ?[-–] ?12|middle school)\b/.test(lower)) ages.add("9–12");
  if (/\b(teen|teens|high school)\b/.test(lower)) ages.add("Teens");
  return [...ages];
}

function inferActivityHints(text: string) {
  const activities = ACTIVITY_PATTERNS.filter(([, pattern]) => pattern.test(text)).map(([name]) => name);
  return unique(activities).slice(0, 6);
}

function inferScheduleHints(text: string) {
  const hints = new Set<string>();
  const lower = text.toLowerCase();
  if (/\bmonday|tuesday|wednesday|thursday|friday\b/i.test(lower)) hints.add("Weekday");
  if (/\bsaturday|sunday|weekend\b/i.test(lower)) hints.add("Weekend");
  if (/\bmorning\b|(?:\b8|\b9|\b10|\b11)(?::\d{2})?\s*(?:a\.?m\.?|am)\b/i.test(text)) hints.add("Morning");
  if (/\bafternoon\b|(?:\b12|\b1|\b2|\b3|\b4)(?::\d{2})?\s*(?:p\.?m\.?|pm)\b/i.test(text)) hints.add("Afternoon");
  if (/\bevening\b|(?:\b5|\b6|\b7|\b8)(?::\d{2})?\s*(?:p\.?m\.?|pm)\b/i.test(text)) hints.add("Evening");
  return [...hints];
}

function inferLeadType(record: MommyPoppinsSourceRecord, text: string): ExternalLead["leadType"] {
  const lower = text.toLowerCase();
  if (record.surfaceType === "event" && /\bweekly|monthly|every\b/.test(lower)) return "event_series";
  if (record.surfaceType === "event") return "event_instance";
  if (/\bplaygroup|meetup|mom group|new parents|caregiver\b/.test(lower)) return "group";
  if (/\bvenue|museum|park|garden|zoo|center\b/.test(lower) && record.surfaceType !== "directory") return "venue";
  return "provider";
}

function leadConfidenceScore(sourceSpecificity: number, locationConfidence: number, scheduleEvidence: number, categoryConfidence: number) {
  return Number((sourceSpecificity * 0.35 + locationConfidence * 0.25 + scheduleEvidence * 0.2 + categoryConfidence * 0.2).toFixed(4));
}

function leadConfidenceBand(score: number): ExternalLead["confidence"] {
  if (score >= 0.8) return "high";
  if (score >= 0.55) return "medium";
  return "low";
}

async function fetchLeadEvidence(record: MommyPoppinsSourceRecord) {
  const html = await fetchText(record.canonicalUrl);
  const text = stripHtml(html);
  return {
    html,
    text,
    title: extractMetaContent(html, "og:title") ?? record.titleHint ?? "",
    description: extractMetaContent(html, "description") ?? extractMetaContent(html, "og:description") ?? "",
  };
}

async function mapWithConcurrency<TInput, TOutput>(
  values: TInput[],
  concurrency: number,
  worker: (value: TInput, index: number) => Promise<TOutput | null>,
) {
  const results: TOutput[] = [];
  let cursor = 0;

  async function runWorker() {
    while (cursor < values.length) {
      const index = cursor;
      cursor += 1;
      const result = await worker(values[index], index);
      if (result !== null) results.push(result);
    }
  }

  await Promise.all(Array.from({ length: Math.max(1, concurrency) }, () => runWorker()));
  return results;
}

function prioritizeEligibleRecords(records: MommyPoppinsSourceRecord[]) {
  const surfaceWeight: Record<MommyPoppinsSourceRecord["surfaceType"], number> = {
    directory: 0,
    event: 1,
    article: 2,
    hub: 3,
    submission: 4,
    unknown: 5,
  };
  return [...records].sort((left, right) => {
    const surfaceOrder = surfaceWeight[left.surfaceType] - surfaceWeight[right.surfaceType];
    if (surfaceOrder !== 0) return surfaceOrder;
    const leftDate = left.lastmod ?? "";
    const rightDate = right.lastmod ?? "";
    return rightDate.localeCompare(leftDate) || left.canonicalUrl.localeCompare(right.canonicalUrl);
  });
}

function selectEligibleRecords(records: MommyPoppinsSourceRecord[], maxRecords: number) {
  const prioritized = prioritizeEligibleRecords(records);
  const directories = prioritized.filter((record) => record.surfaceType === "directory");
  const events = prioritized.filter((record) => record.surfaceType === "event");
  const other = prioritized.filter((record) => record.surfaceType !== "directory" && record.surfaceType !== "event");
  const directoryQuota = Math.min(directories.length, Math.ceil(maxRecords * 0.5));
  const eventQuota = Math.min(events.length, Math.ceil(maxRecords * 0.4));
  const selected = [
    ...directories.slice(0, directoryQuota),
    ...events.slice(0, eventQuota),
  ];

  if (selected.length < maxRecords) {
    const remaining = maxRecords - selected.length;
    const directoryRemainder = directories.slice(directoryQuota);
    const eventRemainder = events.slice(eventQuota);
    selected.push(...directoryRemainder.slice(0, remaining));
    if (selected.length < maxRecords) {
      selected.push(...eventRemainder.slice(0, maxRecords - selected.length));
    }
    if (selected.length < maxRecords) {
      selected.push(...other.slice(0, maxRecords - selected.length));
    }
  }

  return selected.slice(0, maxRecords);
}

export async function buildMommyPoppinsLeadExport(
  report: MommyPoppinsInventoryReport,
  options: { maxRecords?: number; concurrency?: number } = {},
) {
  const generatedAt = new Date().toISOString();
  const eligible = prioritizeEligibleRecords(
    report.records.filter((record) => record.sourceStatus === "eligible" && ["directory", "event", "article", "hub"].includes(record.surfaceType)),
  );
  const maxRecords = Math.max(1, options.maxRecords ?? 60);
  const concurrency = Math.max(1, options.concurrency ?? 8);
  const selected = selectEligibleRecords(eligible, maxRecords);

  const leads = await mapWithConcurrency(selected, concurrency, async (record) => {
    try {
      const evidence = await fetchLeadEvidence(record);
      const combined = `${evidence.title}. ${evidence.description}. ${evidence.text}`;
      const categoryText = record.surfaceType === "directory" ? combined : `${evidence.title}. ${evidence.description}`;
      const locationText = record.surfaceType === "directory" ? `${evidence.title}. ${evidence.description}` : combined;
      const borough = inferBorough(locationText);
      const neighborhood = inferNeighborhood(locationText, borough);
      const category = inferCategory(record, categoryText);
      const activityHints = inferActivityHints(combined);
      const ageHints = inferAgeHints(combined);
      const scheduleHints = inferScheduleHints(combined);
      const leadType = inferLeadType(record, combined);
      const sourceSpecificity = record.surfaceType === "directory" || record.surfaceType === "event" ? 0.9 : 0.65;
      const locationConfidence = borough ? (neighborhood ? 1 : 0.7) : record.surfaceType === "directory" ? 0.45 : 0.2;
      const scheduleEvidence = scheduleHints.length > 0 ? 0.9 : record.surfaceType === "event" ? 0.65 : 0.3;
      const categoryConfidence = category ? 0.9 : record.surfaceType === "directory" ? 0.55 : 0.3;
      const confidenceScore = leadConfidenceScore(sourceSpecificity, locationConfidence, scheduleEvidence, categoryConfidence);
      const confidence = leadConfidenceBand(confidenceScore);
      if (confidence === "low") return null;

      const titleHint = evidence.title || record.titleHint || record.canonicalUrl;
      return {
        leadId: slugify(`${record.surfaceType}-${titleHint}-${borough ?? "unknown"}`),
        leadType,
        sourceSystem: "mommypoppins",
        canonicalSourceUrl: record.canonicalUrl,
        supportingUrls: [record.canonicalUrl],
        titleHint,
        boroughHint: borough,
        neighborhoodHint: neighborhood,
        classScoutCategoryHint: category,
        activityHints,
        ageHints,
        scheduleHints,
        locationHints: unique([borough, neighborhood].filter(Boolean) as string[]),
        contactHints: {
          website: record.canonicalUrl,
          email: firstMatches(combined, /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, 1)[0],
          phone: firstMatches(combined, /(?:\+1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}/g, 1)[0],
        },
        evidenceSnippets: unique(
          [evidence.description, ...combined.split(/(?<=[.?!])\s+/).filter((sentence) => /\b(kids|children|family|class|camp|party|event|program)\b/i.test(sentence)).slice(0, 3)]
            .filter(Boolean)
            .map((value) => value.trim()),
        ).slice(0, 4),
        confidence,
        confidenceScore,
        status: "exported",
        dedupeKeys: unique(
          [
            titleHint.toLowerCase(),
            record.canonicalUrl.toLowerCase(),
            [borough, neighborhood, category].filter(Boolean).join("|").toLowerCase(),
          ].filter(Boolean),
        ),
        generatedAt,
      } satisfies ExternalLead;
    } catch {
      return null;
    }
  });

  return leads.sort((a, b) => b.confidenceScore - a.confidenceScore || a.titleHint.localeCompare(b.titleHint));
}

function extractDate(text: string) {
  return text.match(/\b(20\d{2}-\d{2}-\d{2})\b/)?.[1];
}

function extractTimeRange(text: string) {
  const match = text.match(/(\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?|am|pm))(?:\s*(?:-|to)\s*)(\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?|am|pm))/i);
  return {
    startTime: match?.[1],
    endTime: match?.[2],
  };
}

function recurrenceDays(text: string) {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].filter((day) =>
    text.toLowerCase().includes(day.toLowerCase()),
  );
  return days.length ? days : undefined;
}

export function normalizeLeadEvent(lead: ExternalLead): NormalizedExternalEvent {
  const combined = lead.evidenceSnippets.join(" ");
  const startDate = extractDate(combined);
  const { startTime, endTime } = extractTimeRange(combined);
  const recurrence = /\bweekly|monthly|every|each\b/i.test(combined);
  const isEventLead = lead.leadType === "event_instance" || lead.leadType === "event_series";
  const eventType = !isEventLead
    ? "not_event"
    : recurrence
      ? "event_series"
      : startDate
        ? "event_instance"
        : "venue_program";
  const recurrenceRuleText = recurrence ? firstMatches(combined, /\b(?:weekly|monthly|every|each)[^.?!]*/gi, 1)[0] : undefined;
  const days = recurrenceDays(combined);
  const targetScheduleField =
    eventType === "event_instance" ? "scheduledInstances" : eventType === "event_series" || eventType === "venue_program" ? "recurringPrograms" : "none";
  const targetEntity = eventType === "not_event" ? "discard" : lead.leadType === "group" ? "meetupGroup" : "provider";
  const uncertainty: string[] = [];
  if (isEventLead && !startDate && !recurrence) uncertainty.push("No explicit one-off date or recurring schedule was extracted.");
  if (!lead.boroughHint) uncertainty.push("Borough could not be confidently inferred.");
  if (!lead.neighborhoodHint) uncertainty.push("Neighborhood could not be confidently inferred.");

  return {
    externalEventId: `evt-${lead.leadId}`,
    eventType,
    titleHint: lead.titleHint,
    sourceUrls: lead.supportingUrls,
    timezone: "America/New_York",
    startDate: eventType === "event_instance" ? startDate : undefined,
    startTime,
    endTime,
    recurrenceRuleText,
    recurrenceDays: days,
    locationHint: lead.locationHints.join(", ") || undefined,
    boroughHint: lead.boroughHint,
    neighborhoodHint: lead.neighborhoodHint,
    ageHints: lead.ageHints,
    activityHints: lead.activityHints,
    registrationUrl: lead.canonicalSourceUrl,
    listingMapping: {
      targetEntity,
      targetScheduleField,
    },
    uncertainty,
    evidenceSnippets: lead.evidenceSnippets,
    expiresAt: eventType === "event_instance" && startDate ? startDate : undefined,
  };
}

export function renderLeadExportMarkdown(leads: ExternalLead[]) {
  const lines: string[] = [];
  lines.push("# Mommy Poppins Local AI Lead Export");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Leads exported: ${leads.length}`);
  lines.push("");
  lines.push("## Lead counts by type");
  const counts = new Map<string, number>();
  for (const lead of leads) counts.set(lead.leadType, (counts.get(lead.leadType) ?? 0) + 1);
  for (const [leadType, count] of [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))) {
    lines.push(`- ${leadType}: ${count}`);
  }
  lines.push("");
  lines.push("## Sample leads");
  for (const lead of leads.slice(0, 25)) {
    lines.push(`- ${lead.titleHint} — ${lead.leadType} [${lead.confidence}] (${lead.canonicalSourceUrl})`);
  }
  return `${lines.join("\n")}\n`;
}

export function renderNormalizedEventsMarkdown(events: NormalizedExternalEvent[]) {
  const lines: string[] = [];
  lines.push("# Mommy Poppins Normalized Events");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Normalized events: ${events.length}`);
  lines.push("");
  for (const event of events.slice(0, 30)) {
    lines.push(`- ${event.titleHint} — ${event.eventType} -> ${event.listingMapping.targetEntity}/${event.listingMapping.targetScheduleField}`);
  }
  return `${lines.join("\n")}\n`;
}
