export type MommyPoppinsSurfaceType = "event" | "directory" | "article" | "hub" | "submission" | "unknown";

export type MommyPoppinsRegionScope = "nyc" | "non_nyc" | "unknown";

export type MommyPoppinsSourceStatus = "eligible" | "out_of_scope" | "failed" | "duplicate";

export interface MommyPoppinsSourceRecord {
  sourceId: string;
  url: string;
  canonicalUrl: string;
  surfaceType: MommyPoppinsSurfaceType;
  regionScope: MommyPoppinsRegionScope;
  mommyPoppinsRegionId?: number;
  mommyPoppinsCategoryId?: number;
  mommyPoppinsAgeFilter?: string | null;
  titleHint?: string;
  lastmod?: string | null;
  discoveredFrom: "sitemap" | "events" | "directory" | "find" | "internal_link";
  sourceStatus: MommyPoppinsSourceStatus;
  failureReason?: string;
  scrapedAt: string;
}

export interface MommyPoppinsTaxonomyMapRow {
  sourceKey: string;
  sourceValue: string;
  classScoutTarget: string | null;
  confidence: "high" | "medium" | "low";
  notes?: string;
}

export interface MommyPoppinsInventoryReport {
  generatedAt: string;
  sourceHost: string;
  sitemapPageCount: number;
  totalUrlsDiscovered: number;
  nycEligibleCount: number;
  duplicateCount: number;
  failedCount: number;
  outOfScopeCount: number;
  records: MommyPoppinsSourceRecord[];
  taxonomyMap: MommyPoppinsTaxonomyMapRow[];
}

export interface CapabilityAuditFinding {
  capabilityId: string;
  sourceUrl: string;
  sourceSurface: "events" | "directory" | "find" | "navigation" | "submission" | "account" | "other";
  capabilityName: string;
  observedBehavior: string;
  classScoutEquivalent: string | null;
  gapStatus: "missing" | "partial" | "already_present";
  recommendation: "adopt" | "maybe" | "skip";
  recommendationReason: string;
  implementationScope: "small" | "medium" | "large";
  gdsImpact: "none" | "surface_extension" | "new_admin_surface" | "new_public_surface";
  accessibilityRisk: "low" | "medium" | "high";
  recordedAt: string;
  sourceEvidence: string[];
  scores: {
    userValue: number;
    classScoutGap: number;
    deliveryFit: number;
    operationalSafety: number;
    total: number;
  };
}

export interface MommyPoppinsCapabilityAuditReport {
  generatedAt: string;
  findings: CapabilityAuditFinding[];
}

export type ExternalLeadType = "provider" | "group" | "venue" | "event_series" | "event_instance";

export interface ExternalLead {
  leadId: string;
  leadType: ExternalLeadType;
  sourceSystem: "mommypoppins";
  canonicalSourceUrl: string;
  supportingUrls: string[];
  titleHint: string;
  boroughHint: string | null;
  neighborhoodHint: string | null;
  classScoutCategoryHint: "Classes" | "Camps" | "Birthday Parties" | "Drop-In Activities" | null;
  activityHints: string[];
  ageHints: string[];
  scheduleHints: string[];
  locationHints: string[];
  contactHints: {
    website?: string;
    phone?: string;
    email?: string;
  };
  evidenceSnippets: string[];
  confidence: "high" | "medium" | "low";
  confidenceScore: number;
  status: "pending" | "exported" | "claimed" | "generated" | "rejected" | "published";
  dedupeKeys: string[];
  generatedAt: string;
}

export interface NormalizedExternalEvent {
  externalEventId: string;
  eventType: "event_instance" | "event_series" | "venue_program" | "not_event";
  titleHint: string;
  sourceUrls: string[];
  timezone: "America/New_York";
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  recurrenceRuleText?: string;
  recurrenceDays?: string[];
  locationHint?: string;
  boroughHint?: string | null;
  neighborhoodHint?: string | null;
  ageHints: string[];
  activityHints: string[];
  priceHint?: string;
  registrationUrl?: string;
  listingMapping: {
    targetEntity: "provider" | "meetupGroup" | "discard";
    targetScheduleField: "scheduledInstances" | "recurringPrograms" | "none";
  };
  uncertainty: string[];
  evidenceSnippets: string[];
  expiresAt?: string;
}
