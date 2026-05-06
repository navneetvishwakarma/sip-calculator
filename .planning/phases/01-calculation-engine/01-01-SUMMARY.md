---
phase: 01-calculation-engine
plan: 01
subsystem: infra
tags: [turborepo, pnpm, next.js, typescript, monorepo]

requires: []
provides:
  - Turborepo 2.x monorepo root with pnpm workspaces (apps/*, packages/*)
  - apps/web Next.js 15 stub with @sip/core workspace:* dependency declared
  - Turbo task pipeline: build, test, lint, dev
affects:
  - 01-02 (packages/core setup lands in the workspaces declared here)
  - All subsequent plans that import from @sip/core or run turbo tasks

tech-stack:
  added: [turbo@2.9.9, pnpm@10.10.0, next@15.3.2, react@19.1.0, typescript@5.8.3]
  patterns:
    - Exact version pinning in all package.json files (no ^ or ~)
    - transpilePackages used to compile workspace TypeScript source in Next.js dev

key-files:
  created:
    - turbo.json
    - pnpm-workspace.yaml
    - package.json
    - .npmrc
    - apps/web/package.json
    - apps/web/next.config.ts
    - apps/web/tsconfig.json
    - apps/web/app/layout.tsx
    - apps/web/app/page.tsx
  modified: []

key-decisions:
  - "Authored all config files directly — no create-turbo or create-next-app scaffolding for determinism"
  - "turbo.json uses tasks key (Turbo 2.x), not pipeline (Turbo 1.x)"
  - "test task has no dependsOn — Vitest runs against TypeScript source via esbuild, no build step needed"
  - "transpilePackages: ['@sip/core'] ensures Next.js compiles workspace source in dev without requiring a packages/core build step"

patterns-established:
  - "Exact version pinning: all package.json files use exact versions, no ranges"
  - "Workspace imports: @sip/core referenced as workspace:* in apps/web"

requirements-completed: [CALC-01, CALC-02, CALC-03, CALC-04, CALC-05, CALC-06]

duration: 12min
completed: 2026-05-06
---

# Phase 1 Plan 01: Calculation Engine — Monorepo Scaffold Summary

**Turborepo 2.x monorepo root with pnpm workspaces and a bootable Next.js 15 apps/web stub that declares @sip/core workspace:* dependency for Phase 2 import readiness**

## Performance

- **Duration:** 12 min
- **Started:** 2026-05-06T17:30:00Z
- **Completed:** 2026-05-06T17:42:00Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- Root monorepo configured with turbo.json (Turbo 2.x tasks key), pnpm-workspace.yaml declaring apps/* and packages/*, root package.json with exact pnpm@10.10.0 packageManager field, and .npmrc
- apps/web stub created with exact version pinning, @sip/core: workspace:* dependency, transpilePackages config, strict tsconfig, and minimal App Router entry points
- All supply chain pinning constraints satisfied — zero semver ranges in any package.json

## Task Commits

1. **Task 1: Monorepo root config files** - `b66e021` (feat)
2. **Task 2: apps/web minimal stub** - `ff61f34` (feat)

**Plan metadata:** (see final commit below)

## Files Created/Modified

- `turbo.json` - Turbo 2.x task pipeline with build, test, lint, dev tasks
- `pnpm-workspace.yaml` - Workspace declarations for apps/* and packages/*
- `package.json` - Root manifest with packageManager: pnpm@10.10.0 and turbo@2.9.9
- `.npmrc` - auto-install-peers and strict-peer-dependencies flags
- `apps/web/package.json` - @sip/web manifest with @sip/core workspace:*, next@15.3.2, react@19.1.0
- `apps/web/next.config.ts` - transpilePackages: ["@sip/core"]
- `apps/web/tsconfig.json` - strict mode, bundler module resolution, Next.js plugin
- `apps/web/app/layout.tsx` - Root layout (html/body shell)
- `apps/web/app/page.tsx` - Empty Home component (intentionally minimal)

## Decisions Made

None beyond plan specification — all implementation choices were pre-decided in the plan (Turbo 2.x syntax, exact version pinning, no scaffolding tools for determinism).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

pnpm was not installed in the execution environment. Installed pnpm@10.10.0 globally via npm to confirm the version matches the packageManager field before writing. No impact on output files.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Turborepo workspace graph is wired: once Plan 02 creates packages/core, `pnpm install` from root will resolve @sip/core correctly
- apps/web stub is ready for Phase 2 to add pages, components, and actual calculator UI
- No blockers

## Self-Check: PASSED

All 10 files exist on disk. Commits b66e021 and ff61f34 confirmed in git log.

---
*Phase: 01-calculation-engine*
*Completed: 2026-05-06*
