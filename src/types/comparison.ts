export type ComparisonDomain = string;

export type ComparisonContext = Record<string, unknown>;

export interface ComparisonEntity {
  id: string;
  domain: ComparisonDomain;
  label: string;
  slug: string;
  aliases: string[];
  sourceUrl?: string;
  attributes?: Record<string, string | number | boolean | null>;
}

export type EvidenceKind =
  | "catalog_fact"
  | "derived_rule"
  | "editorial_inference"
  | "external_source"
  | "missing_data";

export type EvidenceConfidence = "high" | "medium" | "low";

export type EvidenceFreshness = "current" | "dated" | "unknown";

export interface EvidenceSourceReference {
  label: string;
  url?: string;
  accessedAt?: string;
}

export interface EvidenceItem {
  id: string;
  kind: EvidenceKind;
  confidence: EvidenceConfidence;
  label: string;
  detail: string;
  source?: EvidenceSourceReference;
  freshness?: EvidenceFreshness;
  appliesTo?: string[];
}

export interface EvidenceSummary {
  overallConfidence: EvidenceConfidence;
  dataQuality: EvidenceConfidence;
  evidence: EvidenceItem[];
  limitations: string[];
}

export interface InsightBlock {
  title: string;
  summary: string;
  evidence?: EvidenceItem[];
}

export interface BuyerRecommendation {
  buyerType: string;
  pick: string;
  reason: string;
  evidence?: EvidenceItem[];
}

export type RecommendationSignalKind =
  | "best_overall"
  | "best_daily"
  | "best_value"
  | "best_collector"
  | "avoid_if"
  | "no_clear_winner";

export interface RecommendationSignal {
  kind: RecommendationSignalKind;
  label: string;
  pick: string;
  reason: string;
  confidence: EvidenceConfidence;
}

export interface VerdictPick {
  label: string;
  pick: string;
  reason: string;
  evidence?: EvidenceItem[];
}

export interface ComparisonVerdict {
  bestOverall: string;
  confidence: "clear" | "contextual" | "close";
  strongerChoice: string;
  exceptionCase: string;
  confidenceRationale: string;
  headline: string;
  summary: string;
  picks: VerdictPick[];
  evidence?: EvidenceItem[];
}

export interface ComparisonSectionLabels {
  keyDifferences: string;
  realWorldImpact: string;
  ownershipIntelligence: string;
  whoShouldBuyWhich: string;
  overpricedFeatures: string;
  hiddenDownsides: string;
  betterValueAlternative: string;
  signalVsFluff: string;
}

export interface ComparisonDomainInputHints {
  leftLabel: string;
  rightLabel: string;
  placeholder: string;
  helperText: string;
}

export interface ComparisonDomainOption {
  domain: ComparisonDomain;
  label: string;
  description: string;
  examples: string[];
  inputHints: ComparisonDomainInputHints;
}

export type DataSourceTier =
  | "official_source"
  | "curated_fixture"
  | "expert_rule"
  | "community_signal"
  | "market_signal"
  | "user_supplied";

export interface DataPolicySourceTier {
  tier: DataSourceTier;
  description: string;
  defaultConfidence: EvidenceConfidence;
}

export interface DataFreshnessPolicy {
  cadence: string;
  staleAfterDays?: number;
  lastReviewed?: string;
}

export interface DataSourcePolicy {
  summary: string;
  sourceTiers: DataPolicySourceTier[];
  freshness: DataFreshnessPolicy;
  curationRules: string[];
  blockedSourceTypes: string[];
  missingDataPolicy: string;
}

export interface GenericComparisonResult {
  domain: ComparisonDomain;
  canonicalInputA: string;
  canonicalInputB: string;
  leftEntity: ComparisonEntity;
  rightEntity: ComparisonEntity;
  verdict: ComparisonVerdict;
  sectionLabels: ComparisonSectionLabels;
  evidenceSummary: EvidenceSummary;
  recommendationSignals: RecommendationSignal[];
  keyDifferences: InsightBlock[];
  realWorldImpact: InsightBlock[];
  ownershipIntelligence: InsightBlock[];
  whoShouldBuyWhich: BuyerRecommendation[];
  overpricedFeatures: InsightBlock[];
  hiddenDownsides: InsightBlock[];
  betterValueAlternative: InsightBlock[];
  signalVsFluff: InsightBlock[];
}

export type ResolveComparisonEntityResult =
  | {
      status: "resolved";
      entity: ComparisonEntity;
    }
  | {
      status: "unresolved";
      reason: string;
      suggestions?: string[];
    };

export interface ComparisonDomainAdapter<TEntity extends ComparisonEntity = ComparisonEntity> {
  domain: ComparisonDomain;
  label: string;
  description: string;
  examples: string[];
  inputHints: ComparisonDomainInputHints;
  dataPolicy: DataSourcePolicy;
  resolve(input: string): ResolveComparisonEntityResult | { status: "resolved"; entity: TEntity };
  compare(left: TEntity, right: TEntity, context?: ComparisonContext): GenericComparisonResult;
}
