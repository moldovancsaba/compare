# {compare}

{compare} is a Next.js web app for high-trust comparison intelligence across decision domains. Release `v0.1.1` ships mechanical watches as the first live adapter while the UI and API use a domain-based comparison foundation.

## Version
- Project version: `0.1.1`
- Current release label: `v0.1.1`

## What it does
- Lets users choose the active comparison domain.
- Accepts two supported names or source URLs for that domain.
- Resolves mechanical-watch inputs against a curated watch catalog.
- Rejects weak or ambiguous inputs instead of guessing when a match is not clear.
- Leads with an instant verdict and ranked buyer picks instead of making users interpret every section themselves.
- Adds ownership intelligence for service reality, resale behavior, scratch anxiety, enthusiast bias, and marketing-vs-reality.
- Generates:
  - Instant Verdict
  - Key Differences
  - Real-World Impact
  - Ownership Intelligence
  - Who Should Buy Which
  - Overpriced Features
  - Hidden Downsides
  - Better Value Alternative
- Highlights what is meaningful versus mostly marketing.

## Why it exists
Most comparison content is bloated, repetitive, and detached from real ownership. {compare} compresses the usual review-tab spiral into one focused screen that explains what changes on wrist, what is mostly marketing, and which choice creates more buying confidence.

The business direction is trust-first purchase confidence, not generic AI summaries, SEO content, or affiliate-driven review sludge.

## Product shape
- Single-screen comparison experience with a server-rendered landing page and client-side, adapter-aware form interactions.
- Deterministic comparison engine built around a curated watch catalog instead of speculative scraping.
- Domain adapter registry that exposes supported domains, examples, and input guidance to the UI.
- API endpoint at `/api/compare`.
- Tokenized visual system documented in `design-tokens.md`.

## Stack
- Next.js 16 App Router
- React 19
- TypeScript 5.9 in strict mode
- Tailwind CSS 4
- CSS variable and utility-class design system layered in `src/app/globals.css`
- Zod 4 for input validation
- Mongoose connection utility for optional MongoDB Atlas persistence
- Redacted JSON logging for compare, Brain, and feedback operational events
- Optional MongoDB-backed analytics events for compare outcomes, resolver misses, Brain polls, and feedback signals
- Optional MongoDB-backed saved comparisons with stable `/compare/[slug]` pages
- Vitest for unit tests

## Local setup
1. Install dependencies with `npm install`.
2. Start the app with `npm run dev`.
3. Open `http://localhost:3000`.

Optional environment variables:

```bash
MONGODB_URI=
MONGODB_DB_NAME=compare
COMPARE_BRAIN_PROVIDER=
```

Use `.env.example` as the template and copy values into `.env.local` for local development. Keep `.env.example` free of real credentials.

V1 does not require MongoDB to run because it ships with a curated watch catalog. When MongoDB is configured, submitted deterministic comparisons are upserted into `saved_comparisons` with submission metadata and stable public slugs such as `/compare/rolex-air-king-126900-vs-rolex-explorer-124270`. When MongoDB is absent or unavailable, the compare API continues to return the immediate deterministic result.

Set `COMPARE_BRAIN_PROVIDER=trinity_worker` only when MongoDB Atlas is configured and a local `{trinity}` worker is available. In that mode `/api/compare` still returns the deterministic comparison immediately, then queues an optional Brain job in MongoDB for local Trinity enrichment.

Run the local Brain worker with:

```bash
npm run brain:worker
```

For one queued job only:

```bash
npm run brain:worker:once
```

Worker-specific optional environment variables:

```bash
TRINITY_REPO=/Users/Shared/Projects/trinity
COMPARE_BRAIN_WORKER_POLL_MS=30000
COMPARE_BRAIN_TRINITY_TIMEOUT_MS=120000
COMPARE_BRAIN_FEEDBACK_BATCH_SIZE=25
```

The worker at `scripts/trinity-compare-worker.mjs` claims `compare_jobs`, invokes `{trinity}` with `reason-compare --adapter compare`, writes `comparison_traces`, updates `saved_comparisons`, marks jobs `completed` or `failed`, and consumes unprocessed `comparison_feedback` records into each saved comparison's `feedbackSummary`.

## Supported watches in V1
- Rolex Air-King 126900
- Rolex Explorer 124270
- Tudor Black Bay 54
- Tudor Black Bay 58
- Tudor Pelagos 39
- Omega Seamaster Aqua Terra 38

The compare form renders a domain selector from the adapter registry. The current live domain is Mechanical watches, with adapter-provided labels, helper text, placeholders, and quick-select examples. Users can assign any catalog watch to either side, swap or clear inputs, and catch exact or resolver-equivalent duplicate selections before sending the request. The watch resolver tolerates obvious one-character typos in distinctive brand, model, or alias tokens while still rejecting broad ambiguous families such as "Tudor Black Bay." Unsupported inputs still go to `/api/compare`, which returns the same supported list so the client can recover from resolver misses without guessing or logging raw user input.

## Quality gates
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm audit --omit=dev`

Current status on 2026-05-11:
- lint: pass
- typecheck: pass
- test: pass
- build: pass
- audit: pass through a root `postcss` override that patches Next's transitive PostCSS dependency until Next ships an updated internal pin.

GitHub Actions runs install, lint, test, typecheck, build, and production dependency audit gates on pushes to `main` and on pull requests.

## Documentation map
- Product overview: `README.md`
- Technical background: `02_Technology_Stack.md`
- Release history: `10_Release_Notes.md`
- Product strategy: `11_Product_Strategy.md`
- Design primitives: `design-tokens.md`

Current automated route coverage includes resolver matching, typo tolerance, ambiguity rejection, opinionated verdict output, ownership-intelligence output, adapter metadata conformance, client-side duplicate input validation, unsupported-domain validation, `/api/compare` success, unsupported watch input with supported examples, duplicate watch input, invalid fields, malformed JSON, repeated-request rate limiting, optional feedback notes, feedback note length validation, and client handling for network failures, non-JSON errors, and malformed successful payloads.

Comparison-output regression coverage lives in `tests/compare-watches.test.ts`. The fixture suite pins representative watch pairs across field, explorer, dive, and dress-sport styles, then asserts stable section structure, buyer picks, better-value alternatives, hidden-downside titles, and a few high-signal phrasing fragments. The intent is to catch meaningful rule drift without turning every sentence into a brittle snapshot.

Structured operational logging lives in `src/lib/observability/logger.ts`. API and Brain queue events emit JSON with stable event names, redacted raw inputs/URLs/notes/credentials, and hashed client identifiers so production failures can be diagnosed without logging user-submitted comparison text or secrets.

Durable submitted-comparison persistence lives in `src/lib/services/saved-comparisons.ts` and writes deterministic comparison results, stable public slugs, and submission counts to `saved_comparisons` only when MongoDB is configured. The write is best-effort and nonblocking so the main comparison path remains available offline. Saved comparison pages are served at `/compare/[slug]` and render stored deterministic results with submission metadata. Result pages and live comparison results expose feedback signals plus optional notes for Trinity learning.

Durable telemetry lives in `src/lib/observability/telemetry.ts` and writes allowlisted event metadata to `analytics_events` only when MongoDB is configured. It records statuses and watch IDs, hashed client identifiers, feedback signal categories, Brain status, comparison persistence status, and resolver-miss flags; raw user inputs and notes are intentionally excluded.

## Codex automation
{compare} uses Codex heartbeats as the autonomous maintenance loop. The configs live in `.codex/heartbeats`, agent briefs live in `.codex/agents`, and shared state lives in `.codex/memory`.

The active Codex app automation is `compare-complete-audit`, registered as `{compare} Autonomous Maintenance Loop` with a 3-hour cadence. It runs in the dedicated `compare-autonomous-maintenance` conversation:
- audit every 3 hours
- planner 30 minutes later
- implementer 60 minutes later
- docs/release 120 minutes later

GitHub remains source control, issue tracking, PR review, and project state. Codex is the orchestrator. By current product-owner instruction, autonomous agents should commit and push verified changes directly to `origin/main`; force pushes remain disallowed.
