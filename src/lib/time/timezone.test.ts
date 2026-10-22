import { describe, it, expect } from 'vitest';
import {
  isCapsuleEligibleToOpen,
  calculateCountdown,
  formatDateWithTimezone,
  getOpeningPresets,
  zonedDatetimeToUtc,
} from './timezone';

describe('Timezone & Time-Lock Eligibility', () => {
  it('correctly determines pre-unlock status (not eligible)', () => {
    const futureTime = '2026-12-31T23:59:59.000Z';
    const currentTime = '2026-10-22T12:00:00.000Z';

    const eligible = isCapsuleEligibleToOpen(futureTime, currentTime);
    expect(eligible).toBe(false);
  });

  it('correctly determines post-unlock status (eligible)', () => {
    const pastTime = '2026-01-01T00:00:00.000Z';
    const currentTime = '2026-10-22T12:00:00.000Z';

    const eligible = isCapsuleEligibleToOpen(pastTime, currentTime);
    expect(eligible).toBe(true);
  });

  it('calculates countdown components accurately', () => {
    const referenceNow = '2026-10-22T12:00:00.000Z';
    // 2 days, 3 hours, 15 minutes, 30 seconds into the future
    const target = '2026-10-24T15:15:30.000Z';

    const countdown = calculateCountdown(target, referenceNow);
    expect(countdown.isExpired).toBe(false);
    expect(countdown.days).toBe(2);
    expect(countdown.hours).toBe(3);
    expect(countdown.minutes).toBe(15);
    expect(countdown.seconds).toBe(30);
  });

  it('marks countdown as expired when target time is in the past', () => {
    const referenceNow = '2026-10-22T12:00:00.000Z';
    const pastTarget = '2026-10-20T12:00:00.000Z';

    const countdown = calculateCountdown(pastTarget, referenceNow);
    expect(countdown.isExpired).toBe(true);
    expect(countdown.days).toBe(0);
    expect(countdown.hours).toBe(0);
    expect(countdown.minutes).toBe(0);
    expect(countdown.seconds).toBe(0);
  });

  it('formats dates with target timezone accurately', () => {
    const dateStr = '2026-10-22T19:00:00.000Z';
    const formattedUtc = formatDateWithTimezone(dateStr, 'UTC', false);
    expect(formattedUtc).toContain('2026');
    expect(formattedUtc).toContain('Oct');
    expect(formattedUtc).toContain('22');
  });

  it('generates standard opening presets based on reference date', () => {
    const ref = new Date('2026-01-01T00:00:00.000Z');
    const presets = getOpeningPresets(ref);

    expect(presets.length).toBe(5);
    expect(presets.find((p) => p.id === '1m')?.targetDate.getMonth()).toBe(1); // Feb
    expect(presets.find((p) => p.id === '1y')?.targetDate.getFullYear()).toBe(2027);
    expect(presets.find((p) => p.id === '5y')?.targetDate.getFullYear()).toBe(2031);
  });

  describe('zonedDatetimeToUtc Daylight Saving and Timezone Precision', () => {
    it('accurately parses UTC datetime-local inputs', () => {
      const utc = zonedDatetimeToUtc('2028-06-15T12:30', 'UTC');
      expect(utc).toBe('2028-06-15T12:30:00.000Z');
    });

    it('accurately parses America/New_York during Daylight Saving Time (EDT, UTC-4)', () => {
      // July 1 is in EDT (UTC-4), so 12:00 EDT = 16:00 UTC
      const utc = zonedDatetimeToUtc('2028-07-01T12:00', 'America/New_York');
      expect(utc).toBe('2028-07-01T16:00:00.000Z');
    });

    it('accurately parses America/New_York during Standard Time (EST, UTC-5)', () => {
      // January 15 is in EST (UTC-5), so 12:00 EST = 17:00 UTC
      const utc = zonedDatetimeToUtc('2028-01-15T12:00', 'America/New_York');
      expect(utc).toBe('2028-01-15T17:00:00.000Z');
    });

    it('accurately parses Asia/Tokyo (JST, UTC+9, no DST)', () => {
      // 12:00 JST = 03:00 UTC
      const utc = zonedDatetimeToUtc('2028-07-01T12:00', 'Asia/Tokyo');
      expect(utc).toBe('2028-07-01T03:00:00.000Z');
    });
  });
});
