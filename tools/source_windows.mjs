// كشف مقاطع «عرض المصدر» في تسجيل الشيخ (نصف الشاشة: مصدر في جانب والشيخ في الآخر) دون أي تنبيه من المستخدم.
//   node tools/source_windows.mjs <video> [--out .tmp/<p>/sources.json] [--map public/<p>_map.json]
// الفكرة: الكاميرا والغرفة ثابتتان؛ صورة الغرفة الطبيعية = الوسيط لكل بكسل عبر الفيديو. أي لحظة يختلف فيها شريط
// أحد الجانبين عن الغرفة اختلافاً كبيراً = مصدر معروض، أياً كان نوعه (مقطع، صورة، صفحة).
// السرعة: (1) الإطارات المفتاحية فقط، فكّاً وتصغيراً على كرت NVIDIA إلى 96×54 (2) فك ثانيتين بـ10 إطارات/ث حول كل حدّ، 6 بالتوازي.
// الناتج: {windows:[{a,b,side,width,cut?:[a,b]}]} بالثواني في المصدر (و`cut` في زمن القص مع --map) + <out>_sheet.jpg للمراجعة.
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : argv[i + 1]; };
const video = argv[0];
if (!video || !fs.existsSync(video)) { console.error("usage: node tools/source_windows.mjs <video> [--out f.json] [--map public/<p>_map.json]"); process.exit(2); }
const out = opt("out", video.replace(/\.[^.]+$/, "_sources.json"));
const W = 96, H = 54, FS = W * H * 3;
const BAND = Math.round(W * 0.25); // عرض شريط الجانب المقارَن؛ الشيخ في الوسط لا يدخله
const MIN_T = 22;                  // أدنى فرق متوسط (0-255) يُعدّ مصدراً
const MIN_WIN = 1.0, GAP = 1.0;
const t0 = Date.now();

// إطارات صغيرة RGB مع أزمنتها (showinfo يكتب pts_time في stderr)
const HW = ["-hwaccel", "cuda", "-hwaccel_output_format", "cuda"];
const VF = (pre = "") => ["-vf", `${pre}scale_cuda=${W}:${H},hwdownload,format=nv12,showinfo,format=rgb24`];
const ffArgs = (inp, vf) => ["-hide_banner", "-v", "info", ...inp, ...vf, "-fps_mode", "passthrough", "-an", "-f", "rawvideo", "-"];
const parse = (stdout, stderr) => {
  const ts = [...String(stderr).matchAll(/pts_time:\s*([\d.]+)/g)].map((m) => +m[1]);
  const n = Math.min(ts.length, Math.floor(stdout.length / FS));
  return Array.from({ length: n }, (_, i) => ({ t: ts[i], px: stdout.subarray(i * FS, (i + 1) * FS) }));
};
const grabAsync = (inp, vf) => new Promise((res) => {
  const c = spawn("ffmpeg", ffArgs(inp, vf), { windowsHide: true }), o = [], e = [];
  c.stdout.on("data", (d) => o.push(d)); c.stderr.on("data", (d) => e.push(d));
  c.on("close", () => res(parse(Buffer.concat(o), Buffer.concat(e))));
});

// ---- 1) مرور سريع على الإطارات المفتاحية
const r0 = spawnSync("ffmpeg", ffArgs(["-skip_frame", "nokey", ...HW, "-i", video], VF()), { maxBuffer: 1 << 30, windowsHide: true });
const coarse = parse(r0.stdout, r0.stderr);
if (coarse.length < 5) { console.error("too few keyframes", String(r0.stderr).slice(-300)); process.exit(1); }

// صورة الغرفة: الوسيط لكل قيمة بكسل (أغلب الفيديو لقطة الشيخ العادية)
const ref = new Uint8Array(FS), col = new Uint8Array(coarse.length);
for (let k = 0; k < FS; k++) { for (let i = 0; i < coarse.length; i++) col[i] = coarse[i].px[k]; ref[k] = col.sort()[col.length >> 1]; }

// فرق العمود x من الإطار عن العمود rx من الغرفة (الصفوف 10%-90%)
const cd = (px, x, rx) => {
  let s = 0;
  for (let y = 5; y < H - 5; y++) { const o = (y * W + x) * 3, q = (y * W + rx) * 3; s += Math.abs(px[o] - ref[q]) + Math.abs(px[o + 1] - ref[q + 1]) + Math.abs(px[o + 2] - ref[q + 2]); }
  return s / ((H - 10) * 3);
};
const band = (px, a, b) => { let s = 0; for (let x = a; x < b; x++) s += cd(px, x, x); return s / (b - a); };
// الحالة: 1 = مصدر معروض (أحد شريطي الجانبين بعيد عن الغرفة)، 0 = لقطة عادية
const state = (px) => (Math.max(band(px, 0, BAND), band(px, W - BAND, W)) >= MIN_T ? 1 : 0);
// الجهة والعرض: أثناء العرض تنزاح الغرفة جانباً، فيُقارن كل عمود بأقرب عمود من الغرفة ضمن انزياح ±نصف الإطار؛
// الأعمدة التي لا تشبه أي عمود من الغرفة هي صندوق المصدر.
const layout = (px) => {
  const src = Array.from({ length: W }, (_, x) => {
    let m = 1e9;
    for (let rx = Math.max(0, x - W / 2); rx < Math.min(W, x + W / 2); rx++) m = Math.min(m, cd(px, x, rx));
    return m >= MIN_T;
  });
  const left = src.slice(0, W / 2).filter(Boolean).length, right = src.slice(W / 2).filter(Boolean).length;
  const side = left >= right ? "left" : "right";
  // العرض: من الحافة حتى أول 3 أعمدة متتالية تشبه الغرفة (حركة الشيخ في الوسط لا تُحسب من الصندوق)
  const seq = side === "left" ? src : [...src].reverse();
  let k = 0;
  while (k < W && (seq[k] || seq[k + 1] || seq[k + 2])) k++;
  return { side, width: +(k / W).toFixed(2) };
};
const st = coarse.map((f) => state(f.px));

// ---- 2) ضبط كل حدّ: فك المسافة بين إطارين مفتاحيين بـ10 إطارات/ث، 6 حدود بالتوازي
const edgeIdx = st.flatMap((v, i) => (i > 0 && v !== st[i - 1] ? [i - 1] : []));
const edgeAt = {};
for (let j = 0; j < edgeIdx.length; j += 6) {
  await Promise.all(edgeIdx.slice(j, j + 6).map(async (i) => {
    const ta = coarse[i].t, tb = coarse[i + 1].t;
    const fr = await grabAsync([...HW, "-ss", String(ta), "-t", String(tb - ta + 0.05), "-i", video], VF("fps=10,"));
    const hit = fr.find((f) => state(f.px) !== st[i]);
    edgeAt[i] = +(hit ? ta + hit.t : (ta + tb) / 2).toFixed(2);
  }));
}

const runs = [];
for (let i = 0; i < st.length; i++) {
  if (i === 0 || st[i] !== st[i - 1]) runs.push({ s: st[i], i0: i, a: i === 0 ? 0 : edgeAt[i - 1] });
  runs[runs.length - 1].i1 = i;
}
const end = coarse[coarse.length - 1].t + 2;
runs.forEach((r, k) => { r.b = k + 1 < runs.length ? runs[k + 1].a : end; });

// دمج الفجوات القصيرة وحذف النوافذ القصيرة، ثم الجهة والعرض من إطار منتصف كل نافذة
let wins = runs.filter((r) => r.s).map((r) => ({ a: r.a, b: r.b, i0: r.i0, i1: r.i1 }));
wins = wins.reduce((acc, w) => { const p = acc[acc.length - 1]; if (p && w.a - p.b < GAP) { p.b = w.b; p.i1 = w.i1; } else acc.push({ ...w }); return acc; }, [])
  .filter((w) => w.b - w.a >= MIN_WIN)
  .map(({ a, b, i0, i1 }) => ({ a, b, ...layout(coarse[(i0 + i1) >> 1].px) }));

// زمن القص (اختياري): الجزء المحفوظ من كل نافذة في الخط الزمني بعد القص
const mapF = opt("map", null);
if (mapF) {
  const segs = JSON.parse(fs.readFileSync(mapF, "utf8")).segments;
  for (const w of wins) {
    const parts = segs.filter((g) => g.b > w.a && g.a < w.b).map((g) => [g.n + Math.max(0, w.a - g.a), g.n + (Math.min(w.b, g.b) - g.a)]);
    w.cut = parts.length ? [+parts[0][0].toFixed(2), +parts[parts.length - 1][1].toFixed(2)] : null;
  }
}

// exact columns for the montage split cards (MontageSpec `splits`, source pixels): one full-resolution gray row band of the window's middle frame;
// the clip/room boundary = strongest vertical edge within ±40 px of the coarse width, the clip starts after its black padding
const SW = +String(spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", video], { encoding: "utf8" }).stdout).split(",")[0];
const SH = +String(spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", video], { encoding: "utf8" }).stdout).split(",")[1];
for (const w of wins) {
  const g = spawnSync("ffmpeg", ["-hide_banner", "-v", "error", "-ss", ((w.a + w.b) / 2).toFixed(2), "-i", video, "-frames:v", "1", "-vf", "format=gray", "-f", "rawvideo", "-"], { maxBuffer: 1 << 26, windowsHide: true }).stdout;
  if (!g || g.length < SW * SH) continue;
  const colMean = (x) => { let s = 0; for (let y = SH * 0.1 | 0; y < SH * 0.9; y += 2) s += g[y * SW + x]; return s / ((SH * 0.8) / 2); };
  const edge = (x) => { let s = 0; for (let y = SH * 0.1 | 0; y < SH * 0.9; y += 2) s += Math.abs(g[y * SW + x] - g[y * SW + x - 1]); return s; };
  const guess = Math.round(w.width * SW), fromLeft = w.side === "left";
  const est = fromLeft ? guess : SW - guess;
  let bx = est, best = -1;
  for (let x = Math.max(2, est - 40); x <= Math.min(SW - 2, est + 40); x++) { const e = edge(x); if (e > best) { best = e; bx = x; } }
  if (fromLeft) {
    let c0 = 0; while (c0 < bx && colMean(c0) < 20) c0++;          // black padding left of the clip
    w.clip = { x: c0, w: bx - c0 }; w.sheikh = { x: bx, w: SW - bx };
  } else {
    let c1 = SW - 1; while (c1 > bx && colMean(c1) < 20) c1--;
    w.clip = { x: bx, w: c1 + 1 - bx }; w.sheikh = { x: 0, w: bx };
  }
  if (w.cut) w.split = { from: w.cut[0], to: w.cut[1], clip: w.clip, sheikh: w.sheikh };   // paste into the spec's `splits` (add clipName)
}

fs.writeFileSync(out, JSON.stringify({ video, keyframes: coarse.length, threshold: MIN_T, windows: wins }, null, 1));

// لوحة مراجعة: إطار من منتصف كل نافذة
const sheet = out.replace(/\.json$/, "_sheet.jpg");
if (wins.length) {
  const ins = wins.flatMap((w) => ["-ss", ((w.a + w.b) / 2).toFixed(2), "-i", video]);
  const cols = Math.min(5, wins.length);
  const lab = wins.map((w, i) => `[${i}:v]scale=384:216,drawtext=fontfile='C\\:/Windows/Fonts/arial.ttf':text='${i + 1}  ${w.a.toFixed(1)}-${w.b.toFixed(1)}':x=8:y=8:fontsize=22:fontcolor=white:box=1:boxcolor=black@0.6[v${i}]`);
  const fc = wins.length === 1 ? lab[0].replace("[v0]", "[o]")
    : `${lab.join(";")};${wins.map((_, i) => `[v${i}]`).join("")}xstack=inputs=${wins.length}:layout=${wins.map((_, i) => `${(i % cols) * 384}_${Math.floor(i / cols) * 216}`).join("|")}:fill=black[o]`;
  spawnSync("ffmpeg", ["-hide_banner", "-v", "error", "-y", ...ins, "-filter_complex", fc, "-map", "[o]", "-frames:v", "1", sheet], { windowsHide: true });
}
console.log(`${wins.length} source window(s) in ${((Date.now() - t0) / 1000).toFixed(1)} s (${coarse.length} keyframes) → ${out}${wins.length ? `  sheet: ${sheet}` : ""}`);
for (const w of wins) console.log(`  ${w.side.padEnd(5)} ${w.a.toFixed(1)}–${w.b.toFixed(1)} s  width ${w.width}${w.cut ? `  cut ${w.cut[0]}–${w.cut[1]}` : w.cut === null ? "  (cut out)" : ""}`);
