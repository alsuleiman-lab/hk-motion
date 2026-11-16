// إخفاقات الوصلات ← نطاقات إبقاء (ثوانٍ من المصدر) للثغرات المحذوفة عند تلك الوصلات. usage: node tools/stream/join_keep.mjs <p>  (يطبع a-b,c-d)
//   (1) join_word_scan: وصلة داخل كلام (أزمنتها بزمن القص)؛ (2) join_polish: «حافة بلا صمت ضمن 0.3ث» (خط اتصال مشوّش؛ أزمنتها بزمن المصدر start/end) —
//   الإبقاء يجعل المرحلة تقصّ ثغرة التشويش بلا صوت بشري وتقبل حافتيها في التشويش (noise_gaps) بدل الإيقاف.
import fs from "node:fs";
const p = process.argv[2];
let log = ""; try { log = fs.readFileSync(`.tmp/${p}/stage_cut.log`, "utf8"); } catch { process.exit(0); }
const m = JSON.parse(fs.readFileSync(`public/${p}_map.json`, "utf8")).segments; const out = [];
const i = log.lastIndexOf("join_word_scan");
if (i >= 0) {
  const ts = [...log.slice(i, i + 4000).matchAll(/\((\d+(?:\.\d+)?)ث، الإطار/g)].map((x) => +x[1]);
  for (const t of ts) for (let k = 0; k < m.length - 1; k++) { const e = m[k].n + (m[k].b - m[k].a); if (Math.abs(e - t) < 0.25) out.push(`${(m[k].b - 0.03).toFixed(2)}-${(m[k + 1].a + 0.03).toFixed(2)}`); }
}
const j = log.lastIndexOf("حافة بلا صمت ضمن");
if (j >= 0) {
  for (const x of log.slice(j, j + 3000).matchAll(/(\d+(?:\.\d+)?)ث (start|end) -?\d/g)) {
    const t = +x[1], k = m.findIndex((g) => Math.abs((x[2] === "start" ? g.a : g.b) - t) < 0.03);
    if (k < 0) continue;
    if (x[2] === "start" && k > 0) out.push(`${(m[k - 1].b - 0.03).toFixed(2)}-${(m[k].a + 0.03).toFixed(2)}`);
    if (x[2] === "end" && k < m.length - 1) out.push(`${(m[k].b - 0.03).toFixed(2)}-${(m[k + 1].a + 0.03).toFixed(2)}`);
  }
}
console.log([...new Set(out)].join(","));
