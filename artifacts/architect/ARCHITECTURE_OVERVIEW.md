# Architecture Overview — SIP Calculator

**Date:** 2026-05-12
**Status:** Accepted

---

## System Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         User's Browser                                      │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      apps/web (Next.js 15)                          │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────┐  ┌─────────────────────┐  │   │
│  │  │       React Client Components       │  │  Next.js Route      │  │   │
│  │  │                                     │  │  Handlers (Server)  │  │   │
│  │  │  CalcTypeSelector   ResultsPanel    │  │                     │  │   │
│  │  │  CalcForm           ChartsSection   │  │  /api/auth/[...all] │  │   │
│  │  │  ComparisonTray     YearlyTable     │  │  /api/scenarios     │  │   │
│  │  │  Nav                SavePrompt      │  │  /api/scenarios/:id │  │   │
│  │  │                                     │  │                     │  │   │
│  │  │  Zustand Store:                     │  │  Better Auth        │  │   │
│  │  │  - calculatorSlice (current inputs) │  │  Middleware         │  │   │
│  │  │  - comparisonSlice (tray: 0–4)      │  │                     │  │   │
│  │  │  - authSlice (session user | null)  │  └──────────┬──────────┘  │   │
│  │  └────────────────┬────────────────────┘             │             │   │
│  │                   │ import                            │ Drizzle ORM │   │
│  │                   ▼                                  │             │   │
│  │  ┌────────────────────────────┐                      │             │   │
│  │  │      packages/core         │                      │             │   │
│  │  │      (@sip/core)           │                      │             │   │
│  │  │                            │                      │             │   │
│  │  │  calculateSIP()            │                      │             │   │
│  │  │  calculateGoal()           │                      │             │   │
│  │  │  calculateLumpSum()        │                      │             │   │
│  │  │  calculateStepUp()         │                      │             │   │
│  │  │  calculateHybrid()         │                      │             │   │
│  │  │  calculateSWP()            │                      │             │   │
│  │  │  monthlyRate()             │                      │             │   │
│  │  │  formatINR()               │                      │             │   │
│  │  │  ScenarioParamsSchema      │                      │             │   │
│  │  │  (zod)                     │                      │             │   │
│  │  │                            │                      │             │   │
│  │  │  TypeScript only           │                      │             │   │
│  │  │  lib: ["ES2022"]           │                      │             │   │
│  │  │  Zero DOM/React/Next.js    │                      │             │   │
│  │  └────────────────────────────┘                      │             │   │
│  │                                                       │             │   │
│  └───────────────────────────────────────────────────────┼─────────────┘   │
│                                                          │                 │
└──────────────────────────────────────────────────────────┼─────────────────┘
                                                           │
                                              ┌────────────▼────────────┐
                                              │   Neon (serverless      │
                                              │   Postgres)             │
                                              │                         │
                                              │  Better Auth tables:    │
                                              │  user, session,         │
                                              │  account, verification  │
                                              │                         │
                                              │  App tables:            │
                                              │  scenarios              │
                                              └─────────────────────────┘
                                                           │
                                              ┌────────────▼────────────┐
                                              │   Upstash Redis         │
                                              │   (rate limit store)    │
                                              │   auth endpoints only   │
                                              └─────────────────────────┘
```

---

## Component Responsibility Table

| Component | Responsibility | Boundaries — What It Does NOT Do |
|---|---|---|
| `packages/core` (`@sip/core`) | All SIP math: six calculator functions, `monthlyRate()`, `formatINR()`, `ScenarioParamsSchema` (zod), `ScenarioResultSchema` (zod), `YearlySnapshot` type | No DOM access, no React imports, no Next.js imports, no HTTP calls, no chart rendering, no form handling |
| `apps/web` — React client components | Forms, result display, charts (Recharts), comparison tray, URL state encode/decode, auth UI, save prompt, saved scenarios list | No calculation logic, no DB queries, no session management |
| `apps/web` — Zustand stores | `calculatorSlice` (current inputs + result), `comparisonSlice` (ephemeral tray of 0–4 scenarios), `authSlice` (session user or null) | No persistence, no API calls from store; stores hold derived UI state only |
| `apps/web` — Next.js route handlers | Auth CRUD (delegated to Better Auth), scenarios CRUD (Drizzle + Neon), rate limiting (Upstash) | No calculation logic ever, no chart data preparation, no business logic beyond ownership checks |
| Better Auth | Session creation/destruction, email+password credential verification, OAuth, session cookie management, session table | App domain logic, scenario ownership |
| Drizzle ORM | Type-safe SQL queries against Neon; migration runner (`drizzle-kit`) | No business logic, no session management |
| Neon (serverless Postgres) | Durable storage for users (via Better Auth) and saved scenarios | Computation, session logic |
| Upstash Redis | Sliding-window rate limit counters for auth endpoints | Application state, session storage |
| Vercel | Deployment, edge CDN for static assets, serverless function execution for route handlers | Application logic |

---

## Dependency Graph

```
apps/web
 ├── @sip/core             (packages/core — calc engine + types)
 ├── better-auth           (auth; manages its own DB tables)
 ├── drizzle-orm           (DB queries)
 ├── @neondatabase/serverless (Neon connection)
 ├── @upstash/ratelimit    (rate limiting)
 ├── recharts              (charts — apps/web only, never in packages/core)
 ├── zustand               (state management)
 ├── react-hook-form       (form state)
 ├── zod                   (shared with @sip/core — same instance via workspace)
 └── shadcn/ui components  (UI primitives)

packages/core
 ├── zod                   (ScenarioParamsSchema, ScenarioResultSchema)
 └── [NO DOM, NO React, NO Next.js, NO Recharts]

Future: apps/mobile (React Native v2)
 └── @sip/core             (same package, zero changes required)
```

---

## Data Flow Table — All 11 User Flows

### Flow 1: Anonymous User Calculates Standard SIP

| Step | Component | Action | Network? |
|---|---|---|---|
| Page load | Next.js (server) | Renders calculator shell with Indian defaults in HTML | No |
| Hydration | React client | Mounts CalcForm with default SIPParams | No |
| Initial render | Zustand calculatorSlice | Holds default SIPParams; triggers initial calc | No |
| Calculation | `@sip/core` `calculateSIP()` | Pure function; returns SIPResult + YearlySnapshot[] | No |
| Display | ResultsPanel, YearlyBreakdownTable | Renders corpus, invested, gains, table | No |
| Input change | CalcForm → Zustand | Updates calculatorSlice; triggers recalc | No |
| Recalculation | `@sip/core` `calculateSIP()` | Re-runs synchronously on every valid input change | No |

---

### Flow 2: Switching Calculator Types

| Step | Component | Action | Network? |
|---|---|---|---|
| Tab click | CalcTypeSelector | Emits new type to Zustand calculatorSlice | No |
| State update | Zustand calculatorSlice | Replaces params with type-specific defaults | No |
| Form transition | CalcForm | Renders fields for new type; 150ms fade | No |
| Calculation | `@sip/core` (type-appropriate fn) | Computes result from new defaults | No |
| Display | ResultsPanel, YearlyBreakdownTable | Updates with new result | No |

---

### Flow 3: Goal-Based Calculator with Feasibility Warning

| Step | Component | Action | Network? |
|---|---|---|---|
| Type select | CalcTypeSelector | Sets type = "goal" in Zustand | No |
| Defaults populated | CalcForm (GoalParams variant) | Target ₹50L, Rate 12%, Duration 10Y | No |
| Calculation | `@sip/core` `calculateGoal()` | Returns required monthly SIP | No |
| Feasibility check | ResultsPanel | Reads result; if requiredMonthly > 10,00,000 → renders FeasibilityWarning | No |
| Input adjustment | CalcForm | User changes duration; Zustand updates GoalParams | No |
| Recalculation | `@sip/core` `calculateGoal()` | Re-computes; warning disappears when below threshold | No |

---

### Flow 4: SWP Calculator Reaching "Perpetual" Result

| Step | Component | Action | Network? |
|---|---|---|---|
| Type select | CalcTypeSelector | Sets type = "swp" in Zustand | No |
| Defaults populated | CalcForm (SWPParams variant) | Corpus ₹50L, Withdrawal ₹30K, Rate 12% | No |
| Calculation | `@sip/core` `calculateSWP()` | Returns `{ monthsToDepletion: "perpetual" }` | No |
| Display | ResultsPanel | Shows "Perpetual" badge; corpus growing table | No |
| Input change | CalcForm | User increases withdrawal; Zustand updates SWPParams | No |
| Recalculation | `@sip/core` `calculateSWP()` | Returns `{ monthsToDepletion: number }`; depletion timeline shown | No |

---

### Flow 5: Scenario Comparison — Add, View, Remove

| Step | Component | Action | Network? |
|---|---|---|---|
| "Add to comparison" click | ResultsPanel | Clones current ScenarioResult snapshot into Zustand comparisonSlice | No |
| Tray update | ComparisonTray indicator | Badge count increments (max 4; button disabled at 4) | No |
| Second scenario add | Same as above | Second snapshot added; tray holds 2 | No |
| "Compare" click | Nav / ComparisonTray | Router navigates to `/compare` | No |
| Comparison render | ComparisonView | Reads comparisonSlice; renders ScenarioCards, OverlayChart, MetricComparisonTable | No |
| Remove click | ScenarioCard | Removes from comparisonSlice; Zustand updates; components re-render | No |
| All removed | ComparisonView | Empty state rendered | No |

Note: Comparison tray is ephemeral React/Zustand state. Cleared on full page refresh. Never sent to server.

---

### Flow 6: URL-State Sharing

| Step | Component | Action | Network? |
|---|---|---|---|
| "Copy Link" click | ResultsPanel | Reads current ScenarioParams from Zustand; encodes to URLSearchParams; copies to clipboard | No |
| Recipient opens URL | Next.js (server) | Renders page with URL params present | No |
| Params decode | apps/web URL state layer | `ScenarioParamsSchema.safeParse()` on query params; valid fields restored; invalid fields fall back to defaults | No |
| State hydration | Zustand calculatorSlice | Populated from decoded params | No |
| Calculation | `@sip/core` | Re-runs from restored inputs; same result as sender | No |
| Display | ResultsPanel | Shows restored result; URL in address bar matches shared URL | No |

---

### Flow 7: Save Scenario — Logged-In User

| Step | Component | Action | Network? |
|---|---|---|---|
| "Save" click | ResultsPanel | Checks authSlice — user is authenticated | No |
| SavePrompt opens | ResultsPanel | Inline prompt slides down; auto-generated name populated | No |
| User confirms name | SavePrompt Input | Name field edited | No |
| "Save scenario" click | SavePrompt Button | POST `/api/scenarios` with `{ name, inputs: ScenarioParams }` | **YES** |
| Optimistic update | Zustand + UI | Scenario added to list immediately | No |
| Server response (201) | Route handler | Inserts row; returns scenario with id | — |
| Toast | ToastProvider | "Scenario saved." | No |
| Saved list update | Saved scenarios view | Row appears with server-assigned id | No |
| Load scenario | SavedScenarioRow | GET `/api/scenarios/:id` then restores ScenarioParams to Zustand | **YES** |
| Delete scenario | SavedScenarioRow | DELETE `/api/scenarios/:id`; row removed from list | **YES** |

---

### Flow 8: Save Scenario — Logged-Out User

| Step | Component | Action | Network? |
|---|---|---|---|
| "Save" click | ResultsPanel | Checks authSlice — user is null | No |
| Encode current state | apps/web URL state layer | Current ScenarioParams encoded into URL params | No |
| Redirect | Next.js router | Navigate to `/auth/sign-in?redirect=[current-url-with-state]` | No |
| Context banner | SignIn page | Detects `?redirect` param; renders "Sign in to save your scenario" banner | No |
| Sign-in | SignIn form | POST `/api/auth/sign-in`; session cookie set | **YES** |
| Post-auth redirect | Better Auth callback | Reads `?redirect` value; navigates to calculator URL (with encoded state) | No |
| State restore | apps/web URL state layer | ScenarioParams decoded from URL params; Zustand hydrated | No |
| Save prompt auto-open | ResultsPanel | Detects `?autoSave=1` param (or equivalent signal); opens SavePrompt automatically | No |
| Save proceeds | Flow 7 from step 5 | POST `/api/scenarios` | **YES** |

---

### Flow 9: Authentication — Register

| Step | Component | Action | Network? |
|---|---|---|---|
| Navigate to `/auth/register` | Router | Page load | No |
| Form fill | Form.register | Client-side validation: passwords match, password ≥ 8 chars | No |
| "Create account" click | Form.register | POST `/api/auth/sign-up` via Better Auth client | **YES** |
| Better Auth handler | Route handler | Creates user; sets session cookie | — |
| Redirect | Better Auth callback | To `/` or `?redirect` destination | No |
| Nav update | authSlice | Session user populated; logged-in nav state | No |

---

### Flow 10: Authentication — Login

| Step | Component | Action | Network? |
|---|---|---|---|
| Navigate to `/auth/sign-in` | Router | Page load | No |
| "Sign in" click | Form.signIn | POST `/api/auth/sign-in` via Better Auth client | **YES** |
| Better Auth handler | Route handler | Verifies credentials; sets session cookie | — |
| Redirect | Better Auth callback | To `/` or `?redirect` destination | No |
| Nav update | authSlice | Session user populated | No |

---

### Flow 11: Authentication — Logout

| Step | Component | Action | Network? |
|---|---|---|---|
| "Sign out" click | UserMenu | POST `/api/auth/sign-out` via Better Auth client | **YES** |
| Better Auth handler | Route handler | Destroys session record; clears cookie | — |
| Nav update | authSlice | User set to null; logged-out nav state; no full page reload | No |

---

## Ephemeral State — Explicit Classification

| State | Where Held | Persistence | Cleared When |
|---|---|---|---|
| Calculator inputs (current) | Zustand `calculatorSlice` | URL query params (SHARE-01) | Full page refresh (unless URL params present) |
| Comparison tray (0–4 scenarios) | Zustand `comparisonSlice` | Never | Full page refresh |
| Inflation toggle + rate | React local state in ChartsSection | Never | Full page refresh |
| Auth session user | Zustand `authSlice` (hydrated from `GET /api/auth/get-session` on mount) | Server session cookie | Logout or session expiry |

---

## Non-Functional Requirements

| NFR | Target | Mechanism |
|---|---|---|
| Calculation latency | < 5ms for any calculator type | Synchronous client-side pure functions; no network |
| Time to interactive (calculator) | < 2s on mobile (4G) | Next.js static shell; calc is synchronous after hydration |
| Auth endpoint availability | Handled by Vercel + Neon SLAs | No custom uptime tooling needed at v1 scale |
| Concurrent users | 10,000 (target per PRD) | Stateless serverless functions; Neon auto-scaling; Vercel CDN for static assets |
| Mobile usability | 375px without horizontal scroll | Mobile-first CSS; Tailwind v4 responsive utilities |
| SEBI disclaimer | Visible on all pages | Footer component mounted globally in root layout |
| Session security | httpOnly cookie, sameSite:lax | Better Auth default session config |
| Rate limiting | Auth endpoints only | Upstash Redis sliding window |
