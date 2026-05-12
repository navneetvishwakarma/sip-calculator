# User Flows — SIP Calculator

**Date:** 2026-05-12
**Source:** `artifacts/pm/PRD.md`, `artifacts/shared/ICP.md`

All flows are numbered steps. Actor prefix: **U** = User action, **S** = System response.
Requirement IDs reference `artifacts/pm/PRD.md`.

---

## Flow 1: First Visit — Anonymous User Calculates Standard SIP

**Persona:** Priya (primary ICP)
**Requirements:** CALC-01, UX-01, UX-02, UX-03, UX-05
**Entry:** Direct URL, search result, or WhatsApp link

### Happy Path

1. U — Lands on `/` (calculator page)
2. S — Renders calculator form with Indian defaults pre-populated: Monthly SIP ₹5,000 | Annual Return 12% | Duration 10 years | Calculator type = Standard SIP
3. S — Immediately computes result with defaults; displays projected corpus (₹11.6 Lakh), total invested (₹6 Lakh), and total gains (₹5.6 Lakh) in INR word format
4. S — Year-by-year breakdown table rendered below results (Year | Monthly Investment | Total Invested | Interest Earned | Corpus Value)
5. S — SEBI disclaimer visible in footer: "Returns are illustrative and not guaranteed. Consult a SEBI-registered investment advisor."
6. U — Changes Monthly SIP to ₹10,000
7. S — Re-computes immediately on input change (no submit button required); updates result display and table
8. U — Scrolls through year-by-year table on mobile
9. S — Table scrolls horizontally without breaking page layout; all columns remain readable

### Empty State

- Not applicable. Form is never empty — Indian defaults are always pre-populated (UX-02). There is no blank-slate state for first-time visitors.

### Loading State

- Calculation is synchronous (client-side, no network call). No spinner needed.
- S — If the page itself is loading (initial hydration): show skeleton placeholder for the results panel only. Form fields are static HTML — no skeleton needed.
- Skeleton spec: results card area shows 3 shimmer lines (corpus value, total invested, total gains) at approximate text heights.

### Error State

- If a user enters a non-numeric or zero value: S — Input field border turns error-red; inline error copy appears below the field: "Enter a number greater than 0". Results panel shows last valid calculation, not an error state.
- If all fields are cleared and no valid calculation can run: S — Results panel shows the default-state result (Indian defaults), not an error. This cannot happen in normal use because defaults always populate.

---

## Flow 2: Switching Calculator Types

**Persona:** Priya or Arjun
**Requirements:** CALC-01 through CALC-06, UX-02
**Entry:** From any calculator result state

### Happy Path

1. U — Taps/clicks calculator type selector (tab bar or dropdown, see WIREFRAMES.md)
2. S — Active calculator type highlights; form fields transition to show inputs relevant to the selected type
3. S — Fields specific to the new type populate with their defaults; fields from the previous type not present in the new type disappear
4. S — Result panel updates immediately with the new calculator's output for default inputs
5. U — Modifies inputs for the new calculator type
6. S — Re-computes and updates result display

**Type-specific default sets:**
- Standard SIP: Monthly ₹5,000 | Rate 12% | Duration 10Y
- Goal-Based: Target ₹50 Lakh | Rate 12% | Duration 10Y → required monthly investment displayed
- Lump Sum: One-time ₹1 Lakh | Rate 12% | Duration 10Y
- Step-Up SIP: Monthly ₹5,000 | Step-up 10%/yr | Rate 12% | Duration 10Y
- SIP + Lump Sum: Monthly ₹5,000 | One-time ₹50,000 | Rate 12% | Duration 10Y
- SWP: Corpus ₹50 Lakh | Monthly withdrawal ₹30,000 | Rate 12%

### Error State

- S — If the active URL has a `type` query param not in the valid set: S — defaults to Standard SIP; no error shown to user.

### Empty State

- Not applicable. Type switch always produces a new default state.

### Loading State

- No network call. No loading state needed.

---

## Flow 3: Goal-Based Calculator with Feasibility Warning

**Persona:** Priya
**Requirements:** CALC-02, UX-04
**Entry:** User selects Goal-Based calculator type

### Happy Path

1. U — Selects "Goal-Based SIP" from calculator type selector
2. S — Form shows: Target Amount | Annual Return | Duration inputs; pre-populated defaults: ₹50 Lakh | 12% | 10 years
3. S — Computes required monthly SIP from defaults; displays result in results panel (e.g. "You need to invest ₹X/month"). Note: exact figure is derived from the CALC-02 engine at runtime — do not hardcode in UI copy.
4. U — Increases target to ₹5 Crore, reduces duration to 3 years
5. S — Computes required monthly SIP; result exceeds ₹10 Lakh/month threshold
6. S — Displays feasibility warning banner directly below the result value: "This requires a monthly investment of ₹1.4 Crore — likely beyond individual investment capacity. Consider increasing your duration or adjusting your target."
7. U — Adjusts duration to 20 years
8. S — Required monthly SIP drops to a feasible range; warning banner disappears

### Warning Copy (exact)

> "Required monthly investment of [amount] may not be feasible for most individual investors. Try extending your duration or reducing your target."

### Empty State

- Not applicable. Defaults are pre-populated.

### Loading State

- Calculation is synchronous. No loading state.

### Error State

- If target amount is 0 or blank: S — Input field shows inline error "Enter a target amount greater than 0". Results panel holds last valid calculation.

---

## Flow 4: SWP Calculator Reaching "Perpetual" Result

**Persona:** Vikram
**Requirements:** CALC-06
**Entry:** User selects SWP calculator type

### Happy Path

1. U — Selects "SWP" from calculator type selector
2. S — Form shows: Corpus | Monthly Withdrawal | Annual Return; pre-populated: ₹50 Lakh | ₹30,000 | 12%
3. S — Computes duration. If corpus grows faster than withdrawals: result = "Perpetual"
4. S — Displays result: "Your corpus will sustain withdrawals indefinitely at this rate." Corpus does not deplete.
5. U — Increases monthly withdrawal to ₹60,000
6. S — Corpus now depletes; result switches to: "Your corpus will last approximately 14 years 3 months."
7. S — Year-by-year table updates: shows corpus value declining each year until ₹0
8. U — Reduces withdrawal back to ₹30,000
9. S — Result switches back to "Perpetual"; year-by-year table shows corpus growing

### Perpetual Result Display

- Result card shows a distinct "Perpetual" badge (success-green colour token) alongside the stable corpus value in Year 10 / Year 20 projections.
- No depletion date shown.
- Table shows corpus value increasing or stable across all years.

### Empty State

- Not applicable. Defaults are pre-populated.

### Loading State

- Synchronous. No loading state.

### Error State

- If corpus is 0 or monthly withdrawal is 0: S — inline field errors; result panel holds last valid state.
- If annual return is 0 and withdrawal > 0: corpus depletes at a predictable rate. System shows depletion timeline, no error.

---

## Flow 5: Scenario Comparison — Add, View, Remove

**Persona:** Arjun
**Requirements:** COMP-01
**Entry:** User is on the calculator page with a result showing

### Happy Path — Add Scenario

1. U — Clicks "Add to comparison" button (visible in results panel)
2. S — Current scenario (all inputs + result) added to comparison tray (max 4 scenarios)
3. S — Comparison tray indicator in header updates: "2 scenarios" badge
4. U — Changes inputs to a different configuration (e.g., ₹10,000/month instead of ₹5,000)
5. U — Clicks "Add to comparison" again
6. S — Second scenario added to tray
7. U — Clicks "Compare" or navigates to comparison view
8. S — Comparison view renders all scenarios side by side: each scenario shows its key metrics (total invested, projected corpus, gains) and the growth-over-time chart for all scenarios overlaid

### Happy Path — Remove Scenario

1. U — In comparison view, clicks "Remove" (× icon) on a scenario card
2. S — Scenario removed from tray; remaining scenarios re-laid out; count badge decrements
3. U — Removes all scenarios
4. S — Comparison view shows empty state: "Add scenarios from the calculator to compare them side by side."

### Empty State

- S — Comparison view with 0 scenarios: empty illustration + copy: "Add up to 4 scenarios from the calculator to compare outcomes side by side." + "Go to Calculator" CTA button.

### Loading State

- Client-side only. No network call. No loading state.

### Error State

- If user tries to add a 5th scenario: S — "Add to comparison" button becomes disabled; tooltip: "Maximum 4 scenarios. Remove one to add another."
- If user attempts to add a scenario with invalid inputs: prevented by form validation before "Add to comparison" is enabled.

---

## Flow 6: URL-State Sharing

**Persona:** Arjun
**Requirements:** SHARE-01
**Entry:** User has a calculator result showing

### Happy Path

1. U — Clicks "Copy Link" button in results panel
2. S — All current calculator inputs encoded into URL query params; URL copied to clipboard
3. S — Transient success toast: "Link copied. Anyone with this link will see your exact inputs."
4. U — Pastes link in WhatsApp / email / browser
5. Recipient — Opens URL in new tab
6. S — Page loads with all inputs restored from URL params: calculator type, all field values
7. S — Result computed from restored inputs; result panel shows same output the sender saw
8. S — URL in address bar matches the shared URL exactly (no redirect, no hash change)

### Error State — Malformed URL Params

1. S — URL params are present but one or more values are invalid (non-numeric, out of range)
2. S — System falls back to Indian defaults for the invalid fields only; valid fields are restored as-is
3. S — No error shown to user; page loads normally with available data

### Error State — Unknown Calculator Type in URL

1. S — `type` param is present but unrecognised
2. S — Defaults to Standard SIP; all other valid params applied if applicable

### Empty State

- Not applicable. Copy Link always has current inputs to encode.

### Loading State

- On page load with URL params: S — same hydration skeleton as Flow 1. No additional loading indicator.

---

## Flow 7: Save Scenario — Logged-In User

**Persona:** Arjun (authenticated)
**Requirements:** SAVE-01, SAVE-02, SAVE-03, SAVE-04
**Entry:** User has a calculation result; user is authenticated (Phase 5 session active)

### Happy Path — Save

1. U — Clicks "Save" button in results panel
2. S — Inline save prompt appears (not a full modal): text field pre-populated with auto-generated name ("Standard SIP — ₹5,000/mo — 10yr")
3. U — Edits name to "Retirement — conservative"
4. U — Clicks "Save scenario"
5. S — POST to `/api/scenarios`; optimistic UI: item appears instantly in saved list
6. S — Success toast: "Scenario saved."
7. S — Save button state changes to "Saved" (disabled, checkmark icon) for current inputs

### Happy Path — Load Saved Scenario

1. U — Navigates to "Saved Scenarios" page
2. S — List of saved scenarios: name, calculator type, key metric (projected corpus), date saved
3. U — Clicks a scenario row
4. S — All inputs restored from saved `ScenarioParams`; user redirected to calculator page with restored state
5. S — Result panel shows the restored calculation

### Happy Path — Delete Saved Scenario

1. U — In saved scenarios list, clicks delete icon (trash) on a row
2. S — Confirmation inline prompt: "Delete 'Retirement — conservative'? This cannot be undone."
3. U — Confirms delete
4. S — DELETE to `/api/scenarios/:id`; row removed from list; success toast: "Scenario deleted."

### Empty State — No Saved Scenarios

- S — Saved scenarios page shows: "You haven't saved any scenarios yet. Go to the calculator and save your first scenario." + "Open Calculator" CTA.

### Loading State — Scenarios List

- S — On page load: skeleton list with 3 shimmer rows (name, type badge, corpus value, date).

### Loading State — Save Action

- S — After clicking "Save scenario": button shows spinner; disabled while request in flight.

### Error State — Save Failure

- S — POST fails: error toast "Couldn't save. Please try again." Save button returns to active state.

### Error State — Delete Failure

- S — DELETE fails: error toast "Couldn't delete. Please try again." Row remains in list.

---

## Flow 8: Save Scenario — Logged-Out User

**Persona:** Priya (unauthenticated)
**Requirements:** SAVE-01, AUTH-01 (Phase 5/6 interaction)
**Entry:** User has a result showing; user is NOT authenticated

### Happy Path

1. U — Clicks "Save" button in results panel (button is visible but not disabled)
2. S — Save button triggers redirect to `/auth/sign-in` with a `?redirect` query param pointing back to the current URL (including URL-encoded calculator state)
3. S — Sign-in page shows context banner: "Sign in to save this scenario."
4. U — Signs in (or registers)
5. S — On successful auth, redirects to the calculator URL from the `?redirect` param
6. S — Calculator state restored from URL params; save prompt opens automatically
7. U — Confirms save name
8. S — Scenario saved (Flow 7 step 5 onwards)

### Error State

- If the `?redirect` param is missing or malformed after sign-in: S — redirects to `/` (calculator home) instead. User must re-enter inputs. No error shown.

---

## Flow 9: Authentication — Register

**Persona:** Arjun (new account creation)
**Requirements:** AUTH-01, AUTH-02
**Entry:** `/auth/register` page or "Create account" link from sign-in

### Happy Path

1. U — Navigates to `/auth/register`
2. S — Register form: Email field | Password field | Confirm password field | "Create account" button
3. U — Fills in email and matching passwords
4. U — Clicks "Create account"
5. S — POST to Better Auth `/api/auth/sign-up`; spinner on button
6. S — On success: session cookie set (httpOnly, sameSite:lax); redirect to calculator page (or `?redirect` destination)
7. S — Nav updates to logged-in state: user email shown, "Sign out" option visible

### Error State — Email Already Registered

1. S — Response indicates duplicate email
2. S — Inline error below email field: "An account with this email already exists. Sign in instead?" with "Sign in" link

### Error State — Password Mismatch

1. S — Client-side validation before submission: "Passwords don't match."

### Error State — Weak Password

1. S — If password < 8 characters: inline error "Password must be at least 8 characters."

### Error State — Server Error

1. S — Toast: "Something went wrong. Please try again."

### Loading State

- S — "Create account" button shows spinner; all form fields disabled while request is in flight.

---

## Flow 10: Authentication — Login

**Persona:** Arjun (returning user)
**Requirements:** AUTH-02
**Entry:** `/auth/sign-in`

### Happy Path

1. U — Navigates to `/auth/sign-in`
2. S — Sign-in form: Email | Password | "Sign in" button | "Create account" link
3. U — Enters credentials; clicks "Sign in"
4. S — POST to Better Auth `/api/auth/sign-in`; spinner on button
5. S — On success: session cookie set; redirect to calculator or `?redirect` destination
6. S — Nav shows logged-in state

### Error State — Wrong Credentials

1. S — Inline error (not field-specific — do not confirm which field is wrong): "Incorrect email or password."

### Error State — Server Error

1. S — Toast: "Something went wrong. Please try again."

### Loading State

- S — Button spinner + fields disabled while request in flight.

---

## Flow 11: Authentication — Logout

**Persona:** Arjun (authenticated)
**Requirements:** AUTH-03
**Entry:** Any page — nav menu

### Happy Path

1. U — Clicks user menu in nav; selects "Sign out"
2. S — POST to `/api/auth/sign-out`; session cookie cleared
3. S — Nav returns to logged-out state; page reloads or soft-redirects to `/`
4. S — Saved Scenarios nav item removed; "Save" button returns to logged-out behaviour

### Error State

- Logout failure is silent from user perspective: S — retry once; if still failing, session expires naturally. No error toast for logout — it would confuse users.
