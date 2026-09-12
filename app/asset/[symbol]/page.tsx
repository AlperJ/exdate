import { buildAssetReport } from "@/lib/report";
import { usd, num, pct, signed, day } from "@/lib/fmt";
import { isIncome, eventRatio } from "@/lib/xstocks";
import StepChart from "@/app/StepChart";

export const revalidate = 300;

// A lookup tool's shared link is the product. A tab strip of identical titles, and a
// Telegram preview showing the tagline instead of the finding, throw that away.
export async function generateMetadata({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const r = await buildAssetReport(decodeURIComponent(symbol)).catch(() => null);
  if (!r) return { title: "Not found — ExDate" };
  const paid =
    r.totalGrowthPct > 0
      ? `has paid holders ${pct(r.totalGrowthPct, 3)} with no transaction`
      : "has never paid its holders";
  return {
    title: `${r.symbol} ${paid} — ExDate`,
    description: `${r.name.replace(/ xStock$/, "")} on Solana: every dividend it has paid, when the next one lands, and how much US tax is withheld.`,
  };
}

export default async function AssetPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const sym = decodeURIComponent(symbol);

  let r;
  try {
    r = await buildAssetReport(sym);
  } catch (e) {
    return (
      <div className="notice">
        <div className="notice__head">This asset could not be read</div>
        <div className="notice__body">
          {e instanceof Error ? e.message : String(e)}. The issuer API or a Solana RPC endpoint did
          not answer. Try again in a moment.
        </div>
      </div>
    );
  }

  if (!r) {
    return (
      <div className="notice">
        <div className="notice__head">We have no tokenized stock with the ticker {sym}</div>
        <div className="notice__body">
          Look up a US ticker such as <a href="/asset/AAPL">AAPL</a> or{" "}
          <a href="/asset/PFE">PFE</a>, or browse the <a href="/assets">full asset index</a>.
        </div>
      </div>
    );
  }

  const paid = r.dividendCount;
  const per1k = r.perUnitGained * 1000;
  const per1kUsd = r.priceUsd ? per1k * r.priceUsd : null;
  const hasSplit = Math.abs(r.splitFactor - 1) > 0.001;
  const splitLabel =
    r.splitFactor >= 1 ? `${num(r.splitFactor, 0)}:1` : `1:${num(1 / r.splitFactor, 0)}`;
  const drift = Math.abs(r.driftPct) > 1e-9;

  // Cumulative dividend yield, compounded in order. Splits are skipped rather than
  // plotted: a ten-for-one jump would flatten every real payment into the baseline.
  let f = 1;
  const yieldSeries = r.history
    .filter((e) => isIncome(e.reason))
    .map((e) => {
      f *= eventRatio(e);
      return { at: e.activationDateTime, value: (f - 1) * 100, label: e.reason };
    });

  return (
    <>
      <div className="ident">
        {r.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="mark mark--lg" src={r.logo} alt="" width={28} height={28} />
        ) : (
          <span className="mark mark--lg" />
        )}
        <div>
          <h1>{r.symbol}</h1>
          <div className="ident__sub">
            {r.name.replace(/ xStock$/, "")} · tracks {r.underlying}
            {r.priceUsd ? ` · ${usd(r.priceUsd)}` : ""}
          </div>
        </div>
        <div className="ident__end">
          <span className={`status ${r.halted ? "status--bad" : "status--ok"}`}>
            {r.halted ? "Trading halted" : "Live"}
          </span>
        </div>
      </div>

      {paid > 0 ? (
        <div className="figure">
          <div className="figure__label">Paid invisibly since launch</div>
          <div className="figure__value">{pct(r.totalGrowthPct)}</div>
          <hr className="figure__rule" />
          <p className="figure__context">
            Across <b>{paid}</b> {paid === 1 ? "dividend" : "dividends"}, every holder&apos;s position
            grew by {pct(r.totalGrowthPct)} with no transaction and no notification. A holder of
            1,000 {r.symbol} since launch gained <b>{num(per1k, 4)} {r.symbol}</b>
            {per1kUsd !== null ? (
              <>
                , worth <b>{usd(per1kUsd)}</b> at today&apos;s price
              </>
            ) : null}
            .
            {hasSplit ? (
              <>
                {" "}
                This stock also split {splitLabel}, which multiplied the token count without changing
                what the position is worth. That is excluded from the figure above.
              </>
            ) : null}
          </p>
          {yieldSeries.length > 1 ? (
            <StepChart
              points={yieldSeries}
              format="pct"
              height={190}
              caption={`Cumulative dividend growth on a ${r.symbol} position, compounded. Each step is a payout activating.`}
            />
          ) : null}
        </div>
      ) : hasSplit ? (
        <div className="figure">
          <div className="figure__label">Split, not a payout</div>
          <div className="figure__value">{splitLabel}</div>
          <hr className="figure__rule" />
          <p className="figure__context">
            {r.symbol} has never paid a dividend on chain. Its multiplier stands at{" "}
            {r.effective.toFixed(4)} because the underlying stock split, which multiplied every
            holder&apos;s token count by {num(r.splitFactor, 2)} and cut the price by the same factor.
            A wallet showing {num(r.splitFactor, 0)} times more tokens after that date gained nothing.
          </p>
        </div>
      ) : (
        <div className="empty">
          <p className="empty__main">
            No corporate action has been applied to {r.symbol}. Its multiplier is still 1.0, so
            nothing is hidden in any holder&apos;s balance.
          </p>
          <p className="empty__sub">
            Check back after the first dividend, or browse the{" "}
            <a href="/assets">assets that have already paid</a>.
          </p>
        </div>
      )}

      <div className="band band--4">
        <div>
          <div className="stat__label">Live value on the token</div>
          <div className="stat__value">{r.effective.toFixed(10)}</div>
          <div className="stat__note">multiplies every holder&apos;s balance</div>
        </div>
        <div>
          <div className="stat__label">Old value still on the token</div>
          <div className={`stat__value ${drift ? "is-warn" : ""}`}>{r.naive.toFixed(10)}</div>
          <div className="stat__note">
            {drift
              ? `an app reading this shows ${pct(r.hiddenPct, r.hiddenPct >= 1 ? 1 : 4)} less than the real balance`
              : "currently the same as the live value"}
          </div>
        </div>
        <div>
          <div className="stat__label">Held by the public</div>
          <div className="stat__value">{num(r.circulatingOnChain ?? r.supplyUnits, 0)}</div>
          <div className="stat__note">
            {r.treasuryUnits
              ? `the issuer has made ${num(r.treasuryUnits, 0)} more that nobody owns yet; they are backed too and do not dilute yours`
              : "tokens on Solana"}
          </div>
        </div>
        <div>
          <div className="stat__label">Price</div>
          <div className="stat__value">{r.priceUsd ? usd(r.priceUsd) : "—"}</div>
          <div className="stat__note">Jupiter, all Solana venues</div>
        </div>
      </div>

      <dl className="facts">
        <dt>Mint</dt>
        <dd className="lit">{r.mint}</dd>
        <dt>Program</dt>
        <dd>Token-2022, scaled UI amount extension</dd>
        <dt>Issuer</dt>
        <dd>Backed Assets (JE) Limited</dd>
        <dt>Decimals</dt>
        <dd>{r.decimals}</dd>
      </dl>

      {r.pending ? (
        <div className="notice notice--warn">
          <div className="notice__head">
            <span className="status status--warn">Payout incoming</span>
          </div>
          <div className="notice__body">
            The multiplier moves from <span className="lit">{r.pending.from.toFixed(9)}</span> to{" "}
            <span className="lit">{r.pending.to.toFixed(9)}</span> on {day(r.pending.activatesAt)},
            raising every balance by {pct((r.pending.to / r.pending.from - 1) * 100, 4)} at that
            moment. The issuer asks venues to pause trading for about fifteen minutes around it.
          </div>
        </div>
      ) : null}

      {r.history.length ? (
        <section className="section">
          <div className="section__head">
            <h2 className="section__title">Multiplier history</h2>
            <span className="section__meta">
              what 1,000 {r.symbol} earned, if you held them the day before
            </span>
          </div>
          <div className="section__body">
            <div className="tw">
              <table className="dt">
                <colgroup>
                  <col style={{ width: "112px" }} />
                  <col style={{ width: "150px" }} />
                  <col />
                  <col style={{ width: "130px" }} />
                  <col style={{ width: "120px" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Action</th>
                    <th>Multiplier</th>
                    <th>Extra tokens per 1,000 you held</th>
                    <th>Worth today, per 1,000 held</th>
                  </tr>
                </thead>
                <tbody>
                  {[...r.history].reverse().map((e) => {
                    const income = isIncome(e.reason);
                    // The multiplier scales a fixed raw balance, so 1,000 tokens held the
                    // day before this event is 1000 / previousMultiplier raw units, not
                    // 1,000. Dividing by the old multiplier is the difference between what
                    // a holder on the day received and what a launch-day holder received.
                    const g =
                      (1000 * (e.multiplier - e.previousMultiplier)) / e.previousMultiplier;
                    return (
                      <tr key={e.id}>
                        <td>{day(e.activationDateTime)}</td>
                        <td className={income ? "" : "muted"}>
                          {income
                            ? e.reason
                            : `${e.reason.replace(/([a-z])([A-Z])/g, "$1 $2")} · no gain`}
                        </td>
                        <td className="lit">
                          {e.previousMultiplier.toFixed(9)} → {e.multiplier.toFixed(9)}
                        </td>
                        <td className={income ? "pos" : "muted"}>{signed(g, 4)}</td>
                        <td className={income ? "" : "muted"}>
                          {income && r.priceUsd ? usd(g * r.priceUsd) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : null}

      <section className="section">
        <div className="section__head">
          <h2 className="section__title">Next payment</h2>
          <span className="section__meta">from the issuer&apos;s forward feed</span>
        </div>
        {r.upcoming.length ? (
          <div className="section__body">
            <div className="tw">
              <table className="dt">
                <colgroup>
                  <col style={{ width: "112px" }} />
                  <col style={{ width: "150px" }} />
                  <col style={{ width: "110px" }} />
                  <col style={{ width: "110px" }} />
                  <col style={{ width: "130px" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Action</th>
                    <th>US tax withheld</th>
                    <th>Status</th>
                    <th>You receive, per token</th>
                  </tr>
                </thead>
                <tbody>
                  {r.upcoming.map((c) => (
                    <tr key={c.eventId}>
                      <td>{day(c.effectiveTimeUtc)}</td>
                      <td>{c.caType.replace(/([a-z])([A-Z])/g, "$1 $2")}</td>
                      <td>
                        {c.withholdingTaxRate && Number(c.withholdingTaxRate) > 0
                          ? pct(Number(c.withholdingTaxRate) * 100, 0)
                          : "None"}
                      </td>
                      <td className="muted">{c.status}</td>
                      <td>{c.netCashflowUsd ? usd(Number(c.netCashflowUsd), 5) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="section__body">
            <div className="empty">
              <p className="empty__main">
                The issuer has not scheduled the next {r.symbol} payment yet.
              </p>
              <p className="empty__sub">
                It appears here the moment they publish it, usually a day or two ahead. Nothing is
                missing from the record below; there is simply no date to show yet.
              </p>
            </div>
          </div>
        )}
      </section>

      {r.reserves ? (
        <section className="section">
          <div className="section__head">
            <h2 className="section__title">Reserves</h2>
            <span className="section__meta">issuer attestation, all chains</span>
          </div>
          <div className="section__body">
            <div className="row-baseline">
              <span className="stat__value">
                {r.reserves.ratio !== null ? pct(r.reserves.ratio * 100) : "Not comparable"}
              </span>
              <span
                className={`status ${
                  r.reserves.ratio === null
                    ? ""
                    : r.reserves.ratio >= 1
                      ? "status--ok"
                      : "status--bad"
                }`}
              >
                {r.reserves.ratio === null
                  ? r.reserves.dormant
                    ? "Nobody holds it yet"
                    : "Cannot be compared"
                  : r.reserves.ratio >= 1
                    ? "Backed, across every chain"
                    : "Short of full backing"}
              </span>
            </div>

            {r.reserves.ratio !== null ? (
              <p className="empty__sub mt-3">
                {r.reserves.solanaShare !== null ? (
                  <>
                    The {num(r.reserves.sharesHeld, 2)} shares in custody back this stock&apos;s
                    tokens on every chain it is issued on, not only the ones on Solana. Do not
                    divide it by the Solana figure below: they count different things.
                  </>
                ) : (
                  <>
                    Read this one with care. The issuer reports{" "}
                    {num(r.reserves.circulating, 2)} {r.symbol} outstanding across every chain,
                    while we count{" "}
                    {r.circulatingOnChain !== null ? num(r.circulatingOnChain, 2) : "more"} on
                    Solana alone. An all-chain total cannot be smaller than one chain&apos;s, so the
                    two were read at different moments and the ratio above is only as current as
                    the issuer&apos;s snapshot.
                  </>
                )}
              </p>
            ) : null}

            {r.reserves.ratio !== null ? (
              <div className="bar-meter">
                <i
                  className={r.reserves.ratio >= 1 ? "" : "is-short"}
                  style={{ width: `${Math.min(100, r.reserves.ratio * 100)}%` }}
                />
                <span className="tick" />
              </div>
            ) : (
              <p className="empty__sub mt-3">
                {r.reserves.dormant
                  ? `The issuer reports only ${num(r.reserves.circulating, 4)} ${r.symbol} in anyone's hands. A backing ratio against a number that small measures nothing, so we do not show one.`
                  : "The issuer's attestation and the chain were read at different moments, and far enough apart that dividing one by the other would say more about the timing than about the backing."}
              </p>
            )}

            <dl className="facts">
              <dt>Shares held</dt>
              <dd>{num(r.reserves.sharesHeld, 2)}</dd>
              <dt>Custodians</dt>
              <dd>{r.reserves.providers.join(", ") || "—"}</dd>
              <dt>Tokens circulating</dt>
              <dd>{num(r.reserves.circulating, 2)} across all chains</dd>
              <dt>On Solana</dt>
              <dd>
                {r.circulatingOnChain !== null ? num(r.circulatingOnChain, 2) : "—"} in public
                hands
              </dd>
              <dt>How much of this token lives on Solana</dt>
              <dd>
                {r.reserves.solanaShare !== null
                  ? pct(r.reserves.solanaShare * 100, 1)
                  : "Cannot be worked out: the issuer's all-chain count was taken at a different moment from our Solana reading, and is the smaller of the two."}
              </dd>
            </dl>
          </div>
        </section>
      ) : null}

      <ol className="notes">
        <li>
          The multiplier in force is read from the mint account on Solana mainnet and resolved
          against its effective timestamp. The history and the forward feed come from the issuer.
        </li>
        <li>
          Dividends are credited as growth in the number of tokens, not as cash. USD figures value
          that growth at today&apos;s price, so they move with the underlying stock.
        </li>
        <li>
          Reserve attestations cover every chain this token is issued on. xStocks are also deployed
          on Ethereum, TON, Arbitrum, Optimism, BNB Chain, Mantle, Ink, XLayer and HyperEVM, so the
          circulating figure is not Solana alone.
        </li>
      </ol>

      <p className="disclaimer">
        Read-only. No wallet connection, no transactions, no custody. Not investment advice, and not
        affiliated with Backed Finance or the Solana Foundation.
      </p>
    </>
  );
}
