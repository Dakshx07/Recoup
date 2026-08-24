/**
 * Transition validation — pure functions that check whether a state transition is legal.
 *
 * These functions are the enforcement layer. The state-transition service calls them
 * before writing any state change. They have no side effects and no dependencies
 * beyond the state machine definitions.
 */

import {
  RecoveryCaseState,
  VALID_CASE_TRANSITIONS,
  TERMINAL_CASE_STATES,
} from './recovery-case.states';
import {
  CommitmentStatus,
  VALID_COMMITMENT_TRANSITIONS,
  TERMINAL_COMMITMENT_STATUSES,
} from './commitment.states';

export type TransitionResult =
  | { valid: true }
  | { valid: false; reason: string };

/**
 * Check if a recovery case state transition is legal.
 *
 * Special rule: ANY non-terminal state → CLOSED_PAID is always valid,
 * triggered solely by the Payment Verifier confirming full payment.
 * This is the "unprompted payment" path.
 */
export function validateCaseTransition(
  currentState: RecoveryCaseState,
  newState: RecoveryCaseState,
): TransitionResult {
  if (currentState === newState) {
    return { valid: false, reason: `No-op transition: already in state ${currentState}` };
  }

  if (TERMINAL_CASE_STATES.has(currentState)) {
    return {
      valid: false,
      reason: `Cannot transition from terminal state ${currentState}`,
    };
  }

  // Universal rule: any non-terminal state → CLOSED_PAID is always valid
  // Why: a full payment can arrive at any time (unprompted, via a payment link
  // the debtor had from earlier, etc.) and should always close the case.
  if (newState === RecoveryCaseState.CLOSED_PAID) {
    return { valid: true };
  }

  const allowedTransitions = VALID_CASE_TRANSITIONS[currentState];
  if (allowedTransitions.has(newState)) {
    return { valid: true };
  }

  return {
    valid: false,
    reason: `Invalid transition: ${currentState} → ${newState}. Allowed: ${[...allowedTransitions].join(', ') || 'none'}`,
  };
}

/**
 * Check if a commitment status transition is legal.
 */
export function validateCommitmentTransition(
  currentStatus: CommitmentStatus,
  newStatus: CommitmentStatus,
): TransitionResult {
  if (currentStatus === newStatus) {
    return { valid: false, reason: `No-op transition: already in status ${currentStatus}` };
  }

  if (TERMINAL_COMMITMENT_STATUSES.has(currentStatus)) {
    return {
      valid: false,
      reason: `Cannot transition from terminal status ${currentStatus} (DB trigger enforces this)`,
    };
  }

  const allowedTransitions = VALID_COMMITMENT_TRANSITIONS[currentStatus];
  if (allowedTransitions.has(newStatus)) {
    return { valid: true };
  }

  return {
    valid: false,
    reason: `Invalid transition: ${currentStatus} → ${newStatus}. Allowed: ${[...allowedTransitions].join(', ') || 'none'}`,
  };
}
