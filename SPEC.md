# ExDate Design System Specification v1.0

Implementation target: `app/globals.css` (full rewrite), `app/layout.tsx`, `app/page.tsx`, `app/asset/[symbol]/page.tsx`, `app/wallet/[address]/page.tsx`, both `loading.tsx` files, `app/Search.tsx`.

---

## 1. POSITIONING

ExDate is a **registrar's statement**, not a trading terminal and not a crypto dashboard. It reports a settled record of corporate actions that already happened, with provenance, on a product whose entire claim is that everyone else reads the field wrong. The lane is Morningstar Design System and Yahoo Finance's data layer — light ground, square data surfaces, hairline rules, weight-500 figures that do not shout, "data" typeset as its own role — with FactSet's warm non-white page ground (#f5f4f1, not #ffffff) and Dune's discipline of rendering values in a single neutral with no colour encoding at all. It is explicitly **not** Jupiter, Kamino or Drift: those are dark, navy, pill-shaped, saturated interfaces for interacting with positions in real time, and adopting that idiom would place ExDate visually inside the category of products it exists to correct. It is not Finviz either: Finviz's 11px zero-padding extreme density is right for a 40-column screener and wrong for a page that shows eight rows and has to be believed. The target reading is: a printed holdings statement from a transfer agent, rendered in a browser, that happens to be about Solana.

---

## 2. COLOUR

### Theme decision

**Light only. There is no dark mode.** Three reasons, stated so nobody reopens it: (a) every reference product that serves a *record* rather than a live tape defaults to light — Morningstar #ffffff, Yahoo light surface-1, TradingView's screener, FactSet's #f5f5f3 — and darkness in this industry signals an active trading surface, which ExDate is not; (b) bright accent on near-black is the single most reliable generated-crypto-dashboard signature and the current build is exactly that; (c) one theme is one set of decisions, and a half-maintained second theme is itself a tell. If a dark theme is ever added it must be a wholesale remap of the same neutral ramp onto the same semantic token names (TradingView/Dune model), and must obey two rules: primary text is never `#ffffff`, and tints are produced with `color-mix(in srgb, <hue>, <surface> N%)` — mixed toward the surface, never toward white.

`color-scheme: light` on `:root`. Delete the body radial gradient.

### Token block (paste verbatim)

```css
:root {
  /* neutral ramp — warm, 13 steps. Everything structural derives from here. */
  --n-0:   #ffffff;
  --n-25:  #faf9f7;
  --n-50:  #f5f4f1;
  --n-100: #edebe7;
  --n-150: #e6e2db;
  --n-200: #d9d4cb;
  --n-300: #c3bdb2;
  --n-400: #a39d92;
  --n-500: #8a847a;
  --n-600: #6b665e;
  --n-700: #57534b;
  --n-800: #3a3733;
  --n-900: #26241f;
  --n-950: #171613;

  /* surfaces */
  --ground:      var(--n-50);   /* page background, #f5f4f1 */
  --surface:     var(--n-0);    /* raised: table body, notice blocks, input */
  --sunken:      var(--n-100);  /* recessed: table header fill, code inset, skeleton block */
  --row-hover:   #f4f2ee;
  --row-select:  #e9eff8;       /* accent wash, selected row only */

  /* lines — table rules are deliberately darker than dividers elsewhere */
  --rule-head:   var(--n-300);  /* header underline, section heading rule, key-figure rule */
  --rule-row:    var(--n-150);  /* body row separation */
  --hairline:    var(--n-150);  /* non-table dividers, header bar bottom */
  --border-strong: var(--n-400);/* input borders */

  /* text */
  --text:        var(--n-900);  /* 15.0:1 on ground — figures, headings, body emphasis */
  --text-2:      var(--n-700);  /*  6.9:1 — body prose, context sentences */
  --text-muted:  var(--n-600);  /*  5.1:1 — labels, column headers, notes, meta */
  --text-faint:  var(--n-500);  /*  3.5:1 — disclaimer, disabled, note markers ONLY */

  /* accent — links and focus. Nothing else. */
  --accent:      #12509e;       /* 7.1:1 on ground */
  --accent-hover:#0d3f7e;
  --accent-wash: #e9eff8;

  /* financial direction — teal-green vs red, separated by lightness as well as hue */
  --pos:         #0a5f4c;       /* 6.9:1 */
  --neg:         #c22030;       /* 5.4:1 */
  --pos-wash:    #e4efe9;
  --neg-wash:    #f8e7e7;

  /* caution — not a direction, used for pending/stale/mismatch */
  --warn:        #8a5a00;       /* 5.4:1 */
  --warn-wash:   #f6eed9;
}
```

### Where colour is allowed

| Colour | Permitted uses — exhaustive |
|---|---|
| `--accent` | link text; `:focus-visible` outline; `--row-select` background of a selected row. |
| `--pos` / `--neg` | the glyph and digits of a quantity that carries a sign (a gain, a delta, a drift percentage); the 6px status dot; a reserve bar fill when the ratio is under 1.0 (`--neg`). |
| `--warn` | the 6px dot and the 2px left edge of a pending-payout or balance-mismatch notice; the digits of the stale `multiplier` field. |
| `--neg` as a 2px left edge | error blocks only. |

### Where colour is banned

- The key figure on every page is `--text`. Always. A total paid is a fact, not a gain.
- Labels, column headers, section headings, the wordmark, notes and the disclaimer are neutral. The wordmark has no coloured span.
- No button has a coloured fill. The one primary button is `--text` ground with `--n-0` label.
- No coloured borders on containers. No `--accent-dim` equivalent exists.
- A reserve bar at or above 1.0 fills with `--text-2`, not green. Meeting the requirement is not a gain.
- Red and green never encode rhetoric. A figure is red because it is negative, never because the sentence disapproves of it. The `.compare` component is deleted (see §5.11 and §6.1).
- Colour is never the only carrier: every dot has a word next to it, every signed figure keeps its `+` / `−` glyph.

---

## 3. TYPOGRAPHY

### Stacks

One family with a monospace sibling: **IBM Plex Sans** and **IBM Plex Mono**. Load with `next/font/google` in `app/layout.tsx`, not a `<link>`:

```ts
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
const sans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400","500","600"], display: "swap", variable: "--sans" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400","500"], display: "swap", variable: "--mono" });
// <html className={`${sans.variable} ${mono.variable}`}>
```

Equivalent if a link tag is ever needed:
`https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap`

```css
--sans: var(--sans-font, "IBM Plex Sans"), "Segoe UI", system-ui, -apple-system, Arial, sans-serif;
--mono: var(--mono-font, "IBM Plex Mono"), ui-monospace, "SF Mono", Consolas, monospace;
```

`html { font-size: 16px }`. Body: `font-family: var(--sans); font-size: 14px; line-height: 22px; color: var(--text-2); background: var(--ground);`

### Scale — closed. Eight sizes. No others exist.

| Step | Size / line-height | Weight | Used by |
|---|---|---|---|
| `--t-11` | 11px / 16px | 500 | column headers (`thead th`), statistic labels, status text, note markers, disclaimer |
| `--t-12` | 12px / 18px | 400 | numbered notes, sub-meta under an identity, cell secondary text, loading caption, header-bar descriptor |
| `--t-13` | 13px / 20px | 400 | table cell default, search input, nav links, notice body; **500** for section headings and cell emphasis |
| `--t-14` | 14px / 22px | 400 | body prose, key-figure context sentence, empty-state first line |
| `--t-16` | 16px / 26px | 400 | page standfirst only (one per page, max 2 sentences) |
| `--t-20` | 20px / 28px | 500 | ticker / subject identity, statistic values, wordmark is 16/600 |
| `--t-26` | 26px / 32px | 500 | page title `<h1>` |
| `--t-32` | 32px / 36px | 500 | the single key figure per page |

Weights available: 400, 500, 600. 600 appears exactly once, on the wordmark. `font-weight: 640`, 700 and `bold` are banned. `clamp()` and `vw` units are banned on every font-size.

`letter-spacing: 0` on every element. No negative tracking, no tracked-out capitals, no `text-transform: uppercase` anywhere in the stylesheet.

### Numeral treatment — complete CSS

Two rules, applied structurally so no one has to remember them:

```css
/* 1. Quantities: proportional sans with forced tabular lining figures.
      Bound to the data-table element and to the figure/statistic classes,
      never applied per-cell in JSX. */
.dt,
.figure__value,
.stat__value,
.num {
  font-variant-numeric: tabular-nums lining-nums;
  font-feature-settings: "tnum" 1, "lnum" 1;
  letter-spacing: 0;
}

/* 2. Machine literals: monospace. This is the ONLY use of --mono. */
.lit {
  font-family: var(--mono);
  font-size: 12px;
  line-height: 18px;
  font-weight: 400;
  letter-spacing: 0;
  color: var(--text-2);
  word-break: break-all;
}
```

`.lit` is permitted for exactly four things: base58 addresses (mint, wallet), raw on-chain field values reproduced verbatim (`1.0032690125`, `multiplier`, `newMultiplier`), transaction-shaped identifiers, and inline code in prose. It is **banned** on money, percentages, counts, dates, the wordmark, labels, status text, buttons and the search input. A multiplier is a literal; a dollar amount is a quantity. Never both voices inside one table cell.

---

## 4. SPACING AND GRID

Base unit **4px**.

```css
--s1: 4px;  --s2: 8px;  --s3: 12px; --s4: 16px;
--s5: 20px; --s6: 24px; --s8: 32px; --s12: 48px; --s16: 64px;
```

- **Page container**: `max-width: 1040px; margin: 0 auto; padding-inline: 24px` (16px below 640px). The header bar is full-bleed; its contents use the same container.
- **Prose measure**: `max-width: 66ch` on every paragraph, the standfirst, key-figure context sentences, notes and empty states. Tables and the statistic band ignore this and fill the container.
- **Header bar**: 52px tall, `position: sticky; top: 0; z-index: 10`.
- **Vertical rhythm**:
  - header bar → page title block: **32px**
  - page title → standfirst: **12px**
  - standfirst → search: **24px**
  - search → key figure: **32px**
  - between major sections: **48px** (`margin-top` on the section heading)
  - section heading → its content: **16px**
  - label → value inside a statistic: **6px**
  - value → note inside a statistic: **4px**
  - last section → footnote block: **48px**, with a 1px `--hairline` top rule and 16px padding above the first note
  - page bottom padding: **64px**
- **Column structure**: single column. Data tables are full container width with explicit `<colgroup>`. The statistic band is `display: grid` with an **explicit** column count per breakpoint: 4 columns ≥900px, 2 columns 560–899px, 1 column below. `repeat(auto-fit, …)` and `auto-fill` are banned.
- **Print**: `@media print { header, .search, .row-actions { display:none } body { background:#fff } .dt { page-break-inside: auto } }`. The statement must print cleanly on A4; this is checked once and then left alone.

---

## 5. COMPONENTS

### 5.1 Page header and navigation

Full-bleed band, `background: var(--surface)`, `border-bottom: 1px solid var(--hairline)`, height 52px, sticky. Contents in the 1040px container, `display:flex; align-items:center; gap:16px`.

Left: wordmark `ExDate`, 16px/500… **600**, `--text`, `letter-spacing:0`, no coloured span, links to `/`. Then a 1px × 16px vertical rule in `--hairline`, then the descriptor `Corporate actions on tokenized US equities` at 12px `--text-muted` (hidden below 720px).

Right (`margin-left:auto`): nav links `Assets`, `Calendar`, `Method` at 13px `--text-muted`, gap 20px, hover `--text`, current page `--text` with `border-bottom: 1px solid var(--text)` and 16px bar-height padding so the underline sits on the bar's bottom edge. No icons. No logo image. No shadow on the bar, ever, including when scrolled.

### 5.2 Search field

`<form class="search">`, `display:flex; gap:8px; max-width:520px`.

Input: `flex:1 1 auto; height:36px; background:var(--surface); border:1px solid var(--border-strong); border-radius:4px; padding:0 10px; font:400 13px/20px var(--sans); color:var(--text)`. Placeholder `--text-faint`, text `A ticker such as AAPL, or a Solana wallet address`. `:focus-visible { outline:2px solid var(--accent); outline-offset:1px; border-color:var(--accent) }`.

Button: `height:36px; padding:0 14px; border:0; border-radius:4px; background:var(--text); color:var(--n-0); font:500 13px/20px var(--sans); cursor:pointer`. Label `Look up`, pending label `Reading`. Hover `background: var(--n-800)`. Disabled `background: var(--n-300); color: var(--n-0); cursor:default`.

Hint line below, 8px gap: 12px `--text-muted`, `Examples:` then four ticker links in `--accent` with `text-decoration: underline; text-underline-offset: 2px`, separated by `, `.

On the header bar of inner pages the same component renders at `height:30px`, input font 12px, button label `Go`, `max-width:340px`.

### 5.3 Data table row

Always a real `<table class="dt">` with `<colgroup>`, `<thead>`, `<tbody>`. Never a div grid.

```css
.dt { width:100%; table-layout:fixed; border-collapse:separate; border-spacing:0;
      background:var(--surface); font-size:13px; line-height:20px; }
.dt th { position:sticky; top:52px; z-index:2; background:var(--surface);
         font:500 11px/16px var(--sans); color:var(--text-muted);
         text-align:right; vertical-align:bottom;
         padding:6px 12px; border-bottom:1px solid var(--rule-head); white-space:nowrap; }
.dt td { text-align:right; padding:7px 12px; height:34px; color:var(--text);
         border-bottom:1px solid var(--rule-row);
         overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.dt th:first-child, .dt td:first-child { text-align:left; padding-left:0; }
.dt th:last-child,  .dt td:last-child  { padding-right:0; }
.dt tbody tr { transition: background-color 120ms ease; }
.dt tbody tr:hover { background: var(--row-hover); }
.dt tbody tr:last-child td { border-bottom:0; }
```

Right alignment is the default and left is the opt-out (Yahoo's rule); tabular figures ride on the `.dt` class so a column can never reflow. No zebra striping. No radius. No outer border — the table bleeds to the container edge under its section heading's rule. A cell holds **one value in one unit**; a USD equivalent is its own column with its own header. Secondary text inside a cell is permitted only in the first (identifier) column: a 12px `--text-muted` line under the primary label, and that column alone gets `white-space:normal`.

Row navigation: the identifier cell contains a block-level `<a>` filling the cell (`display:block; padding:7px 12px 7px 0; margin:-7px 0 -7px 0; color:inherit; text-decoration:none`), so the click target is the cell and the row tint marks it. `cursor:pointer` on `tr:has(a)`.

Sorted column (asset index only): `th[aria-sort] { color: var(--text); border-bottom-color: var(--text) }` — a heavier underline, no caret glyph, no extra width.

Concrete colgroups:
- **Home, largest payers** — `Symbol 96px | Company 1fr | Payments 88px | Yield 96px | Paid (USD) 140px`
- **Asset, multiplier history** — `Date 112px | Action 150px | Multiplier 1fr(min 260px, .lit) | Per 1,000 held 130px | USD today 120px`
- **Asset, scheduled** — `Date 112px | Action 150px | Withholding 110px | Status 110px | Net per share 130px`
- **Wallet, positions** — `Symbol 96px | Tokens 150px | Value (USD) 120px | Payments 90px | Received (USD) 130px | Backing 96px`

### 5.4 Key figure display

No card, no border, no gradient, no background. One per page.

```
[label]   11px/500 --text-muted, sentence case
[value]   32px/36px 500 --text, tabular, margin-top 6px, NEVER coloured
────────  1px solid var(--rule-head), full container width, margin-top 16px
[context] 14px/22px --text-2, max 66ch, margin-top 16px
```

Emphasis inside the context sentence is `font-weight:500; color:var(--text)`, never colour. If the figure is a percentage it keeps its `%`; if currency, `$` at the same size and weight. If the figure would be negative it takes `--neg` and a `−` glyph — the only circumstance in which it is coloured.

### 5.5 Labelled statistic (the summary band)

```css
.band { display:grid; grid-template-columns:repeat(4,1fr); gap:0; margin-top:32px; }
.band > div + div { border-left:1px solid var(--rule-row); padding-left:16px; margin-left:16px; }
.stat__label { font:500 11px/16px var(--sans); color:var(--text-muted); }
.stat__value { font:500 20px/28px var(--sans); color:var(--text); margin-top:6px; }
.stat__note  { font:400 12px/18px var(--sans); color:var(--text-muted); margin-top:4px; max-width:28ch; }
@media (max-width:899px){ .band{grid-template-columns:repeat(2,1fr); row-gap:20px}
  .band>div:nth-child(odd){border-left:0;padding-left:0;margin-left:0} }
@media (max-width:559px){ .band{grid-template-columns:1fr}
  .band>div{border-left:0;padding-left:0;margin-left:0;
            display:flex;justify-content:space-between;align-items:baseline;
            border-bottom:1px solid var(--rule-row);padding-bottom:8px}
  .stat__value{margin-top:0} .stat__note{display:none} }
```

No box, no background, no radius, no `overflow:hidden` hairline trick. **The band holds comparable measured quantities only.** A date, an address, a provider name or a status is not a statistic: those go in a two-column facts list below the band (`dt` 11px/500 `--text-muted` left at 180px fixed, `dd` 13px `--text` right-aligned… left-aligned, one per row with a 1px `--rule-row` between). A value that does not fit at 20px is proof it belongs in the facts list, not a reason to override its size inline.

### 5.6 Status indicator

```css
.status { display:inline-flex; align-items:center; gap:6px;
          font:500 11px/16px var(--sans); color:var(--text-2); white-space:nowrap; }
.status::before { content:""; width:6px; height:6px; border-radius:50%;
                  background:var(--n-400); flex:none; }
.status--ok::before   { background:var(--pos); }
.status--warn::before { background:var(--warn); }
.status--bad::before  { background:var(--neg); }
```

The word is always present and always states the condition (`Live`, `Trading halted`, `Fully backed`, `Under-collateralised`, `Payout incoming`, `Dormant`). No pill, no background, no border, no radius on the label. This replaces `.pill` in every one of its current uses. `.pill` used as a *link* (wallet page, "asset view →") becomes a plain 12px `--accent` text link.

### 5.7 Section heading

```css
.section { margin-top:48px; }
.section__head { display:flex; align-items:baseline; justify-content:space-between; gap:16px;
                 padding-bottom:8px; border-bottom:1px solid var(--rule-head); }
.section__title { font:500 13px/20px var(--sans); color:var(--text); margin:0; }
.section__meta  { font:400 11px/16px var(--sans); color:var(--text-muted); }
.section__body  { margin-top:16px; }
```

Sentence case, no tracking, no uppercase. `section__meta` carries counts and as-of dates (`8 of 832`, `as of 12 Sep 2026`). There are exactly two label roles in this system — the 13px section heading and the 11px column/statistic label — and both are defined once here. Any fourth micro-label treatment is a defect.

### 5.8 Footnote and disclaimer block

```css
.notes { margin-top:48px; padding-top:16px; border-top:1px solid var(--hairline);
         list-style:none; counter-reset:n; padding-left:0; }
.notes li { counter-increment:n; position:relative; padding-left:20px; max-width:66ch;
            font:400 12px/18px var(--sans); color:var(--text-muted); margin-bottom:8px; }
.notes li::before { content:counter(n); position:absolute; left:0; top:0;
                    font:500 11px/18px var(--sans); color:var(--text-faint); }
.disclaimer { margin-top:16px; max-width:80ch;
              font:400 11px/16px var(--sans); color:var(--text-faint); }
```

Notes are numbered so a figure can reference one (`Paid (USD)` header carries a superscript `1`). No em dash markers, no bullet glyphs. The disclaimer is the last element on every page and repeats the read-only / no-custody / not-affiliated text at 11px.

### 5.9 Empty state

No card, no border, no icon, no illustration.

```
padding: 24px 0;
line 1: 14px/22px --text-2, max 66ch — states plainly what does not exist
line 2: 12px/18px --text-muted, margin-top 6px — states what to do instead,
        with any ticker or address as an --accent link
```
It sits inside `.section__body`, under that section's own heading rule. It never has its own container.

### 5.10 Error state

```css
.error { background:var(--surface); border:1px solid var(--rule-row);
         border-left:2px solid var(--neg); border-radius:0;
         padding:12px 14px; margin-top:24px; }
.error__head { font:500 13px/20px var(--sans); color:var(--text); }
.error__body { font:400 12px/18px var(--sans); color:var(--text-muted); margin-top:6px; max-width:66ch; }
```

Head states the failure in plain language (`This wallet could not be read`). Body carries the cause and the remedy; any machine string inside it uses `.lit`. Text is never red — red exists here only as the 2px edge. The `--warn` variant (pending payout, balance mismatch) is the identical block with `border-left-color: var(--warn)` and a `.status--warn` line as its head.

### 5.11 Notice band (replaces `.compare`)

The two before/after comparisons become a two-row table, not a coloured panel:

```
<table class="dt dt--compact"> with colgroup: Reading 1fr | Figure 180px
row 1: td.is-void — the wrong reading. Label in --text-muted with
       "Incorrect" as a .status (neutral dot) prefix; figure in --text
       with text-decoration: line-through; text-decoration-color: var(--n-400).
row 2: the correct reading. Label in --text; figure in --text, weight 500.
caption below (12px --text-muted, max 66ch): the explanation and the delta,
       stated as a signed figure in --pos/--neg if it has a sign.
```
Neither figure is green. `$0` is never rendered in a positive colour.

### 5.12 Loading state

Skeletons mirror the real geometry of what is loading: a 34px row grid with `border-bottom:1px solid var(--rule-row)` and one `--sunken` block per column at the column's width × (60%, 40%, 30%, 45%, 35%), `height:10px`, `border-radius:2px`.

```css
.sk { animation: sk 1.6s ease-in-out infinite; }
@keyframes sk { 0%,100%{opacity:1} 50%{opacity:.55} }
@media (prefers-reduced-motion: reduce){ .sk{animation:none;opacity:.8} }
```

No moving gradient, no `background-position` sweep, no radius above 2px. Below the skeleton, one 12px `--text-muted` line stating exactly what is being read and the expected cost (`Reading every Token-2022 balance in this wallet, then the payout record for each position. Large wallets take a few seconds.`).

### 5.13 Logo / token mark

`width:24px; height:24px; border-radius:2px; border:1px solid var(--hairline); background:var(--sunken); object-fit:contain`. The `--sunken` fill means a missing or slow image shows a neutral tile rather than collapsing the row (Jupiter's construction, squared). Asset page identity uses 28px; table cells use 20px. No circles, no coloured tiles.

---

## 6. PAGE LAYOUTS

### 6.1 Home — `app/page.tsx`

**The marketing hero is deleted.** Justification, for the record: the 46px `clamp()` headline with a coloured `<em>` on a second line is the single most recognisable generated-landing-page construction in the current build, and it is doing a job the page can do better — the mechanism is explained by the standfirst in two sentences and then *demonstrated* by the numbers underneath it, which is how every reference product opens. A product whose whole claim is that it reads a field correctly cannot open with an advertisement. What survives is the sentence, at 16px, in a neutral.

Top to bottom:

1. **Header bar** (no search — search leads the page here).
2. **Page title**, `h1` 26px/500: `Dividends paid by tokenized US stocks on Solana`.
3. **Standfirst**, 16px/26 `--text-2`, max 66ch, two sentences: xStocks pay by raising a Token-2022 multiplier; token counts never change and no wallet, explorer or portfolio reports it.
4. **Search** (full 520px variant) with its examples line.
5. **Key figure** — total paid invisibly, 32px `--text`, label `Paid into Solana wallets without a transaction`, rule, then the context sentence carrying payment count, asset count and float, with an `as of` date.
6. **Statistic band, three columns only**: `Tokenized assets` / `Average payout` / `Payments recorded`. **`Trackers showing it: 0` is removed from the band** — it is an unsourced assertion in a measurement slot and it undermines the three real figures beside it. If the claim matters it becomes numbered note 3, naming the wallets and explorers checked and the date they were checked. `Next one lands` moves out of the band into the Scheduled section's `section__meta`, because a date is not a comparable quantity.
7. **Section: Largest payers** — the 5-column table, 8 rows, `section__meta` = `8 of 832 · as of 12 Sep 2026`, plus a trailing `View all assets` link in `--accent` at 12px, 12px below the table.
8. **Section: Next scheduled** — 4-column table, next 8 events.
9. **Section: A split is not a dividend** — 66ch prose, then the 5.11 comparison table, then its caption.
10. **Section: How the payment hides** — 66ch prose with `multiplier` / `newMultiplier` in `.lit`, then the second 5.11 comparison table.
11. **Notes** (numbered) and **disclaimer**.

Above the fold: title, standfirst, search, key figure, top of the band. Below: everything from the payers table down. Sections 9 and 10 are explanatory and correctly sit last.

### 6.2 Asset page — `app/asset/[symbol]/page.tsx`

1. **Header bar with compact search** (pre-filled with the symbol).
2. **Identity row**, flex, 32px below the bar: 28px logo tile | `<h1>` ticker 20px/500 `--text` with a 12px `--text-muted` second line reading `name · tracks UNDERLYING · $price` | `margin-left:auto` | `.status` (`Live` / `Trading halted`).
3. **Key figure** — `Paid invisibly since launch`, the total growth percentage at 32px `--text`; context sentence gives payment count and the per-1,000-held gain with its USD value. If the asset has only split, the same component reads `Split, not a payout` with the ratio as the figure and no colour change. If nothing has happened, the key figure is replaced by a 5.9 empty state directly under the identity row.
4. **Facts band**, 4 columns: `Multiplier in force` (20px, `.lit`-cased digits but sans+tnum, `--text`) | `Stale multiplier field` (`--warn`, note states the drift) | `Circulating` | `Price`. **Mint address moves out of the band** into a two-column facts list under it: `Mint` (`.lit`), `Program` (`Token-2022`), `Issuer`, `Measured at`.
5. **Pending payout notice** (5.10 `--warn` variant) when present, directly under the band.
6. **Section: Multiplier history** — 5-column table, newest first, `section__meta` = `per 1,000 SYMBOL held`. The `From → To` column uses `.lit`. The `Per 1,000 held` column is signed and takes `--pos` when it is income; a split row's value is `--text-muted` and the Action column says `Split · no gain`, with no coloured amount.
7. **Section: Scheduled** — 5-column table.
8. **Section: Reserves** — a `.status` line (`Fully backed` / `Under-collateralised` / `Not comparable`) with the ratio at 20px/500 beside it; a 4px-tall bar, `border-radius:0`, track `--sunken`, fill `--text-2` (or `--neg` below 1.0), plus a 1px `--n-400` tick at the 100% position; then the two-column facts list: `Shares held`, `Custodians`, `Tokens circulating (all chains)`, `On Solana`, `Share of global float`.
9. **Notes**, **disclaimer**.

### 6.3 Wallet statement — `app/wallet/[address]/page.tsx`

Nested cards are eliminated. One table is the statement.

1. **Header bar with compact search**.
2. **Identity row**: `<h1>` 20px/500 `Wallet statement`, second line the address in `.lit` with a `Copy` text link in `--accent`; `margin-left:auto` a 12px `--text-muted` line `N positions · $value · read at HH:MM UTC`.
3. **Key figure** — `Received without a transaction`, USD total at 32px `--text`; context sentence gives payment count, itemised-vs-total positions and combined value.
4. **Statistic band, 3 columns**: `Payments` | `Positions paying` | `Understatement if read naively` (`--warn` when non-zero). The standalone balance-mismatch card is deleted; the figure lives here and the explanation becomes numbered note 1.
5. **Section: Positions** — one 6-column table, all positions, sorted by received USD descending. First cell: 20px logo tile + ticker (link to the asset page) with the token count as its 12px secondary line. Each row is expandable: a `<tr class="detail">` immediately after it, hidden by default, whose single `<td colspan>` contains an inset table (`.dt--compact`, `background: var(--sunken)`, `padding:12px 0 12px 24px`) with the per-payment history — `Date | Action | Multiplier (.lit) | Tokens gained | USD`. Expanded when the wallet has exactly one position; otherwise collapsed, toggled by a chevron-free `Show payments` / `Hide payments` text link in the last cell at 11px `--accent`. A position with no payments shows one italic-free `--text-muted` line in place of the inset table.
6. **Notes** (the report's own notes, numbered, plus the fixed balance-assumption note), **disclaimer**.

Above the fold: identity, key figure, band, first rows of the positions table. Everything else below.

---

## 7. THE TWENTY RULES

1. **No hex literal or `rgb()`/`hsl()` outside the `:root` block in `globals.css`.** `grep -rn "#[0-9a-fA-F]\{3,8\}" app --include=*.tsx` returns zero.
2. **No `style={{...}}` in any `.tsx`.** The only exceptions are a `<col style={{width}}>` and a data-driven bar `width: N%`. `grep -c "style={{" app/**/*.tsx` ≤ 2 and both must match those cases.
3. **Border radius is 0, 2 or 4 only.** 0 on tables, bands, notices, key figures, error blocks, bars. 2 on logo tiles and skeleton blocks. 4 on the search input and button. No pills anywhere except the 6px status dot.
4. **Font sizes come from the eight-step scale.** No fractional values. `grep -E "font-size:\s*[0-9]+\.[0-9]" globals.css` returns zero, as does any `clamp(` or `vw` in a `font-size`.
5. **Font weights are 400, 500, 600 only,** and 600 appears exactly once (the wordmark). `640`, `700` and `bold` return zero matches.
6. **`letter-spacing` appears zero times** in the stylesheet, and `text-transform: uppercase` appears zero times.
7. **Zero gradients and zero shadows.** `grep -E "gradient\(|box-shadow" globals.css` returns nothing, including on the `body` and on the sticky header.
8. **Green and red only touch a signed quantity, a status dot, an under-collateralised bar fill, or a 2px notice edge.** Any headline figure, label, heading, button or wordmark rendered in `--pos`/`--neg` is a defect.
9. **`--accent` appears only on link text, `:focus-visible` outlines and `--row-select`.** It is never a background fill, never a heading colour, never in the wordmark.
10. **Monospace is only for base58 addresses, raw on-chain field values and inline code.** `.lit` never wraps money, a percentage, a count, a date, a label or a status. No row contains a monospace cell and a proportional cell holding the *same kind* of thing.
11. **Every list of figures is a `<table>` with a `<thead>` labelling every column.** A headerless grid of numbers, or a section title standing in for a column header, is a defect.
12. **Every table has a `<colgroup>` with explicit widths.** `width: auto` on a money column is banned; the left edge of a numeric column must be identical on every row.
13. **One value, one unit, per cell.** A USD equivalent gets its own column and its own header. A second line inside a cell is permitted only in the first (identifier) column.
14. **Right alignment is the table default and is set once on `td`/`th`;** the first column is the only opt-out. No `text-align` is ever set in JSX.
15. **`repeat(auto-fit` and `auto-fill` appear zero times.** Every grid declares its column count explicitly at each breakpoint.
16. **No element nests inside more than one bordered container.** Data regions have no container at all; they bleed to the container edge under their section rule. `.card` does not exist in the new stylesheet.
17. **One figure above 20px per page,** it is `--text`, and it never uses `clamp()`. Two 32px figures on one page is a defect.
18. **The statistic band holds comparable measured quantities only.** A date, an address, a provider name, a status or any value needing a size override goes in the facts list instead.
19. **Every displayed number has a stated source and an as-of moment,** in its section's `section__meta` or in a numbered note referenced from its column header. No unverifiable assertion may occupy a figure slot.
20. **The only motion in the product is the skeleton opacity pulse and `transition: background-color 120ms ease` on table rows.** No transform, no scale, no fade-in on load, no animated counters, and the skeleton respects `prefers-reduced-motion`.