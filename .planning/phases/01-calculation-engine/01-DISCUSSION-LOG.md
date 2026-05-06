# Discussion Log — Phase 1: Calculation Engine

**Date:** 2026-05-06
**Mode:** Default (interactive questions dismissed — Claude applied recommended defaults)

## Gray Areas Identified

Four areas were identified for discussion. The user bypassed the interactive question step, so all decisions use Claude-recommended defaults derived from ROADMAP.md, REQUIREMENTS.md, and STATE.md context.

## Areas and Decisions

### Monorepo scaffold scope
- **Question presented:** Full skeleton (packages/core + apps/web stub) vs packages/core only; create-turbo vs manual.
- **Decision:** Full skeleton via `pnpm create turbo@latest`, pnpm package manager.
- **Rationale:** Phase 2 needs immediate import access — scaffolding apps/web now avoids setup overhead.

### ScenarioParams output shape
- **Question presented:** Discriminated union vs shared base with optional fields.
- **Decision:** Discriminated union keyed on `type`, with SWPResult as the divergent shape.
- **Rationale:** Cleaner TypeScript exhaustive checks; explicit about which calc produced which output.

### Year-by-year output granularity
- **Question presented:** Annual vs monthly snapshots.
- **Decision:** Annual snapshots only.
- **Rationale:** Phase 2 table is year-by-year; Phase 3 chart plots by year. Monthly = 12x data, zero benefit.

### Test runner
- **Question presented:** Vitest vs Jest.
- **Decision:** Vitest.
- **Rationale:** Native to Vite/ESM ecosystem, faster, cleaner TypeScript support, works with pnpm workspaces.

## Decisions Applied at Claude's Discretion

All five decisions (D-01 through D-05) were Claude's recommended defaults. User did not override any.
