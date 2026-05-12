# Product Requirements Document — SIP Calculator

**Date:** 2026-05-06
**Status:** Complete — translated from `.planning/PROJECT.md`, `REQUIREMENTS.md`, `ROADMAP.md`, and research artifacts
**Version:** 1.0

---

## Product Overview

A web app for Indian retail investors to plan and visualize Systematic Investment Plans. Users can calculate future corpus from a monthly SIP, work backward from a target amount to find the required investment, compare multiple scenarios, and track lump sum and step-up SIP alongside standard SIP — all with interactive charts and saved scenarios tied to a user account.

**Core value:** A retail investor can enter their monthly amount, rate of return, and duration and instantly see their projected corpus with a clear breakdown of invested vs. gains — no sign-up required to try it.

---

## Goals

1. Deliver all 6 calculator types (standard SIP, goal-based, lump sum, step-up, hybrid, SWP) in a single tool — no competitor does all six
2. Ship a minimum viable calculator (Phase 2) before adding backend infrastructure
3. Enable account creation and scenario persistence for users who want to save their work
4. Support React Native v2 from day one via `packages/core` architecture

---

## Non-Goals (v1)

- PDF export (v2)
- React Native mobile app (v2 — architecture supports it)
- Live NAV / mutual fund data feed
- Fund-specific recommendations (SEBI RIA registration required)
- Social features, public portfolios, comparison set persistence
- Admin dashboard, KYC, WhatsApp/social share buttons

---

## Requirements

### Phase 1: Calculation Engine

| ID | Requirement | Priority |
|----|-------------|----------|
| CALC-01 | User can calculate standard SIP: monthly amount + rate + duration → projected corpus + total invested | P0 |
| CALC-02 | User can calculate goal-based SIP: target corpus + rate + duration → required monthly investment | P0 |
| CALC-03 | User can calculate lump sum growth: one-time investment + rate + duration → projected corpus | P0 |
| CALC-04 | User can calculate step-up SIP: starting monthly + annual step-up % + rate + duration → projected corpus | P0 |
| CALC-05 | User can calculate SIP + lump sum hybrid: one-time amount today + monthly SIP → combined projected corpus | P0 |
| CALC-06 | User can calculate SWP: corpus + monthly withdrawal + return rate → duration until depletion (or "perpetual") | P0 |

### Phase 2: Calculator UI

| ID | Requirement | Priority |
|----|-------------|----------|
| VIZ-03 | User sees year-by-year breakdown table: year, monthly investment, total invested to date, interest earned, corpus value | P0 |
| UX-01 | All currency values display in Indian lakh/crore word format ("₹12.5 Lakh", "₹2.3 Crore") — not raw digit grouping | P0 |
| UX-02 | All calculator forms pre-populated with Indian defaults: 12% annual return, 6% inflation, 10-year duration, ₹5,000/month | P0 |
| UX-03 | App is mobile-first; fully usable on 375px screens without horizontal scrolling | P0 |
| UX-04 | Goal-based calculator shows a feasibility warning when required monthly SIP exceeds ₹10 lakh/month | P1 |
| UX-05 | SEBI disclaimer present in footer on all pages: "Returns are illustrative and not guaranteed. Consult a SEBI-registered investment advisor." | P0 |

### Phase 3: Visualizations

| ID | Requirement | Priority |
|----|-------------|----------|
| VIZ-01 | User sees growth-over-time line chart showing corpus value year by year | P0 |
| VIZ-02 | User sees invested-vs-returns donut or stacked chart showing total invested vs total gains | P0 |
| VIZ-04 | User can toggle inflation-adjusted (real) values alongside nominal corpus, with a configurable inflation rate input | P1 |

### Phase 4: Comparison and Sharing

| ID | Requirement | Priority |
|----|-------------|----------|
| COMP-01 | User can compare 2–4 calculator scenarios side by side in a single view (client-side only, not persisted) | P0 |
| SHARE-01 | Calculator state (all inputs) encoded into URL so any calculation can be bookmarked or shared via link | P0 |

### Phase 5: Authentication

| ID | Requirement | Priority |
|----|-------------|----------|
| AUTH-01 | User can create an account with email and password | P0 |
| AUTH-02 | User can log in and stay logged in across sessions (httpOnly cookie, sameSite:lax) | P0 |
| AUTH-03 | User can log out from any page | P0 |

### Phase 6: Saved Scenarios

| ID | Requirement | Priority |
|----|-------------|----------|
| SAVE-01 | Logged-in user can save a named snapshot of any calculator result | P0 |
| SAVE-02 | Logged-in user can view a list of their saved scenarios | P0 |
| SAVE-03 | Logged-in user can load a saved scenario (restores all inputs) | P0 |
| SAVE-04 | Logged-in user can delete a saved scenario | P0 |

---

## Technical Constraints

| Constraint | Rationale |
|------------|-----------|
| `packages/core` has zero DOM/browser/React imports | Required for React Native v2 sharing; enforced by tsconfig `lib: ["ES2022"]` + ESLint `no-restricted-imports` |
| `monthlyRate(annualPct)` is the single rate conversion point | No inline `/ 12 / 100` anywhere; prevents silent rate unit bugs |
| Tailwind v4 CSS-first config — no `tailwind.config.js` | v4 breaking change; most tutorials cover v3 |
| Better Auth only — Lucia deprecated 2025 | Lucia officially deprecated; do not use it or any tutorial referencing it |
| Sessions: httpOnly cookies, sameSite:lax | localStorage is XSS vector; httpOnly cookies are not |
| `schema_version` field required on scenarios table from day one | Enables per-row migration if calculator inputs change; omitting it makes old saved scenarios break silently |
| Public calculator must work without login | Core value gated by sign-up = zero trial conversion |
| No calculation logic in route handlers | Hard boundary; backend is auth + CRUD only |

---

## Architecture Summary

**Monorepo:** Turborepo with `apps/web` (Next.js 15 App Router) and `packages/core` (pure TypeScript, zero DOM)

**Calculation:** Client-side only. Pure functions in `packages/core` — no network dependency, directly testable.

**Backend:** Next.js route handlers for auth (`/api/auth/*`) and scenarios CRUD (`/api/scenarios/*`). No Express server.

**Database:** Neon (serverless Postgres) via Drizzle ORM. Two tables: `users` and `scenarios` (with `schema_version` field).

**Charts:** Recharts in `apps/web` only. Never in `packages/core`.

**Auth:** Better Auth. Sessions via httpOnly cookies.

---

## Success Criteria by Phase

See `artifacts/pm/ROADMAP.md` for full success criteria per phase.

**Phase 1 done when:** All six calculators importable from `packages/core` in a Node.js script with correct results (±₹1 on ₹1 crore corpus cross-validated against ET Money or Groww); zero DOM/browser imports enforced.

**Phase 2 done when (minimum shippable product):** Every calculator interactive on mobile; all results in INR lakh/crore format; Indian defaults pre-populated; SEBI disclaimer in footer.

---

## Open Questions

1. `decimal.js` or not? Cross-validate in Phase 1. Adopt only if closed-form SIP output fails ±₹1 tolerance.
2. Goal templates (named presets: "Child's college", "Retirement") — quick win for Phase 2 UX; not formally in scope but low effort.
