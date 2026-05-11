# Release Policy

## Release Readiness
A release candidate needs:
- Lint pass.
- Tests pass.
- Typecheck pass.
- Build pass.
- Known security audit state documented.
- README and release notes updated when behavior changes.

## Changelog
Use `10_Release_Notes.md` as the current lightweight changelog until a formal release process is introduced.

## Deployment Claims
Only claim deployment when a deployment command or platform record confirms it. If deployment is blocked by credentials or network access, record the blocker in shared memory.
