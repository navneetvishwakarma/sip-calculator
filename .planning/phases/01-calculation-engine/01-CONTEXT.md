# Phase 1: Calculation Engine - Context

**Gathered:** 2026-05-06
**Status:** Ready for planning

<domain>
## Phase Boundary

`packages/core` — a pure TypeScript package with zero DOM/browser/React dependencies containing all six calculator types, a locked `ScenarioResult` discriminated union with zod validation, and a full Turborepo monorepo skeleton that Phase 2 can immediately import from.

What this phase does NOT include: any UI, any Next.js route handlers, Recharts, or database setup.

</domain>

<decisions>
## Implementation Decisions

### Monorepo Scaffold (D-01)
- Phase 1 sets up the **full Turborepo skeleton**: `packages/core` + an `apps/web` stub (Next.js 15 App Router project, no pages/components yet). Phase 2 needs `import from "@sip/core"` on day one — scaffolding apps/web now eliminates setup overhead in Phase 2.
- Bootstrap via `pnpm create turbo@latest`, then strip the example app and customize. Package manager: **pnpm** (standard for Turborepo).
- `packages/core` package name: `@sip/core`.

### ScenarioResult Output Shape (D-02)
- Use a **discriminated union** keyed on `type`:

```ts
type ScenarioResult =
  | SIPResult        // CALC-01
  | GoalResult       // CALC-02
  | LumpSumResult    // CALC-03
  | StepUpResult     // CALC-04
  | HybridResult     // CALC-05
  | SWPResult        // CALC-06
```

- All forward-calculator results (`SIPResult`…`HybridResult`) share a common base shape:
  - `type` — string literal discriminant
  - `inputs` — raw inputs used (for round-trip restore in Phase 6)
  - `summary` — `{ totalInvested, totalGains, finalCorpus }`
  - `yearlySnapshots` — `YearlySnapshot[]` (see D-03)
- `SWPResult` differs: `monthsToDepletion: number | "perpetual"` replaces `finalCorpus`/`yearlySnapshots`. Inputs: corpus, monthlyWithdrawal, annualReturnPct.
- The entire union is validated by a **zod schema** exported from `packages/core` as `ScenarioResultSchema`.
- `ScenarioParams` (the serializable input type used for URL encoding in Phase 4 and DB storage in Phase 6) is a separate type containing only inputs — exported alongside the result types.

### Year-by-Year Output Granularity (D-03)
- Engine returns **annual snapshots only** — monthly resolution is 12x more data with no benefit (Phase 2 table is year-by-year; Phase 3 chart plots year-by-year).
- Each snapshot shape:

```ts
interface YearlySnapshot {
  year: number              // 1-indexed (year 1 = end of first year)
  monthlyInvestment: number // may vary year-over-year for step-up SIP
  totalInvested: number     // cumulative invested to this year
  interestEarned: number    // cumulative gains to this year
  corpusValue: number       // total corpus at end of this year
}
```

### Test Runner (D-04)
- **Vitest** for `packages/core`. Native to the Vite/ESM ecosystem, fast cold start, first-class TypeScript, works cleanly with pnpm workspaces. No Jest.
- Required test coverage: all 6 calculator functions with at least one cross-validation test each (ET Money/Groww parity ±₹1 on ₹1 crore corpus per ROADMAP success criterion 1).
- Specific invariant test: step-up SIP with 0% step-up must equal standard SIP result (ROADMAP success criterion 2).

### Decimal.js Adoption (D-05 — pre-decided, carried from STATE.md)
- Resolve empirically: cross-validate closed-form output against ET Money/Groww on ₹1 crore corpus. Adopt `decimal.js` only if native JS floats exceed ±₹1 tolerance. Do not pre-adopt.

### Zero-DOM Enforcement (D-06 — pre-decided, carried from ROADMAP.md)
- Enforce via ESLint rule or bundler check (e.g., import analysis in the build step). No `window`, `document`, `React`, or Next.js imports allowed in `packages/core`. This is a build-time gate, not just convention.

### monthlyRate Utility (D-07 — pre-decided, carried from ROADMAP.md)
- `monthlyRate(annualPct: number): number` is the single conversion point for `annualPct / 12 / 100`. No inline conversion anywhere else in `packages/core`.

### INR Formatter (D-08 — carried from ROADMAP Phase 1 notes)
- Build `formatINR(value: number): string` in `packages/core` (produces `₹12.5 Lakh`, `₹2.3 Crore`). UX-01 maps to Phase 2 for the observable requirement, but the formatter lives here so apps/web and future RN share it.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements and Success Criteria
- `.planning/ROADMAP.md` §Phase 1 — goal, 5 success criteria, and implementation notes (decimal.js cross-validation, monthlyRate convention, ScenarioParams lock, SWP output spec)
- `.planning/REQUIREMENTS.md` §Calculators — CALC-01 through CALC-06 full requirement statements

### Project Constraints
- `.planning/PROJECT.md` §Constraints — zero-DOM rule, monorepo rationale, RN mobile v2 dependency on packages/core
- `.planning/PROJECT.md` §Key Decisions — Turborepo decision, packages/core decision, Better Auth decision (not relevant to Phase 1 but establishes patterns)

### State
- `.planning/STATE.md` — accumulated decisions and open questions from initialization session

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield. No source code exists yet.

### Established Patterns
- None yet. Phase 1 establishes the patterns (TypeScript config, ESLint rules, test conventions) that all subsequent phases inherit.

### Integration Points
- `packages/core` → `apps/web`: Phase 2 imports calculator functions and `ScenarioResultSchema` via the `@sip/core` package reference in `apps/web/package.json`.
- `ScenarioParams` type → Phase 4 URL encoding, Phase 6 DB serialization. Must be JSON-serializable (no Dates, no circular refs, no class instances).

</code_context>

<specifics>
## Specific Requirements

- Cross-validate against ET Money (https://etmoney.com/sip-calculator) or Groww (https://groww.in/calculators/sip-calculator). Tolerance: ±₹1 on a ₹1 crore corpus.
- Goal-based reverse calculation (CALC-02) and goal-based step-up: use **bisection search**, not a closed form (ROADMAP success criterion 3 explicitly requires this).
- `ScenarioResultSchema` (zod) must be exported — this is what Phase 4 and Phase 6 use for serialization validation.
- SWP perpetual condition: when annualized return rate implies monthly growth ≥ monthly withdrawal, output `"perpetual"` not a number.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 1-Calculation Engine*
*Context gathered: 2026-05-06*
