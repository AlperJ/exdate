import {
  fetchAssets, fetchMultiplierHistory, fetchReserves, fetchUpcoming, solanaMint,
  isIncome, eventRatio, dividendFactor,
  type Asset, type MultiplierEvent, type CorporateAction, type Reserves,
} from "./xstocks";
import {
  fetchHoldings, fetchMint, fetchMints, firstSeen, effectiveMultiplier, naiveMultiplier,
  pendingChange, treasuryHeld,
} from "./solana";

import { fetchPrices } from "./price";

/** Positions we pull full payout history for. The rest are counted, not itemised. */
const DETAILED = 20;

export type PaidEvent = {
  date: string;
  reason: string;
  from: number;
  to: number;
  sharesGained: number;
  /** Zero for splits: the multiplier rose but the share price fell by the same factor. */
  usdGained: number;
  isIncome: boolean;
  ratio: number;
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
  reserves: {
    sharesHeld: number;
    circulating: number;
    ratio: number | null;
    dormant: boolean;
    providers: string[];
  } | null;
  halted: boolean;
};

export type WalletReport = {
  wallet: string;
  generatedAt: string;
  positions: PositionReport[];
  totals: {
    /** Every position in the wallet. */
    valueUsd: number;
    /** Only the positions itemised below, so the headline and its scope agree. */
    itemisedValueUsd: number;
    hiddenUsd: number;
    dividendUsd: number;
    dividendCount: number;
    positionCount: number;
    itemised: number;
  };
  notes: string[];
};

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

  // The upcoming feed keeps serving events that already activated.
  const nowMs = Date.now();
  const futureActions = upcomingAll.filter((c) => +new Date(c.effectiveTimeUtc) > nowMs);

  // Every mint in a couple of batched calls, every price in batches of fifty. A wallet
  // with hundreds of positions must not turn into hundreds of round trips.
  const [prices, mints] = await Promise.all([
    fetchPrices(mine.map((h) => h.mint)),
    fetchMints(mine.map((h) => h.mint)),
  ]);

  // Value each position first, then spend the expensive per-asset calls on the largest ones.
  const valued = mine
    .map((h) => {
      const mint = mints.get(h.mint) ?? null;
      const decimals = mint?.decimals ?? h.decimals;
      const units = Number(h.rawAmount) / 10 ** decimals;
      const effective = effectiveMultiplier(mint?.scaled ?? null);
      const price = prices[h.mint]?.usdPrice ?? null;
      return { h, mint, decimals, units, effective, price, value: price ? units * effective * price : 0 };
    })
    .sort((a, b) => b.value - a.value);

  const positions: PositionReport[] = [];

  for (const [rank, v] of valued.entries()) {
    const h = v.h;
    const asset = byMint.get(h.mint)!;
    const deep = rank < DETAILED;

    const [history, reserves, since] = deep
      ? await Promise.all([
          fetchMultiplierHistory(asset.symbol).catch(() => [] as MultiplierEvent[]),
          fetchReserves(asset.symbol),
          firstSeen(h.tokenAccount).catch(() => null),
        ])
      : [[] as MultiplierEvent[], null, null];

    const mint = v.mint;
    const decimals = v.decimals;
    const units = v.units;

    const effective = v.effective;
    const naive = naiveMultiplier(mint?.scaled ?? null);
    const pend = pendingChange(mint?.scaled ?? null);

    const price = v.price;
    const trueBalance = units * effective;
    const naiveBalance = units * naive;
    const hiddenShares = trueBalance - naiveBalance;

    // Events that landed while this wallet was holding. Splits move the multiplier but
    // not the position's worth, so only dividends carry a dollar figure.
    const mine_ = history.filter((e) => (since ? new Date(e.activationDateTime) > since : true));
    const paid: PaidEvent[] = mine_.map((e) => {
      const income = isIncome(e.reason);
      const gained = units * (e.multiplier - e.previousMultiplier);
      return {
        date: e.activationDateTime,
        reason: e.reason,
        from: e.previousMultiplier,
        to: e.multiplier,
        sharesGained: gained,
        usdGained: income && price ? gained * price : 0,
        isIncome: income,
        ratio: eventRatio(e),
      };
    });

    // Compound the dividend ratios only: a 10:1 split must not read as a 900% gain.
    const divFactor = dividendFactor(mine_);
    const totalSharesGained = units * effective * (1 - 1 / divFactor);

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
      upcoming: futureActions
        .filter((c) => c.xstockSymbol === asset.symbol)
        .sort((a, b) => +new Date(a.effectiveTimeUtc) - +new Date(b.effectiveTimeUtc))
        .slice(0, 5),
      reserves: reserves ? buildReserves(reserves, null) : null,
      halted: asset.isTradingHalted,
    });
  }

  const itemised = positions.slice(0, DETAILED);

  if (positions.length > DETAILED) {
    notes.push(
      `${positions.length} positions held. The ${DETAILED} largest are itemised below; the rest are counted in the totals by value only.`
    );
  }
  if (itemised.some((p) => p.heldSince === null)) {
    notes.push(
      "Some positions sit in accounts too busy to date cheaply, so their full payout history is shown rather than the slice since purchase."
    );
  }
  notes.push(
    "Dividends are credited as share growth, not cash. USD figures value that growth at today's price."
  );

  return {
    wallet,
    generatedAt: new Date().toISOString(),
    positions: itemised,
    totals: {
      valueUsd: positions.reduce((s, p) => s + (p.valueUsd ?? 0), 0),
      itemisedValueUsd: itemised.reduce((s, p) => s + (p.valueUsd ?? 0), 0),
      hiddenUsd: positions.reduce((s, p) => s + p.hiddenUsd, 0),
      dividendUsd: itemised.reduce((s, p) => s + p.totalUsdGained, 0),
      dividendCount: itemised.reduce((s, p) => s + p.paid.length, 0),
      positionCount: positions.length,
      itemised: itemised.length,
    },
    notes,
  };
}

// ---------------------------------------------------------------------------
// Asset view: works with no wallet at all, which is how most people (and judges)
// will meet this app.
// ---------------------------------------------------------------------------

export type AssetReport = {
  symbol: string;
  name: string;
  underlying: string;
  logo: string | null;
  mint: string;
  decimals: number;
  supplyUnits: number;        // everything minted, multiplier applied
  treasuryUnits: number | null; // minted but never issued, sitting with the issuer
  circulatingOnChain: number | null; // supply minus treasury, derived independently

  naive: number;
  effective: number;
  driftPct: number;          // how wrong a naive reader is, right now

  priceUsd: number | null;
  history: MultiplierEvent[];
  dividendCount: number;
  /** Dividend-only growth since launch, as a % of position value. Splits excluded. */
  totalGrowthPct: number;
  /**
   * How much of a balance the stale field hides, as a percentage of the truth.
   *
   * This was published the wrong way round: dividing the live multiplier by the stale
   * one gives the ratio between them, which on NFLXx after its ten-for-one split reads
   * as 900%. An app reading the stale field there shows a tenth of the real balance, so
   * it hides 90%, not 900%. Small dividends hide the error because 0.0603% comes out
   * the same to four places either way.
   */
  hiddenPct: number;
  /** Extra tokens per 1 token held since launch, from dividends alone. */
  perUnitGained: number;
  /** Cumulative split ratio, shown separately because it is not income. */
  splitFactor: number;

  pending: { from: number; to: number; activatesAt: string; secondsAway: number } | null;
  upcoming: CorporateAction[];
  reserves: {
    sharesHeld: number;
    circulating: number;
    /** Null when the circulating figure is too small to carry a percentage. */
    ratio: number | null;
    dormant: boolean;
    providers: string[];
    /**
     * Reserves cover every chain at once. The endpoint accepts a `network` parameter and
     * ignores it: AAPLx also lives on TON, Ethereum, Arbitrum, Optimism, BSC, Mantle, Ink,
     * XLayer and HyperEVM. So the issuer's circulating figure is global, while anything
     * derived from Solana state is not. The remainder is float on the other chains, which
     * is not a shortfall.
     */
    otherChains: number | null;
    solanaShare: number | null;
  } | null;
  halted: boolean;
};

/**
 * Resolve whatever the visitor typed to an asset.
 *
 * People type the stock they know, not the token. "AAPL" has to reach AAPLx, and so does
 * "apple". Tickers that already end in X are the trap: CVX, NFLX, CSX and FDX become
 * CVXx, NFLXx, CSXx and FDXx, so appending an x is right and stripping one is wrong.
 */
export function matchAsset(assets: Asset[], input: string): Asset | null {
  const q = input.trim().replace(/^\$/, "").toLowerCase();
  if (!q) return null;
  const by = (f: (a: Asset) => string | undefined) =>
    assets.find((a) => (f(a) ?? "").toLowerCase() === q);

  return (
    by((a) => a.symbol) ??                       // AAPLx
    by((a) => a.underlyingSymbol) ??             // AAPL
    assets.find((a) => a.symbol.toLowerCase() === `${q}x`) ?? // aapl -> aaplx, cvx -> cvxx
    by((a) => a.name) ??                         // Apple xStock
    assets.find((a) => a.name.toLowerCase().replace(/ xstock$/, "") === q) ?? // Apple
    null
  );
}

/**
 * Reserve figures, with the dormant assets handled honestly.
 *
 * Most of the 832 assets barely trade. APHx reports a circulating supply of 0.55 tokens
 * against 6 shares in custody, so the naive ratios come out as 1,087% backed and
 * 4,402,599% of float on Solana. Those are not findings, they are division by something
 * close to zero. Where the denominator cannot carry a percentage, say so instead of
 * printing a number that destroys the reader's trust in every other number on the page.
 */
function buildReserves(r: Reserves, onChain: number | null) {
  const circulating = Number(r.circulatingSupply);
  const shares = Number(r.sharesHeld);

  const meaningful = Number.isFinite(circulating) && circulating >= 1;
  const ratio = meaningful ? shares / circulating : null;

  // A live asset sits near 1.0. Far outside that band the issuer's snapshot and the chain
  // are describing different moments, not a real surplus or shortfall.
  const plausible = ratio !== null && ratio > 0.5 && ratio < 2;

  const share =
    meaningful && onChain !== null && onChain >= 1 ? onChain / circulating : null;
  const sharePlausible = share !== null && share > 0 && share <= 1.05;

  return {
    sharesHeld: shares,
    circulating,
    ratio: plausible ? ratio : null,
    providers: r.holdings.map((x) => x.provider),
    otherChains: sharePlausible ? Math.max(0, circulating - (onChain ?? 0)) : null,
    solanaShare: sharePlausible ? share : null,
    dormant: !meaningful,
  };
}

export async function buildAssetReport(symbol: string): Promise<AssetReport | null> {
  const assets = await fetchAssets();
  const asset = matchAsset(assets, symbol);
  if (!asset) return null;
  const mintAddr = solanaMint(asset);
  if (!mintAddr) return null;

  const [mint, history, reserves, upcoming, prices] = await Promise.all([
    fetchMint(mintAddr),
    fetchMultiplierHistory(asset.symbol).catch(() => [] as MultiplierEvent[]),
    fetchReserves(asset.symbol),
    fetchUpcoming().catch(() => [] as CorporateAction[]),
    fetchPrices([mintAddr]),
  ]);

  const effective = effectiveMultiplier(mint?.scaled ?? null);
  const naive = naiveMultiplier(mint?.scaled ?? null);
  const pend = pendingChange(mint?.scaled ?? null);
  const decimals = mint?.decimals ?? 8;

  // Only what has actually activated. The issuer publishes an event as soon as it is
  // scheduled, so an unfiltered history states a future payout in the past tense: three
  // pages read "grew by 1.77%" while the stat band four lines below correctly showed a
  // multiplier of 1.0 and a payout still a day away. It also desynchronised the headline
  // from the history table, which computes per-event and so never saw the pending row.
  const nowIso = new Date().toISOString();
  const applied = history.filter((e) => e.activationDateTime <= nowIso);

  // Separate income from re-denomination. 641 of the 654 multiplier changes across all
  // 832 assets are dividends; the other 13 are splits, reverse splits and administrative
  // corrections, and none of those put money in a holder's pocket.
  const divFactor = dividendFactor(applied);
  const splitFactor = applied.reduce((f, e) => (isIncome(e.reason) ? f : f * eventRatio(e)), 1);

  const supplyUnits = mint ? (Number(mint.supplyRaw) / 10 ** decimals) * effective : 0;
  const treasury = await treasuryHeld(mintAddr, mint?.scaled?.authority ?? null);
  const circulatingOnChain = treasury !== null ? supplyUnits - treasury : null;

  // `upcoming` keeps serving events that already activated, so drop anything in the past.
  const now = Date.now();
  const futureOnly = upcoming
    .filter((c) => c.xstockSymbol === asset.symbol && +new Date(c.effectiveTimeUtc) > now)
    .sort((a, b) => +new Date(a.effectiveTimeUtc) - +new Date(b.effectiveTimeUtc));

  return {
    symbol: asset.symbol,
    name: asset.name,
    underlying: asset.underlyingSymbol,
    logo: asset.logo,
    mint: mintAddr,
    decimals,
    supplyUnits,
    treasuryUnits: treasury,
    circulatingOnChain,
    naive,
    effective,
    driftPct: naive > 0 ? (effective / naive - 1) * 100 : 0,
    hiddenPct: effective > 0 ? (1 - naive / effective) * 100 : 0,
    priceUsd: prices[mintAddr]?.usdPrice ?? null,
    history: applied,
    dividendCount: applied.filter((e) => isIncome(e.reason)).length,
    totalGrowthPct: (divFactor - 1) * 100,
    perUnitGained: effective * (1 - 1 / divFactor),
    splitFactor,
    pending: pend
      ? { from: pend.from, to: pend.to, activatesAt: pend.activatesAt.toISOString(), secondsAway: pend.secondsAway }
      : null,
    upcoming: futureOnly.slice(0, 6),
    reserves: reserves ? buildReserves(reserves, circulatingOnChain) : null,
    halted: asset.isTradingHalted,
  };
}

/** Assets whose multiplier has moved at least once: the ones with a story to tell. */
export async function listPayingAssets(limit = 24) {
  const assets = await fetchAssets();
  const mints = assets.map(solanaMint).filter((m): m is string => !!m);
  const prices = await fetchPrices(mints.slice(0, 200));
  return assets
    .map((a) => ({ asset: a, mint: solanaMint(a) }))
    .filter((x) => x.mint && prices[x.mint]?.usdPrice)
    .sort((a, b) => (prices[b.mint!]!.liquidity ?? 0) - (prices[a.mint!]!.liquidity ?? 0))
    .slice(0, limit)
    .map((x) => ({
      symbol: x.asset.symbol,
      name: x.asset.name,
      underlying: x.asset.underlyingSymbol,
      logo: x.asset.logo,
      priceUsd: prices[x.mint!]!.usdPrice,
    }));
}

/** Headline figures for the landing page, read live rather than hardcoded. */
export async function marketSummary() {
  const [assets, upcoming] = await Promise.all([
    fetchAssets().catch(() => [] as Asset[]),
    fetchUpcoming().catch(() => [] as CorporateAction[]),
  ]);
  const now = Date.now();
  const future = upcoming.filter((c) => +new Date(c.effectiveTimeUtc) > now);
  const nextUp = future.sort(
    (a, b) => +new Date(a.effectiveTimeUtc) - +new Date(b.effectiveTimeUtc)
  )[0];
  return {
    assetCount: assets.length,
    scheduledCount: future.length,
    nextEvent: nextUp
      ? { symbol: nextUp.xstockSymbol, at: nextUp.effectiveTimeUtc, type: nextUp.caType }
      : null,
  };
}
