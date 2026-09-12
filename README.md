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

Across the issuer there are **832 tokenized assets** and **539 scheduled corporate
actions** in the public feed. No wallet, explorer or portfolio tracker on Solana
surfaces any of it.

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
