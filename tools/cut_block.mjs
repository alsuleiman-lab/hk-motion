// DELETE A SPAN AS ONE BLOCK, like a real editor (user 2026-11-11: «تعديل من الإطار 1000 إلى 1010 يُعدَّل وحده، ما لك علاقة بغيره»).
// A full re-cut (stage.mjs cut) is NOT deterministic to the frame: it moved an untouched join at 38.5 s by 0.05 s. This tool cuts the span out of the EXISTING
// cut video/audio instead: everything before A stays frame-identical, everything after B moves back by exactly (B − A), nothing inside survives.
//   node tools/cut_block.mjs <p> <A> <B>          (A,B = seconds of the current cut, or f<frame>; snapped to frames)
// Updates: a NEW versioned video public/<p>_cut_s_b<n>.mp4 (never overwrite a file Studio holds), data/specs/<p>.json (items, zooms, shake, behind + matte starts,
// splits, frames, cut), the frozen review copy, .tmp/<p>/cut.wav + cut16k.wav, the map (public/<p>_map.json) and the word files (cut_words, drift_fresh).
// The audio join gets a 12 ms fade on each side (no click, no length change).
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const [p, a0, b0] = process.argv.slice(2);
if (!p || !a0 || !b0) { console.error("usage: node tools/cut_block.mjs <p> <A> <B>"); process.exit(2); }
process.chdir(path.resolve(import.meta.dirname, ".."));
const sec = (x) => (/^f\d+/.test(x) ? Number(x.slice(1)) / 30 : Number(x));
// --src sa sb: REPLACE the span with that stretch of the ORIGINAL recording (a word the cut clipped: keep its true start)
const si = process.argv.indexOf("--src"), SA = si > 0 ? Number(process.argv[si + 1]) : null, SBraw = si > 0 ? Number(process.argv[si + 2]) : null;
const fL = SA != null ? Math.round((SBraw - SA) * 30) : 0, SB = SA != null ? SA + fL / 30 : null, L = fL / 30;
const fA = Math.round(sec(a0) * 30), fB = Math.round(sec(b0) * 30), A = fA / 30, B = fB / 30, D = B - A - L;
if (!(fB > fA)) { console.error("✘ B must be after A"); process.exit(2); }
const T = path.join(".tmp", p), specF = path.join("data", "specs", `${p}.json`), frozenF = path.join(T, "spec_frozen.json");
const spec = JSON.parse(fs.readFileSync(specF, "utf8"));
const src = path.join("public", spec.cut);
const ff = (args) => { const r = spawnSync("ffmpeg", ["-v", "error", "-y", "-threads", "4", ...args], { encoding: "utf8" }); if (r.status !== 0) { console.error(r.stderr); process.exit(1); } };
/* the next number is above every version ever used (a deleted b1 must not be reused: Studio caches by name) */
let n = 1 + Math.max(0, ...fs.readdirSync("public").map((f) => Number(f.match(new RegExp(`^${p}_cut_s_b(\d+)`))?.[1] ?? 0)), Number(fs.existsSync(path.join(T, "cut_block_n.txt")) ? fs.readFileSync(path.join(T, "cut_block_n.txt"), "utf8") : 0)); fs.writeFileSync(path.join(T, "cut_block_n.txt"), String(n));
const outName = `${p}_cut_s_b${n}.mp4`, out = path.join("public", outName);
console.log(`cut_block: ${SA != null ? "استبدال" : "حذف"} ${A.toFixed(3)}–${B.toFixed(3)}ث (الإطار ${fA}–${fB})${SA != null ? ` بالأصل ${SA.toFixed(2)}–${SB.toFixed(2)}ث` : ""}، إزاحة ما بعده ${D.toFixed(3)}ث → ${outName}`);
const ORIG = path.join("public", JSON.parse(fs.readFileSync(path.join(T, "prep_config.json"), "utf8")).source.replace(/^public[\/]/, ""));
ff(["-hwaccel", "cuda", "-i", src, ...(SA != null ? ["-ss", String(SA), "-t", String(L + 0.2), "-i", ORIG] : []), "-filter_complex",
  `[0:v]trim=end_frame=${fA},setpts=PTS-STARTPTS[v0];[0:v]trim=start_frame=${fB},setpts=PTS-STARTPTS[v1];` +
  `[0:a]atrim=end=${A},asetpts=PTS-STARTPTS,afade=t=out:st=${Math.max(0, A - 0.012)}:d=0.012[a0];[0:a]atrim=start=${B},asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.012[a1];` +
  (SA != null
    ? `[1:v]fps=30,trim=end_frame=${fL},setpts=PTS-STARTPTS[vs];[1:a]aresample=48000,atrim=end=${L},asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.012,afade=t=out:st=${Math.max(0, L - 0.012)}:d=0.012[as];[v0][vs][v1]concat=n=3:v=1:a=0[v];[a0][as][a1]concat=n=3:v=0:a=1[a]`
    : `[v0][v1]concat=n=2:v=1:a=0[v];[a0][a1]concat=n=2:v=0:a=1[a]`),
  "-map", "[v]", "-map", "[a]", "-c:v", "h264_nvenc", "-preset", "p5", "-rc", "vbr", "-cq", "16", "-b:v", "0", "-c:a", "aac", "-b:a", "256k", out]);
// older versions (each ~1.7 GB; they filled the disk on 2026-11-11): keep only the new one and the one before it (Studio may still hold that)
for (let k = 1; k < n - 1; k++) { for (const f of fs.readdirSync("public").filter((x) => x.startsWith(`${p}_cut_s_b${k}.`) || x.startsWith(`${p}_cut_s_b${k}_prev_`))) { try { fs.rmSync(path.join("public", f)); } catch { /* still open in Studio: next time */ } } }
ff(["-i", out, "-vn", "-ac", "1", "-ar", "48000", path.join(T, "cut.wav")]);
ff(["-i", path.join(T, "cut.wav"), "-ar", "16000", "-ac", "1", path.join(T, "cut16k.wav")]);

// timeline transform: before A unchanged, after B −D, inside → gone (an item straddling the cut is clipped to the side it starts on)
const mv = (t) => (t == null ? t : t <= A ? t : t >= B ? +(t - D).toFixed(3) : A);
const span = (it) => { const a = it.at ?? it.from ?? it.times?.[0] ?? it.oldAt; const b = it.until ?? it.to ?? (it.dur != null && a != null ? a + it.dur : null) ?? (it.times ? it.times[it.times.length - 1] + 0.5 : a); return [a, b]; };
const inside = (it) => { const [a, b] = span(it); return a != null && a >= A - 0.01 && b <= B + 0.01; };
const shift = (it) => {
  for (const k of ["at", "until", "from", "to", "oldAt", "newAt"]) if (typeof it[k] === "number") it[k] = mv(it[k]);
  if (Array.isArray(it.times)) it.times = it.times.map(mv);
  if (it.matte?.start != null && it.matte.start >= B) it.matte = { ...it.matte, start: +(it.matte.start - D).toFixed(3) };
  if (Array.isArray(it.pts)) it.pts = it.pts.map((q) => (typeof q.at === "number" ? { ...q, at: mv(q.at) } : q));
  if (Array.isArray(it.also)) it.also = it.also.map((q) => (typeof q.at === "number" ? { ...q, at: mv(q.at) } : q));
  return it;
};
const apply = (s) => {
  const gone = [];
  for (const k of ["items", "zooms", "shake", "behind", "splits", "solos", "shifts", "psplits", "cams"]) if (Array.isArray(s[k])) s[k] = s[k].filter((it) => { if (it.t !== "cover" && inside(it)) { gone.push(`${k}:${it.t ?? ""}@${(span(it)[0] ?? 0).toFixed(1)}`); return false; } return true; }).map(shift);
  s.frames = s.frames - (fB - fA) + fL; s.cut = outName;
  return gone;
};
const gone = apply(spec);
fs.writeFileSync(specF, JSON.stringify(spec, null, 1));
if (fs.existsSync(frozenF)) fs.copyFileSync(specF, frozenF);   // the frozen review copy = the result (outside the block nothing moved but time)

// the build's base draft (if any) gets the same cut, length and camera moves, so a later rebuild starts from the cut video
{ const df = path.join(T, "spec_draft_base.json"); if (fs.existsSync(df)) { const d = JSON.parse(fs.readFileSync(df, "utf8")); apply(d); d.frames = spec.frames; fs.writeFileSync(df, JSON.stringify(d, null, 1));   /* (2026-11-12) the WHOLE draft is shifted like the spec — only zooms/shakes were, so a rebuild put the clip windows 4 s late */ } }
// map: remove the cut-time span from the segments (cut time = running sum of segment lengths)
const mapF = path.join("public", `${p}_map.json`), map = JSON.parse(fs.readFileSync(mapF, "utf8"));
fs.copyFileSync(mapF, path.join(T, `map_before_block_${fA}.json`));
let acc = 0; const segs = [];
for (const s of map.segments) {
  const d = s.b - s.a, c0 = acc, c1 = acc + d; acc = c1;
  if (c1 <= A || c0 >= B) { segs.push(s); continue; }
  if (c0 < A) segs.push({ ...s, b: +(s.a + (A - c0)).toFixed(4) });
  if (c1 > B) segs.push({ ...s, a: +(s.a + (B - c0)).toFixed(4) });
}
// the replacement piece goes right where cut time A falls (after the pieces that sum to A)
if (SA != null) { let t = 0, k = 0; while (k < segs.length && t + (segs[k].b - segs[k].a) <= A + 1e-4) { t += segs[k].b - segs[k].a; k++; } segs.splice(k, 0, { ...segs[Math.max(0, k - 1)], a: SA, b: SB }); }
map.segments = segs; fs.writeFileSync(mapF, JSON.stringify(map));
// the chosen writing list (search starts) moves too
{ const wf = path.join(T, "writing.json"); if (fs.existsSync(wf)) { const Wj = JSON.parse(fs.readFileSync(wf, "utf8")); for (const it of Wj.items ?? []) if (typeof it.from === "number") it.from = mv(it.from); fs.writeFileSync(wf, JSON.stringify(Wj, null, 1)); } }
// the order plans («مونتاج» notes) point at cut seconds too
{ const nf = path.join(T, "montage_notes.json"); if (fs.existsSync(nf)) { const N = JSON.parse(fs.readFileSync(nf, "utf8")); for (const n of N) if (n.plan) n.plan = n.plan.map((x) => (x.at != null ? { ...x, at: mv(x.at) } : x)); fs.writeFileSync(nf, JSON.stringify(N, null, 1)); } }
// the verse list (verse_scan): a recitation inside the block goes, the ones after move
{ const vf = path.join(T, "verses.json"); if (fs.existsSync(vf)) { const V = JSON.parse(fs.readFileSync(vf, "utf8")).filter((x) => !(x.cut?.length && x.cut[0] >= A - 0.01 && x.cut[x.cut.length - 1] <= B + 0.01)).map((x) => ({ ...x, cut: x.cut?.map(mv) })); fs.writeFileSync(vf, JSON.stringify(V, null, 1)); } }
// word files: drop inside, shift after
for (const f of ["cut_words.json", "drift_fresh.json"]) {
  const wf = path.join(T, f); if (!fs.existsSync(wf)) continue;
  const W = JSON.parse(fs.readFileSync(wf, "utf8")).filter((w) => w.s < A || w.s >= B).map((w) => ({ ...w, s: mv(w.s), ...(w.e != null ? { e: mv(w.e) } : {}) }));
  fs.writeFileSync(wf, JSON.stringify(W));
}
console.log(`cut_block: حُذف ${gone.length} عنصراً داخل النطاق (${gone.join("، ") || "—"})، وأُزيح ما بعده ${D.toFixed(3)}ث؛ المدة الآن ${(spec.frames / 30).toFixed(2)}ث`);
