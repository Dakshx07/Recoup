# ADR 0001: Two-Tier State Machine

> Status: **Accepted** — 2026-08-24, build-order step 5.

## Context

Recovery cases involve tracking two distinct lifecycles:

1. **The recovery attempt** — tracking outreach, replies, disputes, escalation, and closure for a single invoice
2. **Individual commitments** — tracking each promise-to-pay (amount, date, whether it was kept)

A single flat state machine would conflate these. A case can have multiple commitments over its lifetime: initial promise → broken → renegotiated → second promise → kept. Each commitment has its own lifecycle (CANDIDATE → VALID_ACTIVE → KEPT/BROKEN/etc.), independent of the case's overall state.

## Decision

Two separate but linked state machines:

- **`recovery_cases.state`** — 10 states tracking the overall recovery attempt
- **`commitments.status`** — 8 statuses tracking each individual promise

Linked by `commitments.recovery_case_id`. The case state reflects the "current phase" of recovery; commitments are the evidence ledger. The state-transition service manages both atomically in a single transaction.

## Consequences

**Positive:**
- A case can naturally have multiple commitments (initial, renegotiation, post-dispute)
- Commitment history is preserved — terminal rows are never edited, new negotiations create new rows
- The dispute-freeze edge case maps cleanly: commitment frozen but case moves to DISPUTE_OPEN
- Audit trail can track case-level and commitment-level events independently

**Negative:**
- Two state machines require careful coordination in the transition service
- Partial unique index (`uq_commitments_one_active_per_case`) adds DB complexity
- More states to test exhaustively (10 × 8 combinations to reason about, though most are invalid)
