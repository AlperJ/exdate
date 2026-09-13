# Pitch video — 2 minutes 58

Screen recording with voice over. Nothing is acted out: every screen is the live site and
every number is real, so if you fumble a line the screen still carries the argument.

The script runs 418 spoken words. At a clear, unhurried 150 words a minute that is 2:47 of
speech plus a breath between scenes — 2:58 in total, inside the three-minute limit with a few
seconds to spare. If you read faster than that you will finish early, which is fine. If you
find yourself running past 3:00, you are reading too slowly, not saying too much.

**The printable two-language version** — English to read aloud with the Turkish underneath
each line, and the pronunciation of the hard words above them — is **`VIDEO-METIN.pdf`**,
source at `docs/video-script.html`. Read from that, not from here; this file is the shot list.
(`VIDEO-SON.pdf` and `VIDEO-okunusla.pdf` are the older, longer drafts — delete them, they
were open in a viewer and could not be removed automatically.)

**Before you hit record**

- Open four tabs, in this order, and let each finish loading once so nothing spins on camera:
  1. `https://exdate-ten.vercel.app`
  2. `https://exdate-ten.vercel.app/wallet/7BCp5XUXtKzZWYCvGR2fzFqoyKiJ7ozN8eCEHscpSMnB?show=NVDAx`
  3. `https://exdate-ten.vercel.app/asset/AAPLx`
  4. `https://exdate-ten.vercel.app/calendar`
- Copy `7BCp5XUXtKzZWYCvGR2fzFqoyKiJ7ozN8eCEHscpSMnB` to the clipboard now, so the paste in
  scene 3 is one keystroke.
- Zoom the browser to 110%. Text that reads on your monitor is unreadable in a compressed
  recording.
- Hide bookmarks and any other tab.

Timings are a budget, not a metronome. If you run long, cut scene 6 first.

---

## 0:00 – 0:14 — Who you are

**On screen:** you, or just the ExDate front page, whichever you are comfortable with.

> I'm Alperen, founder of j.tools. We're three people working full time from our office in
> Turkey, part of Superteam Turkey. ExDate was built during this hackathon, from an empty
> repository.

*Say it once and move. The product is the pitch, not the biography.*

---

## 0:14 – 0:42 — The problem, shown not described

**Do:** Tab 1, the front page. Sit still on the card on the right. Let it be read.

> Tokenized stocks on Solana pay real dividends — but not as a transfer. The issuer quietly
> raises a multiplier on the token, and every balance goes up at that instant.

**Do:** Cursor to the "Held before / Held after" rows, then down to the amber row.

> This is Apple, in August. A hundred tokens became a hundred point three-three. The
> transaction list says none.

**Do:** Move the cursor to the $11,984,608 figure and stop.

> No wallet, no explorer, no tracker shows it. Almost twelve million dollars, paid to people
> who were never told.

---

## 0:42 – 1:20 — What it does, on a real wallet

**Do:** Click the search box, paste the address, hit Look up. **Let the load happen on
camera.** It takes a second or two and that second is the proof it is live.

> So: paste any Solana address. No sign-in, no wallet connection — it even works for a wallet
> you don't own.

**Do:** When the statement appears, cursor to the headline figure.

> This one was paid ninety-three dollars and thirty-eight cents, across twenty-eight payments.
> It has no record of any of them.

**Do:** Cursor to the sentence about the oldest payment.

> The oldest is from August last year. Thirteen months anything starting at signup shows as
> zero.

**Do:** Scroll to the positions table. Click **Show** on the NVDAx row.

> Every row opens into what produced it. NVIDIA paid this wallet five times: the multiplier
> before and after, and what it was worth.

**Do:** Cursor along the "10 Sept 2026" row, left to right, slowly.

> And each is valued against the balance held that day — not today's.

---

## 1:20 – 1:43 — The other two things you can do

**Do:** Tab 3, AAPLx.

> Type a ticker and you get the other direction: what that stock has paid, what it owes next,
> the tax withheld, and whether it is really backed by shares in custody.

**Do:** Tab 4, the calendar.

> And the calendar. The issuer lists five hundred and thirty-nine payments as upcoming. Only
> thirty-eight are. We check every row against the clock.

---

## 1:43 – 2:10 — Why it can be trusted

**Do:** Go to `/method`. Scroll slowly through the freshness table and the sources.

> Everything is read from Solana and the issuer's public records, and every page says which
> source produced which figure.

> Apple's five dividends hand-compound to the chain's own multiplier to the last digit.
> Adversarial reviewers tried to prove our figures wrong and broke several — including one
> where our own headline was seven times too high. All fixed, all written down, mistakes
> included.

*Do not rush this part. Accuracy is the product, and a judge who believes the numbers believes
everything else.*

---

## 2:10 – 2:39 — Honesty and scale

**Do:** Stay on `/method`, scroll to the paragraph naming SolanaRWA.

> We're not the first, and we say so ourselves. SolanaRWA does this on the same extension —
> but they need you to connect a wallet, and only see forward from the day you sign up. Nobody
> had built the backward half.

**Do:** Back to the front page.

> And it isn't only xStocks. Ondo uses the same extension and is bigger: one point four billion
> dollars, three hundred thousand holders. None of them can see it.

---

## 2:39 – 2:58 — Close

**Do:** Front page, still. Or your face again.

> ExDate is live, free, read-only, and open source.
>
> The roadmap and the numbers are in the pitch deck. Thank you for reading this far, and for
> running Stocklana.
>
> Go and paste an address. It's the fastest way to see whether I'm telling the truth.

**End card, five seconds, silent:**

```
exdate-ten.vercel.app
github.com/AlperJ/exdate
```

---

## Subtitles

Shoot the seven scenes as separate clips, named `01-giris`, `02-problem`, `03-cuzdan`,
`04-digerleri`, `05-guven`, `06-durustluk`, `07-kapanis`, into `video/cekim/`. A retake goes
in beside the original as `03-cuzdan-2` and so on; the highest-numbered one wins.

Then:

```bash
node scripts/altyazi.mjs video/cekim
```

It writes `video/altyazi.srt`. The words come from `video/altyazi.json`, which is generated
from this script by `scripts/altyazi-cue.mjs` — so the subtitles say what the script says even
if a take wanders. Only the timings are discovered, by running silence detection over each
clip and laying that scene's lines across the speech it actually finds.

If you edit the script, regenerate the cues before timing them:

```bash
node scripts/altyazi-cue.mjs
```

---

## Two things to avoid

**Do not read the numbers off a script while the screen shows something else.** Every figure
you say should be visible at that moment. If they drift apart, a judge notices and stops
trusting both.

**Do not apologise for what is missing.** The roadmap is in the deck. A pitch video that lists
what the product cannot do yet spends its best thirty seconds on the weakest material.

## If you only get 90 seconds

Keep 0:00–0:14, 0:14–0:42, 0:42–1:20, and the close. That is the intro, the problem, the
product working on a real wallet, and the thank you. Everything else is detail the deck
already carries.
