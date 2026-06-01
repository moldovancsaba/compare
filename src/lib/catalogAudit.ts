import type { MeetupGroup } from "@/types/meetup";
import type { DayTimeTag, Provider, RecurringProgram } from "@/types/provider";

export type CuratedCatalogEntry = {
  resource: "provider" | "meetupGroup";
  id: string;
  file: string;
  document: Record<string, unknown>;
};

export type CatalogAuditReport = {
  generatedAt: string;
  providersCount: number;
  meetupCount: number;
  findings: string[];
};

const WEEKDAY_DAYS = new Set(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
const WEEKEND_DAYS = new Set(["Saturday", "Sunday"]);

function parseClockTimes(timeText: string) {
  const matches = [...String(timeText || "").matchAll(/(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)/gi)];
  return matches.map((m) => {
    let hour = Number(m[1]);
    const min = Number(m[2] || "0");
    const raw = String(m[3] || "").toLowerCase();
    const pm = raw.startsWith("p");
    if (hour === 12) hour = pm ? 12 : 0;
    else if (pm) hour += 12;
    return hour + min / 60;
  });
}

function deriveTagsFromRecurringPrograms(programs: RecurringProgram[]) {
  const tags = new Set<DayTimeTag>();
  for (const program of programs || []) {
    const days = Array.isArray(program.daysOfWeek) ? program.daysOfWeek : [];
    if (days.some((d) => WEEKDAY_DAYS.has(d))) tags.add("Weekday");
    if (days.some((d) => WEEKEND_DAYS.has(d))) tags.add("Weekend");

    const times = parseClockTimes(program.timeText);
    for (const t of times) {
      if (t < 12) tags.add("Morning");
      else if (t < 17) tags.add("Afternoon");
      else tags.add("Evening");
    }
    if (days.some((d) => WEEKDAY_DAYS.has(d)) && times.some((t) => t >= 15 && t < 18.5)) {
      tags.add("After-school");
    }
  }
  return tags;
}

export function pastYearRisk(text: string, currentYear: number) {
  const cleaned = String(text || "").replace(/https?:\/\/\S+/g, " ");
  const years = [...cleaned.matchAll(/\b20\d{2}\b/g)];
  const stale = new Set<number>();
  for (const match of years) {
    const year = Number(match[0]);
    if (year >= currentYear) continue;
    const start = Math.max(0, (match.index || 0) - 48);
    const end = Math.min(cleaned.length, (match.index || 0) + 48);
    const context = cleaned.slice(start, end).toLowerCase();
    if (
      /\b(camp|class|party|season|session|registration|program|guide|school year|open house|schedule|weekly|monthly|saturday|sunday|monday|tuesday|wednesday|thursday|friday)\b/.test(
        context,
      )
    ) {
      stale.add(year);
    }
  }
  return [...stale].sort();
}

export function buildCatalogAuditReport(args: {
  providers: Provider[];
  meetups: MeetupGroup[];
  curatedEntries: CuratedCatalogEntry[];
  generatedAt?: string;
  currentYear?: number;
  today?: string;
}) {
  const currentYear = args.currentYear ?? new Date().getUTCFullYear();
  const today = args.today ?? new Date().toISOString().slice(0, 10);
  const providerById = new Map(args.providers.map((provider) => [provider.id, provider]));
  const meetupById = new Map(args.meetups.map((meetup) => [meetup.id, meetup]));
  const findings: string[] = [];

  args.providers.forEach((provider) => {
    const tags = new Set(provider.dayTimeTags || []);
    const badges = new Set(provider.badges || []);
    if (!String(provider.image || "").trim()) {
      findings.push(`- [provider] ${provider.id}: missing live image`);
    }
    if (badges.has("Weekend Friendly") && !tags.has("Weekend")) {
      findings.push(`- [provider] ${provider.id}: Weekend Friendly badge without Weekend tag`);
    }
    if (provider.recurringPrograms?.length) {
      const derived = deriveTagsFromRecurringPrograms(provider.recurringPrograms);
      for (const tag of derived) {
        if (!tags.has(tag)) findings.push(`- [provider] ${provider.id}: recurringPrograms imply missing tag ${tag}`);
      }
      provider.recurringPrograms.forEach((program) => {
        if (program.endDate && program.endDate < today) {
          findings.push(`- [provider] ${provider.id}: recurring program ${program.id} ended on ${program.endDate}`);
        }
      });
    }
    const staleYears = pastYearRisk(`${provider.longDescription || ""}\n${provider.announcementDescription || ""}`, currentYear);
    if (staleYears.length > 0) {
      findings.push(`- [provider] ${provider.id}: stale-year risk in text (${staleYears.join(", ")})`);
    }
  });

  args.meetups.forEach((meetup) => {
    if (!String(meetup.coverImageUrl || "").trim()) {
      findings.push(`- [meetup] ${meetup.id}: missing live cover image`);
    }
    const staleYears = pastYearRisk(meetup.description || "", currentYear);
    if (staleYears.length > 0) {
      findings.push(`- [meetup] ${meetup.id}: stale-year risk in description (${staleYears.join(", ")})`);
    }
  });

  args.curatedEntries.forEach((entry) => {
    if (entry.resource === "provider" && !providerById.has(entry.id)) {
      findings.push(`- [payload drift] ${entry.id}: curated provider payload exists in ${entry.file} but no live row is present`);
    }
    if (entry.resource === "meetupGroup" && !meetupById.has(entry.id)) {
      findings.push(`- [payload drift] ${entry.id}: curated meetup payload exists in ${entry.file} but no live row is present`);
    }
  });

  return {
    generatedAt: args.generatedAt || new Date().toISOString(),
    providersCount: args.providers.length,
    meetupCount: args.meetups.length,
    findings,
  } satisfies CatalogAuditReport;
}

export function renderCatalogAuditMarkdown(report: CatalogAuditReport) {
  const lines: string[] = [];
  lines.push("# Compare Live Catalog Audit");
  lines.push("");
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push(`Live rows: providers=${report.providersCount}, meetupGroups=${report.meetupCount}`);
  lines.push("");
  if (report.findings.length === 0) {
    lines.push("No findings.");
  } else {
    lines.push("## Findings");
    report.findings.forEach((finding) => lines.push(finding));
  }
  return `${lines.join("\n")}\n`;
}
