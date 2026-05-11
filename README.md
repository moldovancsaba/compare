# {compare}

{compare} is a Next.js web app that compares enthusiast products by consequences instead of raw spec tables. Release `v0.1.1` is intentionally narrow: mechanical watches only.

## Version
- Project version: `0.1.1`
- Current release label: `v0.1.1`

## What it does
- Accepts two watch names or supported product URLs.
- Resolves them against a curated mechanical watch catalog.
- Rejects weak or ambiguous inputs instead of guessing when a match is not clear.
- Generates:
  - Key Differences
  - Real-World Impact
  - Who Should Buy Which
  - Overpriced Features
  - Hidden Downsides
  - Better Value Alternative
- Highlights what is meaningful versus mostly marketing.

## Why it exists
Most comparison content is bloated, repetitive, and detached from real ownership. {compare} compresses the usual review-tab spiral into one focused screen that explains what changes on wrist and why that matters.

## Product shape
- Single-screen comparison experience with a server-rendered landing page and client-side form interactions.
- Deterministic comparison engine built around a curated watch catalog instead of speculative scraping.
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

V1 does not require MongoDB to run because it ships with a curated watch catalog. The database hook is present so later persistence can be added without changing the app shape.

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
- Design primitives: `design-tokens.md`

Current automated route coverage includes resolver matching and ambiguity rejection, `/api/compare` success, unsupported watch input, duplicate watch input, invalid fields, malformed JSON, repeated-request rate limiting, and client handling for network failures, non-JSON errors, and malformed successful payloads.

Comparison-output regression coverage lives in `tests/compare-watches.test.ts`. The fixture suite pins representative watch pairs across field, explorer, dive, and dress-sport styles, then asserts stable section structure, buyer picks, better-value alternatives, hidden-downside titles, and a few high-signal phrasing fragments. The intent is to catch meaningful rule drift without turning every sentence into a brittle snapshot.

Structured operational logging lives in `src/lib/observability/logger.ts`. API and Brain queue events emit JSON with stable event names, redacted raw inputs/URLs/notes/credentials, and hashed client identifiers so production failures can be diagnosed without logging user-submitted comparison text or secrets.

Durable telemetry lives in `src/lib/observability/telemetry.ts` and writes allowlisted event metadata to `analytics_events` only when MongoDB is configured. It records statuses and watch IDs, hashed client identifiers, feedback signal categories, Brain status, and resolver-miss flags; raw user inputs and notes are intentionally excluded.

## Codex automation
{compare} uses Codex heartbeats as the autonomous maintenance loop. The configs live in `.codex/heartbeats`, agent briefs live in `.codex/agents`, and shared state lives in `.codex/memory`.

The active Codex app automation is `compare-complete-audit`, registered as `{compare} Autonomous Maintenance Loop` with a 3-hour cadence. It runs in the dedicated `compare-autonomous-maintenance` conversation:
- audit every 3 hours
- planner 30 minutes later
- implementer 60 minutes later
- docs/release 120 minutes later

GitHub remains source control, issue tracking, PR review, and project state. Codex is the orchestrator. By current product-owner instruction, autonomous agents should commit and push verified changes directly to `origin/main`; force pushes remain disallowed.
