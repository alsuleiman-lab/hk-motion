// EVERY FILE OF A PROJECT, ONE COMMAND (user 2026-11-19: «كل الملفات المؤقتة تبع كل مشروع تكون في مكان خاص، مشان لما يحذفها مرة واحدة وما يخربط…
// كل شيء مؤقت يتعلق فيه تحطه في نفس هذا المكان عشان ما تتراكم عندنا بيانات تنسى تحذفها»).
// The project = the SOURCE VIDEO (tools/lib/projdir.mjs rootOf): its compositions, reels and clips are one project.
// Its temporary place is .tmp/<root>/ — new runs write there (stills bundle, GPU work, render logs, face tracking, run temp folders). What older runs and
// Remotion's media rules put elsewhere is found here too, so nothing is forgotten:
//   media      public/<m>_* (source copy, cut, light copy, cut list, audio) and public/<m>/ (its pictures)          ← Remotion serves only public/
//   gates      .tmp/gates/<m>.*  (the proofs the shared safety hook reads there)
//   legacy     .tmp/stills_bundle/<Comp>, .tmp/gpu_render/work/<Comp>, .tmp/render_logs/*<Comp>*, .tmp/facetrack/<m>_*, .tmp/hybrid_any/public_slim/<m>*,
//              render_work/**/<m>* and <Comp>*, .tmp/<m>*.out|log
// NOT temporary, never touched here: data/specs (the montage itself), data/publish_queue (the publishing package), src/ (code) — approval handles those
// (tools/approve_purge.mjs), and the exported video in «جاهز».
//   node tools/project.mjs root <name>              the project a name belongs to
//   node tools/project.mjs ls [<root>]              no root: every project with its size; with root: every path, grouped, with sizes
//   node tools/project.mjs clean <root> [--yes] [--keep-media] [--force]
//        dry by default (lists what would go). --yes deletes. --keep-media keeps public/ (only the temporary work goes). Refuses while a job of the
//        project is registered (tools/proc.mjs) or a stage lock is held, or a file was written in the last 3 minutes, unless --force.
//   node tools/project.mjs orphans [--yes]          run_* folders of dead processes and files of projects that no longer have a spec
import fs from "node:fs";
import path from "node:path";
import { ROOT, rootOf } from "./lib/projdir.mjs";

process.chdir(ROOT);
const [cmd, arg, ...rest] = process.argv.slice(2);
const YES = process.argv.includes("--yes"), FORCE = process.argv.includes("--force"), KEEP_MEDIA = process.argv.includes("--keep-media");
const ls = (d) => { try { return fs.readdirSync(d); } catch { return []; } };
// a hard-linked file (the cut and its «_cut.mp4» twin, the bundle copies) is counted ONCE: the size shown is the space the deletion frees
// (when its last link goes — a link kept elsewhere, e.g. in the main tree, keeps the bytes; the listing says which)
const seen = new Set();
const sizeOf = (p) => { let s = 0; try { const st = fs.lstatSync(p, { bigint: true }); if (st.isSymbolicLink()) return 0; if (!st.isDirectory()) { const k = `${st.dev}:${st.ino}`; if (seen.has(k)) return 0; seen.add(k); return Number(st.size); } for (const f of fs.readdirSync(p)) s += sizeOf(path.join(p, f)); } catch { /* gone */ } return s; };
const newest = (p) => { let m = 0; try { const st = fs.lstatSync(p); m = st.mtimeMs; if (st.isDirectory() && !st.isSymbolicLink()) for (const f of fs.readdirSync(p)) m = Math.max(m, newest(path.join(p, f))); } catch { /* gone */ } return m; };
const mb = (b) => (b >= 1073741824 ? `${(b / 1073741824).toFixed(2)} GB` : `${Math.round(b / 1048576)} MB`);

/** every name of the project: its own ids (specs, work folders, media prefixes) whose root is `root`, and their composition ids */
const membersOf = (root) => {
  const ids = new Set([root]);
  for (const f of ls("data/specs")) if (f.endsWith(".json") && rootOf(f.slice(0, -5)) === root) ids.add(f.slice(0, -5));
  for (const d of ls(".tmp")) if (rootOf(d) === root && fs.statSync(path.join(".tmp", d)).isDirectory()) ids.add(d);
  for (const f of ls("public")) { const m = /^(.+?)_(src\.mp4|cut_s|cut\.mp4|map\.json)/.exec(f); if (m && rootOf(m[1]) === root) ids.add(m[1]); }
  return [...ids];
};
const isComp = (name, ids) => { const n = name.toLowerCase().replace(/\.(mp4|log|json)$/, ""); return ids.some((i) => { const k = i.toLowerCase(), k2 = k.replace(/_/g, "-"); return [k, k2].some((x) => n === x || n.startsWith(x + "-") || n.startsWith(x + "_")); }); };

export const pathsOf = (root) => {
  const ids = membersOf(root), out = { work: [], media: [], gates: [], legacy: [] };
  const add = (k, p) => { if (fs.existsSync(p) && !out[k].includes(p)) out[k].push(p); };
  for (const i of ids) add("work", path.join(".tmp", i));
  for (const f of ls("public")) for (const i of ids) if (f === i || f.startsWith(`${i}_`)) add("media", path.join("public", f));
  for (const f of ls(path.join(".tmp", "gates"))) for (const i of ids) if (f.startsWith(`${i}.`)) add("gates", path.join(".tmp", "gates", f));
  for (const d of [".tmp/stills_bundle", ".tmp/gpu_render/work"]) for (const f of ls(d)) if (isComp(f, ids) || isComp(f.replace(/^\./, "").replace(/_public_keep$/, ""), ids)) add("legacy", path.join(d, f));
  for (const f of ls(".tmp/render_logs")) if (isComp(f.replace(/^(gpu_render|hybrid_any|hybrid)_/, ""), ids)) add("legacy", path.join(".tmp/render_logs", f));
  for (const f of ls(".tmp/facetrack")) if (ids.some((i) => f.startsWith(`${i}_`))) add("legacy", path.join(".tmp/facetrack", f));
  for (const f of ls(".tmp/hybrid_any/public_slim")) for (const i of ids) if (f === i || f.startsWith(`${i}_`)) add("legacy", path.join(".tmp/hybrid_any/public_slim", f));
  for (const f of ls(".tmp")) if (/\.(out|log)$/.test(f) && ids.some((i) => f.toLowerCase().includes(i.toLowerCase()))) add("legacy", path.join(".tmp", f));
  const rw = (d) => { for (const f of ls(d)) { const p = path.join(d, f); if (isComp(f, ids)) add("legacy", p); else if (fs.statSync(p).isDirectory()) rw(p); } };
  rw("render_work");
  return { ids, ...out };
};

const busy = (root, ids) => {
  const why = [];
  try { for (const j of JSON.parse(fs.readFileSync(".tmp/procs.json", "utf8"))) { try { process.kill(j.pid, 0); } catch { continue; } if (ids.some((i) => rootOf(i) === root) && (j.project && rootOf(j.project) === root || ids.some((i) => String(j.cmd).toLowerCase().includes(i.toLowerCase())))) why.push(`عمل يعمل: ${j.label} (${j.pid})`); } } catch { /* none */ }
  for (const i of ids) { try { const o = JSON.parse(fs.readFileSync(path.join(".tmp", "locks", `stage_${i}.lock`), "utf8")); process.kill(o.pid, 0); why.push(`مرحلة تعمل (${o.pid})`); } catch { /* free */ } }
  return why;
};

if (cmd === "root") { console.log(rootOf(arg)); process.exit(0); }
if (cmd === "ls" && !arg) {
  const roots = new Map();
  for (const d of ls(".tmp")) { const full = path.join(".tmp", d); if (!fs.statSync(full).isDirectory() || /^(cache|gates|locks|models|look|hybrid_any|gpu_render|stills_bundle|render_logs|facetrack|node-compile-cache|stills_empty_public)$/.test(d) || /^run_/.test(d)) continue; roots.set(rootOf(d), 0); }
  for (const f of ls("public")) { const m = /^(.+?)_(src\.mp4|cut_s\.mp4|cut\.mp4)$/.exec(f); if (m) roots.set(rootOf(m[1]), 0); }
  const rows = [...roots.keys()].map((r) => { const p = pathsOf(r); return [r, [...p.work, ...p.media, ...p.gates, ...p.legacy].reduce((s, x) => s + sizeOf(x), 0)]; }).sort((a, b) => b[1] - a[1]);
  for (const [r, s] of rows) console.log(`${mb(s).padStart(9)}  ${r}`);
  console.log(`${mb(rows.reduce((s, r) => s + r[1], 0)).padStart(9)}  المجموع (${rows.length} مشروعاً)`);
  process.exit(0);
}
if ((cmd === "ls" || cmd === "clean") && arg) {
  const root = rootOf(arg), p = pathsOf(root);
  const groups = [["work", "العمل المؤقت (.tmp)"], ["media", "الوسائط في public"], ["gates", "إثباتات البوابات"], ["legacy", "بقايا في الأماكن المشتركة القديمة"]];
  let total = 0; const list = [];
  console.log(`المشروع «${root}» — أسماؤه: ${p.ids.join("، ")}`);
  for (const [k, label] of groups) {
    if (!p[k].length) continue;
    const skip = cmd === "clean" && k === "media" && KEEP_MEDIA;
    console.log(`\n${label}${skip ? " — يبقى (--keep-media)" : ""}:`);
    for (const x of p[k]) { const s = sizeOf(x); console.log(`  ${mb(s).padStart(9)}  ${x}`); if (!skip) { total += s; list.push(x); } }
  }
  console.log(`\nالمجموع${cmd === "clean" ? " الذي يُحذف" : ""}: ${mb(total)} في ${list.length} موضعاً`);
  if (cmd === "ls") process.exit(0);
  if (!YES) { console.log("(تجربة فقط — لم يُحذف شيء. للحذف: --yes)"); process.exit(0); }
  const why = busy(root, p.ids), young = list.filter((x) => Date.now() - newest(x) < 3 * 60e3);
  if ((why.length || young.length) && !FORCE) { console.error(`✘ لا حذف الآن: ${[...why, ...young.slice(0, 3).map((x) => `كُتب للتو: ${x}`)].join(" | ")} (--force إن كنت متأكداً)`); process.exit(1); }
  let gone = 0, left = [];
  for (const x of list) { try { fs.rmSync(x, { recursive: true, force: true }); gone++; } catch (e) { left.push(`${x}: ${e.code}`); } }
  console.log(left.length ? `✘ حُذف ${gone}، وبقي ${left.length}:\n  ${left.join("\n  ")}` : `✔ حُذف كل ما يخص «${root}» من المؤقت (${mb(total)})`);
  process.exit(left.length ? 1 : 0);
}
if (cmd === "orphans") {
  const alive = (pid) => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === "EPERM"; } };
  const dead = [];
  const scan = (d) => { for (const f of ls(d)) { const m = /^run_[a-z0-9-]+_(\d+)$/i.exec(f); if (m && !alive(Number(m[1]))) dead.push(path.join(d, f)); } };
  scan(".tmp"); for (const d of ls(".tmp")) { try { if (fs.statSync(path.join(".tmp", d)).isDirectory()) scan(path.join(".tmp", d)); } catch { /* gone */ } }
  let total = 0; for (const x of dead) { const s = sizeOf(x); total += s; console.log(`  ${mb(s).padStart(9)}  ${x}`); }
  console.log(`مجلدات تشغيل لعمليات منتهية: ${dead.length} (${mb(total)})`);
  if (YES) { for (const x of dead) fs.rmSync(x, { recursive: true, force: true }); console.log("✔ حُذفت"); } else if (dead.length) console.log("(تجربة — للحذف: --yes)");
  process.exit(0);
}
console.error("usage: node tools/project.mjs root <name> | ls [<root>] | clean <root> [--yes] [--keep-media] [--force] | orphans [--yes]");
process.exit(2);
