# Ideal Customer Profile — SIP Calculator

**Date:** 2026-05-06
**Status:** Complete — translated from `.planning/PROJECT.md` and research artifacts

---

## Primary ICP

**Indian retail investors, salaried, SIP-aware but math-averse**

- **Age:** 25–45
- **Income:** Middle to upper-middle income, salaried
- **Geography:** India (tier 1 and tier 2 cities; mobile traffic dominant)
- **SIP familiarity:** Knows what a SIP is and likely has one, but does not know the compound interest formula or how to model a step-up scenario
- **Device:** Majority mobile (70%+ on Indian fintech platforms per AMFI/industry patterns); must work on a 375px screen without compromise
- **Arrival path:** Social media (LinkedIn, Twitter/X, WhatsApp forward from a financial influencer or blog post), organic search ("SIP calculator online"), or direct recommendation
- **Inflation awareness:** High. Indian retail investors at this demographic are actively aware that 6% inflation erodes purchasing power; they want to see real value alongside nominal corpus

### Jobs to Be Done

1. "I invest ₹5,000/month at 12% for 20 years — how much will I have?" (forward planning)
2. "I want ₹1 Crore in 15 years — how much do I need to invest monthly?" (goal-based reverse)
3. "My salary increment will let me raise my SIP by 10% every year — how does that change my corpus?" (step-up)
4. "My bonus was ₹2 Lakh — I want to invest it plus keep my monthly SIP going — what's the combined outcome?" (hybrid)
5. "I'm retiring and have ₹50 Lakh — how long can I withdraw ₹30,000/month?" (SWP / decumulation)
6. "Should I invest ₹5K, ₹8K, or ₹12K per month? Show me all three at once." (comparison)

### Friction Points They Hate

- Having to create an account before seeing a single result
- Numbers in Western digit format (₹12,50,000 instead of ₹12.5 Lakh)
- Calculators that only do basic SIP but not step-up or goal-based
- Projections shown without inflation context — ₹1 Crore in 20 years sounds great until you see it's worth ₹31 Lakh in today's money
- Mobile layouts that require horizontal scrolling or have tiny tap targets

### What Builds Trust

- SEBI disclaimer present ("Returns are illustrative and not guaranteed. Consult a SEBI-registered investment advisor.")
- Sensible Indian defaults pre-populated (12% annual return, 6% inflation, 10-year duration, ₹5,000/month starting SIP)
- Results appear immediately on input change — no "calculate" button delay
- INR formatting matches how they think (₹X Lakh, ₹X Crore)

---

## Secondary ICP

**Power users: personal finance enthusiasts, DIY investors**

- Compares 2–4 scenarios side by side
- Saves named scenarios to revisit ("Retirement — aggressive" vs "Retirement — conservative")
- Returns to the tool regularly as their financial situation changes
- Creates an account specifically to access saved scenarios

This segment is smaller but higher engagement and higher retention. The core product (Phase 1–3) serves the primary ICP; Phase 4–6 deepens value for the secondary ICP.

---

## Explicit Non-ICP

- Users seeking fund-specific recommendations — SEBI requires RIA registration; this is out of scope
- Users who want tax-filing integration or LTCG calculation — regulatory complexity, out of scope
- Institutional/advisor users — different compliance needs, out of scope for v1
