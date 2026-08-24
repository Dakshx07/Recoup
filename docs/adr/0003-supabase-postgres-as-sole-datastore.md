# ADR 0003: Supabase PostgreSQL as Sole Datastore

> Status: **Accepted** — 2026-08-24, build-order step 1.

## Context

The system's core guarantees — idempotent webhook handling, promise validity enforcement, atomic multi-table state transitions, and one-active-commitment-per-case invariants — all require strict relational guarantees. We needed to choose between:

1. **Firebase / Firestore / MongoDB** (document stores)
2. **Plain self-hosted PostgreSQL** (Neon, Railway, RDS)
3. **Supabase PostgreSQL** (managed Postgres with Auth, PostgREST, Realtime)

## Decision

**Supabase PostgreSQL**, kept as the sole datastore.

**Why not a document store?** The system's invariants are relational by nature:
- Idempotency via `UNIQUE` constraints (duplicate webhooks → safe no-op)
- Promise validity via `CHECK` constraints (`amount > 0`, status enum)
- Atomic state transitions via `SELECT ... FOR UPDATE` row locking
- One active commitment per case via partial unique index (`WHERE status = 'VALID_ACTIVE'`)
- One open case per invoice via partial unique index (`WHERE closed_at IS NULL`)

A document database doesn't have equivalents that are as strict or as easy to reason about. You'd be reimplementing relational guarantees in application code — error-prone and harder to audit.

**Why not plain Postgres?** Nearly a wash functionally. Supabase adds:
- **Auth for free** — single reviewer identity without a custom auth system (genuine win for a solo build)
- **PostgREST** auto-REST API — a real risk (see ADR 0007), but manageable with RLS
- **Realtime** — logical replication over websockets for live dashboard updates (SHOULD BUILD)

The gap (PostgREST bypass risk) is addressed in ADR 0007.

## Consequences

**Positive:**
- All invariants enforced at the database level, not just in application code
- Auth solved at near-zero build cost
- ACID transactions with row locking for concurrency safety
- Standard SQL — no vendor lock-in on the data model itself

**Negative:**
- PostgREST creates a structural bypass risk that must be actively mitigated with RLS (ADR 0007)
- Supabase's managed infrastructure means less control over Postgres configuration
- Storage and Edge Functions surface area go unused (not a cost, just unused)

**Residual risk:** If Supabase's managed service has an outage, there's no local fallback for the demo. Mitigated by the simulated clock + synthetic data making the system locally reproducible for evaluation.
