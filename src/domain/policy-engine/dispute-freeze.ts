/**
 * Dispute-freeze rule — the required edge case.
 *
 * THE CORE INSIGHT (02_BACKEND_SPEC.md §6, Required Edge Case):
 * When a dispute is raised against an active commitment:
 * - FREEZE the commitment (is_frozen=true, status stays VALID_ACTIVE)
 * - NEVER cancel it (that lets debtors escape promises for free)
 * - NEVER ignore the dispute (that risks enforcing a wrong invoice)
 * - Preserve the original due date
 * - Human resolves: rejected → un-freeze, upheld → VOIDED_BY_DISPUTE
 *
 * Why freeze instead of cancel:
 * Auto-cancel: debtor promises ₹50k, then immediately disputes → commitment gone,
 * no obligation. This is a trivially exploitable escape hatch.
 *
 * Why freeze instead of ignore:
 * Auto-ignore: if the invoice genuinely IS wrong, we'd be enforcing a debt
 * that doesn't exist. Compliance and reputational nightmare.
 *
 * Freezing preserves both facts (the promise AND the dispute) for a human to weigh.
 */

import { MAX_DISPUTES_BEFORE_MANDATORY_ESCALATION } from './config';

export interface DisputeFreezeInput {
  /** Whether there's currently a VALID_ACTIVE commitment */
  hasActiveCommitment: boolean;
  /** Whether the active commitment is already frozen */
  isCommitmentFrozen: boolean;
  /** Total disputes filed for this case (across its lifetime) */
  totalDisputeCount: number;
}

export type DisputeFreezeResult =
  | {
      action: 'FREEZE_COMMITMENT';
      reason: string;
    }
  | {
      action: 'DISPUTE_WITHOUT_COMMITMENT';
      reason: string;
    }
  | {
      action: 'ALREADY_FROZEN';
      reason: string;
    }
  | {
      action: 'MANDATORY_ESCALATION';
      reason: string;
    };

/**
 * Determine what to do when a dispute is raised.
 */
export function evaluateDisputeAction(input: DisputeFreezeInput): DisputeFreezeResult {
  // Check dispute count cap first — if exceeded, mandatory escalation
  if (input.totalDisputeCount >= MAX_DISPUTES_BEFORE_MANDATORY_ESCALATION) {
    return {
      action: 'MANDATORY_ESCALATION',
      reason: `Dispute count (${input.totalDisputeCount + 1}) exceeds maximum (${MAX_DISPUTES_BEFORE_MANDATORY_ESCALATION}) — mandatory escalation to human review`,
    };
  }

  // No active commitment — dispute is about the invoice itself, not a promise
  if (!input.hasActiveCommitment) {
    return {
      action: 'DISPUTE_WITHOUT_COMMITMENT',
      reason: 'Dispute raised with no active commitment — case moves to DISPUTE_OPEN for human review',
    };
  }

  // Active commitment is already frozen — shouldn't happen in normal flow,
  // but handle gracefully
  if (input.isCommitmentFrozen) {
    return {
      action: 'ALREADY_FROZEN',
      reason: 'Active commitment is already frozen by a previous dispute',
    };
  }

  // Normal case: active commitment exists, not yet frozen — FREEZE it
  return {
    action: 'FREEZE_COMMITMENT',
    reason: 'Dispute raised against active commitment — freezing (not cancelling) to preserve both the promise and the dispute for human resolution',
  };
}

export interface DisputeResolutionInput {
  /** Human's decision */
  resolution: 'REJECTED' | 'UPHELD';
  /** The frozen commitment's original promised date */
  originalPromisedDate: Date;
}

export type DisputeResolutionResult =
  | {
      commitmentAction: 'UNFREEZE';
      caseAction: 'RESUME_COMMITMENT';
      reason: string;
    }
  | {
      commitmentAction: 'VOID';
      caseAction: 'REOPEN' | 'WRITE_OFF';
      reason: string;
    };

/**
 * Determine what happens when a human resolves a dispute.
 *
 * REJECTED: dispute was invalid → un-freeze commitment, resume toward original due date
 * UPHELD: dispute was valid → void commitment, reopen case or write off
 */
export function resolveDispute(input: DisputeResolutionInput): DisputeResolutionResult {
  if (input.resolution === 'REJECTED') {
    return {
      commitmentAction: 'UNFREEZE',
      caseAction: 'RESUME_COMMITMENT',
      reason: `Dispute rejected — commitment un-frozen, resuming toward original due date (${input.originalPromisedDate.toISOString().split('T')[0]})`,
    };
  }

  // UPHELD: the invoice was genuinely wrong
  return {
    commitmentAction: 'VOID',
    caseAction: 'REOPEN',
    reason: 'Dispute upheld — commitment voided (VOIDED_BY_DISPUTE), case reopened for renegotiation or write-off',
  };
}
