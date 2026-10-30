// رندر مقسّم قابل للاستئناف لأي تركيبة Remotion.
//   [--audio-file public/<name>_audio.wav  يتجاوز رندر الصوت البطيء]
//   node tools/render_chunked.mjs --id EU-Protests-Landscape --folder "عرضي/أساسية" --title "اسم الفيديو" [--chunk 3000] [--range 0-899] [--out full.mp4] [--keep]
// 1) تُقسَّم التركيبة إلى أجزاء بالإطارات، كل جزء يُرندَر (صامتاً) إلى render_work/chunked_<id>/part_NNNNNN.mp4 (ليس .tmp: تحذفه clean_temp).
// 2) الجزء الذي نجح (عدد إطاراته مطابق) لا يُعاد عند الاستئناف؛ الفاشل يُعاد حتى 3 مرات. أعد تشغيل الأمر نفسه ليكمل.
// 3) الصوت يُرندَر مرة واحدة (aac) ثم يُدمج مع الأجزاء بلا إعادة ترميز (concat + -c copy).
// 4) يُصدَّر مباشرة إلى C:\Users\mshms\Videos\جاهز\<folder>\<title>.mp4 (يُنقل تلقائياً إلى G:)، ثم فحص: عدد الإطارات والمدة.
// ترميز NVENC (ffmpegOverride) وconcurrency 3 ونافذة التقدّم كما في tools/eu_render.mjs. الصور في التركيبة: Pic لا Img.
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { nvencOverride } from "./nvenc.mjs";
import { startMonitor } from "./monitor.mjs";
import { sendNotification } from "./notify.mjs";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { acquireRenderLock } from "./render_lock.mjs";
import { cachedServeUrl } from "./lib/cached_bundle.mjs";

const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i < 0 ? d : process.argv[i + 1]; };
const id = arg("id"); if (!id) { console.error("--id <CompositionId> مطلوب"); process.exit(1); }
const READY = "C:/Users/mshms/Videos/جاهز";
const title = arg("title", id);
acquireRenderLock(title);
try { os.setPriority(0, os.constants.priority.PRIORITY_BELOW_NORMAL); } catch {}
const out = arg("out") ?? (arg("folder") ? path.join(READY, arg("folder"), `${title}.mp4`) : null);
if (!out) { console.error("حدّد --folder (تحت جاهز) أو --out"); process.exit(1); }
const chunk = Number(arg("chunk", 2000));
const keep = process.argv.includes("--keep");
const dir = path.resolve(`render_work/chunked_${id}`);
fs.mkdirSync(dir, { recursive: true });
const log = startMonitor(`render_work/progress_chunked_${id}.log`, title);

const probe = (f, entry) => execFileSync("ffprobe", ["-v", "error", "-select_streams", entry.startsWith("a") ? "a:0" : "v:0", "-show_entries", `stream=${entry.slice(2)}`, "-of", "default=nw=1:nk=1", f]).toString().trim();
const frames = (f) => Number(probe(f, "v:nb_frames")) || 0;
const secs = (f) => Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", f]).toString());

const T0 = Date.now();
const cached = process.env.RENDER_CACHED !== "0";   // default: the cached hard-link bundle (user 2026-10-29: the full public/ copy cost 15 min); RENDER_CACHED=0 forces the old full copy
const serveUrl = cached
  ? (await cachedServeUrl(id, { tag: "render" })).serveUrl
  : await bundle({ entryPoint: path.resolve("src/index.ts"), outDir: path.resolve(`render_work/chunked_bundle_${id}`), onProgress: () => {} });
let ok = false;
try {
  const comp = await selectComposition({ serveUrl, id, inputProps: JSON.parse(process.env.RENDER_PROPS ?? "{}"), port: Number(process.env.RENDER_PORT ?? 3458) });
  const total = comp.durationInFrames, fps = comp.fps;
  const [a, b] = arg("range") ? arg("range").split("-").map(Number) : [0, total - 1];
  const want = b - a + 1;
  log(`${id}: ${total} إطار @${fps}fps، المطلوب ${a}-${b} (${want}) بأجزاء ${chunk}`);

  const common = {
    composition: comp, serveUrl, inputProps: JSON.parse(process.env.RENDER_PROPS ?? "{}"), port: Number(process.env.RENDER_PORT ?? 3458), chromiumOptions: { gl: "angle" }, hardwareAcceleration: "if-possible",
    concurrency: 3, timeoutInMilliseconds: 180000,
  };
  const retry = async (label, fn) => {
    for (let n = 1; n <= 3; n++) {
      try { return await fn(); } catch (e) { log(`${label}: المحاولة ${n} فشلت: ${String(e).slice(0, 160)}`); if (n === 3) throw e; }
    }
  };

  const parts = [];
  const nParts = Math.ceil(want / chunk);
  for (let i = 0, s = a; s <= b; i++, s += chunk) {
    const e = Math.min(s + chunk - 1, b), need = e - s + 1;
    const f = path.join(dir, `part_${String(s).padStart(6, "0")}.mp4`);
    parts.push(f);
    if (fs.existsSync(f) && frames(f) === need) { log(`[جزء ${i + 1}/${nParts}] 100% — منتهٍ مسبقاً`); continue; }
    await retry(`جزء ${s}-${e}`, async () => {
      const t0 = Date.now(); let last = -1;
      fs.rmSync(f, { force: true });
      await renderMedia({
        ...common, codec: "h264", muted: true, frameRange: [s, e], outputLocation: f, ffmpegOverride: nvencOverride,
        onProgress: ({ progress }) => { const p = Math.floor(progress * 10) * 10; if (p !== last) { last = p; log(`[جزء ${i + 1}/${nParts}] ${p}%  ${((Date.now() - T0) / 60000).toFixed(1)} د`); } },
      });
      if (frames(f) !== need) throw new Error(`جزء ${s}-${e}: ${frames(f)} إطار بدل ${need}`);
      log(`جزء ${i + 1}/${nParts} تم في ${((Date.now() - t0) / 60000).toFixed(1)} د`);
    });
  }

  // الصوت: مرة واحدة لكامل المدى المطلوب
  const audio = path.join(dir, `audio_${a}-${b}.m4a`);
  const audioFile = arg("audio-file");   // قفزة السرعة (2026-10-21): الصوت النهائي جاهز كملف (مثل public/<name>_audio.wav) فنقصّه بـffmpeg في ثوانٍ بدل أن يُعيد Remotion تقييم التركيبة كلها لاستخراج الصوت (أكثر من ساعة بلا تقدّم ظاهر)
  if (audioFile && !(fs.existsSync(audio) && fs.statSync(audio).size > 1000)) {
    fs.rmSync(audio, { force: true });
    execFileSync("ffmpeg", ["-y", "-v", "error", "-i", path.resolve(audioFile), "-ss", String(a / fps), "-t", String(want / fps), "-c:a", "aac", "-b:a", "192k", audio]);
  }
  if (!(fs.existsSync(audio) && fs.statSync(audio).size > 1000)) {
    await retry("الصوت", async () => {
      fs.rmSync(audio, { force: true });
      await renderMedia({ ...common, codec: "aac", frameRange: [a, b], outputLocation: audio, onProgress: () => {} });
    });
  }
  log(`الصوت جاهز (${(fs.statSync(audio).size / 1e6).toFixed(1)} MB)`);

  // الدمج بلا إعادة ترميز
  const list = path.join(dir, "concat.txt");
  fs.writeFileSync(list, parts.map((p) => `file '${p.replace(/\\/g, "/")}'`).join("\n"));
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const tmpOut = path.join(dir, "merged.mp4");
  execFileSync("ffmpeg", ["-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", list, "-i", audio, "-map", "0:v:0", "-map", "1:a:0", "-c", "copy", "-movflags", "+faststart", ...(audioFile ? [] : ["-shortest"]), tmpOut]);   // مع --audio-file: لا -shortest (الـAAC أقصر من الفيديو بأجزاء من الثانية فكان يقصّ آخر إطارات));

  // الفحص: عدد الإطارات والمدة
  const gotF = frames(tmpOut), gotD = secs(tmpOut), wantD = want / fps;
  const vD = Number(probe(tmpOut, "v:duration")), aD = Number(probe(tmpOut, "a:duration"));
  log(`الفحص: إطارات ${gotF}/${want}، المدة ${gotD.toFixed(2)}s/${wantD.toFixed(2)}s (فيديو ${vD.toFixed(2)} صوت ${aD.toFixed(2)})`);
  if (gotF !== want || Math.abs(gotD - wantD) > 0.2) throw new Error("فشل الفحص: الإطارات/المدة لا تطابق التركيبة؛ الأجزاء محفوظة، أعد التشغيل بعد حذف الجزء المشبوه");
  fs.copyFileSync(tmpOut, out);
  const sizeMb = (fs.statSync(out).size / 1e6).toFixed(0);
  log(`DONE ${((Date.now() - T0) / 60000).toFixed(1)} د -> ${out} (${sizeMb} MB)`);
  sendNotification({
    title: "اكتمل المونتاج والرندرة بنجاح ✅",
    body: `${title}\nتم الانتهاء وحفظ الفيديو في مجلد جاهز:\n${out} (${sizeMb} MB)`,
    source: "مونتاج ورندر البثوث والدروس",
    link: out,
  });
  ok = true;
} finally {
  if (!cached) { try { fs.rmSync(serveUrl, { recursive: true, force: true }); } catch {} }
  if (ok && !keep) { try { fs.rmSync(dir, { recursive: true, force: true }); } catch {} } // عند الفشل تبقى الأجزاء للاستئناف
}
