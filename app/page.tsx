import Search from "./Search";
import Sym from "./Sym";
import StepChart from "./StepChart";
import { marketSummary } from "@/lib/report";
import { day, num, pct, usd } from "@/lib/fmt";
import market from "@/data/market.json";


export const revalidate = 900;

export default async function Home() {
  const live = await marketSummary().catch(() => null);
  const m = market;
  const asOf = day(m.measuredAt);
  const assetCount = live?.assetCount ?? m.assetCount;

  return (
    <>
      <h1>Dividends paid by tokenized US stocks on Solana</h1>

      <p className="standfirst">
        xStocks do not pay dividends in cash. They pay by raising a Token-2022 multiplier, so the
        number of tokens in a wallet never changes and the balance quietly becomes worth more. No
        wallet, explorer or portfolio tracker on Solana reports that this happened.
      </p>

      <Search />

      <div className="figure">
        <div className="figure__label">Paid into Solana wallets without a transaction</div>
        <div className="figure__value">{usd(m.totalHiddenUsd, 0)}</div>
        <hr className="figure__rule" />
        <p className="figure__context">
          Across <b>{m.dividendPayments} dividends</b> on {m.assetsPricedAndPaying} tokenized stocks,
          measured against {usd(m.totalFloatUsd, 0)} of positions as of {asOf}. Splits are excluded:
          they raise the multiplier without paying anyone.
        </p>
        <StepChart
          points={m.cumulative.map((p) => ({
            at: p.month,
            value: p.usd,
            label: `${p.monthCount} ${p.monthCount === 1 ? "payment" : "payments"} that month`,
          }))}
          format="usd"
          height={200}
          caption="Cumulative dividends paid into Solana wallets, month by month. Each step is the day a multiplier changed."
        />
      </div>

      <div className="band">
        <div>
          <div className="stat__label">Tokenized assets</div>
          <div className="stat__value">{num(assetCount, 0)}</div>
          <div className="stat__note">issued on Solana by Backed</div>
        </div>
        <div>
          <div className="stat__label">Average payout</div>
          <div className="stat__value">{pct((m.totalHiddenUsd / m.totalFloatUsd) * 100, 3)}</div>
          <div className="stat__note">of position value, across paying assets</div>
        </div>
        <div>
          <div className="stat__label">Payments recorded</div>
          <div className="stat__value">{num(m.dividendPayments, 0)}</div>
          <div className="stat__note">dividend events since June 2025</div>
        </div>
      </div>

      <section className="section">
        <div className="section__head">
          <h2 className="section__title">Largest payers</h2>
          <span className="section__meta">
            8 of {num(assetCount, 0)} · as of {asOf}
          </span>
        </div>
        <div className="section__body">
          <div className="tw">
            <table className="dt">
              <colgroup>
                <col style={{ width: "124px" }} />
                <col />
                <col style={{ width: "88px" }} />
                <col style={{ width: "124px" }} />
                <col style={{ width: "140px" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Company</th>
                  <th>Payments</th>
                  <th>Yield</th>
                  <th>Paid (USD)</th>
                </tr>
              </thead>
              <tbody>
                {m.topPayers.slice(0, 8).map((p) => (
                  <tr key={p.symbol}>
                    <td>
                      <Sym symbol={p.symbol} href={`/asset/${p.symbol}`} />
                    </td>
                    <td className="muted">{p.name.replace(/ xStock$/, "")}</td>
                    <td>{p.dividends}</td>
                    <td>{pct(p.yieldPct, 3)}</td>
                    <td>{usd(p.hiddenUsd ?? 0, 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="section__after">
            <a href="/assets">View all assets</a>
          </p>
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <h2 className="section__title">Next scheduled</h2>
          <span className="section__meta">
            {live?.scheduledCount ?? m.upcomingCount} events ahead
          </span>
        </div>
        <div className="section__body">
          <div className="tw">
            <table className="dt">
              <colgroup>
                <col style={{ width: "112px" }} />
                <col style={{ width: "124px" }} />
                <col />
                <col style={{ width: "110px" }} />
                <col style={{ width: "130px" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Symbol</th>
                  <th>Action</th>
                  <th>Withholding</th>
                  <th>Net per share</th>
                </tr>
              </thead>
              <tbody>
                {m.upcoming.slice(0, 8).map((c, i) => (
                  <tr key={`${c.symbol}-${i}`}>
                    <td>{day(c.at)}</td>
                    <td>
                      <Sym symbol={c.symbol} href={`/asset/${c.symbol}`} />
                    </td>
                    <td className="muted">{c.type.replace(/([a-z])([A-Z])/g, "$1 $2")}</td>
                    <td>
                      {c.withholding && Number(c.withholding) > 0
                        ? pct(Number(c.withholding) * 100, 0)
                        : "None"}
                    </td>
                    <td>{c.netUsd ? usd(Number(c.netUsd), 5) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="section__after">
            <a href="/calendar">View the full calendar</a>
          </p>
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <h2 className="section__title">A split is not a dividend</h2>
          <span className="section__meta">{m.splits.length} of {m.assetsWithMultiplierChange}</span>
        </div>
        <div className="section__body">
          <p className="prose">
            Of the {m.assetsWithMultiplierChange} assets whose multiplier has moved, {m.splits.length}{" "}
            moved because the underlying stock split rather than because anyone was paid. A split
            raises the multiplier and cuts the share price by the same factor, so the position is
            worth what it was a second earlier.
          </p>
          <div className="tw">
            <table className="dt dt--compact">
              <colgroup>
                <col />
                <col style={{ width: "180px" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Reading</th>
                  <th>Figure</th>
                </tr>
              </thead>
              <tbody>
                <tr className="is-void">
                  <td>
                    <span className="status">Incorrect</span> NFLXx&apos;s 10:1 split counted as income
                  </td>
                  <td>
                    <span className="strike">$105,863,078</span>
                  </td>
                </tr>
                <tr>
                  <td>What holders actually received</td>
                  <td>$0</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="section__after muted">
            Netflix split ten for one on 16 Nov 2025. Every figure on this site counts dividends
            only; splits appear in the history marked as no gain.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <h2 className="section__title">How the payment hides</h2>
          <span className="section__meta">AAPLx, read from mainnet</span>
        </div>
        <div className="section__body">
          <p className="prose">
            Token-2022 stores the scaling factor in two fields. The one named{" "}
            <code className="lit">multiplier</code> is the old value.{" "}
            <code className="lit">newMultiplier</code> takes over once its timestamp passes, and the
            chain never rewrites the old one. Read the obvious field and every balance shown is wrong.
          </p>
          <div className="tw">
            <table className="dt dt--compact">
              <colgroup>
                <col />
                <col style={{ width: "180px" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Reading</th>
                  <th>Figure</th>
                </tr>
              </thead>
              <tbody>
                <tr className="is-void">
                  <td>
                    <span className="status">Stale</span> the field named{" "}
                    <code className="lit">multiplier</code>
                  </td>
                  <td>
                    <span className="strike lit">1.0026642076</span>
                  </td>
                </tr>
                <tr>
                  <td>Actually in force</td>
                  <td className="lit">1.0032690125</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="section__after muted">
            For a cash dividend the error is 0.06%. For a ten-for-one split it is ten times.
          </p>
        </div>
      </section>

      <ol className="notes">
        <li>
          Aggregate figures were measured on {asOf} across all {num(m.assetCount, 0)} assets by
          reading each mint account on Solana mainnet and each payout record from the issuer. Asset
          and wallet pages read live on every request.
        </li>
        <li>
          Position values use the issuer&apos;s Solana supply, which includes tokens minted but never
          issued, so the dollar totals are an upper bound on what reached public wallets.
        </li>
        <li>
          Dividends are credited as growth in the number of tokens, not as cash. USD figures value
          that growth at today&apos;s price and therefore move with the underlying stock.
        </li>
      </ol>

      <p className="disclaimer">
        Read-only. No wallet connection, no transactions, no custody. Data from the xStocks public
        API, Solana mainnet RPC and Jupiter. Not investment advice, and not affiliated with Backed
        Finance, Ondo or the Solana Foundation.
      </p>
    </>
  );
}
