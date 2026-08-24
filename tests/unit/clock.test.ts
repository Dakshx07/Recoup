import { describe, it, expect } from 'vitest';
import { LiveClock } from '@/domain/clock/live-clock';
import { SimulatedClock } from '@/domain/clock/simulated-clock';
import { ClockMode } from '@/domain/clock/clock.interface';

describe('LiveClock', () => {
  it('returns the current real time', () => {
    const clock = new LiveClock();
    const before = Date.now();
    const clockTime = clock.now().getTime();
    const after = Date.now();

    expect(clockTime).toBeGreaterThanOrEqual(before);
    expect(clockTime).toBeLessThanOrEqual(after);
  });

  it('has LIVE mode', () => {
    const clock = new LiveClock();
    expect(clock.mode).toBe(ClockMode.LIVE);
  });

  it('returns a new Date instance each call (no shared mutable state)', () => {
    const clock = new LiveClock();
    const t1 = clock.now();
    const t2 = clock.now();
    expect(t1).not.toBe(t2); // different object references
  });
});

describe('SimulatedClock', () => {
  const BASE_TIME = new Date('2026-01-15T10:00:00+05:30');

  it('returns the initial time', () => {
    const clock = new SimulatedClock(BASE_TIME);
    expect(clock.now().toISOString()).toBe(BASE_TIME.toISOString());
  });

  it('has DEMO mode', () => {
    const clock = new SimulatedClock(BASE_TIME);
    expect(clock.mode).toBe(ClockMode.DEMO);
  });

  it('returns a new Date instance each call (no shared mutable state)', () => {
    const clock = new SimulatedClock(BASE_TIME);
    const t1 = clock.now();
    const t2 = clock.now();
    expect(t1).not.toBe(t2);
    expect(t1.toISOString()).toBe(t2.toISOString());
  });

  it('does not mutate when the original Date is modified', () => {
    const mutableDate = new Date(BASE_TIME);
    const clock = new SimulatedClock(mutableDate);
    mutableDate.setFullYear(2099); // mutate the original
    expect(clock.now().getFullYear()).not.toBe(2099);
  });

  describe('advance()', () => {
    it('advances to a future time', () => {
      const clock = new SimulatedClock(BASE_TIME);
      const future = new Date('2026-01-18T10:00:00+05:30');
      const result = clock.advance(future);

      expect(clock.now().toISOString()).toBe(future.toISOString());
      expect(result.previousTime.toISOString()).toBe(BASE_TIME.toISOString());
      expect(result.newTime.toISOString()).toBe(future.toISOString());
    });

    it('throws when advancing to the same time', () => {
      const clock = new SimulatedClock(BASE_TIME);
      expect(() => clock.advance(new Date(BASE_TIME))).toThrow('cannot move backward');
    });

    it('throws when advancing to a past time', () => {
      const clock = new SimulatedClock(BASE_TIME);
      const past = new Date('2026-01-14T10:00:00+05:30');
      expect(() => clock.advance(past)).toThrow('cannot move backward');
    });

    it('supports multiple sequential advances', () => {
      const clock = new SimulatedClock(BASE_TIME);
      const t1 = new Date('2026-01-16T10:00:00+05:30');
      const t2 = new Date('2026-01-20T10:00:00+05:30');

      clock.advance(t1);
      expect(clock.now().toISOString()).toBe(t1.toISOString());

      clock.advance(t2);
      expect(clock.now().toISOString()).toBe(t2.toISOString());
    });
  });

  describe('advanceByMs()', () => {
    it('advances by a positive duration', () => {
      const clock = new SimulatedClock(BASE_TIME);
      const result = clock.advanceByMs(5000); // 5 seconds
      expect(result.newTime.getTime() - result.previousTime.getTime()).toBe(5000);
    });

    it('throws for zero duration', () => {
      const clock = new SimulatedClock(BASE_TIME);
      expect(() => clock.advanceByMs(0)).toThrow('must be positive');
    });

    it('throws for negative duration', () => {
      const clock = new SimulatedClock(BASE_TIME);
      expect(() => clock.advanceByMs(-1000)).toThrow('must be positive');
    });
  });

  describe('advanceByDays()', () => {
    it('advances by the correct number of days', () => {
      const clock = new SimulatedClock(BASE_TIME);
      const result = clock.advanceByDays(3);
      const diffMs = result.newTime.getTime() - result.previousTime.getTime();
      const diffDays = diffMs / (24 * 60 * 60 * 1000);
      expect(diffDays).toBe(3);
    });
  });

  describe('advanceByHours()', () => {
    it('advances by the correct number of hours', () => {
      const clock = new SimulatedClock(BASE_TIME);
      const result = clock.advanceByHours(12);
      const diffMs = result.newTime.getTime() - result.previousTime.getTime();
      const diffHours = diffMs / (60 * 60 * 1000);
      expect(diffHours).toBe(12);
    });
  });
});
