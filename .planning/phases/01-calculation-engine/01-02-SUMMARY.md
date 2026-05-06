---
phase: 01-calculation-engine
plan: "02"
subsystem: infra
tags: [typescript, vitest, tsup, zod, turborepo, pnpm]

requires: []

provides:
  - "@sip/core package manifest (packages/core/package.json) with dual ESM+CJS exports field"
  - "TypeScript config with lib: [\"ES2022\"] enforcing zero-DOM boundary at compile time"
  - "Vitest 4.1.5 test runner config (node environment, globals enabled)"
  - "tsup 8.5.1 dual ESM+CJS build config (.mjs/.cjs output)"

affects:
  - 01-03
  - 01-04
  - 01-05
  - 01-06

tech-stack:
  added:
    - "zod 4.4.3 (runtime schema validation)"
    - "typescript 5.8.3"
    - "vitest 4.1.5"
    - "tsup 8.5.1"
    - "@types/node 22.15.3"
  patterns:
    - "Exact version pinning (no caret/tilde) in package.json for supply-chain control"
    - "lib: [\"ES2022\"] without dom in tsconfig as compile-time zero-DOM enforcement"
    - "No-op lint placeholder script so turbo run lint succeeds before ESLint is wired"
    - "module: NodeNext + moduleResolution: NodeNext for workspace TypeScript resolution"

key-files:
  created:
    - packages/core/package.json
    - packages/core/tsconfig.json
    - packages/core/vitest.config.ts
    - packages/core/tsup.config.ts
  modified: []

key-decisions:
  - "No extends from packages/typescript-config — standalone tsconfig for packages/core since root scaffold (Plan 01) runs in a separate worktree and typescript-config package may not exist yet"
  - "lint script is a no-op echo placeholder — turbo run lint succeeds; Plan 06 replaces it with real ESLint invocation"
  - "environment: node in vitest config — consistent with zero-DOM boundary; jsdom explicitly avoided"

patterns-established:
  - "All @sip/core config files are standalone (no workspace extends) to allow independent creation before root scaffold merges"

requirements-completed:
  - CALC-01
  - CALC-02
  - CALC-03
  - CALC-04
  - CALC-05
  - CALC-06

duration: 8min
completed: "2026-05-06"
---

# Phase 1 Plan 02: @sip/core Package Skeleton Summary

**@sip/core package identity established: pinned deps, zero-DOM TypeScript config (lib: ES2022, no dom), Vitest node environment, and dual ESM+CJS tsup build — compile-time zero-DOM gate active before any source is written**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-05-06T17:21:00Z
- **Completed:** 2026-05-06T17:29:05Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- `packages/core/package.json` created as `@sip/core` v0.0.1 with dual ESM+CJS exports field, exact version pinning (zod 4.4.3, vitest 4.1.5, tsup 8.5.1, typescript 5.8.3), and no-op lint script
- `packages/core/tsconfig.json` created with `"lib": ["ES2022"]` and NO `dom` — any reference to `window`, `document`, or `HTMLElement` in `packages/core/src/` is a compile-time type error
- `packages/core/vitest.config.ts` created with `globals: true` and `environment: 'node'` — `pnpm --filter @sip/core test` is a valid command
- `packages/core/tsup.config.ts` created with dual ESM+CJS format, `.mjs`/`.cjs` extensions, `dts: true` — aligns with the exports field in package.json

## Task Commits

1. **Task 1: package.json and tsconfig.json** - `7fd326f` (feat)
2. **Task 2: vitest.config.ts and tsup.config.ts** - `1f6ef91` (feat)

## Files Created/Modified

- `packages/core/package.json` - @sip/core package manifest, exports, exact version deps, no-op lint
- `packages/core/tsconfig.json` - Zero-DOM TypeScript config: lib: ES2022, NodeNext module resolution, strict mode
- `packages/core/vitest.config.ts` - Vitest config: globals:true, environment:node
- `packages/core/tsup.config.ts` - tsup dual ESM+CJS build: entry src/index.ts, .mjs/.cjs output extensions, dts:true

## Decisions Made

No new decisions — all config values were specified in the plan. The one structural note: `packages/core/tsconfig.json` does not extend `packages/typescript-config/base.json` (which the research file mentions as an alternative) because Plan 01 creates the root scaffold in a parallel worktree and `typescript-config` may not exist at merge time. Standalone tsconfig avoids a missing-extends error.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 03 (`packages/core/src/`) can now write `src/utils.ts`, `src/schema.ts`, and calculator source files against this config. The TypeScript compiler will enforce zero-DOM from the first source file. `pnpm --filter @sip/core test` will run (failing with "no test files" until Plan 04 adds tests — expected behavior).

Plan 01 (monorepo scaffold) must merge before `pnpm install` or `turbo run build` can succeed at the workspace level — that dependency is expected.

---
*Phase: 01-calculation-engine*
*Completed: 2026-05-06*

## Self-Check: PASSED

Files exist:
- packages/core/package.json: FOUND
- packages/core/tsconfig.json: FOUND
- packages/core/vitest.config.ts: FOUND
- packages/core/tsup.config.ts: FOUND

Commits:
- 7fd326f (Task 1): FOUND
- 1f6ef91 (Task 2): FOUND
