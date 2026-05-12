export type ComparisonDomain = string;

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

export interface VerdictPick {
  label: string;
  pick: string;
  reason: string;
  evidence?: EvidenceItem[];
}

export interface ComparisonVerdict {
  bestOverall: string;
  confidence: "clear" | "contextual" | "close";
  headline: string;
  summary: string;
  picks: VerdictPick[];
  evidence?: EvidenceItem[];
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

export interface GenericComparisonResult {
  domain: ComparisonDomain;
  canonicalInputA: string;
  canonicalInputB: string;
  leftEntity: ComparisonEntity;
  rightEntity: ComparisonEntity;
  verdict: ComparisonVerdict;
  evidenceSummary: EvidenceSummary;
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
  resolve(input: string): ResolveComparisonEntityResult | { status: "resolved"; entity: TEntity };
  compare(left: TEntity, right: TEntity): GenericComparisonResult;
}
