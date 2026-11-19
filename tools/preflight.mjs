// BEFORE ANY WORK, NOT IN THE MIDDLE OF IT (user 2026-11-19: «ممنوع تخطئ ثم تفحص ثم تعدل»). On the mufti-hiraba montage the missing pieces showed up one
// by one mid-way: no face model (pictures unchecked), no .env (no image search key), 23 tools missing, linked folders that broke the GPU renderer, a
// typecheck that failed only at the final check. This checks all of it in one pass, first; nothing starts while one line is ✘.
//   node tools/preflight.mjs [--quick]      (--quick: skip the typecheck, ~20 s)      exit 1 on any ✘
// tools/stage.mjs prep runs it first (--quick).
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const QUICK = process.argv.includes("--quick");
const MAIN = "S:/AI_Tools/Remotion_Workspace";
const here = path.resolve(".").replace(/\\/g, "/");
let bad = 0;
const ok = (good, text, fix = "") => { console.log(`${good ? "✔" : "✘"} ${text}${!good && fix ? ` — ${fix}` : ""}`); if (!good) bad++; };
const run = (cmd, args, o = {}) => spawnSync(cmd, args, { encoding: "utf8", windowsHide: true, timeout: 180000, ...o });

// 1) the models, keys and shared folders the pipeline reads
ok(fs.existsSync(".tmp/models/yunet.onnx"), "نموذج الوجه (.tmp/models/yunet.onnx)", "اربط مجلد .tmp/models من الأساسية");
ok(fs.existsSync(".env"), "ملف المفاتيح (.env)", "اربطه من الأساسية (رابط صلب)");
for (const d of ["fonts", "scholar_images", "books", "people", "sfx", "broll", "flags", "kh"]) ok(fs.existsSync(path.join("public", d)), `مجلد العامة public/${d}`, "اربطه من الأساسية (وصلة مجلد)");

// 2) every tool the skills and rules name exists (rules_lint), and — on the backup tree — the main tree's uncommitted tools are here too
const rl = run(process.execPath, ["tools/rules_lint.mjs"]);
ok(rl.status === 0, "كل أداة تذكرها المهارات موجودة (rules_lint)", (rl.stdout + rl.stderr).trim().split("\n").slice(0, 3).join(" | "));
if (here.toLowerCase() !== MAIN.toLowerCase() && fs.existsSync(MAIN)) {
  const st = run("git", ["-C", MAIN, "status", "--short", "--untracked-files=all", "tools/"]);
  const miss = (st.stdout || "").split(/\r?\n/).filter((l) => l.startsWith("??")).map((l) => l.slice(3).trim()).filter((f) => !/__pycache__/.test(f) && !fs.existsSync(f));
  ok(!miss.length, "أدوات الأساسية غير المحفوظة موجودة هنا", `ناقص ${miss.length}: ${miss.slice(0, 4).join("، ")}${miss.length > 4 ? "…" : ""} (اربطها روابط صلبة)`);
}

// 3) the GPU path: the card answers, the decoder library imports, ffmpeg is there
const smi = run("nvidia-smi", ["--query-gpu=name,memory.used,memory.total", "--format=csv,noheader"]);
ok(smi.status === 0, `كرت الشاشة يجيب${smi.status === 0 ? ` (${smi.stdout.trim()})` : ""}`, "nvidia-smi لا يجيب");
// the same python and import order as tools/cut_build_gpu.py: the ComfyUI python (has torch), torch FIRST (it loads the CUDA libraries), then the decoder
const py = run(process.env.PY ?? "S:/AI_Tools/ComfyUI_windows_portable/python_embeded/python.exe", ["-I", "-c", "import sys, torch; sys.path.insert(0, r'S:/AI_Tools/PyNvVideoCodec_GpuRender/site'); import PyNvVideoCodec; print(torch.cuda.is_available())"]);
ok(py.status === 0 && /True/.test(py.stdout), "مكتبة فك الترميز على الكرت وتورش يرى الكرت", (py.stderr || py.stdout).trim().split("\n").pop());
ok(run("ffmpeg", ["-version"]).status === 0, "ffmpeg موجود");

// 4) a linked public folder must read as a folder for the copy routines (the GPU renderer once failed on them)
const linked = fs.readdirSync("public", { withFileTypes: true }).filter((e) => e.isSymbolicLink());
const broken = linked.filter((e) => { try { return !fs.statSync(path.join("public", e.name)).isDirectory() && !fs.statSync(path.join("public", e.name)).isFile(); } catch { return true; } });
ok(!broken.length, `الوصلات في public سليمة (${linked.length})`, `مكسورة: ${broken.map((e) => e.name).join("، ")}`);

// 5) the gallery notes are synced, and the code type-checks (what the final check would otherwise find last)
const eu = run(process.execPath, ["tools/element_usage.mjs", "check"]);
ok(eu.status === 0, "ملاحظات المعرض متزامنة", "node tools/element_usage.mjs sync");
if (!QUICK) { const tc = run(process.execPath, ["node_modules/typescript/bin/tsc", "-p", "."]); ok(tc.status === 0, "فحص الأنواع", (tc.stdout || "").trim().split("\n").slice(0, 2).join(" | ")); }

console.log(bad ? `PREFLIGHT FAILED (${bad}) — أصلح قبل أي عمل` : "PREFLIGHT PASSED");
process.exit(bad ? 1 : 0);
