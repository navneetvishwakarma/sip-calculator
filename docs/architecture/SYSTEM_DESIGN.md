# System Design — SIP Calculator

**Date:** 2026-05-12
**Audience:** A new engineer joining the project who needs to understand the system before touching code.

---

## What This System Does

The SIP Calculator is a web tool for Indian retail investors. It answers six calculation questions: how much corpus a monthly SIP will build (standard SIP), how much to invest monthly to reach a target corpus (goal-based), how a one-time investment compounds (lump sum), how annual SIP increases affect the corpus (step-up), how a combined monthly SIP and one-time investment perform (hybrid), and how long a retirement corpus lasts under monthly withdrawals (SWP).

Every calculation runs instantly in the browser. No server is involved in computing a result. A user on a 375px mobile screen can enter their inputs and see a projected corpus, a year-by-year breakdown table, and growth charts — all without creating an account and without a single network call.

User accounts exist for one purpose: saving named calculator snapshots to revisit later. The account layer is additive, not gating. The calculator is fully functional without it.

---

## Why This Architecture

The architecture has one axis of complexity: the calculation engine must eventually run in two environments (web and React Native mobile). Everything else is a standard full-stack web app.

The solution to the two-environment problem is `packages/core` — a pure TypeScript package with zero browser, DOM, or React dependencies. This package contains all six calculator functions, the INR formatter, the `monthlyRate()` utility, and the TypeScript type definitions for `ScenarioParams` (the normalized input shape). Every environment imports from the same source.

The alternative would be to embed the calc logic in `apps/web` and extract it later. That "later" extraction, once there is live user traffic and other code depending on the structure, is expensive. Doing it upfront in Phase 1 costs one extra day of setup and saves a week of risky refactoring in v2.

---

## Component Interactions

The system has three distinct layers, and the boundaries between them are hard.

**Layer 1: Calculation (`packages/core`)**

Pure functions. Takes typed inputs. Returns typed outputs. No network. No side effects. Vitest tests run against this layer without a browser or server.

A new engineer working on any calculator bug starts here: find the function (`calculateSIP`, `calculateGoal`, etc.), read its inputs and outputs, run its unit tests.

**Layer 2: UI and State (`apps/web` — client)**

React components consume `packages/core` functions directly. Calculator inputs live in Zustand (`calculatorSlice`). When inputs change, the component calls the relevant `@sip/core` function synchronously and re-renders with the result. There is no API call on this path.

The comparison tray (`comparisonSlice`) holds up to four `ScenarioResult` snapshots in memory. It is ephemeral — it clears on full page refresh. This is intentional: comparison is a session-local tool, not a persistence feature. Users who want to save scenarios for later use the save feature (Layer 3).

URL state encoding (Phase 4) lives entirely in the client. `ScenarioParams` is serialized to URL query params on "Copy Link" click. On page load with params present, the params are decoded with `ScenarioParamsSchema.safeParse()` — invalid fields silently fall back to Indian defaults, valid fields restore to Zustand state.

**Layer 3: Persistence (`apps/web` — route handlers + Neon)**

Next.js route handlers handle auth (via Better Auth) and scenario CRUD (via Drizzle + Neon). These handlers contain no calculation logic. They receive `ScenarioParams`, validate them with the same `ScenarioParamsSchema` exported from `packages/core`, and store them as JSONB in Neon.

On load, a saved scenario provides its `ScenarioParams` to the client. The client re-runs the calculation from those inputs. The server never stores computed results — only inputs. This means a calculation engine update transparently applies to all saved scenarios on their next load, with no data migration needed.

---

## Key Trade-offs Made

**No backend calculation endpoint.** This was considered. The argument for it: server-side results could be audited or cached. The argument against: every keypress would require a network round-trip, adding latency and a loading state to the product's most performance-sensitive path. The audit argument doesn't hold for v1 (no audit requirement exists). The caching argument doesn't hold either — calculations are deterministic and fast (< 5ms). Client-only wins.

**Comparison is ephemeral.** Users cannot save a comparison set. This keeps the data model clean — no `comparison_sets` table, no many-to-many between scenarios and comparison slots. Users who want to compare persistent scenarios can load them one at a time. The PRD explicitly lists "comparison set persistence" as out of scope for v1.

**`schema_version` on the scenarios table.** This looks like over-engineering on a two-table schema. It is not. Without it, any change to the shape of `ScenarioParams` silently breaks every saved scenario for every existing user. With it, a per-row migration function can handle old rows gracefully. The cost is one integer column; the benefit is safe schema evolution forever. It is mandatory from day one because adding it after there are real users requires a backfill migration.

**Inputs stored, not outputs.** The `scenarios` table stores `ScenarioParams` (inputs), not the computed corpus. This means loading a saved scenario requires a recalculation. The benefit: if the calculation algorithm improves or a bug is fixed, all saved scenarios transparently show the corrected result on next load. If outputs were stored, old results would be stale and require a recomputation job.

---

## What Was Deliberately Excluded

**PDF export.** Not in v1. URL sharing (SHARE-01) achieves 80% of the "share this result" use case with none of the PDF generation complexity.

**Live fund NAV data.** Would require a data vendor contract, error handling for feed outages, and a refresh mechanism. The user supplies their own expected return rate; the calculator is a projection tool, not a portfolio tracker.

**Fund-specific recommendations.** SEBI RIA registration is required to recommend specific mutual funds in India. This is a legal constraint, not a product choice.

**OAuth (Google login).** Not in v1. Email/password covers the use case. OAuth can be added via Better Auth's existing provider support without a schema change.

**Comparison persistence.** Not in v1. Client-side comparison state is adequate for the primary use case (same-session "what if" comparisons). Persisting comparison sets requires a new table and an associated UX for managing them.

---

## How the Six Phases Build on Each Other

**Phase 1 (Calculation Engine)** is the foundation. The `packages/core` package is built and tested in isolation. `ScenarioParams` and `ScenarioResult` types are locked here. Every subsequent phase depends on these types being stable. This is the only phase where a schema change is cheap.

**Phase 2 (Calculator UI)** is the minimum shippable product. React forms call `@sip/core` functions. Year-by-year table renders `YearlySnapshot[]`. No backend. Deployed to Vercel — real users can try the calculator. Auth state is mocked as permanently logged-out throughout Phases 2–4.

**Phase 3 (Visualizations)** adds Recharts charts above the year-by-year table. The time-series data (`YearlySnapshot[]`) already exists from Phase 1; charts are derived renders. The inflation toggle is per-session React state — not in URL params, not persisted.

**Phase 4 (Comparison + Sharing)** adds URL state encoding and the comparison tray. Both are purely client-side. URL state uses `ScenarioParams` from Phase 1 directly — no new types needed. The comparison tray is a second Zustand slice holding `ScenarioResult[]`.

**Phase 5 (Authentication)** introduces the backend. Better Auth is wired up: `apps/web/app/api/auth/[...all]/route.ts` delegates to `auth.handler(request)`. The `/api/auth/get-session` response hydrates `authSlice` in Zustand. The "Save" button redirects logged-out users to `/auth/sign-in?redirect=[current-url]`; after login, the redirect returns them to their calculator state.

**Phase 6 (Saved Scenarios)** adds the `scenarios` table and the four scenario CRUD endpoints. `ScenarioParams` (locked in Phase 1) is the payload for both `POST /api/scenarios` and for restoring state on load. The `schema_version` field is set to 1 on every new row.

The phase sequence is deliberately linear: no phase requires backtracking into a previous phase's work. Each phase is independently deployable.

---

## The Monorepo Boundary in Practical Terms

The rule is simple: `packages/core` imports nothing that does not work in a React Native environment.

Specifically, this means: no `window`, no `document`, no `navigator`, no `localStorage`, no `React`, no `ReactDOM`, no `next/*`, no `recharts`, no `tailwindcss`, no browser-specific Web APIs.

The enforcement is automatic. The `tsconfig.json` in `packages/core` sets `"lib": ["ES2022"]` — this excludes all DOM type definitions, so TypeScript will error on any DOM API usage. An ESLint rule (`no-restricted-imports`) blocks specific package imports.

If you are adding code to `packages/core` and your editor shows a type error on something like `window.localStorage`, that is the enforcement gate doing its job. Move the code to `apps/web` instead.

If you are adding code to `apps/web` and you want to share it with the future React Native app, ask whether it belongs in `packages/core` (pure logic, no UI) or whether it is UI-specific (stays in `apps/web`).

The formatter `formatINR()` is a good example of the right call: it is pure string processing with no DOM dependency, it needs to work identically in web and mobile, so it lives in `packages/core`.

Recharts is the opposite example: it is a React-dependent, browser-dependent charting library. It belongs in `apps/web` only.

---

## Running the Project

The monorepo uses pnpm workspaces. From the root:

```
pnpm install         # installs all workspace dependencies
pnpm build           # Turborepo builds packages/core first, then apps/web
pnpm test            # runs Vitest on packages/core; future: also apps/web
pnpm dev             # starts apps/web dev server (after packages/core is built)
```

`packages/core` is built with tsup. The output goes to `packages/core/dist/`. `apps/web` imports `@sip/core` via the workspace reference in its `package.json` — during development, Next.js resolves the workspace package directly from source via the Turborepo dev pipeline.

Database migrations: `pnpm drizzle-kit generate` then `pnpm drizzle-kit migrate` (run from `apps/web` or the package that owns `packages/db/schema.ts`).

Environment variables: `BETTER_AUTH_SECRET`, `DATABASE_URL` (Neon), `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`. On Vercel, `DATABASE_URL` is injected by the Neon integration automatically.
