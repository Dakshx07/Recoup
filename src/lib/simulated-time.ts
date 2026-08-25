/**
 * Canonical Simulated Time Utility
 *
 * Requirements:
 * 1. ONE canonical simulated business clock exists for each scope.
 * 2. Every business-relative timestamp calculates strictly against that exact simulated clock.
 * 3. The displayed simulated clock and relative-time calculations NEVER disagree.
 * 4. Real wall-clock UTC timestamps remain separate and are used solely for immutable audit metadata.
 */

import { formatDistance, format } from 'date-fns';

/**
 * Format a simulated timestamp as a relative time string ("2 minutes ago", "2 days ago", "just now")
 * using the provided simulatedNow as the exact baseline.
 */
export function formatSimulatedTimeAgo(
  dateInput: string | Date,
  simulatedNow: Date | string
): string {
  const target = new Date(dateInput);
  const now = new Date(simulatedNow);
  if (isNaN(target.getTime()) || isNaN(now.getTime())) return '—';

  const diffMs = target.getTime() - now.getTime();
  const diffSecs = Math.round(diffMs / 1000);
  const diffMins = Math.round(diffMs / (1000 * 60));

  // Within 45 seconds of simulated baseline -> "just now"
  if (Math.abs(diffSecs) <= 45) {
    return 'just now';
  }

  // Same-day relative minutes
  if (diffMins < 0 && diffMins > -60) {
    const mins = Math.abs(diffMins);
    return `${mins} minute${mins > 1 ? 's' : ''} ago`;
  }
  if (diffMins > 0 && diffMins < 60) {
    return `in ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
  }

  // Same-day hours
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  if (diffHours < 0 && diffHours > -24 && target.getDate() === now.getDate()) {
    const hrs = Math.abs(diffHours);
    return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
  }

  return formatDistance(target, now, { addSuffix: true });
}

/**
 * Format a promise / invoice due date with relative context against the simulated baseline.
 * e.g. "due in 5 days", "due today", "2 days overdue"
 */
export function formatSimulatedDueContext(
  dueDateInput: string | Date,
  simulatedNow: Date | string
): string {
  const target = new Date(dueDateInput);
  const now = new Date(simulatedNow);
  if (isNaN(target.getTime()) || isNaN(now.getTime())) return '';

  const targetDateOnly = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysDiff = Math.round((targetDateOnly.getTime() - nowDateOnly.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff === 0) {
    return 'due today';
  } else if (daysDiff > 0) {
    return `due in ${daysDiff} day${daysDiff > 1 ? 's' : ''}`;
  } else {
    return `${Math.abs(daysDiff)} day${Math.abs(daysDiff) > 1 ? 's' : ''} overdue`;
  }
}

/**
 * Format a simulated timestamp as a human-readable absolute string.
 * Uses short format for operational scanning: "Jan 5, 11:21 AM" or "Jan 5, 2026 · 11:21 AM"
 */
export function formatSimulatedTime(dateInput: string | Date, includeYear = false): string {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '—';
  if (includeYear) {
    return format(date, 'MMM d, yyyy · h:mm a');
  }
  return format(date, 'MMM d, h:mm a');
}

/**
 * Format a simulated date (no time) for display.
 * Uses: "Jan 10, 2026" or "Sat, Jan 3"
 */
export function formatSimulatedDate(dateInput: string | Date, includeYear = true): string {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '—';
  if (includeYear) {
    return format(date, 'MMM d, yyyy');
  }
  return format(date, 'EEE, MMM d');
}
