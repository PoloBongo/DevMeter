export function formatHours(hours: number): string {
  return `${hours.toFixed(1).replace(/\.0$/, "")}h`;
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h > 0 ? `${h}h ${m.toString().padStart(2, "0")}m` : `${m}m`;
}

export function formatUsd(value: number): string {
  return `$${value.toFixed(2)}`;
}

export function formatTokens(tokens: number): string {
  return tokens.toLocaleString("en-US");
}

export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
