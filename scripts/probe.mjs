const RPC = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
const X = "https://api.xstocks.fi/api/v2/public";
const SYM = process.argv[2] || "AAPLx";
const UNITS = Number(process.argv[3] || 10);

const j = async (u, o) => (await fetch(u, o)).json();
const rpc = (method, params) =>
  j(RPC, { method: "POST", headers: { "Content-Type": "application/json" },
           body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) });

const effective = (c, now = Date.now() / 1000) => {
  if (!c) return 1;
  const ts = Number(c.newMultiplierEffectiveTimestamp || 0), next = Number(c.newMultiplier);
  return ts > 0 && next > 0 && now >= ts ? next : Number(c.multiplier);
};
const naive = (c) => (c ? Number(c.multiplier) : 1);
const f = (n, d = 6) => n.toLocaleString("en-US", { maximumFractionDigits: d });

// 1. mint address from the issuer's own asset list
let all = [];
for (let page = 0; page < 40; page++) {
  const r = await j(`${X}/assets?network=Solana&page=${page}&pageSize=100`);
  all = all.concat(r.nodes ?? []);
  if (!r.page?.hasNextPage || !(r.nodes ?? []).length) break;
}
const asset = all.find((a) => a.symbol === SYM);
if (!asset) { console.log(`${SYM} bulunamadi. Toplam varlik: ${all.length}`); process.exit(1); }
const mintAddr = asset.deployments.find((d) => /solana/i.test(d.network))?.address;

console.log(`\n=== ${asset.name}  (${asset.symbol} -> ${asset.underlyingSymbol})`);
console.log(`toplam xStocks varligi: ${all.length}`);
console.log(`mint: ${mintAddr}`);

// 2. on-chain config
const acc = await rpc("getAccountInfo", [mintAddr, { encoding: "jsonParsed" }]);
const info = acc.result?.value?.data?.parsed?.info;
const cfg = info?.extensions?.find((e) => e.extension === "scaledUiAmountConfig")?.state ?? null;
const dec = info?.decimals;

const mEff = effective(cfg), mNaive = naive(cfg);
console.log(`\n--- ZINCIR ---`);
console.log(`decimals: ${dec}   arz(ham): ${info?.supply}`);
console.log(`multiplier     (bayat alan) : ${cfg?.multiplier}`);
console.log(`newMultiplier  (yururlukte) : ${cfg?.newMultiplier}`);
console.log(`gecerlilik zamani           : ${new Date(Number(cfg?.newMultiplierEffectiveTimestamp) * 1000).toISOString()}  (${Number(cfg?.newMultiplierEffectiveTimestamp) * 1000 < Date.now() ? "GECMIS -> yeni deger yururlukte" : "GELECEK -> eski deger yururlukte"})`);
console.log(`=> dogru carpan: ${mEff}`);
console.log(`=> naif carpan : ${mNaive}   ${mEff !== mNaive ? `HATA PAYI: ${f(((mEff / mNaive - 1) * 100), 4)}%` : "(fark yok)"}`);

// 3. price
let price = null;
try { price = (await j(`https://lite-api.jup.ag/price/v3?ids=${mintAddr}`))[mintAddr]?.usdPrice ?? null; } catch {}
console.log(`\nfiyat (Jupiter): ${price ? "$" + f(price, 2) : "yok"}`);

// 4. what a UNITS-token position actually holds
console.log(`\n--- ${UNITS} ${SYM} TUTAN BIRI ICIN ---`);
console.log(`cuzdanin gosterebilecegi (naif) : ${f(UNITS * mNaive)} ${SYM}`);
console.log(`gercekte sahip oldugu           : ${f(UNITS * mEff)} ${SYM}`);
const hidden = UNITS * (mEff - mNaive);
console.log(`gorunmeyen                      : ${f(hidden)} ${SYM}${price ? ` = $${f(hidden * price, 2)}` : ""}`);

// 5. dividend history
let hist = [];
for (let page = 0; page < 20; page++) {
  const r = await j(`${X}/assets/${SYM}/multiplier/history?network=Solana&page=${page}&pageSize=100`);
  hist = hist.concat(r.nodes ?? []);
  if (!r.page?.hasNextPage || !(r.nodes ?? []).length) break;
}
hist.sort((a, b) => new Date(a.activationDateTime) - new Date(b.activationDateTime));
console.log(`\n--- GORUNMEYEN TEMETTU GECMISI (${hist.length} olay) ---`);
let total = 0;
for (const e of hist) {
  const g = UNITS * (e.multiplier - e.previousMultiplier);
  total += g;
  console.log(`  ${e.activationDateTime.slice(0, 10)}  ${e.reason.padEnd(10)}  ${e.previousMultiplier.toFixed(9)} -> ${e.multiplier.toFixed(9)}   +${f(g)} ${SYM}${price ? `  ($${f(g * price, 2)})` : ""}`);
}
console.log(`  TOPLAM: +${f(total)} ${SYM}${price ? `  = $${f(total * price, 2)}` : ""}`);

// 6. reserves + status + upcoming
const res = await j(`${X}/proof-of-reserves/${SYM}`).catch(() => null);
if (res?.sharesHeld) {
  const r = Number(res.sharesHeld) / Number(res.circulatingSupply);
  console.log(`\n--- REZERV KANITI (${res.timestamp.slice(0, 19)}Z) ---`);
  console.log(`  saklanan gercek hisse : ${f(Number(res.sharesHeld), 2)} (${res.holdings.map((h) => h.provider).join(", ")})`);
  console.log(`  dolasimdaki token     : ${f(Number(res.circulatingSupply), 2)}`);
  console.log(`  teminat orani         : ${f(r * 100, 2)}%  ${r >= 1 ? "TAM KARSILIKLI" : "EKSIK"}`);
}
const st = await j(`${X}/system/status/${SYM}`).catch(() => null);
if (st) console.log(`\ndurum: piyasa durduruldu=${st.isMarketTradingHalted}  atomik durduruldu=${st.isAtomicTradingHalted}`);

const up = await j(`${X}/corporate-actions/upcoming?pageSize=100`);
const mine = (up.nodes ?? []).filter((c) => c.xstockSymbol === SYM);
console.log(`\nyaklasan olaylar (tum sistemde ${up.page?.totalNodes}): ${SYM} icin ${mine.length}`);
for (const c of mine.slice(0, 4))
  console.log(`  ${c.effectiveTimeUtc.slice(0, 16)}Z  ${c.caType}  brut $${c.grossCashflowUsd}/hisse  stopaj ${c.withholdingTaxRate}%  [${c.status}]`);
