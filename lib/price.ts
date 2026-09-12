// Jupiter Price API v3. Keyless tier verified working 2026-09-12.
const JUP = "https://lite-api.jup.ag/price/v3";

export type Price = { usdPrice: number; priceChange24h?: number; liquidity?: number };

export async function fetchPrices(mints: string[]): Promise<Record<string, Price>> {
  const out: Record<string, Price> = {};
  for (let i = 0; i < mints.length; i += 50) {
    const chunk = mints.slice(i, i + 50);
    try {
      const res = await fetch(`${JUP}?ids=${chunk.join(",")}`, {
        headers: { accept: "application/json" },
        next: { revalidate: 60 },
      });
      if (!res.ok) continue;
      const j = (await res.json()) as Record<string, Price>;
      Object.assign(out, j);
    } catch {
      /* price is best-effort; the report still works without it */
    }
  }
  return out;
}
