// THE GALLERY'S SIZE AND PLACE OF EVERY ELEMENT, as one table the engine reads at render time (user 2026-11-17, src/galleryRef.ts).
//   node tools/gallery_geo.mjs           → data/gallery_geo.json  { <spec type>: { port: {x,y,w,h,size}, land: {…} } }
//   node tools/gallery_geo.mjs --check   → exit 1 when the table is older than the gallery samples (src/RealLab.tsx)
// Source = the gallery samples in src/RealLab.tsx (the items the gallery itself draws), element → spec type through src/galleryPlace.ts TYPE_OF, plus the picture
// frame (PhotoFrame) the gallery draws as a 600 × 400 frame. Run by `stage.mjs check` and `el.mjs`, so a change in the gallery reaches every video without a request.
import fs from "node:fs";
import path from "node:path";

process.chdir(path.resolve(import.meta.dirname, ".."));
const OUT = path.join("data", "gallery_geo.json"), SRC = [path.join("src", "RealLab.tsx"), path.join("src", "galleryPlace.ts")];
if (process.argv.includes("--check")) {
  const ok = fs.existsSync(OUT) && SRC.every((f) => fs.statSync(f).mtimeMs <= fs.statSync(OUT).mtimeMs);
  console.log(ok ? "✔ gallery_geo: الجدول محدَّث من المعرض" : "✘ gallery_geo: الجدول أقدم من عينات المعرض → node tools/gallery_geo.mjs");
  process.exit(ok ? 0 : 1);
}
const gp = fs.readFileSync(SRC[1], "utf8");
const typeOf = {}; for (const m of gp.slice(gp.indexOf("TYPE_OF"), gp.indexOf("};", gp.indexOf("TYPE_OF"))).matchAll(/(\w+):\s*"([\w:]+)"/g)) typeOf[m[1]] = m[2];
const rl = fs.readFileSync(SRC[0], "utf8");
const GEO = ["x", "y", "w", "h", "size"], table = {}, bad = [];
for (const [name, t] of Object.entries(typeOf)) {
  if (table[t]) continue;
  const i = rl.search(new RegExp(`\\n\\s*${name}:\\s*\\{\\s*item:`)); if (i < 0) continue;
  const j = rl.indexOf("it({", i); if (j < 0) continue;
  let d = 0, k = j + 3; for (; k < rl.length; k++) { if (rl[k] === "{") d++; else if (rl[k] === "}") { d--; if (d === 0) break; } }
  let o; try { o = Function("A", "U", "SOURCE", `return (${rl.slice(j + 3, k + 1)});`)(0.2, 2.8, {}); } catch (e) { bad.push(`${name}: ${e.message}`); continue; }
  const port = {}, land = {};
  for (const g of GEO) { if (typeof o[g] === "number") port[g] = o[g]; if (typeof o.land?.[g] === "number") land[g] = o.land[g]; }
  if (Object.keys(port).length || Object.keys(land).length) table[t] = { ...(Object.keys(port).length ? { port } : {}), ...(Object.keys(land).length ? { land } : {}) };
}
// the solo cards in landscape: the grid's «solo» slot left of the face zone (the rule spec_normalize applies to every video) when the gallery sample gives no landscape place
for (const [t, land] of [["nameTag", { x: 686, y: 800 }], ["nameTag:pinned", { x: 686, y: 800 }], ["subscribe", { x: 410, y: 838 }]]) if (table[t] && !table[t].land) table[t].land = land;
// the picture frame: drawn by the gallery as a node (src/ElementsLab.tsx), 600 × 400; portrait centred under the beard, landscape = the left column
table.pic ??= { port: { x: 240, w: 600, h: 400 }, land: { w: 600, h: 400 } };
fs.writeFileSync(OUT, JSON.stringify(table, null, 1) + "\n");
console.log(`✔ gallery_geo: ${Object.keys(table).length} عنصراً من عينات المعرض → ${OUT}${bad.length ? ` · ✘ لم تُقرأ: ${bad.join("، ")}` : ""}`);
