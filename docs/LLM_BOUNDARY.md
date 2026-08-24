# LLM Boundary

> What the LLM can and cannot do — the CAN/MUST NOT lists and the validation pipeline.

_Last updated: 2026-08-24 (scaffold — will be filled at build-order step 8)._

---

## LLM CAN

- Draft outreach text (messages to debtors)
- Parse debtor replies into structured data: `{intent_type, extracted_amount, extracted_date, confidence, ambiguity_flags}`
- Flag ambiguity/dispute signals
- Generate non-authoritative, explicitly-labeled audit summaries
- Classify dispute reason for human-queue triage

## LLM MUST NOT

- Write to `commitments.status` or `recovery_cases.state`
- Decide promise validity
- Decide whether payment was received
- Decide escalation timing/target
- Decide quiet-hours/contact-cap compliance
- Decide stop/continue contact
- Determine policy violation
- Self-report action success
- Execute any tools — **zero tool-execution permission**

## Validation Pipeline

```
LLM output → JSON-schema conformance → range/type checks → confidence threshold
                                                                    ↓
                                                        Any failure → AMBIGUOUS
                                                        → human clarification
                                                        Never coerced, never guessed
```

## Provider

- Google Gemini (schema-validated structured output)
- Provider is abstracted behind an interface for swappability

_Implementation details to be filled at step 8._
