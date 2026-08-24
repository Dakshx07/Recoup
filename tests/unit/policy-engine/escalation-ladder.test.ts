import { describe, it, expect } from 'vitest';
import { evaluateEscalation, EscalationInput } from '@/domain/policy-engine/escalation-ladder';
import { SimulatedClock } from '@/domain/clock/simulated-clock';
import { EscalationLevel } from '@/domain/state-machine/recovery-case.states';
import {
  ESCALATION_REMINDER_2_DAYS,
  ESCALATION_REMINDER_3_DAYS,
  ESCALATION_TRIGGER_DAYS,
  MAX_BROKEN_PROMISES_BEFORE_ESCALATION,
} from '@/domain/policy-engine/config';

const BASE_TIME = new Date('2026-01-15T10:00:00+05:30');

function makeClock(time: Date = BASE_TIME) {
  return new SimulatedClock(time);
}

function makeInput(overrides: Partial<EscalationInput> = {}): EscalationInput {
  return {
    caseOpenedAt: new Date('2026-01-01T10:00:00+05:30'),
    currentEscalationLevel: EscalationLevel.NONE,
    outreachCount: 1,
    brokenPromiseCount: 0,
    hasActiveCommitment: false,
    ...overrides,
  };
}

describe('evaluateEscalation', () => {
  describe('no escalation needed', () => {
    it('does not escalate when case is fresh (< REMINDER_2_DAYS)', () => {
      const openedAt = new Date(BASE_TIME);
      openedAt.setDate(openedAt.getDate() - 1); // opened 1 day ago
      const result = evaluateEscalation(
        makeInput({ caseOpenedAt: openedAt }),
        makeClock()
      );
      expect(result.shouldEscalate).toBe(false);
    });

    it('does not escalate when active commitment exists (waiting for due date)', () => {
      const result = evaluateEscalation(
        makeInput({ hasActiveCommitment: true }),
        makeClock()
      );
      expect(result.shouldEscalate).toBe(false);
      if (!result.shouldEscalate) {
        expect(result.reason).toContain('Active commitment');
      }
    });
  });

  describe('time-based escalation ladder', () => {
    it('escalates to REMINDER_2 after ESCALATION_REMINDER_2_DAYS', () => {
      const openedAt = new Date(BASE_TIME);
      openedAt.setDate(openedAt.getDate() - ESCALATION_REMINDER_2_DAYS);
      const result = evaluateEscalation(
        makeInput({ caseOpenedAt: openedAt }),
        makeClock()
      );
      expect(result.shouldEscalate).toBe(true);
      if (result.shouldEscalate) {
        expect(result.newLevel).toBe(EscalationLevel.REMINDER_2);
        expect(result.action).toBe('SEND_REMINDER');
      }
    });

    it('escalates to REMINDER_3 after ESCALATION_REMINDER_3_DAYS', () => {
      const openedAt = new Date(BASE_TIME);
      openedAt.setDate(openedAt.getDate() - ESCALATION_REMINDER_3_DAYS);
      const result = evaluateEscalation(
        makeInput({ caseOpenedAt: openedAt, currentEscalationLevel: EscalationLevel.REMINDER_2 }),
        makeClock()
      );
      expect(result.shouldEscalate).toBe(true);
      if (result.shouldEscalate) {
        expect(result.newLevel).toBe(EscalationLevel.REMINDER_3);
        expect(result.action).toBe('SEND_REMINDER');
      }
    });

    it('escalates to HUMAN_REVIEW after ESCALATION_TRIGGER_DAYS', () => {
      const openedAt = new Date(BASE_TIME);
      openedAt.setDate(openedAt.getDate() - ESCALATION_TRIGGER_DAYS);
      const result = evaluateEscalation(
        makeInput({ caseOpenedAt: openedAt, currentEscalationLevel: EscalationLevel.REMINDER_3 }),
        makeClock()
      );
      expect(result.shouldEscalate).toBe(true);
      if (result.shouldEscalate) {
        expect(result.newLevel).toBe(EscalationLevel.HUMAN_REVIEW);
        expect(result.action).toBe('ESCALATE_TO_HUMAN');
      }
    });
  });

  describe('broken promise trigger', () => {
    it('escalates immediately when broken promise threshold is met', () => {
      const result = evaluateEscalation(
        makeInput({ brokenPromiseCount: MAX_BROKEN_PROMISES_BEFORE_ESCALATION }),
        makeClock()
      );
      expect(result.shouldEscalate).toBe(true);
      if (result.shouldEscalate) {
        expect(result.newLevel).toBe(EscalationLevel.HUMAN_REVIEW);
        expect(result.reason).toContain('Broken promise');
      }
    });

    it('does not escalate below the broken promise threshold', () => {
      const openedAt = new Date(BASE_TIME);
      openedAt.setDate(openedAt.getDate() - 1);
      const result = evaluateEscalation(
        makeInput({
          caseOpenedAt: openedAt,
          brokenPromiseCount: MAX_BROKEN_PROMISES_BEFORE_ESCALATION - 1,
        }),
        makeClock()
      );
      expect(result.shouldEscalate).toBe(false);
    });
  });

  describe('terminal escalation levels', () => {
    it('does not escalate further from HUMAN_REVIEW', () => {
      const result = evaluateEscalation(
        makeInput({ currentEscalationLevel: EscalationLevel.HUMAN_REVIEW }),
        makeClock()
      );
      expect(result.shouldEscalate).toBe(false);
    });

    it('does not escalate from COLLECTIONS_HANDOFF', () => {
      const result = evaluateEscalation(
        makeInput({ currentEscalationLevel: EscalationLevel.COLLECTIONS_HANDOFF }),
        makeClock()
      );
      expect(result.shouldEscalate).toBe(false);
    });
  });
});
