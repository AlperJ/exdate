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
| Payments | **624** |
| Stocks that have paid | **325** |
| Tokenized stocks issued on Solana | **832** |
| Payments genuinely still to come | **38** |

Every one of those figures is read from Solana mainnet and from the issuer's public
records. Nothing is estimated.

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

Three findings that did not exist before we measured:

**A split is not a dividend, and the difference is worth $151m.** Of 654 multiplier changes
across all 832 assets, 641 are dividends and 13 are splits, reverse splits or
administrative corrections. Count the splits as income and the total reads $174m instead of
$12m. Netflix split ten for one and its multiplier went from 1.0 to 10.0; holders received
nothing. Any tracker that treats a multiplier change as income will tell a Netflix holder
they made 900%.

**The issuer's forward feed is 93% stale.** It serves 539 rows as "upcoming". Only 38 have
a date in the future. The other 501 already activated and are still being served as
scheduled. Anyone building a calendar off that endpoint without checking the clock gets a
number fourteen times too large.

**The dividend market is one instrument.** 90% of the $11.98m is STRCx, a variable-rate
preferred that pays like a bond. The other 324 stocks come to $1.2m between them, and the
typical one has paid 0.370% of its value since launch. Tokenized equity dividends are, so
far, very small — which is precisely why nobody noticed they were invisible.

### Why Solana

The mechanism does not exist anywhere else. Paying a dividend by moving a multiplier on the
token is a Token-2022 extension, and over 90% of tokenized equity lives on Solana. The
problem is Solana-native, the fix has to be, and the data to fix it is all public.

### What it is not

- Read-only. It tells you what happened; it does not let you act on it.
- Dollar figures value the tokens the issuer reports as circulating, its own published
  number, covering every chain each token is issued on.
- Dividends arrive as extra tokens, not cash, so USD figures value that growth at today's
  price and move with the stock.
- Wallet figures assume a position was held unchanged since it was acquired.

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
dividends hand-compounded to the chain's multiplier to the last digit — and broke three.
Those three are fixed and documented in `VERIFY.md`, including the one where our own
headline was seven times too high.
