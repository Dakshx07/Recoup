import { describe, it, expect } from 'vitest';
import { SimulatedClock } from '@/domain/clock/simulated-clock';
import { StateTransitionService } from '@/services/state-transition.service';
import { evaluateEscalation } from '@/domain/policy-engine/escalation-ladder';
import { checkStoppingRules } from '@/domain/policy-engine/stopping-rules';
import { RecoveryCaseState, EscalationLevel } from '@/domain/state-machine/recovery-case.states';
import {
  createInvoiceFixture,
  createCaseFixture,
  createInMemoryDatabase,
} from '../fixtures';

describe('INTEGRATION — Escalation Ladder & Stopping Rules Flow', () => {
  it('advances through the time-based escalation ladder (Day 1 -> Day 4 -> Day 8 -> Day 14)', () => {
    const openedAt = new Date('2026-01-01T09:00:00Z');
    const clock = new SimulatedClock(openedAt);

    const invoice = createInvoiceFixture({ id: 'inv_esc_1' });
    const recoveryCase = createCaseFixture({
      id: 'case_esc_1',
      invoice_id: invoice.id,
      opened_at: openedAt.toISOString(),
      state: RecoveryCaseState.AWAITING_REPLY,
      escalation_level: EscalationLevel.NONE,
    });

    // Day 1: Not yet at +3d threshold
    let result = evaluateEscalation({
      caseOpenedAt: openedAt,
      currentEscalationLevel: EscalationLevel.NONE,
      outreachCount: 1,
      brokenPromiseCount: 0,
      hasActiveCommitment: false,
    }, clock);
    expect(result.shouldEscalate).toBe(false);

    // Day 4 (+3 Days): Reminder 2 fires
    clock.advance(new Date('2026-01-04T09:00:00Z'));
    result = evaluateEscalation({
      caseOpenedAt: openedAt,
      currentEscalationLevel: EscalationLevel.NONE,
      outreachCount: 1,
      brokenPromiseCount: 0,
      hasActiveCommitment: false,
    }, clock);
    expect(result.shouldEscalate).toBe(true);
    if (result.shouldEscalate) {
      expect(result.newLevel).toBe(EscalationLevel.REMINDER_2);
      expect(result.action).toBe('SEND_REMINDER');
    }

    // Day 8 (+7 Days): Reminder 3 fires
    clock.advance(new Date('2026-01-08T09:00:00Z'));
    result = evaluateEscalation({
      caseOpenedAt: openedAt,
      currentEscalationLevel: EscalationLevel.REMINDER_2,
      outreachCount: 2,
      brokenPromiseCount: 0,
      hasActiveCommitment: false,
    }, clock);
    expect(result.shouldEscalate).toBe(true);
    if (result.shouldEscalate) {
      expect(result.newLevel).toBe(EscalationLevel.REMINDER_3);
      expect(result.action).toBe('SEND_REMINDER');
    }

    // Day 14 (Trigger Day): Escalate to HUMAN_REVIEW
    clock.advance(new Date('2026-01-15T09:00:00Z'));
    result = evaluateEscalation({
      caseOpenedAt: openedAt,
      currentEscalationLevel: EscalationLevel.REMINDER_3,
      outreachCount: 3,
      brokenPromiseCount: 0,
      hasActiveCommitment: false,
    }, clock);
    expect(result.shouldEscalate).toBe(true);
    if (result.shouldEscalate) {
      expect(result.newLevel).toBe(EscalationLevel.HUMAN_REVIEW);
      expect(result.action).toBe('ESCALATE_TO_HUMAN');
    }
  });

  it('immediately stops all automated outreach when stopping rules fire', () => {
    // Outreach attempts ceiling reached (5 attempts)
    const maxAttemptsResult = checkStoppingRules({
      totalOutreachAttempts: 5,
      currentEscalationLevel: EscalationLevel.REMINDER_3,
      hasLegalHold: false,
      hasFullPayment: false,
    });
    expect(maxAttemptsResult.shouldStop).toBe(true);
    if (maxAttemptsResult.shouldStop) {
      expect(maxAttemptsResult.action).toBe('ESCALATE_MAX_ATTEMPTS');
    }

    // Full payment stopping rule
    const fullPayResult = checkStoppingRules({
      totalOutreachAttempts: 2,
      currentEscalationLevel: EscalationLevel.NONE,
      hasLegalHold: false,
      hasFullPayment: true,
    });
    expect(fullPayResult.shouldStop).toBe(true);
    if (fullPayResult.shouldStop) {
      expect(fullPayResult.action).toBe('CLOSE_PAID');
    }
  });
});
