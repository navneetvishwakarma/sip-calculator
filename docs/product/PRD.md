# Product Requirements Document — SIP Calculator
## Detailed Narrative

**Date:** 2026-05-12
**Status:** B-04 active — pending human approval
**Canonical artifact:** `artifacts/pm/PRD.md` (structured, agent-facing)
**This document:** Narrative format — context, rationale, trade-offs; human and stakeholder facing

---

## What We Are Building and Why

The SIP Calculator is a web tool for Indian retail investors to model Systematic Investment Plans across every scenario they actually face: forward planning ("how much will I have?"), goal-based reverse calculation ("how much do I need to invest?"), step-up contributions as income grows, a lump sum alongside a monthly SIP, and the retirement drawdown question of how long a corpus will last under monthly withdrawals.

The market already has many SIP calculators. The problem is that none of them do all of this well in one place. Groww — the market leader — gets the basics right but skips step-up SIP, inflation-adjusted real value, and scenario comparison. ET Money shows inflation-adjusted output but doesn't have comparison. Scripbox has step-up but lacks depth elsewhere. The combination of all four — step-up SIP, inflation-adjusted display, scenario comparison, and SWP — is the gap this product fills.

The core emotional payoff of this product is the moment a user sees their invested total next to their projected returns and viscerally understands compounding. Everything else in the product serves that moment.

---

## Why This Approach (Key Trade-offs)

**No backend for the core product.** All calculations run client-side — pure TypeScript functions, no network call required. This means the calculator works instantly, works offline, and requires no infrastructure to serve the core value. The backend exists only for auth and scenario persistence (Phases 5–6). The cost is that we can't run server-side calculation audits, but there's no requirement for those in v1.

**Turborepo monorepo from day one, not later.** The calculation engine lives in `packages/core` with zero DOM or React dependencies. This is a higher setup cost at the start but it's the only way to share the calc engine with a React Native mobile app in v2 without rewriting it. Retrofitting a clean package boundary into an existing Next.js app is expensive; doing it upfront is cheap.

**Ship to validate, not validate to ship.** No formal demand validation was run before building (B-03 skipped). The market is proven — SIP calculators have millions of users in India. The validation question here is not "do people want SIP calculators" but "will they prefer this one." That's answered by shipping, not by interviews.

**Better Auth, not Lucia.** Lucia was officially deprecated in 2025. This is not a preference; it's a constraint. Any tutorial or implementation referencing Lucia is building on a dead library.

**Sessions in httpOnly cookies, not JWT in localStorage.** localStorage is accessible to any JavaScript running on the page — it's an XSS vector by design. httpOnly cookies are not readable by JS. With `sameSite: lax`, cross-site POST attacks are blocked at the browser level. This is the correct default for a first-party SPA; the extra complexity of JWT in localStorage buys nothing here.

---

## Requirements — With Context

### Phase 1: Calculation Engine

The entire first phase is a pure TypeScript module (`packages/core`) with no UI, no backend, no browser dependencies. The goal is to get the math right before building anything on top of it.

**CALC-01 — Standard SIP**
The core formula: `FV = P × [((1+r)^n - 1) / r] × (1+r)` where P is monthly payment, r is monthly rate, n is total months. This is an annuity-due (payments at start of period). Cross-validate against ET Money or Groww to ±₹1 on a ₹1 crore corpus before declaring it done. If the tolerance fails, adopt `decimal.js`; otherwise the native Number type is sufficient for Indian retail investment amounts.

**CALC-02 — Goal-Based Reverse SIP**
The user knows their target and asks for the required monthly investment. The basic case has a closed-form inversion. The step-up variant (goal-based with annual increment) does not — it requires bisection search on the monthly amount. Use bisection in both cases for consistency; the convergence tolerance is the same.

**CALC-03 — Lump Sum**
Standard compound interest: `FV = PV × (1+r)^n`. Straightforward.

**CALC-04 — Step-Up SIP**
The most complex forward calculator. Monthly contribution for year Y is `P × (1 + g)^(Y-1)` where g is the annual step-up rate. The trap: SIP compounds monthly but the step-up applies annually. Mixing these periods is the most common implementation error. Validate with 0% step-up (must equal CALC-01 output exactly), 5%, and 20%. This is the unit test that catches the formula error.

**CALC-05 — SIP + Lump Sum Hybrid**
Additive: `FV = SIP_FV + LumpSum_FV`. Both components are already implemented in CALC-01 and CALC-03. Low complexity.

**CALC-06 — SWP (Systematic Withdrawal Plan)**
The retirement decumulation mirror of SIP. Inputs: corpus, monthly withdrawal, annual return rate. Output: months until corpus is depleted, or "perpetual" if the annual return on remaining corpus exceeds the monthly withdrawal rate indefinitely. This catches the case where a retiree withdrawing ₹30,000/month from a ₹1 Crore corpus at 12% annual return never depletes the corpus.

**The `ScenarioParams` schema must be locked before any of Phase 2 starts.** Scenario comparison (Phase 4) and saved scenarios (Phase 6) both depend on every calculator emitting the same normalized output shape. If this schema changes after Phase 2, it cascades across the entire app. Lock it, export it as a zod schema from `packages/core`, and treat it as a public API.

**The `monthlyRate(annualPct)` utility is a hard constraint.** User enters `12`; formula needs `0.01`. This conversion must happen in exactly one place. The cost of an inline `/ 12 / 100` anywhere in the codebase is a silent, hard-to-find bug when the formula is used in a new context.

---

### Phase 2: Calculator UI (Minimum Shippable Product)

Phase 2 is the first thing a user sees. The moment this phase is done, the product can be shipped publicly. No backend, no accounts — just a fully interactive calculator.

**VIZ-03 — Year-by-Year Breakdown Table**
A table with columns: year, monthly investment, total invested to date, interest earned, corpus value. This lands in Phase 2 (not Phase 3 with charts) because it's a UI component, not a chart library integration. It also serves as the primary data verification tool during development — if the numbers in the table match ET Money row by row, the formula is right.

**UX-01 — INR Lakh/Crore Word Formatting**
`Intl.NumberFormat('en-IN')` gives correct digit grouping (1,00,000) but does not produce "₹1 Lakh". Indian users read the word format; the digit format reads as foreign. The formatter must handle four cases: sub-lakh (show in rupees with grouping), 1L–99.9L (show as "₹X.X Lakh"), 1Cr+ (show as "₹X.X Crore"), and fractional edge cases. This formatter lives in `packages/core` and is called everywhere.

**UX-02 — Indian Defaults**
12% annual return. 6% inflation. 10-year duration. ₹5,000/month starting SIP. These are not guesses — they're the mental models Indian SIP investors arrive with (equity mutual fund return expectation, Indian inflation rate, typical first-SIP horizon, typical first-SIP amount). Wrong defaults produce confusing results and erode trust.

**UX-03 — Mobile-First**
Indian fintech traffic is majority mobile. "Responsive" is not enough — the layout must be designed for 375px first and expanded for desktop. Inputs must have large tap targets. Results must be readable without pinching. The year-by-year table must scroll horizontally on narrow screens without breaking the layout.

**UX-04 — Feasibility Warning (Goal-Based)**
When CALC-02 returns a required monthly SIP above ₹10 lakh/month, surface a warning. This prevents users from setting an impossible goal and trusting the output. The threshold is heuristic (₹10L/month is beyond almost any retail investor's capacity) — the warning copy should be matter-of-fact, not alarming.

**UX-05 — SEBI Disclaimer**
"Returns are illustrative and not guaranteed. Consult a SEBI-registered investment advisor." This is not optional. Any tool projecting investment returns in India that lacks this copy is a legal and trust liability. Footer, every page, always visible.

---

### Phase 3: Visualizations

Phase 3 adds charts on top of the already-working calculator. Recharts is used in `apps/web` only — never in `packages/core`. The time-series data model (`YearlySnapshot[]`) is already produced by Phase 1 calculators; charts are derived renders of that data.

**VIZ-01 — Growth-Over-Time Line Chart**
Corpus value year by year. This is the "compounding made visceral" chart — the curve that accelerates as years increase is the product's core emotional hook. For SWP (CALC-06), this chart shows the drawdown curve instead: corpus depleting year by year until zero.

**VIZ-02 — Invested vs. Returns Breakdown**
Donut or stacked bar showing total invested vs. total gains at the end of the period. The specific moment: "I put in ₹6 Lakh over 10 years and got back ₹11.6 Lakh — the extra ₹5.6 Lakh is free money from compounding." This is the chart that makes people send the calculator to friends.

**VIZ-04 — Inflation-Adjusted Toggle**
Real value = `nominal / (1 + inflation_rate)^years`. The math is trivial. The UX is not — users routinely confuse nominal and real values. The toggle must make the current display mode unambiguous. The column headers in the year-by-year table must change when toggled. The inflation rate input must be editable (default 6%) because some users want to model 4% or 8%.

---

### Phase 4: Comparison and Sharing

**COMP-01 — Scenario Comparison**
Up to 4 scenarios side by side, client-side only. No backend, no persistence, no login required. A user can ask "what if I invest ₹5K, ₹8K, or ₹12K per month?" and see all three outcomes simultaneously. State held in React; clears on refresh by design. V2 can add comparison persistence; that requires a new data model and is explicitly out of scope for v1.

**SHARE-01 — URL-State Encoding**
All calculator inputs encoded into URL query params. Loading the URL in a new tab restores exact inputs. This enables bookmarking, sharing via WhatsApp, and deep-linking from blog posts. No backend required. The `ScenarioParams` zod schema (locked in Phase 1) guarantees the inputs are serializable. Use query params, not hash fragments — query params are crawlable and easier to debug.

The reason this was almost deferred: the project initially marked it as a v2 feature. Research flagged it as low complexity and high value, and noted that retrofitting URL state into an existing app after Phase 2 is harder than doing it with Phase 4 when the state architecture is fresh. It was added back to v1 scope.

---

### Phase 5: Authentication

**AUTH-01/02/03 — Accounts and Sessions**
Email + password registration and login. Sessions via httpOnly cookies (see rationale above). The session check on page load (`GET /auth/session`) drives the auth state across the entire app without storing tokens client-side.

The public calculator (Phases 1–4) continues to work identically for anonymous users after Phase 5 ships. Auth adds persistence; it does not gate the core value.

---

### Phase 6: Saved Scenarios

**SAVE-01/02/03/04 — Scenario Persistence**
Logged-in users save named calculator snapshots. The scenarios table stores serialized `ScenarioParams` (the schema locked in Phase 1) plus a `schema_version` field. The `schema_version` field is not optional — without it, any future change to calculator inputs silently corrupts all saved scenarios for every user. The version field enables a per-row migration function when the schema evolves.

The save UX for logged-out users: show the Save button, but redirect to sign-in when clicked. Not a disabled button (confusing), not a 401 error (alarming) — a redirect with context.

---

## Out of Scope (v1) — and Why

| Item | Reason |
|------|--------|
| PDF export | Low priority vs. URL sharing; v2 |
| React Native mobile app | Planned for v2; `packages/core` architecture enables it without rework |
| Live NAV / fund data feed | Vendor dependency; breaks when feed is down; user supplies their own rate |
| Fund-specific recommendations | SEBI RIA registration required — legal constraint, not a product choice |
| Social features (following, public portfolios) | Out of scope for a projection tool; moderation overhead |
| Goal templates (named presets) | Nice-to-have UX enhancement; quick win candidate for v1.1 |
| Benchmark overlay (PPF, FD, NPS) | Interesting differentiator; medium complexity; v2 |
| Tax-aware mode (LTCG post-redemption) | Requires CA-grade accuracy; regulatory overhead; out of scope |
| Admin dashboard | Use third-party analytics (Plausible, PostHog) at launch; v2 |
| WhatsApp / social share buttons | URL-state sharing achieves 80% of the value at 5% of the cost |

---

## Success Definition

**Phase 2 done = minimum shippable product.** A user on a 375px mobile screen can calculate any of the six calculator types, see their results in correct INR format with a year-by-year breakdown, and trust the output (SEBI disclaimer present). No accounts, no charts, no backend.

**Full v1 done =** any user can save, share, and compare scenarios across sessions.

**The north star:** a retail investor with no financial training can, in under 60 seconds and without creating an account, see exactly how much they'll have if they invest ₹5,000/month for 20 years — and understand it.
