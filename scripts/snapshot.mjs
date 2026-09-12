// Builds data/market.json: the market-wide picture, measured rather than asserted.
// Scans all 832 assets, so it runs ahead of a deploy rather than inside a request.
import { writeFileSync, mkdirSync } from "node:fs";

const RPC = process.env.SOLANA_RPC_URL;
if (!RPC) { console.error("SOLANA_RPC_URL gerekli"); process.exit(1); }
const X = "https://api.xstocks.fi/api/v2/public";
// The reserves pass added several hundred requests and the issuer started refusing
// them, which silently emptied the calendar. Retry rather than accept a blank answer.
const j = async (u, tries = 4) => {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(u, { headers: { accept: "application/json" } });
      if (r.ok) return await r.json();
    } catch {}
    await new Promise((s) => setTimeout(s, 300 * 2 ** i));
  }
  throw new Error(`gave up on ${u.slice(0, 80)}`);
};

async function rpc(method, params) {
  for (let a = 0; a < 5; a++) {
    const r = await fetch(RPC, { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) });
    if (r.status === 429 || r.status >= 500) { await new Promise(s => setTimeout(s, 400 * 2 ** a)); continue; }
    const b = await r.json();
    if (b.error) throw new Error(JSON.stringify(b.error).slice(0, 120));
    return b.result;
  }
  throw new Error("rate limited");
}

const isIncome = (r) => String(r).trim().toLowerCase() === "dividend";
const eff = (c) => {
  if (!c) return 1;
  const ts = Number(c.newMultiplierEffectiveTimestamp || 0), nx = Number(c.newMultiplier);
  return ts > 0 && nx > 0 && Date.now() / 1000 >= ts ? nx : Number(c.multiplier);
};

console.log("varliklar cekiliyor...");
let assets = [];
for (let p = 0; p < 40; p++) {
  const r = await j(`${X}/assets?network=Solana&page=${p}&pageSize=100`);
  assets = assets.concat(r.nodes ?? []);
  if (!r.page?.hasNextPage || !(r.nodes ?? []).length) break;
}
const mintOf = (a) => a.deployments?.find((d) => /solana/i.test(d.network))?.address;
const list = assets.map((a) => ({ a, m: mintOf(a) })).filter((x) => x.m);
console.log(`  ${list.length} varlik`);

console.log("mint hesaplari...");
const info = new Map();
for (let i = 0; i < list.length; i += 100) {
  const c = list.slice(i, i + 100).map((x) => x.m);
  const r = await rpc("getMultipleAccounts", [c, { encoding: "jsonParsed" }]);
  (r.value ?? []).forEach((acc, k) => {
    const inf = acc?.data?.parsed?.info;
    if (inf) info.set(c[k], { dec: inf.decimals, supply: Number(inf.supply),
      scaled: inf.extensions?.find((e) => e.extension === "scaledUiAmountConfig")?.state ?? null });
  });
}

// Value a tokenized stock at the underlying equity's price, which Jupiter returns in
// stockData in the same payload. The DEX quote is unusable on most of these: PYPLx
// quoted 3337.04 against PayPal's 53.94 on a pool holding five cents, and that single
// row was 16.4% of the headline. Six other assets were more than 30% out.
console.log("fiyatlar...");
const prices = {};
let rejected = 0;
for (let i = 0; i < list.length; i += 50) {
  try {
    const r = await j(`https://lite-api.jup.ag/price/v3?ids=${list.slice(i, i + 50).map((x) => x.m).join(",")}`);
    for (const [mint, row] of Object.entries(r)) {
      const dex = Number.isFinite(row?.usdPrice) ? row.usdPrice : null;
      const stock = Number.isFinite(row?.stockData?.price) ? row.stockData.price : null;
      if (dex === null && stock === null) continue;
      if (dex !== null && stock !== null && stock > 0 && Math.abs(dex / stock - 1) > 0.3) rejected++;
      prices[mint] = {
        usdPrice: stock ?? dex,
        stockPrice: stock,
        dexPrice: dex,
        liquidity: row?.liquidity ?? null,
      };
    }
  } catch {}
}
console.log(`  ${Object.keys(prices).length} fiyat, ${rejected} bozuk DEX kotasyonu reddedildi`);

console.log("takvim...");
let upcomingRaw = [];
for (let p = 1; p <= 20; p++) {
  const r = await j(`${X}/corporate-actions/upcoming?page=${p}&pageSize=100`);
  upcomingRaw = upcomingRaw.concat(r.nodes ?? []);
  if (!r.page?.hasNextPage || !(r.nodes ?? []).length) break;
}
console.log(`  ${upcomingRaw.length} satir`);

console.log("carpan gecmisleri...");
const CONC = 8, rows = [];
let scanned = 0;
async function work(sub) {
  for (const { a, m } of sub) {
    scanned++;
    const inf = info.get(m), p = prices[m]?.usdPrice;
    if (!inf) continue;
    const mult = eff(inf.scaled);
    // Was `mult <= 1`, which tested whether the multiplier is currently above one rather
    // than whether it has ever moved. That silently dropped AZNx, whose reverse split left
    // it at 0.511 despite three real dividends worth $294,189, and took four assets and six
    // payments out of every count on the site with no trace in the output.
    if (mult === 1) continue;
    let hist = [];
    try { hist = (await j(`${X}/assets/${encodeURIComponent(a.symbol)}/multiplier/history?network=Solana&page=0&pageSize=100`)).nodes ?? []; } catch { continue; }
    // Only events that have actually activated; the issuer publishes them when scheduled.
    const nowIso = new Date().toISOString();
    const applied = hist.filter((e) => e.activationDateTime <= nowIso);
    let divF = 1, splitF = 1, nDiv = 0, last = null;
    for (const e of applied) {
      const r = e.previousMultiplier > 0 ? e.multiplier / e.previousMultiplier : 1;
      if (isIncome(e.reason)) { divF *= r; nDiv++; if (!last || e.activationDateTime > last) last = e.activationDateTime; }
      else splitF *= r;
    }
    // What is actually out there, not what has been minted.
    //
    // Valuing the whole mint counts tokens the issuer created and never sold, and it
    // holds the majority of the supply on almost every asset: measured across the
    // payers, a float-weighted 80% of the tokens sit with the issuer. Using total
    // supply overstated the headline roughly sevenfold.
    //
    // The denominator here is the issuer's own published circulating figure. It is
    // their attestation rather than our inference about which wallet belongs to whom,
    // and it spans every chain the token is issued on, so it is the honest measure of
    // how much of this stock exists in public hands anywhere.
    let circulating = null;
    try {
      const por = await j(`${X}/proof-of-reserves/${encodeURIComponent(a.symbol)}`);
      const c = Number(por?.circulatingSupply);
      if (Number.isFinite(c) && c > 0) circulating = c;
    } catch {}
    if (circulating === null) continue;

    const floatUsd = p ? circulating * p : null;
    const events = applied.filter((e) => isIncome(e.reason)).map((e) => ({
      at: e.activationDateTime,
      ratio: e.previousMultiplier > 0 ? e.multiplier / e.previousMultiplier : 1,
    }));
    rows.push({ symbol: a.symbol, events, circulating, name: a.name, underlying: a.underlyingSymbol, logo: a.logo,
      dividends: nDiv, yieldPct: (divF - 1) * 100, splitFactor: splitF, lastPaid: last,
      floatUsd, hiddenUsd: floatUsd ? floatUsd * (1 - 1 / divF) : null });
  }
}
await Promise.all(Array.from({ length: CONC }, (_, i) => work(list.filter((_, k) => k % CONC === i))));
console.log(`  ${scanned} tarandi, ${rows.length} tanesinin carpani oynamis`);

const upcoming = upcomingRaw;
const now = Date.now();
const future = upcoming.filter((c) => +new Date(c.effectiveTimeUtc) > now)
  .sort((a, b) => +new Date(a.effectiveTimeUtc) - +new Date(b.effectiveTimeUtc));

const paying = rows.filter((r) => r.dividends > 0 && r.hiddenUsd !== null);

// Cumulative dollars paid, bucketed by month. Each event contributes the share of
// today's float that its own ratio accounts for, which is the same assumption the
// headline figure already makes: historical payouts valued at the current float.
const byMonth = new Map();
for (const r of paying) {
  for (const e of r.events ?? []) {
    const key = e.at.slice(0, 7);
    const share = r.floatUsd * (1 - 1 / e.ratio);
    const cur = byMonth.get(key) ?? { usd: 0, count: 0 };
    cur.usd += share; cur.count += 1;
    byMonth.set(key, cur);
  }
}
let runUsd = 0, runCount = 0;
const rawSeries = [...byMonth.keys()].sort().map((month) => {
  const v = byMonth.get(month);
  runUsd += v.usd; runCount += v.count;
  return { month, usd: runUsd, count: runCount, monthUsd: v.usd, monthCount: v.count };
});
// Summing each event's share independently ignores compounding, so the series ends
// about one per cent above the headline, which compounds the ratios. Scale the shape
// onto the headline so the page never states two different totals.
const headlineUsd = paying.reduce((s, r) => s + r.hiddenUsd, 0);
const rawEnd = rawSeries.length ? rawSeries[rawSeries.length - 1].usd : 0;
const k = rawEnd > 0 ? headlineUsd / rawEnd : 1;
const cumulative = rawSeries.map((p) => ({
  ...p, usd: p.usd * k, monthUsd: p.monthUsd * k,
}));
// Nine tenths of the dollar total comes from one instrument, a variable-rate preferred
// that pays like a bond rather than like a stock. Stating the total without saying so
// would describe a market that does not exist, so the concentration and the typical
// case ship alongside it.
const byYield = [...paying].sort((a, b) => a.yieldPct - b.yieldPct);
const medianYieldPct = byYield.length ? byYield[Math.floor(byYield.length / 2)].yieldPct : 0;
const ranked = [...paying].sort((a, b) => b.hiddenUsd - a.hiddenUsd);
const leader = ranked[0] ?? null;

const snapshot = {
  measuredAt: new Date().toISOString(),
  medianYieldPct,
  leader: leader
    ? { symbol: leader.symbol, name: leader.name, hiddenUsd: leader.hiddenUsd,
        share: leader.hiddenUsd / paying.reduce((s, r) => s + r.hiddenUsd, 0) }
    : null,
  restUsd: paying.reduce((s, r) => s + r.hiddenUsd, 0) - (leader?.hiddenUsd ?? 0),
  assetCount: list.length,
  assetsWithMultiplierChange: rows.length,
  assetsPricedAndPaying: paying.length,
  dividendPayments: paying.reduce((s, r) => s + r.dividends, 0),
  totalFloatUsd: paying.reduce((s, r) => s + r.floatUsd, 0),
  totalHiddenUsd: paying.reduce((s, r) => s + r.hiddenUsd, 0),
  splits: rows.filter((r) => Math.abs(r.splitFactor - 1) > 0.001)
    .map((r) => ({ symbol: r.symbol, factor: r.splitFactor })).sort((a, b) => b.factor - a.factor),
  cumulative,
  topPayers: [...paying].sort((a, b) => b.hiddenUsd - a.hiddenUsd).slice(0, 12)
    .map(({ events, ...rest }) => rest),
  // Full index for /assets. Every asset whose multiplier has ever moved.
  index: [...rows]
    .sort((a, b) => (b.hiddenUsd ?? -1) - (a.hiddenUsd ?? -1) || b.yieldPct - a.yieldPct)
    .map((r) => ({
      symbol: r.symbol, name: r.name, underlying: r.underlying,
      dividends: r.dividends, yieldPct: r.yieldPct, splitFactor: r.splitFactor,
      lastPaid: r.lastPaid, hiddenUsd: r.hiddenUsd, floatUsd: r.floatUsd, circulating: r.circulating,
    })),
  topYields: [...paying].filter((r) => r.floatUsd > 1e6).sort((a, b) => b.yieldPct - a.yieldPct).slice(0, 8),
  upcoming: future.map((c) => ({ symbol: c.xstockSymbol, at: c.effectiveTimeUtc,
    type: c.caType, grossUsd: c.grossCashflowUsd, netUsd: c.netCashflowUsd,
    withholding: c.withholdingTaxRate, status: c.status })),
  upcomingCount: future.length,
};

mkdirSync("data", { recursive: true });
writeFileSync("data/market.json", JSON.stringify(snapshot, null, 2));
console.log(`\nyazildi: data/market.json`);
console.log(`  ${snapshot.assetsPricedAndPaying} varlik, ${snapshot.dividendPayments} odeme`);
console.log(`  gorunmez temettu: $${Math.round(snapshot.totalHiddenUsd).toLocaleString("en-US")}`);
console.log(`  gelecek olay: ${snapshot.upcomingCount}`);
