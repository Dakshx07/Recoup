/**
 * Contact frequency cap — limits how often we can contact a debtor.
 *
 * Why a rolling window instead of a fixed calendar period:
 * A fixed period (e.g., "3 per week starting Monday") creates artificial bursts
 * at period boundaries. A rolling window ensures spacing regardless of when
 * the first message was sent.
 */

import { Clock } from '../clock/clock.interface';
import { MAX_OUTREACH_PER_CASE, OUTREACH_ROLLING_WINDOW_DAYS } from './config';

export interface ContactFrequencyInput {
  /** Timestamps of recent outreach messages for this case */
  recentOutreachTimestamps: Date[];
}

export interface ContactFrequencyResult {
  allowed: boolean;
  currentCount: number;
  maxAllowed: number;
  windowDays: number;
  /** If blocked, when the next outreach slot opens (oldest message exits the window) */
  nextAvailableAt?: Date;
  reason?: string;
}

/**
 * Check if another outreach message is allowed for this case.
 *
 * Rule: max MAX_OUTREACH_PER_CASE messages per case within a rolling
 * OUTREACH_ROLLING_WINDOW_DAYS window.
 */
export function checkContactFrequency(
  input: ContactFrequencyInput,
  clock: Clock,
): ContactFrequencyResult {
  const now = clock.now();
  const windowStart = new Date(now.getTime() - OUTREACH_ROLLING_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  // Count messages within the rolling window
  const messagesInWindow = input.recentOutreachTimestamps.filter(
    (ts) => ts.getTime() >= windowStart.getTime()
  );

  const currentCount = messagesInWindow.length;

  if (currentCount >= MAX_OUTREACH_PER_CASE) {
    // Find when the oldest message in the window will exit (creating a slot)
    const sortedInWindow = [...messagesInWindow].sort((a, b) => a.getTime() - b.getTime());
    const oldestInWindow = sortedInWindow[0];
    const nextAvailableAt = new Date(
      oldestInWindow.getTime() + OUTREACH_ROLLING_WINDOW_DAYS * 24 * 60 * 60 * 1000
    );

    return {
      allowed: false,
      currentCount,
      maxAllowed: MAX_OUTREACH_PER_CASE,
      windowDays: OUTREACH_ROLLING_WINDOW_DAYS,
      nextAvailableAt,
      reason: `Contact frequency cap reached: ${currentCount}/${MAX_OUTREACH_PER_CASE} messages in the last ${OUTREACH_ROLLING_WINDOW_DAYS} days`,
    };
  }

  return {
    allowed: true,
    currentCount,
    maxAllowed: MAX_OUTREACH_PER_CASE,
    windowDays: OUTREACH_ROLLING_WINDOW_DAYS,
  };
}
