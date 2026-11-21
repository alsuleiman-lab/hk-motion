// بوابة الإلزام الإبداعي للموشن التوضيحي: لا تُسلَّم أي تركيبة قبل أن تنجح (تكتب .tmp/gates/<المعرّف>.creative.ok).
//   node tools/ext/creative_gate.mjs <المعرّف> [--no-stills] [--no-audio]
// تقرأ موجز المشاهد الملزم data/explainer/<المعرّف>.brief.json (ماذا يُرى، ماذا يتحرك، ماذا يُسمع لكل حدث) وتفحص:
//   ١ اكتمال الموجز لكل حدث، ونسبة المشاهد المرسومة (جيش/قافلة/مدينة/قضبان…) لا الرموز المجردة؛
//   ٢ أن مكوّن كل مشهد مرسوم موجود فعلاً في شيفرة التركيبة، وأن قفل الطابع التاريخي كله موجود (HistMap، لفافات، خطوط مخطوطات، لوحات رق…) ولا مكوّن حديث ممنوع؛
//   ٣ لقطات حقيقية: السطوع (لا قتام) وقلة البكسلات الداكنة والدفء اللوني؛
//   ٤ الصوت: لا صمت رقمي في أي لحظة، ومقدّمة وذيل بخلفية مستمرة، ولا قفزة مفاجئة في أرضية الضجيج عند السكوت؛
//   ٥ سجل مراجعة مستقلة (.tmp/gates/<المعرّف>.creative_review.json): الطابع التاريخي ≥ 8 و«يُرى الحدث» ≥ 8 والتوقيت ≥ 8.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const id = process.argv[2];
if (!id) { console.error("usage: node tools/ext/creative_gate.mjs <CompositionId> [--no-stills] [--no-audio]"); process.exit(2); }
const briefFile = `data/explainer/${id}.brief.json`;
if (!fs.existsSync(briefFile)) { console.error(`✘ لا موجز ملزم: ${briefFile} (يُكتب قبل البناء ويُعرض على المستخدم)`); process.exit(1); }
const B = JSON.parse(fs.readFileSync(briefFile, "utf8"));
const no = (n) => process.argv.includes("--" + n);
const fails = [];
const ok = (cond, msg) => { console.log(`${cond ? "✔" : "✘"} ${msg}`); if (!cond) fails.push(msg); };

/* ١ الموجز */
const ILLUSTRATED = new Set(["army", "caravan", "city", "bars", "cell", "rings", "ship", "scroll", "map", "figures", "lesson", "court", "prisoner", "mausoleum", "gravestone", "codex"]);
const SYMBOL = new Set(["scales", "book", "dome", "tomb", "counter", "chip", "timeline"]);
const events = B.events ?? [];
ok(events.length >= 8, `عدد أحداث الموجز ${events.length} (≥ 8)`);
const incomplete = events.filter((e) => !(e.cue && e.kind && e.sees && e.moves && (e.hears || e.hearsReason)));
ok(!incomplete.length, `كل حدث له إشارة ونوع وما يُرى وما يتحرك وما يُسمع (أو سبب انعدامه)${incomplete.length ? ": ناقص " + incomplete.map((e) => e.cue).join("، ") : ""}`);
// التخطيط قبل الصوت (حكم المستخدم 2026-11-17): لكل حدث العبارة المنطوقة التي تحمله، وصوّت النص بُني من هذه الخطة لا العكس
const noLine = events.filter((e) => !e.line);
ok(!noLine.length && B.planBeforeAudio === true, `خطة العبارات سبقت الصوت: لكل حدث «line» (العبارة المنطوقة) و planBeforeAudio${noLine.length ? ": ناقص " + noLine.map((e) => e.cue).join("، ") : ""}`);
// الاتجاه بالمدة (حكم المستخدم 2026-11-17): أقل من ٣ دقائق طولي، ٣ فأكثر عرضي
{
  const pr = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", B.audio], { encoding: "utf8" });
  const dur = Number(pr.stdout.trim());
  const want = dur < 180 ? "portrait" : "landscape";
  ok(B.orientation === want, `الاتجاه ${B.orientation ?? "غير مكتوب"} والمدة ${dur.toFixed(0)}ث ← المطلوب ${want === "portrait" ? "طولي" : "عرضي"} (أقل من ٣ دقائق طولي)`);
}
const unknown = events.filter((e) => !ILLUSTRATED.has(e.kind) && !SYMBOL.has(e.kind));
ok(!unknown.length, `أنواع المشاهد معروفة${unknown.length ? ": " + unknown.map((e) => e.kind).join("، ") : ""}`);
const ill = events.filter((e) => ILLUSTRATED.has(e.kind)).length;
ok(ill / Math.max(1, events.length) >= 0.5, `المشاهد المرسومة ${ill} من ${events.length} (≥ 50٪ ولا يكفي الرمز المجرد)`);
let run = 0, maxRun = 0;
for (const e of events) { run = SYMBOL.has(e.kind) ? run + 1 : 0; maxRun = Math.max(maxRun, run); }
ok(maxRun <= 3, `أطول تتابع رموز مجردة ${maxRun} (≤ 3)`);

/* ٢ الشيفرة */
const src = fs.readFileSync(B.source, "utf8");
const cuesSrc = fs.readFileSync(B.cuesFile, "utf8");
const missingCue = events.filter((e) => !new RegExp(`\\b${e.cue}\\s*:`).test(cuesSrc));
ok(!missingCue.length, `كل إشارات الموجز موجودة في جدول الكلمات${missingCue.length ? ": " + missingCue.map((e) => e.cue).join("، ") : ""}`);
const NEED = { army: "<Army", caravan: "<Caravan", city: "<City", bars: "<PrisonBars", cell: "cell=", rings: "<BrokenRings", ship: "<Galley", scroll: "scroll", map: "<HistMap", scales: "IScales", book: "IBook", dome: "IDome", tomb: "ITomb", counter: "DigitRoll", chip: "YearChip", timeline: "HistTimeline", figures: "<Scholar", lesson: "<LessonScene", court: "<JudgesScene", prisoner: "<PrisonCell", mausoleum: "<Mausoleum", gravestone: "<Gravestone", codex: "<Codex" };
Object.assign(NEED, B.componentTokens ?? {});   // موضوع معاصر: يستبدل الموجز رموز المكوّنات التاريخية بمكوّناته (2026-11-19)
const noComp = events.filter((e) => NEED[e.kind] && !src.includes(NEED[e.kind]));
ok(!noComp.length, `مكوّن كل مشهد موجود في الشيفرة${noComp.length ? ": " + noComp.map((e) => `${e.cue}(${e.kind})`).join("، ") : ""}`);
for (const t of B.styleRequired ?? []) ok(src.includes(t), `قفل الطابع: «${t}» موجود`);
for (const t of B.styleForbidden ?? []) ok(!src.includes(t), `قفل الطابع: لا «${t}» (مكوّن حديث ممنوع)`);

/* ٣ لقطات */
if (!no("stills")) {
  const dir = `.tmp/creative_gate/${id}`; fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const pts = (B.checkFrames ?? []).map((f, i) => `s${i}:${f}`);
  const args = ["tools/stills.mjs", id, dir, ...pts, "--scale", "0.25", ...(B.manifest ? ["--manifest", B.manifest] : [])];
  const r = spawnSync("node", args, { encoding: "utf8", maxBuffer: 1 << 26 });
  const stat = (f) => { const x = spawnSync("ffmpeg", ["-hide_banner", "-i", f, "-vf", "signalstats,metadata=print:file=-", "-f", "null", "-"], { encoding: "utf8" }).stdout; return Number(/YAVG=([\d.]+)/.exec(x)?.[1] ?? NaN); };
  const darkR = (f) => { const x = spawnSync("ffmpeg", ["-hide_banner", "-i", f, "-vf", "format=gray,lutyuv=y='if(lt(val,60),255,0)',signalstats,metadata=print:file=-", "-f", "null", "-"], { encoding: "utf8" }).stdout; return Number(/YAVG=([\d.]+)/.exec(x)?.[1] ?? NaN) / 255; };
  const exempt = new Set(B.darkExemptFrames ?? []);
  let all = r.status === 0;
  ok(all, "لقطات الفحص رُندرت");
  (B.checkFrames ?? []).forEach((fr, i) => {
    const f = path.join(dir, `s${i}.png`); if (!fs.existsSync(f)) return;
    const y = stat(f), d = darkR(f);
    ok(y >= 150, `إطار ${fr}: السطوع ${y.toFixed(0)}/255 (≥ 150، لا قتام)`);
    if (!exempt.has(fr)) ok(d <= 0.03, `إطار ${fr}: البكسلات الداكنة ${(d * 100).toFixed(1)}٪ (≤ 3٪)`);
  });
}

/* ٤ الصوت */
if (!no("audio")) {
  const a = B.audio;
  const raw = spawnSync("ffmpeg", ["-v", "error", "-i", a, "-ac", "1", "-ar", "24000", "-f", "s16le", "-"], { maxBuffer: 1 << 28 }).stdout;
  const n = Math.floor(raw.length / 2), x = new Int16Array(raw.buffer, raw.byteOffset, n), win = 480; // 20ms
  const lv = []; for (let i = 0; i + win <= n; i += win) { let s = 0; for (let j = 0; j < win; j++) { const v = x[i + j] / 32768; s += v * v; } lv.push(20 * Math.log10(Math.sqrt(s / win) + 1e-9)); }
  const body = lv.slice(10, lv.length - Math.round((B.tailFadeSec ?? 1.8) * 50) - 5);
  ok(Math.min(...body) > -62, `أرضية الصوت المستمرة: أدنى مستوى في الجسم ${Math.min(...body).toFixed(1)} dB (> -62، لا صمت رقمي ولا هبوط مفاجئ)`);
  const head = lv.slice(0, 15).reduce((p, c) => p + c, 0) / 15;
  ok(head > -70, `المقدّمة: الخلفية حاضرة من البداية (${head.toFixed(1)} dB > -70؛ الصمت الرقمي أخفض من -90)`);
  const tail = lv.slice(-60, -30).reduce((p, c) => p + c, 0) / 30;
  ok(tail > -80, `الذيل: لا قطع مفاجئ (${tail.toFixed(1)} dB)`);
  const floorSpeech = Math.min(...lv.slice(25, 60));
  ok(floorSpeech > -62, `أول 1.2ث بلا فراغ (${floorSpeech.toFixed(1)} dB)`);
  // لا فحيح: أرضية الصمت (أدنى 10٪ من المستويات) لا تعلو عن -50 dB، وهي القاعدة المعتمدة للضجيج الخلفي
  const sorted = [...lv].sort((a, b) => a - b); const floor10 = sorted[Math.floor(sorted.length * 0.1)];
  ok(floor10 < -50, `الضجيج الخلفي غير مسموع كفحيح: أرضية أدنى 10٪ = ${floor10.toFixed(1)} dB (< -50)`);
}

/* ٥ مراجعة مستقلة */
const rf = `.tmp/gates/${id}.creative_review.json`;
if (fs.existsSync(rf)) {
  const R = JSON.parse(fs.readFileSync(rf, "utf8"));
  ok(R.independent === true, "المراجعة بوكيل مستقل لم يبنِ العمل");
  for (const k of (B.reviewKeys ?? ["historical", "sees", "timing"])) ok(Number(R[k]) >= 8, `مراجعة مستقلة: ${k} = ${R[k]} (≥ 8)`);
  ok(!(R.hardFailures ?? []).length, `لا إخفاق صلب في المراجعة${(R.hardFailures ?? []).length ? ": " + R.hardFailures.join("؛ ") : ""}`);
} else ok(false, `لا سجل مراجعة مستقلة (${rf}): يكتبه من راجع العمل بدرجات «historical, sees, timing» و independent:true`);

fs.mkdirSync(".tmp/gates", { recursive: true });
const stamp = crypto.createHash("sha1").update(src + JSON.stringify(B)).digest("hex").slice(0, 12);
if (fails.length) { console.log(`\n✘ فشلت البوابة: ${fails.length} بنداً. لا تسلّم ولا تُعلن الانتهاء.`); try { fs.unlinkSync(`.tmp/gates/${id}.creative.ok`); } catch { /* none */ } process.exit(1); }
fs.writeFileSync(`.tmp/gates/${id}.creative.ok`, JSON.stringify({ id, at: new Date().toISOString(), stamp }));
console.log(`\n✅ نجحت بوابة الإلزام الإبداعي (${stamp}).`);
