# Stocklana submission form — copy and paste

Measured 13 September 2026. If the date has moved, run `npm run snapshot` and check the two
money figures below still match `data/market.json` before pasting.

---

## 1. Project Name

```
ExDate
```

---

## 2. Short Description  —  257 of 280 characters

```
Tokenized stocks on Solana pay dividends by quietly changing a number on the token, so nothing lands in your wallet and nothing tells you. Paste any address and ExDate shows what it was already paid, valued against the balance it actually held on each date.
```

---

## 3. Full Description (Markdown)  —  4936 of 5,000 characters

```markdown
## The problem

An xStock does not pay a dividend the way anything else on Solana pays anything. There is no transfer and no transaction appears. What changes is a multiplier on the token, and when the issuer nudges it up every holder's balance is worth more at that instant. So **nobody knows they are being paid**: no wallet surfaces it, no explorer records it, no tracker accounts for it.

As of 13 September 2026, across every tokenized stock on Solana: **$11,984,608** paid with no transaction, across **628 payments** on **329 stocks**, out of 832 issued. **38** are genuinely still to come. Every figure is read from Solana mainnet and the issuer's public records.

## What it does

**Paste any address** — no sign-in, no wallet connection, and it works for a wallet you do not own — get a statement: what was paid, when, per position, with the multiplier change behind it. Every row opens into the event that produced it.

**Type a ticker** for what that stock has paid since launch, when the next payment lands, the US tax withheld, and whether the tokens are backed by shares in custody. **Open the calendar** for every payment still to come. Read-only throughout: no transaction, no custody, no contract.

## The bug underneath it

Token-2022's scaled UI amount extension stores two values, and the field literally named `multiplier` holds the **old** one. `newMultiplier` takes over once `newMultiplierEffectiveTimestamp` passes, and the chain never rewrites the old field. Read AAPLx today and the obvious field says `1.0026642075893797` while the value in force is `1.0032690125398187`. On a cash dividend that error is 0.06%. On NFLXx after its ten-for-one split, an app reading the obvious field shows **a tenth of the real balance**. The correct read is non-obvious and the incorrect one fails silently.

## Three things we found measuring it

**A split is not a dividend, and counting them as one costs 19% of the headline.** Of 654 corporate actions, 641 are dividends and 13 are splits or corrections. Count them all as income and the total reads $14,292,658, and a tracker tells a Netflix holder they gained 900% on a position worth exactly what it was.

**The issuer's forward feed is 93% stale.** It serves 539 rows as upcoming: 482 already activated, 14 are the same event twice, 5 carry no date at all. Only 38 are ahead. The undated rows are the dangerous ones, because `+new Date(null)` is zero and they sort silently into the past.

**It is not an xStocks problem.** Ondo Global Markets uses the same `ScaledUiAmount` extension on Solana and is larger: 395 assets and $831.7m against xStocks' 832 and $608.3m (rwa.xyz). We read their mint: AAPLon carries 1.00337607, AAPLx 1.00326901. Same company, two tokens, two different dividend factors, and nothing compares them. Roughly 1,200 mints pay this way.

## We are not the first

**SolanaRWA** has turned these same multiplier changes into per-holder income since May 2026, on this chain and extension. We searched twice and name them ourselves. They are wallet-gated and only see forward from the day you sign up; their own article calls reconstructing the history "possible but more complex". **Lido** has done this for stETH rebases on Ethereum for five years: same shape, different chain.

The events are the issuer's, published free, and we do not claim them. What nobody had built is the backward half: paste **any** address, with no sign-in, and read what it was **already** paid, against the balance it **actually held on each date**, with **splits separated from dividends**. `PRIORART.md` carries the search and 85 documented negatives.

## Roadmap

1. **A correct reader other apps can drop in** (0–3 months). MIT and dependency-free: resolves the multiplier against its timestamp, separates a dividend from a split, rebuilds a past balance. One integration in Phantom reaches more holders than this site will.
2. **Tell people before it happens** (1–4 months). Every payment is knowable a day ahead.
3. **The tax statement nobody can produce** (2–6 months). 1099-DA cost-basis reporting begins with 2026 transactions; the first such forms arrive early 2027.
4. **Every issuer, one record** (4–9 months). Ondo first, on the identical extension.
5. **The holders who are not in a wallet** (6–12 months). On-chain is 14–20% of xStocks volume; the rest bought on Kraken or Bybit, where a lookup finds nothing.

## Built for this hackathon

Every line written during Stocklana from an empty repository. Next.js 15, no Solana SDK: reads go through plain JSON-RPC. No database and no holder index — a wallet is read from the chain when you ask, so a position bought a minute ago appears the first time you look.

Adversarial reviewers were told to prove the figures wrong by routes the app does not use. AAPLx's five dividends hand-compound to the chain's multiplier to the last digit; they broke several others, all fixed and written up in `VERIFY.md`.
```

---

## 4. Links

| Field | What to put | Needed |
|---|---|---|
| **GitHub Repository** | `https://github.com/AlperJ/exdate` | yes |
| **Demo URL** | `https://exdate-ten.vercel.app` | yes |
| **Pitch Video URL** | leave empty for now | optional |
| **Technical Video URL** | leave empty for now | optional |

The form says *"Add at least one link judges can use to review your work."* The repository and
the live site are both public and both answer that on their own, so nothing is blocking the
submission.

**Never paste `exdate-exdate1.vercel.app`.** It sits behind Vercel auth and returns a 302 to a
login page, so a judge would see nothing. The public address is **exdate-ten**.

### If a judge wants an address that is already populated

```
7BCp5XUXtKzZWYCvGR2fzFqoyKiJ7ozN8eCEHscpSMnB
9SjWLbuf5kvwWENw6ydxwBzHbyiQpYu7jqL3C8RuDk4z
6LY1JzAFVZsP2a2xKrtU6znQMQ5h4i7tocWdgrkZzkzF
```

### The single strongest link to open in front of someone

```
https://exdate-ten.vercel.app/wallet/7BCp5XUXtKzZWYCvGR2fzFqoyKiJ7ozN8eCEHscpSMnB?show=NVDAx
```

It lands on a real wallet, $93.38 paid across 28 payments it never saw, with NVIDIA's five
dividends already open and every multiplier shown.

### Two more worth having in the tab bar during a demo

```
https://exdate-ten.vercel.app/how-it-works
https://exdate-ten.vercel.app/method
```

The first is the walkthrough with screenshots. The second is the working out, for the judge who
wants to check a number rather than be told one.

---

## About the two video fields

There is no video yet, and the form does not require one. If there is time before 18 September
they are worth filling, in this order:

**Pitch video, 2 to 3 minutes.** Open on a wallet lookup, because the product explains itself
faster than any slide: paste the address, let the statement appear, open the NVIDIA row, and
point at the multiplier that produced the figure. Then the scale, then the roadmap.

**Technical video, 3 to 5 minutes.** The stale-field trap read live on mainnet, the
dividend-versus-split distinction and what counting them wrong would do to the total, and the
architecture: no database, a wallet read from the chain when you ask, 6 to 33 calls.

The deck at `docs/pitch.html` already runs in that order, so it doubles as the script.
