const URL = process.env.RPCURL, X = "https://api.xstocks.fi/api/v2/public";
const j = async (u,o) => (await fetch(u,o)).json();
async function rpc(method, params) {
  for (let a=0;a<5;a++){ const r=await fetch(URL,{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({jsonrpc:"2.0",id:1,method,params})});
    if(r.status===429||r.status>=500){await new Promise(s=>setTimeout(s,400*2**a));continue}
    const b=await r.json(); if(b.error) throw new Error(JSON.stringify(b.error).slice(0,120)); return b.result }
  throw new Error("rate limited") }
const eff = c => { if(!c) return 1; const ts=Number(c.newMultiplierEffectiveTimestamp||0), nx=Number(c.newMultiplier);
  return ts>0&&nx>0&&Date.now()/1000>=ts?nx:Number(c.multiplier) };

let assets=[];
for(let p=0;p<40;p++){ const r=await j(`${X}/assets?network=Solana&page=${p}&pageSize=100`);
  assets=assets.concat(r.nodes??[]); if(!r.page?.hasNextPage||!(r.nodes??[]).length) break }
const mintOf = a => a.deployments?.find(d=>/solana/i.test(d.network))?.address;
const withMint = assets.map(a=>({a,m:mintOf(a)})).filter(x=>x.m);
console.log(`${assets.length} varlik, ${withMint.length} tanesinin Solana mint'i var`);

// mint hesaplarini toplu oku
const info = new Map();
for(let i=0;i<withMint.length;i+=100){
  const chunk=withMint.slice(i,i+100).map(x=>x.m);
  const r=await rpc("getMultipleAccounts",[chunk,{encoding:"jsonParsed"}]);
  (r.value??[]).forEach((acc,k)=>{ const inf=acc?.data?.parsed?.info; if(!inf) return;
    const s=inf.extensions?.find(e=>e.extension==="scaledUiAmountConfig")?.state ?? null;
    info.set(chunk[k],{dec:inf.decimals,supply:Number(inf.supply),scaled:s}) });
}
// fiyatlar
const prices={};
for(let i=0;i<withMint.length;i+=50){
  const ids=withMint.slice(i,i+50).map(x=>x.m).join(",");
  try{ Object.assign(prices, await j(`https://lite-api.jup.ag/price/v3?ids=${ids}`)) }catch{}
}

let totalHidden=0, totalFloat=0, withMultiplier=0, priced=0;
const rows=[];
for(const {a,m} of withMint){
  const inf=info.get(m); const p=prices[m]?.usdPrice; if(!inf) continue;
  const mult=eff(inf.scaled);
  if(mult<=1) continue; withMultiplier++;
  if(!p) continue; priced++;
  const floatUsd=(inf.supply/10**inf.dec)*mult*p;
  const hidden=floatUsd*(1-1/mult);
  totalFloat+=floatUsd; totalHidden+=hidden;
  rows.push([a.symbol,hidden,floatUsd,(mult-1)*100]);
}
rows.sort((x,y)=>y[1]-x[1]);
console.log(`\ncarpani 1'in uzerinde olan (temettu odemis) varlik: ${withMultiplier}`);
console.log(`bunlardan fiyati olan: ${priced}`);
console.log(`\n=== ZINCIRDEKI TOPLAM (ihraccinin basilmis ama satilmamis stogu DAHIL, ust sinir)`);
console.log(`  toplam pozisyon degeri : $${totalFloat.toLocaleString('en-US',{maximumFractionDigits:0})}`);
console.log(`  ODENMIS GORUNMEZ TEMETTU: $${totalHidden.toLocaleString('en-US',{maximumFractionDigits:0})}`);
console.log(`\n=== en cok gorunmez temettu odeyen 12`);
rows.slice(0,12).forEach(r=>console.log(`  ${r[0].padEnd(9)} $${Math.round(r[1]).toLocaleString('en-US').padStart(9)}  (float $${Math.round(r[2]).toLocaleString('en-US')}, +${r[3].toFixed(3)}%)`));
