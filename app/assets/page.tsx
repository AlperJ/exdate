import { day, num, pct, usd } from "@/lib/fmt";
import Sym from "@/app/Sym";
import market from "@/data/market.json";

export const revalidate = 900;

export const metadata = {
  title: "Assets — ExDate",
  description:
    "Every tokenized US stock on Solana whose multiplier has moved, with what it paid its holders and when.",
};

export default function AssetsPage() {
  const m = market;
  const rows = m.index;
  const paying = rows.filter((r) => r.dividends > 0);
  const splitOnly = rows.filter((r) => r.dividends === 0);

  return (
    <>
      <h1>Asset index</h1>

      <p className="standfirst">
        {num(m.assetCount, 0)} tokenized stocks are issued on Solana. The{" "}
        {num(m.assetsWithMultiplierChange, 0)} below have had their multiplier moved at least once,
        which means every holder&apos;s balance changed without a transaction.
      </p>

      <section className="section">
        <div className="section__head">
          <h2 className="section__title">Assets that have paid a dividend</h2>
          <span className="section__meta">
            {paying.length} assets · as of {day(m.measuredAt)}
          </span>
        </div>
        <div className="section__body">
          <div className="tw">
            <table className="dt">
              <colgroup>
                <col style={{ width: "124px" }} />
                <col />
                <col style={{ width: "88px" }} />
                <col style={{ width: "96px" }} />
                <col style={{ width: "112px" }} />
                <col style={{ width: "130px" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Company</th>
                  <th>Payments</th>
                  <th>Growth since launch</th>
                  <th>Last paid</th>
                  <th>Paid out (USD)</th>
                </tr>
              </thead>
              <tbody>
                {paying.map((r) => (
                  <tr key={r.symbol}>
                    <td>
                      <Sym symbol={r.symbol} href={`/asset/${r.symbol}`} />
                    </td>
                    <td className="muted">{r.name.replace(/ xStock$/, "")}</td>
                    <td>{r.dividends}</td>
                    <td>{pct(r.yieldPct, 3)}</td>
                    <td>{r.lastPaid ? day(r.lastPaid) : "—"}</td>
                    <td>{r.hiddenUsd !== null ? usd(r.hiddenUsd, 0) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {splitOnly.length ? (
        <section className="section">
          <div className="section__head">
            <h2 className="section__title">Assets whose multiplier moved without paying</h2>
            <span className="section__meta">{splitOnly.length} assets</span>
          </div>
          <div className="section__body">
            <p className="prose">
              A split or a reverse split changes the multiplier and the share price by the same
              factor. Holders of these tokens saw their balance change and received nothing.
            </p>
            <div className="tw">
              <table className="dt">
                <colgroup>
                  <col style={{ width: "124px" }} />
                  <col />
                  <col style={{ width: "112px" }} />
                  <col style={{ width: "130px" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Company</th>
                    <th>Ratio</th>
                    <th>Value held (USD)</th>
                  </tr>
                </thead>
                <tbody>
                  {splitOnly.map((r) => (
                    <tr key={r.symbol}>
                      <td>
                        <Sym symbol={r.symbol} href={`/asset/${r.symbol}`} />
                      </td>
                      <td className="muted">{r.name.replace(/ xStock$/, "")}</td>
                      <td className="muted">
                        {r.splitFactor >= 1
                          ? `${num(r.splitFactor, 2)}:1`
                          : `1:${num(1 / r.splitFactor, 2)}`}
                      </td>
                      <td>{r.floatUsd !== null ? usd(r.floatUsd, 0) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : null}

      <ol className="notes">
        <li>
          Measured on {day(m.measuredAt)} by reading every mint account on Solana mainnet and every
          payout record from the issuer. Growth since launch is everything a token has paid, compounded, since it was issued. It is
          not an annual yield: a stock listed earlier will show a bigger number for the same
          dividend. Splits are excluded.
        </li>
        <li>
          Assets with no live price on Jupiter show no USD figure. Their payout percentage is still
          exact, because it comes from the multiplier rather than from a price.
        </li>
      </ol>

      <p className="disclaimer">
        Read-only. Not investment advice, and not affiliated with Backed Finance or the Solana
        Foundation.
      </p>
    </>
  );
}
