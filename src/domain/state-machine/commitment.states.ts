/**
 * Commitment state machine — all valid statuses and their allowed transitions.
 *
 * Commitments are rows in the commitment ledger, each tracking a single
 * promise-to-pay. Terminal rows are never edited — a new negotiation
 * creates a new row (enforced by DB trigger trg_commitments_terminal_lock).
 *
 * See 02_BACKEND_SPEC.md §1.2 for the full state table.
 */

export const CommitmentStatus = {
  CANDIDATE: 'CANDIDATE',
  VALID_ACTIVE: 'VALID_ACTIVE',
  INVALIDATED: 'INVALIDATED',
  KEPT: 'KEPT',
  PARTIALLY_KEPT: 'PARTIALLY_KEPT',
  BROKEN: 'BROKEN',
  VOIDED_BY_DISPUTE: 'VOIDED_BY_DISPUTE',
  SUPERSEDED: 'SUPERSEDED',
} as const;

export type CommitmentStatus = (typeof CommitmentStatus)[keyof typeof CommitmentStatus];

/** Terminal statuses — DB trigger prevents updates to these rows. */
export const TERMINAL_COMMITMENT_STATUSES: ReadonlySet<CommitmentStatus> = new Set([
  CommitmentStatus.KEPT,
  CommitmentStatus.INVALIDATED,
  CommitmentStatus.VOIDED_BY_DISPUTE,
  CommitmentStatus.SUPERSEDED,
]);

/**
 * Valid transitions map: current status → set of allowed next statuses.
 */
export const VALID_COMMITMENT_TRANSITIONS: Record<CommitmentStatus, ReadonlySet<CommitmentStatus>> = {
  [CommitmentStatus.CANDIDATE]: new Set([
    CommitmentStatus.VALID_ACTIVE,
    CommitmentStatus.INVALIDATED,
  ]),
  [CommitmentStatus.VALID_ACTIVE]: new Set([
    CommitmentStatus.KEPT,
    CommitmentStatus.PARTIALLY_KEPT,
    CommitmentStatus.BROKEN,
    CommitmentStatus.VOIDED_BY_DISPUTE,
    CommitmentStatus.SUPERSEDED,
  ]),
  [CommitmentStatus.PARTIALLY_KEPT]: new Set([
    // Can lead to new cycle (new CANDIDATE created as separate row)
    // or case closure — handled at the case level, not commitment level
  ]),
  [CommitmentStatus.BROKEN]: new Set([
    // May spawn new CANDIDATE via renegotiation (separate row)
    // The BROKEN row itself stays BROKEN
  ]),
  // Terminal — no transitions out (enforced by DB trigger)
  [CommitmentStatus.INVALIDATED]: new Set(),
  [CommitmentStatus.KEPT]: new Set(),
  [CommitmentStatus.VOIDED_BY_DISPUTE]: new Set(),
  [CommitmentStatus.SUPERSEDED]: new Set(),
};

export const ValidatedBy = {
  POLICY_ENGINE: 'policy_engine',
  HUMAN: 'human',
} as const;

export type ValidatedBy = (typeof ValidatedBy)[keyof typeof ValidatedBy];
