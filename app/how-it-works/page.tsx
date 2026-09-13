import Search from "@/app/Search";
import { day, num, usd } from "@/lib/fmt";
import market from "@/data/market.json";

export const metadata = {
  title: "How it works — ExDate",
  description:
    "What a tokenized stock dividend actually is, what you get when you paste an address, and what every screen shows.",
};

export default function HowItWorksPage() {
  const m = market;
  const hero = m.hero;

  return (
    <>
      <h1>How it works</h1>

      <p className="standfirst">
        A tokenized stock pays you by quietly changing a number on the token. No transfer
        arrives, so no wallet, explorer or tracker records that you were paid. This page shows
        what that looks like, and what you get here instead.
      </p>

      {/* ------------------------------------------------------------------ 1 -- */}
      <section className="section">
        <div className="section__head">
          <h2 className="section__title">First, what actually happens when you are paid</h2>
          <span className="section__meta">no transaction is involved</span>
        </div>
        <div className="section__body">
          <p className="prose">
            Every token has a multiplier attached to it. Your balance is the raw number of tokens
            you own multiplied by that figure. When the issuer receives the dividend from the
            company, it raises the multiplier, and every holder&apos;s balance rises at that
            instant.
          </p>
          {hero ? (
            <p className="prose">
              On <b>{day(hero.at)}</b>, {hero.symbol} moved from{" "}
              <span className="lit">{hero.from.toFixed(9)}</span> to{" "}
              <span className="lit">{hero.to.toFixed(9)}</span>. Someone holding 100 of them went
              from <span className="lit">{(100 * hero.from).toFixed(6)}</span> to{" "}
              <span className="lit">{(100 * hero.to).toFixed(6)}</span> — paid{" "}
              <b>{(100 * (hero.to - hero.from)).toFixed(6)} {hero.symbol}</b> — and nothing
              appeared in their wallet history, because nothing was sent.
            </p>
          ) : null}
          <p className="prose">
            That is why this exists. The payment is real and it is recorded on Solana, but it is
            recorded on the <i>token</i>, not in your wallet, and no one was joining the two.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------------ 2 -- */}
      <section className="section">
        <div className="section__head">
          <h2 className="section__title">Paste an address, get a statement</h2>
          <span className="section__meta">no sign-in, no wallet connection</span>
        </div>
        <div className="section__body">
          <p className="prose">
            Type or paste any Solana address. You do not connect anything, you do not sign
            anything, and it works for an address you do not own — so you can check this page
            against a wallet you already know.
          </p>
          <figure className="figshot">
            <img
              src="/shots/wallet.png"
              alt="A wallet statement: $93.38 paid across 28 payments on 18 positions, with the oldest dated 14 August 2025"
              width={1440}
              height={1200}
              loading="lazy"
            />
            <figcaption>
              What comes back: the total this wallet was paid, how many payments made it up, and
              every position with what it received. This wallet had been paid{" "}
              <b>28 times since August 2025</b> and had no record of any of it.
            </figcaption>
          </figure>
        </div>
      </section>

      {/* ------------------------------------------------------------------ 3 -- */}
      <section className="section">
        <div className="section__head">
          <h2 className="section__title">Open any row to see where the figure came from</h2>
          <span className="section__meta">the multiplier behind each payment</span>
        </div>
        <div className="section__body">
          <p className="prose">
            Nothing here asks you to take a number on trust. Every position opens into the
            payments behind it: the date, the multiplier before and after, the tokens that
            appeared, and what they were worth.
          </p>
          <figure className="figshot figshot--tight">
            <img
              src="/shots/proof.png"
              alt="A position expanded to show five dividends, each with the multiplier before and after"
              width={1440}
              height={1250}
              loading="lazy"
            />
            <figcaption>
              NVIDIA paid this wallet five times. Each row is valued against the balance the
              wallet actually held that day, read from the transaction immediately before the
              payment — not against today&apos;s balance, which would be wrong the moment you
              bought or sold in between.
            </figcaption>
          </figure>
          <p className="section__after muted">
            You can link straight to one: add <span className="lit">?show=NVDAx</span> to a wallet
            address and that position opens on load.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------------ 4 -- */}
      <section className="section">
        <div className="section__head">
          <h2 className="section__title">Or look up a stock instead of a wallet</h2>
          <span className="section__meta">
            {num(m.assetCount, 0)} tokenized stocks, {m.assetsEverPaid} of them have paid
          </span>
        </div>
        <div className="section__body">
          <p className="prose">
            Type a ticker — <b>AAPL</b>, <b>PFE</b>, <b>NVDA</b> — and see what that stock has paid
            its holders since it was tokenized, what the next payment is, how much US tax is
            withheld from it, and whether the tokens are actually backed by shares held in
            custody.
          </p>
          <figure className="figshot">
            <img
              src="/shots/asset.png"
              alt="An asset page for AAPLx showing growth since launch, the live and stale multipliers, and the payment history"
              width={1440}
              height={1100}
              loading="lazy"
            />
            <figcaption>
              This matters if you bought on an exchange. Your tokens then sit in the
              exchange&apos;s own wallet and an address lookup finds nothing, but the stock page
              still tells you what each token was paid.
            </figcaption>
          </figure>
        </div>
      </section>

      {/* ------------------------------------------------------------------ 5 -- */}
      <section className="section">
        <div className="section__head">
          <h2 className="section__title">And see what is coming</h2>
          <span className="section__meta">{m.upcomingCount} payments genuinely ahead</span>
        </div>
        <div className="section__body">
          <p className="prose">
            The issuer stages each payment about a day before it takes effect, so it can be known
            in advance. The calendar shows every one still to come, with the tax withheld and what
            you receive per token.
          </p>
          <figure className="figshot">
            <img
              src="/shots/calendar.png"
              alt="The calendar of upcoming payments with dates, withholding rates and per-token amounts"
              width={1440}
              height={1000}
              loading="lazy"
            />
            <figcaption>
              The issuer&apos;s own feed serves {m.feedRows} rows under the heading
              &ldquo;upcoming&rdquo;. Only {m.upcomingCount} of them are: the rest already
              happened, repeat an event already listed, or carry no date at all. Every row here is
              checked against the clock.
            </figcaption>
          </figure>
        </div>
      </section>

      {/* ------------------------------------------------------------------ 6 -- */}
      <section className="section">
        <div className="section__head">
          <h2 className="section__title">What it costs, and what it can do to your wallet</h2>
        </div>
        <div className="section__body">
          <dl className="facts">
            <dt>Price</dt>
            <dd>Free. There is no account.</dd>
            <dt>What it asks for</dt>
            <dd>An address or a ticker. Nothing else.</dd>
            <dt>What it can do</dt>
            <dd>Read public information. It cannot move, spend or touch your tokens.</dd>
            <dt>What it stores</dt>
            <dd>Nothing. Addresses are read and not kept.</dd>
            <dt>How current it is</dt>
            <dd>Your wallet is read from Solana at the moment you ask, not from a cache.</dd>
          </dl>
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <h2 className="section__title">Try it</h2>
        </div>
        <div className="section__body">
          <Search />
        </div>
      </section>

      <p className="prose prose--standalone">
        Every figure on this site is read from Solana and from the issuer&apos;s public records,
        and the total stands at {usd(m.totalHiddenUsd, 0)} across {num(m.dividendPaymentsAll, 0)}{" "}
        payments. If you want to check how each one is derived, which sources produced it, what it
        deliberately excludes and what we got wrong along the way, that is written up in full on{" "}
        <a href="/method">Method and sources</a>.
      </p>
    </>
  );
}
