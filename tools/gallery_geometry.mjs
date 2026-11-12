// THE GALLERY IS THE ONLY REFERENCE FOR SIZE AND PLACE (user 2026-11-10, again 2026-11-11: «عندك مشكلة بعدم الالتزام بالمواقع الموجودة في المعرض… حلها جذرياً»).
// Root cause it fixes: the build and grid_plan --write gave every card its own x/y/w/h (a date card shrunk to w 179 instead of the gallery's 380, no landscape
// place at all), so the gallery's place offsets (src/galleryPlace.ts) were added to a DIFFERENT base than the one the user placed in the gallery.
//   node tools/gallery_geometry.mjs data/specs/<p>.json --write   → every card item gets EXACTLY the geometry of its gallery sample (src/RealLab.tsx), both orientations
//   node tools/gallery_geometry.mjs data/specs/<p>.json           → check only: exit 1 when an item's geometry differs from its gallery sample
// Card types: tphoto (TornPhoto), scholar (PinnedPhoto), pic (PhotoFrame: width from the gallery, height keeps the picture's own ratio), news (NewsClip),
// date (DateCalendar), flag (PopCard), clock (Clock). An item the user placed himself by hand carries "placeOwn": true and is left alone.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
// THE WHOLE PICTURE, NEVER CROPPED (user 2026-11-11: «الصور يجب أن تظهر كاملة، لا تأكل من الصور»): a photo card keeps the gallery's WIDTH and its height follows the
// picture's own ratio (frame margins per card: tphoto 40×20, scholar 20×(name band), pic 10×10); a very tall picture keeps the gallery height ×1.5 and gets narrower, centred.
const dims = (src) => { const r = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", path.join("public", src)], { encoding: "utf8" }); const [w, h] = String(r.stdout).trim().split(",").map(Number); return w && h ? [w, h] : null; };
const band = (it, w) => (it.name ? Math.max(1, Math.ceil(it.name.length * 15.5 / (w - 24))) * 38 + 40 + (it.sub ? 22 : 0) : 0);
const fit = (it, w, h) => {   // → [w, h, dx] for a card of gallery width w and gallery height h
  const d = it.src ? dims(it.src) : null; if (!d) return [w, h, 0];
  const r = d[1] / d[0], mx = it.t === "tphoto" ? 40 : it.t === "scholar" ? 20 : 10;
  const extra = it.t === "tphoto" ? 20 : it.t === "scholar" ? band(it, w) : 10;
  let W = w, H = Math.round((W - mx) * r + extra);
  if (H > h * 1.5) { H = Math.round(h * 1.5); W = Math.round((H - extra) / r + mx); }
  return [W, H, Math.round((w - W) / 2)];
};

const argv = process.argv.slice(2), specF = argv.find((a) => a.endsWith(".json")), WRITE = argv.includes("--write");
if (!specF) { console.error("usage: node tools/gallery_geometry.mjs data/specs/<p>.json [--write]"); process.exit(2); }
process.chdir(path.resolve(import.meta.dirname, ".."));
const TYPES = new Set(["tphoto", "scholar", "pic", "news", "date", "flag", "clock"]);
const GEO = ["x", "y", "w", "h", "size"];
// portrait: the gallery's height is «the band under the beard» of its sample recording; in this video that band is where grid_plan puts it, so portrait `y` follows the video (only x/w/h/size are the gallery's)
const PGEO = ["x", "w", "h", "size"];

// gallery element → spec type (src/galleryPlace.ts TYPE_OF)
const gp = fs.readFileSync("src/galleryPlace.ts", "utf8");
const typeOf = {}; for (const m of gp.slice(gp.indexOf("TYPE_OF"), gp.indexOf("};", gp.indexOf("TYPE_OF"))).matchAll(/(\w+):\s*"([\w:]+)"/g)) typeOf[m[1]] = m[2];
// the gallery samples (src/RealLab.tsx): «Name: { item: it({ … })» or «item: [it({ … }), …]» — the first it({ … }) object is the sample
const rl = fs.readFileSync("src/RealLab.tsx", "utf8");
const sample = {};
for (const [name, t] of Object.entries(typeOf)) {
  if (!TYPES.has(t) || sample[t]) continue;
  const i = rl.search(new RegExp(`\\n\\s*${name}:\\s*\\{\\s*item:`)); if (i < 0) continue;
  const j = rl.indexOf("it({", i); if (j < 0) continue;
  let d = 0, k = j + 3; for (; k < rl.length; k++) { if (rl[k] === "{") d++; else if (rl[k] === "}") { d--; if (d === 0) break; } }
  const src = rl.slice(j + 3, k + 1);
  try { sample[t] = Function("A", "U", "SOURCE", `return (${src});`)(0.2, 2.8, {}); } catch (e) { console.error(`✘ cannot read the gallery sample of ${name}: ${e.message}`); }
}
// PhotoFrame (pic) is drawn in the gallery as a node, not a spec item (src/ElementsLab.tsx): a 600-wide frame in the slot — landscape = the left column (engine default, no land geometry), portrait = centred under the beard
sample.pic ??= { x: 240, w: 600, h: 400 };   // the gallery frame is 600 × 400, the picture covers it (cropped), whatever its own ratio
const spec = JSON.parse(fs.readFileSync(specF, "utf8"));
const diffs = [];
const PANEL = (() => { try { return JSON.parse(fs.readFileSync("data/layout_grids.json", "utf8")).land.half.slots.panel.rect; } catch { return null; } })();
for (const it of spec.items ?? []) {
  if (!TYPES.has(it.t) || it.placeOwn) continue;
  const s = sample[it.t]; if (!s) { diffs.push(`${it.t}: لا عيّنة في المعرض`); continue; }
  const want = {}; for (const k of GEO) if (s[k] !== undefined) want[k] = s[k];
  const wantLand = {}; for (const k of GEO) if (s.land?.[k] !== undefined) wantLand[k] = s.land[k];
  if (["tphoto", "scholar", "pic"].includes(it.t) && want.w && want.h) {
    const [W, H, dx] = fit(it, want.w, want.h); want.w = W; want.h = H; if (want.x !== undefined) want.x += dx;
    // landscape: the engine's base box (left column; tphoto/scholar 300×370, pic 600×400) unless the gallery sample gives one
    const lw = wantLand.w ?? (it.t === "pic" ? 600 : 300), lh = wantLand.h ?? (it.t === "pic" ? 400 : 370), [LW, LH, ldx] = fit(it, lw, lh);
    wantLand.w = LW; wantLand.h = LH; if (ldx) wantLand.x = (wantLand.x ?? 40) + ldx;
  }
  /* (user 2026-11-06, repeated 2026-11-12: «الشاشة المنقسمة… الصور تطلع بالنص بين الإطار تبعي والإطار تبعه، ما تطلع فوق الشخص») in a landscape split window
     (the clip card | his card) every picture goes in the GAP between the two cards (grid slot land.half.panel), scaled to fit, never over the clip */
  let panelHere = false;
  { const t0 = it.at ?? it.from ?? 0, inSplit = (spec.splits ?? []).some((w) => t0 >= w.from - 0.05 && t0 < w.to);
    if (inSplit && ["tphoto", "scholar", "pic", "date", "flag", "news", "clock"].includes(it.t) && PANEL) {
      panelHere = true;   /* the card frame + name strip is drawn ≈ 20 % wider than the picture: the whole frame must fit inside the gap */
      const [px, py, px2, py2] = PANEL, pw = Math.floor((px2 - px) / 1.2), ph = Math.floor((py2 - py) / 1.35), w0 = wantLand.w ?? 300, h0 = wantLand.h ?? 370, k = Math.min(1, pw / w0, ph / h0);
      wantLand.w = Math.round(w0 * k); wantLand.h = Math.round(h0 * k); wantLand.x = Math.round(px + (px2 - px - wantLand.w) / 2); wantLand.y = Math.round(py + (py2 - py - wantLand.h) / 2);
    } }
  const bad = [];
  for (const k of PGEO) if ((it[k] ?? undefined) !== (want[k] ?? undefined) && !(it.t === "pic" && k === "h" && Math.abs((it.h ?? 0) - (want.h ?? 0)) <= 1)) bad.push(`${k} ${it[k]}→${want[k]}`);
  for (const k of GEO) if ((it.land?.[k] ?? undefined) !== (wantLand[k] ?? undefined)) bad.push(`land.${k} ${it.land?.[k]}→${wantLand[k]}`);
  if (!!it.land?.panel !== panelHere) bad.push(`land.panel ${!!it.land?.panel}→${panelHere}`);
  if (!bad.length) continue;
  diffs.push(`${it.t} عند ${(it.at ?? it.from ?? 0).toFixed(1)}ث: ${bad.join("، ")}`);
  if (WRITE) {
    for (const k of PGEO) { if (want[k] !== undefined) it[k] = want[k]; else delete it[k]; }
    const land = { ...(it.land ?? {}) }; for (const k of GEO) { if (wantLand[k] !== undefined) land[k] = wantLand[k]; else delete land[k]; }
    if (panelHere) land.panel = true; else delete land.panel;
    if (Object.keys(land).length) it.land = land; else delete it.land;
  }
}
if (WRITE) { fs.writeFileSync(specF, JSON.stringify(spec, null, 1)); console.log(`gallery_geometry: ${diffs.length} عنصراً أُعيد إلى مقاس المعرض ومكانه (${Object.keys(sample).join("، ")})`); process.exit(0); }
console.log(diffs.length ? `✘ gallery_geometry: ${diffs.length} عنصراً بغير مقاس المعرض ومكانه:\n  ` + diffs.slice(0, 15).join("\n  ") + `\n  → node tools/gallery_geometry.mjs ${specF} --write` : `✔ gallery_geometry: كل البطاقات بمقاس المعرض ومكانه (${Object.keys(sample).join("، ")})`);
process.exit(diffs.length ? 1 : 0);
