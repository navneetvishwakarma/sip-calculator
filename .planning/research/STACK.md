# Stack Research — SIP Calculator

> Versions reflect training data (Aug 2025 cutoff). Run `npm view <pkg> version` at install time to confirm patch versions. Major versions here are stable; patch numbers may drift.

---

## Recommended Stack

### Frontend

**Framework: Next.js 15 (App Router)**

The standard 2025 choice for a full-stack React app with auth and persistence is Next.js, not a standalone Vite + Express split. App Router colocates route handlers and server actions with the frontend, eliminating a separate backend server for an app of this scope. Auth libraries (Better Auth, Auth.js) have first-class Next.js adapters. Vercel deploys it without configuration. Vite + Express is valid if you want a clean architectural separation or prefer deploying frontend and backend to different origins — but it adds operational complexity that doesn't buy anything here.

`next@^15`, `react@^19`, `react-dom@^19`

**Charting: Recharts 2.x**

Recharts is the canonical composable charting library for React. It is SVG-based, declarative, and handles the chart types needed here (line charts for growth-over-time, area charts, bar charts for year-by-year, pie/radial for invested-vs-returns breakdown) without configuration overhead. It handles responsive containers well with `ResponsiveContainer`. The bundle size is acceptable (~150KB gzipped) for a financial tool where chart fidelity matters.

`recharts@^2`

Do not use Chart.js + react-chartjs-2 for a React-first project. Chart.js uses Canvas rather than SVG and requires imperative refs to update, which fights React's rendering model. It is the correct pick only if you need animation performance at thousands of data points, which a 30-year SIP table (360 rows) does not need.

**Styling: Tailwind CSS v4 + shadcn/ui**

Tailwind v4 ships with a CSS-first configuration (`@import "tailwindcss"` in CSS, no `tailwind.config.js` by default). Pair with shadcn/ui for form inputs, modals, tabs, and tables — shadcn copies components into your project rather than abstracting them, so there are no version conflicts and full control over styles. This combination is the de-facto standard for 2025 React apps.

`tailwindcss@^4` (CSS-first config), shadcn/ui components added via CLI

**Forms: react-hook-form + zod**

react-hook-form minimises re-renders on input change, which matters for live-recalculating calculator inputs. zod provides schema validation and TypeScript inference. The `@hookform/resolvers` package bridges the two. This pair is unambiguous as the 2025 standard.

`react-hook-form@^7`, `zod@^3`, `@hookform/resolvers@^3`

**State Management: Zustand**

The calculation state (inputs, computed outputs, saved comparison scenarios) is shared across the calculator form, chart panels, and year-by-year table. That is more than local component state but far less than a Redux use case. Zustand is lightweight (~1KB), has no boilerplate, and works without a Context provider wrapper. useState + Context is acceptable for simpler state but gets unwieldy when scenarios multiply (comparison view needs 2-4 independent scenario stores).

`zustand@^5`

**Number Math: decimal.js**

Raw JavaScript `Number` uses IEEE 754 double precision. For compound interest over 30 years with monthly compounding, floating-point drift accumulates to visible rupee differences. Use `decimal.js` for all financial calculations (SIP corpus, goal-based reversal, step-up SIP). This is not optional for a credible fintech tool.

`decimal.js@^10`

**TypeScript**

Required. The calculation logic has precise input/output contracts (monthly amount, rate, duration, corpus) and scenario shapes for persistence. TypeScript catches unit errors (rate as percent vs decimal, months vs years) at compile time. No configuration debate needed — `npx create-next-app` scaffolds this by default.

`typescript@^5`

---

### Backend

**Runtime + Framework: Next.js App Router Route Handlers / Server Actions**

With Next.js, the backend is embedded. API routes live in `app/api/*/route.ts` and follow the Web Fetch API (Request/Response). Server Actions handle form mutations (save scenario, delete scenario) without explicit API endpoints. This eliminates Express entirely for this scope.

If you later need a separate backend service (e.g., live NAV data, a cron to update market returns) — extract it then. Premature separation adds a CORS layer, separate deploy pipeline, and environment variable duplication for no gain in v1.

**Input Validation: zod (same library)**

Validate all incoming API route payloads with zod before touching the database. This is the primary injection/corruption surface for saved scenarios.

**Auth: Better Auth**

Better Auth is the current recommended self-hosted auth library for Next.js as of mid-2025. It handles email/password, OAuth providers (Google is sufficient for this audience), session management, and database adapters (works with Drizzle). It replaced the role Lucia played before Lucia deprecated itself in early 2025.

Auth.js (NextAuth v5) is also valid — it has a larger install base and more community examples. The practical difference is small. Better Auth has a cleaner API and better TypeScript inference; Auth.js has more Stack Overflow answers. Either is fine; Better Auth is the slightly more forward-looking pick.

Do not use Lucia. It was officially deprecated in 2025 and the author directed users to migrate to Better Auth. Many tutorial articles still recommend it — they are stale.

Do not use Passport.js. It was designed for Express middleware patterns and has no native adapter for Next.js App Router. It requires wrapping in a compatibility layer that is fragile.

`better-auth@^1`

**ORM: Drizzle ORM**

Drizzle is SQL-first (you write typed SQL, not an abstraction over it), has excellent TypeScript inference, and generates migrations. For PostgreSQL with a simple schema (users, scenarios), it is lighter and more explicit than Prisma. Prisma is also acceptable — it has a larger ecosystem and more tutorials — but its Rust-based query engine adds binary size and cold-start overhead that matters on serverless runtimes (Vercel).

Prisma is the safer choice if the team is unfamiliar with SQL and wants a more hand-holding ORM. Drizzle is the better choice for developers comfortable with SQL who want production-grade bundle size.

This recommendation: Drizzle.

`drizzle-orm@^0.40`, `drizzle-kit@^0.40` (dev)

---

### Database

**PostgreSQL via Neon (managed serverless)**

PostgreSQL is the correct choice. The schema is relational: users have many saved scenarios, each scenario has a set of calculation inputs and a name. No graph traversal, no document flexibility needed.

Neon provides serverless PostgreSQL with connection pooling built in, a generous free tier, and a Vercel integration that provisions the database and injects environment variables automatically. It is the standard managed Postgres choice for Next.js + Vercel deployments in 2025. Supabase is an equivalent alternative if you want a dashboard with a built-in studio UI, but Supabase's extras (realtime, storage, edge functions) are dead weight for this app.

---

### Deployment

**Vercel**

Vercel is the canonical deployment target for Next.js. Next.js App Router with server actions and route handlers deploys without configuration. The Neon integration provisions Postgres and injects `DATABASE_URL` automatically. The free tier (Hobby) is sufficient for a v1 launch to Indian retail investors at low traffic. Upgrade to Pro when you need custom domains with full HTTPS, team members, or more function invocations.

Alternative: Railway. Railway deploys a Docker container, which gives you more control over runtime and lets you collocate your Postgres instance, at the cost of more setup and no native Next.js optimisation. Use Railway if you outgrow Vercel's serverless constraints (long-running tasks, WebSockets). Not needed for v1.

---

## What NOT to Use

**Lucia Auth** — deprecated officially in 2025. Author migrated community to Better Auth. Avoid any tutorial that recommends it; those articles are stale.

**Passport.js** — Express middleware pattern, incompatible with Next.js App Router without fragile compatibility shims. Has not been meaningfully maintained for the App Router era.

**Redux Toolkit** — correct for large applications with complex cross-slice state. For a calculator with 2-4 scenario slots and user session, it is 5x the boilerplate of Zustand for zero benefit.

**Material UI (MUI)** — heavy bundle (~300KB), opinionated design system that fights custom styling, and visually dated for 2025. shadcn/ui + Tailwind gives full control with a fraction of the overhead.

**Sequelize** — the legacy Node ORM. Drizzle and Prisma both have better TypeScript support, better ergonomics, and active maintenance. Sequelize has not kept pace.

**Chart.js / react-chartjs-2** — Canvas-based, imperative update model that fights React. Fine for standalone dashboards; wrong for React component trees where data changes reactively.

**JavaScript `Number` for compound interest math** — IEEE 754 floating point accumulates visible error over 30-year SIP horizons with monthly compounding. Use `decimal.js`. This is the single most common correctness mistake in financial calculators.

**Vite + separate Express backend** — defensible architecture but adds deploy complexity (two services, CORS, separate env vars) for no v1 benefit. Next.js route handlers cover every backend need here.

---

## Confidence Levels

| Recommendation | Confidence | Reason |
|----------------|------------|--------|
| Next.js 15 (App Router) | HIGH | Dominant choice for full-stack React with auth + DB in 2025; training data unambiguous |
| React 19 | HIGH | Stable release, ships with Next.js 15 |
| TypeScript 5 | HIGH | Industry standard, no credible alternative |
| Recharts 2.x | HIGH | Canonical composable React charting library; well-established |
| Tailwind CSS v4 | MEDIUM | v4 was released early 2025; CSS-first config is a real breaking change from v3 — verify migration docs at install |
| shadcn/ui | HIGH | Standard component layer for Tailwind-based React apps |
| react-hook-form + zod | HIGH | Unambiguous standard pairing for forms in React |
| Zustand 5 | HIGH | Lightweight, no boilerplate, correct scope for this app |
| decimal.js | HIGH | Required for floating-point safe compound interest; well-established library |
| Drizzle ORM | MEDIUM | Strong trajectory in 2025 but younger than Prisma; fewer community tutorials. Prisma is a safe fallback |
| Better Auth | MEDIUM | Correct directional pick post-Lucia deprecation, but has less community precedent than Auth.js (NextAuth v5). Either works |
| Neon (managed Postgres) | HIGH | Standard Vercel-integrated managed Postgres for 2025 |
| Vercel | HIGH | Native Next.js deployment platform, zero-config for this stack |

---

## Version Pinning Reference

At project init, run these to get latest stable:

```
npm view next version
npm view react version
npm view recharts version
npm view tailwindcss version
npm view zustand version
npm view drizzle-orm version
npm view better-auth version
npm view decimal.js version
```

Use `^major.minor.0` in `package.json` to accept patch updates automatically.
