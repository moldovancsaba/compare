import type { ComparisonEntity, GenericComparisonResult } from "@/types/comparison";

export interface ServiceSpec {
  id: string;
  name: string;
  category: "customer-support" | "finance-operations" | "growth-operations";
  slug: string;
  aliases: string[];
  sourceUrl?: string;
  pricingModel: string;
  targetUser: string;
  integrations: string[];
  supportModel: string;
  contractRisk: "low" | "medium" | "high";
  switchingCost: "low" | "medium" | "high";
  compliancePosture: "lightweight" | "standard" | "strict";
  implementationComplexity: "low" | "medium" | "high";
  automationDepth: "low" | "medium" | "high";
  humanExpertise: "low" | "medium" | "high";
  bestFor: string[];
  risks: string[];
  evidenceNotes: string[];
}

export type ServiceComparisonEntity = ComparisonEntity & {
  domain: "services";
  serviceId: string;
};

export interface ServiceComparisonResult extends GenericComparisonResult {
  domain: "services";
  leftEntity: ServiceComparisonEntity;
  rightEntity: ServiceComparisonEntity;
  left: ServiceSpec;
  right: ServiceSpec;
}
