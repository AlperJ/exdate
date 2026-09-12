const URL = process.env.RPCURL;
const TREASURY = "S7vYFFWH6BjJyEsdrPQpqpYTqLTrPRK6KW3VwsJuRaS";

async function rpc(method, params) {
  for (let a = 0; a < 5; a++) {
    const r = await fetch(URL, { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) });
    if (r.status === 429 || r.status >= 500) { await new Promise(s => setTimeout(s, 400 * 2 ** a)); continue; }
    const j = await r.json();
    if (j.error) throw new Error(JSON.stringify(j.error).slice(0, 140));
    return j.result;
  }
  throw new Error("rate limited");
}

export async function ownersOf(mint) {
  const owners = new Set();
  let cursor, pages = 0, accounts = 0;
  while (pages < 400) {
    const r = await rpc("getTokenAccounts", {
      mint, limit: 1000, ...(cursor ? { cursor } : {}), options: { showZeroBalance: false },
    });
    const list = r.token_accounts ?? [];
    for (const a of list) if (a.amount > 0 && a.owner !== TREASURY) owners.add(a.owner);
    accounts += list.length; pages++;
    if (!r.cursor || list.length === 0) break;
    cursor = r.cursor;
  }
  return { owners, accounts, pages };
}

if (process.argv[2]) {
  const t0 = Date.now();
  const { owners, accounts, pages } = await ownersOf(process.argv[2]);
  console.log(`${process.argv[3] || process.argv[2]}: ${owners.size} benzersiz cuzdan  (${accounts} token hesabi, ${pages} sayfa, ${((Date.now()-t0)/1000).toFixed(1)}s)`);
}
