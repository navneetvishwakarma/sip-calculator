# Product Discovery — SIP Calculator

**Date:** 2026-05-06
**Status:** Complete — translated from `.planning/` research artifacts

---

## Problem Statement

Indian retail investors lack a fast, trustworthy SIP projection tool that works without sign-up and handles the full range of investment scenarios they actually face: standard SIP, goal-based reverse calculation, step-up SIP, lump sum, SIP+lumpsum hybrid, and SWP for the retirement drawdown phase. Most existing tools either miss key calculator types, show confusing numbers (Western digit grouping instead of lakh/crore), or require account creation before the user can try anything.

## Opportunity

The SIP market in India is large and growing. Retail investors are comfortable with the SIP concept but not the math — they need a calculator, not a fund recommendation engine. The addressable user is anyone who wants to know "how much will I have" or "how much do I need to invest." No regulatory registration required for a pure projection tool.

The key gap in the market is the combination of: all calculator types in one place + proper INR formatting + inflation-adjusted display + scenario comparison. Most competitors have 2–3 of these; none does all cleanly.

## Core Insight

The emotional payoff of a SIP calculator is seeing the power of compounding made tangible — "I invest ₹5,000/month and end up with ₹50 Lakh" is the moment. This requires the invested-vs-returns breakdown to be front and center, not buried. Everything else in the product serves this moment.

## Target Users

See `artifacts/shared/ICP.md` for full profile.

Primary: Indian retail investors aged 25–45, salaried, SIP-familiar but math-averse. They arrive from social media, blog posts, or WhatsApp forwards. They want to calculate one scenario in under 60 seconds without creating an account.

Secondary: Power users who compare multiple scenarios, want to save their work, and return to it.

## Competitive Landscape

See `artifacts/shared/COMPETITIVE_ANALYSIS.md` for full analysis.

Key finding: Groww and ET Money have the highest traffic and set the user expectation floor (instant calculation, no login required, INR formatting). The gap this product can exploit is the combination of step-up SIP + scenario comparison + inflation-adjusted display — no single competitor does all three cleanly.

## Feature Scope

### In Scope (v1)

**Calculators (6):**
- CALC-01: Standard SIP (monthly + rate + duration → corpus)
- CALC-02: Goal-based SIP (target + rate + duration → required monthly)
- CALC-03: Lump sum growth
- CALC-04: Step-up SIP (annual increment on monthly contribution)
- CALC-05: SIP + lump sum hybrid
- CALC-06: SWP — systematic withdrawal plan (corpus + monthly withdrawal → duration until depletion or perpetual)

**Visualization:**
- Growth-over-time line chart (VIZ-01)
- Invested vs. returns donut/stacked chart (VIZ-02)
- Year-by-year breakdown table (VIZ-03)
- Inflation-adjusted real value toggle (VIZ-04)

**Other:**
- Scenario comparison — 2–4 side by side, client-side only (COMP-01)
- URL-state sharing (SHARE-01)
- User accounts + saved named scenarios (AUTH-01–03, SAVE-01–04)
- Mobile-first layout, INR lakh/crore formatting, Indian defaults, SEBI disclaimer

### Explicitly Out of Scope (v1)

- Live NAV / mutual fund data feed — vendor dependency, user supplies their own rate
- Fund-specific recommendations — SEBI RIA registration required
- PDF export — v2
- React Native mobile app — v2 (architecture supports it via monorepo `packages/core`)
- Social/sharing features beyond URL state
- Admin dashboard, KYC, social feed

## Build Sequence

Phase 1 (Calculation Engine) → Phase 2 (Calculator UI — minimum shippable product) → Phase 3 (Visualizations) → Phase 4 (Comparison + Sharing) → Phase 5 (Authentication) → Phase 6 (Saved Scenarios)

Phase 2 is the first shippable state: fully interactive calculator with no backend required.

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| No login required to calculate | Core value must be immediately accessible; account creation at the calculator gate kills conversion |
| Turborepo monorepo from day one | React Native v2 shares `packages/core`; doing this later requires a rewrite of the calc engine |
| Calculations run client-side only | No backend calculation code; faster, no infra required for the core product |
| Session cookies (httpOnly, sameSite:lax), not JWT in localStorage | localStorage is an XSS vector; httpOnly cookies are not |
| Normalized `ScenarioParams` schema locked in Phase 1 | Both comparison (Phase 4) and saved scenarios (Phase 6) depend on this; changing it cascades everywhere |

## Open Questions at Time of Discovery

- `decimal.js` or not? Resolve empirically in Phase 1 via cross-validation (±₹1 on ₹1 crore).
- Shareable URL state: low complexity, high value. Scheduled to Phase 4.
