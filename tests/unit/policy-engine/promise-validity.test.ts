import { describe, it, expect } from 'vitest';
import { validatePromise, PromiseCandidate } from '@/domain/policy-engine/promise-validity';
import { SimulatedClock } from '@/domain/clock/simulated-clock';
import { MAX_PROMISE_HORIZON_DAYS } from '@/domain/policy-engine/config';

const BASE_TIME = new Date('2026-01-15T10:00:00+05:30');

function makeClock(time: Date = BASE_TIME) {
  return new SimulatedClock(time);
}

function makeCandidate(overrides: Partial<PromiseCandidate> = {}): PromiseCandidate {
  return {
    promisedAmount: 50000,
    promisedDate: new Date('2026-01-20T00:00:00+05:30'), // 5 days out
    outstandingAmount: 100000,
    hasExistingActiveCommitment: false,
    ...overrides,
  };
}

describe('validatePromise', () => {
  describe('valid promises', () => {
    it('accepts a valid promise with amount < outstanding and future date', () => {
      const result = validatePromise(makeCandidate(), makeClock());
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.isRenegotiation).toBe(false);
      }
    });

    it('accepts a promise for the exact outstanding amount', () => {
      const result = validatePromise(
        makeCandidate({ promisedAmount: 100000 }),
        makeClock()
      );
      expect(result.valid).toBe(true);
    });

    it('accepts a promise at the max horizon boundary', () => {
      const maxDate = new Date(BASE_TIME);
      maxDate.setDate(maxDate.getDate() + MAX_PROMISE_HORIZON_DAYS);
      const result = validatePromise(
        makeCandidate({ promisedDate: maxDate }),
        makeClock()
      );
      expect(result.valid).toBe(true);
    });

    it('detects renegotiation when active commitment exists', () => {
      const result = validatePromise(
        makeCandidate({ hasExistingActiveCommitment: true }),
        makeClock()
      );
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.isRenegotiation).toBe(true);
      }
    });
  });

  describe('invalid promises', () => {
    it('rejects amount = 0', () => {
      const result = validatePromise(
        makeCandidate({ promisedAmount: 0 }),
        makeClock()
      );
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain('greater than zero');
      }
    });

    it('rejects negative amount', () => {
      const result = validatePromise(
        makeCandidate({ promisedAmount: -100 }),
        makeClock()
      );
      expect(result.valid).toBe(false);
    });

    it('rejects amount exceeding outstanding balance', () => {
      const result = validatePromise(
        makeCandidate({ promisedAmount: 150000, outstandingAmount: 100000 }),
        makeClock()
      );
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain('exceeds outstanding');
      }
    });

    it('rejects a promise date in the past', () => {
      const result = validatePromise(
        makeCandidate({ promisedDate: new Date('2026-01-10T00:00:00+05:30') }),
        makeClock()
      );
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain('future');
      }
    });

    it('rejects a promise date of today (must be strictly future)', () => {
      const result = validatePromise(
        makeCandidate({ promisedDate: new Date('2026-01-15T00:00:00+05:30') }),
        makeClock()
      );
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain('future');
      }
    });

    it('rejects a promise date beyond the max horizon', () => {
      const tooFar = new Date(BASE_TIME);
      tooFar.setDate(tooFar.getDate() + MAX_PROMISE_HORIZON_DAYS + 1);
      const result = validatePromise(
        makeCandidate({ promisedDate: tooFar }),
        makeClock()
      );
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain('horizon');
      }
    });
  });
});
