/**
 * Simulated Time Utility
 *
 * Provides simulated-clock-aware time functions for the UI.
 *
 * The current "simulated now" is derived from the most recent
 * `simulated_time` in `audit_events` — no schema changes needed.
 *
 * This solves the "8 months ago" bug where formatDistanceToNow()
 * compares against real wall-clock Date.now() instead of the
 * simulated business time.
 */

import { formatDistance } from 'date-fns';

/**
 * Format a simulated timestamp as a relative time string ("2 days ago")
 * using the simulated clock as "now", NOT the real wall clock.
 */
export function formatSimulatedTimeAgo(
  dateInput: string | Date,
  simulatedNow: Date | string
): string {
  const date = new Date(dateInput);
  const now = new Date(simulatedNow);
  if (isNaN(date.getTime()) || isNaN(now.getTime())) return 'Unknown';
  return formatDistance(date, now, { addSuffix: true });
}

/**
 * Format a simulated timestamp as a human-readable absolute string.
 * Uses short format for operational scanning: "Jan 6, 3:26 PM"
 */
export function formatSimulatedTime(dateInput: string | Date): string {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format a simulated date (no time) for display.
 * Uses: "Fri 28 Aug" format per UI spec §5.2.
 */
export function formatSimulatedDate(dateInput: string | Date): string {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}
