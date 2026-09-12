import { buildReport } from "@/lib/report";
import { usd, time } from "@/lib/fmt";
import Positions from "./Positions";

export const revalidate = 120;

export default async function WalletPage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;

  let r;
  try {
    r = await buildReport(address);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const badAddress = /-32602|Invalid param|base58|WrongSize/i.test(msg);
    const throttled = /429|Too many|rate limit/i.test(msg);
    return (
      <div className="notice">
        <div className="notice__head">
          {badAddress ? "That is not a Solana address" : "This wallet could not be read"}
        </div>
        <div className="notice__body">
          {badAddress ? (
            <>
              A wallet address is 32 to 44 base58 characters. To look up a stock instead, type its
              ticker, such as <a href="/asset/AAPL">AAPL</a>.
            </>
          ) : throttled ? (
            <>The RPC endpoint is rate limiting this lookup. Try again in a few seconds.</>
          ) : (
            <span className="lit">{msg}</span>
          )}
        </div>
      </div>
    );
  }

  const t = r.totals;

  if (!r.positions.length) {
    return (
      <>
        <div className="ident">
          <div>
            <h1>Wallet statement</h1>
            <div className="ident__sub lit">{address}</div>
          </div>
        </div>
        <div className="empty">
          <p className="empty__main">This wallet holds no tokenized stocks.</p>
          <p className="empty__sub">
            Nothing has been paid to it and nothing is hidden in its balances. You can still read
            what any stock has paid its holders, such as <a href="/asset/AAPL">AAPL</a>, or browse
            the <a href="/assets">full asset index</a>.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="ident">
        <div>
          <h1>Wallet statement</h1>
          <div className="ident__sub lit">{address}</div>
        </div>
        <div className="ident__end">
          <div className="ident__sub">
            {t.positionCount} {t.positionCount === 1 ? "position" : "positions"} ·{" "}
            {usd(t.valueUsd, 0)} · read at {time(r.generatedAt)} UTC
          </div>
        </div>
      </div>

      <div className="figure">
        <div className="figure__label">Received without a transaction</div>
        <div className="figure__value">{usd(t.dividendUsd)}</div>
        <hr className="figure__rule" />
        <p className="figure__context">
          Across <b>{t.dividendCount}</b> {t.dividendCount === 1 ? "payment" : "payments"} on the{" "}
          {t.itemised} largest of {t.positionCount}{" "}
          {t.positionCount === 1 ? "position" : "positions"}, together worth {usd(t.valueUsd, 0)}.
          None of it produced a transaction, a notification, or a line in any explorer.
        </p>
      </div>

      <div className="band">
        <div>
          <div className="stat__label">Payments</div>
          <div className="stat__value">{t.dividendCount}</div>
          <div className="stat__note">dividends credited while held</div>
        </div>
        <div>
          <div className="stat__label">Positions paying</div>
          <div className="stat__value">
            {r.positions.filter((p) => p.paid.length > 0).length}
          </div>
          <div className="stat__note">of {t.itemised} itemised</div>
        </div>
        <div>
          <div className="stat__label">Understatement if read naively</div>
          <div className={`stat__value ${Math.abs(t.hiddenUsd) > 0.005 ? "is-warn" : ""}`}>
            {Math.abs(t.hiddenUsd) > 0.005 ? usd(Math.abs(t.hiddenUsd)) : "—"}
          </div>
          <div className="stat__note">see note 1</div>
        </div>
      </div>

      <section className="section">
        <div className="section__head">
          <h2 className="section__title">Positions</h2>
          <span className="section__meta">
            {t.itemised} of {t.positionCount}, by amount received
          </span>
        </div>
        <div className="section__body">
          <Positions positions={r.positions} />
        </div>
      </section>

      <ol className="notes">
        <li>
          An integration reading the field named <span className="lit">multiplier</span> instead of
          the one in force would understate this wallet by the amount shown. The chain leaves the old
          value in place after a corporate action activates.
        </li>
        {r.notes.map((n, i) => (
          <li key={i}>{n}</li>
        ))}
        <li>
          Per-payment figures assume the balance was unchanged since the position was acquired.
          Buying or selling between events shifts the real number.
        </li>
      </ol>

      <p className="disclaimer">
        Read-only. No wallet connection, no transactions, no custody. Addresses are read from public
        Solana state and nothing is stored. Not investment advice, and not affiliated with Backed
        Finance or the Solana Foundation.
      </p>
    </>
  );
}
