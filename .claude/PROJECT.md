# SIP Calculator

## What This Is

A web app for Indian retail investors to plan and visualize Systematic Investment Plans. Users calculate future corpus from a monthly SIP, work backward from a target amount to find the required monthly investment, compare multiple scenarios side by side, and track lump sum and step-up SIP alongside standard SIP — all with interactive charts and named scenarios saved to a user account. The public calculator requires no sign-up.

## Why Build It

Indian retail investors lack a fast, honest tool that shows them the real (inflation-adjusted) value of their SIP alongside the nominal number — most existing calculators show only nominal corpus.

## Stack

Turborepo monorepo — `apps/web` (Next.js 15 App Router) + `packages/core` (pure TypeScript, zero DOM/browser/React).

- **Calc engine:** `packages/core` — Vitest + tsup, shared with future React Native app
- **Web:** Next.js 15 (App Router), Tailwind v4 CSS-first, Recharts (charts only in `apps/web`)
- **Database:** Drizzle ORM + Neon (serverless Postgres)
- **Auth:** Better Auth (Lucia deprecated 2025)
- **Sessions:** httpOnly cookies, sameSite: lax — no JWT in localStorage

## Phase

Stage 2 — Building. Phase 1 (Calculation Engine) planned and ready to execute. Phases 2–6 sequenced.

## Key Constraints

- `packages/core` has zero DOM/browser/React imports — enforced by tsconfig lib and ESLint no-restricted-imports
- No inline `/ 12 / 100` for rate conversion — `monthlyRate()` is the single conversion point
- Tailwind v4 CSS-first config (no `tailwind.config.js`)
- Better Auth only
- Public calculator must work without login; accounts unlock saved scenarios only
- `schema_version` field required on scenarios table from day one
