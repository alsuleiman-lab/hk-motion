// node scratch/lab_probe/stills.mjs [id ...]  → scratch/lab_probe/out/<o>_<id>.jpg (frame = the element's still), then contact sheets per section
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import fs from "node:fs";
import path from "node:path";

const OUT = "scratch/lab_probe/out";
fs.mkdirSync(OUT, { recursive: true });
const lab = JSON.parse(fs.readFileSync("data/elements_lab.json", "utf8"));
const only = process.argv.slice(2);
const list = lab.filter((m) => !only.length || only.includes(m.id));
const serveUrl = await bundle({ entryPoint: path.resolve("scratch/lab_probe/index.tsx"), publicDir: path.resolve("public") });
const t0 = Date.now();
for (const m of list) for (const o of ["land", "port"]) {
  if (m.orient && m.orient !== "both" && m.orient !== o) continue;
  const id = o === "land" ? "LabLand" : "LabPort";
  const inputProps = { id: m.id };
  try {
    const comp = await selectComposition({ serveUrl, id, inputProps, port: 3197 });
    await renderStill({ composition: comp, serveUrl, inputProps, frame: m.id in { PaperCover: 1 } ? 20 : (m.still ?? 72), output: path.join(OUT, `${o}_${m.id}.jpg`), imageFormat: "jpeg", jpegQuality: 80, scale: o === "land" ? 0.4 : 0.3, timeoutInMilliseconds: 60000, port: 3197 });
  } catch (e) { console.log("✘", o, m.id, String(e).slice(0, 1500)); }
}
console.log(`stills: ${list.length} elements in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
