// The YouTube package of a landscape video, in FINAL-FILE times (publishing + video-sections skills, 2026-11-17):
//   node tools/yt_package.mjs <p> [--title "…"] [--channel main|replies] [--event] [--desc "…"|--desc-file f] [--tags "وسم، وسم، …"]
//   node tools/yt_package.mjs <p> --count     → how many sections the duration asks for
//   node tools/yt_package.mjs <p> --check     → validates the written package without rewriting it (tools/prepublish_gates.mjs, final_review.mjs)
// Reads: data/specs/<p>.json (bumper {at,end}: the 5 s bumper inserted before cut time `at` shifts everything after it),
//        .tmp/<p>/sections.json  [{title, at}] (cut seconds; video-sections), data/episode_refs/<p>.json (slots with `at`), data/playlists.json,
//        .tmp/<p>/first_answers.json (title, event), data/channel_tags.json (the channel's default tags).
// Writes data/youtube/<p>_package.md: description, chapters (0:00 first, ≥ 3, each ≥ 10 s — refused otherwise), cards (episode + moment), end-screen video,
// playlist, tags.
// (user 2026-11-21, GTA 6: the package had NO description and NO tags, and the playlist match picked an Ibn Taymiyyah list for an event commentary)
//   «## الوصف»: the paragraph is written by me (the model) from the cut transcript — --desc / --desc-file, or kept from the previous package; until then a
//               marked placeholder stays and the tool FAILS. «## الوسوم»: topic tags (--tags, or kept) first, then the channel's default tags, ≤ 470 chars; none = FAIL.
//   Event commentary (--event, or "event": true in first_answers.json) → «التعليق على الأحداث» (publishing references/detail.md); a weak word match is a warning.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { finalSeconds, sectionsWant, BUMP } from "./prepublish_gates.mjs";

const p = process.argv[2];
if (!p) { console.error("usage: node tools/yt_package.mjs <p> [--title …] [--channel main|replies] [--event] [--desc …] [--tags …] | --count | --check"); process.exit(2); }
const WS = path.resolve(import.meta.dirname, "..");
const opt = (n) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : null; };
process.chdir(opt("--root") ? path.resolve(opt("--root")) : WS);   // --root: a scratch copy of the workspace files (tests)
const rd = (f, d) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return d; } };
const PKG = `data/youtube/${p}_package.md`;
const DESC_TODO = "✍ (اكتب هنا فقرة الوصف من تفريغ القص: --desc أو --desc-file، ثم أعد الأداة)";
const TAGS_MAX = 470, EVENTS_PL = "PL1GJ09M00J5ZNYpavbJKbKva0uthONclp";
const spec = rd(`data/specs/${p}.json`, {});
const fin = (t) => (spec.bumper && !spec.bumper.end && t >= spec.bumper.at ? t + BUMP : t);   /* cut seconds → final-file seconds */
const total = finalSeconds(spec);
const mm = (s) => { s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = String(s % 60).padStart(2, "0"); return h ? `${h}:${String(m).padStart(2, "0")}:${x}` : `${m}:${x}`; };
const { mins, want } = sectionsWant(spec, process.cwd());
if (process.argv.includes("--count")) { console.log(`${mins.toFixed(1)} دقيقة ← ${want} قسماً`); process.exit(0); }

/** the sections of a written package (the heading's text after «## ») */
const sectionsOf = (md) => { const o = {}; let k = null; for (const l of md.split(/\r?\n/)) { const h = l.match(/^## (.+)$/); if (h) { k = h[1].trim(); o[k] = []; } else if (k) o[k].push(l); } for (const x of Object.keys(o)) o[x] = o[x].join("\n").trim(); return o; };
const key = (o, re) => Object.keys(o).find((k) => re.test(k));
const old = fs.existsSync(PKG) ? fs.readFileSync(PKG, "utf8") : "";
const oldS = sectionsOf(old);
const errs = [], warns = [];

// chapters (from sections.json, final-file times)
const S = rd(`.tmp/${p}/sections.json`, []).map((x) => ({ title: x.title, t: fin(x.at) })).sort((a, b) => a.t - b.t);
const chapterLines = () => {
  if (!S.length) { errs.push(`لا أقسام: .tmp/${p}/sections.json غير موجود (مهارة video-sections)`); return []; }
  S[0].t = 0;
  if (S.length < 3) errs.push("الفصول أقل من ثلاثة (يوتيوب لا يعرضها)");
  if (S.length !== want) errs.push(`الأقسام ${S.length} والجدول يطلب ${want} لمدة ${mins.toFixed(1)} دقيقة`);
  S.forEach((x, i) => { const end = i + 1 < S.length ? S[i + 1].t : total; if (end - x.t < 10) errs.push(`الفصل «${x.title}» أقصر من 10 ثوانٍ`); });
  return S.map((x) => `${mm(x.t)} ${x.title}`);
};
const tagsCheck = (line) => {
  const tags = String(line ?? "").split(/[,،]/).map((t) => t.trim()).filter(Boolean);
  if (!tags.length) errs.push("الوسوم فارغة: --tags \"وسوم الموضوع\" (وسوم القناة الافتراضية تُضاف بعدها)");
  else if (line.length > TAGS_MAX) errs.push(`الوسوم ${line.length} حرفاً والحد ${TAGS_MAX}`);
  return tags;
};
const descCheck = (d) => { if (!d || d.includes("✍") || d.length < 40) errs.push("الوصف فارغ أو مسودة: اكتب فقرة الوصف من تفريغ القص (--desc / --desc-file)"); };

if (process.argv.includes("--check")) {   /* validate what is written; never rewrite it */
  if (!old) { console.log(`✘ لا حزمة يوتيوب: ${PKG} — node tools/yt_package.mjs ${p} --title "<العنوان>" --desc "…" --tags "…"`); process.exit(1); }
  descCheck(oldS[key(oldS, /^الوصف/)]);
  const tk = key(oldS, /^الوسوم/); tagsCheck(tk ? oldS[tk].split(/\r?\n/)[0] : "");
  const want0 = chapterLines(), ck = key(oldS, /^الفصول/), got = ck ? oldS[ck].split(/\r?\n/).filter((l) => /^\d+:\d\d/.test(l.trim())).map((l) => l.trim()) : [];
  if (want0.length && want0.join("\n") !== got.join("\n")) errs.push(`فصول الحزمة لا تطابق sections.json (${got.length} في الحزمة، ${want0.length} في الأقسام): أعد node tools/yt_package.mjs ${p}`);
  const pk = key(oldS, /^قائمة التشغيل/); if (!pk || !/list=/.test(oldS[pk])) errs.push("لا قائمة تشغيل في الحزمة (أو «لم أجد قائمة»: قلها للمستخدم وأعفِ بنصه)");
  if (errs.length) { console.log("✘ " + [...new Set(errs)].join("\n✘ ")); process.exit(1); }
  console.log(`✔ حزمة يوتيوب ${PKG}: الوصف، والوسوم، و${got.length} فصول = الأقسام، وقائمة التشغيل`); process.exit(0);
}

const fa = rd(`.tmp/${p}/first_answers.json`, {});
const title = opt("--title") ?? old.match(/^# حزمة يوتيوب — (.+)$/m)?.[1]?.trim() ?? fa.title ?? p;
const L = [`# حزمة يوتيوب — ${title}`, ""];

// description: written by the model (from .tmp/<p>/cut_transcript.txt); kept from the previous package when not given now
const descIn = opt("--desc-file") ? fs.readFileSync(opt("--desc-file"), "utf8").trim() : opt("--desc");
const desc = (descIn ?? oldS[key(oldS, /^الوصف/)] ?? "").trim() || DESC_TODO;
descCheck(desc);
L.push("## الوصف", desc, "");
const ch0 = chapterLines();
L.push("## الفصول (تُلصق في الوصف)", ...(ch0.length ? ch0 : ["(لا أقسام بعد: مهارة video-sections)"]), "");

// cards
const slots = Object.values(rd(`data/episode_refs/${p}.json`, { slots: {} }).slots ?? {});
const cards = slots.filter((s) => Number.isFinite(s.at)).map((s) => ({ ...s, t: fin(s.at) })).sort((a, b) => a.t - b.t);
for (const s of slots.filter((s) => !Number.isFinite(s.at))) errs.push(`الحلقة «${s.title}» بلا وقت ذكرها (episode_ref … --at)`);
L.push("## البطاقات (عند ذكر كل حلقة)", ...(cards.length ? cards.map((c) => `- ${mm(c.t)} — ${c.title} — ${c.url}`) : ["(لا حلقات مذكورة)"]), "");
if (cards.length) L.push("## مقاطع ذُكرت في الفيديو (للوصف)", ...cards.map((c) => `${c.title}\n${c.url}`), "");

// end screen + playlist
L.push("## شاشة النهاية", `قالب «فيديو واحد، اشتراك واحد»؛ الفيديو: ${cards[0] ? `${cards[0].title} — ${cards[0].url}` : "«الأحدث رفعاً»"}`, "");
const ch = opt("--channel") ?? "main";
const event = process.argv.includes("--event") || fa.event === true || /^(نعم|true|حدث)$/.test(String(fa.event ?? ""));
let plLine;
if (event) {
  const ev = (rd("data/playlists.json", {}).main ?? []).find((x) => x.id === EVENTS_PL);
  plLine = `${ev?.title ?? "التعليق على الأحداث"}  https://www.youtube.com/playlist?list=${EVENTS_PL}`;
  if (ch !== "main") warns.push("تعليق على حدث في قناة «الردود العلمية»: قائمة «التعليق على الأحداث» في القناة الأساسية");
} else {
  const pl = spawnSync(process.execPath, [path.join(WS, "tools", "playlists_fetch.mjs"), "match", title.replace(/#\S+|\(https?:[^)]*\)|https?:\S+/g, " "), "--channel", ch], { encoding: "utf8" });
  const best = pl.status === 0 ? pl.stdout.trim().split(/\r?\n/)[0] : "";
  const score = Number(best.match(/^(\d+)\s/)?.[1] ?? 0);
  plLine = best ? best.replace(/^\d+\s+/, "") : "لم أجد قائمة";
  if (best && score <= 1) warns.push(`مطابقة قائمة التشغيل ضعيفة (كلمة واحدة مشتركة): «${plLine.split("  ")[0]}» — تحقق أن الموضوع يطابقها؛ وإن كانت الحلقة تعليقاً على حدث فـ --event (قائمة «التعليق على الأحداث»)`);
}
L.push("## قائمة التشغيل", plLine, "");

// tags: topic first (--tags, or the topic part kept from the previous package), then the channel's default tags; ≤ 470 chars, the defaults never cut
const defaults = rd("data/channel_tags.json", {})[ch] ?? [];
const splitT = (s) => String(s ?? "").split(/[,،]/).map((t) => t.trim()).filter(Boolean);
const oldTk = key(oldS, /^الوسوم/);
const topic = (opt("--tags") != null ? splitT(opt("--tags")) : splitT(oldTk ? oldS[oldTk].split(/\r?\n/)[0] : "")).filter((t) => !defaults.includes(t));
if (!topic.length) errs.push("لا وسوم موضوع: --tags \"وسم الموضوع، البلد أو الحدث، أصحاب الحلقة…\" (من كلام الحلقة؛ وسوم القناة تُضاف بعدها وحدها)");
const tags = [...new Set(topic)];
const join = () => [...tags, ...defaults.filter((d) => !tags.includes(d))].join(", ");
let line = join();
while (line.length > TAGS_MAX && tags.length) { tags.pop(); line = join(); warns.push("قُصّت وسوم من آخر وسوم الموضوع ليبقى المجموع ≤ 470 حرفاً"); }
L.push(`## الوسوم (${topic.length ? line.length : 0} حرفاً)`, topic.length ? line : "", "");
if (topic.length) tagsCheck(line);

fs.mkdirSync("data/youtube", { recursive: true });
fs.writeFileSync(PKG, L.join("\n"));
console.log(L.join("\n"));
for (const w of [...new Set(warns)]) console.log(`⚠ ${w}`);
if (errs.length) { console.log("\n✘ " + [...new Set(errs)].join("\n✘ ")); process.exit(1); }
console.log(`\n✔ ${PKG}`);
