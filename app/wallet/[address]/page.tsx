import { buildReport } from "@/lib/report";
import { usd, num, pct, day, short } from "@/lib/fmt";
import Search from "../../Search";

export const revalidate = 120;

export default async function WalletPage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;

  let r;
  try {
    r = await buildReport(address);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return (
      <Shell q={address}>
        <div className="err">
          {/-32602|Invalid param|base58/i.test(msg)
            ? "That does not look like a Solana address."
            : `Could not read this wallet: ${msg}`}
          {/429|Too many/i.test(msg) ? (
            <div style={{ marginTop: 8, color: "var(--faint)", fontSize: 12.5 }}>
              The public RPC is rate limiting. Set SOLANA_RPC_URL to a dedicated endpoint.
            </div>
          ) : null}
        </div>
      </Shell>
    );
  }

  if (!r.positions.length) {
    return (
      <Shell q={address}>
        <div className="card" style={{ marginTop: 22 }}>
          <div className="ticker">Nothing to report</div>
          <p style={{ color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6, margin: "10px 0 0" }}>
            <code style={{ fontFamily: "var(--mono)" }}>{short(address)}</code> holds no xStocks.
            You can still look up any ticker to see what it has paid its holders.
          </p>
        </div>
      </Shell>
    );
  }

  const t = r.totals;

  return (
    <Shell q={address}>
      <div className="headline">
        <div className="label">Paid to this wallet, never announced</div>
        <div className="big">{usd(t.dividendUsd)}</div>
        <div className="under">
          Across {t.dividendCount} {t.dividendCount === 1 ? "payment" : "payments"} on the{" "}
          {t.itemised} largest of {t.positionCount}{" "}
          {t.positionCount === 1 ? "position" : "positions"}, together worth {usd(t.valueUsd)}. No
          transaction, no notification, no line in any explorer.
        </div>
      </div>

      {Math.abs(t.hiddenUsd) > 0.005 ? (
        <div className="card">
          <div className="card-head">
            <span className="pill warn">balance mismatch</span>
          </div>
          <p style={{ margin: "10px 0 0", fontSize: 14, color: "var(--muted)", lineHeight: 1.6 }}>
            An integration reading the stale <code style={{ fontFamily: "var(--mono)" }}>multiplier</code>{" "}
            field would understate this wallet by <b>{usd(Math.abs(t.hiddenUsd))}</b> right now.
          </p>
        </div>
      ) : null}

      {r.positions.map((p) => (
        <div className="card" key={p.mint}>
          <div className="card-head">
            {p.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.logo} alt="" width={30} height={30} style={{ borderRadius: 7 }} />
            ) : null}
            <div>
              <div className="ticker">{p.symbol}</div>
              <div className="sub">
                {num(p.trueBalance, 6)} tokens
                {p.valueUsd !== null ? ` · ${usd(p.valueUsd)}` : ""}
              </div>
            </div>
            <div className="spacer" />
            <a className="pill" href={`/asset/${p.symbol}`}>
              asset view →
            </a>
          </div>

          <div className="stats" style={{ margin: "16px 0 0" }}>
            <div className="stat">
              <div className="k">Dividends received</div>
              <div className="v pos">{p.totalUsdGained ? usd(p.totalUsdGained) : "—"}</div>
              <div className="note">+{num(p.totalSharesGained, 6)} {p.symbol}</div>
            </div>
            <div className="stat">
              <div className="k">Payments</div>
              <div className="v">{p.paid.length}</div>
              <div className="note">
                {p.heldSince ? `held since ${day(p.heldSince)}` : "full history shown"}
              </div>
            </div>
            <div className="stat">
              <div className="k">Backing</div>
              <div className={`v ${p.reserves && p.reserves.ratio >= 1 ? "pos" : "warn"}`}>
                {p.reserves ? pct(p.reserves.ratio * 100) : "—"}
              </div>
              <div className="note">{p.reserves ? p.reserves.providers.join(", ") : "unavailable"}</div>
            </div>
          </div>

          {p.paid.length ? (
            <div className="timeline" style={{ marginTop: 16 }}>
              {[...p.paid].reverse().map((e, i) => (
                <div className="row" key={`${p.mint}-${i}`}>
                  <div className="date">{day(e.date)}</div>
                  <div className="what">
                    <b>{e.reason}</b>
                    <span className="mult">
                      {e.from.toFixed(9)} → {e.to.toFixed(9)}
                    </span>
                  </div>
                  <div className="amt">
                    +{num(e.sharesGained, 6)}
                    {e.usdGained ? <small>{usd(e.usdGained)}</small> : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty">No payout has landed since this wallet started holding.</div>
          )}
        </div>
      ))}

      <ul className="notes">
        {r.notes.map((n, i) => (
          <li key={i}>{n}</li>
        ))}
        <li>
          Per-payment figures assume the balance was unchanged since acquisition. Buying or
          selling between events shifts the real number.
        </li>
      </ul>
    </Shell>
  );
}

function Shell({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <>
      <div style={{ paddingTop: 26 }}>
        <Search initial={q} />
      </div>
      {children}
    </>
  );
}
