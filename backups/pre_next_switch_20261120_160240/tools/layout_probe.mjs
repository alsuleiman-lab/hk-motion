// فحص التخطيط الآلي للموشن التوضيحي المستقل (OUT/CLIP/SPILL/OVERLAP): يرندر لقطات ثابتة بخاصية qa=true فيطبع مكوّن QAProbe نتائجه.
//   node tools/layout_probe.mjs <CompositionId> [--frames 30,90,150 | --auto 8] [--props '{json}'] [--out <dir>] [--scale 0.5]
// الشرط: التركيبة تضع <QAProbe /> (src/ext/QAProbe.tsx) ووسمَ data-qa على كل ما يُقرأ. ينجح (الخروج 0) إن لم يظهر أي إخفاق.
// يعيد استعمال حزمة الكود المخزّنة (tools/lib/cached_bundle.mjs) فلا ينسخ public/.
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";
import path from "path";
import fs from "fs";
import os from "os";
import net from "node:net";
import { cachedServeUrl, privateTemp } from "./lib/cached_bundle.mjs";
privateTemp("layout_probe");

const argv = process.argv.slice(2);
const opt = (n, d) => (argv.includes("--" + n) ? argv[argv.indexOf("--" + n) + 1] : d);
const id = argv.find((a) => !a.startsWith("--") && !["--frames", "--auto", "--props", "--out", "--scale"].includes(argv[argv.indexOf(a) - 1]));
if (!id) { console.error("usage: node tools/layout_probe.mjs <CompositionId> [--frames a,b,c | --auto N] [--props json] [--out dir] [--scale 0.5]"); process.exit(2); }
const outDir = path.resolve(opt("out", `.tmp/layout_probe/${id}`));
fs.mkdirSync(outDir, { recursive: true });
const ENTRY = path.resolve(process.env.ENTRY ?? "src/index.ts");
const scale = Number(opt("scale", "0.5"));
const extra = (() => { try { return JSON.parse(opt("props", "{}")); } catch { return {}; } })();
const PROPS = { ...extra, qa: true };

const { serveUrl } = await cachedServeUrl(id, { tag: "layout_probe" });
const browser = await openBrowser("chrome", { chromiumOptions: { gl: "angle" }, logLevel: "error" });
const PORT = await (async () => { for (let p = 3501; p < 3560; p++) { const free = await new Promise((r) => { const sv = net.createServer().once("error", () => r(false)).once("listening", () => sv.close(() => r(true))).listen(p); }); if (free) return p; } return 3560; })();
const comp = await selectComposition({ serveUrl, id, port: PORT, puppeteerInstance: browser, inputProps: PROPS });

let frames;
if (opt("frames", "")) frames = opt("frames", "").split(",").map(Number);
else { const n = Number(opt("auto", "8")); frames = Array.from({ length: n }, (_, i) => Math.round(((i + 0.5) / n) * (comp.durationInFrames - 1))); }

const fails = [];
let checkedTotal = 0;
for (const fr of frames) {
  const lines = [];
  await renderStill({
    composition: comp, serveUrl, inputProps: PROPS, port: PORT, frame: fr,
    output: path.join(outDir, `f${String(fr).padStart(5, "0")}.png`), scale, puppeteerInstance: browser,
    onBrowserLog: (l) => { if (typeof l.text === "string" && l.text.startsWith("QA|")) lines.push(l.text); },
    timeoutInMilliseconds: 120000, chromiumOptions: { gl: "angle" },
  });
  for (const t of lines) {
    const [, f, code, item, detail] = t.split("|");
    if (code === "CHECKED") { checkedTotal += Number(item) || 0; continue; }
    fails.push({ frame: Number(f), code, item, detail });
  }
  console.log(`إطار ${fr}: ${lines.filter((x) => !x.includes("|CHECKED|")).length} إخفاق`);
  for (const d of fs.readdirSync(os.tmpdir())) if (/^remotion-v[\d.]+-assets/.test(d)) { try { fs.rmSync(path.join(os.tmpdir(), d), { recursive: true, force: true }); } catch { /* in use */ } }
}
await browser.close({ silent: true });
fs.writeFileSync(path.join(outDir, "report.json"), JSON.stringify({ id, frames, checkedTotal, fails }, null, 1));
if (!fails.length) { console.log(`✅ لا إخفاق في ${frames.length} لقطة (فُحص ${checkedTotal} عنصراً موسوماً). التقرير: ${path.join(outDir, "report.json")}`); process.exit(0); }
for (const f of fails) console.log(`❌ إطار ${f.frame}  ${f.code}  ${f.item}  ${f.detail}`);
console.log(`فشل: ${fails.length}`);
process.exit(1);
