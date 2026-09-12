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
      <div className="masthead">
        <div>
          <h1>Tokenized stocks pay dividends invisibly</h1>
          <p className="standfirst">
            Nothing arrives in your wallet. The token count never changes, and nothing tells you
            which payment moved your balance, what it was worth, or when the next one lands.
          </p>
          <Search />
        </div>

        <div className="masthead__proof">
          <div className="figure__label">Paid, unannounced</div>
          <div className="figure__value">{usd(m.totalHiddenUsd, 0)}</div>
          <p className="note">
            {m.dividendPayments} payments
            <br />
            {m.assetsPricedAndPaying} stocks
            <br />
            as of {asOf}
          </p>
        </div>
      </div>

      <div className="figure">
        <div className="figure__label">How that total accumulated</div>
        <hr className="figure__rule" />
        <p className="figure__context">
          Every step is a day a stock paid its holders, valued against{" "}
          {usd(m.totalFloatUsd, 0)} of tokens in public hands. Splits are excluded: they multiply
          the token count without paying anyone.
          {m.leader ? (
            <>
              {" "}
              <b>
                {pct(m.leader.share * 100, 0)} of the total is one instrument, {m.leader.symbol}
              </b>
              , a variable-rate preferred that pays like a bond rather than a stock. The other{" "}
              {m.assetsPricedAndPaying - 1} stocks come to {usd(m.restUsd, 0)} between them, and the
              typical one has paid {pct(m.medianYieldPct, 3)} of its value since launch.
            </>
          ) : null}
        </p>
        <StepChart
          points={m.cumulative.map((p) => ({
            at: p.month,
            value: p.usd,
            label: `${p.monthCount} ${p.monthCount === 1 ? "payment" : "payments"} that month`,
          }))}
          format="usd"
          height={200}
          caption="Every dividend ever paid into a Solana wallet, added up month by month."
        />
      </div>

      <div className="band">
        <div>
          <div className="stat__label">Tokenized assets</div>
          <div className="stat__value">{num(assetCount, 0)}</div>
          <div className="stat__note">issued on Solana by Backed</div>
        </div>
        <div>
          <div className="stat__label">Typical stock has paid</div>
          <div className="stat__value">{pct(m.medianYieldPct, 3)}</div>
          <div className="stat__note">
            of its own value since launch, median across the {m.assetsPricedAndPaying} payers we
            can price
          </div>
        </div>
        <div>
          <div className="stat__label">Payments recorded</div>
          <div className="stat__value">{num(m.dividendPaymentsAll, 0)}</div>
          <div className="stat__note">
            across {m.assetsEverPaid} stocks since June 2025. Counting a payment does not need a
            price, so this is every one that reached a holder.
          </div>
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
                  <th>Growth since launch</th>
                  <th>Paid out (USD)</th>
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
          <h2 className="section__title">Payments actually still to come</h2>
          <span className="section__meta">
            {live?.scheduledCount ?? m.upcomingCount}, checked against the clock just now
          </span>
        </div>
        <div className="section__body">
          <p className="prose">
            The issuer&apos;s own feed lists {m.feedRows} payments as upcoming. Only{" "}
            {live?.scheduledCount ?? m.upcomingCount} of them are: {m.feedAlreadyActivated} already
            happened and are still being served as future, {m.feedRows - m.feedDistinct} are the
            same payment listed twice, and {m.feedUndated} have no date on them at all. Every row
            here is checked against the clock on every request, which is why this number is a
            fourteenth of the one the feed reports.
          </p>
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
                  <th>US tax withheld</th>
                  <th>You receive, per token</th>
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
          <h2 className="section__title">Where these numbers come from</h2>
        </div>
        <div className="section__body">
          <p className="prose">
            Every figure here is read from Solana and from the issuer&apos;s own records. The issuer
            publishes the events; what nobody does is join them to a wallet.{" "}
            <a href="/method">How this works</a> states each source, what the numbers deliberately
            exclude, and what we checked before claiming any of it.
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
          Dollar figures value the tokens the issuer reports as circulating, its own published
          number, which covers every chain each token is issued on. An earlier version valued the
          whole mint including the tokens the issuer created and never sold, and that overstated
          the total roughly sevenfold.
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
