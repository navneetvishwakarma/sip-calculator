# Phase 1: Calculation Engine - Pattern Map

**Mapped:** 2026-05-06
**Files analyzed:** 22
**Analogs found:** 0 / 22 (greenfield — no source code exists)

---

## File Classification

| New File | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|----------------|---------------|
| `turbo.json` | config | — | None (greenfield) | — |
| `pnpm-workspace.yaml` | config | — | None (greenfield) | — |
| `package.json` (root) | config | — | None (greenfield) | — |
| `.npmrc` | config | — | None (greenfield) | — |
| `packages/core/package.json` | config | — | None (greenfield) | — |
| `packages/core/tsconfig.json` | config | — | None (greenfield) | — |
| `packages/core/vitest.config.ts` | config | — | None (greenfield) | — |
| `packages/core/tsup.config.ts` | config | — | None (greenfield) | — |
| `packages/core/eslint.config.mjs` | config | — | None (greenfield) | — |
| `packages/core/src/index.ts` | utility | — | None (greenfield) | — |
| `packages/core/src/utils.ts` | utility | transform | None (greenfield) | — |
| `packages/core/src/schema.ts` | model | transform | None (greenfield) | — |
| `packages/core/src/sip.ts` | service | transform | None (greenfield) | — |
| `packages/core/src/goalSip.ts` | service | transform | None (greenfield) | — |
| `packages/core/src/lumpSum.ts` | service | transform | None (greenfield) | — |
| `packages/core/src/stepUpSip.ts` | service | transform | None (greenfield) | — |
| `packages/core/src/hybrid.ts` | service | transform | None (greenfield) | — |
| `packages/core/src/swp.ts` | service | transform | None (greenfield) | — |
| `packages/core/tests/sip.test.ts` | test | — | None (greenfield) | — |
| `packages/core/tests/goalSip.test.ts` | test | — | None (greenfield) | — |
| `packages/core/tests/lumpSum.test.ts` | test | — | None (greenfield) | — |
| `packages/core/tests/stepUpSip.test.ts` | test | — | None (greenfield) | — |
| `packages/core/tests/hybrid.test.ts` | test | — | None (greenfield) | — |
| `packages/core/tests/swp.test.ts` | test | — | None (greenfield) | — |
| `apps/web/package.json` | config | — | None (greenfield) | — |
| `apps/web/next.config.ts` | config | — | None (greenfield) | — |
| `apps/web/tsconfig.json` | config | — | None (greenfield) | — |
| `apps/web/app/page.tsx` | component | — | None (greenfield) | — |

---

## Dependency Graph

The planner must respect this order. Each layer depends on all layers above it.

```
Layer 0 — Monorepo scaffold (no code deps)
  turbo.json
  pnpm-workspace.yaml
  package.json (root)
  .npmrc

Layer 1 — packages/core config (no source deps)
  packages/core/package.json
  packages/core/tsconfig.json          ← zero-DOM constraint lives here
  packages/core/vitest.config.ts
  packages/core/tsup.config.ts

Layer 2 — Shared primitives (no cross-file deps within packages/core)
  packages/core/src/utils.ts           ← monthlyRate(), formatINR()
  packages/core/src/schema.ts          ← all zod schemas + exported types

Layer 3 — Calculator functions (depend on utils.ts + schema.ts)
  packages/core/src/sip.ts             ← CALC-01, no other calc dep
  packages/core/src/lumpSum.ts         ← CALC-03, no other calc dep
  packages/core/src/stepUpSip.ts       ← CALC-04, no other calc dep
  packages/core/src/hybrid.ts          ← CALC-05, calls sip.ts + lumpSum.ts
  packages/core/src/swp.ts             ← CALC-06, no other calc dep
  packages/core/src/goalSip.ts         ← CALC-02, calls sip.ts internally

Layer 4 — Public API
  packages/core/src/index.ts           ← re-exports all Layer 2+3 public symbols

Layer 5 — Tests (depend on their target calculator + schema)
  packages/core/tests/sip.test.ts
  packages/core/tests/lumpSum.test.ts
  packages/core/tests/stepUpSip.test.ts
  packages/core/tests/hybrid.test.ts
  packages/core/tests/swp.test.ts
  packages/core/tests/goalSip.test.ts

Layer 6 — ESLint config (depends on final source structure being stable)
  packages/core/eslint.config.mjs

Layer 7 — apps/web stub (depends on @sip/core being importable)
  apps/web/package.json
  apps/web/next.config.ts
  apps/web/tsconfig.json
  apps/web/app/page.tsx
```

**Implementation order from RESEARCH.md §Recommended Approach (lines 692–699):**
scaffold → `tsconfig.json` → `utils.ts` + `schema.ts` → CALC-01 → CALC-03 → CALC-04 → CALC-05 → CALC-06 → CALC-02 → tests alongside each → `eslint.config.mjs` last.

---

## Shared Patterns

These apply uniformly across multiple files. The planner should reference this section in the action for every affected file.

### Pattern 1: Year-by-Month Loop (universal calculation pattern)

**Apply to:** `sip.ts`, `lumpSum.ts`, `stepUpSip.ts`, `hybrid.ts`, `swp.ts`, `goalSip.ts`
**Source:** RESEARCH.md lines 157–195 (verified via Node.js execution)

This is the single computation pattern for all six calculators. Do not use closed-form formulas as the primary implementation for any calculator. The loop works for all six types and naturally produces `YearlySnapshot[]`.

```typescript
// CALC-01 standard SIP — annuity-due (beginning-of-period convention)
// corpus = (corpus + contribution) * (1 + r) each month
for (let year = 1; year <= years; year++) {
  for (let month = 1; month <= 12; month++) {
    corpus = (corpus + monthlyAmount) * (1 + r);
    totalInvested += monthlyAmount;
  }
  yearlySnapshots.push({
    year,
    monthlyInvestment: monthlyAmount,
    totalInvested: Math.round(totalInvested),
    interestEarned: Math.round(corpus - totalInvested),
    corpusValue: Math.round(corpus),
  });
}
```

Variants per calculator:
- `lumpSum.ts` (CALC-03): contribution is 0 every month after the initial deposit. Use `corpus = lumpSumAmount` before the loop, then `corpus = corpus * (1 + r)` each month.
- `stepUpSip.ts` (CALC-04): `currentMonthly` increases by `stepUpPct / 100` per year. Apply step-up **after** capturing the `YearlySnapshot`, not before.
- `hybrid.ts` (CALC-05): superposition — `corpus = calcSIP(...).summary.finalCorpus + calcLumpSum(...).summary.finalCorpus`. No separate loop needed.
- `swp.ts` (CALC-06): contribution is negative (`corpus = corpus * (1 + r) - withdrawal`). Run month-by-month, count until `corpus <= 0`.

### Pattern 2: monthlyRate — single conversion site

**Apply to:** `utils.ts` (definition), every calculator file (usage)
**Source:** CONTEXT.md D-07; RESEARCH.md §Standard Stack

```typescript
// packages/core/src/utils.ts
export function monthlyRate(annualPct: number): number {
  return annualPct / 12 / 100;
}
```

Every calculator calls `monthlyRate(annualReturnPct)`. Inline `annualPct / 12 / 100` anywhere else is a bug.

### Pattern 3: Rounding discipline

**Apply to:** `sip.ts`, `lumpSum.ts`, `stepUpSip.ts`, `hybrid.ts`, `swp.ts`, `goalSip.ts`
**Source:** RESEARCH.md Anti-Patterns §Rounding intermediate values (lines 247–251)

Round only when writing to `YearlySnapshot` fields. The intermediate `corpus` float must stay unrounded between monthly steps. All five `YearlySnapshot` fields use `Math.round()` — including `monthlyInvestment` (which can be fractional for non-integer step-up percentages like 7.5%).

```typescript
// Correct — round at snapshot write time only
yearlySnapshots.push({
  year,
  monthlyInvestment: Math.round(monthlyInvestment),
  totalInvested: Math.round(totalInvested),
  interestEarned: Math.round(corpus - totalInvested),
  corpusValue: Math.round(corpus),
});
// Incorrect — do NOT round corpus here: corpus = Math.round(corpus * (1 + r))
```

### Pattern 4: Bisection search (CALC-02 only)

**Apply to:** `goalSip.ts`
**Source:** RESEARCH.md lines 204–229 (verified via Node.js, 22 iterations for ₹1 crore)

```typescript
// Source: RESEARCH.md lines 204–229
function calcGoalSIP(
  targetCorpus: number,
  annualReturnPct: number,
  years: number
): GoalResult {
  const r = monthlyRate(annualReturnPct);
  const n = years * 12;
  function fv(P: number) {
    return P * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
  }

  let lo = 0, hi = 1;
  while (fv(hi) < targetCorpus) hi *= 2;

  while (hi - lo > 0.01) {
    const mid = (lo + hi) / 2;
    if (fv(mid) < targetCorpus) lo = mid;
    else hi = mid;
  }

  const monthly = Math.ceil((lo + hi) / 2);
  // Then call calcSIP(monthly, annualReturnPct, years) to produce yearlySnapshots
}
```

Bounds: lo=0, hi=1 doubling until `fv(hi) > targetCorpus`. Convergence: `hi - lo < 0.01`. Output: `Math.ceil((lo+hi)/2)` — round up to guarantee meeting target.

### Pattern 5: SWP perpetual check

**Apply to:** `swp.ts`
**Source:** RESEARCH.md lines 237–243

```typescript
// Check before the depletion loop
if (corpus * monthlyRate(annualReturnPct) >= monthlyWithdrawal) {
  return {
    type: 'swp',
    inputs,
    monthsToDepletion: 'perpetual',
  };
}
```

### Pattern 6: Zod discriminated union schema

**Apply to:** `schema.ts`
**Source:** RESEARCH.md lines 536–608 (Zod 4.4.3)

```typescript
import { z } from 'zod';

const YearlySnapshotSchema = z.object({
  year: z.number().int().positive(),
  monthlyInvestment: z.number().nonnegative(),
  totalInvested: z.number().nonnegative(),
  interestEarned: z.number(),
  corpusValue: z.number().nonnegative(),
});

// Per-calculator result schema (SIPResultSchema shown; repeat for others)
const SIPResultSchema = z.object({
  type: z.literal('sip'),
  inputs: SIPParamsSchema,   // reuse from ScenarioParams sub-schema (not inline)
  summary: z.object({
    totalInvested: z.number(),
    totalGains: z.number(),
    finalCorpus: z.number(),
  }),
  yearlySnapshots: z.array(YearlySnapshotSchema),
});

// Top-level exports
export const ScenarioResultSchema = z.discriminatedUnion('type', [
  SIPResultSchema,
  GoalResultSchema,
  LumpSumResultSchema,
  StepUpResultSchema,
  HybridResultSchema,
  SWPResultSchema,
]);

export type ScenarioResult = z.infer<typeof ScenarioResultSchema>;

// Separate inputs-only export for Phase 4 URL encoding + Phase 6 DB serialization
export const ScenarioParamsSchema = z.discriminatedUnion('type', [
  SIPParamsSchema,
  GoalParamsSchema,
  LumpSumParamsSchema,
  StepUpParamsSchema,
  HybridParamsSchema,
  SWPParamsSchema,
]);

export type ScenarioParams = z.infer<typeof ScenarioParamsSchema>;
```

Key constraint: the per-calculator `inputs` sub-schemas (e.g., `SIPParamsSchema`) must be defined once and reused in both `ScenarioParamsSchema` and the `inputs` field of the result schemas. No duplication.

### Pattern 7: INR formatter

**Apply to:** `utils.ts`
**Source:** RESEARCH.md lines 635–649 (verified via Node.js)

```typescript
export function formatINR(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  const TEN_LAKH = 1_000_000;
  const CRORE = 10_000_000;

  if (abs >= CRORE) {
    return `${sign}₹${parseFloat((abs / CRORE).toFixed(2))} Crore`;
  }
  if (abs >= TEN_LAKH) {
    return `${sign}₹${parseFloat((abs / 100_000).toFixed(2))} Lakh`;
  }
  return `${sign}₹${abs.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}
```

See Open Question 2 below — the 10-Lakh threshold is a recommendation, not a confirmed decision.

### Pattern 8: Zero-DOM enforcement (two-layer)

**Apply to:** `packages/core/tsconfig.json` (Layer 1) + `packages/core/eslint.config.mjs` (Layer 6)
**Source:** RESEARCH.md lines 332–462

Layer 1 — TypeScript (compile-time): `"lib": ["ES2022"]` with no `"DOM"` makes `window`, `document`, `HTMLElement` type errors.

```json
// packages/core/tsconfig.json — critical settings
{
  "compilerOptions": {
    "lib": ["ES2022"],
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true
  }
}
```

Layer 2 — ESLint (import-time):

```javascript
// packages/core/eslint.config.mjs
rules: {
  'no-restricted-imports': ['error', 'react', 'react-dom', 'next',
    { patterns: [{ group: ['next/*'], message: 'packages/core must not import from next — zero-DOM boundary.' }] },
  ],
  'no-restricted-globals': ['error',
    { name: 'window', message: 'packages/core: zero-DOM boundary.' },
    { name: 'document', message: 'packages/core: zero-DOM boundary.' },
    { name: 'navigator', message: 'packages/core: zero-DOM boundary.' },
    { name: 'localStorage', message: 'packages/core: zero-DOM boundary.' },
  ],
}
```

### Pattern 9: turbo.json task configuration (Turbo 2.x)

**Apply to:** `turbo.json`
**Source:** RESEARCH.md lines 295–318; Finding 10 lines 661–683

```json
{
  "$schema": "https://turborepo.dev/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "test": { "outputs": ["coverage/**"] },
    "lint": { "outputs": [] },
    "dev": { "cache": false, "persistent": true }
  }
}
```

`"tasks"` (not `"pipeline"`) is the Turbo 2.x key. After scaffold, verify and rewrite if `create-turbo` emits the old key. `test` does NOT depend on `build` — Vitest runs against TypeScript source via esbuild transform directly.

### Pattern 10: Calculator result structure (discriminant + inputs + summary + snapshots)

**Apply to:** All calculator source files (`sip.ts` through `swp.ts`)

Every forward-calculator result follows:

```typescript
return {
  type: 'sip',              // string literal matching ScenarioResult discriminant
  inputs: { ... },          // raw inputs verbatim (for Phase 6 round-trip restore)
  summary: {
    totalInvested: Math.round(totalInvested),
    totalGains: Math.round(corpus - totalInvested),
    finalCorpus: Math.round(corpus),
  },
  yearlySnapshots,          // YearlySnapshot[] built during the loop
};
```

`SWPResult` differs: replace `summary` + `yearlySnapshots` with `monthsToDepletion: number | "perpetual"`. See Open Question 1 re: optional `yearlySnapshots` on SWP.

---

## Pattern Assignments

### `packages/core/src/utils.ts` (utility, transform)

Depends on: nothing (first file written after tsconfig)
Used by: all calculator files, all test files, `schema.ts`

Exports: `monthlyRate(annualPct: number): number` and `formatINR(value: number): string`.
See Shared Pattern 2 (monthlyRate) and Shared Pattern 7 (formatINR).

---

### `packages/core/src/schema.ts` (model, transform)

Depends on: `utils.ts` (for types only, no runtime dep), `zod`
Used by: all calculator files (return types), all test files (schema validation), Phase 4/6

Exports: `YearlySnapshotSchema`, `ScenarioResultSchema`, `ScenarioParamsSchema` and their inferred types.
See Shared Pattern 6 (zod discriminated union).

The `inputs` sub-schemas must be defined once and shared between `ScenarioParamsSchema` and the `inputs` fields inside result schemas. The planner should plan this reuse explicitly.

---

### `packages/core/src/sip.ts` (service, transform)

Depends on: `utils.ts`, `schema.ts`
Used by: `goalSip.ts` (calls `calcSIP` internally), `hybrid.ts`, test file

Core: year-by-month loop with `corpus = (corpus + P) * (1 + r)`. See Shared Patterns 1, 2, 3, 10.

Canary value: `calcSIP(10000, 12, 10).summary.finalCorpus === 2323391`. This must be cross-validated against Groww before any other calculator is written (RESEARCH.md Risk 1).

---

### `packages/core/src/lumpSum.ts` (service, transform)

Depends on: `utils.ts`, `schema.ts`
Used by: `hybrid.ts`, test file

Core: `corpus = lumpSumAmount` before loop, then `corpus = corpus * (1 + r)` each month (no contribution after month 0). Produces `YearlySnapshot[]` same as SIP. See Shared Patterns 1, 3, 10.

---

### `packages/core/src/stepUpSip.ts` (service, transform)

Depends on: `utils.ts`, `schema.ts`
Used by: test file

Core: year-by-year outer loop. `currentMonthly` starts at `monthlyAmount`, multiplied by `(1 + stepUpPct/100)` after each year's snapshot is captured.

Anti-pattern to avoid: do not increment `currentMonthly` before capturing the snapshot — Year 1 must show the starting amount, not the post-increment amount (RESEARCH.md Risk 2).

Invariant: `calcStepUpSIP(P, r, n, 0%)` must equal `calcSIP(P, r, n)` to ±₹1. Test this as the first stepUpSip test case.

---

### `packages/core/src/goalSip.ts` (service, transform)

Depends on: `utils.ts`, `schema.ts`, `sip.ts` (called after bisection to produce snapshots)
Used by: test file

Core: bisection search on monthly amount. The bisection uses the closed-form formula internally for speed (`fv(P) = P * ((1+r)^n - 1) / r * (1+r)`), then calls `calcSIP(monthly, ...)` to produce `yearlySnapshots` for the returned `GoalResult`. See Shared Pattern 4.

---

### `packages/core/src/hybrid.ts` (service, transform)

Depends on: `utils.ts`, `schema.ts`, `sip.ts`, `lumpSum.ts`
Used by: test file

Core: superposition. `corpus = calcSIP(...).summary.finalCorpus + calcLumpSum(...).summary.finalCorpus`. No independent loop. The `yearlySnapshots` should combine both components per year (planner should decide: either sum each year's corpus, or omit snapshots for hybrid — this is a minor design decision within discretion).

---

### `packages/core/src/swp.ts` (service, transform)

Depends on: `utils.ts`, `schema.ts`
Used by: test file

Core: perpetual check first (Shared Pattern 5), then month-by-month depletion loop. See Open Question 1 regarding optional `yearlySnapshots` on `SWPResult`.

---

### `packages/core/src/index.ts` (utility, —)

Depends on: all `src/*.ts` files above
Used by: `apps/web` and any future package importing `@sip/core`

Single re-export file. All public API flows through here. Nothing else.

---

### Test files (`packages/core/tests/*.test.ts`)

Each test file depends on its target calculator and `schema.ts`. The planner should write tests alongside each calculator, not as a separate wave.

Required test per file (from RESEARCH.md §Validation Architecture):

| Test file | Required cases |
|-----------|----------------|
| `sip.test.ts` | Cross-validation: `calcSIP(10000, 12, 10).summary.finalCorpus === 2323391`. Schema parse succeeds. |
| `goalSip.test.ts` | Target ₹1 crore / 12% / 15yr → monthly ≤ ₹20,000. Schema parse succeeds. |
| `lumpSum.test.ts` | `calcLumpSum(1000000, 12, 15).summary.finalCorpus === 5995802`. Schema parse succeeds. |
| `stepUpSip.test.ts` | `calcStepUpSIP(P, r, n, 0)` equals `calcSIP(P, r, n)` to ±₹1. Schema parse succeeds. |
| `hybrid.test.ts` | Hybrid corpus equals SIP corpus + lump sum corpus (superposition). Schema parse succeeds. |
| `swp.test.ts` | Perpetual case. Known-depletion-months case. Schema parse succeeds. |

Test for zero-DOM: not a Vitest test — enforced by `turbo run lint`. No need to write a test file for this.

Vitest config pattern (RESEARCH.md lines 401–410):

```typescript
// packages/core/vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
});
```

---

### Config files

All config file patterns are fully specified in RESEARCH.md. The planner should transcribe them directly.

| File | Pattern source |
|------|----------------|
| `turbo.json` | RESEARCH.md lines 295–318 (Finding 1) + lines 661–683 (Finding 10) |
| `pnpm-workspace.yaml` | RESEARCH.md lines 322–326 |
| `packages/core/package.json` | RESEARCH.md lines 371–390 |
| `packages/core/tsconfig.json` | RESEARCH.md lines 334–351 |
| `packages/core/tsup.config.ts` | RESEARCH.md lines 358–369 |
| `packages/core/vitest.config.ts` | RESEARCH.md lines 401–410 |
| `packages/core/eslint.config.mjs` | RESEARCH.md lines 430–462 |
| `apps/web/package.json` | Must include `"@sip/core": "workspace:*"` as dependency |

---

## Open Questions (planner must resolve before writing plan actions)

These are unresolved decisions from RESEARCH.md that directly affect the files the planner plans. The planner must either lock a resolution or flag them for implementer decision at task time.

### OQ-1: SWP `yearlySnapshots` field

**Files affected:** `schema.ts` (`SWPResultSchema`), `swp.ts`

CONTEXT.md D-02 specifies `SWPResult` has `monthsToDepletion: number | "perpetual"` and no `yearlySnapshots`. RESEARCH.md (lines 704–710) flags that Phase 3's drawdown chart will require corpus-by-year data and recommends adding `yearlySnapshots?: YearlySnapshot[]` as optional now to avoid a Phase 3 schema migration.

Resolution options:
- Add `yearlySnapshots?: YearlySnapshot[]` to `SWPResultSchema` now (optional field — backward compatible)
- Keep `SWPResult` as specified in D-02; accept that Phase 3 will need a schema change

### OQ-2: `formatINR` threshold — 10 Lakh vs 1 Lakh

**Files affected:** `utils.ts`

RESEARCH.md Finding 9 recommends 10-Lakh as the threshold for switching from raw Indian grouping to "₹X Lakh" notation, to avoid the rounding artifact where ₹9,99,999 displays as "₹10 Lakh". This is a judgment call, not a confirmed decision. CONTEXT.md only cites examples at ₹12.5 Lakh and ₹2.3 Crore.

Resolution: confirm 10-Lakh threshold with user before implementing `utils.ts`, or implement with a named constant so it is trivially changed.

### OQ-3: `apps/web` stub depth

**Files affected:** `apps/web/` directory

RESEARCH.md Open Question 3 (lines 715–719): should the Phase 1 `apps/web` stub be four hand-written files (`package.json`, `next.config.ts`, `tsconfig.json`, `app/page.tsx`) or a full `pnpm dlx create-next-app@latest` scaffold?

Recommendation: run `create-next-app` so Phase 2 has a bootable `next dev` environment. But if scaffold generates conflicting workspace config, manual files are safer.

---

## No Analog Found

All 28 files have no analog — this is a greenfield project. The planner should use RESEARCH.md patterns (lifted in §Shared Patterns above) as the implementation reference instead of any existing codebase file.

---

## Metadata

**Analog search scope:** Entire repository — `C:\Users\navne.FUDGE\source\sip-calculator\`
**Files scanned:** 0 source files (no source code exists)
**Pattern extraction date:** 2026-05-06
**Pattern source:** RESEARCH.md (01-RESEARCH.md) — all patterns verified via Node.js execution or official documentation (see RESEARCH.md §Sources)
