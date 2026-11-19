// ONE PLACE PER PROJECT FOR EVERYTHING TEMPORARY (user 2026-11-19: «كل الملفات المؤقتة تبع كل مشروع تكون في مكان خاص، مشان لما يحذفها مرة واحدة وما
// يخربط. والمشروع بحسب الفيديو المصدر… إذا فيديو مصدر بدك تطالع منه أكثر من فيديو، هذا كله يعد مشروع واحد»).
// The project is the SOURCE VIDEO: its landscape/portrait/both compositions, its reels, its stream clips are all the same project. Its temporary place
// is .tmp/<root>/ (the folder 46 tools already use for the project's work). Tools that used to write to shared folders (.tmp/stills_bundle, .tmp/gpu_render/work,
// .tmp/render_logs, .tmp/facetrack, .tmp/run_*) now ask projTmp() — so deleting .tmp/<root>/ deletes all of it (tools/project.mjs clean).
//   rootOf("Mufti-Hiraba-L") = rootOf("mufti-hiraba_cut_s") = rootOf("mufti-hiraba-reel") = "mufti-hiraba";  rootOf("tirmidhi32_3") = "tirmidhi32"
//   A spec may name its project explicitly: data/specs/<id>.json { "project": "<root>" } (wins over the name rules).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const R = (...a) => path.join(ROOT, ...a);
const exists = (...a) => fs.existsSync(R(...a));
/** a name that is a project of its own: its work folder, its source copy or its spec exists */
const isProject = (c) => !!c && (exists(".tmp", c) && fs.statSync(R(".tmp", c)).isDirectory() || exists("public", `${c}_src.mp4`) || exists("data", "specs", `${c}.json`));

const explicit = (c) => { try { const p = JSON.parse(fs.readFileSync(R("data", "specs", `${c}.json`), "utf8")).project; return typeof p === "string" && p ? p : null; } catch { return null; } };

export const rootOf = (name) => {
  let c = path.basename(String(name ?? "")).replace(/\.(mp4|m4a|wav|json|mov|mkv|webm)$/i, "").toLowerCase();
  c = c.replace(/_(cut_s_prev_[a-z0-9]+|cut_s_b\d+|cut_s|cut|src|map|cut_audio)$/i, "");   // a file of the project
  c = c.replace(/-(both|bothv|l)$/i, "");                                                    // a composition of it
  for (const k of [c, c.replace(/-/g, "_"), c.replace(/_/g, "-")]) { const e = explicit(k); if (e) return e; }
  // derived outputs: -reel / -reel2 / _reel, stream clips _3 / _3b / _r2, -R; the SHORTEST candidate that is a project of its own is the source
  const cands = [c];
  for (const re of [/-reel\d*$/i, /_reel\d*$/i, /-r$/i, /_r\d+$/i, /_\d+[a-z]?$/i]) { const last = cands[cands.length - 1], s = last.replace(re, ""); if (s && s !== last) cands.push(s); }
  for (let i = cands.length - 1; i >= 0; i--) for (const k of [cands[i], cands[i].replace(/-/g, "_")]) if (isProject(k)) return k;
  return c;
};

/** the project's temporary folder (created), with optional sub-path:  projTmp("Mufti-Hiraba-L", "gpu_work", "Mufti-Hiraba-L") */
export const projTmp = (name, ...sub) => { const d = R(".tmp", rootOf(name), ...sub); fs.mkdirSync(sub.length && path.extname(sub[sub.length - 1]) ? path.dirname(d) : d, { recursive: true }); return d; };

/** temp folders of runs whose process is gone (a forced stop skips the cleanup on exit): `run_<tag>_<pid>` under .tmp/ or .tmp/<root>/ */
export const sweepDeadRuns = (dir) => {
  const alive = (pid) => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === "EPERM"; } };
  let n = 0;
  for (const d of (() => { try { return fs.readdirSync(dir); } catch { return []; } })()) {
    const m = /^run_[a-z0-9-]+_(\d+)$/i.exec(d); if (!m || alive(Number(m[1]))) continue;
    try { fs.rmSync(path.join(dir, d), { recursive: true, force: true }); n++; } catch { /* in use */ }
  }
  return n;
};
