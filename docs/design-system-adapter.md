# Design System Adapter

SSOT: [sovereignsquad/general-design-system](https://github.com/sovereignsquad/general-design-system)  
Aligned package line: `@doneisbetter/* 2.6.4`  
Local status: `strict GDS adoption with temporary package-source exception`

ClassScout does not define its own UI authority. This file only records how the repo consumes the General Design System, which local implementation notes remain, and which temporary exceptions are explicitly approved.

## Runtime contract

- Root provider:
  [`src/app/providers.tsx`](/Users/Shared/Projects/classscout/src/app/providers.tsx) mounts `GdsProvider` from `@doneisbetter/gds-theme/client`.
- Official theme lane:
  [`src/theme/mantineTheme.ts`](/Users/Shared/Projects/classscout/src/theme/mantineTheme.ts) uses `createPublicBrandTheme({ flatSurfaces: true })` from `@doneisbetter/gds-theme/server`.
- Shared primitives:
  `@doneisbetter/gds-core` powers public/shared surfaces and `@doneisbetter/gds-admin` powers admin/operational surfaces.
- Package source:
  the repo currently installs the official `2.6.4` tarballs from the public GitHub release assets for `gds-v2.6.4` because npm publication is not live yet. This temporary path is tracked in [`gds-adoption.json`](/Users/Shared/Projects/classscout/gds-adoption.json).

## Mandatory primitive authority

If GDS ships the primitive, ClassScout must use it.

- App frame and responsive navigation:
  use `DiscoveryShell` and `SidebarNav`, not a local shell or nav system.
- Page-level discovery heading and action framing:
  use `PageHeader`.
- Browse/filter controls:
  use `BrowseSurface`, `DataToolbar`, and `FilterDrawer`.
- Theme:
  use an official shipped GDS theme lane or official composer only.

## Banned drift patterns

- local `AppShell` rebuilds for the main discovery experience
- local nav systems that replace `SidebarNav`
- repo-owned theme forks built from raw `extendGdsTheme(...)` branding overrides
- ad hoc spacing systems layered on top of shipped GDS shell and browse primitives

## Local implementation note

- [`src/components/media/CdnImage.tsx`](/Users/Shared/Projects/classscout/src/components/media/CdnImage.tsx)
  Domain-specific image fallback behavior used by product surfaces. This is implementation utility code, not a shared design-system authority.

## Approved exceptions

- Public GitHub release asset tarballs for `gds-v2.6.4`
  Temporary installation source until the canonical `@doneisbetter/*` npm artifacts are available to all delivery environments.
- Embedded provider maps
  Third-party iframe surface outside the current GDS package scope.

## Required repo controls

- Adoption manifest:
  [`gds-adoption.json`](/Users/Shared/Projects/classscout/gds-adoption.json)
- Shared lint rules:
  [`eslint.config.mjs`](/Users/Shared/Projects/classscout/eslint.config.mjs) loads `@doneisbetter/gds-eslint-config`
- Compliance checks:
  `npm run gds:validate-manifest`
  `npm run gds:check`

## Verification

Run these before shipping GDS-related changes:

- `npm run gds:validate-manifest`
- `npm run gds:check`
- `npm run lint`
- `npm test`
- `npm run build`

## Migration expectations

- Use `@doneisbetter/gds-theme/client` for the root provider.
- Use official shipped GDS theme lanes or official theme composers from `@doneisbetter/gds-theme/server`.
- Prefer published `@doneisbetter/gds-core` and `@doneisbetter/gds-admin` contracts over local shells, cards, headers, tables, navigation, or toolbar rebuilds.
- Do not introduce the retired placeholder package line, parallel provider stacks, or a new local design-system authority.
- Remove or shrink adapters only by replacing them with canonical GDS contracts, not by growing bespoke wrappers.
