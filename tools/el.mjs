// ONE COMMAND FOR THE GALLERY'S ELEMENTS (user 2026-11-17: «كل أداة لها اسم أو كود… البرنامج لما بده يضيف أداة يختار الأداة ويعدل النصوص القابلة للتعديل فيها فقط…
// يستهلك توكنز أقل ويشتغل بسرعة أعلى»). The agent never reads the kits or copies sizes/places: it names the element by its gallery code and gives its content.
//   node tools/el.mjs list [word]                     every element: code · Arabic name · its editable fields (one line each; a word filters)
//   node tools/el.mjs show <code>                     one element: when to use it, its fields (required ones marked), orientations, an example
//   node tools/el.mjs add <p> <code> at=12.3 [until=15] field=value …   append it to data/specs/<p>.json — content and timing ONLY
//   node tools/el.mjs items <p> [from-to]             the spec's elements, numbered (seconds), one line each
//   node tools/el.mjs set <p> <n> field=value …       change content/timing of element n (size/place cannot be set: they are the gallery's)
//   node tools/el.mjs del <p> <n>                     remove element n
// Values: plain text, numbers, or JSON for lists/objects (lines='[{"text":"…","at":1.2}]'). A picture (src=…) gets its own ratio measured, so the card keeps the
// gallery width and shows the whole picture. In a `galleryRef` spec (every new spec, tools/spec_draft.mjs) size and place come from the gallery at render time
// (src/galleryRef.ts): editing an element in the gallery changes it in every such video. Older specs get the gallery geometry written once (gallery_geometry --write).
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

process.chdir(path.resolve(import.meta.dirname, ".."));
const [cmd, ...args] = process.argv.slice(2);
const read = (f) => fs.readFileSync(f, "utf8");
const NOT_CONTENT = new Set(["t", "el", "x", "y", "w", "h", "W", "H", "size", "land", "only", "dx", "dy", "k", "placeOwn", "noShift", "slot", "ratio", "galleryRef", "right", "side",
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
  for (const t of approved) if (specFields[t] && !Object.values(els).some((e) => e.t === t)) els[t] = { code: t, t, fields: specFields[t] };
  for (const e of Object.values(els)) e.edit = e.fields.filter((f) => !NOT_CONTENT.has(f.name));
  return els;
};
const short = (e) => e.edit.map((f) => (TIMING.has(f.name) ? null : `${f.name}${f.opt ? "?" : ""}`)).filter(Boolean).join(" ");
const ar = (e) => e.lab?.ar ?? "";

// ── values and pictures
const parseVal = (v) => { if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v); if (/^[[{]/.test(v.trim())) { try { return JSON.parse(v); } catch { /* text */ } } if (v === "true" || v === "false") return v === "true"; return v; };
const kv = (list) => { const o = {}; for (const a of list) { const i = a.indexOf("="); if (i < 1) { console.error(`✘ «${a}»: اكتب الحقل=القيمة`); process.exit(2); } o[a.slice(0, i)] = parseVal(a.slice(i + 1)); } return o; };
const ratioOf = (src) => { const r = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", path.join("public", src)], { encoding: "utf8" }); const [w, h] = String(r.stdout).trim().split(",").map(Number); return w && h ? +(h / w).toFixed(4) : null; };
const specPath = (p) => { const f = path.join("data", "specs", `${p}.json`); if (!fs.existsSync(f)) { console.error(`✘ لا مواصفة: ${f}`); process.exit(2); } return f; };
const span = (it) => { const a = it.at ?? it.from ?? it.times?.[0] ?? it.oldAt; return a == null ? null : [a, it.until ?? it.to ?? (it.dur != null ? a + it.dur : a + 3)]; };
const save = (f, s) => { s.items.sort((a, b) => (span(a)?.[0] ?? 0) - (span(b)?.[0] ?? 0)); fs.writeFileSync(f, JSON.stringify(s, null, 1)); };
let CODE_OF = null;   // spec type → gallery code (src/galleryPlace.ts TYPE_OF)
const label = (it) => { if (it.el) return it.el; if (!CODE_OF) { const gp = read("src/galleryPlace.ts"); CODE_OF = {}; for (const m of gp.slice(gp.indexOf("TYPE_OF"), gp.indexOf("};", gp.indexOf("TYPE_OF"))).matchAll(/(\w+):\s*"([\w:]+)"/g)) CODE_OF[m[2]] ??= m[1]; } return CODE_OF[it.t === "nameTag" && it.style === "pinned" ? "nameTag:pinned" : it.t] ?? it.t; };
const textOf = (it) => String(it.text ?? it.name ?? it.title ?? it.q ?? it.myth ?? it.lines?.[0]?.text ?? it.words?.join?.(" ") ?? it.src ?? "").slice(0, 40);
const fixGeometry = (f, s) => { spawnSync(process.execPath, [s.galleryRef ? "tools/gallery_geo.mjs" : "tools/gallery_geometry.mjs", ...(s.galleryRef ? [] : [f, "--write"])], { stdio: "ignore" }); };   // reference spec: refresh the gallery table; old spec: write the gallery geometry once

if (cmd === "list") {
  const els = Object.values(catalog()), q = args[0];
  for (const e of els.filter((x) => !q || `${x.code} ${ar(x)} ${x.lab?.group ?? ""}`.includes(q))) console.log(`${e.code} · ${ar(e) || "—"} · ${short(e) || "(التوقيت فقط)"}`);
} else if (cmd === "show") {
  const e = catalog()[args[0]]; if (!e) { console.error(`✘ لا عنصر بهذا الاسم: ${args[0]} (node tools/el.mjs list)`); process.exit(2); }
  console.log(`${e.code} · ${ar(e)}${e.lab?.group ? ` · ${e.lab.group}` : ""}${e.lab?.orient ? ` · الاتجاه: ${e.lab.orient === "both" ? "الاثنان" : e.lab.orient}` : ""}`);
  if (e.lab?.where) console.log(`متى: ${e.lab.where}`);
  for (const f of e.edit) console.log(`  ${f.name}${f.opt ? "" : " (إلزامي)"}: ${f.type}`);
  const ex = e.edit.filter((f) => !f.opt && !TIMING.has(f.name)).map((f) => `${f.name}=${/\[\]|\{/.test(f.type) ? "'[…]'" : /^number$/.test(f.type) ? "1" : '"…"'}`).join(" ");
  console.log(`مثال: node tools/el.mjs add <المشروع> ${e.code} at=12.3 until=16 ${ex}`);
} else if (cmd === "add") {
  const [p, code, ...rest] = args, f = specPath(p), e = catalog()[code];
  if (!e) { console.error(`✘ لا عنصر بهذا الاسم: ${code} (node tools/el.mjs list)`); process.exit(2); }
  const vals = kv(rest), names = new Set(e.fields.map((x) => x.name));
  const bad = Object.keys(vals).filter((k) => NOT_CONTENT.has(k) || !names.has(k));
  if (bad.length) { console.error(`✘ ${code}: لا يُضبط هنا ${bad.join("، ")} — المكان والمقاس من المعرض؛ الحقول: ${e.edit.map((x) => x.name).join(" ")}`); process.exit(2); }
  const missing = e.edit.filter((x) => !x.opt && vals[x.name] === undefined).map((x) => x.name);
  if (missing.length) { console.error(`✘ ${code}: ينقصه ${missing.join("، ")} (node tools/el.mjs show ${code})`); process.exit(2); }
  const it = { t: e.t, ...(e.el ? { el: e.el } : {}), ...(e.fixed ?? {}), ...vals };
  if (typeof it.src === "string" && ["tphoto", "scholar", "pic"].includes(it.t)) { const r = ratioOf(it.src); if (r) it.ratio = r; else { console.error(`✘ لا أقرأ الصورة public/${it.src}`); process.exit(2); } }
  const s = JSON.parse(read(f)); s.items.push(it); save(f, s); fixGeometry(f, s);
  const n = JSON.parse(read(f)).items.findIndex((x) => JSON.stringify(x).startsWith(JSON.stringify({ t: it.t, ...(it.el ? { el: it.el } : {}) }).slice(0, -1)) && x.at === it.at);
  console.log(`✔ أُضيف ${code} رقم ${n} عند ${it.at ?? it.from}ث${s.galleryRef ? " (المكان والمقاس من المعرض)" : ""}`);
} else if (cmd === "items") {
  const s = JSON.parse(read(specPath(args[0]))), [A, B] = (args[1] ?? "").split("-").map(Number);
  s.items.forEach((it, i) => { const sp = span(it); if (args[1] && sp && (sp[1] < A || sp[0] > B)) return; console.log(`${i} · ${label(it)} · ${sp ? sp.map((v) => v.toFixed(1)).join("–") : "—"}${it.only ? ` · ${it.only === "land" ? "عرضي فقط" : "طولي فقط"}` : ""} · ${textOf(it)}`); });
} else if (cmd === "set") {
  const [p, n, ...rest] = args, f = specPath(p), s = JSON.parse(read(f)), it = s.items[Number(n)];
  if (!it) { console.error(`✘ لا عنصر رقم ${n}`); process.exit(2); }
  const vals = kv(rest), bad = Object.keys(vals).filter((k) => NOT_CONTENT.has(k));
  if (bad.length) { console.error(`✘ لا يُضبط ${bad.join("، ")}: المكان والمقاس من المعرض`); process.exit(2); }
  Object.assign(it, vals);
  if (vals.src && ["tphoto", "scholar", "pic"].includes(it.t)) { const r = ratioOf(it.src); if (r) it.ratio = r; }
  save(f, s); fixGeometry(f, s); console.log(`✔ عُدّل العنصر ${n} (${label(it)})`);
} else if (cmd === "del") {
  const [p, n] = args, f = specPath(p), s = JSON.parse(read(f)), it = s.items[Number(n)];
  if (!it) { console.error(`✘ لا عنصر رقم ${n}`); process.exit(2); }
  s.items.splice(Number(n), 1); save(f, s); console.log(`✔ حُذف العنصر ${n} (${label(it)})`);
} else {
  console.error("usage: node tools/el.mjs list [word] | show <code> | add <p> <code> at=… field=value … | items <p> [a-b] | set <p> <n> field=value … | del <p> <n>");
  process.exit(2);
}
