// node tools/mix_audio.mjs <specName> <project> -> public/<project>_audio.wav = cut audio x0.8 + spec.echo + spec.sfx (trim 1.5s, vol, adelay)
// spec.echo = [{ from, to, preset? }] (user 2026-11-18, rules review, t13): echo on ONE phrase. from/to = cut seconds (the same clock as the items);
//   preset = an approved style of tools/echo_audio.py: 2 (cathedral, long clear tail) or 6 (warm deep, the default). That span of his voice is replaced by
//   itself + the echo (echo_audio's dry 0.9 + wet); the tail decays to silence under what follows. The rest of the voice is untouched. Old specs (no echo) mix as before.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
const [spec, p] = process.argv.slice(2);
const s = JSON.parse(fs.readFileSync(`data/specs/${spec}.json`, "utf8"));
const wav = fs.existsSync(`.tmp/${p}/cut_final.wav`) ? `.tmp/${p}/cut_final.wav` : fs.existsSync(`.tmp/${p}/cut_lvl.wav`) ? `.tmp/${p}/cut_lvl.wav` : `.tmp/${p}/cut.wav`;   // a leveled cut (clip windows lifted to the sheikh) wins
const sfx = (s.sfx ?? []).filter((x) => x.src && x.at != null);
const uniq = [...new Set(sfx.map((x) => x.src))];
/* echo spans (user 2026-11-18, rules review, t13): each span cut out of the voice, run through echo_audio.py, laid back at `from` */
const echoes = (s.echo ?? []).filter((e) => e && typeof e.from === "number" && typeof e.to === "number" && e.to > e.from);
const echoFiles = echoes.map((e, i) => {
  const seg = `.tmp/${p}/echo_${i}_in.wav`, out = `.tmp/${p}/echo_${i}.wav`, style = [2, 6].includes(Number(e.preset)) ? Number(e.preset) : 6;
  if (e.preset != null && ![2, 6].includes(Number(e.preset))) console.warn(`⚠ echo ${i}: preset ${e.preset} غير معتمد — استُعمل 6`);
  const a = spawnSync("ffmpeg", ["-y", "-v", "error", "-i", wav, "-ss", String(e.from), "-to", String(e.to), "-c:a", "pcm_s16le", seg], { stdio: "inherit" });
  const b = a.status === 0 ? spawnSync(process.env.PYTHON || "python", ["-I", path.join(import.meta.dirname, "echo_audio.py"), seg, out, "--style", String(style)], { stdio: "inherit" }) : a;
  if (b.status !== 0) { console.log(`mix failed: echo ${i} (${e.from}–${e.to})`); process.exit(1); }
  fs.rmSync(seg, { force: true });
  return out;
});
const args = ["-y", "-v", "error", "-i", wav];
uniq.forEach((u) => args.push("-i", `public/${u}`));
echoFiles.forEach((u) => args.push("-i", u));
let fc = `[0:a]volume=0.8${echoes.map((e) => `,volume=0:enable='between(t,${e.from},${e.to})'`).join("")}[m]`;
const labels = ["[m]"];
echoes.forEach((e, i) => { const k = 1 + uniq.length + i, ms = Math.round(e.from * 1000); fc += `;[${k}:a]volume=0.8,adelay=${ms}|${ms}[e${i}]`; labels.push(`[e${i}]`); });
sfx.forEach((x, i) => { const k = uniq.indexOf(x.src) + 1; const ms = Math.round(x.at * 1000); fc += `;[${k}:a]atrim=0:${x.dur ?? 1.5},volume=${x.vol ?? 0.04},adelay=${ms}|${ms}[s${i}]`; labels.push(`[s${i}]`); });
fc += `;${labels.join("")}amix=inputs=${labels.length}:normalize=0:duration=first[out]`;
fs.writeFileSync(`.tmp/${p}/mix_fc.txt`, fc);
args.push("-/filter_complex", `.tmp/${p}/mix_fc.txt`, "-map", "[out]", "-ac", "2", "-ar", "48000", `public/${p}_audio.wav`);
const r = spawnSync("ffmpeg", args, { stdio: "inherit" });
console.log(r.status === 0 ? `mixed ${sfx.length} sfx${echoes.length ? ` + ${echoes.length} echo` : ""} -> public/${p}_audio.wav` : "mix failed");
process.exit(r.status ?? 1);
