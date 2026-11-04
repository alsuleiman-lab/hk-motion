// Stills of the Poison scenes (one bundle for all):  node tools/poison_stills.mjs "<CompId>:<frame>,<frame>" "<CompId2>:<frame>" …  → .tmp/poison/<id>_<frame>.png
import { bundle } from "@remotion/bundler";
import { selectComposition, renderStill } from "@remotion/renderer";
import fs from "node:fs";
import path from "node:path";
const jobs = process.argv.slice(2).map((a) => { const [id, fr] = a.split(":"); return { id, frames: fr.split(",").map(Number) }; });
if (!jobs.length) { console.error('usage: node tools/poison_stills.mjs "Poison-04-PLA2:140,400" …'); process.exit(2); }
fs.mkdirSync(".tmp/poison", { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), outDir: path.resolve(".tmp/poison/bundle") });
for (const j of jobs) {
  const composition = await selectComposition({ serveUrl, id: j.id, logLevel: "error" });
  for (const f of j.frames) {
    const output = `.tmp/poison/${j.id}_${f}.png`;
    await renderStill({ serveUrl, composition, frame: f, output, imageFormat: "png", logLevel: "error" });
    console.log(output);
  }
}
