# Project State — SIP Calculator

## Status
Phase: Planning complete — Phase 1 ready to execute
Current phase: 1 — Calculation Engine
Last updated: 2026-05-06

## Project Reference
See: .planning/PROJECT.md (updated 2026-05-06)
**Core value:** A retail investor can enter their monthly amount, rate of return, and duration and instantly see their projected corpus with a clear breakdown of invested vs. gains — no sign-up required to try it.
**Current focus:** Phase 1 planned — 6 plans in 5 waves, ready to execute

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | Calculation Engine | Ready to execute (6 plans) |
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

Last action: Phase 1 planned — 6 PLAN.md files written, verified (2026-05-06). Resolved OQ-1 (SWP yearlySnapshots), OQ-2 (formatINR 10-Lakh threshold), OQ-3 (manual apps/web stub over create-next-app).
Resume files: .planning/phases/01-calculation-engine/01-01-PLAN.md through 01-06-PLAN.md
Next action: /clear then /gsd-execute-phase 1
