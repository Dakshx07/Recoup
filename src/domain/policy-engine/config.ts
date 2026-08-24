/**
 * Policy Engine configuration — every threshold as a named constant.
 *
 * RULE: No number may be hardcoded inline in any policy rule file.
 * Every threshold lives here and is referenced by name.
 *
 * These are BUSINESS RULES implemented as TypeScript constants, not env vars.
 * They're designed to be changed in one place without a code change to the rules.
 *
 * IMPORTANT: The partial-payment tolerance and escalation-ladder day-counts are
 * WORKING DEFAULTS, not validated business decisions. They're implemented as
 * named constants so they're revisable without structural code changes.
 * See 03_IMPLEMENTATION_PLAN.md §5 (Open Questions).
 */

// ─── Quiet Hours ───────────────────────────────────────────────────────────
// Why IST-only: single-timezone MVP. A production system would need
// debtor-local timezone support (see docs/LIMITATIONS.md).
export const QUIET_HOURS_START = 21; // 21:00 IST — no outreach after this
export const QUIET_HOURS_END = 9;    // 09:00 IST — outreach allowed from this
export const QUIET_HOURS_TIMEZONE = 'Asia/Kolkata'; // IST

// ─── Contact Frequency ────────────────────────────────────────────────────
export const MAX_OUTREACH_PER_CASE = 3;           // max messages per case
export const OUTREACH_ROLLING_WINDOW_DAYS = 7;     // within this rolling window

// ─── Promise Validity ─────────────────────────────────────────────────────
export const MAX_PROMISE_HORIZON_DAYS = 90;        // promise date must be ≤ 90 days out

// ─── Partial Payment ──────────────────────────────────────────────────────
// PLACEHOLDER: 90% tolerance is a working default, not a validated business decision.
// Implemented as a named constant per 03_IMPLEMENTATION_PLAN.md §5.
export const PARTIAL_PAYMENT_TOLERANCE = 0.90;     // ≥90% of promised amount = effectively KEPT

// ─── Escalation Ladder ────────────────────────────────────────────────────
// WORKING DEFAULTS — day-counts are reasonable guesses, not validated.
export const ESCALATION_REMINDER_2_DAYS = 3;       // first follow-up after initial outreach
export const ESCALATION_REMINDER_3_DAYS = 7;       // second follow-up (firm reminder)
export const ESCALATION_TRIGGER_DAYS = 14;         // escalate if no commitment by day 14
export const MAX_BROKEN_PROMISES_BEFORE_ESCALATION = 1; // one broken promise → escalate

// ─── Dispute ──────────────────────────────────────────────────────────────
export const MAX_DISPUTES_BEFORE_MANDATORY_ESCALATION = 2; // cap on dispute-filing

// ─── LLM Confidence ───────────────────────────────────────────────────────
export const LLM_CONFIDENCE_THRESHOLD = 0.70;      // below this → AMBIGUOUS, never guessed
export const LLM_MAX_CORRECTIVE_REPROMPTS = 1;      // one retry on schema failure, then AMBIGUOUS

// ─── Stopping Rules ───────────────────────────────────────────────────────
export const MAX_OUTREACH_ATTEMPTS = 5;             // absolute cap on outreach per case
export const MAX_ESCALATION_LEVEL = 'COLLECTIONS_HANDOFF' as const; // terminal escalation level
