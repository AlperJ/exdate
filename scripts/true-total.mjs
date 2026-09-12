const URL = process.env.RPCURL, X = "https://api.xstocks.fi/api/v2/public";
const j = async u => (await fetch(u)).json();
async function rpc(m, p) {
  for (let a=0;a<5;a++){ const r=await fetch(URL,{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({jsonrpc:"2.0",id:1,method:m,params:p})});
    if(r.status===429||r.status>=500){await new Promise(s=>setTimeout(s,400*2**a));continue}
    const b=await r.json(); if(b.error) throw new Error(JSON.stringify(b.error).slice(0,120)); return b.result }
  throw new Error("rate limited") }
const eff = c => { if(!c) return 1; const ts=Number(c.newMultiplierEffectiveTimestamp||0), nx=Number(c.newMultiplier);
  return ts>0&&nx>0&&Date.now()/1000>=ts?nx:Number(c.multiplier) };

let assets=[];
for(let p=0;p<40;p++){ const r=await j(`${X}/assets?network=Solana&page=${p}&pageSize=100`);
  assets=assets.concat(r.nodes??[]); if(!r.page?.hasNextPage||!(r.nodes??[]).length) break }
const mintOf = a => a.deployments?.find(d=>/solana/i.test(d.network))?.address;
const list = assets.map(a=>({a,m:mintOf(a)})).filter(x=>x.m);

const info=new Map();
for(let i=0;i<list.length;i+=100){ const c=list.slice(i,i+100).map(x=>x.m);
  const r=await rpc("getMultipleAccounts",[c,{encoding:"jsonParsed"}]);
  (r.value??[]).forEach((acc,k)=>{ const inf=acc?.data?.parsed?.info; if(!inf) return;
    info.set(c[k],{dec:inf.decimals,supply:Number(inf.supply),
      scaled:inf.extensions?.find(e=>e.extension==="scaledUiAmountConfig")?.state??null}) }) }

const prices={};
for(let i=0;i<list.length;i+=50){ try{ Object.assign(prices, await j(`https://lite-api.jup.ag/price/v3?ids=${list.slice(i,i+50).map(x=>x.m).join(",")}`)) }catch{} }

// temettu carpanini ayikla
const CONC=8, out=[];
async function work(sub){ for(const {a,m} of sub){
  const inf=info.get(m), p=prices[m]?.usdPrice; if(!inf||!p) continue;
  const mult=eff(inf.scaled); if(mult<=1) continue;
  let hist=[]; try{ hist=(await j(`${X}/assets/${encodeURIComponent(a.symbol)}/multiplier/history?network=Solana&page=0&pageSize=100`)).nodes??[] }catch{ continue }
  let divF=1, splitF=1, nDiv=0;
  for(const e of hist){ const r=e.multiplier/e.previousMultiplier;
    if(e.reason==="Dividend"){ divF*=r; nDiv++ } else splitF*=r }
  if(nDiv===0) continue;
  const floatUsd=(inf.supply/10**inf.dec)*mult*p;
  out.push({sym:a.symbol,floatUsd,divF,splitF,nDiv,hidden:floatUsd*(1-1/divF),yieldPct:(divF-1)*100});
} }
await Promise.all(Array.from({length:CONC},(_,i)=>work(list.filter((_,k)=>k%CONC===i))));

out.sort((x,y)=>y.hidden-x.hidden);
const totHidden=out.reduce((s,r)=>s+r.hidden,0), totFloat=out.reduce((s,r)=>s+r.floatUsd,0);
const totEvents=out.reduce((s,r)=>s+r.nDiv,0);
console.log(`\n=== SADECE TEMETTU (bolunmeler haric), ${out.length} varlik, ${totEvents} odeme`);
console.log(`  toplam pozisyon degeri  : $${Math.round(totFloat).toLocaleString('en-US')}`);
console.log(`  GORUNMEZ ODENEN TEMETTU : $${Math.round(totHidden).toLocaleString('en-US')}`);
console.log(`  ortalama getiri         : ${(totHidden/totFloat*100).toFixed(3)}%`);
console.log(`\n=== en cok gorunmez temettu odeyen 12`);
out.slice(0,12).forEach(r=>console.log(`  ${r.sym.padEnd(9)} $${Math.round(r.hidden).toLocaleString('en-US').padStart(9)}  ${r.nDiv} odeme  +${r.yieldPct.toFixed(3)}%  (float $${Math.round(r.floatUsd).toLocaleString('en-US')})`));
const withSplit=out.filter(r=>Math.abs(r.splitF-1)>0.01);
console.log(`\n=== bolunme de yasamis olanlar (uygulamada ayri gosterilmeli): ${withSplit.map(r=>r.sym+' x'+r.splitF.toFixed(2)).join(', ')||'yok'}`);
