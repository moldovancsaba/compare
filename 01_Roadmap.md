# Roadmap

## Current phase
V1.0.1 hardening and documentation alignment for {compare}.

## Completed in this baseline
- Repository reset from previous unrelated app.
- Next.js App Router project scaffolded.
- Mechanical watch comparison ontology created.
- Consequence-focused comparison engine implemented.
- API route and single-screen UI implemented.
- UI styling primitives extracted into a shared token layer.
- Initial unit tests and project documentation created, then updated to match the live codebase.
- Codex heartbeat architecture added for audit, planning, implementation, and docs loops.
- Basic API rate limiting added.
- Watch resolver now rejects weak and ambiguous inputs instead of silently guessing.

## Next recommended milestones
1. Add client-side failure handling for network errors and malformed API responses.
2. Expand watch resolution with stronger fuzzy matching and richer reference coverage.
3. Add comparison regression fixtures for stable output changes.
4. Expand the watch catalog with richer normalization and reference coverage.
5. Add structured persistence for submitted comparisons and correction feedback.
6. Introduce LLM-assisted extraction for new watch pages while keeping deterministic implication logic.
7. Add saved comparison pages and SEO landing routes.
