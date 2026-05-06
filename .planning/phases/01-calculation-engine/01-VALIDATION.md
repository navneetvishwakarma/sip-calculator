---
phase: 1
slug: calculation-engine
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-06
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.5 |
| **Config file** | `packages/core/vitest.config.ts` (Wave 0 creates) |
| **Quick run command** | `pnpm --filter @sip/core test` |
| **Full suite command** | `turbo run test lint` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter @sip/core test`
- **After every plan wave:** Run `turbo run test lint`
- **Before `/gsd-verify-work`:** Full suite must be green + `turbo run lint` passes
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 1-??-01 | scaffold | 1 | CALC-01..06 | — | N/A | lint | `turbo run lint` | ❌ W0 | ⬜ pending |
| 1-??-02 | types | 1 | CALC-01..06 | — | N/A | unit | `pnpm --filter @sip/core test` | ❌ W0 | ⬜ pending |
| 1-??-03 | CALC-01 | 1 | CALC-01 | — | N/A | unit | `pnpm --filter @sip/core test -- sip` | ❌ W0 | ⬜ pending |
| 1-??-04 | CALC-02 | 1 | CALC-02 | — | N/A | unit | `pnpm --filter @sip/core test -- goalSip` | ❌ W0 | ⬜ pending |
| 1-??-05 | CALC-03 | 1 | CALC-03 | — | N/A | unit | `pnpm --filter @sip/core test -- lumpSum` | ❌ W0 | ⬜ pending |
| 1-??-06 | CALC-04 | 1 | CALC-04 | — | N/A | unit | `pnpm --filter @sip/core test -- stepUpSip` | ❌ W0 | ⬜ pending |
| 1-??-07 | CALC-05 | 1 | CALC-05 | — | N/A | unit | `pnpm --filter @sip/core test -- hybrid` | ❌ W0 | ⬜ pending |
| 1-??-08 | CALC-06 | 1 | CALC-06 | — | N/A | unit | `pnpm --filter @sip/core test -- swp` | ❌ W0 | ⬜ pending |
| 1-??-09 | schema | 1 | CALC-01..06 | — | N/A | unit | `pnpm --filter @sip/core test` | ❌ W0 | ⬜ pending |

*Task IDs will be finalized after PLAN.md is written. Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

All files are greenfield — no test infrastructure exists yet.

- [ ] `packages/core/vitest.config.ts` — Vitest config for the package
- [ ] `packages/core/tests/sip.test.ts` — stubs for CALC-01 (standard SIP)
- [ ] `packages/core/tests/goalSip.test.ts` — stubs for CALC-02 (goal-based bisection)
- [ ] `packages/core/tests/lumpSum.test.ts` — stubs for CALC-03 (lump sum)
- [ ] `packages/core/tests/stepUpSip.test.ts` — stubs for CALC-04 (step-up SIP)
- [ ] `packages/core/tests/hybrid.test.ts` — stubs for CALC-05 (hybrid)
- [ ] `packages/core/tests/swp.test.ts` — stubs for CALC-06 (SWP)

*All test files are Wave 0 dependencies — plan must create stubs before implementing calculator functions.*

---

## Cross-Validation Tests (CALC-01 Reference Values)

From RESEARCH.md Finding 6 — verified against Groww formula (annuity-due, monthly compounding):

| Input | Expected Output | Tolerance |
|-------|----------------|-----------|
| ₹10,000/month, 12%/yr, 10 years | corpus ≈ ₹23,23,391 | ±₹1 |
| ₹15,000/month, 15%/yr, 15 years | corpus ≈ ₹1,01,52,946 | ±₹1 on ₹1cr scale |

Step-up invariant (CALC-04): step-up SIP with 0% step-up rate must equal standard SIP result to ₹0.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `pnpm create turbo@latest` scaffold runs without errors | D-01 | Interactive CLI; cannot automate | Run `pnpm dlx create-turbo@latest sip-calculator` in parent dir; verify file tree |
| INR formatter output for edge cases | D-08 | Visual inspection for sub-lakh formatting | Call `formatINR(999999)`, `formatINR(1000000)`, `formatINR(100000000)` and verify strings |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
