// The YouTube package of a landscape video, in FINAL-FILE times (publishing + video-sections skills, 2026-11-17):
//   node tools/yt_package.mjs <p> [--title "…"] [--channel main|replies]
// Reads: data/specs/<p>.json (bumper {at,end}: the 5 s bumper inserted before cut time `at` shifts everything after it),
//        .tmp/<p>/sections.json  [{title, at}] (cut seconds; video-sections), data/episode_refs/<p>.json (slots with `at`), data/playlists.json.
// Writes data/youtube/<p>_package.md: chapters (0:00 first, ≥ 3, each ≥ 10 s — refused otherwise), cards (episode + moment), end-screen video, playlist.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const p = process.argv[2];
if (!p) { console.error("usage: node tools/yt_package.mjs <p> [--title …] [--channel main|replies]"); process.exit(2); }
process.chdir(path.resolve(import.meta.dirname, ".."));
const opt = (n) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : null; };
const rd = (f, d) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return d; } };
const spec = rd(`data/specs/${p}.json`, {}), BUMP = 5;
const fin = (t) => (spec.bumper && !spec.bumper.end && t >= spec.bumper.at ? t + BUMP : t);   /* cut seconds → final-file seconds */
const total = fin((spec.frames ?? 0) / 30) + (spec.bumper?.end ? BUMP : 0);
const mm = (s) => { s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = String(s % 60).padStart(2, "0"); return h ? `${h}:${String(m).padStart(2, "0")}:${x}` : `${m}:${x}`; };
const errs = [], L = [`# حزمة يوتيوب — ${opt("--title") ?? p}`, ""];

// chapters
const S = rd(`.tmp/${p}/sections.json`, []).map((x) => ({ title: x.title, t: fin(x.at) })).sort((a, b) => a.t - b.t);
if (S.length) {
  S[0].t = 0;
  if (S.length < 3) errs.push("الفصول أقل من ثلاثة (يوتيوب لا يعرضها)");
  S.forEach((x, i) => { const end = i + 1 < S.length ? S[i + 1].t : total; if (end - x.t < 10) errs.push(`الفصل «${x.title}» أقصر من 10 ثوانٍ`); });
  L.push("## الفصول (تُلصق في الوصف)", ...S.map((x) => `${mm(x.t)} ${x.title}`), "");
} else L.push("## الفصول", "(لا أقسام بعد: مهارة video-sections)", "");

// cards
const slots = Object.values(rd(`data/episode_refs/${p}.json`, { slots: {} }).slots ?? {});
const cards = slots.filter((s) => Number.isFinite(s.at)).map((s) => ({ ...s, t: fin(s.at) })).sort((a, b) => a.t - b.t);
for (const s of slots.filter((s) => !Number.isFinite(s.at))) errs.push(`الحلقة «${s.title}» بلا وقت ذكرها (episode_ref … --at)`);
L.push("## البطاقات (عند ذكر كل حلقة)", ...(cards.length ? cards.map((c) => `- ${mm(c.t)} — ${c.title} — ${c.url}`) : ["(لا حلقات مذكورة)"]), "");
if (cards.length) L.push("## مقاطع ذُكرت في الفيديو (للوصف)", ...cards.map((c) => `${c.title}\n${c.url}`), "");

// end screen + playlist
L.push("## شاشة النهاية", `قالب «فيديو واحد، اشتراك واحد»؛ الفيديو: ${cards[0] ? `${cards[0].title} — ${cards[0].url}` : "«الأحدث رفعاً»"}`, "");
const ch = opt("--channel") ?? "main", q = opt("--title") ?? "";
const pl = q ? spawnSync("node", ["tools/playlists_fetch.mjs", "match", q, "--channel", ch], { encoding: "utf8" }) : null;
L.push("## قائمة التشغيل", pl?.status === 0 ? pl.stdout.trim().split(/\r?\n/)[0].replace(/^\d+\s+/, "") : "(لا قائمة مطابقة: تُذكر للمستخدم)", "");

fs.mkdirSync("data/youtube", { recursive: true });
fs.writeFileSync(`data/youtube/${p}_package.md`, L.join("\n"));
console.log(L.join("\n"));
if (errs.length) { console.log("\n✘ " + errs.join("\n✘ ")); process.exit(1); }
console.log(`\n✔ data/youtube/${p}_package.md`);
