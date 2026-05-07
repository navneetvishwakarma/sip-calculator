---
phase: 01-calculation-engine
plan: "03"
subsystem: infra
tags: [typescript, zod, vitest, tdd, indian-number-format, discriminated-union]

requires:
  - phase: 01-02
    provides: "packages/core package manifest, tsconfig, vitest config, tsup build config"

provides:
  - "monthlyRate(annualPct) — single conversion point for annualPct/12/100 across all calculators (D-07)"
  - "formatINR(value) — Indian number formatter: raw grouping <10L, Lakh >=10L, Crore >=1Cr (OQ-2 resolved)"
  - "ScenarioResultSchema — zod discriminatedUnion keyed on type for 6 calculator result shapes"
  - "ScenarioParamsSchema — separate params-only union for Phase 4 URL encoding and Phase 6 DB serialization"
  - "YearlySnapshot, ScenarioResult, ScenarioParams TypeScript types inferred from schemas"
  - "Per-calculator types: SIPResult, GoalResult, LumpSumResult, StepUpResult, HybridResult, SWPResult"

affects:
  - 01-04
  - 01-05
  - 01-06

tech-stack:
  added: []
  patterns:
    - "TDD RED/GREEN with separate test commit then feat commit per task"
    - "Inputs sub-schemas (no type field) for result.inputs field; Params schemas (with type) for discriminated union"
    - "InputsSchema pattern: SIPInputsSchema (no type) used in SIPResultSchema.inputs; SIPParamsSchema (with type) in ScenarioParamsSchema"
    - "All TypeScript types inferred with z.infer — no manual interface duplication"

key-files:
  created:
    - packages/core/src/utils.ts
    - packages/core/src/schema.ts
    - packages/core/tests/utils.test.ts
    - packages/core/tests/schema.test.ts
  modified: []

key-decisions:
  - "InputsSchema split from ParamsSchema: result.inputs carries no type field (redundant inside discriminated result); ScenarioParamsSchema uses Params schemas with type for Phase 4/6 serialization"
  - "10-Lakh threshold for formatINR confirmed: 999999 renders as Indian-grouped raw, 1000000 as Lakh — prevents rounding artifact at 9.9999 Lakh"
  - "SWPResultSchema.yearlySnapshots is optional (OQ-1 resolved) — populated by SWP loop in Plan 05"

patterns-established:
  - "All calculator files import monthlyRate from utils.ts — never inline annualPct/12/100"
  - "Result schemas use InputsSchema variants (no type) for inputs field"
  - "ScenarioParamsSchema uses ParamsSchema variants (with type) for standalone serialization"

requirements-completed:
  - CALC-01
  - CALC-02
  - CALC-03
  - CALC-04
  - CALC-05
  - CALC-06

duration: 35min
completed: "2026-05-07"
---

# Phase 1 Plan 03: Utils and Schema Summary

**monthlyRate + formatINR utilities and complete zod discriminated union with 6 calculator types — Plans 04 and 05 can import types directly without codebase exploration**

## Performance

- **Duration:** ~35 min
- **Started:** 2026-05-07T11:35:00Z
- **Completed:** 2026-05-07T12:15:00Z
- **Tasks:** 2 (each with TDD RED+GREEN commits)
- **Files modified:** 4

## Accomplishments

- `packages/core/src/utils.ts` exports `monthlyRate` (D-07 single conversion point) and `formatINR` (OQ-2 resolved — 10L threshold, not 1L)
- `packages/core/src/schema.ts` exports `ScenarioResultSchema` and `ScenarioParamsSchema` as full discriminated unions for all 6 calculator types, plus all TypeScript types inferred via `z.infer`
- `SWPResultSchema.yearlySnapshots` is optional (OQ-1 resolved) — Phase 3 drawdown chart can populate it
- 13 tests pass: 7 in `utils.test.ts`, 6 in `schema.test.ts`

## Task Commits

Each task used TDD RED (test commit) then GREEN (feat commit):

1. **Task 1 RED: utils.test.ts failing** - `cc8547b` (test)
2. **Task 1 GREEN: utils.ts implementation** - `4e36d4e` (feat)
3. **Task 2 RED: schema.test.ts failing** - `77d4254` (test)
4. **Task 2 GREEN: schema.ts implementation** - `fa8243e` (feat)

## Files Created/Modified

- `packages/core/src/utils.ts` — monthlyRate and formatINR, 18 lines
- `packages/core/src/schema.ts` — complete zod schema with inputs/params split, 185 lines
- `packages/core/tests/utils.test.ts` — 7 tests covering all threshold cases
- `packages/core/tests/schema.test.ts` — 6 tests: SIP parse, SWP no snapshots, SWP perpetual, invalid SIP, unknown type, SWP params

## Decisions Made

**InputsSchema split from ParamsSchema:** The plan's original schema used `SIPParamsSchema` (with `type: literal('sip')`) as the `inputs` field type inside `SIPResultSchema`. When parsing `{ type: 'sip', inputs: { monthlyAmount: 10000, ... } }`, Zod required the `inputs.type` field to be present — but the tests (and the real call sites) omit `type` from the nested inputs object. The fix was to create separate `SIPInputsSchema` variants (no `type` field) for result schema `inputs` fields, keeping `SIPParamsSchema` (with `type`) for the standalone `ScenarioParamsSchema` discriminated union. This is documented as a Rule 1 fix (incorrect schema shape would have caused parse failures at every call site).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Separated InputsSchema from ParamsSchema to remove redundant type field in result.inputs**
- **Found during:** Task 2 GREEN (first test run after schema implementation)
- **Issue:** Plan specified `inputs: SIPParamsSchema` in `SIPResultSchema`, but `SIPParamsSchema` requires `type: 'sip'`. The test data (and all real call sites) do not include `type` inside the nested `inputs` object — the parent `type` discriminant already carries that information. Three tests failed with `ZodError: Invalid input: expected "sip"` at path `inputs.type`.
- **Fix:** Created `SIPInputsSchema`, `GoalInputsSchema`, etc. (no `type` field) for use in result schemas' `inputs` field. The `ParamsSchema` variants (with `type`) are retained exclusively for `ScenarioParamsSchema` where standalone serialization requires the discriminant.
- **Files modified:** `packages/core/src/schema.ts`
- **Verification:** All 6 schema tests pass after fix
- **Committed in:** fa8243e (Task 2 feat commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - incorrect schema shape)
**Impact on plan:** Necessary correction. The split pattern (Inputs vs Params) is actually cleaner — it matches the real usage pattern at every call site and keeps the contracts accurate.

## Issues Encountered

None beyond the schema deviation documented above.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

Plans 04 and 05 (calculator implementations) can now:
- `import { monthlyRate } from './utils'` — no inline conversion needed
- `import { SIPResult, GoalResult, ... } from './schema'` — concrete return types with no exploration required
- `import { ScenarioResultSchema } from './schema'` — runtime validation on output
- `import { ScenarioParamsSchema } from './schema'` — Phase 4/6 serialization ready

The `src/index.ts` barrel file is not yet created — Plan 04 or a dedicated wire-up plan will export all calculator functions alongside these utilities.

---
*Phase: 01-calculation-engine*
*Completed: 2026-05-07*

## Self-Check: PASSED

Files exist:
- packages/core/src/utils.ts: FOUND
- packages/core/src/schema.ts: FOUND
- packages/core/tests/utils.test.ts: FOUND
- packages/core/tests/schema.test.ts: FOUND

Commits:
- cc8547b (test - utils RED): FOUND
- 4e36d4e (feat - utils GREEN): FOUND
- 77d4254 (test - schema RED): FOUND
- fa8243e (feat - schema GREEN): FOUND
