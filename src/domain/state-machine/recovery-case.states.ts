/**
 * Recovery Case state machine — all valid states and their allowed transitions.
 *
 * This is the source of truth for what transitions are legal. The state-transition
 * service uses this to validate before writing. No other file should define these
 * transitions.
 *
 * See 02_BACKEND_SPEC.md §1.1 for the full state table.
 */

export const RecoveryCaseState = {
  OPEN: 'OPEN',
  AWAITING_REPLY: 'AWAITING_REPLY',
  REPLY_PROCESSING: 'REPLY_PROCESSING',
  COMMITMENT_ACTIVE: 'COMMITMENT_ACTIVE',
  DISPUTE_OPEN: 'DISPUTE_OPEN',
  GHOSTED: 'GHOSTED',
  ESCALATED: 'ESCALATED',
  CLOSED_PAID: 'CLOSED_PAID',
  CLOSED_PARTIAL: 'CLOSED_PARTIAL',
  CLOSED_WRITTEN_OFF: 'CLOSED_WRITTEN_OFF',
} as const;

export type RecoveryCaseState = (typeof RecoveryCaseState)[keyof typeof RecoveryCaseState];

/** Terminal states — once reached, no further transitions are allowed. */
export const TERMINAL_CASE_STATES: ReadonlySet<RecoveryCaseState> = new Set([
  RecoveryCaseState.CLOSED_PAID,
  RecoveryCaseState.CLOSED_PARTIAL,
  RecoveryCaseState.CLOSED_WRITTEN_OFF,
]);

/**
 * Valid transitions map: current state → set of allowed next states.
 *
 * Special rule: ANY state → CLOSED_PAID is always valid (unprompted full payment).
 * This is handled by the transition validator, not by listing CLOSED_PAID in every set.
 */
export const VALID_CASE_TRANSITIONS: Record<RecoveryCaseState, ReadonlySet<RecoveryCaseState>> = {
  [RecoveryCaseState.OPEN]: new Set([
    RecoveryCaseState.AWAITING_REPLY,
    // CLOSED_PAID handled by the universal payment rule
  ]),
  [RecoveryCaseState.AWAITING_REPLY]: new Set([
    RecoveryCaseState.REPLY_PROCESSING,
    RecoveryCaseState.GHOSTED,
    // CLOSED_PAID handled by the universal payment rule
  ]),
  [RecoveryCaseState.REPLY_PROCESSING]: new Set([
    RecoveryCaseState.COMMITMENT_ACTIVE,
    RecoveryCaseState.DISPUTE_OPEN,
    RecoveryCaseState.AWAITING_REPLY, // clarification needed
    // CLOSED_PAID handled by the universal payment rule
  ]),
  [RecoveryCaseState.COMMITMENT_ACTIVE]: new Set([
    RecoveryCaseState.CLOSED_PAID,
    RecoveryCaseState.CLOSED_PARTIAL,
    RecoveryCaseState.DISPUTE_OPEN,
    RecoveryCaseState.AWAITING_REPLY, // broken promise → renegotiation
    RecoveryCaseState.ESCALATED,
  ]),
  [RecoveryCaseState.DISPUTE_OPEN]: new Set([
    RecoveryCaseState.COMMITMENT_ACTIVE, // dispute rejected → un-freeze
    RecoveryCaseState.OPEN,              // dispute upheld → renegotiate
    RecoveryCaseState.CLOSED_WRITTEN_OFF,
    // CLOSED_PAID handled by the universal payment rule
  ]),
  [RecoveryCaseState.GHOSTED]: new Set([
    RecoveryCaseState.ESCALATED,
    RecoveryCaseState.AWAITING_REPLY, // late reply arrived
    // CLOSED_PAID handled by the universal payment rule
  ]),
  [RecoveryCaseState.ESCALATED]: new Set([
    RecoveryCaseState.CLOSED_PAID,
    RecoveryCaseState.CLOSED_PARTIAL,
    RecoveryCaseState.CLOSED_WRITTEN_OFF,
  ]),
  // Terminal states — no transitions out
  [RecoveryCaseState.CLOSED_PAID]: new Set(),
  [RecoveryCaseState.CLOSED_PARTIAL]: new Set(),
  [RecoveryCaseState.CLOSED_WRITTEN_OFF]: new Set(),
};

export const EscalationLevel = {
  NONE: 'NONE',
  REMINDER_2: 'REMINDER_2',
  REMINDER_3: 'REMINDER_3',
  HUMAN_REVIEW: 'HUMAN_REVIEW',
  COLLECTIONS_HANDOFF: 'COLLECTIONS_HANDOFF',
} as const;

export type EscalationLevel = (typeof EscalationLevel)[keyof typeof EscalationLevel];
