// ONE spec → its THREE Studio compositions, registered together (user 2026-11-16: «نبني طولي وعرضي، أحياناً نفس الفيديو… أريد العرضي والطولي جنب بعض، ويبنيهما بنفس الوقت»).
//   node tools/spec_register.mjs <p> [--id Comp-Id] [--title "العنوان"] [--folder "مونتاج الجلسة"] [--kind full|reel] [--forms port,land,both]
// A spec (data/specs/<p>.json) is read by src/MontageSpec.tsx at whatever size the composition has (1080×1920 = portrait, 1920×1080 = landscape), so the same
// file gives all three: <Id> (طولي), <Id>-L (عرضي) and <Id>-Both (الاثنان معاً: src/MontageBoth.tsx, both orientations on one canvas and one clock, preview only), plus <Id>-BothV (the same two packed into a square canvas for a phone: portrait full height, landscape in a column beside it with the «تحديد» tools under it, user 2026-11-17).
// (2026-11-20) Root.tsx is NOT written any more: src/SpecComps.tsx registers every spec of data/specs by itself (no import by name that a deleted spec
// could break). This tool now only (1) stores a custom composition id in the spec ("compId", when --id differs from the default rule), (2) stores
// --forms in the spec ("forms"), and (3) writes the Arabic titles (tools/set_title.mjs). Idempotent: run it again any time.
// kind reel (portrait only, hook ≤ 3 min) registers the portrait one alone. --forms both = add just the side-by-side one next to compositions that already exist.
// Called by tools/spec_draft.mjs when it writes a new spec and checked by `tools/stage.mjs check` (--check = report only, exit 1 when something is missing).
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

process.chdir(path.resolve(import.meta.dirname, ".."));
const argv = process.argv.slice(2), p = argv[0];
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : argv[i + 1]; };
if (!p || p.startsWith("--")) { console.error('usage: node tools/spec_register.mjs <p> [--id Comp-Id] [--title "العنوان"] [--folder "مونتاج الجلسة"] [--kind full|reel] [--forms port,land,both] [--check]'); process.exit(2); }
const specF = path.join("data", "specs", `${p}.json`);
if (!fs.existsSync(specF)) { console.error(`✘ لا مواصفة: ${specF}`); process.exit(2); }
const spec = JSON.parse(fs.readFileSync(specF, "utf8"));
const kind = opt("kind", spec.kind ?? "full");
const pascal = (s) => s.split(/[-_ ]+/).filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join("");
const camel = (s) => { const x = pascal(s); return x[0].toLowerCase() + x.slice(1); };
const id = opt("id", spec.compId || p.split("-").map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w)).join("-")), folder = opt("folder", kind === "reel" ? "ريلز" : "مونتاج الجلسة");
const forms = (opt("forms", null) ?? (kind === "reel" ? "port" : "port,land,both,bothv")).split(",");
const IDS = { port: id, land: `${id}-L`, both: `${id}-Both`, bothv: `${id}-BothV` };
const SIZE = { port: "width={1080} height={1920}", land: "width={1920} height={1080}", both: "width={BOTH.W} height={BOTH.H}", bothv: "width={BOTHV.W} height={BOTHV.H}" };

// the default id rule of src/SpecComps.tsx: each «-» word capitalised (mufti-hiraba → Mufti-Hiraba, tirmidhi32_1 → Tirmidhi32_1)
const autoId = p.split("-").map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w)).join("-");
const valid = typeof spec.frames === "number" && typeof spec.cut === "string" && spec.studio !== false;
if (argv.includes("--check")) {
  const cid = spec.compId || autoId;
  if (!valid) { console.log(`✘ spec_register: ${p} ليس مونتاجاً يُسجَّل (يلزم frames وcut، وstudio ليس false)`); process.exit(1); }
  if (opt("id", null) && opt("id", null) !== cid) { console.log(`✘ spec_register: ${p} يُسجَّل باسم ${cid} لا ${opt("id", null)} → node tools/spec_register.mjs ${p} --id ${opt("id", null)}`); process.exit(1); }
  console.log(`✔ spec_register: ${p} مسجَّل تلقائياً (src/SpecComps.tsx) بكل أشكاله (${forms.map((f) => IDS[f]).join("، ")})`); process.exit(0);
}
let changed = false;
if (id !== autoId && spec.compId !== id) { spec.compId = id; changed = true; }
if (id === autoId && spec.compId && spec.compId !== id) { delete spec.compId; changed = true; }
const defForms = kind === "reel" ? "port" : "port,land,both,bothv";
if (opt("forms", null) && forms.join(",") !== defForms && JSON.stringify(spec.forms) !== JSON.stringify(forms)) { spec.forms = forms; changed = true; }
if (changed) fs.writeFileSync(specF, JSON.stringify(spec, null, 1));
const missing = forms;   // titles are written only where none exists
// Arabic titles for what was added (the render gate needs them): the existing portrait/landscape title minus its suffix, else the spec's own title
const titles = fs.readFileSync(path.join("src", "compositionTitles.ts"), "utf8");
const titleOf = (cid) => titles.match(new RegExp(`^  "${cid.replace(/[-]/g, "\\-")}": "(.*)",`, "m"))?.[1];
const base = opt("title", null) ?? (titleOf(IDS.port) ?? titleOf(IDS.land))?.replace(/\s*\((?:طولي|عرضي)\)\s*$/, "").replace(/\s*[—-]\s*(?:طولي|عرضي)\s*$/, "") ?? spec.title ?? id;
const SUFFIX = { port: "طولي", land: "عرضي", both: "طولي وعرضي معاً", bothv: "طولي وعرضي معاً للجوال" };
for (const f of missing) if (!titleOf(IDS[f])) spawnSync(process.execPath, ["tools/set_title.mjs", IDS[f], `${base} (${SUFFIX[f]})`], { stdio: "inherit" });
console.log(`✔ spec_register: ${p} ← ${forms.map((f) => IDS[f]).join("، ")} (تسجيل تلقائي، مجلد «${folder}»)`);
