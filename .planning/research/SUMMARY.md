# Research Summary — SIP Calculator

## Recommended Stack

Next.js 15 (App Router) + React 19 + TypeScript, deployed on Vercel with Neon (serverless Postgres). Recharts 2.x for charts, Tailwind v4 + shadcn/ui for styling, react-hook-form + zod for forms, Zustand for cross-component state, Drizzle ORM, Better Auth for authentication.

One unresolved conflict between research files: STACK.md calls `decimal.js` non-optional for compound interest precision; PITFALLS.md says the closed-form SIP formula is sufficient and to use `decimal.js` only if cross-validation reveals actual error. **Resolution: cross-validate the closed-form output against ET Money/Groww during Phase 1 — adopt `decimal.js` only if the tolerance check (±₹1 on ₹1 crore corpus) fails.**

## Table Stakes Features

- Basic SIP forward calculator (monthly + rate + duration → corpus)
- Lump sum calculator
- Goal-based reverse calculator (target → required monthly)
- Step-up SIP calculator
- Year-by-year breakdown table (invested, gains, corpus per year)
- Invested vs. returns visual (donut or stacked breakdown)
- Growth-over-time line chart
- Scenario comparison (2–4 scenarios side by side, client-side only in v1)
- Saved named scenarios for logged-in users
- INR formatting in lakhs and crores — not just digit grouping; word labels required ("₹12.5 Lakh", "₹2.3 Crore")
- Sensible Indian defaults pre-populated (12% return, 6% inflation, 10-year duration, ₹5,000/month)
- Mobile-first responsive layout (Indian fintech traffic is majority mobile)
- SEBI disclaimer in footer — legally mandatory, not a nice-to-have

## Architecture in a Sentence

A client-side calculation domain (pure functions, zero network dependency) feeds a React SPA for the public calculator, with a thin Next.js route-handler backend handling only auth and scenario CRUD against a two-table Postgres schema.

## Critical Pitfalls

**1. Floating-point error in compound interest.** Iterative loops accumulate visible error over 30-year horizons. Use the closed-form SIP formula and cross-validate against ET Money/Groww (tolerance: ±₹1 on ₹1 crore). Adopt `decimal.js` only if this check fails.

**2. Wrong step-up SIP formula.** Step-up applies annually — monthly contribution for year Y is `P * (1 + g)^(Y-1)`. Getting this wrong silently corrupts corpus and the invested-amount breakdown. Unit-test with 0% step-up (must equal standard SIP), 5%, and 20%. Goal-based reverse with step-up has no closed form — use binary search (bisection) on the monthly amount.

**3. Rate unit mismatch (percent vs. decimal).** User enters `12`; formula needs `0.12 / 12 = 0.01`. Define a single `monthlyRate(annualPct)` utility called everywhere. Never inline the division.

**4. Normalized scenario schema must be designed before any calculator.** Both comparison and save-scenario require every calculator type to emit the same output shape. If individual calculators are built first with their own structures, comparison becomes a full rewrite. Lock the `ScenarioParams` TypeScript type and zod schema in Phase 1.

**5. Scenario schema versioning from day one.** Add a `schema_version` field to the scenarios table immediately. Write migration functions per version bump. Old saved scenarios will otherwise break silently when calculator inputs change.

## Key Decisions Made

These are settled by research and should not be re-opened during planning:

- **No separate Express backend.** Next.js App Router route handlers cover all v1 backend needs.
- **Calculations run client-side only.** The backend has no calculation code — hard boundary.
- **httpOnly session cookies, not JWT in localStorage.** `localStorage` is an XSS vector; `sameSite: lax` is sufficient CSRF protection for a first-party SPA.
- **Scenario comparison is ephemeral in v1.** Client-side state only; no persisted comparison set concept.
- **No live NAV / fund data feed.** User-supplied rate of return eliminates a vendor dependency.
- **No fund-specific recommendations.** SEBI requires RIA registration for personalized fund advice — legal constraint.
- **Lucia Auth is deprecated (2025).** Do not use it or any tutorial recommending it. Use Better Auth or Auth.js v5.

## Open Questions

- **`decimal.js` or not?** Resolve empirically in Phase 1 by cross-validating the closed-form formula against ET Money and Groww. Do not pre-decide.
- **SWP calculator in scope?** Research flags it as highly underserved with low math complexity. Needs a deliberate in/out decision before the roadmap is finalized.
- **Shareable URL state — reconsider the deferral.** State-in-URL is low complexity and high value; retrofitting it post-launch is harder. Recommend scheduling explicitly between Phase 2 and Phase 3 while state architecture is fresh.
- **SIP + lump sum hybrid.** Low complexity (additive: SIP FV + lumpsum FV), high real-world relevance. Quick-win candidate; needs explicit in/out decision.
- **Tailwind v4 config change.** v4 uses CSS-first config — no `tailwind.config.js`. Confirm with fresh docs at setup time; most online tutorials cover v3.

## Phase Implications

**Phase 1 — Calculation domain (pure TypeScript, no UI)**
Build and test all calculator types (standard SIP, lump sum, goal-based, step-up SIP), inflation adjustment, the `monthlyRate` conversion utility, and the INR formatting utility. Cross-validate outputs against ET Money and Groww. Decide on `decimal.js` here. Lock the `ScenarioParams` normalized schema before moving on. Deliverable: a tested TypeScript module with zero UI or network dependencies.

**Phase 2 — Calculator UI + charts (frontend only, no backend)**
Wire React forms to the Phase 1 module. Build all charts (growth-over-time line chart, invested-vs-gains donut, year-by-year table), scenario comparison view, and inflation-adjusted toggle. Auth state mocked as logged-out. "Save" button visible but gated. This is the minimum shippable product — fully interactive with zero backend.

**Phase 2.5 — Shareable URL state** (recommend inserting before Phase 3)
Encode all calculator inputs into URL query params. Low effort now; costly retrofit later. Does not require backend.

**Phase 3 — Auth + scenario persistence**
Next.js route handlers for auth, Drizzle schema with `users` + `scenarios` (with `schema_version` from day one), session middleware, Better Auth integration. Connect frontend save/load/delete UI.
