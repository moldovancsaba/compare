import { serviceCatalog } from "@/lib/data/service-catalog";
import { serviceDisplayName, toServiceComparisonEntity } from "@/lib/domains/service-entity";
import { compareServices } from "@/lib/services/compare-services";
import { resolveService } from "@/lib/utils/resolve-service";
import type { ComparisonDomainAdapter } from "@/types/comparison";
import type { ServiceComparisonEntity } from "@/types/service";

export const serviceDomainAdapter: ComparisonDomainAdapter<ServiceComparisonEntity> = {
  domain: "services",
  label: "Business services",
  description: "Curated service archetype comparisons with switching-cost, contract-risk, and implementation reasoning.",
  examples: serviceCatalog.map(serviceDisplayName),
  inputHints: {
    leftLabel: "First service",
    rightLabel: "Second service",
    placeholder: "Managed Customer Support or AI Support Automation",
    helperText: "This adapter supports curated business service archetypes, aliases, and operating-model terms."
  },
  dataPolicy: {
    summary:
      "The services adapter uses curated service archetypes, not live vendor facts. It is designed to compare delivery models, lock-in, implementation friction, and operational fit.",
    sourceTiers: [
      {
        tier: "curated_fixture",
        description: "Structured service archetypes, risks, integrations, and operating-model metadata maintained inside the adapter.",
        defaultConfidence: "medium"
      },
      {
        tier: "expert_rule",
        description: "Deterministic rules that translate service metadata into switching-cost, contract-risk, and implementation consequences.",
        defaultConfidence: "medium"
      },
      {
        tier: "user_supplied",
        description: "Future user-provided service context such as budget, compliance needs, and internal process maturity.",
        defaultConfidence: "low"
      }
    ],
    freshness: {
      cadence: "Review archetype fixtures whenever a service category is expanded or the scoring model changes.",
      staleAfterDays: 120
    },
    curationRules: [
      "Treat services as archetypes unless a specific vendor source is verified and timestamped.",
      "Do not imply legal, security, or procurement certainty without source-backed evidence.",
      "Surface implementation maturity and missing vendor data as confidence limitations."
    ],
    blockedSourceTypes: [
      "uncited vendor marketing claims",
      "anonymous testimonials treated as representative evidence",
      "scraped pricing without capture timestamp",
      "security or compliance claims without source documents"
    ],
    missingDataPolicy:
      "Missing live prices, legal terms, security documents, references, or process maturity inputs must appear as low-confidence missing-data evidence and limitations."
  },
  resolve(input) {
    const service = resolveService(input);

    if (!service) {
      return {
        status: "unresolved",
        reason: "No supported service archetype matched this input.",
        suggestions: serviceCatalog.slice(0, 6).map(serviceDisplayName)
      };
    }

    return {
      status: "resolved",
      entity: toServiceComparisonEntity(service)
    };
  },
  compare(left, right) {
    const leftService = serviceCatalog.find((service) => service.id === left.serviceId);
    const rightService = serviceCatalog.find((service) => service.id === right.serviceId);

    if (!leftService || !rightService) {
      throw new Error("Resolved service entity is missing from the catalog.");
    }

    return compareServices(leftService, rightService);
  }
};
