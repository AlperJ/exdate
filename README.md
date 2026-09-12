# ExDate

**The brokerage statement that tokenized stocks never send you.**

xStocks on Solana do not pay dividends in cash. They pay by quietly raising a
multiplier on the token. Your token count never changes. Your balance just
silently becomes worth more, and nothing tells you it happened.

ExDate reads that hidden record and turns it into a statement: what you were
actually paid, when the next payment lands, and whether your token is really backed.

## The bug this is built on

Token-2022's `ScaledUiAmountConfig` stores two values. The field literally named
`multiplier` is the **old** one. `newMultiplier` takes over once
`newMultiplierEffectiveTimestamp` passes, and the chain never rewrites the old
field. Read `multiplier` at face value and every balance you display is wrong.

Live on AAPLx, 2026-09-12:

```
multiplier                      = 1.0026642075893797   <- stale, looks authoritative
newMultiplier                   = 1.0032690125398187   <- actually in force
newMultiplierEffectiveTimestamp = 1786149000 (2026-08-08, already past)
```

For a cash dividend the error is 0.06%. For a 10:1 split it is 10x.

## What the data shows

Apple xStock has paid five dividends since launch, none of them visible in any wallet:

| Date | Multiplier | Gained on a 10 AAPLx position |
|---|---|---|
| 2025-08-14 | 1.000000000 → 1.000781855 | +0.007819 AAPLx |
| 2025-11-13 | 1.000781855 → 1.001393487 | +0.006116 AAPLx |
| 2026-02-12 | 1.001393487 → 1.002018559 | +0.006251 AAPLx |
| 2026-05-09 | 1.002018559 → 1.002664208 | +0.006456 AAPLx |
| 2026-08-08 | 1.002664208 → 1.003269013 | +0.006048 AAPLx |

Total: **+0.03269 AAPLx, about $10.89**, paid to holders who were never notified.

## Dividends are not splits

A multiplier change is not automatically income. Measured across all 832 assets on
2026-09-12, the 654 changes on record break down as 641 `Dividend`, 8 `Split`,
3 `Administrative` and 2 `ReverseSplit`.

Only a dividend pays you. A split raises the multiplier and cuts the share price by the
same factor, so the position is worth what it was a second earlier. Netflix split 10:1 on
2025-11-16 and NFLXx went from 1.0 to 10.0 — worth about **$106M** if you naively price
the extra tokens, and **nothing at all** in reality. ExDate counts only dividends as
income and labels every split as "no gain".

Counting dividends alone, across the 65 assets with both a payout history and a live
price: **$23.3M of dividends have been paid into Solana wallets across 257 payments**,
an average of 0.915% of position value, with nobody notified.

## Scale, measured rather than cited

Holder counts get quoted loosely in this space, so these were counted on chain on
2026-09-12 rather than taken from a blog post. Across the 15 largest xStocks, 269,255
distinct wallets hold a non-zero balance. Most of that is dust: AAPLx's median position is
$0.43, and only 3% of its wallets hold more than $100. The honest figure is a few thousand
meaningful holders per major stock, not tens of thousands.

The public feed lists 539 "upcoming" corporate actions, but only 38 are genuinely in the
future; the endpoint keeps serving events that already activated. No wallet, explorer or
portfolio tracker on Solana surfaces any of it.

## Data sources

All keyless and public, verified 2026-09-12:

- `api.xstocks.fi/api/v2/public/assets` — asset list with Solana mints
- `.../assets/{sym}/multiplier/history` — the invisible dividend record
- `.../corporate-actions/upcoming` — forward calendar, ex-dates, gross and net USD
- `.../proof-of-reserves/{sym}` — real shares in custody vs tokens circulating
- `.../system/status/{sym}` — trading halt flags
- Solana RPC `getAccountInfo` / `getTokenAccountsByOwner` — on-chain truth
- Jupiter Price v3 (`lite-api.jup.ag`) — token price

Three of those endpoints paginate differently from each other. See `lib/xstocks.ts`.

## Setup

```bash
npm install
cp .env.local.example .env.local   # add your Helius RPC URL
npm run dev
```

Read-only. No wallet connection, no transactions, no custody.

## Probe

```bash
node scripts/probe.mjs AAPLx 10
```

Prints the full live picture for one asset and a hypothetical position size.

## Open-source components

Next.js, React and TypeScript. No Solana SDK: token reads go through plain JSON-RPC with
`jsonParsed` encoding, so there is nothing between this app and the chain's own view.
