// Seconds (cut time) where his face is NOT moved aside or covered, for the judder gate: node tools/free_windows.mjs <project>  → "629.5 641.1 …"
// (user order 2026-11-15: «طبّق تعديل فحص الارتجاف»; before it the windows were spaced evenly, fell on half-screen elements, the face crop saw the background and the gate read ~49 % falsely).
// The threshold (96 %) and the check itself are unchanged; only WHERE it measures changes. Busy = pick elements that split the screen (not the no-split ones), verse, note, pmap, date, rewrite, rows,
// zooms, shake, behind and shifts windows, the bumper. A window needs 4.5 s of clear time; no free window → the caller falls back to the old evenly spaced windows.
import fs from "node:fs";
const p = process.argv[2], s = JSON.parse(fs.readFileSync(`data/specs/${p}.json`, "utf8")), busy = [];
/* (2026-11-19) in a portrait reel every pick panel (the board included) takes the lower half and moves him: the old «no split» list is for landscape → a «free» window on a board measured a shifted face (false 12–35 % failures on clean renders) */
const REEL = s.kind === "reel";
const NOSPLIT = new Set(["RingStat", "MythFact", "ChatThread", "FlapBoard"]), FULL = new Set(["AlertFrame", "PipSource"]);
const A = (it) => it.at ?? it.from ?? (it.times ? it.times[0] : 0), B = (it) => it.until ?? it.to ?? (it.dur ? A(it) + it.dur : A(it) + 1);
for (const it of s.items) { const shifts = (it.t === "pick" && !(it.noShift ?? (!REEL && NOSPLIT.has(it.el))) && !FULL.has(it.el)) || ["verse", "hadith", "note", "pmap", "date", "rewrite", "rows", "splits"].includes(it.t); if (shifts) busy.push([A(it) - 1, B(it) + 1]); }
for (const z of [...(s.zooms || []), ...(s.shake || [])]) busy.push([z.from - 1, z.to + 2]);
for (const w of [...(s.behind || []), ...(s.shifts || []), ...(s.splits || [])]) busy.push([w.from - 1, w.to + 1]);
if (s.bumper) busy.push([s.bumper.at - 1, s.bumper.at + 1]);
busy.sort((a, b) => a[0] - b[0]);
const dur = s.frames / 30, free = [];
/* (2026-11-19) a dense reel (boards and pictures all the way) has no 4.5 s stretch after second 3: the pass 1 keeps the old rule; only when it finds nothing, pass 2 accepts a 3.4 s stretch from second 0.3 (the window is 3 s; same 96 % threshold) */
for (const [start, need, tail] of [[3, 4.5, 3], [0.3, 3.4, 0.3]]) {
  let e = start;
  for (const [a, b] of busy) { if (a - e >= need) free.push([e, a]); e = Math.max(e, b); }
  if (dur - tail - e >= need) free.push([e, dur - tail]);
  if (free.length) break;
}
// --spans: the clear stretches themselves ("a-b …", seconds) for the random 10-second judder probe (tools/judder_probe.mjs --random)
console.log(process.argv.includes("--spans") ? free.map((f) => `${f[0].toFixed(2)}-${f[1].toFixed(2)}`).join(" ") : free.map((f) => (f[0] + 0.5).toFixed(1)).join(" "));
