# SpecDiff

SpecDiff is a Next.js webapp that compares enthusiast products by consequences instead of raw spec tables. V1 is intentionally narrow: mechanical watches only.

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

## Stack
- Next.js 16 App Router
- React 19
- TypeScript strict mode
- Tailwind CSS 4
- Mongoose connection utility for MongoDB Atlas
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
- `npm run test`
- `npm run build`
- `npm audit --omit=dev`

Current status on 2026-05-11:
- lint: pass
- test: pass
- build: pass
- audit: blocked by `next@16.2.6` shipping `postcss@8.4.31` internally. `npm audit --omit=dev` reports two moderate vulnerabilities tied to that upstream dependency chain.
