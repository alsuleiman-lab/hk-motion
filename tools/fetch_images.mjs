// One picture per name, fast (user 2026-10-27: «ويكيبيديا أولاً ثم أول نتيجة من صور جوجل»). No permanent library: files go to public/<p>/ and leave with the project.
//   node tools/fetch_images.mjs <p> "اسم 1" "اسم 2~كما نطقه" …   [--list file.txt (one name per line)] [--min 600]
// 1) Wikipedia (ar, then en through the language link when ar has no picture or a small one): ONE batched API call per 50 names
// 2) names still without a picture → Google Images through SerpAPI (key SERPAPI_API_KEY in .env, never printed): the FIRST result that is
//    ≥ --min px, not from a stock/AI site and whose title does not name a woman
// Writes public/<p>/img_<n>.<ext>, .tmp/<p>/images.json ({name, file, via, page, title, w, h}) and .tmp/<p>/images_sheet.jpg for one look; prints what is missing.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const argv = process.argv.slice(2);
const p = argv[0];
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : argv[i + 1]; };
const flagVals = new Set(["--list", opt("list", "\0"), "--min", opt("min", "\0")]);
let names = argv.slice(1).filter((a) => !flagVals.has(a));
if (opt("list", null)) names.push(...fs.readFileSync(opt("list"), "utf8").split(/\r?\n/).map((s) => s.trim()).filter(Boolean));
// «الاسم~كما نطقه~صيغة أخرى»: the lookup name, then how he says it (used by spec_draft.mjs to find the first mention)
const said = {};
names = [...new Set(names.map((n) => { const [k, ...al] = n.split("~").map((s) => s.trim()); said[k] = al.filter(Boolean); return k; }))];
if (!p || !names.length) { console.error('usage: node tools/fetch_images.mjs <p> "name" … [--list names.txt] [--min 600]'); process.exit(2); }
const MIN = Number(opt("min", 600));
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const env = (() => { try { return Object.fromEntries(fs.readFileSync(path.join(root, ".env"), "utf8").split(/\r?\n/).filter((l) => l.includes("=") && !l.startsWith("#")).map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])); } catch { return {}; } })();
const UA = { "User-Agent": "RemotionWorkspace/1.0 (educational video editing)" };
const outDir = path.join("public", p), T = path.join(".tmp", p);
fs.mkdirSync(outDir, { recursive: true }); fs.mkdirSync(T, { recursive: true });
const t0 = Date.now();

const wiki = async (lang, params) => {
  const u = new URL(`https://${lang}.wikipedia.org/w/api.php`);
  for (const [k, v] of Object.entries({ action: "query", format: "json", redirects: "1", ...params })) u.searchParams.set(k, v);
  const r = await fetch(u, { headers: UA }); return r.json();
};
/** {name → {page, src, w, h}} for the titles of one language; resolves redirects/normalisation back to the asked name */
const wikiImages = async (lang, titles) => {
  const res = {};
  for (let i = 0; i < titles.length; i += 50) {
    const batch = titles.slice(i, i + 50);
    const j = await wiki(lang, { titles: batch.join("|"), prop: "pageimages|pageprops|langlinks", piprop: "thumbnail|original", pithumbsize: "1600", ppprop: "disambiguation", lllang: "en", lllimit: "max" });
    const back = {}; for (const x of [...(j.query?.normalized ?? []), ...(j.query?.redirects ?? [])]) back[x.to] = back[x.from] ?? x.from;
    for (const pg of Object.values(j.query?.pages ?? {})) {
      const asked = back[pg.title] ?? pg.title;
      if (pg.missing !== undefined || pg.pageprops?.disambiguation !== undefined) continue;
      const im = pg.thumbnail ?? pg.original;   // ≤ 1600 px rendering: light to download, and SVG flags/maps come as PNG
      res[asked] = { page: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(pg.title)}`, src: im?.source ?? null, w: im?.width ?? 0, h: im?.height ?? 0, en: pg.langlinks?.[0]?.["*"] ?? null };
    }
  }
  return res;
};

const found = {};
// 1) Wikipedia ar → en
const ar = await wikiImages("ar", names);
const needEn = names.filter((n) => ar[n] && (!ar[n].src || ar[n].w < MIN) && ar[n].en);
const en = needEn.length ? await wikiImages("en", needEn.map((n) => ar[n].en)) : {};
for (const n of names) {
  const a = ar[n], e = a?.en ? en[a.en] : null;
  const best = [a, e].filter((x) => x?.src).sort((x, y) => y.w - x.w)[0];
  if (best && best.w >= Math.min(MIN, 300)) found[n] = { via: "wikipedia", page: best.page, url: best.src, w: best.w, h: best.h, title: n };
}

// 2) Google Images (SerpAPI) for the rest — first acceptable result
const BAD_SITE = /shutterstock|istockphoto|gettyimages|freepik|dreamstime|alamy|depositphotos|123rf|stock\.adobe|pinterest|lexica|midjourney|openart|playground|nightcafe|craiyon|pixai|tensor\.art/i;
const BAD_WORD = /\b(woman|women|girl|lady|female|actress|wife)\b|امرأة|نساء|فتاة|سيدة|زوجة|ممثلة|إعلامية/i;
const SOCIAL = /youtube\.com|youtu\.be|ytimg|facebook\.com|fbsbx|instagram\.com|twitter\.com|\/\/x\.com|tiktok\.com|threads\.net|t\.me\//i;
const rest = names.filter((n) => !found[n]);
let serpNote = "";
if (rest.length && !env.SERPAPI_API_KEY) serpNote = "SERPAPI_API_KEY missing in .env — Google step skipped";
else for (const n of rest) {
  const u = new URL("https://serpapi.com/search.json");
  // tbs itp:photo = photographs only (no drawings/clipart); social posts are often designed cards with text → used only when nothing else qualifies
  for (const [k, v] of Object.entries({ engine: "google_images", q: n, hl: "ar", tbs: "itp:photo", api_key: env.SERPAPI_API_KEY })) u.searchParams.set(k, v);
  let j; try { j = await (await fetch(u)).json(); } catch { continue; }
  if (j.error) { serpNote = `SerpAPI: ${j.error}`; break; }
  const ok = (j.images_results ?? []).filter((r) => (r.original_width ?? 0) >= MIN && !BAD_SITE.test(`${r.link} ${r.source}`) && !BAD_WORD.test(r.title ?? ""));
  const hit = ok.find((r) => !SOCIAL.test(`${r.link} ${r.source}`)) ?? ok[0];
  if (hit) found[n] = { via: "google", page: hit.link, url: hit.original, thumb: hit.thumbnail, w: hit.original_width, h: hit.original_height, title: hit.title };
}

// 3) download (original, else the thumbnail), keep jpg/png/webp, convert anything else to jpg
const list = [];
// never overwrite: numbering continues after the highest img_<n> already in the folder (2026-11-11: a second run overwrote img_7…img_11 used by the spec)
let k = Math.max(0, ...fs.readdirSync(outDir).map((f) => Number(f.match(/^img_(\d+)\./)?.[1] ?? 0)));
for (const n of names) {
  const f = found[n]; if (!f) continue;
  k++;
  let saved = null;
  for (const url of [f.url, f.thumb].filter(Boolean)) {
    try {
      const r = await fetch(url, { headers: { ...UA, Referer: f.page } });
      const ct = r.headers.get("content-type") ?? "";
      if (!r.ok || !ct.startsWith("image/")) continue;
      const buf = Buffer.from(await r.arrayBuffer()); if (buf.length < 4000) continue;
      const ext = ct.includes("png") ? "png" : ct.includes("webp") ? "webp" : ct.includes("jpeg") || ct.includes("jpg") ? "jpg" : "src";
      const file = path.join(outDir, `img_${k}.${ext === "src" ? "jpg" : ext}`);
      if (ext === "src") { const tmp = path.join(T, `img_${k}.bin`); fs.writeFileSync(tmp, buf); spawnSync("ffmpeg", ["-v", "error", "-y", "-i", tmp, file]); fs.rmSync(tmp, { force: true }); }
      else fs.writeFileSync(file, buf);
      if (fs.existsSync(file)) { saved = file; break; }
    } catch { /* next url */ }
  }
  if (saved) list.push({ name: n, said: said[n] ?? [], file: saved.replace(/\\/g, "/"), via: f.via, page: f.page, title: f.title, w: f.w, h: f.h });
}
// merged with the earlier runs (the spec and the requirements ledger read every picture ever fetched); "verified" is set by me after LOOKING at the picture
const prevList = (() => { try { return JSON.parse(fs.readFileSync(path.join(T, "images.json"), "utf8")); } catch { return []; } })();
fs.writeFileSync(path.join(T, "images.json"), JSON.stringify([...prevList.filter((x) => !list.some((y) => y.file === x.file)), ...list], null, 1));

// 4) one review sheet (name + source on each tile)
const sheet = path.join(T, "images_sheet.jpg");
if (list.length) {
  const cols = Math.min(5, list.length);
  const ins = list.flatMap((x) => ["-i", x.file]);
  const esc = (s) => String(s).replace(/[':\\%]/g, " ");
  const fc = list.map((x, i) => `[${i}:v]scale=360:300:force_original_aspect_ratio=decrease,pad=360:340:(ow-iw)/2:0:color=0x222222,drawtext=fontfile='C\\:/Windows/Fonts/arial.ttf':text='${i + 1} ${x.via}':x=6:y=312:fontsize=20:fontcolor=white[v${i}]`).join(";")
    + (list.length > 1 ? `;${list.map((_, i) => `[v${i}]`).join("")}xstack=inputs=${list.length}:layout=${list.map((_, i) => `${(i % cols) * 360}_${Math.floor(i / cols) * 340}`).join("|")}:fill=black[o]` : "");
  spawnSync("ffmpeg", ["-v", "error", "-y", ...ins, "-filter_complex", list.length > 1 ? fc : fc.replace("[v0]", "[o]"), "-map", "[o]", "-frames:v", "1", sheet]);
}
const missing = names.filter((n) => !list.find((x) => x.name === n));
console.log(`${list.length}/${names.length} pictures in ${((Date.now() - t0) / 1000).toFixed(1)} s (wikipedia ${list.filter((x) => x.via === "wikipedia").length}, google ${list.filter((x) => x.via === "google").length}) → ${path.join(T, "images.json")}${list.length ? `  sheet: ${sheet}` : ""}`);
list.forEach((x, i) => console.log(`  ${i + 1}. ${x.name} — ${x.via} ${x.w}×${x.h} → ${x.file}`));
if (missing.length) console.log(`missing: ${missing.join("، ")}`);
if (serpNote) console.log(serpNote);
