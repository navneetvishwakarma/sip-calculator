# ADR-003: Better Auth with httpOnly Session Cookies

Date: 2026-05-12
Status: Accepted

## Context

Phase 5 adds user authentication. Two decisions are coupled: which auth library to use, and how to store the session credential client-side. The auth library choice is constrained: Lucia was officially deprecated in early 2025 (author directed users to Better Auth) — any implementation using Lucia is building on a dead library. The session storage decision has a security implication: storing a session token in `localStorage` means any JavaScript running on the page can read it (XSS vector); storing it in an `httpOnly` cookie means no JavaScript can read it, and `sameSite: lax` blocks cross-site POST requests (the primary CSRF attack vector) without requiring a separate CSRF token.

## Decision

Better Auth is the auth library. It provides email/password authentication, a Drizzle adapter that manages the session/user tables, and a Next.js App Router handler. Sessions are stored as httpOnly, `sameSite: lax` cookies — this is Better Auth's default configuration and matches the PRD requirement (AUTH-02). The session check on page load uses Better Auth's `GET /api/auth/get-session` endpoint, which returns the session user or null. This drives the auth state across the entire app via Zustand `authSlice` without storing any token client-side.

## Consequences

- XSS attacks cannot steal session tokens — the cookie is not readable by JavaScript.
- `sameSite: lax` provides CSRF protection for navigation-triggered requests without an additional CSRF token layer. API route handlers that mutate data (POST, PUT, DELETE) are cross-origin-POST-protected at the browser level.
- Session state requires a server round-trip on page load (`GET /api/auth/get-session`). A loading state is needed in the Nav component while this resolves. Nav skeleton shimmer handles this (documented in WIREFRAMES.md Screen 9).
- Better Auth manages its own database tables (`user`, `session`, `account`, `verification`). These tables are not defined in app migrations — Better Auth's Drizzle adapter handles them. The app only defines the `scenarios` table.
- If Better Auth introduces a breaking change, migration to another library requires updating auth routes and the session check. This is the cost of any auth library choice. Better Auth's API surface is small enough that migration is manageable.
- The `user.id` field in Better Auth is `text` type (not `uuid`) — `scenarios.user_id` must match this type.

## Alternatives Rejected

| Alternative | Reason Rejected |
|---|---|
| Lucia Auth | Officially deprecated in early 2025; author explicitly directed users to Better Auth; building on a dead library |
| Auth.js (NextAuth v5) | Valid alternative; weaker TypeScript inference; slightly larger setup surface; Better Auth is the more forward-looking choice |
| Passport.js | Express middleware pattern; no native Next.js App Router adapter; requires fragile compatibility shims |
| JWT in localStorage | XSS vector — localStorage is readable by any JavaScript on the page; no server-side revocation without a token store anyway |
| JWT in httpOnly cookie | Stateless by design; cannot revoke a session without a token denylist (requires Redis or a DB table, negating the stateless benefit); Better Auth's session table is the simpler model |
| Custom session implementation (`express-session` + `connect-pg-simple`) | No Express in this stack (Next.js route handlers); re-implementing session management from scratch adds security surface without benefit |
