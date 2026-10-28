// Who speaks when (WhisperX + pyannote). Run from the workspace root.
//   node tools/diarize.mjs <project>          → after `stage.mjs prep`: reuses .tmp/<p>/a16k.wav + words.json, writes .tmp/<p>/speakers.json
//   node tools/diarize.mjs <video|audio> <out.json> [--start s --end s]   → standalone (WhisperX transcribes + aligns)
//   extra flags pass through: --speakers N | --min N --max N | --ref NAME=voice.wav
// The sheikh is named "sheikh" from data/voices/sheikh.wav; other voices stay SPEAKER_xx (in a debate: --ref guest=clip.wav).
// Uses: turns where name ≠ sheikh = the quoted clip he replies to (show it on screen); in debates one colour/label per speaker.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const PY = process.env.PY ?? "S:/AI_Tools/ComfyUI_windows_portable/python_embeded/python.exe";
const [a0, ...rest] = process.argv.slice(2);
if (!a0) { console.error("usage: node tools/diarize.mjs <project> | <media> <out.json> [--start s --end s] [--speakers N] [--ref NAME=wav]"); process.exit(2); }
let args;
const T = path.join(".tmp", a0);
if (fs.existsSync(path.join(T, "a16k.wav"))) {
  const words = path.join(T, "words.json");
  args = [path.join(T, "a16k.wav"), path.join(T, "speakers.json"), ...(fs.existsSync(words) ? ["--words", words] : []), ...rest];
} else {
  if (!fs.existsSync(a0) || !rest[0]) { console.error(`✘ no .tmp/${a0}/a16k.wav and no media+out given`); process.exit(2); }
  args = [a0, ...rest];
}
const r = spawnSync(PY, [path.join(import.meta.dirname, "diarize.py"), ...args], { encoding: "utf8", windowsHide: true, maxBuffer: 1 << 26 });
if (r.status !== 0) { console.error((r.stderr || "").split("\n").filter((l) => !/warn|^W\d{4}/i.test(l)).slice(-15).join("\n")); process.exit(r.status ?? 1); }
const out = JSON.parse(fs.readFileSync(args[1], "utf8"));
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
for (const [k, v] of Object.entries(out.speakers)) console.log(`${v.name.padEnd(11)} ${k}  ${v.talk_s}s  ref ${v.ref_sim ?? "-"}`);
for (const t of out.turns) console.log(`${mmss(t.s)}–${mmss(t.e)}  ${t.name.padEnd(11)} ${t.text.slice(0, 60)}`);
console.log(`→ ${args[1]}`);
