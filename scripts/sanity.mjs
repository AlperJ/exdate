// Renders a sample of asset pages and flags any number a reader would call impossible.
// Only looks at visible text: Next.js embeds JSON payloads full of legitimate nulls.
const BASE = "http://localhost:3000";
const X = "https://api.xstocks.fi/api/v2/public";
const j = async (u) => (await fetch(u)).json();

let assets = [];
for (let p = 0; p < 40; p++) {
  const r = await j(`${X}/assets?network=Solana&page=${p}&pageSize=100`);
  assets = assets.concat(r.nodes ?? []);
  if (!r.page?.hasNextPage || !(r.nodes ?? []).length) break;
}
const N = Number(process.argv[2] || 30);
const step = Math.max(1, Math.floor(assets.length / N));
const sample = Array.from({ length: N }, (_, i) => assets[i * step]).filter(Boolean);

const visible = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;/g, "'").replace(/&amp;/g, "&").replace(/&quot;/g, '"')
    .replace(/\s+/g, " ");

let bad = 0, ok = 0, errored = 0;
for (const a of sample) {
  const h = await (await fetch(`${BASE}/asset/${encodeURIComponent(a.symbol)}`)).text();
  if (/<div class="err">/.test(h)) { console.log(`  ${a.symbol.padEnd(9)} HATA SAYFASI`); errored++; continue; }
  const t = visible(h);

  const pcts = [...t.matchAll(/([\d,]+(?:\.\d+)?)%/g)].map((m) => Number(m[1].replace(/,/g, "")));
  const absurd = pcts.filter((v) => v > 200);
  const junk = /\bNaN\b|\bInfinity\b|\bundefined\b|\$NaN|—%/.test(t);

  if (absurd.length || junk) {
    console.log(`  ${a.symbol.padEnd(9)} ${absurd.length ? "SACMA: " + absurd.slice(0,3).map(v=>v+"%").join(", ") : ""}${junk ? " BOZUK METIN" : ""}`);
    bad++;
  } else ok++;
}
console.log(`\n${sample.length} sayfa: ${ok} temiz, ${bad} sorunlu, ${errored} hata sayfasi`);
