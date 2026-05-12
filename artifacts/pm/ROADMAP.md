# Product Roadmap — SIP Calculator

**Date:** 2026-05-06
**Status:** Complete — translated from `.planning/ROADMAP.md`

---

## Overview

6 phases | 24 requirements | Turborepo monorepo (`packages/core` + `apps/web`), pure calc engine first, UI second, persistence last.

---

## Phase Summary

| # | Phase | Goal | REQ-IDs | Status |
|---|-------|------|---------|--------|
| 1 | Calculation Engine | All calculator math correct, tested, shareable across platforms | CALC-01–06 | Planned |
| 2 | Calculator UI | Every calculator interactive, formatted for Indian users, fully usable on mobile | VIZ-03, UX-01–05 | Not started |
| 3 | Visualizations | Users see results as charts and can toggle inflation-adjusted values | VIZ-01, VIZ-02, VIZ-04 | Not started |
| 4 | Comparison and Sharing | Users compare scenarios side by side and share calculations via URL | COMP-01, SHARE-01 | Not started |
| 5 | Authentication | Users create accounts and maintain sessions | AUTH-01–03 | Not started |
| 6 | Saved Scenarios | Logged-in users persist and manage named calculator snapshots | SAVE-01–04 | Not started |

---

## Phase 1: Calculation Engine

**Goal:** The `packages/core` module contains all six calculator types, fully tested, with zero DOM/browser/React dependencies and a locked normalized output schema.

**Success Criteria:**
1. Any calculator function importable from `packages/core` in a Node.js script (no browser); result cross-validated against ET Money or Groww to ±₹1 on ₹1 crore corpus.
2. Step-up SIP with 0% step-up produces the same result as standard SIP (automated unit test passes).
3. Goal-based reverse calculation (CALC-02) and goal-based with step-up use bisection search, not a missing closed form.
4. All six calculator functions emit output conforming to the `ScenarioResult` discriminated union; a zod schema validates and is exported from `packages/core`.
5. `packages/core` has no `window`, `document`, `React`, or Next.js imports — enforced by build-time lint rule.

**Build waves:**
- Wave 1 (parallel): Monorepo root config + `apps/web` minimal stub; `packages/core` skeleton
- Wave 2: Shared primitives — `monthlyRate()`, `formatINR()`, zod discriminated union schema
- Wave 3: CALC-01 (standard SIP), CALC-03 (lump sum), CALC-04 (step-up SIP) with tests
- Wave 4: CALC-05 (hybrid), CALC-06 (SWP), CALC-02 (goal-based bisection) with tests
- Wave 5: Barrel export (index.ts) + ESLint zero-DOM enforcement + full test suite gate

**Notes:**
- Resolve `decimal.js` question empirically here. Adopt only if closed-form SIP output fails ±₹1 tolerance.
- Lock `ScenarioParams` before Phase 2 — comparison (Phase 4) and save/load (Phase 6) both depend on it.
- `monthlyRate(annualPct)` is the single rate conversion point; no inline `/ 12 / 100` anywhere.

---

## Phase 2: Calculator UI (Minimum Shippable Product)

**Goal:** Every calculator has a working form in `apps/web`, pre-populated with Indian defaults, fully responsive, correct INR formatting, and required legal copy.

**Success Criteria:**
1. User on 375px mobile can enter inputs into any calculator form and read results without horizontal scrolling.
2. All currency values display as `₹X.X Lakh` or `₹X.X Crore` — raw digit grouping not present anywhere.
3. Every calculator form loads pre-populated with Indian defaults (12% return, 6% inflation, 10-year duration, ₹5,000/month).
4. Goal-based calculator shows a visible warning when required monthly SIP exceeds ₹10 lakh/month.
5. SEBI disclaimer appears in footer on every page.

**Notes:**
- This is the minimum shippable product — fully interactive with zero backend.
- Auth state mocked as logged-out. "Save" button present but gated.
- VIZ-03 (year-by-year table) maps here — it's a UI component, not a chart.

---

## Phase 3: Visualizations

**Goal:** Calculator results accompanied by a growth-over-time chart, invested-vs-returns breakdown, and inflation-adjusted toggle.

**Success Criteria:**
1. After submitting any forward calculator, user sees a line chart plotting corpus year by year.
2. User sees a donut or stacked bar chart showing total invested vs. total gains.
3. User can toggle "Show inflation-adjusted values" with a configurable inflation rate; all corpus figures update.
4. Charts render correctly on mobile (no overflow, axes readable, touch interaction works).

**Notes:**
- Recharts lives only in `apps/web`. Hard boundary.
- SWP output is drawdown duration, not growing corpus — line chart shows drawdown curve, not growth curve.

---

## Phase 4: Comparison and Sharing

**Goal:** Users evaluate multiple scenarios side by side and share/bookmark any calculation state via URL.

**Success Criteria:**
1. User can add up to 4 scenarios to a comparison view and see all in a single table or chart — without logging in.
2. Removing a scenario updates the UI immediately; state does not persist on refresh (client-side only).
3. After filling any calculator form, the URL updates to reflect all current inputs; loading that URL restores exact inputs.
4. User can copy URL, open in private window, and land on a working calculator with all inputs pre-filled.

**Notes:**
- SHARE-01 relies on `ScenarioParams` being serializable — guaranteed by zod schema locked in Phase 1.
- Use URL query params, not hash fragments.

---

## Phase 5: Authentication

**Goal:** Users create accounts, log in with persistent sessions, and log out from any page.

**Success Criteria:**
1. User can register with email and password; duplicate email shows clear error.
2. Logged-in user can close browser, return next day, and remain logged in (session via httpOnly cookie).
3. User can click "Log out" from any page and be immediately signed out.
4. Public calculator fully functional for users who have never created an account.

**Notes:**
- Better Auth only — Lucia deprecated 2025. Do not use Lucia tutorials.
- Sessions: httpOnly cookies, `sameSite: lax`.
- No calculation logic in route handlers.

---

## Phase 6: Saved Scenarios

**Goal:** Logged-in users save, browse, reload, and delete named calculator snapshots that persist across sessions.

**Success Criteria:**
1. Logged-in user can save any result with a custom name; scenario appears immediately in saved list.
2. Logged-in user can view list of all saved scenarios with name, calculator type, and key result values.
3. Logged-in user can click a saved scenario and have all original inputs restored into the calculator form.
4. Logged-in user can delete a saved scenario; it disappears immediately and does not reappear on refresh.

**Notes:**
- `schema_version` field mandatory on `scenarios` table from day one.
- Scenarios table stores serialized `ScenarioParams` (locked in Phase 1).
- Logged-out users see Save button but get redirected to sign-in — not a 401 with no feedback.
