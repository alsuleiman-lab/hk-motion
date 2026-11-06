// Is the montage COMPLETE, not just valid? (user 2026-10-28, after the Jordan video: Torah/Gospel named with no picture, 3½ min with nothing on screen, no push-in)
//   node tools/coverage_check.mjs data/specs/<p>.json [--words .tmp/<p>/cut_words.json] [--gap 5]
// 1) every thing in data/mention_lexicon.json (+ every fetched picture in .tmp/<p>/images.json) has a picture item on screen within −3…+4 s of its first mention
// 0) only approved item types (the renderer's APPROVED_TYPES = the gallery) and no retired spec field
// 2) no stretch longer than --gap (5) seconds without any item, baked split, push-in or shake
// 3) the moves were planned: no more than 2 min from the start / between push-ins (`zooms`) / to the end, and a `shake` list (tools/moves_plan.mjs → .tmp/<p>/moves.md)
// Exit 1 on any miss; a miss that is right on purpose is written in the spec as  "skipMentions": ["الإنجيل"]  (the reason goes in the plan).
import { align as alignScraps } from "./lib/scraps_times.mjs";
import fs from "node:fs";
import path from "node:path";

const argv = process.argv.slice(2);
const specF = argv.find((a) => a.endsWith(".json"));
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : argv[i + 1]; };
if (!specF) { console.error("usage: node tools/coverage_check.mjs data/specs/<p>.json [--words file] [--gap 5]"); process.exit(2); }
const spec = JSON.parse(fs.readFileSync(specF, "utf8"));
const p = spec.id, T = path.join(".tmp", p);
const read = (f, d) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return d; } };
const words = read(opt("words", path.join(T, "cut_words.json")), []);
const GAP = Number(opt("gap", 5)), ZOOM_GAP = 120, dur = spec.frames / (spec.fps ?? 30);
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

// 0a) a source window shows the source itself, not the whole browser (user 2026-10-30): every split carries its crop box clip.y/h (tools/source_crop.mjs)
{
  const bare = (spec.splits ?? []).filter((s) => s.clip?.y === undefined || s.clip?.h === undefined);
  console.log(bare.length ? `✘ نوافذ مصدر تعرض لقطة المتصفح كاملة (${bare.length}): ${bare.map((s) => mm(s.from)).join("، ")} — node tools/source_crop.mjs ${specF} --write ثم انظر .tmp/${spec.id}/source_crops.jpg` : `✔ كل نافذة مصدر مقصوصة على المصدر نفسه (${(spec.splits ?? []).length})`);
  if (bare.length) fails++;
}

// 0b) format and quick isolation (user 2026-10-29): a reel is a chosen excerpt ≤ 3 min; `behind` windows need the saved `matte`; `brand` must be one of the 5 palettes
{
  const dur = (spec.frames ?? 0) / (spec.fps ?? 30), errs = [];
  for (const it of spec.items ?? []) if (it.t === "scraps") {   // every scrap is written when its word is spoken (user 2026-11-06)
    const n = it.text.split(" ").length;
    if (!it.times || it.times.length !== n) { errs.push(`قصاصات «${it.text.slice(0, 24)}…» بلا times (node tools/scraps_times.mjs data/specs/${spec.id}.json)`); continue; }
    const al = alignScraps(it.text, it.at, it.until, words);
    al.forEach((x, i) => { if (x != null && Math.abs(it.times[i] - x) > 0.25) errs.push(`قصاصة «${it.text.split(" ")[i]}» عند ${it.times[i]}ث وتُنطق عند ${x}ث`); });
  }
  if (spec.kind === "reel" && dur > 180) errs.push(`ريلز طوله ${mm(dur)} (الحد 3:00)`);
  if ((spec.behind ?? []).some((w) => !(w.matte ?? spec.matte))) errs.push("نوافذ behind بلا matte (node tools/matte_cache.mjs get …)");
  const pal = fs.readFileSync(path.join("src", "brand.ts"), "utf8").match(/BrandName = ([^;]+);/)?.[1] ?? "";
  if (spec.brand && !pal.includes(String.fromCharCode(34) + spec.brand + String.fromCharCode(34))) errs.push(`نمط لوني غير معروف «${spec.brand}» (${pal})`);
  for (const s of spec.splits ?? []) if (s.layout && !["dossier", "blocks"].includes(s.layout)) errs.push(`نموذج رد غير معروف «${s.layout}» (dossier | blocks)`);
  console.log(errs.length ? "✘ الصيغة والعزل: " + errs.join("، ") : `✔ الصيغة: ${spec.kind === "reel" ? "ريلز" : "كامل"} · النمط اللوني: ${spec.brand ?? "steel"}${spec.matte ? " · عزل سريع في " + (spec.behind ?? []).length + " نافذة" : ""}`);
  if (errs.length) fails++;
}

const span = (it) => {
  const a = it.at ?? it.from ?? it.oldAt ?? (it.times?.[0]);
  const b = it.until ?? it.to ?? (it.dur != null && a != null ? a + it.dur : null) ?? (a != null ? a + 3 : null);
  return a == null ? null : [a, b];
};
const items = (spec.items ?? []).filter((i) => i.t !== "cover");
const VISUAL = new Set(["pic", "full", "flash", "crop", "scholar", "tphoto", "arc", "flag", "person", "phone", "scene"]);
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

// 1b) speech → required element (data/required_elements.json): every mention of a trip, a date, a news item, a previous episode carries its element
{
  const req = read(path.join("data", "required_elements.json"), { rules: [] }).rules;
  const skipR = new Set(spec.skipRequired ?? []), miss = [];
  for (const r of req) {
    const hits = [];
    for (const f of r.forms) {
      if (f === "#year") { const notYear = new Set(["صفحه", "ص", "الصفحه", "الجزء", "جزء", "المجلد", "مجلد", "رقم", "حديث", "الحديث", "ايه", "الايه"]); words.forEach((w, i) => { if (/^(1[0-9]{3}|20[0-9]{2}|[1-9][0-9]{2})$/.test(nw[i]) && !notYear.has(nw[i - 1])) hits.push(w.s); }); continue; }
      const q = norm(f).split(" ");
      // prefix-stripped match only for stems ≥ 3 letters (bare("وكالة") = "ه" would match «له»)
      for (let i = 0; i + q.length <= nw.length; i++) if (q.every((x, k) => nw[i + k] === x || (bare(x).length >= 3 && nb[i + k] === bare(x)))) hits.push(words[i].s);
    }
    hits.sort((a, b) => a - b);
    let last = -1e9;
    for (const at of hits) {
      if (at - last < (r.merge ?? 20)) continue;
      last = at;
      if (skipR.has(`${r.name}@${Math.round(at)}`)) continue;
      const ok = items.some((it) => {
        if (!r.types.includes("*") && !r.types.includes(it.t)) return false;
        if (r.srcPrefix && !String(it.src ?? "").startsWith(r.srcPrefix)) return false;
        const s = span(it); return s && s[0] <= at + (r.after ?? 6) && s[1] >= at - (r.before ?? 3);
      });
      if (!ok) miss.push(`${r.name} عند ${mm(at)} (${Math.round(at)}s)`);
    }
  }
  // every verse verse_scan found is on screen: a recitation (≥ 6 matched words) in a verse card, a short quote at least written (verse/torn/word)
  for (const v of read(path.join(T, "verses.json"), [])) {
    if (!v.inCut || !v.cut?.length) continue;
    const at = v.cut[0], kinds = (v.matched ?? 0) >= 6 ? ["verse"] : ["verse", "torn", "word"];
    if (!items.some((it) => { const s = span(it); return kinds.includes(it.t) && s && s[0] <= at + 2.5 && s[1] >= at; })) miss.push(`آية ${v.sura}:${v.aya} (${v.matched} كلمة) بلا ${kinds.length === 1 ? "بطاقة آية" : "كتابة"} عند ${mm(at)}`);
  }
  console.log(miss.length ? `✘ كلام بلا عنصره المطلوب (${miss.length}): ${miss.join("، ")} — أضفه أو اكتب "skipRequired": ["<الاسم>@<الثانية>"] بسببه في الخطة` : `✔ كل رحلة وتاريخ وخبر وحلقة سابقة وآية لها عنصرها`);
  if (miss.length) fails++;
}

// 2) empty stretches (any item or baked split counts as something on screen)
const spans = [...items.map(span).filter(Boolean), ...(spec.splits ?? []).map((s) => [s.from, s.to]), ...(spec.zooms ?? []).map((z) => [z.from, z.to]), ...(spec.shake ?? []).map((z) => [z.from, z.to])].sort((a, b) => a[0] - b[0]);
const gaps = [];
let end = 0;
for (const [a, b] of spans) { if (a - end > GAP) gaps.push([end, a]); end = Math.max(end, b); }
if (dur - 3 - end > GAP) gaps.push([end, dur - 3]);
console.log(gaps.length ? `✘ فراغ أطول من ${GAP} ث بلا عنصر ولا حركة (${gaps.length}): ${gaps.map(([a, b]) => `${mm(a)}–${mm(b)} (${Math.round(b - a)} ث)`).join("، ")}` : `✔ لا فراغ أطول من ${GAP} ث`);
if (gaps.length) fails++;

// 2a) the sheikh's name card (nameTag) appears alone: no other item or baked split overlaps it
{
  const others = [...items.filter((i) => i.t !== "nameTag" && i.t !== "blur").map((i) => ({ n: i.t, s: span(i) })), ...(spec.splits ?? []).map((s) => ({ n: "split", s: [s.from, s.to] }))].filter((o) => o.s);
  const clash = [];
  for (const nt of items.filter((i) => i.t === "nameTag")) {
    const s = span(nt); if (!s) continue;
    const hit = others.filter((o) => o.s[0] < s[1] - 0.05 && o.s[1] > s[0] + 0.05);
    if (hit.length) clash.push(`${mm(s[0])} مع ${[...new Set(hit.map((h) => h.n))].join("+")}`);
  }
  console.log(clash.length ? `✘ بطاقة اسم الشيخ ليست وحدها (${clash.length}): ${clash.join("، ")}` : `✔ بطاقة اسم الشيخ تظهر وحدها`);
  if (clash.length) fails++;
}

// 2b) first minute: never empty (attraction window) — gaps above FIRST_GAP seconds fail
const FIRST_LEN = Math.min(60, dur), FIRST_GAP = Number(opt("first-gap", 0.3));
const fgaps = [];
{ let e = 0; for (const [a, b] of spans) { if (a >= FIRST_LEN) break; if (a - e > FIRST_GAP) fgaps.push([e, a]); e = Math.max(e, b); } if (e < FIRST_LEN && FIRST_LEN - e > FIRST_GAP) fgaps.push([e, FIRST_LEN]); }
console.log(fgaps.length ? `✘ الدقيقة الأولى فيها لحظات بلا عنصر (> ${FIRST_GAP} ث): ${fgaps.map(([a, b]) => `${a.toFixed(1)}–${b.toFixed(1)} ث`).join("، ")}` : `✔ الدقيقة الأولى بلا فراغ`);
if (fgaps.length) fails++;

// 3) moves planned in the spec: push-ins at most ZOOM_GAP s apart (start → first, between, last → end)
const zs = [...(spec.zooms ?? [])].map((z) => z.from).sort((x, y) => x - y), hasShake = Array.isArray(spec.shake);
const zgaps = [];
{ let prev = 0; for (const z of [...zs, dur]) { if (z - prev > ZOOM_GAP) zgaps.push([prev, z]); prev = z; } }
const zok = zs.length > 0 && zgaps.length === 0 && hasShake;
console.log(zok ? `✔ الحركات مخطّطة: ${zs.length} تقريب (لا فراغ تقريب > ${ZOOM_GAP} ث)، ${spec.shake.length} اهتزاز` : `✘ الحركات: ${zs.length} تقريب${zgaps.length ? "، فراغ تقريب أطول من دقيقتين: " + zgaps.map(([x, y]) => mm(x) + "–" + mm(y)).join("، ") : ""}${hasShake ? "" : "، ولا قائمة shake"} — شغّل node tools/moves_plan.mjs ${p} وراجع .tmp/${p}/moves.md ثم اكتبها في zooms/shake`);
if (!zok) fails++;

console.log(fails ? `FAILED (${fails})` : "PASSED");
process.exit(fails ? 1 : 0);
