// Fails on the leftovers of Studio's visual-edit drag («تحديد» mode): it writes `translate: "Xpx Ypx"` / `scale: 0.99x` into a component's style and shifts the WHOLE composition
// in Studio and in every render (user 2026-11-13: a drag on the phone put translate "-143.1px 814.4px" on the montage root and "148.9px -70.2px" on the shared host; the 0.7-frame offset
// hid the video in every GPU render). Usage: node tools/studio_drag_lint.mjs   → exit 1 listing file:line.
import fs from "node:fs";
import path from "node:path";
const bad = [];
const walk = (d) => { for (const n of fs.readdirSync(d)) { const p = path.join(d, n); if (fs.statSync(p).isDirectory()) walk(p); else if (/\.tsx?$/.test(n)) scan(p); } };
const scan = (p) => fs.readFileSync(p, "utf8").split("\n").forEach((l, i) => { if (/^\s*translate:\s*"-?[\d.]+px -?[\d.]+px",?\s*$/.test(l) || /^\s*scale:\s*0\.9\d*,?\s*$/.test(l)) bad.push(`${p}:${i + 1}: ${l.trim()}`); });
walk("src");
if (bad.length) { console.log(`✘ studio_drag_lint: ${bad.length} بقية سحب من Studio تُزيح التركيبة كلها — احذفها (لا تستعمل زر «تحديد» في Studio):\n  ` + bad.join("\n  ")); process.exit(1); }
console.log("✔ studio_drag_lint: لا بقايا سحب في src");
