// node tools/sfx_bind.mjs data/specs/<p>.json → fills spec.sfx from data/element_sfx.json (the sounds the user bound to elements). Idempotent: earlier bound entries (src sfx/el_*) are replaced.
import fs from "node:fs";
const f = process.argv[2], spec = JSON.parse(fs.readFileSync(f, "utf8")), map = JSON.parse(fs.readFileSync("data/element_sfx.json", "utf8")).bindings;
const out = (spec.sfx ?? []).filter((x) => !x.src.startsWith("sfx/el_"));
const add = (b, at, only) => out.push({ src: b.src, at: Math.round(at * 100) / 100, vol: b.vol, ...(only ? { only } : {}) });   // an item that exists in one orientation only (`only`) sounds only there; the rest sound in both
for (const b of map) {
  for (const it of spec.items) {
    if (b.types.includes("scraps") && it.t === "scraps") (it.times ?? [it.at]).forEach((t) => add(b, t, it.only));
    else if (b.types.includes("rows") && it.t === "rows") it.rows.forEach((r) => add(b, r.at, it.only));
    else if (b.types.includes(it.t)) add(b, it.at ?? it.from ?? 0, it.only);
  }
  if (b.types.includes("splits")) for (const s of spec.splits ?? []) add(b, s.from);
}
const ded = []; for (const x of out.sort((a, c) => a.at - c.at)) if (!ded.some((y) => y.src === x.src && y.only === x.only && Math.abs(y.at - x.at) < 0.3)) ded.push(x);   // land + port twins of one item = one sound
spec.sfx = ded;
fs.writeFileSync(f, JSON.stringify(spec, null, 1)); console.log(`sfx_bind: ${ded.filter((x) => x.src.startsWith("sfx/el_")).length} bound sounds in ${f}`);
