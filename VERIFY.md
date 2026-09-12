# EXDATE — VERIFICATION LEDGER
**Target:** https://exdate-ten.vercel.app
**Verifiers:** four adversarial, working independently, each from primary sources (Solana mainnet RPC, api.xstocks.fi, Jupiter lite-api)
**Snapshot under test:** `data/market.json`, measuredAt 2026-09-12T21:32:52.676Z
**Last commit:** edf4b21, 2026-09-13T01:21:37+03:00

Read this before anyone else reads the site. Nothing here is softened.

---

## 1. CONFIRMED

These reproduced from primary sources. Where two verifiers reached the same number by *different* routes, that is marked, because it is the strongest evidence in this document.

**Universe and event data**

- **832 tokenized assets, 832 unique Solana mints.** Three verifiers independently paged `/assets?network=Solana` to `hasNextPage: false` and each got 832 unique symbols, 832 distinct mint addresses, all 832 resolving on-chain with a `scaledUiAmountConfig` extension. **Three independent routes, same number.**
- **654 multiplier changes: Dividend 641, Split 8, Administrative 3, Reverse split 2.** Two verifiers crawled all 832 multiplier histories separately and returned identical tallies, 654 unique event ids, zero duplicates. **Two independent crawls, exact match.**
- **38 scheduled events ahead, from a feed of 539 rows, 501 already activated.** Three verifiers paged `/corporate-actions/upcoming` themselves and each got 38 / 539 / 501. The "roughly fourteen times too large" framing checks: 539 ÷ 38 = 14.18.

**The headline arithmetic**

- **$23,298,134 paid.** Rebuilt from scratch twice without reading `market.json`: $23,295,410 and $23,294,731. Both within 0.015%, consistent with price drift between the 21:32Z snapshot and the ~22:15Z re-fetches. Per-asset lines match *to the dollar*: PFEx $956,387, STRKx $817,133, TBLLx $734,915, CVXx $580,403, CMCSAx $559,223, PMx $545,240, PYPLx $3,818,017. **The arithmetic is faithfully what the site says it is.** What it measures is section 2.
- **257 payments, 65 assets, $2,545,447,410 of positions, 0.915% average payout.** Counts exact; float within 0.023%; the ratio is internally consistent and is genuinely the paying-asset float divided into the total.
- **Cumulative chart ends exactly at the headline** — difference 0.000000, equal by construction.
- **The chart's rescale is a real correction, not a fudge.** Summing per-event shares overstates the compounded path; the raw endpoint was 1.123% high and k = 0.988892 removes exactly that. Max distortion anywhere on the curve ≈ $68,000 on a $23m chart. (Caveat in section 3.)
- **Splits are excluded, and that decision is worth $151m.** Counting Split / ReverseSplit / Administrative as income would print $174,277,533 instead of $23,298,134 — 6.5x higher. The site publishes the smaller, correct figure. This is the single most consequential judgement call on the page and it is on the right side of it.
- **NFLXx's 10:1 counted as income would read $105,863,078.** Independently $105,779,948, 0.08% apart.

**The core thesis: stale vs in-force multiplier**

- **AAPLx: multiplier 1.0026642075893797 stale, newMultiplier 1.0032690125398187 in force, effective 1786149000 = 2026-08-08T00:30:00Z, in the past.** Reproduced by three verifiers off `getAccountInfo` jsonParsed. Decimals 8 confirmed. Mint is a real Token-2022 mint with metadata symbol AAPLx.
- **Drift 0.0603% — exact** (0.06031979059999415%).
- **The "in force" selection is right across the entire universe.** One verifier swept all 832 mints with `getMultipleAccounts`: exactly 3 with a future-dated change (CKAHx, CKHUTx, CITICx), 0 reverse cases, 0 mints missing. Largest drifts PPLTx/NFLXx 900%, PALLx 400%, CRWDx 300%, APHx 100%.
- **NFLXx is the 10x case and the site reads it right.** Reading the stale field would be ten times wrong.

**AAPLx's story, which is the one we tell**

- **0.33% paid, 3.269 AAPLx per 1,000 since launch.** Two verifiers hand-compounded the five issuer dividend ratios and got **1.0032690125398187 — identical to the chain's newMultiplier, difference exactly 0.** Issuer history and mainnet agree to the last digit. One of them cross-checked the gain by a second route (sum of raw multiplier deltas × 1,000) and got the same answer to 12 decimal places. **Two sources, two methods, zero disagreement. This is the strongest number on the site.**
- **AAPLx: 39,323 circulating on Solana, 114,943 held by the issuer, 90.3% of global float.** Verified two ways: one verifier enumerated *every* one of the 59,427 AAPLx token accounts via `getProgramAccounts` (prescaled sum matched mint supply to 2.3e-10, proving completeness); another enumerated the authority's holdings directly via `getTokenAccountsByOwner` and found exactly 2 accounts. Same figures. Both also confirmed the app's top-20 shortcut happened to be exact here.
- **The largest AAPLx account is owned by S7vYFFWH6BjJyEsdrPQpqpYTqLTrPRK6KW3VwsJuRaS, which is exactly the `scaledUiAmountConfig.authority` on the mint.** The key that can move the dividend multiplier owns 72.5% of the supply. The claim "held unissued by the issuer" is unambiguous and correct.
- **jsonParsed `uiAmount` is genuinely multiplier-scaled** (uiAmount/raw = 1.003269…), so the app is not mixing scaled and prescaled units anywhere.

**Calendar**

- **Withholding 0.3 means 30%, not 0.3%.** Proved two ways: across all 447 rows carrying 0.3, `1 − net/gross` is 0.300000 with zero rows deviating by more than half a point; and economically, AAPLx's net $0.189 against its on-chain ratio implies a $313 share price (sane), where gross would imply $447.60 (impossible). Decisive.
- **CKHUTx 13 Sept 2026, $0.09506, +1.0828%** — the multiplier change is *already staged on-chain* and its `newMultiplierEffectiveTimestamp` matches the issuer feed's `effectiveTimeUtc` to the second. The strongest possible check on a forward date.
- **PKGx $1.05 and KOx $0.371 at 30%** reproduce exactly from the primary feed.

**Wallet pages**

- **Position counts right.** 5 and 18. Non-xStock Token-2022 balances (pump.fun tokens and the like) correctly excluded, zero-balance accounts correctly dropped, legacy SPL accounts correctly ignored.
- **Effective balances match to 8 decimal places** against the validator's own `uiAmountString`, which applies the scaling server-side — an independent route that does not re-run our code.
- **heldSince dates correct** on all positions checked.
- **"A naive integration would understate by $23.78 / $40.24"** — independently $23.79 / $40.22. Correctly worded as a present-tense display gap, not as income.
- **Portfolio values** within 0.096% and 0.219%, consistent with live price movement.

**Reserves**

- **The site transcribes proof-of-reserves faithfully.** AAPLx 101.87% (44,372 / 43,558.78), NFLXx 101.51%, CITICx 103.41%, custodian names match `holdings[0].provider`. Verified by two verifiers.

---

## 2. ASSUMPTIONS

Correct arithmetic resting on a modelling choice. Each one, named plainly, with whether we disclose it and how far wrong it can go.

**A1. "Positions" means the mint's total supply.**
The dollar figures value every token that exists, including tokens the issuer minted and never issued.
*Disclosed:* yes — home page note 2, verbatim: *"Position values use the issuer's Solana supply, which includes tokens minted but never issued, so the dollar totals are an upper bound on what reached public wallets."* Also on the Method page.
*How wrong:* **the issuer's own wallet holds a float-weighted 80.2% of it.** It holds more than half the supply on 63 of the 65 payers (min 34.6%, max 91.8%). Removing that one provably-issuer wallet and repricing correctly takes $23.3m to **$3,363,940 — a 6.9x overstatement.** If the unlabelled wallet 9U76mo3W… is also issuer-side (see A2), it falls to **$1,575,789, a 14.8x overstatement.** The direction is disclosed. **The magnitude is not disclosed anywhere on the site.**

**A2. "The issuer" means exactly one address — the scaledUiAmount authority.**
`lib/solana.ts:222 treasuryHeld()` sums only accounts owned by that key. Everything else on chain is then asserted to be "in public hands."
*Disclosed:* no.
*How wrong:* this single assumption produces three visibly absurd prints — see W5. A second wallet, `9U76mo3WuP28s4kYJ9CMH1CiQh6Ph3r5Zg5awZM5vMQd`, holds positions in 702 of 832 xStock mints, routinely 20–40% of an entire mint's supply, 28,033,631 tokens in total, on an account carrying 0.296 SOL. It is System-Program-owned with no on-chain label, so **we cannot prove what it is.** But excluding it makes every asset's Solana float fall neatly under the issuer's global circulating figure, which it otherwise exceeds by up to 44,000x. The honest position: it is almost certainly issuer or bridge inventory, and we cannot attribute it.

**A3. Treasury is found via `getTokenLargestAccounts`, which returns at most 20 accounts.**
*Disclosed:* no.
*How wrong:* for all five assets enumerated exhaustively, the shortcut was exact, and on AAPLx the top 20 covers 97.06% of supply. But **the method has no way to detect its own failure.** If an issuer ever spreads inventory across 21+ accounts, treasury silently undercounts and "circulating on Solana" silently overstates, with no error and no flag. `getProgramAccounts` with a memcmp on the mint is exact and ran fast even on AAPLx's 59,427 accounts. "90.3% of global float" is really an upper bound presented as a point estimate.

**A4. Wallet pages assume the balance was unchanged since acquisition.**
*Disclosed:* yes — wallet page note, and Method page.
*How wrong:* **this is the dominant error term on wallet pages, not a footnote.** See W9. It broke on 18 of 28 payment rows for one test wallet, with a single row off by 151x.

**A5. Historical dividends are valued at today's price.**
*Disclosed:* yes — home page note 3, wallet note.
*How wrong:* the number is not a historical cash amount and would change daily for a wallet that never trades. Honest, but the headline word is "Received."

**A6. Jupiter's `usdPrice` is a sound valuation input.**
*Disclosed:* no — the Method page lists the source with no caveat. No sanity floor or ceiling is applied to any price.
*How wrong:* catastrophically, on seven assets. See W6 and W7.

**A7. The issuer's `reason` field decides dividend from split.**
*Disclosed:* the Method page publishes the breakdown but does not say the field is taken at face value.
*How wrong:* **that field is worth $151m.** It is never cross-checked against the `caType` in the corporate-actions feed, which carries CashDividend / ForwardSplit / StockDividend / SpinOff / ReverseSplit independently and is already being fetched. Note HONx is filed by the issuer as a "Split" with factor 0.9756 — a 2.4% *reduction*. The classification is not always what the word implies.

**A8. Proof-of-reserves numbers are true.**
*Disclosed:* the site presents them as the issuer's attestation.
*How wrong:* unauditable. Every "Fully backed" badge rests on an issuer self-attestation with no independent check available. We verified transcription, not custody.

---

## 3. WRONG OR SHAKY

Ordered by how much damage each does in a room.

**W1 — PYPLx, $3,818,017, the top row of the front page.**
16.4% of the headline. Jupiter prices PYPLx at **$3,337.04 against PayPal's actual $53.94 — a 61.9x error** — on a pool with **$0.05 of liquidity** and a blockId roughly 4.0 million slots stale. Two independent disproofs, neither using a price feed: proof-of-reserves says the entire PYPLx reserve is **5,623 PayPal shares**, while we value 284,000 tokens; and the two PYPLx dividend records each carry `netCashflowUsd` $0.098, so **at most about $1,102 of dividend cash ever existed behind PYPLx.** Overstated roughly **3,400x**. Visible to a visitor: yes, it is the first line of the largest-payers table.

**W2 — Seven of 65 payers are priced more than 30% off their own underlying.**
PYPLx 61.9x, SCHFx 10.8x ($305.52 vs $28.19), OPENx 4.2x, VXUSx 2.9x, DHRx 1.6x, TBLLx 1.5x, ASMLx 1.3x. Together they carry **$5,755,231 = 24.7% of the headline.** Fixing prices alone, leaving the supply basis untouched, takes $23,295,410 to **$18,209,004, down 21.8%.** The feed is fine in aggregate — median jup/implied across payers is 1.0269 — these are not drift, they are broken quotes. **The data needed to catch all seven was already in hand and unused:** Jupiter returns the underlying equity price in a `stockData` block in the same payload. A one-line check would have caught every one.
Related: **37 of 65 payers have under $1,000 of DEX liquidity behind their quote, carrying 56.6% of the headline.** Nothing printed is false, but the majority of the number is priced off pools where nothing trades — which is exactly why the stalest quotes never refresh.

**W3 — Three asset pages claim a dividend that has not happened.**
CITICx, CKAHx, CKHUTx. `lib/report.ts:386` computes `divFactor = dividendFactor(history)` over the entire issuer history **with no time filter**, while the stat band correctly resolves the chain against `newMultiplierEffectiveTimestamp`. Result: the same page says, in the past tense, that holders *"grew by 1.77%"* and *"gained 17.3688 CITICx"* — and four lines below says *"Multiplier in force 1.0000000000"* and *"Payout incoming… moves to 1.017675790 on 13 Sept 2026."* The chain says multiplier = 1 and the event is **25.6 hours in the future**; the issuer's own forward feed lists it `status: "Scheduled"`. The true gain is **zero**. Visible to a visitor: yes, and the contradiction is on one screen.
**W3b —** on those same pages the headline and the history table print **two different numbers for the same event**: 17.3688 per 1,000 in the headline (`effective × (1 − 1/divFactor)`, `report.ts:417`) against 17.6758 in the table (`1000 × (to − from)`). They differ by 0.307 tokens per 1,000. On AAPL and PFE the two formulas agree exactly, because there `effective == divFactor × splitFactor`. The identity breaks the moment a pending event desynchronises them, and **nothing on the page ever compares div × split against the chain's effective multiplier**, so the desync is never surfaced.
The wallet view already does the right thing — it filters history by `heldSince`. The asset view has no equivalent filter. One filter fixes the headline, the per-1,000 figure and the self-contradiction at once.

**W4 — `if (mult <= 1) continue;` — `scripts/snapshot.mjs:67`.**
The guard tests whether the multiplier is currently above 1, not whether it has ever moved. It silently discards **AZNx**, which has 3 real dividends, 2.2273% compounded dividend growth, a $13,502,814 float and $294,189 of dividend value — because a reverse split left its effective multiplier at 0.5111362527152737. Consequences, all visible:
- `/assets` says **344** assets have had their multiplier moved. Truth is **348** (344 above 1, one below, three at exactly 1).
- `/assets` says **338** assets have paid a dividend. Truth is **342**.
- The index rows sum to **635** dividend payments. Truth is **641**.
- **AZNx does not appear on `/assets` at all.** Grepping the live HTML for AZNx, CKAHx, CKHUTx and CITICx finds none of them.
- The headline understates **its own definition** by $294,189 (+1.3%) and 3 payments.
The failure is silent by design: an asset vanishes from the totals with no trace in the output.

**W5 — "in public hands" contradicted by the reserves block in the same viewport.**
Because of A2, every issuer-side address other than the multiplier authority is reclassified as public float:
| Asset | Site prints "in public hands" | Issuer's global circulating, printed four lines away | Gap |
|---|---|---|---|
| APHx | 24,297.74 | 0.55 | **44,026x** |
| PFEx | 94,494.18 | 12,636.53 | 7.5x |
| NFLXx | 41,628.46 | 16,469.92 | 2.5x |
Strip wallet 9U76mo3W… and the residuals become 0.09, 11,559.77 and 14,329.20 — all comfortably under the issuer's global figures. **The site half-detects this and does nothing about it:** it suppresses "Share of global float" as "not comparable" and prints a "Dormant" badge on APHx — so it knows something is wrong — then still asserts the float line with no caveat and still shows a green **"100.22% / 101.51% Fully backed"** beside it. 12,664 custodied shares cannot back 94,494 tokens. The guard protects the derived ratio and leaves the input visible and unqualified.

**W6 — Home page: "Of the 344 stocks whose number has moved, 11 moved because the underlying stock split rather than because anyone was paid."**
Wrong three ways at once:
- AZNx is a twelfth asset with a non-dividend move and is missing (W4).
- Only **8** of those events are actually `reason: "Split"`. KRAQx, CMCSAx and HONx moved on an **"Administrative"** event. The cause is `scripts/snapshot.mjs:138`, which selects on `splitFactor != 1`, and the loop at line 67–72 sends *everything non-dividend* into `splitF`. **The front page therefore contradicts our own Method page**, which correctly publishes Split = 8.
- "rather than because anyone was paid" is **false for four of the eleven**: KLACx paid 2 dividends, TQQQx 4, CMCSAx 5, HONx 6.

**W7 — Home page: "Payments recorded 257 — dividend events since June 2025."**
257 is the number of dividend events on the 65 assets that both paid *and* happened to have a Jupiter price at snapshot time. The real number of dividend events since June 2025 is **641**, across 342 assets. **The label as printed is wrong by 384 events.** "Since June 2025" is correct (earliest is UNHx, 2025-06-24T14:00:00Z). The tile also sits beside "Tokenized assets 832" and above an `/assets` page saying 338 assets have paid, inviting a reader to map 257 onto either — when the gate is nothing more principled than whether Jupiter returned a price.

**W8 — Wallet dollar totals are wrong in both directions.**
| Wallet | Site | True | Error |
|---|---|---|---|
| 9SjWLbuf… | $81.32 | $87.57 | understated 7.69% |
| 7BCp5XUX… | $118.62 | $93.58 | **overstated 26.75%** |
Reconstructed by walking `getSignaturesForAddress` then `getTransaction` per signature and reading `pre/postTokenBalances` — the balance actually held at each multiplier event. **18 of 28 rows on the second wallet use a balance the wallet did not hold at the time.** Worst cases: SPYx 2025-10-31 printed **$5.71** against 0.0492 tokens actually held — true $0.038, **151x overstated**; GOOGLx 2025-12-15 printed $5.83 against 0.46704 held — true $0.072, **81x**. QQQx runs the other way and is understated. The counts beside the dollars ("Positions paying 3 of 5", "Payments 12") are *correct* — the events did happen while held — which lends an air of precision to the figure next to them.
The site could compute the real answer cheaply: `firstSeen()` already walks `getSignaturesForAddress`, so the balance timeline is one `getTransaction` per signature away.

**W9 — A live landmine in `firstSeen()` (`lib/solana.ts:196`).**
It returns `null` when a token account has 1,000 or more signatures. `lib/report.ts` then falls through to `since ? … : true` and counts the asset's **entire** payout history as received by that wallet. A wallet holding a busy account — an AMM LP, an exchange hot wallet — would get a wildly inflated "received" figure behind only a soft note about "accounts too busy to date cheaply." Neither test wallet triggered it. **This is unobserved, not absent.**
Minor, same function: it does not filter failed transactions. One test wallet's AAPLx `heldSince` points at a transaction with `err` set; the real first receipt was 3.5 minutes later. Harmless there, but `heldSince` can predate any actual holding.

**W10 — The per-1,000 column in the history table uses a different formula from the headline and carries the same label.**
The table prints `1000 × (to − from)` — the raw multiplier delta — under a header reading "per 1,000 AAPLx held." That is the gain for someone holding 1,000 tokens **at launch**, not 1,000 today. AAPL's last dividend prints **+0.6048**; a holder of 1,000 the day before actually gained **+0.6032**. PFE's last prints **+12.5308** against a true **+12.0351**. The numbers stay internally consistent (the raw deltas sum to the headline). The label overstates what a current holder received.

**W11 — The chart rescale is legitimate but crude.**
The sign is right and the 1.123% correction is the correct size. But a flat `k` is exact at the endpoint and wrong by −1.111% in the early months, where the raw series happens to already be correct. **Max error of the scaled series is 1.111%; max error of the unscaled series is 1.184%.** The rescale buys almost nothing — it moves the error from the end of the curve to the start. The exact compounded series is one pass away and would have been strictly better. Nothing is hidden; the distortion peaks around $68,000 on $23m.

**W12 — Wrinkles inside the 539-row feed.**
It contains only **525 distinct eventIds** — eight repeat, one of them five times, producing 14 duplicate rows. And **10 rows have `effectiveTimeUtc: null`**; since `+new Date(null)` is 0, they silently sort into the "already activated" bucket and are counted among the 501. They are neither past nor future — they are undated, and nothing says so. **The 38 is unaffected by both.** Our wording ("returns 539 rows") is literally accurate, but the page presents 539 as an event count in spirit when it is a row count.

**W13 — Undated hardcoded literals.**
`$105,863,078` for NFLXx is a JSX literal with no source line and no as-of moment. The AAPLx multiplier values on the home page sit under the meta "AAPLx, read from mainnet" with no date (the Method page does date them: "Read live from AAPLx on 12 Sept 2026"). The Method page's "654 multiplier changes across 832 assets" carries no as-of date at all. All were true when written and all are still true today — but they will rot silently.

**W14 — One number may be too low, and we cannot size it.**
STRCx is 15.9% of the headline and runs opposite to everything else: its proof-of-reserves reports 1,463,165 STRC shares held across all chains against a Solana mint of only 469,920 tokens. Unlike every other asset, its Solana float may *understate* its true payout. No non-Solana RPC was available, so this could not be separated.

---

## 4. STALENESS

**Frozen in the repository.** `data/market.json`, one run, `measuredAt 2026-09-12T21:32:52.676Z`. It is a committed file, not a live fetch. Everything on these pages comes from it:

- `/` (home) — `revalidate = 900`
- `/assets` — `revalidate = 900`
- `/calendar` — `revalidate = 900`
- `/method` — imports it
- the OpenGraph image — imports it

**The `revalidate = 900` on those routes re-renders the same frozen JSON.** It refreshes the page, not the numbers. A reader watching the clock would reasonably infer fifteen-minute freshness; the underlying figures only change when someone re-runs `npm run snapshot` and redeploys.

**Live on every request.**

- `/asset/[symbol]` — `revalidate = 300`
- `/wallet/[address]` — `revalidate = 120`
- Jupiter prices — `revalidate = 60` (`lib/price.ts:13`)
- xStocks endpoints — `revalidate = 300` default (`lib/xstocks.ts:78`)

**Is one presented as the other?** Mostly no, and this is handled better than the rest of the site. Home page note 1 is explicit: *"Aggregate figures were measured on {asOf} across all 832 assets… Asset and wallet pages read live on every request."* The headline carries "as of 12 Sept 2026." That is honest and it is the right sentence.

**Three exceptions to flag before anyone finds them.**

1. **The calendar's "38 ahead" will be wrong within hours.** The earliest scheduled events — CKHUTx, CITICx, CKAHx — activate **2026-09-13T23:55:00Z, today.** Once they do, the snapshot still says 38 while the truth is 35, and the /calendar page presents that count with the immediacy of a live feed. **Re-run the snapshot before any demo.**
2. **The Method page's "654 multiplier changes across 832 assets" has no as-of date,** while the AAPLx section directly above it does. It reads as a live figure.
3. **Asset pages, which are genuinely live, sit one click from home-page aggregates that are a day old.** A visitor comparing an asset page's figure to the home page's table could see a small discrepancy with nothing explaining it.

At the time of writing the snapshot is roughly a day old. Every verifier's re-fetch landed within 0.015%–0.23% of it, which is normal price drift — so the age has not yet distorted anything. It will.

---

## 5. WHAT A JUDGE COULD ATTACK

Three questions, with the honest answer. Not the defensive one.

---

**Q1. "Your front page says $23.3 million was paid into Solana wallets. Whose wallets?"**

**Mostly nobody's, yet.** The dollar figures value the mint's total supply, and **80.2% of that, float-weighted, is the issuer's own unissued inventory** — sitting in `S7vYFF…`, which is provably the issuer because it is the `scaledUiAmountConfig` authority on every mint, the key that sets the multiplier in the first place. It holds more than half the supply on 63 of the 65 payers.

The defensible figure for what reached public wallets is about **$3.4 million**, a 6.9x overstatement. If the unlabelled wallet `9U76mo3W…` is also issuer-side — and its shape says it almost certainly is, 702 mints, 28 million tokens, 0.296 SOL — then about **$1.6 million**, a 14.8x overstatement.

We do disclose the direction, on the home page itself, as note 2. **We do not disclose the magnitude, and the caveat is an ordered-list note beneath a figure rendered at display size.** The word "paid" and the word "positions" both do work in the headline that the note then quietly takes back.

The underlying mechanism the site exists to explain — that dividends arrive as a silent multiplier change and naive integrations miss them — **is completely unaffected by this.** That claim is proven, on-chain, to the last digit. It is the dollar aggregate that is inflated.

---

**Q2. "Your single biggest line is PYPLx at $3.8 million. Is it real?"**

**No.** Jupiter quotes PYPLx at $3,337.04 against PayPal's actual $53.94, a **61.9x price error**, on a pool holding **five cents** of liquidity whose last update is about four million slots old. Against the issuer's own records — 5,623 PayPal shares in custody, two dividend events at $0.098 net per share — **at most about $1,100 of dividend cash has ever existed behind PYPLx.** The figure is overstated roughly 3,400x.

It is 16.4% of the headline and the top row of the largest-payers table. Six more assets are priced more than 30% off their underlying; together the seven carry 24.7% of the headline, and fixing prices alone drops it by 21.8%.

The part that stings: **Jupiter returns the correct underlying equity price in the same payload, in a `stockData` block we already receive.** A single comparison — reject a quote more than 25% from it — would have caught all seven. We had the data to self-check and did not use it.

---

**Q3. "Your CITICx page says holders 'gained 17.3688 CITICx.' Four lines down it says the multiplier in force is 1.0000 and the payout is incoming. Which is true?"**

**The second.** Nobody has gained anything. The dividend activates 2026-09-13T23:55:00Z; the chain says `multiplier: 1`, and the issuer's forward feed lists it `status: "Scheduled"`. The true gain is zero.

The cause is one line: the headline compounds the issuer's whole payout history with no time filter, while the stat band correctly resolves the chain against its effective timestamp. Three assets are affected today — CITICx, CKAHx, CKHUTx — and **any asset whose first dividend is scheduled but unactivated will print a payout that never happened.** The same page also prints two different numbers for that one event, 17.3688 in the headline against 17.6758 in the table, because the two formulas only agree while the effective multiplier and the dividend factor are in sync.

The wallet view already filters history correctly by `heldSince`. The asset view simply never got the equivalent filter. **It is a one-line fix and it was not made.**

---

**Two more that could come up, and should not catch anyone off guard:**

- **"Your page says 24,297.74 APHx are in public hands and 0.55 exist across all chains."** Both are printed, four lines apart, and they differ by 44,026x. We define "the issuer" as exactly one address, so every other issuer-side wallet is reclassified as public float. The site already knows something is wrong — it suppresses the float percentage as "not comparable" and prints a "Dormant" badge — and then prints the contradictory raw number anyway, beside a green "Fully backed."

- **"Why isn't AZNx on your assets page?"** Because `scripts/snapshot.mjs:67` drops any asset whose multiplier is not currently above 1, and AZNx's reverse split put it at 0.51. It has three real dividends and $294,189 of value. The guard tests the wrong thing — whether the multiplier has *moved* is the question, not whether it is *high* — and it throws assets away silently, which is why our own "344" and "338" and "11" are each off by one asset.

---

### Bottom line for the person standing up

The **mechanism** is proven and survives every adversarial route tried against it: the stale-versus-in-force multiplier read is correct on all 832 mints, the issuer's dividend history reconciles with mainnet to the last digit on every asset checked, the split exclusion is worth $151m and is on the right side of it, and the 30% withholding reading is proved two independent ways.

The **aggregate dollar figure** is arithmetically exact and conceptually inflated by roughly 7x, with one broken price feed contributing a further 16% of it that is wrong by three orders of magnitude.

The **per-asset and per-wallet pages** are right where the data is clean and confidently wrong on three specific, reproducible, one-line-fixable cases.

Lead with the mechanism. Do not lead with the $23 million.