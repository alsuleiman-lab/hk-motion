// join_word_scan failure → keep ranges (source seconds) for the removed gaps at those joins. usage: node tools/stream/join_keep.mjs <p>  (prints a-b,c-d)
import fs from "node:fs";
const p = process.argv[2];
let log = ""; try { log = fs.readFileSync(`.tmp/${p}/stage_cut.log`, "utf8"); } catch { process.exit(0); }
const i = log.lastIndexOf("join_word_scan"); if (i < 0) process.exit(0);
const ts = [...log.slice(i, i + 4000).matchAll(/\((\d+(?:\.\d+)?)ث، الإطار/g)].map((m) => +m[1]);
const m = JSON.parse(fs.readFileSync(`public/${p}_map.json`, "utf8")).segments; const out = [];
for (const t of ts) for (let k = 0; k < m.length - 1; k++) { const e = m[k].n + (m[k].b - m[k].a); if (Math.abs(e - t) < 0.25) out.push(`${(m[k].b - 0.03).toFixed(2)}-${(m[k + 1].a + 0.03).toFixed(2)}`); }
console.log([...new Set(out)].join(","));
