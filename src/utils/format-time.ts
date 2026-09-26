const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const pad = (value: number) => String(value).padStart(2, '0');

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** 12/02/2026 */
export function formatDate(date: Date): string {
  return `${pad(date.getMonth() + 1)}/${pad(date.getDate())}/${date.getFullYear()}`;
}

/** 5:40 am */
export function formatClockTime(date: Date): string {
  const hours = date.getHours();
  const suffix = hours < 12 ? 'am' : 'pm';
  return `${hours % 12 || 12}:${pad(date.getMinutes())} ${suffix}`;
}

/** 30s ago · 5m ago · 2h ago · 3d ago · 12/02/2026 */
export function formatRelativeTime(date: Date, now: Date = new Date()): string {
  const diff = Math.max(0, now.getTime() - date.getTime());
  if (diff < MINUTE) return `${Math.max(1, Math.floor(diff / 1000))}s ago`;
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)}d ago`;
  return formatDate(date);
}

/** Today · Yesterday · 12/02/2026 */
export function formatDayLabel(date: Date, now: Date = new Date()): string {
  const days = Math.round((startOfDay(now) - startOfDay(date)) / DAY);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return formatDate(date);
}

/** Today, 12:20 · 12/10/2026, 12:20 */
export function formatDateTime(date: Date, now: Date = new Date()): string {
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  const day = formatDayLabel(date, now);
  return `${day === 'Yesterday' ? formatDate(date) : day}, ${time}`;
}

export function isSameDay(a: Date, b: Date): boolean {
  return startOfDay(a) === startOfDay(b);
}
