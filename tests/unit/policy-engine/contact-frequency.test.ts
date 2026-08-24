import { describe, it, expect } from 'vitest';
import { checkContactFrequency } from '@/domain/policy-engine/contact-frequency';
import { SimulatedClock } from '@/domain/clock/simulated-clock';
import { MAX_OUTREACH_PER_CASE, OUTREACH_ROLLING_WINDOW_DAYS } from '@/domain/policy-engine/config';

const BASE_TIME = new Date('2026-01-15T10:00:00+05:30');

function makeClock(time: Date = BASE_TIME) {
  return new SimulatedClock(time);
}

describe('checkContactFrequency', () => {
  it('allows outreach when no previous messages exist', () => {
    const result = checkContactFrequency(
      { recentOutreachTimestamps: [] },
      makeClock()
    );
    expect(result.allowed).toBe(true);
    expect(result.currentCount).toBe(0);
  });

  it('allows outreach when below the cap', () => {
    const timestamps = [
      new Date('2026-01-14T10:00:00+05:30'),
      new Date('2026-01-13T10:00:00+05:30'),
    ];
    const result = checkContactFrequency(
      { recentOutreachTimestamps: timestamps },
      makeClock()
    );
    expect(result.allowed).toBe(true);
    expect(result.currentCount).toBe(2);
  });

  it('blocks outreach when at the cap', () => {
    const timestamps = [
      new Date('2026-01-14T10:00:00+05:30'),
      new Date('2026-01-13T10:00:00+05:30'),
      new Date('2026-01-12T10:00:00+05:30'),
    ];
    const result = checkContactFrequency(
      { recentOutreachTimestamps: timestamps },
      makeClock()
    );
    expect(result.allowed).toBe(false);
    expect(result.currentCount).toBe(MAX_OUTREACH_PER_CASE);
    expect(result.reason).toContain('cap reached');
  });

  it('allows outreach when old messages fall outside the rolling window', () => {
    const timestamps = [
      new Date('2026-01-05T10:00:00+05:30'), // 10 days ago — outside 7-day window
      new Date('2026-01-06T10:00:00+05:30'), // 9 days ago — outside
      new Date('2026-01-07T10:00:00+05:30'), // 8 days ago — outside
    ];
    const result = checkContactFrequency(
      { recentOutreachTimestamps: timestamps },
      makeClock()
    );
    expect(result.allowed).toBe(true);
    expect(result.currentCount).toBe(0); // all outside the window
  });

  it('correctly mixes in-window and out-of-window messages', () => {
    const timestamps = [
      new Date('2026-01-05T10:00:00+05:30'), // outside window
      new Date('2026-01-14T10:00:00+05:30'), // inside window
      new Date('2026-01-13T10:00:00+05:30'), // inside window
    ];
    const result = checkContactFrequency(
      { recentOutreachTimestamps: timestamps },
      makeClock()
    );
    expect(result.allowed).toBe(true);
    expect(result.currentCount).toBe(2);
  });

  it('provides next-available time when blocked', () => {
    const timestamps = [
      new Date('2026-01-12T10:00:00+05:30'),
      new Date('2026-01-13T10:00:00+05:30'),
      new Date('2026-01-14T10:00:00+05:30'),
    ];
    const result = checkContactFrequency(
      { recentOutreachTimestamps: timestamps },
      makeClock()
    );
    expect(result.allowed).toBe(false);
    expect(result.nextAvailableAt).toBeDefined();
    if (result.nextAvailableAt) {
      // Oldest in window (Jan 12) + 7 days = Jan 19
      expect(result.nextAvailableAt.getDate()).toBe(19);
    }
  });
});
