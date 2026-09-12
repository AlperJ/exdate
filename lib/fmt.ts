export const usd = (n: number, d = 2) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: d });

export const num = (n: number, d = 6) =>
  n.toLocaleString("en-US", { maximumFractionDigits: d });

export const pct = (n: number, d = 2) => `${n >= 0 ? "" : "-"}${Math.abs(n).toFixed(d)}%`;

/** Always UTC: corporate action dates are the issuer's record, not the viewer's calendar. */
export const day = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
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
