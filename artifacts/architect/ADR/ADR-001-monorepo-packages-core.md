# ADR-001: Turborepo Monorepo with packages/core Zero-DOM Boundary

Date: 2026-05-12
Status: Accepted

## Context

The SIP Calculator requires a calculation engine that runs identically in two contexts: a Next.js web app (Phase 1–6) and a React Native mobile app (v2, planned). The natural path is to embed calc logic directly in `apps/web`, but that would require a full rewrite or an extraction refactor before mobile could share it. Extraction into a shared package after the fact is expensive — it requires auditing every import, removing any browser-specific dependencies that crept in, and re-validating all calcs. The mobile v2 commitment makes the extraction inevitable; the only question is whether it happens before or after Phase 1. Doing it after Phase 1 means doing it under time pressure with user-facing code already depending on the structure.

## Decision

The project uses a Turborepo monorepo from Phase 1, with two workspaces: `apps/web` (Next.js 15 App Router) and `packages/core` (pure TypeScript, package name `@sip/core`). The zero-DOM boundary on `packages/core` is enforced by two mechanisms simultaneously: `tsconfig.json` with `lib: ["ES2022"]` (excludes all DOM lib types) and an ESLint `no-restricted-imports` rule that blocks imports of `react`, `react-dom`, `next`, `recharts`, and any browser-only module. The build fails if either gate is violated. `apps/web` imports `@sip/core` via workspace reference. The future `apps/mobile` React Native package will import the same `@sip/core` with zero changes to the package.

## Consequences

- Phase 1 setup cost is higher (Turborepo scaffold, two `tsconfig.json` files, workspace linking, ESLint rule) — estimated one additional day vs. a flat Next.js project.
- `packages/core` is independently testable with Vitest and no DOM requirement — faster test runs, cleaner CI.
- Any `packages/core` dependency must be Node.js-compatible (no browser polyfills needed). `decimal.js` and `zod` both meet this constraint.
- React Native v2 can import `@sip/core` on day one without any modification to the package.
- The enforcement gates (tsconfig lib + ESLint) catch boundary violations at PR time, not at runtime in a React Native context.
- `pnpm` is required as the package manager (Turborepo's standard pairing).

## Alternatives Rejected

| Alternative | Reason Rejected |
|---|---|
| Flat Next.js project, extract package later | Extraction under time pressure with live user-facing code; import audit is error-prone; chosen to avoid this |
| Turborepo monorepo but without zero-DOM enforcement | Convention-only boundaries break silently; a developer adds `document.` in a util file and it only fails in React Native at runtime — unacceptable |
| Nx monorepo | More opinionated, heavier configuration, longer onboarding for a solo engineer; no feature advantage over Turborepo for this scope |
| Plain pnpm workspaces without Turborepo | No build cache; slower CI; Turborepo adds cache at near-zero configuration cost |
