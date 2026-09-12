// Builds data/market.json: the market-wide picture, measured rather than asserted.
// Scans all 832 assets, so it runs ahead of a deploy rather than inside a request.
import { writeFileSync, mkdirSync } from "node:fs";

const RPC = process.env.SOLANA_RPC_URL;
if (!RPC) { console.error("SOLANA_RPC_URL gerekli"); process.exit(1); }
const X = "https://api.xstocks.fi/api/v2/public";
const j = async (u) => (await fetch(u)).json();

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

console.log("fiyatlar...");
const prices = {};
for (let i = 0; i < list.length; i += 50) {
  try { Object.assign(prices, await j(`https://lite-api.jup.ag/price/v3?ids=${list.slice(i, i + 50).map((x) => x.m).join(",")}`)); } catch {}
}

console.log("carpan gecmisleri...");
const CONC = 8, rows = [];
let scanned = 0;
async function work(sub) {
  for (const { a, m } of sub) {
    scanned++;
    const inf = info.get(m), p = prices[m]?.usdPrice;
    if (!inf) continue;
    const mult = eff(inf.scaled);
    if (mult <= 1) continue;
    let hist = [];
    try { hist = (await j(`${X}/assets/${encodeURIComponent(a.symbol)}/multiplier/history?network=Solana&page=0&pageSize=100`)).nodes ?? []; } catch { continue; }
    let divF = 1, splitF = 1, nDiv = 0, last = null;
    for (const e of hist) {
      const r = e.previousMultiplier > 0 ? e.multiplier / e.previousMultiplier : 1;
      if (isIncome(e.reason)) { divF *= r; nDiv++; if (!last || e.activationDateTime > last) last = e.activationDateTime; }
      else splitF *= r;
    }
    const floatUsd = p ? (inf.supply / 10 ** inf.dec) * mult * p : null;
    const events = hist.filter((e) => isIncome(e.reason)).map((e) => ({
      at: e.activationDateTime,
      ratio: e.previousMultiplier > 0 ? e.multiplier / e.previousMultiplier : 1,
    }));
    rows.push({ symbol: a.symbol, events, name: a.name, underlying: a.underlyingSymbol, logo: a.logo,
      dividends: nDiv, yieldPct: (divF - 1) * 100, splitFactor: splitF, lastPaid: last,
      floatUsd, hiddenUsd: floatUsd ? floatUsd * (1 - 1 / divF) : null });
  }
}
await Promise.all(Array.from({ length: CONC }, (_, i) => work(list.filter((_, k) => k % CONC === i))));
console.log(`  ${scanned} tarandi, ${rows.length} tanesinin carpani oynamis`);

console.log("takvim...");
let upcoming = [];
for (let p = 1; p <= 20; p++) {
  const r = await j(`${X}/corporate-actions/upcoming?page=${p}&pageSize=100`);
  upcoming = upcoming.concat(r.nodes ?? []);
  if (!r.page?.hasNextPage || !(r.nodes ?? []).length) break;
}
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
const snapshot = {
  measuredAt: new Date().toISOString(),
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
      lastPaid: r.lastPaid, hiddenUsd: r.hiddenUsd, floatUsd: r.floatUsd,
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
