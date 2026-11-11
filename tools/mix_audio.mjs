// node tools/mix_audio.mjs <specName> <project> -> public/<project>_audio.wav = cut audio x0.8 + spec.sfx (trim 1.5s, vol, adelay)
import fs from "node:fs";
import { spawnSync } from "node:child_process";
const [spec, p] = process.argv.slice(2);
const s = JSON.parse(fs.readFileSync(`data/specs/${spec}.json`, "utf8"));
const wav = `.tmp/${p}/cut.wav`;
const sfx = (s.sfx ?? []).filter((x) => x.src && x.at != null);
const uniq = [...new Set(sfx.map((x) => x.src))];
const args = ["-y", "-v", "error", "-i", wav];
uniq.forEach((u) => args.push("-i", `public/${u}`));
let fc = `[0:a]volume=0.8[m]`;
const labels = ["[m]"];
sfx.forEach((x, i) => { const k = uniq.indexOf(x.src) + 1; const ms = Math.round(x.at * 1000); fc += `;[${k}:a]atrim=0:1.5,volume=${x.vol ?? 0.04},adelay=${ms}|${ms}[s${i}]`; labels.push(`[s${i}]`); });
fc += `;${labels.join("")}amix=inputs=${labels.length}:normalize=0:duration=first[out]`;
fs.writeFileSync(`.tmp/${p}/mix_fc.txt`, fc);
args.push("-/filter_complex", `.tmp/${p}/mix_fc.txt`, "-map", "[out]", "-ac", "2", "-ar", "48000", `public/${p}_audio.wav`);
const r = spawnSync("ffmpeg", args, { stdio: "inherit" });
console.log(r.status === 0 ? `mixed ${sfx.length} sfx -> public/${p}_audio.wav` : "mix failed");
process.exit(r.status ?? 1);
