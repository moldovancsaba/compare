export type ShootingSourceClass =
  | "federation"
  | "competition_surface"
  | "club_surface"
  | "range_surface"
  | "course_surface"
  | "registration_surface"
  | "document_surface"
  | "event_surface"
  | "document";

export type ShootingTrustTier = "official_primary" | "official_secondary" | "community_hint";

export type ShootingFetchPolicy = "html" | "pdf" | "mixed" | "manual_only";

export type ShootingSourceStatus = "active" | "inactive" | "blocked" | "timeout" | "failed" | "unknown";

export type ShootingExtractorHint =
  | "federation_calendar"
  | "competition_calendar"
  | "competition_notice"
  | "club_profile"
  | "club_events"
  | "range_profile"
  | "course_offer"
  | "registration_page"
  | "document"
  | "unknown";

export interface ShootingSourceSeedRow {
  sourceId: string;
  sourceClass: ShootingSourceClass;
  operatorName: string;
  operatorType: "federation" | "club" | "range" | "trainer" | "association" | "unknown";
  canonicalUrl: string;
  discoveryUrls: string[];
  trustTier: ShootingTrustTier;
  fetchPolicy: ShootingFetchPolicy;
  robotsStatus: "allowed" | "blocked" | "unknown";
  requiresAuth: boolean;
  disciplineHints: string[];
  geoHints: string[];
  freshnessSlaHours: number;
  countryCode: "HU" | string;
  sourceNotes?: string;
}

export interface ShootingSourceHealth {
  httpStatus: number | null;
  reachable: boolean;
  requiresAuth: boolean;
  lastCheckedAt: string;
  status: ShootingSourceStatus;
}

export interface ShootingSourceInventoryRow extends ShootingSourceSeedRow {
  scrapedAt: string;
  normalizedUrl: string;
  extractorHint: ShootingExtractorHint;
  routedExtractor?: string;
  manualReviewRequired: boolean;
  health?: ShootingSourceHealth;
  sourceStatus: ShootingSourceStatus;
}

export interface ShootingSourceInventoryReport {
  generatedAt: string;
  sourceHost: "hungary-shooting";
  totalSeeds: number;
  totalRows: number;
  activeRows: number;
  blockedRows: number;
  timeoutRows: number;
  failedRows: number;
  duplicateRowsRemoved: number;
  sourceValidationErrors: Array<{
    sourceId: string;
    field: string;
    message: string;
  }>;
  rows: ShootingSourceInventoryRow[];
}

export interface ClassifiedSource {
  sourceId: string;
  canonicalUrl: string;
  sourceClass: ShootingSourceClass;
  extractorHint: ShootingExtractorHint;
  routedExtractor: string;
  confidence: "high" | "medium" | "low";
  features: string[];
  manualReviewRequired: boolean;
  notes: string[];
}

export interface ShootingCompetitionSourceRecord {
  sourceId: string;
  sourceUrl: string;
  canonicalUrl: string;
  title: string;
  federationCode: string;
  discipline: string;
  venueHint: string;
  dateFrom?: string;
  dateTo?: string;
  registrationUrl?: string;
  registrationMethod: "practiscore" | "email" | "form" | "phone" | "club_portal" | "unknown";
  membershipRequirement: "required" | "optional" | "unknown";
  capacity?: number;
  capacityUnit?: string;
  squadSystem?: string;
  paymentRequired?: boolean;
  documents: string[];
  evidenceUrl: string[];
  sourceStatus: "active" | "inactive" | "blocked" | "timeout" | "failed";
  confidence: "high" | "medium" | "low";
  confidenceScore: number;
  scrapedAt: string;
}

export interface ShootingCompetitionReport {
  generatedAt: string;
  sourceInventoryFile?: string;
  totalCandidates: number;
  highConfidenceCount: number;
  mediumConfidenceCount: number;
  lowConfidenceCount: number;
  blockedOrSkippedCount: number;
  rows: ShootingCompetitionSourceRecord[];
}

export type ShootingLeadType =
  | "competition"
  | "cup"
  | "class"
  | "group"
  | "event_series"
  | "event_instance"
  | "range"
  | "club";

export interface ShootingEntityLeadRecord {
  sourceId: string;
  sourceUrl: string;
  leadType: ShootingLeadType;
  title: string;
  description: string;
  sourceDiscipline: string;
  timezone: "Europe/Budapest";
  locationHint?: string;
  locationFallbackCity?: string;
  ageBand?: string;
  registrationUrl?: string;
  registrationMethod: "practiscore" | "email" | "form" | "phone" | "club_portal" | "unknown";
  membershipRequirement: "required" | "optional" | "unknown";
  paymentRequired?: boolean;
  sourceStatus: "active" | "inactive" | "blocked" | "timeout" | "failed";
  confidence: "high" | "medium" | "low";
  confidenceScore: number;
  evidenceUrl: string[];
  rationale: string;
  canonicalRule: string;
  startDate?: string;
  startTime?: string;
  recurrenceRuleText?: string;
  recurrenceDays?: string[];
  scrapedAt: string;
}

export interface ShootingLeadReport {
  generatedAt: string;
  sourceInventoryFile?: string;
  totalCandidates: number;
  byType: Record<ShootingLeadType, number>;
  highConfidenceCount: number;
  mediumConfidenceCount: number;
  lowConfidenceCount: number;
  blockedOrSkippedCount: number;
  rows: ShootingEntityLeadRecord[];
}

export interface ShootingEventRecord {
  sourceId: string;
  sourceUrl: string;
  leadType: "event_series" | "event_instance" | "group";
  title: string;
  description: string;
  timezone: "Europe/Budapest";
  locationHint?: string;
  startDate?: string;
  startTime?: string;
  recurrenceRuleText?: string;
  recurrenceDays?: string[];
  registrationUrl?: string;
  evidenceUrl: string[];
  sourceStatus: "active" | "inactive" | "blocked" | "timeout" | "failed";
  confidence: "high" | "medium" | "low";
  confidenceScore: number;
  scrapedAt: string;
}

export interface ShootingEventReport {
  generatedAt: string;
  sourceInventoryFile?: string;
  totalCandidates: number;
  byType: Record<ShootingEventRecord["leadType"], number>;
  highConfidenceCount: number;
  mediumConfidenceCount: number;
  lowConfidenceCount: number;
  events: ShootingEventRecord[];
}
