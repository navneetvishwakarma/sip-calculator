# Security Threat Model — SIP Calculator

**Date:** 2026-05-12
**Status:** Architect draft — security-agent validation pending
**Scope:** Web application (apps/web), API route handlers, Neon database, Better Auth session layer

---

## STRIDE Threat Table

| # | STRIDE Category | Specific Threat | Affected Component | Severity | Proposed Mitigation |
|---|---|---|---|---|---|
| T-01 | **Spoofing** | Attacker reuses a stolen session cookie to impersonate a logged-in user | Better Auth session layer, `/api/auth/get-session` | M | httpOnly cookie prevents JS-based theft; `sameSite: lax` prevents cross-origin use; Better Auth rotates session ID on login; set `Secure` flag in production (HTTPS only) |
| T-02 | **Spoofing** | Attacker registers with a slightly modified email (`user+spam@example.com`) to create duplicate-feeling accounts | `/api/auth/sign-up` | L | Email normalization (lowercase, trim) before uniqueness check; Better Auth handles duplicate detection; no material harm from this vector at v1 scale |
| T-03 | **Tampering** 🔴 | IDOR: attacker calls `GET/PUT/DELETE /api/scenarios/:id` with a victim's scenario UUID (guessable because UUIDs leak in API responses) | `/api/scenarios/:id` route handlers | **H** | Every DB query must include `WHERE user_id = session.userId` — returning 404 (not 403) when a row exists but belongs to a different user, to avoid confirming row existence. Ownership check is in every Drizzle query, not only as a top-level auth check. Code review gate: PRs touching scenario handlers must show the `eq(scenarios.userId, session.user.id)` clause. |
| T-04 | **Tampering** | Attacker sends a malformed or oversized `inputs` JSONB payload to `POST /api/scenarios`, attempting to corrupt the database or exploit a parser vulnerability | `POST /api/scenarios` | M | All request bodies validated with `ScenarioParamsSchema.parse()` (zod 4) before any DB operation. Zod rejects extra fields by default. Read `Content-Length` header in each route handler and reject with 413 before parsing if it exceeds 64KB. |
| T-05 | **Tampering** | Attacker modifies URL query params to inject malformed `ScenarioParams` that crash the calculator or produce misleading results | Client-side URL state decoder | L | `ScenarioParamsSchema.safeParse()` on all URL params; invalid fields silently fall back to Indian defaults (documented in USER_FLOWS.md Flow 6 error state). Calculator never crashes on bad input — renders default state. |
| T-06 | **Repudiation** | A user denies having saved a particular scenario; no evidence of the save action exists | `scenarios` table | L | `created_at` and `updated_at` timestamps on every row provide a basic audit trail. For v1, this is sufficient. A full event log is a v2 consideration. |
| T-07 | **Information Disclosure** | Unauthenticated attacker enumerates other users' scenarios via `/api/scenarios` by cycling through UUIDs | `GET /api/scenarios/:id` | M | All scenario endpoints require a valid session (401 if no session). Ownership enforced in query (404 if not owner) — does not confirm row existence. UUIDs are not sequential and resist enumeration, but the ownership check is the primary defence. |
| T-08 | **Information Disclosure** | Session cookie transmitted over HTTP (non-TLS) is readable in transit | Browser → Vercel | M | Set `Secure` flag on session cookie. Vercel enforces HTTPS on all production deployments; HTTP is redirected to HTTPS. Ensure Better Auth session config sets `secure: true` in production (`NODE_ENV === 'production'`). |
| T-09 | **Information Disclosure** | Detailed error messages in API responses reveal internal stack traces, schema structure, or query details | All route handlers | M | Route handlers catch all errors and return the generic envelope `{ data: null, error: { code: "SERVER_ERROR", message: "Unexpected error" } }`. Raw error details logged server-side only (Vercel function logs), never surfaced to client. |
| T-10 | **Denial of Service** 🔴 | Credential stuffing or brute-force against `/api/auth/sign-in` — attacker cycles through known email/password combos at high volume, either to gain access or to exhaust Neon connection limits | `/api/auth/sign-in` | **H** | Upstash Redis sliding-window rate limit: 10 requests per minute per IP. Better Auth's built-in brute-force protection (configurable lockout after N failures). Return identical error for wrong email vs. wrong password to prevent user enumeration. Monitor Upstash metrics for sustained attack patterns. |
| T-11 | **Denial of Service** | Mass account registration spam fills the `users` table with junk accounts, degrading Neon storage and query performance | `/api/auth/sign-up` | M | Rate limit: 5 requests per minute per IP (Upstash). Email verification flow (Better Auth supports this) would add friction — evaluate for v1.1. At v1 scale the IP rate limit is sufficient. |
| T-12 | **Denial of Service** | Attacker sends extremely large request bodies to API endpoints, exhausting memory in Vercel serverless functions | All route handlers | M | Read `Content-Length` request header at the top of each route handler; if value exceeds 64KB, return 413 immediately before parsing any body. Note: the Pages Router `export const config = { api: { bodyParser: { sizeLimit } } }` pattern does NOT apply to Next.js 15 App Router route handlers — in-handler length check is the correct mechanism. Vercel's platform-level limit is 4.5MB; the 64KB application-level check is more restrictive and protects against memory pressure before the platform gate. |
| T-13 | **Elevation of Privilege** 🔴 | An unauthenticated request reaches a scenario CRUD endpoint by bypassing the session check (e.g., middleware misconfiguration, route handler ordering error) | `/api/scenarios/*` | **H** | Session check is performed inside every route handler via `await auth.api.getSession({ headers: request.headers })` — not delegated to a middleware that could be misconfigured. If `getSession()` returns null, handler returns 401 immediately. No scenario DB query runs without a confirmed session user. CI test: integration test that calls each scenario endpoint without a session cookie and asserts 401. |
| T-14 | **Elevation of Privilege** | An attacker escalates a regular user session to access admin functionality — there is no admin role but future additions could be vulnerable if roles are not enforced from day one | Route handlers | L | No admin role exists in v1. Single-tenant model: every user accesses only their own data. If admin functionality is added later, a separate `role` check must be added to Better Auth's user schema and verified in every privileged route handler. Document this as a future risk. |
| T-15 | **Denial of Service** | Supply chain attack: malicious version of `@sip/core` dependency or any transitive dependency compromises the calculation engine or auth layer | `packages/core`, `apps/web` | M | Pin major versions in `package.json` with `^` (accept patches only). Use `pnpm audit` in CI. Enable GitHub Dependabot / Renovate for automated security update PRs. Do not auto-merge; review changelogs for breaking changes. |

---

## HIGH Severity Threats Summary

| ID | Threat | Mitigation Status |
|---|---|---|
| T-03 | IDOR on scenario endpoints — missing `user_id` WHERE clause | Required: enforce in every Drizzle query; code review gate; return 404 not 403 |
| T-10 | Credential stuffing / brute force on `/api/auth/sign-in` | Required: Upstash rate limit + Better Auth lockout |
| T-13 | Unauthenticated access to scenario endpoints via session check bypass | Required: session check inside every route handler, not in middleware; CI integration test |

---

## Out of Scope (v1)

| Threat | Reason Out of Scope |
|---|---|
| SQL injection | Drizzle ORM uses parameterized queries; raw string interpolation into SQL is not used anywhere |
| Stored XSS via scenario name | Scenario names are user-supplied text rendered in React; React escapes text content by default; `dangerouslySetInnerHTML` is not used |
| CSRF | `sameSite: lax` on session cookie blocks cross-site POSTs for navigation-triggered requests; app does not use `sameSite: none` |
| Subdomain takeover | Single domain, no subdomains |
| OAuth token leakage | OAuth providers not in v1 scope (email/password only) |

---

## Open Items for Security Agent

1. Confirm Better Auth session cookie config (`secure: true`, `httpOnly: true`, `sameSite: "lax"`) is set correctly for both development and production environments.
2. Verify Upstash rate limit implementation does not have a time-of-check/time-of-use race condition under high concurrency.
3. Assess whether email verification should be required before a new account can save scenarios (T-11 mitigation upgrade).
4. Review zod 4 schema for `ScenarioParams` — confirm `.strict()` mode or `.passthrough()` behaviour and which is applied at the API boundary vs. the URL decode path.
