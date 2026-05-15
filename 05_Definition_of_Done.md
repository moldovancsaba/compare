# Definition of Done

A task is complete only when all applicable items below are true in the current session:

1. Code is implemented according to the active product brief or SSOT task.
2. Documentation is updated to reflect the exact current system state.
3. `npm run lint` passes.
4. `npm run typecheck` passes.
5. `npm run test` passes.
6. `npm run build` passes.
7. `npm audit --omit=dev` reports zero vulnerabilities.
8. If git commit, tag, push, or deployment are required, they must be explicitly executed and logged before they are claimed.

For this initial baseline, git and deployment are tracked as pending until executed.
