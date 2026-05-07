# Project State — SIP Calculator

## Status
Phase: Executing — Phase 1 in progress (Wave 1 complete)
Current phase: 1 — Calculation Engine
Last updated: 2026-05-07

## Project Reference
See: .planning/PROJECT.md (updated 2026-05-06)
**Core value:** A retail investor can enter their monthly amount, rate of return, and duration and instantly see their projected corpus with a clear breakdown of invested vs. gains — no sign-up required to try it.
**Current focus:** Phase 1 executing — Wave 1 complete (2/6 plans), Wave 2 next

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | Calculation Engine | In progress — 2/6 plans complete |
| 2 | Calculator UI | Pending |
| 3 | Visualizations | Pending |
| 4 | Comparison and Sharing | Pending |
| 5 | Authentication | Pending |
| 6 | Saved Scenarios | Pending |

## Performance Metrics

- Requirements coverage: 24/24 (100%)
- Phases defined: 6
- Plans written: 6 (Phase 1)

## Accumulated Context

### Decisions
- Turborepo monorepo: apps/web (Next.js 15) + packages/core (pure TypeScript)
- packages/core has zero DOM/browser/React dependencies — enforced at build time
- Backend: Next.js App Router route handlers only (no Express)
- Database: Drizzle ORM + Neon (serverless Postgres)
- Auth: Better Auth (Lucia deprecated 2025)
- Charts: Recharts — apps/web only
- Session: httpOnly cookies, sameSite: lax — no JWT in localStorage
- Scenario comparison: ephemeral (client-side only) in v1
- decimal.js: resolve empirically in Phase 1 (cross-validate vs ET Money/Groww ±₹1 on ₹1 crore)
- ScenarioParams normalized schema: lock in Phase 1 before any UI work
- schema_version field: required on scenarios table from day one (Phase 6)

### Open Questions
- decimal.js adoption — resolve in Phase 1 cross-validation

### Blockers
None

## Session Continuity

Last action: Wave 1 complete (2026-05-07) — 01-01 (monorepo scaffold) and 01-02 (@sip/core skeleton) merged. pnpm install successful with Node.js 24.15.0.
Resume files: .planning/phases/01-calculation-engine/01-03-PLAN.md (Wave 2 next)
Next action: /gsd-execute-phase 1 (will resume from Wave 2)
