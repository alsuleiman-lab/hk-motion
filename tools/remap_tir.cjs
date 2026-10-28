// After re-cutting the lesson, move every hard-coded time of the Tir compositions from the OLD cut timeline to the NEW one.
//   node tools/remap_tir.cjs <new_cut_file_name e.g. tir_cut_v2.mp4>
// Uses public/tir_map_prev.json (old) and public/tir_map.json (new): old time -> source time -> new time.
const fs = require("fs");
const oldM = require("../public/tir_map_prev.json").segments;
const newM = JSON.parse(fs.readFileSync("public/tir_map.json", "utf8"));
const toSrc = (t) => { for (const s of oldM) if (t >= s.n - 1e-6 && t <= s.n + (s.b - s.a) + 1e-6) return s.a + (t - s.n); const nx = oldM.find((s) => s.n > t); return nx ? nx.a : oldM[oldM.length - 1].b; };
const toNew = (t) => { for (const s of newM.segments) { if (t >= s.a - 1e-6 && t <= s.b + 1e-6) return s.n + (t - s.a); if (t < s.a) return s.n; } return newM.duration; };
const f = (t) => +toNew(toSrc(t)).toFixed(2);

// behind-the-body windows
const B = JSON.parse(fs.readFileSync("public/tir_behind.json", "utf8"));
B.forEach((k) => { k.t = f(k.t); });
fs.writeFileSync("public/tir_behind.json", JSON.stringify(B, null, 1));

// composition constants
let s = fs.readFileSync("src/TirLandscape.tsx", "utf8");
s = s.replace(/t: ([\d.]+) \}/g, (m, x) => "t: " + f(parseFloat(x)) + " }");
s = s.replace(/const (NAME_AT|SUBSCRIBE_AT) = \[([^\]]*)\];/g, (m, n, l) => "const " + n + " = [" + l.split(",").map((v) => f(parseFloat(v)).toFixed(1)).join(", ") + "];");
s = s.replace(/export const TIR_SECONDS = [\d.]+;/, "export const TIR_SECONDS = " + newM.duration.toFixed(3) + ";");
s = s.replace(/tir_cut(_v\d+)?\.mp4/, process.argv[2]);
fs.writeFileSync("src/TirLandscape.tsx", s);
console.log("remapped; new duration", newM.duration);
console.log("windows:", B.map((k) => k.t).join(" "));
