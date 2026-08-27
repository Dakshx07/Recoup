# Recoup

### P2P Recovery Agent for Explainable, Policy-Driven Invoice Recovery

Recoup is an autonomous, policy-governed recovery platform for B2B and SME merchants on Razorpay. It replaces blunt, scheduled dunning with explainable recovery decisions, structured debtor commitment tracking, deterministic dispute handling, and an immutable, dual-timestamped audit ledger.

**Live Demo:** https://recoup-sage.vercel.app/

**Built for:** Razorpay AI Buildathon 2026 — Autonomous Receivables / P2P Recovery Agent Track

## Why Recoup?

Traditional recovery automation treats every debtor the same. Recoup instead separates AI-assisted understanding from deterministic financial decision-making.

- **Explainable:** Every recovery action records a reason and decision trail.
- **Policy-driven:** AI proposes; deterministic policy rules decide.
- **Commitment-aware:** Payment promises become tracked commitments with monitored due dates.
- **Dispute-safe:** Active commitments are frozen during disputes instead of being silently cancelled.
- **Auditable:** State transitions and decisions are recorded in an append-only ledger.

---

## 1. The Problem

Traditional B2B receivables recovery suffers from three critical operational failure modes:

1. **The Broadcast Black Hole**: Legacy dunning systems send generic reminder emails on a fixed 3-day timer. They cannot parse unstructured debtor replies, verify payment claims, or adapt to natural language promises.
2. **Commitment Amnesia**: When a debtor replies *"I will process payment of ₹42,000 on the 10th,"* standard automation fails to register this as a formal, enforceable commitment with a monitored due date. The bot continues sending aggressive reminders on the 5th, destroying customer goodwill.
3. **The False-Escalation Wave**: When a debtor raises a legitimate invoice dispute, unconstrained automation either cancels the debt entirely (allowing bad actors to escape payment for free) or immediately escalates the case to expensive external debt collectors.

### Why Unconstrained LLMs Cannot Run Recovery
Financial debt collection cannot be delegated to an autonomous LLM with direct database write permissions. LLMs are non-deterministic, vulnerable to prompt injection, and legally non-defensible when asked by auditors or regulators why an account was escalated, penalized, or written off.

---

## 2. Core Architecture & Philosophy

Recoup enforces a strict architectural boundary: **AI proposes &rarr; Schema validates &rarr; Policy Engine decides &rarr; State Transition Service mutates &rarr; Audit Ledger records.**

```mermaid
flowchart TD
    subgraph Channel ["1. Inbound Ingestion"]
        Inbound["Debtor Reply<br/>(Email / WhatsApp)"]
    end

    subgraph LLM_Boundary ["2. Intelligence Layer (Zero-Tool Boundary)"]
        Parser["Gemini 2.0 Flash<br/>(Structured Extraction)"]
        Zod["Zod Schema Validator<br/>(Strict JSON Enforcement)"]
    end

    subgraph Policy_Layer ["3. Authority Layer (Deterministic Policy Engine)"]
        Policy["Policy Engine Rules<br/>• 13 Locked Constants<br/>• Dispute-Freeze Check<br/>• Quiet Hours & Frequency Caps"]
    end

    subgraph State_Layer ["4. Execution & State Transition Layer"]
        Writer["State Transition Service<br/>• Legal Transition Validation<br/>• Optimistic Concurrency Preconditions<br/>• Atomic PostgreSQL Mutation"]
    end

    subgraph Storage ["5. Immutable Persistence Layer"]
        DB[("Supabase PostgreSQL<br/>• recovery_cases (10 States)<br/>• commitments (8 Statuses)<br/>• RLS Default-Deny")]
        Audit[("audit_events<br/>• Append-Only Ledger<br/>• Dual Timestamps (Simulated + Wall-Clock)")]
    end

    subgraph Human ["6. Human Review Operations"]
        Reviewer["Reviewer Dashboard<br/>• Reject dispute -> Resume commitment<br/>• Uphold dispute -> Void commitment<br/>• Mandatory Written Justification"]
    end

    Inbound --> Parser
    Parser --> Zod
    Zod -->|"PROMISE_CANDIDATE / DISPUTE_CANDIDATE"| Policy
    Policy -->|"Validated Legal Transition"| Writer
    Writer --> DB
    Writer --> Audit
    DB -.->|"DISPUTE_OPEN / ESCALATED"| Reviewer
    Reviewer -->|"Human Override (409 Protected)"| Writer

    style LLM_Boundary fill:#fef3c7,stroke:#f59e0b,stroke-width:2px
    style Policy_Layer fill:#dbeafe,stroke:#3b82f6,stroke-width:2px
    style State_Layer fill:#e0e7ff,stroke:#6366f1,stroke-width:2px
    style Storage fill:#dcfce7,stroke:#22c55e,stroke-width:2px
    style Human fill:#f3e8ff,stroke:#a855f7,stroke-width:2px
```

### Architectural Guarantees:
- **Zero-Tool LLM**: The LLM acts strictly as a structured parser. It possesses zero tools and zero direct write privileges to `recovery_cases`, `commitments`, `invoices`, or `audit_events`.
- **Single Write Path**: State transitions are exclusively executed by `StateTransitionService` with legal transition validation and optimistic concurrency locking.
- **Append-Only Auditing**: Every state mutation, decision rationale, and reviewer justification is permanently appended with dual timestamps.

---

## 3. The Dispute-Freeze Rule

The core financial safety mechanism of Recoup is the **Dispute-Freeze Rule** ([ADR 0006](docs/adr/0006-dispute-freeze-not-cancel-rule.md)):

```mermaid
stateDiagram-v2
    [*] --> VALID_ACTIVE: Valid Promise Registered

    state VALID_ACTIVE {
        [*] --> Monitoring: Active Due Date
    }

    VALID_ACTIVE --> FROZEN_DISPUTE: Debtor Raises Dispute
    
    state FROZEN_DISPUTE {
        [*] --> Held: is_frozen = true
        Held --> PendingReview: Case state = DISPUTE_OPEN
    }

    FROZEN_DISPUTE --> VALID_ACTIVE: Reject Dispute (Unfreezes & Resumes Commitment)
    FROZEN_DISPUTE --> VOIDED_BY_DISPUTE: Uphold Dispute (Voids Commitment & Reopens Case)

    VALID_ACTIVE --> CLOSED_PAID: Webhook Verified Full Settlement
    VALID_ACTIVE --> COMMITMENT_BROKEN: Due Date Elapsed (0 Payment)
    COMMITMENT_BROKEN --> ESCALATED: Day 14 Trigger -> Human Review
```

1. When a debtor disputes an invoice that already has an active promise, the commitment is **frozen** (`is_frozen = true`, `status = VALID_ACTIVE`), never deleted or voided.
2. The case transitions to `DISPUTE_OPEN` and automated outreach is placed on immediate hold.
3. A human reviewer must explicitly review the dispute evidence and make an immutable determination.

---

## 4. Human Override & Concurrency Protection

All human interventions are executed through the Human Override panel and require **mandatory written justification**:

- **Reject Dispute &rarr; Resume Commitment**: Unfreezes the active commitment (`is_frozen = false`), preserving the original promised due date.
- **Uphold Dispute &rarr; Void Commitment**: Transitions commitment to `VOIDED_BY_DISPUTE` and reopens the case for dispute reconciliation or credit note issuance.
- **Force Escalate / Write Off**: Available on non-dispute cases requiring manual collections or balance write-offs.

### Concurrency & Double-Submit Protection:
- **Atomic Optimistic Locking**: The override endpoint executes `.eq('id', id).eq('state', caseData.state)`. If the case state mutated concurrently, the update returns `409 Conflict`.
- **Double-Submit Proof**: Two identical requests sent at the exact same millisecond result in **exactly one `200 OK` and one `409 Conflict`**, guaranteeing that only one state transition and one audit event are recorded.

---

## 5. Dual-Timestamp Auditability

Every row in `audit_events` carries two distinct timestamps ([docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)):

1. **`simulated_time`** (*Business Clock*): Drives all policy evaluations, promise due dates, quiet hours calculations, and relative-time displays (`"just now"`, `"2 days ago"`, `"due in 5 days"`).
2. **`real_wall_clock_time`** (*Physical UTC Clock*): The immutable physical timestamp recorded when the row was committed to PostgreSQL.

---

## 6. Evaluation Benchmark & Results

Recoup is evaluated against a synthetic benchmark of **200 realistic enterprise invoices** across 8 distinct behavioral scenarios ([docs/EVALUATION.md](docs/EVALUATION.md)):

| Metric | Measured Value | Verification Source | Status |
|---|:---:|---|:---:|
| **Total Invoiced Book** | **₹1,24,77,150** | Raw PostgreSQL aggregation ($N = 200$) | `MEASURED` |
| **Capital Recovered** | **₹50,05,977** | $\sum(\text{original} - \text{outstanding})$ | `MEASURED` |
| **Portfolio Recovery Rate** | **40.12%** | 80 of 200 cases settled in full/partial | `MEASURED` |
| **Clean Promise Honor Rate** | **100.0%** | 60 of 60 clean promises settled on schedule | `MEASURED` |
| **Resolved Promise Honor Rate** | **70.0%** | 70 of 100 resolved promises kept/partial | `MEASURED` |
| **Dispute-Freeze Adherence** | **100.0%** | 18 active promises frozen, 0 wrongfully cancelled | `MEASURED` |
| **LLM Strict Schema Validity** | **100.0%** | 180 of 180 parses conform to Zod schema | `MEASURED` |
| **Human Review Queue** | **20.0%** | 40/200 cases safely isolated in `DISPUTE_OPEN` | `MEASURED` |

---

## 7. Tech Stack

- **Frontend**: Next.js 16 (App Router with Turbopack), React 19, TypeScript, Tailwind CSS, Lucide Icons, Razorpay Blade Design System.
- **Backend & API**: Next.js Server Components, Route Handlers, TypeScript Domain Services.
- **Database & Security**: PostgreSQL, Supabase, Row Level Security (RLS) default-deny policies, service-role server writes.
- **AI & Extraction**: Google Gemini 2.0 Flash via `@google/generative-ai` with strict Zod JSON schema validation.
- **Testing & Verification**: Vitest (**215 automated tests** across 15 suites: Unit, Adversarial Red-Team, and Multi-Module Integration Flows), TypeScript strict mode (`tsc --noEmit`).

---

## 8. Repository Structure

```
├── docs/                        # Complete technical documentation
│   ├── ARCHITECTURE.md          # Domain model & state machine architecture
│   ├── API.md                   # Endpoint specifications & request schemas
│   ├── POLICY_ENGINE.md         # 13 locked constants & policy rulebook
│   ├── LLM_BOUNDARY.md          # LLM CAN/MUST NOT boundaries & JSON schemas
│   ├── DATABASE_SCHEMA.md       # 12 table schemas, constraints & RLS policies
│   ├── EVALUATION.md            # Synthetic benchmark methodology & metrics
│   ├── RUNBOOK.md               # Step-by-step setup & live demo path
│   ├── SECURITY.md              # Security controls & concurrency architecture
│   ├── LIMITATIONS.md           # Prototype boundaries & production roadmap
│   └── adr/                     # Architecture Decision Records (0001–0007)
├── scripts/
│   ├── generate-synthetic-data.ts # Deterministic 200-case synthetic benchmark seeder
│   └── simulation-runner.ts     # Multi-step state machine runner
├── src/
│   ├── app/                     # Next.js App Router (Landing page & /app console)
│   ├── components/dashboard/    # Blade-styled operational recovery components
│   ├── domain/
│   │   ├── clock/               # Clock abstraction (LiveClock vs SimulatedClock)
│   │   ├── llm/                 # Gemini parser, drafter & Zod schemas
│   │   ├── policy-engine/       # 13 locked constants & deterministic rules
│   │   └── state-machine/       # Case & Commitment states and transition validators
│   ├── infra/                   # Supabase browser & service-role server clients
│   └── services/                # StateTransitionService, CronService, PaymentVerifier
├── supabase/migrations/         # 6 SQL schema migrations with RLS & triggers
└── tests/                       # 215 automated tests across 15 test files
    ├── unit/                    # Unit & Policy Engine tests
    ├── integration/             # End-to-end multi-module service integration flows
    └── fixtures/                # Relational test factories & in-memory PostgreSQL store
```

---

## 9. Quickstart & Local Setup

### Prerequisites
- Node.js >= 18
- npm >= 9
- A Supabase Project (PostgreSQL)
- A Google Gemini API Key

### 1. Installation
```bash
git clone https://github.com/Dakshx07/Recoup.git
cd Recoup
npm install
```

### 2. Environment Configuration
```bash
cp .env.example .env.local
```
Fill in your credentials in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
GEMINI_API_KEY=your-gemini-api-key
CLOCK_MODE=DEMO
```

### 3. Run Database Migrations
Run the migrations in `supabase/migrations/` in order (`0001` through `0006`) via the Supabase SQL Editor.

### 4. Seed Benchmark Dataset
```bash
npm run generate-synthetic-data
```

### 5. Run the Application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the landing page, or [http://localhost:3000/app](http://localhost:3000/app) for the operations console.

### 6. Run Automated Tests & Typecheck
```bash
npm test            # Runs 215 automated tests via Vitest
npm run typecheck   # Strict TypeScript static analysis
npm run build       # Production bundle build check
```

---

## 10. Honest MVP Scope & Simulation Boundaries

In accordance with buildathon constraints, Recoup clearly distinguishes its production-grade deterministic backend from simulated prototype integrations:

| Component | MVP Prototype Implementation | Commercial Production Target |
|---|---|---|
| **Outreach Channels** | Ingested via synthetic simulation fixtures & in-memory runner | Multi-channel SMS/WhatsApp (Twilio/Gupshup) & SendGrid email APIs |
| **Payment Ingestion** | Simulated Razorpay webhook payloads with `PaymentVerifier` | Production Razorpay webhook HMAC verification & reconciliation API |
| **Clock Engine** | Dual-timestamp `SimulatedClock` for reproducible evaluation | Live UTC `LiveClock` with distributed Temporal / AWS SQS workers |
| **Benchmark Dataset** | 200-case synthetic dataset across 8 behavioral archetypes | Live ERP / accounting system sync (Tally, Zoho, Quickbooks) |
| **Multi-Tenancy** | Single-merchant deployment with role-based dashboard | Multi-tenant merchant isolation with scoped RLS partitions |

---

## 11. Recommended Demo Flow

1. **Landing Page (`/`)**: Review the Fraunces headline, 5-stage recovery arc, and the side-by-side AI boundary comparison.
2. **Operations Console (`/app`)**: Observe the 4-metric strip (₹50.06L recovered, 40.1% recovery rate) and the Needs Attention priority queue.
3. **Case Queue (`/app/cases`)**: Explore active cases, filtering by Attention or All cases with unified portfolio metrics.
4. **Real Dispute Case Detail (`/app/cases/[id]`)**: Open a disputed case (e.g. `INV-2106` - *Tidal Logistics*):
   - Review the **Causal Decision Trail** (`case_opened` &rarr; `debtor_reply_received` &rarr; `reply_parsed` &rarr; `commitment_validated` &rarr; `dispute_detected_commitment_frozen`).
   - Inspect the **Frozen Commitment Card** showing ₹88,000 with status `FROZEN — UNDER DISPUTE REVIEW`.
   - Inspect the **Human Override Panel**: notice the clear actions *"Reject dispute — resume commitment"* and *"Uphold dispute — void commitment"*.
5. **Evaluation Benchmark (`/app/evaluation`)**: Inspect the live PostgreSQL benchmark metrics, 8-scenario dynamic breakdown, and live Model Activity logs.
6. **Policy Engine (`/app/policy`)**: Review the 13 locked business rules imported directly from `src/domain/policy-engine/config.ts`.
7. **Simulation Clock (`/app/simulation`)**: Advance the authoritative clock by +1, +3, or +7 days with parallel batch cron evaluations.

---

## 11. Architecture Decision Records (ADRs)

- [ADR 0001: Two-Tier State Machine](docs/adr/0001-two-tier-state-machine.md)
- [ADR 0002: LLM Zero Write Permission](docs/adr/0002-llm-zero-write-permission.md)
- [ADR 0003: Supabase PostgreSQL as Sole Datastore](docs/adr/0003-supabase-postgres-as-sole-datastore.md)
- [ADR 0004: Postgres-Table Queue over Redis](docs/adr/0004-postgres-backed-queue-over-redis.md)
- [ADR 0005: Simulated Clock Abstraction](docs/adr/0005-simulated-clock-abstraction.md)
- [ADR 0006: Dispute-Freeze-Not-Cancel Rule](docs/adr/0006-dispute-freeze-not-cancel-rule.md)
- [ADR 0007: RLS Lockdown and Service-Role Writes](docs/adr/0007-rls-lockdown-and-service-role-writes.md)

---

## 12. License & Buildathon Context

Built for the **Razorpay AI Buildathon 2026** (Autonomous Receivables / P2P Recovery Agent Track).  
Licensed under the [MIT License](LICENSE).
