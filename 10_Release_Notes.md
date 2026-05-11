# Release Notes

## v0.1.1 - 2026-05-11
- Updated `README.md` and the governance docs to match the live codebase and verification process.
- Corrected the documented technical background, including actual TypeScript, ESLint, and frontend architecture details.
- Added an explicit app version source and surfaced `v0.1.1` in the web UI.
- Added basic per-client `/api/compare` rate limiting with `429` and `Retry-After` responses.
- Preserved the current upstream audit blocker caused by the stable Next dependency tree.

## v0.1.0 - 2026-05-11
- Replaced the previous repository contents with the initial SpecDiff codebase.
- Added a Next.js App Router mechanical-watch comparison app with a curated catalog, consequence engine, and `/api/compare` route.
- Added baseline project governance documents, tests, and MongoDB-ready infrastructure.
- Verified lint, test, typecheck, and production build locally. `npm audit --omit=dev` remains blocked by the current stable Next dependency tree.
