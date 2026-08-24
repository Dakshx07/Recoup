/**
 * Quiet hours rule — determines whether outreach is allowed at the current time.
 *
 * Why a hard block instead of "preferred hours":
 * Contact-timing regulations exist in many jurisdictions. While these specific
 * thresholds (21:00–09:00 IST) are working defaults and not legally certified,
 * the mechanism itself — a hard, auditable block rather than a soft preference —
 * is the production-grade pattern.
 */

import { Clock } from '../clock/clock.interface';
import { QUIET_HOURS_START, QUIET_HOURS_END, QUIET_HOURS_TIMEZONE } from './config';

export interface QuietHoursResult {
  allowed: boolean;
  /** If blocked, when outreach will next be allowed */
  nextAllowedTime?: Date;
  reason?: string;
}

/**
 * Check if outreach is allowed at the current time.
 *
 * Quiet hours: QUIET_HOURS_START (21:00) to QUIET_HOURS_END (09:00) IST.
 * During this window, no outreach may be sent.
 */
export function checkQuietHours(clock: Clock): QuietHoursResult {
  const now = clock.now();

  // Get the current hour in IST
  const istHour = getHourInTimezone(now, QUIET_HOURS_TIMEZONE);

  // Quiet hours span midnight: 21:00 → 09:00
  // Blocked if hour >= 21 OR hour < 9
  const isQuietHour = istHour >= QUIET_HOURS_START || istHour < QUIET_HOURS_END;

  if (isQuietHour) {
    const nextAllowed = computeNextAllowedTime(now, QUIET_HOURS_TIMEZONE);
    return {
      allowed: false,
      nextAllowedTime: nextAllowed,
      reason: `Quiet hours: outreach blocked between ${QUIET_HOURS_START}:00 and ${QUIET_HOURS_END}:00 ${QUIET_HOURS_TIMEZONE}`,
    };
  }

  return { allowed: true };
}

/**
 * Get the hour component (0-23) of a date in a specific timezone.
 */
function getHourInTimezone(date: Date, timezone: string): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const hourPart = parts.find((p) => p.type === 'hour');
  // Intl returns "24" for midnight in hour12:false — normalize to 0
  const hour = parseInt(hourPart?.value ?? '0', 10);
  return hour === 24 ? 0 : hour;
}

/**
 * Compute when outreach will next be allowed (next QUIET_HOURS_END in the target timezone).
 */
function computeNextAllowedTime(now: Date, timezone: string): Date {
  // Get the current date components in IST
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const year = parseInt(parts.find((p) => p.type === 'year')?.value ?? '0', 10);
  const month = parseInt(parts.find((p) => p.type === 'month')?.value ?? '0', 10);
  const day = parseInt(parts.find((p) => p.type === 'day')?.value ?? '0', 10);
  let hour = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10);
  if (hour === 24) hour = 0;

  // If it's before midnight (hour >= 21), next allowed is tomorrow at QUIET_HOURS_END
  // If it's after midnight (hour < 9), next allowed is today at QUIET_HOURS_END
  let targetDay = day;
  if (hour >= QUIET_HOURS_START) {
    targetDay = day + 1;
  }

  // Construct the target time in IST
  // IST is UTC+5:30, so QUIET_HOURS_END (09:00 IST) = 03:30 UTC
  const targetDate = new Date(
    `${year}-${String(month).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}T${String(QUIET_HOURS_END).padStart(2, '0')}:00:00+05:30`
  );

  return targetDate;
}
