# Recoup — Security Architecture & Enterprise Controls

This document details the security model, access controls, Row Level Security (RLS) policies, concurrency protection, and hackathon prototype boundaries for the Recoup P2P Recovery Agent.

---

## 1. Security Architecture Overview

Recoup enforces a strict defense-in-depth model built around 6 core security invariants:

```
[Untrusted Client / Inbound Channel]
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. Zero-Tool LLM Intelligence Boundary                      │
│    • Schema-validated JSON only (Zod ReplyParseSchema)      │
│    • ZERO database write permissions                        │
│    • Immunity to direct state manipulation/prompt injection │
└────────────────────────┬────────────────────────────────────┘
                         │ Structured Candidate
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Deterministic Policy Authority Layer                     │
│    • 13 locked business constants in config.ts              │
│    • Dispute-Freeze Invariant (is_frozen = true)            │
│    • Quiet hours (21:00–09:00 IST) & Contact Frequency Caps │
└────────────────────────┬────────────────────────────────────┘
                         │ Validated Legal Command
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. State Transition Service (Sole Authorized Writer)        │
│    • Legal transition validation against transition table   │
│    • Terminal state lockouts (CLOSED_* immutable)           │
│    • Optimistic concurrency precondition locking (.eq)      │
└────────────────────────┬────────────────────────────────────┘
                         │ Atomic Mutation
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. PostgreSQL / Supabase Data Layer                         │
│    • RLS default-deny writes for anon & authenticated       │
│    • Server-only SUPABASE_SERVICE_ROLE_KEY execution        │
│    • Append-only immutable audit_events (UPDATE/DELETE rev) │
│    • Unique constraint on external_payment_id (Idempotency) │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Implemented Security Controls

### A. Zero-Tool LLM Boundary & Injection Immunity
- The LLM layer (`src/domain/llm/reply-parser.ts`) runs as a pure text-to-structured-data parser.
- Possesses **zero tool execution privileges** and **zero database credentials**.
- Output is strictly validated via Zod (`ReplyParseSchema`). Unrecognized or malformed outputs fall back safely to `intent_type = 'AMBIGUOUS'` without mutating business state.

### B. Single Write Authority & Transition Validation
- Direct database writes from arbitrary API endpoints are prohibited.
- `StateTransitionService` verifies that every transition is legally permitted per the canonical state transition matrix (`src/domain/state-machine/transitions.ts`).
- Terminal states (`CLOSED_PAID`, `CLOSED_PARTIAL`, `CLOSED_WRITTEN_OFF`) strictly reject all automated and human override transitions.

### C. Concurrency Preconditions & Double-Submit Protection
- State mutations enforce atomic preconditions (`.eq('state', expectedState)`).
- Concurrent or duplicate submissions sent at the exact same millisecond result in **exactly one `200 OK` and one `409 Conflict`**, preventing duplicate debtor promises or double-credit payouts.

### D. Payment Webhook Idempotency
- `PaymentVerifier` enforces database-level idempotency via unique constraints (`uq_payments_external` on `external_payment_id`).
- Duplicate payment webhooks return early (`Idempotent return`) without modifying account balances or appending duplicate audit events.

### E. Row Level Security (RLS) & Credential Isolation
- State-bearing tables (`recovery_cases`, `commitments`, `invoices`, `payments`, `audit_events`) enforce RLS default-deny for client roles.
- `SUPABASE_SERVICE_ROLE_KEY` is strictly confined to server-side Node.js execution and is never bundled in client builds.
- Zero API keys or secrets are committed to the public Git tree.

### F. Append-Only Audit Integrity
- The `audit_events` ledger captures: `entity_id`, `actor`, `event_type`, `previous_state`, `new_state`, `reason`, `simulated_time`, and `real_wall_clock_time`.
- `UPDATE` and `DELETE` operations on `audit_events` are permanently blocked.

---

## 3. Prototype Scope vs. Production Hardening

In alignment with buildathon hackathon guidelines, the following boundaries distinguish the prototype implementation from commercial multi-tenant enterprise deployment:

| Control | MVP Prototype Implementation | Commercial Enterprise Production |
|---|---|---|
| **Human Reviewer Auth** | Reviewer session with `reviewer@recoup.internal` fallback for demo convenience | Enforced Supabase Auth / Okta SAML SSO with mandatory MFA and RBAC roles |
| **Row Locking** | TypeScript optimistic locking (`.eq('state', expected)`) | PostgreSQL `SELECT ... FOR UPDATE` row locks via PL/pgSQL RPCs |
| **Webhook Signatures** | Webhook verification via `PaymentVerifier` with mock HMAC simulation | Production Razorpay webhook HMAC-SHA256 signature verification via raw request buffer |
| **Rate Limiting** | Policy-level contact frequency caps (3 touches / 7 days) | Cloudflare / Redis token-bucket rate limiting per IP and API key |
| **Multi-Tenancy** | Single-merchant deployment with unified dashboard console | Multi-tenant organization isolation with scoped RLS tenant partitions |

---

## 4. Internal Documentation & ADR Index

All architecture decision records are verified and linked:
- [ADR 0001: Two-Tier State Machine](adr/0001-two-tier-state-machine.md)
- [ADR 0002: LLM Zero Write Permission](adr/0002-llm-zero-write-permission.md)
- [ADR 0003: Supabase PostgreSQL as Sole Datastore](adr/0003-supabase-postgres-as-sole-datastore.md)
- [ADR 0004: Postgres-Backed Queue over Redis](adr/0004-postgres-backed-queue-over-redis.md)
- [ADR 0005: Simulated Clock Abstraction](adr/0005-simulated-clock-abstraction.md)
- [ADR 0006: Dispute-Freeze-Not-Cancel Rule](adr/0006-dispute-freeze-not-cancel-rule.md)
- [ADR 0007: RLS Lockdown and Service-Role Writes](adr/0007-rls-lockdown-and-service-role-writes.md)

