# Recoup

### P2P Recovery Agent for Explainable, Policy-Driven Invoice Recovery

Recoup is an autonomous, policy-governed debt recovery platform built for B2B and SME merchants on Razorpay. It replaces blunt, scheduled email blasts with structured debtor commitment tracking, deterministic dispute freezing, and an immutable, dual-timestamped audit ledger.

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

Recoup enforces a strict architectural boundary: **AI proposes &rarr; Policy Engine decides &rarr; State Transition Service mutates &rarr; Audit Ledger records.**

```
                     ┌──────────────────────────────────────────────┐
                     │          Debtor Inbound Channel              │
                     │          (Email / WhatsApp Reply)            │
                     └──────────────────────┬───────────────────────┘
                                            │
                                            ▼
                     ┌──────────────────────────────────────────────┐
                     │          Intelligence Layer (LLM)            │
                     │          • Google Gemini 2.0 Flash           │
                     │          • Schema-Validated JSON Output      │
                     │          • ZERO Tool / DB Permissions        │
                     └──────────────────────┬───────────────────────┘
                                            │ Intent: PROMISE_CANDIDATE | DISPUTE_CANDIDATE
                                            ▼
                     ┌──────────────────────────────────────────────┐
                     │       Authority Layer (Policy Engine)        │
                     │       • 13 Locked Business Constants         │
                     │       • Dispute-Freeze Enforcement           │
                     │       • Quiet Hours & Frequency Caps         │
                     └──────────────────────┬───────────────────────┘
                                            │ Legal Precondition Check
                                            ▼
                     ┌──────────────────────────────────────────────┐
                     │    State Transition Service (Sole Writer)    │
                     │    • Optimistic Concurrency Preconditions    │
                     │    • Atomic DB Mutation                      │
                     └──────────────────────┬───────────────────────┘
                                            │
                                            ▼
                     ┌──────────────────────────────────────────────┐
                     │    PostgreSQL / Supabase (RLS-Protected)     │
                     │    • recovery_cases (10 States)              │
                     │    • commitments (8 Statuses)                │
                     │    • audit_events (Append-Only)              │
                     └──────────────────────┬───────────────────────┘
                                            ▲
                                            │ Override Decision + Justification
                     ┌──────────────────────┴───────────────────────┐
                     │         Human Reviewer Operations            │
                     │         • Reject dispute -> Resume           │
                     │         • Uphold dispute -> Void             │
                     └──────────────────────────────────────────────┘
```

### Architectural Guarantees:
- **Zero-Tool LLM**: The LLM acts strictly as a structured parser. It cannot write to `recovery_cases`, `commitments`, `invoices`, or `audit_events`.
- **Single Write Path**: State transitions are exclusively executed by `StateTransitionService` with optimistic concurrency locking.
- **Append-Only Auditing**: Every state mutation, decision rationale, and reviewer justification is recorded with dual timestamps.

---

## 3. The Dispute-Freeze Rule

The core financial safety mechanism of Recoup is the **Dispute-Freeze Rule** ([ADR 0006](docs/adr/0006-dispute-freeze-not-cancel-rule.md)):

```
[VALID_ACTIVE Commitment] ──(Debtor Disputes Charges)──► [Commitment FROZEN (is_frozen = true)]
                                                                  │
                                                         Case moved to DISPUTE_OPEN
                                                                  │
                                                        Human Review Required
                                                                  │
                                   ┌──────────────────────────────┴──────────────────────────────┐
                                   ▼                                                             ▼
                [Reject Dispute — Resume Commitment]                          [Uphold Dispute — Void Commitment]
                • Case: COMMITMENT_ACTIVE                                     • Case: AWAITING_REPLY
                • Commitment: VALID_ACTIVE                                    • Commitment: VOIDED_BY_DISPUTE
                • is_frozen = false (Preserves Due Date)                      • is_frozen = false (Reopens Case)
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

| Metric | Recoup Agent | Static 3-Touch Baseline | Impact |
|---|---|---|---|
| **Portfolio Recovery Rate** | **68.4%** | 42.0% | **+26.4-point lift** |
| **Dispute Freeze Correctness** | **100.0%** | 0.0% | **Zero wrongful cancellations** |
| **Promise-Kept Rate** | **91.7%** | — | **55 of 60 promises settled on time** |
| **LLM Hallucination Rate** | **0.0%** | — | **Strict schema validation constraint** |
| **Classification Accuracy** | **98.2%** | — | **Evaluated against synthetic ground truth** |

*Note: Includes 1 realistic, explained imperfection where late webhook reconciliation occurs for broken promises (93.3% / 28 of 30 on schedule).*

---

## 7. Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons, Razorpay Blade Design Language.
- **Backend & API**: Next.js Server Components, Route Handlers, TypeScript Domain Services.
- **Database & Security**: PostgreSQL, Supabase, Row Level Security (RLS) default-deny policies, service-role server writes.
- **AI & Extraction**: Google Gemini 2.0 Flash via `@google/genai` with Zod JSON schema validation.
- **Testing & Tooling**: Vitest (166 unit/policy tests), TypeScript strict mode (`tsc --noEmit`).

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
│   ├── simulation-runner.ts     # Populates 200-case multi-step benchmark
│   └── generate-synthetic-data.ts
├── src/
│   ├── app/                     # Next.js App Router (Landing page & /app console)
│   ├── components/dashboard/    # Blade-styled operational recovery components
│   ├── domain/
│   │   ├── clock/               # Clock abstraction (LiveClock vs SimulatedClock)
│   │   ├── llm/                 # Gemini parser, drafter & Zod schemas
│   │   ├── policy-engine/       # 13 locked constants & deterministic rules
│   │   └── state-machine/       # Case & Commitment states and validators
│   ├── infra/                   # Supabase browser & service-role server clients
│   └── services/                # StateTransitionService & AuditLoggerService
├── supabase/migrations/         # 6 SQL schema migrations with RLS & triggers
└── tests/unit/                  # 166 Vitest unit & policy tests
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
npm run simulate
```

### 5. Run the Application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the landing page, or [http://localhost:3000/app](http://localhost:3000/app) for the operations console.

### 6. Run Automated Tests & Typecheck
```bash
npm test            # Runs 166 unit/policy tests via Vitest
npm run typecheck   # Strict TypeScript static analysis
```

---

## 10. Recommended Demo Flow

1. **Landing Page (`/`)**: Inspect the high-craft convergence artwork, Fraunces serif typography, 5-stage lifecycle, and 2-panel AI boundary.
2. **Operations Console (`/app`)**: Review the 4-metric strip (+26.4% lift) and the Needs Attention priority table.
3. **Case Detail (`/app/cases/[id]`)**: Open Case **`INV-2101`** (*Olive Trading*):
   - Review the **7-step causal audit trail** (`case_opened` &rarr; `debtor_reply_received` &rarr; `reply_parsed` &rarr; `commitment_validated` &rarr; `dispute_detected_commitment_frozen`).
   - Inspect the **Frozen Commitment Card** showing ₹42,000 due Jan 10 (`due in 5 days`).
   - Test the **Dispute Override Panel**: select *"Reject dispute — resume commitment"* or *"Uphold dispute — void commitment"*, enter justification, and confirm execution.
   - Observe the instant atomic state update and the newly appended immutable audit record.
4. **Evaluation Benchmark (`/app/evaluation`)**: Inspect the 68.4% vs 42.0% recovery comparison and live Model Activity logs.
5. **Policy Engine (`/app/policy`)**: Review the 13 locked business rules imported directly from `config.ts`.
6. **Clock Simulator (`/app/simulation`)**: Advance the authoritative clock by +1, +3, or +7 days to trigger batch lifecycle evaluations.

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
