import { buildAssetReport } from "@/lib/report";
import { usd, num, pct, day, short, until } from "@/lib/fmt";
import Search from "../../Search";

export const revalidate = 300;

export default async function AssetPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const sym = decodeURIComponent(symbol);

  let r;
  try {
    r = await buildAssetReport(sym);
  } catch (e) {
    return (
      <Shell q={sym}>
        <div className="err">
          Could not reach the data sources: {e instanceof Error ? e.message : String(e)}
        </div>
      </Shell>
    );
  }

  if (!r) {
    return (
      <Shell q={sym}>
        <div className="err">
          No xStock called <b>{sym}</b>. Tickers end in a lowercase x, like AAPLx or NVDAx.
        </div>
      </Shell>
    );
  }

  const paid = r.dividendCount;
  const per1k = r.perUnitGained * 1000;
  const per1kUsd = r.priceUsd ? per1k * r.priceUsd : null;
  const hasSplit = Math.abs(r.splitFactor - 1) > 0.001;

  return (
    <Shell q={r.symbol}>
      <div className="card-head" style={{ marginTop: 26 }}>
        {r.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={r.logo} alt="" width={34} height={34} style={{ borderRadius: 8 }} />
        ) : null}
        <div>
          <div className="ticker">{r.symbol}</div>
          <div className="sub">
            {r.name} · tracks {r.underlying}
            {r.priceUsd ? ` · ${usd(r.priceUsd)}` : ""}
          </div>
        </div>
        <div className="spacer" />
        {r.halted ? <span className="pill bad">trading halted</span> : <span className="pill good">live</span>}
      </div>

      {paid > 0 ? (
        <div className="headline">
          <div className="label">Paid invisibly since launch</div>
          <div className="big">{pct(r.totalGrowthPct)}</div>
          <div className="under">
            Across {paid} {paid === 1 ? "dividend" : "dividends"}, every holder&apos;s position grew
            by {pct(r.totalGrowthPct)} without a single notification. Anyone holding 1,000{" "}
            {r.symbol} since launch gained <b>{num(per1k, 4)} {r.symbol}</b>
            {per1kUsd !== null ? <> , worth <b>{usd(per1kUsd)}</b> today</> : null}.
            {hasSplit ? (
              <>
                {" "}
                This stock also split {r.splitFactor >= 1 ? `${num(r.splitFactor, 2)}:1` : `1:${num(1 / r.splitFactor, 2)}`},
                which multiplied the token count without changing what the position is worth.
                That is excluded from the figure above.
              </>
            ) : null}
          </div>
        </div>
      ) : hasSplit ? (
        <div className="headline" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
          <div className="label">Split, not a payout</div>
          <div className="big" style={{ color: "var(--text)" }}>
            {r.splitFactor >= 1 ? `${num(r.splitFactor, 0)}:1` : `1:${num(1 / r.splitFactor, 0)}`}
          </div>
          <div className="under">
            {r.symbol} has never paid a dividend on chain. Its multiplier sits at{" "}
            {r.effective.toFixed(4)} because the underlying stock split, which multiplied everyone&apos;s
            token count by {num(r.splitFactor, 2)} and cut the price by the same factor. A wallet
            showing {num(r.splitFactor, 0)}× more tokens after that date did not gain anything, and
            any tracker calling this income is wrong.
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="empty">
            No corporate action has been applied to {r.symbol} yet. Its multiplier is still 1.0,
            so nothing is hidden. Check back after the first dividend.
          </div>
        </div>
      )}

      <div className="stats">
        <div className="stat">
          <div className="k">Multiplier in force</div>
          <div className="v pos">{r.effective.toFixed(10)}</div>
          <div className="note">the number that is actually true</div>
        </div>
        <div className="stat">
          <div className="k">Stale `multiplier` field</div>
          <div className="v warn">{r.naive.toFixed(10)}</div>
          <div className="note">
            {Math.abs(r.driftPct) > 1e-9 ? `naive readers are off by ${pct(r.driftPct, 4)}` : "currently in sync"}
          </div>
        </div>
        <div className="stat">
          <div className="k">Circulating</div>
          <div className="v dim">{num(r.circulatingOnChain ?? r.supplyUnits, 0)}</div>
          <div className="note">
            {r.treasuryUnits
              ? `${num(r.treasuryUnits, 0)} more minted, held by the issuer`
              : "tokens, multiplier applied"}
          </div>
        </div>
        <div className="stat">
          <div className="k">Mint</div>
          <div className="v dim" style={{ fontSize: 13 }}>{short(r.mint)}</div>
          <div className="note">Token-2022</div>
        </div>
      </div>

      {r.pending ? (
        <div className="card" style={{ borderColor: "#3d2f0d", background: "#140f05" }}>
          <div className="card-head">
            <span className="pill warn">payout incoming</span>
            <div className="spacer" />
            <span className="sub">{until(r.pending.secondsAway)} away</span>
          </div>
          <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--muted)", lineHeight: 1.6 }}>
            The multiplier moves from <b>{r.pending.from.toFixed(9)}</b> to{" "}
            <b>{r.pending.to.toFixed(9)}</b> on {day(r.pending.activatesAt)}. Every balance rises by{" "}
            {pct((r.pending.to / r.pending.from - 1) * 100, 4)} at that moment. The issuer asks
            venues to pause trading for about 15 minutes around it.
          </p>
        </div>
      ) : null}

      {r.history.length > 0 ? (
        <>
          <div className="section-title">Every multiplier change, per 1,000 {r.symbol} held</div>
          <div className="card">
            <div className="timeline">
              {[...r.history].reverse().map((e) => {
                const income = e.reason.trim().toLowerCase() === "dividend";
                const g = 1000 * (e.multiplier - e.previousMultiplier);
                const ratio = e.previousMultiplier > 0 ? e.multiplier / e.previousMultiplier : 1;
                return (
                  <div className="row" key={e.id}>
                    <div className="date">{day(e.activationDateTime)}</div>
                    <div className="what">
                      <b>{e.reason.replace(/([a-z])([A-Z])/g, "$1 $2")}</b>
                      <span className="mult">
                        {e.previousMultiplier.toFixed(9)} → {e.multiplier.toFixed(9)}
                        {income ? "" : `  ·  ×${num(ratio, 2)}, price moved the opposite way`}
                      </span>
                    </div>
                    <div className="amt" style={income ? undefined : { color: "var(--faint)" }}>
                      {income ? `+${num(g, 4)}` : `+${num(g, 2)}`}
                      {income && r.priceUsd ? (
                        <small>{usd(g * r.priceUsd)}</small>
                      ) : (
                        <small>no gain</small>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : null}

      {r.upcoming.length ? (
        <>
          <div className="section-title">Scheduled</div>
          <div className="card">
            <div className="timeline">
              {r.upcoming.map((c) => (
                <div className="row" key={c.eventId}>
                  <div className="date">{day(c.effectiveTimeUtc)}</div>
                  <div className="what">
                    <b>{c.caType.replace(/([a-z])([A-Z])/g, "$1 $2")}</b>
                    <span className="mult">
                      {/* The feed sends this as a fraction: 0.3 means 30%, confirmed
                          against OMCx paying $0.80 gross and $0.56 net. */}
                      {c.withholdingTaxRate && Number(c.withholdingTaxRate) > 0
                        ? `${pct(Number(c.withholdingTaxRate) * 100, 0)} withheld`
                        : "no withholding"}{" "}
                      · {c.status.toLowerCase()}
                    </span>
                  </div>
                  <div className="amt">
                    {c.netCashflowUsd ? usd(Number(c.netCashflowUsd), 5) : "—"}
                    <small>net per share</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}

      {r.reserves ? (
        <>
          <div className="section-title">Is it actually backed</div>
          <div className="card">
            <div className="card-head">
              <div className="ticker" style={{ fontSize: 22 }}>
                {r.reserves.ratio !== null ? pct(r.reserves.ratio * 100) : "not comparable"}
              </div>
              <div className="spacer" />
              {r.reserves.ratio !== null ? (
                <span className={`pill ${r.reserves.ratio >= 1 ? "good" : "bad"}`}>
                  {r.reserves.ratio >= 1 ? "fully backed" : "under-collateralised"}
                </span>
              ) : (
                <span className="pill">{r.reserves.dormant ? "dormant" : "figures disagree"}</span>
              )}
            </div>
            {r.reserves.ratio !== null ? (
              <div className="bar">
                <i
                  className={r.reserves.ratio >= 1 ? "" : "under"}
                  style={{ width: `${Math.min(100, r.reserves.ratio * 100)}%` }}
                />
              </div>
            ) : (
              <p style={{ margin: "10px 0 6px", fontSize: 13, color: "var(--faint)", lineHeight: 1.6 }}>
                {r.reserves.dormant
                  ? `Only ${num(r.reserves.circulating, 4)} ${r.symbol} are reported as circulating, so a backing ratio here would be division by almost nothing rather than a real measurement.`
                  : "The issuer's snapshot and the chain are far enough apart that a ratio would mislead. Both raw figures are below."}
              </p>
            )}
            <div className="sub">
              {num(r.reserves.sharesHeld, 2)} real {r.underlying} shares held at{" "}
              {r.reserves.providers.join(", ")} against {num(r.reserves.circulating, 2)} tokens
              circulating across every chain this token is issued on.
              {r.reserves.dormant && r.treasuryUnits !== null ? (
                <>
                  {" "}
                  Solana still carries {num(r.supplyUnits, 2)} minted tokens, nearly all of them
                  unissued and sitting with the issuer, which is why the two figures do not line up.
                </>
              ) : null}
            </div>

            {r.circulatingOnChain !== null && r.reserves.solanaShare !== null ? (
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--line-soft)" }}>
                <div
                  className="k"
                  style={{
                    fontSize: 11.5,
                    letterSpacing: "0.07em",
                    color: "var(--faint)",
                    textTransform: "uppercase",
                    marginBottom: 8,
                  }}
                >
                  How much of that float is on Solana
                </div>
                <div className="sub" style={{ lineHeight: 1.65 }}>
                  {num(r.supplyUnits, 2)} tokens are minted on Solana, of which{" "}
                  {num(r.treasuryUnits ?? 0, 2)} sit in accounts controlled by the issuer&apos;s own
                  multiplier authority and have never been issued. That leaves{" "}
                  <b>{num(r.circulatingOnChain, 2)}</b> in public hands here
                  {r.reserves.solanaShare !== null ? (
                    <>
                      , or <b>{pct(r.reserves.solanaShare * 100, 1)}</b> of the global float. The
                      remaining {num(r.reserves.otherChains ?? 0, 2)} live on the other chains this
                      token is issued on.
                    </>
                  ) : (
                    "."
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </>
      ) : null}

      <ul className="notes">
        <li>
          Dividends arrive as share growth, not cash. USD figures value that growth at
          today&apos;s price, so they move with the stock.
        </li>
        <li>
          Multiplier history comes from the issuer. The multiplier in force is read straight
          from the mint account on Solana mainnet.
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
