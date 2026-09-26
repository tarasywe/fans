import {
  formatClockTime,
  formatDate,
  formatDateTime,
  formatDayLabel,
  formatRelativeTime,
} from '../format-time';

const now = new Date(2026, 8, 25, 12, 0, 0);
const ago = (ms: number) => new Date(now.getTime() - ms);

describe('format-time', () => {
  it('formats relative times', () => {
    expect(formatRelativeTime(ago(30_000), now)).toBe('30s ago');
    expect(formatRelativeTime(ago(0), now)).toBe('1s ago');
    expect(formatRelativeTime(ago(5 * 60_000), now)).toBe('5m ago');
    expect(formatRelativeTime(ago(2 * 3_600_000), now)).toBe('2h ago');
    expect(formatRelativeTime(ago(3 * 86_400_000), now)).toBe('3d ago');
    expect(formatRelativeTime(ago(10 * 86_400_000), now)).toBe('09/15/2026');
  });

  it('never returns negative values for future dates', () => {
    expect(formatRelativeTime(new Date(now.getTime() + 60_000), now)).toBe('1s ago');
  });

  it('formats clock time in 12h format', () => {
    expect(formatClockTime(new Date(2026, 0, 1, 5, 40))).toBe('5:40 am');
    expect(formatClockTime(new Date(2026, 0, 1, 0, 5))).toBe('12:05 am');
    expect(formatClockTime(new Date(2026, 0, 1, 12, 0))).toBe('12:00 pm');
    expect(formatClockTime(new Date(2026, 0, 1, 23, 59))).toBe('11:59 pm');
  });

  it('labels days', () => {
    expect(formatDayLabel(new Date(2026, 8, 25, 1), now)).toBe('Today');
    expect(formatDayLabel(new Date(2026, 8, 24, 23), now)).toBe('Yesterday');
    expect(formatDayLabel(new Date(2026, 1, 12), now)).toBe('02/12/2026');
  });

  it('formats date + time', () => {
    expect(formatDate(new Date(2026, 11, 10))).toBe('12/10/2026');
    expect(formatDateTime(new Date(2026, 8, 25, 12, 20), now)).toBe('Today, 12:20');
    expect(formatDateTime(new Date(2026, 8, 24, 9, 5), now)).toBe('09/24/2026, 09:05');
  });
});
