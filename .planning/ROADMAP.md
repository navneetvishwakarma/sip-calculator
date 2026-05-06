# Roadmap — SIP Calculator

## Overview

6 phases | 24 requirements | Turborepo monorepo (packages/core + apps/web), pure calc engine first, UI second, persistence last.

## Phase Summary

| # | Phase | Goal | REQ-IDs | Success Criteria |
|---|-------|------|---------|-----------------|
| 1 | Calculation Engine | All calculator math is correct, tested, and shareable across platforms | CALC-01, CALC-02, CALC-03, CALC-04, CALC-05, CALC-06 | 5 criteria |
| 2 | Calculator UI | Every calculator is interactive, formatted for Indian users, and fully usable on mobile | VIZ-03, UX-01, UX-02, UX-03, UX-04, UX-05 | 5 criteria |
| 3 | Visualizations | Users can see their results as charts and toggle inflation-adjusted values | VIZ-01, VIZ-02, VIZ-04 | 4 criteria |
| 4 | Comparison and Sharing | Users can compare scenarios and share any calculation via URL | COMP-01, SHARE-01 | 4 criteria |
| 5 | Authentication | Users can create accounts and maintain sessions | AUTH-01, AUTH-02, AUTH-03 | 4 criteria |
| 6 | Saved Scenarios | Logged-in users can persist and manage named scenarios | SAVE-01, SAVE-02, SAVE-03, SAVE-04 | 4 criteria |

## Phase Details

### Phase 1: Calculation Engine
**Goal:** The `packages/core` module contains all six calculator types, fully tested, with zero DOM/browser/React dependencies and a locked normalized output schema.
**Requirements:** CALC-01, CALC-02, CALC-03, CALC-04, CALC-05, CALC-06
**UI hint:** no

**Success Criteria:**
1. A developer can import any calculator function from `packages/core` in a Node.js script (no browser) and get the correct result — cross-validated against ET Money or Groww to ±₹1 on a ₹1 crore corpus.
2. Step-up SIP with 0% step-up produces the same result as standard SIP (automated unit test passes).
3. Goal-based reverse calculation (CALC-02) and goal-based with step-up use bisection search, not a missing closed form.
4. All six calculator functions emit output conforming to the same `ScenarioParams` normalized TypeScript type; a `zod` schema validates the shape and is exported from `packages/core`.
5. `packages/core` has no `window`, `document`, `React`, or Next.js imports — enforced by a build-time lint rule or bundler check.

**Notes:**
- Resolve the `decimal.js` question here: cross-validate closed-form SIP output; adopt `decimal.js` only if tolerance exceeds ±₹1 on ₹1 crore. Do not pre-decide.
- The `monthlyRate(annualPct)` utility must be the single conversion point; no inline `/ 12 / 100` anywhere else.
- Lock `ScenarioParams` before Phase 2 starts — comparison (Phase 4) and save/load (Phase 6) both depend on it. Changing it later cascades across the entire app.
- SWP (CALC-06): inputs are corpus, monthly withdrawal, return rate; output is months until depletion (or "perpetual" if return rate implies withdrawal is covered by growth indefinitely).
- INR formatting utility (`₹12.5 Lakh`, `₹2.3 Crore`) is built here in `packages/core` — UX-01 maps to Phase 2 because the observable requirement is in the UI, but the formatter lives here.

**Plans:** 6 plans in 5 waves

**Wave 1** (parallel — no dependencies):
- [ ] 01-01-PLAN.md — Monorepo root config + apps/web minimal stub
- [ ] 01-02-PLAN.md — packages/core skeleton (package.json, tsconfig, vitest, tsup)

**Wave 2** *(blocked on Wave 1 completion)*:
- [ ] 01-03-PLAN.md — Shared primitives: utils.ts (monthlyRate, formatINR) + schema.ts (zod discriminated union)

**Wave 3** *(blocked on Wave 2 completion)*:
- [ ] 01-04-PLAN.md — CALC-01 standard SIP, CALC-03 lump sum, CALC-04 step-up SIP (with tests)

**Wave 4** *(blocked on Wave 3 completion)*:
- [ ] 01-05-PLAN.md — CALC-05 hybrid, CALC-06 SWP, CALC-02 goal-based bisection (with tests)

**Wave 5** *(blocked on Wave 4 completion)*:
- [ ] 01-06-PLAN.md — Barrel export (index.ts) + ESLint zero-DOM enforcement + full suite gate

**Cross-cutting constraints:**
- `monthlyRate(annualPct)` is the single rate conversion point — no inline `/ 12 / 100` in any calculator file
- All calculator functions emit `ScenarioResult` discriminated union validated by `ScenarioResultSchema`
- Zero-DOM enforcement is two-layer: `tsconfig.json lib: ["ES2022"]` + ESLint `no-restricted-imports`

---

### Phase 2: Calculator UI
**Goal:** Every calculator has a working form in `apps/web`, pre-populated with Indian defaults, fully responsive, and rendered with correct INR formatting and required legal copy.
**Requirements:** VIZ-03, UX-01, UX-02, UX-03, UX-04, UX-05
**UI hint:** yes

**Success Criteria:**
1. A user on a 375px-wide mobile screen can enter inputs into any calculator form, submit, and read results without horizontal scrolling or broken layout.
2. All currency values in results display as `₹X.X Lakh` or `₹X.X Crore` — raw digit grouping (e.g., `₹12,50,000`) is not present anywhere.
3. Every calculator form loads pre-populated with Indian-market defaults (12% annual return, 6% inflation, 10-year duration, ₹5,000/month starting SIP).
4. The goal-based calculator (CALC-02) shows a visible warning when the required monthly SIP exceeds ₹10 lakh/month.
5. The SEBI disclaimer ("Returns are illustrative and not guaranteed. Consult a SEBI-registered investment advisor.") appears in the footer on every page.

**Notes:**
- VIZ-03 (year-by-year breakdown table) maps here because a table is a UI component, not a chart — no Recharts dependency required, and it reinforces the form → result flow.
- Auth state is mocked as logged-out in this phase. The "Save" button can be present but must be visually gated (tooltip: "Sign in to save").
- This phase is the minimum shippable product — a fully interactive calculator with no backend.
- Confirm Tailwind v4 CSS-first config at setup time; most tutorials cover v3. There is no `tailwind.config.js` in v4.

---

### Phase 3: Visualizations
**Goal:** Calculator results are accompanied by a growth-over-time chart, an invested-vs-returns breakdown, and an inflation-adjusted toggle.
**Requirements:** VIZ-01, VIZ-02, VIZ-04
**UI hint:** yes

**Success Criteria:**
1. After submitting any forward calculator (CALC-01, CALC-03, CALC-04, CALC-05), the user sees a line chart plotting corpus value year by year.
2. The user sees a donut or stacked bar chart showing total invested vs. total gains for the current result.
3. The user can toggle "Show inflation-adjusted values" and set an inflation rate input; all corpus figures update to show real value alongside nominal value.
4. Charts render correctly on mobile viewports (no overflow, axes readable, touch interaction works).

**Notes:**
- Recharts lives only in `apps/web` — never in `packages/core`. Hard boundary.
- SWP (CALC-06) output is duration-to-depletion, not a growing corpus — the line chart should show the drawdown curve instead of a growth curve; confirm this edge case during implementation.
- Inflation adjustment uses the same `ScenarioParams` output from Phase 1; the toggle drives a client-side recalculation only.

---

### Phase 4: Comparison and Sharing
**Goal:** Users can evaluate multiple scenarios side by side and share or bookmark any calculation state via URL.
**Requirements:** COMP-01, SHARE-01
**UI hint:** yes

**Success Criteria:**
1. A user can add up to 4 calculator scenarios to a comparison view and see all of them in a single table or chart — without logging in.
2. Removing a scenario from the comparison view updates the UI immediately; state does not persist on refresh (client-side only, by design).
3. After filling in any calculator form, the URL updates to reflect all current inputs; loading that URL in a new tab restores the exact same inputs.
4. A user can copy the URL from the browser address bar, open it in a private window, and land on a working calculator with all inputs pre-filled.

**Notes:**
- SHARE-01 (URL state encoding) relies on `ScenarioParams` being serializable — this is guaranteed by the zod schema locked in Phase 1. Use URL query params, not hash fragments (query params are crawlable and easier to debug).
- Comparison is ephemeral in v1 — no persisted comparison set; that is v2 scope.
- Dependency chain: Phase 4 requires Phase 1 (ScenarioParams schema) and Phase 2 (forms that populate URL state).

---

### Phase 5: Authentication
**Goal:** Users can create accounts, log in with persistent sessions, and log out from any page.
**Requirements:** AUTH-01, AUTH-02, AUTH-03
**UI hint:** yes

**Success Criteria:**
1. A user can register with email and password; duplicate email registration shows a clear error.
2. A logged-in user can close the browser, return the next day, and remain logged in (session persists via httpOnly cookie).
3. A user can click "Log out" from any page and be immediately signed out; refreshing the page does not restore the session.
4. The public calculator remains fully functional for a user who has never created an account.

**Notes:**
- Better Auth is the correct library (Lucia was officially deprecated in 2025). Do not use any Lucia tutorial or fork.
- Sessions use httpOnly cookies with `sameSite: lax`. JWT in localStorage is an XSS vector and is not acceptable.
- No calculation logic in route handlers — hard boundary. Auth endpoints: register, login, logout, session check only.
- The Neon Postgres schema needs `users` table in this phase; `scenarios` table comes in Phase 6.

---

### Phase 6: Saved Scenarios
**Goal:** Logged-in users can save, browse, reload, and delete named calculator snapshots that persist across sessions.
**Requirements:** SAVE-01, SAVE-02, SAVE-03, SAVE-04
**UI hint:** yes

**Success Criteria:**
1. A logged-in user can save any calculator result with a custom name; the scenario appears immediately in their saved list.
2. A logged-in user can view a list of all their saved scenarios, each showing the name, calculator type, and key result values.
3. A logged-in user can click a saved scenario and have all original inputs restored into the calculator form exactly.
4. A logged-in user can delete a saved scenario; it disappears from the list immediately and does not reappear on refresh.

**Notes:**
- `schema_version` field is mandatory on the `scenarios` table from day one. Old saved scenarios will break silently if calculator inputs change and there is no version field to migrate against.
- The scenarios table stores serialized `ScenarioParams` (locked in Phase 1). If the schema needs migration later, the `schema_version` field enables a per-row migration function.
- Save flow: logged-in user fills form → clicks Save → modal/inline prompt for name → route handler `POST /api/scenarios` → optimistic UI update.
- Logged-out users see the Save button but get redirected to sign-in (not a 401 with no feedback).

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Calculation Engine | 0/6 | Planned | — |
| 2. Calculator UI | 0/? | Not started | — |
| 3. Visualizations | 0/? | Not started | — |
| 4. Comparison and Sharing | 0/? | Not started | — |
| 5. Authentication | 0/? | Not started | — |
| 6. Saved Scenarios | 0/? | Not started | — |
