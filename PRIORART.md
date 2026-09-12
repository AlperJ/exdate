## 1. THE ANSWER

Nobody is doing the specific thing — joining a Token-2022 multiplier change to a specific Solana wallet's position and stating what that wallet was paid — but the space around it is considerably more crowded than the project's framing assumes, and at least six independent parties have already found the same underlying insight and built adjacent pieces of it. The honest claim is not "nobody saw this"; it is "several people saw it, everyone stopped one join short of the holder, and one team (Dinari) ships the holder-facing record for a different mechanism on different chains behind a KYC wall."

Two of the four things the project has been treating as its own are not: the forward calendar and the dividend-vs-split distinction are both free, unauthenticated, public data from the issuer. Lead with the attribution, not the data.

## 2. CLOSEST THING THAT EXISTS

**1. Dinari — `GET /api/v2/accounts/{account_id}/dividend_payments`** (graded DIRECT)
Does: the literal sentence. Per-account record of dividends actually paid — stock id, payment date, amount, currency — alongside an announced-dividend calendar and separate split handling.
Stops at: its own dShares on EVM chains (Ethereum, Base, Arbitrum, Avalanche, Plume), never xStocks, never Solana, never a multiplier. Dinari pays a real USD+ transfer, so the payment is already visible in the wallet — the invisibility problem does not exist there. It is a B2B enterprise API behind `X-API-Key-Id`/KYC'd account objects, keyed on a Dinari account, not an arbitrary pasted wallet. Their own docs hand the user-facing step to the integrator.
Say to a judge: "Dinari shows their own KYC'd customers a statement for cash dividends they already received as a transfer; we show any self-custody wallet a payment that never appeared as a transfer at all. Different mechanism, different chain, different audience — but yes, per-holder dividend records are not a new idea in tokenized equities."

**2. Scallar (scallar.finance)** — the one most likely to embarrass you
Does: live indexer, free public API and explorer for ERC-8056 Scaled UI Amount stock tokens on Robinhood Chain. Full per-token multiplier history keyed to block and tx hash (`oldMultiplier`, `newMultiplier`, `changePct`), and multiplier-corrected `uiBalance` next to `rawBalance` on every position and holder row.
Stops at: the join. `/v1/balances/{address}` gives current corrected positions; `/v1/balances/{address}/history` gives transfers only. No per-wallet, per-event payout record, no forward calendar, no dividend-vs-split labelling (their docs say splits "move the same scalar... will appear in this same feed" — undifferentiated). Robinhood Chain only.
Say to a judge: "Scallar reached the same conclusion we did on a different chain and stopped one query short — they correct your balance, we tell you which event moved it and what it paid you." Be ready: their marketing line is almost word-for-word the project's pitch ("technically correct and quietly wrong"). If the pitch deck uses similar phrasing, change it now.

**3. Backed / xStocks public corporate-actions API** (`api.xstocks.fi/api/v2/public/corporate-actions/*`)
Does: free, unauthenticated, no key. 694 historical events, 539 scheduled ones, each with `caType` (CashDividend / ForwardSplit / StockDividend / SpinOff / ReverseSplit), `multiplierOld`, `multiplierNew`, `grossCashflowUsd`, `netCashflowUsd`, `withholdingTaxRate`, `effectiveTimeUtc`. Plus `/public/assets/{symbol}/multiplier/history`. The older `api.backed.fi/api/v1/token/{SYMBOL}/multiplierUpdates` returns the same with a `reason` field.
Stops at: no holder dimension anywhere. The full OpenAPI path list contains no wallet-scoped endpoint; the authenticated `/client/*` family is for onboarded issuer partners, not retail. It has no notion of a balance, so it cannot tell anyone what they were paid.
Say to a judge: "The issuer publishes the events. We publish the consequence. The calendar is theirs and we cite it; the attribution is ours." Do not claim the calendar as an invention — a judge can curl it in ten seconds.

**4. Bybit — xStocks trading page (Multiplier + Multiplier History)**
Does: ships to retail today a live multiplier plus a multiplier history table with Event Type and timestamp, and a token-price/underlying-price toggle. This is a dividend-vs-split distinction in a retail UI.
Stops at: per-asset chart annotation, not per-holder. Logged-in Bybit users only, and only for balances held on Bybit. A user reading "Event Type: dividend, 1.0229 → 1.0273" still cannot tell what it was worth on their own position. Bybit also explicitly denies entitlement: xStocks "do not grant holders any voting rights, dividend entitlements or legal claims."
Say to a judge: "Bybit annotates the asset; we attribute to the holder. And only if you keep your tokens on Bybit."
Known unknown: nobody on the research team had a Bybit account, so how much that history panel actually renders (numeric old/new values? cash per share?) is unverified. If a judge has an account, they can out-detail you. Assume it shows the numbers.

**5. CF Benchmarks — CFB xStocks Corporate Action Feed (v1.0, 7 May 2026)**
Does: regulated index administrator's standardized feed turning Backed's raw data into adjustment instructions — Effective Scale Factor, per-Token Cash Amount, Settlement Price, a Cashflow / Structural / Termination taxonomy (i.e. dividend vs split, formalized), a Pending→Effective lifecycle giving advance notice, and versioned corrections. It reasons explicitly about Raw Balance × Multiplier.
Stops at: subscription B2B. Its three stated consumer sections are perpetual futures, margin/collateral, and options venues. No wallet, no holder, no payment record, and it is fed by the issuer rather than read off chain.
Say to a judge: "The institutions have a paid feed so their derivatives don't mis-settle. The person holding the token in Phantom has nothing. That asymmetry is the product."

**Also named, so you are not surprised:** RWAct (`Otomatorg/xstocks-hackathon-backend`) turns a `MultiplierUpdated` delta into a stated dividend-per-share push notification — conceptually the closest anyone has come, but Ethereum via ethers.js, per-share not per-wallet, unmaintained hackathon code. ShareLens (`bellabaelfire/stocklana-sharelens`) is Solana xStocks, independently found the stale-field trap, fails closed on it — but inspects "a hypothetical 100 raw tokens," never a wallet. Corporate Action Guard (`gnanam1990`) turns the same stale-multiplier trap into a preflight guard for integrators. Ondo has all three ingredients — `/assets/{symbol}/dividends` (with upcoming dates), `/assets/{symbol}/shares-multiplier`, `/chains/{chainId}/balances` filterable by `userAddress` — and has assembled none of them; that is your clearest "why the gap exists" exhibit and also a second asset family with the identical problem. Jupiter Portfolio and Solana Explorer resolve the multiplier correctly and say nothing about why. Kraken's own FAQ states the gap for you.

## 3. WHY THE GAP EXISTS

Rule out two explanations first, because the evidence kills both.

**Not "nobody realised."** At minimum Scallar, RWAct, ShareLens, Corporate Action Guard, `erc8056-evidence`, CF Benchmarks and MetaMask all realised. MetaMask's merged PR #509 carries the comment "accurate cosmetic balance calculations (e.g., yield, dividends, splits)" — the team understood the mechanic and shipped only a corrected number. Multiple independent discoveries, zero products.

**Not "the data is hard to reach."** It is a free unauthenticated REST API plus `getAccountInfo jsonParsed`, which already applies the multiplier. Two researchers pulled live values from a laptop with curl.

The four causes that actually hold:

**(a) The mechanism was designed to require nothing of the holder, so no one in the chain acquired a reporting duty.** Backed: "No action is required from token holders." Ondo: "holders don't need to claim anything." Kraken: "There is no separate cash credit or line item." Every party states this as a feature. A feature nobody must act on is a feature nobody must report, and the design intent propagated into every integration.

**(b) Everyone who touched the extension was solving correctness, not reporting.** Solana Explorer's tooltip ("Scaled {raw} by {multiplier} due to the scaled ui amount extension"), Birdeye's `ui_amount_mode`, MetaMask's snap, Chainlink's pause/unpause protocol, Corporate Action Guard's preflight, defi.xstocks.fi's own `fetchTokenMultiplier` — all of it exists to stop a displayed number being wrong. Stopping a number being wrong is a bug fix someone owns. Explaining why it changed is a product nobody owns.

**(c) The audience is structurally invisible and generates no revenue.** Where an operator had a commercial obligation to a logged-in user, the feature exists: Bybit built the history panel, Kraken documented the policy, Dinari built the per-account endpoint, CF Benchmarks sells the feed. Self-custody holders have no counterparty, no account object, no support ticket, and no one billing them. Backpack is the tell in the other direction — it has a page literally titled "Your holdings, dividends and corporate actions" and ships none of it ("Still being worked on"), plus "Tax documents (statements / cost basis / P&L) — Not provided, keep your own records."

**(d) The legal framing chills the word "payment."** Bybit states xStocks confer no dividend entitlement; Backed sells only to qualified investors. If you are an exchange or issuer, calling a multiplier tick a dividend payment to a holder creates a claim you have explicitly disclaimed. A third party with no entitlement to disclaim can say it plainly. That is a real structural advantage and worth saying out loud.

Recency is a minor factor, not the main one — Explorer support merged May 2025, Birdeye July 2025, the CF Benchmarks feed May 2026 — so the window has been open roughly sixteen months, long enough that "it's new" alone does not explain it. And the one genuinely hard part, reconstructing a wallet's historical balance across each effective timestamp, is expensive precisely for the per-asset data vendors who have no reason to do it.

## 4. WHAT THIS MEANS FOR THE CLAIM

**The sentence as written — "no wallet, explorer or portfolio tracker on Solana reports these payments" — is defensible but fragile, and I would not ship it unqualified.** Three weaknesses: "reports these payments" is loose enough that a judge can point at Bybit's multiplier history, or at the issuer's own free API, and say the events are reported; the category list excludes exchanges, which will read as gerrymandering if challenged; and several Solana surfaces were genuinely uninspectable (Solscan, Zapper, CoinStats, closed-source wallet clients), so "no" is stronger than the evidence supports.

**Exact replacement wording:**

> As of 13 September 2026, no Solana wallet, explorer or portfolio tracker we could inspect attributes these balance increases to the corporate action that caused them. The issuer publishes the events; nobody joins them to a wallet. Solana Explorer, Jupiter Portfolio and Birdeye all apply the multiplier correctly and none of them says why your balance moved, what it was worth, or when the next one lands.

If you need one line: **"The events are public. The payments are not — because nobody joins them to a holder."**

Sentences to delete from the site immediately, because they are false and cheaply falsifiable:
- Any claim that no forward calendar of these events exists. `api.xstocks.fi/api/v2/public/corporate-actions/upcoming` returns 539 scheduled events, free, no key.
- Any claim that nobody separates a split from a dividend. `caType` does exactly that in the same free API; CF Benchmarks formalizes it; Bybit surfaces it to retail.

**Evidence you can cite when challenged, strongest first:**
- Kraken's own xStocks FAQ (updated 8 April 2026): "There is no separate cash credit or line item, the increase appears as a higher effective token balance in your portfolio." An exchange telling its own users the record does not exist is the best third-party statement of the gap you will ever get.
- Backpack's own feature table: cash dividend payouts and "Splits & corporate actions reflected in your balance" both marked "Still being worked on"; tax documents "Not provided."
- Solana Explorer source: `getCurrentTokenScaledUiAmountMultiplier` and `ScaledUiAmountMultiplierTooltip.tsx` resolve the multiplier and explain only the scaling; a grep of the whole `app/` tree returns zero hits for dividend, corporate action, xstock, stock split, payout.
- Jupiter: 3.6 MB of shipped JS scanned, zero occurrences of dividend, corporate action or ex-date outside an unrelated TradingView constant.
- Backed's own docs prove the ambiguity you resolve: a dividend moves the multiplier 1.0 → 1.008, a 4-for-1 split moves it 1.008 → 4.032. Same number, no label, on chain.
- The xStocks OpenAPI path list contains no wallet- or holder-scoped endpoint at all.

One housekeeping item: `github.com/BacBacta/Exdate` surfaced in a public GitHub search with PRs dated 6 September 2026. If that is yours, its PR titles are public and a judge can read them. Check what they reveal before demo day.

## 5. WHERE WE DID NOT LOOK

State this in the deck, not just here. Silence in these places is not evidence.

**WebSearch was unavailable for this entire session.** Everything above came from direct HTTP fetches, GitHub issue/PR search, repo clones, shipped-bundle greps and live API probes. No general web search was performed. Anything that exists only as a blog post, a tweet, a Product Hunt listing, a Discord announcement or an unindexed landing page was never seen.

**GitHub code search was unavailable** — `api.github.com/search/code` requires auth, returned 401, no `gh` CLI and no token. So no true repo-wide code search for `scaledUiAmount` across all of GitHub. Substituted issue/PR search plus full clones of the repos that mattered. grep.app returned a Vercel security interstitial on every request; searchcode.com's API now 404s.

**Blocked or unreachable, therefore unassessed:**
- Solscan — Cloudflare challenge on both solscan.io and api-v2.solscan.io. Docs index read (61 entries, no token-extension content) but the live product was never seen. This is the single largest hole, given Solscan's position.
- Zapper — Cloudflare 403 on root, sitemap and llms.txt. Completely unassessed.
- CoinStats — docs domain does not resolve, API serves an empty SPA shell. Unassessed.
- Ondo's live public API — HTTP 403 geo-block from this location on every call, despite `security: []` in their spec. Endpoint contracts read from the OpenAPI; live dividend and multiplier values never seen, and whether `/v1/chains/{chainId}/balances` truly accepts an arbitrary `userAddress` in production is unverified.
- Ondo Global Markets app — geofenced and wallet-gated; the logged-in holder view was never inspected.
- Bybit's live trading page — logged-in only. The multiplier history panel's actual detail level is inferred from Bybit's help docs, not observed.
- Securitize investor portal — auth-gated; `docs.securitize.io` 404s.
- Helius Orb explorer — HTTP 429.
- learn.bybit.com — 403 to non-browser clients.
- Remora Markets — every domain parked, misconfigured or non-resolving. Product unassessable.
- `sonarwatch/portfolio` — repo deleted or private, so Sonar Watch's historical handling cannot be verified from source.

**Structurally uninspectable:** the shipping Phantom, Solflare and Backpack browser extensions and mobile apps. Only marketing sites, help centres, public docs repos and published snaps were readable. Critically — because `jsonParsed` RPC already applies the multiplier to `uiAmount`, any of these wallets may display a correctly scaled balance with no code of its own. Absence of evidence in their public surfaces proves only that none of them *explains* the change, not that none of them handles it. That distinction is exactly what the revised claim wording preserves, and it is the honest version.

**Partially covered:** Step Finance's Next.js entry bundles were scanned exhaustively (3.87 MB, 23 files, zero hits on ten terms) but per-route chunks that load only after wallet connection were not enumerated. Same caveat class applies to any lazily-chunked SPA scanned this way.