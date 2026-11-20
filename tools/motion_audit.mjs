// فحص الحركة والصوت على ملف مرندر (من المستودعات الثلاثة، 2026-11-20؛ مهارة explainer-motion §30):
//   node tools/motion_audit.mjs <video.mp4> [--json out.json] [--still 0.6] [--max-still 1.0]
// يقيس: أول حركة، أطول مقطع ساكن، نسبة السكون، أزمنة القطع ووسيط طول اللقطة، وشدة الصوت (LUFS) ومداه والقمة الحقيقية.
// السكون = متوسط الفرق المطلق بين إطارين متتاليين (رمادي 90×160) أقل من --still. الفشل: أول حركة بعد 0.4 ث، أو سكون أطول من --max-still ث.
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";

const file = process.argv[2];
if (!file) { console.error("usage: node tools/motion_audit.mjs <video.mp4> [--json out.json] [--still 0.6] [--max-still 1.0]"); process.exit(2); }
const opt = (n, d) => (process.argv.includes("--" + n) ? process.argv[process.argv.indexOf("--" + n) + 1] : d);
const STILL = Number(opt("still", "0.6")), MAX_STILL = Number(opt("max-still", "1.0"));
const fps = (() => { const r = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=r_frame_rate", "-of", "csv=p=0", file], { encoding: "utf8" }).stdout.trim().split("/"); return Number(r[0]) / Number(r[1] || 1); })();
const W = 90, H = 160, N = W * H;

const diffs = await new Promise((res, rej) => {
  const p = spawn("ffmpeg", ["-v", "error", "-i", file, "-vf", `scale=${W}:${H},format=gray`, "-f", "rawvideo", "-"]);
  let buf = Buffer.alloc(0), prev = null; const out = [];
  p.stdout.on("data", (d) => {
    buf = Buffer.concat([buf, d]);
    while (buf.length >= N) {
      const fr = buf.subarray(0, N); buf = buf.subarray(N);
      if (prev) { let s = 0; for (let i = 0; i < N; i++) s += Math.abs(fr[i] - prev[i]); out.push(s / N); }
      prev = Buffer.from(fr);
    }
  });
  p.on("close", (c) => (c === 0 ? res(out) : rej(new Error("ffmpeg " + c))));
});

const t = (i) => +(i / fps).toFixed(2);
const firstMove = diffs.findIndex((d) => d >= STILL);
let run = 0, best = 0, bestEnd = 0, stillN = 0;
/* ثبات الختام مسموح حتى 2.7 ث (المستودعات: 1–2.7 ث)، فلا يُحسب سكونه */
const endHold = Math.round(2.7 * fps), lastCheck = diffs.length - endHold;
diffs.forEach((d, i) => { if (d < STILL) { stillN++; if (i < lastCheck) { run++; if (run > best) { best = run; bestEnd = i; } } } else run = 0; });
const longest = { s: t(bestEnd - best + 1), e: t(bestEnd + 1), len: +(best / fps).toFixed(2) };
/* كل فترات السكون فوق الحد (لا الأطول وحده) لتُصلح كلها في مرور واحد */
const stills = []; { let r = 0; diffs.forEach((d, i) => { if (d < STILL && i < lastCheck) r++; else { if (r / fps > MAX_STILL) stills.push({ s: t(i - r), e: t(i), len: +(r / fps).toFixed(2) }); r = 0; } }); if (r / fps > MAX_STILL) stills.push({ s: t(diffs.length - r), e: t(diffs.length), len: +(r / fps).toFixed(2) }); }
const med = [...diffs].sort((a, b) => a - b)[Math.floor(diffs.length / 2)] || 0;
const cuts = []; diffs.forEach((d, i) => { if (i > 0 && d > Math.max(14, 6 * med) && d > 1.8 * diffs[i - 1] && (!cuts.length || i - cuts[cuts.length - 1] > 3)) cuts.push(i); });
const shots = cuts.map((c, i) => (c - (i ? cuts[i - 1] : 0)) / fps).sort((a, b) => a - b);
const medShot = shots.length ? +shots[Math.floor(shots.length / 2)].toFixed(2) : null;

let loud = null;
const lr = spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-i", file, "-map", "0:a:0?", "-vn", "-af", "loudnorm=I=-14:LRA=8:TP=-1.5:print_format=json", "-f", "null", "-"], { encoding: "utf8" });
const m = (lr.stderr || "").match(/\{[\s\S]*?\}/g);
if (m) { try { const j = JSON.parse(m[m.length - 1]); loud = { I: +j.input_i, TP: +j.input_tp, LRA: +j.input_lra }; } catch { /* no audio */ } }

/* --peaks N: أكبر N لحظات تغيّر (متباعدة ٠٫٥ ث على الأقل) لدراسة الانتقالات إطاراً بإطار حولها */
const peaksN = Number(opt("peaks", "0"));
const peaks = [];
if (peaksN > 0) { const order = diffs.map((d, i) => [d, i]).sort((a, b) => b[0] - a[0]); for (const [d, i] of order) { if (peaks.length >= peaksN) break; if (peaks.every((p) => Math.abs(p - i) > fps * 0.5)) peaks.push(i); } peaks.sort((a, b) => a - b); }
const rep = { file, fps, peaks: peaks.map((i) => t(i)), frames: diffs.length + 1, firstMotion: firstMove < 0 ? null : t(firstMove + 1), longestStill: longest, stills, stillPct: +((100 * stillN) / Math.max(1, diffs.length)).toFixed(1), cuts: cuts.map((c) => t(c)), medianShot: medShot, loudness: loud };
const fails = [];
if (rep.firstMotion === null || rep.firstMotion > 0.4) fails.push(`أول حركة ${rep.firstMotion} ث (الحد 0.4)`);
if (longest.len > MAX_STILL) fails.push(`سكون ${longest.len} ث من ${longest.s} إلى ${longest.e} (الحد ${MAX_STILL})`);
if (loud && loud.TP > -1.0) fails.push(`القمة الحقيقية ${loud.TP} dBTP (الحد -1)`);
rep.fails = fails;
if (opt("json")) fs.writeFileSync(opt("json"), JSON.stringify(rep, null, 1));
console.log(`أول حركة: ${rep.firstMotion} ث | أطول سكون: ${longest.len} ث (${longest.s}–${longest.e}) | نسبة السكون: ${rep.stillPct}٪`);
console.log(`القطع: ${cuts.length} | وسيط اللقطة: ${medShot ?? "—"} ث | الصوت: ${loud ? `${loud.I} LUFS، القمة ${loud.TP} dBTP، المدى ${loud.LRA}` : "لا صوت"}`);
if (stills.length > 1) console.log(`كل فترات السكون فوق الحد: ${stills.map((x) => `${x.s}–${x.e}`).join("، ")}`);
if (peaks.length) console.log(`لحظات التغيّر الكبرى: ${rep.peaks.join("، ")}`);
console.log(fails.length ? "✘ " + fails.join("\n✘ ") : "✔ لا سكون فوق الحد، والحركة تبدأ في وقتها");
process.exit(fails.length ? 1 : 0);
