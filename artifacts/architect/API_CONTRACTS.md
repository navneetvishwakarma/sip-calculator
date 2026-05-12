# API Contracts — SIP Calculator

**Date:** 2026-05-12
**Status:** Accepted

---

## Design Principles

All route handlers live in `apps/web/app/api/`. No separate Express server.

**No calculation endpoints exist.** All SIP math runs in `packages/core` on the client. Route handlers perform auth and scenario CRUD only. This is a hard architectural constraint — see ADR-002.

**Response envelope convention** (all endpoints):

```typescript
type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: { code: string; message: string } };
```

**Auth mechanism:** httpOnly session cookie set by Better Auth. Route handlers read session via Better Auth's `auth.api.getSession()` helper. No Authorization header. No JWT.

---

## Endpoint Table

| Method | Path | Auth Required | Description |
|---|---|---|---|
| POST | `/api/auth/sign-up` | No | Register new account |
| POST | `/api/auth/sign-in` | No | Login with email + password |
| POST | `/api/auth/sign-out` | Yes | Logout; clears session cookie |
| GET | `/api/auth/get-session` | No | Check current session (returns user or null) |
| GET | `/api/scenarios` | Yes | List all scenarios for authenticated user |
| POST | `/api/scenarios` | Yes | Save a new scenario |
| GET | `/api/scenarios/:id` | Yes | Get a single scenario (ownership enforced) |
| PUT | `/api/scenarios/:id` | Yes | Rename a scenario (update name only) |
| DELETE | `/api/scenarios/:id` | Yes | Delete a scenario (ownership enforced) |

Note: `/api/auth/*` routes are handled by Better Auth's built-in route handler — `auth.handler(request)`. The paths above match Better Auth's default route conventions. The app registers a catch-all at `apps/web/app/api/auth/[...all]/route.ts`.

---

## Auth Endpoints

These are handled by Better Auth. The contracts below document what the frontend calls.

### POST `/api/auth/sign-up`

**Rate limited:** 5 requests per minute per IP (Upstash sliding window).

Request body:
```typescript
{
  email: string;     // valid email format
  password: string;  // min 8 characters
  name?: string;     // optional display name
}
```

Response (201 Created):
```typescript
{
  data: {
    user: {
      id: string;
      email: string;
      name: string | null;
      createdAt: string; // ISO 8601
    };
    session: {
      id: string;
      expiresAt: string;
    };
  };
  error: null;
}
```

Error responses:
| HTTP Status | code | Condition |
|---|---|---|
| 422 | `VALIDATION_ERROR` | Missing fields, invalid email format, password < 8 chars |
| 409 | `EMAIL_TAKEN` | Account with this email already exists |
| 429 | `RATE_LIMITED` | Too many registration attempts |
| 500 | `SERVER_ERROR` | Unexpected failure |

---

### POST `/api/auth/sign-in`

**Rate limited:** 10 requests per minute per IP (Upstash sliding window).

Request body:
```typescript
{
  email: string;
  password: string;
}
```

Response (200 OK):
```typescript
{
  data: {
    user: {
      id: string;
      email: string;
      name: string | null;
    };
    session: {
      id: string;
      expiresAt: string;
    };
  };
  error: null;
}
```

Error responses:
| HTTP Status | code | Condition |
|---|---|---|
| 401 | `INVALID_CREDENTIALS` | Email not found or password incorrect (do not distinguish which) |
| 422 | `VALIDATION_ERROR` | Missing or malformed fields |
| 429 | `RATE_LIMITED` | Too many login attempts |
| 500 | `SERVER_ERROR` | Unexpected failure |

---

### POST `/api/auth/sign-out`

No request body.

Response (200 OK):
```typescript
{
  data: { success: true };
  error: null;
}
```

Error responses:
| HTTP Status | code | Condition |
|---|---|---|
| 500 | `SERVER_ERROR` | Unexpected failure (session clears client-side anyway; UI treats logout as always succeeding) |

---

### GET `/api/auth/get-session`

No request body. Cookie sent automatically by browser.

Response (200 OK — authenticated):
```typescript
{
  data: {
    user: {
      id: string;
      email: string;
      name: string | null;
    };
    session: {
      id: string;
      expiresAt: string;
    };
  };
  error: null;
}
```

Response (200 OK — not authenticated):
```typescript
{
  data: null;
  error: null;
}
```

No 401 for this endpoint. Returning `data: null` is the unauthenticated state — it is not an error.

---

## Scenario Endpoints

All scenario endpoints are app-defined route handlers. Every query includes `WHERE user_id = session.userId` — ownership is enforced in every DB query, not just as a top-level auth check.

---

### GET `/api/scenarios`

**Auth required.** Returns authenticated user's scenarios only.

Query params: none (no pagination for v1; all scenarios returned).

Response (200 OK):
```typescript
{
  data: Array<{
    id: string;            // uuid
    name: string;
    type: "sip" | "goal" | "lumpsum" | "stepup" | "hybrid" | "swp";
    inputs: ScenarioParams;
    schemaVersion: number;
    createdAt: string;     // ISO 8601
    updatedAt: string;     // ISO 8601
  }>;
  error: null;
}
```

Error responses:
| HTTP Status | code | Condition |
|---|---|---|
| 401 | `UNAUTHORIZED` | No valid session |
| 500 | `SERVER_ERROR` | DB query failure |

---

### POST `/api/scenarios`

**Auth required.** Creates a new scenario.

Request body:
```typescript
{
  name: string;            // 1–60 characters; trimmed
  inputs: ScenarioParams;  // validated against ScenarioParamsSchema from @sip/core
}
```

Validation: `inputs` is parsed with `ScenarioParamsSchema.parse(body.inputs)`. The `type` field is extracted from `inputs.type` and stored separately. `schemaVersion` defaults to `1` on insert.

Response (201 Created):
```typescript
{
  data: {
    id: string;
    name: string;
    type: "sip" | "goal" | "lumpsum" | "stepup" | "hybrid" | "swp";
    inputs: ScenarioParams;
    schemaVersion: number;
    createdAt: string;
    updatedAt: string;
  };
  error: null;
}
```

Error responses:
| HTTP Status | code | Condition |
|---|---|---|
| 401 | `UNAUTHORIZED` | No valid session |
| 422 | `VALIDATION_ERROR` | `name` missing/too long; `inputs` fails ScenarioParamsSchema |
| 500 | `SERVER_ERROR` | DB insert failure |

---

### GET `/api/scenarios/:id`

**Auth required.** Retrieves one scenario. Returns 404 if the scenario belongs to a different user (ownership enforced, no information disclosure).

Response (200 OK):
```typescript
{
  data: {
    id: string;
    name: string;
    type: "sip" | "goal" | "lumpsum" | "stepup" | "hybrid" | "swp";
    inputs: ScenarioParams;
    schemaVersion: number;
    createdAt: string;
    updatedAt: string;
  };
  error: null;
}
```

Error responses:
| HTTP Status | code | Condition |
|---|---|---|
| 401 | `UNAUTHORIZED` | No valid session |
| 404 | `NOT_FOUND` | Scenario does not exist OR belongs to a different user |
| 500 | `SERVER_ERROR` | DB query failure |

---

### PUT `/api/scenarios/:id`

**Auth required.** Updates scenario name only. Does not accept `inputs` changes (inputs are immutable after save in v1; create a new scenario to change inputs).

Request body:
```typescript
{
  name: string; // 1–60 characters; trimmed
}
```

Response (200 OK):
```typescript
{
  data: {
    id: string;
    name: string;
    updatedAt: string;
  };
  error: null;
}
```

Error responses:
| HTTP Status | code | Condition |
|---|---|---|
| 401 | `UNAUTHORIZED` | No valid session |
| 404 | `NOT_FOUND` | Scenario does not exist OR belongs to a different user |
| 422 | `VALIDATION_ERROR` | `name` missing or too long |
| 500 | `SERVER_ERROR` | DB update failure |

---

### DELETE `/api/scenarios/:id`

**Auth required.** Deletes a scenario permanently. Returns 404 if the scenario belongs to a different user.

No request body.

Response (200 OK):
```typescript
{
  data: { success: true };
  error: null;
}
```

Error responses:
| HTTP Status | code | Condition |
|---|---|---|
| 401 | `UNAUTHORIZED` | No valid session |
| 404 | `NOT_FOUND` | Scenario does not exist OR belongs to a different user |
| 500 | `SERVER_ERROR` | DB delete failure |

---

## Rate Limiting

Auth endpoints (`/api/auth/sign-up`, `/api/auth/sign-in`) are rate limited using Upstash Redis with `@upstash/ratelimit`.

Strategy: sliding window, keyed by IP address.

| Endpoint | Limit | Window |
|---|---|---|
| `/api/auth/sign-up` | 5 requests | 60 seconds |
| `/api/auth/sign-in` | 10 requests | 60 seconds |
| All others | No rate limit (v1) | — |

When the limit is exceeded, the handler returns:

```typescript
{
  data: null;
  error: { code: "RATE_LIMITED", message: "Too many requests. Please try again later." }
}
// HTTP 429
```

The `Retry-After` header is set to the number of seconds until the window resets.

---

## No Calculation Endpoints

There are no endpoints that accept calculator inputs and return computed results. Calculation is performed entirely in `@sip/core` on the client. This is a hard constraint documented in ADR-002. Any future PR that adds calculation logic to a route handler violates this boundary and must be rejected.
