// Add / change the Arabic title of a composition shown in Remotion Studio:  node tools/set_title.mjs <CompositionId> "العنوان العربي"
//   node tools/set_title.mjs --remove <CompositionId>      node tools/set_title.mjs --list
import fs from "node:fs";
import { spawnSync } from "node:child_process";
const f = "src/compositionTitles.ts";
let [a, b] = process.argv.slice(2);
if (b === "--remove") [a, b] = [b, a];   // the rules write «<Id> --remove»; without this swap "--remove" was saved as the title
let t = fs.readFileSync(f, "utf8").split("\r\n").join("\n");
const re = (id) => new RegExp(`^  "${id.replace(/[-/\^$*+?.()|[\]{}]/g, "\$&")}": ".*",\n`, "m");
if (a === "--list") { for (const m of t.matchAll(/^  "([^"]+)": "(.*)",$/gm)) console.log(`${m[1]}  ←  ${m[2]}`); process.exit(0); }
if (a === "--remove" && b) { const had = re(b).test(t); t = t.replace(re(b), ""); fs.writeFileSync(f, t); console.log(had ? "حُذف:" : "لا عنوان له أصلاً:", b); spawnSync(process.execPath, ["tools/stamp_dates.mjs"], { stdio: "inherit" }); process.exit(0); }
if (!a || !b || b.startsWith("--")) { console.error('usage: node tools/set_title.mjs <CompositionId> "العنوان العربي"  |  <CompositionId> --remove  |  --list'); process.exit(2); }
if (!/^[A-Za-z0-9-]+$/.test(a)) { console.error("المعرّف يجب أن يكون لاتينياً (حروف وأرقام وشرطات)"); process.exit(2); }
const line = `  "${a}": ${JSON.stringify(b)},\n`;
t = re(a).test(t) ? t.replace(re(a), line) : t.replace(/\n};\s*$/, `\n${line.trimEnd()}\n};\n`);
fs.writeFileSync(f, t);
console.log(`${a}  ←  ${b}`);
spawnSync(process.execPath, ["tools/stamp_dates.mjs"], { stdio: "inherit" });   // refresh the newest-first order too
