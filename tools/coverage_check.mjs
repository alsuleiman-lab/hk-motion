// Is the montage COMPLETE, not just valid? (user 2026-10-28, after the Jordan video: Torah/Gospel named with no picture, 3½ min with nothing on screen, no push-in)
//   node tools/coverage_check.mjs data/specs/<p>.json [--words .tmp/<p>/cut_words.json] [--gap 15]
// 1) every thing in data/mention_lexicon.json (+ every fetched picture in .tmp/<p>/images.json) has a picture item on screen within −3…+4 s of its first mention
// 0) only approved item types (the renderer's APPROVED_TYPES = the gallery) and no retired spec field
// 2) no stretch longer than --gap (15) seconds without any item, baked split, push-in or shake
// 3) the moves were planned: no more than 2 min from the start / between push-ins (`zooms`) / to the end, and a `shake` list (tools/moves_plan.mjs → .tmp/<p>/moves.md)
// Exit 1 on any miss; a miss that is right on purpose is written in the spec as  "skipMentions": ["الإنجيل"]  (the reason goes in the plan).
import fs from "node:fs";
import path from "node:path";

const argv = process.argv.slice(2);
const specF = argv.find((a) => a.endsWith(".json"));
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : argv[i + 1]; };
if (!specF) { console.error("usage: node tools/coverage_check.mjs data/specs/<p>.json [--words file] [--gap 40]"); process.exit(2); }
const spec = JSON.parse(fs.readFileSync(specF, "utf8"));
const p = spec.id, T = path.join(".tmp", p);
const read = (f, d) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return d; } };
const words = read(opt("words", path.join(T, "cut_words.json")), []);
const GAP = Number(opt("gap", 15)), ZOOM_GAP = 120, dur = spec.frames / (spec.fps ?? 30);
const mm = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const norm = (s) => String(s).replace(/[ً-ْـ]/g, "").replace(/[إأآا]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/[^\p{L}\p{N} ]/gu, " ").replace(/\s+/g, " ").trim();
const bare = (w) => w.replace(/^(و|ف)?(ب|ل|ك)?(ال)?/, "");
let fails = 0;

// 0) approved types only
{
  const ms = fs.readFileSync(path.join("src", "MontageSpec.tsx"), "utf8"), a = ms.indexOf("APPROVED_TYPES = new Set([");
  const ok = new Set(ms.slice(a + 26, ms.indexOf("])", a)).split(",").map((s) => s.trim().split(String.fromCharCode(34)).join("")).filter(Boolean));
  const ret = JSON.parse(fs.readFileSync(path.join("data", "retired_elements.json"), "utf8"));
  const badTypes = [...new Set((spec.items ?? []).map((i) => i.t).filter((x) => !ok.has(x)))], badFields = ret.specFields.filter((k) => k in spec);
  console.log(badTypes.length || badFields.length ? `✘ عناصر غير معتمدة في المعرض: ${[...badTypes.map((x) => "نوع «" + x + "»"), ...badFields.map((x) => "حقل «" + x + "»")].join("، ")} — استعمل العنصر المعتمد (neon ← word، person ← scholar)` : `✔ كل الأنواع معتمدة (${ok.size} نوعاً)`);
  if (badTypes.length || badFields.length) fails++;
}

// 0b) format and quick isolation (user 2026-10-29): a reel is a chosen excerpt ≤ 3 min; `behind` windows need the saved `matte`; `brand` must be one of the 5 palettes
{
  const dur = (spec.frames ?? 0) / (spec.fps ?? 30), errs = [];
  if (spec.kind === "reel" && dur > 180) errs.push(`ريلز طوله ${mm(dur)} (الحد 3:00)`);
  if ((spec.behind ?? []).length && !spec.matte) errs.push("نوافذ behind بلا matte (node tools/matte_cache.mjs get …)");
  const pal = fs.readFileSync(path.join("src", "brand.ts"), "utf8").match(/BrandName = ([^;]+);/)?.[1] ?? "";
  if (spec.brand && !pal.includes(String.fromCharCode(34) + spec.brand + String.fromCharCode(34))) errs.push(`نمط لوني غير معروف «${spec.brand}» (${pal})`);
  console.log(errs.length ? "✘ الصيغة والعزل: " + errs.join("، ") : `✔ الصيغة: ${spec.kind === "reel" ? "ريلز" : "كامل"} · النمط اللوني: ${spec.brand ?? "steel"}${spec.matte ? " · عزل سريع في " + (spec.behind ?? []).length + " نافذة" : ""}`);
  if (errs.length) fails++;
}

const span = (it) => {
  const a = it.at ?? it.from ?? it.oldAt ?? (it.times?.[0]);
  const b = it.until ?? it.to ?? (it.dur != null && a != null ? a + it.dur : null) ?? (a != null ? a + 3 : null);
  return a == null ? null : [a, b];
};
const items = (spec.items ?? []).filter((i) => i.t !== "cover");
const VISUAL = new Set(["pic", "full", "flash", "crop", "scholar", "person", "phone", "scene"]);
const visual = items.filter((i) => VISUAL.has(i.t)).map(span).filter(Boolean);

// 1) mentions
const lex = read(path.join("data", "mention_lexicon.json"), {});
const terms = [];
for (const [cat, group] of Object.entries(lex)) if (cat !== "_") for (const [name, forms] of Object.entries(group)) terms.push({ name, forms });
for (const im of read(path.join(T, "images.json"), [])) terms.push({ name: im.name, forms: [im.name, ...(im.said ?? [])] });
const nw = words.map((w) => norm(w.w)), nb = nw.map(bare);
const firstAt = (forms) => {
  let best = null;
  for (const f of forms) {
    const q = norm(f).split(" ");
    for (let i = 0; i + q.length <= nw.length; i++) if (q.every((x, k) => nw[i + k] === x || nb[i + k] === bare(x))) { if (best == null || words[i].s < best) best = words[i].s; break; }
  }
  return best;
};
const skip = new Set(spec.skipMentions ?? []);
const seen = new Set(), missing = [];
for (const t of terms) {
  if (seen.has(t.name) || skip.has(t.name)) continue;
  seen.add(t.name);
  const at = firstAt(t.forms);
  if (at == null) continue;
  if (!visual.some(([a, b]) => a <= at + 4 && b >= at - 3)) missing.push(`${t.name} (${mm(at)} = ${at.toFixed(1)}s)`);
}
console.log(missing.length ? `✘ مذكور بلا صورة عند ذكره (${missing.length}): ${missing.join("، ")}` : `✔ كل مذكور له صورة عند أول ذكر (${seen.size} مصطلحاً فُحص)`);
if (missing.length) fails++;

// 2) empty stretches (any item or baked split counts as something on screen)
const spans = [...items.map(span).filter(Boolean), ...(spec.splits ?? []).map((s) => [s.from, s.to]), ...(spec.zooms ?? []).map((z) => [z.from, z.to]), ...(spec.shake ?? []).map((z) => [z.from, z.to])].sort((a, b) => a[0] - b[0]);
const gaps = [];
let end = 2;
for (const [a, b] of spans) { if (a - end > GAP) gaps.push([end, a]); end = Math.max(end, b); }
if (dur - 3 - end > GAP) gaps.push([end, dur - 3]);
console.log(gaps.length ? `✘ فراغ أطول من ${GAP} ث بلا عنصر ولا حركة (${gaps.length}): ${gaps.map(([a, b]) => `${mm(a)}–${mm(b)} (${Math.round(b - a)} ث)`).join("، ")}` : `✔ لا فراغ أطول من ${GAP} ث`);
if (gaps.length) fails++;

// 3) moves planned in the spec: push-ins at most ZOOM_GAP s apart (start → first, between, last → end)
const zs = [...(spec.zooms ?? [])].map((z) => z.from).sort((x, y) => x - y), hasShake = Array.isArray(spec.shake);
const zgaps = [];
{ let prev = 0; for (const z of [...zs, dur]) { if (z - prev > ZOOM_GAP) zgaps.push([prev, z]); prev = z; } }
const zok = zs.length > 0 && zgaps.length === 0 && hasShake;
console.log(zok ? `✔ الحركات مخطّطة: ${zs.length} تقريب (لا فراغ تقريب > ${ZOOM_GAP} ث)، ${spec.shake.length} اهتزاز` : `✘ الحركات: ${zs.length} تقريب${zgaps.length ? "، فراغ تقريب أطول من دقيقتين: " + zgaps.map(([x, y]) => mm(x) + "–" + mm(y)).join("، ") : ""}${hasShake ? "" : "، ولا قائمة shake"} — شغّل node tools/moves_plan.mjs ${p} وراجع .tmp/${p}/moves.md ثم اكتبها في zooms/shake`);
if (!zok) fails++;

console.log(fails ? `FAILED (${fails})` : "PASSED");
process.exit(fails ? 1 : 0);
