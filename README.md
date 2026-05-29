# RangeScout EU

RangeScout EU is a Next.js app for discovering sport shooting training, ranges, competitions, hunting grounds, and clubs across Europe.

## Product shape

- Public directory for EU shooting and hunting operators
- Country and region browsing instead of NYC neighborhood browsing
- Venue, club, and planner flows adapted for shooting activity discovery
- MongoDB-backed catalog with admin and ingest APIs

## Core categories

- `Training`
- `Ranges`
- `Competitions`
- `Hunting Grounds`
- `Clubs`

## Stack

- Next.js App Router
- MongoDB
- Mantine
- React Query

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Configure env values in `.env.local`:

- `MONGODB_URI`
- `MONGODB_DB` optional, defaults to `rangescout`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- `INGEST_API_KEY`
- `IMGBB_API_KEY` if you use hosted media upload

3. Seed defaults:

```bash
npm run db:seed
```

4. Start the app:

```bash
npm run dev
```

## Verification

```bash
npm run build
```

## Notes

- The old `compare` watch project has been replaced.
- Useful structural patterns were copied from `classscout`, but the active product is now `RangeScout EU`.
- Some legacy curator and content-intelligence code paths are still present in the repo, but the public-facing app and seeded content are now aligned to the new shooting/hunting domain.
