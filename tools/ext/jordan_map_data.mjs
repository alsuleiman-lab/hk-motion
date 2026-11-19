// يولّد src/ext/jordanMap.ts: حدود الأردن وجيرانه من Natural Earth (حزمة world-atlas، ملك عام) بإسقاط ميركاتور في لوحة 1000×1000،
// مع إحداثيات مدن (عمّان، الزرقاء، الكرك، العقبة). يُشغَّل مرة واحدة: node tools/ext/jordan_map_data.mjs
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const topo = JSON.parse(fs.readFileSync("node_modules/world-atlas/countries-10m.json", "utf8"));
const { feature } = await import("topojson-client");
const d3 = await import("d3-geo");
const all = feature(topo, topo.objects.countries).features;
const by = (n) => all.find((f) => f.properties.name === n);
const NAMES = { jordan: "Jordan", syria: "Syria", iraq: "Iraq", saudi: "Saudi Arabia", israel: "Israel", palestine: "Palestine", egypt: "Egypt", lebanon: "Lebanon" };
const W = 1000, H = 1000;
const jordan = by("Jordan");
// إطار يغطي الأردن بهامش
const frame = { type: "MultiPoint", coordinates: [[34.2, 28.9], [39.9, 28.9], [39.9, 33.7], [34.2, 33.7]] };
const proj = d3.geoMercator().fitExtent([[0, 0], [W, H]], frame);
const path = d3.geoPath(proj).digits(1);
const out = { W, H, paths: {}, cities: {} };
for (const [k, n] of Object.entries(NAMES)) {
  const f = by(n);
  if (!f) { console.error("missing", n); continue; }
  out.paths[k] = path(f);
}
const CITIES = { amman: [35.9239, 31.9539], zarqa: [36.0880, 32.0728], karak: [35.7048, 31.1853], aqaba: [35.0063, 29.5321], irbid: [35.8500, 32.5556] };
for (const [k, [lo, la]] of Object.entries(CITIES)) { const p = proj([lo, la]); out.cities[k] = [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10]; }
const src = `// مولَّد بـ tools/ext/jordan_map_data.mjs من Natural Earth (world-atlas 2.0.2، ملك عام). لا يُعدَّل يدوياً.
export const JORDAN_MAP = ${JSON.stringify(out)} as const;
`;
fs.writeFileSync("src/ext/jordanMap.ts", src);
console.log("ok", Object.keys(out.paths).join(","), JSON.stringify(out.cities), (src.length / 1024).toFixed(0) + "KB");
