import { ownersOf } from "./holders.mjs";
const X = "https://api.xstocks.fi/api/v2/public";

let assets = [];
for (let p = 0; p < 40; p++) {
  const r = await (await fetch(`${X}/assets?network=Solana&page=${p}&pageSize=100`)).json();
  assets = assets.concat(r.nodes ?? []);
  if (!r.page?.hasNextPage || !(r.nodes ?? []).length) break;
}
const mintOf = (a) => a.deployments?.find((d) => /solana/i.test(d.network))?.address;

const PICK = ["AAPLx","NVDAx","TSLAx","SPYx","MSTRx","METAx","GOOGLx","AMZNx","MSFTx","COINx","CRCLx","QQQx","HOODx","PLTRx","GLDx","CRCLx"];
const seen = new Set();
const union = new Set();
const rows = [];

for (const sym of PICK) {
  if (seen.has(sym)) continue; seen.add(sym);
  const a = assets.find((x) => x.symbol === sym);
  if (!a) { console.log(`${sym}: bulunamadi`); continue; }
  const mint = mintOf(a);
  try {
    const { owners } = await ownersOf(mint);
    owners.forEach((o) => union.add(o));
    rows.push([sym, owners.size]);
    console.log(`  ${sym.padEnd(8)} ${String(owners.size).padStart(7)} cuzdan   birlesim: ${union.size}`);
  } catch (e) { console.log(`  ${sym}: HATA ${e.message}`); }
}
console.log(`\n=== ${rows.length} hissede TOPLAM BENZERSIZ CUZDAN: ${union.size}`);
console.log(`=== en cok tutulan: ${rows.sort((a,b)=>b[1]-a[1]).slice(0,5).map(r=>r[0]+' '+r[1]).join(', ')}`);
