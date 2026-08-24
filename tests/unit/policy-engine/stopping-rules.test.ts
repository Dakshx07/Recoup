import { describe, it, expect } from 'vitest';
import { checkStoppingRules, StoppingRuleInput } from '@/domain/policy-engine/stopping-rules';
import { EscalationLevel } from '@/domain/state-machine/recovery-case.states';
import { MAX_OUTREACH_ATTEMPTS } from '@/domain/policy-engine/config';

function makeInput(overrides: Partial<StoppingRuleInput> = {}): StoppingRuleInput {
  return {
    totalOutreachAttempts: 1,
    currentEscalationLevel: EscalationLevel.NONE,
    hasLegalHold: false,
    hasFullPayment: false,
    ...overrides,
  };
}

describe('checkStoppingRules', () => {
  describe('no stop needed', () => {
    it('does not stop for a normal, in-progress case', () => {
      const result = checkStoppingRules(makeInput());
      expect(result.shouldStop).toBe(false);
    });
  });

  describe('full payment', () => {
    it('stops and closes when full payment received', () => {
      const result = checkStoppingRules(makeInput({ hasFullPayment: true }));
      expect(result.shouldStop).toBe(true);
      if (result.shouldStop) {
        expect(result.action).toBe('CLOSE_PAID');
      }
    });
  });

  describe('legal hold', () => {
    it('stops immediately on legal hold', () => {
      const result = checkStoppingRules(makeInput({ hasLegalHold: true }));
      expect(result.shouldStop).toBe(true);
      if (result.shouldStop) {
        expect(result.action).toBe('LEGAL_HOLD');
        expect(result.reason).toContain('Legal hold');
      }
    });

    it('legal hold takes priority over full payment', () => {
      const result = checkStoppingRules(
        makeInput({ hasLegalHold: true, hasFullPayment: true })
      );
      expect(result.shouldStop).toBe(true);
      if (result.shouldStop) {
        // Legal hold should be checked first
        expect(result.action).toBe('LEGAL_HOLD');
      }
    });
  });

  describe('max outreach attempts', () => {
    it('stops when max outreach attempts reached', () => {
      const result = checkStoppingRules(
        makeInput({ totalOutreachAttempts: MAX_OUTREACH_ATTEMPTS })
      );
      expect(result.shouldStop).toBe(true);
      if (result.shouldStop) {
        expect(result.action).toBe('ESCALATE_MAX_ATTEMPTS');
      }
    });

    it('does not stop one below max', () => {
      const result = checkStoppingRules(
        makeInput({ totalOutreachAttempts: MAX_OUTREACH_ATTEMPTS - 1 })
      );
      expect(result.shouldStop).toBe(false);
    });
  });

  describe('terminal escalation level', () => {
    it('stops at COLLECTIONS_HANDOFF', () => {
      const result = checkStoppingRules(
        makeInput({ currentEscalationLevel: EscalationLevel.COLLECTIONS_HANDOFF })
      );
      expect(result.shouldStop).toBe(true);
      if (result.shouldStop) {
        expect(result.action).toBe('TERMINAL_ESCALATION');
      }
    });

    it('does not stop at HUMAN_REVIEW', () => {
      const result = checkStoppingRules(
        makeInput({ currentEscalationLevel: EscalationLevel.HUMAN_REVIEW })
      );
      expect(result.shouldStop).toBe(false);
    });
  });
});
