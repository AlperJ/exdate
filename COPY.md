# ExDate copy worklist

Ordered by impact. "Flagged by" counts are out of the three persona reports that arrived intact (Holder, Judge, Dev); the fourth report was cut off mid-sentence and never delivered, so nothing here is attributed to it. All counts and figures below were checked against `data/market.json` and `lib/report.ts` before writing, and no number changes.

---

### 1. "Yield" is not a yield
**Page:** home, Largest payers table; /assets, paying table (`app/page.tsx:102`, `app/assets/page.tsx:52`, definition at `app/assets/page.tsx:128`)
**Current words:** column header `Yield`, values `8.089%`, `5.371%`, `0.327%`; defined only in a note under a 338-row table as "Yield is the compounded dividend growth since the token was issued"
**Why it fails:** every reader of a finance table reads "Yield" as annual. It is lifetime compounded growth, so a token that launched earlier scores higher for no reason. The Holder had already compared AAPL against PFE on it before finding the note; the Judge says someone will screenshot "STRCx 8.089%" as an APY; the Dev says the number is unusable for assertions.
**Flagged by:** Holder, Judge, Dev (3 of 3)
**Replacement:** rename the column to `Growth since launch` and put under both tables: "Growth since launch is everything the token has paid, compounded, since it was issued. It is not an annual yield: a token that launched earlier will show a bigger number."

---

### 2. "naive readers understate by 900.0000%"
**Page:** every asset page, stat block (`app/asset/[symbol]/page.tsx:147`)
**Current words:** label `Stale multiplier field`, value `1.0000000000`, note `naive readers understate by 900.0000%` (AAPL: `0.0603%`)
**Why it fails:** three separate failures in six words. The percentage is the ratio of the two multipliers, not an understatement: reading 1.0 when the truth is 10.0 hides 90% of the balance, so "understate by 900%" is arithmetically wrong on the one page a developer goes to reconcile numbers. "Naive readers" reads as an insult to the wallets and trackers this site wants to convert. And the Holder read "understate by 900%" as being down 900 percent on her own money.
**Flagged by:** Holder, Judge, Dev (3 of 3)
**Replacement:** "The value in force is 900% higher than the stale field, so an app reading the stale field shows a tenth of the real balance." (AAPL: "The value in force is 0.0603% higher than the stale field, so an app reading the stale field shows a balance slightly too low.")

---

### 3. "Understatement if read naively $479,225.72 / see note 1"
**Page:** /wallet/[address], stat band (`app/wallet/[address]/page.tsx:102`)
**Current words:** `Understatement if read naively` `$479,225.72` `see note 1`, sitting beside `Received without a transaction $230,170.76`
**Why it fails:** the bigger number on the page is not money anyone is owed, and nothing at the point of the number says so. The Holder read it as $479,000 being hidden from the wallet owner. The Judge thought the site was contradicting itself. The Dev, who actually wants this number, could not tell what the naive read or the correct read was, and lost thirty seconds working out how an error can exceed the dividends. The pointer to an unnumbered note makes it worse.
**Flagged by:** Holder, Judge, Dev (3 of 3)
**Replacement:** "A portfolio app reading the stale `multiplier` field would value this wallet $479,225.72 below what it really holds. Nothing is missing from the wallet; the gap is larger than the dividend total because it includes splits, where the stale field is off by whole multiples."

---

### 4. "Multiplier" is used on the first screen and defined on the fifth page
**Page:** home hero and explainer, /assets headings, /calendar, every asset page, /method (`app/page.tsx:185`, `app/assets/page.tsx:24`, `app/method/page.tsx:24`)
**Current words:** "Splits are excluded: they raise the multiplier without paying anyone", "the 344 below have had their multiplier moved at least once", "Multiplier in force", "Stale multiplier field"
**Why it fails:** the word carries the entire product and appears roughly twenty times before it is explained. Its only definition opens "A Token-2022 mint carrying the scaled UI amount extension stores two values", which is unreadable to the person who owns $200 of AAPLx.
**Conflict, and who wins:** the Holder wants the word replaced with plain English everywhere. The Dev needs the exact chain field names, and says the asset page is the page he would send a teammate yet it contains none of them. **Resolve by audience, not by compromise:** plain English wins in the hero, the asset-page stat labels and all section headings, because that copy is read by people deciding whether to trust the site. The literal names win inside `code` spans on /method and in the developer block, because a paraphrase there is useless. Do not invent a third vocabulary: "in force" and "stale" are the site's own words and should always appear next to the real field name at least once per page.
**Flagged by:** Holder (high), Dev (high), Judge (implicitly, via the tagline) (3 of 3)
**Replacement (first use, home hero):** "Each of these tokens carries a number that multiplies every holder's balance at once, and paying a dividend means nudging that number up rather than sending anyone anything."

---

### 5. Nav item "Method"
**Page:** header, every page (`app/layout.tsx`)
**Current words:** `Assets  Calendar  Method`
**Why it fails:** "Method" reads as the site's own working-out, so neither reader clicked it, and it is the only page where the multiplier is ever explained and the only page that names the fields a developer needs. The one link that unblocks both audiences is labelled to look like a footnote.
**Flagged by:** Holder, Dev (2 of 3)
**Replacement:** label it `How this works`, and open that page with the plain-English explanation above the Token-2022 material rather than below it.

---

### 6. Four counts that look like four contradictions
**Page:** home hero and split block, /assets standfirst and section meta, /method table (`app/page.tsx:33`, `app/page.tsx:185`, `app/assets/page.tsx:24`, `app/method/page.tsx:77`)
**Current words:** "Across 257 dividends on 65 tokenized stocks" / "Assets that have paid a dividend 338 assets" / "Of the 344 assets whose multiplier has moved, 11 moved because the underlying stock split" / "Assets whose multiplier moved without paying 6 assets" / "Dividend 641, Split 8, Administrative 3, Reverse split 2"
**Why it fails:** I checked all of these in `data/market.json` and **every one is correct**. They count different sets and none of them says which set. 344 assets have moved, 338 of them have paid, 6 never have, 11 have had at least one non-dividend move, 13 such moves exist in total, and the 257/65 pair is the Jupiter-priced subset behind the $23.3m. The reader sees 65 vs 338, 257 vs 641, and 11 vs 6 vs 8 and concludes the site cannot count. This is fatal for a site whose entire pitch is that everyone else's numbers are wrong. It is a labelling fix, not a data fix.
**Flagged by:** Judge (his single biggest reason to mark the submission down), Holder (2 of 3)
**Replacement (home hero note):** "Across 257 dividends on the 65 tokenized stocks that Jupiter prices in dollars, measured against $2,545,447,410 of positions as of 12 Sept 2026. In all, 338 stocks have paid 641 dividends; the rest have no live price, so they cannot be added to this total."
**Replacement (home split block):** "Of the 344 assets whose multiplier has moved, 11 have had a move that was a split rather than a payment, and 6 of those have never paid a dividend at all."
**Replacement (/method table caption):** "13 of the 654 multiplier changes were not payments: 8 splits, 2 reverse splits and 3 administrative corrections, spread across 11 assets."

---

### 7. "Fully backed" sits above numbers that divide to 13%
**Page:** /asset/MRK, /asset/NFLX, Reserves block (`app/asset/[symbol]/page.tsx:316`, `:349`)
**Current words:** `116.53%` `Fully backed`, then `Shares held 2,230` and `On Solana 17,215.11 in public hands`; on NFLX, `Tokens circulating 16,469.92 across all chains` directly above `On Solana 41,628.46 in public hands`
**Why it fails:** a green badge contradicted by the two figures beneath it is worse than no badge. The caveat that attestations cover nine other chains is three screens down, and a note never outranks a badge. On NFLX the pair is impossible on its face, and the site already knows, because the next row says "not comparable".
**Flagged by:** Judge, Holder (2 of 3)
**Replacement (put it in the badge, not the note):** "116.53% backed across all chains. The 2,230 shares held cover tokens on Solana, Ethereum, TON and seven more chains together, so they cannot be compared with the Solana figure alone." For NFLXx, replace the ratio entirely with: "The issuer's attestation reports 16,469.92 tokens outstanding while we count 41,628.46 on Solana alone. The two were measured at different moments, so we are not showing a backing ratio for NFLXx."

---

### 8. Wallet loading screen
**Page:** /wallet/[address] (`app/wallet/[address]/loading.tsx:8`)
**Current words:** "Reading every Token-2022 balance in this wallet, then the payout record for each position. Large wallets take a few seconds."
**Why it fails:** the most jargon-dense sentence on the site is the one readers are forced to stare at, and the promise is false: both readers measured well over twenty seconds, and both concluded the page had died. Under-promising costs nothing.
**Flagged by:** Holder, Judge (2 of 3)
**Replacement:** "Looking up every tokenized stock in this wallet and everything each one has paid. A large wallet takes about thirty seconds." Add a live count of positions resolved so it is visibly working.

---

### 9. A bad address spends ten seconds pretending to work
**Page:** /wallet/notanaddress (`app/wallet/[address]/page.tsx:25`)
**Current words:** the loading screen above, then "A wallet address is 32 to 44 base58 characters. To look up a stock instead, type its ticker, such as AAPL."
**Why it fails:** a regex knows instantly that the string is not an address, so ten seconds of "Reading every Token-2022 balance" is work that is not happening. "base58" is a word neither reader has met, and the length is not the Holder's actual problem: she has no address at all.
**Flagged by:** Holder, Judge (2 of 3)
**Replacement:** validate in the search box before navigating, and show: "That is not a Solana wallet address. Addresses are a long jumble of 32 to 44 letters and numbers copied from a wallet app; if your tokens sit on an exchange you will not have one, so type a ticker such as AAPL instead."

---

### 10. The wallet headline answers for 20 positions and is labelled as the wallet
**Page:** /wallet/[address], headline figure and subline (`app/wallet/[address]/page.tsx`)
**Current words:** `Received without a transaction` `$230,170.76`, subline "Across 41 payments on the 20 largest of 644 positions, together worth $120,822,537", with `644 positions · $120,822,537` on the line above
**Why it fails:** the scope lives in the subline while the label claims the whole wallet, and the identical dollar figure is used once for all 644 positions and once for the top 20, which cannot both be right. The Judge called this the kind of thing that gets a submission disqualified rather than marked down.
**Flagged by:** Judge, Dev (2 of 3)
**Replacement:** put the scope in the label: "Paid to the 20 largest positions without a transaction, $230,170.76 across 41 payments. The other 624 positions in this wallet are not itemised."

---

### 11. Asset pages stop dead where the next payment should be
**Page:** /asset/AAPL and every asset with no scheduled event (`app/asset/[symbol]/page.tsx`, `futureOnly` in `lib/report.ts:380`)
**Current words:** nothing. The section is omitted when the filtered list is empty.
**Why it fails:** the single question the Holder came with is when the next Apple payment lands. Five past payments and then silence reads as a broken page, not an answer, and AAPL is not among the calendar's 38 rows either, so there is nowhere else to look.
**Flagged by:** Holder (1 of 3, but it is the reason she opened the page)
**Replacement:** always render the block, with the empty state reading: "Next payment: the issuer has not published one yet. It appears here as soon as it does."

---

### 12. Nothing on the site acknowledges exchange-held tokens
**Page:** home, under the search box (`app/Search.tsx:43`)
**Current words:** "Paste a Solana address to see what a wallet has been paid and when"
**Why it fails:** half the site is shut to anyone who bought on Kraken or Bybit, and no page anywhere says so, or says whether the exchange passes the dividend on. The Holder could not tell whether the mechanism applied to her at all.
**Flagged by:** Holder (1 of 3, and it is the largest unaddressed audience on the site)
**Replacement:** under the search box: "If you bought on an exchange, your tokens sit in the exchange's wallet rather than one of your own, so a wallet lookup will not find them. Type the ticker instead to see what that stock has paid per token."

---

### 13. The tagline uses the two words the audience does not have
**Page:** header on every page, plus the browser tab title and the OG image (`app/layout.tsx:38`, `app/opengraph-image.tsx:46`)
**Current words:** "Corporate actions on tokenized US equities"
**Why it fails:** "corporate actions" is back-office language and "equities" is prospectus language. This is the one line that follows the reader onto every page and the one a stranger sees in a shared link. The H1 underneath already says it better in words people say aloud.
**Flagged by:** Holder, Judge (2 of 3)
**Replacement:** "Dividends and splits on tokenized US stocks."

---

### 14. "Withholding" and "Net per share"
**Page:** home Next scheduled table, /calendar (`app/page.tsx:150`, `app/calendar/page.tsx`)
**Current words:** column headers `Withholding` and `Net per share`, values `30%`, `None`, `$1.05`
**Why it fails:** the site never once puts the word "tax" next to real money being taken out, so the Holder had to infer it and still could not tell whether it applied to her. "Per share" also breaks the site's own unit: every other page measures in tokens, and she holds 0.6 of one.
**Flagged by:** Holder (high), Judge (medium) (2 of 3)
**Replacement:** headers `US tax withheld` and `You receive, per token`, with one line above the table: "US withholding tax is taken before the payment reaches any holder, so the last column is what actually arrives per token; multiply it by however many tokens you hold."

---

### 15. "Genuinely ahead 38"
**Page:** /calendar (`app/calendar/page.tsx:51`)
**Current words:** "Genuinely ahead 38. The issuer's forward feed returns 539 rows, but 501 of them activated already and are still being served as upcoming."
**Why it fails, and the conflict:** all three flagged it and they want opposite things. The Holder came for dates and got the site arguing with its supplier in machine words, which made her trust the dates less. The Judge calls this the single sharpest sentence on the site, unfakeable proof the thing was built, filed on page three in grey. The Dev calls it a second integration landmine stated as trivia instead of as an instruction. **The Judge and Dev win**, because the sentence is the site's best evidence and its only unique finding, and the Holder's objection is entirely about wording, which the rewrite fixes.
**Flagged by:** Holder, Judge, Dev (3 of 3)
**Replacement:** promote it to the home page under the heading `Payments actually still to come, 38`, reading: "The issuer's own feed lists 539 upcoming payments, but 501 of them already happened and it is still serving them as future, so we check every row against the clock on every request."

---

### 16. "How the payment hides" sits where the reader's own answer should be
**Page:** home, fifth block (`app/page.tsx:212`)
**Current words:** "Token-2022 stores the scaling factor in two fields. The one named multiplier is the old value. newMultiplier takes over once its timestamp passes, and the chain never rewrites the old one. Read the obvious field and every balance shown is wrong."
**Why it fails, and the conflict:** the Holder wants it off the home page entirely: it is a note for programmers standing where she expected to learn what her $200 earned. The Dev wants it at the very top, because he was sent the link to fix wrong balances and had to scroll past four screens of dividend league tables to reach the only paragraph addressed to him, then reverse-engineer a field name out of the word "its". **The Dev wins on keeping it, the Holder wins on framing:** label the block for its audience so she knows to skip it, and name the timestamp field so he does not have to leave the page.
**Flagged by:** Holder (high), Dev (high) (2 of 3)
**Replacement (section meta, replacing "AAPLx, read from mainnet"):** "For developers: if your app shows these balances, read this." And in the paragraph, replace "once its timestamp passes" with "once `newMultiplierEffectiveTimestamp` passes".

---

### 17. "Average payout 0.915%" over an unstated period
**Page:** home, stat band (`app/page.tsx:69`)
**Current words:** `Average payout` `0.915%` `of position value, across paying assets`
**Why it fails:** a percentage with no period is not a number anyone can repeat. Per payment, per year, or since launch are all live readings, and all three readers guessed differently. "Position value" and "paying assets" are two more unexplained terms in a nine-word caption.
**Flagged by:** Holder, Judge, Dev (3 of 3)
**Replacement:** "0.915% of what all these positions are worth has been paid out in total, adding up every dividend since June 2025."

---

### 18. Every figure is for 1,000 tokens, nobody holds 1,000 tokens
**Page:** /asset/[symbol], headline and Multiplier history table (`app/asset/[symbol]/page.tsx`)
**Current words:** "A holder of 1,000 AAPLx since launch gained 3.269 AAPLx, worth $1,087.59 at today's price", column headers `Per 1,000 held` and `USD today`
**Why it fails:** a large dollar figure under Apple's name reads as the reader's own for a moment, then turns out to describe a $332,000 position. The Holder owns 0.6 of a token and was left doing fractions. "Per 1,000 held" also never says 1,000 of what, and "$201.22" beside a dividend date reads as the size of the dividend.
**Flagged by:** Holder (1 of 3)
**Replacement:** add a quantity box above the table reading "How many AAPLx do you hold?" and recompute the column from it; until then, head the columns `Extra tokens per 1,000 you held` and `What that is worth today, per 1,000 held`.

---

### 19. "Circulating", "minted", "held unissued" in one caption
**Page:** /asset/[symbol], stat block (`app/asset/[symbol]/page.tsx:155`)
**Current words:** `Circulating on Solana` `39,323`, note `114,943 more minted, held unissued by the issuer`
**Why it fails:** three unfamiliar words in a caption, and the fact underneath is genuinely alarming if half-understood: the Holder could not tell whether 114,943 extra tokens meant her Apple tokens were diluted. The Judge notes the same caption is throwing away the most interesting number on the page, that three quarters of the supply sits with the issuer.
**Flagged by:** Holder, Judge (2 of 3)
**Replacement:** "39,323 AAPLx are held by the public. The issuer has created another 114,943 that nobody owns yet, and those are backed too, so they do not dilute what you hold."

---

### 20. "Float"
**Page:** /assets split table header, /asset/[symbol] Reserves (`app/assets/page.tsx:100`, `app/asset/[symbol]/page.tsx:349`)
**Current words:** `Float (USD)` and `Share of global float`, which on MRK and NFLX reads `not comparable`
**Why it fails:** "float" is trading-desk vocabulary the Holder guessed at twice and abandoned. "Not comparable" states that a calculation failed without saying why, next to a page where the same row worked for AAPL, so it reads as unreliable data rather than an invalid comparison.
**Flagged by:** Holder, Judge (2 of 3)
**Replacement:** head the column `Total value held` and rename the row `How much of this token lives on Solana`, with the failure case reading: "Cannot be worked out, because the issuer's all-chain count is older than our Solana reading and smaller than it."

---

### 21. Dashes where the money should be
**Page:** /assets, Paid (USD) column (`app/assets/page.tsx:128`)
**Current words:** `—` in 273 of 338 rows, explained at the bottom of the page as "Assets with no live price on Jupiter show no USD figure"
**Why it fails:** both readers assumed the dashed rows had paid nothing, which is wrong: their Payments count is 1 or more. The explanation arrives after 300 rows of scrolling and names Jupiter without saying it is a price source.
**Flagged by:** Holder, Judge (2 of 3)
**Replacement:** write `no price` in the cell rather than a dash, and put directly under the table heading: "No price means we could not get a dollar price for that token, so we cannot show what it paid in dollars; the percentage is still exact."

---

### 22. "History: none"
**Page:** /wallet/[address], Positions table
**Current words:** column `History`, cell `none`, in 16 of 20 rows
**Why it fails:** under a column headed History, "none" reads as "we have no history for this", a gap on the site's side, especially since the notes admit some accounts are "too busy to date cheaply". It actually means the token never paid. All three read it as a partial failure.
**Flagged by:** Holder, Judge, Dev (3 of 3)
**Replacement:** head the column `Payout history` and write `never paid` when the count is genuinely zero, reserving a separate `could not read` for lookups that failed.

---

### 23. Note 5, the one sentence nobody could decode
**Page:** /method note 5, and the same string on the wallet page (`lib/report.ts:216`)
**Current words:** "Positions whose token account has too much history to date cheaply are shown with the asset's full payout record rather than a guessed acquisition date."
**Why it fails:** the Holder read it four times and still could not say what it meant, and correctly sensed it was the note admitting some figures above might be wrong for her. It is the one caveat that changes what a reader should believe about their own number, written so that only someone who already knew would notice.
**Flagged by:** Holder (1 of 3, read four times)
**Replacement:** "For some positions we could not work out when they were bought, so we show everything that token has ever paid, which may be more than this wallet actually received."

---

### 24. /method never answers the one question an integrator has
**Page:** /method, Sources list (`app/method/page.tsx:140`)
**Current words:** `On-chain truth` / `Solana RPC getAccountInfo, getTokenAccountsByOwner`
**Why it fails:** calling the reader's own data source "on-chain truth" tells him his source is fine, which is the opposite of the message. The page never says whether `uiAmount` already applies the multiplier, which is the difference between fixing the bug and double-applying it and shipping a worse one. It also gives the resolution rule as three sentences of prose, leaving the reader to write the conditional and guess whether the timestamp is seconds or milliseconds and whether decimals apply before or after.
**Flagged by:** Dev (1 of 3, and it is the entire reason he opened the site)
**Replacement:** relabel the row `Where the raw fields live`, and add beneath the resolution paragraph: "`getTokenAccountBalance` does not apply this multiplier for you, so read it from the mint yourself: `const m = Date.now()/1000 >= newMultiplierEffectiveTimestamp ? newMultiplier : multiplier` (the timestamp is Unix seconds), then apply `decimals` first and the multiplier second."

---

### 25. "A wallet showing 10 times more tokens after that date gained nothing"
**Page:** /asset/NFLX, opening paragraph
**Current words:** as quoted
**Why it fails, and the conflict:** the Holder singles this sentence out as perfect, the clearest thing on the site. The Dev nearly walked away planning the wrong fix, because to him it reads as a criticism of the balance rather than of the profit figure: showing 10x tokens after a 10-for-1 split is correct, and only counting them as income is wrong. **The Dev wins**, because a sentence that sends an integrator to suppress a correct balance is actively harmful, and the fix keeps every word the Holder liked.
**Flagged by:** Holder (as a strength), Dev (as a high-severity misread) (2 of 3)
**Replacement:** "A wallet showing 10 times more tokens after that date is showing the right number, but the holder gained nothing: the price fell by the same factor, so the position is worth what it was."

---

### 26. "No xStock called ZZZZ"
**Page:** /asset/[unknown] (`app/asset/[symbol]/page.tsx:30`)
**Current words:** as quoted
**Why it fails:** "xStock" appears here and nowhere else on the site, which everywhere else says "tokenized stock". The reader meets a brand word for the first time at the exact moment she has made a mistake and feels foolish.
**Flagged by:** Holder (1 of 3)
**Replacement:** "We have no tokenized stock with the ticker ZZZZ." Keep the existing second sentence, which both readers found genuinely helpful.

---

### 27. "Reading / Figure"
**Page:** home, both comparison tables (`app/page.tsx:170`, and the AAPLx block)
**Current words:** column headers `Reading` and `Figure`, with rows like `Incorrect  NFLXx's 10:1 split counted as income  $105,863,078`
**Why it fails:** "Reading" means both an act of interpretation and a measured value, and the adjacent column is also a measured value, so rows carry three things in two columns. The Holder saw the words as stray labels and thought the block was broken; the Dev read the table twice before working out it was contrasting a wrong answer with a right one.
**Flagged by:** Holder, Dev (2 of 3)
**Replacement:** head the columns `What you would conclude` and `Amount`.

---

### 28. Every page has the same tab title
**Page:** all (`app/layout.tsx`, per-page `metadata`)
**Current words:** `ExDate — corporate actions on tokenized US equities`
**Why it fails:** /asset/AAPL, /asset/NFLX and a wallet statement are indistinguishable in a tab strip, and a link shared into Telegram or Discord previews the tagline instead of the finding. For a lookup tool, the shareable page is the product.
**Flagged by:** Judge (1 of 3)
**Replacement:** title asset pages "AAPLx has paid holders 0.327% with no transaction, ExDate" and wallet pages "This wallet was paid $230,170.76 invisibly, ExDate".

---

### 29. The chart caption contradicts itself in nine words
**Page:** home (`app/page.tsx:57`)
**Current words:** "Cumulative dividends paid into Solana wallets, month by month. Each step is the day a multiplier changed."
**Why it fails:** month by month or per day a multiplier changed; a step cannot be both. It sits directly under the $23m figure, which is the second time in thirty seconds that two sentences disagree.
**Flagged by:** Judge, Holder (2 of 3)
**Replacement:** "Every dividend ever paid into a Solana wallet, added up month by month."

---

### 30. The most reassuring line on the site is the smallest text at the bottom
**Page:** home, disclaimer (`app/page.tsx`, footer)
**Current words:** "Read-only. No wallet connection, no transactions, no custody. Data from the xStocks public API, Solana mainnet RPC and Jupiter."
**Why it fails:** the Holder was nervous that pasting an address might let someone move her money, and this settles it, but she only reached it long after the moment she had to decide. The second half is noise to her and belongs in the footer alone.
**Flagged by:** Holder (1 of 3)
**Replacement:** move the first half up beside the search box at normal size: "Safe to paste: this site only reads public information, never asks you to connect a wallet or sign anything, and cannot move your tokens."

---

### 31. The footer changes between pages
**Page:** home, /method and /wallet name Ondo; /assets, /calendar and asset pages do not
**Current words:** "not affiliated with Backed Finance, Ondo or the Solana Foundation"
**Why it fails:** Ondo appears nowhere else on the site, and a disclaimer that varies page to page reads as a copy-paste artefact. It is exactly where a careful reader starts checking everything else.
**Flagged by:** Judge (1 of 3)
**Replacement:** use one footer everywhere, naming only who the site covers: "Independent, and not affiliated with Backed Finance or the Solana Foundation."

---

### 32. "8 of 832"
**Page:** home, Largest payers section meta (`app/page.tsx:84`)
**Current words:** `8 of 832 · as of 12 Sept 2026`
**Why it fails:** the table ranks payers, but 832 is every tokenized asset, most of which have never paid. The denominator is the wrong set and makes the eight look rarer than they are.
**Flagged by:** Judge (1 of 3)
**Replacement:** "The 8 biggest of the 338 stocks that have paid, as of 12 Sept 2026."

---

### 33. A `Status` column inside a section called Scheduled
**Page:** /asset/[symbol], Scheduled table
**Current words:** header `Status`, only value `Scheduled`
**Why it fails:** a raw field passed through from the issuer's feed, costing a column of width and carrying no information, while making an integrator wonder what the other values are and whether he should handle them.
**Flagged by:** Dev (1 of 3)
**Replacement:** drop the column, or if the feed emits other values, head it `Status` and add "as published by the issuer: Scheduled, Cancelled or Amended".

---

### 34. Raw exception text on the wallet failure page
**Page:** /wallet/[address], the non-bad-address branch (`app/wallet/[address]/page.tsx`)
**Current words:** "This wallet could not be read", followed by the raw error string
**Why it fails:** a developer error message on a finance page reads as unfinished, and one sighting is enough for a judge to conclude the whole thing is a demo.
**Flagged by:** Judge (1 of 3)
**Replacement:** "We could not read this wallet: Solana's network did not answer in time. This is us, not your wallet, so try again in a few seconds." Log the raw message rather than printing it.

---

**Dropped as taste rather than comprehension:** the 44-word hero sentence being "too long" (the rewrite in item 6 fixes what it actually costs, which is pushing the $23m figure below the fold); "Asset index" sounding bank-like (the missing filter box on a 338-row table is the real complaint and is a build item, not copy); the chart y-axis skipping a gridline (a rendering bug, not copy).

---

## 1. Does a first-time visitor understand what this site is for within ten seconds?

**Yes.** All three readers said so independently, and the Judge, who was on submission forty, said the opening earns the next thirty seconds. The hero states a real problem in two sentences with no throat-clearing.

What it does not survive is second eleven. The Holder understood the site instantly and then read every page without ever learning whether her own token count had grown, because the page immediately turns to how the mechanism works and who reads it wrong.

**The single change:** cut the 44-word instruction paragraph above the search box, whose job the placeholder already does, and put the reader's own next step in its place. The hero currently spends its best real estate explaining the site to someone who has already understood it.

## 2. Jargon the audience does not share

| Current word | Where | Plain replacement |
|---|---|---|
| corporate actions | tagline, every page, tab title, OG image | dividends and splits |
| equities | tagline | stocks |
| multiplier | hero, /assets, /calendar, every asset page | the number that multiplies every holder's balance (define once, then keep the word) |
| scaled UI amount extension | /method, asset facts | a Token-2022 add-on that multiplies every balance from the mint (keep the term, but define it) |
| Token-2022 | home, wallet loading, asset facts | the token standard these use (drop entirely from the wallet loading screen) |
| naive readers | every asset page | an app reading the stale field |
| stale multiplier field | every asset page | the old value, which the chain never overwrites (keep `multiplier` next to it) |
| float, global float | /assets column, Reserves row | total value held; how much of this token lives on Solana |
| circulating | asset stat block | held by the public |
| minted, held unissued | asset stat block | created but not yet owned by anyone |
| withholding | home, /calendar | US tax withheld |
| net per share | home, /calendar | you receive, per token |
| gross | /calendar | before US tax |
| position, positions | wallet page, home stat band | holding, holdings |
| yield | home, /assets | growth since launch |
| base58 | bad-address error | a long jumble of letters and numbers |
| mainnet, RPC | home section meta, /method, wallet error | the Solana network (drop from reader-facing copy) |
| forward feed, rows, served as upcoming | /calendar | the issuer's list of upcoming payments |
| venues, activation | /calendar note 3, asset pages | exchanges; the moment a payment lands |
| xStock | unknown-ticker error only | tokenized stock |
| Method | nav | How this works |
| Jupiter | /assets footnote | our price source |
| Backed | home stat note | Backed Finance, the firm that holds the real shares |

## 3. The question visitors leave with that the site can already answer

**"What did my holding earn?"**

Every ingredient is already computed and on the page. The asset page holds `perUnitGained` and `priceUsd`, and it uses them to answer for a hypothetical holder of 1,000 tokens. Turning that into the reader's own answer is one input box and a multiplication on data already loaded: "How many AAPLx do you hold?" and the existing table recalculated. The Holder read all five pages, twice in places, and left not knowing whether 0.6 of a token had earned anything, while the page told her what $332,000 of it would have earned.

A close second, for the other audience: the wallet page already computes `naiveBalance` and `trueBalance` per position (`lib/report.ts:150`) and never shows them side by side. The Dev's exact request was a column he could diff his own output against, and the site has both numbers in memory and prints only one, unlabelled, in a column called `Tokens`.

---

**Note on sources:** three of the four reports arrived intact (Holder, Judge, Dev); the Dev's report is cut off mid-finding and the fourth persona's report never arrived, so counts above are out of three and item 10 may under-credit the Dev. Copy was verified against the live site at exdate-ten.vercel.app and against the source at `C:\Users\Lenovo İdea\Desktop\exdate`; note that `C:\Users\Lenovo İdea\Desktop\exdate\app\page.tsx` locally already carries a rewritten hero ("Tokenized stocks pay dividends invisibly") that is not yet deployed, so items 6, 16, 17, 27, 29 and 32 should be applied against the local file, not the live text quoted.