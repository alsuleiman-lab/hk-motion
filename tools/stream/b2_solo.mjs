// node tools/stream/b2_solo.mjs <p> <subscribe|nameTag> <at> <dur>
import fs from "node:fs";
const [p, t, a, d] = process.argv.slice(2); const at = +a, dur = +d, f = `data/specs/${p}.json`; const s = JSON.parse(fs.readFileSync(f, "utf8"));
const st = (i) => i.at ?? i.from ?? i.times?.[0] ?? 0, en = (i) => i.until ?? i.to ?? st(i) + (i.dur ?? 3);
const band = ["torn", "scraps", "pic", "rows", "hadith", "verse", "word", "blur", "tphoto", "clock"];
s.items = s.items.filter((i) => !(band.includes(i.t) && st(i) >= at - 0.05 && en(i) <= at + dur + 0.15));
for (const i of s.items) if (band.includes(i.t) && st(i) < at - 0.05 && en(i) > at - 0.05 && (i.until !== undefined || i.to !== undefined)) { if (i.until !== undefined) i.until = +(at - 0.1).toFixed(2); else i.to = +(at - 0.1).toFixed(2); }
for (const i of s.items) if (band.includes(i.t) && st(i) > at - 0.05 && st(i) < at + dur + 0.1 && en(i) > at + dur) { i.at = +(at + dur + 0.15).toFixed(2); }
s.items.push(t === "subscribe" ? { t, at, x: 260, y: 1401, dur, land: { x: 684, y: 840 } } : { t, at, x: 540, y: 1381, dur, land: { x: 955, y: 800 } });
s.items.sort((x, y) => st(x) - st(y)); fs.writeFileSync(f, JSON.stringify(s, null, 1)); console.log(p, t, at);
