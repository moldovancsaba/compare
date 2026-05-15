# {compare}

{compare} is a Next.js web app for high-trust comparison intelligence across supported decision domains. Release `v0.2.1` ships a domain-adapter platform with mechanical watches and business services live, plus collector intelligence for watch profiles.

## Version
- Project version: `0.2.1`
- Current release label: `v0.2.1`

## What It Does
- Lets users choose a supported comparison domain.
- Accepts supported names, aliases, references, or source URLs where the adapter supports them.
- Rejects weak, unsupported, duplicate, or ambiguous inputs instead of guessing.
- Leads with an instant verdict, stronger choice, exception case, recommendation signals, and confidence rationale.
- Shows evidence and limitations so users can separate catalog facts, deterministic rules, editorial inference, and missing data.
- Lets watch users simulate alternate buying priorities without replacing the baseline verdict.
- Supports optional local watch decision-intent profiles for personalized recommendation emphasis.
- Shows transparent watch value scoring with explicit weighting for comfort, capability, versatility, ownership, and price discipline.
- Shows curated secondary-market ownership context for supported watches without live scraping or investment framing.
- Recommends smart discovery alternatives with explicit reason codes for better-value plays, role contrast, hidden-gem fit, manageable exit risk, and decision-intent fit.
- Supports accountless watch collection profiles stored in the browser.
- Adds collection-aware watch guidance: gap/overlap insights, upgrade-path verdicts, balance scoring, single-watch should-I-buy reports, five-year ownership simulation, market positioning, and marketing-reality checks.
- Supports saved comparison pages with route-specific metadata when MongoDB is configured.

## Live Domains
- Mechanical watches: curated watch catalog with resolver disambiguation, consequence rules, ownership metadata, ownership simulation, market positioning, marketing-reality analysis, tradeoff simulation, smart discovery alternatives, collection profiles, and collector guidance.
- Business services: curated service archetypes with switching-cost, contract-risk, implementation-friction, and governance reasoning.

## Product Shape
- Single-screen comparison experience with an adapter-aware domain selector.
- Generic comparison API at `/api/compare`.
- Optional Brain enrichment through a MongoDB-backed local worker handoff.
- Optional feedback, telemetry, and saved-comparison persistence when MongoDB is configured.
- Tokenized visual system in `src/app/globals.css`.

## Stack
- Next.js 16 App Router
- React 19
- TypeScript 5.9 in strict mode
- Tailwind CSS 4
- Zod 4 for input validation
- Mongoose for optional MongoDB Atlas persistence
- Vitest for unit and conformance tests

## Local Setup
1. Install dependencies with `npm install`.
2. Start the app with `npm run dev`.
3. Open `http://localhost:3000`.

Optional environment variables:

```bash
MONGODB_URI=
MONGODB_DB_NAME=compare
COMPARE_BRAIN_PROVIDER=
NEXT_PUBLIC_APP_ORIGIN=http://localhost:3000
```

Use `.env.example` as the template and copy values into `.env.local` for local development. Keep `.env.example` free of real credentials.
Set `NEXT_PUBLIC_APP_ORIGIN` to the canonical public origin so saved comparison pages emit correct canonical, Open Graph, and Twitter metadata.

The app does not require MongoDB to run. Without MongoDB, `/api/compare` still returns deterministic comparison results. With MongoDB, submitted comparisons can be saved to `saved_comparisons`, feedback can be recorded, telemetry can be written, and Brain jobs can be queued.

Set `COMPARE_BRAIN_PROVIDER=trinity_worker` only when MongoDB Atlas is configured and a local `{trinity}` worker is available. In that mode `/api/compare` returns the deterministic comparison immediately and queues optional enrichment.

Run the local Brain worker with:

```bash
npm run brain:worker
```

For one queued job only:

```bash
npm run brain:worker:once
```

## Quality Gates
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm audit --omit=dev`

Current status for `v0.2.1`:
- lint: pass
- typecheck: pass
- test: pass
- build: pass
- audit: pass

Verification note:
- Quality-gate commands require installed dependencies in `node_modules`.

GitHub Actions runs install, lint, test, typecheck, build, and production dependency audit gates on pushes to `main` and on pull requests.

## Documentation Map
- User manual: `docs/user-manual.md`
- API documentation: `docs/api.md`
- Architecture: `docs/architecture.md`
- Watch catalog: `docs/watch-catalog.md`
- Domain adapter SDK: `docs/domain-adapters.md`
- Data governance: `docs/data-governance.md`
- Watch collection profiles: `docs/watch-collection-profiles.md`
- Watch consequence rules: `docs/watch-consequence-rules.md`
- Trinity Brain integration: `docs/trinity-brain-integration.md`
- Release history: `10_Release_Notes.md`
- Product strategy: `11_Product_Strategy.md`
- Design primitives: `design-tokens.md`

## Testing Coverage
Vitest coverage includes resolver matching, typo tolerance, ambiguity rejection, domain adapter conformance, generic comparison output shape, evidence/confidence metadata, recommendation signals, watch ownership metadata, ownership simulation, market positioning, marketing-reality analysis, tradeoff simulation, transparent value scoring, smart discovery alternatives, watch consequence rules, collection profiles, gap/overlap analysis, upgrade-path intelligence, balance scoring, services comparisons, validation, rate limiting, feedback, Brain status, telemetry sanitization, saved comparison slugs, and client error handling.

## Catalog Maintenance
The watch adapter source of truth is the versioned JSON document at `src/lib/data/watch-catalog.v1.json`.

- Validate the current catalog with `npm run catalog:validate`.
- Generate a normalized draft row from curated source URLs with `npm run catalog:ingest -- --manifest ./watch-draft.json --output ./tmp/watch-entry.json`.
- Maintainer workflow and schema details live in `docs/watch-catalog.md`.

## Operations
Structured logging lives in `src/lib/observability/logger.ts`. API and Brain queue events emit JSON with stable event names, redacted raw inputs/URLs/notes/credentials, and hashed client identifiers.

Durable submitted-comparison persistence lives in `src/lib/services/saved-comparisons.ts`. Writes are best-effort and nonblocking so the main comparison path remains available offline.

Durable telemetry lives in `src/lib/observability/telemetry.ts` and writes allowlisted event metadata to `analytics_events` only when MongoDB is configured.

## Codex Automation
{compare} uses Codex heartbeats as the autonomous maintenance loop. The configs live in `.codex/heartbeats`, agent briefs live in `.codex/agents`, and shared state lives in `.codex/memory`.

GitHub Project 16 is the single source of truth for roadmap and task state. By current product-owner instruction, autonomous agents may commit and push verified changes directly to `origin/main`; force pushes remain disallowed.
