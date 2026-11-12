/* Where the opening bumper goes (user 2026-11-11, repeated 2026-11-12: «ليش ما حطيت فاصل قبل قولي السلام عليكم أو قبل قولي طيب السلام عليكم؟»):
   right BEFORE his first «بسم الله» / «السلام عليكم» (with a «طيب» said just before it), not at second 0 when the video opens with a clip or a hook.
     node tools/bumper_at.mjs <p>      → prints the cut-time second (the middle of the pause before the greeting); 0 when the greeting opens the video
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
if (hit < 0) { console.log("0"); process.exit(0); }
if (hit > 0 && n(W[hit - 1].w) === "طيب" && W[hit].s - W[hit - 1].e < 0.8) hit--;
const prevEnd = hit > 0 ? W[hit - 1].e : 0, at = hit > 0 ? (prevEnd + W[hit].s) / 2 : 0;
console.log(at < 1 ? "0" : at.toFixed(2));
