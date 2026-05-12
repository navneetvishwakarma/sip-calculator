# Tech Stack — SIP Calculator

**Date:** 2026-05-12
**Status:** Accepted

---

## Stack Decision Table

| Layer | Technology | Version | Rationale | Alternatives Rejected |
|---|---|---|---|---|
| Monorepo tooling | Turborepo | ^2.x | Zero-config task caching; native pnpm workspace support; enables `apps/web` + `packages/core` boundary from day one | Nx (heavier); plain pnpm workspaces (no build cache) |
| Package manager | pnpm | ^9.x | Turborepo's standard pairing; strict hoisting prevents phantom dependency bugs | npm (no workspace hoisting strictness); yarn (slower installs) |
| Runtime | Node.js | ^20 LTS | Even-numbered LTS; required by Next.js 15; Vercel default runtime | Bun (insufficient ecosystem maturity for production 2025) |
| Framework | Next.js | ^15 | App Router colocates route handlers with frontend; zero-config Vercel deployment; Better Auth first-class adapter; eliminates Express | Vite + Express (two deploy targets, CORS config, no benefit for this scope) |
| UI library | React | ^19 | Ships with Next.js 15; concurrent features available if needed | — |
| Language | TypeScript | ^5.4 | Required for ScenarioParams/ScenarioResult discriminated unions; catches rate unit bugs at compile time | JavaScript (no type safety on financial inputs) |
| Styling | Tailwind CSS | ^4 | CSS-first config (`@import "tailwindcss"`); no `tailwind.config.js` required; v4 is the current release | Tailwind v3 (outdated; v4 is the active branch); CSS Modules (no utility consistency); MUI (heavy bundle, opinionated design system) |
| Component library | shadcn/ui | latest CLI | Components copied into project — no version lock, full style control; pairs with Tailwind v4 | Radix UI direct (no pre-styled components); MUI (see above) |
| Form handling | react-hook-form | ^7 | Uncontrolled inputs minimise re-renders during live recalculation; `@hookform/resolvers` bridges zod | Formik (more re-renders; slower); React state only (no built-in validation) |
| Validation | zod | ^4 | ScenarioParams schema exported from `packages/core`; same schema validates API route bodies; TypeScript inference | zod v3 (task specifies v4); Valibot (smaller but less ecosystem coverage) |
| State management | Zustand | ^5 | Comparison tray (2–4 scenario snapshots) and calculator inputs need shared state beyond one component tree; ~1KB bundle; no provider boilerplate | Redux Toolkit (5x boilerplate for this scope); React Context (unwieldy for 4 parallel scenario slots) |
| Charts | Recharts | ^2 | Declarative SVG; ResponsiveContainer handles mobile; covers LineChart, PieChart, AreaChart for all required viz types | Chart.js (Canvas, imperative; fights React rendering model); Victory (larger bundle, less community support) |
| Calculation engine | `@sip/core` (internal) | workspace | Pure TypeScript, zero DOM, zero React; shared with React Native v2 without any changes; enforced by tsconfig `lib: ["ES2022"]` and ESLint `no-restricted-imports` | Embedding calc logic in `apps/web` (breaks React Native v2 sharing) |
| Number precision | Native `Number` (IEEE 754) | — | Sufficient for Indian retail investment amounts; adopt `decimal.js` only if Phase 1 cross-validation against ET Money/Groww exceeds ±₹1 tolerance (deferred decision) | Pre-adopting `decimal.js` (unnecessary dependency unless cross-validation fails) |
| ORM | Drizzle ORM | ^0.40 | SQL-first; excellent TypeScript inference; no Rust binary (Prisma has one); low cold-start overhead on Vercel serverless | Prisma (Rust binary, heavier cold start); Knex (no TypeScript inference) |
| Migration runner | drizzle-kit | ^0.40 | Paired with Drizzle ORM; generates and runs SQL migrations | Flyway (requires JVM); manual migrations |
| Database | Neon (serverless Postgres) | latest | Serverless Postgres with built-in connection pooling; Vercel integration auto-provisions `DATABASE_URL`; generous free tier | Supabase (extras dead weight for this app); PlanetScale (MySQL, not Postgres); Railway Postgres (more ops burden) |
| Auth | Better Auth | ^1 | Email/password + OAuth; Drizzle adapter; httpOnly session cookies; Lucia's recommended successor (Lucia officially deprecated 2025) | Lucia (deprecated); Passport.js (Express middleware, no App Router adapter); Auth.js/NextAuth v5 (larger install base but weaker TypeScript inference) |
| Session mechanism | httpOnly cookie, sameSite:lax | — | Not readable by JavaScript (XSS-safe); `sameSite:lax` blocks cross-site POST without CSRF tokens | JWT in localStorage (XSS vector); JWT in httpOnly cookie (stateless but no server-side revocation without token store) |
| Rate limiting | Upstash Redis + `@upstash/ratelimit` | ^2 | Sliding window at API layer; works on Vercel Edge; no self-managed Redis needed; `@upstash/ratelimit` provides per-IP and per-user limits | Vercel WAF (Pro plan only; zero code control); `express-rate-limit` (no Vercel Edge support) |
| Testing | Vitest | ^2 | Native ESM; fast cold start; first-class TypeScript; required for `packages/core` (no DOM); compatible with pnpm workspaces | Jest (slower, needs babel transform for ESM); Mocha (manual assertion library) |
| Build (packages/core) | tsup | ^8 | Zero-config TypeScript bundler; generates CJS + ESM outputs; tree-shakeable; used for `packages/core` package build | tsc directly (no bundling, no tree-shaking); Rollup (more config) |
| Deployment | Vercel | latest | Native Next.js deployment; Neon integration; zero-config; Hobby tier sufficient for v1 | Railway (more ops burden, no native Next.js opt); Fly.io (requires Docker, more config) |
| URL state encoding | URLSearchParams (native browser API) | — | No dependency; encodes ScenarioParams as query params for SHARE-01; zod parses and validates on decode | hash fragments (not crawlable); third-party serializers (unnecessary) |

---

## Tailwind v4 CSS-First Constraint

Tailwind v4 uses CSS-first configuration. The entrypoint is:

```css
@import "tailwindcss";
```

There is no `tailwind.config.js`. Theme customisation uses CSS custom properties and `@theme` blocks in the CSS file. All tutorials and AI-generated snippets referencing `tailwind.config.js` content arrays or `theme.extend` are v3 patterns and will not work.

shadcn/ui components must be initialised with the v4-compatible CLI path. Verify CLI version at setup with `npx shadcn@latest init`.

---

## Decimal.js Decision — Deferred

The PRD and Phase 1 context both state: cross-validate SIP output against ET Money/Groww on a ₹1 crore corpus. If native IEEE 754 doubles stay within ±₹1, `decimal.js` is not adopted. If they drift beyond that tolerance, adopt `decimal.js@^10` for all financial calculations in `packages/core`. This decision is deferred to Phase 1 execution.
