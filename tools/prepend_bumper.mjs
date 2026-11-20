// فاصل الافتتاح (أمر المستخدم الصارم 2026-11-11): قبل أول كلمة في كل فيديو يوضع فاصل ورقي 5ث عشوائي من public/fawasel.
//   node tools/prepend_bumper.mjs <video.mp4> [--name <المشروع>] [--id <معرّف فاصل>] [--force]
// يُستدعى آلياً من tools/hybrid_any.mjs و tools/hybrid_parallel.mjs بعد الرندر الكامل (وليس للأجزاء ولا للفواصل نفسها)؛ idempotent.
// للفيديو الطولي (الريلز والطولي الكامل) تُستعمل النسخة الطولية 1080×1920 من الفاصل نفسه (fileP). الأصل (قبل الفاصل) يُنقل إلى .tmp/bumper_orig.
// يكتب .tmp/gates/<name>.bumper.json (ليعرف final_review أن أول 5ث فاصل: لا فحص سكتات فيها، والحجم الأصلي لبوابة الارتجاف).
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import crypto from "node:crypto";
import os from "node:os";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const file = process.argv[2];
const arg = (n, d) => (process.argv.includes("--" + n) ? process.argv[process.argv.indexOf("--" + n) + 1] : d);
if (!file || !fs.existsSync(file)) { console.error("usage: node tools/prepend_bumper.mjs <video.mp4> [--name <project>] [--id <bumper id>] [--force]"); process.exit(2); }
const name = arg("name", path.basename(file, path.extname(file)));
const AT = Number(arg("at", 0));   // --at <ث>: الفاصل يُدرَج عند هذه اللحظة من الفيديو (بعد إطارات الغلاف أو قبل «بسم الله/السلام عليكم» حين تسبقها مقدمة)، لا في أوله
const dir = path.join(root, "public", "fawasel"), mf = path.join(dir, "manifest.json");
const gate = path.join(root, ".tmp", "gates", `${name}.bumper.json`);
const probe = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-show_entries", "stream=codec_type,width,height,r_frame_rate", "-of", "json", file]).toString());
const v = probe.streams.find((s) => s.codec_type === "video"), hasA = probe.streams.some((s) => s.codec_type === "audio");
const size = fs.statSync(file).size;
const originalId = (() => { try { const c = crypto.createHash("sha256"); c.update(fs.readFileSync(file)); return c.digest("hex"); } catch { return null; } })();   // content id before the bumper (per-file gates)
if (!v || !hasA) { console.error("[bumper] الملف بلا فيديو أو صوت: تُرك كما هو"); process.exit(0); }
/** الريلز والتعليق الصامت (الطولي القصير): الفاصل في آخر المقطع لا في أوله (أمر 2026-11-15، يخرب الهوك)؛ الطولي الكامل (نسخة حلقة كاملة) والعرضي في أولهما */
const isShortPortrait = () => { try { if (JSON.parse(fs.readFileSync(path.join(root, "data", "specs", `${name}.json`), "utf8")).kind === "reel") return true; } catch { /* no spec */ } return fs.existsSync(path.join(root, "public", "silent", name, "config.json")); };
const END = process.argv.includes("--end") || process.env.BUMPER_POSITION === "end" || (AT <= 0 && !process.argv.includes("--start")) || (v.height > v.width && !process.argv.includes("--start") && isShortPortrait());   // البثوث والدروس (أمر 2026-11-11): الفاصل خاتمةً في آخر الفيديو لا قبل بسم الله
const mainDur = Number(JSON.parse(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "json", file]).toString()).format.duration);
const portrait = v.height > v.width;   // الفواصل لها نسختان: عرضية (file) وطولية 1080×1920 (fileP)
try { const g = JSON.parse(fs.readFileSync(gate, "utf8")); if (g.size === size && !process.argv.includes("--force")) { console.log("[bumper] مُضاف مسبقاً: تُرك كما هو"); process.exit(0); } } catch { /* none */ }

const data = JSON.parse(fs.readFileSync(mf, "utf8"));
const fileOf = (x) => (portrait ? x.fileP : x.file), isOk = (x) => (portrait ? x.renderedP : x.rendered) && fileOf(x) && fs.existsSync(path.join(dir, fileOf(x)));
const ok = data.bumpers.filter(isOk);
if (!ok.length) { console.error("[bumper] لا فاصل مرندَر في public/fawasel"); process.exit(1); }
let pick = arg("id", "") ? ok.find((x) => x.id === arg("id", "")) : null;
if (!pick) { const pool = ok.length > 1 ? ok.filter((x) => x.id !== data.last) : ok; pick = pool[Math.floor(Math.random() * pool.length)]; }
const bumper = path.join(dir, fileOf(pick)), SEC = pick.seconds ?? 5;
/* (2026-11-18, «مذيع يقتل أطفاله» reel published at 3:01.6 as a normal video) a short portrait video + its bumper must fit the Shorts limit: refuse before gluing */
if (END && portrait && isShortPortrait()) { const { SHORT_MAX } = await import("./short_limit.mjs"); if (mainDur + SEC > SHORT_MAX) { console.error(`[bumper] ✘ ${path.basename(file)} طوله ${mainDur.toFixed(2)}ث ومعه الفاصل ${SEC}ث = ${(mainDur + SEC).toFixed(2)}ث فوق حد القصير ${SHORT_MAX}ث: قصّر الريل ${(mainDur + SEC - SHORT_MAX).toFixed(1)}ث على الأقل ثم أعد الرندر`); process.exit(1); } }
const [fn, fd] = v.r_frame_rate.split("/").map(Number), FPS = +(fn / fd).toFixed(3);
const tmp = file.replace(/\.mp4$/i, "") + ".bumper_tmp.mp4";
try { os.setPriority(0, os.constants.priority.PRIORITY_BELOW_NORMAL); } catch { /* ignore */ }
const bPrep = [
  `[0:v]trim=0:${SEC},setpts=PTS-STARTPTS,scale=${v.width}:${v.height}:flags=lanczos,fps=${FPS},format=yuv420p,setsar=1[bv]`,
  `[0:a]aresample=48000,aformat=channel_layouts=stereo,alimiter=limit=0.708:level=disabled,apad=whole_dur=${SEC},atrim=0:${SEC},asetpts=PTS-STARTPTS[ba]`,
];
const fc = (AT > 0 && !END ? [
  ...bPrep,
  `[1:v]fps=${FPS},format=yuv420p,setsar=1,split[m1][m2]`,
  `[1:a]aresample=48000,aformat=channel_layouts=stereo,asplit[a1][a2]`,
  `[m1]trim=0:${AT},setpts=PTS-STARTPTS[pv]`, `[a1]atrim=0:${AT},asetpts=PTS-STARTPTS[pa]`,
  `[m2]trim=start=${AT},setpts=PTS-STARTPTS[qv]`, `[a2]atrim=start=${AT},asetpts=PTS-STARTPTS[qa]`,
  `[pv][pa][bv][ba][qv][qa]concat=n=3:v=1:a=1[v][a]`,
] : [
  ...bPrep,
  `[1:v]fps=${FPS},format=yuv420p,setsar=1[mv]`,
  `[1:a]aresample=48000,aformat=channel_layouts=stereo[ma]`,
  END ? `[mv][ma][bv][ba]concat=n=2:v=1:a=1[v][a]` : `[bv][ba][mv][ma]concat=n=2:v=1:a=1[v][a]`,
]).join(";");
const r = spawnSync("ffmpeg", ["-v", "error", "-y", "-threads", "4", "-i", bumper, "-i", file, "-filter_complex", fc, "-map", "[v]", "-map", "[a]",
  "-c:v", "h264_nvenc", "-preset", "p7", "-rc", "vbr", "-cq", "15", "-b:v", "0", "-maxrate", "26M", "-bufsize", "52M", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", tmp], { stdio: "inherit" });
if (r.status !== 0 || !fs.existsSync(tmp)) { try { fs.rmSync(tmp, { force: true }); } catch { /* ignore */ } console.error("[bumper] فشل الدمج: الملف الأصلي كما هو"); process.exit(1); }
/* (user 2026-11-20: «كل حلقة لازم تكون بياناتها المؤقتة في مكان واحد») the bumper-free original goes to the project's folder .tmp/<root>/bumper_orig/ */
const keep = (await import("./lib/projdir.mjs")).projTmp(name, "bumper_orig");
/** نقل ملف عبر قرصين مختلفين (C ↔ S): rename يفشل بـEXDEV فنُسخ ثم نحذف الأصل */
const moveFile = (from, to) => { try { fs.renameSync(from, to); } catch (e) { if (e.code !== "EXDEV") throw e; fs.copyFileSync(from, to); fs.rmSync(from, { force: true }); } };
moveFile(file, path.join(keep, path.basename(file)));
moveFile(tmp, file);
data.last = pick.id; fs.writeFileSync(mf, JSON.stringify(data, null, 2) + "\n");
fs.mkdirSync(path.dirname(gate), { recursive: true });
fs.writeFileSync(gate, JSON.stringify({ id: pick.id, title: pick.title, seconds: SEC, originalSize: size, originalId, orig: path.relative(root, path.join(keep, path.basename(file))).replace(/\\/g, "/"), size: fs.statSync(file).size, at: END ? +mainDur.toFixed(3) : AT, position: END ? "end" : "start", date: new Date().toISOString() }));
console.log(`[bumper] أُضيف فاصل «${pick.title}» (${SEC}ث) ${END ? "في آخر" : AT > 0 ? `عند ${AT}ث من` : "في أول"} ${path.basename(file)}`);
