// One command per montage stage (user order 2026-10-25: the «ريلز» reel spent ~47 min in 158 small tool calls). Each stage writes its full log to
// .tmp/<p>/stage_<stage>.log and prints ONLY a short summary, so the session context stays small. Child processes run at below-normal priority.
//   node tools/stage.mjs prep  <p> <video>            copy → public/<p>_src.mp4, 16k wav, word transcript, VAD, per-VAD-segment transcript, contact sheet, source-display windows
//                                                     → .tmp/<p>/{a16k.wav, words.json, vad.json, tr_vad.json, words_vad.json, transcript.txt, sheet.jpg, sources.json,
//                                                        speakers.json + speakers.txt (who speaks when: tools/diarize.py)}
//        run it with run_in_background IN THE SAME MESSAGE as the first AskUserQuestion (MONTAGE_BRIEF.md «السرعة»).
//   node tools/stage.mjs cut   <p> [--rem a-b,c-d]    map from VAD minus the removed source ranges (seconds) → public/<p>_map.json; audio-only cut; pauses > 0.40 s
//                                                     are trimmed at their join automatically (up to 4 rounds); audio_gate; only if it passes: one NVENC build
//                                                     → public/<p>_cut.mp4 and the cut transcript .tmp/<p>/cut_transcript.txt (for timing elements).
//   node tools/stage.mjs check <p> <CompId> --file src/<X>.tsx --minutes <m> [--skip 0-12,40-55]
//                                                     typecheck → brand_audit (spec) → mg_usage_audit → coverage_check (spec) → face_fast (spec montage; else face_check) → frame_audit, one after another (never two renders at once).
// Exit code 1 when any step fails; the summary names the step and the log line to read.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const [stage, p, ...rest] = process.argv.slice(2);
const opt = (n, d) => (rest.includes("--" + n) ? rest[rest.indexOf("--" + n) + 1] : d);
if (!["prep", "cut", "check"].includes(stage) || !p) { console.error("usage: node tools/stage.mjs prep|cut|check <project> …  (see the header)"); process.exit(2); }
const PY = process.env.PY ?? "S:/AI_Tools/ComfyUI_windows_portable/python_embeded/python.exe";   // has faster_whisper + torch (system python does not)
const T = path.join(".tmp", p);
fs.mkdirSync(T, { recursive: true });
const logFile = path.join(T, `stage_${stage}.log`);
fs.writeFileSync(logFile, `# stage ${stage} ${p} ${new Date().toISOString()}\n`);
const log = (s) => fs.appendFileSync(logFile, s.endsWith("\n") ? s : s + "\n");
const t0 = Date.now();
const lines = [];
const say = (s) => { lines.push(s); log("» " + s); };

/** run a child at below-normal priority, everything into the log; resolves {code, out} (out = last 4000 chars) */
const run = (cmd, args, { env } = {}) => new Promise((res) => {
  log(`$ ${cmd} ${args.join(" ")}`);
  const c = spawn(cmd, args, { windowsHide: true, env: { ...process.env, PYTHONIOENCODING: "utf-8", ...env } });
  try { os.setPriority(c.pid, os.constants.priority.PRIORITY_BELOW_NORMAL); } catch { /* best effort */ }
  let out = "";
  const take = (d) => { const s = d.toString(); out = (out + s).slice(-4000); fs.appendFileSync(logFile, s); };
  c.stdout.on("data", take); c.stderr.on("data", take);
  c.on("close", (code) => res({ code, out }));
  c.on("error", (e) => res({ code: -1, out: String(e) }));
});
const must = async (label, cmd, args, o) => {
  const r = await run(cmd, args, o);
  if (r.code !== 0) { say(`✘ ${label} (exit ${r.code}) — ${r.out.trim().split("\n").slice(-3).join(" | ")}`); finish(1); }
  return r;
};
// نوافذ «عرض المصدر» (نصف الشاشة) بـtools/source_windows.mjs — لا تُوقف المرحلة إن فشلت، تُذكر فقط
const sources = async (src, extra = []) => {
  const r = await run("node", ["tools/source_windows.mjs", src, "--out", path.join(T, "sources.json"), ...extra]);
  if (r.code !== 0) { say(`⚠ source windows failed — ${r.out.trim().split(String.fromCharCode(10)).slice(-2).join(" | ")}`); return; }
  const w = JSON.parse(fs.readFileSync(path.join(T, "sources.json"), "utf8")).windows;
  say(`source display: ${w.length} window(s)${w.length ? " — " + w.map((x) => (x.cut ? `cut ${x.cut[0]}–${x.cut[1]}` : x.cut === null ? `${x.a}–${x.b} (cut out)` : `${x.a}–${x.b}`) + " " + x.side).join(", ") : ""} → ${path.join(T, "sources.json")}`);
};
/** source words → cut timeline through the map segments {a,b,n}: a word is kept when its middle lies in a kept segment (user 2026-10-27: no second Whisper pass) */
const remapWords = (words, segs) => {
  const out = [];
  for (const w of words) {
    const m = (w.s + w.e) / 2, g = segs.find((x) => m >= x.a && m < x.b);
    if (g) out.push({ s: +(g.n + Math.max(0, w.s - g.a)).toFixed(3), e: +(g.n + Math.min(g.b, w.e) - g.a).toFixed(3), w: w.w });
  }
  return out;
};
const finish = (code) => {
  console.log(lines.join("\n"));
  console.log(`[${stage}] ${code ? "FAILED" : "OK"} in ${((Date.now() - t0) / 60000).toFixed(1)} min — full log: ${logFile}`);
  process.exit(code);
};
const dur = async (f) => Number((await run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f])).out.trim().split("\n").pop());

/** readable transcript: one line per ~12 words or per gap > 0.6 s, «[t] text» — read this instead of the JSON */
const toText = (words) => {
  const out = []; let cur = [], s0 = 0, last = -1;
  for (const w of words) {
    if (cur.length && (cur.length >= 12 || w.s - last > 0.6)) { out.push(`[${s0.toFixed(1)}] ${cur.join(" ")}`); cur = []; }
    if (!cur.length) s0 = w.s;
    cur.push(w.w.trim()); last = w.e;
  }
  if (cur.length) out.push(`[${s0.toFixed(1)}] ${cur.join(" ")}`);
  return out.join("\n") + "\n";
};

if (stage === "prep") {
  const video = rest.find((a) => !a.startsWith("--"));
  if (!video || !fs.existsSync(video)) { say(`✘ video not found: ${video}`); finish(1); }
  const audioOnly = rest.includes("--audio-only");
  const src = path.join("public", `${p}_src${audioOnly ? path.extname(video).toLowerCase() : ".mp4"}`);
  fs.writeFileSync(path.join(T, "prep_config.json"), JSON.stringify({ source: src, original: path.resolve(video), audioOnly }, null, 2));
  if (!fs.existsSync(src)) { try { fs.linkSync(video, src); } catch { fs.copyFileSync(video, src); } }
  fs.mkdirSync(path.join("public", p), { recursive: true });
  const a16 = path.join(T, "a16k.wav");
  await must("audio 16k", "ffmpeg", ["-v", "error", "-y", "-threads", "4", "-i", src, "-vn", "-ac", "1", "-ar", "16000", "-threads", "4", a16]);
  const srcWin = audioOnly ? Promise.resolve() : sources(src);
  const sheet = audioOnly ? Promise.resolve() : must("contact sheet", "ffmpeg", ["-v", "error", "-y", "-threads", "4", "-i", src, "-vf", "fps=1/6,scale=320:-1,tile=8x8", "-frames:v", "1", path.join(T, "sheet.jpg")]);
  await must("VAD", PY, ["tools/vad_segments.py", a16, path.join(T, "vad.json"), "--padstart", "100", "--padend", "180", "--minsil", "150"]);
  await must("per-VAD transcript", PY, ["tools/transcribe_vad_segments.py", a16, path.join(T, "vad.json"), path.join(T, "tr_vad.json"), "--device", opt("asr-device", "cuda"), "--threads", opt("asr-threads", "4")]);
  await sheet;
  await srcWin;
  const segs = JSON.parse(fs.readFileSync(path.join(T, "tr_vad.json"), "utf8"));
  const words = segs.flatMap((g) => g.words ?? []);
  fs.writeFileSync(path.join(T, "words_vad.json"), JSON.stringify(words));
  fs.writeFileSync(path.join(T, "words.json"), JSON.stringify(words));   // one Whisper pass (per VAD segment, no long-file hallucinations); words.json kept for find_restarts & co.
  fs.writeFileSync(path.join(T, "transcript.txt"), toText(words));
  say(`source ${(await dur(src)).toFixed(1)} s · ${segs.length} VAD segments · ${words.length} words`);
  // من يتكلم ومتى (WhisperX/pyannote، 2026-10-28): أدوار غير «sheikh» = المقطع الذي يرد عليه / الطرف الآخر في المناظرة. لا يوقف المرحلة إن فشل
  if (!rest.includes("--skip-diarize")) {
  const dz = await run(PY, ["tools/diarize.py", a16, path.join(T, "speakers.json"), "--words", path.join(T, "words.json")]);
  if (dz.code !== 0) say(`⚠ speakers failed — ${dz.out.trim().split("\n").slice(-2).join(" | ")}`);
  else {
    const { speakers, turns } = JSON.parse(fs.readFileSync(path.join(T, "speakers.json"), "utf8"));
    const mm = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
    fs.writeFileSync(path.join(T, "speakers.txt"), turns.map((t) => `[${t.s.toFixed(1)}–${t.e.toFixed(1)} ${mm(t.s)}] ${t.name}: ${t.text}`).join("\n") + "\n");
    const others = turns.filter((t) => t.name !== "sheikh");
    say(`speakers: ${Object.values(speakers).map((v) => `${v.name} ${v.talk_s}s`).join(", ")}${Object.values(speakers).some((v) => v.name === "sheikh") ? "" : " (⚠ sheikh not matched)"} · ${others.length} other-speaker turn(s) → ${path.join(T, "speakers.txt")}`);
  }
  } else say("speaker roles: review the narrator and story dialogue from the audio/transcript");
  say(`read: ${path.join(T, "transcript.txt")}${audioOnly ? " (audio-only source)" : `  (contact sheet: ${path.join(T, "sheet.jpg")})`}`);
  finish(0);
}

if (stage === "cut") {
  const cfgFile = path.join(T, "prep_config.json");
  const prepConfig = fs.existsSync(cfgFile) ? JSON.parse(fs.readFileSync(cfgFile, "utf8")) : {};
  const src = prepConfig.source ?? path.join("public", `${p}_src.mp4`), mapF = path.join("public", `${p}_map.json`), wav = path.join(T, "cut.wav");
  const rem = (opt("rem", "") || "").split(",").filter(Boolean).map((r) => r.split("-").map(Number));
  const vad = JSON.parse(fs.readFileSync(path.join(T, "vad.json"), "utf8")).speech;
  let segs = [];
  for (let [s, e] of vad) {   // VAD speech minus the removed ranges
    for (const [ra, rb] of rem) {
      if (s === null || e <= ra || s >= rb) continue;
      if (s < ra) segs.push([s, ra]);
      s = e > rb ? rb : null;
    }
    if (s !== null) segs.push([s, e]);
  }
  // --keep a-b,…: ranges he ordered kept untouched (sound the VAD calls non-speech, e.g. a clip's adhan): merged into the neighbouring segments
  const keep = (opt("keep", "") || "").split(",").filter(Boolean).map((r) => r.split("-").map(Number));
  if (keep.length) {
    segs = [...segs, ...keep].sort((x, y) => x[0] - y[0]);
    segs = segs.reduce((o, g) => { const l = o[o.length - 1]; if (l && g[0] <= l[1] + 0.01) l[1] = Math.max(l[1], g[1]); else o.push([...g]); return o; }, []);
  }
  const fr = (t) => Math.round(t * 30) / 30;   // 1/30 s grid (cut_edl)
  let segments = segs.filter(([a, b]) => b - a > 0.06).map(([s, e]) => ({ a: fr(s), b: fr(e) })).filter((g) => g.b > g.a);
  const renumber = () => { let n = 0; for (const g of segments) { g.n = +n.toFixed(3); n += g.b - g.a; } return n; };
  const writeMap = () => { const n = renumber(); fs.writeFileSync(mapF, JSON.stringify({ segments, duration: +n.toFixed(3) }, null, 1)); return n; };
  writeMap();
  // pauses > 0.40 s: trim them at the nearest join (65% from the end of the left segment, 35% from the start of the right one), then re-check
  for (let round = 0; round < 4; round++) {
    await must("audio cut", "node", ["tools/cut_edl.mjs", "audio", src, mapF, wav]);
    const pc = await run(PY, ["tools/pause_check.py", wav, "0.40"]);
    let pauses = []; try { pauses = JSON.parse((pc.out.split("\n")[1] ?? "[]").trim()); /* same parsing as audio_gate.mjs */ } catch { /* none */ }
    if (!pauses.length) break;
    let fixed = 0;
    for (const [t, d] of pauses) {
      let k = -1, best = 9;
      for (let i = 0; i < segments.length - 1; i++) { const dd = Math.abs(segments[i + 1].n - t); if (dd < best) { best = dd; k = i; } }
      if (best > 0.9) { say(`pause ${d}s at ${t}s is inside a segment (not at a join) — cut it by hand (cut_at.mjs) or --rem`); continue; }
      const take = Math.min(d - 0.34, 0.3);
      segments[k].b = +(segments[k].b - take * 0.65).toFixed(4); segments[k + 1].a = +(segments[k + 1].a + take * 0.35).toFixed(4); fixed++;
    }
    say(`round ${round + 1}: ${pauses.length} pause(s) > 0.40 s, trimmed ${fixed}`);
    writeMap();
    if (!fixed) break;
  }
  const gate = await run("node", ["tools/audio_gate.mjs", p, "--cut", wav, "--map", mapF, "--tr", path.join(T, "tr_vad.json"), "--src16k", path.join(T, "a16k.wav"), "--audio", wav, ...(opt("keep", "") ? ["--keep", opt("keep", "")] : [])]);
  if (gate.code !== 0) { say(`✘ audio_gate — ${gate.out.trim().split("\n").slice(-6).join(" | ")}`); say("fix with --rem (source seconds) and re-run this stage; nothing was built"); finish(1); }
  say("audio_gate ✔");
  if (prepConfig.audioOnly) {
    const audioAsset = path.join("public", p, `voice_${Date.now()}.wav`);
    fs.copyFileSync(wav, audioAsset);
    fs.writeFileSync(cfgFile, JSON.stringify({ ...prepConfig, cutAudio: audioAsset }, null, 2));
    const cutWords = remapWords(JSON.parse(fs.readFileSync(path.join(T, "words_vad.json"), "utf8")), JSON.parse(fs.readFileSync(mapF, "utf8")).segments);
    fs.writeFileSync(path.join(T, "cut_words.json"), JSON.stringify(cutWords));
    fs.writeFileSync(path.join(T, "cut_transcript.txt"), toText(cutWords));
    say(`audio-only cut ${(await dur(audioAsset)).toFixed(1)} s · ${segments.length} segments → ${audioAsset}`);
    const vs = await run("node", ["tools/verse_scan.mjs", p]);
    say(`verse_scan: ${(vs.out.match(/✔ /g) ?? []).length} تلاوة في القص → .tmp/${p}/verses.json`);
    say(`read: ${path.join(T, "cut_transcript.txt")}`);
    finish(0);
  }
  const cut = path.join("public", `${p}_cut.mp4`);
  await must("NVENC build", "node", ["tools/cut_edl.mjs", "build", src, mapF, cut]);
  // duplicated frames of the recording (frame-rate conversion) make the motion judder: ALWAYS smooth them right here (PREFERENCES §6 «تسجيلاته ترتجف»); the video is built on <p>_cut_s.mp4
  const srcWin = sources(src, ["--map", mapF]);
  const cutS = path.join("public", `${p}_cut_s.mp4`);
  // smoothing (≈5 min for 8 min) runs in the BACKGROUND: <p>_cut_s.mp4 appears when it is done (part file renamed); `check` waits for it (user 2026-10-27: «تسريع المونتاج»)
  const running = path.join(T, "smooth.running");
  fs.writeFileSync(running, String(Date.now()));
  const part = path.join(T, "cut_s_part.mp4");
  const job = `const {spawnSync}=require("child_process"),fs=require("fs");const r=spawnSync(${JSON.stringify("C:/Users/mshms/AppData/Local/Programs/Python/Python310/python.exe")},["tools/smooth_dups.py",${JSON.stringify(cut)},${JSON.stringify(part)}],{encoding:"utf8",windowsHide:true});fs.writeFileSync(${JSON.stringify(path.join(T, "smooth.log"))},(r.stdout||"")+(r.stderr||""));if(r.status===0){fs.renameSync(${JSON.stringify(part)},${JSON.stringify(cutS)})}fs.rmSync(${JSON.stringify(running)},{force:true});`;
  spawn(process.execPath, ["-e", job], { detached: true, stdio: "ignore", windowsHide: true }).unref();
  const cutWords = remapWords(JSON.parse(fs.readFileSync(path.join(T, "words_vad.json"), "utf8")), JSON.parse(fs.readFileSync(mapF, "utf8")).segments);
  fs.writeFileSync(path.join(T, "cut_words.json"), JSON.stringify(cutWords));
  fs.writeFileSync(path.join(T, "cut_transcript.txt"), toText(cutWords));
  await srcWin;
  say(`cut ${(await dur(cut)).toFixed(1)} s · ${segments.length} segments → ${cut} (smoothing in the background → ${cutS} in ≈5 min, log ${path.join(T, "smooth.log")} — build on it; after the render run tools/judder_check.mjs)`);
  say(`read: ${path.join(T, "cut_transcript.txt")} (cut timeline — check stumbles/«أعيد» are gone)`);
  const vs = await run("node", ["tools/verse_scan.mjs", p]);   // every recited verse becomes a verse item at the second it is said (user 2026-10-28)
  say(`verse_scan: ${(vs.out.match(/✔ /g) ?? []).length} تلاوة في القص → .tmp/${p}/verses.json (كل تلاوة تُكتب في الخطة)`);
  // the camera moves are PLANNED here, before the build (user 2026-10-28): push-ins + shake with their sentences → moves.md, copied into the spec by spec_draft
  const mv = await run("node", ["tools/moves_plan.mjs", p]);
  say(`${mv.out.trim().split("\n").pop()} (راجعها في الخطة: أبقِ/انقل/احذف، ثم zooms/shake في ملف البيانات)`);
  finish(0);
}

if (stage === "check") {
  const comp = rest.find((a) => !a.startsWith("--") && rest[rest.indexOf(a) - 1]?.startsWith("--") !== true);
  const file = opt("file", ""), minutes = opt("minutes", "");
  if (!comp || !file || !minutes) { say("✘ usage: check <p> <CompId> --file src/X.tsx --minutes M [--skip a-b,…]"); finish(1); }
  const running = path.join(T, "smooth.running");
  if (fs.existsSync(running)) { say("waiting for the background smoothing (<p>_cut_s.mp4)…"); while (fs.existsSync(running)) await new Promise((r) => setTimeout(r, 5000)); }
  let failed = 0;
  const step = async (label, cmd, args, pick) => {
    const r = await run(cmd, args);
    const key = r.out.trim().split("\n").filter((l) => pick.test(l)).slice(-2).join(" | ") || r.out.trim().split("\n").pop();
    if (r.code !== 0) failed++;
    say(`${r.code === 0 ? "✔" : "✘"} ${label}: ${key}`);
  };
  await step("typecheck", "node", ["node_modules/typescript/bin/tsc", "-p", "."], /error TS/);
  // one colour identity (src/brand.ts, user 2026-10-27): the montage's spec carries no colours of its own
  if (fs.existsSync(path.join("data", "specs", `${p}.json`))) await step("brand_audit", "node", ["tools/brand_audit.mjs", "--strict", path.join("data", "specs", `${p}.json`)], /outside the identity|brand OK/);
  await step("mg_usage_audit", "node", ["tools/mg_usage_audit.mjs", file, "--minutes", minutes], /PASS|FAIL|kinds|نوع/i);
  // complete, not just valid (user 2026-10-28): every named thing has its picture, no long empty stretch, the moves are in the spec
  if (fs.existsSync(path.join("data", "specs", `${p}.json`))) await step("coverage_check", "node", ["tools/coverage_check.mjs", path.join("data", "specs", `${p}.json`)], /^✘|PASSED|FAILED/);
  // his face is fixed vertically and moves sideways only when a source is shown (user 2026-10-27): check the frames where something is drawn (each plan window: start, middle, end), not every N seconds
  const faceFrames = (() => {
    try {
      const plan = JSON.parse(fs.readFileSync(path.join(".tmp", p, "plan.json"), "utf8")), fr = new Set();
      for (const it of plan) {
        const m = String(it.at ?? "").match(/(\d+(?:\.\d+)?)(?:\s*[-–]\s*(\d+(?:\.\d+)?))?/); if (!m) continue;
        const a = Number(m[1]), b = m[2] ? Number(m[2]) : a + 3;
        for (const s of [a + 0.6, (a + b) / 2, b - 0.2]) if (s > 0) fr.add(Math.round(s * 30));
      }
      return [...fr].sort((x, y) => x - y).slice(0, 80);
    } catch { return []; }
  })();
  // data-spec montage → the fast geometric check (face track + one gfx-only render, every 0.5 s); old TSX compositions keep face_check.mjs
  const specF = path.join("data", "specs", `${p}.json`);
  if (fs.existsSync(specF)) await step("face_fast", "node", ["tools/face_fast.mjs", comp, "--spec", specF, "--out", path.join(T, "ff")], /FAIL overlap|PASSED|FAILED/);
  else await step("face_check", "node", ["tools/face_check.mjs", comp, ...(faceFrames.length ? ["--frames", faceFrames.join(",")] : ["--step", "90"]), "--out", path.join(T, "fc")], /FAIL overlap|PASSED|FAILED|UNVERIFIED/);
  await step("frame_audit", "node", ["tools/frame_audit.mjs", comp, ...(opt("skip", "") ? ["--skip", opt("skip", "")] : [])], /plain share|PASSED|FAILED/);
  finish(failed ? 1 : 0);
}
