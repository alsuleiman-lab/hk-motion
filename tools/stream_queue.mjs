// طابور الدروس والبثوث المستمر (أمر 2026-11-08): لا يتوقف حتى ينتهي كل شيء.
// ملاحظة (2026-11-11): للرندر الجديد استعمل tools/spec_normalize.mjs ثم tools/render_queue.mjs؛ هذا الملف يُبقي فحص+رندر في حلقة واحدة وقد يكرر فحصاً فاشلاً.
//   node tools/stream_queue.mjs data/stream_queue/<name>.json      (يُستأنف تلقائياً من الحالة المحفوظة جنب الملف)
// الملف: { "items":[{ "spec":"bath2_m_yaman1", "comp":"Bath2-M-Yaman1-R", "orient":"R|L", "ori":"port|land", "dest":"C:/…/جاهز/بثوث/طولي" }] }
// لكل عنصر: فحص+إصلاح (.tmp/b2_m_loop.sh) ← رندر (.tmp/b2_render.sh إلى render_work/export) ← نقل لـ dest ← حالة "done".
// يفشل عنصر ← يُسجَّل السبب ويكمل الباقي، ثم جولة ثانية للفاشلين؛ وفي النهاية تقرير: ما اكتمل وما تعثّر ولماذا.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const file = process.argv[2];
if (!file) { console.error("usage: node tools/stream_queue.mjs <queue.json>"); process.exit(2); }
const stateFile = file.replace(/\.json$/, ".state.json");
const q = JSON.parse(fs.readFileSync(file, "utf8"));
const st = fs.existsSync(stateFile) ? JSON.parse(fs.readFileSync(stateFile, "utf8")) : {};
const save = () => fs.writeFileSync(stateFile, JSON.stringify(st, null, 1));
const sh = (cmd) => spawnSync("bash", ["-c", cmd], { encoding: "utf8", maxBuffer: 1 << 26 });
const now = (it, stage, n) => fs.writeFileSync("render_work/queue_now.json", JSON.stringify({ item: it?.spec, title: it ? title(it.spec) : "", stage, n, t: Date.now(), end: !it }));
const log = (m) => console.log(`[${new Date().toLocaleTimeString("en-GB")}] ${m}`);

const minutes = (p) => { const r = sh(`ffprobe -v error -show_entries format=duration -of csv=p=0 public/${p}_cut.mp4`); return (+r.stdout / 60).toFixed(1); };
const title = (p) => JSON.parse(fs.readFileSync(`data/specs/${p}.json`, "utf8")).title;

const stage = (it) => {
  const s = (st[it.spec] ??= { step: "pending", tries: 0 });
  if (s.step === "done") return;
  s.tries++;
  if (s.step === "pending") {
    now(it, "فحص وإصلاح", `${q.items.findIndex((x) => x === it) + 1}/${q.items.length}`);
    const r = sh(`bash .tmp/b2_m_loop.sh ${it.spec} ${it.comp} ${minutes(it.spec)} ${it.ori}`);
    if (!/CHECK OK/.test(r.stdout)) { s.err = `check: ${r.stdout.trim().slice(-200)}`; save(); return; }
    s.step = "checked"; save();
  }
  if (s.step === "checked") {
    now(it, "رندر (أو انتظار القفل)", `${q.items.findIndex((x) => x === it) + 1}/${q.items.length}`);
    let r;
    for (let k = 0; k < 90; k++) { // قفل الرندر مشغول (جلسة أخرى): انتظر وأعد حتى ساعتين
      r = sh(`bash .tmp/b2_render.sh ${it.spec} ${it.comp} ${it.orient} ${JSON.stringify(title(it.spec))}`);
      const lg = fs.existsSync(`.tmp/b2_render_${it.spec}.log`) ? fs.readFileSync(`.tmp/b2_render_${it.spec}.log`, "utf8") : "";
      const pg = fs.existsSync(`.tmp/b2_probe_${it.spec}.log`) ? fs.readFileSync(`.tmp/b2_probe_${it.spec}.log`, "utf8") : "";
      if (/RENDER exit 0/.test(r.stdout) || !(/ممنوع رندر مقطعين/.test(lg) || (/PROBE FAIL/.test(r.stdout) && /ممنوع رندر مقطعين/.test(pg)))) break;
      spawnSync("powershell", ["-NoProfile", "-Command", "Start-Sleep 80"]);
    }
    const m = r.stdout.match(/RENDER exit 0 -> (.+)$/m);
    if (!m) { s.err = `render: ${r.stdout.trim().slice(-200)}`; save(); return; }
    s.file = path.join("render_work/export", m[1].trim()); s.step = "rendered"; save();
  }
  if (s.step === "rendered") {
    fs.mkdirSync(it.dest, { recursive: true });
    const to = path.join(it.dest, path.basename(s.file));
    fs.copyFileSync(s.file, to);
    if (fs.statSync(to).size !== fs.statSync(s.file).size) { s.err = "copy size mismatch"; save(); return; }
    s.to = to; s.step = "done"; delete s.err; save();
  }
};

for (let round = 1; round <= 3; round++) {
  const left = q.items.filter((it) => st[it.spec]?.step !== "done");
  if (!left.length) break;
  log(`جولة ${round}: ${left.length} عنصر`);
  for (const it of left) { log(`← ${it.spec}`); stage(it); log(`${it.spec}: ${st[it.spec].step}${st[it.spec].err ? " ✘ " + st[it.spec].err : ""}`); }
}
const ok = q.items.filter((it) => st[it.spec]?.step === "done"), bad = q.items.filter((it) => st[it.spec]?.step !== "done");
log(`تقرير: اكتمل ${ok.length}/${q.items.length}`);
for (const it of bad) log(`تعثّر ${it.spec}: ${st[it.spec]?.err ?? "لم يبدأ"}`);
now(null, "", "");
console.log("QUEUE_DONE");
