// Recompute every time shown in the script from what is actually said in it.
//
//   node scripts/altyazi-sure.mjs           report only
//   node scripts/altyazi-sure.mjs --yaz     rewrite the headings in place
//
// The scene headings and the "what you type, and when" cues are a budget. Once
// the words change they are a lie unless they are recomputed, and a wrong one is
// worse than none: it tells you to paste at a moment that has already passed.

import fs from "node:fs";

const SRC = "docs/video-script.html";
const WPM = 150;   // a clear, unhurried read — measured, not guessed
const PAUSE = 1.5; // breath between scenes, and time for a screen to land

// The three inline cues, in the order they appear, and the scene each belongs to.
const CUE_SCENE = [2, 3, 4];

const plain = (s) => s.replace(/<rt>[^<]*<\/rt>/g, "").replace(/<[^>]*>/g, "")
  .replace(/&nbsp;/g, " ").replace(/&[a-z]+;/g, " ").replace(/\s+/g, " ").trim();
const mmss = (s) => Math.floor(s / 60) + ":" + String(Math.round(s % 60)).padStart(2, "0");

let h = fs.readFileSync(SRC, "utf8");

const heads = [...h.matchAll(/<span class="time">([^<]*)<\/span>/g)];
let at = 0;
const parts = heads.map((m, i) => {
  const body = h.slice(m.index, i + 1 < heads.length ? heads[i + 1].index : h.length);
  const words = [...body.matchAll(/<div class="en">([^]*?)<\/div>/g)]
    .reduce((t, b) => t + plain(b[1]).split(/\s+/).length, 0);
  const start = at;
  at += (words / WPM) * 60 + PAUSE;
  return { old: m[1], words, start, end: at, span: `<span class="time">${m[1]}</span>` };
});

const write = process.argv.includes("--yaz");
for (const p of parts) {
  p.neu = mmss(p.start) + "–" + mmss(p.end);
  if (write) h = h.replace(p.span, `<span class="time">${p.neu}</span>`);
  console.log(`  ${p.old.padEnd(11)} -> ${p.neu.padEnd(11)} ${String(p.words).padStart(3)} kelime`);
}

// Rewrite the inline cues by position, not by their current text: matching on the
// old value is what let these three go stale the last time the script was cut.
const cues = [...h.matchAll(/<span class="when">([^<]*)<\/span>/g)];
if (cues.length !== CUE_SCENE.length) {
  console.log(`\n  UYARI: ${cues.length} adet "when" var, ${CUE_SCENE.length} bekleniyordu — elle bak`);
} else {
  for (let i = cues.length - 1; i >= 0; i--) {  // back to front, so offsets hold
    const neu = mmss(parts[CUE_SCENE[i]].start);
    console.log(`  when ${cues[i][1].padEnd(6)} -> ${neu}`);
    if (write) h = h.slice(0, cues[i].index) + `<span class="when">${neu}</span>` + h.slice(cues[i].index + cues[i][0].length);
  }
}

const total = mmss(at);
const words = parts.reduce((t, p) => t + p.words, 0);
if (write) {
  h = h.replace(/\d+ minutes? \d+(?: at a clear \d+ words a minute)?\./, `${total.replace(":", " minutes ")} at a clear ${WPM} words a minute.`);
  h = h.replace(/\d+ dakika \d+ saniye(?:, dakikada \d+ kelimelik net bir tempoda)?\./, `${total.split(":")[0]} dakika ${total.split(":")[1]} saniye, dakikada ${WPM} kelimelik net bir tempoda.`);
  fs.writeFileSync(SRC, h);
}
console.log(`\n  toplam: ${total}  (${words} kelime @ ${WPM} kelime/dk + sahne araları)` + (write ? "  — yazildi" : "  — sadece rapor, yazmak icin --yaz"));
