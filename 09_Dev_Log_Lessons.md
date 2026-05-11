# Dev Log Lessons

## 2026-05-11
- The repository existed remotely but the checked-out contents were unrelated to SpecDiff, so the baseline was intentionally removed before scaffolding the new product.
- The first V1 implementation uses a deterministic watch ontology instead of speculative scraping so the output stays explainable and testable.
- MongoDB was wired as an optional connection utility rather than a hard runtime dependency because no persistence feature exists yet.
- The UI now uses shared design tokens and presentational component splits instead of scattering design decisions through JSX.
- Documentation drift happened quickly once the UI refactor landed, so versioning and stack docs now need to be treated as first-class deliverables in each release.
- Stable `next@16.2.6` currently fails `npm audit --omit=dev` due to its nested `postcss@8.4.31`. A safe override did not satisfy audit, so the repo records this as an upstream blocker instead of pretending the security gate passed.
