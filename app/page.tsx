import Search from "./Search";

export default function Home() {
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
        <p>
          ExDate reads that hidden record and turns it into a statement: what you were
          actually paid, when the next payment lands, and whether the token is really backed.
        </p>
        <Search />
      </section>

      <div className="stats">
        <div className="stat">
          <div className="k">Tokenized assets</div>
          <div className="v">832</div>
          <div className="note">live on Solana</div>
        </div>
        <div className="stat">
          <div className="k">Scheduled payouts</div>
          <div className="v">539</div>
          <div className="note">none of them in your wallet</div>
        </div>
        <div className="stat">
          <div className="k">Apple, since launch</div>
          <div className="v pos">+0.33%</div>
          <div className="note">paid invisibly over 5 events</div>
        </div>
        <div className="stat">
          <div className="k">Trackers showing it</div>
          <div className="v dim">0</div>
          <div className="note">wallets, explorers, portfolios</div>
        </div>
      </div>

      <div className="section-title">How the payment hides</div>
      <div className="card">
        <p style={{ margin: "0 0 14px", fontSize: 14.5, lineHeight: 1.6, color: "var(--muted)" }}>
          Token-2022 stores the scaling factor in two fields. The one literally named{" "}
          <code style={{ fontFamily: "var(--mono)", color: "var(--text)" }}>multiplier</code> is the
          old value. <code style={{ fontFamily: "var(--mono)", color: "var(--text)" }}>newMultiplier</code>{" "}
          takes over once its timestamp passes, and the chain never rewrites the old one.
          Read the obvious field and every balance you show is wrong.
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
          AAPLx, measured on mainnet. For a cash dividend the error is 0.06%. For a 10:1
          split it is 10x.
        </p>
      </div>
    </>
  );
}
