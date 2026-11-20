// WHERE EVERY ELEMENT IS DRAWN, AS NUMBERS — no render, no picture (user 2026-11-20: «التحريك لا يحتاج إلى الوصف، يحتاج فقط إلى حساب مواقع، ولا تحتاج أن تأخذ صور»).
// A `galleryRef` spec puts each element in a slot of the grid (data/layout_grids.json); the engine draws it at src/galleryRef.ts slotFit (the gallery's size,
// never beyond the slot). This tool computes the same numbers and refuses:
//   · a box that leaves the screen;
//   · a box over his face zone (spec.face runs, the part of its time it is really shown);
//   · inside a split window: a box over either card (the clip card / his card, from src/DebateLayouts.tsx box(), his card slid aside while a picture is in the gap);
//   · two boxes on screen at the same moment that overlap.
//   node tools/slot_boxes.mjs <p> [--list]      (exit 1 when something is refused; --list prints every box)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(ROOT);
const [p] = process.argv.slice(2), LIST = process.argv.includes("--list");
if (!p) { console.error("usage: node tools/slot_boxes.mjs <p> [--list]"); process.exit(2); }
const { resolveGalleryRef, slotFit, rectOf } = await import("../src/galleryRef.ts");
const J = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
const spec0 = J(`data/specs/${p}.json`);
if (!spec0.galleryRef) { console.log("— هذه المواصفة لا تأخذ أماكنها من الشبكة (galleryRef)، لا شيء يُحسب"); process.exit(0); }
const spec = resolveGalleryRef(spec0, J("data/gallery_geo.json"), J("data/layout_grids.json"));

/* the gallery's own size of each element type (src/galleryPlace.ts TYPE_OF + data/gallery_notes.json place.*.scale) */
const typeOf = Function(`return ${fs.readFileSync("src/galleryPlace.ts", "utf8").match(/export const TYPE_OF[^=]*=\s*(\{[\s\S]*?\});/)[1]}`)();
const notes = J("data/gallery_notes.json"), GK = {};
for (const [id, t] of Object.entries(typeOf)) for (const o of ["land", "port"]) { const s = notes[id]?.place?.[o]?.scale; if (s && s !== 1) (GK[t] ??= {})[o] = s; }
const gk = (it, o) => (GK[it.t === "nameTag" && it.style === "pinned" ? "nameTag:pinned" : it.t]?.[o] ?? 1) * ((o === "land" ? it.land?.k : it.k) ?? 1);

const span = (it) => { const a = it.at ?? it.from ?? it.times?.[0], b = it.until ?? it.to ?? (it.dur != null ? a + it.dur : a + 6); return a == null ? null : [a, b]; };
const splitAt = (a) => (spec.splits ?? []).find((w) => a >= w.from - 0.05 && a < w.to);
/* the dossier's two cards (src/DebateLayouts.tsx box(), PAD, GAP_DX 130, GAP_S 0.9: his card slid aside while a picture is in the gap) */
const W = 1920, H = 1080, K = W / 1450, PAD = Math.round(16 * K);
const dbox = (w, r) => { const sw = w.width * W, sh = (sw * 3) / 4, maxH = Math.min(sh * 1.4, H * 0.76), bw = Math.min(sw, maxH * r), bh = bw / r, m = 64;
  return { x: Math.min(Math.max(w.left * W + (sw - bw) / 2, m), W - m - bw), y: Math.min(Math.max(w.top * H + (sh - bh) / 2, m), H - m - bh), w: bw, h: bh }; };
const cards = (sp) => {
  if ((sp.layout ?? "dossier") !== "dossier") return [];
  const m = dbox({ left: 0.35, top: 0.05, width: 0.64 }, sp.mainAspect ?? sp.sheikh.w / (sp.sheikh.h ?? 1080)), g = dbox({ left: 0.02, top: 0.27, width: 0.31 }, sp.clipAspect ?? sp.clip.w / sp.clip.h);
  const pw = m.w + 2 * PAD, ph = m.h + 2 * PAD, cx = m.x - PAD + pw / 2 + 130 + (pw * 0.1) / 2, cy = m.y - PAD + ph / 2;
  return [["بطاقة المقطع", [g.x - PAD, g.y - PAD, g.x + g.w + PAD, g.y + g.h + PAD]], ["بطاقة الشيخ", [cx - pw * 0.45, cy - ph * 0.45, cx + pw * 0.45, cy + ph * 0.45]]].map(([n, r]) => [n, r.map(Math.round)]);
};
const inter = (a, b) => Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
const mmss = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
const faceOver = (runs, a, b) => (runs ?? []).filter((r) => r[0] < b && r[1] > a).map((r) => r.slice(2, 6));

const boxes = [], bad = [];
for (const it of spec.items) for (const o of ["land", "port"]) {
  if (it.only && it.only !== o) continue;
  const f = slotFit(it, o, gk(it, o)), s = span(it); if (!f || !s) continue;
  const sp = o === "land" ? splitAt(s[0]) : undefined, shown = sp ? [s[0], Math.min(s[1], sp.to)] : s, d = f.drawn;
  const name = `#${it.id ?? "?"} ${it.name ?? it.text ?? it.t} (${o === "land" ? "عرضي" : "طولي"} ${mmss(shown[0])}–${mmss(shown[1])}، خانة ${it.slot?.[o]})`;
  boxes.push({ o, name, d, shown, sp });
  const [SW, SH] = o === "land" ? [1920, 1080] : [1080, 1920];
  if (d[0] < 0 || d[1] < 0 || d[2] > SW || d[3] > SH) bad.push(`${name}: يخرج من الشاشة [${d}]`);
  for (const z of faceOver(spec.face?.[o], shown[0], shown[1])) if (inter(d, z) > 0) { bad.push(`${name}: فوق وجهه [${d}] ∩ [${z}]`); break; }
  if (sp) for (const [cn, c] of cards(sp)) if (inter(d, c) > 0) bad.push(`${name}: فوق ${cn} [${d}] ∩ [${c}]`);
}
for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
  const a = boxes[i], b = boxes[j];
  if (a.o === b.o && a.shown[0] < b.shown[1] && b.shown[0] < a.shown[1] && inter(a.d, b.d) > 0) bad.push(`${a.name} يركب فوق ${b.name}`);
}
if (LIST) for (const b of boxes) console.log(`  ${b.name}: [${b.d}]`);
console.log(bad.length ? bad.map((b) => `✘ مكان مرفوض بالحساب: ${b}`).join("\n") :`✔ أماكن ${boxes.length} عنصراً محسوبة على الشبكة: داخل الشاشة، بعيدة عن الوجه والبطاقتين، ولا تراكب`);
process.exit(bad.length ? 1 : 0);
