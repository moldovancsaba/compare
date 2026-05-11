# {compare} Trinity Brain Integration

## Purpose

This note records how `{compare}` should use `{trinity}` as an AI Brain layer without confusing product ownership.

`{compare}` is the product and webapp. `{trinity}` is a local-first reasoning runtime that can sit behind `{compare}` to produce decision-ready comparison output, memory-informed reasoning, confidence signals, traces, and later training bundles.

## Current {compare} Flow

Today the webapp owns the whole compare path:

1. `POST /api/compare` receives `leftInput` and `rightInput`.
2. `{compare}` resolves both inputs through the local watch catalog.
3. `{compare}` calls `compareWatches(left, right)`.
4. The deterministic result is returned to the UI.

This is simple and correct for V1, but it means the comparison engine has no runtime memory, no confidence/escalation layer, no traceable reasoning loop, and no clean path for learning from user feedback.

## Target Split

Keep these responsibilities in `{compare}`:

- Web UI and API transport.
- Watch catalog ownership and resolver behavior.
- Product-specific comparison result schema shown to users.
- Saved comparisons, SEO routes, and buyer-facing presentation.
- Product governance: what categories are supported and what claims are allowed.

Move these responsibilities into `{trinity}` through a dedicated `compare` adapter:

- Runtime reasoning over normalized comparison evidence.
- Memory retrieval for prior feedback, corrections, preferences, and known bad patterns.
- Candidate generation/refinement/evaluation for comparison sections.
- Confidence, minority-report, bounded-loop, and human-escalation decisions.
- Trace export for reproducibility and future evaluation.
- Training-bundle export when `{train}` is ready to optimize accepted behavior.

## Required Trinity Adapter

Do not reuse another Trinity adapter. `{compare}` needs its own adapter because comparison has its own request shape, result shape, outcome loop, and memory semantics.

Expected Trinity files:

```text
/Users/Shared/Projects/trinity/core/trinity_core/adapters/product/compare/
  __init__.py
  payloads.py
  runtime.py
```

Expected shared registration changes:

```text
/Users/Shared/Projects/trinity/core/trinity_core/adapters/base.py
/Users/Shared/Projects/trinity/core/trinity_core/runtime.py
/Users/Shared/Projects/trinity/core/trinity_core/cli.py
/Users/Shared/Projects/trinity/tests/test_adapter_runtime.py
```

The first CLI should be generic, for example:

```bash
PYTHONPATH=core uv run python -m trinity_core.cli reason-compare --adapter compare --input-file /tmp/compare-request.json
```

or, if Trinity's generic `suggest` command is broadened safely:

```bash
PYTHONPATH=core uv run python -m trinity_core.cli suggest --adapter compare --input-file /tmp/compare-request.json
```

## First Payload Shape

The first adapter request should be normalized evidence, not raw user text.

```json
{
  "contract_version": "trinity.compare.v1alpha1",
  "project_id": "compare",
  "comparison_ref": "compare:rolex-explorer-124270:tudor-bb54",
  "requested_at": "2026-05-11T13:45:00Z",
  "left": {
    "id": "rolex-explorer-124270",
    "brand": "Rolex",
    "model": "Explorer",
    "reference": "124270",
    "specs": {}
  },
  "right": {
    "id": "tudor-black-bay-54",
    "brand": "Tudor",
    "model": "Black Bay 54",
    "reference": "79000N",
    "specs": {}
  },
  "decision_profile": {
    "wrist_size": "unknown",
    "primary_use": "daily",
    "budget_sensitivity": "medium",
    "comfort_priority": "high"
  },
  "catalog_evidence": [],
  "source_refs": []
}
```

The adapter response should map cleanly back into the current `ComparisonResult` UI while adding optional runtime metadata:

```json
{
  "comparison": {},
  "confidence": {},
  "memory_context": {},
  "minority_report": null,
  "human_escalation": null,
  "trace_ref": "..."
}
```

## Checklist Pattern Learned

`/Users/Shared/Projects/checklist` uses MongoDB Atlas as the shared boundary between the online app and the local AI worker.

The shipped pattern is:

1. The webapp writes raw/product state and user feedback to Atlas.
2. The local worker is started separately from the webapp.
3. The worker reads due work from Atlas, runs local Ollama reasoning through a serialized inference queue, and writes structured records back to Atlas.
4. The webapp renders those materialized records from Atlas instead of waiting on a live local model call.
5. The worker records cycle IDs, decision events, generation events, and outcome events so AI output remains traceable and teachable.

The most important implementation guardrail is in checklist's local-agent API: the webapp does not call the local AI directly. It returns an accepted/queued response and tells the operator to run the local worker against the shared database. That keeps the deployed app responsive, avoids serverless/localhost coupling, and makes the database the stable handoff contract.

Useful checklist mechanisms for `{compare}`:

- A supervised local process, like checklist's `guardian`, that starts the worker, checks Ollama health, restarts on hangs, and writes a heartbeat.
- A lightweight queue or work table so compare requests, catalog refreshes, and feedback reconciliation can be claimed by a local worker.
- A serialized model-call lock because local Ollama models compete for the same machine resources.
- JSON repair, timeout, and model-failover around every model response.
- Durable provenance records: input evidence, source URLs, prompt/model version, confidence, and comparison trace ref.
- A ledger of decisions, generations, and outcomes that can later become training material.

What should not be copied directly:

- Checklist's company/card/task taxonomy.
- Its large Prisma model surface.
- Its webapp control plane.
- Its product-specific goal/task/flashcard pipeline.

For `{compare}`, the equivalent should be much smaller:

```text
CompareRequest / CompareJob
  status: queued | running | completed | failed
  leftWatchId
  rightWatchId
  decisionProfile
  requestedBy/session key
  createdAt/claimedAt/completedAt

ComparisonTrace
  comparisonRef
  brainProvider
  brainVersion
  promptVersion
  modelName
  inputHash
  sourceRefs
  confidence
  minorityReport
  rawTracePath or compact trace payload

SavedComparison
  leftWatchId
  rightWatchId
  deterministicResult
  brainResult
  selectedRecommendation
  traceRef

ComparisonFeedback
  comparisonRef
  leftWatchId
  rightWatchId
  traceRef
  signal: helpful | not_helpful | chose_left | chose_right | opposite_preferred | bad_recommendation | missing_context | wrong_spec
  note
  processedByTrinity
  processedAt
```

The first production-shaped bridge should therefore be:

1. `POST /api/compare` keeps returning deterministic `compareWatches` immediately.
2. If `COMPARE_BRAIN_PROVIDER=trinity_worker`, persist a `CompareJob` for the same normalized pair.
3. A local `{trinity}` compare worker claims queued jobs from MongoDB Atlas, calls the dedicated Trinity `compare` adapter, validates the response, and writes a `ComparisonTrace` plus optional enriched comparison result.
4. The UI can later poll or hydrate the brain-enriched result by `comparisonRef`, but the initial compare experience never blocks on Trinity.
5. Feedback buttons should write small outcome records that Trinity can read on later cycles.

This is a better fit than the earlier CLI-in-route option once Atlas persistence is active. The CLI bridge is still useful for adapter development and fixtures, but the checklist pattern shows that the runtime product boundary should be database-backed worker handoff.

## Webapp Bridge Options

### Phase 1: CLI Bridge

Use a server-side Node subprocess from the Next.js API route to call Trinity's CLI.

Pros:

- Smallest integration.
- Works locally with the current Trinity repo.
- Easy to inspect JSON files and traces.

Cons:

- Not ideal for deployed Vercel-style serverless runtime.
- Needs timeout handling, JSON validation, and deterministic fallback to `compareWatches`.

### Phase 2: Local Trinity Service

Wrap `TrinityRuntime(adapter_name="compare")` in a small local HTTP service.

Pros:

- Cleaner process boundary.
- Better for repeated calls and runtime memory.
- Easier to monitor and restart.

Cons:

- Trinity does not currently ship a first-class HTTP server.
- Adds local service lifecycle work.

### Phase 3: Production Runtime Boundary

Promote Trinity into an internal service or worker runtime only after the adapter contract is proven.

Do not start here.

## Recommended First Slice

1. Run and harden the local Trinity worker against live MongoDB Atlas credentials.
2. Add observability/heartbeat output for worker health and recent failures.
3. If Trinity fails, times out, or returns invalid JSON, mark the job failed and keep the deterministic comparison as the user-visible result.

Already started in `{compare}`:

- MongoDB-backed `CompareJob`, `ComparisonTrace`, and `SavedComparison` models exist in `/Users/Shared/Projects/compare/src/lib/models/comparison-brain.ts`.
- `/Users/Shared/Projects/compare/src/lib/services/brain-queue.ts` queues Trinity worker jobs behind `COMPARE_BRAIN_PROVIDER=trinity_worker`.
- `/Users/Shared/Projects/compare/src/app/api/compare/feedback/route.ts` records visitor outcome signals in `comparison_feedback` when MongoDB Atlas is configured.
- `/Users/Shared/Projects/compare/src/components/comparison-result.tsx` lets visitors mark useful, wrong, missing-context, and chosen-watch outcomes without blocking the comparison flow.
- `/Users/Shared/Projects/compare/src/app/api/compare/route.ts` still returns deterministic `compareWatches` immediately and includes Brain queue status metadata.
- `/Users/Shared/Projects/compare/scripts/trinity-compare-worker.mjs` claims queued Atlas jobs, invokes Trinity `reason-compare`, writes `comparison_traces`, updates `saved_comparisons`, and marks jobs completed/failed.
- The same worker now consumes unprocessed `comparison_feedback` records, marks them `processed` or `skipped`, and rolls durable signal counts into `saved_comparisons.feedbackSummary` for later Trinity learning.
- `npm run brain:worker` runs the continuous local worker; `npm run brain:worker:once` processes one queued job.

Already started in `{trinity}`:

- A deterministic `compare` adapter exists in `/Users/Shared/Projects/trinity/core/trinity_core/adapters/product/compare`.
- Compare contracts exist in `/Users/Shared/Projects/trinity/core/trinity_core/schemas/compare_integration.py`.
- Trinity CLI supports `reason-compare --adapter compare --input-file /tmp/compare-request.json`.
- Adapter runtime tests cover registry exposure, runtime reasoning, trace output, and CLI output.

## Non-Goals For The First Slice

- Do not move the watch resolver into Trinity.
- Do not make the UI depend on Trinity-only fields.
- Do not require live LLM output for the normal compare path.
- Do not introduce account systems or user profiles yet.
- Do not add `{train}` integration until Trinity traces are stable.
- Do not make external web scraping part of `POST /api/compare`.

## Open Questions

- Should `{compare}` use a fixed project/company UUID for Trinity memory, or should Trinity introduce project-scoped memory without tenant language?
- Should the first adapter command be `reason-compare` or a broadened generic `suggest --adapter compare`?
- How much of `ComparisonResult` should Trinity own versus returning only enriched sections and metadata?
- Should confidence/provenance land in the UI immediately or stay trace-only for the first adapter slice?
