# Release Notes

## v0.1.1 - 2026-05-11
- Updated `README.md` and the governance docs to match the live codebase and verification process.
- Corrected the documented technical background, including actual TypeScript, ESLint, and frontend architecture details.
- Added an explicit app version source and surfaced `v0.1.1` in the web UI.
- Added basic per-client `/api/compare` rate limiting with `429` and `Retry-After` responses.
- Hardened watch resolution so generic brand-only and ambiguous model inputs fail closed instead of selecting the first catalog match.
- Added MongoDB-backed allowlisted telemetry for compare outcomes, resolver misses, Brain polling, and feedback signals.
- Added MongoDB-backed saved-comparison persistence for submitted deterministic comparison results.
- Added stable `/compare/[slug]` pages for MongoDB-backed saved comparison results.
- Added supported-catalog quick-select examples and resolver-miss recovery data in `/api/compare`.
- Added inline duplicate and resolver-equivalent input validation before `/api/compare` submission.
- Exposed catalog side-picking, input swap/clear, manual Brain refresh, and optional feedback notes in the UI.
- Cleared the prior Next/PostCSS audit blocker with a root PostCSS override.

## v0.1.0 - 2026-05-11
- Replaced the previous repository contents with the initial {compare} codebase.
- Added a Next.js App Router mechanical-watch comparison app with a curated catalog, consequence engine, and `/api/compare` route.
- Added baseline project governance documents, tests, and MongoDB-ready infrastructure.
- Verified lint, test, typecheck, and production build locally. `npm audit --omit=dev` remains blocked by the current stable Next dependency tree.
