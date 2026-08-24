import { describe, it, expect } from 'vitest';
import {
  validateCaseTransition,
  validateCommitmentTransition,
} from '@/domain/state-machine/transitions';
import { RecoveryCaseState, TERMINAL_CASE_STATES } from '@/domain/state-machine/recovery-case.states';
import { CommitmentStatus, TERMINAL_COMMITMENT_STATUSES } from '@/domain/state-machine/commitment.states';

describe('validateCaseTransition', () => {
  describe('valid transitions', () => {
    const validPairs: [RecoveryCaseState, RecoveryCaseState][] = [
      ['OPEN', 'AWAITING_REPLY'],
      ['AWAITING_REPLY', 'REPLY_PROCESSING'],
      ['AWAITING_REPLY', 'GHOSTED'],
      ['REPLY_PROCESSING', 'COMMITMENT_ACTIVE'],
      ['REPLY_PROCESSING', 'DISPUTE_OPEN'],
      ['REPLY_PROCESSING', 'AWAITING_REPLY'],
      ['COMMITMENT_ACTIVE', 'CLOSED_PAID'],
      ['COMMITMENT_ACTIVE', 'CLOSED_PARTIAL'],
      ['COMMITMENT_ACTIVE', 'DISPUTE_OPEN'],
      ['COMMITMENT_ACTIVE', 'AWAITING_REPLY'],
      ['COMMITMENT_ACTIVE', 'ESCALATED'],
      ['DISPUTE_OPEN', 'COMMITMENT_ACTIVE'],
      ['DISPUTE_OPEN', 'OPEN'],
      ['DISPUTE_OPEN', 'CLOSED_WRITTEN_OFF'],
      ['GHOSTED', 'ESCALATED'],
      ['GHOSTED', 'AWAITING_REPLY'],
      ['ESCALATED', 'CLOSED_PAID'],
      ['ESCALATED', 'CLOSED_PARTIAL'],
      ['ESCALATED', 'CLOSED_WRITTEN_OFF'],
    ];

    it.each(validPairs)('%s → %s should be valid', (from, to) => {
      const result = validateCaseTransition(from, to);
      expect(result.valid).toBe(true);
    });
  });

  describe('universal CLOSED_PAID rule', () => {
    // Any non-terminal state → CLOSED_PAID should be valid
    const nonTerminalStates = Object.values(RecoveryCaseState).filter(
      (s) => !TERMINAL_CASE_STATES.has(s)
    );

    it.each(nonTerminalStates)(
      '%s → CLOSED_PAID should be valid (universal payment rule)',
      (state) => {
        const result = validateCaseTransition(state, RecoveryCaseState.CLOSED_PAID);
        expect(result.valid).toBe(true);
      }
    );
  });

  describe('invalid transitions', () => {
    const invalidPairs: [RecoveryCaseState, RecoveryCaseState][] = [
      ['OPEN', 'COMMITMENT_ACTIVE'],
      ['OPEN', 'ESCALATED'],
      ['OPEN', 'GHOSTED'],
      ['AWAITING_REPLY', 'COMMITMENT_ACTIVE'],
      ['AWAITING_REPLY', 'ESCALATED'],
      ['GHOSTED', 'COMMITMENT_ACTIVE'],
    ];

    it.each(invalidPairs)('%s → %s should be invalid', (from, to) => {
      const result = validateCaseTransition(from, to);
      expect(result.valid).toBe(false);
    });
  });

  describe('terminal states block all transitions', () => {
    const terminalStates = [...TERMINAL_CASE_STATES];
    const allStates = Object.values(RecoveryCaseState);

    for (const terminal of terminalStates) {
      for (const target of allStates) {
        if (terminal === target) continue;
        it(`${terminal} → ${target} should be invalid (terminal)`, () => {
          const result = validateCaseTransition(terminal, target);
          expect(result.valid).toBe(false);
          expect(result.valid === false && result.reason).toContain('terminal');
        });
      }
    }
  });

  describe('no-op transitions', () => {
    it('same state → same state should be invalid', () => {
      const result = validateCaseTransition(RecoveryCaseState.OPEN, RecoveryCaseState.OPEN);
      expect(result.valid).toBe(false);
      expect(result.valid === false && result.reason).toContain('No-op');
    });
  });
});

describe('validateCommitmentTransition', () => {
  describe('valid transitions', () => {
    const validPairs: [CommitmentStatus, CommitmentStatus][] = [
      ['CANDIDATE', 'VALID_ACTIVE'],
      ['CANDIDATE', 'INVALIDATED'],
      ['VALID_ACTIVE', 'KEPT'],
      ['VALID_ACTIVE', 'PARTIALLY_KEPT'],
      ['VALID_ACTIVE', 'BROKEN'],
      ['VALID_ACTIVE', 'VOIDED_BY_DISPUTE'],
      ['VALID_ACTIVE', 'SUPERSEDED'],
    ];

    it.each(validPairs)('%s → %s should be valid', (from, to) => {
      const result = validateCommitmentTransition(from, to);
      expect(result.valid).toBe(true);
    });
  });

  describe('terminal statuses block all transitions', () => {
    const terminalStatuses = [...TERMINAL_COMMITMENT_STATUSES];
    const allStatuses = Object.values(CommitmentStatus);

    for (const terminal of terminalStatuses) {
      for (const target of allStatuses) {
        if (terminal === target) continue;
        it(`${terminal} → ${target} should be invalid (terminal)`, () => {
          const result = validateCommitmentTransition(terminal, target);
          expect(result.valid).toBe(false);
          expect(result.valid === false && result.reason).toContain('terminal');
        });
      }
    }
  });

  describe('invalid transitions', () => {
    const invalidPairs: [CommitmentStatus, CommitmentStatus][] = [
      ['CANDIDATE', 'KEPT'],
      ['CANDIDATE', 'BROKEN'],
      ['CANDIDATE', 'PARTIALLY_KEPT'],
      ['BROKEN', 'VALID_ACTIVE'],
      ['PARTIALLY_KEPT', 'VALID_ACTIVE'],
    ];

    it.each(invalidPairs)('%s → %s should be invalid', (from, to) => {
      const result = validateCommitmentTransition(from, to);
      expect(result.valid).toBe(false);
    });
  });
});
