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
const spec = JSON.parse(fs.readFileSync(specF, "utf8"));
const G = JSON.parse(fs.readFileSync(path.join("data", "layout_grids.json"), "utf8"));
const kindOf = {}; for (const [k, ts] of Object.entries(G.kinds)) for (const t of ts) kindOf[t] = k;
const zoneAt = faceZoner(spec);
// the landscape title bar (src/TitleBar.tsx): right 34, bottom 24, its width follows the title (380–900), ≈ 110 px with the credit line under it — nothing may sit under it
const TITLE_BAR = [Math.round(1920 - 34 - Math.min(900, Math.max(380, String(spec.title ?? "").length * 14 + 180))), 1080 - 24 - 110, 1886, 1056];
// each element belongs to ONE screen mode (user 2026-10-31; data/elements_lab.json `mode`): a half-screen element (his key word, the opponent's words)
// used while the screen is not split is an error — e.g. the key-word chip over his whole frame (allah_taht 4:22, «لماذا يُستخدم هذا في وضع الشاشة الكاملة؟»)
const LAB_MODE = Object.fromEntries(JSON.parse(fs.readFileSync(path.join("data", "elements_lab.json"), "utf8")).map((m) => [m.id, m]));
const ELEMENT_OF = { word: "Word", blur: "BlurRise" };   // the half-screen-only elements the user named (his key word, the opponent's words)
const MODE_AR = { full: "ملء الشاشة", half: "نصف الشاشة", iso: "عزل الخلفية" };
const wrongMode = (it, o, mode) => { const m = LAB_MODE[ELEMENT_OF[it.t]]; if (!m || (m.orient && m.orient !== "both" && m.orient !== o)) return null; return m.mode !== mode ? `${m.ar} (${ELEMENT_OF[it.t]}) عنصر ${MODE_AR[m.mode]} وهو هنا في ${MODE_AR[mode]}` : null; };
const mm = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const inW = (ws, t) => (ws ?? []).some((w) => t >= w.from && t < w.to);

// three screen modes (user 2026-10-31): half = a source shown beside him (splits / psplits / his window shifted for a panel); iso = his background isolated with something behind him; full = the rest
const modeAt = (t, o) => (inW(spec.splits, t) || (o === "port" && inW(spec.psplits, t)) || (o === "land" && (inW(spec.shifts, t) || (spec.behind ?? []).some((b) => b.dx !== undefined && t >= b.from && t < b.to))) ? "half"
  : (spec.behind ?? []).some((b) => b.dx === undefined && t >= b.from && t < b.to) ? "iso" : "full");

const spanOf = (it) => {
  if (it.t === "nameTag") return [it.at, it.at + (it.dur ?? 4)];
  if (it.t === "scholar" || it.t === "tphoto") return [it.at, it.until ?? it.at + 6];
  if (it.t === "rewrite") return [it.oldAt - 0.4, it.until ?? it.newAt + 8];
  if (it.t === "verse") return [it.times[0], it.until ?? it.times[it.times.length - 1] + 1.2];
  const a = it.at ?? it.from, b = it.until ?? it.to ?? (it.dur != null ? a + it.dur : a + 3);
  return a == null ? null : [a, b];
};

// the item's drawn box (mirrors renderItem in src/MontageSpec.tsx; text widths estimated from the glyph count)
const len = (s) => String(s ?? "").replace(/[ً-ٰٟۖ-ۭ]/g, "").length;
const rectOf = (it, o) => {
  const L = o === "land", ov = it.land ?? {}, P = (k, d) => (L ? ov[k] ?? d : it[k] ?? d);
  switch (it.t) {
    case "word": case "blur": {
      if (!L && it.t === "blur") { const s = it.size ?? 58; return [40, it.y, 1040, it.y + s * 1.5]; }
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
    case "scholar": case "tphoto": { const x = L ? ov.x ?? 40 : it.x ?? 40, y = L ? ov.y ?? 150 : it.y ?? 1360, pw = (L ? ov.w : undefined) ?? it.w ?? 300, n = 1 + (it.also?.length ?? 0), w = n * pw + (n - 1) * 24, h = ((L ? ov.h : undefined) ?? it.h ?? 370) + 78; return [x, y, x + w, y + h]; }
    case "scraps": {   // one scrap per word (size × 0.8 per letter + 70), wrapped on 90 % of the width, centred
      const size = L ? ov.size ?? 50 : it.size ?? 36, Wd = L ? 1920 : 1080, y = L ? ov.y ?? 845 : it.y ?? 1330, ws = String(it.text).split(" "), gap = size * 0.3;
      const widths = ws.map((wd) => size * 0.8 * len(wd) + 70); let rows = 1, cur = 0;
      for (const w of widths) { if (cur && cur + gap + w > Wd * 0.9) { rows++; cur = w; } else cur += (cur ? gap : 0) + w; }
      const w = Math.min(Wd * 0.9, widths.reduce((a, b) => a + b, 0) + gap * (ws.length - 1));
      return [(Wd - w) / 2, y, (Wd + w) / 2, y + rows * size * 1.45 + (rows - 1) * gap];
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
const FACE_TOL = 0.04;   // boxes are estimated (text widths, the generous beard margin of face_check.py): a 4 % graze is not a hit
const inter = (a, b) => Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
const area = (r) => Math.max(0, r[2] - r[0]) * Math.max(0, r[3] - r[1]);
const zoneOver = (o, a, b) => { let z = null; for (let t = a; t <= b; t += 0.5) { const q = zoneAt(t, o); z = z ? [Math.min(z[0], q[0]), Math.min(z[1], q[1]), Math.max(z[2], q[2]), Math.max(z[3], q[3])] : q; } return z; };
// the largest part of a slot that stays clear of the face zone (below / above / left / right of it)
const trim = (s, z) => {
  if (!inter(s, z)) return s;
  const c = [[s[0], Math.max(s[1], z[3] + 8), s[2], s[3]], [s[0], s[1], s[2], Math.min(s[3], z[1] - 8)], [s[0], s[1], Math.min(s[2], z[0] - 8), s[3]], [Math.max(s[0], z[2] + 8), s[1], s[2], s[3]]];
  // full-width strips first (writing runs across, a 200-px side strip only wraps it), sides only when no strip ≥ 90 px is left
  const strips = c.slice(0, 2).filter((r) => r[3] - r[1] >= 90);
  return (strips.length ? strips : c).sort((p, q) => area(q) - area(p))[0];
};

// snap an item into a box: keep its size when it fits (else scale it down), centred horizontally, at the top of the box; each type's own position fields
const SNAP = new Set(["date", "torn", "scraps", "tphoto", "clock", "flag", "scholar", "pic", "crop", "flash", "news", "scene", "rewrite", "nameTag", "subscribe"]);
function snap(it, o, r, box) {
  const w = r[2] - r[0], h = r[3] - r[1], k = Math.min(1, (box[2] - box[0]) / w, (box[3] - box[1]) / h);
  const nx = Math.round(box[0] + ((box[2] - box[0]) - w * k) / 2), ny = Math.round(box[1]);
  const tgt = o === "land" ? (it.land ??= {}) : it;
  if (it.t === "torn") { if (o === "land") tgt.x = Math.round(nx + (w * k) / 2); tgt.y = ny; if (k < 1) tgt.size = Math.round((o === "land" ? it.land?.size ?? 60 : it.size ?? 52) * k); return; }   // a note too wide for the slot gets a smaller font (its width follows the text)
  if (it.t === "scraps") { tgt.y = ny; return; }
  if (it.t === "nameTag") { tgt.x = Math.round(box[0] + (box[2] - box[0]) / 2); tgt.y = ny - 40; return; }
  tgt.x = nx; tgt.y = ny;
  if (k < 1 && it.t === "clock") tgt.size = Math.round((it.t === "clock" && (o === "land" ? it.land?.size : it.size) ? (o === "land" ? it.land.size : it.size) : o === "land" ? 360 : 300) * k);
  else if (k < 1 && it.t === "flag") it.w = Math.round((it.w ?? 220) * k);
  else if (k < 1 && it.t === "date") { tgt.w = Math.round(((o === "land" ? it.land?.w : undefined) ?? it.w ?? 340) * k); }
  else if (k < 1 && it.t === "tphoto" && o === "land") { tgt.w = Math.round(((it.land?.w) ?? it.w ?? 300) * k); tgt.h = Math.round(((it.land?.h) ?? it.h ?? 370) * k); }
  else if (k < 1 && (it.t === "scholar" || it.t === "tphoto")) { it.w = Math.round((it.w ?? 300) * k); it.h = Math.round((it.h ?? 370) * k); }
  else if (k < 1 && ["pic", "crop", "flash", "news"].includes(it.t)) tgt.w = Math.round(w * k);
}

const orients = opt("o", "") ? [opt("o", "")] : ["port", "land"];
const md = [`# الشبكة — ${spec.id}`, ""];
let bad = 0, moved = 0;
for (const o of orients) {
  const grid = G[o], res = {}, fails = [], offGrid = [], rows = [];
  const items = spec.items.map((it, i) => ({ it, i, s: spanOf(it), k: kindOf[it.t] ?? "photo" }))
    .filter((x) => x.s && x.k !== "ignore" && !(x.it.t === "rows" && x.it.pin && o === "port") && !(x.it.only && x.it.only !== o) && !(o === "land" && x.it.land?.skip) && !(o === "land" && x.it.t === "phone"))
    .sort((a, b) => a.s[0] - b.s[0]);
  const big = items.filter((x) => x.k === "exclusive" || x.k === "solo");
  for (const x of items) {
    const [a, b] = x.s, mode = modeAt(a + 0.05, o), label = `${x.it.t}#${x.i} ${mm(a)}–${mm(b)}`;
    const wm = wrongMode(x.it, o, mode); if (wm) fails.push(`${label}: ${wm}`);
    if (o === "land" && x.k !== "exclusive") { const rb = rectOf(x.it, o); if (rb && inter(rb, TITLE_BAR) > 0) fails.push(`${label}: تحت شريط العنوان (${rb.map(Math.round).join(",")} ∩ ${TITLE_BAR.join(",")})`); }
    if (x.k === "exclusive" || x.k === "solo") {
      const clash = items.filter((y) => y !== x && y.k !== "exclusive" && y.s[0] < b - 0.1 && y.s[1] > a + 0.1);
      if (x.k === "solo" && x.it.t === "nameTag" && clash.length) fails.push(`${label}: بطاقة الاسم مع ${clash.map((y) => y.it.t + "#" + y.i).join("+")}`);
      rows.push(`| ${mm(a)}–${mm(b)} | ${mode} | كامل المحتوى | ${x.it.t}#${x.i} |`);
      if (x.k === "solo") {   // name card / subscribe: the whole content is theirs in time, their place is the grid's «solo» slot
        const r = rectOf(x.it, o), z = zoneOver(o, a, b), sl = Object.values(grid[mode]?.slots ?? {}).find((s) => s.kinds.includes("solo"));
        if (r && sl && write) { const box = trim(sl.rect, z); if (r[0] < box[0] - 4 || r[1] < box[1] - 4 || r[2] > box[2] + 4 || r[3] > box[3] + 4) { snap(x.it, o, r, box); moved++; } }
        const r2 = rectOf(x.it, o);
        if (r2 && inter(r2, z) > FACE_TOL * area(r2)) fails.push(`${label}: فوق الوجه`);
      }
      continue;
    }
    const under = big.find((y) => y.k === "exclusive" && y.s[0] < b - 0.1 && y.s[1] > a + 0.1 && !(o === "port" && mode === "half") && !(y.it.t === "full" && (spec.behind ?? []).some((bw) => bw.from <= y.s[0] + 0.05 && bw.to >= y.s[1] - 0.05)));   // a B-roll behind him (iso window) lets the key notes stay on top (user 2026-10-31)
    if (under) fails.push(`${label}: فوق عنصر كبير ${under.it.t}#${under.i} (${mm(under.s[0])}–${mm(under.s[1])})`);
    const z = zoneOver(o, a, b), slots = Object.entries(grid[mode]?.slots ?? {}).filter(([, s]) => s.kinds.includes(x.k));
    const free = slots.filter(([n]) => !(x.it.t === "rows" && o === "land" && x.it.side === "right") || n === "right").find(([n]) => !(res[mode + n] ?? []).some(([p, q]) => p < b + 0.15 && q > a - 0.15));
    const r = rectOf(x.it, o);
    if (r && inter(r, z) > FACE_TOL * area(r)) fails.push(`${label}: فوق الوجه (${r.map(Math.round).join(",")} ∩ ${z.map(Math.round).join(",")})`);
    if (!free) { fails.push(`${label}: لا خانة ${x.k} فارغة في وضع ${mode} — أخّره أو قدّمه`); continue; }
    const [name, slot] = free, box = trim(slot.rect, z);
    (res[mode + name] ??= []).push([a, b]);
    rows.push(`| ${mm(a)}–${mm(b)} | ${mode} | ${name} [${box.map(Math.round).join(",")}] | ${x.it.t}#${x.i}${x.it.text ? " «" + String(x.it.text).slice(0, 30) + "»" : x.it.name ? " " + x.it.name : ""} |`);
    if (r && (r[0] < box[0] - 4 || r[1] < box[1] - 4 || r[2] > box[2] + 4 || r[3] > box[3] + 4)) {
      offGrid.push(`${label} → ${name}`);
      if (write && SNAP.has(x.it.t)) { snap(x.it, o, r, box); moved++; }
    }
  }
  bad += fails.length;
  console.log(`[${o}] ${items.length} عنصراً · ${Object.values(res).reduce((n, v) => n + v.length, 0)} في خانات · ${fails.length ? "✘ " + fails.length + " مشكلة" : "✔ لا تداخل ولا شيء فوق الوجه"}${offGrid.length ? ` · ${offGrid.length} خارج خانته${write ? " (نُقل ما يُنقل)" : " (--write ينقلها)"}` : ""}`);
  for (const f of fails.slice(0, 25)) console.log("  ✘ " + f);
  if (fails.length > 25) console.log(`  … و${fails.length - 25} غيرها (التفصيل في grid.md)`);
  md.push(`## ${o === "land" ? "العرضي" : "الطولي"}`, "", "| الوقت | الوضع | الخانة | العنصر |", "|---|---|---|---|", ...rows, "", ...(fails.length ? ["### مشكلات", ...fails.map((f) => "- " + f), ""] : []), ...(offGrid.length ? ["### خارج خانته", ...offGrid.map((f) => "- " + f), ""] : []));
}
const T = path.join(".tmp", spec.id); fs.mkdirSync(T, { recursive: true });
fs.writeFileSync(path.join(T, "grid.md"), md.join("\n"));
if (write && moved) { fs.writeFileSync(specF, JSON.stringify(spec, null, 1)); console.log(`نُقل ${moved} عنصراً إلى خاناته في ${specF}`); }
console.log(bad ? `FAILED (${bad}) → ${path.join(T, "grid.md")}` : `PASSED → ${path.join(T, "grid.md")}`);
process.exit(bad ? 1 : 0);
