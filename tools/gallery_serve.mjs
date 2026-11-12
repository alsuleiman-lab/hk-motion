// Serves the LIVE elements gallery locally and keeps the user's marks/notes in a file Claude can read.
//   node tools/gallery_serve.mjs [port=5601]   → http://localhost:5601   (build first: node tools/gallery_build.mjs)
// GET /api/notes → data/gallery_notes.json ({ <element id>: { status: keep|change|drop|"", note, request?, at } });
// POST /api/notes {id, status?, note?, request?} merges one element. The page (src/gallery/GalleryApp.tsx) uses it when it is not inside claude.ai.
// Claude reads the notes with: node tools/gallery_serve.mjs --notes   (prints every marked element)
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve("scratch/gallery_site"), NOTES = path.resolve("data/gallery_notes.json");
const GRID = path.resolve("data/gallery_grid_saved.json");   // the grid tab's «احفظ» when served locally: { grids, notes, savedAt }
const readNotes = () => { try { return JSON.parse(fs.readFileSync(NOTES, "utf8")); } catch { return {}; } };
const normOne = (q = {}) => ({ ...(q.slot ? { slot: q.slot } : {}), dx: Math.round(q.dx ?? 0), dy: Math.round(q.dy ?? 0), scale: Math.round((q.scale ?? 1) * 100) / 100 });
export const normPlace = (p = {}) => ({ land: normOne(p.land), port: normOne(p.port) });
if (process.argv.includes("--normalize")) {   // rewrite every element's place complete and rounded
  const n = readNotes(); for (const v of Object.values(n)) v.place = normPlace(v.place);
  fs.writeFileSync(NOTES, JSON.stringify(n, null, 1)); console.log("gallery_notes: place normalized for", Object.keys(n).length, "elements"); process.exit(0);
}

if (process.argv.includes("--notes")) {
  const n = readNotes(), L = { keep: "أبقِه", change: "عدّله", drop: "احذفه" };
  const rows = Object.entries(n).filter(([, v]) => v.status || v.note || v.when || v.place?.dx || v.place?.dy || v.place?.scale || v.place?.land || v.place?.port).map(([id, v]) => `${id}: ${L[v.status] ?? "-"}${v.note ? " — " + v.note : ""}${v.request ? " [طلب: " + v.request + "]" : ""}${v.when ? " | متى يُستعمل: " + v.when : ""}${v.place ? " | مكانه وحجمه: " + JSON.stringify(v.place) : ""}`);
  if (fs.existsSync(GRID)) rows.push("الشبكة: محفوظة في data/gallery_grid_saved.json (" + JSON.parse(fs.readFileSync(GRID, "utf8")).savedAt + ")");
  console.log(rows.length ? rows.join("\n") : "لا ملاحظات بعد");
  process.exit(0);
}

const port = Number(process.argv[2]) || 5601;
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".mp4": "video/mp4", ".webm": "video/webm",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml", ".webp": "image/webp", ".ttf": "font/ttf", ".woff2": "font/woff2" };

http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  if (url.pathname === "/api/grid") {
    if (req.method === "GET") { res.writeHead(fs.existsSync(GRID) ? 200 : 404, { "Content-Type": MIME[".json"], "Cache-Control": "no-store" }); res.end(fs.existsSync(GRID) ? fs.readFileSync(GRID) : "{}"); return; }
    if (req.method === "POST") {
      let body = "";
      req.on("data", (c) => { body += c; if (body.length > 1e6) req.destroy(); });
      req.on("end", () => { try { const d = JSON.parse(body); fs.writeFileSync(GRID, JSON.stringify({ grids: d.grids, notes: d.notes, savedAt: new Date().toISOString() }, null, 1)); res.writeHead(200, { "Content-Type": MIME[".json"] }); res.end("{}"); } catch { res.writeHead(400); res.end(); } });
      return;
    }
    res.writeHead(405); res.end(); return;
  }
  // a temporary choice page (scratch/choose_page, user 2026-11-12): GET /choose/… serves it, POST /api/choice saves his picks to data/choice_pick.json
  if (url.pathname.startsWith("/choose/")) {
    const f = path.resolve("scratch/choose_page", "." + decodeURIComponent(url.pathname.slice(7) || "/index.html").replace(/^\/$/, "/index.html"));
    if (!f.startsWith(path.resolve("scratch/choose_page")) || !fs.existsSync(f) || !fs.statSync(f).isFile()) { res.writeHead(404); res.end("not found"); return; }
    res.writeHead(200, { "Content-Type": MIME[path.extname(f).toLowerCase()] ?? "application/octet-stream", "Cache-Control": "no-store" }); fs.createReadStream(f).pipe(res); return;
  }
  if (url.pathname === "/api/choice" && req.method === "POST") {
    let body = ""; req.on("data", (c) => { body += c; if (body.length > 1e6) req.destroy(); });
    req.on("end", () => { try { const d = JSON.parse(body); fs.writeFileSync(path.resolve("data/choice_pick.json"), JSON.stringify({ ...d, savedAt: new Date().toISOString() }, null, 1)); res.writeHead(200, { "Content-Type": MIME[".json"] }); res.end("{}"); } catch { res.writeHead(400); res.end(); } });
    return;
  }
  if (url.pathname === "/api/notes") {
    if (req.method === "GET") { res.writeHead(200, { "Content-Type": MIME[".json"], "Cache-Control": "no-store" }); res.end(JSON.stringify(readNotes())); return; }
    if (req.method === "POST") {
      let body = "";
      req.on("data", (c) => { body += c; if (body.length > 1e6) req.destroy(); });
      req.on("end", () => {
        try {
          const { id, ...v } = JSON.parse(body);
          if (!id || typeof id !== "string") throw new Error("id");
          const n = readNotes();
          // the place is kept complete and exact (user 2026-11-10): both orientations always present, dx/dy whole px, scale 2 decimals; a save of one orientation never drops the other
          if (v.place) v.place = normPlace({ ...(n[id]?.place ?? {}), ...Object.fromEntries(Object.entries(v.place).filter(([, q]) => q)) });
          n[id] = { ...n[id], ...v, at: Date.now() };
          fs.mkdirSync(path.dirname(NOTES), { recursive: true });
          fs.writeFileSync(NOTES, JSON.stringify(n, null, 1));
          res.writeHead(200, { "Content-Type": MIME[".json"] }); res.end("{}");
        } catch { res.writeHead(400); res.end(); }
      });
      return;
    }
    res.writeHead(405); res.end(); return;
  }
  const rel = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const file = path.resolve(ROOT, "." + rel);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end("not found"); return; }
  const size = fs.statSync(file).size, type = MIME[path.extname(file).toLowerCase()] ?? "application/octet-stream";
  const m = /bytes=(\d*)-(\d*)/.exec(req.headers.range ?? "");
  if (m) {   // video needs byte ranges
    const a = m[1] ? Number(m[1]) : Math.max(0, size - Number(m[2])), b = m[1] && m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
    res.writeHead(206, { "Content-Type": type, "Content-Range": `bytes ${a}-${b}/${size}`, "Accept-Ranges": "bytes", "Content-Length": b - a + 1 });
    fs.createReadStream(file, { start: a, end: b }).pipe(res);
  } else {
    res.writeHead(200, { "Content-Type": type, "Content-Length": size, "Accept-Ranges": "bytes", "Cache-Control": "no-cache" });
    fs.createReadStream(file).pipe(res);
  }
}).listen(port, () => console.log(`gallery: http://localhost:${port}  (notes → ${path.relative(process.cwd(), NOTES)})`));
