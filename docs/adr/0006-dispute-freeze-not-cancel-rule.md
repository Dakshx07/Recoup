# ADR 0006: Dispute-Freeze-Not-Cancel Rule

> Status: **Accepted** — 2026-08-24, build-order step 6.

## Context

When a debtor raises a dispute against an active commitment (e.g., "I promised to pay ₹50,000 by Friday, but actually the invoice is incorrect"), the system must decide what to do with the existing commitment. Three options:

1. **Auto-cancel** the commitment — remove the promise, case returns to negotiation
2. **Auto-ignore** the dispute — keep the commitment active, proceed as normal
3. **Freeze** the commitment — preserve both facts, require human resolution

## Decision

**Freeze the commitment.** Set `is_frozen = true`, keep `status = 'VALID_ACTIVE'`, preserve the original due date. Move the case to `DISPUTE_OPEN`. A human must resolve.

Resolution paths:
- **Dispute rejected** → un-freeze commitment, resume toward original due date (no extension)
- **Dispute upheld** → commitment `VOIDED_BY_DISPUTE`, case reopened or written off

## Consequences

**Why not auto-cancel:**
A debtor who wants to escape a promise can simply dispute → commitment cancelled → no obligation. This is a trivially exploitable pattern: promise, then immediately dispute, repeat indefinitely. The freeze rule means a rejected dispute gains the debtor nothing — the original commitment survives with its original due date.

**Why not auto-ignore:**
If the invoice genuinely is incorrect, we'd be enforcing a debt that doesn't exist. This is a compliance and reputational risk that no amount of efficiency justifies. The system must stop and ask a human when evidence conflicts.

**Residual risk (named unprompted):**
A debtor could file multiple disputes to keep commitments frozen, creating review-queue load for the human reviewer. Mitigated by `MAX_DISPUTES_BEFORE_MANDATORY_ESCALATION` (currently 2) — after the cap, further disputes trigger automatic escalation instead of another freeze cycle.

**Trade-off accepted:**
The freeze rule adds human-review load. This is the deliberate trade-off: we accept review-queue cost to avoid both the exploitable-cancel and the wrong-enforcement failure modes.
