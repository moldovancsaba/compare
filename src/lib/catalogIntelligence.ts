import { BOROUGHS } from "@/data/locations";
import { buildCategoryRows, buildScarcityReport, type ScarcityReport } from "@/lib/scarcityReport";
import type { MeetupGroup } from "@/types/meetup";
import type { Provider } from "@/types/provider";

export interface CatalogDriftRecord {
  entityType: "provider" | "meetupGroup";
  entityKey: string;
  driftType: "missingPublic" | "missingPrivate" | "fieldMismatch";
  privateValueSummary: string;
  publicValueSummary: string;
  severity: "info" | "warning" | "error";
  detectedAt: string;
}

export interface CatalogSnapshot {
  generatedAt: string;
  providerCountPrivate: number;
  providerCountPublic: number;
  meetupCountPrivate: number;
  meetupCountPublic: number;
  categoryBreakdown: { category: string; count: number }[];
  boroughBreakdown: Record<string, number>;
  neighborhoodBreakdown: Record<string, number>;
  activityTypeBreakdown: Record<string, number>;
  ageRangeBreakdown: Record<string, number>;
  timeTagBreakdown: Record<string, number>;
  recurringProgramCoverage: {
    providerCountWithRecurringPrograms: number;
    coverageRatio: number;
  };
  imageCoverage: {
    providersWithImages: number;
    meetupsWithImages: number;
  };
  driftSummary: {
    total: number;
    bySeverity: Record<string, number>;
    records: CatalogDriftRecord[];
  };
  scarcityReport: ScarcityReport;
}

export interface CatalogDedupeSupportIndex {
  providerNames: string[];
  meetupNames: string[];
  addresses: string[];
  websites: string[];
}

function pushCount(map: Record<string, number>, values: string[]) {
  for (const value of values) {
    map[value] = (map[value] ?? 0) + 1;
  }
}

function summarizeProvider(provider: Provider | undefined) {
  if (!provider) return "";
  return JSON.stringify({
    name: provider.name,
    borough: provider.borough,
    neighborhood: provider.neighborhood,
    address: provider.address,
    website: provider.website,
  });
}

function summarizeMeetup(meetup: MeetupGroup | undefined) {
  if (!meetup) return "";
  return JSON.stringify({
    name: meetup.name,
    borough: meetup.borough,
    neighborhood: meetup.neighborhood,
    website: meetup.website,
  });
}

export function computeCatalogDrift(
  privateProviders: Provider[],
  publicProviders: Provider[],
  privateMeetups: MeetupGroup[],
  publicMeetups: MeetupGroup[],
  generatedAt = new Date().toISOString(),
) {
  const drifts: CatalogDriftRecord[] = [];
  const privateProviderMap = new Map(privateProviders.map((provider) => [provider.id, provider]));
  const publicProviderMap = new Map(publicProviders.map((provider) => [provider.id, provider]));
  const privateMeetupMap = new Map(privateMeetups.map((meetup) => [meetup.id, meetup]));
  const publicMeetupMap = new Map(publicMeetups.map((meetup) => [meetup.id, meetup]));

  for (const provider of privateProviders) {
    const publicProvider = publicProviderMap.get(provider.id);
    if (!publicProvider) {
      drifts.push({
        entityType: "provider",
        entityKey: provider.id,
        driftType: "missingPublic",
        privateValueSummary: summarizeProvider(provider),
        publicValueSummary: "",
        severity: "warning",
        detectedAt: generatedAt,
      });
      continue;
    }
    if (
      provider.name !== publicProvider.name ||
      provider.neighborhood !== publicProvider.neighborhood ||
      provider.image !== publicProvider.image
    ) {
      drifts.push({
        entityType: "provider",
        entityKey: provider.id,
        driftType: "fieldMismatch",
        privateValueSummary: summarizeProvider(provider),
        publicValueSummary: summarizeProvider(publicProvider),
        severity: "warning",
        detectedAt: generatedAt,
      });
    }
  }

  for (const provider of publicProviders) {
    if (!privateProviderMap.has(provider.id)) {
      drifts.push({
        entityType: "provider",
        entityKey: provider.id,
        driftType: "missingPrivate",
        privateValueSummary: "",
        publicValueSummary: summarizeProvider(provider),
        severity: "error",
        detectedAt: generatedAt,
      });
    }
  }

  for (const meetup of privateMeetups) {
    const publicMeetup = publicMeetupMap.get(meetup.id);
    if (!publicMeetup) {
      drifts.push({
        entityType: "meetupGroup",
        entityKey: meetup.id,
        driftType: "missingPublic",
        privateValueSummary: summarizeMeetup(meetup),
        publicValueSummary: "",
        severity: "warning",
        detectedAt: generatedAt,
      });
      continue;
    }
    if (
      meetup.name !== publicMeetup.name ||
      meetup.neighborhood !== publicMeetup.neighborhood ||
      meetup.coverImageUrl !== publicMeetup.coverImageUrl
    ) {
      drifts.push({
        entityType: "meetupGroup",
        entityKey: meetup.id,
        driftType: "fieldMismatch",
        privateValueSummary: summarizeMeetup(meetup),
        publicValueSummary: summarizeMeetup(publicMeetup),
        severity: "warning",
        detectedAt: generatedAt,
      });
    }
  }

  for (const meetup of publicMeetups) {
    if (!privateMeetupMap.has(meetup.id)) {
      drifts.push({
        entityType: "meetupGroup",
        entityKey: meetup.id,
        driftType: "missingPrivate",
        privateValueSummary: "",
        publicValueSummary: summarizeMeetup(meetup),
        severity: "error",
        detectedAt: generatedAt,
      });
    }
  }

  return drifts;
}

export function buildDedupeSupportIndex(providers: Provider[], meetups: MeetupGroup[]): CatalogDedupeSupportIndex {
  const normalized = (value: string | undefined) => value?.trim().toLowerCase() ?? "";

  return {
    providerNames: [...new Set(providers.map((provider) => normalized(provider.name)).filter(Boolean))].sort(),
    meetupNames: [...new Set(meetups.map((meetup) => normalized(meetup.name)).filter(Boolean))].sort(),
    addresses: [...new Set(providers.map((provider) => normalized(provider.address)).filter(Boolean))].sort(),
    websites: [
      ...new Set(
        [...providers.map((provider) => normalized(provider.website)), ...meetups.map((meetup) => normalized(meetup.website))].filter(
          Boolean,
        ),
      ),
    ].sort(),
  };
}

export function buildCatalogSnapshot(
  privateProviders: Provider[],
  publicProviders: Provider[],
  privateMeetups: MeetupGroup[],
  publicMeetups: MeetupGroup[],
  generatedAt = new Date().toISOString(),
): CatalogSnapshot {
  const categoryBreakdown = buildCategoryRows(privateProviders, privateMeetups);
  const boroughBreakdown = Object.fromEntries(BOROUGHS.map((borough) => [borough, 0]));
  const neighborhoodBreakdown: Record<string, number> = {};
  const activityTypeBreakdown: Record<string, number> = {};
  const ageRangeBreakdown: Record<string, number> = {};
  const timeTagBreakdown: Record<string, number> = {};

  for (const provider of privateProviders) {
    boroughBreakdown[provider.borough] = (boroughBreakdown[provider.borough] ?? 0) + 1;
    neighborhoodBreakdown[provider.neighborhood] = (neighborhoodBreakdown[provider.neighborhood] ?? 0) + 1;
    pushCount(activityTypeBreakdown, provider.activityTypes ?? []);
    pushCount(ageRangeBreakdown, provider.ageRanges ?? []);
    pushCount(timeTagBreakdown, provider.dayTimeTags ?? []);
  }

  for (const meetup of privateMeetups) {
    boroughBreakdown[meetup.borough] = (boroughBreakdown[meetup.borough] ?? 0) + 1;
    neighborhoodBreakdown[meetup.neighborhood] = (neighborhoodBreakdown[meetup.neighborhood] ?? 0) + 1;
  }

  const driftRecords = computeCatalogDrift(privateProviders, publicProviders, privateMeetups, publicMeetups, generatedAt);
  const bySeverity = driftRecords.reduce<Record<string, number>>((acc, record) => {
    acc[record.severity] = (acc[record.severity] ?? 0) + 1;
    return acc;
  }, {});

  return {
    generatedAt,
    providerCountPrivate: privateProviders.length,
    providerCountPublic: publicProviders.length,
    meetupCountPrivate: privateMeetups.length,
    meetupCountPublic: publicMeetups.length,
    categoryBreakdown,
    boroughBreakdown,
    neighborhoodBreakdown,
    activityTypeBreakdown,
    ageRangeBreakdown,
    timeTagBreakdown,
    recurringProgramCoverage: {
      providerCountWithRecurringPrograms: privateProviders.filter((provider) => (provider.recurringPrograms?.length ?? 0) > 0).length,
      coverageRatio: privateProviders.length
        ? privateProviders.filter((provider) => (provider.recurringPrograms?.length ?? 0) > 0).length / privateProviders.length
        : 0,
    },
    imageCoverage: {
      providersWithImages: privateProviders.filter((provider) => Boolean(provider.image)).length,
      meetupsWithImages: privateMeetups.filter((meetup) => Boolean(meetup.coverImageUrl)).length,
    },
    driftSummary: {
      total: driftRecords.length,
      bySeverity,
      records: driftRecords,
    },
    scarcityReport: buildScarcityReport(privateProviders, privateMeetups, { generatedAt }),
  };
}
