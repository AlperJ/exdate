const X = "https://api.xstocks.fi/api/v2/public";
const j = async u => (await fetch(u)).json();
let assets = [];
for (let p = 0; p < 40; p++) {
  const r = await j(`${X}/assets?network=Solana&page=${p}&pageSize=100`);
  assets = assets.concat(r.nodes ?? []);
  if (!r.page?.hasNextPage || !(r.nodes ?? []).length) break;
}
const counts = new Map(), splits = [], byReason = new Map();
let scanned = 0;
const CONC = 8;
async function work(list) {
  for (const a of list) {
    try {
      const r = await j(`${X}/assets/${encodeURIComponent(a.symbol)}/multiplier/history?network=Solana&page=0&pageSize=100`);
      for (const e of r.nodes ?? []) {
        counts.set(e.reason, (counts.get(e.reason) ?? 0) + 1);
        if (!byReason.has(e.reason)) byReason.set(e.reason, []);
        byReason.get(e.reason).push(a.symbol);
        const ratio = e.multiplier / e.previousMultiplier;
        if (ratio > 1.5) splits.push([a.symbol, e.reason, e.activationDateTime.slice(0,10), ratio.toFixed(3)]);
      }
    } catch {}
    scanned++;
  }
}
const chunks = Array.from({length: CONC}, (_, i) => assets.filter((_, k) => k % CONC === i));
await Promise.all(chunks.map(work));

console.log(`${scanned} varlik tarandi\n`);
console.log("=== olay turleri ve sayilari");
[...counts.entries()].sort((a,b)=>b[1]-a[1]).forEach(([r,c])=>console.log(`  ${r.padEnd(16)} ${String(c).padStart(5)}   ornek: ${[...new Set(byReason.get(r))].slice(0,5).join(", ")}`));
console.log(`\n=== carpani 1.5x uzerinde degistiren olaylar (bolunme adaylari): ${splits.length}`);
splits.sort((a,b)=>Number(b[3])-Number(a[3])).slice(0,15).forEach(s=>console.log(`  ${s[0].padEnd(9)} ${s[1].padEnd(10)} ${s[2]}  x${s[3]}`));
