// Free stock B-roll from Pixabay (API key in .env as PIXABAY_API_KEY — never print it).
//
//   node tools/fetch_broll.mjs search "yoga meditation" [--type video|photo] [--n 12] [--sheet out/sheet.html]
//   node tools/fetch_broll.mjs get <id> --type video [--size large|medium|small] [--name my_clip]
//
// Rules of this workspace: show candidates and wait for approval BEFORE `get`; inspect every file at full size for
// women (forbidden) and blur faces with tools/blur_faces.py when the subject is general (not a named person).
// Downloads go to public/stock/ and every download is logged to public/stock/sources.json (licence: Pixabay Content Licence).
import fs from "fs";
import path from "path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const env = Object.fromEntries(
  fs.readFileSync(path.join(root, ".env"), "utf8").split(/\r?\n/).filter((l) => l.includes("=") && !l.startsWith("#")).map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const KEY = env.PIXABAY_API_KEY;
if (!KEY) throw new Error("PIXABAY_API_KEY missing in .env");

const [cmd, arg, ...rest] = process.argv.slice(2);
const flag = (n, d) => { const i = rest.indexOf("--" + n); return i >= 0 ? rest[i + 1] : d; };
const type = flag("type", "video");
const base = type === "video" ? "https://pixabay.com/api/videos/" : "https://pixabay.com/api/";

const call = async (params) => {
  const u = new URL(base);
  u.searchParams.set("key", KEY);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  const r = await fetch(u);
  if (!r.ok) throw new Error(`Pixabay ${r.status}: ${(await r.text()).slice(0, 200).replace(KEY, "***")}`);
  return r.json();
};
const thumb = (h) => (type === "video" ? (h.videos?.medium?.thumbnail ?? h.videos?.small?.thumbnail) : h.webformatURL);

if (cmd === "search") {
  const j = await call({ q: arg, per_page: flag("n", 12), safesearch: "true", ...(type === "photo" ? { image_type: "photo" } : {}) });
  console.log(`total ${j.totalHits}`);
  const rows = j.hits.map((h) => ({ id: h.id, dur: h.duration, tags: h.tags, user: h.user, page: h.pageURL, thumb: thumb(h), size: h.videos?.medium?.size, wh: h.videos ? `${h.videos.large.width}x${h.videos.large.height}` : `${h.imageWidth}x${h.imageHeight}` }));
  rows.forEach((r, i) => console.log(`${i}. id=${r.id} ${r.dur ? r.dur + "s " : ""}${r.wh} | ${r.tags} | by ${r.user}`));
  const sheet = flag("sheet");
  if (sheet) {
    fs.mkdirSync(path.dirname(sheet), { recursive: true });
    fs.writeFileSync(sheet, `<body style="background:#222;color:#fff;font:12px sans-serif">${rows.map((r, i) => `<div style="display:inline-block;width:320px;margin:4px;vertical-align:top"><img src="${r.thumb}" width="320"><br><b>#${i} id=${r.id}</b> ${r.dur ?? ""}s<br>${r.tags}</div>`).join("")}</body>`);
    console.log("sheet:", sheet);
  }
} else if (cmd === "get") {
  const j = await call({ id: arg });
  const h = j.hits[0];
  if (!h) throw new Error("not found");
  const size = flag("size", "large");
  const url = type === "video" ? h.videos[size]?.url || h.videos.medium.url : h.largeImageURL;
  const ext = type === "video" ? "mp4" : "jpg";
  const name = flag("name", `pixabay_${h.id}`);
  const out = path.join(root, "public", "stock");
  fs.mkdirSync(out, { recursive: true });
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
  fs.writeFileSync(path.join(out, `${name}.${ext}`), buf);
  const logf = path.join(out, "sources.json");
  const log = fs.existsSync(logf) ? JSON.parse(fs.readFileSync(logf, "utf8")) : [];
  log.push({ file: `${name}.${ext}`, id: h.id, user: h.user, page: h.pageURL, tags: h.tags, licence: "Pixabay Content Licence" });
  fs.writeFileSync(logf, JSON.stringify(log, null, 1));
  console.log(`saved public/stock/${name}.${ext} (${(buf.length / 1048576).toFixed(1)} MB)`);
} else {
  console.log("usage: search <query> | get <id>");
}
