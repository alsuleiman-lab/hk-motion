// THE CONDUCTOR'S CORE (user 2026-11-22: «هذه هي مشكلتي الكبيرة معك، أنك ما تلتزم. كيف بدي ألزمك ما أعرف» — a stream plan was presented from memory, in the wrong
// order, with the verses and hadiths missing). The procedure already written in the skills becomes DATA (data/pipelines/<kind>.json) and this file is the state
// machine over it: steps, dependencies, gates, budgets, the one current step, and the verdict the PreToolUse hook gives a pipeline command. Shared by
// tools/conduct.mjs (the commands) and tools/hooks/guard.mjs (the enforcement), and tested by tools/selftest_cases/m_conductor.mjs.
// Every function takes `root` (the workspace, or a scratch copy in the self-test) and reads only files under it.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { pathToFileURL, fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const rd = (f, d) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return d; } };
const norm = (p) => String(p ?? "").replace(/\\/g, "/");
const mt = (f) => { try { return fs.statSync(f).mtimeMs; } catch { return 0; } };
export const mins = (ms) => (ms / 60000).toFixed(1);
export const PY_DEFAULT = "S:/AI_Tools/ComfyUI_windows_portable/python_embeded/python.exe";

/* ── the kinds registry and the definitions ─────────────────────────────────────────────────────────────────────── */
export const kindsFile = (root = ROOT) => path.join(root, "data", "pipelines", "kinds.json");
export const loadKinds = (root = ROOT) => rd(kindsFile(root), { kinds: {} }).kinds ?? {};
/** the kind a word names (بث ← stream …), or null */
export function kindOfWord(word, root = ROOT) {
  const w = String(word ?? "").trim();
  for (const [k, v] of Object.entries(loadKinds(root))) if (k === w || (v.words ?? []).includes(w)) return k;
  return null;
}
/** definition of a kind or of a file path (the tests' fake pipelines); {def, error} */
export function loadDef(kindOrFile, root = ROOT) {
  let f = kindOrFile;
  if (!/[\\/]|\.json$/.test(f)) {
    const k = loadKinds(root)[f];
    if (!k) return { error: `نوع مجهول «${f}» — الأنواع: ${Object.keys(loadKinds(root)).join("، ")}` };
    if (!k.ready) return { notReady: true, kind: f, info: k, error: `لم يُجهَّز: «${k.ar ?? f}» مسجَّل في data/pipelines/kinds.json ولا تعريف آلياً له بعد${k.skill ? ` (إجراؤه المكتوب في مهارة ${k.skill})` : ""}${k.note ? ` — ${k.note}` : ""}` };
    f = path.join(root, "data", "pipelines", k.file);
  } else if (!path.isAbsolute(f)) f = path.resolve(root, f);
  let txt; try { txt = fs.readFileSync(f, "utf8"); } catch { return { error: `لا ملف تعريف: ${f}` }; }
  let def; try { def = JSON.parse(txt); } catch (e) { return { error: `JSON فاسد في ${f}: ${String(e.message).slice(0, 120)}`, file: f }; }
  return { def, file: f };
}

/* ── state ───────────────────────────────────────────────────────────────────────────────────────────────────────── */
export const stateFile = (root, p) => path.join(root, ".tmp", p, "conduct.json");
export const activeFile = (root) => path.join(root, ".tmp", "conduct_active.json");
export const readState = (root, p) => rd(stateFile(root, p), null);
const pidAlive = (pid) => { try { process.kill(Number(pid), 0); return true; } catch (e) { return e.code === "EPERM"; } };
const syncPause = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
/** Cross-process read-modify-write lock: next, its detached runner and status can all update the same state. */
export function editState(root, p, fn) {
  const f = stateFile(root, p), lock = path.join(path.dirname(f), "conduct.state.lock"), token = crypto.randomUUID();
  fs.mkdirSync(path.dirname(f), { recursive: true });
  const started = Date.now(); let lockFd = null;
  for (;;) {
    try { lockFd = fs.openSync(lock, "wx"); fs.writeFileSync(lockFd, JSON.stringify({ pid: process.pid, token, at: Date.now() })); break; }
    catch (e) {
      if (e.code !== "EEXIST") throw e;
      let owner = null; try { owner = JSON.parse(fs.readFileSync(lock, "utf8")); } catch { /* a writer may be creating the lock */ }
      if (owner?.pid && !pidAlive(owner.pid)) { try { fs.rmSync(lock, { force: true }); } catch { /* another waiter recovered it */ } }
      else if (!owner) { try { if (Date.now() - fs.statSync(lock).mtimeMs > 30000) fs.rmSync(lock, { force: true }); } catch { /* another waiter recovered it */ } }
      if (Date.now() - started > 15000) throw new Error("المُوصِل ينتظر قفل حالة «" + p + "» أكثر من 15 ثانية؛ لم تُكتب حالة متضاربة.");
      syncPause(20);
    }
  }
  const tmp = f + "." + process.pid + "." + token + ".tmp";
  try {
    const st = readState(root, p); if (!st) return null;
    fn(st); st.updatedAt = Date.now();
    fs.writeFileSync(tmp, JSON.stringify(st, null, 1));
    for (let attempt = 0; ; attempt++) {
      try { fs.renameSync(tmp, f); break; }
      catch (e) {
        if (!["EPERM", "EACCES", "EBUSY"].includes(e.code) || attempt >= 20) throw e;
        syncPause(50);
      }
    }
    return st;
  } finally {
    try { fs.rmSync(tmp, { force: true }); } catch { /* not created or already renamed */ }
    try { fs.closeSync(lockFd); } catch { /* already closed */ }
    try { if (JSON.parse(fs.readFileSync(lock, "utf8")).token === token) fs.rmSync(lock, { force: true }); } catch { /* stale recovery */ }
  }
}
export const stepState = (st, id) => (st.steps[id] ??= { status: "pending" });
const stepsById = (def) => Object.fromEntries(def.steps.map((s) => [s.id, s]));

/* ── placeholders ────────────────────────────────────────────────────────────────────────────────────────────────── */
export function clipsOf(root, p, st) {
  const t = rd(path.join(root, ".tmp", p, "clip_table.json"), null);
  if (Array.isArray(t) && t.length) return t.map((c) => c.id).filter(Boolean);
  const pl = rd(path.join(root, ".tmp", p, "plan.json"), null);
  if (Array.isArray(pl?.clips) && pl.clips.length) return pl.clips.map((c) => c.id).filter(Boolean);
  return st?.clips ?? [];
}
/** a single-video kind (an episode) has ONE «clip» = the project itself */
export const clipsFor = (root, def, st) => (def?.single ? [st.project] : clipsOf(root, st.project, st));
/** fill an argv: a flag whose value fills to nothing is dropped with its value (--rem "" is no --rem) */
export function fillArgv(argv, ctx) {
  const out = [];
  for (const t of argv) { if (t === "{clips}") { out.push(...(ctx.clips ?? [])); continue; } const v = C_fill(t, ctx); if (v === "" && /^--/.test(out[out.length - 1] ?? "")) out.pop(); else out.push(v); }
  return out;
}
/** R (طولي: reel or ≤ 120 s) | L (عرضي), from the spec's real length like tools/stream/fast_run.mjs */
export function orientOfClip(root, p, c) {
  const table = rd(path.join(root, ".tmp", p, "clip_table.json"), []), row = Array.isArray(table) ? table.find((x) => x.id === c) : null;
  const spec = rd(path.join(root, "data", "specs", `${c}.json`), null), dur = spec?.frames ? spec.frames / 30 : row?.dur ?? 0;
  return row?.kind === "reel" || dur <= 120 ? "R" : "L";
}
export function finalFileOf(root, c) {
  const jobs = (rd(path.join(root, "data", "render_queue", "state.json"), { jobs: [] }).jobs ?? []).filter((j) => j.spec === c && j.state === "done");
  const j = jobs[jobs.length - 1]; return j ? (j.to ?? j.file ?? "") : "";
}
/** the original recording of a clip or of a stream: `source` in the clip's own .tmp/<clip>/prep_config.json, else the parent's, else public/<p>_src.mp4 (relative to the root, or absolute) */
export function sourceOf(root, p, c) {
  for (const id of [c, p]) { if (!id) continue; const s = rd(path.join(root, ".tmp", id, "prep_config.json"), {}).source; if (typeof s === "string" && s.trim()) return s; }
  return `public/${p}_src.mp4`;
}
/** fill {p} {c} {clips} {o} {O} {file} {src} {PY} {file:PATH} and any args key; unknown placeholders stay (the lint reports them) */
export function fill(s, ctx) { return C_fill(s, ctx); }
function C_fill(s, ctx) {
  const root = ctx.root ?? ROOT; let t = String(s);
  const simple = { p: ctx.p, c: ctx.c ?? "{c}", clips: (ctx.clips ?? []).join(" "), PY: process.env.PY ?? PY_DEFAULT, ...(ctx.args ?? {}) };
  if (ctx.c) { simple.o = orientOfClip(root, ctx.p, ctx.c) === "L" ? "land" : "port"; simple.O = orientOfClip(root, ctx.p, ctx.c); simple.file = finalFileOf(root, ctx.c); }
  if (simple.src === undefined && t.includes("{src}")) simple.src = sourceOf(root, ctx.p, ctx.c);
  t = t.replace(/\{(\w+)\}/g, (m, k) => (k in simple && simple[k] !== undefined ? String(simple[k]) : m));
  t = t.replace(/\{file:([^}]+)\}/g, (m, f) => { try { return fs.readFileSync(path.join(root, f), "utf8").trim(); } catch { return ""; } });
  return t;
}
const hasClipVar = (x) => /\{(c|o|O|file)\}/.test(JSON.stringify(x));

/* ── gates: every gate type has a checker here; the lint refuses a gate type that is not in this table ───────────── */
const fileOk = (root, f) => { try { const a = path.resolve(root, f); return fs.statSync(a).size > 0 || fs.statSync(a).isDirectory(); } catch { return false; } };
const eachClip = (ctx, fn) => {
  const bad = []; for (const c of ctx.clips) { const r = fn(c); if (r !== true && r) bad.push(`${c}: ${r}`); }
  return bad.length ? { ok: false, why: bad.slice(0, 3).join(" | ") + (bad.length > 3 ? ` (+${bad.length - 3})` : "") } : { ok: true };
};
const needClips = (ctx) => (ctx.clips.length ? null : { ok: false, why: "لا مقاطع بعد (clip_table.json أو plan.json)" });
export const CHECKERS = {
  evidence: (g, ctx) => ((ctx.state.steps[ctx.step.id]?.evidence ?? "").trim().length >= (g.min ?? 8) ? { ok: true } : { ok: false, why: `يلزم دليل بنص (≥ ${g.min ?? 8} حرفاً): ${ctx.step.done ?? `node tools/conduct.mjs done ${ctx.step.id} --evidence "…"`}` }),
  arg_set: (g, ctx) => (ctx.state.args?.[g.name] ? { ok: true } : { ok: false, why: `لم يُحدَّد «${g.name}»: --set ${g.name}=<القيمة>` }),
  files: (g, ctx) => {
    const perClip = hasClipVar(g.paths);
    const one = (paths, c) => {
      const miss = paths.map((x) => fill(x, { ...ctx, c })).filter((f) => !fileOk(ctx.root, f));
      if (miss.length) return `غير موجود: ${miss.slice(0, 2).join("، ")}`;
      if (g.newer) { const n = mt(path.join(ctx.root, fill(g.newer, { ...ctx, c }))); const old = paths.map((x) => fill(x, { ...ctx, c })).filter((f) => mt(path.join(ctx.root, f)) < n); if (old.length) return `أقدم من ${g.newer}: ${old[0]}`; }
      return true;
    };
    if (!perClip) { const r = one(g.paths); return r === true ? { ok: true } : { ok: false, why: r }; }
    return needClips(ctx) ?? eachClip(ctx, (c) => one(g.paths, c));
  },
  files_read: (g, ctx) => {
    const need = unreadFor(ctx.root, null, ctx.p, g.files.map((x) => (typeof x === "string" ? { file: x } : x)).map((r) => ({ file: r.file, mode: r.mode ?? "whole" })), ctx.state.t0 ?? 0);
    return need.length ? { ok: false, why: `لم تُقرأ بعد (بأداة القراءة، الملف كله، بعد بدء التشغيل): ${need.map((n) => n.file + (n.mode === "whole" ? "" : " [بحث]")).join("، ")}` } : { ok: true };
  },
  any_files: (g, ctx) => (g.paths.some((f) => fileOk(ctx.root, fill(f, ctx))) ? { ok: true } : { ok: false, why: `لا أحد من: ${g.paths.map((f) => fill(f, ctx)).join("، ")}` }),
  sections_ok: async (g, ctx) => { try { const M = await import(pathToFileURL(path.join(ctx.root, "tools", "prepublish_gates.mjs")).href); const sp = rd(path.join(ctx.root, "data", "specs", `${ctx.p}.json`), null); if (!sp) return { ok: false, why: "لا مواصفة بعد" }; if (!M.appliesToEpisode(ctx.p, sp)) return { ok: true }; const f = M.sectionsFailures(ctx.p, sp); return f.length ? { ok: false, why: String(f[0]).slice(0, 140) } : { ok: true }; } catch (e) { return { ok: false, why: "تعذّر prepublish_gates: " + String(e.message).slice(0, 80) }; } },
  package_ok: async (g, ctx) => { try { const M = await import(pathToFileURL(path.join(ctx.root, "tools", "prepublish_gates.mjs")).href); const sp = rd(path.join(ctx.root, "data", "specs", `${ctx.p}.json`), null); if (!sp) return { ok: false, why: "لا مواصفة بعد" }; if (!M.appliesToEpisode(ctx.p, sp)) return { ok: true }; const f = M.packageFailures(ctx.p); return f.length ? { ok: false, why: String(f[0]).slice(0, 140) } : { ok: true }; } catch (e) { return { ok: false, why: "تعذّر prepublish_gates: " + String(e.message).slice(0, 80) }; } },
  json_clips: (g, ctx) => {
    const j = rd(path.join(ctx.root, fill(g.path, ctx)), null);
    if (!j || !Array.isArray(j.clips) || !j.clips.length) return { ok: false, why: `${fill(g.path, ctx)} ليس خطة صالحة: يلزم clips بمقطع واحد على الأقل` };
    const bad = j.clips.filter((c) => !c.id || !Array.isArray(c.ranges) || !c.ranges.length).map((c) => c.id ?? "(بلا معرّف)");
    return bad.length ? { ok: false, why: `مقاطع بلا معرّف أو نطاقات: ${bad.slice(0, 4).join("، ")}` } : { ok: true };
  },
  json_covers_clips: (g, ctx) => {
    const j = rd(path.join(ctx.root, fill(g.path, ctx)), null); if (!j) return { ok: false, why: `لا ملف ${fill(g.path, ctx)} صالح` };
    return needClips(ctx) ?? eachClip(ctx, (c) => {
      const e = j[c]; if (e === undefined) return "غير مذكور في الملف";
      if (g.array) return Array.isArray(e) ? true : "ليس مصفوفة";
      const miss = (g.fields ?? []).filter((f) => !String(e?.[f] ?? "").trim()); return miss.length ? `ينقصه ${miss.join("، ")}` : true;
    });
  },
  board_lane: (g, ctx) => { const b = rd(path.join(ctx.root, ".tmp", ctx.p, "board.json"), null); const l = b?.lanes?.find((x) => x.id === g.lane); return l?.status === "done" ? { ok: true } : { ok: false, why: `مسار «${g.lane}» في اللوحة ${l?.status ?? "غير موجود"}: node tools/montage_kickoff.mjs board ${ctx.p}` }; },
  fast_clock: (g, ctx) => (rd(path.join(ctx.root, ".tmp", ctx.p, "fast_run.json"), {}).t0 ? { ok: true } : { ok: false, why: "ساعة fast_run لم تبدأ" }),
  fast_checks_ok: (g, ctx) => {
    const r = rd(path.join(ctx.root, ".tmp", ctx.p, "fast_checks.json"), null); if (!r) return { ok: false, why: "لا جدول فحوص (fast_checks.json)" };
    return needClips(ctx) ?? eachClip(ctx, (c) => (r[c]?.ok === true ? true : `فحصه ${r[c] ? "فشل: " + (r[c].why ?? "").slice(0, 80) : "لم يُشغَّل"}`));
  },
  perclip_artifacts: (g, ctx) => {
    const list = ctx.def.perClip ?? []; const bad = [];
    for (const t of list) for (const c of ctx.clips) { const a = fill(t.artifact, { ...ctx, c }); if (!fileOk(ctx.root, a)) bad.push(`${t.id} لم يعمل على ${c}`); }
    return ctx.clips.length ? (bad.length ? { ok: false, why: bad.slice(0, 4).join(" | ") + (bad.length > 4 ? ` (+${bad.length - 4})` : "") } : { ok: true }) : needClips(ctx);
  },
  hadith_verified: (g, ctx) => needClips(ctx) ?? eachClip(ctx, (c) => {
    const h = rd(path.join(ctx.root, ".tmp", c, "hadith.json"), null); if (!Array.isArray(h)) return "لا hadith.json";
    const open = h.filter((e) => e.verified !== true && e.skip !== true); return open.length ? `${open.length} رواية بلا توثيق (verified:true أو skip:true)` : true;
  }),
  log_has: (g, ctx) => { let t = ""; try { t = fs.readFileSync(path.join(ctx.root, fill(g.file, ctx)), "utf8"); } catch { /* none */ } return t.includes(g.text) ? { ok: true } : { ok: false, why: g.why ?? `لا «${g.text}» في ${fill(g.file, ctx)}` }; },
  queue_jobs: (g, ctx) => {
    const jobs = rd(path.join(ctx.root, "data", "render_queue", "state.json"), { jobs: [] }).jobs ?? [];
    return needClips(ctx) ?? eachClip(ctx, (c) => {
      const j = [...jobs].reverse().find((x) => x.spec === c); if (!j) return "ليس في طابور الرندر";
      if (j.bumper !== "end") return `الفاصل ليس في الآخر (bumper=${j.bumper ?? "—"})`;
      const want = orientOfClip(ctx.root, ctx.p, c); if (j.orient !== want) return `الاتجاه ${j.orient} والمواصفة تقتضي ${want}`;
      const folder = want === "R" ? "طولي" : "عرضي"; if (!norm(j.dest).endsWith("/" + folder)) return `الوجهة ${norm(j.dest).split("/").slice(-2).join("/")} ولا بدّ من «${folder}» بحسب الطول`;
      return true;
    });
  },
  render_done: (g, ctx) => {
    const jobs = rd(path.join(ctx.root, "data", "render_queue", "state.json"), { jobs: [] }).jobs ?? [];
    return needClips(ctx) ?? eachClip(ctx, (c) => { for (const o of g.orients ?? [null]) { const j = [...jobs].reverse().find((x) => x.spec === c && (!o || x.orient === o)); if (!j) return `ليس في الطابور${o ? " (" + o + ")" : ""}`; if (j.state === "failed") return `فشل: ${(j.err ?? j.review ?? "").slice(0, 80)}`; if (j.state !== "done") return `حالته ${j.state}`; } return true; });
  },
  final_ok: (g, ctx) => needClips(ctx) ?? eachClip(ctx, (c) => { const m = mt(path.join(ctx.root, ".tmp", "gates", `${c}.final.ok`)); return m && Date.now() - m < 24 * 3600e3 ? true : "لا دليل final_review خلال 24 ساعة"; }),
  prerender_fresh: async (g, ctx) => {
    let G; try { G = await import(pathToFileURL(path.join(ctx.root, "tools", "lib", "prerender_gate.mjs")).href); } catch { return { ok: false, why: "tools/lib/prerender_gate.mjs غير موجود" }; }
    const bad = []; for (const c of ctx.clips) for (const o of g.orients ?? [orientOfClip(ctx.root, ctx.p, c)]) { const r = G.freshness(c, o, { root: ctx.root }); if (!r.ok) bad.push(`${c}: ${r.why}`); }
    return ctx.clips.length ? (bad.length ? { ok: false, why: bad.slice(0, 2).join(" | ") + (bad.length > 2 ? ` (+${bad.length - 2})` : "") } : { ok: true }) : needClips(ctx);
  },
  cover_ok: async (g, ctx) => {
    let M; try { M = await import(pathToFileURL(path.join(ctx.root, "tools", "cover_item.mjs")).href); } catch { return { ok: false, why: "tools/cover_item.mjs غير موجود" }; }
    const bad = []; for (const c of ctx.clips) { const sp = rd(path.join(ctx.root, "data", "specs", `${c}.json`), null); const why = sp ? M.coverFailure(c, sp) : "لا مواصفة"; if (why) bad.push(`${c}: ${String(why).slice(0, 80)}`); }
    return ctx.clips.length ? (bad.length ? { ok: false, why: "الغلاف في أول المقطع وصورته موجودة: " + bad.slice(0, 2).join(" | ") } : { ok: true }) : needClips(ctx);
  },
  cmd: (g, ctx) => {
    const run = (c) => { const a = g.cmd.map((x) => fill(x, { ...ctx, c })); const r = spawnSync(a[0], a.slice(1), { cwd: ctx.root, encoding: "utf8", timeout: (g.timeoutSec ?? 120) * 1000, windowsHide: true }); return r.status === 0 ? true : `${(r.stdout + r.stderr).trim().split(/\r?\n/).filter(Boolean).slice(-1)[0]?.slice(0, 100) ?? "فشل"}`; };
    if (g.foreach) return needClips(ctx) ?? eachClip(ctx, run);
    const r = run(); return r === true ? { ok: true } : { ok: false, why: g.why ? `${g.why} — ${r}` : r };
  },
};
/** the keys a gate type needs, so the lint can say what is missing */
const GATE_NEEDS = { files_read: ["files"], files: ["paths"], any_files: ["paths"], json_clips: ["path"], json_covers_clips: ["path"], board_lane: ["lane"], log_has: ["file", "text"], cmd: ["cmd"], arg_set: ["name"] };

export async function checkGates(step, ctx) {
  const gates = step.gate ?? [];
  for (const g of gates) {
    const ck = CHECKERS[g.type]; if (!ck) return { ok: false, why: `نوع بوابة بلا فاحص: ${g.type}` };
    let r; try { r = await ck(g, { ...ctx, step }); } catch (e) { r = { ok: false, why: `انهار فاحص ${g.type}: ${String(e.message).slice(0, 100)}` }; }
    if (!r.ok) return { ok: false, why: r.why, gate: g.type };
  }
  return { ok: true };
}

/* ── the lint: a tool named in the JSON that does not exist, a gate with no checker, a broken graph ─────────────── */
const scriptsIn = (argv) => argv.map(String).filter((t) => /^tools\/[^\s{}]+\.(mjs|py|sh|js)$/.test(t));
export function lintDef(def, root = ROOT) {
  const P = [];
  if (!def || typeof def !== "object") return ["التعريف ليس كائناً"];
  if (!def.kind) P.push("لا kind");
  if (!Array.isArray(def.steps) || !def.steps.length) return [...P, "لا steps"];
  const ids = def.steps.map((s) => s.id), set = new Set(ids);
  if (set.size !== ids.length) P.push(`معرّفات مكررة: ${ids.filter((x, i) => ids.indexOf(x) !== i).join("، ")}`);
  const TYPES = new Set(["auto", "creative", "guided", "watch"]);
  const exist = (t, where) => { if (!fs.existsSync(path.join(root, t))) P.push(`${where}: الأداة «${t}» غير موجودة`); };
  for (const s of def.steps) {
    const W = `الخطوة «${s.id}»`;
    if (!s.id || !/^\w+$/.test(s.id)) P.push(`معرّف خطوة غير صالح: ${s.id}`);
    if (!TYPES.has(s.type)) P.push(`${W}: النوع «${s.type}» مجهول`);
    if (!s.ar) P.push(`${W}: لا وصف عربي (ar)`);
    if (!s.skill) P.push(`${W}: لا بند مهارة مصدر (skill)`);
    if (!Array.isArray(s.deps)) P.push(`${W}: deps ليست مصفوفة`);
    else for (const d of s.deps) if (!set.has(d)) P.push(`${W}: تعتمد على «${d}» وهي غير موجودة`);
    if (!(s.budgetMin === null || typeof s.budgetMin === "number")) P.push(`${W}: budgetMin رقم أو null («غير مقيس»)`);
    const cmds = s.cmds ?? (s.cmd ? [s.cmd] : []);
    if ((s.type === "auto" || s.type === "guided") && !cmds.length) P.push(`${W}: خطوة ${s.type === "auto" ? "تلقائية" : "موجَّهة"} بلا أمر (cmd)`);
    if (s.type === "creative" && !s.creative?.what) P.push(`${W}: خطوة إبداعية بلا وصف للمطلوب (creative.what)`);
    for (const a of cmds) { if (!Array.isArray(a) || !a.length) { P.push(`${W}: أمر ليس مصفوفة`); continue; } for (const t of scriptsIn(a)) exist(t, W); }
    for (const t of [...(s.also ?? []), ...(s.allow ?? []).map((x) => x.tool).filter(Boolean)]) exist(t, `${W} (also/allow)`);
    const gates = s.gate ?? [];
    if (s.type !== "auto" && !gates.length) P.push(`${W}: بوابة بلا فاحص — خطوة ${s.type} يجب أن تحمل gate`);
    for (const g of gates) {
      if (!CHECKERS[g.type]) { P.push(`${W}: البوابة «${g.type}» بلا فاحص (CHECKERS)`); continue; }
      for (const k of GATE_NEEDS[g.type] ?? []) if (g[k] === undefined) P.push(`${W}: البوابة ${g.type} تنقصها «${k}»`);
      if (g.type === "cmd" && Array.isArray(g.cmd)) for (const t of scriptsIn(g.cmd)) exist(t, `${W} (بوابة)`);
      if (g.type === "cmd" && !Array.isArray(g.cmd)) P.push(`${W}: gate.cmd ليست مصفوفة`);
    }
    for (const a of cmds) for (const m of JSON.stringify(a).matchAll(/\{(\w+)\}/g)) if (!["p", "c", "clips", "o", "O", "file", "PY", "video", "drops", "comp", "minutes", "offset", "src"].includes(m[1])) P.push(`${W}: متغير «{${m[1]}}» مجهول`);
  }
  // acyclic
  const color = {}; const byId = Object.fromEntries(def.steps.map((s) => [s.id, s]));
  const visit = (id, trail) => { if (color[id] === 2) return; if (color[id] === 1) { P.push(`دورة في الاعتماديات: ${[...trail, id].join(" ← ")}`); return; } color[id] = 1; for (const d of byId[id]?.deps ?? []) if (byId[d]) visit(d, [...trail, id]); color[id] = 2; };
  for (const id of ids) visit(id, []);
  // every tool of a step is classified as «guarded» (the hook can recognise it), and every per-clip tool exists and is produced by a real step
  const guarded = def.guarded ?? [];
  if (!guarded.length) P.push("لا قائمة guarded: الهوك لا يعرف أوامر الإجراء");
  for (const g of guarded) exist(g.tool, "guarded");
  for (const s of def.steps) for (const a of s.cmds ?? (s.cmd ? [s.cmd] : [])) { const sig = signatureOf(a); if (sig && !guardedEntryFor(def, sig.tool, sig.args)) P.push(`الخطوة «${s.id}»: أمرها ${sig.tool} غير مصنَّف في guarded: يمرّ من الهوك بلا حراسة`); }
  for (const t of def.perClip ?? []) { exist(t.tool, `perClip ${t.id}`); if (!set.has(t.step)) P.push(`perClip ${t.id}: الخطوة «${t.step}» غير موجودة`); if (!t.artifact) P.push(`perClip ${t.id}: لا artifact`); }
  const reqExist = (list, where) => { for (const x of list ?? []) { const r = typeof x === "string" ? { file: x } : x; if (!r?.file || !fs.existsSync(path.join(root, r.file))) P.push(`${where}: ملف مطلوب قراءته غير موجود «${r?.file}»`); if (r?.mode && !["whole", "any", "search"].includes(r.mode)) P.push(`${where}: نمط قراءة مجهول «${r.mode}»`); } };
  reqExist(def.defaultRequires, "defaultRequires");
  for (const s of def.steps) { reqExist(s.requires, `الخطوة «${s.id}» requires`); for (const g of s.gate ?? []) if (g.type === "files_read") reqExist(g.files, `الخطوة «${s.id}» بوابة files_read`); }
  if (def.totalMin !== undefined && def.totalMin !== null && typeof def.totalMin !== "number") P.push("totalMin ليس رقماً");
  return P;
}

/* ── recognising a pipeline command ──────────────────────────────────────────────────────────────────────────────── */
const INTERP = /^(node|bash|sh|python3?|py|bun|npx)(\.exe)?$/i;
const tokenize = (s) => [...String(s).matchAll(/"([^"]*)"|'([^']*)'|(\S+)/g)].map((m) => m[1] ?? m[2] ?? m[3]);
/** the interpreter invocations inside a shell line: [{tool: "tools/x.mjs", args:[…]}] (follows `bash tools/bg.sh label -- node …`, `cd x && node …`, env prefixes) */
export function invocations(cmd) {
  const out = [];
  for (const seg of String(cmd ?? "").split(/&&|\|\||;|\r?\n|\|/)) {
    let tk = tokenize(seg.trim()); if (!tk.length) continue;
    const dd = tk.indexOf("--"); if (/(^|[\\/])bg\.sh$/.test(tk[1] ?? "") && dd > 0) tk = tk.slice(dd + 1);
    while (tk.length && /^[A-Za-z_][\w]*=/.test(tk[0])) tk.shift();
    if (!tk.length) continue;
    const base = norm(tk[0]).split("/").pop();
    if (!INTERP.test(base) && !/python(\.exe)?$/i.test(base)) continue;
    let i = 1; while (i < tk.length && tk[i].startsWith("-") && !/^tools[\\/]/.test(norm(tk[i]))) i++;
    const sc = norm(tk[i] ?? ""), m = sc.match(/(?:^|\/)(tools\/[^\s]+)$/); if (!m) continue;
    out.push({ tool: m[1], args: tk.slice(i + 1), raw: seg.trim() });
  }
  return out;
}
/** {tool, args:[leading skeleton args of a cmd]} for matching: leading tokens that are not flags and not placeholders other than {p}/{c} */
export function signatureOf(argv) {
  const a = argv.map(String), i = a.findIndex((t) => /^tools\/.+\.(mjs|py|sh|js)$/.test(norm(t))); if (i < 0) return null;
  const args = []; for (const t of a.slice(i + 1)) { if (t.startsWith("--") || (/\{\w+\}/.test(t) && !/^\{[pc]\}$/.test(t)) || /^\{file:/.test(t)) break; args.push(t); }
  return { tool: norm(a[i]), args };
}
const guardedEntryFor = (def, tool, args) => (def.guarded ?? []).find((g) => g.tool === tool && (!g.subs || g.subs.includes(args[0])) && (!g.notSubs || !g.notSubs.includes(args[0])));
/** the guarded entry an invocation hits (flags: only with one of the flags), or null = not a pipeline command */
export function guardedHit(def, inv) {
  for (const g of def.guarded ?? []) {
    if (g.tool !== inv.tool) continue;
    if (g.subs && !g.subs.includes(inv.args[0])) continue;
    if (g.notSubs && g.notSubs.includes(inv.args[0])) continue;
    if (g.flags && !g.flags.some((f) => inv.args.includes(f))) continue;
    return g;
  }
  return null;
}
const argMatch = (tpl, val, run) => {
  if (tpl === "{p}") return norm(val).toLowerCase() === run.p.toLowerCase();
  if (tpl === "{c}") return run.clips.some((c) => c.toLowerCase() === norm(val).toLowerCase()) || norm(val).toLowerCase() === run.p.toLowerCase();
  return norm(tpl) === norm(val);
};
/** does a step's command or `allow` entry permit this invocation */
export function stepAllows(step, inv, run) {
  const sigs = [...(step.cmds ?? (step.cmd ? [step.cmd] : [])).map(signatureOf).filter(Boolean), ...(step.allow ?? []).map((a) => ({ tool: a.tool, args: a.args ?? [] }))];
  return sigs.some((s) => s.tool === inv.tool && s.args.every((t, i) => inv.args[i] !== undefined && argMatch(t, inv.args[i], run)));
}

/* ── the machine: what is done, running, current, allowed ────────────────────────────────────────────────────────── */
const alive = pidAlive;
export function newState(def, p, extra = {}) {
  return { kind: def.kind, project: p, defPath: extra.defPath ?? null, t0: Date.now(), args: extra.args ?? {}, steps: {}, clips: [], active: true, ...extra.more };
}
const ctxOf = (root, def, st) => ({ root, def, state: st, p: st.project, args: st.args ?? {}, clips: clipsFor(root, def, st) });
const GATE_CHEAP = new Set(["files_read", "files", "any_files", "json_clips", "json_covers_clips", "board_lane", "fast_clock", "fast_checks_ok", "log_has", "evidence", "arg_set", "hadith_verified", "perclip_artifacts", "queue_jobs", "render_done", "final_ok"]);

/** bring the state up to date WITHOUT side effects beyond the state: a finished runner's step whose gate passes is done; a dead runner is failed; a watch step whose gate passes is done */
export async function reconcile(root, def, st, { cheap = false } = {}) {
  const ctx = ctxOf(root, def, st); let changed = false;
  for (const s of def.steps) {
    const ss = stepState(st, s.id); if (ss.status !== "running") continue;
    const finished = ss.exit !== undefined && ss.exit !== null, runnerAlive = ss.pid && alive(ss.pid);
    const cheapOk = !cheap || (s.gate ?? []).every((g) => GATE_CHEAP.has(g.type));
    const set = (status, why) => { ss.status = status; ss.endedAt = Date.now(); if (why) ss.why = why; changed = true; };
    if (s.type === "auto") {
      if (!finished) { if (!runnerAlive) set("failed", "مات المشغّل بلا نتيجة"); continue; }
      if (ss.exit !== 0) { set("failed", ss.why ?? `خرج برمز ${ss.exit}`); continue; }
      if (!(s.gate ?? []).length) { set("done"); continue; }
      if (!cheapOk) continue;
      const r = await checkGates(s, ctx);
      if (r.ok) set("done"); else if (!s.async) set("failed", r.why); else ss.waiting = r.why;
    } else if (s.type === "watch" && (s.gate ?? []).length && cheapOk) {
      const r = await checkGates(s, ctx); if (r.ok) set("done"); else ss.waiting = r.why;
    }
  }
  return changed;
}
/** reconcile, then write ONLY the step fields reconcile changed, inside the state lock, and only when the runner has not touched that step since the snapshot (its status, exit, pid and start are the
    same). A runner's newer item result is never overwritten by this stale snapshot (the old `Object.assign(st.steps, snapshot)` replaced whole steps, items included). */
export async function reconcileAndSave(root, p, def, st, opts) {
  const before = JSON.parse(JSON.stringify(st.steps ?? {})), changed = await reconcile(root, def, st, opts), patch = {};
  const base = (x) => ({ status: x?.status ?? null, exit: x?.exit ?? null, pid: x?.pid ?? null, startedAt: x?.startedAt ?? null });
  for (const [id, now] of Object.entries(st.steps ?? {})) {
    const was = before[id] ?? {}, set = {};
    for (const k of Object.keys(now)) if (k !== "items" && JSON.stringify(now[k]) !== JSON.stringify(was[k])) set[k] = now[k];
    if (Object.keys(set).length && before[id]) patch[id] = { base: base(was), set };
  }
  if (Object.keys(patch).length) editState(root, p, (cur) => {
    for (const [id, { base: b, set }] of Object.entries(patch)) { const x = cur.steps?.[id]; if (x && JSON.stringify(base(x)) === JSON.stringify(b)) Object.assign(x, set); }
  });
  return changed;
}
const stepBy = (def, id) => def.steps.find((x) => x.id === id);
/** A per-clip dependency releases that clip when it passed or explicitly lists safe continuation artifacts. */
const continueFiles = (s, dep) => s.continueAfter?.[dep] ?? [];
export function itemFingerprint(root, st, s, clip) {
  if (!Array.isArray(s.fingerprintFiles) || !s.fingerprintFiles.length) return null;
  const h = crypto.createHash("sha256"), ctx = { root, p: st.project, c: clip, clips: [clip], args: st.args ?? {} };
  for (const template of s.fingerprintFiles) {
    const rel = fill(template, ctx), f = path.join(root, rel); h.update(norm(rel));
    try {
      const stat = fs.statSync(f); h.update(`${stat.size}:${stat.mtimeMs}`);
      if (stat.size <= 16 * 1024 * 1024) { const data = fs.readFileSync(f); h.update(data); }
    } catch { h.update("<missing>"); }
  }
  return h.digest("hex");
}
const filesAvailable = (root, st, p, clip, files) => files.length > 0 && files.every((f) => {
  const rel = fill(f, { root, p, c: clip, clips: clip ? [clip] : [], args: st.args ?? {} });
  if (!fileOk(root, rel)) return false;
  if (!/\.render\.ok$/.test(rel)) return true;
  const proof = rd(path.join(root, rel), null), queue = rd(path.join(root, "data", "render_queue", "state.json"), { jobs: [] }).jobs ?? [];
  const job = [...queue].reverse().find((j) => j.spec === proof?.spec && j.orient === proof?.orient);
  return job?.state === "done" && job.inputFingerprint === proof?.inputFingerprint && Boolean(proof.file) && fileOk(root, proof.file);
});
export function itemDepsReady(def, st, s, clip, root = ROOT) {
  const required = s.requiresFiles ?? [];
  if (required.length && !filesAvailable(root, st, st.project, clip, required)) return false;
  return s.deps.every((d) => {
    const ds = stepState(st, d), dd = stepBy(def, d);
    if (ds.status === "done" || ds.status === "skipped") return true;
    if (s.foreach === "clips" && dd?.foreach === "clips" && ds.items?.[clip]?.status === "done") return true;
    return filesAvailable(root, st, st.project, clip, continueFiles(s, d));
  });
}
export function depsReady(root, def, st, s) {
  return s.deps.every((d) => {
    const ds = stepState(st, d), dd = stepBy(def, d);
    if (ds.status === "done" || ds.status === "skipped") return true;
    if (s.continueAfterAny?.includes(d) && dd?.foreach === "clips" && Object.values(ds.items ?? {}).some((item) => item.status === "done")) return true;
    const required = continueFiles(s, d);
    if (!required.length) return false;
    if (dd?.foreach === "clips") { const clips = clipsFor(root, def, st); return clips.length > 0 && clips.every((c) => filesAvailable(root, st, st.project, c, required)); }
    return filesAvailable(root, st, st.project, null, required);
  });
}
/** Per-clip steps can resume independent items whose own prerequisites passed. */
export function evaluate(def, st, root = ROOT) {
  const by = stepsById(def), rows = def.steps.map((s) => { const ss = stepState(st, s.id); return { s, ss, status: ss.status }; });
  const running = rows.filter((r) => r.status === "running");
  const eligible = rows.filter((r) => {
    if (!["pending", "failed", "partial"].includes(r.status)) return false;
    if (r.s.foreach !== "clips") return depsReady(root, def, st, r.s);
    return clipsFor(root, def, st).some((c) => {
      const item = r.ss.items?.[c], status = item?.status ?? "pending";
      // Unknown fingerprints are not permission to repeat the same expensive job.
      // The explicit `retry` command resets only the selected item after diagnosis.
      const retryChanged = status === "failed" && Boolean(item.failureFingerprint && item.failureFingerprint !== itemFingerprint(root, st, r.s, c));
      return (status === "pending" || retryChanged) && itemDepsReady(def, st, r.s, c, root);
    });
  });
  const done = rows.filter((r) => r.status === "done" || r.status === "skipped");
  const open = rows.filter((r) => r.status !== "done" && r.status !== "skipped");
  const exclusiveRunning = running.find((r) => r.s.exclusive);
  let current = eligible[0] ?? running[0] ?? null, parallel = [];
  if (current && exclusiveRunning && current !== exclusiveRunning) { current = exclusiveRunning; parallel = []; }
  else if (current?.s.exclusive && eligible[0] === current) parallel = [];
  else parallel = [...eligible, ...running].filter((r) => r !== current && !r.s.exclusive);
  const allowed = exclusiveRunning ? [exclusiveRunning] : current?.s.exclusive && eligible[0] === current ? [current, ...running] : [...new Set([...running, ...eligible])];
  return { rows, running, eligible, done, open, current, parallel, allowed, complete: !open.length, by };
}
export const remainingText = (def, st, ev = evaluate(def, st)) => {
  const total = def.totalMin ?? null, el = (Date.now() - st.t0) / 60000;
  const s = ev.current?.s; if (!s) return "";
  const ss = ev.current.ss; let own;
  if (s.budgetMin === null || s.budgetMin === undefined) own = "غير مقيس";
  else { const spent = ss.startedAt ? (Date.now() - ss.startedAt) / 60000 : 0; const left = s.budgetMin - spent; own = left >= 0 ? `${left.toFixed(1)} د من ميزانيتها ${s.budgetMin}` : `تجاوزت ميزانيتها ${s.budgetMin} د بـ${(-left).toFixed(1)}`; }
  const all = total ? ` · الكلي ${Math.max(0, total - el).toFixed(0)} د من ${total}` : "";
  return `${own}${all}`;
};
/** the one line of every prompt and every tool: «الخطوة الحالية: … — المتبقي: … د» */
export function lineOf(def, st, ev = evaluate(def, st)) {
  if (ev.complete) return `الخطوات كلها تمّت (${def.kind} «${st.project}»).`;
  const c = ev.current; if (!c) return "";
  const who = c.status === "running" ? "جارية" : c.s.type === "creative" ? "عليّ" : c.s.type === "guided" ? "عليّ بالأمر" : "ينفّذها المُوصِل";
  return `الخطوة الحالية: ${c.s.ar} [${c.s.id}] (${who}) — المتبقي: ${remainingText(def, st, ev)} — الأمر: node tools/conduct.mjs next`;
}

/** the active run of THIS session (or any, when unbound), or null */
export async function activeRun(root, sessionId, { cheap = true } = {}) {
  const a = rd(activeFile(root), null); if (!a?.project) return null;
  if (a.session && sessionId && a.session !== sessionId) return null;      // another session's run does not bind this one
  if (Date.now() - (a.at ?? 0) > 24 * 3600e3) return null;
  const st = readState(root, a.project); if (!st?.active) return null;
  const L = loadDef(st.defPath ?? st.kind, root); if (!L.def) return null;
  await reconcileAndSave(root, a.project, L.def, st, { cheap });
  return { a, st, def: L.def, root };
}
/* ── what I READ is seen by the hook (user 2026-11-22: «كيف ألزمك أنك ما تنفذ شيء إلا بعد الرجوع إلى المهارات والتعليمات؟») ─────────────────────────────────────────────
   Every Read of the main session (and a whole-file cat, and a grep over a file) is recorded with its line range and its time: .tmp/conduct_reads_<session>.json always, and
   .tmp/<project>/conduct_reads.json too while a run is active. A step's gate and a pipeline command both ask: were the required files read WHOLE (the union of the ranges that
   were read after the run started covers every line), or — for a file marked «search» — touched by any read or grep. */
const lc = (s) => norm(s).toLowerCase().replace(/^\/([a-z])\//, "$1:/");
export const relTo = (root, p) => { const n = lc(p), r = lc(root).replace(/\/+$/, ""); return n.startsWith(r + "/") ? n.slice(r.length + 1) : n.replace(/^\.\//, ""); };
const toFs = (root, p) => { const n = norm(p).replace(/^\/([A-Za-z])\//, "$1:/"); return path.isAbsolute(n) ? n : path.join(root, n); };
export const readsFile = (root, sid) => path.join(root, ".tmp", `conduct_reads_${String(sid || "none").replace(/[^\w-]/g, "_")}.json`);
const lineCount = (f) => { try { const t = fs.readFileSync(f, "utf8"); return t.split("\n").length - (t.endsWith("\n") ? 1 : 0); } catch { return 0; } };
export function recordRead(root, sid, file, { offset, limit, search = false, whole = false } = {}, project = null) {
  const rel = relTo(root, file), total = lineCount(toFs(root, file)), a = Math.max(1, Number(offset) || 1), b = whole ? total : Math.min(total, a + (Number(limit) || 2000) - 1);
  const now = Date.now();
  for (const f of [readsFile(root, sid), project ? path.join(root, ".tmp", project, "conduct_reads.json") : null].filter(Boolean)) {
    const d = rd(f, {}), e = (d[rel] ??= { total, reads: [], searches: [] }); e.total = total;
    if (search) e.searches = [...(e.searches ?? []), now].slice(-20); else e.reads = [...(e.reads ?? []), { a, b, at: now }].slice(-60);
    try { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(d)); } catch { /* the next read records again */ }
  }
}
const covered = (e, mode, since) => {
  if (!e) return false;
  if (mode === "search" || mode === "any") return (e.reads ?? []).some((r) => r.at >= since) || (e.searches ?? []).some((t) => t >= since);
  const rs = (e.reads ?? []).filter((r) => r.at >= since).map((r) => [r.a, r.b]).sort((x, y) => x[0] - y[0]); if (!rs.length) return false;
  if (!e.total) return true;
  let reach = 0; for (const [a, b] of rs) { if (a > reach + 1) return false; reach = Math.max(reach, b); if (reach >= e.total) return true; }
  return reach >= e.total;
};
export const requiresOf = (def, step) => { const seen = new Set(), out = []; for (const x of [...(def.defaultRequires ?? []), ...(step?.requires ?? []), ...(step?.gate ?? []).filter((g) => g.type === "files_read").flatMap((g) => g.files ?? [])]) { const r = typeof x === "string" ? { file: x } : x, k = lc(r.file); if (!seen.has(k)) { seen.add(k); out.push({ file: r.file, mode: r.mode ?? "whole" }); } } return out; };
/** the required files not yet read (after `since`) by this session (a session id) or by the run's bound session (the mirror file) */
export function unreadFor(root, sid, project, requires, since = 0) {
  const d = sid ? rd(readsFile(root, sid), {}) : rd(path.join(root, ".tmp", project, "conduct_reads.json"), {});
  return requires.filter((r) => !covered(d[lc(r.file)], r.mode, since));
}
/** a tool call of the main session → the reads it makes: Read, a whole-file cat, a grep over a file */
export function noteTool(root, sid, tool, ti, project = null, cwd = null) {
  const at = (f) => (path.isAbsolute(norm(f)) || /^\/[A-Za-z]\//.test(norm(f)) ? f : path.join(cwd || root, f));
  if (tool === "Read" && ti.file_path) return recordRead(root, sid, at(ti.file_path), { offset: ti.offset, limit: ti.limit }, project);
  if (tool === "Grep" && ti.path) return recordRead(root, sid, at(ti.path), { search: true }, project);
  if ((tool === "Bash" || tool === "PowerShell") && ti.command) {
    const c = String(ti.command), piped = /\|/.test(c.replace(/\|\|/g, ""));
    for (const seg of c.split(/&&|\|\||;|\r?\n|\|/)) {
      const tk = tokenize(seg.trim()), b = norm(tk[0] ?? "").split("/").pop().toLowerCase().replace(/\.exe$/, "");
      const files = tk.slice(1).filter((t) => !t.startsWith("-") && /[./\\]/.test(t));
      if (["cat", "get-content", "gc", "type"].includes(b) && files.length === 1 && !piped) recordRead(root, sid, at(files[0]), { whole: true }, project);
      else if (["grep", "egrep", "rg", "select-string", "sls", "findstr"].includes(b)) for (const f of files) if (fs.existsSync(toFs(root, at(f)))) recordRead(root, sid, at(f), { search: true }, project);
    }
  }
}

/* ── the user's own words (so `end` cannot be closed on a quote I made up) ──────────────────────────────────────────────────────────────────────────── */
export const promptsFile = (root) => path.join(root, ".tmp", "user_prompts.jsonl");
export function recordPrompt(root, sid, text) {
  try {
    const f = promptsFile(root); let L = []; try { L = fs.readFileSync(f, "utf8").split(/\r?\n/).filter(Boolean); } catch { /* first */ }
    L.push(JSON.stringify({ at: Date.now(), session: sid ?? null, text: String(text ?? "").slice(0, 4000) })); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, L.slice(-60).join("\n") + "\n");
  } catch { /* never block a prompt */ }
}
const fold = (s) => String(s ?? "").replace(/[ً-ْـ]/g, "").replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/\s+/g, " ").trim().toLowerCase();
export function userSaid(root, said, since = 0) {
  const q = fold(said); if (q.length < 6) return false;
  try { return fs.readFileSync(promptsFile(root), "utf8").split(/\r?\n/).filter(Boolean).some((l) => { const o = JSON.parse(l); return o.at >= since && fold(o.text).includes(q); }); } catch { return false; }
}

/* ── the log of every refused attempt ────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
export const violationsFile = (root) => path.join(root, "data", "conduct_violations.jsonl");
export function logViolation(root, { session = null, project = null, step = null, tried = "", why = "" } = {}) {
  try { fs.mkdirSync(path.dirname(violationsFile(root)), { recursive: true }); fs.appendFileSync(violationsFile(root), JSON.stringify({ at: new Date().toISOString(), session, project, step, tried: String(tried).slice(0, 240), why: String(why).slice(0, 240) }) + "\n"); } catch { /* the refusal stands without its log */ }
}
export function violationsSummary(root, project = null) {
  let L = []; try { L = fs.readFileSync(violationsFile(root), "utf8").split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l)); } catch { /* none */ }
  const mine = project ? L.filter((o) => o.project === project) : L;
  return { n: mine.length, total: L.length, last: mine[mine.length - 1] ?? null };
}

/* ── reading a shell line the way a shell would: wrappers are opened, never trusted ───────────────────────────────────────────────────────────────── */
const SHELLS = new Set(["bash", "sh", "zsh", "dash"]), CODE_INTERP = new Set(["node", "bun", "deno", "python", "python3", "py", "perl", "ruby", "bash", "sh", "zsh", "dash"]);
const READERS = new Set(["grep", "egrep", "fgrep", "rg", "cat", "head", "tail", "less", "more", "wc", "ls", "dir", "find", "diff", "stat", "test", "[", "type", "gc", "get-content", "select-string", "sls", "findstr", "get-childitem", "gci", "tree", "sort", "uniq", "file", "du", "realpath", "basename", "dirname", "cd", "pushd", "popd", "set-location", "sl", "echo", "printf", "write-output", "ls-files", "pwd", "which", "where", "tasklist", "ps", "date", "sleep", "start-sleep", "true", "false", "export", "set"]);
const GIT_READ = new Set(["add", "commit", "diff", "log", "status", "show", "blame", "ls-files", "rev-parse", "branch", "config", "remote", "fetch", "describe", "shortlog", "grep", "cat-file"]);
const baseOf = (t) => norm(t ?? "").split("/").pop().toLowerCase().replace(/\.exe$/, "");
const basenames = (def) => [...new Set((def.guarded ?? []).map((g) => path.basename(g.tool).toLowerCase()))];
export const mentionsGuarded = (def, text) => { const t = lc(text); return basenames(def).some((b) => t.includes(b)); };
const dirOf = (cmd) => cmd;
/** {invs:[{tool,args,raw}], wrapped:[why…], bodies:[script texts scanned]} — a shell wrapper (bash -c, cmd /c, powershell -Command, eval, xargs, node -e, a script file outside tools/) is opened;
    what cannot be seen into (an encoded command, a script that names a guarded tool, stdin fed to an interpreter) is reported as `wrapped` */
export function scanCommand(def, cmd, root, depth = 0) {
  const out = { invs: [], wrapped: [], bodies: [] }; if (depth > 4) { out.wrapped.push("تداخل أغلفة أعمق من المسموح"); return out; }
  const whole = String(cmd ?? ""), merge = (r) => { out.invs.push(...r.invs); out.wrapped.push(...r.wrapped); out.bodies.push(...r.bodies); };
  for (const seg of whole.split(/&&|\|\||;|\r?\n|\|/)) {
    let tk = tokenize(seg.trim()); while (tk.length && (tk[0] === "&" || /^(sudo|time|nohup|command|call|exec|env)$/i.test(tk[0]) || /^[A-Za-z_]\w*=/.test(tk[0]))) tk.shift();
    if (!tk.length) continue;
    const b = baseOf(tk[0]), raw = seg.trim();
    if (/(^|[\\/])bg\.sh$/.test(tk[1] ?? "") && tk.includes("--")) { merge(scanCommand(def, tk.slice(tk.indexOf("--") + 1).join(" "), root, depth + 1)); continue; }
    if (b === "git" && GIT_READ.has(tk[1] ?? "")) continue;
    if (SHELLS.has(b)) { const i = tk.findIndex((t, k) => k > 0 && /^-[a-z]*c$/i.test(t)); if (i > 0 && tk[i + 1] !== undefined) { merge(scanCommand(def, tk.slice(i + 1).join(" "), root, depth + 1)); continue; } }
    if (b === "cmd") { const i = tk.findIndex((t) => /^\/[ck]$/i.test(t)); if (i > 0) { merge(scanCommand(def, tk.slice(i + 1).join(" "), root, depth + 1)); continue; } }
    if (b === "powershell" || b === "pwsh") {
      if (tk.some((t) => /^-e(nc|ncodedcommand)?$/i.test(t))) { out.wrapped.push("أمر مشفّر (-EncodedCommand)"); continue; }
      const i = tk.findIndex((t) => /^-(c|command)$/i.test(t)); if (i > 0) { merge(scanCommand(def, tk.slice(i + 1).join(" "), root, depth + 1)); continue; }
    }
    if (["eval", "iex", "invoke-expression", "xargs", "start-process", "start", "source", ".", "invoke-command", "icm", "wsl"].includes(b)) {
      const r = scanCommand(def, tk.slice(1).join(" "), root, depth + 1); merge(r);
      if (!r.invs.length && mentionsGuarded(def, whole)) out.wrapped.push(`${tk[0]}: أمر إجراء داخل ما لا يُرى`); continue;
    }
    if (CODE_INTERP.has(b) || /^python/.test(b)) {
      const ci = tk.findIndex((t, k) => k > 0 && /^(-e|-p|--eval|--print|-c|-ec|-pe)$/i.test(t));
      if (ci > 0) { const code = tk.slice(ci + 1).join(" "); if (mentionsGuarded(def, code)) out.wrapped.push(`${b} ${tk[ci]}: كود يذكر أداة إجراء`); out.bodies.push(code); continue; }
      let i = 1; while (i < tk.length && tk[i].startsWith("-") && tk[i] !== "-") i++;
      const sc = tk[i];
      if (sc === undefined || sc === "-") { if (mentionsGuarded(def, whole)) out.wrapped.push(`${b} بلا ملف (يقرأ من المدخل أو heredoc) وفي الأمر أداة إجراء`); out.bodies.push(whole); continue; }
      const m = norm(sc).match(/(?:^|\/)(tools\/[^\s]+)$/);
      if (m) { out.invs.push({ tool: m[1], args: tk.slice(i + 1), raw }); continue; }
      const f = toFs(root, sc); let body = ""; try { if (fs.statSync(f).size < 400e3) body = fs.readFileSync(f, "utf8"); } catch { /* not a file */ }
      if (body) { out.bodies.push(body); if (mentionsGuarded(def, body)) out.wrapped.push(`ملف ${path.basename(sc)} خارج tools/ يذكر أداة إجراء`); }
      continue;
    }
    if (/\.sh$/i.test(tk[0])) { const f = toFs(root, tk[0]); let body = ""; try { if (fs.statSync(f).size < 400e3) body = fs.readFileSync(f, "utf8"); } catch { /* none */ } const m = norm(tk[0]).match(/(?:^|\/)(tools\/[^\s]+)$/); if (m) out.invs.push({ tool: m[1], args: tk.slice(1), raw }); else { out.bodies.push(body); if (mentionsGuarded(def, body)) out.wrapped.push(`ملف ${path.basename(tk[0])} خارج tools/ يذكر أداة إجراء`); } continue; }
    if (!READERS.has(b) && mentionsGuarded(def, seg)) out.wrapped.push(`«${tk[0]}» يذكر أداة إجراء ولا يُعرف كيف يشغّلها`);
  }
  return out;
}

/* ── the files the hook and the plans live in: an edit needs the user's «ask» (a sub-agent too); the machine's own state may not be written by hand at all ── */
export const CONDUCT_PROTECTED = [/^tools\/hooks\//, /^tools\/conduct\.mjs$/, /^tools\/lib\/conduct_core\.mjs$/, /^data\/pipelines\/[^/]+\.json$/];
export const MACHINE_STATE = [/^\.tmp\/[^/]+\/conduct\.json$/, /^\.tmp\/conduct_(active|pending_owner)\.json$/, /^\.tmp\/conduct_reads/, /^\.tmp\/[^/]+\/conduct_reads\.json$/, /^data\/conduct_violations\.jsonl$/, /^\.tmp\/user_prompts\.jsonl$/];
export const isProtected = (rel) => CONDUCT_PROTECTED.some((re) => re.test(String(rel)));
export const isMachineState = (rel) => MACHINE_STATE.some((re) => re.test(String(rel)));
const PROT_TEXT = [/tools\/hooks\/[^\s"'|;&]+/i, /tools\/conduct\.mjs/i, /tools\/lib\/conduct_core\.mjs/i, /data\/pipelines\/[\w.-]+/i], STATE_TEXT = [/\.tmp\/[\w.-]+\/conduct\.json/i, /\.tmp\/conduct_(active|pending_owner)\.json/i, /conduct_reads/i, /conduct_violations\.jsonl/i, /user_prompts\.jsonl/i];
const WRITE_VERB = /(^|[\s;&|(`])(rm|rmdir|del|erase|mv|move|cp|copy|ren|rename|tee|truncate|unlink|Remove-Item|Move-Item|Copy-Item|Rename-Item|Set-Content|Add-Content|Out-File|Clear-Content|New-Item|sed\s+-i\S*|perl\s+-i\S*|git\s+(checkout|restore|reset|stash|clean|apply|rm|mv|revert))(\s|$)|writeFileSync|appendFileSync|rmSync|unlinkSync|renameSync|copyFileSync|writeFile\(|appendFile\(|createWriteStream|write_text|write_bytes|shutil\.(copy|move|rmtree)|os\.(remove|rename|replace|unlink)|\[IO\.File\]::(Write|Delete|Move|Copy)|open\([^)]*['"][wax]\+?['"]/i;
/** a shell line that WRITES to a protected plan/hook file (→ ask) or to the machine's state (→ deny); reading it (grep, cat, git diff…) is free */
export function bashProtected(cmd, root, bodies = []) {
  const text = norm(cmd), segs = text.split(/&&|\|\||;|\r?\n|\|/);
  const hits = (list) => list.flatMap((re) => { const m = text.match(re); return m ? [m[0]] : []; });
  const check = (list, kind) => {
    const mentioned = [...hits(list), ...bodies.flatMap((b) => list.flatMap((re) => { const m = norm(b).match(re); return m ? [m[0]] : []; }))]; if (!mentioned.length) return null;
    const nonReader = segs.filter((s) => list.some((re) => re.test(s))).filter((s) => { const tk = tokenize(s.trim()); const b = baseOf(tk[0]); return !(READERS.has(b) || (b === "git" && GIT_READ.has(tk[1] ?? ""))); });
    const inBodies = bodies.some((b) => list.some((re) => re.test(norm(b))) && WRITE_VERB.test(b));
    const redirect = list.some((re) => new RegExp(">>?\\s*[\"']?[^\\s\"'|;&<>]*" + re.source.replace(/^\(\^\|\\\/\)/, ""), "i").test(text));
    if (redirect || (nonReader.length && WRITE_VERB.test(text)) || inBodies) return { kind, file: mentioned[0] };
    return null;
  };
  return check(STATE_TEXT, "deny") ?? check(PROT_TEXT, "ask");
}

const FLAGS_FREE = /(^|\s)(--help|-h|--dry|--dry-run)(\s|$)/;
const stepOfAllowed = (ev, inv, ctx) => ev.allowed.find((r) => {
  if (!stepAllows(r.s, inv, ctx)) return false;
  if (r.s.foreach !== "clips") return true;
  return ctx.clips.some((c) => {
    const item = r.ss.items?.[c], status = item?.status ?? "pending";
    const changed = status === "failed" && Boolean(item.failureFingerprint && item.failureFingerprint !== itemFingerprint(ctx.root, ctx.state, r.s, c));
    return inv.args.includes(c) && (status === "pending" || changed) && itemDepsReady(ctx.def, ctx.state, r.s, c, ctx.root);
  });
});
/** the PreToolUse verdict: null = free, else the Arabic refusal (and one line in data/conduct_violations.jsonl) */
export async function hookVerdict(root, sessionId, cmd, { agentId, run: given } = {}) {
  if (agentId) return null;                                                    // a sub-agent works on delegated tasks beside the main session
  const run = given ?? await activeRun(root, sessionId); if (!run) return null;
  const { def, st } = run, ev = evaluate(def, st, root); if (ev.complete) return null;
  const ctx = { root, def, state: st, p: st.project, clips: clipsFor(root, def, st) }, cur = ev.current;
  const refuse = (tried, shortWhy, text) => { logViolation(root, { session: sessionId, project: st.project, step: cur?.s.id ?? null, tried, why: shortWhy }); return text; };
  const head = `ليس هذا أوانه — الإجراء المعتمد (${def.ar ?? def.kind}، «${st.project}») يمشي بالترتيب ويقرّر المُوصِل التالي لا الذاكرة (أمر المستخدم 2026-11-22: «كيف أنت تلتزم بالخطة الموجودة عندنا، دائماً تبقى ملتزم»).\n`;
  const fillCtx = { root, p: st.project, args: st.args, clips: ctx.clips, ...(def.single ? { c: st.project } : {}) };
  const curText = () => (cur ? `الخطوة الحالية: ${cur.s.ar} [${cur.s.id}] — ${cur.s.skill}\n${(cur.s.cmds ?? (cur.s.cmd ? [cur.s.cmd] : [])).length ? `أمرها: ${(cur.s.cmds ?? [cur.s.cmd]).map((a) => fillArgv(a, fillCtx).join(" ")).join(" ثم ")}\n` : cur.s.creative?.what ? `المطلوب منك: ${cur.s.creative.what.slice(0, 220)}\n` : ""}` : "لا خطوة متاحة الآن (تنتظر ما يجري في الخلفية).\n");
  const tail = `المتبقي: ${remainingText(def, st, ev)}.\nاطبع الخطوة: node tools/conduct.mjs next   ·   الجدول: node tools/conduct.mjs status`;
  const sc = scanCommand(def, cmd, root);
  const hit = sc.invs.map((i) => ({ i, g: guardedHit(def, i) })).filter((x) => x.g);
  if (!sc.wrapped.length && !hit.length) return null;
  if (FLAGS_FREE.test(String(cmd)) && !sc.wrapped.length) return null;
  if (sc.wrapped.length) return refuse(String(cmd).slice(0, 200), `غلاف: ${sc.wrapped[0]}`, head + `الأمر المرفوض: ${String(cmd).slice(0, 140)}\nالسبب: غلاف يُخفي أمر الإجراء عن الحارس (${sc.wrapped[0]}). أمر الإجراء يُكتب مباشراً: node tools/… أو bash tools/… بلا bash -c ولا node -e ولا ملف خارج tools/، وإلا فالخطوة التالية يقررها المُوصِل.\n` + curText() + tail);
  for (const { i } of hit) {
    const r = stepOfAllowed(ev, i, ctx);
    if (!r) {
      const clipNote = /^tools\/stage\.mjs$/.test(i.tool) && ["prep", "cut"].includes(i.args[0]) && ctx.clips.some((c) => c.toLowerCase() === norm(i.args[1] ?? "").toLowerCase()) ? "\n«مقطع من بث: لا تجهيز ولا قص له وحده» (مهارة الدروس والبثوث، البند 14: القص مرة واحدة ثم شرائح)." : "";
      const others = ev.allowed.filter((x) => x !== cur).map((x) => `${x.s.ar} [${x.s.id}]`);
      return refuse(i.raw, `ليس أوانه (الحالية ${cur?.s.id ?? "—"})`, head + `الأمر المرفوض: ${i.raw.slice(0, 140)}${clipNote}\n` + curText() + (others.length ? `المسموح معها بالتوازي: ${others.slice(0, 6).join("، ")}\n` : "") + tail);
    }
    const need = unreadFor(root, sessionId, st.project, requiresOf(def, r.s), st.t0);
    if (need.length) return refuse(i.raw, `لم تُقرأ مهارة الخطوة «${r.s.id}»: ${need.map((n) => n.file).join("، ")}`, `لا تنفيذ قبل الرجوع إلى المهارة (أمر المستخدم 2026-11-22: «كيف ألزمك أنك ما تنفذ شيء إلا بعد الرجوع إلى المهارات والتعليمات؟»).\nالأمر المرفوض: ${i.raw.slice(0, 140)}\nالخطوة: ${r.s.ar} [${r.s.id}] — ${r.s.skill}\nاقرأ الآن بأداة القراءة (الملف كله لا مقتطف، بعد بدء هذا التشغيل): ${need.map((n) => `${norm(root)}/${norm(n.file)}${n.mode === "whole" ? "" : " (بحث يكفي)"}`).join(" ، ")}\nثم أعد الأمر.`);
  }
  return null;
}

export async function hookLine(root, sessionId) {
  const run = await activeRun(root, sessionId); if (!run) return "";
  return lineOf(run.def, run.st);
}

/* ── the Stop hook's two checks ──────────────────────────────────────────────────────────────────────────────────── */
export const proseOf = (t) => String(t ?? "").replace(/```[\s\S]*?```/g, " ").replace(/`[^`]*`/g, " ").replace(/https?:\/\/\S+/g, " ");
const NEG_BEFORE = /(لم|لا|لن|ليس|ليست|غير|قبل|بعد|حتى|إلى أن|ما زال|ما زالت|لمّا|متى|حين|عندما|إن|إذا|هل|سوف|سأ|سي|يجب|بمجرد)\s*(\S+\s+){0,2}$/;
/** a final reply that CLAIMS the job finished (the whole video job, not a step) */
export function claimsDone(text) {
  const t = proseOf(text);
  const RE = /(انتهيتُ|انتهينا|أنهيتُ|أنهينا|أنجزتُ|أنجزنا|اكتمل(ت)? (كل|العمل|المونتاج|التقطيع|البث|الحلقة|المقاطع|الرندر)|تمّ?(ت)? (العمل|المونتاج|التقطيع|كل شيء|الإنجاز|البث|الحلقة)|(كل|جميع) (المقاطع|الخطوات|الأمور) (جاهزة|تمّت|تمت|اكتملت|انتهت)|(البث|الحلقة|المونتاج|الفيديو|المقاطع) (جاهز|جاهزة|انتهى|انتهت|اكتمل|اكتملت)|✅\s*(انتهيت|تم|جاهز|اكتمل))/g;
  return [...t.matchAll(RE)].some((m) => !NEG_BEFORE.test(t.slice(Math.max(0, m.index - 28), m.index)));
}
/** the kinds a reply names (stream/lesson/episode/reel …) */
export function kindsNamed(text, root = ROOT) {
  const t = proseOf(text), out = new Set();
  for (const [k, v] of Object.entries(loadKinds(root))) for (const w of v.words ?? []) if (new RegExp(`(^|[^ء-ي])(و|ف|ل|لل|ب)?${w}(ها|هم|ه|ات|ين|ان)?($|[^ء-ي])`).test(t)) out.add(k);
  return [...out];
}
/** a reply that PRESENTS a plan / timeline / time estimate (not a question, not a plain report) */
export function presentsPlan(text) {
  const t = proseOf(text);
  const lines = t.split(/\r?\n/), list = lines.filter((l) => /^\s*([0-9٠-٩]+\s*[.\-)\u066B]|[-•*▪◦]|[①-⑳]|[٠-٩]+\s*[-.)])\s*\S/.test(l)).length;
  const timeNear = /(الخطة|خطتي|الجدول|تقدير|المتوقع|سيستغرق|سيأخذ|ستستغرق|ستأخذ|يستغرق|يأخذ|سأحتاج|ميزانية)[^\n]{0,70}?([0-9٠-٩]+\s*(دقيقة|دقائق|د\b|ساعة|ساعات|س\b)|ساعتان|ساعتين|نصف ساعة)/.test(t);
  const stepsWords = /(الخطة|خطتي|الترتيب|الجدول الزمني|سأبدأ|سنبدأ|سأقوم|سنقوم|الخطوة التالية)/.test(t);
  const inline = (t.match(/(?:^|\s)(?:[0-9٠-٩]+[.)]|[-•*])\s+\S/g) || []).length;                     // the same list written on ONE line («- أجهّز - أقص - أبني»)
  const chain = (t.match(/(?:^|\s)ثم\s+\S/g) || []).length >= 3 && /(?:^|\s)(?:سأ|سن|سوف)\S+/.test(t);   // «سأجهّز ثم أقص ثم أقسّم ثم …»
  const planShaped = (Math.max(list, inline) >= 3 && stepsWords) || timeNear || chain;
  if (!planShaped) return false;
  const question = /[؟?]\s*$/.test(t.trim()) && list < 3 && !timeNear;       // a reply that is a question is not a plan
  return !question;
}
/** the tool calls of the CURRENT turn (after the user's last real message) read from a transcript */
export function toolsThisTurn(transcriptPath) {
  const rows = [];
  try {
    const L = fs.readFileSync(transcriptPath, "utf8").trim().split("\n");
    for (let i = L.length - 1; i >= 0; i--) {
      let o; try { o = JSON.parse(L[i]); } catch { continue; }
      const ct = o.message?.content;
      if (o.type === "user" && !o.isMeta && !(Array.isArray(ct) && ct.some((b) => b?.type === "tool_result"))) break;
      if (o.type === "assistant" && Array.isArray(ct)) rows.push(...ct.filter((b) => b?.type === "tool_use"));
    }
  } catch { return null; }
  return rows;
}
/** has this turn run `conduct.mjs plan <kind>` (or status/next of an active run of that kind)? null = unreadable transcript (never block) */
export function planToolRun(transcriptPath, kinds, activeKind) {
  const rows = toolsThisTurn(transcriptPath); if (rows === null) return null;
  const cmds = rows.map((b) => norm(b.input?.command ?? "")).filter(Boolean);
  return kinds.every((k) => cmds.some((c) => new RegExp(`conduct\\.mjs["']?\\s+plan\\s+["']?${k}\\b`).test(c) || (activeKind === k && /conduct\.mjs["']?\s+(status|next)\b/.test(c))));
}
