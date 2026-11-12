/* Fill stretches longer than 5 s with nothing on screen by slow push-ins (user 2026-11-12: writing is capped at one scraps + one torn a minute, so the
   rest of the minute is carried by movement). Each push-in holds ≤ 8 s, then 3 s back at normal size, so no stretch is left longer than 5 s.
   node tools/gap_zooms.mjs data/specs/<p>.json [--write]   (run after writing_place --hold and grid_plan; coverage_check reads the same spans) */
import fs from "node:fs";
const specF = process.argv[2], WRITE = process.argv.includes("--write"), GAP = 5;
const spec = JSON.parse(fs.readFileSync(specF, "utf8"));
/* same span rule as coverage_check.mjs */
const span = (i) => { const a = i.at ?? i.from ?? i.oldAt ?? i.times?.[0]; if (a == null) return null; const b = i.until ?? i.to ?? (i.dur != null ? a + i.dur : a + 3); return [a, b]; };
const spans = [...spec.items.map(span).filter(Boolean), ...(spec.splits ?? []).map((s) => [s.from, s.to]), ...(spec.zooms ?? []).map((z) => [z.from, z.to]), ...(spec.shake ?? []).map((z) => [z.from, z.to])].sort((a, b) => a[0] - b[0]);
const dur = spec.frames ? spec.frames / (spec.fps ?? 30) : Math.max(...spans.map((s) => s[1]));
const gaps = []; let end = 0;
for (const [a, b] of spans) { if (a - end > GAP) gaps.push([end, a]); end = Math.max(end, b); }
if (dur - 3 - end > GAP) gaps.push([end, dur - 3]);
const add = [];
for (const [a, b] of gaps) {
  let t = a + 0.3;
  while (b - t > GAP - 0.5) { const to = Math.min(t + 8, b - 0.3); add.push({ from: +t.toFixed(2), to: +to.toFixed(2), amt: 0.06 }); t = to + 3; }
}
console.log(`gap_zooms: ${gaps.length} فراغ ← ${add.length} تقريب بطيء`);
if (WRITE) { spec.zooms = [...(spec.zooms ?? []), ...add].sort((x, y) => x.from - y.from); fs.writeFileSync(specF, JSON.stringify(spec, null, 1)); }
