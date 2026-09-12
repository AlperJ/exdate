import Search from "./Search";
import { marketSummary } from "@/lib/report";
import { day, num, pct, usd } from "@/lib/fmt";
import market from "@/data/market.json";

export const revalidate = 900;

export default async function Home() {
  const live = await marketSummary().catch(() => null);
  const m = market;

  return (
    <>
      <section className="hero">
        <h1>
          Your tokenized stocks paid you.
          <br />
          <em>Nobody told you.</em>
        </h1>
        <p>
          xStocks on Solana do not pay dividends in cash. They pay by quietly raising a
          multiplier on the token. Your token count never changes. Your balance just
          silently becomes worth more, and nothing in your wallet says it happened.
        </p>
        <Search />
      </section>

      <div className="headline">
        <div className="label">Paid into Solana wallets, unannounced</div>
        <div className="big">{usd(m.totalHiddenUsd, 0)}</div>
        <div className="under">
          Across {m.dividendPayments} dividends on {m.assetsPricedAndPaying} tokenized stocks,
          against {usd(m.totalFloatUsd, 0)} of positions. Every one of them landed as a silent
          multiplier change. Not one produced a transaction, a notification, or a line in any
          explorer.
        </div>
      </div>

      <div className="stats">
        <div className="stat">
          <div className="k">Tokenized assets</div>
          <div className="v">{num(live?.assetCount ?? m.assetCount, 0)}</div>
          <div className="note">live on Solana</div>
        </div>
        <div className="stat">
          <div className="k">Average payout</div>
          <div className="v pos">{pct((m.totalHiddenUsd / m.totalFloatUsd) * 100, 3)}</div>
          <div className="note">of position value, invisible</div>
        </div>
        <div className="stat">
          <div className="k">Next one lands</div>
          <div className="v pos" style={{ fontSize: 16 }}>
            {live?.nextEvent ? day(live.nextEvent.at) : m.upcoming[0] ? day(m.upcoming[0].at) : "—"}
          </div>
          <div className="note">
            {live?.nextEvent?.symbol ?? m.upcoming[0]?.symbol ?? "checking"}, one of{" "}
            {live?.scheduledCount ?? m.upcomingCount} scheduled
          </div>
        </div>
        <div className="stat">
          <div className="k">Trackers showing it</div>
          <div className="v dim">0</div>
          <div className="note">wallets, explorers, portfolios</div>
        </div>
      </div>

      <div className="section-title">Who has paid the most, silently</div>
      <div className="card">
        <div className="timeline">
          {m.topPayers.slice(0, 8).map((p) => (
            <a
              className="row"
              key={p.symbol}
              href={`/asset/${p.symbol}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div className="date" style={{ fontWeight: 600, color: "var(--text)" }}>
                {p.symbol}
              </div>
              <div className="what">
                <b>{p.name.replace(/ xStock$/, "")}</b>
                <span className="mult">
                  {p.dividends} {p.dividends === 1 ? "payment" : "payments"} · {pct(p.yieldPct, 3)}{" "}
                  of position value
                  {p.lastPaid ? ` · last ${day(p.lastPaid)}` : ""}
                </span>
              </div>
              <div className="amt">{usd(p.hiddenUsd ?? 0, 0)}</div>
            </a>
          ))}
        </div>
      </div>

      <div className="section-title">A split is not a dividend</div>
      <div className="card">
        <p style={{ margin: "0 0 14px", fontSize: 14.5, lineHeight: 1.6, color: "var(--muted)" }}>
          Of the {m.assetsWithMultiplierChange} assets whose multiplier has moved, {m.splits.length}{" "}
          moved because the underlying stock split, not because anyone was paid. A split raises the
          multiplier and cuts the share price by the same factor, so the position is worth exactly
          what it was a second earlier.
        </p>
        <div className="compare">
          <div className="side wrong">
            <div className="k">Counting NFLXx&apos;s 10:1 split as income</div>
            <div className="v">$105,863,078</div>
          </div>
          <div className="arrow">→</div>
          <div className="side right">
            <div className="k">What holders actually received</div>
            <div className="v">$0</div>
          </div>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: "var(--faint)", lineHeight: 1.6 }}>
          Netflix split ten for one on 16 November 2025. Every figure on this site counts dividends
          only; splits appear in the timeline marked <b>no gain</b>.
        </p>
      </div>

      <div className="section-title">How the payment hides</div>
      <div className="card">
        <p style={{ margin: "0 0 14px", fontSize: 14.5, lineHeight: 1.6, color: "var(--muted)" }}>
          Token-2022 stores the scaling factor in two fields. The one literally named{" "}
          <code style={{ fontFamily: "var(--mono)", color: "var(--text)" }}>multiplier</code> is the
          old value.{" "}
          <code style={{ fontFamily: "var(--mono)", color: "var(--text)" }}>newMultiplier</code>{" "}
          takes over once its timestamp passes, and the chain never rewrites the old one. Read the
          obvious field and every balance you show is wrong.
        </p>
        <div className="compare">
          <div className="side wrong">
            <div className="k">Reading `multiplier`</div>
            <div className="v">1.0026642076</div>
          </div>
          <div className="arrow">→</div>
          <div className="side right">
            <div className="k">Actually in force</div>
            <div className="v">1.0032690125</div>
          </div>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: "var(--faint)", lineHeight: 1.6 }}>
          AAPLx, read from mainnet. For a cash dividend the error is 0.06%. For a 10:1 split it is
          ten times.
        </p>
      </div>

      <ul className="notes">
        <li>
          Aggregate figures measured on {day(m.measuredAt)} across all {m.assetCount} assets. Asset
          and wallet pages read live.
        </li>
        <li>
          Position values use the issuer&apos;s Solana supply, which includes tokens minted but not
          yet sold, so the dollar totals are an upper bound on what reached public wallets.
        </li>
      </ul>
    </>
  );
}
