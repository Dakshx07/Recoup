# Recoup — Build Tracker

A living document tracking every build step, decision, open issue, and maintenance item. Updated as things happen, not retroactively.

---

## Build Progress

| # | Step | Status | Date Started | Date Completed | Notes |
|---|---|---|---|---|---|
| 00 | Project scaffold & conventions | ✅ Done | 2026-08-24 | 2026-08-24 | CONVENTIONS.md, docs stubs, README, .env.example |
| 01 | Schema migration (12 tables) | ✅ Done | 2026-08-24 | 2026-08-24 | — |
| 02 | RLS policies | ✅ Done | 2026-08-24 | 2026-08-24 | Applied immediately |
| 03 | Clock abstraction (LIVE/DEMO) | ✅ Done | 2026-08-24 | 2026-08-24 | — |
| 04 | Synthetic data generator | ✅ Done | 2026-08-24 | 2026-08-24 | Generates 200 invoices across 8 scenarios |
| 05 | State-transition service | ✅ Done | 2026-08-24 | 2026-08-24 | Sole write path, row-lock concurrency |
| 06 | Policy Engine core rules | ✅ Done | 2026-08-24 | 2026-08-24 | All thresholds as named config constants |
| 07 | Processing jobs + worker | ✅ Done | 2026-08-24 | 2026-08-24 | SELECT FOR UPDATE SKIP LOCKED implementation |
| 08 | LLM integration (Gemini) | ✅ Done | 2026-08-24 | 2026-08-24 | Parser and drafter, zero write permission |
| 09 | Payment Link + webhook | ✅ Done | 2026-08-24 | 2026-08-24 | Webhook ingestion and idempotency via DB constraints |
| 10 | Audit logging | ✅ Done | 2026-08-24 | 2026-08-24 | Wired into every transition |
| 11 | Scheduled checks (sim clock) | ⬜ Pending | — | — | — |
| 12 | Evaluation harness | ⬜ Pending | — | — | 70/30 split, held-out set |
| 13 | Supabase Auth + dashboard gate | ⬜ Pending | — | — | Single reviewer |
| 14 | Dashboard (4 screens) | ⬜ Pending | — | — | SHOULD BUILD |
| 15 | Reconciliation job | ⬜ Pending | — | — | SHOULD BUILD |
| 16 | Supabase Realtime | ⬜ Pending | — | — | SHOULD BUILD |
| 17 | eval_runs snapshot table | ⬜ Pending | — | — | SHOULD BUILD |
| 18 | Multi-installment nuance | ⬜ Pending | — | — | SHOULD BUILD |

---

## ADRs Written

| # | ADR | Written At Step | Date |
|---|---|---|---|
| 0001 | Two-tier state machine | 05 | 2026-08-24 |
| 0002 | LLM zero write permission | 08 | 2026-08-24 |
| 0003 | Supabase PostgreSQL as sole datastore | 01 | 2026-08-24 |
| 0004 | Postgres-table queue over Redis/Kafka | 07 | 2026-08-24 |
| 0005 | Simulated clock abstraction | 03 | 2026-08-24 |
| 0006 | Dispute-freeze-not-cancel rule | 06 | 2026-08-24 |
| 0007 | RLS lockdown + service-role writes | 02 | 2026-08-24 |

---

## Open Issues & Decisions

| ID | Issue | Status | Resolution | Date |
|---|---|---|---|---|
| OI-001 | 90% partial-payment tolerance — working default, not validated | Open — placeholder config constant | — | 2026-08-24 |
| OI-002 | Escalation ladder day-counts — working defaults | Open — placeholder config constants | — | 2026-08-24 |
| OI-003 | LLM provider — using Google Gemini | Decided | User confirmed Gemini API key | 2026-08-24 |

---

## Maintenance Log

| Date | What | Details |
|---|---|---|
| 2026-08-24 | Project initialized | Git repo, CONVENTIONS.md, scaffold complete |

---

## Dependencies Added

| Package | Version | Why | Added At Step |
|---|---|---|---|
| next | — | App framework | 00 |
| typescript | — | Type safety | 00 |
| zod | — | Schema validation (LLM output, API input) | 00 |
| vitest | — | Unit testing | 00 |
| @supabase/supabase-js | — | Supabase client | 00 |

---

## Known Tech Debt

| Item | Severity | Notes |
|---|---|---|
| — | — | None yet — will be tracked as discovered |
