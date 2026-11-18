// One picture per name, fast (user 2026-10-27: «ويكيبيديا أولاً ثم أول نتيجة من صور جوجل»). No permanent library: files go to public/<p>/ and leave with the project.
//   node tools/fetch_images.mjs <p> "اسم 1" "اسم 2~كما نطقه" …   [--list file.txt (one name per line)] [--min 600]
// 1) Wikipedia (ar, then en through the language link when ar has no picture or a small one): ONE batched API call per 50 names
// 2) names still without a picture → Google Images through SerpAPI (key SERPAPI_API_KEY in .env, never printed): the FIRST result that is
//    ≥ --min px, not from a stock/AI site and whose title does not name a woman
//    → when Google is not available (no key, or the plan's searches ran out), the same ordinary search a browser does, no key and no credit
//      (user 2026-11-18: «ابحث عن خدمات بديلة أو استخدم البحث العادي من خلال متصفح»): DuckDuckGo images (photos only, with sizes), then Bing images
// Writes public/<p>/img_<n>.<ext>, .tmp/<p>/images.json ({name, file, via, page, title, w, h, license, author}) and .tmp/<p>/images_sheet.jpg for one look; prints what is missing.
// (user 2026-11-18, rules review, s9):
//   - every request has a timeout (--timeout s, default 30); "429" / "too many requests" → wait (Retry-After, else 5 s, 15 s) and retry, 3 tries in all;
//   - public/<p>/sources.json (one per folder, merged by file, same shape as tools/fetch_commons.mjs): file, name, via, page, license, author, src, fetched;
//   - a PERSON photo must show a face (OpenCV YuNet .tmp/models/yunet.onnx, as tools/blur_faces_video.py): person = Wikidata «instance of human» for a Wikipedia
//     hit, or every name with --people; a picture without a face is dropped and the next candidate (Google) is tried, at most --tries per name (default 4).
//     No model / no OpenCV → the check is skipped with a warning. --no-face turns it off.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const argv = process.argv.slice(2);
const p = argv[0];
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : argv[i + 1]; };
const flagVals = new Set(["--list", opt("list", "\0"), "--min", opt("min", "\0"), "--timeout", opt("timeout", "\0"), "--tries", opt("tries", "\0"), "--people", "--no-face"]);
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
const TIMEOUT = Number(opt("timeout", 30)) * 1000, TRIES = Math.max(1, Number(opt("tries", 4))), PEOPLE = argv.includes("--people");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
/** fetch with a per-request timeout; "429" / "too many requests" → wait and retry with backoff, 3 tries in all (user 2026-11-18, rules review, s9) */
const get = async (url, init = {}) => {
  for (let k = 1; ; k++) {
    const r = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT) });
    const ct = r.headers.get("content-type") ?? "";
    const body = !r.ok && !ct.startsWith("image/") ? await r.clone().text().catch(() => "") : "";
    if (/run out of searches|out of credits|quota/i.test(body)) return r;   // an exhausted plan (SerpAPI answers 429 too): waiting will not help
    const busy = r.status === 429 || /too many requests/i.test(body);
    if (!busy) return r;
    if (k >= 3) { console.log(`  ⚠ still "too many requests" after 3 tries: ${new URL(url).host}`); return r; }
    const wait = Math.min(60, Number(r.headers.get("retry-after")) || 5 * 3 ** (k - 1));
    console.log(`  … ${new URL(url).host} says too many requests — waiting ${wait} s (try ${k + 1}/3)`);
    await sleep(wait * 1000);
  }
};

const wiki = async (lang, params) => {
  const u = new URL(`https://${lang}.wikipedia.org/w/api.php`);
  for (const [k, v] of Object.entries({ action: "query", format: "json", redirects: "1", ...params })) u.searchParams.set(k, v);
  const r = await get(u, { headers: UA }); return r.json();
};
/** {name → {page, src, w, h}} for the titles of one language; resolves redirects/normalisation back to the asked name */
const wikiImages = async (lang, titles) => {
  const res = {};
  for (let i = 0; i < titles.length; i += 50) {
    const batch = titles.slice(i, i + 50);
    const j = await wiki(lang, { titles: batch.join("|"), prop: "pageimages|pageprops|langlinks", piprop: "thumbnail|original|name", pithumbsize: "1600", ppprop: "disambiguation|wikibase_item", lllang: "en", lllimit: "max" });
    const back = {}; for (const x of [...(j.query?.normalized ?? []), ...(j.query?.redirects ?? [])]) back[x.to] = back[x.from] ?? x.from;
    for (const pg of Object.values(j.query?.pages ?? {})) {
      const asked = back[pg.title] ?? pg.title;
      if (pg.missing !== undefined || pg.pageprops?.disambiguation !== undefined) continue;
      const im = pg.thumbnail ?? pg.original;   // ≤ 1600 px rendering: light to download, and SVG flags/maps come as PNG
      res[asked] = { page: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(pg.title)}`, src: im?.source ?? null, w: im?.width ?? 0, h: im?.height ?? 0, en: pg.langlinks?.[0]?.["*"] ?? null,
        lang, file: pg.pageimage ?? null, qid: pg.pageprops?.wikibase_item ?? null };   // file + qid: licence/author and «is a person» (user 2026-11-18, rules review)
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
  if (best && best.w >= Math.min(MIN, 300)) found[n] = { via: "wikipedia", page: best.page, url: best.src, w: best.w, h: best.h, title: n, lang: best.lang, wfile: best.file };
}

// 1b) licence + author of the chosen Wikipedia files (Commons metadata through the same wiki), and who is a person (Wikidata P31 = Q5) (user 2026-11-18, rules review)
const strip = (s) => String(s ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const licence = {};
for (const lang of ["ar", "en"]) {
  const files = [...new Set(Object.values(found).filter((f) => f.lang === lang && f.wfile).map((f) => `File:${f.wfile}`))];
  for (let i = 0; i < files.length; i += 50) {
    try {
      const j = await wiki(lang, { titles: files.slice(i, i + 50).join("|"), prop: "imageinfo", iiprop: "extmetadata|url" });
      const back = {}; for (const x of j.query?.normalized ?? []) back[x.to] = x.from;
      for (const pg of Object.values(j.query?.pages ?? {})) {
        const ii = pg.imageinfo?.[0]; if (!ii) continue;
        const em = ii.extmetadata ?? {};
        licence[`${lang}:${(back[pg.title] ?? pg.title).replace(/^[^:]+:/, "")}`] = { license: strip(em.LicenseShortName?.value) || "unknown", author: strip(em.Artist?.value) || "unknown", filePage: ii.descriptionurl ?? null };
      }
    } catch (e) { console.log(`  ⚠ licence lookup (${lang}) failed: ${e.message}`); }
  }
}
const person = {};
if (PEOPLE) for (const n of names) person[n] = true;
else {
  const qids = {}; for (const n of names) { const q = ar[n]?.qid ?? (ar[n]?.en ? en[ar[n].en]?.qid : null); if (q) qids[n] = q; }
  const ids = [...new Set(Object.values(qids))];
  const human = new Set();
  for (let i = 0; i < ids.length; i += 50) {
    try {
      const u = new URL("https://www.wikidata.org/w/api.php");
      for (const [k2, v] of Object.entries({ action: "wbgetentities", format: "json", ids: ids.slice(i, i + 50).join("|"), props: "claims" })) u.searchParams.set(k2, v);
      const j = await (await get(u, { headers: UA })).json();
      for (const [id, ent] of Object.entries(j.entities ?? {})) if ((ent.claims?.P31 ?? []).some((c) => c.mainsnak?.datavalue?.value?.id === "Q5")) human.add(id);
    } catch (e) { console.log(`  ⚠ Wikidata person lookup failed: ${e.message}`); }
  }
  for (const [n, q] of Object.entries(qids)) if (human.has(q)) person[n] = true;
}

// face check (YuNet, the model of tools/blur_faces_video.py): {file → faces} in one Python call per picture; null = check not available
const PY = ["C:/Users/mshms/AppData/Local/Programs/Python/Python310/python.exe", "python"].find((x) => x === "python" || fs.existsSync(x));
const MODEL = path.join(root, ".tmp", "models", "yunet.onnx");
let faceOk = !argv.includes("--no-face"), faceNote = "";
if (faceOk && !fs.existsSync(MODEL)) { faceOk = false; faceNote = `⚠ face check skipped: ${MODEL} missing`; }
const FACE_PY = [
  "import sys, cv2, numpy as np",
  "img = cv2.imdecode(np.fromfile(sys.argv[2], np.uint8), cv2.IMREAD_COLOR)",
  "if img is None: print(-1); sys.exit(0)",
  "s = min(1.0, 1024.0 / max(img.shape[:2])); img = cv2.resize(img, None, fx=s, fy=s) if s < 1 else img",
  "d = cv2.FaceDetectorYN.create(sys.argv[1], '', (img.shape[1], img.shape[0]), 0.6, 0.3, 5000)",
  "_, f = d.detect(img); print(0 if f is None else len(f))",
].join("\n");
const faces = (file) => {
  if (!faceOk) return null;
  const r = spawnSync(PY, ["-I", "-c", FACE_PY, MODEL, path.resolve(file)], { encoding: "utf8", windowsHide: true, timeout: 60000 });
  const v = Number(String(r.stdout ?? "").trim().split(/\s+/).pop());
  if (r.status !== 0 || !Number.isFinite(v)) { faceOk = false; faceNote = `⚠ face check skipped: OpenCV/YuNet not usable (${String(r.stderr ?? r.error ?? "").trim().split(/\r?\n/).pop()})`; console.log(`  ${faceNote}`); return null; }
  return v;
};

// 2) Google Images (SerpAPI): candidates for a name with no Wikipedia picture, or whose person picture had no face — asked only when needed
const BAD_SITE = /shutterstock|istockphoto|gettyimages|freepik|dreamstime|alamy|depositphotos|123rf|stock\.adobe|pinterest|lexica|midjourney|openart|playground|nightcafe|craiyon|pixai|tensor\.art/i;
const BAD_WORD = /\b(woman|women|girl|lady|female|actress|wife)\b|امرأة|نساء|فتاة|سيدة|زوجة|ممثلة|إعلامية/i;
const SOCIAL = /youtube\.com|youtu\.be|ytimg|facebook\.com|fbsbx|instagram\.com|twitter\.com|\/\/x\.com|tiktok\.com|threads\.net|t\.me\//i;
let serpNote = "", serpDead = false;
const googleCands = async (n) => {
  if (serpDead) return webCands(n);
  if (!env.SERPAPI_API_KEY) { serpNote = "SERPAPI_API_KEY missing in .env — ordinary web search used"; serpDead = true; return webCands(n); }
  const u = new URL("https://serpapi.com/search.json");
  // tbs itp:photo = photographs only (no drawings/clipart); social posts are often designed cards with text → used only when nothing else qualifies
  for (const [k2, v] of Object.entries({ engine: "google_images", q: n, hl: "ar", tbs: "itp:photo", api_key: env.SERPAPI_API_KEY })) u.searchParams.set(k2, v);
  let j; try { j = await (await get(u)).json(); } catch { return webCands(n); }
  if (j.error) { serpNote = `SerpAPI: ${j.error} — ordinary web search used`; serpDead = true; return webCands(n); }
  const ok = (j.images_results ?? []).filter((r) => (r.original_width ?? 0) >= MIN && !BAD_SITE.test(`${r.link} ${r.source}`) && !BAD_WORD.test(r.title ?? ""));
  return [...ok.filter((r) => !SOCIAL.test(`${r.link} ${r.source}`)), ...ok.filter((r) => SOCIAL.test(`${r.link} ${r.source}`))]
    .map((hit) => ({ via: "google", page: hit.link, url: hit.original, thumb: hit.thumbnail, w: hit.original_width, h: hit.original_height, title: hit.title,
      license: "unknown (Google Images result — check the page)", author: strip(hit.source) || new URL(hit.link).host }));
};

// 2b) the ordinary search a browser does (no key, no credit): DuckDuckGo images, then Bing images; same filters as Google
const BROWSER = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36", "Accept-Language": "ar,en;q=0.8" };
const keep = (rs) => { const ok = rs.filter((r) => (r.w === 0 || r.w >= MIN) && !BAD_SITE.test(`${r.page} ${r.url}`) && !BAD_WORD.test(r.title ?? "")); return [...ok.filter((r) => !SOCIAL.test(`${r.page} ${r.url}`)), ...ok.filter((r) => SOCIAL.test(`${r.page} ${r.url}`))]; };
const webCands = async (n) => {
  try {
    const h = await (await get(`https://duckduckgo.com/?q=${encodeURIComponent(n)}&iax=images&ia=images`, { headers: BROWSER })).text();
    const vqd = (h.match(/vqd=["']?([\d-]+)["']?/) || [])[1];
    if (vqd) {
      const j = await (await get(`https://duckduckgo.com/i.js?l=wt-wt&o=json&q=${encodeURIComponent(n)}&vqd=${vqd}&f=,,,type:photo,,&p=1`, { headers: { ...BROWSER, Referer: "https://duckduckgo.com/" } })).json();
      const c = keep((j.results ?? []).map((r) => ({ via: "duckduckgo", page: r.url, url: r.image, thumb: r.thumbnail, w: r.width ?? 0, h: r.height ?? 0, title: r.title,
        license: "unknown (web search result — check the page)", author: (() => { try { return new URL(r.url).host; } catch { return "unknown"; } })() })).filter((r) => r.w > 0));
      if (c.length) return c;
    }
  } catch (e) { console.log(`  ⚠ DuckDuckGo search failed: ${e.message}`); }
  try {
    const h = await (await get(`https://www.bing.com/images/async?q=${encodeURIComponent(n)}&first=0&count=35&qft=+filterui:photo-photo&mmasync=1`, { headers: BROWSER })).text();
    const ms = [...h.matchAll(/ m="([^"]+)"/g)].map((m) => { try { return JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, "&")); } catch { return null; } }).filter((m) => m?.murl);
    return keep(ms.map((m) => ({ via: "bing", page: m.purl, url: m.murl, thumb: m.turl, w: 0, h: 0, title: m.t ?? "",   /* Bing gives no size: measured after the download */
      license: "unknown (web search result — check the page)", author: (() => { try { return new URL(m.purl).host; } catch { return "unknown"; } })() })));
  } catch (e) { console.log(`  ⚠ Bing search failed: ${e.message}`); return []; }
};
const sizeOf = (file) => { const r = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", file], { encoding: "utf8", windowsHide: true }); const [w, h] = String(r.stdout ?? "").trim().split(",").map(Number); return { w: w || 0, h: h || 0 }; };

// 3) download (original, else the thumbnail), keep jpg/png/webp, convert anything else to jpg; a person picture without a face → the next candidate
const list = [], noFace = [], unchecked = [];
// never overwrite: numbering continues after the highest img_<n> already in the folder (2026-11-11: a second run overwrote img_7…img_11 used by the spec)
let k = Math.max(0, ...fs.readdirSync(outDir).map((f) => Number(f.match(/^img_(\d+)\./)?.[1] ?? 0)));
const download = async (f, kk) => {
  for (const url of [f.url, f.thumb].filter(Boolean)) {
    try {
      const r = await get(url, { headers: { ...UA, Referer: f.page } });
      const ct = r.headers.get("content-type") ?? "";
      if (!r.ok || !ct.startsWith("image/")) continue;
      const buf = Buffer.from(await r.arrayBuffer()); if (buf.length < 4000) continue;
      const ext = ct.includes("png") ? "png" : ct.includes("webp") ? "webp" : ct.includes("jpeg") || ct.includes("jpg") ? "jpg" : "src";
      const file = path.join(outDir, `img_${kk}.${ext === "src" ? "jpg" : ext}`);
      if (ext === "src") { const tmp = path.join(T, `img_${kk}.bin`); fs.writeFileSync(tmp, buf); spawnSync("ffmpeg", ["-v", "error", "-y", "-i", tmp, file]); fs.rmSync(tmp, { force: true }); }
      else fs.writeFileSync(file, buf);
      if (fs.existsSync(file)) return { file, src: url };
    } catch { /* timeout or network error → next url */ }
  }
  return null;
};
for (const n of names) {
  const cands = found[n] ? [found[n]] : [];
  let saved = null, asked = false;
  for (let c = 0; c < TRIES && !saved; c++) {
    if (c >= cands.length && !asked) { asked = true; cands.push(...await googleCands(n)); }
    const f = cands[c]; if (!f) break;
    const got = await download(f, k + 1); if (!got) continue;
    if (!f.w || got.src !== f.url) { Object.assign(f, sizeOf(got.file)); if (f.w < Math.min(MIN, 500)) { fs.rmSync(got.file, { force: true }); continue; } }   /* Bing (no size) or a thumbnail instead of the original: the real size, after the download */
    if (person[n]) {
      const nf = faces(got.file);
      if (nf === null) unchecked.push(n);
      else if (nf < 1) { noFace.push(`${n} (${f.via})`); fs.rmSync(got.file, { force: true }); continue; }
    }
    k++; saved = { ...got, f };
  }
  if (!saved) continue;
  const f = saved.f, lic = f.via === "wikipedia" ? licence[`${f.lang}:${f.wfile}`] ?? {} : f;
  list.push({ name: n, said: said[n] ?? [], file: saved.file.replace(/\\/g, "/"), via: f.via, page: f.page, title: f.title, w: f.w, h: f.h,
    license: lic.license ?? "unknown", author: lic.author ?? "unknown", ...(lic.filePage ? { filePage: lic.filePage } : {}), src: saved.src, ...(person[n] ? { person: true } : {}) });
}
// merged with the earlier runs (the spec and the requirements ledger read every picture ever fetched); "verified" is set by me after LOOKING at the picture
const prevList = (() => { try { return JSON.parse(fs.readFileSync(path.join(T, "images.json"), "utf8")); } catch { return []; } })();
fs.writeFileSync(path.join(T, "images.json"), JSON.stringify([...prevList.filter((x) => !list.some((y) => y.file === x.file)), ...list], null, 1));
// the source page, licence and author next to the pictures: one sources.json per folder, merged by file (user 2026-11-18, rules review, s9)
const srcF = path.join(outDir, "sources.json");
const prevSrc = (() => { try { const j = JSON.parse(fs.readFileSync(srcF, "utf8")); return Array.isArray(j) ? j : []; } catch { return []; } })();
const today = new Date().toISOString().slice(0, 10);
const srcRows = list.map((x) => ({ file: path.basename(x.file), name: x.name, via: x.via, page: x.page, ...(x.filePage ? { filePage: x.filePage } : {}), license: x.license, author: x.author, src: x.src, fetched: today }));
if (srcRows.length) fs.writeFileSync(srcF, JSON.stringify([...prevSrc.filter((x) => !srcRows.some((y) => y.file === x.file)), ...srcRows], null, 1));

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
console.log(`${list.length}/${names.length} pictures in ${((Date.now() - t0) / 1000).toFixed(1)} s (wikipedia ${list.filter((x) => x.via === "wikipedia").length}, google ${list.filter((x) => x.via === "google").length}, web ${list.filter((x) => x.via === "duckduckgo" || x.via === "bing").length}) → ${path.join(T, "images.json")}${list.length ? `  sheet: ${sheet}` : ""}`);
list.forEach((x, i) => console.log(`  ${i + 1}. ${x.name} — ${x.via} ${x.w}×${x.h} → ${x.file}`));
if (missing.length) console.log(`missing: ${missing.join("، ")}`);
if (serpNote) console.log(serpNote);
if (srcRows.length) console.log(`sources (page, licence, author) → ${srcF}`);
if (noFace.length) console.log(`dropped, person picture without a face: ${noFace.join("، ")}`);
if (faceNote) console.log(faceNote + (unchecked.length ? ` — not checked: ${[...new Set(unchecked)].join("، ")}` : ""));
