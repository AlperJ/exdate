# ExDate

### Live: **https://exdate-ten.vercel.app**

**The brokerage statement that tokenized stocks never send you.**

Tokenized stocks on Solana do not pay dividends in cash. They pay by quietly raising a
multiplier on the token. Your token count never changes. Your balance silently becomes worth
more, and nothing tells you it happened.

Paste any Solana address — no sign-in, no wallet connection, and it works for a wallet you do
not own — and ExDate reads that hidden record back into a statement: what was paid, when, per
position, with the multiplier change behind each payment.

*Figures below measured 13 September 2026. Re-run `npm run snapshot` for current ones; a
scheduled job does it twice a day.*

## The bug this is built on

Token-2022's `ScaledUiAmountConfig` stores two values. The field literally named `multiplier`
is the **old** one. `newMultiplier` takes over once `newMultiplierEffectiveTimestamp` passes,
and the chain never rewrites the old field. Read `multiplier` at face value and every balance
you display is wrong.

On AAPLx today the obvious field reads `1.0026642075893797` while the value in force is
`1.0032690125398187` — a 0.06% error on a cash dividend. On NFLXx after its ten-for-one split,
an app reading the obvious field shows **a tenth of the real balance**. The correct read is
non-obvious and the incorrect one fails silently, which is why nothing surfaces these payments.

## What the data shows

Apple xStock has paid five dividends since launch, none visible in any wallet:

| Date | Multiplier | Gained per 100 AAPLx held that day |
|---|---|---|
| 2025-08-14 | 1.000000000 → 1.000781855 | +0.078186 |
| 2025-11-13 | 1.000781855 → 1.001393487 | +0.061117 |
| 2026-02-12 | 1.001393487 → 1.002018559 | +0.062421 |
| 2026-05-09 | 1.002018559 → 1.002664208 | +0.064442 |
| 2026-08-08 | 1.002664208 → 1.003269013 | +0.060320 |

Those five hand-compound to the chain's own `newMultiplier` to the last digit, which is the
strongest check in the repository.

Across every tokenized stock on Solana: **$11,984,608** paid with no transaction, across
**628 payments** on **329 stocks**, out of **832** issued. **38** payments are genuinely
still to come.

## Dividends are not splits

A multiplier change is not automatically income. Of the 654 corporate actions on record, 641
are `Dividend`, 8 `Split`, 3 `Administrative` and 2 `ReverseSplit`.

Only a dividend pays you. A split raises the multiplier and cuts the share price by the same
factor, so the position is worth what it was a second earlier. Count every change as income
and the total reads **$14,292,658** instead of $11,984,608 — 19% too much — and a tracker
tells a Netflix holder they gained **900%** on a position worth exactly what it was. ExDate
counts only dividends and labels every split "no gain".

## What was hard, and where it is written down

**Valuing a payment against the right balance.** Applying today's balance to a payment from
eight months ago is wrong the moment the holder bought or sold in between. Each row now
resolves its own basis: find the last transaction before that payment activated and read the
balance it left behind. On one test wallet 18 of 28 rows had been using a balance never held
at the time, the worst overstating a row 151-fold.

**The issuer's forward feed.** It serves 539 rows as "upcoming": 482 already activated, 14
are the same event listed twice, and 5 carry no date at all. Only 38 are ahead. The undated
rows are the dangerous ones, because `+new Date(null)` is zero and they sort silently into
the past. Deduplicated and filtered in `fetchUpcoming` so no page can miscount them.

**Being wrong in public.** Adversarial review broke several published figures, including a
headline that was seven times too high. Every one is fixed and written up in
[`VERIFY.md`](VERIFY.md), including the method-page figure that was about sixty times too
large and survived four earlier reviews because nothing on the site produced it.

## We are not the first

[`PRIORART.md`](PRIORART.md) carries a two-pass competitor search with 85 documented
negatives. The short version: **SolanaRWA** has turned these same multiplier changes into
per-holder income since May 2026, on this chain and this extension; they are wallet-gated and
only see forward from the day you sign up. **Lido** has done this for stETH rebases on
Ethereum for five years. The events themselves are the issuer's, published free, and are
cited rather than claimed.

What we could not find anywhere is the backward half: paste **any** address, with no sign-in,
and read what it was **already** paid, against the balance it **actually held on each date**,
with **splits separated from dividends**.

## Architecture

No database and no holder index. A wallet is read from the chain at the moment you ask, so a
position bought a minute ago appears the first time you look, and there is no cold start for
an address nobody has seen before.

Measured through a counting proxy: an 18-position wallet costs 16 chain reads and returns in
about a second; a 755-position account costs 33 and takes four seconds. Where the endpoint
offers Helius's `getTransactionsForAddress`, one call replaces the classic
`getSignaturesForAddress` + `getTransaction` fan-out, with the portable walk kept as a
fallback and both verified to return identical balances.

## Data sources

All keyless and public except the RPC:

- `api.xstocks.fi/api/v2/public/assets` — asset list with Solana mints
- `.../assets/{sym}/multiplier/history` — the invisible dividend record
- `.../corporate-actions/upcoming` — forward calendar, ex-dates, gross and net USD
- `.../proof-of-reserves/{sym}` — shares in custody vs tokens circulating
- `.../system/status/{sym}` — trading halt flags
- Solana RPC `getAccountInfo` / `getTokenAccountsByOwner` — where the raw fields live
- Jupiter Price v3 (`lite-api.jup.ag`) — the underlying equity price, not the thin DEX quote

Those three xStocks endpoints paginate differently from one another. See `lib/xstocks.ts`.

## Setup

```bash
npm install
cp .env.local.example .env.local   # add your own RPC URL
npm run dev
```

`SOLANA_RPC_URL` is server-side only and is never exposed to the browser. The public RPC
blocks some methods and rate-limits others, so a key is needed for wallet lookups.

```bash
npm run snapshot   # re-measure the market-wide figures in data/market.json
```

Read-only throughout. No wallet connection, no transactions, no custody, no contract.

## In this repository

| | |
|---|---|
| [`SUBMISSION.md`](SUBMISSION.md) | the full write-up: problem, market, roadmap, business model |
| [`VERIFY.md`](VERIFY.md) | every figure that was checked, and every one that broke |
| [`PRIORART.md`](PRIORART.md) | who else is working on this, with 85 documented negatives |
| [`COPY.md`](COPY.md) | 34 findings from reading the site as three different people |
| [`FORM.md`](FORM.md) | submission-form content, sized to its fields |
| [`docs/pitch.html`](docs/pitch.html) | the deck, with screenshots of the running product |

## Open-source components

Next.js, React and TypeScript. No Solana SDK: token reads go through plain JSON-RPC with
`jsonParsed` encoding, so there is nothing between this app and the chain's own view.
