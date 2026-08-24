import { describe, it, expect } from 'vitest';
import { checkQuietHours } from '@/domain/policy-engine/quiet-hours';
import { SimulatedClock } from '@/domain/clock/simulated-clock';

describe('checkQuietHours', () => {
  describe('during allowed hours (09:00-21:00 IST)', () => {
    it('allows outreach at 09:00 IST', () => {
      // 09:00 IST = 03:30 UTC
      const clock = new SimulatedClock(new Date('2026-01-15T03:30:00Z'));
      const result = checkQuietHours(clock);
      expect(result.allowed).toBe(true);
    });

    it('allows outreach at 12:00 IST', () => {
      const clock = new SimulatedClock(new Date('2026-01-15T06:30:00Z'));
      const result = checkQuietHours(clock);
      expect(result.allowed).toBe(true);
    });

    it('allows outreach at 20:59 IST', () => {
      // 20:59 IST = 15:29 UTC
      const clock = new SimulatedClock(new Date('2026-01-15T15:29:00Z'));
      const result = checkQuietHours(clock);
      expect(result.allowed).toBe(true);
    });
  });

  describe('during quiet hours (21:00-09:00 IST)', () => {
    it('blocks outreach at 21:00 IST', () => {
      // 21:00 IST = 15:30 UTC
      const clock = new SimulatedClock(new Date('2026-01-15T15:30:00Z'));
      const result = checkQuietHours(clock);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Quiet hours');
    });

    it('blocks outreach at 23:00 IST', () => {
      const clock = new SimulatedClock(new Date('2026-01-15T17:30:00Z'));
      const result = checkQuietHours(clock);
      expect(result.allowed).toBe(false);
    });

    it('blocks outreach at 00:00 IST (midnight)', () => {
      // 00:00 IST = 18:30 UTC (previous day)
      const clock = new SimulatedClock(new Date('2026-01-15T18:30:00Z'));
      const result = checkQuietHours(clock);
      expect(result.allowed).toBe(false);
    });

    it('blocks outreach at 03:00 IST', () => {
      // 03:00 IST = 21:30 UTC (previous day)
      const clock = new SimulatedClock(new Date('2026-01-14T21:30:00Z'));
      const result = checkQuietHours(clock);
      expect(result.allowed).toBe(false);
    });

    it('blocks outreach at 08:59 IST', () => {
      // 08:59 IST = 03:29 UTC
      const clock = new SimulatedClock(new Date('2026-01-15T03:29:00Z'));
      const result = checkQuietHours(clock);
      expect(result.allowed).toBe(false);
    });

    it('provides a next-allowed time when blocked', () => {
      const clock = new SimulatedClock(new Date('2026-01-15T15:30:00Z')); // 21:00 IST
      const result = checkQuietHours(clock);
      expect(result.allowed).toBe(false);
      expect(result.nextAllowedTime).toBeDefined();
      // Next allowed should be tomorrow at 09:00 IST
      if (result.nextAllowedTime) {
        // 09:00 IST on Jan 16 = 03:30 UTC Jan 16
        expect(result.nextAllowedTime.getUTCHours()).toBe(3);
        expect(result.nextAllowedTime.getUTCMinutes()).toBe(30);
      }
    });
  });
});
