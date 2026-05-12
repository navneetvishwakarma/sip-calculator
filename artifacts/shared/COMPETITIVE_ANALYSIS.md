# Competitive Analysis — SIP Calculator

**Date:** 2026-05-06
**Status:** Complete — translated from `.planning/research/FEATURES.md`
**Confidence note:** Based on training data (cutoff August 2025). Recommend spot-checking Groww and ET Money calculators directly before finalizing positioning decisions.

---

## Landscape Summary

The Indian SIP calculator market is crowded at the basic level (every fintech platform has one) but thin on quality at the advanced level. The primary differentiator opportunity is the combination: step-up SIP + scenario comparison + inflation-adjusted display + SWP. No single competitor does all four cleanly.

---

## Competitor Profiles

### Groww
- **Strengths:** Highest traffic in the segment; instant results; no login required; clean mobile UI; INR formatting correct
- **Weaknesses:** No step-up SIP calculator surfaced prominently; inflation-adjusted view not shown by default; no scenario comparison; no SWP calculator
- **Position:** Sets the minimum expectation floor for UX quality

### ET Money
- **Strengths:** Shows inflation-adjusted real value alongside nominal (strongest differentiation in segment); has SWP calculator; polished mobile UI
- **Weaknesses:** Goal-based and step-up less prominent; comparison not available
- **Position:** Closest to this product's ambition; gap is scenario comparison and step-up prominence

### Scripbox
- **Strengths:** Has step-up SIP calculator; has goal templates ("Child's education", "Retirement") with default durations and inflation-adjusted targets; clean educational framing
- **Weaknesses:** Less calculator depth; comparison not available
- **Position:** Best on guided goal-based use cases; gap is pure calculator depth

### ClearTax
- **Strengths:** Good SEO; trust signal (tax brand); covers basic SIP and lump sum
- **Weaknesses:** Calculator depth thin; no step-up, no comparison, no SWP
- **Position:** Traffic via tax brand spillover; weak on calculator quality

### Zerodha Varsity
- **Strengths:** Strong educational content around SIP; trusted brand
- **Weaknesses:** Calculator is secondary to content; limited interactivity
- **Position:** Educational resource, not a calculator destination

### INDmoney / Paytm Money / MoneyControl
- All have basic SIP; none stands out on advanced calculator features or comparison tools
- Mobile apps with calculators embedded; web experience secondary

---

## Feature Matrix

| Feature | Groww | ET Money | Scripbox | ClearTax | This Product |
|---------|-------|----------|----------|----------|-------------|
| Basic SIP forward | ✓ | ✓ | ✓ | ✓ | ✓ |
| Goal-based reverse | ✓ | ✓ | ✓ | ✓ | ✓ |
| Lump sum | ✓ | ✓ | ✓ | ✓ | ✓ |
| Step-up SIP | — | — | ✓ | — | ✓ |
| SIP + lump sum hybrid | — | — | — | — | ✓ |
| SWP (withdrawal plan) | — | ✓ | — | — | ✓ |
| Inflation-adjusted toggle | — | ✓ | partial | — | ✓ |
| Scenario comparison | — | — | — | — | ✓ |
| URL-state sharing | — | — | — | — | ✓ |
| Saved named scenarios | — | — | ✓ | — | ✓ (with auth) |
| No login to calculate | ✓ | ✓ | ✓ | ✓ | ✓ |
| INR lakh/crore formatting | ✓ | ✓ | ✓ | partial | ✓ |
| Mobile-first | ✓ | ✓ | ✓ | partial | ✓ |
| SEBI disclaimer | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## Table Stakes (Must-Have to Compete)

These are baseline expectations. Missing any loses users immediately:
- Basic SIP, lump sum, goal-based calculators
- No login required to calculate
- INR lakh/crore word formatting (not raw digit grouping)
- Mobile-first layout
- Sensible Indian defaults pre-populated (12% return, 6% inflation, 10-year duration, ₹5,000/month)
- SEBI disclaimer in footer

## Differentiators (Competitive Moat)

Features rare or absent in the market that create genuine advantage:
1. **Step-up SIP + scenario comparison together** — no competitor combines these cleanly
2. **Inflation-adjusted display by default** — ET Money does it; Groww (the leader) does not
3. **SWP calculator** — underserved; strong for the retirement-planning audience
4. **URL-state sharing** — enables viral distribution; none of the above do it

## Anti-Features (Explicitly Avoid)

| Anti-Feature | Why |
|--------------|-----|
| Fund-specific recommendations | SEBI RIA registration required; legal violation without it |
| KYC / account opening | Regulatory overhead; not the product's value |
| Live NAV feed | Vendor dependency; unnecessary for projection tool |
| "Guaranteed returns" framing | SEBI advertising guidelines prohibit it |
| Social feed / public portfolios | Out of scope; moderation overhead |
| Tax-filing integration | Regulatory accuracy requirements; out of scope |
