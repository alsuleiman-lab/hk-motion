// Every speech-to-text call in tools/ must be the strongest model: Whisper large-v3, float16, GPU (user 2026-11-17: «التفريغ الصوتي يجب أن يستخدم أقوى نموذج»).
//   node tools/asr_audit.mjs     → exit 1 listing any WhisperModel / load_model call with another model, int8 or CPU
import fs from "node:fs";
import path from "node:path";
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? (["node_modules", "__pycache__"].includes(e.name) ? [] : walk(path.join(d, e.name))) : /\.(py|mjs)$/.test(e.name) ? [path.join(d, e.name)] : []));
const bad = [];
for (const f of walk("tools")) {
  if (f.endsWith("asr_audit.mjs")) continue;
  const s = fs.readFileSync(f, "utf8");
  /* (2026-11-22, stream dress rehearsal) a file that DEFINES its own `load_model` (tools/transcribe_vad_segments.py: «THE model: large-v3, float16, on the card») is judged at its
     WhisperModel(...) line, which this audit checks; its definition line and its calls load_model() / load_model(THREADS) were read as «another model» and failed every clip's check */
  const ownLoader = /def load_model\(/.test(s);
  for (const m of s.matchAll(/(WhisperModel|load_model)\(([^)]*)\)/g)) {
    if (m[1] === "load_model" && (ownLoader || s[m.index - 1] === ".")) continue;   // own definition, or a call through the module that defines it (tvs.load_model())
    const a = m[2];
    if (!/large-v3/.test(a) && !/\bmodel\b|\bname\b|sys\.argv/.test(a)) bad.push(`${f}: ${m[0].slice(0, 90)} — ليس large-v3`);
    else if (/large-v3/.test(a) && (/int8/.test(a) || /device="cpu"/.test(a))) bad.push(`${f}: ${m[0].slice(0, 90)} — دقة منخفضة أو معالج`);
  }
}
console.log(bad.length ? bad.map((x) => "✘ " + x).join("\n") : "✔ asr_audit: كل التفريغ بنموذج large-v3 float16 على كرت الشاشة");
process.exit(bad.length ? 1 : 0);
