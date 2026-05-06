# Domain Pitfalls

**Domain:** SIP / fintech calculator web app (Indian retail investor audience)
**Researched:** 2026-05-06
**Confidence:** HIGH — financial calculation and React charting patterns are well-established; auth patterns are standard; Indian fintech UX draws on published usability research and known audience behavior

---

## Critical Pitfalls

Mistakes that cause rewrites or user trust loss.

---

### Pitfall 1: Floating-Point Accumulation Error in SIP Iteration

**What goes wrong:** SIP corpus calculation involves 120–600+ iterations of compounding. Using naive IEEE 754 floating-point arithmetic (`0.1 + 0.2 !== 0.3` in JS) causes small per-step errors that compound across iterations. For a 30-year SIP, the final corpus can be off by hundreds or thousands of rupees — enough for a financially literate user to notice when they cross-check against a known calculator like ET Money or Groww.

**Why it happens:** Developers use the standard mathematical formula directly in JS without considering accumulation. The closed-form SIP formula (`P * [((1 + r)^n - 1) / r] * (1 + r)`) is better than iterative summation but still accumulates floating-point error when r is a fractional monthly rate (e.g., `12 / 1200 = 0.01`).

**Consequences:** Users report wrong numbers; trust in the tool collapses. Inflation-adjusted output compounds the error further. The year-by-year table will show inconsistencies between row totals and the headline figure.

**Prevention:**
- Use the closed-form formula, not iterative accumulation, for standard SIP corpus.
- Round intermediate values to 2 decimal places at each year boundary in the year-by-year table (not at each monthly step).
- For display, always `Math.round(value * 100) / 100` before rendering — never show raw floats.
- Cross-validate final output against SEBI's own SIP return calculation methodology and two established calculators (ET Money, Groww) during development. Tolerance: ±₹1 for corpus up to ₹1 crore.
- Do not use libraries like `decimal.js` speculatively — verify with cross-validation first; the closed-form formula is sufficient for most cases.

**Warning signs:**
- Year-by-year table doesn't add up to headline corpus.
- Inflation-adjusted value is slightly higher than nominal at any point.
- Small changes in duration (e.g., 10 vs. 11 years) produce non-linear jumps in output.

**Phase:** Core calculation phase (Phase 1/2).

---

### Pitfall 2: Wrong Step-Up SIP Formula

**What goes wrong:** Step-up SIP increases the monthly contribution by a fixed percentage annually (e.g., 10% per year). A common mistake is applying the step-up monthly instead of annually, or applying it to the cumulative investment amount rather than just the monthly contribution. Another common mistake: the "invested amount" shown in charts does not account for the changing monthly contribution — it uses the initial SIP amount times total months instead.

**Why it happens:** The step-up SIP formula is not as widely documented as standard SIP. Developers often derive it ad-hoc or find conflicting implementations online.

**Consequences:** The corpus figure is wrong. The invested-vs-gains breakdown in charts is wrong. The goal-based calculator (if it solves for required SIP with step-up enabled) gives a wrong required investment figure. Users who cross-check will distrust the tool.

**Prevention:**
- Formula: For year `y` (1-indexed), monthly contribution = `P * (1 + g)^(y-1)` where `g` is the annual step-up rate. Within each year, all 12 months use the same contribution.
- Compute invested amount as the sum of actual monthly contributions, not `P * n`.
- Unit-test step-up SIP against manual spreadsheet verification for at least 3 cases: low step-up (5%), high step-up (20%), zero step-up (must equal standard SIP).
- The goal-based reverse calculation for step-up SIP has no closed form — use numerical bisection (binary search on P) with convergence tolerance ≤ ₹1.

**Warning signs:**
- Step-up SIP with 0% increment gives different result than standard SIP with same parameters.
- Invested amount in year-by-year table equals `P * 12 * years` instead of varying by year.
- The "additional corpus from step-up" figure seems too high relative to the contribution increase.

**Phase:** Core calculation phase (Phase 1/2). Must be locked before chart phase.

---

### Pitfall 3: Inflation Adjustment Applied Incorrectly

**What goes wrong:** Two distinct errors appear here. First, applying inflation as an additive subtraction (`nominal - inflation%`) instead of as a divisor (`nominal / (1 + inflation_rate)^n`). Second, letting users interpret inflation-adjusted corpus as the actual returns they will receive — it is the purchasing power equivalent in today's rupees, not a deduction.

**Why it happens:** Inflation adjustment is conceptually simple but the formula trips developers who conflate nominal and real rates. The real rate of return formula (`(1 + nominal) / (1 + inflation) - 1`) is often replaced with the approximation (`nominal - inflation`), which is wrong for Indian inflation rates (6–7%) where the error is material.

**Consequences:** Real corpus can appear higher than nominal corpus in edge cases. Users planning retirement with an inflation-adjusted goal get the wrong required monthly investment. The tooltip/label confusion between "real value" and "actual earnings" causes support questions or, worse, silent misuse.

**Prevention:**
- Use the exact formula: `real_corpus = nominal_corpus / (1 + inflation_rate)^n`.
- Never use the approximation `real_rate ≈ nominal_rate - inflation_rate` in calculations — only in explanatory UI copy if at all.
- Label the inflation-adjusted figure as "Today's purchasing power equivalent" not "Returns after inflation" or "Real returns" — Indian retail investors conflate the two.
- Add a validation check: `real_corpus` must always be ≤ `nominal_corpus` for any positive inflation rate.

**Warning signs:**
- Inflation-adjusted value exceeds nominal value for any input combination.
- Changing inflation from 0% to 6% changes the corpus by less than 20% for a 20-year period (should be ~(1.06^20 ≈ 3.2x) reduction factor applied).

**Phase:** Core calculation phase. The label/copy question extends into UI phase.

---

### Pitfall 4: Goal-Based Calculator with No Validation on Feasibility

**What goes wrong:** Goal-based reverse calculation (`given target corpus T, rate r, and duration n, find required monthly SIP P`) can produce extremely large or negative values for edge-case inputs — e.g., target ₹10 crore in 1 year at 12% return. The UI renders this as-is ("You need to invest ₹83,40,000 per month"), which looks like a bug even though the math is correct.

**Why it happens:** Developers implement the formula and trust the math without adding UX guardrails for infeasible goals.

**Consequences:** Users with unrealistic expectations (very common in Indian retail) either laugh off the tool as broken, or enter absurd goals that produce negative required investment (which happens when the projected growth from a lump sum already exceeds the target — the SIP component is negative).

**Prevention:**
- Add a feasibility check: if required P exceeds a configurable threshold (e.g., ₹5 lakh/month) or is negative, show an explicit explanation — "Your goal of ₹X crore in Y years at Z% return would require ₹A/month — consider a longer horizon or lower target."
- If required P is negative (lump sum alone exceeds goal), show "Your lump sum investment alone already exceeds this goal — reduce your target or treat the surplus as a buffer."
- Clamp slider/input ranges to realistic values: rate 1–30%, duration 1–40 years, monthly SIP ₹500–₹5 lakh.

**Warning signs:**
- Goal calculator shows ₹0 or negative required investment.
- No visible maximum on rate input — user enters 100% return.

**Phase:** Core calculation + UI phase jointly.

---

## Moderate Pitfalls

---

### Pitfall 5: Recharts Re-render Storm on Every Keystroke

**What goes wrong:** Calculator inputs are wired directly to React state. Every keystroke triggers a state change, which triggers re-render, which triggers Recharts to re-animate the entire chart. With a 30-year monthly dataset (360 data points per series, 3 series in comparison mode = 1080 points), each re-render causes a visible flicker and, on mid-range Android devices, noticeable lag (>100ms input latency).

**Why it happens:** The natural React pattern (controlled inputs → state → derived data → chart) has no debounce layer. This is fine for text fields that don't drive heavy computations, but SIP charts recalculate 360+ compound operations per change.

**Consequences:** Input feels sluggish on budget Android phones, which are the primary device for Indian retail investors in Tier 2/3 cities. The animation on every digit change feels jarring rather than satisfying.

**Prevention:**
- Debounce calculation trigger: 300ms after last input change. The input field updates instantly (local component state); the chart data updates debounced.
- For the year-by-year table, render only visible rows (virtual scroll or pagination at 10 rows/page) — do not put all 40 rows in the DOM at once.
- Disable Recharts animation (`isAnimationActive={false}`) after the first render of a chart, or set `animationDuration={300}`. Re-enable only on explicit "refresh" or initial load.
- Use `useMemo` for the data transformation from parameters to chart data array.

**Warning signs:**
- Input lag > 50ms on a mid-range device (Chrome DevTools throttling: "MotoG4" profile).
- React DevTools Profiler shows chart component rendering 3–5 times per single keystroke.

**Phase:** Charts/visualization phase.

---

### Pitfall 6: Scenario Persistence Without Versioning Breaks Old Saves

**What goes wrong:** Saved scenarios are stored as JSON blobs in PostgreSQL. When the calculation schema changes (e.g., adding step-up SIP fields, adding inflation rate as a parameter), old saved scenarios lack the new fields. Loading them causes runtime errors or silently wrong output if defaults are assumed.

**Why it happens:** Developers add fields to the calculation model mid-project without migrating existing saved data or validating on load.

**Consequences:** Users who saved scenarios in v1 open them in v2 and see incorrect results, or the app crashes. Trust loss for the exact users who invested enough to create an account.

**Prevention:**
- Store a `schema_version` field with every saved scenario (start at `1`).
- Write a migration function per version bump that transforms old scenario payloads to the new shape — apply on load if `schema_version < current`.
- Never assume a field exists when loading a scenario — always apply defaults for missing fields.
- Keep the scenario payload schema in a single TypeScript type (`ScenarioParams`) and validate on save and load (use `zod` for runtime validation).

**Warning signs:**
- Saved scenario fields added without a DB migration.
- No `schema_version` column in the scenarios table.

**Phase:** Auth/persistence phase (Phase 3+). Must be planned before the first save is implemented.

---

### Pitfall 7: Auth Token Storage in localStorage (XSS Vulnerability)

**What goes wrong:** Storing JWT access tokens in `localStorage` exposes them to any XSS script on the page — a particularly real risk if the app ever renders user-supplied content (scenario names, notes) without proper sanitization.

**Why it happens:** `localStorage` is the default recommendation in most JWT tutorials. The alternative (httpOnly cookies) requires slightly more backend setup and trips up developers unfamiliar with CORS + cookie configuration.

**Prevention:**
- Use httpOnly, Secure, SameSite=Strict cookies for the JWT or session token. The backend sets the cookie on login; the frontend never touches the token directly.
- If using access + refresh token pattern, the refresh token must be httpOnly cookie; access token can be in-memory (React state/context), not localStorage.
- Sanitize all user-controlled string inputs before rendering (scenario names, notes fields) — use DOMPurify or enforce plain-text only (no HTML allowed in scenario names).

**Warning signs:**
- `localStorage.setItem('token', ...)` anywhere in the codebase.
- Auth tutorial being followed verbatim without checking token storage section.

**Phase:** Auth phase.

---

### Pitfall 8: Rate Input as Percentage vs. Decimal Mismatch

**What goes wrong:** The user enters `12` (meaning 12% annual return). The formula requires the monthly rate as a decimal: `0.12 / 12 = 0.01`. A frequent bug is dividing by 100 in one place but not another, or dividing by 1200 (correct) in one formula and by 12 (wrong — treats input as already a decimal) in another.

**Why it happens:** Multiple team members or multiple formula implementations diverge on the conversion convention.

**Consequences:** Corpus is off by 100x or the formula produces negative/zero results. Often caught in testing but occasionally ships if coverage is sparse.

**Prevention:**
- Define a single conversion function: `monthlyRate(annualPct: number): number => annualPct / 1200`.
- Call this function in every formula — never inline the division.
- Unit test: `monthlyRate(12)` must equal `0.01` exactly.
- Enforce that all user-facing rate inputs are in percentage (not decimal) and the conversion is always explicit.

**Warning signs:**
- Multiple places in codebase with `/100` or `/12` applied to rate values.
- No dedicated rate conversion utility.

**Phase:** Core calculation phase (Phase 1).

---

### Pitfall 9: Comparison Mode Shows Misleading Apples-to-Oranges Charts

**What goes wrong:** When comparing Scenario A (standard SIP ₹5,000/month, 15 years) vs. Scenario B (step-up SIP ₹3,000/month + 10% step-up, 15 years), the chart overlays both corpus lines. But the total invested amounts differ significantly — the chart makes Scenario B look better without surfacing that it also requires more total investment. Users draw wrong conclusions.

**Why it happens:** Comparison charts are designed to show outcome, not to contextualize inputs. Developers build them for the "impressive visual" without thinking about what the user is actually deciding.

**Consequences:** Users believe one strategy dominates another when in fact they're comparing different total investment amounts. This can lead to real financial decisions based on misleading visuals — a trust and liability risk.

**Prevention:**
- Comparison chart must show both corpus line AND total invested line per scenario, or display a secondary stat "Total invested: ₹X" prominently per scenario.
- Add a callout when scenarios have materially different total investment (>10% difference): "Note: Scenario B requires ₹X more in total investment."
- Consider normalizing comparison by total investment as an optional view.

**Warning signs:**
- Comparison chart shows only final corpus values with no invested amount context.
- No annotation or callout distinguishing total investment across scenarios.

**Phase:** Comparison/charts phase.

---

## Minor Pitfalls

---

### Pitfall 10: Indian Number Formatting Not Applied Consistently

**What goes wrong:** JavaScript's `Intl.NumberFormat` defaults to Western formatting (1,000,000). Indian formatting groups the last 3 digits then pairs (1,00,000 = 1 lakh; 1,00,00,000 = 1 crore). Using Western formatting for large rupee amounts (₹50,00,000 shown as ₹5,000,000) confuses Indian users immediately.

**Prevention:**
- Use `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })` everywhere.
- Create a single `formatINR(value: number): string` utility and enforce it via ESLint custom rule or code review checklist.
- Also format axis tick labels and chart tooltips — these are the most commonly missed.
- Add a "lakh/crore" suffix conversion for large numbers in chart axis labels (₹12.5L, ₹2.3Cr) — Recharts tick formatter supports this.

**Warning signs:**
- Numbers displayed as `5,000,000` instead of `50,00,000`.
- Chart Y-axis showing raw large numbers without lakh/crore abbreviation.

**Phase:** UI/charts phase, but the formatting utility must be created in Phase 1 before any display code is written.

---

### Pitfall 11: No Input Validation Allows Calculation of Nonsensical Results

**What goes wrong:** Empty inputs, zero duration, negative rate, or monthly SIP of ₹1 are passed to formulas. JavaScript returns `NaN`, `Infinity`, or `0`, which renders in charts as broken lines or blank values.

**Prevention:**
- Validate all inputs before passing to calculation functions. Return a typed error state (`{ valid: false, reason: string }`) rather than a calculation result.
- Default to sensible values on first load (₹5,000/month, 12% return, 10 years) so the chart is never blank.
- Never render a chart with a `NaN` or `Infinity` data point — guard in the data transformation layer.

**Phase:** Phase 1 (calculation) and Phase 2 (UI).

---

### Pitfall 12: PostgreSQL Scenario Storage as Untyped JSONB

**What goes wrong:** Storing scenario parameters as `JSONB` without a schema allows arbitrary data to accumulate. When the calculation model changes, there is no way to query or migrate old scenarios efficiently.

**Prevention:**
- Use `JSONB` for flexibility but validate the payload against the `ScenarioParams` zod schema on every write.
- Store key scalar fields (e.g., `monthly_amount`, `duration_years`, `rate_pct`) as indexed columns alongside the JSONB blob for future queryability and migration ease.

**Phase:** Database design phase (before any persistence code).

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Core calculations | Floating-point accumulation (P1), rate conversion mismatch (P8) | Closed-form formulas, single conversion utility, cross-validate against ET Money |
| Step-up SIP | Wrong annual-vs-monthly increment logic (P2) | Unit tests with zero-increment case; verify invested amount computation |
| Inflation adjustment | Wrong formula or misleading label (P3) | Exact divisor formula; UI copy review with "purchasing power" framing |
| Goal-based calculator | Infeasible inputs silently rendering (P4) | Feasibility gate + explicit user messaging |
| Charts / visualization | Recharts re-render storm (P5), misleading comparison (P9), number formatting (P10) | Debounce, disable post-render animation, apples-to-apples context |
| Auth + persistence | JWT in localStorage (P7), unversioned scenario schema (P6) | httpOnly cookies, schema_version from day one |
| Database design | Untyped JSONB (P12) | Scalar columns + zod validation on write |
| Input handling | No validation → NaN in charts (P11) | Validation layer before formula, sensible defaults on load |

---

## Sources

- Financial formula correctness: SEBI investor education resources; standard FV/SIP annuity formulas (actuarial convention)
- Step-up SIP formula: First principles derivation; verified against published step-up SIP corpus calculators (ET Money methodology documentation)
- Floating-point behavior: ECMAScript spec, IEEE 754 standard; well-documented in MDN and JavaScript: The Definitive Guide
- Recharts performance: Recharts GitHub issues (animation re-render on every prop change is a known pattern); React DevTools profiling methodology
- Auth security: OWASP JWT Cheat Sheet (httpOnly cookie recommendation); OWASP XSS Prevention
- Indian number formatting: MDN `Intl.NumberFormat` with `en-IN` locale; verified against RBI and SEBI document conventions
- Indian retail investor UX: Published usability research on fintech adoption in India (IAMAI reports, Zerodha Varsity user feedback patterns)
