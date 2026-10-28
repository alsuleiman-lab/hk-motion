// Download images from Wikimedia Commons (free licences) and log source+licence+author.
//   node tools/fetch_commons.mjs <outDir> "File:Title.jpg" [--w 2000] [--as name]  ...   (repeat groups with ::)
//   node tools/fetch_commons.mjs search "query"
import fs from "fs"; import path from "path";
const UA = { "User-Agent": "RemotionWorkspace/1.0 (educational video editing; contact: local)" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const API = "https://commons.wikimedia.org/w/api.php";
async function info(title, w) {
  const u = new URL(API); for (const [k, v] of Object.entries({ action: "query", titles: title, prop: "imageinfo", iiprop: "url|size|extmetadata", iiurlwidth: w, format: "json" })) u.searchParams.set(k, v);
  for (let k = 0; k < 8; k++) { const r = await fetch(u, { headers: UA }); const t = await r.text(); if (t.startsWith("{")) { const j = JSON.parse(t); const p = Object.values(j.query.pages)[0]; return p.imageinfo?.[0]; } await sleep(15000 * (k + 1)); } throw new Error("rate limited");
}
const [cmd, ...rest] = process.argv.slice(2);
if (cmd === "search") {
  const u = new URL(API); for (const [k, v] of Object.entries({ action: "query", generator: "search", gsrnamespace: 6, gsrlimit: 10, gsrsearch: rest[0], prop: "imageinfo", iiprop: "size|extmetadata", format: "json" })) u.searchParams.set(k, v);
  const j = await (await fetch(u, { headers: UA })).json();
  for (const x of Object.values(j.query?.pages ?? {})) { const i = x.imageinfo[0]; console.log(x.title, "|", i.width + "x" + i.height, "|", i.extmetadata.LicenseShortName?.value); }
} else {
  const out = cmd; fs.mkdirSync(out, { recursive: true });
  const logf = path.join(out, "sources.json"); const log = fs.existsSync(logf) ? JSON.parse(fs.readFileSync(logf, "utf8")) : [];
  for (const spec of rest.join(" ").split("::").map((s) => s.trim()).filter(Boolean)) {
    const m = spec.match(/^(.*?)(?:\s+--as\s+(\S+))?$/); const title = m[1].trim(), name = m[2];
    const i = await info(title, 2000); await sleep(1500);
    const url = i.thumburl || i.url; const ext = "jpg";
    const file = (name || title.replace(/^File:/, "").replace(/\W+/g, "_")) + "." + ext;
    let buf; for (let k = 0; k < 8; k++) { const r = await fetch(url, { headers: UA }); const b = Buffer.from(await r.arrayBuffer()); if (r.ok && b.length > 5000) { buf = b; break; } await sleep(15000 * (k + 1)); } if (!buf) throw new Error("download failed " + url); fs.writeFileSync(path.join(out, file), buf);
    const em = i.extmetadata; log.push({ file, title, page: i.descriptionurl, license: em.LicenseShortName?.value, author: (em.Artist?.value || "").replace(/<[^>]+>/g, "").trim(), bytes: buf.length });
    console.log("saved", file, buf.length, em.LicenseShortName?.value); await sleep(1500);
  }
  fs.writeFileSync(logf, JSON.stringify(log, null, 1));
}
