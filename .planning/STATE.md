# Project State — SIP Calculator

## Status
Phase: Not started
Current phase: —
Last updated: 2026-05-06

## Project Reference
See: .planning/PROJECT.md (updated 2026-05-06)
**Core value:** A retail investor can enter their monthly amount, rate of return, and duration and instantly see their projected corpus with a clear breakdown of invested vs. gains — no sign-up required to try it.
**Current focus:** Roadmap created, ready for Phase 1

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | Calculation Engine | Pending |
| 2 | Calculator UI | Pending |
| 3 | Visualizations | Pending |
| 4 | Comparison and Sharing | Pending |
| 5 | Authentication | Pending |
| 6 | Saved Scenarios | Pending |

## Performance Metrics

- Requirements coverage: 24/24 (100%)
- Phases defined: 6
- Plans written: 0

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

Last action: Roadmap and state files written.
Next action: Run /gsd-plan-phase 1 to break Phase 1 into executable plans.
