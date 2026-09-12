import { marketSummary } from "@/lib/report";
import Sym from "@/app/Sym";
import { fetchUpcoming } from "@/lib/xstocks";
import { day, num, pct, usd } from "@/lib/fmt";
import market from "@/data/market.json";

export const revalidate = 900;

export const metadata = {
  title: "Calendar — ExDate",
  description:
    "Every scheduled corporate action on tokenized US stocks on Solana, filtered to the ones that have not already happened.",
};

export default async function CalendarPage() {
  const live = await fetchUpcoming().catch(() => null);
  const summary = await marketSummary().catch(() => null);

  const now = Date.now();
  const future = (
    live
      ? live
          .filter((c) => +new Date(c.effectiveTimeUtc) > now)
          .sort((a, b) => +new Date(a.effectiveTimeUtc) - +new Date(b.effectiveTimeUtc))
          .map((c) => ({
            symbol: c.xstockSymbol,
            at: c.effectiveTimeUtc,
            type: c.caType,
            grossUsd: c.grossCashflowUsd,
            netUsd: c.netCashflowUsd,
            withholding: c.withholdingTaxRate,
            status: c.status,
          }))
      : market.upcoming
  ) as typeof market.upcoming;

  const served = live ? live.length : null;

  return (
    <>
      <h1>Corporate action calendar</h1>

      <p className="standfirst">
        Every dividend and corporate action the issuer has scheduled on tokenized US stocks, with
        the date each one raises the multiplier. When an event activates, every holder&apos;s balance
        changes at that moment and no transaction is recorded.
      </p>

      {served ? (
        <div className="figure">
          <div className="figure__label">Genuinely ahead</div>
          <div className="figure__value">{future.length}</div>
          <hr className="figure__rule" />
          <p className="figure__context">
            The issuer&apos;s forward feed returns <b>{served}</b> rows, but{" "}
            <b>{served - future.length}</b> of them activated already and are still being served as
            upcoming. Everything below has a date in the future, checked against the clock on every
            request.
          </p>
        </div>
      ) : null}

      <section className="section">
        <div className="section__head">
          <h2 className="section__title">Scheduled</h2>
          <span className="section__meta">
            {future.length} events{summary?.nextEvent ? ` · next on ${day(summary.nextEvent.at)}` : ""}
          </span>
        </div>
        <div className="section__body">
          {future.length ? (
            <div className="tw">
              <table className="dt">
                <colgroup>
                  <col style={{ width: "112px" }} />
                  <col style={{ width: "124px" }} />
                  <col />
                  <col style={{ width: "104px" }} />
                  <col style={{ width: "104px" }} />
                  <col style={{ width: "120px" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Symbol</th>
                    <th>Action</th>
                    <th>Gross</th>
                    <th>Withholding</th>
                    <th>Net per share</th>
                  </tr>
                </thead>
                <tbody>
                  {future.map((c, i) => (
                    <tr key={`${c.symbol}-${i}`}>
                      <td>{day(c.at)}</td>
                      <td>
                        <Sym symbol={c.symbol} href={`/asset/${c.symbol}`} />
                      </td>
                      <td className="muted">{c.type.replace(/([a-z])([A-Z])/g, "$1 $2")}</td>
                      <td>{c.grossUsd ? usd(Number(c.grossUsd), 5) : "—"}</td>
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
          ) : (
            <div className="empty">
              <p className="empty__main">Nothing is scheduled ahead of today.</p>
              <p className="empty__sub">
                Read what has already been paid in the <a href="/assets">asset index</a>.
              </p>
            </div>
          )}
        </div>
      </section>

      <ol className="notes">
        <li>
          Read live from the issuer&apos;s forward feed on every request, then filtered against the
          clock. The feed itself does not filter, which is why a count taken from it directly is
          roughly fourteen times too large.
        </li>
        <li>
          Withholding is published as a fraction and shown here as a percentage. A rate of 0.3 in the
          feed is thirty per cent, confirmed against events where both the gross and the net amount
          are given.
        </li>
        <li>
          A payout raises the multiplier at the stated moment. The issuer asks venues to pause
          trading for roughly fifteen minutes around each activation.
        </li>
      </ol>

      <p className="disclaimer">
        Read-only. Not investment advice, and not affiliated with Backed Finance or the Solana
        Foundation. Dates are UTC, as published by the issuer.
      </p>
    </>
  );
}
