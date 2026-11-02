// Colours outside the channel identity (src/brand.ts; user 2026-10-27: «هوية واحدة لكل الفيديوهات بألوان بطاقة البند»).
//   node tools/brand_audit.mjs [--strict] [--fix] [files…]     default files = the montage kit + data/specs/*.json
// Lists every hex colour that is not a BRAND value, with its component and the nearest brand colour (Lab distance).
// Out of scope by nature (skipped): the verse screen, maps/flags, the cover kits (own approved art), comments.
// --fix   rewrites each such hex in the KIT files to its nearest brand colour (specs are never rewritten: remove the colour from the spec)
// --strict exit 1 when anything is left (used by stage check for the specs: a spec must not carry its own colours)
import fs from "node:fs";

const argv = process.argv.slice(2);
const strict = argv.includes("--strict"), fix = argv.includes("--fix");
const KIT = ["src/MG.tsx", "src/MGExtras.tsx", "src/EuKit.tsx", "src/PortraitKit.tsx", "src/MontageSpec.tsx", "src/TitleBar.tsx"];
const specs = fs.existsSync("data/specs") ? fs.readdirSync("data/specs").filter((f) => f.endsWith(".json")).map((f) => `data/specs/${f}`) : [];
const files = argv.filter((a) => !a.startsWith("--")).length ? argv.filter((a) => !a.startsWith("--")) : [...KIT, ...specs];
const SKIP_COMP = /Verse|Quran|Ayah|Map|Levant|Flag|Cover|Newspaper|Collage|CashHand/i;   // CashHand: skin tones of a drawn hand
// legacy colour families → their ROLE in the identity (nearest-colour alone turns gold into red and beige into green)
const ROLE = {
  card: "#f6efe0 #f7f4ea #fbf7ee #fff4dc #f3e9d2 #fdfcf8 #ecebe6 #fbfaf6 #f4efe6 #e9dcc0 #ece6d6 #f3d9a0 #f3e3b0 #fff3b0 #ffe9a0 #e8fffb #f7c9a8 #ffe9b0 #f6f1fa #ffe3a0 #fff4d6 #fff7e0",
  paper2: "#d8d2c2 #c9ab80 #cbb89c #ddd2ea #f2dfbf #f3dcae",
  ink: "#35200f #3a2a1a #2a2622 #2a2723 #1d1b17 #1b1a17 #222 #222222 #12202e",
  accent: "#f3c34a #c98b1a #d9b45a #f4a640 #ffbf3b #1f4f86",
  mark: "#d61f2c #e9525c #ff2b2b #e8472f #e8541e #d9693b #ff6a5c #8e2018 #7c2a1c #b4553a",
  green: "#3fcf5e #1fb83a #6dae6a #2f6a3a",
  blue: "#7fb0e0",
  light: "#00e5ff #6fe3d8",
  gray: "#74848f #9fb0ba #53636e #7a736a #8f7d66",
  base: "#ad9068 #8f6a44 #16263d #1b2330 #3a2f47 #5a4670",
  base2: "#34434d",
  base3: "#583820 #111 #111111 #050505 #0b0b0b #0b1d33 #10233a #2a2236 #3f3050",
  navyDeep: "#0f2a47",
};
const roleOf = Object.fromEntries(Object.entries(ROLE).flatMap(([k, hs]) => hs.split(" ").map((h) => [h, k])));
const MARKING = /Highlight|Ellipse|Mark|Brush|Stamp/;   // gold in a hand-drawn mark → the mark colour, elsewhere → the accent
// warm rgba() families (shadows, sweeps, glows) → the brand's rgb; the alpha is kept
const RGBA = {
  "10,18,30": "40,24,10 28,27,25 52,32,14 40,26,12 30,18,8 30,18,6 8,5,2",   // warm brown shadows → navy shadow
  "47,95,148": "243,195,74 243,205,70",                                       // gold sweep/glow → accent
  "246,248,250": "255,248,230 255,240,205 255,236,200 255,214,160 250,246,236 250,244,230 248,244,232 247,244,234",   // cream → card
  "181,65,47": "214,31,44",                                                   // red → mark
};
const rgbaRole = Object.fromEntries(Object.entries(RGBA).flatMap(([to, from]) => from.split(" ").map((f) => [f, to])));

const brandSrc = fs.readFileSync("src/brand.ts", "utf8");
const BRAND = Object.fromEntries([...brandSrc.matchAll(/^\s*(\w+):\s*"(#[0-9a-fA-F]{6})"/gm)].map((m) => [m[1], m[2].toLowerCase()]));
const ALLOWED = new Set([...Object.values(BRAND), "#ffffff", "#000000"]);
const lab = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v > 0.04045 ? ((v + 0.055) / 1.055) ** 2.4 : v / 12.92));
  const [x, y, z] = [[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]].map((r, i) => (r[0] * c[0] + r[1] * c[1] + r[2] * c[2]) / [0.95047, 1, 1.08883][i]);
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
};
const near = (hex) => { const a = lab(hex); let best = null; for (const [k, v] of Object.entries({ ...BRAND, white: "#ffffff", black: "#000000" })) { const b = lab(v), d = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]); if (!best || d < best.d) best = { k, v, d }; } return best; };
const expand = (h) => (h.length === 4 ? "#" + [...h.slice(1)].map((c) => c + c).join("") : h).toLowerCase();

let total = 0;
for (const f of files) {
  if (!fs.existsSync(f)) continue;
  const isSpec = f.endsWith(".json");
  const L = fs.readFileSync(f, "utf8").split("\n");
  let comp = "", hits = [];
  L.forEach((line, i) => {
    const m = line.match(/export const (\w+)|^const (\w+)\s*[:=]/); if (m) comp = m[1] ?? m[2];
    const code = line.replace(/\/\/.*$|\/\*.*?\*\//g, "");
    if (!isSpec && SKIP_COMP.test(comp)) return;
    for (const h of code.match(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g) ?? []) {
      const hx = expand(h); if (ALLOWED.has(hx)) continue;
      let r = roleOf[h.toLowerCase()] ?? roleOf[hx];
      if (r === "accent" && /^#(f3c34a|c98b1a|d9b45a|f4a640|ffbf3b)$/.test(hx) && MARKING.test(comp)) r = "mark";
      hits.push({ line: i + 1, comp, hex: h, near: r ? { k: r, v: BRAND[r] } : near(hx) });
    }
    for (const m of code.matchAll(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,/g)) {
      const to = rgbaRole[`${m[1]},${m[2]},${m[3]}`]; if (!to) continue;
      hits.push({ line: i + 1, comp, hex: m[0], near: { k: `rgba(${to})`, v: `rgba(${to},` } });
    }
  });
  if (!hits.length) continue;
  total += hits.length;
  const byComp = {};
  for (const x of hits) (byComp[x.comp || "(top)"] ??= []).push(x);
  console.log(`\n${f}: ${hits.length} colour(s) outside the identity`);
  for (const [c, xs] of Object.entries(byComp)) console.log(`  ${c}: ${[...new Set(xs.map((x) => `${x.hex}→${x.near.k}`))].join(" ")}`);
  if (fix && !isSpec) {
    const byLine = {}; for (const x of hits) (byLine[x.line] ??= []).push(x);
    for (const [ln, xs] of Object.entries(byLine)) for (const x of xs) L[ln - 1] = L[ln - 1].replace(x.hex, x.near.v);
    fs.writeFileSync(f, L.join("\n"));
    console.log(`  → fixed ${hits.length} in ${f}`);
  }
}
console.log(total ? `\n${total} colour(s) outside the identity${fix ? " (kit files rewritten)" : ""}.` : "brand OK: every colour is from src/brand.ts");
process.exit(strict && total ? 1 : 0);
