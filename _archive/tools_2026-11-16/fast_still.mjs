import { cachedServeUrl } from "./lib/cached_bundle.mjs";
const { openBrowser, renderStill, selectComposition } = await import("@remotion/renderer");
import fs from "node:fs";
import path from "node:path";

const argv = process.argv.slice(2);
const id = argv[0];
const frame = Number(argv[1] ?? 60);
const outPath = argv[2] ?? `stills/${id}_f${frame}.png`;

fs.mkdirSync(path.dirname(outPath), { recursive: true });

const { serveUrl } = await cachedServeUrl(id, { tag: "faststill" });
const port = 3455;
const gfxOnly = argv.includes("--gfx-only");
const hideGfx = argv.includes("--hide-gfx");
const inputProps = gfxOnly ? { gfxOnly: true } : hideGfx ? { hideGfx: true } : {};

const comp = await selectComposition({ serveUrl, id, inputProps, port });
const browser = await openBrowser("chrome", { chromiumOptions: { gl: "angle" } });

await renderStill({
  composition: comp,
  serveUrl,
  port,
  frame,
  output: outPath,
  scale: 1,
  inputProps,
  puppeteerInstance: browser,
  chromiumOptions: { gl: "angle" }
});

await browser.close({ silent: true }).catch(() => {});
console.log(`Rendered ${outPath} at frame ${frame}`);
