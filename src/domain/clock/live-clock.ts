import { Clock, ClockMode } from './clock.interface';

/**
 * Live clock — wraps the real system clock.
 * Used in production when real wall-clock time matters.
 */
export class LiveClock implements Clock {
  readonly mode = ClockMode.LIVE;

  now(): Date {
    return new Date();
  }
}
