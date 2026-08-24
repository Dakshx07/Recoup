/**
 * Escalation ladder — determines when and how to escalate a recovery case.
 *
 * The ladder is evidence-triggered, not time-triggered alone:
 * - Escalation requires either (a) no response within the timeout window, or
 *   (b) a broken promise. It never fires on "gut feel" or model judgment.
 * - Each escalation step is deterministic and auditable.
 */

import { Clock } from '../clock/clock.interface';
import {
  ESCALATION_REMINDER_2_DAYS,
  ESCALATION_REMINDER_3_DAYS,
  ESCALATION_TRIGGER_DAYS,
  MAX_BROKEN_PROMISES_BEFORE_ESCALATION,
} from './config';
import { EscalationLevel } from '../state-machine/recovery-case.states';

export interface EscalationInput {
  /** When the case was opened */
  caseOpenedAt: Date;
  /** Current escalation level */
  currentEscalationLevel: EscalationLevel;
  /** Number of outreach messages sent */
  outreachCount: number;
  /** Number of broken promises */
  brokenPromiseCount: number;
  /** Whether there's currently a VALID_ACTIVE commitment (if so, don't escalate on time alone) */
  hasActiveCommitment: boolean;
  /** When the last outreach was sent (if any) */
  lastOutreachAt?: Date;
}

export type EscalationResult =
  | { shouldEscalate: false; reason: string }
  | {
      shouldEscalate: true;
      newLevel: EscalationLevel;
      reason: string;
      action: 'SEND_REMINDER' | 'ESCALATE_TO_HUMAN' | 'COLLECTIONS_HANDOFF';
    };

/**
 * Evaluate whether the case should be escalated.
 *
 * Escalation ladder (02_BACKEND_SPEC.md §6):
 *   Initial outreach
 *   → reminder at +ESCALATION_REMINDER_2_DAYS
 *   → firm reminder at +ESCALATION_REMINDER_3_DAYS
 *   → 1 broken promise OR day ESCALATION_TRIGGER_DAYS with nothing → escalate
 */
export function evaluateEscalation(
  input: EscalationInput,
  clock: Clock,
): EscalationResult {
  const now = clock.now();
  const daysSinceOpen = daysBetween(input.caseOpenedAt, now);

  // If there's an active commitment being monitored, don't escalate on time alone.
  // The due-date check will handle broken promises separately.
  if (input.hasActiveCommitment) {
    return {
      shouldEscalate: false,
      reason: 'Active commitment exists — waiting for due-date evaluation before escalation',
    };
  }

  // Broken promise trigger: immediate escalation if max broken promises exceeded
  if (input.brokenPromiseCount >= MAX_BROKEN_PROMISES_BEFORE_ESCALATION) {
    return {
      shouldEscalate: true,
      newLevel: EscalationLevel.HUMAN_REVIEW,
      reason: `Broken promise count (${input.brokenPromiseCount}) reached threshold (${MAX_BROKEN_PROMISES_BEFORE_ESCALATION})`,
      action: 'ESCALATE_TO_HUMAN',
    };
  }

  // Time-based ladder (only if no active commitment)
  switch (input.currentEscalationLevel) {
    case EscalationLevel.NONE:
      if (daysSinceOpen >= ESCALATION_REMINDER_2_DAYS) {
        return {
          shouldEscalate: true,
          newLevel: EscalationLevel.REMINDER_2,
          reason: `${daysSinceOpen} days since case opened, no response — sending reminder`,
          action: 'SEND_REMINDER',
        };
      }
      break;

    case EscalationLevel.REMINDER_2:
      if (daysSinceOpen >= ESCALATION_REMINDER_3_DAYS) {
        return {
          shouldEscalate: true,
          newLevel: EscalationLevel.REMINDER_3,
          reason: `${daysSinceOpen} days since case opened, still no response — sending firm reminder`,
          action: 'SEND_REMINDER',
        };
      }
      break;

    case EscalationLevel.REMINDER_3:
      if (daysSinceOpen >= ESCALATION_TRIGGER_DAYS) {
        return {
          shouldEscalate: true,
          newLevel: EscalationLevel.HUMAN_REVIEW,
          reason: `${daysSinceOpen} days since case opened with no commitment — escalating to human review`,
          action: 'ESCALATE_TO_HUMAN',
        };
      }
      break;

    case EscalationLevel.HUMAN_REVIEW:
      // Already at human review — the next step is collections handoff,
      // but that requires human decision, not automatic escalation.
      return {
        shouldEscalate: false,
        reason: 'Already at HUMAN_REVIEW — further escalation requires human decision',
      };

    case EscalationLevel.COLLECTIONS_HANDOFF:
      // Terminal escalation level
      return {
        shouldEscalate: false,
        reason: 'Already at terminal escalation level (COLLECTIONS_HANDOFF)',
      };
  }

  return {
    shouldEscalate: false,
    reason: `Not yet at escalation threshold (day ${daysSinceOpen} of ${ESCALATION_TRIGGER_DAYS})`,
  };
}

/** Calculate whole days between two dates. */
function daysBetween(start: Date, end: Date): number {
  const diffMs = end.getTime() - start.getTime();
  return Math.floor(diffMs / (24 * 60 * 60 * 1000));
}
