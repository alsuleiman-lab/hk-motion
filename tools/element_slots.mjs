// ONE ELEMENT AT A TIME — PER AREA (user 2026-11-17: «ممنوع استخدام عنصرين بنفس الوقت إلا في حال سمح به في المعرض… كل عنصر يأخذ مساحة وقتية لا يدخل فيها عنصر آخر،
// وإذا تعارض عنصران يؤخذ الأهم: الصورة أهم من الكتابة، الحديث والآية أولى من الكتابة والصورة… واستثناءات مثل شريط الحلقة»؛
// وضّحها 2026-11-18: الممنوع عنصران في المساحة نفسها في الوقت نفسه).
//   node tools/element_slots.mjs <p>          → lists every pair of spec items on screen together IN THE SAME AREA (same orientation); exit 1 when any
//   node tools/element_slots.mjs <p> --fix    → the LOWER-ranked item yields: trimmed to end before the higher one starts when ≥ 1.5 s of it stays alone,
//                                               otherwise DROPPED (never delayed); equal ranks: the later one yields. Writes data/specs/<p>.json
//   --spec <file>  read (and with --fix write) that spec file instead of data/specs/<p>.json (read-only tests on a copy)
//   --dry          with --fix: print what would change, write nothing
// Areas (user 2026-11-18, rules review, w4 + w13): landscape = key (writing at the bottom: key/under/solo slots), left, right; a full or centre panel
// (split screen, full frame, exclusive) takes all three. Portrait = band (the bottom band) and video (his video / isolation); full-frame items take both.
// An item's area comes from its grid slot (`slot.land|port`, data/layout_grids.json) when it has one, else from its kind (layout_grids.json "kinds")
// and its side; an explicit `area` (string or list) on the item wins. Ranks and exempt types: data/element_priority.json.
// A gallery element that holds two pictures is ONE item, so it never clashes with itself.
import fs from "node:fs";
import path from "node:path";

const argv = process.argv.slice(2), p = argv[0], FIX = argv.includes("--fix"), DRY = argv.includes("--dry");
const specArg = argv.includes("--spec") ? argv[argv.indexOf("--spec") + 1] : null;
if (!p || p.startsWith("--")) { console.error("usage: node tools/element_slots.mjs <p> [--fix] [--dry] [--spec <file>]"); process.exit(2); }
const f = specArg ? path.resolve(specArg) : null;
process.chdir(path.resolve(import.meta.dirname, ".."));
const PR = JSON.parse(fs.readFileSync("data/element_priority.json", "utf8"));
const GRID = fs.existsSync("data/layout_grids.json") ? JSON.parse(fs.readFileSync("data/layout_grids.json", "utf8")) : {};
const specFile = f ?? `data/specs/${p}.json`, spec = JSON.parse(fs.readFileSync(specFile, "utf8"));
const HOLD = 1.5;   /* = the engine's PICK_HOLD (src/MontageSpec.tsx): 2 → 1.5 s (user 2026-11-18, rules review, w5) */
const start = (it) => it.at ?? it.from;   /* maps and row cards are timed from/to (2026-11-17 bug: they were ignored) */
/* a picked element stays until its LAST event (the engine's pickUntil: every at/…At field + 0.8 + hold) — a far closeAt kept one on screen to the end (2026-11-17) */
const lastEvent = (it) => { let m = it.at ?? 0; const walk = (v, k) => { if (typeof v === "number" && (k === "at" || /At$/.test(k))) m = Math.max(m, v); else if (Array.isArray(v)) v.forEach((x) => walk(x, k)); else if (v && typeof v === "object") Object.entries(v).forEach(([kk, x]) => walk(x, kk)); }; Object.entries(it).forEach(([k, v]) => { if (k !== "until" && k !== "land") walk(v, k); }); return m + 0.8 + HOLD; };
const end = (it) => { const e = it.until ?? (it.dur != null ? start(it) + it.dur : it.to ?? null); return it.t === "pick" && e != null ? Math.max(e, lastEvent(it)) : e; };
const rank = (it) => PR.rank[it.t] ?? 2;
const WRITING = new Set(["torn", "scraps", "blur", "stamp", "text", "words", "word", "title"]);
const ONLY = argv.includes("--only") ? argv[argv.indexOf("--only") + 1] : null;   /* a single-orientation check (stage check --only land) judges that orientation alone (2026-11-19) */
const sides = (it) => { const all = it.only === "land" ? ["land"] : it.only === "port" ? ["port"] : ["land", "port"]; return ONLY ? all.filter((x) => x === ONLY) : all; };

// ── areas (user 2026-11-18, rules review, w4 + w13)
const ALL = { land: ["key", "left", "right"], port: ["band", "video"] };
const KIND_OF = {}; for (const [k, ts] of Object.entries(GRID.kinds ?? {})) for (const t of ts) KIND_OF[t] ??= k;
const SLOT_AREA = {   // grid slot name → area(s)
  land: { key: ["key"], under: ["key"], solo: ["key"], left: ["left"], right: ["right"], versebox: ["key", "left"], panel: ALL.land, back: ALL.land, frame: ALL.land },
  port: { band: ["band"], under: ["band"], panel: ["band"], versebox: ["band"], back: ALL.port, frame: ALL.port },
};
const LAND_W = GRID.land?.W ?? 1920, LEFT_X = 40, LEFT_W = 600;   /* engine default: LANDSCAPE.left (src/PortraitKit.tsx) */
const landSide = (it) => {   // the side a picture/list stands on in landscape, as the engine places it (boxCentre / rows)
  if (it.t === "rows") return [it.side === "right" ? "right" : "left"];
  if (it.t === "tphoto" && (it.also?.length ?? 0) === 1) return ["left", "right"];   /* two people stand apart (tphotoApart); books side by side stay on one side — counted as both, the safer reading */
  const ov = it.land ?? {}, x = ov.x ?? LEFT_X, w = ov.w ?? it.w ?? LEFT_W;
  return [x + w / 2 < LAND_W / 2 ? "left" : "right"];
};
const unknown = new Set(), noArea = new Set();
const areasOf = (it, o) => {
  if (it.area) return [].concat(it.area);
  const sl = it.slot?.[o]; if (sl && SLOT_AREA[o][sl]) return SLOT_AREA[o][sl];
  if (it.t === "verse") return o === "land" || it.full || it.userFull ? ALL[o] : ["band"];   /* landscape ways split the screen or fill it */
  if (["note", "hadith", "quote", "map", "pmap", "pick"].includes(it.t)) return ALL[o];   /* hadith box, maps and picked gallery elements: full / centre panels */
  if (WRITING.has(it.t)) return o === "land" ? ["key"] : ["band"];
  const k = KIND_OF[it.t] ?? { photo: "photo", post: "photo" }[it.t];
  if (k === "key" || k === "solo") return o === "land" ? ["key"] : ["band"];
  if (k === "photo" || k === "list") return o === "land" ? landSide(it) : ["band"];
  if (k === "source") return o === "land" ? ALL.land : ["band"];
  if (!k) noArea.add(it.t);
  return ALL[o];   /* exclusive, grid-ignored (bgclip, peek…) or unknown kinds take every area: the old global rule */
};

/* (user 2026-11-20, mufti-hiraba 3:05: «جمعت بين عنصرين فوق بعض وهذا ممنوع، يجب أن لا يقبله البرنامج حتى لو فعلته أنت») a map's `moves` show the
   map AGAIN later, in their own from–to: each move is judged as an item of its own (it was invisible here: a word cloud and a map shared the screen) */
const live = () => spec.items.flatMap((it, i) => [{ it, i }, ...(it.t === "pmap" ? (it.moves ?? []).filter((m) => typeof m.from === "number" && typeof m.to === "number").map((m) => ({ it: { ...it, ...m, moves: undefined, _move: true }, i })) : [])]).filter(({ it }) => typeof start(it) === "number" && end(it) != null && !PR.exempt.includes(it.t));
const mm = (s) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, "0")}`;
const AR = { key: "الكتابة", left: "اليسار", right: "اليمين", band: "الشريط السفلي", video: "الفيديو", land: "عرضي", port: "طولي" };
const clashes = () => {
  const L = live(), out = [];
  for (const x of L) if (PR.rank[x.it.t] == null) unknown.add(x.it.t);
  for (let a = 0; a < L.length; a++) for (let b = a + 1; b < L.length; b++) {
    const A = L[a].it, B = L[b].it;
    const where = [];
    for (const o of sides(A).filter((s) => sides(B).includes(s))) { const bA = areasOf(B, o); for (const ar of areasOf(A, o)) if (bA.includes(ar)) where.push(`${AR[o]}/${AR[ar] ?? ar}`); }
    if (!where.length) continue;
    const o0 = Math.max(start(A), start(B)), o1 = Math.min(end(A), end(B));
    if (o1 - o0 > 0.05) out.push([L[a], L[b], o0, o1, where]);
  }
  return out;
};
let C = clashes();
for (const [x, y, o0, o1, where] of C) console.log(`✘ ${mm(o0)}–${mm(o1)} [${where.join("، ")}]: «${x.it.t}» (${start(x.it)}–${end(x.it)}) مع «${y.it.t}» (${start(y.it)}–${end(y.it)})`);
if (unknown.size) console.log(`⚠ أنواع بلا رتبة (عُدّت 2): ${[...unknown].join("، ")} — أضفها إلى data/element_priority.json`);
if (noArea.size) console.log(`⚠ أنواع بلا مساحة في الشبكة (عُدّت في المساحات كلها): ${[...noArea].join("، ")} — أضفها إلى "kinds" في data/layout_grids.json`);
if (!C.length) { console.log("✔ لا عنصران في مساحة واحدة في وقت واحد"); process.exit(0); }
if (!FIX) { console.log(`\n${C.length} تعارضاً في مساحة واحدة — الأهم يبقى (الحديث والآية ← الصورة ← الكتابة) والأدنى يُحذف؛ للتصحيح: --fix`); process.exit(1); }

// fix: repeatedly let the lower-ranked item of the first clash yield — trimmed if ≥ 1.5 s of it stays before the higher one, else dropped (never delayed)
const removed = new Set(), log = [];
const setEnd = (it, t) => { if (it.until != null) it.until = +t.toFixed(2); else if (it.dur != null) it.dur = +(t - start(it)).toFixed(2); else it.to = +t.toFixed(2); };
for (let guard = 0; guard < 500; guard++) {
  C = clashes().filter(([x, y]) => !removed.has(x.i) && !removed.has(y.i));
  if (!C.length) break;
  const [x, y] = C[0];
  const [hi, lo] = rank(x.it) > rank(y.it) ? [x, y] : rank(y.it) > rank(x.it) ? [y, x] : start(x.it) <= start(y.it) ? [x, y] : [y, x];
  const H = hi.it, Lo = lo.it, len = end(Lo) - start(Lo), before = start(H) - start(Lo);
  if (before >= 1.5) { const keep = JSON.stringify(Lo); setEnd(Lo, start(H) - 0.05); if (end(Lo) <= start(H)) { log.push(`قُصّر «${Lo.t}» ليتنحّى عن «${H.t}» عند ${mm(start(H))}`); continue; } Object.assign(Lo, JSON.parse(keep)); }   /* a pick whose last event is later cannot be trimmed: dropped */
  removed.add(lo.i); log.push(`حُذف «${Lo.t}» عند ${mm(start(Lo))} (${len.toFixed(1)}ث) لأن «${H.t}» أهم في المساحة نفسها`);
}
spec.items = spec.items.filter((_, i) => !removed.has(i));
if (!DRY) fs.writeFileSync(specFile, JSON.stringify(spec, null, 1));
console.log("\n" + log.join("\n") + (DRY ? "\n(تجربة --dry: لم يُكتب شيء)" : ""));
const left = clashes(); console.log(left.length ? `✘ بقي ${left.length}` : "✔ بعد التصحيح: لا عنصران في مساحة واحدة في وقت واحد"); process.exit(left.length ? 1 : 0);
