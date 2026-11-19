// Serves ONE folder on the local network for phones (2026-11-19): node tools/static_share.mjs <folder> [--port 8790]
// Prints the LAN address of the page list. Read-only; only files inside <folder> are served.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
const [folder = "public/dubkmr", ...rest] = process.argv.slice(2);
const port = Number(rest[rest.indexOf("--port") + 1] || 8790);
const root = path.resolve(folder);
const TYPE = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".mp4": "video/mp4", ".wav": "audio/wav", ".txt": "text/plain; charset=utf-8" };
http.createServer((req, res) => {
  const rel = decodeURIComponent((req.url || "/").split("?")[0]).replace(/^\/+/, "") || "translation.html";
  const file = path.resolve(root, rel);
  if (!file.startsWith(root + path.sep) && file !== root) { res.writeHead(403); return res.end("forbidden"); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { "content-type": "text/plain; charset=utf-8" }); return res.end("404"); }
    res.writeHead(200, { "content-type": TYPE[path.extname(file).toLowerCase()] || "application/octet-stream", "cache-control": "no-store" });
    res.end(data);
  });
}).listen(port, "0.0.0.0", () => {
  const ips = Object.values(os.networkInterfaces()).flat().filter((a) => a && a.family === "IPv4" && !a.internal).map((a) => a.address);
  console.log("serving " + root + " on port " + port);
  for (const ip of ips) console.log("http://" + ip + ":" + port + "/translation.html");
});
