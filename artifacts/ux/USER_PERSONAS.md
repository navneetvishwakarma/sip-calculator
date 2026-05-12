# User Personas — SIP Calculator

**Date:** 2026-05-12
**Source:** `artifacts/shared/ICP.md`, `artifacts/pm/PRD.md`

---

## Persona 1: Priya — The Salaried Planner (Primary ICP)

| Attribute | Detail |
|-----------|--------|
| Name | Priya Sharma |
| Age | 31 |
| Occupation | Mid-level software engineer, Bengaluru |
| Income | ₹18 LPA |
| Device | iPhone SE / Android mid-range, 375px viewport |
| SIP familiarity | Has 2 active SIPs via Zerodha Coin; knows the concept, cannot do the math |
| Technical comfort | High with apps, zero with financial formulas |
| Arrival path | WhatsApp forward from a friend, or organic search "SIP calculator 20 years" |

**Primary job-to-be-done:** "I invest ₹5,000/month — how much will I actually have in 15 years, and is it enough to buy a flat?"

**Secondary jobs:**
- "My salary just went up — if I step up my SIP 10% every year, how much extra does that get me?"
- "I want ₹50 Lakh in 10 years — what do I need to invest monthly?"

**Frustrations:**
- Calculators that show ₹12,50,000 instead of ₹12.5 Lakh — the number doesn't click
- Being forced to sign up before seeing any result
- Calculators that only do basic SIP — she can't model her annual increment
- Results that don't show whether ₹50 Lakh in 2036 is actually worth ₹50 Lakh
- Tap targets smaller than her thumb on a phone

**What builds trust:**
- SEBI disclaimer visible on the page
- Indian defaults already filled in — 12% return, ₹5,000/month, 10 years
- Results update instantly as she types — no "Calculate" button
- INR word format: ₹12.5 Lakh, ₹1.3 Crore

**Pain the product solves:** She knows she should be investing more but cannot visualise the difference between ₹5K/month and ₹10K/month over 20 years. The invested-vs-returns chart makes it visceral.

---

## Persona 2: Arjun — The DIY Scenario Builder (Secondary ICP)

| Attribute | Detail |
|-----------|--------|
| Name | Arjun Mehta |
| Age | 38 |
| Occupation | Product Manager, Mumbai |
| Income | ₹35 LPA |
| Device | MacBook Pro (desktop primary), also uses Android phone |
| SIP familiarity | Runs 4 SIPs; reads personal finance blogs; understands CAGR, XIRR |
| Technical comfort | High — comfortable with spreadsheets, financial jargon |
| Arrival path | Twitter/X post from a finance influencer, or direct from a blog article |

**Primary job-to-be-done:** "I want to compare my current SIP allocation against a more aggressive step-up scenario and a lump sum strategy side by side."

**Secondary jobs:**
- "Save my 'Retirement — aggressive' scenario and come back to it next month when I reassess"
- "Share this comparison link with my wife so she can see what I'm modelling"
- "My corpus is ₹1 Crore — I'm retiring in 5 years. How long does ₹40K/month withdrawal last?"

**Frustrations:**
- Having to re-enter all inputs every visit — no saved state
- Tools that do only one calculator at a time — no side-by-side
- Calculators that ignore inflation — ₹1 Crore in 2040 is not ₹1 Crore
- No way to share a specific calculation with someone else

**What builds trust:**
- Step-up SIP and SWP calculators present — rare on Indian tools
- Inflation-adjusted toggle with configurable rate
- URL sharing that restores exact inputs — not a screenshot
- Scenario save with a name he can set ("Retire — 10% step-up, 12% return")

**Pain the product solves:** He currently maintains a Google Sheet. The SIP Calculator replaces it with a shareable, mobile-friendly interface that handles edge cases (perpetual SWP, feasibility warnings) he'd have to build himself.

---

## Persona 3: Vikram — The Retirement Planner (Edge ICP, Phase 3+)

| Attribute | Detail |
|-----------|--------|
| Name | Vikram Rao |
| Age | 52 |
| Occupation | Government officer, Hyderabad (retiring in 5–8 years) |
| Income | ₹12 LPA + pension incoming |
| Device | Android budget phone (primary), desktop at office |
| SIP familiarity | Has EPF and PPF; unfamiliar with mutual fund SWP mechanics |
| Technical comfort | Low — prefers clear labels, dislikes jargon |
| Arrival path | Recommendation from a younger colleague or a finance WhatsApp group |

**Primary job-to-be-done:** "I will have ₹45 Lakh when I retire — if I withdraw ₹35,000/month, how long does it last? Does it last forever?"

**Secondary jobs:**
- "What return rate do I need for my corpus to never deplete?"
- Wants a printable or shareable summary to show his financial advisor

**Frustrations:**
- Jargon like "corpus", "annuity-due", "real rate of return" without explanation
- Calculators that show "error" instead of "this withdrawal is perpetual"
- Small text on mobile — difficulty reading dense results tables

**What builds trust:**
- Clear "Perpetual" label when withdrawal is sustainable indefinitely
- SEBI disclaimer — he trusts regulated tools
- Simple language in the feasibility warning if his goal is unrealistic

**Pain the product solves:** No Indian retail-facing tool makes the SWP "perpetual" result clear. He currently has no way to model this without a CA's spreadsheet.

---

## Persona Summary Table

| | Priya | Arjun | Vikram |
|---|---|---|---|
| Primary device | Mobile 375px | Desktop + mobile | Mobile budget |
| Tech comfort | Medium | High | Low |
| Core calculator | Standard SIP, Step-up | Comparison, SWP, Saved | SWP |
| Login needed? | No | Yes (Phase 5+) | No |
| Phase reached | Phase 2 value | Phase 4–6 value | Phase 3 value |
| Arrival motivation | "How much will I have?" | "Compare and save" | "Will my corpus last?" |
