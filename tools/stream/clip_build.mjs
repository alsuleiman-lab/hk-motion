// build one lesson/stream clip (portrait) from a plan file (tools/stream/clip_build.mjs <id> <plan.json>): cover = the user's pose PNG + title words over a real
// topic picture; writing chosen by reading (writing.json → writing_place); scholars' calligraphic emblems at first mention; hadith note cards with
// verified book + number; then the stream/lesson finishing chain and the spec normaliser. usage: node tools/stream/clip_build.mjs <id>
import fs from "node:fs"; import { spawnSync } from "node:child_process";
const id = process.argv[2], planF = process.argv[3];
if (!id || !planF) { console.error("usage: node tools/stream/clip_build.mjs <id> <plan.json>"); process.exit(2); }
const P = JSON.parse(fs.readFileSync(planF, "utf8"))[id];
const POSES = {
  "03": { src: "cov/sheikh_poses/03_sheikh_brown_gesture_point.png", headX: 703, headTop: 14, headW: 240, srcW: 1448 },
  "06": { src: "cov/sheikh_poses/06_sheikh_brown_hands_open_explain.png", headX: 714, headTop: 14, headW: 248, srcW: 1448 },
  "07": { src: "cov/sheikh_poses/07_sheikh_brown_hands_clasped.png", headX: 699, headTop: 17, headW: 255, srcW: 1448 },
  "10": { src: "cov/sheikh_poses/10_sheikh_brown_hands_raised_exclaim.png", headX: 704, headTop: 13, headW: 249, srcW: 1448 },
};
const sh = (c) => { const r = spawnSync("bash", ["-c", `cd /s/AI_Tools/Remotion_Workspace; source tools/env.sh >/dev/null 2>&1; unset LESSON; ${c}`], { encoding: "utf8", maxBuffer: 1 << 26 }); return (r.stdout || "") + (r.stderr || ""); };
const t = (s) => s.trim().split("\n").slice(-2).join(" | ").slice(0, 260);
const f = `data/specs/${id}.json`, rd = () => JSON.parse(fs.readFileSync(f, "utf8")), wr = (s) => fs.writeFileSync(f, JSON.stringify(s, null, 1));
const O = P.orient === "land" ? "land" : "port";   // الاتجاه: طولي افتراضياً، عرضي للمقطع الذي يزيد على دقيقتين
const d = JSON.parse(fs.readFileSync(`public/${id}_map.json`, "utf8")).duration;
console.log(id, "dur", d.toFixed(1));
if (fs.existsSync(f)) fs.rmSync(f);
console.log(t(sh(`node tools/spec_draft.mjs ${id} --title "${P.title}" --folder "البثوث" --kind ${P.orient === "land" ? "full" : "reel"}`)));
{ const s = rd();
  s.title = P.title; s.showTitleBar = false; s.brand = P.brand ?? "steel";
  s.items = s.items.filter((i) => !["pic", "credit", "torn", "scraps", "cover", "nameTag", "subscribe"].includes(i.t));   // only what I chose below
  s.items.unshift({ t: "cover", style: "pro", pro: { layout: "word", bg: P.bg, bgPos: P.bgPos ?? "50% 50%", words: P.words, sheikh: POSES[P.pose] ?? POSES["06"] } });
  for (const it of P.items ?? []) s.items.push(it);
  s.items.sort((a, b) => (a.at ?? a.from ?? 0) - (b.at ?? b.from ?? 0));
  if (P.skipMentions) s.skipMentions = P.skipMentions;
  if (P.skipRequired) s.skipRequired = P.skipRequired;
  if (P.skipMetaphors) s.skipMetaphors = P.skipMetaphors;   // ما لا يُرسم له استعارة بقرار مكتوب (قالب البث السريع)
  if (P.zooms) s.zooms = P.zooms;   // zoom only at the key words I chose (lesson correction 2026-11-12), not the draft's
  if (P.shake) s.shake = P.shake;
  wr(s); }
fs.writeFileSync(`.tmp/${id}/writing.json`, JSON.stringify({ fix: P.fix ?? {}, items: P.writing ?? [] }, null, 1));
{ const wo = sh(`node tools/writing_place.mjs ${id} --write`); console.log(t(wo)); if (/✘ writing_place/.test(wo)) { console.error("✘ البناء توقف: عبارة مرفوضة — صحّحها في الخطة (أو fix) ثم أعد"); process.exit(1); } }
sh(`bash tools/stream/b2_fix.sh ${id} ${O}`);
sh(`node tools/stream/b2_land_extra.mjs ${id} '${JSON.stringify(P.extra ?? { name: [Math.min(12, d / 4)], sub: [Math.max(5, Math.min(40, d - 6))] })}'`);
console.log(t(sh(`node tools/scraps_times.mjs ${f}; node tools/writing_sync.mjs ${f} --fix; node tools/writing_place.mjs ${id} --hold; node tools/sfx_bind.mjs ${f}`)));
console.log(t(sh(`node tools/gallery_geometry.mjs ${f} --write`)));
fs.copyFileSync(f, `.tmp/${id}/pre_norm.json`);
console.log(t(sh(`node tools/spec_normalize.mjs ${f} --o ${O}`)));
const s = rd();
console.log(id, "items", s.items.length, "types", [...new Set(s.items.map((i) => i.t))].join(","), "frames", s.frames);
