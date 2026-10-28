// Cut ranges the user marked on the Remotion TIMELINE (final-video seconds) — no manual conversion needed.
//   node tools/cut_at.mjs live "31.2-33.0" ["40-41" ...]
// 1) converts timeline times -> source times (public/<name>_map.json)   2) adds them to public/<name>_cuts.json (persistent)
// 3) re-cuts with VAD + silence shortening into a NEW versioned file (never overwrite a file Studio has open)   4) re-times all elements and updates the composition.
import { execFileSync } from "child_process";
import fs from "fs";
const [name, ...ranges] = process.argv.slice(2);
const cfg = JSON.parse(fs.readFileSync(`public/${name}_config.json`, "utf8")); // {source, tsx, vad, min, keep, version}
const map = JSON.parse(fs.readFileSync(`public/${name}_map.json`, "utf8")).segments;
const rev = (n) => { for (const s of map) if (n >= s.n - 1e-6 && n <= s.n + (s.b - s.a) + 1e-6) return +(s.a + (n - s.n)).toFixed(2); return null; };
// Snap rough marks to real speech boundaries (Silero VAD): the user's in/out points need not be precise.
const vad = cfg.vad ? JSON.parse(fs.readFileSync(cfg.vad, "utf8")).speech : [];
const nearest = (t, edges, lim) => { let best = null; for (const e of edges) if (Math.abs(e - t) <= lim && (best == null || Math.abs(e - t) < Math.abs(best - t))) best = e; return best ?? t; };
const startEdges = vad.map((v) => v[1]); // a cut should START right after speech ends (start of a pause)
const endEdges = vad.map((v) => v[0]);   // and END right before the next speech begins
const dry = ranges.includes("--dry");
const cuts = JSON.parse(fs.readFileSync(`public/${name}_cuts.json`, "utf8"));
for (const r of ranges.filter((x) => x !== "--dry")) { const [a, b] = r.split("-").map(parseFloat); let sa = rev(a), sb = rev(b); if (sa == null || sb == null) throw new Error(`range ${r} is outside the video`); const ra = sa, rb = sb; sa = +nearest(sa, startEdges, 0.45).toFixed(2); sb = +nearest(sb, endEdges, 0.45).toFixed(2); cuts.push(`${sa}-${sb}`); console.log(`timeline ${r} -> source ${ra}-${rb}  (snapped to speech boundaries: ${sa}-${sb})`); }
if (dry) process.exit(0);
fs.writeFileSync(`public/${name}_cuts.json`, JSON.stringify(cuts));
fs.copyFileSync(`public/${name}_map.json`, `public/${name}_map_prev.json`);
const args = ["tools/auto_cut.mjs", cfg.source, name, "--min", String(cfg.min), "--keep", String(cfg.keep)];
if (cfg.vad) args.push("--vad", cfg.vad);
for (const c of cuts) args.push("--cut", c);
execFileSync("node", args, { stdio: "inherit" });
cfg.version += 1; const out = `${name}_cut_v${cfg.version}.mp4`;
fs.copyFileSync(`public/${name}_cut.mp4`, `public/${out}`); fs.rmSync(`public/${name}_cut.mp4`);
let tsx = fs.readFileSync(cfg.tsx, "utf8");
{ const key = 'staticFile("' + name + '_cut'; const a = tsx.indexOf(key); if (a < 0) throw new Error("staticFile(" + name + "_cut...) not found in " + cfg.tsx); const b = tsx.indexOf('"', a + 'staticFile("'.length); tsx = tsx.slice(0, a) + 'staticFile("' + out + tsx.slice(b); }
fs.writeFileSync(cfg.tsx, tsx);
execFileSync("node", ["tools/remap_beats.cjs"], { stdio: "inherit", env: { ...process.env, CUT_SRC: cfg.source, CUT_TSX: cfg.tsx, CUT_NAME: name } });
fs.writeFileSync(`public/${name}_config.json`, JSON.stringify(cfg, null, 1));
console.log("done ->", out, "(reload the Studio page)");
