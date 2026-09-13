// Build an .srt from the script's own English, timed to the footage.
//
// The words are fixed: they come from video/altyazi.json, which is the script.
// Only the timings are discovered. For each clip we run ffmpeg's silencedetect,
// take the runs of speech between the silences, and lay that scene's cues across
// them in proportion to their word count. So the subtitles follow the pace that
// was actually spoken rather than a guess made before the take.
//
//   node scripts/altyazi.mjs video/cekim
//
// Writes video/altyazi.srt, plus a per-clip report so a scene whose cues and
// speech runs disagree badly is visible rather than silently mistimed.

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

const DIR = process.argv[2] ?? "video/cekim";
const SPEC = JSON.parse(readFileSync("video/altyazi.json", "utf8"));

// Quiet passages shorter than this are a breath, not a gap between sentences.
const MIN_SILENCE = 0.45;
const NOISE_DB = "-34dB";

function probeDuration(file) {
  const out = execFileSync("ffprobe", [
    "-v", "error", "-show_entries", "format=duration",
    "-of", "default=nw=1:nk=1", file,
  ]).toString().trim();
  return parseFloat(out);
}

/** Runs of sound, in seconds, derived from where the silence is not. */
function speechRuns(file, duration) {
  const log = execFileSync("ffmpeg", [
    "-i", file, "-af", `silencedetect=noise=${NOISE_DB}:d=${MIN_SILENCE}`,
    "-f", "null", "-",
  ], { stdio: ["ignore", "ignore", "pipe"] }).toString();

  const silences = [];
  let start = null;
  for (const line of log.split("\n")) {
    const a = line.match(/silence_start:\s*(-?[\d.]+)/);
    const b = line.match(/silence_end:\s*([\d.]+)/);
    if (a) start = Math.max(0, parseFloat(a[1]));
    if (b && start !== null) {
      silences.push([start, parseFloat(b[1])]);
      start = null;
    }
  }
  if (start !== null) silences.push([start, duration]);

  const runs = [];
  let at = 0;
  for (const [s, e] of silences) {
    if (s - at > 0.25) runs.push([at, s]);
    at = e;
  }
  if (duration - at > 0.25) runs.push([at, duration]);
  return runs.length ? runs : [[0, duration]];
}

const words = (s) => s.replace(/\n/g, " ").trim().split(/\s+/).length;

/** Lay one scene's cues across its speech, weighted by how much there is to say. */
function timeScene(cues, runs) {
  const total = runs.reduce((t, [s, e]) => t + (e - s), 0);
  const totalWords = cues.reduce((t, c) => t + words(c), 0);
  const out = [];
  let ri = 0;
  let cursor = runs[0][0];

  for (const cue of cues) {
    let want = (words(cue) / totalWords) * total;
    const from = cursor;
    // Walk forward through the runs, skipping the silence between them.
    while (want > 0 && ri < runs.length) {
      const left = runs[ri][1] - cursor;
      if (left > want) {
        cursor += want;
        want = 0;
      } else {
        want -= left;
        ri++;
        if (ri < runs.length) cursor = runs[ri][0];
      }
    }
    // Never leave a cue on screen for less than a second; nobody can read that.
    out.push([from, Math.max(cursor, from + 1.0)]);
  }
  return out;
}

const stamp = (t) => {
  const ms = Math.round(t * 1000);
  const h = String(Math.floor(ms / 3600000)).padStart(2, "0");
  const m = String(Math.floor(ms / 60000) % 60).padStart(2, "0");
  const s = String(Math.floor(ms / 1000) % 60).padStart(2, "0");
  return `${h}:${m}:${s},${String(ms % 1000).padStart(3, "0")}`;
};

const files = readdirSync(DIR).filter((f) => /\.(mp4|mov|mkv|webm)$/i.test(f));
const pick = (base) => {
  // Prefer an exact name; fall back to the highest-numbered retake.
  const exact = files.find((f) => f.replace(/\.\w+$/, "") === base);
  if (exact) return exact;
  const takes = files.filter((f) => f.startsWith(base + "-")).sort();
  return takes.at(-1) ?? null;
};

let srt = "";
let n = 0;
let offset = 0;

console.log("clip                 speech runs   cues   duration");
for (const scene of SPEC.scenes) {
  const name = pick(scene.file);
  if (!name) {
    console.log(`${scene.file.padEnd(20)} — not shot yet, skipped`);
    continue;
  }
  const file = path.join(DIR, name);
  const dur = probeDuration(file);
  const runs = speechRuns(file, dur);
  const times = timeScene(scene.cues, runs);

  console.log(
    `${name.padEnd(20)} ${String(runs.length).padStart(11)}   ${String(scene.cues.length).padStart(4)}   ${dur.toFixed(1)}s` +
      (runs.length < 2 ? "   <- one run: check the mic picked up the pauses" : "")
  );

  for (let i = 0; i < scene.cues.length; i++) {
    const [a, b] = times[i];
    srt += `${++n}\n${stamp(offset + a)} --> ${stamp(offset + b)}\n${scene.cues[i]}\n\n`;
  }
  offset += dur;
}

writeFileSync("video/altyazi.srt", srt);
console.log(`\nvideo/altyazi.srt yazildi — ${n} altyazi, toplam ${offset.toFixed(1)}s`);
