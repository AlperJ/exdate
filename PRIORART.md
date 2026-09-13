# PRIOR ART — second search, 13 September 2026

The first search concluded "nobody does this". That was too strong, and this second search,
run because the finding was too convenient to trust, found the thing the first one missed.

Twenty-six agents across eight independent angles: Solana wallets and trackers, explorers and
indexers, the issuer and the venues, the same mechanic on other chains, tax and accounting
tools, hackathons and research, the holder's own point of view, and one told simply to prove
us wrong. Four of the eight found the same product without being told about it.

---

## 1. THE ANSWER, STATED PLAINLY

**Someone is already doing a close version of this, on the same chain, with the same token
extension, on the same assets, and has been since May 2026.** It is called SolanaRWA. We
must name it first and name it ourselves, because a judge who finds it after we have claimed
novelty will stop reading.

What survives is narrower and still worth building. SolanaRWA answers only for a wallet you
connect and control, and only for events that happen after you sign up. ExDate answers for
any address, for everything that already happened.

---

## 2. SolanaRWA — solanarwa.app

**Graded "close" by all eight agents that probed it independently. Real prior art on the core
idea.**

Same chain, same standard, same extension, same asset universe: SPL Token-2022
ScaledUiAmount, Backed's xStocks (it names sixteen mints: TSLAx, NVDAx, AAPLx, GOOGLx,
AMZNx, METAx, MSTRx, COINx, CRCLx, HOODx, BRKBx, MCDx, SPYx, QQQx, GLDx, DFDVx) plus Ondo
Global Markets. Same insight, in their own published words: a silent multiplier increase is a
taxable per-holder dividend. Same output concept: a dated, valued dividend income event
recorded once per wallet.

Their blog posts say it before we did:

- *On-Chain Dividends Are Silent. Your Tax Bill Isn't.* — 29 May 2026
- *How xStocks Dividends Work On-Chain* — 12 March 2026

Their method, quoted from that technical post:

> Every time you refresh your portfolio valuations, the system reads the current multiplier
> from the on-chain mint account for each xStocks token you hold. It compares this against
> the last recorded snapshot stored in our database.

Live and paid. Free tier: 1 wallet, 5 assets, manual valuations only. Auto-valuation, which
is the refresh that triggers dividend detection, sits behind Pro at $14.99/mo.

### Where it stops, each verified against their own pages

**It cannot look up an address.** Every route is wallet-gated: `/rwa` renders only "Connect
Your Wallet", `/rwa/reports` only "Connect Wallet to Start", and all three pricing tiers call
to action with "Connect Wallet". The string "wallet address" appears zero times on the site.
You cannot inspect a wallet you do not control, and there is no link you can send anyone.

**It only sees forward.** The mechanism is snapshot diffing against their own database, so a
wallet connecting today gets nothing for the events it already lived through. Their own
article concedes it:

> The most important thing is to track your dividends from the start. Retroactively
> reconstructing dividend history from multiplier changes is possible but more complex than
> recording them as they happen.

That reconstruction is the thing ExDate does.

**It values the payment against the wrong balance.** It computes "your token quantity
multiplied by the multiplier increase" — the quantity at refresh time, not the balance held
on the payout date. A holder who bought or sold in between gets a wrong number. This is the
same error we found in our own wallet pages and fixed on 13 September; ours now walks the
token account's transaction history to the balance actually held that day.

**It appears to book splits as dividend income.** Their rule, as published, is that when the
multiplier increases a dividend was paid. The word "split" does not appear anywhere in their
corpus. An agent checked the issuer's own public API against this: NFLXx's only multiplier
event is `reason: "Split"`, 1 to 10. KLACx has a Split from 1.0009 to 10.0089, a 900% jump,
sitting between two Dividend events of about 0.08%. TQQQx has a Split from 1.0006 to 2.0012
among 0.2% dividends. In a product that files to the ATO, IRS, HMRC and CRA, booking those as
dividend income is a serious misclassification, and the fix is free, because the issuer
publishes a `reason` field on an unauthenticated endpoint.

**It reads the mint directly and never mentions the stale field.** `newMultiplier` and
`newMultiplierEffectiveTimestamp` appear nowhere in their writing, so they are exposed to the
same trap.

### What to say if a judge raises it

SolanaRWA got to the insight before us and we cite them. They built the forward half, for
subscribers who connect a wallet. We built the backward half, for anyone with an address, and
we separate a split from a dividend, which their published method does not.

---

## 3. Lido stETH Reward History — the structural precedent, five years old

`stake.lido.fi/rewards`, plus a public API at `reward-history-backend.lido.fi/?address=0x...`
and a Rewards module in the Lido Ethereum SDK.

Paste **any** Ethereum address or ENS name. No wallet connection, no signature, no sign-in.
Get that address's per-day rebase attribution, totals, average APR, interleaved transfers,
and a CSV export.

That is structurally the same product as ExDate: a global scalar applied to a per-holder
constant, reconstructed per address, for an arbitrary address, with no onboarding. Different
chain, different standard, different asset — stETH is an ERC-20 whose balance is
`shares × totalPooledEther / totalShares` — but the same shape of problem and the same shape
of answer.

This strengthens the project rather than weakening it, and should be said out loud: the
pattern is proven, Lido shipped it years ago for staking rewards, and nobody had brought it
to tokenized equities on Solana.

---

## 4. Everything else, and where it stops

**Dune's curated RWA schema** (`rwa_multichain.unit_conversions`, `rwa_multichain.balances`)
ships both halves of the join as first-class tables, with the Solana rows explicitly modelled
on ScaledUiAmountConfig. The join itself is not done and no public dashboard does it. The
official xStocks Dune dashboard tracks AUM, not holders.

**The issuer's own API is fully public.**
`api.xstocks.fi/api/v2/public/assets/{SYMBOL}/multiplier/history?network=Solana` returns every
event with `previousMultiplier`, `multiplier`, `reason` and `activationDateTime`, with no key.
Per-asset event history is therefore **not novel to anyone**, and we do not claim it. There is
no wallet-scoped endpoint anywhere in the API: `/assets/{sym}/holders`,
`/assets/{sym}/dividends`, `/holders` and `/wallets/*/holdings` all return 404.

**Crypto.com** commits in its help centre to recording tokenized-stock dividends for
customers, on Cronos EVM, custodially.

**Kraken's** corporate-actions view covers Kraken Securities US equities, which are
DTC-settled off-chain shares in a broker-dealer account. It never mentions Solana or
Token-2022.

**Phantom, Solflare, Backpack, Kraken, Bybit and Birdeye** all apply the multiplier, so the
balance on screen is right. None shows the event, the history, or what you were paid.
Phantom's help page says only that your token balance may increase for xStocks.

**Mainstream tax tools do not handle it.** SolanaRWA's own May 2026 analysis names Koinly,
CoinTracker, CoinLedger, TaxBit and ZenLedger as treating a multiplier-driven balance rise as
phantom cost basis with zero dividend income. Help-centre searches confirm it: CoinTracker
returns "No results for xstocks", CoinLedger "0 search results", Awaken "0 search results" for
rebase, ZenLedger "We couldn't find any articles for: rebase".

---

## 5. THE NEGATIVE, DOCUMENTED

Eighty-five specific products, repos, queries and help centres were searched and found to have
nothing. Highlights: GitHub searches for per-holder multiplier attribution returned three
repos, all ERC-8056 on Robinhood Chain; Colosseum and Stocklana entries contain no xStocks
corporate-action tracker; Messari, Delphi, Galaxy, a16z and Binance Research have no
holder-level corporate-action work; Solana's own ScaledUiAmount integration guide states the
requirement and names nobody who meets it.

One agent exhausted its web-search budget before finishing its sweep and said so. This is a
much wider search than the first one, not a complete one.

---

## 6. WHAT WE CAN HONESTLY CLAIM NOW

Not "nobody does this". This:

> The issuer publishes the events and anyone can read them. One product, SolanaRWA, turns
> them into per-holder income for subscribers who connect a wallet, going forward from the day
> they sign up. What we could not find anywhere is the backward half: paste any address, with
> no sign-in, and see what it was already paid, valued against the balance it actually held on
> each payment date, with splits separated from dividends.

Every clause in that sentence is load-bearing, and each one is something SolanaRWA does not do.
