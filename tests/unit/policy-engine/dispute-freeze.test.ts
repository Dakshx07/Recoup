import { describe, it, expect } from 'vitest';
import {
  evaluateDisputeAction,
  resolveDispute,
  DisputeFreezeInput,
} from '@/domain/policy-engine/dispute-freeze';
import { MAX_DISPUTES_BEFORE_MANDATORY_ESCALATION } from '@/domain/policy-engine/config';

describe('evaluateDisputeAction', () => {
  describe('freeze commitment', () => {
    it('freezes an active, non-frozen commitment when dispute is raised', () => {
      const result = evaluateDisputeAction({
        hasActiveCommitment: true,
        isCommitmentFrozen: false,
        totalDisputeCount: 0,
      });
      expect(result.action).toBe('FREEZE_COMMITMENT');
      expect(result.reason).toContain('freezing');
      expect(result.reason).toContain('not cancelling');
    });
  });

  describe('dispute without commitment', () => {
    it('handles dispute when no active commitment exists', () => {
      const result = evaluateDisputeAction({
        hasActiveCommitment: false,
        isCommitmentFrozen: false,
        totalDisputeCount: 0,
      });
      expect(result.action).toBe('DISPUTE_WITHOUT_COMMITMENT');
    });
  });

  describe('already frozen', () => {
    it('detects when commitment is already frozen', () => {
      const result = evaluateDisputeAction({
        hasActiveCommitment: true,
        isCommitmentFrozen: true,
        totalDisputeCount: 0,
      });
      expect(result.action).toBe('ALREADY_FROZEN');
    });
  });

  describe('mandatory escalation on dispute cap', () => {
    it('escalates when dispute count reaches the cap', () => {
      const result = evaluateDisputeAction({
        hasActiveCommitment: true,
        isCommitmentFrozen: false,
        totalDisputeCount: MAX_DISPUTES_BEFORE_MANDATORY_ESCALATION,
      });
      expect(result.action).toBe('MANDATORY_ESCALATION');
    });

    it('escalates even without active commitment when cap exceeded', () => {
      const result = evaluateDisputeAction({
        hasActiveCommitment: false,
        isCommitmentFrozen: false,
        totalDisputeCount: MAX_DISPUTES_BEFORE_MANDATORY_ESCALATION,
      });
      expect(result.action).toBe('MANDATORY_ESCALATION');
    });

    it('does NOT escalate when below the cap', () => {
      const result = evaluateDisputeAction({
        hasActiveCommitment: true,
        isCommitmentFrozen: false,
        totalDisputeCount: MAX_DISPUTES_BEFORE_MANDATORY_ESCALATION - 1,
      });
      expect(result.action).not.toBe('MANDATORY_ESCALATION');
    });
  });
});

describe('resolveDispute', () => {
  const originalDate = new Date('2026-01-20T00:00:00+05:30');

  describe('dispute rejected', () => {
    it('un-freezes commitment and resumes toward original due date', () => {
      const result = resolveDispute({
        resolution: 'REJECTED',
        originalPromisedDate: originalDate,
      });
      expect(result.commitmentAction).toBe('UNFREEZE');
      expect(result.caseAction).toBe('RESUME_COMMITMENT');
      expect(result.reason).toContain('un-frozen');
      expect(result.reason).toContain('2026-01-20');
    });
  });

  describe('dispute upheld', () => {
    it('voids commitment and reopens case', () => {
      const result = resolveDispute({
        resolution: 'UPHELD',
        originalPromisedDate: originalDate,
      });
      expect(result.commitmentAction).toBe('VOID');
      expect(result.caseAction).toBe('REOPEN');
      expect(result.reason).toContain('voided');
    });
  });
});
