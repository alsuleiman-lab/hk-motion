// Random colour palette per video (user order 2026-11-16: «ينتقي لون ستايل عشوائي في البداية فوراً»).
//   node tools/pick_brand.mjs [<p> --write]     prints the palette; never the same as the last two videos' palettes
// The five palettes are src/brand.ts (steel olive maroon kraft teal); a video takes one through spec "brand".
import fs from "node:fs";
import path from "node:path";

export const BRANDS = ["steel", "olive", "maroon", "kraft", "teal"];
export const pickBrand = (exceptId) => {
  const dir = path.join("data", "specs");
  const recent = fs.readdirSync(dir).filter((f) => f.endsWith(".json") && f !== `${exceptId}.json`)
    .map((f) => ({ f, t: fs.statSync(path.join(dir, f)).mtimeMs })).sort((a, b) => b.t - a.t).slice(0, 8)
    .map(({ f }) => { try { return JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")).brand; } catch { return null; } })
    .filter(Boolean).slice(0, 2);
  const pool = BRANDS.filter((b) => !recent.includes(b));
  return pool[Math.floor(Math.random() * pool.length)];
};

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve("tools/pick_brand.mjs")) {
  const p = process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : null, b = pickBrand(p);
  if (p && process.argv.includes("--write")) {
    const f = path.join("data", "specs", `${p}.json`), raw = fs.readFileSync(f, "utf8"), crlf = raw.includes("\r\n"), s = JSON.parse(raw);
    s.brand = b; let out = JSON.stringify(s, null, /\n  "/.test(raw) ? 2 : 1); if (crlf) out = out.replace(/\n/g, "\r\n");
    fs.writeFileSync(f, out + (raw.endsWith("\n") ? (crlf ? "\r\n" : "\n") : ""));
  }
  console.log(`✔ اللون: ${b}`);
}
