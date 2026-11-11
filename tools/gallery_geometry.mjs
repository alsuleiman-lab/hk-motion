// THE GALLERY IS THE ONLY REFERENCE FOR SIZE AND PLACE (user 2026-11-10, again 2026-11-11: «عندك مشكلة بعدم الالتزام بالمواقع الموجودة في المعرض… حلها جذرياً»).
// Root cause it fixes: the build and grid_plan --write gave every card its own x/y/w/h (a date card shrunk to w 179 instead of the gallery's 380, no landscape
// place at all), so the gallery's place offsets (src/galleryPlace.ts) were added to a DIFFERENT base than the one the user placed in the gallery.
//   node tools/gallery_geometry.mjs data/specs/<p>.json --write   → every card item gets EXACTLY the geometry of its gallery sample (src/RealLab.tsx), both orientations
//   node tools/gallery_geometry.mjs data/specs/<p>.json           → check only: exit 1 when an item's geometry differs from its gallery sample
// Card types: tphoto (TornPhoto), scholar (PinnedPhoto), pic (PhotoFrame: width from the gallery, height keeps the picture's own ratio), news (NewsClip),
// date (DateCalendar), flag (PopCard), clock (Clock). An item the user placed himself by hand carries "placeOwn": true and is left alone.
import fs from "node:fs";
import path from "node:path";

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
for (const it of spec.items ?? []) {
  if (!TYPES.has(it.t) || it.placeOwn) continue;
  const s = sample[it.t]; if (!s) { diffs.push(`${it.t}: لا عيّنة في المعرض`); continue; }
  const want = {}; for (const k of GEO) if (s[k] !== undefined) want[k] = s[k];
  const wantLand = {}; for (const k of GEO) if (s.land?.[k] !== undefined) wantLand[k] = s.land[k];
  const bad = [];
  for (const k of PGEO) if ((it[k] ?? undefined) !== (want[k] ?? undefined) && !(it.t === "pic" && k === "h" && Math.abs((it.h ?? 0) - (want.h ?? 0)) <= 1)) bad.push(`${k} ${it[k]}→${want[k]}`);
  for (const k of GEO) if ((it.land?.[k] ?? undefined) !== (wantLand[k] ?? undefined)) bad.push(`land.${k} ${it.land?.[k]}→${wantLand[k]}`);
  if (!bad.length) continue;
  diffs.push(`${it.t} عند ${(it.at ?? it.from ?? 0).toFixed(1)}ث: ${bad.join("، ")}`);
  if (WRITE) {
    for (const k of PGEO) { if (want[k] !== undefined) it[k] = want[k]; else delete it[k]; }
    const land = { ...(it.land ?? {}) }; for (const k of GEO) { if (wantLand[k] !== undefined) land[k] = wantLand[k]; else delete land[k]; }
    if (Object.keys(land).length) it.land = land; else delete it.land;
  }
}
if (WRITE) { fs.writeFileSync(specF, JSON.stringify(spec, null, 1)); console.log(`gallery_geometry: ${diffs.length} عنصراً أُعيد إلى مقاس المعرض ومكانه (${Object.keys(sample).join("، ")})`); process.exit(0); }
console.log(diffs.length ? `✘ gallery_geometry: ${diffs.length} عنصراً بغير مقاس المعرض ومكانه:\n  ` + diffs.slice(0, 15).join("\n  ") + `\n  → node tools/gallery_geometry.mjs ${specF} --write` : `✔ gallery_geometry: كل البطاقات بمقاس المعرض ومكانه (${Object.keys(sample).join("، ")})`);
process.exit(diffs.length ? 1 : 0);
