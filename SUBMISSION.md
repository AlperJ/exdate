# Stocklana submission — ExDate

Live: **https://exdate-ten.vercel.app**
Code: **https://github.com/AlperJ/exdate**

---

## Short description

*(one line, for the submission form)*

> Tokenized stocks on Solana pay dividends by quietly changing a number on the token, so
> nothing lands in your wallet and nothing tells you. ExDate reads that hidden record and
> shows what you were actually paid.

**Alternate, if a shorter field is required:**

> The dividends your tokenized stocks paid you, that no wallet shows.

---

## Full description

### The problem

An xStock does not pay a dividend the way anything else on Solana pays anything.

There is no transfer. No transaction appears. The number of tokens in your wallet is
exactly the same before and after. What changes is a multiplier stored on the token
itself, and when the issuer nudges it up, every holder's balance is worth more at that
instant.

The consequence is that **nobody knows they are being paid.** No wallet surfaces it, no
explorer records it, no portfolio tracker accounts for it. A holder can own Apple through
AAPLx for a year, receive five dividends, and never see a single one.

We measured what that adds up to. As of 13 September 2026, across every tokenized stock
issued on Solana:

| | |
|---|---|
| Paid to holders with no transaction | **$11,984,613** |
| Payments that reached a holder | **628** |
| Stocks that have paid | **329** |
| Tokenized stocks issued on Solana | **832** |
| Payments genuinely still to come | **38** |

Every one of those figures is read from Solana mainnet and from the issuer's public
records, except the dollar total, which also needs a price: each token is valued at the
underlying equity's price, not at the thin on-chain quote. Nothing is projected or modelled.

The two scopes are deliberately different and the site says so. 641 dividend events exist
in the issuer's records; three have not activated yet, and ten sit on tokens with zero
circulating supply, where the multiplier moved but there was nobody holding the token to
be paid. That leaves 628 across 329 stocks. Of those, four had no usable price when we
measured, so the dollar figure comes from 624 payments across 325 stocks. Counting a
payment does not need a price, so we do not let a missing price shrink a count.

### What ExDate does

**Paste a wallet address** and get a statement: what was paid, when, per position, with
the multiplier change behind each payment.

**Type a ticker** and see what that stock has paid its holders since launch, when the next
payment lands, how much US tax is withheld, and whether the tokens are actually backed by
shares in custody.

**Open the calendar** and see every payment still to come, with the date each one lands.

It is entirely read-only. No wallet connection, no transaction, no custody, no smart
contract. It reads public state and states what it found.

### The bug underneath it

Token-2022's scaled UI amount extension stores two values. The field literally named
`multiplier` holds the **old** one. `newMultiplier` takes over once
`newMultiplierEffectiveTimestamp` passes, and the chain never rewrites the old field.

Read AAPLx today and the obvious field says `1.0026642075893797` while the value actually
in force is `1.0032690125398187`. For a cash dividend that error is 0.06%. For NFLXx after
its ten-for-one split, an app reading the obvious field shows **a tenth of the real
balance.**

This is why nothing shows these payments. It is not that wallets chose not to; it is that
the correct read is non-obvious and the incorrect one fails silently.

### What we found while building it

Three things that only became visible once we measured the whole set. The labels are the
issuer's and we do not claim them; what they add up to is ours:

**A split is not a dividend, and counting them as one costs 19% of the headline.** Of 654
recorded corporate actions across all 832 assets, 641 are dividends and 13 are splits,
reverse splits or administrative corrections; 651 of the 654 have actually taken effect.
Count every one of them as income and the total reads $14,292,658 instead of $11,984,609.
The error is not spread across the market: it lands entirely on the twelve stocks that
split, the largest single contributor being TQQQx at $1,948,218. Netflix split ten for one
and its multiplier went from 1.0 to 10.0 while holders received nothing, so a tracker
reading that as income tells a Netflix holder they gained 900% on a position worth exactly
what it was.

**The issuer's forward feed is 93% stale, and not only stale.** It serves 539 rows as
"upcoming". 482 already activated, 14 are the same event listed twice, and 5 carry no date
at all — and an undated row is the dangerous one, because `+new Date(null)` is zero, so it
sorts silently into the distant past. 38 rows are genuinely ahead. Anyone building a
calendar off that endpoint without checking the clock gets a number fourteen times too
large.

**The dividend market is one instrument.** 90% of the $11.98m is STRCx, a variable-rate
preferred that pays like a bond. The other 324 stocks come to $1.2m between them, and the
typical one has paid 0.370% of its value since launch. Tokenized equity dividends are, so
far, very small — which is precisely why nobody noticed they were invisible.

### We are not the first, and one of them is close

We searched twice. The first search concluded nobody was doing this, which was too
convenient to trust, so we ran it again across eight independent angles. Four of the eight
found the same product without being told about it.

**SolanaRWA (solanarwa.app) is doing a close version of this, on the same chain, with the
same token extension, on the same assets, and has been since May 2026.** Their own posts,
*On-Chain Dividends Are Silent. Your Tax Bill Isn't.* (29 May 2026) and *How xStocks
Dividends Work On-Chain* (12 March 2026), state the problem before we did. We cite them
rather than wait to be caught by a judge.

Where they stop, verified against their own pages:

- **They cannot look up an address.** Every route is wallet-gated; the string "wallet
  address" appears zero times on their site. You can only see a wallet you control.
- **They only see forward.** Their method reads the current multiplier and compares it with
  the last snapshot in their database, so connecting today shows nothing for what already
  happened. Their own article says it: "Retroactively reconstructing dividend history from
  multiplier changes is possible but more complex than recording them as they happen."
- **They value against the wrong balance** — your quantity at refresh time, not the balance
  you held on the payout date. That is the same error we found in our own wallet pages and
  fixed on 13 September.
- **They appear to book splits as dividend income.** Their published rule is that a rising
  multiplier means a dividend was paid, and the word "split" appears nowhere in their
  writing. NFLXx's only multiplier event is a Split from 1 to 10.

**Lido has shipped the structural precedent for five years.** `stake.lido.fi/rewards` takes
any Ethereum address with no sign-in and returns that holder's per-day rebase attribution,
with a public API behind it. Same shape of problem, same shape of answer, different chain and
standard. The pattern is proven; nobody had brought it to tokenized equities on Solana.

**The events themselves are free and public.** Backed's corporate-actions API needs no key
and already labels a dividend differently from a split. We cite it and do not claim it.
Dinari keeps per-account dividend records on EVM chains behind KYC. Scallar indexes the same
class of multiplier on Robinhood Chain. Crypto.com records dividends for its own custodial
customers on Cronos.

So the honest claim is not "nobody does this". It is this: paste **any** address, with no
sign-in, and see what it was **already** paid, valued against the balance it **actually held
on each payment date**, with **splits separated from dividends**. Every clause is something
the closest competitor does not do, and one of them they concede themselves.

The full search, including eighty-five documented negatives, is in `PRIORART.md`.

### Why Solana

The mechanism barely exists off Solana. Its EVM analogue, ERC-8056 scaled UI amount, runs
mainly on Robinhood Chain, where Scallar already indexes it. Paying a dividend by moving a
multiplier on the
token is a Token-2022 extension, and over 90% of tokenized equity lives on Solana. The
problem is Solana-native, the fix has to be, and the data to fix it is all public.

### What it is not

- Read-only. It tells you what happened; it does not let you act on it.
- Dollar figures value the tokens the issuer reports as circulating, its own published
  number, covering every chain each token is issued on.
- Dividends arrive as extra tokens, not cash, so USD figures value that growth at today's
  price and move with the stock.
- Wallet figures use the balance the wallet actually held on each payment date, read from
  the transaction immediately before it. Where an account trades too often for that walk to
  reach back, the row is marked estimated on the page and the headline says how many.

All four are stated on the site itself, on the *How this works* page.

### How big this actually is

The problem is not an xStocks problem. It is a Token-2022 problem, and the second issuer is
larger than the first.

| | Assets on Solana | Value | Pays by moving a multiplier |
|---|---|---|---|
| Ondo Global Markets | 395 | $831.7m | Yes — `ScaledUiAmount`, named in their own repo |
| Backed / xStocks | 832 | $608.3m | Yes — the mechanic this site is built on |
| Backpack Securities | catalogue live since Jun 2026 | — | "Automatic balance adjustments", extension not yet named |

*Issuer values and asset counts: rwa.xyz, 13 September 2026.*

We did not take Ondo's word for it. Their repository says GM tokens carry the
`ScaledUiAmount` extension, so we read one: mint
`123mYEnRLM2LLYsJW3K6oyYh8uP1fngj732iG638ondo` (AAPLon, Ondo's Apple) is a Token-2022 mint
with `scaledUiAmountConfig` present and a multiplier of **1.003376073740221**. Apple's other
tokenized form, AAPLx, sits at **1.003269012539819**.

The same company, two tokens, two different accumulated dividend factors, on the same chain,
and nothing anywhere compares them. That is Phase 4 below, and it is not hypothetical.

So roughly **1,200 mints and $1.4bn** already pay this way on Solana, and every one of them
is invisible to its holders in exactly the same manner. xStocks alone reports **300,000+
holders**, up 20,000 in a single day on 11 September; rwa.xyz counts 524,773 addresses,
**+83% in thirty days**. Across all tokenized equities the figure is 3.43m holders and
$2.84bn.

Kraken, which now owns Backed, publishes the mechanic in its own FAQ — the exact formula
(net dividend after 30% withholding, divided by the prior day's close), the exact update
time (8pm EST the day before ex-date) — and then tells the holder to *seek independent
advice on your taxation position.* The largest distributor documents the event and declines
to document the holder's position in it. That sentence is the whole opportunity.

---

### Roadmap — what a prize would build

The site proves the problem and proves the numbers. It is not the fix, because the fix is
not a website. Each phase below has a reason it comes when it does.

**Phase 1 — the correct reader, so the fix travels. (0–3 months)**

Ship `@exdate/scaled-ui`: a dependency-free package, MIT, that resolves the multiplier
against its effective timestamp, distinguishes a dividend from a split by the issuer's own
`reason` field, and reconstructs the balance a wallet held on any past date. Ours showing
these payments helps only the people who find us; one correct integration in Phantom,
Solflare, Backpack or Step reaches more holders than this site ever will.

This is also the honest answer to a competitor. Another product already turns these
multiplier changes into per-holder income, forward from the day you subscribe, for a wallet
you connect. The library makes the hard half — the backward half, and the split/dividend
distinction — free for everyone, including them.

**Phase 2 — tell people before it happens, not a year after. (1–4 months)**

Every payment is knowable roughly 24 hours ahead: the issuer publishes it and the multiplier
is staged on chain with a future effective timestamp. A holder should be told the day
before. Email, Telegram, and a webhook apps can subscribe to. This is the piece that turns a
lookup into something people return to.

**Phase 3 — the statement nobody can produce. (2–6 months)**

A per-wallet, per-tax-year dividend statement: date, event, multiplier before and after,
balance held that day, tokens received, value in the holder's own currency, withholding
already applied. There is no transaction to show an accountant and no broker statement to
request.

The clock on this is regulatory, not commercial. **1099-DA cost-basis reporting begins with
transactions on or after 1 January 2026**, with the first basis-carrying forms arriving in
early 2027. A silent multiplier increase is an income event with a cost-basis consequence
that no broker's books currently capture.

**Phase 4 — every issuer, one record. (4–9 months)**

Ondo first, because it is the larger set and uses the identical extension. Then Backpack,
then whoever is next; the reader from Phase 1 makes each one a configuration rather than a
rewrite. The same company then exists as several different tokens at several different
prices, and nobody compares them. We would.

**Phase 5 — the holders who are not in a wallet. (6–12 months)**

Most people who own these bought them on Kraken or Bybit, where the tokens sit in an
exchange omnibus wallet and an address lookup finds nothing. On-chain is only 14–20% of
cumulative xStocks volume, so this is the majority, not the tail. Whether those venues pass
the dividend through, and whether they tell the customer, is undocumented. Finding out and
publishing the answer serves the largest group of holders there is, and it is journalism as
much as engineering.

---

### Business model

The honest version first: nothing here is charged for today, and the free surface stays
free. What follows is where the money is, with the comparable prices that establish it.

**This category already has a price, in traditional finance.** LSEG publishes its
corporate-actions rate card: **£31,100 a year** for a single ISO 15022 corporate-actions
data file, and a separate **distribution licence from £8,685 to £64,200** depending on how
many downstream customers you redistribute to. That ladder — the same data priced seven
times higher when you put it in front of more than 300 customers — is precisely the shape of
a wallet or exchange integration.

**And the feed is the cheap part.** ISSA's own research puts data sourcing at **56% of the
total cost of processing a corporate action**, and says plainly that procuring the data
costs less than "the activities to get that data useable: interpretations, cleansing,
enrichment." The average corporate-action operating unit costs **$3–5m a year** to run, and
**over 45% of brokers have taken a $1m+ loss** from a corporate-action processing error.
ExDate does not sell a feed. It sells the interpreted, reconciled result, which is the
expensive half, for a market where nobody produces it at all.

**The model that works on Solana is Pyth's, and it is not the data that is sold.** Pyth
gives its core feeds away forever and charges **$500/mo for the right to display** and
**$2,500/mo for the right to redistribute**. That reached **$10.4m ARR and 122 paying
accounts within eleven months**. The fence is the licence, not the numbers.

So:

| Tier | Who | Price | What it is |
|---|---|---|---|
| **Free, permanently** | any holder, any researcher, any judge | $0 | Paste any address. No sign-in, no wallet connection. Plus the open-source reader. |
| **Statement** | a holder at tax time | **$29–49 per wallet-year** | The dated, exportable, filing-ready record. Priced against the one comparable product's $29 and the $29–99 norm across Koinly, CoinLedger, CoinTracker and Awaken. |
| **Integration** | wallets, portfolio apps, tax software | **$200–1,000/mo** | Machine-readable API, freshness guarantees, and the right to show the result to their own users. Helius, Birdeye and Shyft all sit in this band. |
| **Redistribution** | exchanges, custodians, issuers, funds | **quote, LSEG's ladder as the anchor** | Bulk history, event webhooks, an audit trail, and a signed artifact they can hand a regulator. |

Free tier economics are the structural advantage. A wallet lookup is a handful of RPC reads,
not a warehouse scan. Dune withdrew its free tier on 10 September 2026 citing compute cost;
that failure mode does not apply here.

**Non-dilutive money, in order of how soon it is reachable.** Solana Foundation grants are
rolling with a decision in about three weeks, and the *convertible grant for public goods
with a commercial component* is an almost exact description of an open-source correctness
library with a paid integration tier on top. Colosseum's accelerator is $250,000 per
startup, and the World's Fair hackathon runs to 12 October. A corporate-actions data project
has already won a Solana RWA track: **Autonom took Cypherpunk's RWA prize in December 2025**
with an oracle carrying corporate-action logic, then became Adrena's production oracle.

---

### Who this is for, and what each of them gets

**A holder** finds out what they were actually paid, for free, without connecting anything,
including everything that happened before they ever heard of us. On the two test wallets
that is thirteen and eleven months of payments that no wallet, explorer or tracker has ever
shown them.

**A wallet or portfolio app** gets a correct reader it does not have to write, and stops
showing a balance it cannot explain. xStocks' own developer documentation puts the
obligation on them — *"wallets and applications are responsible for applying the
multiplier"* — while giving them nothing to explain the change with.

**Tax software** gets income classified correctly rather than a balance increase booked as
phantom cost basis. The distinction is not academic: on our own numbers, counting splits as
income would overstate the market by **$2.3m on a $12.0m base**, and would tell a Netflix
holder they gained 900% on a position worth exactly what it was.

**An exchange or custodian** gets a reconciliation it currently does by hand, against the
$3–5m-a-year benchmark for running such a function.

**An issuer** gets a public, independent record that its corporate actions landed as
published — which is cheaper than being asked to prove it later.

**A fund or market maker** gets clean event data so a split is not mistaken for a return.

**A regulator or auditor** gets a reproducible trail: every figure on this site names its
source, its scope and the date it was read, and the method page shows the arithmetic.

### Built for this hackathon

Every line was written during Stocklana, from an empty repository. Next.js 15, no Solana
SDK: token reads go through plain JSON-RPC with `jsonParsed` encoding, so there is nothing
between the site and the chain's own view.

Before submitting, four adversarial reviewers were tasked with proving the published
figures wrong by routes the app does not use. They confirmed most of them — AAPLx's five
dividends hand-compounded to the chain's multiplier to the last digit — and broke several.
Every one is fixed and documented in `VERIFY.md`, including the one where our own headline
was seven times too high, and the one where every wallet figure was priced against today's
balance instead of the balance held on the day.

A separate pass read every sentence on the site as three different people: a holder who
owns 0.6 of a token, a judge with ten minutes, and a developer sent the link to fix wrong
balances. Thirty-four findings, in `COPY.md`. The ones that mattered were not stylistic: a
green "Fully backed" badge sitting above two figures that divide to 13%, a dash in the
paid column that both readers took to mean "paid nothing", and a count that silently shrank
whenever a price was missing.
