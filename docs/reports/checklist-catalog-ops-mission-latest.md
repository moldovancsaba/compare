# Checklist Continuous Catalog Ops Mission

Mission key: compare-eu-shooting-ops
Project key: compare
Product: RangeScout EU
Intelligence unit: compare-range-intelligence
Checklist company: efce8e3d-c834-4bd1-8521-ce1e97b29f7c
Destination key: compare

Generated: 2026-05-29T18:44:34.044Z
Canonical standard: https://github.com/sovereignsquad/general-design-system/issues/81

## Runtime flow
- Refresh the Hungary-first shooting source inventory on schedule and when freshness incidents open.
- Generate normalized competition, event, course, club, and range leads for the compare-owned intelligence unit.
- Build RangeScout-standard drafts from official sources and route them into Checklist review packets.
- Publish approved drafts and verify both private and public visibility.
- Continuously audit freshness, compliance, taxonomy drift, accessibility regressions, and pipeline silence.

## Contracts
- Checklist review packet intake (destination_to_checklist) -> /api/destination-review/packets
  - Required for draft review handoff.
  - Must carry workflowRunId, candidateId, draftId, evidenceSummary, diagnostics, bridgeVersion, and the compare destination key.
- Checklist destination outcome callback (destination_to_checklist) -> /api/destination-review/outcomes
  - Called after publish attempt completion.
  - Must differentiate publish_completed, publish_partial, and publish_blocked outcomes.
- Checklist live revision intake (destination_to_checklist) -> /api/destination-workflows/live-revisions/intake
  - Used when a live listing needs Checklist-side revision handling.
  - Must include compare destination key and company identifier.
- Mission artifact (internal_artifact) -> docs/reports/checklist-catalog-ops-mission-latest.json
  - Generated source of truth for the compare-owned Checklist workflow lane.
  - Pipeline bootstrap or reconciliation should read from this artifact.

## Tasks
### hungary_source_inventory_refresh
- cadence: daily
- timeoutSeconds: 900
- maxAttempts: 3
- dependencies: (none)
- success: Inventory artifact written successfully. | Eligible operator and entity source counts are non-zero.
- failure: All source fetches fail. | Inventory artifact missing or malformed. | Eligible source count drops abruptly without upstream explanation.
- rollback: Retain the last good artifact and open a freshness incident instead of publishing an empty inventory.
- observability: Run duration | Discovered URL count | Eligible source count | Failed fetch count
### operator_capability_audit_refresh
- cadence: daily
- timeoutSeconds: 300
- maxAttempts: 2
- dependencies: (none)
- success: Capability findings emitted with scored adopt/maybe/skip recommendations.
- failure: Target surfaces unreachable. | Audit emits no findings.
- rollback: Keep the last successful audit and mark the current run degraded.
- observability: Capability count | Adopt recommendation count | Fetch failures
### shooting_entity_lead_export_generation
- cadence: daily
- timeoutSeconds: 1200
- maxAttempts: 3
- dependencies: hungary_source_inventory_refresh
- success: Lead export contains at least one medium-or-higher-confidence lead. | Normalized competition and event records map to explicit target fields.
- failure: Export returns zero leads. | Every record is discarded due to low confidence. | Normalized event mapping becomes ambiguous at scale.
- rollback: Do not overwrite the last good export with an empty batch; open a source-harvest incident.
- observability: Lead count | Lead type distribution | Confidence distribution | Per-record fetch failures
### hungary_entity_draft_build
- cadence: continuous
- timeoutSeconds: 1800
- maxAttempts: 5
- dependencies: shooting_entity_lead_export_generation
- success: Draft payload validates against the target RangeScout schema. | Evidence points to official source material rather than third-party copy.
- failure: Schema validation rejection. | Source page no longer accessible. | Generated draft lacks required competition, club, range, course, or compliance evidence.
- rollback: Mark the lead rejected and preserve diagnostics; do not enqueue malformed drafts for publish.
- observability: Draft success rate | Validation failure rate | Rejected lead reasons
### review_packet_submission
- cadence: continuous
- timeoutSeconds: 300
- maxAttempts: 3
- dependencies: hungary_entity_draft_build
- success: Checklist packet accepted. | Callback recorded after publish completion.
- failure: Checklist bridge missing. | Packet rejected. | Callback never received.
- rollback: Leave the draft in review-ready state and retry packet submission with the same idempotency identifiers.
- observability: Packet submission latency | Bridge skip count | Callback success rate
### hungary_publish_freshness_watchdog
- cadence: hourly
- timeoutSeconds: 120
- maxAttempts: 2
- dependencies: review_packet_submission
- success: Incident opens whenever no new catalog rows appear inside the configured SLA window. | Stalled publish loops are surfaced with explicit reason codes.
- failure: DB unavailable. | Watchdog report not written. | Incident detection suppressed unexpectedly.
- rollback: Preserve the last report and alert operators that watchdog coverage is degraded.
- observability: Hours since last provider publish | Hours since last club publish | Incident count
### stale_listing_recheck
- cadence: daily
- timeoutSeconds: 900
- maxAttempts: 3
- dependencies: review_packet_submission
- success: Expired or unsupported live rows are queued for refresh or removal.
- failure: Large stale backlog with no task creation. | Source verification repeatedly times out.
- rollback: Keep stale findings read-only until source verification succeeds.
- observability: Stale listing count | Expired event count | Refresh completion rate
### webapp_quality_audit
- cadence: daily
- timeoutSeconds: 900
- maxAttempts: 2
- dependencies: (none)
- success: Critical accessibility regressions are surfaced with affected route and recovery instructions. | Broken content and drift findings become explicit operational tasks.
- failure: Audit cannot reach live surfaces. | No quality artifact written.
- rollback: Retain the last good audit and flag the current run as degraded coverage.
- observability: Critical issue count | Accessibility issue count | Broken route count
### compliance_signal_audit
- cadence: daily
- timeoutSeconds: 600
- maxAttempts: 2
- dependencies: review_packet_submission
- success: Missing privacy, consent, or operator disclosure signals become explicit operational tasks.
- failure: Compliance artifact not written. | Lead capture surface unreachable.
- rollback: Retain the last good compliance audit and flag degraded coverage.
- observability: Compliance issue count | Disclosure drift count | Form reachability failures
### operator_taxonomy_reconciliation
- cadence: daily
- timeoutSeconds: 900
- maxAttempts: 2
- dependencies: hungary_entity_draft_build
- success: Listings that drift between competition, event, course, club, and range categories are surfaced.
- failure: No taxonomy artifact written. | Drift detector returns empty while live catalog changes.
- rollback: Keep drift findings read-only until manual review confirms remapping rules.
- observability: Taxonomy drift count | Auto-remap suggestion count

