# Recoup

**AI-powered debt recovery agent with deterministic compliance controls, structured commitment tracking, and full audit trail.**

> Built for the Razorpay AI Buildathon 2026 · Track: AI Revenue Recovery

⚠️ **Known limitations:** See [`docs/LIMITATIONS.md`](docs/LIMITATIONS.md) — read this before evaluating.

---

## What is Recoup?

Recoup is a structured recovery agent that negotiates promise-to-pay commitments with debtors, monitors whether promises are kept, and escalates through deterministic compliance rules when they aren't.

**The key architectural decision:** The LLM drafts messages and parses replies. It never decides anything involving money, state, compliance, or stopping. A deterministic Policy Engine owns every one of those decisions — every threshold is a named constant, every transition is audited, every edge case (including the promise-then-dispute freeze) is handled by explicit rules, not model judgment.

### How it differs from a reminder bot

A reminder bot sends messages on a schedule. Recoup adds the layers underneath:
- **Commitment ledger** — structured, validated promise-to-pay records with full state history
- **Policy Engine** — deterministic rules for promise validity, quiet hours, contact caps, dispute freezing, escalation ladders, and stopping conditions
- **Audit trail** — every state transition recorded with both simulated and real timestamps
- **Payment verification** — idempotent webhook processing with independent re-verification

---

## Headline Evaluation Result

> _To be filled after evaluation harness runs (build-order step 12)_

---

## Architecture

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full breakdown.

```
Synthetic data → Ingestion → Policy Engine → State Transitions → Audit Trail
                                  ↑                    ↓
                              LLM (parse/draft,    Commitment Ledger
                              zero write access)   (Supabase PostgreSQL)
```

---

## Quickstart

See [`docs/RUNBOOK.md`](docs/RUNBOOK.md) for full setup instructions.

```bash
# 1. Clone and install
git clone https://github.com/Dakshx07/Recoup.git
cd Recoup
npm install

# 2. Set up environment
cp .env.example .env
# Fill in your Supabase and Gemini API keys

# 3. Run migrations
npx supabase db push

# 4. Seed synthetic data
npm run generate-synthetic-data

# 5. Run evaluation
npm run eval

# 6. Start development server
npm run dev
```

---

## Documentation

| Document | Description |
|---|---|
| [`ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System design, component responsibilities |
| [`DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md) | All 12 tables, relationships, ERD |
| [`POLICY_ENGINE.md`](docs/POLICY_ENGINE.md) | Every rule, every threshold, dispute edge case |
| [`LLM_BOUNDARY.md`](docs/LLM_BOUNDARY.md) | What the LLM can and cannot do |
| [`API.md`](docs/API.md) | Endpoint reference |
| [`EVALUATION.md`](docs/EVALUATION.md) | Methodology, metrics, results |
| [`SECURITY.md`](docs/SECURITY.md) | RLS, auth model, threat mitigations |
| [`LIMITATIONS.md`](docs/LIMITATIONS.md) | Honest gaps, named plainly |
| [`RUNBOOK.md`](docs/RUNBOOK.md) | Setup, seeding, evaluation, demo |

---

## AI Usage Disclosure

This project uses Google Gemini for two strictly bounded tasks:
1. **Outreach drafting** — generating natural-language messages to debtors
2. **Reply parsing** — extracting structured data (intent, amount, date, confidence) from debtor replies

The LLM has **zero write or tool-execution permission**. It produces schema-validated structured output only. All decisions involving money, state transitions, compliance, escalation, and stopping are made by the deterministic Policy Engine. See [`docs/LLM_BOUNDARY.md`](docs/LLM_BOUNDARY.md).

---

## Tech Stack

- **Backend:** Next.js API routes, TypeScript (strict mode)
- **Database:** Supabase PostgreSQL (RLS-locked, service-role-only writes)
- **LLM:** Google Gemini (schema-validated structured output only)
- **Frontend:** Next.js + TypeScript + Tailwind CSS
- **Auth:** Supabase Auth (single reviewer identity)
- **Deployment:** Vercel + Supabase

---

## License

MIT — see [`LICENSE`](LICENSE).
