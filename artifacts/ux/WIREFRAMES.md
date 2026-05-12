# Wireframes — SIP Calculator

**Date:** 2026-05-12
**Source:** `artifacts/pm/PRD.md`, `artifacts/ux/USER_FLOWS.md`
**Format:** Component tree notation. Mobile-first (375px base).

**Phase-gate note:** Through Phase 4, auth state is mocked as permanently logged-out. The `UserMenu` logged-in state (Screen 9), the "Saved Scenarios" nav link, the Save button's logged-in path, and all Screens 5–6 are unreachable until Phase 5 ships AUTH-02. Implement these screens as specified but do not wire them to a real session check until Phase 5.

---

## Screen 1: Calculator Page (Main)

**Requirements:** CALC-01–06, UX-01, UX-02, UX-03, UX-05
**Purpose:** The user selects a calculator type, enters inputs, and sees a live result without any login or navigation.
**Trigger:** Any entry point — direct URL, shared link, first visit.

**Layout:**

```
<body>
  <Nav />                          ← full width, sticky, 56px height
  <main>
    <section.calculator-shell>     ← max-width 640px, centered, px-16
      <CalcTypeSelector />         ← tab bar, 6 tabs, scrollable on mobile
      <CalcForm />                 ← inputs for active calculator type
      <ResultsPanel />             ← live result output
      <YearlyBreakdownTable />     ← below result, horizontally scrollable
    </section>
  </main>
  <Footer />                       ← SEBI disclaimer, full width
</body>
```

**Components:**

- **Nav** / default / logged-out: Logo left | "Sign in" link right (text button, not primary button)
- **CalcTypeSelector** / tab-bar / 6-item: Tabs = "Standard SIP" | "Goal-Based" | "Lump Sum" | "Step-Up SIP" | "SIP + Lump Sum" | "SWP". Horizontal scroll on 375px. Active tab: primary colour underline + bold weight. Inactive tab: text-muted colour.
- **CalcForm** / Standard SIP default / filled: Three input groups stacked vertically with 24px gap
  - InputGroup: label "Monthly SIP Amount" | Input type=number | prefix "₹" | default value 5000
  - InputGroup: label "Expected Annual Return" | Input type=number | suffix "%" | default value 12
  - InputGroup: label "Investment Duration" | Input type=number | suffix "Years" | default value 10
  - No submit button. Inputs trigger recalculation on `onChange`.
- **ResultsPanel** / with-result / default: Card component. Three metric rows:
  - Row 1: label "Projected Corpus" | value (primary, large text, e.g. "₹11.6 Lakh")
  - Row 2: label "Total Invested" | value (body, e.g. "₹6 Lakh")
  - Row 3: label "Total Gains" | value (success-green, e.g. "₹5.6 Lakh")
  - Below metrics: "Add to Comparison" button (secondary) | "Copy Link" button (ghost) | "Save" button (ghost, logged-out: triggers sign-in redirect)
- **YearlyBreakdownTable** / default / scrollable: HTML table with overflow-x: auto wrapper. Columns: Year | Monthly Investment | Total Invested | Interest Earned | Corpus Value. All monetary values in INR word format. First row = Year 1. Last row = selected duration year. Sticky first column (Year) on mobile scroll.
- **Footer** / default: SEBI disclaimer text: "Returns are illustrative and not guaranteed. Consult a SEBI-registered investment advisor." | text-muted colour | text-xs | centred | 48px padding vertical

**States:**

- Empty: Not applicable — Indian defaults always pre-populate the form (UX-02).
- Loading: Page hydration skeleton: results card area shows 3 shimmer lines at approximate text heights; table area shows 5 shimmer rows.
- Error (invalid input): Input border becomes error-red; inline error copy appears 4px below input field. Results panel retains last valid calculation. Recalculation does not run while any input is invalid.

**Transitions:**

- Tab change in CalcTypeSelector → Form fields animate out/in (150ms fade); defaults for new type populate; result updates immediately
- Any input `onChange` (valid) → ResultsPanel and YearlyBreakdownTable update synchronously
- "Add to Comparison" click → ComparisonTray count badge increments; button shows "Added" for 1.5 seconds then reverts
- "Copy Link" click → URL encoded and copied; toast "Link copied" appears bottom-centre for 2 seconds
- "Save" click (logged-out, Phases 2–4) → Redirect to `/auth/sign-in?redirect=[current-url]`
- "Save" click (logged-in, Phase 5+) → Inline save prompt slides down within ResultsPanel (see Screen 5)

---

## Screen 2: Calculator Page — Form Variants by Calculator Type

**Requirements:** CALC-01–06, UX-02, UX-04
**Purpose:** Defines the exact form fields per calculator type. Each is a variant of the CalcForm component.
**Trigger:** Tab selection in CalcTypeSelector.

**Goal-Based SIP form fields:**
- InputGroup: "Target Corpus Amount" | ₹ prefix | default ₹50,00,000 (displayed as "₹50 Lakh")
- InputGroup: "Expected Annual Return" | % suffix | default 12
- InputGroup: "Investment Duration" | Years suffix | default 10
- Result displays: "Required Monthly SIP: ₹X.X Lakh" (large, primary)
- Feasibility Warning: Banner component, warning-yellow background, appears below result when required monthly SIP > ₹10 Lakh. Copy: "Required monthly investment of [amount] may not be feasible for most individual investors. Try extending your duration or reducing your target." (UX-04)

**Lump Sum form fields:**
- InputGroup: "One-Time Investment" | ₹ prefix | default ₹1,00,000 ("₹1 Lakh")
- InputGroup: "Expected Annual Return" | % suffix | default 12
- InputGroup: "Investment Duration" | Years suffix | default 10
- Result: Projected Corpus | Amount Invested (= lump sum) | Gains

**Step-Up SIP form fields:**
- InputGroup: "Starting Monthly SIP" | ₹ prefix | default ₹5,000
- InputGroup: "Annual Step-Up" | % suffix | default 10
- InputGroup: "Expected Annual Return" | % suffix | default 12
- InputGroup: "Investment Duration" | Years suffix | default 10
- Result: Projected Corpus | Total Invested | Total Gains

**SIP + Lump Sum form fields:**
- InputGroup: "Monthly SIP Amount" | ₹ prefix | default ₹5,000
- InputGroup: "One-Time Lump Sum" | ₹ prefix | default ₹50,000
- InputGroup: "Expected Annual Return" | % suffix | default 12
- InputGroup: "Investment Duration" | Years suffix | default 10
- Result: Combined Projected Corpus | SIP Component | Lump Sum Component | Total Gains

**SWP form fields:**
- InputGroup: "Starting Corpus" | ₹ prefix | default ₹50,00,000 ("₹50 Lakh")
- InputGroup: "Monthly Withdrawal" | ₹ prefix | default ₹30,000
- InputGroup: "Expected Annual Return" | % suffix | default 12
- Result: "Your corpus will last [X years Y months]" OR "Your corpus will sustain withdrawals indefinitely." | Perpetual Badge (success-green) shown when result = perpetual

**Inflation Toggle (Phase 3 — VIZ-04):**
- Toggle component at top of ResultsPanel: "Show inflation-adjusted values" (off by default)
- When toggled on: additional InputGroup appears below toggle: "Inflation Rate" | % suffix | default 6
- Column headers in YearlyBreakdownTable append "(Real)" when toggle is active
- Toggle state is per-session; does not persist across refreshes

---

## Screen 3: Results with Charts (Phase 3)

**Requirements:** VIZ-01, VIZ-02, VIZ-04
**Purpose:** After calculation, user sees growth visualised as a line chart and an invested-vs-returns chart below the numeric result.
**Trigger:** Phase 3 active; result is available.

**Layout:**

```
<ResultsPanel>           ← same as Screen 1
<ChartsSection>          ← below ResultsPanel, above YearlyBreakdownTable
  <InflationToggle />    ← toggle + inflation rate input when on
  <GrowthLineChart />    ← corpus value year by year (Recharts LineChart)
  <InvestedVsGainsChart /> ← donut or stacked bar (Recharts)
</ChartsSection>
<YearlyBreakdownTable /> ← unchanged
```

**Components:**

- **GrowthLineChart** / default: Recharts LineChart. X-axis: Year (1 to N). Y-axis: Corpus value in INR word format (abbreviated: "10L", "1Cr"). Single line (corpus growth). Tooltip shows full INR word value on hover. For SWP: single declining line reaching ₹0 or levelling at perpetual corpus. Chart height 220px mobile / 280px desktop. Chart colour: primary token.
- **GrowthLineChart** / comparison (Phase 4): Multiple lines, each a scenario colour from chart palette.
- **GrowthLineChart** / inflation-toggle-on: Two lines — Nominal (primary colour) and Inflation-Adjusted (neutral-400). Legend below chart: "Nominal" | "Real (adjusted for inflation)".
- **InvestedVsGainsChart** / default: Recharts PieChart (donut). Two segments: Total Invested (neutral-300) | Total Gains (success-green). Centre label: total corpus in INR word format. Legend below: "Total Invested: ₹X Lakh" | "Total Gains: ₹X Lakh".
- **InvestedVsGainsChart** / SWP: Not shown for SWP calculator (SWP is decumulation, not accumulation). Chart area replaced with a depletion summary card instead.
- **InflationToggle** / off (default): Toggle switch + label "Show real (inflation-adjusted) values". Inflation input hidden.
- **InflationToggle** / on: Toggle active; InputGroup "Inflation Rate %" appears inline; default 6.

**States:**

- Empty: Not applicable — charts require a valid result; defaults always produce one.
- Loading: Chart area shows a shimmer rectangle (220px height) while Recharts bundle loads.
- Error: If chart data is malformed: chart area hides; YearlyBreakdownTable remains visible as fallback.

**Transitions:**

- InflationToggle on → inflation input slides in (200ms); charts add second line; table column headers update
- InflationToggle off → inflation input slides out; charts revert to single line

---

## Screen 4: Scenario Comparison View (Phase 4)

**Requirements:** COMP-01
**Purpose:** User views 2–4 calculator scenarios side by side to compare projected outcomes.
**Trigger:** User clicks "Compare" in nav or "View Comparison" from ComparisonTray.

**Layout (mobile — stacked cards):**

```
<main>
  <ComparisonHeader>        ← "Comparing X scenarios" | "Clear all" ghost button
  <ComparisonScenarioList>  ← vertical scroll on mobile
    <ScenarioCard />        ← one per scenario, full width on mobile
    <ScenarioCard />
    …
  </ComparisonScenarioList>
  <OverlayChart />          ← growth-over-time with all scenario lines overlaid
  <MetricComparisonTable /> ← side-by-side table: scenarios as columns, metrics as rows
</main>
```

**Layout (desktop — columns):**

```
<ComparisonHeader>
<ComparisonGrid>  ← CSS grid, 2–4 columns depending on scenario count
  <ScenarioCard /> × N
</ComparisonGrid>
<OverlayChart />
<MetricComparisonTable />
```

**Components:**

- **ScenarioCard** / default: Card with colour-coded left border (scenario colour from chart palette). Content: scenario label (auto-generated e.g. "Scenario 1") | calculator type badge | key inputs summary (e.g. "₹5,000/mo · 12% · 10yr") | key metrics (Projected Corpus, Total Invested, Total Gains) in INR word format | "Remove" × button top-right | "Edit" (ghost) link that returns user to calculator with this scenario's inputs loaded
- **OverlayChart** / default: Recharts LineChart with one line per scenario. Each line uses its scenario colour. X-axis: Year. Y-axis: Corpus. Legend below: scenario labels with colour swatches.
- **MetricComparisonTable** / default: HTML table. Rows = metrics (Projected Corpus, Total Invested, Total Gains, Duration). Columns = scenarios. Best value in each row highlighted (bold, success-green background). All monetary cells in INR word format.

**States:**

- Empty: Full-page empty state. Copy: "Add scenarios from the calculator to compare them side by side." Button: "Go to Calculator" (primary).
- Loading: Not applicable — client-side only.
- Error: Not applicable — all data is local React state.

**Transitions:**

- "Remove" click → ScenarioCard fades out (150ms); grid reflows; OverlayChart and MetricComparisonTable update
- "Edit" click → redirect to calculator page with scenario inputs restored via URL params
- "Clear all" click → confirmation inline prompt → all scenarios cleared → empty state shown

---

## Screen 5: Save Scenario — Inline Prompt

**Requirements:** SAVE-01
**Purpose:** Logged-in user assigns a name to the current calculator state and saves it.
**Trigger:** Clicking "Save" in ResultsPanel while authenticated (Phase 5+).
**Phase gate:** This screen is unreachable until Phase 5 ships AUTH-02. Through Phase 4, clicking "Save" redirects to sign-in.

**Layout:**

```
<ResultsPanel>
  …metrics…
  <SavePrompt>           ← slides down within ResultsPanel (not a modal)
    <Input.scenarioName />
    <Button.save />
    <Button.cancel />    ← ghost
  </SavePrompt>
```

**Components:**

- **SavePrompt** / visible: Inline panel (not a Dialog/modal). Appears below the action buttons row within ResultsPanel.
- **Input.scenarioName** / default: Text input. Placeholder: "Name this scenario". Pre-populated with auto-generated name: "[Type] — ₹[amount]/mo — [duration]yr" (e.g., "Standard SIP — ₹5,000/mo — 10yr"). Max 60 characters.
- **Button.save** / primary: Label "Save scenario". Shows spinner while POST in flight; disabled during request.
- **Button.cancel** / ghost: Label "Cancel". Collapses SavePrompt on click.

**States:**

- Empty (name field): Save button remains active; name defaults to auto-generated value if user clears the field.
- Loading: Save button = spinner + disabled; cancel button = disabled.
- Error: "Couldn't save. Please try again." — inline error text below save button; buttons re-enabled.

**Transitions:**

- "Save scenario" click → POST `/api/scenarios`; spinner → success toast "Scenario saved." → SavePrompt collapses → Save button shows "Saved" (checkmark) for 2 seconds
- "Cancel" click → SavePrompt collapses (150ms slide-up)

---

## Screen 6: Saved Scenarios List (Phase 6)

**Requirements:** SAVE-02, SAVE-03, SAVE-04
**Purpose:** Logged-in user views, loads, or deletes their saved scenarios.
**Trigger:** User clicks "Saved Scenarios" in nav (visible only when logged in, Phase 5+).
**Phase gate:** This screen and its nav link are unreachable until Phase 5 ships AUTH-02.

**Layout:**

```
<main>
  <PageHeader>                  ← "Saved Scenarios" h1
  <ScenarioList>                ← list of SavedScenarioRow items
    <SavedScenarioRow />        ← one per saved scenario
    …
  </ScenarioList>
</main>
```

**Components:**

- **PageHeader**: h1 "Saved Scenarios" | subtext "Load any scenario to restore your inputs."
- **SavedScenarioRow** / default: Full-width row with 16px vertical padding. Content: scenario name (body-bold) | type badge (Badge component, secondary variant) | projected corpus in INR word format (text-muted) | date saved (text-xs, text-muted) | Load button (secondary, right-aligned) | Delete icon button (ghost, destructive, far right). Separator line below each row.
- **SavedScenarioRow** / delete-confirm: Inline confirmation replaces row content: "Delete '[name]'? This cannot be undone." | "Yes, delete" button (destructive) | "Cancel" link

**States:**

- Empty: Full-page empty state. Icon (save/floppy disk). Copy: "You haven't saved any scenarios yet." | "Go to Calculator" primary button.
- Loading: 3 shimmer rows (name width 50%, type badge width 10%, corpus width 20%, date width 15%, load button width 10%).
- Error (load): toast "Couldn't load this scenario. Please try again."
- Error (delete): toast "Couldn't delete. Please try again." Row remains; confirmation prompt resets.

**Transitions:**

- "Load" click → redirect to `/` with scenario's URL params; inputs restored from saved ScenarioParams
- "Delete" icon click → row expands to inline confirmation state
- "Yes, delete" click → DELETE `/api/scenarios/:id`; spinner on delete button; row fades out on success

---

## Screen 7: Sign In

**Requirements:** AUTH-02
**Purpose:** Returning user authenticates to access saved scenarios and the save feature.
**Trigger:** Clicking "Sign in" in nav, or redirect from a gated action with `?redirect` param.

**Layout:**

```
<main.auth-shell>          ← max-width 400px, centred, top margin 64px
  <AuthCard>
    <Logo />
    <ContextBanner />      ← conditional: shown only when ?redirect present
    <h1>Sign in</h1>
    <Form.signIn />
    <Divider />
    <Link.register />
  </AuthCard>
</main>
```

**Components:**

- **ContextBanner** / conditional: Banner (info-blue background) shown when `?redirect` is in URL. Copy: "Sign in to save your scenario and pick up where you left off."
- **Form.signIn**: Email input (type=email, label "Email") | Password input (type=password, label "Password") | "Sign in" button (primary, full width)
- **Link.register**: "Don't have an account? Create one" — navigates to `/auth/register`

**States:**

- Empty (fresh): Form fields blank; "Sign in" button active.
- Loading: "Sign in" button = spinner + disabled; fields disabled.
- Error (wrong credentials): Inline error below password field: "Incorrect email or password."
- Error (server): Toast "Something went wrong. Please try again."

**Transitions:**

- Successful sign-in → redirect to `?redirect` destination, or `/` if no redirect param

---

## Screen 8: Register

**Requirements:** AUTH-01
**Purpose:** New user creates an account.
**Trigger:** "Create account" link from Sign In screen, or direct URL `/auth/register`.

**Layout:**

```
<main.auth-shell>          ← same shell as Sign In
  <AuthCard>
    <Logo />
    <h1>Create account</h1>
    <Form.register />
    <Divider />
    <Link.signIn />
  </AuthCard>
</main>
```

**Components:**

- **Form.register**: Email input | Password input | Confirm Password input | "Create account" button (primary, full width)
- **Link.signIn**: "Already have an account? Sign in"

**States:**

- Loading: Button spinner + fields disabled while request in flight.
- Error (email taken): Inline error below email: "An account with this email already exists. Sign in instead?" with "Sign in" link.
- Error (password mismatch): Client-side validation; inline error below confirm password: "Passwords don't match."
- Error (password too short): Inline error: "Password must be at least 8 characters."
- Error (server): Toast "Something went wrong. Please try again."

**Transitions:**

- Successful registration → session cookie set → redirect to `/` or `?redirect` destination

---

## Screen 9: Nav States

**Requirements:** AUTH-02, AUTH-03, SAVE-02
**Purpose:** Defines the navigation component in both logged-out and logged-in states.
**Trigger:** Auth state change.
**Phase gate:** Through Phase 4, auth state is mocked as permanently logged-out. The logged-in state (UserMenu, "Saved Scenarios" nav link) is unreachable until Phase 5 ships AUTH-02. Implement both states in the component but only the logged-out branch is exercisable in Phases 2–4.

**Layout (mobile — 375px):**

```
<nav>
  <Logo />                    ← left, links to /
  <NavRight>
    [logged-out]  <SignInLink />
    [logged-in]   <UserMenu />   ← avatar/email truncated + dropdown trigger
  </NavRight>
</nav>
```

**Layout (desktop):**

```
<nav>
  <Logo />
  <NavLinks>               ← only visible desktop
    "Calculator" link
    [logged-in only] "Saved Scenarios" link
  </NavLinks>
  <NavRight>
    [logged-out] "Sign in" text button | "Create account" primary button
    [logged-in]  <UserMenu />
  </NavRight>
</nav>
```

**Components:**

- **Logo**: App name "SIP Calculator" in heading weight, primary colour. Links to `/`.
- **SignInLink** (logged-out, mobile): Text link, text-muted. "Sign in"
- **UserMenu** (logged-in, Phase 5+): Dropdown trigger showing truncated email (max 20 chars + "…"). Dropdown items: "Saved Scenarios" | "Sign out" (destructive colour text, not destructive button)
- **UserMenu** / open: Dropdown panel with border and shadow-sm. Items: full email (untruncated, text-xs, text-muted) | "Saved Scenarios" | "Sign out"

**States:**

- Logged-out (active through Phase 4): Sign in link only (desktop: + "Create account" button)
- Logged-in (Phase 5+): UserMenu only
- Loading (session check on page load, Phase 5+): Nav right side shows skeleton shimmer 80×32px until session resolved

**Transitions:**

- "Sign out" click → POST `/api/auth/sign-out` → Nav updates to logged-out state (no full page reload required if using React state)
