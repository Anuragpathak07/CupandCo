const pad = (value: number) => String(value).padStart(2, '0');

export function toDateKey(date: Date | string) {
  const value = typeof date === 'string' ? new Date(date) : date;
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}

export function startOfLocalDay(date = new Date()) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

export function endOfLocalDay(date = new Date()) {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

export function isSameLocalDay(left: Date | string, right: Date | string = new Date()) {
  return toDateKey(left) === toDateKey(right);
}

export function addDays(date: Date, days: number) {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
}

export function startOfWeek(date = new Date()) {
  // Monday-start weeks.
  const value = startOfLocalDay(date);
  value.setDate(value.getDate() - ((value.getDay() + 6) % 7));
  return value;
}

export function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

export function formatTime(date: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(typeof date === 'string' ? new Date(date) : date);
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(
    'en-US',
    options ?? { month: 'short', day: 'numeric', year: 'numeric' },
  ).format(typeof date === 'string' ? new Date(date) : date);
}

export function formatDateTime(date: string | Date) {
  return `${formatDate(date, { month: 'short', day: 'numeric' })} · ${formatTime(date)}`;
}

export function formatDuration(totalSeconds: number) {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return '—';
  if (totalSeconds < 60) return `${Math.round(totalSeconds)} sec`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);
  return seconds ? `${minutes}m ${seconds}s` : `${minutes}m`;
}

export function relativeTime(date: string | Date, now = Date.now()) {
  const value = typeof date === 'string' ? new Date(date).getTime() : date.getTime();
  const seconds = Math.max(0, Math.floor((now - value) / 1000));
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return formatDate(date, { month: 'short', day: 'numeric' });
}
