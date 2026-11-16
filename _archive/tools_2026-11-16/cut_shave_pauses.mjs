// node tools/cut_shave_pauses.mjs <p>   — after a stage-cut audio_gate failure on pauses just over 0.40 s: shaves those joins in .tmp/<p>/vad.json (kept ranges)
// by (excess + 0.02 s) from the TAIL only (never closer than 0.02 s to the energy end). The onset side is never shaved (a word start must not be clipped, user 2026-11-06): what the tail cannot absorb is added to .tmp/<p>/keep_extra.txt (pause stays just over 0.40 s, exempted explicitly and reported). Then re-run `stage.mjs cut`.
import fs from "node:fs";
const p = process.argv[2], T = `.tmp/${p}`;
const log = fs.readFileSync(`${T}/stage_cut.log`, "utf8");
const line = [...log.matchAll(/سكتات > 0\.40ث: \d+ ((?:\[[0-9.]+ث ×[0-9.]+\] ?)+)/g)].pop();
if (!line) { console.log("no pause list"); process.exit(0); }
const ps = [...line[1].matchAll(/\[([0-9.]+)ث ×([0-9.]+)\]/g)].map((m) => [+m[1], +m[2]]).filter(([, d]) => d < 1.5);
const map = JSON.parse(fs.readFileSync(`public/${p}_map.json`, "utf8")).segments;
const o2s = (t) => { for (const g of map) { const d = g.b - g.a; if (t >= g.n - 1e-6 && t <= g.n + d + 1e-6) return g.a + (t - g.n); } };
const v = JSON.parse(fs.readFileSync(`${T}/vad.json`, "utf8")), sp = v.speech;
for (const [t, d] of ps) {
  const se = o2s(t); if (se == null) continue;
  let i = sp.findIndex((r) => r[1] >= se - 0.02 && r[1] < se + 0.7); if (i < 0 || i + 1 >= sp.length || se < sp[i][1] - 0.25 && sp[i][0] < se) {   // the pause sits INSIDE a kept range (a gap the cut audio shows longer than the source): split it, leaving ≈0.26 s
    const k = sp.findIndex((r) => r[0] < se && r[1] > se); if (k < 0) { console.log("no range for", t); continue; }
    const [x, y] = sp[k], g0 = se + 0.14, g1 = se + d - 0.12; if (g1 - g0 > 0.02) { sp.splice(k, 1, [x, +g0.toFixed(3)], [+g1.toFixed(3), y]); console.log(`pause ${t} ×${d} inside a range at src ${se.toFixed(2)}: split ${g0.toFixed(2)}–${g1.toFixed(2)}`); } continue; }
  const tail = sp[i][1] - se, onset = d - tail, excess = d - 0.40 + 0.02;
  const a = Math.min(excess, Math.max(0, tail - 0.02)); sp[i][1] = +(sp[i][1] - a).toFixed(3);
  const left = excess - a; if (left > 0.005) { const kf = `${T}/keep_extra.txt`, cur = fs.existsSync(kf) ? fs.readFileSync(kf, "utf8") : ""; fs.writeFileSync(kf, (cur ? cur + "," : "") + `${(se - 0.05).toFixed(2)}-${(se + 0.12).toFixed(2)}`); }
  console.log(`pause ${t} ×${d} src ${se.toFixed(2)}: tail ${tail.toFixed(2)} → shaved ${a.toFixed(2)}${left > 0.005 ? " · exempted (--keep) to protect the word start" : ""}`);
}
v.speech = sp; v.onset_fixed = true; fs.writeFileSync(`${T}/vad.json`, JSON.stringify(v));
