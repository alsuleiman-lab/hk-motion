// node tools/text_overlap_scan.mjs <file.tsx> [--ratio 0.5]
// Gap rule: the next phrase starts ≥ half its font size below the previous one's last line (clearly more than the gap between lines of one phrase).
// Estimates the wrapped height of every <Rise …> inside the same <Only>/<Hard> block and flags pairs whose boxes overlap (user 2026-10-25: «انتبه من تداخل الكلام المكتوب»).
import fs from "node:fs";
const [file] = process.argv.slice(2);
const ratio = Number(process.argv.includes("--ratio") ? process.argv[process.argv.indexOf("--ratio") + 1] : 0.5);
const src = fs.readFileSync(file, "utf8").split("\n");
const num = (s, k) => { const m = s.match(new RegExp("\\s" + k + "=\\{([^}]+)\\}")); if (!m) return null; try { return Function("R", "L", `return (${m[1]})`)({ x: 1230, w: 640 }, { x: 40, w: 640 }); } catch { return null; } };
let block = null, items = [], bad = 0;
const flush = () => {
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
    const a = items[i], b = items[j];
    if (a.x + a.w <= b.x || b.x + b.w <= a.x) continue;
    const [top, low] = a.y <= b.y ? [a, b] : [b, a];
    if (low.y < top.y + top.h + 0.5 * low.size) { bad++; console.log(`OVERLAP line ${top.line}→${low.line}: «${top.text}» (y ${top.y}, ~${top.lines} lines, ends ${Math.round(top.y + top.h)}) vs «${low.text}» (y ${low.y})`); }
  }
  items = [];
};
src.forEach((l, n) => {
  if (/<(Only|Hard)\b/.test(l)) { flush(); block = n + 1; }
  if (/<\/(Only|Hard)>/.test(l)) { flush(); block = null; }
  for (const m of l.matchAll(/<Rise\b[^>]*\/>/g)) {
    const s = m[0], text = (s.match(/text="([^"]+)"/) || [])[1] || "";
    const x = num(s, "x"), y = num(s, "y"), w = num(s, "w"), size = num(s, "size");
    if ([x, y, w, size].some((v) => v == null)) continue;
    const lines = Math.max(1, Math.ceil((text.length * size * ratio) / w));
    items.push({ line: n + 1, text, x, y, w, lines, size, h: size * (1 + 1.2 * (lines - 1)) });
  }
});
flush();
console.log(bad ? `FAILED: ${bad} overlapping pair(s)` : "PASSED: no overlapping text estimated");
process.exit(bad ? 1 : 0);
