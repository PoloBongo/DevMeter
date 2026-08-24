export function formatHours(hours: number): string {
  return `${hours.toFixed(1).replace(/\.0$/, "")}h`;
}

export function formatDuration(minutes: number): string {
  const totalSeconds = Math.floor(minutes * 60);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m`;
  if (m > 0) return `${m}m ${s.toString().padStart(2, "0")}s`;
  return `${s}s`;
}

export function formatTokens(tokens: number): string {
  return tokens.toLocaleString("en-US");
}

export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * YYYY-MM-DD in the *local* calendar day, for round-tripping with
 * `<input type="date">` — unlike formatDate, this doesn't shift to a
 * different day for users east of UTC when the Date holds local midnight.
 */
export function formatDateLocal(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}
