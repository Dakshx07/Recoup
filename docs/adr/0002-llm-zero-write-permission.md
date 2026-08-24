# ADR 0002: LLM Zero Write Permission

> Status: **Accepted** — 2026-08-24, build-order step 6.

## Context

The system uses an LLM (Google Gemini) for two tasks: drafting outreach messages and parsing debtor replies into structured data. The question is: how much authority should the LLM have?

The common pattern in AI agent frameworks (LangChain, LangGraph) is to give the model tool-execution permission — it can call functions that write to databases, send messages, and make decisions. This is convenient but creates fundamental problems for a system handling financial commitments:

1. **Auditability**: If the model decides to escalate, you can't explain *why* to a regulator
2. **Reproducibility**: Model outputs are non-deterministic; the same input may produce different decisions
3. **Safety**: A hallucination or prompt injection could directly write state changes
4. **Liability**: "The AI decided" is not a defensible position for financial decisions

## Decision

**The LLM has zero write or tool-execution permission.** It produces schema-validated structured output only. The Policy Engine, not the model, decides what happens next.

Specifically:
- LLM output is a JSON object validated against a Zod schema
- Failed validation → AMBIGUOUS → human clarification (never coerced, never guessed)
- The Policy Engine independently validates any LLM-extracted candidate before persistence
- No LangChain/LangGraph — hand-rolled, inspectable integration

## Consequences

**Positive:**
- Every decision is deterministic and auditable: "the Policy Engine decided X because rule Y evaluated to Z"
- Prompt injection blast radius is limited to the candidate stage — a malicious output can't become a decision
- The system can be tested without an LLM (mock the parser, test the policy engine independently)
- You can truthfully say "I can show you exactly what happens between the model's output and a real action"

**Negative:**
- More code to write than using a framework (hand-rolled schema validation, explicit policy rules)
- The LLM can't handle genuinely novel situations that the policy rules don't cover
- Schema evolution requires updating both the LLM prompt and the Zod schema
