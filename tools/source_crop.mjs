// The source itself, not the whole browser window (user 2026-10-30: «لما أعرض مصدر يعرض المصدر هو ولا تعرض نافذة المتصفح كاملة»).
//   node tools/source_crop.mjs data/specs/<p>.json [--write] [--force]
// For every baked-split window (`splits[]`) one frame from its middle: the browser chrome (tabs, address bar, bookmarks — everything above the first
// full-width horizontal line in the top 22 % of the column) is dropped, then the box holding the page's detail (text, picture, video) is kept and its empty
// margins dropped. --write puts it into the split as clip {x, y, w, h} (recording pixels; DebateLayouts / CropPolaroid show exactly that box);
// windows that already carry clip.y/h are kept unless --force. A contact sheet of the crops → .tmp/<p>/source_crops.jpg to look at.
import fs from "node:fs"; import path from "node:path"; import { spawnSync } from "node:child_process";

const argv = process.argv.slice(2);
const specF = argv.find((a) => a.endsWith(".json"));
if (!specF) { console.error("usage: node tools/source_crop.mjs data/specs/<p>.json [--write] [--force]"); process.exit(2); }
const write = argv.includes("--write"), force = argv.includes("--force");
const spec = JSON.parse(fs.readFileSync(specF, "utf8"));
(await import("./cut_lazy.mjs")).ensureCut(spec.id);   // the cut video matches the cut list (tools/cut_lazy.mjs)
const cut = path.join("public", spec.cut), T = path.join(".tmp", spec.id), tmp = path.join(T, "srccrop");
fs.mkdirSync(tmp, { recursive: true });

const grab = (t, x, w) => {   // one grey frame of the column at half size
  const W = Math.floor(w / 4) * 2, H = 540;
  const r = spawnSync("ffmpeg", ["-v", "error", "-ss", t.toFixed(2), "-i", cut, "-frames:v", "1", "-vf", `crop=${w}:1080:${x}:0,scale=${W}:${H},format=gray`, "-f", "rawvideo", "-"], { maxBuffer: 64 << 20 });
  if (r.status !== 0 || r.stdout.length < W * H) return null;
  return { px: r.stdout, W, H };
};
// largest run of «on» indices, joining gaps up to `gap`; a «hard» index (a full dark band: the black bar between two reels in a feed) is never crossed
const span = (on, gap, hard = []) => {
  let best = null, cur = null, miss = 0;
  for (let i = 0; i < on.length; i++) {
    if (on[i] && !hard[i]) { if (!cur) cur = [i, i]; cur[1] = i; miss = 0; }
    else if (cur && (hard[i] || ++miss > gap)) { if (!best || cur[1] - cur[0] > best[1] - best[0]) best = cur; cur = null; miss = 0; }
  }
  if (cur && (!best || cur[1] - cur[0] > best[1] - best[0])) best = cur;
  return best;
};
const detect = ({ px, W, H }) => {
  const P = (x, y) => px[y * W + x];
  // 1) browser chrome: the lowest row in the top 22 % that is a near full-width horizontal line (a step in brightness across ≥ 70 % of the width)
  let top = 0;
  for (let y = 1; y < Math.round(H * 0.22); y++) { let n = 0; for (let x = 0; x < W; x++) if (Math.abs(P(x, y) - P(x, y - 1)) > 10) n++; if (n > 0.7 * W) top = y + 1; }
  // 2) detail below it: edges (|dx| + |dy| > 24) per row and per column
  const e = new Uint8Array(W * H);
  for (let y = top + 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) e[y * W + x] = Math.abs(P(x + 1, y) - P(x - 1, y)) + Math.abs(P(x, y + 1) - P(x, y - 1)) > 24 ? 1 : 0;
  const rows = Array.from({ length: H }, (_, y) => { let n = 0; for (let x = 0; x < W; x++) n += e[y * W + x]; return n > 0.015 * W; });
  const dark = Array.from({ length: H }, (_, y) => { let mx = 0, sum = 0; for (let x = 0; x < W; x++) { const v = P(x, y); sum += v; if (v > mx) mx = v; } return sum / W < 28 && mx < 60; });
  const ys = span(rows, Math.round(H * 0.05), dark); if (!ys) return null;
  const cols = Array.from({ length: W }, (_, x) => { let n = 0; for (let y = ys[0]; y <= ys[1]; y++) n += e[y * W + x]; return n > 0.015 * (ys[1] - ys[0] + 1); });
  const xs = span(cols, Math.round(W * 0.05)); if (!xs) return null;
  const m = 6;   // a little air around the detail
  return { x0: Math.max(0, xs[0] - m), y0: Math.max(top, ys[0] - m), x1: Math.min(W - 1, xs[1] + m), y1: Math.min(H - 1, ys[1] + m), top };
};

const rows = [], crops = [];
for (const [i, sp] of (spec.splits ?? []).entries()) {
  const has = sp.clip.y !== undefined && sp.clip.h !== undefined;
  if (has && !force) { rows.push(`#${i} ${sp.from.toFixed(1)}–${sp.to.toFixed(1)}: قصّ موجود ${sp.clip.x},${sp.clip.y} ${sp.clip.w}×${sp.clip.h}`); crops.push(sp.clip); continue; }
  const colX = sp.clipCol?.x ?? sp.clip.x, colW = sp.clipCol?.w ?? sp.clip.w;   // the whole column the recording gave (kept so --force re-detects from it)
  const g = grab((sp.from + sp.to) / 2, colX, colW), d = g && detect(g);
  if (!d) { rows.push(`#${i} ${sp.from.toFixed(1)}–${sp.to.toFixed(1)}: ✘ لم يُكشف المصدر — اكتب clip.y/h بيدك`); continue; }
  const k = colW / g.W, c = { x: Math.round(colX + d.x0 * k), y: Math.round(d.y0 * 2), w: Math.round((d.x1 - d.x0) * k), h: Math.round((d.y1 - d.y0) * 2) };
  rows.push(`#${i} ${sp.from.toFixed(1)}–${sp.to.toFixed(1)}: المصدر ${c.x},${c.y} ${c.w}×${c.h} (شريط المتصفح ${Math.round(d.top * 2)}px أُسقط؛ العمود ${colX}+${colW})`);
  crops.push(c);
  if (write) { sp.clipCol ??= { x: colX, w: colW }; Object.assign(sp.clip, c); }
}
console.log(rows.join("\n") || "لا نوافذ مصدر (splits) في الملف");
// contact sheet: each crop from its window's middle frame
const shots = [];
for (const [i, sp] of (spec.splits ?? []).entries()) {
  const c = crops[i]; if (!c || c.y === undefined) continue;
  const f = path.join(tmp, `c${String(shots.length).padStart(3, "0")}.png`);
  const r = spawnSync("ffmpeg", ["-v", "error", "-y", "-ss", ((sp.from + sp.to) / 2).toFixed(2), "-i", cut, "-frames:v", "1", "-vf", `crop=${c.w}:${c.h}:${c.x}:${c.y},scale=420:300:force_original_aspect_ratio=decrease,pad=420:300:(ow-iw)/2:(oh-ih)/2:white`, f]);
  if (r.status === 0) shots.push(f);
}
if (shots.length) {
  const sheet = path.join(T, "source_crops.jpg"), cols = Math.min(5, shots.length);
  spawnSync("ffmpeg", ["-v", "error", "-y", "-framerate", "1", "-i", path.join(tmp, "c%03d.png"), "-vf", `tile=${cols}x${Math.ceil(shots.length / cols)}:padding=6:color=gray`, "-frames:v", "1", sheet]);
  console.log(`→ ${sheet} (${shots.length} نافذة)`);
}
fs.rmSync(tmp, { recursive: true, force: true });
if (write) { fs.writeFileSync(specF, JSON.stringify(spec, null, 1)); console.log(`كُتب القصّ في ${specF}`); }
