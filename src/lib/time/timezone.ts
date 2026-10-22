/**
 * Timezone and Date Utilities for FutureMe Vault
 * All capsule time comparisons are strictly evaluated in UTC.
 */

export interface CountdownResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  totalSeconds: number;
}

/**
 * Validates if the capsule opening timestamp has arrived in UTC.
 * @param scheduledOpeningAtIso - ISO timestamp string of scheduled unlock
 * @param referenceNow - Optional reference time for deterministic testing without altering system clocks
 */
export function isCapsuleEligibleToOpen(
  scheduledOpeningAtIso: string,
  referenceNow?: Date | string
): boolean {
  if (!scheduledOpeningAtIso) return false;
  const targetTime = new Date(scheduledOpeningAtIso).getTime();
  if (isNaN(targetTime)) return false;

  const nowTime = referenceNow ? new Date(referenceNow).getTime() : Date.now();
  return nowTime >= targetTime;
}

/**
 * Calculates remaining countdown values down to seconds.
 */
export function calculateCountdown(
  scheduledOpeningAtIso: string,
  referenceNow?: Date | string
): CountdownResult {
  const targetTime = new Date(scheduledOpeningAtIso).getTime();
  const nowTime = referenceNow ? new Date(referenceNow).getTime() : Date.now();

  if (isNaN(targetTime)) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false, totalSeconds: 0 };
  }

  const diffMs = targetTime - nowTime;

  if (diffMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true, totalSeconds: 0 };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    days,
    hours,
    minutes,
    seconds,
    isExpired: false,
    totalSeconds,
  };
}

/**
 * Converts a local datetime-local string (YYYY-MM-DDTHH:mm) into an exact UTC ISO 8601 string,
 * taking into account the specified IANA timezone and daylight saving time rules.
 */
export function zonedDatetimeToUtc(
  dateTimeStr: string,
  timeZone: string = 'UTC'
): string {
  if (!dateTimeStr) throw new Error('Datetime string is required');

  // If already in ISO format with Z or offset, parse directly
  if (dateTimeStr.includes('Z') || /[+-]\d{2}:\d{2}$/.test(dateTimeStr)) {
    const d = new Date(dateTimeStr);
    if (isNaN(d.getTime())) throw new Error('Invalid ISO datetime string');
    return d.toISOString();
  }

  // Parse YYYY-MM-DDTHH:mm[:ss]
  const [datePart, timePart] = dateTimeStr.split('T');
  if (!datePart || !timePart) throw new Error('Invalid datetime-local format. Expected YYYY-MM-DDTHH:mm');

  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute, second = 0] = timePart.split(':').map(Number);

  if (!year || !month || !day || isNaN(hour) || isNaN(minute)) {
    throw new Error('Invalid numeric components in datetime-local string');
  }

  // If timezone is UTC, construct directly
  if (timeZone === 'UTC' || !timeZone) {
    return new Date(Date.UTC(year, month - 1, day, hour, minute, second)).toISOString();
  }

  // For arbitrary IANA timezone:
  // Step 1: Initial UTC guess
  const initialUtc = Date.UTC(year, month - 1, day, hour, minute, second);

  // Step 2: Determine timezone offset at that target date using Intl
  // Format the guess in target timezone and measure the difference
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(new Date(initialUtc));
  const getPart = (type: string) => Number(parts.find((p) => p.type === type)?.value || 0);

  const formattedYear = getPart('year');
  const formattedMonth = getPart('month');
  const formattedDay = getPart('day');
  let formattedHour = getPart('hour');
  if (formattedHour === 24) formattedHour = 0;
  const formattedMinute = getPart('minute');
  const formattedSecond = getPart('second');

  const formattedUtc = Date.UTC(
    formattedYear,
    formattedMonth - 1,
    formattedDay,
    formattedHour,
    formattedMinute,
    formattedSecond
  );

  // Difference in milliseconds between guess and target local representation
  const offsetMs = formattedUtc - initialUtc;

  // The true UTC timestamp is initialUtc minus offset
  const trueUtcMs = initialUtc - offsetMs;
  return new Date(trueUtcMs).toISOString();
}

/**
 * Formats an ISO date string in a specified timezone.
 */
export function formatDateWithTimezone(
  isoString: string,
  timeZone: string = 'UTC',
  includeTime: boolean = true
): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'Invalid date';

    const options: Intl.DateTimeFormatOptions = {
      timeZone: timeZone || 'UTC',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...(includeTime
        ? {
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short',
          }
        : {}),
    };

    return new Intl.DateTimeFormat('en-US', options).format(date);
  } catch {
    return new Date(isoString).toUTCString();
  }
}

/**
 * Predefined list of standard major timezones for the user selector.
 */
export const SUPPORTED_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Rome',
  'Europe/Madrid',
  'Africa/Cairo',
  'Africa/Johannesburg',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Bangkok',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Australia/Sydney',
  'Pacific/Auckland',
  'Pacific/Honolulu',
];

/**
 * Popular presets for capsule opening horizons.
 */
export function getOpeningPresets(referenceDate: Date = new Date()) {
  const addMonths = (d: Date, m: number) => {
    const copy = new Date(d.getTime());
    copy.setMonth(copy.getMonth() + m);
    return copy;
  };
  const addYears = (d: Date, y: number) => {
    const copy = new Date(d.getTime());
    copy.setFullYear(copy.getFullYear() + y);
    return copy;
  };

  return [
    {
      id: '1m',
      label: '1 Month',
      description: 'A quick check-in with your immediate near-term intentions.',
      targetDate: addMonths(referenceDate, 1),
    },
    {
      id: '6m',
      label: '6 Months',
      description: 'Mid-year milestone to reflect on evolving habits and goals.',
      targetDate: addMonths(referenceDate, 6),
    },
    {
      id: '1y',
      label: '1 Year',
      description: 'Annual anniversary letter. How much can one single year change you?',
      targetDate: addYears(referenceDate, 1),
    },
    {
      id: '3y',
      label: '3 Years',
      description: 'A chapter transition—career shifts, personal maturity, new horizons.',
      targetDate: addYears(referenceDate, 3),
    },
    {
      id: '5y',
      label: '5 Years',
      description: 'The classic time capsule. Speak to a future version of you.',
      targetDate: addYears(referenceDate, 5),
    },
  ];
}
