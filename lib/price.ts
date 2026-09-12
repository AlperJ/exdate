// Jupiter Price API v3. Keyless tier, verified working 2026-09-13.
const JUP = "https://lite-api.jup.ag/price/v3";

export type Price = {
  /** What the position is worth. See the note below for which input this is. */
  usdPrice: number;
  /** The underlying equity's price, as Jupiter reports it. */
  stockPrice: number | null;
  /** The DEX quote, kept so a divergence can be shown rather than hidden. */
  dexPrice: number | null;
  liquidity: number | null;
  /** True when the DEX quote was rejected in favour of the underlying. */
  quoteRejected: boolean;
};

/**
 * Which price to trust.
 *
 * A tokenized stock is a claim on one real share, so the underlying equity's price is
 * the right valuation input and the DEX quote is only meaningful where something
 * actually trades. Most xStocks sit in pools with no depth at all: 37 of the 65 assets
 * carrying the headline have under $1,000 of liquidity behind their quote, which is
 * exactly why the broken ones never correct themselves.
 *
 * Measured on 2026-09-13, PYPLx quoted $3,337.04 against PayPal's $53.94 on a pool
 * holding five cents. That single row was 16.4% of the site's headline figure and was
 * overstated roughly sixty-two fold. Six other assets were more than 30% off.
 *
 * Jupiter returns the underlying price in `stockData` in the very same payload, so the
 * correction needs no extra request. Prefer it; fall back to the DEX quote only when
 * the underlying is missing.
 */
const DIVERGENCE_LIMIT = 0.3; // 30% away from the underlying is a broken quote, not drift

type JupRow = {
  usdPrice?: number;
  liquidity?: number;
  stockData?: { price?: number };
};

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
      const j = (await res.json()) as Record<string, JupRow>;

      for (const [mint, row] of Object.entries(j)) {
        const dex = Number.isFinite(row?.usdPrice) ? (row.usdPrice as number) : null;
        const stock = Number.isFinite(row?.stockData?.price) ? (row.stockData!.price as number) : null;
        if (dex === null && stock === null) continue;

        const diverges =
          dex !== null && stock !== null && stock > 0
            ? Math.abs(dex / stock - 1) > DIVERGENCE_LIMIT
            : false;

        out[mint] = {
          usdPrice: stock ?? (dex as number),
          stockPrice: stock,
          dexPrice: dex,
          liquidity: Number.isFinite(row?.liquidity) ? (row.liquidity as number) : null,
          quoteRejected: diverges,
        };
      }
    } catch {
      /* price is best-effort; the report still works without it */
    }
  }
  return out;
}
