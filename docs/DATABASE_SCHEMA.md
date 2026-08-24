# Database Schema

> Condensed from `02_BACKEND_SPEC.md` §2. All 12 tables, key relationships, and constraints.

_Last updated: 2026-08-24 (scaffold — will be filled at build-order step 1)._

---

## Tables

| # | Table | Category | Purpose |
|---|---|---|---|
| 1 | `merchants` | Mutable reference | Merchant identity |
| 2 | `debtors` | Mutable reference | Debtor contact info, linked to merchant |
| 3 | `invoices` | Mutable | Invoice records, outstanding amounts |
| 4 | `recovery_cases` | Mutable | Active recovery attempts, state machine |
| 5 | `payment_links` | Mutable | Razorpay payment links per invoice |
| 6 | `outreach_messages` | Append-only | All outbound messages |
| 7 | `debtor_replies` | Append-only | All inbound debtor messages (raw evidence) |
| 8 | `reply_parses` | Append-only | LLM interpretation of replies (kept separate from raw) |
| 9 | `commitments` | Hybrid (mutable→frozen) | Promise-to-pay ledger |
| 10 | `payments` | Append-only | Verified payment records |
| 11 | `audit_events` | Append-only (DB-enforced) | Full audit trail |
| 12 | `processing_jobs` | Mutable | Job queue (only queue in the system) |

## Key Relationships

_ERD and relationship details to be added at step 1._

## Key Constraints

_Unique indexes, CHECK constraints, and partial indexes to be documented at step 1._
