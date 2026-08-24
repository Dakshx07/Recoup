# Recoup — Complete System Explainer

This document explains **everything** about Recoup — what it is, why it exists, how it works, every design decision, and the reasoning behind each choice. Written for someone who wants to deeply understand the system without reading the code.

---

## Table of Contents

1. [What Problem Does Recoup Solve?](#1-what-problem-does-recoup-solve)
2. [What Is Recoup, Exactly?](#2-what-is-recoup-exactly)
3. [Core Architecture — Why This Shape?](#3-core-architecture--why-this-shape)
4. [The Two State Machines](#4-the-two-state-machines)
5. [The Policy Engine — Why Not Let the AI Decide?](#5-the-policy-engine--why-not-let-the-ai-decide)
6. [The LLM Boundary — What Can and Can't the AI Do?](#6-the-llm-boundary--what-can-and-cant-the-ai-do)
7. [The Database — Why PostgreSQL, Why Supabase?](#7-the-database--why-postgresql-why-supabase)
8. [Row Level Security — The PostgREST Bypass Problem](#8-row-level-security--the-postgrest-bypass-problem)
9. [The Dispute-Freeze Edge Case — Why Not Just Cancel?](#9-the-dispute-freeze-edge-case--why-not-just-cancel)
10. [The Simulated Clock — Why Not Just Use Real Time?](#10-the-simulated-clock--why-not-just-use-real-time)
11. [Payment Verification — Why Not Trust the Webhook?](#11-payment-verification--why-not-trust-the-webhook)
12. [The Audit Trail — Why Two Timestamps?](#12-the-audit-trail--why-two-timestamps)
13. [The Evaluation Approach](#13-the-evaluation-approach)
14. [What We Deliberately Did NOT Build](#14-what-we-deliberately-did-not-build)
15. [How This Relates to Razorpay's Existing Products](#15-how-this-relates-to-razorpays-existing-products)
16. [Glossary](#16-glossary)

---

## 1. What Problem Does Recoup Solve?

B2B/SME merchants have overdue receivables — invoices that debtors haven't paid on time. Today, recovery is either:
- **Manual chasing** — a human sends follow-up emails, makes calls, tracks responses in a spreadsheet
- **Generic reminder bots** — automated messages on a schedule, with no understanding of what the debtor said back

Neither approach has:
- **Structured commitment tracking** — when a debtor says "I'll pay ₹50,000 by Friday," that promise isn't recorded as a formal, validated commitment with a due date and monitoring
- **Policy-governed escalation** — escalation happens based on gut feel or fixed timers, not based on evidence (was a promise made? was it kept? was there a dispute?)
- **An audit trail** — no record of what happened, when, why, and who decided what

Recoup adds all three layers.

---

## 2. What Is Recoup, Exactly?

An agent that:
1. **Takes a batch of overdue invoices** as input
2. **Sends outreach** to each debtor (LLM-drafted, policy-gated)
3. **Parses debtor replies** using the LLM (structured output, not free-form interpretation)
4. **Extracts and validates commitments** — "I'll pay ₹50,000 by Friday" becomes a formal, validated promise-to-pay
5. **Monitors commitments** — when the due date arrives, checks if payment was received
6. **Escalates through deterministic rules** when promises are broken — never based on AI judgment
7. **Records everything** in an immutable audit trail with both simulated and real timestamps

**The single most important thing to understand:** The LLM drafts and parses natural language. It **never** decides anything involving money, state, compliance, or stopping. A deterministic Policy Engine owns every one of those decisions.

---

## 3. Core Architecture — Why This Shape?

```
Synthetic data → Ingestion → processing_jobs table (the only "queue")
                                      ↓
                    ┌─────────────────────────────────────────┐
                    │          Domain Layer (pure TypeScript)    │
                    │  Clock │ Policy Engine │ LLM (parse/draft) │
                    └──────────────────┬──────────────────────┘
                                      ↓
                    State-Transition Service (SOLE write path)
                    BEGIN → row lock → validate → transition → audit → COMMIT
                                      ↓
                    Supabase PostgreSQL (RLS-locked)
                                      ↓
                    Next.js Dashboard (auth-gated, read-only)
```

**Why this shape and not a fancier one?**

- **No Redis/Kafka** — at ~200 invoices, a distributed broker is infrastructure for appearance, not need. `SELECT ... FOR UPDATE SKIP LOCKED` gives queue semantics natively in PostgreSQL.
- **No LangChain/LangGraph** — the product's central claim is "every decision is bounded and auditable." A framework that wraps its own retry/state logic works against that claim.
- **No vector database** — nothing in this problem requires semantic similarity search.
- **No microservices** — one language (TypeScript) across the stack reduces context-switching risk during a solo build.

Every component maps to a named failure mode or requirement. Nothing is included because it's fashionable.

---

## 4. The Two State Machines

### Why two, not one?

A single flat state machine would conflate "what's happening with the recovery case" and "what's the status of a specific promise." These are different lifecycles:

- **Recovery Case** (`recovery_cases.state`) — tracks the overall recovery attempt for an invoice. States: OPEN → AWAITING_REPLY → REPLY_PROCESSING → COMMITMENT_ACTIVE → DISPUTE_OPEN → GHOSTED → ESCALATED → CLOSED_*
- **Commitment** (`commitments.status`) — tracks a single promise-to-pay. States: CANDIDATE → VALID_ACTIVE → KEPT / PARTIALLY_KEPT / BROKEN / VOIDED_BY_DISPUTE / SUPERSEDED

A case can have multiple commitments over its lifetime (initial promise, renegotiation after a broken promise). Each commitment has its own lifecycle. The two-tier design makes this natural.

---

## 5. The Policy Engine — Why Not Let the AI Decide?

**Because AI decisions aren't auditable, reproducible, or legally defensible.**

When an AI says "I think this debtor should be escalated," you can't explain *why* to a regulator, an auditor, or the debtor themselves. When a deterministic rule says "the promise was broken (evidence: no payment by due date) AND the renegotiation attempt failed (evidence: no valid reply within 7 days) → escalate," every step is traceable.

The Policy Engine implements these rules:
- **Promise validity** — amount > 0, ≤ outstanding, date is future and ≤ 90 days horizon
- **Quiet hours** — no outreach between 21:00–09:00 IST
- **Contact frequency cap** — max 3 outreach per case per rolling 7 days
- **Dispute freeze** — promise frozen (never cancelled), human resolves
- **Escalation ladder** — initial → reminder (+3d) → firm reminder (+7d) → escalate
- **Stopping rules** — full payment closes, max attempts escalates, legal hold stops everything

Every threshold is a named constant in `config.ts`. No number is hardcoded inline.

---

## 6. The LLM Boundary — What Can and Can't the AI Do?

### CAN do:
- Draft outreach messages to debtors
- Parse debtor replies into structured data: `{intent_type, extracted_amount, extracted_date, confidence}`
- Flag ambiguity/dispute signals
- Generate non-authoritative audit summaries
- Classify dispute reasons for triage

### MUST NOT do:
- Write to any state column
- Decide if a promise is valid
- Decide if payment was received
- Decide escalation timing
- Decide quiet-hours/contact-cap compliance
- Determine policy violations
- Execute any tools or actions

**Why?** A hallucinated or injected LLM output can only produce a *candidate* that the Policy Engine independently validates. It can never itself become a decision.

---

## 7. The Database — Why PostgreSQL, Why Supabase?

**Why PostgreSQL?** The system's core guarantees are relational by nature:
- **Idempotency** via unique constraints (duplicate webhooks are safe no-ops)
- **Promise validity** via CHECK constraints (amount > 0, status is valid enum)
- **Atomic state transitions** via row locking (no concurrent modifications to the same case)
- **One active commitment per case** via partial unique index
- **One open recovery case per invoice** via partial unique index

A document database doesn't have equivalents that are as strict or as easy to reason about.

**Why Supabase specifically?** It adds Auth-for-free (single reviewer identity) and PostgREST. The latter is actually a risk (see §8), but Auth is a genuine win for a solo build.

---

## 8. Row Level Security — The PostgREST Bypass Problem

**The risk:** Supabase's PostgREST auto-generates a REST API over every table. Without explicit Row Level Security (RLS), an authenticated client could write directly to `recovery_cases` or `commitments` — bypassing the state-transition service.

**The fix:**
1. RLS enabled on every table
2. Default-deny write policies for `anon`/`authenticated` roles on all state-bearing tables
3. All writes happen via the backend's `service-role` key (bypasses RLS by design)
4. Dashboard reads use narrowly-scoped SELECT-only policies

This makes the state-transition service the only write path in practice, not just in intention.

---

## 9. The Dispute-Freeze Edge Case — Why Not Just Cancel?

**Scenario:** Debtor promises ₹50,000 by Friday (commitment created, VALID_ACTIVE). One hour later, debtor says "the invoice is incorrect" (dispute raised).

**Why not auto-cancel the commitment?** The debtor could use disputes to escape promises for free — promise, then immediately dispute, commitment cancelled, no obligation.

**Why not auto-ignore the dispute?** If the invoice genuinely is incorrect, we'd be enforcing a wrong debt — a compliance and reputational nightmare.

**The solution: freeze.** The commitment stays VALID_ACTIVE but `is_frozen=true`. The original due date is preserved. A human reviews:
- **Dispute rejected** → un-freeze, resume toward original due date
- **Dispute upheld** → commitment VOIDED_BY_DISPUTE, case reopened or written off

This preserves both facts (the promise and the dispute) for a human to weigh.

---

## 10. The Simulated Clock — Why Not Just Use Real Time?

**Problem:** Recovery cases play out over days/weeks. You can't demo a 14-day escalation ladder in real time.

**Solution:** A single `Clock` interface injected everywhere time matters:
- `LIVE` mode: real wall-clock time (production)
- `DEMO` mode: advanceable simulated time (evaluation, demo)

Same production code path either way. The clock advance triggers all due checks between the old and new time in strict chronological order.

Every audit row carries both `simulated_time` (what the system thought the time was) and `real_wall_clock_time` (when the audit row was actually inserted). Never conflated.

---

## 11. Payment Verification — Why Not Trust the Webhook?

**Problem:** Webhooks can be spoofed, replayed, or delayed.

**Solution:** Three layers:
1. **HMAC signature verification** — reject unsigned/tampered payloads
2. **Idempotency** — unique constraint on `external_payment_id` makes duplicate webhooks safe no-ops
3. **Independent re-verification** — after accepting a webhook, independently check Razorpay's API to confirm the payment exists and matches

A late webhook confirming an on-time payment after an escalation already fired → reconcile, mark resolved-by-late-confirmation. Uses Razorpay's `paid_at` timestamp, never webhook-arrival time.

---

## 12. The Audit Trail — Why Two Timestamps?

Every `audit_events` row has:
- `simulated_time` — the business time when the event logically happened
- `real_wall_clock_time` — when the row was actually inserted

**Why?** In DEMO mode, the simulated clock might be at "Friday 3pm" while the real time is "Tuesday 11am." If you only stored one timestamp, you'd either lose the ability to replay the business timeline or lose the ability to debug insertion order.

---

## 13. The Evaluation Approach

**Synthetic dataset:** 200 invoices across 8 scenario types (clean promise, broken promise, dispute edge case, ghost, ambiguous reply, partial payment, unprompted payment). 70% tuning / 30% held-out.

**Key metrics:**
- Recovery rate (₹ recovered ÷ ₹ at risk)
- Promise-kept rate
- False-escalation rate
- **Dispute-handling correctness** — the single most defensible number
- Classification accuracy vs. synthetic ground truth
- Hallucination/schema-failure rate
- Human-override rate

The held-out set is frozen before any iteration. Results are published in `docs/EVALUATION.md` with honest caveats.

---

## 14. What We Deliberately Did NOT Build

| Excluded | Why |
|---|---|
| Redis/Kafka | PostgreSQL queue works at this scale; adding a broker adds complexity without solving a real problem |
| Voice/ASR-TTS channel | Highest overlap with Razorpay's shipped agent, most time-expensive, lowest payoff for a buildathon |
| Real multi-tenant RBAC | Single-merchant MVP; Supabase Auth for one reviewer is sufficient |
| Legal/regulatory certification | Policy thresholds are working defaults, not legally certified |
| Live message delivery | Channel is mocked; the value is in the state/policy/audit layer, not the delivery mechanism |
| Real bank reconciliation | Mock payment verification is sufficient for the demo |
| ML credit-risk scoring | Out of scope for recovery-focused MVP |
| LangChain/LangGraph | Works against auditability claims; hand-rolled schema validation is inspectable |
| Second outreach channel | One channel is sufficient to prove the architecture |

---

## 15. How This Relates to Razorpay's Existing Products

Razorpay's Receivables/Collections agent sends reminders and escalates. Recoup is the **structured commitment/state/compliance layer underneath** that kind of reminder bot — a depth layer, not a competing product.

Recoup doesn't replace Razorpay's agent. It adds:
- Formal commitment tracking (not just "message sent")
- Deterministic policy enforcement (not just schedule-based)
- Dispute handling with freeze semantics
- Full audit trail with dual timestamps

---

## 16. Glossary

| Term | Meaning |
|---|---|
| **Recovery Case** | An active attempt to recover an overdue invoice. One open case per invoice at a time. |
| **Commitment** | A formal promise-to-pay with an amount and date, validated by the Policy Engine. |
| **Policy Engine** | Deterministic rule system that makes all decisions about state transitions, escalation, and stopping. |
| **State-Transition Service** | The single code path that writes to `recovery_cases.state` and `commitments.status`. All changes go through here. |
| **Dispute Freeze** | When a dispute is raised against an active commitment, the commitment is frozen (not cancelled). A human resolves. |
| **Simulated Clock** | Injected time source that can be real (LIVE) or advanceable (DEMO) — same code path either way. |
| **RLS** | Row Level Security — PostgreSQL feature that restricts which rows different roles can access. |
| **Service Role** | Supabase role that bypasses RLS — used server-side only for state-transition writes. |
| **PostgREST** | Supabase's auto-generated REST API over tables — the reason RLS is critical. |
| **HMAC** | Hash-based message authentication code — used to verify webhook signatures. |
