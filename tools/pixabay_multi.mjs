// Smart Pixabay search: several queries at once, merged, deduped, filtered, ranked — and a contact-sheet PNG so the candidates can be LOOKED at before any download.
//   node tools/pixabay_multi.mjs "cairo city skyline | egypt old street | nile river sunset" [--type video|photo] [--n 15] [--per 20]
//        [--orient h|v] [--min-w 1280] [--min-dur 4] [--max-dur 40] [--must cairo,egypt] [--keep-flagged] [--sheet-png .tmp/pixabay/sheet.png]
// Never prints the API key. Excludes ids already in public/stock/sources.json. Items whose tags mention women/girls/etc. are dropped (workspace rule) unless --keep-flagged (then marked ⚠).
// Download only after approval: node tools/fetch_broll.mjs get <id> --type video [--name x]   (that tool also logs the source).
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const env = Object.fromEntries(fs.readFileSync(path.join(root, ".env"), "utf8").split(/\r?\n/).filter((l) => l.includes("=") && !l.startsWith("#")).map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]));
const KEY = env.PIXABAY_API_KEY;
if (!KEY) { console.error("PIXABAY_API_KEY missing in .env"); process.exit(2); }
const [qs, ...rest] = process.argv.slice(2);
if (!qs) { console.error('usage: node tools/pixabay_multi.mjs "q1 | q2 | q3" [--type video|photo] [--n 15] [--orient h|v] [--min-w 1280] [--sheet-png out.png]'); process.exit(2); }
const flag = (n, d) => { const i = rest.indexOf("--" + n); return i >= 0 ? rest[i + 1] : d; };
const has = (n) => rest.includes("--" + n);
const type = flag("type", "video"), N = Number(flag("n", 15)), per = Number(flag("per", 20));
const must = flag("must", "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
const minW = Number(flag("min-w", 0)), minDur = Number(flag("min-dur", 0)), maxDur = Number(flag("max-dur", 9999)), orient = flag("orient", "");
const BAD = /\b(woman|women|girl|girls|lady|ladies|female|bride|wedding|model|fashion|beauty|makeup|bikini|couple|mother|mom|wife|pregnan\w*|dancer|family|portrait)\b/i;
const base = type === "video" ? "https://pixabay.com/api/videos/" : "https://pixabay.com/api/";
const used = new Set();
try { for (const x of JSON.parse(fs.readFileSync(path.join(root, "public/stock/sources.json"), "utf8"))) used.add(x.id); } catch { /* none yet */ }

const hits = new Map();
for (const q of qs.split("|").map((s) => s.trim()).filter(Boolean)) {
  const u = new URL(base);
  u.searchParams.set("key", KEY); u.searchParams.set("q", q); u.searchParams.set("per_page", String(per)); u.searchParams.set("safesearch", "true");
  if (type === "photo") { u.searchParams.set("image_type", "photo"); if (orient) u.searchParams.set("orientation", orient.startsWith("v") ? "vertical" : "horizontal"); }
  const r = await fetch(u);
  if (!r.ok) { console.error(`✘ "${q}": HTTP ${r.status}`); continue; }
  const j = await r.json();
  for (const h of j.hits) {
    const e = hits.get(h.id) ?? { h, qs: new Set() };
    e.qs.add(q); hits.set(h.id, e);
  }
  console.log(`· "${q}": ${j.hits.length} نتيجة (الإجمالي ${j.totalHits})`);
}
const dims = (h) => (h.videos ? [h.videos.large?.width || h.videos.medium.width, h.videos.large?.height || h.videos.medium.height] : [h.imageWidth, h.imageHeight]);
let dropWomen = 0, dropUsed = 0, dropSize = 0, dropMust = 0;
const rows = [];
for (const { h, qs: matched } of hits.values()) {
  if (used.has(h.id)) { dropUsed++; continue; }
  const [w, hh] = dims(h), flagged = BAD.test(h.tags);
  if (h.isAiGenerated || h.isLowQuality) { dropSize++; continue; }
  if (must.length && !must.some((m) => h.tags.toLowerCase().includes(m))) { dropMust++; continue; }
  if (flagged && !has("keep-flagged")) { dropWomen++; continue; }
  if (w < minW || (h.duration && (h.duration < minDur || h.duration > maxDur))) { dropSize++; continue; }
  if (orient && (orient.startsWith("v") ? w > hh : w < hh)) { dropSize++; continue; }
  rows.push({ h, w, hh, flagged, score: matched.size * 1000 + (h.likes ?? 0) + (h.downloads ?? 0) / 100, matched: matched.size });
}
rows.sort((a, b) => b.score - a.score);
const top = rows.slice(0, N);
console.log(`\nمدموج ${hits.size} | حُذف: نساء/عائلة ${dropWomen}، مستعمل سابقاً ${dropUsed}، مقاس/مدة/مولَّد/ضعيف ${dropSize}، لا يطابق --must ${dropMust} | المعروض ${top.length}\n`);
top.forEach((r, i) => console.log(`${i}. id=${r.h.id} ${r.h.duration ? r.h.duration + "ث " : ""}${r.w}x${r.hh} | ${r.matched} استعلام | ${r.h.tags}${r.flagged ? " ⚠" : ""}`));
const sheet = flag("sheet-png");
if (sheet && top.length) {
  const dir = path.join(root, ".tmp", "pixabay", `t${Date.now()}`); fs.mkdirSync(dir, { recursive: true });
  for (const [i, r] of top.entries()) {
    const url = type === "video" ? (r.h.videos.medium?.thumbnail ?? r.h.videos.small?.thumbnail) : r.h.webformatURL;
    try { fs.writeFileSync(path.join(dir, `${String(i).padStart(2, "0")}.jpg`), Buffer.from(await (await fetch(url)).arrayBuffer())); } catch { /* skip */ }
  }
  fs.mkdirSync(path.dirname(path.resolve(sheet)), { recursive: true });
  const cols = 4, rowsN = Math.ceil(top.length / cols);
  // normalise every thumbnail on its own (mixed sizes break a single filter graph), then tile
  for (const [i] of top.entries()) {
    const n = String(i).padStart(2, "0");
    spawnSync("ffmpeg", ["-v", "error", "-y", "-i", path.join(dir, n + ".jpg"), "-vf", "scale=400:225:force_original_aspect_ratio=decrease,pad=400:225:(ow-iw)/2:(oh-ih)/2", path.join(dir, "s" + n + ".png")]);
  }
  const o = spawnSync("ffmpeg", ["-v", "error", "-y", "-framerate", "1", "-i", path.join(dir, "s%02d.png"), "-vf", `tile=${cols}x${rowsN}`, "-frames:v", "1", sheet], { encoding: "utf8" });
  console.log(o.status === 0 ? `
لوحة المعاينة (بالترتيب أعلاه، 4 في الصف): ${sheet}` : `فشل بناء اللوحة: ${o.stderr.slice(0, 200)}`);
}
