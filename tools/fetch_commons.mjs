// Download images from Wikimedia Commons (free licences) and log source+licence+author.
//   node tools/fetch_commons.mjs <outDir> "File:Title.jpg" [--w 2000] [--as name]  ...   (repeat groups with ::)
//   node tools/fetch_commons.mjs search "query"
import fs from "fs"; import path from "path";
const UA = { "User-Agent": "RemotionWorkspace/1.0 (educational video editing; contact: local)" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const API = "https://commons.wikimedia.org/w/api.php";
// (user 2026-11-18, rules review, s9) every request has a timeout (60 s); "429" / "too many requests" / a non-JSON rate-limit page → wait (Retry-After, else 15 s,
// 45 s) and retry, 3 tries in all; the source log (sources.json: file, page, licence, author) is saved after EVERY picture and a re-fetched file replaces its row.
const TIMEOUT = 60000;
const get = async (url, ok) => {
  for (let k = 1; ; k++) {
    let r = null, busy = true;
    try { r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(TIMEOUT) }); busy = r.status === 429 || !(await ok(r.clone())); } catch (e) { if (k >= 3) throw e; }
    if (!busy) return r;
    if (k >= 3) throw new Error(`too many requests / no usable answer after 3 tries: ${url}`);
    const wait = Math.min(120, Number(r?.headers.get("retry-after")) || 15 * 3 ** (k - 1));
    console.log(`  … ${new URL(url).host}: busy — waiting ${wait} s (try ${k + 1}/3)`); await sleep(wait * 1000);
  }
};
const isJson = async (r) => { const t = await r.text(); return t.startsWith("{") && !/too many requests/i.test(t.slice(0, 400)); };
async function info(title, w) {
  const u = new URL(API); for (const [k, v] of Object.entries({ action: "query", titles: title, prop: "imageinfo", iiprop: "url|size|extmetadata", iiurlwidth: w, format: "json" })) u.searchParams.set(k, v);
  const j = await (await get(u, isJson)).json(); const p = Object.values(j.query.pages)[0]; return p.imageinfo?.[0];
}
const [cmd, ...rest] = process.argv.slice(2);
if (cmd === "search") {
  const u = new URL(API); for (const [k, v] of Object.entries({ action: "query", generator: "search", gsrnamespace: 6, gsrlimit: 10, gsrsearch: rest[0], prop: "imageinfo", iiprop: "size|extmetadata", format: "json" })) u.searchParams.set(k, v);
  const j = await (await get(u, isJson)).json();
  for (const x of Object.values(j.query?.pages ?? {})) { const i = x.imageinfo[0]; console.log(x.title, "|", i.width + "x" + i.height, "|", i.extmetadata.LicenseShortName?.value); }
} else {
  const out = cmd; fs.mkdirSync(out, { recursive: true });
  const logf = path.join(out, "sources.json"); const log = fs.existsSync(logf) ? JSON.parse(fs.readFileSync(logf, "utf8")) : [];
  for (const spec of rest.join(" ").split("::").map((s) => s.trim()).filter(Boolean)) {
    const m = spec.match(/^(.*?)(?:\s+--as\s+(\S+))?$/); const title = m[1].trim(), name = m[2];
    const i = await info(title, 2000); await sleep(1500);
    const url = i.thumburl || i.url; const ext = "jpg";
    const file = (name || title.replace(/^File:/, "").replace(/\W+/g, "_")) + "." + ext;
    const r = await get(url, async (x) => x.ok && (await x.arrayBuffer()).byteLength > 5000); const buf = Buffer.from(await r.arrayBuffer()); fs.writeFileSync(path.join(out, file), buf);
    const em = i.extmetadata; const row = { file, title, via: "commons", page: i.descriptionurl, license: em.LicenseShortName?.value || "unknown", author: (em.Artist?.value || "").replace(/<[^>]+>/g, "").trim() || "unknown", src: url, bytes: buf.length, fetched: new Date().toISOString().slice(0, 10) };
    const at = log.findIndex((x) => x.file === file); if (at >= 0) log[at] = row; else log.push(row);
    fs.writeFileSync(logf, JSON.stringify(log, null, 1));   // after every picture: a later failure keeps the earlier rows (user 2026-11-18, rules review)
    console.log("saved", file, buf.length, em.LicenseShortName?.value); await sleep(1500);
  }
  fs.writeFileSync(logf, JSON.stringify(log, null, 1));
}
