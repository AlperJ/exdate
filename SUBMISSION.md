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

### Roadmap — what a prize would build

The site proves the problem. It does not yet fix it, because the fix is not a website.

**1. A correct reader that other apps can drop in.**
The real failure is that no wallet shows these payments, and ours showing them helps only
the people who find us. Ship `@exdate/scaled-ui` — a tiny, dependency-free package that
resolves the multiplier correctly, handles pending activations, and distinguishes a
dividend from a split. Take it to Phantom, Solflare, Backpack and Step. One correct
integration helps more holders than our entire site ever will.

**2. Tell people before it happens.**
We know every payment 24 hours ahead because the issuer publishes it and the multiplier
change is staged on chain. A holder should get a notification the day before, not discover
it a year later. Email, Telegram, and a webhook for apps.

**3. The tax export nobody can produce today.**
A tokenized stock dividend is income in most jurisdictions, and there is currently no
record of it: no transaction, no statement, nothing to give an accountant. We can generate
one, per wallet, per year, from data that already exists.

**4. Every issuer, not one.**
Ondo Global Markets has 200+ tokenized stocks on Solana with the same class of mechanics.
Superstate, Remora and others are arriving. The same stock exists as several different
tokens with different prices; nobody compares them. We should.

**5. The audience that is not in a wallet.**
Most people who own these bought them on Kraken or Bybit, where the tokens sit in the
exchange's wallet and a lookup finds nothing. Whether those exchanges pass the dividend on
is undocumented. Finding out, and publishing the answer, would serve the largest group of
holders there is.

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
