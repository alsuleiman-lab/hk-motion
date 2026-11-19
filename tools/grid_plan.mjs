// Layout grid: every element has a reserved place AND time (user 2026-10-29: «كل عنصر له مكان محجوز ووقت… ما راح يكون عنصرين بنفس الوقت في نفس المكان»).
//   node tools/grid_plan.mjs data/specs/<p>.json [--o port|land] [--write]
// For each orientation and screen mode (data/layout_grids.json: full / half / iso) the item gets the first slot of its kind that is free for its
// whole time; the slot is trimmed away from his face + beard, computed from the cached face track (tools/lib/face_zone.mjs) — no rendering, seconds not minutes.
// Checks (exit 1): an item over the face zone, two items in the same place at the same time, a small item while a big (exclusive) one or a name card is up.
// --write moves the simple items (torn, scholar, pic, crop, flash, news) into their slot in the spec; the table goes to .tmp/<p>/grid.md.
import fs from "node:fs"; import path from "node:path";
import { faceZoner } from "./lib/face_zone.mjs";

const argv = process.argv.slice(2);
const specF = argv.find((a) => a.endsWith(".json"));
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : argv[i + 1]; };
if (!specF) { console.error("usage: node tools/grid_plan.mjs data/specs/<p>.json [--o port|land] [--write]"); process.exit(2); }
const write = argv.includes("--write");
const raw = JSON.parse(fs.readFileSync(specF, "utf8"));
const G = JSON.parse(fs.readFileSync(path.join("data", "layout_grids.json"), "utf8"));
/* ELEMENTS BY REFERENCE (2026-11-17, src/galleryRef.ts): a galleryRef spec has no sizes or places; they are resolved here from the gallery exactly as the engine does,
   and --write records only what belongs to THIS video: where his face is over time (face) and the NAME of the slot each element sits in (slot); the engine fits it there */
const REF = !!raw.galleryRef;
process.removeAllListeners("warning");   // node's notice about importing the .ts module
const { resolveGalleryRef, CARD_TYPES } = await import("../src/galleryRef.ts");
const GEO_T = REF ? JSON.parse(fs.readFileSync(path.join("data", "gallery_geo.json"), "utf8")) : null;
let spec = REF ? resolveGalleryRef(raw, GEO_T, G) : raw;
const kindOf = {}; for (const [k, ts] of Object.entries(G.kinds)) for (const t of ts) kindOf[t] = k;
let zoneOf = null;   // built on first use: it needs PORT_ZONES (below) — his face in the ENGINE's portrait split windows is shrunk to s 0.5 like spec.psplits
const zoneAt = (t, o) => (zoneOf ??= faceZoner({ ...spec, psplits: [...(spec.psplits ?? []), ...PORT_ZONES.map((w) => ({ from: w.from, to: w.to, s: w.rail ? 1 : 0.5, top: 960 }))] }))(t, o);
let refMoved = 0;
const setSlot = (i, o, n) => { const it = raw.items[i]; if (!it || it.slot?.[o] === n) return; it.slot = { ...(it.slot ?? {}), [o]: n }; refMoved++; };
// the landscape title bar (src/TitleBar.tsx): right 34, bottom 24, its width follows the title (380–900), ≈ 110 px with the credit line under it — nothing may sit under it
const TITLE_BAR = [Math.round(1920 - 34 - Math.min(900, Math.max(380, String(spec.title ?? "").length * 14 + 180))), 1080 - 24 - 110 - (spec.titleSub ? 22 : 0), 1886, 1056];
// each element belongs to ONE screen mode (user 2026-10-31; data/elements_lab.json `mode`): a half-screen element (his key word, the opponent's words)
// used while the screen is not split is an error — e.g. the key-word chip over his whole frame (allah_taht 4:22, «لماذا يُستخدم هذا في وضع الشاشة الكاملة؟»)
const LAB_MODE = Object.fromEntries(JSON.parse(fs.readFileSync(path.join("data", "elements_lab.json"), "utf8")).map((m) => [m.id, m]));
const ELEMENT_OF = { word: "Word", blur: "BlurRise" };   // the half-screen-only elements the user named (his key word, the opponent's words)
const MODE_AR = { full: "ملء الشاشة", half: "نصف الشاشة", iso: "عزل الخلفية" };
const wrongMode = (it, o, mode) => { const m = LAB_MODE[ELEMENT_OF[it.t]]; if (!m || (m.orient && m.orient !== "both" && m.orient !== o)) return null; return m.mode !== mode ? `${m.ar} (${ELEMENT_OF[it.t]}) عنصر ${MODE_AR[m.mode]} وهو هنا في ${MODE_AR[mode]}` : null; };
const mm = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const inW = (ws, t) => (ws ?? []).some((w) => t >= w.from && t < w.to);

// (2026-11-17) the portrait split windows the ENGINE adds at render time (src/MontageSpec.tsx withPortZones): non-full-frame picks (until = pickUntil),
// notes with phrases, noor/bigword verses, and the SectionsRail drop — the planner must see the same half-screen the engine draws, or it flags them «full»
const PICK_FULL = new Set(["AlertFrame", "PipSource", "BrushWipe"]);   // = PICK_ALL_FULL_FRAME (src/PickKit2.tsx) minus SectionsRail, whose drop window also splits
const pickLast = (it) => {
  let m = it.at; const walk = (v, k) => { if (typeof v === "number" && (k === "at" || /At$/.test(k))) m = Math.max(m, v); else if (Array.isArray(v)) v.forEach((x) => walk(x, k)); else if (v && typeof v === "object") Object.entries(v).forEach(([kk, x]) => walk(x, kk)); };
  Object.entries(it).forEach(([k, v]) => { if (k !== "until" && k !== "land") walk(v, k); });
  if (it.typeAt != null && it.query) m = Math.max(m, it.typeAt + it.query.length / (it.cps ?? 12));
  (it.lines ?? []).forEach((l) => { if (l && typeof l.at === "number" && typeof l.text === "string") m = Math.max(m, l.at + Math.max(0.5, l.text.length * 0.06)); });
  return m + 0.8;
};
const PORT_ZONES = spec.items.flatMap((it) => {
  if (it.only === "land") return [];
  if (it.t === "pick" && !PICK_FULL.has(it.el)) return [{ from: it.at - 0.35, to: Math.max(it.until ?? it.at, pickLast(it) + 2), rail: it.el === "SectionsRail" }];
  // withHalfWays gives every hadith without phrases auto phrases (unless way card) and every non-full verse a noor/bigword way, unless the item is portrait-only
  if (it.t === "note" && (it.phrases?.length || (it.way !== "card" && it.only !== "port"))) return [{ from: (it.phrases?.[0]?.at ?? it.at) - 0.35, to: it.until }];
  if (it.t === "verse" && !it.full && (it.way === "noor" || it.way === "bigword" || (!it.way && it.only !== "port")) && it.times?.length) return [{ from: it.times[0] - 0.35, to: it.until ?? it.times[it.times.length - 1] + 1.2 }];
  return [];
}).filter((w) => w.to > w.from);
// three screen modes (user 2026-10-31): half = a source shown beside him (splits / psplits / his window shifted for a panel); iso = his background isolated with something behind him; full = the rest
const modeAt = (t, o) => (inW(spec.splits, t) || (o === "port" && (inW(spec.psplits, t) || inW(PORT_ZONES, t))) || (o === "land" && (inW(spec.shifts, t) || (spec.behind ?? []).some((b) => b.dx !== undefined && t >= b.from && t < b.to))) ? "half"
  : (spec.behind ?? []).some((b) => b.dx === undefined && t >= b.from && t < b.to) ? "iso" : "full");

const spanOf = (it) => {
  if (it.t === "nameTag") return [it.at, it.at + (it.dur ?? 4)];
  if (it.t === "scholar" || it.t === "tphoto") return [it.at, it.until ?? it.at + 6];
  if (it.t === "rewrite") return [it.oldAt - 0.4, it.until ?? it.newAt + 8];
  if (it.t === "verse" || it.t === "hadith") return [it.times[0], it.until ?? it.times[it.times.length - 1] + 1.2];
  const a = it.at ?? it.from, b = it.until ?? it.to ?? (it.dur != null ? a + it.dur : a + 3);
  return a == null ? null : [a, b];
};

// the item's drawn box (mirrors renderItem in src/MontageSpec.tsx; text widths estimated from the glyph count)
const len = (s) => String(s ?? "").replace(/[ً-ٰٟۖ-ۭ]/g, "").length;
const rectOf = (it, o) => {
  const L = o === "land", ov = it.land ?? {}, P = (k, d) => (L ? ov[k] ?? d : it[k] ?? d);
  switch (it.t) {
    case "word": case "blur": {
      if (!L && it.t === "blur") { const s = it.size ?? 58, x0 = it.x ?? 40, w0 = it.w ?? 1000, lines = it.w ? Math.max(1, Math.ceil(len(it.text) * s * 0.5 / w0)) : 1; return [x0, it.y, x0 + w0, it.y + s * 1.25 * lines + s * 0.25]; }
      const s = L ? ov.size ?? 54 : it.size ?? 64, w = Math.min(L ? 1500 : 1000, len(it.text) * s * 0.55 + 100), x = P("x", undefined), y = P("y", L ? 840 : 1400);
      // landscape with an explicit x/y: KeyChip centres itself on (x, y) (translate −50 %,−50 %), so the box is centred there too
      if (L && (ov.x !== undefined || ov.y !== undefined)) { const cx = ov.x ?? 960, h = s * 1.5; return [cx - w / 2, y - h / 2, cx + w / 2, y + h / 2]; }
      // portrait `Word` centres itself on (x, y) too (translate −50 %,−50 %), at 1.15× its size
      if (!L && it.t === "word" && it.x !== undefined) { const s2 = s * 1.15, w2 = Math.min(1000, len(it.text) * s2 * 0.55 + 100), h = s2 * 1.4; return [it.x - w2 / 2, y - h / 2, it.x + w2 / 2, y + h / 2]; }
      const x0 = x === undefined ? ((L ? 1920 : 1080) - w) / 2 : x;
      return [x0, y, x0 + w, y + s * 1.9];
    }
    case "torn": {
      const size = L ? ov.size ?? 60 : it.size ?? 52, w = Math.min(L ? 1000 : 960, Math.max(380, Math.round(len(it.text) * size * 0.5 + 3.6 * size + 70)));   // TornNote padding 1.8 × size on each side (+ tear depth)
      const x = L ? (ov.x !== undefined ? ov.x - w / 2 : (1920 - w) / 2) : it.right ? 1040 - w : (1080 - w) / 2, y = L ? ov.y ?? 850 : it.y ?? 1470;
      const lines = Math.max(1, Math.ceil(len(it.text) / Math.max(1, Math.floor((w - 3.6 * size) / (size * 0.52)))));   // same wrap estimate as TornNote
      return [x, y, x + w, y + size * 3.2 + (lines - 1) * size * 1.2];
    }
    case "nameTag": { const cx = L ? ov.x ?? 960 : it.x ?? 540, y = (L ? ov.y ?? 880 : it.y) + 40; return [cx - 300, y, cx + 300, y + 130]; }
    case "subscribe": { const x = P("x", 1300), y = P("y", 790); return [x, y, x + 560, y + 150]; }
    case "date": { const x = L ? ov.x ?? 40 : it.x ?? 40, y = L ? ov.y ?? 150 : it.y ?? 1330, w = (L ? ov.w : undefined) ?? it.w ?? 340; return [x, y, x + w, y + Math.round(w * 277 / 268) + Math.round(w * 0.45)]; }
    case "scholar": case "tphoto": { const x = L ? ov.x ?? 40 : it.x ?? 40, y = L ? ov.y ?? 150 : it.y ?? 1360, pw = (L && it.t === "tphoto" ? ov.w : it.w) ?? 300, n = 1 + (it.also?.length ?? 0), w = n * pw + (n - 1) * 24, nl = it.name ? Math.max(1, Math.ceil([...it.name].length * 28 * 0.55 / (pw - 24))) : 1, h = ((L && it.t === "tphoto" ? ov.h : it.h) ?? 370) + Math.max(78, nl * 36 + 42); return [x, y, x + w, y + h]; }
    case "scraps": {   // one scrap per word (size × 0.8 per letter + 70), wrapped on 90 % of the width, centred
      const size = L ? ov.size ?? 50 : it.size ?? 36, Wd = L ? 1920 : 1080, y = L ? ov.y ?? 845 : it.y ?? 1330, ws = String(it.text).split(" "), gap = size * 0.3;
      const widths = ws.map((wd) => size * 0.8 * len(wd) + 70); let rows = 1, cur = 0;
      for (const w of widths) { if (cur && cur + gap + w > Wd * 0.9) { rows++; cur = w; } else cur += (cur ? gap : 0) + w; }
      const w = Math.min(Wd * 0.9, widths.reduce((a, b) => a + b, 0) + gap * (ws.length - 1));
      return [(Wd - w) / 2, y, (Wd + w) / 2, y + rows * size * 1.45 + (rows - 1) * gap];
    }
    case "verse": {   // the verse card (VerseWords): header + wrapped words; full:true = the full-screen box (exclusive)
      if (!L && !it.full && (it.way === "noor" || it.way === "bigword" || (!it.way && it.only !== "port"))) return [0, 1135, 1080, 1920];   // portrait way-verse = the landscape panel drawn in the lower zone under his shrunk video (src/MontageSpec.tsx)
      const size = L ? ov.size ?? 38 : it.size ?? 44, x = L ? ov.x ?? 40 : it.x ?? 40, w = L ? ov.w ?? 600 : it.w ?? 1000, y = L ? ov.y ?? 150 : it.y ?? 1330;
      const fs1 = size * 1.12, wordW = 5 * fs1 * 0.52 + 14, per = Math.max(1, Math.floor((w - 72) / wordW)), lines = Math.max(1, Math.ceil(it.words.length / per));
      return [x, y, x + w, y + 22 + 34 + 14 + lines * fs1 * 1.9 + 30];
    }
    case "clock": { const size = L ? ov.size ?? 360 : it.size ?? 300, x = L ? ov.x ?? 140 : it.x ?? 60, y = L ? ov.y ?? 300 : it.y ?? 1330; return [x, y, x + size, y + size]; }
    case "flag": { const w = it.w ?? 220, x = L ? ov.x ?? 40 : it.x ?? 60, y = L ? ov.y ?? 150 : it.y ?? 1360; return [x, y, x + w, y + w * 0.67]; }
    case "arc": { const a = it.a, b = it.b, bot = Math.max(a.y + (a.h ?? 380), b.y + (b.h ?? 380)); return [Math.min(a.x, b.x), Math.min(a.y, b.y), Math.max(a.x + (a.w ?? 300), b.x + (b.w ?? 300)), bot + 60 + 110 + 20]; }   // the arc sags under the photos (DashArc under)
    case "pic": { const x = P("x", 40), y = P("y", 150), w = P("w", 600), h = L ? ov.h ?? Math.round((it.h * w) / it.w) : it.h; return [x, y, x + w, y + h]; }
    case "crop": { const x = P("x", 40), y = P("y", 150), w = P("w", 600), h = Math.round(((w - 20) / it.crop.w) * it.crop.h) + 78; return [x, y, x + w, y + h]; }
    case "flash": { const x = P("x", 40), y = P("y", 150), w = P("w", 600), h = L ? ov.h ?? Math.round((it.h * w) / it.w) : it.h; return [x, y, x + w, y + h + (it.name ? 48 : 0)]; }
    case "news": { const x = P("x", 40), y = P("y", 150), w = P("w", 600), h = Math.round((it.h * w) / it.w); return [x, y, x + w, y + h]; }
    case "phone": return L ? null : [it.cx - it.w / 2, it.cy - it.h / 2, it.cx + it.w / 2, it.cy + it.h / 2];
    case "scene": case "rewrite": { const x = P("x", 40), y = P("y", 150), w = P("w", 640), h = P("h", it.h ?? 400); return [x, y, x + w, y + h]; }
    case "rows": {
      const g = L ? { x: 40, w: 600, bannerY: 150, rowY: (i, t) => (t ? 285 : 150) + i * 185, rowH: 160 } : { x: 40, w: 1000, bannerY: 1440, rowY: (i, t) => (t ? 1515 : 1445) + i * 122, rowH: 112 };
      const titled = !!it.title && (L || it.rows.length < 3), rowY = (n) => (!L && it.y0 !== undefined ? it.y0 + n * (it.step ?? 112) : g.rowY(n, titled)), rowH = !L && it.rowH ? it.rowH : g.rowH;
      const gx = L && it.side === "right" ? 1920 - 40 - g.w : g.x;   // a list that no longer fits the left column continues on the right (user 2026-10-31)
      return [gx, titled ? g.bannerY : rowY(0), gx + g.w, rowY(it.rows.length - 1) + rowH];
    }
    default: return null;
  }
};
const FACE_TOL = spec.faceTol ?? 0.04;   // spec.faceTol: user-ordered larger pictures that may graze the beard edges (2026-11-11) // boxes are estimated (text widths, the generous beard margin of face_check.py): a 4 % graze is not a hit
const inter = (a, b) => Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
const area = (r) => Math.max(0, r[2] - r[0]) * Math.max(0, r[3] - r[1]);
const zoneOver = (o, a, b) => { let z = null; for (let t = a; t <= b; t += 0.5) { const q = zoneAt(t, o); z = z ? [Math.min(z[0], q[0]), Math.min(z[1], q[1]), Math.max(z[2], q[2]), Math.max(z[3], q[3])] : q; } return z; };
// the largest part of a slot that stays clear of the face zone (below / above / left / right of it)
const trim = (s, z) => {
  if (!z || !inter(s, z)) return s;
  const c = [[s[0], Math.max(s[1], z[3] + 8), s[2], s[3]], [s[0], s[1], s[2], Math.min(s[3], z[1] - 8)], [s[0], s[1], Math.min(s[2], z[0] - 8), s[3]], [Math.max(s[0], z[2] + 8), s[1], s[2], s[3]]];
  // full-width strips first (writing runs across, a 200-px side strip only wraps it), sides only when no strip ≥ 90 px is left
  const strips = c.slice(0, 2).filter((r) => r[3] - r[1] >= 90);
  return (strips.length ? strips : c).sort((p, q) => area(q) - area(p))[0];
};

// snap an item into a box: keep its size when it fits (else scale it down), centred horizontally, at the top of the box; each type's own position fields
const SNAP = new Set(["verse", "date", "torn", "scraps", "tphoto", "clock", "flag", "scholar", "pic", "crop", "flash", "news", "scene", "rewrite", "nameTag", "subscribe"]);
function snap(it, o, r, box) {
  const w = r[2] - r[0], h = r[3] - r[1], k = Math.min(1, (box[2] - box[0]) / w, (box[3] - box[1]) / h);
  const nx = Math.round(box[0] + ((box[2] - box[0]) - w * k) / 2), ny = Math.round(box[1]);
  const tgt = o === "land" ? (it.land ??= {}) : it;
  if (it.t === "torn") {   // the largest font (≤ nominal) whose note — width follows the text, +1 line of height per wrap, as TornNote draws it — fits the slot; < 30 px fails the check (shorten the phrase)
    const B = o === "land" ? 60 : it.size ?? 52, bw = box[2] - box[0], bh = box[3] - box[1];
    let s = B, nw = w;
    for (; s >= 24; s--) {
      nw = Math.min(o === "land" ? 1000 : 960, Math.max(380, Math.round(len(it.text) * s * 0.5 + 3.6 * s + 70)));
      const ln = Math.max(1, Math.ceil(len(it.text) / Math.max(1, Math.floor((nw - 3.6 * s) / (s * 0.52)))));
      if (nw <= bw && s * 3.2 + (ln - 1) * s * 1.2 <= bh) break;
    }
    if (o === "land") { tgt.x = 960; tgt.size = s; }   // the landscape torn note sits in the middle of the screen (user 2026-11-08); the face check below still judges it else if (s < B) tgt.size = s;
    tgt.y = ny; return;
  }
  if (it.t === "scraps") { tgt.y = ny; return; }
  if (it.t === "verse") {   // card width = the slot width at most; the largest font whose wrapped card fits the slot height
    const bw = box[2] - box[0], bh = box[3] - box[1], W0 = Math.min(o === "land" ? it.land?.w ?? 600 : it.w ?? 1000, bw), B = o === "land" ? 38 : it.size ?? 44;
    let s = B; for (; s >= 24; s--) { const f1 = s * 1.12, per = Math.max(1, Math.floor((W0 - 72) / (5 * f1 * 0.52 + 14))), ln = Math.max(1, Math.ceil(it.words.length / per)); if (22 + 34 + 14 + ln * f1 * 1.9 + 30 <= bh) break; }
    tgt.x = Math.round(box[0] + (bw - W0) / 2); tgt.y = ny; tgt.w = W0; tgt.size = s; return;
  }
  if (it.t === "nameTag") { tgt.x = Math.round(box[0] + (box[2] - box[0]) / 2); if (o === "land") tgt.x = Math.min(tgt.x, TITLE_BAR[0] - 16 - 300); tgt.y = ny - 40; return; }   /* a long title = a wide title bar: the card stays left of it (2026-11-15) */
  tgt.x = nx; tgt.y = ny; if (o === "land" && it.t === "subscribe") tgt.x = Math.min(nx, TITLE_BAR[0] - 16 - 560);
  if (k < 1 && it.t === "clock") tgt.size = Math.round((it.t === "clock" && (o === "land" ? it.land?.size : it.size) ? (o === "land" ? it.land.size : it.size) : o === "land" ? 360 : 300) * k);
  else if (k < 1 && it.t === "flag") it.w = Math.round((it.w ?? 220) * k);
  else if (k < 1 && it.t === "date") { tgt.w = Math.round(((o === "land" ? it.land?.w : undefined) ?? it.w ?? 340) * k); }
  else if (k < 1 && it.t === "tphoto" && o === "land") { tgt.w = Math.round(((it.land?.w) ?? 300) * k); tgt.h = Math.round(((it.land?.h) ?? 370) * k); }
  else if (k < 1 && (it.t === "scholar" || it.t === "tphoto")) { it.w = Math.round((it.w ?? 300) * k); it.h = Math.round((it.h ?? 370) * k); }
  else if (k < 1 && it.t === "pic" && o !== "land") { tgt.w = Math.round(w * k); tgt.h = Math.round(h * k); }   // a picture keeps its aspect when it shrinks (never cropped)
  else if (k < 1 && ["pic", "crop", "flash", "news"].includes(it.t)) tgt.w = Math.round(w * k);
}

if (REF && write) {   // where his face is in THIS recording, per orientation, as [from, to, x0, y0, x1, y1] runs (10-px steps): a property of the video, not of an element
  const dur = (raw.frames ?? 0) / 30, face = {};
  for (const o of ["port", "land"]) {
    const runs = [];
    for (let t = 0; t < dur; t += 0.5) {
      const q = zoneAt(t, o); if (!q) continue;
      const r = q.map((v) => Math.round(v / 10) * 10), last = runs[runs.length - 1];
      if (last && last[1] >= t - 0.01 && last.slice(2).every((v, j) => v === r[j])) last[1] = +(t + 0.5).toFixed(2); else runs.push([+t.toFixed(2), +(t + 0.5).toFixed(2), ...r]);
    }
    face[o] = runs;
  }
  if (JSON.stringify(face) !== JSON.stringify(raw.face)) { raw.face = face; refMoved++; spec = resolveGalleryRef(raw, GEO_T, G); }
}
const orients = opt("o", "") ? [opt("o", "")] : ["port", "land"];
const md = [`# الشبكة — ${spec.id}`, ""];
let bad = 0, moved = 0;
for (const o of orients) {
  const grid = G[o], res = {}, fails = [], offGrid = [], rows = [];
  const items = spec.items.map((it, i) => ({ it, i, s: spanOf(it), k: it.t === "verse" && it.full ? "exclusive" : o === "port" && it.t === "scraps" && spec.captions?.words?.length ? "ignore" : o === "port" && ((it.t === "pick" && !PICK_FULL.has(it.el)) || (it.t === "note" && (it.phrases?.length || it.way !== "card"))) ? "ignore" /* (2026-11-18) a portrait pick IS the lower-half panel of its own zone (engine pickPortBoard): no grid slot to find */ : kindOf[it.t] ?? "photo" }))
    .filter((x) => x.s && x.k !== "ignore" && !(x.it.t === "rows" && x.it.pin && o === "port") && !(x.it.only && x.it.only !== o) && !(o === "land" && x.it.land?.skip) && !(o === "land" && x.it.t === "phone"))
    .sort((a, b) => a.s[0] - b.s[0]);
  const big = items.filter((x) => x.k === "exclusive" || x.k === "solo");
  for (const x of items) {
    const [a, b] = x.s, mode = modeAt(a + 0.05, o), label = `${x.it.t}#${x.i} ${mm(a)}–${mm(b)}`;
    const wm = wrongMode(x.it, o, mode); if (wm) fails.push(`${label}: ${wm}`);
    if (o === "land" && x.k !== "exclusive") { const rb = rectOf(x.it, o); if (rb && inter(rb, TITLE_BAR) > 0) fails.push(`${label}: تحت شريط العنوان (${rb.map(Math.round).join(",")} ∩ ${TITLE_BAR.join(",")})`); }
    if (x.k === "exclusive" || x.k === "solo") {
      const clash = items.filter((y) => y !== x && y.k !== "exclusive" && y.s[0] < b - 0.1 && y.s[1] > a + 0.1);
      if (x.k === "solo" && clash.length) fails.push(`${label}: ${x.it.t === "nameTag" ? "بطاقة الاسم" : "بطاقة الاشتراك"} مع ${clash.map((y) => y.it.t + "#" + y.i).join("+")}`);
      rows.push(`| ${mm(a)}–${mm(b)} | ${mode} | كامل المحتوى | ${x.it.t}#${x.i} |`);
      if (x.k === "solo") {   // name card / subscribe: the whole content is theirs in time, their place is the grid's «solo» slot
        const r = rectOf(x.it, o), z = zoneOver(o, a, b), sl = Object.values(grid[mode]?.slots ?? {}).find((s) => s.kinds.includes("solo"));
        if (REF && write) { const nm = Object.entries(grid[mode]?.slots ?? {}).find(([, s]) => s.kinds.includes("solo"))?.[0]; if (nm) setSlot(x.i, o, nm); }
        if (r && sl && write) { const box = trim(sl.rect, z); if (o === "land" && box[2] > TITLE_BAR[0] - 12 && box[3] > TITLE_BAR[1] - 8) box[3] = Math.min(box[3], TITLE_BAR[1] - 8);   /* (2026-11-15) a long title makes the title bar wide: the name/subscribe card keeps ABOVE it instead of under it */
        if (!REF && (r[0] < box[0] - 4 || r[1] < box[1] - 4 || r[2] > box[2] + 4 || r[3] > box[3] + 4)) { snap(x.it, o, r, box); moved++; } }
        const r2 = rectOf(x.it, o);
        if (r2 && inter(r2, z) > FACE_TOL * area(r2)) fails.push(`${label}: فوق الوجه`);
      }
      continue;
    }
    const under = big.find((y) => y.k === "exclusive" && y.s[0] < b - 0.1 && y.s[1] > a + 0.1 && !(o === "port" && mode === "half") && !(y.it.t === "full" && (spec.behind ?? []).some((bw) => bw.from <= y.s[0] + 0.05 && bw.to >= y.s[1] - 0.05)));   // a B-roll behind him (iso window) lets the key notes stay on top (user 2026-10-31)
    if (under) fails.push(`${label}: فوق عنصر كبير ${under.it.t}#${under.i} (${mm(under.s[0])}–${mm(under.s[1])})`);
    const z = zoneOver(o, a, b), kk = x.it.t === "verse" && !x.it.full && mode === "half" ? "verse" : x.k, slots = Object.entries(grid[mode]?.slots ?? {}).filter(([, s]) => s.kinds.includes(kk));
    const busy = (n) => (res[mode + n] ?? []).some(([p, q]) => p < b + 0.15 && q > a - 0.15);
    let free;
    if (x.it.t === "rows" && o === "land" && !x.it.pin) {   // the renderer draws a landscape list on the LEFT unless side:"right": the planner must reserve the side it will really be drawn on (a list planned «right» but drawn left sat on top of the left photo, user 2026-11-08) and flip `side` itself when the wanted side is taken in time
      const want = x.it.side === "right" ? "right" : "left", other = want === "right" ? "left" : "right";
      free = slots.find(([n]) => n === want && !busy(n)) ?? (write ? slots.find(([n]) => n === other && !busy(n)) : undefined);
      if (free && free[0] !== want && write) { if (free[0] === "right") x.it.side = "right"; else delete x.it.side; }
    } else { const want = x.it.side; free = (want ? slots.find(([n]) => n === want && !busy(n)) : undefined) ?? slots.find(([n]) => !busy(n)); }   /* (user 2026-11-18) a picture with a side («side»: the person he points to with that hand) keeps it */
    let r = rectOf(x.it, o);
    if (REF && write && r && z && inter(r, z) > FACE_TOL * area(r) && CARD_TYPES.has(x.it.t)) {   // its gallery place covers his face here: the first free slot of its kind where it does not
      const w = r[2] - r[0], h = r[3] - r[1];
      const alt = slots.filter(([n]) => !busy(n)).map(([n, s]) => [n, s, [s.rect[0] + Math.max(0, s.rect[2] - s.rect[0] - w) / 2, s.rect[1], s.rect[0] + Math.max(0, s.rect[2] - s.rect[0] - w) / 2 + w, s.rect[1] + h]]).find(([, , q]) => inter(q, z) <= FACE_TOL * area(q));
      if (alt) { const o0 = raw.items[x.i]; o0.slot = { ...(o0.slot ?? {}), [o]: alt[0] }; refMoved++; free = [alt[0], alt[1]]; spec = resolveGalleryRef(raw, GEO_T, G); x.it = spec.items[x.i]; r = rectOf(x.it, o); }
    }
    if (r && z && inter(r, z) > FACE_TOL * area(r)) fails.push(   /* z is null where no face zone is defined (2026-11-12 crash) */`${label}: فوق الوجه (${r.map(Math.round).join(",")} ∩ ${z.map(Math.round).join(",")})`);
    if (!free) { fails.push(`${label}: لا خانة ${x.k} فارغة في وضع ${mode} — أخّره أو قدّمه`); continue; }
    const [name, slot] = free, box = trim(slot.rect, z);
    if (REF && write && SNAP.has(x.it.t)) setSlot(x.i, o, name);   // the slot's NAME; the engine fits the element into it from the gallery's size
    (res[mode + name] ??= []).push([a, b]);
    rows.push(`| ${mm(a)}–${mm(b)} | ${mode} | ${name} [${box.map(Math.round).join(",")}] | ${x.it.t}#${x.i}${x.it.text ? " «" + String(x.it.text).slice(0, 30) + "»" : x.it.name ? " " + x.it.name : ""} |`);
    if (r && (r[0] < box[0] - 4 || r[1] < box[1] - 4 || r[2] > box[2] + 4 || r[3] > box[3] + 4)) {
      offGrid.push(`${label} → ${name}`);
      if (write && SNAP.has(x.it.t) && !REF) { snap(x.it, o, r, box); moved++; }
    }
  }
  bad += fails.length;
  console.log(`[${o}] ${items.length} عنصراً · ${Object.values(res).reduce((n, v) => n + v.length, 0)} في خانات · ${fails.length ? "✘ " + fails.length + " مشكلة" : "✔ لا تداخل ولا شيء فوق الوجه"}${offGrid.length ? ` · ${offGrid.length} خارج خانته${write ? " (نُقل ما يُنقل)" : " (--write ينقلها)"}` : ""}`);
  for (const f of fails.slice(0, 25)) console.log("  ✘ " + f);
  if (fails.length > 25) console.log(`  … و${fails.length - 25} غيرها (التفصيل في grid.md)`);
  md.push(`## ${o === "land" ? "العرضي" : "الطولي"}`, "", "| الوقت | الوضع | الخانة | العنصر |", "|---|---|---|---|", ...rows, "", ...(fails.length ? ["### مشكلات", ...fails.map((f) => "- " + f), ""] : []), ...(offGrid.length ? ["### خارج خانته", ...offGrid.map((f) => "- " + f), ""] : []));
}
// text inside a torn strip is never shrunk below 26 px to fit a slot (user 2026-11-03: tiny text with no visible margin in the half-screen strip) — shorten the phrase instead
for (const o of orients) for (const [i, it] of spec.items.entries()) {
  if (it.t !== "torn" || (it.only && it.only !== o)) continue;
  const sz = o === "land" ? it.land?.size ?? 60 : it.size ?? 52;
  if (sz < 26) { bad++; console.log(`  ✘ torn#${i} [${o}] ${mm(it.at)}: الخط ${sz}px أصغر من 26 ليتسع في خانته — اختصر العبارة (هامش الشريط الممزق إلزامي)`); md.push(`- torn#${i} [${o}] نص أصغر من 26px: اختصر العبارة`); }
}
const T = path.join(".tmp", spec.id); fs.mkdirSync(T, { recursive: true });
fs.writeFileSync(path.join(T, "grid.md"), md.join("\n"));
if (write && moved && !REF) { fs.writeFileSync(specF, JSON.stringify(spec, null, 1)); console.log(`نُقل ${moved} عنصراً إلى خاناته في ${specF}`); }
if (write && REF && refMoved) {   // the spec now names the slots and knows the face: judge the result exactly as the engine will draw it
  fs.writeFileSync(specF, JSON.stringify(raw, null, 1));
  console.log(`سُجّل ${refMoved} أمراً يخص هذا الفيديو (اسم الخانة أو مكان الوجه) في ${specF} — المقاسات والأماكن تبقى من المعرض`);
  const { spawnSync } = await import("node:child_process");
  const again = spawnSync(process.execPath, [import.meta.filename, specF, ...(opt("o", "") ? ["--o", opt("o", "")] : [])], { stdio: "inherit" });
  process.exit(again.status ?? 1);
}
console.log(bad ? `FAILED (${bad}) → ${path.join(T, "grid.md")}` : `PASSED → ${path.join(T, "grid.md")}`);
process.exit(bad ? 1 : 0);
