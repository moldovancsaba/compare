# SpecDiff

SpecDiff is a Next.js web app that compares enthusiast products by consequences instead of raw spec tables. Release `v0.1.1` is intentionally narrow: mechanical watches only.

## Version
- Project version: `0.1.1`
- Current release label: `v0.1.1`

## What it does
- Accepts two watch names or supported product URLs.
- Resolves them against a curated mechanical watch catalog.
- Generates:
  - Key Differences
  - Real-World Impact
  - Who Should Buy Which
  - Overpriced Features
  - Hidden Downsides
  - Better Value Alternative
- Highlights what is meaningful versus mostly marketing.

## Why it exists
Most comparison content is bloated, repetitive, and detached from real ownership. SpecDiff compresses the usual review-tab spiral into one focused screen that explains what changes on wrist and why that matters.

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
- Vitest for unit tests

## Local setup
1. Install dependencies with `npm install`.
2. Start the app with `npm run dev`.
3. Open `http://localhost:3000`.

Optional environment variables:

```bash
MONGODB_URI=
MONGODB_DB_NAME=specdiff
```

V1 does not require MongoDB to run because it ships with a curated watch catalog. The database hook is present so later persistence can be added without changing the app shape.

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
- audit: blocked by `next@16.2.6` shipping `postcss@8.4.31` internally. `npm audit --omit=dev` reports two moderate vulnerabilities tied to that upstream dependency chain.

## Documentation map
- Product overview: `README.md`
- Technical background: `02_Technology_Stack.md`
- Release history: `10_Release_Notes.md`
- Design primitives: `design-tokens.md`

Current automated route coverage includes `/api/compare` success, unsupported watch input, duplicate watch input, invalid fields, malformed JSON, and repeated-request rate limiting.

## Codex automation
SpecDiff uses Codex heartbeats as the autonomous maintenance loop. The configs live in `.codex/heartbeats`, agent briefs live in `.codex/agents`, and shared state lives in `.codex/memory`.

The active Codex app automation is `specdiff-complete-audit`, registered as `SpecDiff Autonomous Maintenance Loop` with a 3-hour cadence. It runs in the dedicated `specdiff-autonomous-maintenance` conversation:
- audit every 3 hours
- planner 30 minutes later
- implementer 60 minutes later
- docs/release 120 minutes later

GitHub remains source control, issue tracking, PR review, and project state. Codex is the orchestrator. By current product-owner instruction, autonomous agents should commit and push verified changes directly to `origin/main`; force pushes remain disallowed.
