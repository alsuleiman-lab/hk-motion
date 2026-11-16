// The TWO-SCREEN preview server (user 2026-11-16: «الطولي شاشة والعرضي شاشة داخل الواجهة»).
//   node tools/dual_serve.mjs [port=3101]   → http://localhost:3101/?spec=<id>   (<id> = data/specs/<id>.json)
// Serves src/dual/DualApp.tsx (two real Remotion players, portrait + landscape, one transport bar) bundled by esbuild on demand (rebuilt when any src file changed),
// the live spec file (/spec/<id>.json, polled by the page: one edit shows in both screens), and public/ as the static root (videos with Range, so seeking works;
// the Studio's light copies are swapped in by src/studioProxy.ts exactly as in the Studio). Local only (127.0.0.1). The Studio's «<Id>-Both» composition
// shows this page inside its canvas area, so it must be running: tools/dual_serve.mjs is started with the Studio (npm run dev → predev) or by hand.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { build } from "esbuild";

process.chdir(path.resolve(import.meta.dirname, ".."));
const port = Number(process.argv[2]) || 3101;
try { (await import("node:os")).setPriority(process.pid, 10); } catch { /* best effort */ }
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".mp4": "video/mp4", ".m4a": "audio/mp4", ".mp3": "audio/mpeg", ".wav": "audio/wav", ".webm": "video/webm",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml", ".webp": "image/webp", ".gif": "image/gif", ".ttf": "font/ttf", ".otf": "font/otf", ".woff2": "font/woff2", ".woff": "font/woff" };
const HTML = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>الطولي والعرضي معاً</title><style>html,body,#root{margin:0;height:100%;background:#0b0d12}</style>
<script>window.remotion_staticBase = ""; window.remotion_inputProps = "{}"; window.process = window.process || { env: {} };</script></head><body><div id="root"></div><script src="/dual.js"></script></body></html>`;

const newest = (d) => { let m = 0; for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); m = Math.max(m, e.isDirectory() ? newest(p) : fs.statSync(p).mtimeMs); } return m; };
let cache = { at: 0, code: "", err: "" }, building = null;
const bundle = async () => {
  const stamp = Math.max(newest("src"), fs.statSync(path.join("data", "preview_proxies.json")).mtimeMs);
  if (cache.code && cache.at >= stamp) return cache;
  building ??= build({ entryPoints: ["src/dual/DualApp.tsx"], bundle: true, minify: false, format: "iife", platform: "browser", target: "es2020", write: false, jsx: "automatic", loader: { ".json": "json" },
    define: { "process.env.NODE_ENV": '"development"' }, logLevel: "silent" })
    .then((r) => (cache = { at: stamp, code: r.outputFiles[0].text, err: "" }), (e) => (cache = { ...cache, err: String(e.message ?? e) }))
    .finally(() => { building = null; });
  await building; return cache;
};

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://x"), p = decodeURIComponent(url.pathname);
    const send = (code, type, body, extra = {}) => { res.writeHead(code, { "Content-Type": type, "Cache-Control": "no-store", ...extra }); res.end(body); };
    if (p === "/" || p === "/index.html") return send(200, MIME[".html"], HTML);
    if (p === "/dual.js") { const b = await bundle(); return b.code ? send(200, MIME[".js"], b.code) : send(500, "text/plain; charset=utf-8", `خطأ بالبناء:\n${b.err}`); }
    const sm = p.match(/^\/spec\/([A-Za-z0-9_.-]+)\.json$/);
    if (sm) { const f = path.join("data", "specs", `${sm[1]}.json`); return fs.existsSync(f) ? send(200, MIME[".json"], fs.readFileSync(f)) : send(404, "text/plain", "no spec"); }
    const f = path.resolve("public", "." + p);
    if (!f.startsWith(path.resolve("public") + path.sep) || !fs.existsSync(f) || !fs.statSync(f).isFile()) return send(404, "text/plain", "not found");
    const size = fs.statSync(f).size, type = MIME[path.extname(f).toLowerCase()] ?? "application/octet-stream", rg = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? "");
    if (rg) {
      const a = rg[1] === "" ? Math.max(0, size - Number(rg[2])) : Number(rg[1]), b = rg[1] === "" || rg[2] === "" ? size - 1 : Math.min(size - 1, Number(rg[2]));
      res.writeHead(206, { "Content-Type": type, "Content-Range": `bytes ${a}-${b}/${size}`, "Accept-Ranges": "bytes", "Content-Length": b - a + 1, "Cache-Control": "public, max-age=3600" });
      return fs.createReadStream(f, { start: a, end: b }).pipe(res);
    }
    res.writeHead(200, { "Content-Type": type, "Accept-Ranges": "bytes", "Content-Length": size, "Cache-Control": "public, max-age=3600" });
    fs.createReadStream(f).pipe(res);
  } catch (e) { res.writeHead(500); res.end(String(e)); }
}).listen(port, "127.0.0.1", () => console.log(`dual_serve: http://localhost:${port}/?spec=<id>`));
