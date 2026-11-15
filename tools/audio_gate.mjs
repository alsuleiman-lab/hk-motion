// MANDATORY audio gate for every montage (user order 2026-10-21: "force yourself to run this filter every time you edit a video").
//   node tools/audio_gate.mjs <name> --cut public/<name>_cut.mp4 --map public/<name>_map.json --tr <tr.json> --src16k <a.wav> [--audio public/<name>_audio.wav]
// Runs: (1) tools/noise_scan.py on the SOURCE segments (stock hallucination phrases / unvoiced / noise-like = non-speech sounds that VAD keeps),
//       (2) tools/join_click_scan.py on the cut joins, (3) tools/pause_check.py on the final audio (every pause between words, no VAD padding, none allowed > 0.40 s).
//   optional: --echo "a-b a-b …" (source seconds of clips that carry echo) runs tools/echo_check.py so the de-echo never makes the audio worse.
// FAILS (exit 1) if noise_scan finds anything to cut, a click at a join, or ANY pause > 0.40 s (no exceptions). On success writes
// .tmp/gates/<name>.audio.ok — tools/final_review.mjs refuses to pass without it. Re-run after EVERY re-cut.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import crypto from "node:crypto";
const name = process.argv[2];
if (!name) { console.error("usage: node tools/audio_gate.mjs <name> --cut … --map … --tr … --src16k … [--audio …]"); process.exit(2); }
const arg = (n, d) => (process.argv.includes("--" + n) ? process.argv[process.argv.indexOf("--" + n) + 1] : d);
const echoIv = arg("echo", "");
const cut = arg("cut"), map = arg("map"), tr = arg("tr"), src16 = arg("src16k"), audio = arg("audio", cut);
const PY = process.env.PY ?? "S:/AI_Tools/ComfyUI_windows_portable/python_embeded/python.exe";
const run = (args) => spawnSync(PY, args, { encoding: "utf8", maxBuffer: 1 << 26, env: { ...process.env, PYTHONIOENCODING: "utf-8" } });
let ok = true;
const rep = (good, msg) => { if (!good) ok = false; console.log(`${good ? "✔" : "✘"} ${msg}`); };

fs.mkdirSync(".tmp/gates", { recursive: true });
const nsOut = `.tmp/gates/${name}.noise.json`;
const ns = run(["tools/noise_scan.py", src16, tr, nsOut, "--map", map]);
let nsj = { cut: [], review: [] }; try { nsj = JSON.parse(fs.readFileSync(nsOut, "utf8")); } catch { /* keep empty */ }
{ /* a stock-phrase hit INSIDE a range the user ordered kept whole (the shown clip's own continuous sound, --keep) is the clip's breath/pause misheard by Whisper: it stays, printed never silent */
  const kr = (arg("keep", "") || "").split(",").filter(Boolean).map((r) => r.split("-").map(Number));
  const inK = (r) => kr.some(([x, y]) => r[0] >= x - 0.05 && r[1] <= y + 0.05);
  const ex = nsj.cut.filter(inK);
  if (ex.length) { console.log(`ℹ أصوات داخل مقطع معروض أُبقي كاملاً بأمر المستخدم (لا تُحذف): ${ex.map((r) => `[${r[0]}-${r[1]} «${r[2]}»]`).join(" ")}`); nsj.cut = nsj.cut.filter((r) => !inK(r)); }
}
rep(ns.status === 0 && nsj.cut.length === 0, `أصوات غير كلامية للحذف: ${nsj.cut.length} ${nsj.cut.map((r) => `[${r[0]}-${r[1]} «${r[2]}»]`).join(" ")}`);
/* (2026-11-12) a «review» sound used to print a warning and PASS — a 1.4 s «اووووو» stayed in «سانت رامبال». Now every review item blocks until it is decided in
   .tmp/<project>/noise_ok.json {"<source start>": "keep: why (it is speech: «قال» misheard)"}; the rest are cut with --rem at the measured silence. */
{
  let ok = {}; try { ok = JSON.parse(fs.readFileSync(`.tmp/${name}/noise_ok.json`, "utf8")); } catch { /* none decided */ }
  const open = nsj.review.filter((r) => !ok[String(r[0])]);
  if (nsj.review.length) console.log(`للمراجعة: ${nsj.review.map((r) => `[${r[0]}-${r[1]} «${r[2]}» ${r[3]}${ok[String(r[0])] ? " ← " + ok[String(r[0])] : ""}]`).join(" ")}`);
  rep(open.length === 0, `أصوات للمراجعة لم تُحسم: ${open.length} ${open.map((r) => `[${r[0]}-${r[1]} «${r[2]}»]`).join(" ")} — احذفها (--rem) أو اكتب سبب الإبقاء في .tmp/${name}/noise_ok.json`);
}
const jc = run(["tools/join_click_scan.py", audio, map, "--ratio", "5"]);
const bad = (jc.stdout.match(/flagged clicks: (\d+)/) ?? [])[1];
rep(jc.status === 0 && Number(bad) === 0, `نقرات عند وصلات القص: ${bad ?? "?"} ${jc.stdout.split("\n")[1] ?? ""}`);
/* (2026-11-12) a join must sit in a pause: voiced sound on both sides = a word cut mid-way («بنا… بنارس») */
{ const jw = run(["-I", "tools/join_word_scan.py", audio, map]); rep(jw.status === 0, (jw.stdout || "").trim().split("\n").slice(0, 4).join(" | ") || "join_word_scan لم يعمل"); }
/* (2026-11-13) every map edge must sit in real silence of the SOURCE (a leftover onset of a deleted word / a clipped word = ✘); join_polish moves the edges there first */
{ const je = run(["-I", "tools/join_edge_scan.py", src16, map]); rep(je.status === 0, (je.stdout || "").trim().split(String.fromCharCode(10)).slice(0, 6).join(" | ") || "join_edge_scan لم يعمل"); }
// ONE fixed rule for everything, NO exceptions (user 2026-10-22): no silence > 0.40 s anywhere — also inside other people's clip windows. Every pause is checked by time and length.
const pc = run(["tools/pause_check.py", audio, "0.40"]);
let pauses = null; try { pauses = JSON.parse((pc.stdout.split(String.fromCharCode(10))[1] ?? "[]").trim()); } catch { /* unparsable -> fail below */ }
// --keep a-b,…: source ranges the user ordered kept whole (his current message); pauses starting inside them (cut timeline via the map) are not counted — printed, never silent
const keepArg = arg("keep", "");
if (keepArg && Array.isArray(pauses)) {
  const segs = JSON.parse(fs.readFileSync(map, "utf8")).segments;
  // a boundary that fell in a dropped gap (the pause trim shaves segment ends) clamps to the nearest kept edge instead of dropping the whole span
  const toCut = (s, side) => {
    const g = segs.find((x) => s >= x.a - 1e-6 && s <= x.b + 1e-6); if (g) return g.n + (s - g.a);
    if (side === "b") { const q = [...segs].reverse().find((x) => x.b <= s); return q ? q.n + (q.b - q.a) : null; }
    const q = segs.find((x) => x.a >= s); return q ? q.n : null;
  };
  const spans = keepArg.split(",").filter(Boolean).map((r) => r.split("-").map(Number)).map(([a, b]) => [toCut(a, "a"), toCut(b, "b")]).filter(([a, b]) => a !== null && b !== null);
  /* (user order 2026-11-15, «إدلب»: سكتات كثيرة بتشويش لم تُقطع) a kept clip may keep its own SOUND (a nasheed, an adhan, applause), never a pause that holds only background noise:
     a pause is exempt only if its mean level is above −36 dB; noise-floor pauses inside a kept clip count like any other pause and are cut (cut_block) */
  const meanDb = (() => { try { const b = fs.readFileSync(audio); let o = 12, ch = 1, sr = 16000; while (o < b.length - 8) { const id = b.toString("ascii", o, o + 4), sz = b.readUInt32LE(o + 4); if (id === "fmt ") { ch = b.readUInt16LE(o + 10); sr = b.readUInt32LE(o + 12); } if (id === "data") { const d0 = o + 8; return (t0, t1) => { let e = 0, k = 0; for (let i = d0 + Math.floor(t0 * sr) * ch * 2, end = Math.min(b.length - 1, d0 + Math.floor(t1 * sr) * ch * 2); i < end; i += ch * 2 * 8) { const v = b.readInt16LE(i); e += v * v; k++; } return k ? 10 * Math.log10(e / k + 1e-9) - 90.3 : -99; }; } o += 8 + sz + (sz & 1); } } catch { /* fall through */ } return () => 0; })();
  const exempt = pauses.filter(([s, d]) => spans.some(([a, b]) => s >= a - 0.05 && s <= b) && meanDb(s, s + d) > -36);
  if (exempt.length) console.log(`ℹ سكتات مستثناة بأمر المستخدم (إبقاء كامل ${keepArg}ث مصدر): ${exempt.map(([s, d]) => `[${s}ث ×${d}]`).join(" ")}`);
  pauses = pauses.filter((p) => !exempt.includes(p));
}
// --silent-ok a-b,…: OUTPUT-timeline seconds of a deliberate silent animation / sound-effect beat in a cartoon (user 2026-11-10: «في الانيميشن السكتة نتجاوز عنها أحيانا لأجل دهشة أو مؤثر صوتي أو مقطع صامت»); pauses starting inside are not counted — printed, never silent
const silentOk = arg("silent-ok", "");
if (silentOk && Array.isArray(pauses)) {
  const spans = silentOk.split(",").filter(Boolean).map((r) => r.split("-").map(Number));
  const exempt = pauses.filter(([s]) => spans.some(([x, y]) => s >= x - 0.05 && s <= y));
  if (exempt.length) console.log(`ℹ سكتات مستثناة بأمر المستخدم (مقطع صامت/مؤثر في الأنيميشن ${silentOk}ث): ${exempt.map(([s, d]) => `[${s}ث ×${d}]`).join(" ")}`);
  pauses = pauses.filter((p) => !exempt.includes(p));
}
rep(pc.status === 0 && Array.isArray(pauses) && pauses.length === 0, `سكتات > 0.40ث: ${pauses ? pauses.length : "؟ (تعذّر القراءة)"}${pauses && pauses.length ? " " + pauses.slice(0, 12).map(([s, d]) => `[${s}ث ×${d}]`).join(" ") : ""} (المسموح 0 دون استثناء)`);
if (echoIv) {   // echo reduction must never make things worse: no negative/ghost correlations, remaining echo small
  const ec = run(["tools/echo_check.py", cut, audio, map, ...echoIv.split(/\s+/)]);
  const worst = Number((ec.stdout.match(/worst remaining\/ghost correlation: ([\d.]+)/) ?? [])[1] ?? 9);
  const negs = [...ec.stdout.matchAll(/echo corr [\d.-]+ -> (-[\d.]+)/g)].length;
  rep(worst <= 0.25 && negs === 0, `الصدى بعد التخفيف: أسوأ ارتباط متبقٍ/شبحي ${worst} (≤ 0.25) وارتباطات سالبة ${negs} (يجب 0)`);
}
const sha = (p) => { try { return crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex"); } catch { return null; } };
if (ok) { fs.writeFileSync(`.tmp/gates/${name}.audio.ok`, JSON.stringify({ at: new Date().toISOString(), files: Object.fromEntries([cut, map, tr, audio].filter(Boolean).map((p) => [p, sha(p)])) }, null, 1)); console.log("✔ بوابة الصوت نجحت"); } else { try { fs.rmSync(`.tmp/gates/${name}.audio.ok`); } catch { /* none */ } console.log("✘ بوابة الصوت فشلت: عالج وأعد التشغيل"); }
process.exit(ok ? 0 : 1);
