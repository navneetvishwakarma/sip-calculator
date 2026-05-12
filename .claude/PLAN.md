# Phase 1 — Calculation Engine

**Goal:** Build `packages/core` (all six calculators, tested, zero-DOM, barrel-exported) and the `apps/web` monorepo stub.

Implementation specs — exact code, acceptance criteria, verify commands — live in `.planning/phases/01-calculation-engine/01-0N-PLAN.md`. Each task references its source plan.

---

## Wave 1 — Monorepo scaffold (Plans 01 + 02, parallel)

- [ ] 1. Create monorepo root config → `turbo.json, pnpm-workspace.yaml, package.json, .npmrc` *(01-01 Task 1)*
- [ ] 2. Create apps/web minimal stub → `apps/web/package.json, apps/web/next.config.ts, apps/web/tsconfig.json, apps/web/app/page.tsx, apps/web/app/layout.tsx` *(01-01 Task 2)*
- [ ] 3. Create packages/core package manifest and tsconfig → `packages/core/package.json, packages/core/tsconfig.json` *(01-02 Task 1)*
- [ ] 4. Create packages/core vitest and tsup configs → `packages/core/vitest.config.ts, packages/core/tsup.config.ts` *(01-02 Task 2)*

## Wave 2 — Shared primitives (Plan 03, blocked on Wave 1)

- [ ] 5. Write utils.ts + tests (monthlyRate, formatINR, 10-Lakh threshold) → `packages/core/src/utils.ts, packages/core/tests/utils.test.ts` *(01-03 Task 1)*
- [ ] 6. Write schema.ts + tests (zod discriminated union, all 6 result types) → `packages/core/src/schema.ts, packages/core/tests/schema.test.ts` *(01-03 Task 2)*

## Wave 3 — Forward calculators (Plan 04, blocked on Wave 2)

- [ ] 7. Implement CALC-01 standard SIP + tests (canary: 10k/12%/10yr = ₹23,23,391) → `packages/core/src/sip.ts, packages/core/tests/sip.test.ts` *(01-04 Task 1)*
- [ ] 8. Implement CALC-03 lump sum + CALC-04 step-up SIP + tests (0% step-up invariant) → `packages/core/src/lumpSum.ts, packages/core/src/stepUpSip.ts, packages/core/tests/lumpSum.test.ts, packages/core/tests/stepUpSip.test.ts` *(01-04 Task 2)*

## Wave 4 — Remaining calculators (Plan 05, blocked on Wave 3)

- [ ] 9. Implement CALC-05 hybrid + CALC-06 SWP + tests (superposition, perpetual check) → `packages/core/src/hybrid.ts, packages/core/src/swp.ts, packages/core/tests/hybrid.test.ts, packages/core/tests/swp.test.ts` *(01-05 Task 1)*
- [ ] 10. Implement CALC-02 goal-based bisection + tests (bisection guarantee) → `packages/core/src/goalSip.ts, packages/core/tests/goalSip.test.ts` *(01-05 Task 2)*

## Wave 5 — Barrel export + lint gate (Plan 06, blocked on Wave 4)

- [ ] 11. Write barrel export → `packages/core/src/index.ts` *(01-06 Task 1)*
- [ ] 12. Add ESLint zero-DOM config, update lint script, run full suite gate → `packages/core/eslint.config.mjs, packages/core/package.json` *(01-06 Task 2)*

---

## Phase 1 complete when

- `turbo run test` exits 0
- `turbo run lint` exits 0
- `calcSIP(10000, 12, 10).summary.finalCorpus === 2323391` cross-validated against Groww
