import { buildReport } from "@/lib/report";
import { usd, time } from "@/lib/fmt";
import Positions from "./Positions";

/** What a Solana address can look like. Checking this costs nothing and saves a round trip. */
const ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export const revalidate = 120;

export async function generateMetadata({ params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;
  const short = `${address.slice(0, 4)}…${address.slice(-4)}`;
  if (!ADDRESS.test(address)) return { title: "Not a wallet address — ExDate" };
  const r = await buildReport(address).catch(() => null);
  if (!r) return { title: `Wallet ${short} — ExDate` };
  const paid = r.totals.dividendUsd;
  return {
    title: paid > 0
      ? `This wallet was paid ${usd(paid)} with no transaction — ExDate`
      : `Wallet ${short} has been paid nothing so far — ExDate`,
    description: `Every dividend ${short} received through a multiplier change, per position, with the balance it held on the day.`,
  };
}

export default async function WalletPage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;

  // Reading the chain for a string that cannot be an address spends ten seconds behind a
  // screen that says we are reading balances. The shape is knowable instantly, so say so.
  if (!ADDRESS.test(address)) {
    return (
      <div className="notice">
        <div className="notice__head">That is not a Solana wallet address</div>
        <div className="notice__body">
          An address is a long jumble of 32 to 44 letters and numbers, copied from a wallet app. If
          your tokens sit on an exchange you will not have one, so look up the stock instead: try{" "}
          <a href="/asset/AAPL">AAPL</a> or any other ticker.
        </div>
      </div>
    );
  }

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
              An address is a long jumble of 32 to 44 letters and numbers, copied from a wallet
              app. To look up a stock instead, type its ticker, such as{" "}
              <a href="/asset/AAPL">AAPL</a>.
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
        <div className="figure__label">
          {t.positionCount > t.itemised
            ? `Paid to the ${t.itemised} largest holdings, with no transaction`
            : "Paid to this wallet, with no transaction"}
        </div>
        <div className="figure__value">{usd(t.dividendUsd)}</div>
        <hr className="figure__rule" />
        <p className="figure__context">
          Across <b>{t.dividendCount}</b> {t.dividendCount === 1 ? "payment" : "payments"} on
          holdings worth <b>{usd(t.itemisedValueUsd, 0)}</b>. Nothing was sent, nothing was
          announced, and no explorer records any of it.
          {t.estimatedRows > 0 ? (
            <>
              {" "}
              <b>
                {t.estimatedRows} of those {t.dividendCount} rows are estimated
              </b>
              : those positions trade too often to establish what they held on the payment date,
              so the figure above will move between loads. The rows are marked below.
            </>
          ) : null}
          {t.positionCount > t.itemised ? (
            <>
              {" "}
              This wallet holds {t.positionCount} tokenized stocks in all, worth{" "}
              {usd(t.valueUsd, 0)}. The {t.positionCount - t.itemised} smaller ones are not listed
              here and are not counted in the figure above.
            </>
          ) : null}
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
          <div className="stat__label">Hidden from apps reading the old field</div>
          <div className={`stat__value ${Math.abs(t.hiddenUsd) > 0.005 ? "is-warn" : ""}`}>
            {Math.abs(t.hiddenUsd) > 0.005 ? usd(Math.abs(t.hiddenUsd)) : "—"}
          </div>
          <div className="stat__note">nothing is missing from the wallet</div>
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
          Nothing is missing from this wallet. A portfolio app that reads the old{" "}
          <span className="lit">multiplier</span> field instead of the one in force would value it
          that much too low, because the chain leaves the old value in place after a corporate
          action activates. The gap can exceed the dividend total, since it also includes splits,
          where the old field is wrong by whole multiples.
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
