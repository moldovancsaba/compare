import { serviceCatalog } from "@/lib/data/service-catalog";
import { toServiceComparisonEntity } from "@/lib/domains/service-entity";
import type { EvidenceItem, EvidenceSummary } from "@/types/comparison";
import type { ServiceComparisonResult, ServiceSpec } from "@/types/service";

type Rating = "low" | "medium" | "high";

function ratingScore(value: Rating): number {
  switch (value) {
    case "low":
      return 1;
    case "medium":
      return 2;
    case "high":
      return 3;
  }
}

function complianceScore(value: ServiceSpec["compliancePosture"]): number {
  switch (value) {
    case "lightweight":
      return 1;
    case "standard":
      return 2;
    case "strict":
      return 3;
  }
}

function serviceEvidence(service: ServiceSpec, id: string, detail: string): EvidenceItem {
  return {
    id: `${service.id}:${id}`,
    kind: "catalog_fact",
    confidence: "medium",
    label: `${service.name} curated service fixture`,
    detail,
    freshness: "unknown",
    appliesTo: [service.id]
  };
}

function ruleEvidence(id: string, label: string, detail: string, services: ServiceSpec[]): EvidenceItem {
  return {
    id,
    kind: "derived_rule",
    confidence: "medium",
    label,
    detail,
    freshness: "current",
    appliesTo: services.map((service) => service.id)
  };
}

function inferenceEvidence(id: string, label: string, detail: string, services: ServiceSpec[]): EvidenceItem {
  return {
    id,
    kind: "editorial_inference",
    confidence: "medium",
    label,
    detail,
    freshness: "current",
    appliesTo: services.map((service) => service.id)
  };
}

function missingEvidence(id: string, label: string, detail: string, services: ServiceSpec[]): EvidenceItem {
  return {
    id,
    kind: "missing_data",
    confidence: "low",
    label,
    detail,
    freshness: "unknown",
    appliesTo: services.map((service) => service.id)
  };
}

function complexityPenalty(service: ServiceSpec): number {
  return ratingScore(service.contractRisk) + ratingScore(service.switchingCost) + ratingScore(service.implementationComplexity);
}

function operationalFitScore(service: ServiceSpec): number {
  return (
    ratingScore(service.automationDepth) * 2 +
    ratingScore(service.humanExpertise) * 2 +
    service.integrations.length -
    complexityPenalty(service)
  );
}

function flexibilityScore(service: ServiceSpec): number {
  return 10 - ratingScore(service.contractRisk) * 2 - ratingScore(service.switchingCost) * 2 - ratingScore(service.implementationComplexity);
}

function governanceScore(service: ServiceSpec): number {
  return complianceScore(service.compliancePosture) + ratingScore(service.humanExpertise) + (service.category === "finance-operations" ? 2 : 0);
}

function pickHigher(left: ServiceSpec, right: ServiceSpec, scorer: (service: ServiceSpec) => number): ServiceSpec {
  return scorer(left) >= scorer(right) ? left : right;
}

function riskPhrase(service: ServiceSpec): string {
  return `${service.name} carries ${service.contractRisk} contract risk, ${service.switchingCost} switching cost, and ${service.implementationComplexity} implementation complexity.`;
}

function buildVerdict(left: ServiceSpec, right: ServiceSpec): ServiceComparisonResult["verdict"] {
  const operationalPick = pickHigher(left, right, operationalFitScore);
  const flexibilityPick = pickHigher(left, right, flexibilityScore);
  const governancePick = pickHigher(left, right, governanceScore);
  const bestOverall = pickHigher(left, right, (service) => operationalFitScore(service) + flexibilityScore(service));
  const other = bestOverall.id === left.id ? right : left;
  const gap = Math.abs(
    operationalFitScore(left) + flexibilityScore(left) - (operationalFitScore(right) + flexibilityScore(right))
  );
  const confidence = gap >= 4 ? "clear" : gap <= 1 ? "close" : "contextual";

  return {
    bestOverall: bestOverall.name,
    confidence,
    strongerChoice: bestOverall.name,
    exceptionCase: `${other.name} is still the better fit if its delivery model maps more closely to your team's operating maturity and risk tolerance.`,
    confidenceRationale:
      confidence === "clear"
        ? "Operational fit and reversibility create enough separation for a strong service recommendation."
        : "The service tradeoffs are close enough that team maturity, procurement constraints, and implementation bandwidth can change the answer.",
    headline:
      confidence === "clear"
        ? `${bestOverall.name} is the stronger default for this service decision.`
        : `${bestOverall.name} is the safer default, but the right answer depends on operating context.`,
    summary: `${other.name} still makes sense if its specific delivery model matches your team. The practical choice is less about feature count and more about contract friction, switching cost, and how much expert judgment the work needs.`,
    evidence: [
      ruleEvidence(
        "services:verdict-score",
        "Service decision scoring",
        "The verdict weighs operational fit and flexibility before secondary strengths.",
        [left, right]
      )
    ],
    picks: [
      {
        label: "Best overall",
        pick: bestOverall.name,
        reason: `${bestOverall.name} offers the better balance of useful operating leverage and manageable adoption friction.`,
        evidence: [
          ruleEvidence(
            "services:best-overall-balance",
            "Balanced service score",
            "Best overall combines operational fit, automation or expertise depth, switching cost, and implementation complexity.",
            [left, right]
          )
        ]
      },
      {
        label: "Lowest switching risk",
        pick: flexibilityPick.name,
        reason: "The lower-risk choice is easier to trial, unwind, or replace if the working relationship does not match expectations."
      },
      {
        label: "Best for governed work",
        pick: governancePick.name,
        reason: "The stronger governed-work choice has the better mix of compliance posture, human expertise, and decision accountability."
      },
      {
        label: "Best operating leverage",
        pick: operationalPick.name,
        reason: "The stronger leverage choice removes more recurring operational load relative to implementation friction."
      }
    ]
  };
}

function buildKeyDifferences(left: ServiceSpec, right: ServiceSpec): ServiceComparisonResult["keyDifferences"] {
  return [
    {
      title: "Delivery model",
      summary: `${left.name} is ${left.supportModel.toLowerCase()}. ${right.name} is ${right.supportModel.toLowerCase()}.`,
      evidence: [
        serviceEvidence(left, "support-model", "Support model is fixture-backed adapter metadata."),
        serviceEvidence(right, "support-model", "Support model is fixture-backed adapter metadata.")
      ]
    },
    {
      title: "Pricing exposure",
      summary: `${left.name}: ${left.pricingModel}. ${right.name}: ${right.pricingModel}. The real comparison is predictability versus elasticity, not the sticker format alone.`,
      evidence: [
        serviceEvidence(left, "pricing-model", "Pricing model is a curated archetype, not a live vendor quote."),
        serviceEvidence(right, "pricing-model", "Pricing model is a curated archetype, not a live vendor quote.")
      ]
    },
    {
      title: "Integration footprint",
      summary: `${left.name} usually touches ${left.integrations.join(", ")}. ${right.name} usually touches ${right.integrations.join(", ")}. More integrations can create leverage, but also more implementation surface area.`,
      evidence: [
        ruleEvidence(
          "services:integration-footprint",
          "Integration friction rule",
          "Integration count is treated as useful leverage and as implementation surface area.",
          [left, right]
        )
      ]
    }
  ];
}

function buildRealWorldImpact(left: ServiceSpec, right: ServiceSpec): ServiceComparisonResult["realWorldImpact"] {
  const flexibilityPick = pickHigher(left, right, flexibilityScore);
  const expertisePick = pickHigher(left, right, (service) => ratingScore(service.humanExpertise));
  const automationPick = pickHigher(left, right, (service) => ratingScore(service.automationDepth));

  return [
    {
      title: "Switching cost",
      summary: `${riskPhrase(left)} ${riskPhrase(right)} ${flexibilityPick.name} is easier to test or unwind if the fit is uncertain.`,
      evidence: [
        ruleEvidence(
          "services:switching-cost-rule",
          "Switching-cost rule",
          "Contract risk, switching cost, and implementation complexity determine reversibility.",
          [left, right]
        )
      ]
    },
    {
      title: "Human judgment",
      summary: `${expertisePick.name} is stronger when ambiguous judgment, stakeholder management, or exception handling matter more than raw throughput.`
    },
    {
      title: "Automation leverage",
      summary: `${automationPick.name} is stronger when the work is repeatable, documented, and measurable enough for automation to compound.`
    }
  ];
}

function buildOwnershipIntelligence(left: ServiceSpec, right: ServiceSpec): ServiceComparisonResult["ownershipIntelligence"] {
  return [
    {
      title: "Operational ownership",
      summary: `${left.name} works best for ${left.targetUser.toLowerCase()}. ${right.name} works best for ${right.targetUser.toLowerCase()}.`,
      evidence: [
        serviceEvidence(left, "target-user", "Target user is adapter fixture metadata."),
        serviceEvidence(right, "target-user", "Target user is adapter fixture metadata.")
      ]
    },
    {
      title: "Contract reality",
      summary: `Treat ${left.name} as ${left.contractRisk} contract risk and ${right.name} as ${right.contractRisk} contract risk. The more bespoke the delivery, the more exit planning matters before signup.`
    },
    {
      title: "Compliance posture",
      summary: `${left.name} has a ${left.compliancePosture} compliance posture; ${right.name} has a ${right.compliancePosture} compliance posture. Governed work needs documented responsibilities, retention rules, and auditability before price optimization.`
    }
  ];
}

function buildBuyerRecommendations(left: ServiceSpec, right: ServiceSpec): ServiceComparisonResult["whoShouldBuyWhich"] {
  const flexible = pickHigher(left, right, flexibilityScore);
  const governed = pickHigher(left, right, governanceScore);
  const leverage = pickHigher(left, right, operationalFitScore);

  return [
    {
      buyerType: "Early-stage operator",
      pick: flexible.name,
      reason: "Pick the option with lower lock-in and implementation drag while your operating model is still changing."
    },
    {
      buyerType: "Governed team",
      pick: governed.name,
      reason: "Pick the option with stronger accountability, compliance posture, and expert judgment when mistakes create operational or regulatory risk."
    },
    {
      buyerType: "Efficiency-focused team",
      pick: leverage.name,
      reason: "Pick the option that removes the most recurring work once your process is documented enough to scale."
    }
  ];
}

function buildOverpricedFeatures(left: ServiceSpec, right: ServiceSpec): ServiceComparisonResult["overpricedFeatures"] {
  return [
    {
      title: "Overbuying risk",
      summary: `${left.name} can be overkill if you only need ${left.bestFor[0].toLowerCase()}. ${right.name} can be overkill if you only need ${right.bestFor[0].toLowerCase()}. Buy the workflow maturity you can actually absorb this quarter.`
    }
  ];
}

function buildHiddenDownsides(left: ServiceSpec, right: ServiceSpec): ServiceComparisonResult["hiddenDownsides"] {
  return [left, right].flatMap((service) =>
    service.risks.slice(0, 2).map((risk) => ({
      title: `${service.name}: ${risk}`,
      summary: risk,
      evidence: [
        inferenceEvidence(
          `${service.id}:risk-inference:${risk.slice(0, 16).replaceAll(" ", "-").toLowerCase()}`,
          "Curated risk inference",
          "Hidden downsides are curated adapter risks for this service archetype.",
          [service]
        )
      ]
    }))
  );
}

function buildBetterValueAlternative(left: ServiceSpec, right: ServiceSpec): ServiceComparisonResult["betterValueAlternative"] {
  const alternative = serviceCatalog
    .filter((service) => service.id !== left.id && service.id !== right.id)
    .map((service) => ({
      service,
      score: operationalFitScore(service) + flexibilityScore(service)
    }))
    .sort((a, b) => b.score - a.score)[0]?.service;

  if (!alternative) {
    return [];
  }

  return [
    {
      title: alternative.name,
      summary: `${alternative.name} is the strongest adjacent option if both original choices feel too rigid or too narrow. It is not a universal substitute, but it may solve the underlying operational job with less regret risk.`
    }
  ];
}

function buildSignalVsFluff(left: ServiceSpec, right: ServiceSpec): ServiceComparisonResult["signalVsFluff"] {
  return [
    {
      title: "Meaningful difference",
      summary: `For ${left.name} versus ${right.name}, the decision-relevant signals are switching cost, implementation complexity, human expertise, automation depth, and compliance posture.`,
      evidence: [
        ruleEvidence(
          "services:signal-hierarchy",
          "Service signal hierarchy",
          "The adapter weights adoption friction and accountability above vague claims about productivity.",
          [left, right]
        )
      ]
    },
    {
      title: "Mostly marketing",
      summary: "Generic promises like faster operations, better visibility, or lower cost are not decisive until mapped to workflow maturity, handoff risk, and reversibility.",
      evidence: [
        inferenceEvidence(
          "services:marketing-reality",
          "Marketing reality inference",
          "Service marketing claims are treated as low-value unless supported by implementation and accountability details.",
          [left, right]
        )
      ]
    }
  ];
}

function buildEvidenceSummary(left: ServiceSpec, right: ServiceSpec): EvidenceSummary {
  return {
    overallConfidence: "medium",
    dataQuality: "medium",
    evidence: [
      serviceEvidence(left, "fixture-backed-service", "Service attributes are curated archetype fixtures, not live vendor records."),
      serviceEvidence(right, "fixture-backed-service", "Service attributes are curated archetype fixtures, not live vendor records."),
      ruleEvidence(
        "services:decision-rules",
        "Service tradeoff rules",
        "Rules convert contract risk, switching cost, implementation complexity, automation depth, and expertise into tradeoff guidance.",
        [left, right]
      ),
      inferenceEvidence(
        "services:curated-risk-inference",
        "Curated risk inference",
        "Hidden downsides and best-fit guidance are editorial interpretations of fixture metadata.",
        [left, right]
      ),
      missingEvidence(
        "services:missing-live-vendor-data",
        "No live vendor evidence",
        "The adapter does not use live vendor pricing, customer reviews, legal terms, uptime data, or security attestations.",
        [left, right]
      )
    ],
    limitations: [
      "Services are curated archetypes, not live vendor recommendations.",
      "No live vendor prices, contract terms, security documents, customer references, or regional availability are used.",
      "Implementation success depends on internal process maturity that the current input form does not yet collect."
    ]
  };
}

export function compareServices(left: ServiceSpec, right: ServiceSpec): ServiceComparisonResult {
  return {
    domain: "services",
    canonicalInputA: left.name,
    canonicalInputB: right.name,
    leftEntity: toServiceComparisonEntity(left),
    rightEntity: toServiceComparisonEntity(right),
    left,
    right,
    verdict: buildVerdict(left, right),
    sectionLabels: {
      keyDifferences: "Decision Drivers",
      realWorldImpact: "Operating Experience",
      ownershipIntelligence: "Adoption Tradeoffs",
      whoShouldBuyWhich: "Best For",
      overpricedFeatures: "Overbuying Risk",
      hiddenDownsides: "Hidden Downsides",
      betterValueAlternative: "Adjacent Alternative",
      signalVsFluff: "Marketing vs Reality"
    },
    evidenceSummary: buildEvidenceSummary(left, right),
    keyDifferences: buildKeyDifferences(left, right),
    realWorldImpact: buildRealWorldImpact(left, right),
    ownershipIntelligence: buildOwnershipIntelligence(left, right),
    whoShouldBuyWhich: buildBuyerRecommendations(left, right),
    overpricedFeatures: buildOverpricedFeatures(left, right),
    hiddenDownsides: buildHiddenDownsides(left, right).slice(0, 4),
    betterValueAlternative: buildBetterValueAlternative(left, right),
    signalVsFluff: buildSignalVsFluff(left, right)
  };
}
