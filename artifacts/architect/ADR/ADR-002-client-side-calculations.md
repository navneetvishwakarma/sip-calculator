# ADR-002: Client-Side-Only Calculations

Date: 2026-05-12
Status: Accepted

## Context

The product's core value is instant SIP projection with no sign-up required. Every calculator type must respond to input changes without a round-trip to a server. Two implementation paths exist: pure client-side functions (synchronous, no network) or a server-side calculation API (route handler accepts inputs, returns result). A server-side path creates a network dependency on the critical user path: every keystroke triggers a fetch, adding latency, requiring a loading state, and making the calculator non-functional offline. It also duplicates logic — the same calculation would need to exist both in `packages/core` (for React Native v2) and in server-side route handlers, creating a two-implementation maintenance problem.

## Decision

All calculation logic lives exclusively in `packages/core` and executes on the client. The six calculator functions (`calculateSIP`, `calculateGoal`, `calculateLumpSum`, `calculateStepUp`, `calculateHybrid`, `calculateSWP`) are pure functions: deterministic, side-effect-free, no I/O. Route handlers contain no calculation code. This is enforced by code review convention and documented as a hard boundary in `API_CONTRACTS.md`. Calculation results are never sent to or stored on the server — only `ScenarioParams` (inputs) are persisted in Phase 6.

## Consequences

- Calculator works with zero network latency on every input change; no loading states needed for calculation.
- Calculator works offline and during backend downtime; core value is never degraded by server availability.
- `packages/core` is the single source of truth for all calculation logic; React Native v2 shares it without drift.
- No server-side calculation audit trail exists. If a future requirement needs an audit log of what result a user saw at a specific time, the architecture must change — stored inputs alone cannot reproduce the exact result if the calculation algorithm changes between the save and the re-run. This is acceptable for v1.
- Unit testing all calculation logic is straightforward — Vitest with no DOM setup, no mocks, no HTTP intercept.
- A bad calculation bug ships to all users simultaneously (no server-side gate). Mitigation: cross-validation tests against ET Money/Groww in CI before any calculation code change is merged.

## Alternatives Rejected

| Alternative | Reason Rejected |
|---|---|
| Server-side route handlers for calculation | Network latency on every keypress; requires loading state; two implementations to maintain; breaks offline use; no benefit for v1 |
| Server-side calculation for persistence (store computed outputs) | Storing computed outputs creates a stale-output problem when calc logic updates; inputs-only storage avoids this; recalculate on load |
| WebAssembly for calculation | Engineering overhead disproportionate to problem; JavaScript floating-point is sufficient for Indian retail investment amounts |
