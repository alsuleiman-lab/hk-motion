import fs from "node:fs";
const p = process.argv[2]; const f = `data/specs/${p}.json`;
const s = JSON.parse(fs.readFileSync(f, "utf8"));
const band = ["torn", "scraps", "pic", "hadith", "verse"];
const st = (i) => i.at ?? i.from ?? (i.times ? i.times[0] - 0.1 : 0), en = (i) => i.until ?? i.to;
const set = (i, v) => { if (i.until !== undefined) i.until = v; else i.to = v; };
const its = s.items.filter((i) => band.includes(i.t)).sort((a, b) => st(a) - st(b));
let fixed = 0;
for (let k = 0; k < its.length - 1; k++) {
  const a = its[k], b = its[k + 1];
  if (en(a) > st(b) - 0.25) { set(a, +(st(b) - 0.25).toFixed(2)); fixed++; }
  if (en(a) - st(a) < 1.0) console.log("short item", a.t, st(a), en(a), a.text ?? "");
}
// pic: keep it clear of his beard (face zone ends y≈1414)
for (const i of s.items) if (i.t === "pic") { i.y = 1440; i.h = 240; i.w = 420; i.x = 330; }
fs.writeFileSync(f, JSON.stringify(s, null, 1));
console.log(p, "trimmed", fixed);
