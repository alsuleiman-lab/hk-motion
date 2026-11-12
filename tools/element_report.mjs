// Cost report of the gallery elements (user order 2026-11-08): RENDER cost = measured (data/element_costs.json from tools/element_bench.mjs),
// MAKE cost = an estimate from the code (size, props to fill, assets to prepare, hard-to-paint effects) — it is not a stopwatch, the file says so.
//   node tools/element_report.mjs            → data/element_costs.json (adds .make per element) + scratch/element_costs_report.html + .md
import fs from "node:fs";
const R = (f, d) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return d; } };
const lab = R("data/elements_lab.json", []), costs = R("data/element_costs.json", { items: {} });
const SRC = fs.readdirSync("src").filter((f) => /\.tsx?$/.test(f)).map((f) => ({ f, t: fs.readFileSync("src/" + f, "utf8") }));
const REAL = (SRC.find((s) => s.f === "RealLab.tsx") ?? { t: "" }).t, LABSRC = (SRC.find((s) => s.f === "ElementsLab.tsx") ?? { t: "" }).t;
const MEDIA = /["'`]([^"'`\n$]+\.(?:mp4|webm|mov|png|jpe?g|svg|webp|wav|mp3))["'`]/gi;
const HEAVY = [["blur", /filter:\s*[`"'][^`"']*blur\(|backdropFilter|blur\(/g], ["shadow", /boxShadow|drop-shadow|textShadow/g], ["svgFilter", /feTurbulence|feDisplacement|<filter/g], ["mask/clip", /maskImage|WebkitMask|clipPath/g], ["video", /<(?:OffthreadVideo|Video)\b/g], ["canvas/three", /<canvas|three|@react-three/g]];

const defOf = (id) => {
  for (const s of SRC) {
    const re = new RegExp(`^export (?:const|function) ${id}\\b`, "m"), m = re.exec(s.t);
    if (!m) continue;
    const rest = s.t.slice(m.index + 1), n = rest.search(/\n(?:export (?:const|function|type|interface)\b|\/\*\*)/);
    return { file: s.f, code: s.t.slice(m.index, m.index + 1 + (n < 0 ? rest.length : n)) };
  }
  return null;
};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rows = lab.map((m) => {
  const d = defOf(m.id), code = d?.code ?? "", lines = code ? code.split("\n").length : 0;
  const propsBlock = (code.match(/React\.FC<\{([\s\S]*?)\}>\s*=/) ?? [])[1] ?? "";
  const props = (propsBlock.match(/(?:^|[;,\n{])\s*\w+\??:/g) ?? []).length;
  const assets = new Set([...code.matchAll(MEDIA)].map((x) => x[1])).size;
  const heavy = HEAVY.filter(([, re]) => (code.match(re) ?? []).length).map(([n]) => n);
  const real = new RegExp(`\\b${m.id}\\b`).test(REAL) || /^Debate|^Curtain$/.test(m.id), atSlot = new RegExp(`^  ${m.id}: \\(`, "m").test(LABSRC);
  const matte = m.mode === "iso", pics = /\.(png|jpe?g|webp)/.test(code) || /people\/|books\/|photos?/i.test(code);
  // make-cost score 1 (drop it in, fill 2-3 words) … 5 (own assets, matte, many fields, tuned placement)
  let s = 1 + (props > 8) + (props > 16) + (lines > 90) + (lines > 220) + (assets > 0) + (matte ? 1 : 0) + (pics ? 1 : 0) + (heavy.includes("video") ? 1 : 0) + (real ? 0.5 : 0);
  s = clamp(Math.round(s), 1, 5);
  const why = [props ? `${props} حقلاً يُملأ` : "بلا حقول", lines ? `${lines} سطراً` : "مدمج في المحرك أو المواصفات", assets ? `${assets} ملف وسائط` : "", matte ? "عزل خلفية (matte)" : "", pics && !assets ? "صور خارجية" : "", real ? "يُبنى من عنصر في المواصفات" : ""].filter(Boolean).join("، ");
  return { id: m.id, ar: m.ar, section: m.section, group: m.group, mode: m.mode, props, lines, assets, heavy, make: s, why, ...(costs.items[m.id] ?? {}) };
});
for (const r of rows) { costs.items[r.id] = { ...(costs.items[r.id] ?? {}), make: r.make, makeWhy: r.why, heavy: r.heavy }; }
costs.makeNote = "make = تقدير من الكود (1 سهل … 5 مكلف)، وليس زمناً مقيساً بالساعة؛ render = مقيس فعلاً (ms لكل إطار فوق المشهد الفارغ).";
fs.writeFileSync("data/element_costs.json", JSON.stringify(costs, null, 1));

const NOISE = 30;   // measured: the same element varies ±15 ms between runs; the 10 "heaviest" of pass 1 re-measured 3× all fell on the baseline
const fmt = (v) => (v == null ? "—" : v <= NOISE ? "≈0" : String(v));
const ranked = [...rows].sort((a, b) => (b.landExtra ?? b.portExtra ?? -1e9) - (a.landExtra ?? a.portExtra ?? -1e9));
const base = costs.baseline ?? {};
const md = [`# كلفة عناصر المعرض`, `الأساس (مشهد بلا عنصر): عرضي ${fmt(base.land)} ms/إطار، طولي ${fmt(base.port)} ms/إطار. «الزيادة» = كلفة العنصر فوق الأساس. الصنع = تقدير 1–5 من الكود.`, "",
  "| العنصر | القسم | رندر عرضي (زيادة ms) | رندر طولي (زيادة ms) | الصنع (1-5) | سبب الصنع | مكلّف للرسم |", "|---|---|---|---|---|---|---|",
  ...ranked.map((r) => `| ${r.ar ?? r.id} (${r.id}) | ${r.section} | ${fmt(r.landExtra)} | ${fmt(r.portExtra)} | ${r.make} | ${r.why} | ${r.heavy.join("، ") || "—"} |`)].join("\n");
fs.mkdirSync("scratch", { recursive: true });
fs.writeFileSync("scratch/element_costs_report.md", md);
console.log(`element_report: ${rows.length} elements, ${rows.filter((r) => r.landMs != null).length} measured`);

// ── HTML page for the user (sent with SendUserFile): data/speed_findings.json holds the written conclusions (settings benchmark, tools tried, advice)
const F = R("data/speed_findings.json", { settings: [], advice: [], tools: [] });
const esc = (s) => String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
const bar = (v, max) => `<span class="bar"><i style="width:${Math.min(100, Math.max(0, (v ?? 0) / max * 100))}%"></i></span>`;
const html = `<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>كلفة العناصر وتسريع الرندر</title>
<style>:root{--bg:#10151c;--panel:#18202b;--ink:#e8edf3;--mute:#9aa7b6;--line:#2a3646;--ok:#6fd49a;--mid:#e0b45a;--hi:#e87a6a}
@media (prefers-color-scheme: light){:root{--bg:#f4f1ea;--panel:#fff;--ink:#1c232b;--mute:#5d6875;--line:#d9d3c6;--ok:#1f8a55;--mid:#a8741a;--hi:#c0392b}}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.7 "Almarai",system-ui,sans-serif;padding:20px max(16px,env(safe-area-inset-right)) 40px max(16px,env(safe-area-inset-left))}
h1{font-size:26px;margin:0 0 6px}h2{font-size:20px;margin:28px 0 8px;border-bottom:2px solid var(--line);padding-bottom:4px}.sub{color:var(--mute)}
.box{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:12px 16px;margin:10px 0}li{margin:4px 0}
.wrap{overflow-x:auto}table{border-collapse:collapse;width:100%;min-width:760px}th,td{padding:7px 10px;border-bottom:1px solid var(--line);text-align:right;vertical-align:top}th{color:var(--mute);font-weight:700;font-size:14px}
.bar{display:inline-block;width:70px;height:8px;background:var(--line);border-radius:4px;vertical-align:middle;margin-inline-start:6px}.bar i{display:block;height:100%;background:var(--mid);border-radius:4px}
.k1,.k2{color:var(--ok)}.k3{color:var(--mid)}.k4,.k5{color:var(--hi)}small{color:var(--mute)}</style>
<h1>كلفة عناصر المعرض وتسريع المونتاج والرندر</h1>
<div class="sub">قيست ${new Date().toLocaleDateString("ar")} · الرندر مقيس فعلاً (90 إطاراً لكل عنصر، NVENC، مرتين) · الصنع تقدير من الكود وليس بالساعة</div>
<h2>الخلاصة</h2><div class="box"><ul>${(F.summary ?? []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
<h2>أسرع طريقة للرندر (نتائج الإعدادات)</h2><div class="box"><ul>${F.settings.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
<h2>أدوات جُرّبت أو بُحثت</h2><div class="box"><ul>${F.tools.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
<h2>أسرع طريقة للمونتاج (الصنع)</h2><div class="box"><ul>${F.advice.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
<h2>كل عنصر</h2><div class="sub">الأساس: عرضي ${esc(base.land)} م.ث/إطار · طولي ${esc(base.port)}. ما كان فرقه ≤ ${NOISE} م.ث فهو «≈0» أي ضمن الضجيج.</div>
<div class="wrap"><table><tr><th>العنصر</th><th>القسم</th><th>رندر عرضي</th><th>رندر طولي</th><th>الصنع</th><th>لماذا</th></tr>
${[...rows].sort((a, b) => b.make - a.make || (b.landExtra ?? 0) - (a.landExtra ?? 0)).map((r) => `<tr><td><b>${esc(r.ar ?? r.id)}</b><br><small>${esc(r.id)}</small></td><td>${esc(r.section)}</td><td>${esc(fmt(r.landExtra))}${bar(r.landExtra, 120)}</td><td>${esc(fmt(r.portExtra))}${bar(r.portExtra, 120)}</td><td class="k${r.make}">${r.make}/5</td><td><small>${esc(r.why)}${r.heavy.length ? " · رسم ثقيل: " + esc(r.heavy.join("، ")) : ""}</small></td></tr>`).join("")}
</table></div></html>`;
fs.writeFileSync("scratch/element_costs_report.html", html);
console.log("report: scratch/element_costs_report.html");
