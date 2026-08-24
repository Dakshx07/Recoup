# Architecture

> Condensed from `01_SYSTEM_DESIGN.md` — reviewer-facing overview of Recoup's architecture.

_This document is updated incrementally as components are built. Last updated: 2026-08-24 (scaffold)._

---

## Component Overview

```
Synthetic data → Ingestion (Next.js API routes)
                        │  signature/dedup check
                        ▼
                processing_jobs (Postgres table — the only "queue")
                        │  claimed via SELECT...FOR UPDATE SKIP LOCKED
                        ▼
          ┌───────────────────────────────────────────┐
          │            Domain layer (pure TS)           │
          │  Clock abstraction │ Policy Engine │ LLM     │
          │  parsing/drafting (schema-validated only)    │
          └───────────────────┬───────────────────────┘
                              ▼
            State-Transition Service (sole write path;
            BEGIN → row lock → validate → decide → transition
            → audit insert → COMMIT)
                              │
                              ▼
                Supabase PostgreSQL (RLS-locked,
                service-role key used server-side only)
                              │
                              ▼
             Next.js dashboard (Supabase Auth-gated)
```

## Component Responsibilities

_To be filled as each component is built._

## Why Each Piece Exists

_No component without a stated reason — to be documented as components are added._
