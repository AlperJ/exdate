// Derive the subtitle cues from the script itself, so the two cannot drift.
// Sentences are split at punctuation, gathered into cues no longer than a
// reader can take in, then broken into at most two lines at a phrase boundary.
import fs from "node:fs";

const SRC = "docs/video-script.html";
const OUT = "video/altyazi.json";
const h = fs.readFileSync(SRC, "utf8");

const MAX_LINE = 46;      // characters that stay readable at normal playback
const MAX_CUE = 88;       // two such lines

const FILES = ["01-giris", "02-problem", "03-cuzdan", "04-digerleri", "05-guven", "06-durustluk", "07-kapanis"];

const plain = (s) => s.replace(/<rt>[^<]*<\/rt>/g, "").replace(/<[^>]*>/g, "")
  .replace(/&nbsp;/g, " ").replace(/&[a-z]+;/g, " ").replace(/\s+/g, " ").trim();

/** Break a cue into at most two lines, as evenly as the word boundaries allow. */
function wrap(text) {
  if (text.length <= MAX_LINE) return text;
  const words = text.split(" ");
  let best = null;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(" "), b = words.slice(i).join(" ");
    if (a.length > MAX_LINE || b.length > MAX_LINE) continue;
    // Balance the two lines, but break after punctuation where there is any:
    // a line that ends on a clause reads far better than one cut mid-phrase.
    const clause = /[,;:—]$/.test(a) ? 14 : 0;
    const score = Math.abs(a.length - b.length) - clause;
    if (!best || score < best.score) best = { score, text: a + "\n" + b };
  }
  if (best) return best.text;
  // Nothing splits into two legal lines: fall back to the least-bad split.
  const mid = Math.ceil(words.length / 2);
  return words.slice(0, mid).join(" ") + "\n" + words.slice(mid).join(" ");
}

/** Sentences, and any that alone exceed a cue are cut again at a clause break. */
function pieces(block) {
  const out = [];
  // A dot inside a name ("j.tools") is not the end of a sentence — hide it from
  // the splitter and put it back once the sentences have been cut.
  const HIDE = "";
  const masked = block.replace(/\.(?=[a-z])/g, HIDE);
  for (const sent of masked.match(/[^.!?]+[.!?]+|\S[^.!?]*$/g) ?? [masked]) {
    const s = sent.trim().split(HIDE).join(".");
    if (!s) continue;
    if (s.length <= MAX_CUE) { out.push(s); continue; }
    let rest = s;
    while (rest.length > MAX_CUE) {
      // Prefer a real clause break; otherwise the last word that still fits.
      const head = rest.slice(0, MAX_CUE + 1);
      // A conjunction is as good a break as a comma, and it saves the orphaned
      // one-word tail you get from cutting at the last word that happens to fit.
      const breaks = [" — ", ", ", ": ", " and ", " but ", " or "];
      let cut = -1, keep = 0;
      for (const b of breaks) {
        const i = head.lastIndexOf(b);
        if (i > cut) { cut = i; keep = b === ", " ? 1 : b.length > 3 ? 0 : 2; }
      }
      cut = cut > MAX_CUE * 0.4 ? cut + keep : head.lastIndexOf(" ");
      out.push(rest.slice(0, cut).trim());
      rest = rest.slice(cut).trim();
    }
    if (rest) out.push(rest);
  }
  return out;
}

const heads = [...h.matchAll(/<span class="time">([^<]*)<\/span>/g)];
const scenes = heads.map((m, i) => {
  const body = h.slice(m.index, i + 1 < heads.length ? heads[i + 1].index : h.length);
  const cues = [...body.matchAll(/<div class="en">([^]*?)<\/div>/g)]
    .flatMap((b) => pieces(plain(b[1])))
    .map(wrap);
  return { file: FILES[i], cues };
});

const spec = {
  _comment: [
    "Subtitle cues, in the order they are spoken. The text is the script's own",
    "English, so what appears on screen is correct regardless of how the line",
    "lands in the take. Generated from docs/video-script.html, not hand-typed,",
    "so the subtitles and the script cannot drift apart.",
    "",
    "Timings are not here. They come from the footage: scripts/altyazi.mjs runs",
    "silence detection over each clip, finds the speech runs, and distributes each",
    "scene's cues across them by word count. That way the subtitles follow the",
    "pace actually spoken rather than a guess made in advance.",
    "",
    "Two lines maximum per cue, 46 characters each, split at a phrase boundary.",
  ],
  scenes,
};
fs.writeFileSync(OUT, JSON.stringify(spec, null, 2) + "\n");

let n = 0, over = 0;
for (const s of scenes) {
  console.log(`  ${s.file.padEnd(14)} ${String(s.cues.length).padStart(2)} altyazi`);
  for (const c of s.cues) {
    n++;
    for (const line of c.split("\n")) if (line.length > MAX_LINE) { over++; console.log(`    UZUN (${line.length}): ${line}`); }
  }
}
console.log(`\n  ${n} altyazi, ${over} satir sinirin ustunde`);
