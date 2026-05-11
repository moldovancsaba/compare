# READMEDEV

## Objective
Build and maintain SpecDiff as a production-grade Next.js webapp that compares mechanical watches by real-world ownership consequences, not raw spec tables.

## Active Assignment
- Source of truth for this initial build: the PO brief from 2026-05-11 in this workspace conversation.
- External SSOT board (`moldovancsaba/mvp-factory-control`) is not connected yet.
- Until that board is linked, treat the current assignment as: create the initial repository baseline, V1 watch comparison experience, and the full documentation system listed below.

## Working Rules
1. Read this file before implementation.
2. Keep the stack minimal: Next.js App Router, Tailwind CSS, TypeScript, Vercel deployment target, MongoDB Atlas via Mongoose when configured.
3. Do not add dependencies unless they directly support V1.
4. Keep code and documentation synchronized in the same change set.
5. V1 scope is mechanical watches only.
6. Product standard: explain practical consequences, not just spec deltas.
7. If a future task depends on missing SSOT context, stop and ask the PO.

## Required Documents
- [README.md](./README.md)
- [01_Roadmap.md](./01_Roadmap.md)
- [02_Technology_Stack.md](./02_Technology_Stack.md)
- [03_AI_Consent_Permissions.md](./03_AI_Consent_Permissions.md)
- [05_Definition_of_Done.md](./05_Definition_of_Done.md)
- [06_Sequential_Development_Rule.md](./06_Sequential_Development_Rule.md)
- [08_AI_Verification_Protocol.md](./08_AI_Verification_Protocol.md)
- [09_Dev_Log_Lessons.md](./09_Dev_Log_Lessons.md)
- [10_Release_Notes.md](./10_Release_Notes.md)
- [design-tokens.md](./design-tokens.md)

## Current Architecture Snapshot
- Frontend: Next.js 16 App Router
- Styling: Tailwind CSS 4 with CSS variable driven theming plus semantic UI primitives in `src/app/globals.css`
- Logic: local watch ontology and deterministic implication engine
- API: `/api/compare`
- Data source: curated catalog in code for V1, MongoDB-ready connection utility for later persistence
- UI composition: `comparison-form` orchestrator with separated hero, input, and result components
- Tests: Vitest unit coverage for resolver and comparison engine

## Definition Of Ready For Any Future Task
- Existing docs are re-read.
- V1 constraints are still respected.
- Build, lint, typecheck, test, and audit gates are re-run after code changes.
