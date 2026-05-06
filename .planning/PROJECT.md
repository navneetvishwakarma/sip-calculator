# SIP Calculator

## What This Is

A web app for Indian retail investors to plan and visualize Systematic Investment Plans. Users can calculate future corpus from a monthly SIP, work backward from a target amount to find the required investment, compare multiple scenarios, and track lump sum and step-up SIP alongside standard SIP — all with interactive charts and saved scenarios tied to a user account.

## Core Value

A retail investor can enter their monthly amount, rate of return, and duration and instantly see their projected corpus with a clear breakdown of invested vs. gains — no sign-up required to try it.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] User can calculate SIP: monthly amount + rate + duration → future corpus
- [ ] User can calculate goal-based SIP: target amount + rate + duration → required monthly investment
- [ ] User can calculate lump sum investment growth
- [ ] User can calculate step-up SIP (annual increment on monthly contribution)
- [ ] User can compare multiple SIP scenarios side by side
- [ ] User can see growth-over-time line chart
- [ ] User can see invested-vs-returns breakdown (stacked bar / donut)
- [ ] User can see year-by-year table with corpus, invested amount, and gains per year
- [ ] User can see inflation-adjusted (real) value alongside nominal corpus
- [ ] User can create an account and log in
- [ ] Logged-in user can save and revisit named scenarios

### Out of Scope

- PDF export — deferred to v2
- Admin dashboard / usage analytics — deferred to v2
- Mutual fund data integration (live NAV, fund search) — adds vendor dependency, deferred
- React Native mobile app — planned for v2; architecture supports it via monorepo `packages/core`

## Context

- Target audience: Indian retail investors, likely familiar with SIP as a concept but may not know the math
- Inflation-adjusted output matters for this audience (rupee value erodes fast at Indian inflation rates ~6%)
- No existing codebase; greenfield
- React Native mobile app planned for v2 — architecture must keep code-sharing in mind from day one

## Constraints

- **Auth**: User accounts required for saved scenarios; public calculator must work without login
- **Deployment**: Needs a backend (not static-only); Next.js route handlers cover all v1 backend needs
- **Mobile**: React Native (Expo) for v2 mobile app — calculation engine must have zero DOM/browser dependencies so it can be shared via monorepo
- **Scope**: v1 is web only; social/sharing features deferred

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js 15 (App Router) over Vite + Express | Route handlers replace a separate Express backend; SSR available if needed; one deployment unit | — Pending |
| Turborepo monorepo from day one | Calculation engine in `packages/core` — shared between Next.js web (v1) and React Native mobile (v2) with zero rework | — Pending |
| React Native (Expo) for mobile | User preference; shares calc engine from monorepo; Expo managed workflow handles iOS/Android | — Pending |
| Recharts for web charts | Declarative, React-native SVG rendering; fights React less than Chart.js Canvas approach | — Pending |
| Drizzle ORM + Neon (serverless Postgres) | Lightweight, TypeScript-first, pairs well with Next.js serverless; Neon scales to zero | — Pending |
| Better Auth for authentication | Correct post-Lucia-deprecation choice; Lucia was officially deprecated in 2025 | — Pending |
| Public calculator, gated saves | Core value must work without login; accounts unlock persistence | — Pending |
| `packages/core` has zero DOM dependencies | Hard boundary: no `window`, `document`, or React imports in calc engine — required for RN sharing | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-06 after initialization*
