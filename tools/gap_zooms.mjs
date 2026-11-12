/* Fill stretches longer than 5 s with nothing on screen by slow push-ins (user 2026-11-12: writing is capped at one scraps + one torn a minute, so the
   rest of the minute is carried by movement). Each push-in holds ≤ 8 s, then 3 s back at normal size, so no stretch is left longer than 5 s.
   node tools/gap_zooms.mjs data/specs/<p>.json [--write]   (run after writing_place --hold and grid_plan; coverage_check reads the same spans) */
import fs from "node:fs";
const specF = process.argv[2], WRITE = process.argv.includes("--write"), GAP = 5;
const spec = JSON.parse(fs.readFileSync(specF, "utf8"));
/* same span rule as coverage_check.mjs */
const span = (i) => { const a = i.at ?? i.from ?? i.oldAt ?? i.times?.[0]; if (a == null) return null; const b = i.until ?? i.to ?? (i.dur != null ? a + i.dur : a + 3); return [a, b]; };
const spans = [...spec.items.map(span).filter(Boolean), ...(spec.splits ?? []).map((s) => [s.from, s.to]), ...(spec.zooms ?? []).map((z) => [z.from, z.to + 1.2]), ...(spec.shake ?? []).map((z) => [z.from, z.to])].sort((a, b) => a[0] - b[0]);
const dur = spec.frames ? spec.frames / (spec.fps ?? 30) : Math.max(...spans.map((s) => s[1]));
const gaps = []; let end = 0;
for (const [a, b] of spans) { if (a - end > GAP) gaps.push([end, a]); end = Math.max(end, b); }
if (dur - 3 - end > GAP) gaps.push([end, dur - 3]);
const add = [];
for (const [a, b0] of gaps) {
  /* the zoom-out takes 1.2 s after \`to\`: the last push-in ends 1.3 s before the next element, so the face is back to size when a card appears */
  const end = b0 - 1.3; let t = a + 0.2;
  while (end - t >= 1.2) { const to = Math.min(t + 8, end); add.push({ from: +t.toFixed(2), to: +to.toFixed(2), amt: 0.06 }); t = to + 3; }
}
/* first minute: no moment > 0.3 s without an element (coverage 2b) — the small gaps there are joined into slow push-ins (one per stretch ≤ 6 s apart, ≥ 1.5 s long) */
{ const fg = []; let e = 0; const all = [...spans, ...add.map((z) => [z.from, z.to])].sort((x, y) => x[0] - y[0]);
  for (const [a, b] of all) { if (a >= 60) break; if (a - e > 0.3) fg.push([e, a]); e = Math.max(e, b); } if (e < 60 && 60 - e > 0.3) fg.push([e, 60]);
    /* a small gap is closed by letting the element that ends at its start stay until the next one (≤ 3.5 s more); a push-in only when none can */
  const HOLD = new Set(["tphoto", "pic", "torn", "scraps", "date", "flag", "news", "scholar", "verse", "rows", "note"]);   /* not pmap: its isolation window (matte) ends with it */
  for (const [a, b] of fg) { const prev = spec.items.filter((i) => HOLD.has(i.t) && span(i) && Math.abs(span(i)[1] - a) < 0.06).sort((x, y) => span(y)[1] - span(x)[1])[0];
    if (prev && b - a <= 3.5) { if (prev.until != null) prev.until = +(b - 0.2).toFixed(2); else if (prev.to != null) prev.to = +(b - 0.2).toFixed(2); continue;   /* grid_plan needs ≥ 0.15 s between two users of a slot; coverage allows ≤ 0.3 s */ }
    /* else a push-in that starts at the gap's end starts earlier (it moves the frame from the first instant) */
    const nz = (spec.zooms ?? []).find((z) => Math.abs(z.from - b) < 0.06);
    if (nz && b - a <= 3.5) { nz.from = +(a + 0.05).toFixed(2); continue; }
    if (b - a >= 2.6) add.push({ from: +a.toFixed(2), to: +(b - 1.3).toFixed(2), amt: 0.05 }); } }
console.log(`gap_zooms: ${gaps.length} فراغ ← ${add.length} تقريب بطيء`);
if (WRITE) { spec.zooms = [...(spec.zooms ?? []), ...add].sort((x, y) => x.from - y.from); fs.writeFileSync(specF, JSON.stringify(spec, null, 1)); }
