// xStocks public API. No key required. Verified live 2026-09-12.
//
// API quirks, measured rather than documented:
//  - `assets` and `assets/{sym}/multiplier/history` are ZERO-indexed.
//    page=1 on history returns an empty list, not an error.
//  - `corporate-actions/upcoming` is ONE-indexed. page=0 returns nothing at all.
//  - pageSize above 100 silently returns zero rows instead of erroring.
const BASE = "https://api.xstocks.fi/api/v2/public";
export const MAX_PAGE_SIZE = 100;

export type Deployment = { address: string; network: string };
export type Asset = {
  id: string;
  name: string;
  symbol: string;            // "AAPLx"
  underlyingSymbol: string;  // "AAPL"
  logo: string | null;
  isTradingHalted: boolean;
  trading?: { tradingHoursMode?: string; currentPeriod?: string; openNow?: boolean };
  deployments: Deployment[];
};

export type MultiplierEvent = {
  id: string;
  reason: string;             // "Dividend" | "Split" | "ReverseSplit" | "Administrative"
  multiplier: number;
  previousMultiplier: number;
  activationDateTime: string; // ISO
};

/**
 * Does this multiplier change put money in the holder's pocket?
 *
 * Only a dividend does. A split raises the multiplier and cuts the share price by the
 * same factor, so the position is worth exactly what it was a second earlier. Counting
 * a split as income is the mistake that makes a tokenized-stock tracker untrustworthy:
 * Netflix split 10:1 on 2025-11-16 and the multiplier went 1.0 to 10.0, which values at
 * roughly $106M of "gains" that nobody received.
 *
 * Measured across all 832 assets on 2026-09-12: 641 Dividend, 8 Split, 3 Administrative,
 * 2 ReverseSplit.
 */
export function isIncome(reason: string): boolean {
  return reason.trim().toLowerCase() === "dividend";
}

/** A split's ratio is real and worth showing, it just is not income. */
export function eventRatio(e: MultiplierEvent): number {
  return e.previousMultiplier > 0 ? e.multiplier / e.previousMultiplier : 1;
}

/** Cumulative multiplier growth from dividends alone, ignoring splits. */
export function dividendFactor(history: MultiplierEvent[]): number {
  return history.reduce((f, e) => (isIncome(e.reason) ? f * eventRatio(e) : f), 1);
}

export type CorporateAction = {
  eventId: string;
  xstockSymbol: string;
  caType: string;             // "CashDividend" | ...
  effectiveTimeUtc: string;
  grossCashflowUsd: string | null;
  netCashflowUsd: string | null;
  withholdingTaxRate: string | null;
  status: string;
};

export type Reserves = {
  symbol: string;
  timestamp: string;
  sharesHeld: string;
  circulatingSupply: string;
  holdings: { provider: string; quantity: string; symbol: string }[];
};

type Paged<T> = { nodes?: T[]; page?: { hasNextPage?: boolean; totalNodes?: number } };

async function get<T>(path: string, revalidate = 300): Promise<T> {
  const res = await fetch(`${BASE}/${path}`, {
    headers: { accept: "application/json" },
    next: { revalidate },
  });
  if (!res.ok) throw new Error(`xStocks ${path} -> ${res.status}`);
  return res.json() as Promise<T>;
}

/** Walk a paged endpoint. `firstPage` is 0 or 1 depending on the endpoint. */
async function collect<T>(make: (page: number) => string, firstPage: number, maxPages = 40): Promise<T[]> {
  const all: T[] = [];
  for (let i = 0; i < maxPages; i++) {
    const r = await get<Paged<T>>(make(firstPage + i));
    const nodes = r.nodes ?? [];
    all.push(...nodes);
    if (!r.page?.hasNextPage || nodes.length === 0) break;
  }
  return all;
}

/** Every xStock with a Solana deployment. 732 assets as of 2026-09-12. */
export function fetchAssets(): Promise<Asset[]> {
  return collect<Asset>((p) => `assets?network=Solana&page=${p}&pageSize=${MAX_PAGE_SIZE}`, 0);
}

export function solanaMint(a: Asset): string | null {
  return a.deployments?.find((x) => /solana/i.test(x.network))?.address ?? null;
}

/** Every multiplier change: the issuer's own record of invisible dividends and splits. */
export async function fetchMultiplierHistory(symbol: string): Promise<MultiplierEvent[]> {
  const all = await collect<MultiplierEvent>(
    (p) => `assets/${encodeURIComponent(symbol)}/multiplier/history?network=Solana&page=${p}&pageSize=${MAX_PAGE_SIZE}`,
    0,
    20
  );
  return all.sort((a, b) => +new Date(a.activationDateTime) - +new Date(b.activationDateTime));
}

/** Scheduled corporate actions across every xStock. 539 pending as of 2026-09-12. */
export function fetchUpcoming(maxPages = 20): Promise<CorporateAction[]> {
  return collect<CorporateAction>(
    (p) => `corporate-actions/upcoming?page=${p}&pageSize=${MAX_PAGE_SIZE}`,
    1,
    maxPages
  );
}

export async function fetchReserves(symbol: string): Promise<Reserves | null> {
  try {
    return await get<Reserves>(`proof-of-reserves/${encodeURIComponent(symbol)}`);
  } catch {
    return null;
  }
}

export async function fetchStatus(symbol: string) {
  try {
    return await get<{ symbol: string; isMarketTradingHalted: boolean; isAtomicTradingHalted: boolean }>(
      `system/status/${encodeURIComponent(symbol)}`
    );
  } catch {
    return null;
  }
}
