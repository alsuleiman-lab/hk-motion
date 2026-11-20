// ONE COMMAND FOR THE GALLERY'S ELEMENTS (user 2026-11-17: «كل أداة لها اسم أو كود… البرنامج لما بده يضيف أداة يختار الأداة ويعدل النصوص القابلة للتعديل فيها فقط…
// يستهلك توكنز أقل ويشتغل بسرعة أعلى»). The agent never reads the kits or copies sizes/places: it names the element by its gallery code and gives its content.
//   node tools/el.mjs list [word]                     every element: code · Arabic name · its editable fields (one line each; a word filters)
//   node tools/el.mjs show <code|اسمه>                one element: when to use it, its fields (required ones marked), orientations, an example
//   node tools/el.mjs names                           every element has ONE Arabic name, no two alike (exit 1 otherwise) — the name the Studio writes under the screen
//   node tools/el.mjs add <p> <code> at=12.3 [until=15] field=value …   append it to data/specs/<p>.json — content and timing ONLY
//   node tools/el.mjs items <p> [from-to]             the spec's elements, numbered (seconds), with their stable id (#id), one line each
//   node tools/el.mjs set <p> <#id|id=…|n> field=value …   change content/timing of one element (size/place cannot be set: they are the gallery's)
//   node tools/el.mjs del <p> <#id|id=…|n>            remove one element
//   node tools/el.mjs list --json | items <p> [a-b] --json   the same as JSON (the HK-Motion gallery panel and tools/hk_server.mjs read these)
//   node tools/el.mjs size <p> <#id> [--land|--port] k=1.2 dx=40 dy=-20 | --reset     THIS element's own size and nudge, one orientation or both (user 2026-11-19: «أريحية المقاسات»)
//   node tools/el.mjs gsize <code> --land|--port scale=1.1 dx=0 dy=0 | --reset         the GALLERY's size/place of an element type: every video, that orientation (data/gallery_notes.json)
// Stable ids (user 2026-11-18, rules review): every item carries a short `id`, unique in its spec. `add` gives the new item one; any item without one gets it the
// first time el.mjs saves (or lists) the spec; sorting by time never changes an id. The old index still works but moves when the spec is re-sorted (warned).
// Values: plain text, numbers, or JSON for lists/objects (lines='[{"text":"…","at":1.2}]'). A picture (src=…) gets its own ratio measured, so the card keeps the
// gallery width and shows the whole picture. In a `galleryRef` spec (every new spec, tools/spec_draft.mjs) size and place come from the gallery at render time
// (src/galleryRef.ts): editing an element in the gallery changes it in every such video. Older specs get the gallery geometry written once (gallery_geometry --write).
import fs from "node:fs";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import crypto from "node:crypto";

process.chdir(path.resolve(import.meta.dirname, ".."));
const [cmd, ...args] = process.argv.slice(2);
const read = (f) => fs.readFileSync(f, "utf8");
const NOT_CONTENT = new Set(["t", "id", "el", "x", "y", "w", "h", "W", "H", "size", "land", "only", "dx", "dy", "k", "placeOwn", "noShift", "slot", "ratio", "galleryRef", "right", "side",
  /* layout numbers of a few elements: the gallery's too */ "y0", "step", "rowH", "bandY", "axisK", "portTop", "nodeW", "nodeH", "titleSize", "landLift", "landPanel", "landCanvas", "portPanel", "portCanvas", "imgH", "carW", "r", "s"]);
const TIMING = new Set(["at", "until", "from", "to", "dur"]);

// ── the catalog, read from the code itself (a new gallery element appears here by itself)
const braceBody = (s, i) => { let d = 0, k = i; for (; k < s.length; k++) { if (s[k] === "{") d++; else if (s[k] === "}") { d--; if (d === 0) break; } } return s.slice(i + 1, k); };
const fieldsOf = (body) => {   // "a: string; b?: number; c: { … }[]" → [{name, opt, type}]
  const out = []; let d = 0, cur = "";
  for (const ch of body + ";") { if ("{[(<".includes(ch)) d++; if ("}])>".includes(ch)) d--; if ((ch === ";" || ch === ",") && d === 0) { const m = cur.trim().match(/^(\[?[\w]+\]?)(\?)?\s*:\s*([\s\S]+)$/); if (m && !m[1].startsWith("[")) out.push({ name: m[1], opt: !!m[2], type: m[3].replace(/\s+/g, " ").trim() }); cur = ""; } else cur += ch; }
  return out;
};
const catalog = () => {
  const ms = read("src/MontageSpec.tsx"), gp = read("src/galleryPlace.ts");
  const lab = Object.fromEntries(JSON.parse(read("data/elements_lab.json")).map((m) => [m.id, m]));
  const typeOf = {}; for (const m of gp.slice(gp.indexOf("TYPE_OF"), gp.indexOf("};", gp.indexOf("TYPE_OF"))).matchAll(/(\w+):\s*"([\w:]+)"/g)) typeOf[m[1]] = m[2];
  const approved = new Set([...(ms.match(/APPROVED_TYPES = new Set\(\[([^\]]*)\]/)?.[1] ?? "").matchAll(/"(\w+)"/g)].map((m) => m[1]));
  const specFields = {};
  for (const m of ms.matchAll(/\|\s*\{\s*t:\s*"(\w+)";/g)) { if (specFields[m[1]]) continue; const i = ms.lastIndexOf("{", m.index + m[0].length); specFields[m[1]] = fieldsOf(braceBody(ms, i)).filter((f) => f.name !== "t"); }
  const els = {};
  for (const [code, t0] of Object.entries(typeOf)) { const t = t0.split(":")[0]; if (!approved.has(t) || !specFields[t]) continue; els[code] = { code, t, ...(t0.includes(":") ? { fixed: { style: t0.split(":")[1] } } : {}), fields: specFields[t], lab: lab[code] }; }
  for (const f of ["src/PickKit.tsx", "src/PickKit2.tsx"]) {
    const s = read(f), names = (s.match(/export const PICK_KIT2? = \{([^}]*)\}/)?.[1] ?? "").split(",").map((x) => x.trim()).filter(Boolean);
    for (const n of names) { const m = s.match(new RegExp(`export const ${n}: React\\.FC<Base & \\{`)); if (!m) continue; const i = s.indexOf("{", m.index + m[0].length - 1); els[n] = { code: n, t: "pick", el: n, fields: [{ name: "at", opt: false, type: "number" }, { name: "until", opt: false, type: "number" }, ...fieldsOf(braceBody(s, i))], lab: lab[n] }; }
  }
  const X = JSON.parse(read("data/element_names.json"));   // names of the elements with no gallery card, and types named after another gallery element
  for (const t of approved) if (specFields[t] && !Object.values(els).some((e) => e.t === t)) { const code = X.codeOf?.[t] ?? t; els[code] = { code, t, fields: specFields[t], lab: lab[code] ?? (X.names?.[t] ? { ar: X.names[t] } : undefined) }; }
  // «right» is a layout flag for most elements but the TEXT of the right road in Crossroads (2026-11-19, mufti-hiraba): a field typed string is content
  const isContent = (f) => !NOT_CONTENT.has(f.name) || (f.name === "right" && /string/.test(f.type));
  for (const e of Object.values(els)) e.edit = e.fields.filter(isContent);
  return els;
};
const short = (e) => e.edit.map((f) => (TIMING.has(f.name) ? null : `${f.name}${f.opt ? "?" : ""}`)).filter(Boolean).join(" ");
const ar = (e) => e.lab?.ar ?? "";
/** an element by its code OR its Arabic name (the name written under the screen in the Studio, user 2026-11-17); a unique part of the name is enough */
const find = (els, q) => { if (!q) return null; if (els[q]) return els[q]; const all = Object.values(els); const exact = all.find((e) => ar(e) === q); if (exact) return exact; const part = all.filter((e) => ar(e).includes(q)); return part.length === 1 ? part[0] : null; };

// ── values and pictures
const parseVal = (v) => { if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v); if (/^[[{]/.test(v.trim())) { try { return JSON.parse(v); } catch { /* text */ } } if (v === "true" || v === "false") return v === "true"; return v; };
const kv = (list) => { const o = {}; for (const a of list) { const i = a.indexOf("="); if (i < 1) { console.error(`✘ «${a}»: اكتب الحقل=القيمة`); process.exit(2); } o[a.slice(0, i)] = parseVal(a.slice(i + 1)); } return o; };
const ratioOf = (src) => { const r = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", path.join("public", src)], { encoding: "utf8" }); const [w, h] = String(r.stdout).trim().split(",").map(Number); return w && h ? +(h / w).toFixed(4) : null; };
const specPath = (p) => { const f = path.join("data", "specs", `${p}.json`); if (!fs.existsSync(f)) { console.error(`✘ لا مواصفة: ${f}`); process.exit(2); } return f; };
const span = (it) => { const a = it.at ?? it.from ?? it.times?.[0] ?? it.oldAt; return a == null ? null : [a, it.until ?? it.to ?? (it.dur != null ? a + it.dur : a + 3)]; };
/* stable ids (user 2026-11-18, rules review): short, unique in the spec; a missing or repeated id gets a new one; ids ride on the items, so sorting keeps them */
const newId = (used) => { let id; do { id = Math.random().toString(36).slice(2, 6); } while (id.length < 4 || !/^[a-z]/.test(id) || used.has(id)); used.add(id); return id; };
const ensureIds = (s) => { const used = new Set(s.items.map((x) => x.id).filter(Boolean)), seen = new Set(); let n = 0; for (const it of s.items) { if (!it.id || seen.has(it.id)) { it.id = newId(used); n++; } seen.add(it.id); } return n; };
const at = (s, ref) => {   // an item by #id / id=… (stable) or by its index (moves when the spec is re-sorted: warned)
  const r = String(ref ?? ""), m = r.match(/^(?:id=|#)(.+)$/);
  if (m) { const i = s.items.findIndex((x) => x.id === m[1]); return i < 0 ? null : i; }
  if (/^\d+$/.test(r)) { const i = Number(r); if (!s.items[i]) return null; console.warn(`⚠ الرقم ${i} يتغير إذا أُعيد الترتيب — معرّفه الثابت: #${s.items[i].id}`); return i; }
  const i = s.items.findIndex((x) => x.id === r); return i < 0 ? null : i;
};
/* EVERY ELEMENT IS CHECKED THE MOMENT IT IS WRITTEN (user 2026-11-19: «ممنوع تخطئ ثم تفحص ثم تعدل»). On mufti-hiraba the final check found, one by one,
   elements I had added against the rules (a half-screen chip in full mode, two elements in one slot, the name card not alone, a map behind his head).
   add / set / del now run the quick gates of the final check (writing_sync, element_slots, coverage_check, spec_normalize --dry for both orientations;
   in parallel, ~10 s) before and after the change: a failure the change ADDS → the spec is put back as it was and the reasons are printed (exit 1).
   Failures that were already there do not block (the baseline is cached per spec content in .tmp/<p>/gate_base.json). --no-gate skips it on purpose. */
const runGate = (args) => new Promise((res) => { const c = spawn(process.execPath, args, { windowsHide: true }); let o = ""; c.stdout.on("data", (d) => { o += d; }); c.stderr.on("data", (d) => { o += d; }); c.on("close", () => res(o)); });
const atomsOf = (txt) => {
  const out = new Set();
  for (let l of String(txt).split(/\r?\n/)) {
    l = l.trim(); if (!l.startsWith("✘")) continue;
    if (/^✘ \d+ (باقية|مشكلة)|^✘ .*(FAILED|القائمة كاملة)/.test(l)) continue;   // summaries: their numbers move whenever anything changes
    l = l.replace(/\(\d+\)/g, "").replace(/([A-Za-z]+)#\d+/g, "$1").replace(/\s+/g, " ");
    const m = /^(.*?\):|^(.*?):)\s(.+)$/.exec(l);
    const tidy0 = (t) => t.split(" — ")[0].replace(/\s*\([^)]*\)?/g, "").replace(/\s*\([^)]*$/, "").trim();   // the checks print long lists cut short: «(11 ث» and «— أضفه…» tails are not part of the failure
    // a gap is known by where it starts: «8:01–8:12» becoming «8:01–8:09» is the same gap made shorter, not a new failure
    const tidy = (t) => { const x = tidy0(t); return /فراغ/.test(x) ? x.replace(/(\d+:\d{2})–\d+:\d{2}/g, "$1") : x; };
    if (m && m[3].includes("، ")) for (const part of m[3].split("، ")) out.add(tidy(`${m[1] ?? m[2]} ${part.trim()}`)); else out.add(tidy(l));
  }
  return out;
};
const gateAtoms = async (f, p) => {
  /* (2026-11-20) spec_normalize --dry WRITES the spec (its fixes) and then puts it back: two of them at once, or one beside a reader, raced on the same
     file — a gate read a half-written spec (JSON error) and a restore could bring back an older version. The two normalisers run one after the other,
     and only then the read-only gates, together. */
  const n1 = await runGate(["tools/spec_normalize.mjs", f, "--o", "land", "--dry"]);
  const n2 = await runGate(["tools/spec_normalize.mjs", f, "--o", "port", "--dry"]);
  /* (user 2026-11-20: «يجب ببساطة أن تلتزم بالموقع على الشبكة») + where each element is DRAWN, as numbers (tools/slot_boxes.mjs, ¼ s, no render) */
  const outs = await Promise.all([["tools/writing_sync.mjs", f], ["tools/element_slots.mjs", p], ["tools/coverage_check.mjs", f], ["tools/late_check.mjs", f], ["--experimental-strip-types", "--no-warnings", "tools/slot_boxes.mjs", p]].map(runGate));
  return atomsOf([n1, n2, ...outs].join("\n"));
};
const hashOf = (f) => crypto.createHash("sha1").update(read(f)).digest("hex");
const GATE_OFF = process.argv.includes("--no-gate");
const baseFile = (p) => path.join(".tmp", p, "gate_base.json");
const gateBefore = async (f, p) => {
  if (GATE_OFF) return null;
  const h = hashOf(f); try { const b = JSON.parse(read(baseFile(p))); if (b.hash === h) return new Set(b.atoms); } catch { /* none */ }
  return gateAtoms(f, p);
};
/** after a change: new failures → restore `before` text and refuse; else remember the new baseline */
const gateAfter = async (f, p, base, beforeText, what) => {
  if (GATE_OFF || !base) return;
  const now = await gateAtoms(f, p), added = [...now].filter((a) => !base.has(a));
  if (added.length) {
    fs.writeFileSync(f, beforeText);
    console.error(`✘ رُفض ${what}: يضيف ${added.length} مخالفة لم تكن — أُعيدت المواصفة كما كانت:\n  ` + added.join("\n  "));
    process.exit(1);
  }
  try { fs.mkdirSync(path.dirname(baseFile(p)), { recursive: true }); fs.writeFileSync(baseFile(p), JSON.stringify({ hash: hashOf(f), atoms: [...now] })); } catch { /* cache only */ }
  if (now.size) console.log(`  (فحص العنصر: لا مخالفة جديدة؛ ${now.size} مخالفة قديمة باقية في المواصفة)`); else console.log("  (فحص العنصر: المواصفة نظيفة)");
};
const save = (f, s) => { ensureIds(s); s.items.sort((a, b) => (span(a)?.[0] ?? 0) - (span(b)?.[0] ?? 0)); fs.writeFileSync(f, JSON.stringify(s, null, 1)); };
let CODE_OF = null;   // spec type → gallery code (src/galleryPlace.ts TYPE_OF)
const label = (it) => { if (it.el) return it.el; if (!CODE_OF) { const gp = read("src/galleryPlace.ts"); CODE_OF = {}; for (const m of gp.slice(gp.indexOf("TYPE_OF"), gp.indexOf("};", gp.indexOf("TYPE_OF"))).matchAll(/(\w+):\s*"([\w:]+)"/g)) CODE_OF[m[2]] ??= m[1]; } return CODE_OF[it.t === "nameTag" && it.style === "pinned" ? "nameTag:pinned" : it.t] ?? it.t; };
const textOf = (it) => String(it.text ?? it.name ?? it.title ?? it.q ?? it.myth ?? it.lines?.[0]?.text ?? it.words?.join?.(" ") ?? it.src ?? "").slice(0, 40);
const fixGeometry = (f, s) => { spawnSync(process.execPath, [s.galleryRef ? "tools/gallery_geo.mjs" : "tools/gallery_geometry.mjs", ...(s.galleryRef ? [] : [f, "--write"])], { stdio: "ignore" }); };   // reference spec: refresh the gallery table; old spec: write the gallery geometry once

if (cmd === "list") {
  const els = Object.values(catalog()), q = args.find((a) => !a.startsWith("--"));
  if (args.includes("--json")) { console.log(JSON.stringify(els.filter((x) => !q || `${x.code} ${ar(x)} ${x.lab?.group ?? ""}`.includes(q)).map((e) => ({ code: e.code, ar: ar(e), group: e.lab?.group ?? "", orient: e.lab?.orient ?? "", where: e.lab?.where ?? "", fields: e.edit })))); process.exit(0); }
  for (const e of els.filter((x) => !q || `${x.code} ${ar(x)} ${x.lab?.group ?? ""}`.includes(q))) console.log(`${e.code} · ${ar(e) || "—"} · ${short(e) || "(التوقيت فقط)"}`);
} else if (cmd === "show") {
  const e = find(catalog(), args[0]); if (!e) { console.error(`✘ لا عنصر بهذا الاسم: ${args[0]} (node tools/el.mjs list)`); process.exit(2); }
  console.log(`${e.code} · ${ar(e)}${e.lab?.group ? ` · ${e.lab.group}` : ""}${e.lab?.orient ? ` · الاتجاه: ${e.lab.orient === "both" ? "الاثنان" : e.lab.orient}` : ""}`);
  if (e.lab?.where) console.log(`متى: ${e.lab.where}`);
  for (const f of e.edit) console.log(`  ${f.name}${f.opt ? "" : " (إلزامي)"}: ${f.type}`);
  const ex = e.edit.filter((f) => !f.opt && !TIMING.has(f.name)).map((f) => `${f.name}=${/\[\]|\{/.test(f.type) ? "'[…]'" : /^number$/.test(f.type) ? "1" : '"…"'}`).join(" ");
  // an element timed by its own from/to (PaperMap…) refuses at/until: the example names the fields add accepts (2026-11-19, mufti-hiraba)
  const own = e.edit.some((f) => f.name === "from" && !f.opt);
  console.log(`مثال: node tools/el.mjs add <المشروع> ${e.code} ${own ? "from=12.3 to=16" : "at=12.3 until=16"} ${ex.split(" ").filter((s) => !/^(from|to)=/.test(s)).join(" ")}`);
} else if (cmd === "names") {
  const els = Object.values(catalog()), by = new Map();
  for (const e of els) { const n = ar(e); if (n) by.set(n, [...(by.get(n) ?? []), e.code]); }
  const none = els.filter((e) => !ar(e)).map((e) => e.code), dup = [...by].filter(([, c]) => c.length > 1);
  if (none.length) console.log(`✘ بلا اسم: ${none.join("، ")} → أضفه في data/element_names.json`);
  for (const [n, c] of dup) console.log(`✘ الاسم «${n}» لأكثر من عنصر: ${c.join("، ")}`);
  console.log(none.length || dup.length ? "✘ el names" : `✔ el names: ${els.length} عنصراً لكل واحد اسم لا يتكرر`); process.exit(none.length || dup.length ? (args.includes("--warn") ? 0 : 1) : 0);
} else if (cmd === "add") {
  const [p, code, ...rest] = args, f = specPath(p), e = find(catalog(), code);
  if (!e) { console.error(`✘ لا عنصر بهذا الاسم: ${code} (node tools/el.mjs list)`); process.exit(2); }
  const vals = kv(rest.filter((a) => a !== "--no-gate")), names = new Set(e.fields.map((x) => x.name));
  const editN = new Set(e.edit.map((x) => x.name)), bad = Object.keys(vals).filter((k) => (NOT_CONTENT.has(k) && !editN.has(k)) || !names.has(k));
  if (bad.length) { console.error(`✘ ${code}: لا يُضبط هنا ${bad.join("، ")} — المكان والمقاس من المعرض؛ الحقول: ${e.edit.map((x) => x.name).join(" ")}`); process.exit(2); }
  const missing = e.edit.filter((x) => !x.opt && vals[x.name] === undefined).map((x) => x.name);
  if (missing.length) { console.error(`✘ ${code}: ينقصه ${missing.join("، ")} (node tools/el.mjs show ${code})`); process.exit(2); }
  const it = { t: e.t, ...(e.el ? { el: e.el } : {}), ...(e.fixed ?? {}), ...vals };
  if (typeof it.src === "string" && ["tphoto", "scholar", "pic"].includes(it.t)) { const r = ratioOf(it.src); if (r) it.ratio = r; else { console.error(`✘ لا أقرأ الصورة public/${it.src}`); process.exit(2); } }
  const beforeText = read(f), base = await gateBefore(f, p);
  const s = JSON.parse(read(f)); ensureIds(s); const id = newId(new Set(s.items.map((x) => x.id))); s.items.push({ id, ...it }); save(f, s); fixGeometry(f, s);
  await gateAfter(f, p, base, beforeText, `إضافة ${code}`);
  const n = JSON.parse(read(f)).items.findIndex((x) => x.id === id);
  console.log(`✔ أُضيف ${code} #${id} (رقم ${n}) عند ${it.at ?? it.from}ث${s.galleryRef ? " (المكان والمقاس من المعرض)" : ""}`);
  /* trial #42 (user 2026-11-18, rules review): an item in the first minute → show the first-minute line of the coverage check */
  if ((it.at ?? it.from) < 60) { const r = spawnSync(process.execPath, ["tools/coverage_check.mjs", f], { encoding: "utf8" }); const line = String(r.stdout).split(/\r?\n/).find((l) => l.includes("الدقيقة الأولى")); if (line) console.log(line); }
} else if (cmd === "items") {
  const f = specPath(args[0]), s = JSON.parse(read(f)), [A, B] = (args[1] ?? "").split("-").map(Number);
  if (ensureIds(s)) fs.writeFileSync(f, JSON.stringify(s, null, 1));   /* ids written once, order untouched, so the listed ids stay (user 2026-11-18, rules review) */
  const cat = catalog(), nm = (it) => ar(cat[label(it)] ?? {}) || label(it);   // the Arabic name, as under the screen in the Studio
  if (args.includes("--json")) {
    console.log(JSON.stringify(s.items.map((it, i) => { const sp = span(it); return { n: i, id: it.id, code: label(it), ar: nm(it), from: sp?.[0] ?? null, to: sp?.[1] ?? null, text: textOf(it), dx: it.dx ?? 0, dy: it.dy ?? 0, k: it.k ?? 1, land: { dx: it.land?.dx ?? 0, dy: it.land?.dy ?? 0, k: it.land?.k ?? 1 } }; }).filter((x) => !args[1] || args[1].startsWith("--") || !(x.from != null && (x.to < A || x.from > B)))));
    process.exit(0);
  }
  s.items.forEach((it, i) => { const sp = span(it); if (args[1] && sp && (sp[1] < A || sp[0] > B)) return; console.log(`${i} · #${it.id} · ${nm(it)} · ${sp ? sp.map((v) => v.toFixed(1)).join("–") : "—"}${it.only ? ` · ${it.only === "land" ? "عرضي فقط" : "طولي فقط"}` : ""} · ${textOf(it)}`); });
} else if (cmd === "set") {
  const [p, n0, ...rest] = args, f = specPath(p), beforeText = read(f), base = await gateBefore(f, p), s = JSON.parse(read(f)); ensureIds(s); const n = at(s, n0), it = n == null ? null : s.items[n];
  if (!it) { console.error(`✘ لا عنصر ${n0}`); process.exit(2); }
  const vals = kv(rest.filter((a) => a !== "--no-gate")), bad = Object.keys(vals).filter((k) => NOT_CONTENT.has(k) && !(k === "right" && typeof vals[k] === "string" && it.t === "pick"));
  if (bad.length) { console.error(`✘ لا يُضبط ${bad.join("، ")}: المكان والمقاس من المعرض`); process.exit(2); }
  Object.assign(it, vals);
  if (vals.src && ["tphoto", "scholar", "pic"].includes(it.t)) { const r = ratioOf(it.src); if (r) it.ratio = r; }
  save(f, s); fixGeometry(f, s); await gateAfter(f, p, base, beforeText, `تعديل #${it.id}`); console.log(`✔ عُدّل العنصر #${it.id} (${label(it)})`);
} else if (cmd === "del") {
  const [p, n0] = args, f = specPath(p), beforeText = read(f), base = await gateBefore(f, p), s = JSON.parse(read(f)); ensureIds(s); const n = at(s, n0), it = n == null ? null : s.items[n];
  if (!it) { console.error(`✘ لا عنصر ${n0}`); process.exit(2); }
  s.items.splice(n, 1); save(f, s); await gateAfter(f, p, base, beforeText, `حذف #${it.id}`); console.log(`✔ حُذف العنصر #${it.id} (${label(it)})`);
} else if (cmd === "batch") {
  /* SEVERAL CHANGES, ONE CHECK (2026-11-19, mufti-hiraba): changes that depend on each other (shorten A so B fits, then move C into A's old time) fail the
     per-change gate in the middle by nature. The plan is written as one list and applied together:
       node tools/el.mjs batch <p> <ops.json>     ops = [{"op":"add","code":"WordScraps","vals":{"at":40.6,"until":49,"text":"…"}},
                                                         {"op":"set","id":"#i5kc","vals":{"at":38.1}}, {"op":"del","id":"#kphg"}]
     every op runs through add/set/del (same validation), then the quick gates run ONCE: a failure the whole batch adds → the spec is put back exactly. */
  const [p, opsFile] = args, f = specPath(p), beforeText = read(f), base = await gateBefore(f, p);
  const ops = JSON.parse(read(opsFile)), self = process.argv[1];
  const asArgs = (vals) => Object.entries(vals ?? {}).map(([k, v]) => `${k}=${typeof v === "string" ? v : JSON.stringify(v)}`);
  for (const [i, o] of ops.entries()) {
    const a = o.op === "add" ? ["add", p, o.code, ...asArgs(o.vals)] : o.op === "set" ? ["set", p, o.id, ...asArgs(o.vals)] : o.op === "del" ? ["del", p, o.id] : null;
    if (!a) { fs.writeFileSync(f, beforeText); console.error(`✘ العملية ${i + 1}: نوع غير معروف «${o.op}» — أُعيدت المواصفة`); process.exit(2); }
    const r = spawnSync(process.execPath, [self, ...a, "--no-gate"], { encoding: "utf8" });
    const line = (r.stdout + r.stderr).trim().split(/\r?\n/).filter((l) => /^[✔✘]/.test(l.trim())).pop() ?? "";
    if (r.status !== 0) { fs.writeFileSync(f, beforeText); console.error(`✘ العملية ${i + 1} (${o.op} ${o.code ?? o.id}) فشلت: ${line || (r.stderr || "").trim().slice(0, 300)} — أُعيدت المواصفة كما كانت`); process.exit(1); }
    console.log(`  ${i + 1}. ${line}`);
  }
  await gateAfter(f, p, base, beforeText, `الدفعة (${ops.length} عملية)`);
  console.log(`✔ طُبّقت الدفعة كلها (${ops.length} عملية)`);
  /* (2026-11-20) --peek <Comp>: the changed elements drawn by the GPU engine into one sheet, to LOOK at before telling the user «done» (every defect he
     found on mufti-hiraba was visible and passed every gate) */
  const pk = process.argv.includes("--peek") ? process.argv[process.argv.indexOf("--peek") + 1] : null;
  if (pk) {
    const now = JSON.parse(read(f)), oldIds = new Set(JSON.parse(beforeText).items.map((x) => x.id));
    const ids = [...new Set([...ops.filter((o) => o.op === "set").map((o) => String(o.id).replace(/^#/, "")), ...now.items.filter((x) => !oldIds.has(x.id)).map((x) => x.id)])].filter((id) => now.items.some((x) => x.id === id));
    if (ids.length) { const r = spawnSync(process.execPath, ["tools/peek.mjs", p, pk, "--ids", ids.join(",")], { encoding: "utf8" }); console.log(((r.stdout || "") + (r.stderr || "")).trim()); }
  }
} else if (cmd === "size") {
  /* (user 2026-11-19, HK-Motion: «أريحية المقاسات») an element's OWN size and nudge, on top of the gallery's: port = the item's dx/dy/k, land = its land.dx/dy/k (src/MontageSpec.tsx withGallery adds the gallery on top of both) */
  const [p, n0, ...rest] = args, f = specPath(p), s = JSON.parse(read(f)); ensureIds(s); const n = at(s, n0), it = n == null ? null : s.items[n];
  if (!it) { console.error(`✘ لا عنصر ${n0}`); process.exit(2); }
  const o = rest.includes("--land") ? ["land"] : rest.includes("--port") ? ["port"] : ["port", "land"], vals = kv(rest.filter((a) => !a.startsWith("--")));
  const bad = Object.keys(vals).filter((k) => !["k", "dx", "dy"].includes(k)); if (bad.length) { console.error(`✘ المسموح k و dx و dy فقط (لا ${bad.join("، ")})`); process.exit(2); }
  if ((vals.k != null && !(vals.k >= 0.4 && vals.k <= 2.5)) || [vals.dx, vals.dy].some((v) => v != null && !(Math.abs(v) <= 1600))) { console.error("✘ k بين 0.4 و2.5، و dx/dy حتى ±1600"); process.exit(2); }
  for (const ori of o) {
    const tgt = ori === "land" ? (it.land ??= {}) : it;
    if (rest.includes("--reset")) { delete tgt.k; delete tgt.dx; delete tgt.dy; if (ori === "land" && !Object.keys(it.land).length) delete it.land; }
    else for (const [k, v] of Object.entries(vals)) { if (k === "k" && v === 1) delete tgt.k; else if ((k === "dx" || k === "dy") && v === 0) delete tgt[k]; else tgt[k] = v; }
  }
  save(f, s); console.log(`✔ ${rest.includes("--reset") ? "أُعيد مقاس" : "ضُبط مقاس"} العنصر #${it.id} (${label(it)}) — ${o.map((x) => (x === "land" ? "العرضي" : "الطولي")).join(" و")}`);
} else if (cmd === "slot") {
  /* (user 2026-11-20: «التحريك لا يحتاج إلى الوصف، يحتاج فقط إلى حساب مواقع») MOVE = name another slot of the grid (data/layout_grids.json); the gate (slot_boxes
     included) judges where it is then drawn, as numbers, before it is kept. Without a slot name: the slots of that orientation, and which are taken at its time.
       node tools/el.mjs slot <p> <#id> [--land|--port]          node tools/el.mjs slot <p> <#id> <slot> [--land|--port] */
  const [p, n0, name] = args.filter((a) => !a.startsWith("--")), f = specPath(p), s0 = JSON.parse(read(f)); ensureIds(s0);
  const n = at(s0, n0), it0 = n == null ? null : s0.items[n]; if (!it0) { console.error(`✘ لا عنصر ${n0}`); process.exit(2); }
  const o = args.includes("--port") ? "port" : "land", grids = JSON.parse(read("data/layout_grids.json")), names = {};
  for (const [mode, g] of Object.entries(grids[o] ?? {})) for (const [sn, sl] of Object.entries(g?.slots ?? {})) names[sn] ??= { mode, rect: sl.rect };
  const a0 = it0.at ?? it0.from ?? it0.times?.[0] ?? 0, b0 = it0.until ?? it0.to ?? a0 + 6;
  if (!name) {
    const taken = Object.fromEntries(s0.items.filter((x) => x !== it0 && x.slot?.[o] && (x.at ?? x.from ?? 0) < b0 && (x.until ?? x.to ?? (x.at ?? 0) + 6) > a0).map((x) => [x.slot[o], `#${x.id}`]));
    console.log(`خانات ${o === "land" ? "العرضي" : "الطولي"} — العنصر #${it0.id} الآن في «${it0.slot?.[o] ?? "—"}»:`);
    for (const [sn, v] of Object.entries(names)) console.log(`  ${sn.padEnd(10)} [${v.rect}]  ${taken[sn] ? "مشغولة بـ " + taken[sn] : sn === it0.slot?.[o] ? "← هنا" : "فارغة"}`);
    process.exit(0);
  }
  if (!names[name]) { console.error(`✘ لا خانة «${name}» في ${o === "land" ? "العرضي" : "الطولي"}: ${Object.keys(names).join("، ")}`); process.exit(2); }
  /* a move changes neither time nor text: only the place gates run (element_slots: one element per space; slot_boxes: the drawn box) — about a second */
  const placeAtoms = async () => atomsOf((await Promise.all([["tools/element_slots.mjs", p], ["--experimental-strip-types", "--no-warnings", "tools/slot_boxes.mjs", p]].map(runGate))).join("\n"));
  const beforeText = read(f), base = await placeAtoms(), s = JSON.parse(read(f)); ensureIds(s); const it = s.items[at(s, n0)];
  (it.slot ??= {})[o] = name; save(f, s);
  const added = [...(await placeAtoms())].filter((x) => !base.has(x));
  if (added.length) { fs.writeFileSync(f, beforeText); console.error(`✘ رُفض نقل #${it.id} إلى «${name}» — أُعيد كما كان:\n  ` + added.join("\n  ")); process.exit(1); }
  const r = spawnSync(process.execPath, ["--experimental-strip-types", "--no-warnings", "tools/slot_boxes.mjs", p, "--list"], { encoding: "utf8" });
  const line = String(r.stdout).split(/\r?\n/).find((l) => l.includes(`#${it.id} `) && l.includes(o === "land" ? "عرضي" : "طولي"));
  console.log(`✔ نُقل #${it.id} (${label(it)}) إلى «${name}»${line ? " — يُرسم في " + line.split(": ").pop() : ""}`);
} else if (cmd === "gsize") {
  /* the gallery's own size/place of an element type (data/gallery_notes.json place.land|port {dx,dy,scale}, applied by the engine to EVERY item of that type in every video) */
  const [code, ...rest] = args, e = find(catalog(), code); if (!e) { console.error(`✘ لا عنصر بهذا الاسم: ${code}`); process.exit(2); }
  const o = rest.includes("--land") ? "land" : rest.includes("--port") ? "port" : null; if (!o) { console.error("✘ حدّد --land أو --port"); process.exit(2); }
  const vals = kv(rest.filter((a) => !a.startsWith("--"))), bad = Object.keys(vals).filter((k) => !["scale", "dx", "dy"].includes(k)); if (bad.length) { console.error(`✘ المسموح scale و dx و dy فقط`); process.exit(2); }
  if ((vals.scale != null && !(vals.scale >= 0.4 && vals.scale <= 2.5)) || [vals.dx, vals.dy].some((v) => v != null && !(Math.abs(v) <= 1600))) { console.error("✘ scale بين 0.4 و2.5، و dx/dy حتى ±1600"); process.exit(2); }
  const nf = "data/gallery_notes.json", notes = JSON.parse(read(nf)), id = e.code; notes[id] ??= {}; notes[id].place ??= {}; const cur = notes[id].place[o] ?? { dx: 0, dy: 0, scale: 1 };
  notes[id].place[o] = rest.includes("--reset") ? { dx: 0, dy: 0, scale: 1 } : { dx: vals.dx ?? cur.dx ?? 0, dy: vals.dy ?? cur.dy ?? 0, scale: vals.scale ?? cur.scale ?? 1 };
  notes[id].at = Date.now(); fs.writeFileSync(nf, JSON.stringify(notes, null, 1));
  console.log(`✔ مقاس المعرض لـ${e.code} (${o === "land" ? "العرضي" : "الطولي"}): ${JSON.stringify(notes[id].place[o])} — يسري على كل المونتاجات`);
} else {
  console.error("usage: node tools/el.mjs list [word] [--json] | show <code> | add <p> <code> at=… field=value … | items <p> [a-b] | set <p> <#id|n> field=value … | del <p> <#id|n> | size <p> <#id> [--land|--port] k= dx= dy= | gsize <code> --land|--port scale= dx= dy=");
  process.exit(2);
}
