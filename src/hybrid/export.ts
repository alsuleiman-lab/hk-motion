import fs from "fs";
import { frameSpec, frameSpecP, frameSpecShort } from "./geom";
import { SHORT_FRAMES, SHORT_SEGS } from "../tirShort";
import { TIR_CUT_SECONDS } from "../tirTime";
import { BEHIND } from "../tirData";
import { SFX_LEVELS, WHOOSH_EVERY } from "../sfxConfig";

/** node .tmp/export.cjs <out.json> <startFrame> <endFrame> <clipDims.json>  — writes the per-frame geometry for the GPU compositor. */
const [out, a, b, dimsPath, orient] = process.argv.slice(2);
const clips = JSON.parse(fs.readFileSync(dimsPath, "utf8"));
const SHORT = String(orient).startsWith("short");
const PORT = String(orient).endsWith("portrait");
const total = SHORT ? SHORT_FRAMES : Math.ceil(TIR_CUT_SECONDS * 30);
const start = Number(a || 0), end = Math.min(Number(b || total - 1), total - 1);
const frames = [];
for (let f = start; f <= end; f++) frames.push(SHORT ? frameSpecShort(f, clips, PORT) : PORT ? frameSpecP(f, clips) : frameSpec(f, clips));
const sfx0 = BEHIND.filter((_, i) => i % WHOOSH_EVERY === 0).map((k) => ({ at: k.t, vol: SFX_LEVELS.whoosh }));
// in the short, an effect keeps its place relative to the piece it belongs to
const sfx = SHORT ? sfx0.flatMap((x) => { const f0 = x.at * 30; const g = SHORT_SEGS.find((s) => f0 >= s.a - 6 && f0 < s.a + s.n); return g ? [{ at: (g.s + (f0 - g.a)) / 30, vol: x.vol }] : []; }) : sfx0;
fs.writeFileSync(out, JSON.stringify({ start, end, total, frames, sfx, segs: SHORT ? SHORT_SEGS : null }));
console.log("exported", frames.length, "frames");
