import {
  fetchAssets, fetchMultiplierHistory, fetchReserves, fetchUpcoming, solanaMint,
  type Asset, type MultiplierEvent, type CorporateAction,
} from "./xstocks";
import {
  fetchHoldings, fetchMint, firstSeen, effectiveMultiplier, naiveMultiplier, pendingChange,
} from "./solana";
import { fetchPrices } from "./price";

export type PaidEvent = {
  date: string;
  reason: string;
  from: number;
  to: number;
  sharesGained: number;
  usdGained: number;
};

export type PositionReport = {
  symbol: string;
  name: string;
  underlying: string;
  logo: string | null;
  mint: string;
  decimals: number;
  rawAmount: string;

  /** What the chain's stale `multiplier` field says. */
  naive: number;
  /** What is actually in force right now. */
  effective: number;

  naiveBalance: number;
  trueBalance: number;
  hiddenShares: number;   // trueBalance - naiveBalance
  hiddenUsd: number;

  priceUsd: number | null;
  valueUsd: number | null;

  heldSince: string | null;
  paid: PaidEvent[];
  totalSharesGained: number;
  totalUsdGained: number;

  pending: { from: number; to: number; activatesAt: string; secondsAway: number } | null;
  upcoming: CorporateAction[];
  reserves: { sharesHeld: number; circulating: number; ratio: number; providers: string[] } | null;
  halted: boolean;
};

export type WalletReport = {
  wallet: string;
  generatedAt: string;
  positions: PositionReport[];
  totals: { valueUsd: number; hiddenUsd: number; dividendUsd: number; dividendCount: number };
  notes: string[];
};

/** Multiplier in force at a given instant, from the issuer's history. */
function multiplierAt(history: MultiplierEvent[], when: Date): number {
  let m = history.length ? history[0].previousMultiplier : 1;
  for (const e of history) {
    if (new Date(e.activationDateTime) <= when) m = e.multiplier;
    else break;
  }
  return m;
}

export async function buildReport(wallet: string): Promise<WalletReport> {
  const notes: string[] = [];

  const [holdings, assets, upcomingAll] = await Promise.all([
    fetchHoldings(wallet),
    fetchAssets(),
    fetchUpcoming().catch(() => [] as CorporateAction[]),
  ]);

  const byMint = new Map<string, Asset>();
  for (const a of assets) {
    const m = solanaMint(a);
    if (m) byMint.set(m, a);
  }

  const mine = holdings.filter((h) => byMint.has(h.mint));
  if (holdings.length && !mine.length) {
    notes.push("Wallet holds Token-2022 assets, but none of them are xStocks.");
  }

  const prices = await fetchPrices(mine.map((h) => h.mint));
  const positions: PositionReport[] = [];

  for (const h of mine) {
    const asset = byMint.get(h.mint)!;
    const [mint, history, reserves, since] = await Promise.all([
      fetchMint(h.mint),
      fetchMultiplierHistory(asset.symbol).catch(() => [] as MultiplierEvent[]),
      fetchReserves(asset.symbol),
      firstSeen(h.tokenAccount).catch(() => null),
    ]);

    const decimals = mint?.decimals ?? h.decimals;
    const units = Number(h.rawAmount) / 10 ** decimals;

    const effective = effectiveMultiplier(mint?.scaled ?? null);
    const naive = naiveMultiplier(mint?.scaled ?? null);
    const pend = pendingChange(mint?.scaled ?? null);

    const price = prices[h.mint]?.usdPrice ?? null;
    const trueBalance = units * effective;
    const naiveBalance = units * naive;
    const hiddenShares = trueBalance - naiveBalance;

    // Dividends and splits that landed while this wallet was holding.
    const startM = since ? multiplierAt(history, since) : history.length ? history[0].previousMultiplier : 1;
    const paid: PaidEvent[] = history
      .filter((e) => (since ? new Date(e.activationDateTime) > since : true))
      .map((e) => {
        const gained = units * (e.multiplier - e.previousMultiplier);
        return {
          date: e.activationDateTime,
          reason: e.reason,
          from: e.previousMultiplier,
          to: e.multiplier,
          sharesGained: gained,
          usdGained: price ? gained * price : 0,
        };
      });

    const totalSharesGained = units * (effective - startM);

    positions.push({
      symbol: asset.symbol,
      name: asset.name,
      underlying: asset.underlyingSymbol,
      logo: asset.logo,
      mint: h.mint,
      decimals,
      rawAmount: h.rawAmount,
      naive,
      effective,
      naiveBalance,
      trueBalance,
      hiddenShares,
      hiddenUsd: price ? hiddenShares * price : 0,
      priceUsd: price,
      valueUsd: price ? trueBalance * price : null,
      heldSince: since ? since.toISOString() : null,
      paid,
      totalSharesGained,
      totalUsdGained: price ? totalSharesGained * price : 0,
      pending: pend
        ? { from: pend.from, to: pend.to, activatesAt: pend.activatesAt.toISOString(), secondsAway: pend.secondsAway }
        : null,
      upcoming: upcomingAll.filter((c) => c.xstockSymbol === asset.symbol).slice(0, 5),
      reserves: reserves
        ? {
            sharesHeld: Number(reserves.sharesHeld),
            circulating: Number(reserves.circulatingSupply),
            ratio: Number(reserves.sharesHeld) / Number(reserves.circulatingSupply),
            providers: reserves.holdings.map((x) => x.provider),
          }
        : null,
      halted: asset.isTradingHalted,
    });
  }

  positions.sort((a, b) => (b.valueUsd ?? 0) - (a.valueUsd ?? 0));

  if (positions.some((p) => p.heldSince === null)) {
    notes.push("Acquisition date unavailable for some positions; their dividend history is shown in full.");
  }
  notes.push("Dividends are credited as share growth, not cash. USD figures value that growth at today's price.");

  return {
    wallet,
    generatedAt: new Date().toISOString(),
    positions,
    totals: {
      valueUsd: positions.reduce((s, p) => s + (p.valueUsd ?? 0), 0),
      hiddenUsd: positions.reduce((s, p) => s + p.hiddenUsd, 0),
      dividendUsd: positions.reduce((s, p) => s + p.totalUsdGained, 0),
      dividendCount: positions.reduce((s, p) => s + p.paid.length, 0),
    },
    notes,
  };
}
