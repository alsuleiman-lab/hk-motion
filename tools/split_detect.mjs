// WHERE EACH SPLIT WINDOW REALLY SPLITS (user 2026-11-20, frame 13446: «عندما تقسم الشاشة يجب أن تنتبه تماماً أين تنقسم… لما أعرض الفيديو أقسم بطريقة، ولما أعرض
// كتاباً أقسمه بطريقة أخرى. فلا تأخذ مقاساً واحداً وتعممه… اعرف محل القطع مرة لكل شكل جديد… أسهل وأسرع طريقة»).
// One frame from the middle of every `splits` window of the cut, read as grey pixels (ffmpeg, 480×270), and two simple measures:
//   · the divider = the dark vertical band between the shown screen (left) and his camera (right): the column run, x 35–75 % of the width, darkest on most rows;
//   · the shown content = the box of non-dark pixels left of the divider (a page is mostly white → `page`, shown big with layout "dossierBig").
// It writes clip / sheikh / clipCol of each window (full-resolution pixels) and prints what changed; windows whose shape is the same keep their numbers.
//   node tools/split_detect.mjs <p> [--write]
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const [p] = process.argv.slice(2), WRITE = process.argv.includes("--write"), KEEP_CLIPS = !process.argv.includes("--clips");   /* clip windows the user already reviewed keep their numbers unless --clips */
if (!p) { console.error("usage: node tools/split_detect.mjs <p> [--write]"); process.exit(2); }
const F = `data/specs/${p}.json`, spec = JSON.parse(fs.readFileSync(F, "utf8"));
(await import("./cut_lazy.mjs")).ensureCut(p, { quiet: true });
const cut = `public/${spec.cut}`, W = 480, H = 270, K = 1920 / W;
const mm = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
const frame = (t) => { const r = spawnSync("ffmpeg", ["-v", "error", "-ss", t.toFixed(2), "-i", cut, "-frames:v", "1", "-vf", `scale=${W}:${H},format=gray`, "-f", "rawvideo", "-"], { maxBuffer: 1 << 24 }); return r.status === 0 && r.stdout.length >= W * H ? r.stdout : null; };
let changed = 0;
for (const w of spec.splits ?? []) {
  const px = frame((w.from + w.to) / 2); if (!px) { console.log(`⚠ ${mm(w.from)}: لا إطار`); continue; }
  const at = (x, y) => px[y * W + x];
  /* the divider: for each column, the share of rows that are dark (< 40); the widest run of mostly-dark columns between 35 % and 75 % of the width */
  const dark = Array.from({ length: W }, (_, x) => { let n = 0; for (let y = 0; y < H; y++) if (at(x, y) < 40) n++; return n / H; });
  let best = null;
  for (let x = Math.round(W * 0.35); x < W * 0.75; x++) if (dark[x] > 0.8) { let e = x; while (e + 1 < W * 0.8 && dark[e + 1] > 0.8) e++; if (!best || e - x > best[1] - best[0]) best = [x, e]; x = e; }
  if (!best) {
    /* a BOOK page (white) with a light reader frame around it: the page = the columns/rows that are mostly white; his camera starts at the first column
       after the page where the picture stops being flat (a run of 6 columns whose rows vary a lot) */
    const wc = Array.from({ length: W }, (_, x) => { let n = 0; for (let y = 0; y < H; y++) if (at(x, y) > 235) n++; return n / H; });   /* the page is white (≈255); the reader frame around it is light grey (≈209) */
    const pc = wc.map((v, x) => (v > 0.5 && x < W * 0.7 ? x : -1)).filter((x) => x >= 0);
    if (pc.length < W * 0.2) { console.log(`⚠ ${mm(w.from)}–${mm(w.to)}: لم أجد حداً ولا صفحة — أبقيته كما هو`); continue; }
    /* the longest run of white columns (gaps of ≤ 3 columns allowed for a line of text): a light strip of the reader at the left is not the page */
    const runs = []; for (const x of pc) { const r = runs.at(-1); if (r && x - r[1] <= 4) r[1] = x; else runs.push([x, x]); }
    const [x0, x1] = runs.sort((a, b) => (b[1] - b[0]) - (a[1] - a[0]))[0];
    const wr = Array.from({ length: H }, (_, y) => { let n = 0; for (let x = x0; x <= x1; x++) if (at(x, y) > 235) n++; return n / (x1 - x0 + 1); });
    const pr = wr.map((v, y) => (v > 0.5 ? y : -1)).filter((y) => y >= 0), y0 = pr[0] ?? 0, y1 = pr.at(-1) ?? H - 1;
    const sd = (x) => { let s = 0, s2 = 0; for (let y = 0; y < H; y++) { const v = at(x, y); s += v; s2 += v * v; } const m = s / H; return Math.sqrt(Math.max(0, s2 / H - m * m)); };
    const mean = (x) => { let s1 = 0; for (let y = 0; y < H; y++) s1 += at(x, y); return s1 / H; };
    /* the reader frame between page and camera is flat light grey (mean ≈ 209, little variation): the camera starts at the first of 6 columns in a row that are not that flat grey */
    /* the reader frame between page and camera is the SAME column repeated (flat chrome): the camera starts where neighbouring columns begin to differ */
    const dif = (x) => { let d = 0; for (let y = 0; y < H; y++) d += Math.abs(at(x, y) - at(x + 1, y)); return d / H; };
    let cam = x1 + 3; for (; cam < W - 6; cam++) if ([0, 1, 2, 3].every((k) => dif(cam + k) > 6)) break;
    const clip = { x: Math.round(x0 * K), w: Math.round((x1 - x0 + 1) * K), y: Math.round(y0 * K), h: Math.round((y1 - y0 + 1) * K) }, sheikh = { x: Math.round(cam * K), w: 1920 - Math.round(cam * K) };
    const same = Math.abs((w.clip?.x ?? 0) - clip.x) < 16 && Math.abs((w.clip?.w ?? 0) - clip.w) < 24 && Math.abs((w.sheikh?.x ?? 0) - sheikh.x) < 16 && w.layout === "dossierBig";
    console.log(`${same ? "✔" : "✎"} ${mm(w.from)}–${mm(w.to)} صفحة كتاب: الصفحة x ${clip.x}–${clip.x + clip.w}، y ${clip.y}–${clip.y + clip.h}؛ الكاميرا من ${sheikh.x}${same ? "" : `  (كان ${w.clip?.x}–${(w.clip?.x ?? 0) + (w.clip?.w ?? 0)}، الشيخ من ${w.sheikh?.x})`}`);
    if (!same) { changed++; if (WRITE) { w.clip = clip; w.sheikh = sheikh; w.clipCol = { x: 0, w: sheikh.x }; w.layout = "dossierBig"; w.page = true; } }
    continue;
  }
  if (KEEP_CLIPS) { console.log(`✔ ${mm(w.from)}–${mm(w.to)} مقطع: أُبقي كما راجعه المستخدم`); continue; }
  const [d0, d1] = best;
  /* the shown content: non-dark pixels (> 60) left of the divider, trimmed to the rows/columns that hold more than 5 % of them */
  const colN = Array.from({ length: d0 }, (_, x) => { let n = 0; for (let y = 0; y < H; y++) if (at(x, y) > 60) n++; return n; });
  const rowN = Array.from({ length: H }, (_, y) => { let n = 0; for (let x = 0; x < d0; x++) if (at(x, y) > 60) n++; return n; });
  const xs = colN.map((n, x) => (n > H * 0.05 ? x : -1)).filter((x) => x >= 0), ys = rowN.map((n, y) => (n > d0 * 0.05 ? y : -1)).filter((y) => y >= 0);
  if (!xs.length || !ys.length) { console.log(`⚠ ${mm(w.from)}: لا محتوى يسار الحد`); continue; }
  let white = 0, tot = 0; for (let y = ys[0]; y <= ys.at(-1); y++) for (let x = xs[0]; x <= xs.at(-1); x++) { tot++; if (at(x, y) > 200) white++; }
  const page = white / tot > 0.55;
  const clip = { x: Math.round(xs[0] * K), w: Math.round((xs.at(-1) - xs[0] + 1) * K), y: Math.round(ys[0] * K), h: Math.round((ys.at(-1) - ys[0] + 1) * K) };
  const sheikh = { x: Math.round((d1 + 1) * K), w: 1920 - Math.round((d1 + 1) * K) }, clipCol = { x: 0, w: Math.round(d0 * K) };
  const old = JSON.stringify([w.clip, w.sheikh, w.layout ?? "dossier"]), nu = JSON.stringify([clip, sheikh, page ? "dossierBig" : w.layout ?? "dossier"]);
  const same = old === nu || (Math.abs((w.clip?.x ?? 0) - clip.x) < 16 && Math.abs((w.clip?.w ?? 0) - clip.w) < 24 && Math.abs((w.sheikh?.x ?? 0) - sheikh.x) < 16 && (w.layout ?? "dossier") === (page ? "dossierBig" : w.layout ?? "dossier"));
  console.log(`${same ? "✔" : "✎"} ${mm(w.from)}–${mm(w.to)} ${page ? "صفحة كتاب" : "مقطع"}: المحتوى x ${clip.x}–${clip.x + clip.w}، y ${clip.y}–${clip.y + clip.h}؛ الحد ${Math.round(d0 * K)}–${Math.round((d1 + 1) * K)}${same ? "" : `  (كان المحتوى ${w.clip?.x}–${(w.clip?.x ?? 0) + (w.clip?.w ?? 0)}، الشيخ من ${w.sheikh?.x})`}`);
  if (!same) { changed++; if (WRITE) { w.clip = clip; w.sheikh = sheikh; w.clipCol = clipCol; if (page) { w.layout = "dossierBig"; w.page = true; } } }
}
if (WRITE && changed) fs.writeFileSync(F, JSON.stringify(spec, null, 1));
console.log(changed ? `${WRITE ? "✔ كُتبت" : "✎ تتغير (‎--write)"} ${changed} نافذة` : "✔ كل نافذة على حدها الصحيح");
