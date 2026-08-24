import { Clock, ClockMode } from './clock.interface';

/**
 * Simulated clock — advanceable time for DEMO and evaluation modes.
 *
 * Why not just mock Date.now():
 * - The simulated clock is a first-class concept, not a test hack
 * - advance() triggers due-date checks between old and new time (see state-transition service)
 * - Every audit row carries both simulated_time and real_wall_clock_time
 * - The same production code path runs in both modes — no "demo-only" branches
 *
 * Usage:
 *   const clock = new SimulatedClock(new Date('2026-01-15T10:00:00+05:30'));
 *   clock.now(); // → 2026-01-15T10:00:00+05:30
 *   clock.advance(new Date('2026-01-18T10:00:00+05:30'));
 *   clock.now(); // → 2026-01-18T10:00:00+05:30
 */
export class SimulatedClock implements Clock {
  readonly mode = ClockMode.DEMO;
  private currentTime: Date;

  constructor(initialTime: Date) {
    this.currentTime = new Date(initialTime.getTime());
  }

  now(): Date {
    return new Date(this.currentTime.getTime());
  }

  /**
   * Advance the clock to a new time.
   *
   * Returns the previous time so callers can determine what interval to process
   * (e.g., run all due-date checks between previousTime and newTime).
   *
   * @throws Error if newTime is not strictly after currentTime — time only moves forward.
   */
  advance(newTime: Date): { previousTime: Date; newTime: Date } {
    if (newTime.getTime() <= this.currentTime.getTime()) {
      throw new Error(
        `SimulatedClock: cannot move backward. ` +
        `Current: ${this.currentTime.toISOString()}, ` +
        `Requested: ${newTime.toISOString()}`
      );
    }
    const previousTime = new Date(this.currentTime.getTime());
    this.currentTime = new Date(newTime.getTime());
    return { previousTime, newTime: this.now() };
  }

  /**
   * Advance the clock by a duration in milliseconds.
   * Convenience method for tests and scripting.
   */
  advanceByMs(ms: number): { previousTime: Date; newTime: Date } {
    if (ms <= 0) {
      throw new Error(`SimulatedClock: duration must be positive, got ${ms}ms`);
    }
    return this.advance(new Date(this.currentTime.getTime() + ms));
  }

  /**
   * Advance by a number of days. Most common use case in the recovery domain.
   */
  advanceByDays(days: number): { previousTime: Date; newTime: Date } {
    return this.advanceByMs(days * 24 * 60 * 60 * 1000);
  }

  /**
   * Advance by a number of hours. Useful for testing quiet-hours transitions.
   */
  advanceByHours(hours: number): { previousTime: Date; newTime: Date } {
    return this.advanceByMs(hours * 60 * 60 * 1000);
  }
}
