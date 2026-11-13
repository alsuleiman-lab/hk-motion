import fs from "node:fs";
const p = process.argv[2]; const f = `data/specs/${p}.json`;
const s = JSON.parse(fs.readFileSync(f, "utf8"));
const band = ["torn", "scraps", "pic", "hadith", "verse", "tphoto", "rows", "blur", "word", "stamp"];   // every writing-zone element
const st = (i) => i.at ?? i.from ?? (i.times ? i.times[0] - 0.1 : 0);
const its = s.items.filter((i) => band.includes(i.t)).sort((a, b) => st(a) - st(b));
let n = 0;
for (let k = 0; k < its.length - 1; k++) {
  const a = its[k], b = its[k + 1];
  const end = a.until ?? a.to; const want = +(st(b) - 0.25).toFixed(2);
  // first minute: no empty moment at all (hold until the next one); later: hold at most 3 s more, so no gap > 5 s without a static 12 s picture
  const to = st(b) < 62 ? want : Math.min(want, +(end + 3).toFixed(2));
  if (st(b) - end > 0.3 && to > end) { if (a.until !== undefined) a.until = to; else a.to = to; n++; }
}
fs.writeFileSync(f, JSON.stringify(s, null, 1));
console.log(p, "gaps closed", n);
