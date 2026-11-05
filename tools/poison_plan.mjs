// Turn data/poison_cues.json (his words in SOURCE seconds) into spec items on the CUT timeline.
//   node tools/poison_plan.mjs <project>   → .tmp/<p>/poison_items.json  { items: [...poison items], shifts: [...] }   (merge into data/specs/<p>.json)
import fs from "node:fs";
const p = process.argv[2];
if (!p) { console.error("usage: node tools/poison_plan.mjs <project>"); process.exit(2); }
const cues = JSON.parse(fs.readFileSync("data/poison_cues.json", "utf8"));
const map = JSON.parse(fs.readFileSync(`public/${p}_map.json`, "utf8")).segments;
/** source second → cut second (a time inside a removed span lands on the start of the next kept segment) */
const toCut = (s) => {
  for (const g of map) { if (s >= g.a && s < g.b) return g.n + (s - g.a); if (s < g.a) return g.n; }
  const l = map[map.length - 1]; return l.n + (l.b - l.a);
};
const r3 = (x) => Math.round(x * 1000) / 1000;
const items = [], shifts = [];
for (const c of cues.clips) {
  const at = toCut(c.from), until = toCut(c.to);
  const m = c.cues.map(([s, sc]) => [r3(toCut(s) - at), sc]);
  for (let i = 1; i < m.length; i++) if (m[i][0] <= m[i - 1][0]) m[i][0] = r3(m[i - 1][0] + 0.05);   // two words fell on the same cut second
  const sceneAt = (s) => { const t = toCut(s) - at; for (let i = 1; i < m.length; i++) if (t <= m[i][0]) { const [a, b] = m[i - 1], [d, e] = m[i]; return b + ((t - a) / (d - a)) * (e - b); } return m[m.length - 1][1]; };
  items.push({ t: "poison", id: c.id, at: r3(at), until: r3(until), mode: c.mode, parts: c.parts, map: m, refs: (c.refs ?? []).map(([n, s]) => ({ n, at: r3(Math.max(0.3, sceneAt(s))) })) });
  if (c.mode === "half") shifts.push({ from: r3(at), to: r3(until - 0.4), dx: cues.halfShiftDx ?? 480 });
}
fs.writeFileSync(`.tmp/${p}/poison_items.json`, JSON.stringify({ items, shifts }, null, 1));
console.log(items.map((i) => `${i.id}  ${i.at.toFixed(1)}–${i.until.toFixed(1)} (${(i.until - i.at).toFixed(0)}s) ${i.mode}`).join("\n"));
