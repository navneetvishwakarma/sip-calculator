# Phase 1: Calculation Engine — Research

**Researched:** 2026-05-06
**Domain:** TypeScript financial math library, Turborepo pnpm monorepo scaffold
**Confidence:** HIGH (math verified via Node.js execution; tooling verified via npm registry and official docs)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Full Turborepo skeleton in Phase 1 (`packages/core` + `apps/web` Next.js 15 stub). Bootstrap via `pnpm create turbo@latest`, strip example app, customize. Package: `@sip/core`.
- D-02: `ScenarioResult` discriminated union keyed on `type` field, validated by a zod schema exported as `ScenarioResultSchema`. `ScenarioParams` (inputs only) exported alongside.
- D-03: Annual snapshots only. Shape: `{ year, monthlyInvestment, totalInvested, interestEarned, corpusValue }`.
- D-04: Vitest (not Jest).
- D-05: Resolve `decimal.js` empirically via cross-validation. Do not pre-adopt.
- D-06: Zero-DOM enforcement via ESLint rule or bundler check.
- D-07: `monthlyRate(annualPct: number): number` is the single conversion point for `annualPct / 12 / 100`.
- D-08: `formatINR(value: number): string` in `packages/core`.

### Claude's Discretion
None specified — all key decisions were locked in discussion.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CALC-01 | Standard SIP: monthly amount + return rate + duration → corpus + yearly breakdown | Verified: annuity due formula, loop-based snapshots |
| CALC-02 | Goal-based SIP: target corpus + rate + duration → required monthly investment | Verified: bisection search, 22 iterations for rupee precision |
| CALC-03 | Lump sum: one-time amount + rate + duration → corpus | Verified: closed-form `P*(1+r)^n` |
| CALC-04 | Step-up SIP: starting monthly + annual step-up % + rate + duration → corpus | Verified: year-by-year loop; 0% step-up = standard SIP to ±0 rupees |
| CALC-05 | SIP + lump sum hybrid: lump sum today + ongoing SIP → combined corpus | Verified: CALC-01 + CALC-03 superposition |
| CALC-06 | SWP: corpus + monthly withdrawal + return rate → months to depletion or "perpetual" | Verified: month-by-month loop; perpetual condition `corpus * r >= withdrawal` |
</phase_requirements>

---

## Summary

Phase 1 is a pure TypeScript library phase with no UI. All complexity is in three areas: (1) getting the Turborepo monorepo scaffold into the right shape, (2) implementing six calculator functions with the correct SIP timing convention, and (3) enforcing the zero-DOM boundary at compile time.

The SIP timing convention is the single highest-risk assumption. Groww explicitly documents the annuity-due formula `FV = P × [((1+r)^n - 1) / r] × (1+r)`, which treats each contribution as beginning-of-period. Native JS float precision is sufficient for the ±₹1 tolerance at ₹1 crore — the maximum floating-point error for a 120-step compound calculation is approximately 6×10⁻⁸ rupees. If cross-validation against ET Money fails, the cause will be timing convention mismatch, not float drift.

The step-up SIP has no clean closed form. The correct implementation is a year-by-year outer loop with twelve monthly accumulations per year. This approach naturally produces the `YearlySnapshot[]` output and has been verified: step-up at 0% exactly matches the standard SIP closed form to zero rupees.

One structural tension exists between the CONTEXT.md spec (SWPResult has no `yearlySnapshots`) and Phase 3's need for a drawdown chart. This must be resolved before implementation. The recommended resolution is to add an optional `yearlySnapshots` to SWPResult in Phase 1 (showing corpus balance at end of each year), since re-adding it in Phase 3 would break the locked `ScenarioResult` schema.

**Primary recommendation:** Implement all six calculators as pure functions over primitives. Use a year-by-year loop with twelve monthly steps as the single computation pattern — it works for all six calculator types, naturally produces `YearlySnapshot[]`, and avoids formula-convention confusion.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Calculator math | Shared Library (`packages/core`) | — | Zero DOM dependency; shared with RN mobile v2 |
| Output schema validation | Shared Library (`packages/core`) | — | `ScenarioResultSchema` used by Phase 4 URL encoding and Phase 6 DB serialization |
| INR formatting | Shared Library (`packages/core`) | — | Shared between apps/web and future RN app |
| Monorepo scaffold | Build tooling (Turborepo root) | — | Workspace management, task pipeline |
| Zero-DOM enforcement | Build tooling (ESLint in `packages/core`) | TypeScript tsconfig | Belt-and-suspenders: tsconfig `lib` + no-restricted-imports |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | ~5.x (via workspace) | Language | Required by project stack |
| zod | 4.4.3 | Runtime schema validation + type inference | Used by Phase 4/6; explicit in all locked decisions |
| tsup | 8.5.1 | Dual ESM+CJS build with `.d.ts` | Zero-config, esbuild-powered; only needed for RN forward-compat |
| vitest | 4.1.5 | Test runner | D-04 locked |

[VERIFIED: npm registry — versions confirmed via `npm view` on 2026-05-06]

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| decimal.js | 10.6.0 | Arbitrary-precision arithmetic | Only if cross-validation fails AND failure is traced to float error (not formula mismatch) |

[VERIFIED: npm registry]

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| tsup | tsc only | tsc alone produces ESM or CJS, not dual output; tsup adds 30 seconds to build; for internal workspace consumption (dev only), tsc is sufficient — add tsup only when preparing the package for external publishing or RN |
| zod 4 | zod 3 | Zod 4 is stable as of 2025; `z.discriminatedUnion` syntax unchanged; import path is still `"zod"`; no reason to use v3 |

**Installation (packages/core):**
```bash
pnpm add zod
pnpm add -D typescript vitest tsup @types/node
```

**Version verification:** Confirmed current as of 2026-05-06.

---

## Architecture Patterns

### System Architecture Diagram

```
pnpm workspace root
├── turbo.json              tasks: build → test → lint
├── pnpm-workspace.yaml     packages: [apps/*, packages/*]
│
├── packages/
│   └── core/               @sip/core
│       ├── src/
│       │   ├── index.ts          re-exports all public API
│       │   ├── utils.ts          monthlyRate(), formatINR()
│       │   ├── schema.ts         ScenarioResult zod schema + types
│       │   ├── sip.ts            CALC-01 standard SIP
│       │   ├── goalSip.ts        CALC-02 bisection search
│       │   ├── lumpSum.ts        CALC-03
│       │   ├── stepUpSip.ts      CALC-04
│       │   ├── hybrid.ts         CALC-05
│       │   └── swp.ts            CALC-06
│       ├── tests/
│       │   ├── sip.test.ts
│       │   ├── goalSip.test.ts
│       │   ├── lumpSum.test.ts
│       │   ├── stepUpSip.test.ts
│       │   ├── hybrid.test.ts
│       │   └── swp.test.ts
│       ├── package.json          name: "@sip/core"
│       ├── tsconfig.json         lib: ["ES2022"] — NO DOM
│       ├── vitest.config.ts
│       └── tsup.config.ts
│
└── apps/
    └── web/                (Next.js 15 stub — Phase 2 target)
        └── package.json    depends on "@sip/core": "workspace:*"
```

Data flow: calculator function (inputs) → monthly loop → `YearlySnapshot[]` → `ScenarioResult` → zod schema validation → export.

### Recommended Project Structure
See diagram above. One file per calculator keeps test files focused and diffs clean.

### Pattern 1: Year-by-Month Loop (Universal Calculation Pattern)

**What:** All six calculators use this inner loop. For each year, run twelve monthly steps of `corpus = (corpus + contribution) * (1 + r)`. Contribution is 0 for lump sum after month 0, varies by year for step-up, and is negative for SWP.

**When to use:** All calculators. Do not use the closed-form SIP formula in tests as a shortcut — the loop IS the implementation for step-up and SWP.

```typescript
// Source: verified via Node.js execution (this session)
// CALC-01 standard SIP (annuity due — beginning-of-period convention)
function calcSIP(
  monthlyAmount: number,
  annualReturnPct: number,
  years: number
): SIPResult {
  const r = monthlyRate(annualReturnPct);
  let corpus = 0;
  let totalInvested = 0;
  const yearlySnapshots: YearlySnapshot[] = [];

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

  return {
    type: 'sip',
    inputs: { monthlyAmount, annualReturnPct, years },
    summary: {
      totalInvested: Math.round(totalInvested),
      totalGains: Math.round(corpus - totalInvested),
      finalCorpus: Math.round(corpus),
    },
    yearlySnapshots,
  };
}
```

### Pattern 2: Bisection Search for CALC-02

**What:** Binary search on monthly amount until `calcSIP(mid, r, n).finalCorpus` reaches the target.
**Bounds:** lo=0, hi starts at 1 and doubles until corpus exceeds target.
**Convergence:** When `hi - lo < 0.01` (sub-paisa). Takes 22 iterations.
**Result:** `Math.ceil((lo + hi) / 2)` — round up so the monthly amount guarantees meeting the target.

```typescript
// Source: verified via Node.js execution (this session)
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
  // ... build GoalResult
}
```

Note: The bisection uses the closed-form SIP formula internally for speed. The result (a monthly amount) is then passed to `calcSIP` to produce the actual `yearlySnapshots` in the returned `GoalResult`.

### Pattern 3: SWP Perpetual Check

**What:** Before the loop, check if `corpus * monthlyRate >= monthlyWithdrawal`. If true, the corpus generates at least as much growth as is withdrawn each month — output `"perpetual"`.

```typescript
// Source: verified via Node.js execution (this session)
// Boundary: corpus * r === withdrawal → perpetual (corpus stays constant)
if (corpus * monthlyRate(annualReturnPct) >= monthlyWithdrawal) {
  return { type: 'swp', inputs, monthsToDepletion: 'perpetual' };
}
```

### Anti-Patterns to Avoid

- **Using the closed-form SIP formula as the primary implementation for CALC-01**: The loop and the formula are equivalent for standard SIP, but only the loop works for step-up. Unify on the loop — a verified test (`stepUp0% === standard`) confirms they agree.
- **Inline `annualPct / 12 / 100`**: D-07 locks this to `monthlyRate(annualPct)`. Any reviewer should treat an inline division as a bug.
- **Rounding intermediate values**: Only round at the point of writing to `YearlySnapshot` fields. Intermediate `corpus` float must stay unrounded between monthly steps. All five `YearlySnapshot` fields are rounded to the nearest rupee with `Math.round()` — including `monthlyInvestment` (which can be fractional when stepUpPct is non-integer like 7.5%). Consistency across the schema matters more than sub-rupee precision on any individual field.
- **Building `YearlySnapshot` at month 12 only but forgetting step-up applies at year boundary**: Step-up multiplier applies after the snapshot is captured (i.e., at the start of the next year's loop).
- **Step-up 0% invariant test uses strict equality**: State the test tolerance as `<= 1` (±₹1), not strict equality. If either implementation changes rounding strategy, strict equality will produce false negatives while ±₹1 still catches real divergence.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Runtime type validation of `ScenarioResult` | Custom type guard | zod `ScenarioResultSchema.parse()` | zod handles union narrowing, error messages, and forwards compat automatically |
| INR number formatting | Custom regex | `toLocaleString('en-IN')` for sub-10L + custom thresholds above | `Intl.NumberFormat` handles Indian grouping (2,00,000 format); only need custom logic for Lakh/Crore labels |
| Module bundling | Custom build script | tsup | Dual ESM+CJS in one command; handles `.d.ts` |

**Key insight:** The calculation functions themselves must be hand-rolled — there is no published Indian SIP math library worth depending on. Everything else should use the ecosystem.

---

## Technical Findings

### Finding 1: `pnpm create turbo@latest` scaffold (Q1)

`pnpm dlx create-turbo@latest` (create-turbo v2.9.9) is the correct invocation. It runs interactively.

**Default "basic" template produces:**
```
apps/
  docs/   (Next.js app — stub)
  web/    (Next.js app — the one we keep)
packages/
  eslint-config/
  typescript-config/
  ui/     (shared React component library — strip this)
turbo.json
package.json
pnpm-workspace.yaml
.npmrc
```

**What to strip/customize after scaffold:**
- Delete `apps/docs/` (not needed)
- Delete `packages/ui/` (no shared React components in Phase 1)
- Rename `apps/web/` to an apps/web stub (remove all Next.js pages/components — leave only `package.json`, `next.config.ts`, `tsconfig.json`, `app/page.tsx` skeleton)
- Create `packages/core/` from scratch with `@sip/core` package name
- Rewrite `turbo.json` (see turbo.json section below)

**turbo.json for Turbo 2.x** — key is `"tasks"` (not `"pipeline"`, which was Turbo 1.x):

```json
{
  "$schema": "https://turborepo.dev/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "lint": {
      "outputs": []
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

[CITED: turborepo.dev/repo/docs/reference/configuration]

**Root `package.json` workspaces** are declared in `pnpm-workspace.yaml` with pnpm (not in `package.json` like npm/yarn):

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

### Finding 2: `packages/core` TypeScript config (Q2)

The critical setting is `"lib": ["ES2022"]` — **no `"DOM"` in lib**. This makes `window`, `document`, `HTMLElement`, etc. compile-time type errors in packages/core, not just lint warnings. Combined with the ESLint no-restricted-imports layer, this is the primary enforcement mechanism.

```json
// packages/core/tsconfig.json
{
  "extends": "../../packages/typescript-config/base.json",
  "compilerOptions": {
    "lib": ["ES2022"],
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "declaration": true,
    "declarationMap": true,
    "outDir": "dist",
    "rootDir": "src",
    "strict": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

**For direct workspace consumption (dev / Phase 2 import)**, no build step is needed — Next.js will resolve TypeScript sources via pnpm workspace. But for RN v2 forward-compat, tsup dual output is the right pattern.

**tsup.config.ts:**
```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  outExtension({ format }) {
    return format === 'esm' ? { js: '.mjs' } : { js: '.cjs' };
  },
});
```

**packages/core/package.json exports field:**
```json
{
  "name": "@sip/core",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs"
    }
  },
  "main": "./dist/index.cjs",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsup",
    "test": "vitest run",
    "lint": "eslint src"
  }
}
```

[CITED: tsup docs, blog.logrocket.com/tsup/]

### Finding 3: Vitest in pnpm workspace (Q3)

Vitest 4.1.5 has deprecated `vitest.workspace.ts` in favor of the root `vitest.config.ts` `projects` property (deprecated since Vitest 3.2). Two valid approaches:

**Option A (recommended for this project — single package with tests):** Per-package `vitest.config.ts` in `packages/core`, run via `turbo run test`. No root vitest config needed since only `packages/core` has tests in Phase 1.

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

**turbo.json test task:** `"test": { "dependsOn": ["build"] }` (build first so type-checked output is tested, not raw source — or omit `dependsOn` if running vitest directly on source with `ts-node`).

**Running from root:**
```bash
turbo run test                      # all packages
pnpm --filter @sip/core test        # packages/core only
```

[CITED: vitest.dev/guide/projects — v4.1.5 docs]

### Finding 4: Zero-DOM ESLint enforcement (Q4)

Two-layer enforcement:

**Layer 1 — TypeScript (compile-time):** `"lib": ["ES2022"]` in `packages/core/tsconfig.json` means `window`, `document`, `navigator`, and all other DOM globals are undefined at the type level. Any code that references them is a compile error. This is the primary boundary.

**Layer 2 — ESLint (import-time):** Prevents importing React, Next.js, or browser-specific packages.

```javascript
// packages/core/eslint.config.mjs (ESLint flat config)
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error',
        'react',
        'react-dom',
        'next',
        {
          patterns: [{
            group: ['next/*'],
            message: 'packages/core must not import from next — zero-DOM boundary.',
          }],
        },
      ],
      'no-restricted-globals': ['error',
        { name: 'window', message: 'packages/core: zero-DOM boundary.' },
        { name: 'document', message: 'packages/core: zero-DOM boundary.' },
        { name: 'navigator', message: 'packages/core: zero-DOM boundary.' },
        { name: 'localStorage', message: 'packages/core: zero-DOM boundary.' },
      ],
    },
  }
);
```

[CITED: eslint.org/docs/latest/rules/no-restricted-imports, eslint.org/docs/latest/rules/no-restricted-globals]

### Finding 5: SIP math formulas (Q5)

**Critical: Timing convention.** Groww explicitly documents their formula as:
`FV = P × [((1+i)^n - 1) / i] × (1+i)`

The trailing `(1+i)` factor means each payment is invested at the **beginning** of the period (annuity due). This is the standard convention for Indian SIP calculators.

Verified via Node.js:
- ₹10,000/mo, 12%, 10yr: annuity due = ₹23,23,391; ordinary annuity = ₹23,00,387 (difference: ₹23,004)
- Groww and the year-by-month loop with `corpus = (corpus + P) * (1 + r)` agree exactly

**All formulas:**

```
Standard SIP (CALC-01):
  FV = P × [((1+r)^n - 1) / r] × (1+r)
  where r = annualPct/12/100, n = years*12
  — or equivalently: corpus = (corpus + P) * (1 + r) each month

Lump sum (CALC-03):
  FV = P × (1 + r)^n
  where r = annualPct/12/100, n = years*12

Step-up SIP (CALC-04):
  Year-by-year loop:
    for each year:
      for each of 12 months: corpus = (corpus + currentMonthly) * (1 + r)
      currentMonthly *= (1 + stepUpPct/100)
  No closed form needed; loop produces exact YearlySnapshot values.

SIP + Lump sum hybrid (CALC-05):
  corpus = calcSIP(monthly, r, years).finalCorpus
         + calcLumpSum(lumpSumAmount, r, years).finalCorpus
  (superposition — contributions are independent)

SWP (CALC-06):
  Perpetual check: if (corpus * r >= withdrawal) → "perpetual"
  Otherwise: each month: corpus = corpus * (1 + r) - withdrawal
  Count months until corpus <= 0.

Goal-based SIP (CALC-02):
  Bisection on monthly P such that calcSIP(P) ≥ targetCorpus.
  Bounds: lo=0, hi=1 doubling until fv(hi) > target.
  Convergence: hi - lo < 0.01 (~22 iterations).
  Result: Math.ceil((lo+hi)/2) — round up to guarantee meeting target.
```

[VERIFIED: Node.js execution; CITED: groww.in/calculators/sip-calculator formula]

### Finding 6: decimal.js cross-validation methodology (Q6)

**Native JS floats are sufficient.** IEEE-754 double precision has ~15-17 significant digits. For a 120-step compound calculation yielding ₹23 lakh, the maximum accumulated floating-point error is approximately 6×10⁻⁸ rupees — eleven orders of magnitude below the ±₹1 tolerance.

The protocol for cross-validation:
1. Run `calcSIP(10000, 12, 10)` — compare against Groww (manual: enter ₹10,000, 12%, 10yr).
2. Run `calcSIP(15000, 15, 15)` — the "15-15-15 rule" should yield ~₹1.01 crore.
3. If the discrepancy is > ₹1, investigate **formula convention** first (annuity due vs ordinary), not float precision.
4. Only adopt `decimal.js` if discrepancy persists after formula is confirmed correct.

Verified: the year-by-month loop produces ₹23,23,391 for 10k/12%/10yr, which matches the annuity-due closed form exactly.

[VERIFIED: Node.js execution; ASSUMED: ET Money uses the same annuity-due convention as Groww — needs manual cross-check during implementation]

### Finding 7: Zod discriminated union syntax (Q7)

Zod 4.4.3 is stable. Import path is `"zod"` (unchanged from v3). The `z.discriminatedUnion` API is unchanged. Notable improvement: nested discriminated unions are now supported.

```typescript
// Source: zod.dev/api — verified Zod 4
import { z } from 'zod';

const YearlySnapshotSchema = z.object({
  year: z.number().int().positive(),
  monthlyInvestment: z.number().nonnegative(),
  totalInvested: z.number().nonnegative(),
  interestEarned: z.number(),
  corpusValue: z.number().nonnegative(),
});

const SIPResultSchema = z.object({
  type: z.literal('sip'),
  inputs: z.object({
    monthlyAmount: z.number().positive(),
    annualReturnPct: z.number().positive(),
    years: z.number().int().positive(),
  }),
  summary: z.object({
    totalInvested: z.number(),
    totalGains: z.number(),
    finalCorpus: z.number(),
  }),
  yearlySnapshots: z.array(YearlySnapshotSchema),
});

// ... (similarly for GoalResult, LumpSumResult, StepUpResult, HybridResult, SWPResult)

export const ScenarioResultSchema = z.discriminatedUnion('type', [
  SIPResultSchema,
  GoalResultSchema,
  LumpSumResultSchema,
  StepUpResultSchema,
  HybridResultSchema,
  SWPResultSchema,
]);

export type ScenarioResult = z.infer<typeof ScenarioResultSchema>;
```

**SWPResultSchema** differs — no `yearlySnapshots`, no `summary.finalCorpus`:
```typescript
const SWPResultSchema = z.object({
  type: z.literal('swp'),
  inputs: z.object({ ... }),
  monthsToDepletion: z.union([z.number().int().positive(), z.literal('perpetual')]),
});
```


**ScenarioParamsSchema (separate export — inputs only):** Phase 4 (URL encoding) and Phase 6 (DB serialization) validate ScenarioParams standalone, not by stripping it from a ScenarioResult. Both schemas share the same per-calculator inputs sub-schemas internally.

```typescript
// Inputs-only discriminated union — JSON-serializable, no class instances, no Dates
const SIPParamsSchema = z.object({
  type: z.literal('sip'),
  monthlyAmount: z.number().positive(),
  annualReturnPct: z.number().positive(),
  years: z.number().int().positive(),
});

// ... (similarly for GoalParams, LumpSumParams, StepUpParams, HybridParams, SWPParams)

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

The `inputs` field inside each result schema reuses these same params sub-schemas (not duplicated inline), so `result.inputs` is always a valid `ScenarioParams` — but consumers should validate `ScenarioParams` directly, not extract it from results.
[CITED: zod.dev/api discriminated unions — Zod 4]

### Finding 8: Bisection convergence (Q8)

- Bounds: lo=0, hi=1 doubling until `fv(hi) > targetCorpus`
- Convergence: `hi - lo < 0.01` (0.01 rupee threshold)
- Iterations: 22 for any reasonable target (verified: ₹1 crore at 12%/15yr in 22 iterations)
- Upper bound: never exceeds ~50 iterations for hi values up to ₹1 lakh/month (doubling from 1 to 131072 in 17 steps)
- Output: `Math.ceil((lo+hi)/2)` ensures the monthly amount meets-or-exceeds the target

The bisection can reuse the closed-form SIP formula internally for speed, then call the full loop to generate `yearlySnapshots` for the returned `GoalResult`. Both paths must use the same annuity-due convention.

[VERIFIED: Node.js execution]

### Finding 9: INR formatter spec (Q9)

**Recommended rule (open question resolved here, subject to user confirmation):**

- Below ₹10,00,000 (10 Lakh): Indian-grouped raw format via `toLocaleString('en-IN')` → "₹9,99,999"
- ₹10,00,000 to ₹9,99,99,999: Lakh format → "₹10 Lakh", "₹12.5 Lakh"
- ₹1,00,00,000 and above: Crore format → "₹1 Crore", "₹2.3 Crore"

The threshold of 10 Lakh (not 1 Lakh) avoids the formatting artifact where ₹9,99,999 rounds to "₹10 Lakh" at 2 decimal places.

```typescript
// Verified via Node.js execution (this session)
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

Verified output:
- 0 → ₹0, 50000 → ₹50,000, 999999 → ₹9,99,999
- 1000000 → ₹10 Lakh, 1250000 → ₹12.5 Lakh
- 10000000 → ₹1 Crore, 12345678 → ₹1.23 Crore

[ASSUMED: The 10-Lakh threshold (not 1-Lakh) is a judgment call. User should confirm that "₹9,99,999" (raw) is preferred over "₹10 Lakh" for sub-10L values.]

### Finding 10: turbo.json pipeline (Q10)

Turbo 2.x uses `"tasks"` key (not `"pipeline"` which was Turbo 1.x — a breaking change).

```json
{
  "$schema": "https://turborepo.dev/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "outputs": ["coverage/**"]
    },
    "lint": {
      "outputs": []
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

Note: `test` does NOT depend on `^build` here. `packages/core` tests run against TypeScript source via Vitest's esbuild transform — no build step needed before tests in CI. Remove the build dependency on test unless there is an explicit need to test the compiled dist output.

[CITED: turborepo.dev/repo/docs/reference/configuration]

---

## Recommended Approach

1. Run `pnpm dlx create-turbo@latest`, accept defaults (basic template). Strip `apps/docs` and `packages/ui`.
2. Create `packages/core/src/` from scratch. Do not adapt the scaffolded `packages/ui` — it has React dependencies.
3. Write `packages/core/tsconfig.json` with `"lib": ["ES2022"]` first, before writing any source code. This ensures every type error from DOM usage is caught immediately.
4. Implement `utils.ts` (`monthlyRate`, `formatINR`) and `schema.ts` (`YearlySnapshotSchema`, `ScenarioResultSchema`) before any calculator functions.
5. Implement calculators in dependency order: CALC-01 → CALC-03 → CALC-04 → CALC-05 → CALC-06 → CALC-02 (goal-based last because it calls CALC-01 internally).
6. Write tests alongside each calculator. The CALC-04 invariant test (0% step-up = CALC-01) must be in the first test commit as a regression guard.
7. Cross-validate CALC-01 against Groww manually with ₹10,000/12%/10yr before running the full test suite.
8. Add ESLint config last — it depends on the final structure being stable.

---

## Open Questions (RESOLVED)

1. **SWP drawdown chart — structural tension**
   What we know: CONTEXT.md (D-02) specifies `SWPResult` has `monthsToDepletion: number | "perpetual"` and no `yearlySnapshots`. Phase 3 (ROADMAP) says the SWP chart shows a "drawdown curve," which requires corpus-by-year data.
   What's unclear: Should SWPResult emit `yearlySnapshots` (corpus at end of each year), or does Phase 3 recompute from the SWP inputs?
   Recommendation: Add `yearlySnapshots?: YearlySnapshot[]` to `SWPResultSchema` now. Re-adding it in Phase 3 would require a schema migration. The SWP loop already tracks corpus year-by-year, so the data is free.
   RESOLVED: Add `yearlySnapshots?: YearlySnapshot[]` as optional field to `SWPResult` and `SWPResultSchema` in Phase 1. Plan 01-05 implements this.

2. **INR formatter threshold: 1 Lakh vs 10 Lakh**
   What we know: CONTEXT.md says `₹12.5 Lakh`, `₹2.3 Crore` — no sub-Lakh example given.
   What's unclear: Should ₹9,99,999 display as "₹9,99,999" (raw) or "₹10 Lakh" (rounded)?
   Recommendation: Use 10-Lakh threshold (values below ₹10L display as Indian-grouped raw) to avoid the rounding artifact. Flag for user confirmation.
   RESOLVED: Use 10-Lakh threshold (`TEN_LAKH = 1_000_000`). Values < ₹10L show raw Indian-grouped format; ≥ ₹10L shows "₹X.X Lakh"; ≥ ₹1Cr shows "₹X.XX Crore". Plan 01-03 implements this.

3. **apps/web stub depth for Phase 1**
   What we know: D-01 says create apps/web so Phase 2 can `import from "@sip/core"` on day one.
   What's unclear: Does "stub" mean just `package.json` + bare `next.config.ts`, or a full `pnpm dlx create-next-app@latest` scaffold?
   Recommendation: Run `pnpm dlx create-next-app@latest apps/web` with App Router. The stub should be bootable (`next dev` works) but contain no application pages — just the framework scaffold. This is the cleanest Phase 2 starting point.
   RESOLVED: Manual authoring chosen over `create-next-app` for deterministic version pinning and supply-chain control (D-01 scaffold decision). 4-file minimal stub: `package.json`, `next.config.ts`, `app/layout.tsx`, `app/page.tsx`. Phase 2 builds the application pages on top. Plan 01-01 implements this.

---

## Risks and Landmines

### Risk 1: SIP timing convention mismatch in cross-validation
**What:** If the implementation uses ordinary annuity (end-of-period) but the reference uses annuity due (beginning-of-period), every forward-calculator result will differ by factor `(1+r)` — approximately ₹23,000 on a ₹23 lakh corpus (1% off).
**Prevention:** Verify `calcSIP(10000, 12, 10)` = ₹23,23,391 against Groww before writing any other calculator. This specific value is the canary.

### Risk 2: Step-up monthly increment timing
**What:** Whether `currentMonthly` increments before or after the snapshot determines whether Year 1 shows starting amount or post-increment amount.
**Prevention:** Capture snapshot first (using current monthly), then apply step-up for next year. The invariant test `stepUp(P, 0%) === sip(P)` will catch this if the increment is misapplied.

### Risk 3: `create-turbo@latest` may scaffold with Turbo 1.x `"pipeline"` key
**What:** Some templates are pinned and may produce the old `"pipeline"` syntax in `turbo.json`. Using `"pipeline"` instead of `"tasks"` with Turbo 2.9.9 causes all tasks to be unrecognized.
**Prevention:** After scaffold, verify `turbo.json` uses `"tasks"`. Rewrite to `"tasks"` if needed.

### Risk 4: Rounding intermediate corpus values
**What:** Rounding `corpus` at each step accumulates rounding error. ₹0.50 per step × 120 steps = ₹60 error on a typical corpus.
**Prevention:** Round only at `YearlySnapshot` write time. Keep `corpus` as unrounded float throughout the inner loop.

### Risk 5: `zod` v3 vs v4 in team's mental model
**What:** Zod 4 is stable but many tutorials and AI-suggested code still use Zod 3 patterns (e.g., `z.string().email()` vs `z.email()`). No functional differences for this phase, but new error customization patterns differ.
**Prevention:** Install `zod@latest` (4.4.3). Avoid copying Zod 3 examples for error messages.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.5 |
| Config file | `packages/core/vitest.config.ts` |
| Quick run command | `pnpm --filter @sip/core test` |
| Full suite command | `turbo run test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command |
|--------|----------|-----------|-------------------|
| CALC-01 | Standard SIP corpus matches annuity-due formula | unit | `pnpm --filter @sip/core test -- sip` |
| CALC-01 | Cross-validation: 10k/12%/10yr = ₹23,23,391 | unit | `pnpm --filter @sip/core test -- sip` |
| CALC-01 | 1cr scale test: 15k/15%/15yr = ₹1,01,52,946 (verify against Groww during implementation) | unit | `pnpm --filter @sip/core test -- sip` |
| CALC-02 | Goal-based bisection: target 1cr/12%/15yr → monthly ≤ ₹20,000 | unit | `pnpm --filter @sip/core test -- goalSip` |
| CALC-02 | Bisection uses loop, not closed form (verified by test structure) | unit | n/a — structural check |
| CALC-03 | Lump sum 10L/12%/15yr = ₹59,95,802 | unit | `pnpm --filter @sip/core test -- lumpSum` |
| CALC-04 | Step-up 0% = standard SIP to ±0 rupees | unit | `pnpm --filter @sip/core test -- stepUpSip` |
| CALC-04 | Step-up 10%: final corpus and yearlySnapshots shape correct | unit | `pnpm --filter @sip/core test -- stepUpSip` |
| CALC-05 | Hybrid corpus = SIP corpus + lump sum corpus (superposition) | unit | `pnpm --filter @sip/core test -- hybrid` |
| CALC-06 | SWP perpetual when withdrawal ≤ corpus × monthlyRate | unit | `pnpm --filter @sip/core test -- swp` |
| CALC-06 | SWP depletes in correct months for known input | unit | `pnpm --filter @sip/core test -- swp` |
| All | `ScenarioResultSchema.parse(result)` succeeds for each calculator output | unit | included in each test file |
| All | packages/core has zero DOM imports | lint | `turbo run lint` |

### Sampling Rate
- Per task commit: `pnpm --filter @sip/core test`
- Per wave merge: `turbo run test lint`
- Phase gate: Full suite green + `turbo run lint` passes before verify

### Wave 0 Gaps (tests that don't exist yet — greenfield)
- [ ] `packages/core/tests/sip.test.ts` — covers CALC-01
- [ ] `packages/core/tests/goalSip.test.ts` — covers CALC-02
- [ ] `packages/core/tests/lumpSum.test.ts` — covers CALC-03
- [ ] `packages/core/tests/stepUpSip.test.ts` — covers CALC-04
- [ ] `packages/core/tests/hybrid.test.ts` — covers CALC-05
- [ ] `packages/core/tests/swp.test.ts` — covers CALC-06
- [ ] `packages/core/vitest.config.ts` — test runner config

---

## Environment Availability

This phase is a greenfield monorepo scaffold. No pre-existing services or external tools required — only a working Node.js + pnpm environment.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All | ✓ | v20.11.1 | — |
| pnpm | Monorepo scaffold | needs check | — | `npm install -g pnpm` |
| turbo | Task running | installed via pnpm devDep | — | — |

Note: `pnpm` version should be confirmed before scaffold. The `create-turbo` template pins `"packageManager": "pnpm@X.X.X"` in the generated root `package.json` — this must match the installed pnpm version or Corepack will error.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | ET Money uses the same annuity-due convention as Groww | Finding 6 (decimal.js) | Cross-validation will fail for ET Money; use Groww as the reference instead |
| A2 | `create-turbo@latest` default template uses Next.js 15 for apps/web | Finding 1 | May need to upgrade Next.js version after scaffold |
| A3 | formatINR should use 10-Lakh threshold (not 1-Lakh) for switching to Lakh display | Finding 9, Open Question 2 | Sub-10L values show raw Indian grouping instead of Lakh notation — user may prefer Lakh at 1L threshold |

---

## Sources

### Primary (HIGH confidence)
- Node.js execution (this session) — all formula results, float precision analysis, bisection convergence
- [zod.dev/api](https://zod.dev/api) — `z.discriminatedUnion` Zod 4 syntax
- [turborepo.dev/repo/docs/reference/configuration](https://turborepo.dev/repo/docs/reference/configuration) — `"tasks"` key in turbo.json Turbo 2.x
- [vitest.dev/guide/projects](https://vitest.dev/guide/projects) — Vitest 4.1.5 per-package config
- [eslint.org/docs/latest/rules/no-restricted-imports](https://eslint.org/docs/latest/rules/no-restricted-imports) — ESLint flat config syntax
- [eslint.org/docs/latest/rules/no-restricted-globals](https://eslint.org/docs/latest/rules/no-restricted-globals) — ESLint globals restriction
- npm registry (`npm view`) — package versions confirmed 2026-05-06

### Secondary (MEDIUM confidence)
- [groww.in/calculators/sip-calculator](https://groww.in/calculators/sip-calculator) — annuity-due formula `M × ({[1+i]^n – 1} / i) × (1+i)` confirmed
- [turborepo.dev/docs/guides/tools/vitest](https://turborepo.dev/docs/guides/tools/vitest) — per-package vs projects approach tradeoffs
- [turborepo.dev/docs/guides/frameworks/nextjs](https://turborepo.dev/docs/guides/frameworks/nextjs) — Next.js in Turborepo

### Tertiary (LOW confidence / ASSUMED)
- create-turbo default template file structure — based on official docs description + community sources; exact post-scaffold file tree must be verified by running the command

---

## Metadata

**Confidence breakdown:**
- SIP math formulas: HIGH — verified via Node.js execution
- Float precision: HIGH — computed analytically
- Bisection convergence: HIGH — measured (22 iterations)
- Turborepo 2.x `"tasks"` syntax: HIGH — cited from official docs
- Zod 4 discriminated union: HIGH — cited from zod.dev
- create-turbo scaffold structure: MEDIUM — inferred from docs + community sources; exact output must be verified at run time
- ESLint flat config: HIGH — cited from eslint.org

**Research date:** 2026-05-06
**Valid until:** 2026-08-06 (stable ecosystem; check zod and vitest changelogs if past this date)
