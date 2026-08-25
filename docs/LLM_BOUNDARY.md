# Recoup — LLM Boundary & Safety Architecture

This document defines the strict boundaries, permissions, Zod schemas, and prompt design governing the Intelligence Layer.

---

## 1. Zero-Tool Authority Constraint

The foundational security invariant of Recoup is that **the LLM is granted ZERO tools and ZERO database write permissions** ([ADR 0002](adr/0002-llm-zero-write-permission.md)).

```
Debtor Reply ──► LLM Parser (Gemini 2.0 Flash) ──► Zod Schema Validation ──► Candidate Object
                                                                                   │
                                                                   Policy Engine Validates
                                                                                   │
                                                                  State Transition Service
```

### What the LLM CAN Do:
- Parse natural language debtor replies into structured JSON objects.
- Extract proposed amounts, dates, and intent categories (`PROMISE_CANDIDATE`, `DISPUTE_CANDIDATE`, `UNPROMPT_PAYMENT`, `AMBIGUOUS`).
- Draft policy-gated polite reminder messages.

### What the LLM MUST NEVER Do:
- Write directly to `recovery_cases`, `commitments`, `invoices`, or `audit_events`.
- Decide if a promise is valid (owned by Policy Engine).
- Decide whether payment was received (owned by Razorpay Webhook Verifier).
- Decide escalation timing or initiate collections handoff.
- Evaluate quiet hours or contact frequency compliance.

---

## 2. Structured Extraction Schema

Every LLM parse response must strictly conform to the following Zod schema (`src/domain/llm/schemas.ts`):

```typescript
import { z } from 'zod';

export const ReplyParseSchema = z.object({
  intent_type: z.enum([
    'PROMISE_CANDIDATE',
    'DISPUTE_CANDIDATE',
    'UNPROMPT_PAYMENT',
    'AMBIGUOUS',
    'REFUSAL',
  ]),
  extracted_amount: z.number().nullable(),
  extracted_date: z.string().nullable(), // ISO YYYY-MM-DD
  confidence: z.number().min(0).max(1),
  ambiguity_flags: z.array(z.string()),
  dispute_reason: z.string().nullable(),
  summary: z.string(),
});
```

### Fallback Behavior:
If the model output fails schema validation or produces a confidence score below `0.80`, the parser automatically assigns `intent_type = 'AMBIGUOUS'`, which routes the case to human clarification without mutating financial state.
