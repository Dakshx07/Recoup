# Recoup — Limitations & Production Roadmap

This document provides an honest assessment of current prototype boundaries and the technical roadmap for commercial multi-tenant deployment.

---

## 1. Current Prototype Boundaries

| Component | Prototype Implementation | Production Target |
|---|---|---|
| **Outreach Delivery** | Ingested via simulated webhooks & in-memory test events | Multi-channel SMS/WhatsApp (Twilio/Gupshup) & SendGrid email APIs |
| **Multi-Tenancy** | Single-merchant deployment with unified reviewer role | Hierarchical merchant organizations with RBAC & scoped audit boundaries |
| **Payment Ingestion** | Simulated Razorpay webhook payloads with mock HMAC | Production Razorpay webhook signatures with live API double-verification |
| **Job Scheduling** | Direct HTTP clock trigger (`/api/simulation/advance`) | Distributed cron workers via Celery / Temporal / AWS SQS |
| **Locking Mechanism** | TypeScript optimistic locking (`.eq('state', expected)`) | PostgreSQL `SELECT ... FOR UPDATE` row locks via PL/pgSQL RPCs |

---

## 2. Production Roadmap

1. **Multi-Installment Payment Plans**: Expand `commitments` table to support $N$-step amortized payment plans with individualized milestone monitoring.
2. **Automated Credit Bureau Reporting Handoff**: Connect terminal `ESCALATED` states directly to CIBIL / Experian reporting APIs.
3. **Voice Outreach Channel**: Integrate Twilio Voice + low-latency conversational speech agent with strict policy interrupts.
