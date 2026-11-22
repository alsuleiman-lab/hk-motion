// كشف كلام ضاع بالقص: يقارن كلمات المقطع قبل القص (words_vad.json) بكلماته بعد القص (cut_words.json) ويسرد مقاطع الكلام التي اختفت.
//   node tools/stream/lost_speech_check.mjs <id> [<id> …]      خروج 1 إن وُجد كلام ضائع من ثلاث كلمات فأكثر (أو كلمتين طويلتين)
// المحاذاة بأطول متتالية مشتركة مع تسامح في إملاء الكلمة؛ اختلاف نموذجي التفريغ يظهر كلمة منفردة فلا يُعدّ ضياعاً، والعبارة الغائبة كلها هي المطلوبة.
import fs from "node:fs"; import path from "node:path";
process.chdir(path.resolve(import.meta.dirname, "..", ".."));
const norm = (s) => String(s).replace(/[ً-ْٰـ]/g, "").replace(/[إأآٱا]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/[^\p{L}\p{N}]/gu, "");
const near = (a, b) => a === b || (a.length > 3 && b.length > 3 && (a.startsWith(b) || b.startsWith(a) || lev(a, b) <= 1));
const lev = (a, b) => { if (Math.abs(a.length - b.length) > 1) return 9; let d = 0, i = 0, j = 0; while (i < a.length && j < b.length) { if (a[i] === b[j]) { i++; j++; continue; } d++; if (d > 1) return 9; if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++; } } return d + (a.length - i) + (b.length - j); };
let bad = 0;
const RANGES = process.argv.includes("--ranges"), keep = [];   // --ranges: يطبع مدى إبقاء (بالثواني من أصل المقطع) لكل كلام مقصوص ليُمرَّر إلى القص بدل الحذف
for (const id of process.argv.slice(2).filter((x) => !x.startsWith("--"))) {
  const T = path.join(".tmp", id), map = JSON.parse(fs.readFileSync(path.join("public", `${id}_map.json`), "utf8")).segments;
  const A = JSON.parse(fs.readFileSync(path.join(T, "words_vad.json"), "utf8")).map((w) => ({ s: w.s, e: w.e, m: (w.s + w.e) / 2, n: norm(w.w), w: w.w }));
  const C0 = JSON.parse(fs.readFileSync(path.join(T, "cut_words.json"), "utf8")); const C = (C0.words ?? C0).map((w) => norm(w.w ?? w.word)).filter(Boolean);
  // ما بقي في خريطة القص من كلمات الأصل (كلمة تبدأ داخل مقطع محتفظ به) تُهمل الكلمات المقصوصة عمداً (خارج الخريطة): المقارنة على ما كان في الخريطة فقط
  const inMap = (t) => map.some((g) => t >= g.a && t < g.b);
  // ما حُذف بأمر --rem (إعادة قرّرتُ حذفها من redo.txt، أو كلام جانبي) يسجّله stage cut في explicit_rem.json: ليس «ضائعاً» بل مقصوداً
  // (التجربة الشاملة للبث 2026-11-22: كل إعادة تُحذف بقرار كانت تُخفق هذا الفحص بـ«مقصوصة بالقص» فيقف القص الذي نجح)
  let ordered = []; try { ordered = JSON.parse(fs.readFileSync(path.join(T, "explicit_rem.json"), "utf8")).filter((r) => Array.isArray(r) && r.length === 2); } catch { /* no record */ }
  const isOrdered = (t) => ordered.some(([x, y]) => t >= x - 0.05 && t <= y + 0.05);
  const Ak = A.filter((x) => x.n);
  // LCS
  const n = Ak.length, m = C.length, L = Array.from({ length: n + 1 }, () => new Int16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = near(Ak[i].n, C[j]) ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const matched = new Array(n).fill(false); for (let i = 0, j = 0; i < n && j < m;) { if (near(Ak[i].n, C[j]) && L[i][j] === L[i + 1][j + 1] + 1) { matched[i] = true; i++; j++; } else if (L[i + 1][j] >= L[i][j + 1]) i++; else j++; }
  const runs = []; for (let i = 0; i < n;) { if (matched[i]) { i++; continue; } let k = i; while (k < n && !matched[k]) k++; runs.push([i, k]); i = k; }
  const lost = runs.filter(([a, b]) => { const ws = Ak.slice(a, b); const long = ws.filter((x) => x.n.length >= 4).length; return (b - a >= 3 || long >= 2) && true; });
  if (!lost.length) { if (!RANGES) console.log(`✔ ${id}: لا كلام ضائع`); continue; }
  for (const [a, b] of lost) { const ws = Ak.slice(a, b), inside = ws.filter((x) => !inMap(x.m)).length;
    if (ws.filter((x) => isOrdered(x.m)).length * 2 >= ws.length) { if (!RANGES) console.log(`◌ ${id}: ${ws.length} كلمة حُذفت بأمر --rem عند ${ws[0].s.toFixed(1)}–${ws[ws.length - 1].s.toFixed(1)}ث (قرار مكتوب، ليست ضياعاً): «${ws.map((x) => x.w).join(" ")}»`); continue; } if (inside * 2 >= ws.length) keep.push(`${Math.max(0, ws[0].s - 0.12).toFixed(2)}-${(ws[ws.length - 1].e + 0.12).toFixed(2)}`); if (!RANGES) console.log(`${inside * 2 >= ws.length ? "✘" : "⚠"} ${id}: ${ws.length} كلمة غابت عند ${ws[0].s.toFixed(1)}–${ws[ws.length - 1].s.toFixed(1)}ث من المقطع: «${ws.map((x) => x.w).join(" ")}»${inside * 2 >= ws.length ? " (مقصوصة بالقص)" : " (محتفظ بها في الخريطة؛ اختلاف تفريغ؟)"}`); if (inside * 2 >= ws.length) bad++; }
}
if (RANGES) console.log(keep.join(","));
process.exit(RANGES ? 0 : bad ? 1 : 0);
