# Features Research — SIP Calculator

**Domain:** SIP / investment calculator web app, Indian retail investors
**Researched:** 2026-05-06
**Confidence note:** Web search and WebFetch were unavailable in this environment. Findings draw on training data (cutoff August 2025) covering the Indian fintech calculator landscape (Groww, ET Money, Zerodha Varsity, Scripbox, ClearTax, Paytm Money, INDmoney, MoneyControl). Indian tax specifics reflect the July 2024 Union Budget changes. Confidence levels noted per claim.

---

## Table Stakes

Features users expect from any serious SIP calculator. Missing any of these and the product feels amateur or incomplete.

| Feature | Why Expected | Complexity | In Scope? | Notes |
|---------|--------------|------------|-----------|-------|
| Basic SIP calculator (monthly + rate + duration → corpus) | The literal core promise. Every competitor has it. | Low | Yes | |
| INR formatting in lakhs and crores | Indian users read "₹50 Lakh" not "₹5,000,000". The grouping system (2-2-3 digits) is different from Western. Mis-formatting breaks trust immediately. | Medium | Not explicit in PROJECT.md — gap | `Intl.NumberFormat('en-IN')` handles grouping but not the lakh/crore word labels; custom formatter required |
| No-login public calculator | Indian users will not sign up to try a calculator. Groww, ET Money, and ClearTax all allow full calculation without login. The PROJECT.md already calls this out as a constraint. | Low | Yes (constraint) | |
| Mobile-first responsive layout | Indian retail investor traffic is majority mobile (70%+ on fintech platforms per AMFI/industry reports — MEDIUM confidence). Desktop-only or poorly adapted mobile kills retention. | Medium | Not explicit | Must be treated as a first-class requirement, not an afterthought |
| Sensible Indian defaults | Pre-populated values matter: 12% equity return, 6% inflation, 10–15 year horizons are the mental models Indian SIP investors arrive with. Wrong defaults cause confusion. | Low | Not explicit | Default rate 12%, inflation 6%, duration 10 years |
| Year-by-year breakdown table | Users want to see how the corpus grows each year, not just the final number. Table with invested, gains, and corpus per year is standard. | Low | Yes | |
| Invested vs returns breakdown visual | Pie or donut showing "you invested X, your returns are Y" is the core emotional payoff — it makes compounding tangible. All major competitors show this. | Low | Yes | |
| SEBI-mandated disclaimer | "Mutual fund investments are subject to market risks. Past returns not indicative of future results." Required on any investment projection tool. Absence is a legal and trust risk. | Low | Not in PROJECT.md — gap | Single-line footer; not a feature but mandatory |
| Goal-based reverse calculator | Extremely common on Groww, ET Money, Scripbox. Users think "I want ₹1 Cr in 20 years, what do I invest?" more naturally than the forward calc. | Medium | Yes | |
| Lump sum calculator | Expected alongside SIP. Most platforms offer both. | Low | Yes | |

**Table stakes gaps in the current in-scope list:**
- INR lakh/crore word formatting (not just digit grouping)
- Mobile-first layout treated as a hard requirement
- Sensible Indian defaults pre-populated
- SEBI disclaimer in footer

---

## Differentiators

Features that would make this product stand out from the crowded Indian SIP calculator market. Most competitors have one or two; few have all.

| Feature | Value Proposition | Complexity | In Scope? | Notes |
|---------|-------------------|------------|-----------|-------|
| Step-up SIP calculator | Very few calculators handle this cleanly. It models real investor behavior (salary increments → higher SIP each year). Scripbox has it; most others don't surface it prominently. | Medium-High | Yes | Math is a growing-annuity geometric series; closed form exists but easy to get wrong on compounding period alignment — see Complexity Notes |
| Scenario comparison (multiple side by side) | Rare in the Indian market. Users want to see "what if I invest ₹5K vs ₹10K vs ₹15K" in one view. No mainstream Indian calculator does this well. | Medium | Yes | Strong differentiator; requires normalized scenario object architecture |
| Inflation-adjusted (real) value alongside nominal | Most calculators show nominal corpus. "₹1 Cr in 20 years is worth ₹31 Lakh in today's money at 6% inflation" is the insight that matters. ET Money shows this; Groww does not prominently. | Low | Yes | Toggle or side-by-side display; UX clarity is harder than the math |
| Growth-over-time line chart | Many calculators show only the endpoint. A chart showing corpus growing year over year makes compounding visceral. | Low-Medium | Yes | Shares time-series data model with year-by-year table — build once |
| SWP (Systematic Withdrawal Plan) calculator | The retirement decumulation mirror of SIP. "I have ₹1 Cr, how long can I withdraw ₹30K/month?" Highly underserved: ET Money has it, most others don't. Strong differentiation for the retirement-planning audience. | Medium | Not in PROJECT.md — recommend adding | Relatively straightforward math; complements goal-based SIP |
| Goal templates with named presets | "Child's college (15 years)", "Home down payment (5 years)", "Retirement (25 years)" with default durations and inflation-adjusted target amounts. Lowers cognitive load for first-time investors. Scripbox does this; Groww does not. | Medium | Not in PROJECT.md — recommend adding | Builds on goal-based reverse calc; can be phase 2 |
| Benchmark comparison overlay (PPF / FD / NPS) | "Your SIP grows to ₹1.2 Cr; the same money in PPF grows to ₹68 Lakh." Gives context to the result. Few calculators do this inline. | Medium | Not in PROJECT.md — recommend adding | Medium confidence on market gap; verify against current Groww feature set |
| SIP + lumpsum hybrid | Invest ₹50K today plus ₹5K/month going forward — a common real scenario (bonus + regular SIP). Clean closed form: lumpsum FV + SIP FV. | Low | Not in PROJECT.md — recommend adding as a quick win | Low complexity, high real-world relevance |
| Multiple return scenarios in one view | Conservative (8%) / moderate (12%) / aggressive (15%) displayed simultaneously. Frames risk without being prescriptive. | Low | Not explicit — partially covered by scenario comparison | Could be a preset within the comparison feature |
| Shareable link / URL-encoded state | URL captures all inputs so users can share a specific calculation. No backend required (state in query params). Outperforms social share buttons for this use case. | Low | Deferred in PROJECT.md (as "shareable link") — recommend reconsidering | URL encoding is low effort and high value; worth revisiting the deferral |
| Saved named scenarios (logged-in) | Users building long-term plans want to save and return. This is uncommon on public calculators and creates an account stickiness moat. | Medium | Yes | Requires auth; already in PROJECT.md as gated feature |

---

## Anti-Features

Things to explicitly not build, with regulatory or product rationale.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Fund-specific recommendations ("invest in HDFC Flexicap") | SEBI Investment Adviser regulations require RIA registration to give personalized fund advice. Building this without registration is a legal violation. | Show generic "equity MF" projections; let users input their own expected return |
| KYC / account opening flow | Regulatory overhead (SEBI/RBI/MCA), not the product's value proposition, and massively increases compliance burden | Link out to registered platforms (Groww, Zerodha Coin) if users want to act |
| Live NAV / fund price integration | Already deferred in PROJECT.md. Adds backend complexity (MF data vendor), latency, and a dependency that breaks the calculator when the feed is down. Users can input their own expected return. | User-supplied rate of return field |
| "Guaranteed returns" framing | SEBI guidelines on advertising mutual funds explicitly prohibit presenting projected returns as guaranteed. This extends to UI copy. | Use "projected" or "estimated" language consistently; add disclaimer |
| Social feed / portfolio sharing | Out of scope for v1; adds moderation complexity; not the core use case | Defer; URL-based sharing achieves 80% of the value at 5% of the cost |
| Admin dashboard / usage analytics (first-party) | Already deferred in PROJECT.md. Low ROI at launch. | Use a third-party analytics tool (Plausible, PostHog) with minimal integration |
| Tax-filing integration | Far outside scope; requires CA-grade accuracy and regulatory compliance | Out of scope entirely |
| WhatsApp / social sharing buttons | Indian distribution reality makes WhatsApp relevant, but buttons are low-value if you have a shareable URL. Shareable link covers the use case better. | URL-state sharing |

---

## Feature Complexity Notes

Features that appear simple but have non-obvious implementation traps.

**Step-up SIP math (HIGH complexity risk)**
The step-up SIP uses a growing annuity formula: each year's monthly contributions are (1 + step-up%) higher than the last year's. The closed form involves a geometric series where the growth rate and the compounding rate interact. The specific trap: SIP compounds monthly but the step-up is annual. Mixing these two periods incorrectly (e.g., applying the step-up monthly or compounding the step-up) produces wrong results that are hard to spot without a reference dataset. Validate against a known-correct calculation from AMFI or a published textbook. Confidence in the formula is HIGH; confidence that first-pass implementations get it right is LOW.

**Goal-based reverse calc with step-up (HIGH complexity risk)**
The basic goal-based reverse calc (what monthly SIP achieves target X at rate R in N years) has a clean closed-form inversion. Add step-up and the closed form no longer inverts cleanly — you need a numerical solver (bisection or Newton-Raphson on the monthly amount). This is not hard to implement but it is a different category of code: iterative, with convergence tolerance to manage.

**INR number formatting (MEDIUM complexity risk)**
`Intl.NumberFormat('en-IN')` gives the correct digit grouping (e.g., 1,00,000) but does not produce "1 Lakh" or "10 Crore" word labels. A custom formatter is required for the labels Indian users expect. The formatter must handle the boundary cases: sub-lakh amounts show in rupees, 1L–99L show as "X Lakh", 1Cr+ show as "X Crore", and fractional lakhs/crores need rounding decisions. This formatter will be called everywhere; write it once and test it.

**Inflation-adjusted display (MEDIUM UX complexity, LOW math complexity)**
The math is `real_value = nominal_value / (1 + inflation_rate)^years`. The complexity is UX: users routinely confuse which number they are looking at. The chart or table must make it unambiguous whether a displayed value is nominal or real. Two common traps: labeling "today's equivalent" ambiguously, and showing real values in the year-by-year table without a clear column header.

**Scenario comparison view (MEDIUM complexity)**
The comparison feature requires that every calculator mode (basic SIP, goal-based, lump sum, step-up) emits a normalized scenario object with the same schema. If each calculator is built as a standalone with its own output shape, comparison becomes a retrofit. Design the data model first.

**Mobile chart interactions (MEDIUM complexity risk)**
Touch-based tooltip/hover interactions on line charts are a known pain point with Recharts and Chart.js. Users on mobile tap a chart and want to see the data point value — the default desktop hover behavior does not translate cleanly. This requires explicit touch event handling and may require switching chart libraries or using a wrapper.

**Shareable URL state (LOW complexity, but deferred)**
Encoding all calculator inputs into URL query params is straightforward but requires a decision on serialization format and max URL length (browsers vary; safe limit ~2000 chars). The PROJECT.md defers this, but the implementation is genuinely low effort if done during the initial state architecture phase. Retrofitting later is harder.

---

## Dependencies

Feature dependency chain — a feature listed below requires the feature it points to.

```
Saved scenarios → User accounts (auth)
  └── Named scenario save UI → Normalized scenario object schema

Comparison view → Normalized scenario object schema
  └── Normalized scenario schema → All calculator modes (basic, goal, lumpsum, step-up)

Growth-over-time chart → Yearly time-series data model
Year-by-year table → Yearly time-series data model
Inflation-adjusted values → Yearly time-series data model
  └── (All three share one data model — compute once, consume three times)

Goal-based reverse calc (with step-up) → Step-up SIP calculator (forward)
  └── Solver for reverse step-up → Forward step-up formula must be correct first

Benchmark comparison overlay (PPF/FD) → Basic SIP forward calc (for baseline)

SWP calculator → (standalone, no dependency on SIP calcs; parallel track)

Goal templates → Goal-based reverse calculator
  └── Templates are presets that populate the goal-based calc inputs

SIP + lumpsum hybrid → Basic SIP forward calc + Lump sum calculator
  └── FV = SIP_FV + Lumpsum_FV (additive, low coupling)
```

**Critical path implication:** The normalized scenario object schema must be designed before building individual calculators, or the comparison feature will require a rewrite of every calculator's output layer. This is the single highest-leverage architectural decision in v1.

---

## Sources

- Training data (cutoff August 2025): Groww, ET Money, Zerodha Coin/Varsity, Scripbox, ClearTax, Paytm Money, INDmoney, MoneyControl feature sets — MEDIUM confidence (unverified against live product state; recommend spot-checking Groww and ET Money calculators directly before finalizing roadmap)
- July 2024 Union Budget LTCG changes (equity MF tax: 12.5% above ₹1.25L, indexation removed for debt funds) — HIGH confidence within training data; recommend verifying against current CBDT/SEBI circular if tax-aware features are added to scope
- SEBI Investment Adviser Regulations 2013 (amended 2020) on fund recommendations — HIGH confidence
- AMFI SIP data and mobile traffic patterns — MEDIUM confidence (specific percentages unverified)
