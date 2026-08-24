/**
 * Stopping rules — determine when to halt contact with a debtor.
 *
 * These are hard stops, not suggestions. When a stopping rule fires,
 * no further outreach is sent, regardless of other policy outputs.
 */

import {
  MAX_OUTREACH_ATTEMPTS,
  MAX_ESCALATION_LEVEL,
} from './config';
import { EscalationLevel } from '../state-machine/recovery-case.states';

export interface StoppingRuleInput {
  /** Total outreach attempts made for this case */
  totalOutreachAttempts: number;
  /** Current escalation level */
  currentEscalationLevel: EscalationLevel;
  /** Whether the case has a legal-hold flag */
  hasLegalHold: boolean;
  /** Whether the case has received full payment */
  hasFullPayment: boolean;
}

export type StoppingRuleResult =
  | { shouldStop: true; reason: string; action: StopAction }
  | { shouldStop: false };

export type StopAction =
  | 'CLOSE_PAID'              // full payment received
  | 'ESCALATE_MAX_ATTEMPTS'   // max outreach attempts reached
  | 'TERMINAL_ESCALATION'     // max escalation level reached
  | 'LEGAL_HOLD';             // legal hold flag — immediate stop

/**
 * Check all stopping rules. Returns the first rule that fires.
 *
 * Rules (02_BACKEND_SPEC.md §6):
 * 1. Full payment (any state) → close
 * 2. Max attempts → escalate & halt
 * 3. Max escalation level → terminal
 * 4. Legal-hold flag → immediate stop
 *
 * The order matters: legal hold and full payment are checked first because
 * they override everything else.
 */
export function checkStoppingRules(input: StoppingRuleInput): StoppingRuleResult {
  // Rule 4 (checked first): legal hold → immediate stop, overrides everything
  if (input.hasLegalHold) {
    return {
      shouldStop: true,
      reason: 'Legal hold flag is set — all contact must cease immediately',
      action: 'LEGAL_HOLD',
    };
  }

  // Rule 1: full payment → close
  if (input.hasFullPayment) {
    return {
      shouldStop: true,
      reason: 'Full payment received — closing case',
      action: 'CLOSE_PAID',
    };
  }

  // Rule 3: terminal escalation level → stop
  if (input.currentEscalationLevel === MAX_ESCALATION_LEVEL) {
    return {
      shouldStop: true,
      reason: `Terminal escalation level reached (${MAX_ESCALATION_LEVEL}) — no further automated contact`,
      action: 'TERMINAL_ESCALATION',
    };
  }

  // Rule 2: max outreach attempts → escalate and halt
  if (input.totalOutreachAttempts >= MAX_OUTREACH_ATTEMPTS) {
    return {
      shouldStop: true,
      reason: `Maximum outreach attempts reached (${input.totalOutreachAttempts}/${MAX_OUTREACH_ATTEMPTS})`,
      action: 'ESCALATE_MAX_ATTEMPTS',
    };
  }

  return { shouldStop: false };
}
