import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {formatFullDate, formatShortDate} from './date';

const local = (month: number, day: number, hour = 12, minute = 0) => new Date(2026, month - 1, day, hour, minute).getTime();

describe('formatFullDate', () => {
  it('writes the month short, the day and the year', () => {
    expect(formatFullDate(local(10, 6))).toBe('Oct 6, 2026');
  });

  it('does not pad the day', () => {
    expect(formatFullDate(local(1, 3))).toBe('Jan 3, 2026');
  });
});

describe('formatShortDate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(local(10, 20));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('says now for the last minute', () => {
    expect(formatShortDate(local(10, 20) - 30_000)).toBe('now');
  });

  it('counts minutes up to an hour', () => {
    expect(formatShortDate(local(10, 20) - 5 * 60_000)).toBe('5m');
    expect(formatShortDate(local(10, 20) - 59 * 60_000)).toBe('59m');
  });

  it('counts hours up to a day', () => {
    expect(formatShortDate(local(10, 20) - 4 * 3_600_000)).toBe('4h');
  });

  it('says yesterday for one day and counts days up to a week', () => {
    expect(formatShortDate(local(10, 19))).toBe('yesterday');
    expect(formatShortDate(local(10, 17))).toBe('3d');
  });

  it('writes the month and the day from a week on', () => {
    expect(formatShortDate(local(10, 10))).toBe('Oct 10');
  });
});
