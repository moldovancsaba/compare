import type { ServiceSpec } from "@/types/service";

export const serviceCatalog: ServiceSpec[] = [
  {
    id: "managed-customer-support",
    name: "Managed Customer Support",
    category: "customer-support",
    slug: "managed-customer-support",
    aliases: ["support outsourcing", "outsourced support", "managed helpdesk", "customer support service"],
    pricingModel: "Monthly retainer with seat or ticket-volume bands",
    targetUser: "Growing teams that need reliable coverage before building a full internal support department",
    integrations: ["Helpdesk", "CRM", "Slack or Teams", "Knowledge base"],
    supportModel: "Human agents with playbooks, escalation paths, and scheduled coverage windows",
    contractRisk: "medium",
    switchingCost: "medium",
    compliancePosture: "standard",
    implementationComplexity: "medium",
    automationDepth: "medium",
    humanExpertise: "high",
    bestFor: ["coverage expansion", "SLA consistency", "repeatable support workflows"],
    risks: ["vendor lock-in through process knowledge", "quality drift if playbooks are weak", "handoff friction for complex escalations"],
    evidenceNotes: [
      "Fixture models a service archetype rather than a live vendor.",
      "Scoring emphasizes coverage, expertise, and implementation friction."
    ]
  },
  {
    id: "ai-support-automation",
    name: "AI Support Automation",
    category: "customer-support",
    slug: "ai-support-automation",
    aliases: ["support chatbot", "ai helpdesk", "automated support", "customer support ai"],
    pricingModel: "Usage-based software subscription with implementation effort",
    targetUser: "Teams with repetitive tickets, strong documentation, and pressure to reduce first-response load",
    integrations: ["Helpdesk", "Knowledge base", "Website widget", "Analytics"],
    supportModel: "Automated triage and draft responses with human escalation for sensitive cases",
    contractRisk: "low",
    switchingCost: "low",
    compliancePosture: "standard",
    implementationComplexity: "medium",
    automationDepth: "high",
    humanExpertise: "low",
    bestFor: ["ticket deflection", "24/7 first response", "knowledge-base leverage"],
    risks: ["bad answers when documentation is weak", "customer trust damage if escalation is hidden", "harder fit for nuanced enterprise accounts"],
    evidenceNotes: [
      "Fixture models a service archetype rather than a live vendor.",
      "Scoring emphasizes automation depth, contract flexibility, and documentation dependency."
    ]
  },
  {
    id: "fractional-cfo-retainer",
    name: "Fractional CFO Retainer",
    category: "finance-operations",
    slug: "fractional-cfo-retainer",
    aliases: ["fractional cfo", "part-time cfo", "outsourced cfo", "finance leadership retainer"],
    pricingModel: "Monthly advisory retainer with strategic finance scope",
    targetUser: "Founder-led companies that need forecasting, board reporting, pricing strategy, or fundraising preparation",
    integrations: ["Accounting system", "Payroll", "BI dashboards", "Planning spreadsheets"],
    supportModel: "Senior finance operator with recurring leadership cadence and decision support",
    contractRisk: "medium",
    switchingCost: "high",
    compliancePosture: "strict",
    implementationComplexity: "high",
    automationDepth: "low",
    humanExpertise: "high",
    bestFor: ["strategic finance", "board-ready reporting", "fundraising support"],
    risks: ["expensive if bookkeeping is the real need", "knowledge concentration in one advisor", "slow onboarding without clean financial data"],
    evidenceNotes: [
      "Fixture models a service archetype rather than a live vendor.",
      "Scoring emphasizes strategic expertise, compliance expectations, and switching cost."
    ]
  },
  {
    id: "bookkeeping-service",
    name: "Bookkeeping Service",
    category: "finance-operations",
    slug: "bookkeeping-service",
    aliases: ["outsourced bookkeeping", "monthly bookkeeping", "accounting cleanup", "bookkeeper"],
    pricingModel: "Monthly package priced by transaction volume and cleanup scope",
    targetUser: "Small teams that need clean books, reconciliations, and month-end hygiene before strategic finance",
    integrations: ["Accounting system", "Bank feeds", "Payroll", "Expense tools"],
    supportModel: "Operational finance team focused on recurring close, reconciliation, and reporting basics",
    contractRisk: "low",
    switchingCost: "medium",
    compliancePosture: "standard",
    implementationComplexity: "medium",
    automationDepth: "medium",
    humanExpertise: "medium",
    bestFor: ["monthly close hygiene", "transaction cleanup", "basic financial reporting"],
    risks: ["not a substitute for finance leadership", "cleanup can reveal hidden scope", "quality depends on source-document discipline"],
    evidenceNotes: [
      "Fixture models a service archetype rather than a live vendor.",
      "Scoring emphasizes operational reliability, cost control, and handoff clarity."
    ]
  }
];
