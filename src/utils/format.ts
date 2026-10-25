export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function formatDuration(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return s === 0 ? `${m}m` : `${m}m ${s}s`;
}

/** "#RRGGBB" + alpha 0..1 → "rgba(...)". */
export function withAlpha(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/** "6 hours", "45 minutes", "1 day 2 hours". */
export function formatAway(ms: number): string {
  const minutes = Math.round(ms / 60_000);
  const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'}`;
  if (minutes < 60) return plural(Math.max(1, minutes), 'minute');
  const hours = Math.round(minutes / 60);
  if (hours < 24) return plural(hours, 'hour');
  const days = Math.floor(hours / 24);
  const rest = hours % 24;
  return rest ? `${plural(days, 'day')} ${plural(rest, 'hour')}` : plural(days, 'day');
}

/** "2h 14m", "45m", "3d 2h". Rounds to the nearest minute. */
export function formatHm(ms: number): string {
  const total = Math.max(0, Math.round(ms / 60_000));
  const d = Math.floor(total / 1440), h = Math.floor((total % 1440) / 60), m = total % 60;
  if (d > 0) return h ? `${d}d ${h}h` : `${d}d`;
  if (h > 0) return m ? `${h}h ${m}m` : `${h}h`;
  return `${m}m`;
}

/** Countdown like "1h 12m", "4m 05s". */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), s = total % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

export const formatClock = (ts: number) =>
  new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(ts);

export function formatDay(ts: number, now = Date.now()): string {
  const day = (t: number) => new Date(t).setHours(0, 0, 0, 0);
  const diff = Math.round((day(now) - day(ts)) / 86_400_000);
  if (diff <= 0) return `Today, ${formatClock(ts)}`;
  if (diff === 1) return `Yesterday, ${formatClock(ts)}`;
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(ts);
}
