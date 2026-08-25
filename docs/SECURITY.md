# Recoup — Security Architecture & Enterprise Controls

This document details the security model, access controls, Row Level Security (RLS) policies, concurrency protection, and hackathon prototype boundaries.

---

## 1. Row Level Security (RLS) Lockdown

To prevent unauthorized direct client mutations via Supabase PostgREST ([ADR 0007](adr/0007-rls-lockdown-and-service-role-writes.md)):

1. **Default-Deny Writes**: All state-bearing tables (`recovery_cases`, `commitments`, `invoices`, `payments`, `audit_events`) enable RLS with default-deny write policies for `anon` and `authenticated` roles.
2. **Service-Role Writes**: All legitimate database mutations execute server-side via `SUPABASE_SERVICE_ROLE_KEY`, which is never exposed to client browsers.
3. **Scoped Reads**: Authenticated dashboard operators are granted `SELECT`-only permissions.

---

## 2. Concurrency & Double-Submit Protection

1. **Optimistic Preconditions**: All state mutation endpoints enforce atomic checks against current state (`.eq('state', expectedState)`).
2. **Race-Condition Safety**: When concurrent requests attempt to mutate the same case simultaneously, only the first request succeeds (`200 OK`). Subsequent requests receive `409 Conflict`, preventing duplicate commitment mutations or duplicate audit entries.

---

## 3. Append-Only Audit Integrity

- `audit_events` table revokes `UPDATE` and `DELETE` privileges across all application roles.
- Every audit record captures:
  - `entity_type` & `entity_id`
  - `actor` (`system`, `policy_engine`, `llm`, `human`)
  - `previous_state` & `new_state`
  - `reason` / `justification`
  - `simulated_time` (authoritative business clock)
  - `real_wall_clock_time` (physical UTC insertion timestamp)

---

## 4. Prototype Boundaries & Demo Tradeoffs

- **Reviewer Identity Fallback**: In demo mode, unauthenticated API calls to `/api/cases/[id]/override` fallback to `reviewer@recoup.internal` for judging convenience. In multi-tenant enterprise deployment, this requires an active Supabase Auth session with MFA.
- **Client Row Locking**: Handled via optimistic locking in TypeScript services rather than PostgreSQL stored procedures (`SELECT ... FOR UPDATE`).
