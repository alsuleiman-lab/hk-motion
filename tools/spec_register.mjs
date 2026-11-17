// ONE spec → its THREE Studio compositions, registered together (user 2026-11-16: «نبني طولي وعرضي، أحياناً نفس الفيديو… أريد العرضي والطولي جنب بعض، ويبنيهما بنفس الوقت»).
//   node tools/spec_register.mjs <p> [--id Comp-Id] [--title "العنوان"] [--folder "مونتاج الجلسة"] [--kind full|reel] [--forms port,land,both]
// A spec (data/specs/<p>.json) is read by src/MontageSpec.tsx at whatever size the composition has (1080×1920 = portrait, 1920×1080 = landscape), so the same
// file gives all three: <Id> (طولي), <Id>-L (عرضي) and <Id>-Both (الاثنان معاً: src/MontageBoth.tsx, both orientations on one canvas and one clock, preview only), plus <Id>-BothV (the same two packed into a square canvas for a phone: portrait full height, landscape in a column beside it with the «تحديد» tools under it, user 2026-11-17).
// Adds to src/Root.tsx only what is missing (idempotent: run it again any time), plus the Arabic titles (tools/set_title.mjs) of what it added.
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
const id = opt("id", pascal(p).replace(/([a-z0-9])([A-Z])/g, "$1-$2")), folder = opt("folder", kind === "reel" ? "ريلز" : "مونتاج الجلسة");
const forms = (opt("forms", null) ?? (kind === "reel" ? "port" : "port,land,both,bothv")).split(",");
const IDS = { port: id, land: `${id}-L`, both: `${id}-Both`, bothv: `${id}-BothV` };
const SIZE = { port: "width={1080} height={1920}", land: "width={1920} height={1080}", both: "width={BOTH.W} height={BOTH.H}", bothv: "width={BOTHV.W} height={BOTHV.H}" };

const ROOT = process.env.SPEC_REGISTER_ROOT ?? path.join("src", "Root.tsx");   // the env var is for tests: another Root copy, and no titles written
const raw = fs.readFileSync(ROOT, "utf8"), crlf = raw.includes("\r\n");
let t = raw.split("\r\n").join("\n");
const has = (cid) => new RegExp(`<Composition\\s+id="${cid.replace(/[-]/g, "\\-")}"`).test(t);
const missing = forms.filter((f) => !has(IDS[f]));
if (argv.includes("--check")) {
  if (missing.length) { console.log(`✘ spec_register: ${p} ينقصه في Root.tsx: ${missing.map((f) => IDS[f]).join("، ")} → node tools/spec_register.mjs ${p}${opt("id", null) ? ` --id ${id}` : ""}`); process.exit(1); }
  console.log(`✔ spec_register: ${p} مسجَّل بكل أشكاله (${forms.map((f) => IDS[f]).join("، ")})`); process.exit(0);
}
if (!missing.length) { console.log(`✔ spec_register: ${p} مسجَّل أصلاً (${forms.map((f) => IDS[f]).join("، ")})`); process.exit(0); }

// spec import + the one component that draws it
const importRe = new RegExp(`^import (\\w+) from "\\.\\./data/specs/${p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\.json";$`, "m");
let specVar = t.match(importRe)?.[1];
const afterLine = (re, add) => { const m = t.match(re); if (!m) throw new Error(`Root.tsx: لا أجد موضع الإدراج (${re})`); const at = m.index + m[0].length; t = t.slice(0, at) + "\n" + add + t.slice(at); };
if (!specVar) {
  specVar = `${camel(p)}Spec`;
  afterLine(/^import type \{ MontageSpec \} from "\.\/MontageSpec";$/m, `import ${specVar} from "../data/specs/${p}.json";`);
}
const cast = `${specVar} as unknown as MontageSpec`;
const compRe = new RegExp(`^const (\\w+): React\\.FC = \\(\\) => <MontageFromSpec spec=\\{${specVar} as unknown as MontageSpec\\} />;$`, "m");
let comp = t.match(compRe)?.[1];
if (!comp) { comp = `${pascal(id)}Comp`; afterLine(importRe, `const ${comp}: React.FC = () => <MontageFromSpec spec={${cast}} />;`); }
const bothComp = `${pascal(id)}BothComp`;
if (forms.includes("both") && !new RegExp(`^const ${bothComp}\\b`, "m").test(t)) afterLine(new RegExp(`^const ${comp}: React\\.FC = .*$`, "m"), `const ${bothComp}: React.FC = () => <MontageBoth spec={${cast}} />;`);
const bothVComp = `${pascal(id)}BothVComp`;
if (forms.includes("bothv") && !new RegExp(`^const ${bothVComp}\\b`, "m").test(t)) afterLine(new RegExp(`^const ${comp}: React\\.FC = .*$`, "m"), `const ${bothVComp}: React.FC = () => <MontageBoth spec={${cast}} phone />;`);
if (!/from "\.\/MontageBoth"/.test(t)) afterLine(/^import type \{ MontageSpec \} from "\.\/MontageSpec";$/m, `import { MontageBoth, BOTH, BOTHV } from "./MontageBoth";`);
else if (!/BOTHV/.test(t.match(/^import .*from "\.\/MontageBoth";$/m)?.[0] ?? "")) t = t.replace(/^import \{ MontageBoth, BOTH \} from "\.\/MontageBoth";$/m, `import { MontageBoth, BOTH, BOTHV } from "./MontageBoth";`);

// the compositions: next to this spec's other forms when there are some, else first in its folder
const lineOf = (f) => `        <Composition id="${IDS[f]}" component={${f === "both" ? bothComp : f === "bothv" ? bothVComp : comp}} durationInFrames={specFrames(${cast})} fps={30} ${SIZE[f]} />`;
const siblings = [...t.matchAll(/^.*<Composition\s+id="([^"]+)".*$/gm)].filter((m) => Object.values(IDS).includes(m[1]));
if (siblings.length) { const last = siblings[siblings.length - 1]; const at = last.index + last[0].length; t = t.slice(0, at) + "\n" + missing.map(lineOf).join("\n") + t.slice(at); }
else afterLine(new RegExp(`^\\s*<Folder name="${folder}">$`, "m"), missing.map(lineOf).join("\n"));
fs.writeFileSync(ROOT, crlf ? t.split("\n").join("\r\n") : t);

// Arabic titles for what was added (the render gate needs them): the existing portrait/landscape title minus its suffix, else the spec's own title
const titles = fs.readFileSync(path.join("src", "compositionTitles.ts"), "utf8");
const titleOf = (cid) => titles.match(new RegExp(`^  "${cid.replace(/[-]/g, "\\-")}": "(.*)",`, "m"))?.[1];
const base = opt("title", null) ?? (titleOf(IDS.port) ?? titleOf(IDS.land))?.replace(/\s*\((?:طولي|عرضي)\)\s*$/, "").replace(/\s*[—-]\s*(?:طولي|عرضي)\s*$/, "") ?? spec.title ?? id;
const SUFFIX = { port: "طولي", land: "عرضي", both: "طولي وعرضي معاً", bothv: "طولي وعرضي معاً للجوال" };
if (!process.env.SPEC_REGISTER_ROOT) for (const f of missing) if (!titleOf(IDS[f])) spawnSync(process.execPath, ["tools/set_title.mjs", IDS[f], `${base} (${SUFFIX[f]})`], { stdio: "inherit" });
console.log(`✔ spec_register: ${p} ← ${missing.map((f) => IDS[f]).join("، ")} (مجلد «${folder}»)`);
