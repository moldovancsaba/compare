# Technology Stack

Current documented release: `v0.1.1`

## Runtime
- Node.js: validated locally on v24.15.0
- npm: validated locally on v11.12.1

## Application stack
- Product: SpecDiff `0.1.1`
- Next.js 16.2.6
- React 19.2.6
- React DOM 19.2.6
- TypeScript 5.9.3 in strict mode
- Tailwind CSS 4.3.0
- PostCSS 8.5.14 with `@tailwindcss/postcss` 4.3.0
- Mongoose 9.6.2
- Zod 4.4.3

## Frontend architecture
- App Router entrypoints under `src/app`
- Server-rendered page shell with client-side comparison form
- CSS variable driven design tokens and semantic utility classes in `src/app/globals.css`
- Presentational UI split across `comparison-hero`, `comparison-input-form`, and `comparison-result`

## Domain and data layer
- Curated watch catalog in `src/lib/data/watch-catalog.ts`
- Watch resolution utility in `src/lib/utils/resolve-watch.ts`
- Deterministic comparison service in `src/lib/services/compare-watches.ts`
- Optional MongoDB-ready connection utility in `src/lib/db.ts`

## Testing and quality
- ESLint 9.39.1 with `eslint-config-next` 16.2.6
- Vitest 4.1.5
- TypeScript `tsc --noEmit` for type verification

## Deployment target
- Vercel

## Notes
- MongoDB Atlas is the intended persistence layer, but the current V1 baseline uses an in-repo catalog so the core product can run without secrets.
- Socket.io is intentionally not installed because no real-time feature exists in V1.
- `npm audit --omit=dev` currently fails because stable `next@16.2.6` depends on `postcss@8.4.31` internally. No stable patched Next release was available during this build.
