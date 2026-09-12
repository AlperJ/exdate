export const usd = (n: number, d = 2) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: d });

export const num = (n: number, d = 6) =>
  n.toLocaleString("en-US", { maximumFractionDigits: d });

export const pct = (n: number, d = 2) => `${n < 0 ? "−" : ""}${Math.abs(n).toFixed(d)}%`;

/** Signed, with a real minus sign rather than a hyphen. */
export const signed = (n: number, d = 6) =>
  `${n < 0 ? "−" : "+"}${Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: d })}`;

/**
 * Always UTC. Corporate action dates are the issuer's record, not the viewer's
 * calendar: a payout activating at 23:55Z would otherwise read as the next day.
 */
export const day = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

export const dayShort = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", timeZone: "UTC" });

export const time = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });

export const short = (a: string) => `${a.slice(0, 4)}…${a.slice(-4)}`;

export function until(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
