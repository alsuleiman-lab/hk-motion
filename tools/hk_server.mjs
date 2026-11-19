// HK-Motion tools server (user 2026-11-19: «في الريموشن أستطيع أن أقص بنفسي: أحدد بداية ونهاية وأكبس حذف … أو حذف موسيقى»).
// The Studio runs in a browser and cannot start tools; this small local server does it for the buttons in its «تحديد» strip (src/studioTools.ts), one job at a time:
//   POST /api/preview {comp, a, b}   → what a deletion would take: project, seconds, the words inside (nothing is changed)
//   POST /api/delete  {comp, a, b}   → tools/cut_blocks.mjs --snap-words (smart cut: no re-encode of the video, the span moves to the gaps between words first)
//   POST /api/music   {comp, a, b}   → tools/music_cut.mjs (the music remover on that span only; the video is not touched)
//   GET  /api/job                    → the running / last job: state, summary, the end of its log
//   GET  /api/ping
// Port = the Studio's port + 99 (remotion.config.ts starts it with the Studio: 3100 → 3199, a Studio on 3200 → 3299).
// comp = the Studio composition id (Sufi-Baath-Both → the spec data/specs/sufi-baath.json); a, b = Studio frames (the Studio adds 150 frames after the montage's bumper: removed here).
// Only private-network clients are served. Run:  node tools/hk_server.mjs [port=3199]   (the Studio launchers start it next to the Studio).
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";

process.chdir(path.resolve(import.meta.dirname, ".."));
const PORT = Number(process.argv[2] ?? process.env.HK_PORT ?? 3199);
try { os.setPriority(process.pid, os.constants.priority.PRIORITY_BELOW_NORMAL); } catch { /* ignore */ }
let job = null;   // { id, kind, project, state, startedAt, endedAt, summary, log }
let seq = 0;

const project = (comp) => {
  const base = String(comp ?? "").replace(/-(Both|BothV|L)$/i, "").toLowerCase();
  for (const c of [base, base.replace(/-/g, "_")]) if (fs.existsSync(path.join("data", "specs", `${c}.json`))) return c;
  return null;
};
/** Studio frame → frame of the montage's own timeline (the Studio inserts 150 frames for the bumper after its `at`) */
const specFrame = (spec, f) => {
  const b = spec.bumper;
  if (!b || b.end || !(b.at >= 1)) { if (f > spec.frames) throw new Error(`الإطار ${f} بعد نهاية المونتاج (${spec.frames}): اختر موضعاً من الكلام`); return f; }
  const at = Math.round(b.at * 30);
  if (f <= at) return f;
  if (f < at + 150) throw new Error(`الإطار ${f} داخل الفاصل (${at}–${at + 150}): اختر موضعاً من الكلام`);
  return f - 150;
};
const words = (p) => { try { const raw = JSON.parse(fs.readFileSync(path.join(".tmp", p, "cut_words.json"), "utf8")); return (raw.words ?? raw).map((w) => ({ s: +(w.s ?? w.start), e: +(w.e ?? w.end ?? (w.s ?? w.start) + 0.2), w: String(w.w ?? w.word) })); } catch { return []; } };
const parse = (body) => {
  const comp = String(body.comp ?? ""), p = project(comp);
  if (!p) throw new Error(`لا أجد مواصفة للتركيب «${comp}» (data/specs)`);
  const spec = JSON.parse(fs.readFileSync(path.join("data", "specs", `${p}.json`), "utf8"));
  let fa = specFrame(spec, Math.round(Number(body.a))), fb = specFrame(spec, Math.round(Number(body.b)));
  if (fa > fb) [fa, fb] = [fb, fa];
  if (!(fb > fa)) throw new Error("النهاية يجب أن تكون بعد البداية");
  if (fb > spec.frames) throw new Error(`النهاية بعد آخر المونتاج (${spec.frames})`);
  return { p, spec, fa, fb };
};

const start = (kind, p, args, label) => {
  if (job?.state === "running") throw Object.assign(new Error(`يعمل الآن: ${job.label}`), { code: 409 });
  const j = (job = { id: ++seq, kind, project: p, label, state: "running", startedAt: Date.now(), endedAt: null, summary: "", log: "" });
  const ch = spawn(process.execPath, args, { windowsHide: true, env: process.env });
  const add = (d) => { j.log = (j.log + d.toString()).slice(-6000); };
  ch.stdout.on("data", add); ch.stderr.on("data", add);
  ch.on("close", (code) => {
    j.state = code === 0 ? "done" : "failed"; j.endedAt = Date.now();
    const lines = j.log.trim().split("\n").filter(Boolean);
    j.summary = code === 0 ? (lines.filter((l) => /^(cut_blocks: DONE|music_cut:)/.test(l)).slice(-1)[0] ?? lines.slice(-1)[0] ?? "تم") : (lines.filter((l) => l.startsWith("✘ cut_block:")).slice(0, 1)[0] ?? lines.filter((l) => l.startsWith("✘")).slice(-1)[0] ?? lines.slice(-1)[0] ?? "فشل");
  });
  return j;
};

const send = (res, code, obj) => { res.writeHead(code, { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*", "access-control-allow-headers": "content-type", "access-control-allow-private-network": "true", "access-control-allow-methods": "GET,POST,OPTIONS" }); res.end(JSON.stringify(obj)); };
const priv = (ip) => /^(::1|127\.|::ffff:127\.|10\.|::ffff:10\.|192\.168\.|::ffff:192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::ffff:172\.(1[6-9]|2\d|3[01])\.|fe80:|fc|fd)/i.test(ip ?? "");

http.createServer((req, res) => {
  if (!priv(req.socket.remoteAddress)) return send(res, 403, { error: "private network only" });
  if (req.method === "OPTIONS") return send(res, 204, {});
  const url = (req.url ?? "").split("?")[0];
  if (req.method === "GET" && url === "/api/ping") return send(res, 200, { ok: true, name: "HK-Motion", busy: job?.state === "running" });
  if (req.method === "GET" && url === "/api/job") return send(res, 200, job ? { ...job, seconds: Math.round(((job.endedAt ?? Date.now()) - job.startedAt) / 1000), log: job.log.slice(-1200) } : { state: "idle" });
  if (req.method !== "POST") return send(res, 404, { error: "not found" });
  let raw = ""; req.on("data", (d) => { raw += d; if (raw.length > 1e5) req.destroy(); });
  req.on("end", () => {
    try {
      const body = raw ? JSON.parse(raw) : {}, { p, fa, fb } = parse(body), A = (fa / 30).toFixed(4), B = (fb / 30).toFixed(4), secs = ((fb - fa) / 30).toFixed(1);
      if (url === "/api/preview") {
        const inside = words(p).filter((w) => w.s >= fa / 30 - 0.03 && w.e <= fb / 30 + 0.03).map((w) => w.w);
        return send(res, 200, { project: p, from: +A, to: +B, seconds: +secs, words: inside.length > 40 ? [...inside.slice(0, 20), "…", ...inside.slice(-15)] : inside, count: inside.length });
      }
      if (url === "/api/delete") { const j = start("delete", p, ["tools/cut_blocks.mjs", p, `${A}-${B}`, "--snap-words"], `حذف ${secs} ث من ${p}`); return send(res, 202, { id: j.id, label: j.label }); }
      if (url === "/api/music") { const j = start("music", p, ["tools/music_cut.mjs", p, A, B], `حذف الموسيقى ${secs} ث من ${p}`); return send(res, 202, { id: j.id, label: j.label }); }
      return send(res, 404, { error: "not found" });
    } catch (e) { return send(res, e.code === 409 ? 409 : 400, { error: e.message }); }
  });
}).on("error", (e) => { if (e.code === "EADDRINUSE") { console.log(`HK-Motion tools server: :${PORT} is taken (already running)`); process.exit(0); } throw e; })
  .listen(PORT, "0.0.0.0", () => console.log(`HK-Motion tools server on :${PORT}`));
