/* eslint-disable */
// @ts-nocheck — the fitting below is a verbatim JavaScript copy of tools/grid_plan.mjs
/**
 * ELEMENTS BY REFERENCE (user 2026-11-17: «البرنامج لما بده يضيف أداة يختار الأداة ويعدل النصوص القابلة للتعديل فيها فقط… إذا عدلت الأداة في المعرض يتعدل على كل الفيديوهات
 * بدون طلب»). A spec with `galleryRef: true` keeps, for every element, only its gallery code (t / el), its content (texts, pictures, names, numbers) and its timing.
 * Size and place are NOT copied into the spec: they are taken here, at render time, from the gallery samples (data/gallery_geo.json, generated from src/RealLab.tsx by
 * tools/gallery_geo.mjs), so changing an element in the gallery changes it in every such video at once. What stays per video (the user's choice, 2026-11-17):
 *   · `slot: { port?, land? }` = the NAME of the gallery-grid slot (data/layout_grids.json) the element sits in in this video (written by tools/grid_plan.mjs --write);
 *   · `face` (spec level) = where his face is over time in this recording, per orientation: [from, to, x0, y0, x1, y1] runs (a property of the video, grid_plan --write);
 *     the element is fitted into its slot minus that face zone at render time, with the same fitting the grid used to write as numbers (src/galleryFit.ts);
 *   · `ratio` (pictures) = the picture's own height/width, so the card keeps the gallery width and the whole picture shows;
 *   · `placeOwn: true` = an element the user placed by hand: left exactly as written.
 * Old specs (no `galleryRef`) are returned untouched. Pure, one file, no imports: the Remotion bundle and the node tools (grid_plan, el) use the same code.
 */
export type Geo = { x?: number; y?: number; w?: number; h?: number; size?: number };
export type GalleryGeo = Record<string, { port?: Geo; land?: Geo }>;
type Slot = { rect: number[]; kinds: string[] };
export type Grids = Record<string, Record<string, { slots?: Record<string, Slot> } | undefined> | undefined>;
type Item = Record<string, unknown> & { t: string };
type FaceRun = number[];
/** his face zone over [a, b] in one orientation: the union of the runs that overlap it */
const faceOver = (runs: FaceRun[] | undefined, a: number, b: number): number[] | null => {
  let z: number[] | null = null;
  for (const r of runs ?? []) if (r[0] < b && r[1] > a) z = z ? [Math.min(z[0], r[2]), Math.min(z[1], r[3]), Math.max(z[2], r[4]), Math.max(z[3], r[5])] : r.slice(2, 6);
  return z;
};

export const GEO_KEYS = ["x", "y", "w", "h", "size"] as const;
/** cards: x, y = their top-left corner (a slot puts them centred in it) */
export const CARD_TYPES = new Set(["tphoto", "scholar", "pic", "news", "date", "flag", "clock"]);
export const geoKey = (it: { t: string; style?: unknown }): string => (it.t === "nameTag" && it.style === "pinned" ? "nameTag:pinned" : it.t);
export const slotRect = (grids: Grids, o: "port" | "land", name: string): number[] | null => {
  for (const m of Object.values(grids[o] ?? {})) { const s = m?.slots?.[name]; if (s) return s.rect; }
  return null;
};
/** a picture card of gallery width w (and gallery height h) whose picture has height/width = ratio: [w, h] keeping the whole picture (as tools/gallery_geometry.mjs) */
const fitPicture = (it: Item, w: number, h: number, ratio: number): [number, number] => {
  const mx = it.t === "tphoto" ? 40 : it.t === "scholar" ? 20 : 10;
  const name = typeof it.name === "string" ? it.name : "", sub = it.sub ? 22 : 0;
  const extra = it.t === "tphoto" ? 20 : it.t === "scholar" ? (name ? Math.max(1, Math.ceil((name.length * 15.5) / (w - 24))) * 38 + 40 + sub : 0) : 10;
  let W = w, H = Math.round((W - mx) * ratio + extra);
  if (H > h * 1.5) { H = Math.round(h * 1.5); W = Math.round((H - extra) / ratio + mx); }
  return [W, H];
};

export function resolveGalleryRef<S extends { items: unknown[] }>(spec: S, geo: GalleryGeo, grids: Grids): S {
  const s = spec as unknown as { galleryRef?: boolean; splits?: { from: number; to: number }[]; title?: string; face?: Partial<Record<"port" | "land", FaceRun[]>>; items: Item[] };
  if (!s.galleryRef) return spec;
  const TB = titleBarOf(s.title ?? ""); setTitleBar(TB);
  const items = s.items.map((it0) => {
    if (it0.placeOwn) return it0;
    const g = geo[geoKey(it0 as { t: string; style?: unknown })] ?? {};
    const it: Item = { ...it0 }, land: Record<string, unknown> = { ...((it0.land as Record<string, unknown> | undefined) ?? {}) };
    for (const k of GEO_KEYS) { delete it[k]; if (!land.panel) delete land[k]; }
    Object.assign(it, g.port ?? {});
    if (!land.panel) Object.assign(land, g.land ?? {});
    const ratio = typeof it0.ratio === "number" && it0.ratio > 0 ? it0.ratio : null;
    if (ratio && ["tphoto", "scholar", "pic"].includes(it.t)) {
      const pw = (it.w as number | undefined) ?? 600, ph = (it.h as number | undefined) ?? 400, [W, H] = fitPicture(it, pw, ph, ratio);
      if (it.x != null) it.x = (it.x as number) + Math.round((pw - W) / 2);
      it.w = W; it.h = H;
      if (!land.panel) { const lw = (land.w as number | undefined) ?? (it.t === "pic" ? 600 : 300), lh = (land.h as number | undefined) ?? (it.t === "pic" ? 400 : 370), [LW, LH] = fitPicture(it, lw, lh, ratio); land.w = LW; land.h = LH; }
    }
    /* (user 2026-11-17, frame 4545: «صور الأخبار يجب أن تظهر صفحة كاملة») a news page keeps its own proportions: the engine sizes it from it.h/it.w */
    if (ratio && it.t === "news") { const pw = (it.w as number | undefined) ?? 700; it.w = pw; it.h = Math.round(pw * ratio); }
    it.land = land;
    // fitted into its slot of this video, away from his face (the fitting the grid used to write as numbers, now done here from the gallery's size)
    const slot = (it0.slot ?? {}) as { port?: string; land?: string }, sp = spanOf(it);
    for (const o of ["port", "land"] as const) {
      const n = slot[o]; if (!n || !SNAP.has(it.t) || land.panel && o === "land") continue;
      const rect = slotRect(grids, o, n); if (!rect || !sp) continue;
      /* a picture that starts inside a split window is drawn in the gap only until that window ends (MontageSpec behindGaps): his face is judged over that part only */
      const win = o === "land" ? (s.splits ?? []).find((w) => sp[0] >= w.from - 0.05 && sp[0] < w.to) : undefined;
      let box = trim(rect, faceOver(s.face?.[o], sp[0], win ? Math.min(sp[1], win.to) : sp[1]));
      if (o === "land" && (it.t === "nameTag" || it.t === "subscribe") && box[2] > TB[0] - 12 && box[3] > TB[1] - 8) box = [box[0], box[1], box[2], Math.min(box[3], TB[1] - 8)];
      const r = rectOf(it, o);
      if (r && (r[0] < box[0] - 4 || r[1] < box[1] - 4 || r[2] > box[2] + 4 || r[3] > box[3] + 4)) snap(it, o, r, box);
      /* (user 2026-11-20: «يجب ببساطة أن تلتزم بالموقع على الشبكة») the slot box travels with the item: the engine (MontageSpec withGallery) grows it by the
         gallery's size only up to this box and never moves it out, so where it is drawn = a number known before any render (tools/coverage_check judges it) */
      if (r) ((it._box ??= {}) as Record<string, unknown>)[o] = { box, mid: n === "panel" };
    }
    if (!Object.keys(it.land as object).length) delete it.land;
    return it;
  });
  return { ...spec, items } as S;
}

// ── a verbatim copy of the box estimates and the slot fitting of tools/grid_plan.mjs (rectOf / trim / snap), so the ENGINE can fit an element into its slot
// at render time from the gallery's size (src/galleryRef.ts, user 2026-11-17). Copied from grid_plan: keep the two in step (the grid keeps its own copy for the old specs).
// TITLE_BAR comes from the spec's title (src/TitleBar.tsx widths).
const titleBarOf = (title: string) => [Math.round(1920 - 34 - Math.min(900, Math.max(380, String(title ?? "").length * 14 + 180))), 1080 - 24 - 110, 1886, 1056];
let TITLE_BAR = [1500, 946, 1886, 1056];
const setTitleBar = (r) => { TITLE_BAR = r; };
const len = (s) => String(s ?? "").replace(/[ً-ٰٟۖ-ۭ]/g, "").length;
const spanOf = (it) => {
  if (it.t === "nameTag") return [it.at, it.at + (it.dur ?? 4)];
  if (it.t === "scholar" || it.t === "tphoto") return [it.at, it.until ?? it.at + 6];
  if (it.t === "rewrite") return [it.oldAt - 0.4, it.until ?? it.newAt + 8];
  if (it.t === "verse" || it.t === "hadith") return [it.times[0], it.until ?? it.times[it.times.length - 1] + 1.2];
  const a = it.at ?? it.from, b = it.until ?? it.to ?? (it.dur != null ? a + it.dur : a + 3);
  return a == null ? null : [a, b];
};
export const rectOf = (it, o) => {
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
    case "scholar": case "tphoto": { const x = L ? ov.x ?? 40 : it.x ?? 40, y = L ? ov.y ?? 150 : it.y ?? 1360, pw = (L ? (it.t === "tphoto" ? ov.w : ov.w ?? it.w) : it.w) ?? 300, n = 1 + (it.also?.length ?? 0), w = n * pw + (n - 1) * 24, nl = it.name ? Math.max(1, Math.ceil([...it.name].length * 28 * 0.55 / (pw - 24))) : 1, h = ((L ? (it.t === "tphoto" ? ov.h : ov.h ?? it.h) : it.h) ?? 370) + Math.max(78, nl * 36 + 42); return [x, y, x + w, y + h]; }
    case "scraps": {   // one scrap per word (size × 0.8 per letter + 70), wrapped on 90 % of the width, centred
      const size = L ? ov.size ?? 50 : it.size ?? 36, Wd = L ? 1920 : 1080, y = L ? ov.y ?? 845 : it.y ?? 1330, ws = String(it.text).split(" "), gap = size * 0.3;
      const widths = ws.map((wd) => size * 0.8 * len(wd) + 70); let rows = 1, cur = 0;
      for (const w of widths) { if (cur && cur + gap + w > Wd * 0.9) { rows++; cur = w; } else cur += (cur ? gap : 0) + w; }
      const w = Math.min(Wd * 0.9, widths.reduce((a, b) => a + b, 0) + gap * (ws.length - 1));
      return [(Wd - w) / 2, y, (Wd + w) / 2, y + rows * size * 1.45 + (rows - 1) * gap];
    }
    case "verse": {   // the verse card (VerseWords): header + wrapped words; full:true = the full-screen box (exclusive)
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
const inter = (a, b) => Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
const area = (r) => Math.max(0, r[2] - r[0]) * Math.max(0, r[3] - r[1]);
const trim = (s, z) => {
  if (!z || !inter(s, z)) return s;
  const c = [[s[0], Math.max(s[1], z[3] + 8), s[2], s[3]], [s[0], s[1], s[2], Math.min(s[3], z[1] - 8)], [s[0], s[1], Math.min(s[2], z[0] - 8), s[3]], [Math.max(s[0], z[2] + 8), s[1], s[2], s[3]]];
  // full-width strips first (writing runs across, a 200-px side strip only wraps it), sides only when no strip ≥ 90 px is left
  const strips = c.slice(0, 2).filter((r) => r[3] - r[1] >= 90);
  return (strips.length ? strips : c).sort((p, q) => area(q) - area(p))[0];
};
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
  if (it.t === "scraps") {   // (engine copy, 2026-11-17) the gallery's font when it fits, else the largest one whose scraps fit the slot (width and height)
    tgt.y = ny; const base = (tgt.size as number | undefined) ?? (o === "land" ? 50 : 36);
    for (let s = base; s >= 24; s--) { tgt.size = s; const q = rectOf(it, o); if (!q || (q[2] - q[0] <= box[2] - box[0] + 4 && q[3] <= box[3] + 4)) break; }
    return;
  }
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

/** (user 2026-11-20: «يجب ببساطة أن تلتزم بالموقع على الشبكة») where a slot-fitted item is DRAWN, as numbers: grown by k0 (gallery × own size) only up to its slot box
 *  (`_box`, written above), centred across the slot (top-aligned; centred in the dossier gap «panel»), about the centre of its declared box (rectOf).
 *  The engine (MontageSpec withGallery) draws it with these numbers and tools/slot_boxes.mjs judges the same numbers — no picture needed. */
export const slotFit = (it, o, k0) => {
  const e = (it._box ?? {})[o]; if (!e) return null;
  const r = rectOf(it, o); if (!r) return null;
  const [x0, y0, x1, y1] = e.box, rw = r[2] - r[0], rh = r[3] - r[1]; if (rw <= 0 || rh <= 0) return null;
  const k = Math.min(k0, (x1 - x0) / rw, (y1 - y0) / rh), rcx = (r[0] + r[2]) / 2, rcy = (r[1] + r[3]) / 2;
  const cx = (x0 + x1) / 2, cy = e.mid ? (y0 + y1) / 2 : y0 + (rh * k) / 2;
  return { dx: Math.round(cx - rcx), dy: Math.round(cy - rcy), k: +k.toFixed(4), ox: rcx, oy: rcy, drawn: [cx - (rw * k) / 2, cy - (rh * k) / 2, cx + (rw * k) / 2, cy + (rh * k) / 2].map(Math.round) };
};
