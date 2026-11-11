// EDIT = ONE BLOCK, in the BUILD too (user 2026-10-26, repeated 2026-11-11: «تعمل مثل برامج المونتاج الحقيقية: تعديل في الإطار 1000 إلى 1010
// يُعدَّل هذا الجزء فقط، ما لك علاقة بغيره»). Once the user has the review link, the spec is FROZEN; a correction may change only its span.
//   node tools/spec_block.mjs freeze <p>                         → .tmp/<p>/spec_frozen.json = the version the user is reviewing (run when giving the link)
//   node tools/spec_block.mjs apply <p> <A> <B> [--cand file]     → A,B in seconds or «f1000» frames. The candidate (default: the current data/specs/<p>.json,
//        e.g. after re-running the build script) gives ONLY what intersects [A,B]; everything outside comes back byte-identical from the frozen copy
//        (items, behind windows, zooms, shake, splits). Then the frozen copy is updated to the result.
//   node tools/spec_block.mjs diff <p> [<A> <B> …]               → exit 1 if anything outside the given spans differs from the frozen copy (the guard)
// Top-level fields (title, verseAccepted, skipRequired…) come from the candidate (they are not on the timeline).
import fs from "node:fs";
import path from "node:path";

const [cmd, p, ...rest] = process.argv.slice(2);
if (!cmd || !p) { console.error("usage: node tools/spec_block.mjs freeze|apply|diff <p> [A B] [--cand file]"); process.exit(2); }
process.chdir(path.resolve(import.meta.dirname, ".."));
const specF = path.join("data", "specs", `${p}.json`), frozenF = path.join(".tmp", p, "spec_frozen.json");
const read = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
const sec = (x) => (/^f\d+/.test(x) ? Number(x.slice(1)) / 30 : Number(x));
const spanOf = (it) => {
  const a = it.at ?? it.from ?? it.times?.[0] ?? it.oldAt;
  const b = it.until ?? it.to ?? (it.dur != null && a != null ? a + it.dur : null) ?? (it.times ? it.times[it.times.length - 1] + 1 : a != null ? a + 3 : null);
  return a == null ? null : [a, b];
};
const hits = (it, spans) => { const s = spanOf(it); return s ? spans.some(([A, B]) => s[0] < B && s[1] > A) : false; };
const ARR = ["items", "behind", "zooms", "shake", "splits"];
const key = (x) => JSON.stringify(x);

if (cmd === "freeze") {
  fs.copyFileSync(specF, frozenF);
  console.log(`spec_block: نسخة المراجعة جُمِّدت → ${frozenF}`);
  process.exit(0);
}
if (!fs.existsSync(frozenF)) { console.error(`✘ لا نسخة مجمَّدة: node tools/spec_block.mjs freeze ${p} (عند إعطاء الرابط)`); process.exit(2); }
const frozen = read(frozenF);
const nums = rest.filter((x) => !x.startsWith("--") && rest[rest.indexOf(x) - 1] !== "--cand");
const spans = []; for (let i = 0; i + 1 < nums.length; i += 2) spans.push([sec(nums[i]), sec(nums[i + 1])]);

if (cmd === "diff") {
  const cur = read(specF), bad = [];
  for (const k of ARR) {
    const out = (arr) => (arr ?? []).filter((x) => !(spans.length && hits(x, spans)) && x.t !== "cover").map(key);
    const A = new Set(out(frozen[k])), B = new Set(out(cur[k]));
    for (const x of A) if (!B.has(x)) bad.push(`حُذف/تغيّر خارج النطاق (${k}): ${x.slice(0, 110)}`);
    for (const x of B) if (!A.has(x)) bad.push(`أُضيف/تغيّر خارج النطاق (${k}): ${x.slice(0, 110)}`);
  }
  console.log(bad.length ? `✘ spec_block: ${bad.length} تغيير خارج نطاق التعديل:\n  ` + bad.slice(0, 20).join("\n  ") : `✔ spec_block: لا تغيير خارج ${spans.map(([a, b]) => `${a.toFixed(2)}–${b.toFixed(2)}ث`).join("، ") || "أي نطاق"}`);
  process.exit(bad.length ? 1 : 0);
}
if (cmd === "apply") {
  if (!spans.length) { console.error("✘ apply يحتاج النطاق: A B (ثوانٍ أو f<إطار>)"); process.exit(2); }
  const ci = rest.indexOf("--cand"), cand = read(ci >= 0 ? rest[ci + 1] : specF);
  const res = { ...cand };
  let kept = 0, put = 0;
  for (const k of ARR) {
    const outside = (frozen[k] ?? []).filter((x) => x.t === "cover" ? false : !hits(x, spans));
    const inside = (cand[k] ?? []).filter((x) => x.t !== "cover" && hits(x, spans));
    const covers = (cand[k] ?? []).filter((x) => x.t === "cover");
    kept += outside.length; put += inside.length;
    if (cand[k] || frozen[k]) res[k] = [...covers, ...outside, ...inside].sort((x, y) => ((spanOf(x)?.[0] ?? -1) - (spanOf(y)?.[0] ?? -1)));
  }
  fs.writeFileSync(specF, JSON.stringify(res, null, 1));
  fs.copyFileSync(specF, frozenF);
  console.log(`spec_block: عُدِّل ${spans.map(([a, b]) => `${a.toFixed(2)}–${b.toFixed(2)}ث (الإطار ${Math.round(a * 30)}–${Math.round(b * 30)})`).join("، ")} وحده: ${put} عنصراً داخله من البناء الجديد، و${kept} خارجه كما هي حرفياً`);
  process.exit(0);
}
console.error("أمر غير معروف"); process.exit(2);
