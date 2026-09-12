import { day } from "@/lib/fmt";
import market from "@/data/market.json";

export const metadata = {
  title: "Method — ExDate",
  description:
    "Where every figure on ExDate comes from, how the multiplier is resolved, and what the numbers deliberately exclude.",
};

export default function MethodPage() {
  return (
    <>
      <h1>Method</h1>

      <p className="standfirst">
        Every figure here is derived from public data that anyone can fetch. This page states which
        source produced which number, and what the numbers deliberately exclude.
      </p>

      <section className="section">
        <div className="section__head">
          <h2 className="section__title">Resolving the multiplier</h2>
          <span className="section__meta">the thing everything else depends on</span>
        </div>
        <div className="section__body">
          <p className="prose">
            A Token-2022 mint carrying the scaled UI amount extension stores two values. The field
            named <code className="lit">multiplier</code> holds the old one. The field named{" "}
            <code className="lit">newMultiplier</code> takes over once{" "}
            <code className="lit">newMultiplierEffectiveTimestamp</code> has passed, and the chain
            never rewrites the old value afterwards.
          </p>
          <p className="prose">
            Read live from AAPLx on {day(market.measuredAt)}:
          </p>
          <div className="tw">
            <table className="dt dt--compact">
              <colgroup>
                <col style={{ width: "300px" }} />
                <col />
              </colgroup>
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                <tr className="is-void">
                  <td className="lit">multiplier</td>
                  <td className="lit">1.0026642075893797</td>
                </tr>
                <tr>
                  <td className="lit">newMultiplier</td>
                  <td className="lit">1.0032690125398187</td>
                </tr>
                <tr>
                  <td className="lit">newMultiplierEffectiveTimestamp</td>
                  <td className="lit">1786149000 (8 Aug 2026, past)</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="section__after muted">
            Because the timestamp has passed, the value in force is the second one. Taking the first
            at face value understates every balance by 0.06% here, and by ten times on a
            ten-for-one split.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <h2 className="section__title">What counts as income</h2>
          <span className="section__meta">654 multiplier changes across 832 assets</span>
        </div>
        <div className="section__body">
          <p className="prose">
            A multiplier change is not automatically a payment. Only a dividend puts something in a
            holder&apos;s pocket. A split raises the multiplier and cuts the share price by the same
            factor, leaving the position worth what it was a second earlier.
          </p>
          <div className="tw">
            <table className="dt dt--compact">
              <colgroup>
                <col />
                <col style={{ width: "110px" }} />
                <col style={{ width: "150px" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Reason recorded by the issuer</th>
                  <th>Count</th>
                  <th>Counted as income</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Dividend</td>
                  <td>641</td>
                  <td className="pos">Yes</td>
                </tr>
                <tr>
                  <td>Split</td>
                  <td>8</td>
                  <td className="muted">No</td>
                </tr>
                <tr>
                  <td>Administrative</td>
                  <td>3</td>
                  <td className="muted">No</td>
                </tr>
                <tr>
                  <td>Reverse split</td>
                  <td>2</td>
                  <td className="muted">No</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="section__after muted">
            Netflix split ten for one on 16 Nov 2025. Pricing the extra tokens as a gain would add
            about $106m to the total on the front page. Holders received nothing, so it is excluded.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <h2 className="section__title">Sources</h2>
          <span className="section__meta">all public, none require a key</span>
        </div>
        <div className="section__body">
          <dl className="facts">
            <dt>Asset list and mints</dt>
            <dd className="lit">api.xstocks.fi/api/v2/public/assets</dd>
            <dt>Payout record</dt>
            <dd className="lit">/assets/&#123;symbol&#125;/multiplier/history</dd>
            <dt>Forward calendar</dt>
            <dd className="lit">/corporate-actions/upcoming</dd>
            <dt>Reserve attestation</dt>
            <dd className="lit">/proof-of-reserves/&#123;symbol&#125;</dd>
            <dt>Trading status</dt>
            <dd className="lit">/system/status/&#123;symbol&#125;</dd>
            <dt>On-chain truth</dt>
            <dd className="lit">Solana RPC getAccountInfo, getTokenAccountsByOwner</dd>
            <dt>Price</dt>
            <dd className="lit">lite-api.jup.ag/price/v3</dd>
          </dl>
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <h2 className="section__title">What these numbers are not</h2>
          <span className="section__meta">stated plainly</span>
        </div>
        <div className="section__body">
          <ol className="notes notes--bare">
            <li>
              Dollar figures value the tokens the issuer reports as circulating, its own published number,
              which covers every chain each token is issued on. An earlier version valued the whole
              mint including tokens created and never sold, which overstated the total sevenfold.
            </li>
            <li>
              Reserve attestations cover every chain a token is issued on, not Solana alone. xStocks
              are also deployed on Ethereum, TON, Arbitrum, Optimism, BNB Chain, Mantle, Ink, XLayer
              and HyperEVM.
            </li>
            <li>
              Per-wallet figures assume a position was held unchanged since it was acquired. Buying
              or selling between payouts shifts the real number.
            </li>
            <li>
              A dividend is credited as growth in the number of tokens. Valuing it in dollars uses
              today&apos;s price, so the dollar figure moves with the underlying stock even though
              the token gain is fixed.
            </li>
            <li>
              Positions whose token account has too much history to date cheaply are shown with the
              asset&apos;s full payout record rather than a guessed acquisition date.
            </li>
          </ol>
        </div>
      </section>

      <p className="disclaimer">
        Read-only. No wallet connection, no transactions, no custody. Not investment advice, and not
        affiliated with Backed Finance, Ondo or the Solana Foundation.
      </p>
    </>
  );
}
