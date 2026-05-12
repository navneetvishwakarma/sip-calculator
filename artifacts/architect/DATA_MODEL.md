# Data Model — SIP Calculator

**Date:** 2026-05-12
**Status:** Accepted

---

## Entity Table

| Entity | Owner | Storage | Description |
|---|---|---|---|
| user | Better Auth | Postgres (Better Auth managed table) | Authenticated user account |
| session | Better Auth | Postgres (Better Auth managed table) | Active session record tied to httpOnly cookie |
| account | Better Auth | Postgres (Better Auth managed table) | OAuth provider link (email/password counts as a credential record) |
| verification | Better Auth | Postgres (Better Auth managed table) | Email verification / password reset tokens |
| scenario | App-owned | `scenarios` table | Named, saved calculator snapshot owned by a user |
| ScenarioParams | In-memory / JSONB | Client state + `scenarios.inputs` JSONB | Serializable input discriminated union; the canonical representation of any calculator state |
| ScenarioResult | In-memory only | Never persisted | Computed output from `@sip/core`; recalculated on every load |
| ComparisonTray | In-memory only | React state (ephemeral) | Up to 4 ScenarioResult snapshots held for comparison; cleared on refresh |

---

## Better Auth Tables — Managed, Not Defined Here

Better Auth's Drizzle adapter generates and manages the `user`, `session`, `account`, and `verification` tables automatically via its own migration. Do not redefine these tables in app migrations. The only cross-reference from app code is `scenarios.user_id → user.id`.

The Better Auth `user` table has at minimum: `id`, `email`, `emailVerified`, `name`, `createdAt`, `updatedAt`. The exact schema is determined by the Better Auth Drizzle adapter version — do not hardcode assumptions about it in application queries.

---

## App-Owned Schema: `scenarios` Table

### Field Definitions

| Field | Type | Constraints | Purpose |
|---|---|---|---|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Stable row identifier; used in API paths (`/api/scenarios/:id`) |
| user_id | uuid | NOT NULL, FK → user.id ON DELETE CASCADE | Row ownership; all queries must include `WHERE user_id = session.userId` |
| name | text | NOT NULL, max 60 chars | User-assigned scenario name (auto-generated default from UI) |
| type | text | NOT NULL, CHECK IN ('sip','goal','lumpsum','stepup','hybrid','swp') | Discriminator copy outside JSONB; enables filtering by calculator type without parsing JSONB |
| inputs | jsonb | NOT NULL | Serialized `ScenarioParams` — the inputs-only payload for round-trip restore |
| schema_version | integer | NOT NULL, DEFAULT 1 | Version of the `ScenarioParams` shape stored in `inputs`. Not the DB schema version. Increment when the shape of any ScenarioParams variant changes. On load: if version < current, run per-row migration function; if migration fails, surface "this scenario can't be loaded" gracefully — do not crash. |
| created_at | timestamptz | NOT NULL, DEFAULT now() | Display in saved scenarios list |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | Updated on rename (PUT /api/scenarios/:id) |

---

## Drizzle Schema — TypeScript

```typescript
// packages/db/src/schema.ts
import { pgTable, uuid, text, jsonb, integer, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Better Auth manages its own user/session/account/verification tables.
// Reference the user table for FK only — do not redefine it.
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  emailVerified: timestamp("email_verified"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const scenarios = pgTable("scenarios", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(),
  inputs: jsonb("inputs").notNull(),
  schemaVersion: integer("schema_version").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
```

Note: Better Auth uses `text` primary keys for user IDs, not `uuid`. `scenarios.user_id` is typed as `text` to match.

---

## Index Definitions

```sql
-- Primary access pattern: list all scenarios for a user, ordered by created_at desc
CREATE INDEX idx_scenarios_user_id ON scenarios (user_id);

-- Optional: filter by calculator type within a user's scenarios
CREATE INDEX idx_scenarios_user_type ON scenarios (user_id, type);
```

In Drizzle syntax:

```typescript
import { index } from "drizzle-orm/pg-core";

export const scenariosUserIdx = index("idx_scenarios_user_id").on(scenarios.userId);
export const scenariosUserTypeIdx = index("idx_scenarios_user_type").on(scenarios.userId, scenarios.type);
```

---

## ScenarioParams Discriminated Union

This type is exported from `packages/core`. It is the single normalized shape that all six calculators emit as their input payload. It is JSON-serializable (no Dates, no class instances, no circular refs) because it must survive URL query param encoding (Phase 4) and JSONB storage (Phase 6).

```typescript
// packages/core/src/types.ts

export type CalcType = "sip" | "goal" | "lumpsum" | "stepup" | "hybrid" | "swp";

export interface SIPParams {
  type: "sip";
  monthlyAmount: number;       // ₹/month
  annualReturnPct: number;     // percent (e.g. 12, not 0.12)
  durationYears: number;
}

export interface GoalParams {
  type: "goal";
  targetCorpus: number;        // ₹
  annualReturnPct: number;
  durationYears: number;
}

export interface LumpSumParams {
  type: "lumpsum";
  principal: number;           // ₹ one-time
  annualReturnPct: number;
  durationYears: number;
}

export interface StepUpParams {
  type: "stepup";
  startingMonthlyAmount: number; // ₹/month
  annualStepUpPct: number;       // percent (e.g. 10)
  annualReturnPct: number;
  durationYears: number;
}

export interface HybridParams {
  type: "hybrid";
  monthlyAmount: number;       // ₹/month (SIP component)
  lumpSum: number;             // ₹ one-time
  annualReturnPct: number;
  durationYears: number;
}

export interface SWPParams {
  type: "swp";
  corpus: number;              // ₹ starting corpus
  monthlyWithdrawal: number;   // ₹/month
  annualReturnPct: number;
  // No durationYears — output is the duration
}

export type ScenarioParams =
  | SIPParams
  | GoalParams
  | LumpSumParams
  | StepUpParams
  | HybridParams
  | SWPParams;
```

The corresponding zod schema is exported as `ScenarioParamsSchema` from `packages/core` and used for:
- Validating URL query param payloads on page load (Phase 4)
- Validating `POST /api/scenarios` request bodies (Phase 6)

---

## YearlySnapshot Shape

Used in `ScenarioResult` (computed, never persisted):

```typescript
// packages/core/src/types.ts

export interface YearlySnapshot {
  year: number;               // 1-indexed
  monthlyInvestment: number;  // may vary year-over-year for step-up SIP
  totalInvested: number;      // cumulative invested to this year
  interestEarned: number;     // cumulative gains to this year
  corpusValue: number;        // total corpus at end of year
}
```

---

## Relationship Diagram

```
┌─────────────────────────┐
│  Better Auth (managed)  │
│  ┌───────┐  ┌─────────┐ │
│  │ user  │  │ session │ │
│  └───┬───┘  └─────────┘ │
│      │ id               │
└──────┼──────────────────┘
       │
       │ user_id (FK, text)
       ▼
┌──────────────────────────────────────┐
│             scenarios                │
│  id (uuid PK)                        │
│  user_id (text, FK → user.id)        │
│  name (text)                         │
│  type (text)                         │
│  inputs (jsonb) ← ScenarioParams     │
│  schema_version (int)                │
│  created_at, updated_at              │
└──────────────────────────────────────┘

Client-only (never persisted):
┌──────────────────┐    ┌─────────────────────┐
│  ComparisonTray  │    │  InflationToggleState│
│  ScenarioResult[]│    │  on: bool, rate: num │
│  (React state)   │    │  (React state)       │
└──────────────────┘    └─────────────────────┘
```

---

## Session Store Note

Better Auth manages the `session` table in Postgres via its Drizzle adapter. There is no separate `express-session` or `connect-pg-simple` session store. Session cookies are httpOnly, `sameSite: lax`, and reference a session record in the Better Auth session table. Session expiry and rotation are managed by Better Auth internally.
