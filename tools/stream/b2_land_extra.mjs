import fs from "node:fs";
import { execSync } from "node:child_process";
const [p, ...a] = process.argv.slice(2); const f = `data/specs/${p}.json`;
const solo = (t, at, d) => execSync(`node tools/stream/b2_solo.mjs ${p} ${t} ${at} ${d}`, { stdio: "ignore" });
const cfg = JSON.parse(a[0]); // {name:[t..], sub:[t..], pics:[t..], rows:[[i0,i1]..], clock:t}
const st = (i) => i.at ?? i.from ?? i.times?.[0] ?? 0;
let s = JSON.parse(fs.readFileSync(f, "utf8"));
if (cfg.firstPic) { const fi = s.items.find((i) => i.t === "scraps" || i.t === "torn"); if (fi.at > 0.3) s.items.push({ t: "pic", src: cfg.firstPic, at: 0.02, until: +(fi.at - 0.04).toFixed(2), x: 330, y: 1440, w: 420, h: 240 }); }
const writ = () => s.items.filter((i) => i.t === "scraps" || i.t === "torn");
const nearest = (t) => writ().reduce((b, i) => (Math.abs(st(i) - t) < Math.abs(st(b) - t) ? i : b));
for (const t of cfg.pics ?? []) { const i = nearest(t); const idx = s.items.indexOf(i); const pic = { t: "pic", src: cfg.picSrc, at: i.at, until: i.until, x: 330, y: 1440, w: 420, h: 240 }; s.items.splice(idx, 1, pic); }
for (const [t0, t1] of cfg.rows ?? []) { const ws = writ().filter((i) => i.at >= t0 && i.at <= t1); if (ws.length < 2) continue; const rows = ws.slice(0, 3).map((i) => ({ at: i.at, label: i.text.replace(/^المتصل: «|»$/g, "").split(" ").slice(0, 8).join(" ") })); const from = ws[0].at, to = ws.slice(0, 3).at(-1).until; s.items = s.items.filter((i) => !ws.slice(0, 3).includes(i)); s.items.push({ t: "rows", from, to, rows }); }
if (cfg.clock) { const i = nearest(cfg.clock); const idx = s.items.indexOf(i); s.items.splice(idx, 1, { t: "clock", at: i.at, until: i.until }); }
s.items.sort((x, y) => st(x) - st(y)); fs.writeFileSync(f, JSON.stringify(s, null, 1));
for (const t of cfg.name ?? []) solo("nameTag", t, 3); for (const t of cfg.sub ?? []) solo("subscribe", t, 3);
console.log(p, "extras ok");
