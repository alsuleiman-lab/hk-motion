// THE HK-MOTION GALLERY — one registry the montage program reads and adds from (user 2026-11-19: «معرض أساسي وخاص بها… يسهّل على برنامج المونتاج أن يأخذ شيئاً معيّناً من المعرض ويضيفه مباشرة،
// ويكون التواصل مع المعرض من أساس البرنامج، مع أريحية المقاسات»).
// The elements themselves stay in the kits (src/*Kit.tsx) and their cards/sizes in the gallery (data/gallery_notes.json, data/gallery_geo.json); this ties everything about ONE element into
// ONE record that is rebuilt from those sources whenever they change, so the registry never drifts from the code:
//   node tools/hk_gallery.mjs build               → data/hk_gallery.json  { version, builtAt, sources, sizePresets, elements: { <code>: record } }
//   node tools/hk_gallery.mjs check               → exit 1 when a source changed after the last build (the Studio panel and the server rebuild by themselves)
//   node tools/hk_gallery.mjs list [word]         → one line per element: code · name · group · status · uses
//   node tools/hk_gallery.mjs get <code|اسم>       → the record (what it is for, its fields, sizes per orientation, status, how often it was used)
//   node tools/hk_gallery.mjs add <p> <code> at=12.3 [until=16] field=value …   → adds it to the montage RIGHT NOW (tools/el.mjs add: content and timing only)
//   node tools/hk_gallery.mjs status <code> keep|change|drop|none ["ملاحظة"]       → marks it in the gallery's notes (what the user decides about an element, read by Claude)
// A record: code, ar (the Arabic name written under the screen), group, orient, when (what it is for: the user's own text wins), fields (the editable ones, required marked),
// status/note/request, place {land, port} = the gallery's size {dx,dy,scale} for that orientation, uses (how many items of it across data/specs), cost (ms per frame, if measured),
// sizes {presets} — the comfortable sizes: small / medium / large steps (k) and the nudge step in pixels, for the Studio panel and for el.mjs size.
// To DEVELOP the gallery: write the element in a kit (a React.FC in src/PickKit*.tsx or an approved spec type in src/MontageSpec.tsx), give it its Arabic name in
// data/element_names.json (or its card in data/elements_lab.json), run `node tools/el.mjs names` and this build: it appears in the list, the panel and `add` by itself.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";

process.chdir(path.resolve(import.meta.dirname, ".."));
const OUT = path.join("data", "hk_gallery.json");
const SRC = ["data/gallery_notes.json", "data/elements_lab.json", "data/element_names.json", "data/element_costs.json", "data/retired_elements.json", "src/MontageSpec.tsx", "src/galleryPlace.ts", "src/PickKit.tsx", "src/PickKit2.tsx"];
const read = (f, d) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return d; } };
const hashOf = () => { const h = crypto.createHash("sha1"); for (const f of SRC) { try { h.update(f); h.update(fs.readFileSync(f)); } catch { h.update("missing"); } } return h.digest("hex").slice(0, 12); };
const PRESETS = { presets: [{ name: "صغير", k: 0.8 }, { name: "متوسط", k: 1 }, { name: "كبير", k: 1.25 }, { name: "أكبر", k: 1.5 }], step: 30, kStep: 0.05, bounds: { k: [0.4, 2.5], d: 1600 } };

export const build = () => {
  const r = spawnSync(process.execPath, ["tools/el.mjs", "list", "--json"], { encoding: "utf8", maxBuffer: 1 << 26 });
  if (r.status !== 0) { console.error(r.stderr || r.stdout); process.exit(1); }
  const cat = JSON.parse(r.stdout), notes = read("data/gallery_notes.json", {}), costs = read("data/element_costs.json", {}).items ?? {};
  // how many items of each element the specs use (a hint for variety: an element used often is not the one to reach for again)
  const uses = {};
  const sd = "data/specs";
  for (const f of fs.existsSync(sd) ? fs.readdirSync(sd).filter((x) => x.endsWith(".json")) : []) {
    const s = read(path.join(sd, f), null); if (!s?.items) continue;
    for (const it of s.items) { const k = it.el ?? it.t; uses[k] = (uses[k] ?? 0) + 1; }
  }
  const elements = {};
  for (const e of cat) {
    const n = notes[e.code] ?? {};
    elements[e.code] = {
      code: e.code, ar: e.ar, group: e.group, orient: e.orient || "both",
      when: n.when || e.where || "", fields: e.fields.map((f) => ({ name: f.name, required: !f.opt, type: f.type })),
      status: n.status || "", note: n.note || "", request: n.request || "",
      place: { land: n.place?.land ?? { dx: 0, dy: 0, scale: 1 }, port: n.place?.port ?? { dx: 0, dy: 0, scale: 1 } },
      uses: uses[e.code] ?? 0, cost: costs[e.code] ? { landMs: costs[e.code].landExtra ?? null, portMs: costs[e.code].portExtra ?? null } : null,
    };
  }
  const prev = read(OUT, { version: 0 }), out = { version: (prev.version ?? 0) + 1, builtAt: new Date().toISOString(), hash: hashOf(), count: Object.keys(elements).length, sizePresets: PRESETS, elements };
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
  return out;
};
export const load = () => { const g = read(OUT, null); return g && g.hash === hashOf() ? g : build(); };

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  const [cmd, ...args] = process.argv.slice(2);
  const find = (g, q) => { if (!q) return null; if (g.elements[q]) return g.elements[q]; const all = Object.values(g.elements); return all.find((e) => e.ar === q) ?? (all.filter((e) => e.ar.includes(q)).length === 1 ? all.find((e) => e.ar.includes(q)) : null); };
  if (cmd === "build") { const g = build(); console.log(`hk_gallery: ${g.count} عنصراً (الإصدار ${g.version}) → ${OUT}`); }
  else if (cmd === "check") { const g = read(OUT, null); const ok = !!g && g.hash === hashOf(); console.log(ok ? `✔ hk_gallery: محدَّث (الإصدار ${g.version})` : "✘ hk_gallery: تغيّر مصدر بعد آخر بناء → node tools/hk_gallery.mjs build"); process.exit(ok ? 0 : 1); }
  else if (cmd === "list") { const g = load(), q = args[0]; for (const e of Object.values(g.elements).filter((x) => !q || `${x.code} ${x.ar} ${x.group}`.includes(q))) console.log(`${e.code} · ${e.ar || "—"} · ${e.group || "—"} · ${e.status || "—"} · استُعمل ${e.uses}`); }
  else if (cmd === "get") { const e = find(load(), args[0]); if (!e) { console.error(`✘ لا عنصر بهذا الاسم: ${args[0]}`); process.exit(2); } console.log(JSON.stringify(e, null, args.includes("--json") ? 0 : 1)); }
  else if (cmd === "add") {
    const [p, code, ...rest] = args, e = find(load(), code);
    if (!e) { console.error(`✘ لا عنصر بهذا الاسم: ${code} (node tools/hk_gallery.mjs list)`); process.exit(2); }
    const r = spawnSync(process.execPath, ["tools/el.mjs", "add", p, e.code, ...rest], { stdio: "inherit" }); process.exit(r.status ?? 1);
  }
  else if (cmd === "status") {
    const [code, st, ...note] = args, e = find(load(), code); if (!e) { console.error(`✘ لا عنصر بهذا الاسم: ${code}`); process.exit(2); }
    const v = { keep: "keep", change: "change", drop: "drop", none: "" }[st]; if (v === undefined) { console.error("✘ الحالة: keep | change | drop | none"); process.exit(2); }
    const nf = "data/gallery_notes.json", notes = read(nf, {}); notes[e.code] ??= {}; notes[e.code].status = v; if (note.length) notes[e.code].note = note.join(" "); notes[e.code].at = Date.now();
    fs.writeFileSync(nf, JSON.stringify(notes, null, 1)); build(); console.log(`✔ ${e.code} (${e.ar}): ${v || "بلا حالة"}${note.length ? ` — ${note.join(" ")}` : ""}`);
  }
  else { console.error("usage: node tools/hk_gallery.mjs build | check | list [word] | get <code> | add <p> <code> at=… field=… | status <code> keep|change|drop|none [note]"); process.exit(2); }
}
