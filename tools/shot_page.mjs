// Screenshot the top of a news page (proof image for a news item). node tools/shot_page.mjs <url> <out.png> [width=1000] [height=1400]
import { openBrowser } from "@remotion/renderer";
const [url, out, W = "1000", H = "1400"] = process.argv.slice(2);
const browser = await openBrowser("chrome", { chromiumOptions: { gl: "angle" }, viewport: { width: Number(W), height: Number(H), deviceScaleFactor: 1 } });
const page = await browser.newPage({ context: undefined, logLevel: "error", indent: false, pageIndex: 0, onBrowserLog: null, onLog: () => {} });
await page.setViewport({ width: Number(W), height: Number(H), deviceScaleFactor: 1 });
await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36");
try { await page.goto(url, { waitUntil: "networkidle2", timeout: 45000 }); } catch (e) { console.log("goto:", String(e).slice(0, 120)); }
await new Promise((r) => setTimeout(r, 2500));
await page.screenshot({ path: out });
console.log("saved", out, await page.title());
await browser.close();
