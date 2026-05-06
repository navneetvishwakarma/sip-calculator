# Requirements — SIP Calculator

## v1 Requirements

### Calculators

- [ ] **CALC-01**: User can calculate standard SIP: enter monthly amount, annual return rate, and duration → see projected corpus and total invested
- [ ] **CALC-02**: User can calculate goal-based SIP: enter target corpus, annual return rate, and duration → see required monthly investment
- [ ] **CALC-03**: User can calculate lump sum growth: enter one-time investment, annual return rate, and duration → see projected corpus
- [ ] **CALC-04**: User can calculate step-up SIP: enter starting monthly amount, annual step-up percentage, return rate, and duration → see projected corpus
- [ ] **CALC-05**: User can calculate SIP + lump sum hybrid: enter a one-time amount today plus monthly SIP → see combined projected corpus
- [ ] **CALC-06**: User can calculate SWP (Systematic Withdrawal Plan): enter corpus, monthly withdrawal amount, and return rate → see duration until corpus is depleted (or perpetual if return exceeds withdrawal)

### Visualization

- [ ] **VIZ-01**: User sees a growth-over-time line chart showing corpus value year by year
- [ ] **VIZ-02**: User sees an invested-vs-returns donut or stacked chart showing total invested vs total gains
- [ ] **VIZ-03**: User sees a year-by-year breakdown table with columns: year, monthly investment, total invested to date, interest earned, corpus value
- [ ] **VIZ-04**: User can toggle inflation-adjusted (real) values alongside nominal corpus, with a configurable inflation rate input

### Scenario Comparison

- [ ] **COMP-01**: User can compare 2–4 calculator scenarios side by side in a single view (client-side only, not persisted)

### Sharing

- [ ] **SHARE-01**: Calculator state (all inputs) is encoded into the URL so any calculation can be bookmarked or shared via link

### User Accounts

- [ ] **AUTH-01**: User can create an account with email and password
- [ ] **AUTH-02**: User can log in and stay logged in across sessions
- [ ] **AUTH-03**: User can log out

### Saved Scenarios

- [ ] **SAVE-01**: Logged-in user can save a named snapshot of any calculator result
- [ ] **SAVE-02**: Logged-in user can view a list of their saved scenarios
- [ ] **SAVE-03**: Logged-in user can load a saved scenario (restores all inputs)
- [ ] **SAVE-04**: Logged-in user can delete a saved scenario

### UX & Polish

- [ ] **UX-01**: All currency values display in Indian lakh/crore word format (e.g., "₹12.5 Lakh", "₹2.3 Crore") not raw digit grouping
- [ ] **UX-02**: All calculator forms are pre-populated with sensible Indian defaults (12% annual return, 6% inflation, 10-year duration, ₹5,000/month)
- [ ] **UX-03**: App is mobile-first and fully usable on small screens
- [ ] **UX-04**: Goal-based calculator shows a feasibility warning when the required monthly SIP is unrealistically high (e.g., exceeds ₹10 lakh/month)
- [ ] **UX-05**: SEBI disclaimer is present in the footer on all pages ("Returns are illustrative and not guaranteed. Consult a SEBI-registered investment advisor.")

---

## v2 Requirements (Deferred)

- User can export a calculation as PDF
- User can share a named comparison set (persisted, not just URL state)
- Tax-aware mode (LTCG calculation post-redemption)
- Admin usage dashboard
- **React Native mobile app** — shares `packages/core` calc engine from the monorepo; web app is v1, mobile is v2

---

## Out of Scope

- **Live NAV / mutual fund data** — adding a fund data feed introduces a vendor dependency and is out of scope; user supplies their own expected return rate
- **Fund-specific recommendations** — SEBI requires RIA registration for personalized fund advice; this tool is a projection calculator only
- **Social features** (following, public portfolios, comments) — out of scope

---

## Traceability

> Filled by roadmapper. Maps each REQ-ID to the phase that delivers it.

| REQ-ID | Phase |
|--------|-------|
| CALC-01 through CALC-06 | — |
| VIZ-01 through VIZ-04 | — |
| COMP-01 | — |
| SHARE-01 | — |
| AUTH-01 through AUTH-03 | — |
| SAVE-01 through SAVE-04 | — |
| UX-01 through UX-05 | — |
