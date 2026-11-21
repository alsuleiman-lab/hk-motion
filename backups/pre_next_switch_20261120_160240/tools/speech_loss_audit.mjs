// Speech loss audit (user 2026-11-16: «في كلام أنا قلته أنت حذفته… وأبقيت كلمة مونتاج»): two checks on the FINAL cut, by TEXT (not by the cut map's times)
//   node tools/speech_loss_audit.mjs <project>
//  1) any editing-instruction word still audible in the fresh transcript of the final cut audio (.tmp/<p>/drift_fresh.json): مونتاج / منتج / المؤتر / انتهى المونتاج / المترجم للقناة…
//  2) the sheikh's own words in the SOURCE (words.json × speakers.json) that are missing from the cut transcript (cut_words.json): runs of ≥ 2 consecutive source words none of whose
//     neighbouring pairs exist in the cut. Instruction phrases (the sheikh's orders to the editor) are excluded: they SHOULD be gone.
// Exit 1 while anything is found. Run after every cut and before every render.
import fs from "node:fs";
const p = process.argv[2]; if (!p) { console.error("usage: node tools/speech_loss_audit.mjs <project>"); process.exit(2); }
const T = `.tmp/${p}/`, rd = (f) => JSON.parse(fs.readFileSync(T + f, "utf8")), W = (j) => j.words ?? j;
const norm = (s) => String(s).replace(/[ً-ْٰـ]/g, "").replace(/[إأآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/[^\p{L}\p{N}]/gu, "");
const INSTR = /مونتاج|المونتاج|منتج|المنتج|المؤتر|مونتير|المونتير|المترجم|انتهي|انتهى/;
let bad = 0;
if (fs.existsSync(T + "drift_fresh.json")) {
  const fw = W(rd("drift_fresh.json"));
  fw.forEach((x, i) => { if (INSTR.test(norm(x.w ?? x.word))) { bad++; console.log(`✘ كلمة تعليمات مسموعة في الصوت النهائي عند ${(x.s ?? x.start).toFixed(1)}ث: «${fw.slice(Math.max(0, i - 3), i + 4).map((y) => y.w ?? y.word).join(" ")}»`); } });
} else console.log("⚠ لا drift_fresh.json: شغّل words_drift أولاً");
const src = W(rd("words.json")), cut = W(rd("cut_words.json")), sp = rd("speakers.json");
const who = (t) => (sp.turns ?? []).find((u) => t >= u.s && t < u.e)?.name;
const cn = cut.map((x) => norm(x.w ?? x.word)), pairs = new Set(); for (let i = 0; i < cn.length - 1; i++) pairs.add(cn[i] + "|" + cn[i + 1]);
const sw = src.filter((x) => who(x.s ?? x.start) === "sheikh"), sn = sw.map((x) => norm(x.w ?? x.word));
const miss = sw.map((_, i) => { const a = i > 0 ? pairs.has(sn[i - 1] + "|" + sn[i]) : false, b = i < sn.length - 1 ? pairs.has(sn[i] + "|" + sn[i + 1]) : false; return !a && !b && !cn.includes(sn[i]) ? 1 : (!a && !b ? 2 : 0); });
let run = [];
const flush = () => { if (run.length >= 2) { const txt = run.map((x) => x.w ?? x.word).join(" "); if (!INSTR.test(norm(txt))) { bad++; console.log(`✘ كلام للشيخ ضاع من القص عند ${(run[0].s ?? run[0].start).toFixed(0)}–${(run[run.length - 1].e ?? run[run.length - 1].end).toFixed(0)}ث (زمن المصدر): «${txt}»`); } } run = []; };
sw.forEach((x, i) => { if (miss[i] === 1) run.push(x); else flush(); }); flush();
console.log(bad ? `✘ speech_loss_audit: ${bad} موضع` : "✔ speech_loss_audit: لا تعليمات مسموعة ولا كلام ضائع");
process.exit(bad ? 1 : 0);
