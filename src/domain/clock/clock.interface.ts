/**
 * Clock interface — the single time abstraction used everywhere in the system.
 *
 * Why an interface instead of just `Date.now()`:
 * Recovery cases play out over days/weeks. You can't demo a 14-day escalation
 * ladder in real time. The Clock interface lets us swap between real wall-clock
 * (LIVE mode) and an advanceable simulated clock (DEMO/EVAL mode) without
 * changing any business logic.
 *
 * Every function that needs "current time" receives a Clock instance via
 * dependency injection — never imports Date.now() or new Date() directly.
 *
 * See ADR 0005 for the full rationale.
 */

export interface Clock {
  /** Returns the current time according to this clock. */
  now(): Date;

  /** The mode this clock is operating in. */
  readonly mode: ClockMode;
}

export const ClockMode = {
  LIVE: 'LIVE',
  DEMO: 'DEMO',
} as const;

export type ClockMode = (typeof ClockMode)[keyof typeof ClockMode];
