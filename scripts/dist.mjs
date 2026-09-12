const URL = process.env.RPCURL;
const TREASURY = "S7vYFFWH6BjJyEsdrPQpqpYTqLTrPRK6KW3VwsJuRaS";
const MINT = process.argv[2], SYM = process.argv[3], DEC = 8, MULT = Number(process.argv[4]), PRICE = Number(process.argv[5]);

async function rpc(method, params) {
  for (let a = 0; a < 5; a++) {
    const r = await fetch(URL, { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) });
    if (r.status === 429 || r.status >= 500) { await new Promise(s => setTimeout(s, 400 * 2 ** a)); continue; }
    const j = await r.json(); if (j.error) throw new Error(JSON.stringify(j.error).slice(0,140));
    return j.result;
  }
  throw new Error("rate limited");
}

const byOwner = new Map();
let cursor;
for (let p = 0; p < 400; p++) {
  const r = await rpc("getTokenAccounts", { mint: MINT, limit: 1000, ...(cursor?{cursor}:{}) , options:{showZeroBalance:false}});
  const list = r.token_accounts ?? [];
  for (const a of list) {
    if (!(a.amount > 0) || a.owner === TREASURY) continue;
    byOwner.set(a.owner, (byOwner.get(a.owner) ?? 0) + a.amount);
  }
  if (!r.cursor || !list.length) break;
  cursor = r.cursor;
}

const usd = [...byOwner.values()].map(raw => (raw / 10 ** DEC) * MULT * PRICE).sort((a,b)=>a-b);
const n = usd.length;
const above = (t) => usd.filter(v => v >= t).length;
const sum = usd.reduce((s,v)=>s+v,0);
const pc = (k) => usd[Math.min(n-1, Math.floor(n*k))];

console.log(`\n=== ${SYM}: ${n} benzersiz cuzdan, toplam $${sum.toLocaleString('en-US',{maximumFractionDigits:0})}`);
console.log(`  medyan pozisyon : $${pc(0.5).toFixed(2)}`);
console.log(`  %75'lik dilim   : $${pc(0.75).toFixed(2)}`);
console.log(`  %95'lik dilim   : $${pc(0.95).toFixed(2)}`);
for (const t of [0.01, 1, 10, 100, 1000]) {
  const c = above(t);
  console.log(`  >= $${String(t).padEnd(5)} : ${String(c).padStart(7)} cuzdan  (${(c/n*100).toFixed(1)}%)`);
}
// bu grup icin gorunmez temettu: toplam pozisyon x (mult-1)
console.log(`  bu hissede odenmis gorunmez temettu ~ $${(sum*(1-1/MULT)).toLocaleString('en-US',{maximumFractionDigits:0})}`);
