# Architecture Research — SIP Calculator

**Researched:** 2026-05-06
**Confidence:** HIGH — established patterns for SPA + thin CRUD API with auth

---

## Component Map

The system has five distinct components, each with a clear boundary:

### 1. Calculation Domain (pure functions, client-side)
All SIP math lives here — no network dependency, no UI coupling. This is the single most important architectural decision: every calculator type (standard SIP, goal-based, lump sum, step-up SIP) is implemented as a pure function that takes inputs and returns a results object. Charts and tables consume these outputs as derived state.

Responsibilities:
- `calculateSIP(monthly, rate, years)` → corpus, invested, gains, year-by-year schedule
- `calculateGoalSIP(target, rate, years)` → required monthly
- `calculateLumpSum(principal, rate, years)` → corpus, year-by-year schedule
- `calculateStepUpSIP(monthly, stepUpRate, rate, years)` → corpus, invested, gains, schedule
- `toRealValue(nominalCorpus, inflationRate, years)` → inflation-adjusted corpus
- INR formatting utilities (lakh/crore display, decimal precision for compounding)

No API calls. No side effects. Directly testable with plain unit tests.

### 2. Calculator UI (React, Vite SPA)
Consumes the calculation domain. Handles form state, renders charts and tables, manages comparison state in memory.

Responsibilities:
- Calculator forms (controlled inputs per calculator type)
- Results display: line chart (growth over time), stacked bar / donut (invested vs gains), year-by-year table
- Scenario comparison: client-side state holding 2–4 snapshots simultaneously (ephemeral, not persisted in v1)
- "Save scenario" button — only network call from this layer, gated on auth state
- Auth UI: login/signup modal or page, session-aware nav

Does not own auth logic. Calls the API layer for save/load. Otherwise self-contained.

### 3. API Layer (Express, Node.js)
Thin CRUD server. No calculation logic. Auth middleware gates scenario endpoints.

Responsibilities:
- `POST /auth/register` — create user, hash password (bcrypt)
- `POST /auth/login` — verify credentials, issue session cookie
- `POST /auth/logout` — destroy session
- `GET /auth/me` — return current session user (used by frontend on load)
- `GET /scenarios` — list saved scenarios for authenticated user
- `POST /scenarios` — save a scenario
- `PUT /scenarios/:id` — rename or update a scenario
- `DELETE /scenarios/:id` — delete a scenario

All scenario endpoints require authenticated session. All calculation is absent — the backend does not reproduce any SIP math.

Rate limit `/auth/register` and `/auth/login` — `express-rate-limit` is sufficient for v1 (e.g., 10 requests per minute per IP on auth routes).

### 4. Session / Auth Middleware
Sits in front of all `/scenarios` routes. Uses httpOnly cookie sessions (not JWT in localStorage).

Rationale for httpOnly cookies over JWT in localStorage: localStorage is readable by any JS on the page (XSS vector); httpOnly cookies are not. For a first-party SPA on the same origin or with CORS credentials, cookie sessions are the correct default. `express-session` + `connect-pg-simple` (session store in Postgres) is the standard, minimal-dependency path.

CSRF: with `sameSite: lax` on the session cookie, cross-site POST requests (the main CSRF vector) are blocked by the browser automatically for navigation-triggered requests. For a first-party SPA where the frontend and API share an origin (or CORS is configured correctly), `sameSite: lax` is sufficient in v1 without an additional CSRF token layer.

### 5. PostgreSQL Database
Two tables plus session store for v1. See schema sketch below.

---

## Data Flow

### Public calculator path (no login required)
```
User types inputs
  → React form state
    → calculation domain function (synchronous, in-memory)
      → results object (corpus, schedule, gains)
        → Chart components (derived render)
        → Year-by-year table (derived render)
```
Zero network calls. Backend is completely uninvolved.

### Save scenario path (login required)
```
User clicks "Save scenario"
  → Auth state check: logged in?
      No → redirect to login / show modal
      Yes → POST /scenarios { name, type, inputs, outputs }
              → API validates session
              → INSERT into scenarios table
              → 201 response with saved record
                → frontend adds to saved scenarios list
```

### Load saved scenario path
```
User navigates to "My Scenarios" (requires login)
  → GET /scenarios
    → API queries scenarios WHERE user_id = session.userId
      → JSON array of scenarios
        → frontend hydrates forms with inputs
          → calculation domain re-runs from loaded inputs
            → charts/tables render
```

Note: the backend stores both `inputs` (to rehydrate the form) and optionally a snapshot of `outputs` (for display in the list without recalculating). In v1, storing inputs only is sufficient — recalculate on load.

### Auth flow
```
POST /auth/login { email, password }
  → bcrypt.compare(password, hash)
    → req.session.userId = user.id
      → Set-Cookie: connect.sid (httpOnly, sameSite: lax)
        → subsequent requests carry cookie automatically
```

On page load, the frontend calls `GET /auth/me`. If 200, user is authenticated; if 401, user is anonymous. This drives the login state across the SPA without storing tokens client-side.

---

## API Design Patterns

**REST over tRPC** for this project. tRPC requires TypeScript throughout — worthwhile for a larger team, but adds setup friction for a solo/small build with a thin API surface. REST with explicit JSON shapes is the simpler choice and trivially replaceable later.

**Response shape convention:**

Success:
```json
{ "data": { ... }, "error": null }
```

Error:
```json
{ "data": null, "error": { "code": "UNAUTHORIZED", "message": "Login required" } }
```

Consistent envelope means the frontend has one error-handling path, not per-endpoint branching.

**Validation:** Zod on the API boundary for all incoming request bodies. Schemas are defined once server-side and can be re-exported to the frontend (monorepo or shared module) to keep form validation in sync. This is the highest-leverage use of shared types in this codebase.

**No versioning for v1.** `/api/` prefix on all routes. If breaking changes are needed later, add `/api/v2/` at that point.

---

## Database Schema Sketch

### `users`
```sql
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `scenarios`
```sql
CREATE TABLE scenarios (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL,  -- 'sip' | 'goal' | 'lumpsum' | 'stepup'
  inputs      JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ON scenarios(user_id);
```

The `inputs` JSONB column holds the calculator-type-specific fields (monthly amount, rate, years, step-up rate, target, etc.). Each type has a different shape — a discriminated union in application code, stored as opaque JSON in the database. This avoids a per-type table proliferation in v1 and keeps migrations simple when new calculator types are added. The `type` column allows querying by calculator type and serves as the discriminator.

No `outputs` column — recalculate on load from inputs. This keeps stored data small and avoids stale cached results when the calculation logic is updated.

### Session store
`connect-pg-simple` creates a `session` table automatically. No manual migration needed.

---

## Suggested Build Order

Dependencies drive the sequence. Each step produces something independently testable or deployable.

**Step 1 — Calculation domain**
Pure functions, no dependencies. Write and test all four calculator types plus inflation adjustment and INR formatting utilities here. This is fully usable as a standalone module before any UI exists.

Deliverable: tested calculation module. At this point the core value is implemented and verifiable.

**Step 2 — Calculator UI + charts (frontend only, no backend)**
Wire up React forms to the calculation domain. Add Recharts (or similar) for the growth line chart and invested-vs-gains visualization. Add the year-by-year table. Auth state is mocked as "logged out." "Save" button is visible but disabled or shows a login prompt.

Deliverable: a working, fully interactive SIP calculator. Users can calculate, visualize, and compare scenarios without any backend. This is the minimum shippable product.

**Step 3 — Backend skeleton (Express + Postgres)**
Set up the Express server, database connection (node-postgres or Knex), and migration runner (Knex or `node-pg-migrate`). No routes yet beyond a health check. Establish the folder structure, middleware stack (CORS, JSON body parser, session middleware, rate limiter), and deployment target.

Deliverable: a backend that starts, connects to Postgres, and passes a health check.

**Step 4 — Auth endpoints**
Implement register, login, logout, and `GET /auth/me`. Wire up the frontend auth UI (login/signup form). Session cookie is set on login; `GET /auth/me` on app load syncs auth state.

Deliverable: users can create accounts and log in. No saved scenarios yet, but auth is real.

**Step 5 — Scenarios CRUD**
Implement the four scenario endpoints with session middleware guarding them. Connect the frontend "Save scenario" button to `POST /scenarios`. Build the "My Scenarios" list UI with load and delete.

Deliverable: the full feature set. Logged-in users can save, name, revisit, and delete scenarios.

---

## Key Assumptions and Decision Points

**Scenario comparison is client-only in v1.** The comparison UI holds multiple scenario snapshots in React state — no concept of a "comparison set" is persisted to the backend. If users want to save a comparison, they save each scenario individually. This simplifies the schema significantly. Flag for reassessment if comparison persistence becomes a stated requirement.

**Calculation runs client-side exclusively.** The backend has no calculation code. If future requirements introduce server-side calculation (e.g., audit trails, sharing a scenario via URL with server-rendered preview), that adds a second calculation path that must stay in sync — a maintenance burden. Defer until there is a concrete reason.

**Single-tenant user model.** No teams, no sharing, no roles. One user owns their scenarios. The schema supports this without modification.

**INR precision.** Use JavaScript's built-in `Number` (IEEE 754 double) throughout. For SIP amounts in the range of Indian retail investment (hundreds to crores), doubles have sufficient precision. No need for a decimal library in v1. Flag for revisit if high-precision compounding edge cases surface in testing.
