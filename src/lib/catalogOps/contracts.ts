import {
  CHECKLIST_DEFAULT_COMPANY_ID,
  CHECKLIST_DESTINATION_KEY,
  CHECKLIST_INTELLIGENCE_UNIT_KEY,
  CHECKLIST_MISSION_KEY,
  PRODUCT_NAME,
  PROJECT_KEY,
} from "@/lib/workflow/projectConfig";

export type CatalogOpsTaskKey =
  | "eu_source_inventory_refresh"
  | "operator_capability_audit_refresh"
  | "shooting_lead_export_generation"
  | "range_intelligence_draft_build"
  | "review_packet_submission"
  | "eu_publish_freshness_watchdog"
  | "stale_listing_recheck"
  | "webapp_quality_audit"
  | "compliance_signal_audit"
  | "club_and_hunting_taxonomy_reconciliation";

export interface CatalogOpsTaskSpec {
  taskKey: CatalogOpsTaskKey;
  ownerSystem: "checklist-local-ai";
  cadence: "continuous" | "hourly" | "daily";
  timeoutSeconds: number;
  maxAttempts: number;
  retryBackoffSeconds: number[];
  inputs: string[];
  outputs: string[];
  successCriteria: string[];
  failureSignals: string[];
  rollbackBehavior: string;
  observability: string[];
  dependencies: CatalogOpsTaskKey[];
}

export interface CatalogOpsMissionSpec {
  generatedAt: string;
  missionKey: string;
  projectKey: string;
  productName: string;
  intelligenceUnitKey: string;
  checklistCompanyId: string;
  destinationKey: string;
  canonicalStandard: string;
  runtimeFlow: string[];
  apiContracts: Array<{
    name: string;
    direction: "destination_to_checklist" | "checklist_to_destination" | "internal_artifact";
    endpointOrArtifact: string;
    contractNotes: string[];
  }>;
  tasks: CatalogOpsTaskSpec[];
}

export function buildCatalogOpsMissionSpec(nowIso = new Date().toISOString()): CatalogOpsMissionSpec {
  return {
    generatedAt: nowIso,
    missionKey: CHECKLIST_MISSION_KEY,
    projectKey: PROJECT_KEY,
    productName: PRODUCT_NAME,
    intelligenceUnitKey: CHECKLIST_INTELLIGENCE_UNIT_KEY,
    checklistCompanyId: CHECKLIST_DEFAULT_COMPANY_ID,
    destinationKey: CHECKLIST_DESTINATION_KEY,
    canonicalStandard: "https://github.com/sovereignsquad/general-design-system/issues/81",
    runtimeFlow: [
      "Refresh EU shooting and hunting source inventories on schedule and when freshness incidents open.",
      "Generate normalized venue, club, competition, and hunting-ground leads for the compare-owned intelligence unit.",
      "Build RangeScout-standard drafts from official sources and route them into Checklist review packets.",
      "Publish approved drafts and verify both private and public visibility.",
      "Continuously audit freshness, compliance, taxonomy drift, accessibility regressions, and pipeline silence.",
    ],
    apiContracts: [
      {
        name: "Checklist review packet intake",
        direction: "destination_to_checklist",
        endpointOrArtifact: "/api/destination-review/packets",
        contractNotes: [
          "Required for draft review handoff.",
          "Must carry workflowRunId, candidateId, draftId, evidenceSummary, diagnostics, bridgeVersion, and the compare destination key.",
        ],
      },
      {
        name: "Checklist destination outcome callback",
        direction: "destination_to_checklist",
        endpointOrArtifact: "/api/destination-review/outcomes",
        contractNotes: [
          "Called after publish attempt completion.",
          "Must differentiate publish_completed, publish_partial, and publish_blocked outcomes.",
        ],
      },
      {
        name: "Checklist live revision intake",
        direction: "destination_to_checklist",
        endpointOrArtifact: "/api/destination-workflows/live-revisions/intake",
        contractNotes: [
          "Used when a live listing needs Checklist-side revision handling.",
          "Must include compare destination key and company identifier.",
        ],
      },
      {
        name: "Mission artifact",
        direction: "internal_artifact",
        endpointOrArtifact: "docs/reports/checklist-catalog-ops-mission-latest.json",
        contractNotes: [
          "Generated source of truth for the compare-owned Checklist workflow lane.",
          "Pipeline bootstrap or reconciliation should read from this artifact.",
        ],
      },
    ],
    tasks: [
      {
        taskKey: "eu_source_inventory_refresh",
        ownerSystem: "checklist-local-ai",
        cadence: "daily",
        timeoutSeconds: 900,
        maxAttempts: 3,
        retryBackoffSeconds: [60, 300, 900],
        inputs: ["EU federation sites", "club directories", "range sites", "hunting operators", "robots.txt constraints"],
        outputs: ["EU source inventory JSON/MD snapshots"],
        successCriteria: ["Inventory artifact written successfully.", "Eligible operator and venue source counts are non-zero."],
        failureSignals: ["All source fetches fail.", "Inventory artifact missing or malformed.", "Eligible source count drops abruptly without upstream explanation."],
        rollbackBehavior: "Retain the last good artifact and open a freshness incident instead of publishing an empty inventory.",
        observability: ["Run duration", "Discovered URL count", "Eligible source count", "Failed fetch count"],
        dependencies: [],
      },
      {
        taskKey: "operator_capability_audit_refresh",
        ownerSystem: "checklist-local-ai",
        cadence: "daily",
        timeoutSeconds: 300,
        maxAttempts: 2,
        retryBackoffSeconds: [120, 600],
        inputs: ["Homepage", "competition surfaces", "club join flows", "venue pages", "submission surfaces"],
        outputs: ["Capability audit JSON/MD snapshots"],
        successCriteria: ["Capability findings emitted with scored adopt/maybe/skip recommendations."],
        failureSignals: ["Target surfaces unreachable.", "Audit emits no findings."],
        rollbackBehavior: "Keep the last successful audit and mark the current run degraded.",
        observability: ["Capability count", "Adopt recommendation count", "Fetch failures"],
        dependencies: [],
      },
      {
        taskKey: "shooting_lead_export_generation",
        ownerSystem: "checklist-local-ai",
        cadence: "daily",
        timeoutSeconds: 1200,
        maxAttempts: 3,
        retryBackoffSeconds: [60, 300, 900],
        inputs: ["EU source inventory artifact", "Source detail pages"],
        outputs: ["Lead NDJSON/JSON/MD snapshots", "Normalized event JSON/MD snapshots"],
        successCriteria: ["Lead export contains at least one medium-or-higher-confidence lead.", "Normalized events map to explicit target schedule fields."],
        failureSignals: ["Export returns zero leads.", "Every record is discarded due to low confidence.", "Normalized event mapping becomes ambiguous at scale."],
        rollbackBehavior: "Do not overwrite the last good export with an empty batch; open a source-harvest incident.",
        observability: ["Lead count", "Lead type distribution", "Confidence distribution", "Per-record fetch failures"],
        dependencies: ["eu_source_inventory_refresh"],
      },
      {
        taskKey: "range_intelligence_draft_build",
        ownerSystem: "checklist-local-ai",
        cadence: "continuous",
        timeoutSeconds: 1800,
        maxAttempts: 5,
        retryBackoffSeconds: [60, 180, 600, 1800, 3600],
        inputs: ["Lead artifact", "Official source pages", "RangeScout schema constraints"],
        outputs: ["Draft payloads", "Evidence summaries", "Diagnostics"],
        successCriteria: ["Draft payload validates against the target RangeScout schema.", "Evidence points to official source material rather than third-party copy."],
        failureSignals: ["Schema validation rejection.", "Source page no longer accessible.", "Generated draft lacks required venue, club, or compliance evidence."],
        rollbackBehavior: "Mark the lead rejected and preserve diagnostics; do not enqueue malformed drafts for publish.",
        observability: ["Draft success rate", "Validation failure rate", "Rejected lead reasons"],
        dependencies: ["shooting_lead_export_generation"],
      },
      {
        taskKey: "review_packet_submission",
        ownerSystem: "checklist-local-ai",
        cadence: "continuous",
        timeoutSeconds: 300,
        maxAttempts: 3,
        retryBackoffSeconds: [30, 120, 600],
        inputs: ["Draft payload", "Evidence summary", "Diagnostics", "Checklist bridge config"],
        outputs: ["Checklist review packet", "Destination outcome callbacks"],
        successCriteria: ["Checklist packet accepted.", "Callback recorded after publish completion."],
        failureSignals: ["Checklist bridge missing.", "Packet rejected.", "Callback never received."],
        rollbackBehavior: "Leave the draft in review-ready state and retry packet submission with the same idempotency identifiers.",
        observability: ["Packet submission latency", "Bridge skip count", "Callback success rate"],
        dependencies: ["range_intelligence_draft_build"],
      },
      {
        taskKey: "eu_publish_freshness_watchdog",
        ownerSystem: "checklist-local-ai",
        cadence: "hourly",
        timeoutSeconds: 120,
        maxAttempts: 2,
        retryBackoffSeconds: [60, 300],
        inputs: ["Live provider catalog", "Live meetup catalog", "Publish cadence thresholds"],
        outputs: ["Watchdog JSON/MD snapshots", "Checklist incidents for silence or stalling"],
        successCriteria: ["Incident opens whenever no new catalog rows appear inside the configured SLA window.", "Stalled publish loops are surfaced with explicit reason codes."],
        failureSignals: ["DB unavailable.", "Watchdog report not written.", "Incident detection suppressed unexpectedly."],
        rollbackBehavior: "Preserve the last report and alert operators that watchdog coverage is degraded.",
        observability: ["Hours since last provider publish", "Hours since last club publish", "Incident count"],
        dependencies: ["review_packet_submission"],
      },
      {
        taskKey: "stale_listing_recheck",
        ownerSystem: "checklist-local-ai",
        cadence: "daily",
        timeoutSeconds: 900,
        maxAttempts: 3,
        retryBackoffSeconds: [300, 900, 3600],
        inputs: ["Live listings", "Next occurrence data", "Official source pages"],
        outputs: ["Stale candidate list", "Refresh or takedown actions"],
        successCriteria: ["Expired or unsupported live rows are queued for refresh or removal."],
        failureSignals: ["Large stale backlog with no task creation.", "Source verification repeatedly times out."],
        rollbackBehavior: "Keep stale findings read-only until source verification succeeds.",
        observability: ["Stale listing count", "Expired event count", "Refresh completion rate"],
        dependencies: ["review_packet_submission"],
      },
      {
        taskKey: "webapp_quality_audit",
        ownerSystem: "checklist-local-ai",
        cadence: "daily",
        timeoutSeconds: 900,
        maxAttempts: 2,
        retryBackoffSeconds: [300, 1800],
        inputs: ["Live catalog pages", "Admin workflows", "GDS canonical standard"],
        outputs: ["Quality audit findings", "Accessibility and drift incidents"],
        successCriteria: ["Critical accessibility regressions are surfaced with affected route and recovery instructions.", "Broken content and drift findings become explicit operational tasks."],
        failureSignals: ["Audit cannot reach live surfaces.", "No quality artifact written."],
        rollbackBehavior: "Retain the last good audit and flag the current run as degraded coverage.",
        observability: ["Critical issue count", "Accessibility issue count", "Broken route count"],
        dependencies: [],
      },
      {
        taskKey: "compliance_signal_audit",
        ownerSystem: "checklist-local-ai",
        cadence: "daily",
        timeoutSeconds: 600,
        maxAttempts: 2,
        retryBackoffSeconds: [120, 900],
        inputs: ["Live listings", "Site privacy copy", "Lead capture forms", "Jurisdiction-specific listing metadata"],
        outputs: ["Compliance audit findings", "Checklist incidents for consent or disclosure drift"],
        successCriteria: ["Missing privacy, consent, or operator disclosure signals become explicit operational tasks."],
        failureSignals: ["Compliance artifact not written.", "Lead capture surface unreachable."],
        rollbackBehavior: "Retain the last good compliance audit and flag degraded coverage.",
        observability: ["Compliance issue count", "Disclosure drift count", "Form reachability failures"],
        dependencies: ["review_packet_submission"],
      },
      {
        taskKey: "club_and_hunting_taxonomy_reconciliation",
        ownerSystem: "checklist-local-ai",
        cadence: "daily",
        timeoutSeconds: 900,
        maxAttempts: 2,
        retryBackoffSeconds: [120, 600],
        inputs: ["Live catalog", "Draft catalog", "Training/range/competition/hunting taxonomy rules"],
        outputs: ["Taxonomy drift report", "Corrective review tasks"],
        successCriteria: ["Listings that drift between club, range, competition, and hunting categories are surfaced."],
        failureSignals: ["No taxonomy artifact written.", "Drift detector returns empty while live catalog changes."],
        rollbackBehavior: "Keep drift findings read-only until manual review confirms remapping rules.",
        observability: ["Taxonomy drift count", "Auto-remap suggestion count"],
        dependencies: ["range_intelligence_draft_build"],
      },
    ],
  };
}

export function renderCatalogOpsMissionMarkdown(spec: CatalogOpsMissionSpec) {
  const lines: string[] = [];
  lines.push("# Checklist Continuous Catalog Ops Mission");
  lines.push("");
  lines.push(`Mission key: ${spec.missionKey}`);
  lines.push(`Project key: ${spec.projectKey}`);
  lines.push(`Product: ${spec.productName}`);
  lines.push(`Intelligence unit: ${spec.intelligenceUnitKey}`);
  lines.push(`Checklist company: ${spec.checklistCompanyId}`);
  lines.push(`Destination key: ${spec.destinationKey}`);
  lines.push("");
  lines.push(`Generated: ${spec.generatedAt}`);
  lines.push(`Canonical standard: ${spec.canonicalStandard}`);
  lines.push("");
  lines.push("## Runtime flow");
  for (const step of spec.runtimeFlow) lines.push(`- ${step}`);
  lines.push("");
  lines.push("## Contracts");
  for (const contract of spec.apiContracts) {
    lines.push(`- ${contract.name} (${contract.direction}) -> ${contract.endpointOrArtifact}`);
    for (const note of contract.contractNotes) lines.push(`  - ${note}`);
  }
  lines.push("");
  lines.push("## Tasks");
  for (const task of spec.tasks) {
    lines.push(`### ${task.taskKey}`);
    lines.push(`- cadence: ${task.cadence}`);
    lines.push(`- timeoutSeconds: ${task.timeoutSeconds}`);
    lines.push(`- maxAttempts: ${task.maxAttempts}`);
    lines.push(`- dependencies: ${task.dependencies.join(", ") || "(none)"}`);
    lines.push(`- success: ${task.successCriteria.join(" | ")}`);
    lines.push(`- failure: ${task.failureSignals.join(" | ")}`);
    lines.push(`- rollback: ${task.rollbackBehavior}`);
    lines.push(`- observability: ${task.observability.join(" | ")}`);
  }
  lines.push("");
  return `${lines.join("\n")}\n`;
}
