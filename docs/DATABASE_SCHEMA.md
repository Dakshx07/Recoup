# Database Schema

> All 12 tables, their purpose, key relationships, and critical constraints.

_Last updated: 2026-08-24 (build-order steps 1–2 complete)._

---

## Table Overview

| # | Table | Category | Purpose |
|---|---|---|---|
| 1 | `merchants` | Mutable reference | Merchant identity |
| 2 | `debtors` | Mutable reference | Debtor contact info, linked to merchant |
| 3 | `invoices` | Mutable | Invoice records; `outstanding_amount`/`status` evolve with payments |
| 4 | `recovery_cases` | Mutable | Active recovery attempts; the primary state machine |
| 5 | `payment_links` | Mutable | Razorpay payment links per invoice (status transitions only) |
| 6 | `outreach_messages` | Append-only | All outbound messages to debtors |
| 7 | `debtor_replies` | Append-only | All inbound debtor messages (raw, immutable evidence) |
| 8 | `reply_parses` | Append-only | LLM interpretation of replies (separate from raw evidence) |
| 9 | `commitments` | Hybrid (mutable→trigger-frozen) | Promise-to-pay ledger; mutable until terminal state |
| 10 | `payments` | Append-only | Verified payment records (immutable financial fact) |
| 11 | `audit_events` | Append-only (DB-privilege-enforced) | Full audit trail with dual timestamps |
| 12 | `processing_jobs` | Mutable | Job queue — the only "queue" in the system |

## Key Relationships

```
merchants ──< debtors
merchants ──< invoices
debtors   ──< invoices
invoices  ──< recovery_cases (1 open case per invoice, enforced by partial unique index)
invoices  ──< payment_links
invoices  ──< payments
recovery_cases ──< outreach_messages
recovery_cases ──< debtor_replies
recovery_cases ──< commitments (1 VALID_ACTIVE per case, enforced by partial unique index)
debtor_replies ──< reply_parses
payment_links  ──< outreach_messages (optional FK)
payment_links  ──< payments (optional FK)
reply_parses   ──< commitments (optional FK — source_reply_parse_id)
```

## Critical Constraints

### Idempotency (unique indexes)
- `uq_invoices_merchant_number` — one invoice number per merchant
- `uq_payment_links_external` — dedup on external payment link ID
- `uq_debtor_replies_external` — dedup on external message ID (duplicate reply = safe no-op)
- `uq_payments_external` — dedup on external payment ID (duplicate webhook = safe no-op)

### State Machine Invariants (partial unique indexes)
- `uq_recovery_cases_one_open_per_invoice` — at most one open case per invoice (`WHERE closed_at IS NULL`)
- `uq_commitments_one_active_per_case` — at most one `VALID_ACTIVE` commitment per case (`WHERE status = 'VALID_ACTIVE'`)

### Data Integrity (CHECK constraints)
- `invoices.original_amount > 0`, `invoices.outstanding_amount >= 0`
- `recovery_cases.state` — enum CHECK with all 10 valid states
- `commitments.status` — enum CHECK with all 8 valid statuses
- `commitments.promised_amount > 0`
- `reply_parses.confidence` — `BETWEEN 0 AND 1`
- `payments.amount > 0`

### Terminal State Protection
- `trg_commitments_terminal_lock` — DB trigger prevents updates to terminal commitment rows (KEPT, INVALIDATED, VOIDED_BY_DISPUTE, SUPERSEDED)
- `audit_events` — UPDATE/DELETE revoked from authenticated role

## Migrations

| File | Content |
|---|---|
| `0001_init_schema.sql` | All 12 tables with columns, types, FKs, CHECK constraints |
| `0002_constraints_and_indexes.sql` | All indexes, unique indexes, partial unique indexes |
| `0003_rls_policies.sql` | RLS enabled on all tables, SELECT-only policies for reviewer |
| `0004_processing_jobs.sql` | Queue claim pattern documentation |
| `0005_terminal_state_trigger.sql` | Commitment terminal-state trigger + audit immutability |
