<div align="center">

<img src="public/logo.png" alt="Recoup Logo" width="80" height="80" />

# Recoup

### AI Revenue Recovery Infrastructure for Razorpay Merchants

**AI proposes · Policy decides · State machine enforces · Audit ledger proves**

<br />

[![Razorpay Test Mode](https://img.shields.io/badge/Razorpay-Test%20Mode-blue?style=flat-square&logo=razorpay)](https://razorpay.com)
[![Gemini 2.0 Flash](https://img.shields.io/badge/Gemini-2.0%20Flash-orange?style=flat-square&logo=google)](https://deepmind.google/technologies/gemini/)
[![Tech Stack](https://img.shields.io/badge/Next.js%2016-TypeScript%20%7C%20PostgreSQL-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![Automated Tests](https://img.shields.io/badge/Tests-234%20Passing-success?style=flat-square)](https://vitest.dev)

<br />

Explainable, policy-governed revenue recovery for B2B and SME merchants — with bounded AI, dispute-safe automation, server-verified Razorpay Test Mode payments, and an immutable audit trail.

<br />

[Live Demo](https://recoup-sage.vercel.app/) · [GitHub](https://github.com/Dakshx07/Recoup) · [Security](docs/SECURITY.md) · [Roadmap](ROADMAP.md)

</div>

---

## 1. Why Recoup?

Traditional recovery automation treats every overdue invoice similarly. Recoup separates AI-assisted understanding from deterministic financial authority:

- **Explainable**: Every recovery action records a clear reason and causal decision trail.
- **Policy-Driven**: AI proposes structured intents; deterministic policy rules decide.
- **Commitment-Aware**: Payment promises become tracked commitments with monitored due dates.
- **Dispute-Safe**: Active commitments are frozen during disputes instead of being silently cancelled.
- **Auditable**: State transitions and payment verifications are permanently recorded in an append-only ledger.
- **Razorpay Integrated**: Real Razorpay Test Mode checkout with authoritative server-side webhook verification.

---

## 2. Core Architecture

Recoup enforces a strict architectural boundary: **AI proposes &rarr; Schema validates &rarr; Policy Engine decides &rarr; State Transition Service mutates &rarr; Immutable Audit Ledger records.**

```mermaid
flowchart TD
    A[Debtor Reply] --> B[Gemini 2.0 Flash]
    B --> C[Zod Schema Validator]
    C --> D[Deterministic Policy Engine]
    D --> E[State Transition Service]
    E --> F[Supabase PostgreSQL]
    E --> G[Immutable Audit Ledger]

    H[Razorpay Test Checkout] --> I[Server Webhook Verification]
    I --> J[Payment Verifier]
    J --> E
```

### Architectural Guarantees:
- **Zero-Tool LLM**: The LLM acts strictly as a structured parser. It possesses zero tools, zero database credentials, and zero direct write privileges.
- **Single Write Path**: State transitions are exclusively executed by `StateTransitionService` with legal transition validation and optimistic concurrency locking.
- **Append-Only Auditing**: Every state mutation, payment reconciliation, and reviewer decision is permanently recorded with dual timestamps (Simulated Business Clock + Physical UTC Wall-Clock).

---

## 3. Razorpay Test Mode Integration

Recoup features an end-to-end **Razorpay Test Mode** payment integration that bridges external payment events into Recoup's deterministic domain architecture.

```
Recovery Case
      ↓
Razorpay Test Mode Checkout
      ↓
Payment Completed
      ↓
Server-Side Verification
      ↓
Payment Reconciled
      ↓
CLOSED_PAID
      ↓
Immutable Audit Event
```

### Key Evaluator-Facing Capabilities:
1. **Case-Linked Payment**: An active recovery case with an outstanding balance can be paid directly through Razorpay Test Mode.
2. **Standard Checkout**: Razorpay Standard Checkout opens smoothly from the case view with invoice-level context.
3. **Safe Test Environment**: Razorpay Test Mode is used for demonstration purposes; **no real money is charged**.
4. **Authoritative Server Verification**: Recoup does not trust the browser callback as financial authority; payment confirmation is finalized exclusively via the server-side Razorpay webhook pipeline.
5. **Ledger Reconciliation**: Verified payments are reconciled against the relevant recovery case and invoice balance.
6. **Two-Tier Idempotency**: Duplicate payment and webhook events are deduplicated at the database level, preventing double-crediting or duplicate state transitions.
7. **Canonical State Machine**: Eligible successful payments transition the case to `CLOSED_PAID` with ₹0 outstanding balance through Recoup's existing `StateTransitionService`.
8. **Immutable Audit Trail**: An immutable audit event permanently records the payment verification, signature status, and reconciliation details.
9. **Full Architectural Integrity**: The existing synthetic 200-case benchmark, policy engine, dispute freeze, optimistic concurrency, RLS, and payment simulation remain 100% intact.

> [!NOTE]
> Detailed technical specifications for API routes, database schemas, security models, and state machine transitions are documented separately in the [`docs/`](docs/) directory.

---

## 4. The Dispute-Freeze Rule

The core financial safety mechanism of Recoup is the **Dispute-Freeze Rule** ([ADR 0006](docs/adr/0006-dispute-freeze-not-cancel-rule.md)):

```mermaid
flowchart TD
    A[Valid Active Commitment] --> B[Frozen Dispute]
    B --> C[Dispute Rejected - Commitment Resumed]
    B --> D[Dispute Upheld - Commitment Voided]
    A --> E[Closed Paid - Webhook Verified]
    A --> F[Commitment Broken - Due Date Elapsed]
    F --> G[Escalated - Day 14 Human Review]
```

1. When a debtor disputes an invoice that already has an active promise, the commitment is **frozen** (`is_frozen = true`, `status = VALID_ACTIVE`), never deleted or voided.
2. The case transitions to `DISPUTE_OPEN` and automated outreach is placed on immediate hold.
3. A human reviewer must explicitly review the dispute evidence in the dashboard to make an immutable determination.

---

## 5. Human Override & Concurrency Protection

All human interventions are executed through the Human Override panel and require **mandatory written justification**:

- **Reject Dispute &rarr; Resume Commitment**: Unfreezes the active commitment (`is_frozen = false`), preserving the original promised due date.
- **Uphold Dispute &rarr; Void Commitment**: Transitions commitment to `VOIDED_BY_DISPUTE` and reopens the case for dispute reconciliation or credit note issuance.
- **Force Escalate / Write Off**: Available on non-dispute cases requiring manual collections or balance write-offs.

### Concurrency & Double-Submit Protection:
- **Atomic Optimistic Locking**: The override endpoint executes `.eq('id', id).eq('state', caseData.state)`. If the case state mutated concurrently, the update returns `409 Conflict`.
- **Double-Submit Proof**: Two identical requests sent at the exact same millisecond result in **exactly one `200 OK` and one `409 Conflict`**, guaranteeing that only one state transition and one audit event are recorded.

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
- **Payments**: Razorpay Test Mode (`checkout.js`, Server Orders API, HMAC-SHA256 Webhooks).
- **AI & Extraction**: Google Gemini 2.0 Flash via `@google/generative-ai` with strict Zod JSON schema validation.
- **Testing & Verification**: Vitest (**234 automated tests** across 17 test files: Unit, Adversarial Red-Team, Razorpay Client, and Webhook Integration Flows), TypeScript strict mode (`tsc --noEmit`).

---

## 8. Quickstart & Local Setup

### Prerequisites
- Node.js >= 18
- npm >= 9
- A Supabase Project (PostgreSQL)
- A Google Gemini API Key
- Razorpay Test Mode API Keys (from [Razorpay Dashboard &rarr; API Keys](https://dashboard.razorpay.com/app/keys))

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
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres

# Google Gemini
GEMINI_API_KEY=your-gemini-api-key

# Razorpay Test Mode (Public Key exposed to browser for checkout.js)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_ID=rzp_test_...

# Razorpay Secrets (SERVER-SIDE ONLY — Never expose to browser)
RAZORPAY_KEY_SECRET=your_test_key_secret_here
RAZORPAY_WEBHOOK_SECRET=your_test_webhook_secret_here

# App Settings
CLOCK_MODE=DEMO
NODE_ENV=development
```

### 3. Run Database Migrations
Run the migrations in `supabase/migrations/` in order (`0001` through `0007`) via the Supabase SQL Editor.

### 4. Seed Benchmark Dataset
```bash
npm run generate-synthetic-data
```

### 5. Run the Application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) for the landing page or [http://localhost:3000/app](http://localhost:3000/app) for the operations console.

### 6. Run Automated Tests & Build Verification
```bash
npm test            # Runs 234 automated tests via Vitest (100% pass)
npm run typecheck   # Strict TypeScript static analysis (0 errors)
npm run build       # Production bundle build check
```

---

## 9. Razorpay AI Buildathon — Evaluator Flow

Evaluators can test the end-to-end Razorpay Test Mode recovery flow directly in the dashboard:

```
1. Open the Recoup Console at http://localhost:3000/app (or the live deployment).
2. Click "1-Click Evaluator Demo Access" to establish an authenticated reviewer session.
3. Open any active recovery case from the Case Queue (e.g. /app/cases/[id]).
4. Under "Financial Commitment & Payment", locate the Razorpay Test Mode card.
5. Click "Pay via Razorpay Test Mode" (clearly marked: TEST MODE · No real money is charged).
6. Razorpay Standard Checkout opens in Test Mode:
   - For cases under ₹50,000: Select Test UPI, Card, or Netbanking.
   - For cases over ₹50,000: Select Netbanking (Test Bank) to bypass default test UPI caps.
   - Click "Success" on the test simulation screen.
7. Modal closes -> Recoup enters "⏳ Verifying Payment" state.
8. Server verifies webhook, executes two-tier idempotency, and reconciles the invoice.
9. Dashboard updates to show "✓ PAYMENT VERIFIED & RECONCILED":
   - Case Status: CLOSED_PAID
   - Outstanding Balance: ₹0
   - Verification Proof: Webhook Signature Verified, Idempotency Passed, Ledger Reconciled, Audit Recorded.
10. Open the Case Lifecycle & Decision Trail to view the immutable audit event.
```

---

## 10. Architecture Decision Records (ADRs)

- [ADR 0001: Two-Tier State Machine](docs/adr/0001-two-tier-state-machine.md)
- [ADR 0002: LLM Zero Write Permission](docs/adr/0002-llm-zero-write-permission.md)
- [ADR 0003: Supabase PostgreSQL as Sole Datastore](docs/adr/0003-supabase-postgres-as-sole-datastore.md)
- [ADR 0004: Postgres-Table Queue over Redis](docs/adr/0004-postgres-backed-queue-over-redis.md)
- [ADR 0005: Simulated Clock Abstraction](docs/adr/0005-simulated-clock-abstraction.md)
- [ADR 0006: Dispute-Freeze-Not-Cancel Rule](docs/adr/0006-dispute-freeze-not-cancel-rule.md)
- [ADR 0007: RLS Lockdown and Service-Role Writes](docs/adr/0007-rls-lockdown-and-service-role-writes.md)

---

## 11. Product Roadmap & Future Horizons

Recoup is designed with a modular domain core capable of scaling from an MVP into an enterprise-grade Receivables Operating System:

- **Horizon 1 (Current · Verified Prototype):** Two-Tier State Machine, Deterministic Policy Engine, Dispute-Freeze Rules, Strict Zod LLM Parser, Supabase RLS, and Razorpay Test Mode Checkout.
- **Horizon 2 (Omnichannel & Interactive Outreach):** WhatsApp Business Messaging, Production Email Ingestion, Conversational Voice Telephony, Debtor Self-Service Portal, and Governed Settlement Rules.
- **Horizon 3 (Enterprise Financial OS & Integrations):** Two-Way ERP Sync (Tally, Zoho Books, QuickBooks, SAP), Merchant & Team Workspaces (RBAC), Recovery Economics & DSO Analytics, and Multi-Installment Governance.
- **Horizon 4 (Advanced Capital Management):** Longer-term exploration of capital-management and receivables financing workflows subject to regulatory and platform constraints.

👉 **Read the full strategic roadmap:** [**`ROADMAP.md`**](ROADMAP.md)

---

## 12. License & Buildathon Context

Built for the **Razorpay AI Buildathon 2026** (*Autonomous Receivables / P2P Recovery Agent Track*).  
Licensed under the [MIT License](LICENSE).


