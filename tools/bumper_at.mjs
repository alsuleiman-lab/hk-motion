/* Where the opening bumper goes (user 2026-11-11, repeated 2026-11-12: «ليش ما حطيت فاصل قبل قولي السلام عليكم أو قبل قولي طيب السلام عليكم؟»):
   right BEFORE his first «بسم الله» / «السلام عليكم» (with a «طيب» said just before it), not at second 0 when the video opens with a clip or a hook.
     node tools/bumper_at.mjs <p> [--write | --id]   → prints the cut-time second (--write stores spec.bumper {id,at}; --id prints the chosen bumper) (the middle of the pause before the greeting); 0 when the greeting opens the video
   Words: .tmp/<p>/cut_words.json; the opponent's clip windows (spec.splits) are skipped. render_job.sh passes it to hybrid_any (env BUMPER_AT → prepend_bumper --at). */
import fs from "node:fs";
import path from "node:path";

const p = process.argv[2];
process.chdir(path.resolve(import.meta.dirname, ".."));
const raw = JSON.parse(fs.readFileSync(`.tmp/${p}/cut_words.json`, "utf8")), W = (raw.words ?? raw).map((w) => ({ s: +(w.s ?? w.start), e: +(w.e ?? w.end ?? (w.s ?? w.start)), w: String(w.w ?? w.word) }));
const spec = JSON.parse(fs.readFileSync(`data/specs/${p}.json`, "utf8")), inClip = (t) => (spec.splits ?? []).some((x) => t >= x.from && t < x.to - 0.3);
const n = (s) => s.replace(/[ً-ْٰـ]/g, "").replace(/[إأآ]/g, "ا").replace(/[^\p{L}]/gu, "");
let hit = -1;
const LIMIT = Math.min(180, (spec.frames / 30) * 0.4);
for (let i = 0; i < W.length - 1; i++) {
  const a = n(W[i].w), b = n(W[i + 1].w);
  if (W[i].s > LIMIT) break;   /* an OPENING greeting: within the first 40 % of the video (≤ 180 s); «والسلام عليكم ورحمة الله» at the end is the farewell */
  if ((a === "السلام" && b.startsWith("عليكم")) || (a === "بسم" && b === "الله")) { if (!inClip(W[i].s)) { hit = i; break; } }
}
if (hit > 0 && n(W[hit - 1].w) === "طيب" && W[hit].s - W[hit - 1].e < 0.8) hit--;
const prevEnd = hit > 0 ? W[hit - 1].e : 0, at = hit > 0 ? (prevEnd + W[hit].s) / 2 : 0;   /* no opening greeting → the bumper opens the video (0) */
/* (user 2026-11-12: «لازم يكون قبل كلمة طيب وليس بعدها») word times drift: the cut goes in the middle of the REAL silence measured in the audio,
   the last quiet stretch (≥ 0.08 s under −38 dB) that ends before the voice of «طيب»/the greeting starts — never inside a word */
let at2 = at;
if (hit > 0) {
  const src = path.join("public", spec.cut ?? spec.src ?? spec.video ?? ""), a0 = Math.max(0, prevEnd - 0.6), len = W[hit].s + 0.5 - a0;
  try {
    const { execFileSync } = await import("node:child_process");
    const buf = execFileSync("ffmpeg", ["-v", "error", "-ss", String(a0), "-t", String(len), "-i", src, "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], { maxBuffer: 1 << 26 });
    const db = []; for (let i = 0; i + 640 <= buf.length; i += 640) { let q = 0; for (let j = 0; j < 640; j += 2) { const x = buf.readInt16LE(i + j); q += x * x; } db.push(10 * Math.log10(q / 320 / 32768 ** 2 + 1e-12)); }
    const runs = []; let st = -1; db.forEach((d, k) => { if (d < -38) { if (st < 0) st = k; } else if (st >= 0) { runs.push([st, k]); st = -1; } });
    const target = W[hit].s - a0, ok = runs.filter(([x, y]) => y - x >= 4 && x * 0.02 < target + 0.25);   /* quiet runs that start before the greeting word's transcript time (+0.25 drift) */
    const r = ok[ok.length - 1];
    if (r) at2 = a0 + ((r[0] + r[1]) / 2) * 0.02;
    else console.error(`bumper_at: لا سكتة حقيقية قبل «${W[hit].w}» — الموضع من التفريغ ${at.toFixed(2)}ث`);
  } catch (e) { console.error("bumper_at: تعذّر قياس الصوت", e.message); }
}
/* (user 2026-11-16, «يممممنع وضع الفاصل في أول الفيديو يا غبي») NEVER at second 0: with no opening greeting after the video's start the bumper goes at the END (end:true → BUMPER_POSITION=end) */
/* (user 2026-11-17) a reel: the bumper is ALWAYS at the end */
const END_AT = at2 < 1 || spec.kind === "reel", AT = END_AT ? +(spec.frames / 30).toFixed(2) : +at2.toFixed(2);
/* --write: spec.bumper = { id (random among public/fawasel, kept once chosen), at } — Studio shows it there and the render inserts the SAME one (2026-11-12) */
if (process.argv.includes("--write") || process.argv.includes("--id")) {
  const f = `data/specs/${p}.json`, sp2 = JSON.parse(fs.readFileSync(f, "utf8")), ids = Object.keys(JSON.parse(fs.readFileSync("public/fawasel/manifest.json", "utf8")).items ?? {}).length ? Object.keys(JSON.parse(fs.readFileSync("public/fawasel/manifest.json", "utf8")).items) : ["press", "shelf", "wall", "notebook", "tear"];
  /* the choice is kept in .tmp/<p>/bumper.json too: a rebuild of the spec (build_spec) must not draw another bumper (2026-11-12) */
  const keep = `.tmp/${p}/bumper.json`, kept = fs.existsSync(keep) ? JSON.parse(fs.readFileSync(keep, "utf8")).id : null;
  const id = sp2.bumper?.id && ids.includes(sp2.bumper.id) ? sp2.bumper.id : kept && ids.includes(kept) ? kept : ids[Math.floor(Math.random() * ids.length)];
  fs.writeFileSync(keep, JSON.stringify({ id }));
  if (process.argv.includes("--write")) { sp2.bumper = { id, at: AT, ...(END_AT ? { end: true } : {}) }; fs.writeFileSync(f, JSON.stringify(sp2, null, 1)); console.log(`bumper: «${id}» عند ${AT}ث${END_AT ? " (في الآخر: لا فاصل في أول الفيديو)" : ""}`); process.exit(0); }
  console.log(id); process.exit(0);
}
console.log(String(AT));
