import type { Db } from "mongodb";
import { COL } from "@/lib/mongodb";
import { inferPublishedAt } from "@/lib/providerFreshness";
import type { MeetupGroup } from "@/types/meetup";
import type { Provider } from "@/types/provider";

export interface CatalogWatchdogConfig {
  providerSilenceHours: number;
  meetupSilenceHours: number;
  staleProviderHours: number;
}

export interface CatalogWatchdogIncident {
  code: "no_new_provider_content" | "no_new_meetup_content" | "stale_provider_backlog";
  severity: "critical" | "warning";
  message: string;
  recommendedAction: string;
}

export interface CatalogWatchdogReport {
  generatedAt: string;
  config: CatalogWatchdogConfig;
  summary: {
    providerCount: number;
    meetupCount: number;
    newestProviderPublishedAt: string | null;
    newestMeetupPublishedAt: string | null;
    hoursSinceNewestProvider: number | null;
    hoursSinceNewestMeetup: number | null;
    staleProviderCount: number;
  };
  incidents: CatalogWatchdogIncident[];
}

const DEFAULT_CONFIG: CatalogWatchdogConfig = {
  providerSilenceHours: 48,
  meetupSilenceHours: 120,
  staleProviderHours: 336,
};

function diffHours(nowMs: number, iso: string | null) {
  if (!iso) return null;
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return null;
  return Number(((nowMs - time) / 3_600_000).toFixed(2));
}

function newestProviderStamp(providers: Array<Provider & { _id?: unknown }>) {
  if (providers.length === 0) return null;
  return providers
    .map((provider) => inferPublishedAt(provider, new Date(0).toISOString()))
    .sort((left, right) => right.localeCompare(left))[0];
}

function newestMeetupStamp(meetups: MeetupGroup[]) {
  if (meetups.length === 0) return null;
  return meetups
    .map((meetup) => (typeof meetup.id === "string" ? meetup.id : ""))
    .filter(Boolean)
    .map((id) => {
      const embeddedDate = id.match(/(\d{4}-\d{2}-\d{2})/i)?.[1];
      return embeddedDate ? `${embeddedDate}T00:00:00.000Z` : null;
    })
    .filter((value): value is string => Boolean(value))
    .sort((left, right) => right.localeCompare(left))[0] ?? null;
}

export function buildCatalogWatchdogReport(
  input: {
    providers: Array<Provider & { _id?: unknown }>;
    meetups: MeetupGroup[];
    nowIso?: string;
    config?: Partial<CatalogWatchdogConfig>;
  },
): CatalogWatchdogReport {
  const config = { ...DEFAULT_CONFIG, ...input.config };
  const nowIso = input.nowIso ?? new Date().toISOString();
  const nowMs = Date.parse(nowIso);
  const newestProviderPublishedAt = newestProviderStamp(input.providers);
  const newestMeetupPublishedAt = newestMeetupStamp(input.meetups);
  const hoursSinceNewestProvider = diffHours(nowMs, newestProviderPublishedAt);
  const hoursSinceNewestMeetup = diffHours(nowMs, newestMeetupPublishedAt);
  const staleProviderCount = input.providers.filter((provider) => {
    const nextOccurrence = provider.nextOccurrence?.startDate;
    const updatedAt = provider.updatedAt ?? provider.publishedAt ?? null;
    const comparison = nextOccurrence ? `${nextOccurrence}T23:59:59.999Z` : updatedAt;
    const ageHours = diffHours(nowMs, comparison);
    return ageHours !== null && ageHours > config.staleProviderHours;
  }).length;

  const incidents: CatalogWatchdogIncident[] = [];
  if (hoursSinceNewestProvider === null || hoursSinceNewestProvider > config.providerSilenceHours) {
    incidents.push({
      code: "no_new_provider_content",
      severity: "critical",
      message: "No new provider content has been published inside the configured SLA window.",
      recommendedAction: "Open a checklist mission failure, rerun source harvest, and inspect review/publish bottlenecks.",
    });
  }
  if (input.meetups.length > 0 && (hoursSinceNewestMeetup === null || hoursSinceNewestMeetup > config.meetupSilenceHours)) {
    incidents.push({
      code: "no_new_meetup_content",
      severity: "warning",
      message: "Meetup coverage has gone stale past the configured SLA window.",
      recommendedAction: "Queue meetup-specific discovery and verify that family-fit rules are not rejecting every candidate.",
    });
  }
  if (staleProviderCount > 0) {
    incidents.push({
      code: "stale_provider_backlog",
      severity: staleProviderCount >= 10 ? "critical" : "warning",
      message: `${staleProviderCount} provider listings appear stale and need verification or takedown action.`,
      recommendedAction: "Open stale-listing recheck tasks and prioritize listings without a valid upcoming occurrence.",
    });
  }

  return {
    generatedAt: nowIso,
    config,
    summary: {
      providerCount: input.providers.length,
      meetupCount: input.meetups.length,
      newestProviderPublishedAt,
      newestMeetupPublishedAt,
      hoursSinceNewestProvider,
      hoursSinceNewestMeetup,
      staleProviderCount,
    },
    incidents,
  };
}

export async function buildCatalogWatchdogReportFromDb(
  db: Db,
  options: { nowIso?: string; config?: Partial<CatalogWatchdogConfig> } = {},
) {
  const [providers, meetups] = await Promise.all([
    db.collection(COL.providers).find({}).toArray() as unknown as Promise<Array<Provider & { _id?: unknown }>>,
    db.collection(COL.meetupGroups).find({}).toArray() as unknown as Promise<MeetupGroup[]>,
  ]);
  return buildCatalogWatchdogReport({
    providers,
    meetups,
    nowIso: options.nowIso,
    config: options.config,
  });
}

export function renderCatalogWatchdogMarkdown(report: CatalogWatchdogReport) {
  const lines: string[] = [];
  lines.push("# Catalog Ops Watchdog");
  lines.push("");
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push(`Providers: ${report.summary.providerCount}`);
  lines.push(`Meetups: ${report.summary.meetupCount}`);
  lines.push(`Hours since newest provider: ${report.summary.hoursSinceNewestProvider ?? "unknown"}`);
  lines.push(`Hours since newest meetup: ${report.summary.hoursSinceNewestMeetup ?? "unknown"}`);
  lines.push(`Stale providers: ${report.summary.staleProviderCount}`);
  lines.push("");
  lines.push("## Incidents");
  if (report.incidents.length === 0) {
    lines.push("- none");
  } else {
    for (const incident of report.incidents) {
      lines.push(`- [${incident.severity}] ${incident.code}: ${incident.message}`);
      lines.push(`  recovery: ${incident.recommendedAction}`);
    }
  }
  lines.push("");
  return `${lines.join("\n")}\n`;
}
