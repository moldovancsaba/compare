# Technology Stack

## Runtime
- Node.js: validated locally on v24.15.0
- npm: validated locally on v11.12.1

## Application stack
- Next.js 16.2.6
- React 19.2.6
- TypeScript 6.0.3 in strict mode
- Tailwind CSS 4.3.0
- Mongoose 9.6.2
- Zod 4.4.3

## Testing and quality
- ESLint 10.3.0 with `eslint-config-next` 16.2.6
- Vitest 4.1.5

## Deployment target
- Vercel

## Notes
- MongoDB Atlas is the intended persistence layer, but the current V1 baseline uses an in-repo catalog so the core product can run without secrets.
- Socket.io is intentionally not installed because no real-time feature exists in V1.
- `npm audit --omit=dev` currently fails because stable `next@16.2.6` depends on `postcss@8.4.31` internally. No stable patched Next release was available during this build.
