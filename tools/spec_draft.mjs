// Draft data spec from what the stages already know (user 2026-10-27: «تسريع المونتاج»). Fills only the MECHANICAL parts; words, chips,
// rows and the cover are still chosen by the plan; zooms/shake come from .tmp/<p>/moves.json (tools/moves_plan.mjs) and are reviewed in the plan.
//   node tools/spec_draft.mjs <p> --title "العنوان" [--out data/specs/<p>.json]
// Reads: public/<p>_map.json (duration), .tmp/<p>/sources.json (split windows, from stage cut), .tmp/<p>/cut_words.json (cut timeline),
//        .tmp/<p>/images.json (tools/fetch_images.mjs, optional). Writes data/specs/<p>.json, or .tmp/<p>/spec_draft.json when the spec exists (never overwrites).
// Draft: cut = <p>_cut_s.mp4; splits from the source windows; cams (portrait 608-px slice) centred on HIS face per stretch (tools/face_track.py);
// his name tag ≈ every 3 min and the subscribe reminder ≈ every 5 min, each at the next pause; one `pic` + `credit` per fetched picture at its first mention.
// BOTH ORIENTATIONS FROM THE START (user 2026-11-16: «نبني طولي وعرضي… ينسخه مع المعلومات اللازمة للحالين»): every item carries its portrait numbers AND its landscape numbers (`land`:
// the name tag / subscribe at the grid's landscape slots, the picture cards at the gallery sample's size via tools/gallery_geometry.mjs --write), and the new spec is registered
// at once as its three Studio compositions — طولي, عرضي and «الاثنان معاً» (tools/spec_register.mjs). `--kind reel` = portrait only (no name tag / subscribe, one composition).
//   extra options: [--kind full|reel] [--id Comp-Id] [--folder "مونتاج الجلسة"] [--forms port|land|port,land,both]  (only one orientation asked for: --forms port or land)  (the registration runs only when the spec is written to its own data/specs/<p>.json)
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const argv = process.argv.slice(2);
const p = argv[0];
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : argv[i + 1]; };
const title = opt("title", ""), kind = opt("kind", "full");
if (!p || !title) { console.error('usage: node tools/spec_draft.mjs <p> --title "العنوان" [--out file]'); process.exit(2); }
const T = path.join(".tmp", p), FPS = 30, PY = "C:/Users/mshms/AppData/Local/Programs/Python/Python310/python.exe";
const read = (f, d) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return d; } };
const map = read(path.join("public", `${p}_map.json`), null);
if (!map) { console.error(`public/${p}_map.json missing — run stage cut first`); process.exit(2); }
const dur = map.duration;
const words = read(path.join(T, "cut_words.json"), []);
const sources = read(path.join(T, "sources.json"), { windows: [] }).windows;
const images = read(path.join(T, "images.json"), []);
const r2 = (v) => +v.toFixed(2);

// next pause at or after t (the cut keeps pauses ≤ 0.40 s, so ≥ 0.15 s within 15 s; else the next word) → the item starts with the next word
const pauseAfter = (t) => {
  for (let i = 1; i < words.length; i++) if (words[i].s >= t && words[i].s <= t + 15 && words[i].s - words[i - 1].e >= 0.15) return r2(words[i].s);
  const w = words.find((x) => x.s >= t); return r2(w ? w.s : t);
};

// splits (cut timeline) straight from the detector
// a «clip» narrower than 120 px at the frame edge is a false window (2026-11-12, lesson camera: 4-px windows at x 1916)
const splits = sources.filter((w) => w.split && (w.split.clip?.w ?? w.clip?.w ?? 999) >= 120).map((w) => ({ ...w.split, clipName: "المقطع المردود عليه" }));

// his face per stretch → portrait cams (cached track of the cut, shared with face_fast.mjs)
const cut = path.join("public", `${p}_cut.mp4`), st = fs.statSync(cut);
const trackF = path.join(".tmp", "facetrack", `${path.basename(cut, ".mp4")}_${st.size}_${Math.round(st.mtimeMs)}.json`);
if (!fs.existsSync(trackF)) { fs.mkdirSync(path.dirname(trackF), { recursive: true }); spawnSync(PY, ["tools/face_track.py", cut, trackF], { windowsHide: true }); }
const track = read(trackF, { fps: 2, boxes: [] });
const medCx = (a, b) => { const xs = track.boxes.filter((x) => x[1] != null && x[0] >= a && x[0] < b).map((x) => x[1] + x[3] / 2).sort((u, v) => u - v); return xs.length ? Math.round(xs[xs.length >> 1]) : 990; };
const edges = [0, ...splits.flatMap((s) => [s.from, s.to]), dur].sort((a, b) => a - b).filter((v, i, a) => i === 0 || v - a[i - 1] > 0.05);
const cams = edges.slice(0, -1).map((a, i) => ({ from: r2(a), to: i === edges.length - 2 ? 9999 : r2(edges[i + 1]), cx: medCx(a, edges[i + 1]) }));
/* (user 2026-11-15, frame 28) inside a baked split window the portrait camera centres on HIS slice, never on the face the tracker finds first (the clip's) */
for (const c of cams) { const sp = splits.find((x) => c.from >= x.from - 0.01 && Math.min(c.to, dur) <= x.to + 0.01); if (sp) c.cx = Math.round(sp.sheikh.x + sp.sheikh.w * 0.5); }

const items = [];
if (kind !== "reel") for (let t = 15; t < dur - 10; t += 180) items.push({ t: "nameTag", at: pauseAfter(t), x: 540, y: 1360, dur: 2.4, land: { x: 686, y: 800 } });
if (kind !== "reel") for (let t = 100; t < dur - 15; t += 300) items.push({ t: "subscribe", at: pauseAfter(t), x: 540, y: 1400, dur: 3, land: { x: 410, y: 838 } });

// pictures at their first mention (Arabic normalised: no diacritics, one alef, ة→ه, ى→ي)
const norm = (s) => String(s).replace(/[\u064B-\u0652\u0640]/g, "").replace(/[إأآا]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/[^\p{L}\p{N} ]/gu, " ").replace(/\s+/g, " ").trim();
const bare = (w) => w.replace(/^(و|ف)?(ب|ل|ك)?(ال)?/, "");   // و/ف + ب/ل/ك + ال prefixes: «ودرعه» → «درعه»
const nw = words.map((w) => bare(norm(w.w)));
const firstMention = (spoken) => {
  let best = null;
  for (const s of spoken) {
    const toks = norm(s.replace(/\(.*?\)/g, "")).split(" ").map(bare).filter((x) => x.length > 1);
    for (const n of [toks.length, 1]) {
      const q = toks.slice(0, n); if (!q.length) continue;
      for (let i = 0; i + q.length <= nw.length; i++) if (q.every((x, k) => nw[i + k] === x)) { if (best == null || words[i].s < best) best = words[i].s; break; }
      if (best != null) break;
    }
  }
  return best;
};
const missing = [];
for (const im of images) {
  const at = firstMention([im.name, ...(im.said ?? [])]);
  if (at == null) { missing.push(im.name); continue; }
  const h = Math.min(560, Math.round((420 * im.h) / im.w));
  items.push({ t: "pic", src: im.file.replace(/^public\//, ""), at: r2(at), until: r2(at + 4), x: 40, y: 1380, w: 420, h });
  items.push({ t: "credit", text: `${im.name} — ${im.via === "wikipedia" ? "ويكيبيديا" : "صور جوجل"}`, from: r2(at), to: r2(at + 4) });
}
items.sort((a, b) => (a.at ?? a.from) - (b.at ?? b.from));

// the planned camera moves (tools/moves_plan.mjs, run by stage cut): push-ins + shake, reviewed in the plan
const moves = read(path.join(T, "moves.json"), { zooms: [], shake: [] });
const zooms = moves.zooms.map(({ from, to }) => ({ from, to })), shake = moves.shake.map(({ from, to }) => ({ from, to }));
const spec = { id: p, title, ...(kind === "reel" ? { kind: "reel" } : {}), frames: Math.round(dur * FPS), cut: `${p}_cut_s.mp4`, cams, zooms, shake, ...(splits.length ? { splits } : {}), items };
let out = opt("out", path.join("data", "specs", `${p}.json`));
if (!opt("out", null) && fs.existsSync(out)) out = path.join(T, "spec_draft.json");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(spec, null, 1));
console.log(`draft → ${out}: ${(dur / 60).toFixed(1)} min · ${splits.length} split(s) · ${cams.length} cam stretch(es) · ${items.filter((i) => i.t === "nameTag").length} name tags · ${items.filter((i) => i.t === "subscribe").length} subscribe · ${items.filter((i) => i.t === "pic").length} pictures · ${zooms.length} push-ins · ${shake.length} shakes`);
// both orientations: the picture cards get the gallery sample's portrait AND landscape geometry, then the three compositions are registered (only for the spec's own file, never a side draft)
if (items.some((i) => ["pic"].includes(i.t))) { const g = spawnSync(process.execPath, ["tools/gallery_geometry.mjs", out, "--write"], { encoding: "utf8", windowsHide: true }); console.log((g.stdout || g.stderr || "").trim().split(String.fromCharCode(10)).slice(-1)[0]); }
if (out === path.join("data", "specs", `${p}.json`)) { const r = spawnSync(process.execPath, ["tools/spec_register.mjs", p, "--kind", kind, ...(opt("id", null) ? ["--id", opt("id", "")] : []), ...(opt("folder", null) ? ["--folder", opt("folder", "")] : []), ...(opt("forms", null) ? ["--forms", opt("forms", "")] : []), "--title", title], { encoding: "utf8", windowsHide: true }); console.log((r.stdout || r.stderr || "").trim()); }
if (missing.length) console.log(`not mentioned in the cut (no pic placed): ${missing.join("، ")}`);
