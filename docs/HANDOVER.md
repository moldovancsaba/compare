# ClassScout Handover

Last updated: 2026-05-28
Current repo HEAD when this document was written: `59d00f5`

## What This Project Is

ClassScout is a Next.js App Router application for discovering NYC kids and family activities.

Main user-facing content types:

- `Classes`
- `Camps`
- `Birthday Parties`
- `Drop-In Activities`
- `Meet-Up Groups`
- editorial neighborhood guides / neighborhood overview pages

Main infrastructure:

- Next.js
- MongoDB
- ImgBB for raster images
- Vercel for deployment

## Current architecture boundary

ClassScout should be understood as the user-facing destination layer, not the intelligence owner.

- Checklist local AI is the intended owner of source harvest, playlist selection, queue management, generation, validation, and publish decisions.
- ClassScout should primarily read prepared MongoDB Atlas documents and render them quickly.
- Transitional bridge, mission-report, and source-harvest helper code still exists in this repo, but that is migration-state reality rather than the target architecture.

## Current blocker

As of 2026-05-28, the Checklist-side queue integration for the ClassScout destination lane is implemented and locally verified at build/test level, but live end-to-end runtime writes are blocked by the shared MongoDB Atlas cluster being over storage quota. Until that Atlas quota issue is resolved, the always-on pipeline cannot complete write-backed execution even though the local daemon and bridge path are working.

## Current Product State

The app currently includes:

- a homepage with category entry points and featured neighborhood guides
- category browse pages for `Classes`, `Camps`, `Birthday Parties`, and `Drop-In Activities`
- a separate `Meet-Up Groups` page
- a `Neighborhood Guide` route that shows all activity types for one borough/neighborhood
- a standard admin console at `/admin`
- a dedicated image CMS at `/secret-cms-to-edit`

Recent important behavior changes:

- neighborhood guide cards now open a true neighborhood overview page, not just `Classes`
- neighborhood guide pages now display the uploaded guide image in the hero/header area
- the image CMS now lists the full matrix of possible location hero slots
- the image CMS now autosaves; no separate save button is required for image updates
- desktop branding now avoids the duplicate header/sidebar logo state

## Repo Shape

Top-level areas that matter most:

- `src/app`: App Router pages and API routes
- `src/components/scout`: user-facing app shell and product views
- `src/components/admin`: admin UI and image CMS UI
- `src/lib`: routing, Mongo access, validation, admin session logic, ingest logic
- `src/types`: TypeScript types for providers, meetups, and site content
- `scripts`: seeding, restore, env sync, curator tooling
- `docs`: architecture, operations, roadmap, reports, and this handover

Useful files:

- [README.md](/Users/Shared/Projects/classscout/README.md)
- [docs/architecture.md](/Users/Shared/Projects/classscout/docs/architecture.md)
- [docs/operations.md](/Users/Shared/Projects/classscout/docs/operations.md)
- [package.json](/Users/Shared/Projects/classscout/package.json)
- [src/lib/mongodb.ts](/Users/Shared/Projects/classscout/src/lib/mongodb.ts)
- [src/types/site.ts](/Users/Shared/Projects/classscout/src/types/site.ts)
- [src/components/admin/ImageCmsPage.tsx](/Users/Shared/Projects/classscout/src/components/admin/ImageCmsPage.tsx)
- [src/components/scout/ClassScoutShell.tsx](/Users/Shared/Projects/classscout/src/components/scout/ClassScoutShell.tsx)

## Data Model

Mongo collections:

- `providers`
- `meetupGroups`
- `locations`
- `site`

Collection wiring lives in [src/lib/mongodb.ts](/Users/Shared/Projects/classscout/src/lib/mongodb.ts).

### Providers

Defined in [src/types/provider.ts](/Users/Shared/Projects/classscout/src/types/provider.ts).

Important fields:

- `category`
- `borough`
- `neighborhood`
- `image`
- `galleryImages`
- `recurringPrograms`

### Meetup Groups

Defined in [src/types/meetup.ts](/Users/Shared/Projects/classscout/src/types/meetup.ts).

Important fields:

- `borough`
- `neighborhood`
- `coverImageUrl`

### Site Document

Defined in [src/types/site.ts](/Users/Shared/Projects/classscout/src/types/site.ts).

Stored as:

- `_id: "main"`

This document controls:

- logo URL
- home/discover hero images
- featured guides
- location hero image registry
- marketing copy
- newsletter copy
- account/calculator copy

Important site image fields:

- `logoUrl`
- `homeHeroUrl`
- `discoverHeroUrl`
- `guides[].imageUrl`
- `locationHeroImages[]`

### Location Hero Images

`locationHeroImages` is a registry for exact page/place hero images.

Each row includes:

- `view`
- `borough`
- `neighborhood` optional
- `imageUrl`
- `alt` optional

This powers the page hero image for:

- `Classes`
- `Camps`
- `Birthday Parties`
- `Drop-In Activities`
- `Meet-Up Groups`

Matching is explicit. There is no desired “smart fallback” behavior for location-specific hero imagery.

## Main Routes

User-facing pages:

- `/`
- `/classes`
- `/camps`
- `/birthday-parties`
- `/drop-in-activities`
- `/meet-up-groups`
- `/neighborhood-guides`
- `/saved`
- `/calculator`
- `/my-account`

Admin/content routes:

- `/admin`
- `/admin/login`
- `/secret-cms-to-edit`

Public APIs:

- `/api/public/providers`
- `/api/public/meetup-groups`
- `/api/public/locations`
- `/api/public/site`

Admin APIs:

- `/api/admin/login`
- `/api/admin/logout`
- `/api/admin/providers`
- `/api/admin/meetup-groups`
- `/api/admin/site`
- `/api/admin/locations`
- `/api/admin/upload`

Ingest APIs:

- `/api/ingest`
- `/api/ingest/upload`

Cron:

- `/api/cron/curator`

## CMS / Admin Workflows

### Standard Admin

Route:

- `/admin`

Purpose:

- manage providers
- manage meetup groups
- patch site content
- replace locations

### Dedicated Image CMS

Route:

- `/secret-cms-to-edit`

Purpose:

- manage site-level imagery only
- does not manage provider/event catalog content directly

Current behavior:

- uploads go to ImgBB immediately via `/api/admin/upload`
- the returned ImgBB URL is applied immediately in the form
- the page autosaves the site document
- no extra save button is required for image changes

What it lists:

- global images
  - logo
  - home hero
  - discover hero
- guide images
- full location hero slot matrix for all category/borough/neighborhood combinations

Important file:

- [src/components/admin/ImageCmsPage.tsx](/Users/Shared/Projects/classscout/src/components/admin/ImageCmsPage.tsx)

## Image Rules

Stored raster images are expected to be ImgBB-hosted HTTPS URLs.

Validation is enforced in:

- [src/lib/imgbbUrl.ts](/Users/Shared/Projects/classscout/src/lib/imgbbUrl.ts)

Upload endpoints:

- `/api/admin/upload`
- `/api/ingest/upload`

The dedicated image CMS uses `/api/admin/upload`.

## Authentication

Admin auth is password + signed cookie.

Relevant files:

- [src/app/api/admin/login/route.ts](/Users/Shared/Projects/classscout/src/app/api/admin/login/route.ts)
- [src/lib/adminSession.ts](/Users/Shared/Projects/classscout/src/lib/adminSession.ts)
- [src/lib/requireAdmin.ts](/Users/Shared/Projects/classscout/src/lib/requireAdmin.ts)

Required env vars:

- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`

## Move To Another Computer Checklist

### 1. Copy the repo

Use git clone, not a Finder/manual copy if possible:

```bash
git clone <repo-url>
cd classscout
```

If you already moved a local working copy manually, still verify:

```bash
git status
git remote -v
```

### 2. Install runtime prerequisites

Required locally:

- Node.js
- npm
- MongoDB network access to the target DB
- Vercel CLI if you deploy or sync env vars

This repo uses npm with `package-lock.json`.

Install:

```bash
npm install
```

### 3. Recreate environment files

Create `.env` and/or `.env.local` from [`.env.example`](/Users/Shared/Projects/classscout/.env.example).

Generate local secrets:

```bash
npm run env:generate
```

Then fill in required values:

- `MONGODB_URI`
- optional `MONGODB_DB`
- `IMGBB_API_KEY`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- `INGEST_API_KEY`

Optional curator env:

- `CURATOR_ENABLED`
- `SERPER_API_KEY`
- `CURATOR_OPENAI_API_KEY`
- `CURATOR_OPENAI_MODEL`
- `CURATOR_OPENAI_BASE_URL`
- `CRON_SECRET`

Important:

- `.env.local` overrides `.env`
- `.env.example` is documentation only; it is not loaded by Next.js

### 4. Verify local startup

Run:

```bash
npm run dev
```

Then verify:

- homepage loads
- `/admin/login` loads
- `/secret-cms-to-edit` loads
- `/api/public/site` returns JSON

### 5. Verify DB connectivity

If the app shows missing catalog content:

- check `MONGODB_URI`
- check `MONGODB_DB`
- check network/IP access to Mongo

If the DB is empty locally, use one of:

```bash
npm run db:seed
```

or

```bash
npm run db:restore-payloads
```

Difference:

- `db:seed` gives a clean baseline and resets providers/meetups
- `db:restore-payloads` replays durable curated payloads into Mongo

### 6. Verify ImgBB uploads

Test in the image CMS:

- upload one image
- confirm it previews immediately
- confirm autosave updates the site
- confirm the corresponding web page shows the image

If uploads fail, check:

- `IMGBB_API_KEY`
- `/api/admin/upload`

### 7. Verify production build

Run:

```bash
npm run lint
npm test
npm run build
```

## Deployment / Vercel

Production hosting is designed around Vercel.

Important files:

- [vercel.json](/Users/Shared/Projects/classscout/vercel.json)
- [scripts/sync-vercel-env.cjs](/Users/Shared/Projects/classscout/scripts/sync-vercel-env.cjs)

Current cron:

- `/api/cron/curator`
- schedule: Mondays 15:00 UTC

Push env vars to Vercel:

```bash
npm run vercel:env:push
```

That script pushes the supported env set to:

- production
- preview
- development

Important:

- if you change env vars in Vercel, trigger a new deployment
- `ADMIN_PASSWORD` must exist in Vercel for admin login to work there

## Daily Operator Commands

Development:

```bash
npm run dev
npm run lint
npm test
npm run build
```

Data restore / seed:

```bash
npm run db:seed
npm run db:restore-payloads
```

Env:

```bash
npm run env:generate
npm run env:generate:dry
npm run env:rotate-ingest-key
npm run vercel:env:push
```

Curator / reports:

```bash
npm run curator:run
npm run audit:curated
npm run scarcity:report
npm run catalog:audit
npm run curation:release-check
```

## Known Product/Implementation Rules

### 1. Guide cards are general neighborhood entry points

Featured guide cards on the homepage are not “Classes only”.

They now route to:

- `/neighborhood-guides?borough=...&neighborhood=...`

That view is meant to show all activity types for the location.

Relevant files:

- [src/components/scout/views/HomeView.tsx](/Users/Shared/Projects/classscout/src/components/scout/views/HomeView.tsx)
- [src/components/scout/views/NeighborhoodGuideView.tsx](/Users/Shared/Projects/classscout/src/components/scout/views/NeighborhoodGuideView.tsx)
- [src/lib/scoutRoutes.ts](/Users/Shared/Projects/classscout/src/lib/scoutRoutes.ts)

### 2. Neighborhood guide pages should show the guide image

If a guide image exists in `site.guides[].imageUrl`, the neighborhood guide header should display it.

This was recently fixed in:

- [src/components/scout/views/NeighborhoodGuideView.tsx](/Users/Shared/Projects/classscout/src/components/scout/views/NeighborhoodGuideView.tsx)

### 3. No SVG-generated “illustration fallback” direction

The project moved away from generated SVG hero/guide art for these surfaces.

Desired direction:

- real images
- explicit per-slot image control
- no fake location illustrations for these user-facing hero/guide surfaces

### 4. Desktop branding should not duplicate header + sidebar logos

Expected behavior:

- desktop: sidebar large logo only
- smaller screens: top logo + hamburger

Recent fix:

- [src/components/scout/ClassScoutShell.tsx](/Users/Shared/Projects/classscout/src/components/scout/ClassScoutShell.tsx)

### 5. Image CMS is autosave-first

Desired behavior is:

- upload -> ImgBB immediately
- URL updates immediately
- site autosaves
- web app reflects it without a separate save click

Do not reintroduce a manual save button for the image CMS unless there is a strong reason.

## Known Risks / Things To Watch

- The image CMS slot matrix is large. Performance is acceptable now, but if the neighborhood list grows a lot more, consider filter/search UI inside the CMS.
- `router.refresh()` is called after image CMS saves. If future caching changes make updates appear stale, inspect route cache behavior first.
- The site document can become content-heavy. If editorial/location image requirements keep expanding, splitting `site` into smaller content collections may eventually be cleaner.
- MongoDB availability is critical. Most content surfaces depend on it.
- The repo currently installs GDS from the public `gds-v2.6.4` GitHub release tarballs. If npm publication goes live, update the dependency source and the adoption manifest together.

## Suggested First Hour On A New Computer

1. Clone the repo.
2. Run `npm install`.
3. Create `.env.local` from `.env.example`.
4. Run `npm run env:generate`.
5. Fill in the required env vars.
6. Run `npm run dev`.
7. Open `/admin/login`.
8. Open `/secret-cms-to-edit`.
9. Upload a test image to verify ImgBB.
10. Run `npm run build`.

## Suggested First Recovery Checks If Something Is Broken

If admin login fails:

- check `ADMIN_PASSWORD`
- check `ADMIN_SESSION_SECRET`
- check whether the deployment was rebuilt after env changes

If content is missing:

- check `MONGODB_URI`
- check `MONGODB_DB`
- call `/api/public/site` and `/api/public/providers`

If images do not upload:

- check `IMGBB_API_KEY`
- test `/api/admin/upload`

If images save in CMS but do not show on the app:

- inspect `/api/public/site`
- verify the expected field changed
- verify the route is reading the correct field

If production differs from local:

- compare local `.env.local` to Vercel env
- run `npm run vercel:env:push`
- redeploy

## Final Notes

- Keep this document updated when major product behavior changes.
- Do not put secret values into this file.
- If you move the project again, the critical assets are not just the repo files. The real dependencies are:
  - env values
  - MongoDB access
  - ImgBB API access
  - Vercel project linkage
