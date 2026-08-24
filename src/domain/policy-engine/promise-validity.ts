/**
 * Promise validity rule — determines whether an LLM-extracted commitment candidate
 * can become a VALID_ACTIVE commitment.
 *
 * Why the Policy Engine decides this, not the LLM:
 * The LLM extracts structured data (amount, date) from natural language. Whether
 * that data represents a valid, enforceable promise is a business decision that
 * requires checking outstanding balances, existing commitments, and date horizons.
 * The LLM has no access to these facts and no permission to make this judgment.
 */

import { Clock } from '../clock/clock.interface';
import { MAX_PROMISE_HORIZON_DAYS } from './config';

export interface PromiseCandidate {
  promisedAmount: number;
  promisedDate: Date;
  outstandingAmount: number;
  hasExistingActiveCommitment: boolean;
}

export type PromiseValidationResult =
  | { valid: true; isRenegotiation: boolean }
  | { valid: false; reason: string };

/**
 * Validate a promise-to-pay candidate against business rules.
 *
 * Rules (from 02_BACKEND_SPEC.md §6):
 * 1. amount > 0
 * 2. amount ≤ outstanding balance
 * 3. date is strictly in the future
 * 4. date is ≤ MAX_PROMISE_HORIZON_DAYS from now
 * 5. If there's an existing VALID_ACTIVE commitment, this is a renegotiation
 *    (old → SUPERSEDED, new → VALID_ACTIVE)
 */
export function validatePromise(
  candidate: PromiseCandidate,
  clock: Clock,
): PromiseValidationResult {
  const now = clock.now();

  // Rule 1: amount must be positive
  if (candidate.promisedAmount <= 0) {
    return { valid: false, reason: 'Promised amount must be greater than zero' };
  }

  // Rule 2: amount must not exceed outstanding balance
  if (candidate.promisedAmount > candidate.outstandingAmount) {
    return {
      valid: false,
      reason: `Promised amount (${candidate.promisedAmount}) exceeds outstanding balance (${candidate.outstandingAmount})`,
    };
  }

  // Rule 3: date must be strictly in the future
  // Why strict: a promise to pay "today" is not actionable — there's no monitoring window.
  const promisedDateStart = new Date(candidate.promisedDate);
  promisedDateStart.setHours(0, 0, 0, 0);
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  if (promisedDateStart.getTime() <= todayStart.getTime()) {
    return { valid: false, reason: 'Promised date must be in the future' };
  }

  // Rule 4: date must be within the maximum horizon
  const maxDate = new Date(now);
  maxDate.setDate(maxDate.getDate() + MAX_PROMISE_HORIZON_DAYS);
  if (candidate.promisedDate.getTime() > maxDate.getTime()) {
    return {
      valid: false,
      reason: `Promised date exceeds maximum horizon of ${MAX_PROMISE_HORIZON_DAYS} days`,
    };
  }

  // Rule 5: renegotiation detection
  // If there's already a VALID_ACTIVE commitment, this is a renegotiation.
  // The state-transition service will handle marking the old one as SUPERSEDED.
  return {
    valid: true,
    isRenegotiation: candidate.hasExistingActiveCommitment,
  };
}
