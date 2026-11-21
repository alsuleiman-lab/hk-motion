// DOUBTFUL NAMES — a place or person name that rests on ONE transcript hit is heard again before it becomes a required element (gta6 2026-11-21: at 1:34 the
// per-segment pass wrote «صور لبنان فقط»; requirements and names_scan then demanded a Lebanon map, and the user said «ما ذكرت لبنان». The full pass of the cut
// audio had heard «صور لفقط», and so did a third listening: he never said it).
//   import { nameDoubts } from "./name_doubt.mjs";  nameDoubts(p, [{ text, said?, t (cut s), kind }]) → the same list + { verdict: "ok" | "doubt", why, heard }
//   node tools/name_doubt.mjs <p> "<name>@<cut s>" …      → prints the verdicts (a quick look by hand)
// A name is CONFIRMED when: the agent listened and wrote it in the spec ("namesHeard": ["لبنان@95"]), or both transcript passes heard it there (.tmp/<p>/cut_words.json
// = per-segment pass, .tmp/<p>/drift_fresh.json = full large-v3 pass of the cut audio), or it (or its نسبة: لبناني، اللبنانيين…) comes back at another moment of
// the episode. Otherwise the span (t-4 … t+4 s of the cut audio) is re-transcribed ON ITS OWN by tools/span_recheck.py (large-v3 float16, beam 8, no prompt) and
// the name is confirmed only if that pass hears it too with confidence ≥ 0.5. Everything else (and a failed re-listening) = «مشكوك»: the agent listens; it is never
// put in the required-element list by itself. Cache: .tmp/<p>/name_recheck.json (per audio file, size and time).
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = path.resolve(import.meta.dirname, "..");
const PY = process.env.PY ?? "S:/AI_Tools/ComfyUI_windows_portable/python_embeded/python.exe";
const rd = (f, d) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return d; } };
const norm = (s) => String(s).replace(/[ً-ْٰـ]/g, "").replace(/[إأآٱا]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/[^\p{L}\p{N} ]/gu, " ").replace(/\s+/g, " ").trim();
const bare = (w) => norm(w).replace(/^(و|ف)?(ب|ل|ك)?(ال)?/, "");
const lev = (a, b) => { const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]); for (let j = 1; j <= b.length; j++) d[0][j] = j; for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[a.length][b.length]; };
const close = (a, b) => a === b || (Math.min(a.length, b.length) >= 5 && lev(a, b) <= 1);   // 4 letters: «بنات» is not «(ل)بنان»
const toks = (s) => norm(s).split(" ").map(bare).filter(Boolean);
const mm = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
const words = (f) => { const j = rd(f, null); const a = Array.isArray(j) ? j : j?.words; return Array.isArray(a) ? a.map((w) => ({ s: +w.s, e: +(w.e ?? +w.s + 0.3), w: String(w.w), p: w.p, b: bare(w.w) })) : null; };
// (2026-11-21, selftest names.nisba_ok) bare() strips the root ل of «لبنان» («بنان») but keeps it in «اللبنانيين» («لبنانيين»): the nisba match also tries the word without that letter
// every second the name is said in a list of words (the whole name; or its root with a نسبة ending: لبنان → لبناني، اللبنانيين)
const NISBA = /^(ي|يه|يين|يون|يا|يات)?$/;   // مصر → مصري، مصريين؛ لبنان → اللبناني
const hitsIn = (W, T) => { const out = []; if (!W || !T.length) return out; const root = T.length === 1 && T[0].length >= 3 ? T[0].replace(/(يه|يين|يون|ي)$/, "") : null;
  for (let i = 0; i < W.length; i++) { if (T.every((x, k) => W[i + k] && close(W[i + k].b, x)) || (root && root.length >= 3 && [W[i].b, W[i].b.replace(/^(ب|ل|ك)/, "")].some((wb) => wb.startsWith(root) && NISBA.test(wb.slice(root.length))))) out.push({ s: W[i].s, p: W[i].p, w: W.slice(i, i + T.length).map((x) => x.w).join(" ") }); } return out; };
const moments = (ts) => ts.sort((a, b) => a - b).filter((t, k, a) => k === 0 || t - a[k - 1] > 10).length;

export function nameDoubts(p, cands, { audio } = {}) {
  const T = path.join(ROOT, ".tmp", p), A = words(path.join(T, "cut_words.json")), B = words(path.join(T, "drift_fresh.json"));
  const spec = rd(path.join(ROOT, "data", "specs", `${p}.json`), {}), heardBy = (spec?.namesHeard ?? []).map((s) => { const [n, t] = String(s).split("@"); return { k: toks(n).join(" "), t: Number(t) }; });
  const res = cands.map((c) => {
    const said = toks(c.said ?? c.text), canon = toks(c.text), near = (h) => Math.abs(h.s - c.t) <= 3;
    if (heardBy.some((h) => (h.k === canon.join(" ") || h.k === said.join(" ")) && Math.abs(h.t - c.t) <= 3)) return { ...c, verdict: "ok", why: "سمعه الوكيل (namesHeard)" };
    const inA = [...hitsIn(A, said), ...hitsIn(A, canon)], inB = B ? [...hitsIn(B, said), ...hitsIn(B, canon)] : [];
    if (B && inA.some(near) && inB.some(near)) return { ...c, verdict: "ok", why: "سمعه التفريغان" };
    const n = moments([...inA, ...inB].map((h) => h.s));
    if (n >= 2) return { ...c, verdict: "ok", why: `ذُكر في ${n} مواضع` };
    const other = B ? B.filter((w) => Math.abs(w.s - c.t) <= 3).map((w) => w.w).join(" ") : null;
    return { ...c, verdict: "recheck", why: `تفريغ واحد سمعه مرة واحدة${other != null ? `، والتفريغ الكامل هنا: «${other}»` : ""}، ولا ذكر آخر له في الحلقة` };
  });
  const todo = res.filter((r) => r.verdict === "recheck");
  if (!todo.length) return res;
  const audioF = audio ?? [path.join(T, "cut_audio.wav"), path.join(T, "cut16k.wav"), path.join(T, "cut.wav")].find((f) => fs.existsSync(f));
  if (!audioF) { for (const r of todo) Object.assign(r, { verdict: "doubt", why: r.why + " — لا صوت للقص لسماعه ثانيةً" }); return res; }
  const st = fs.statSync(audioF), sig = `${path.resolve(audioF)}|${st.size}|${Math.round(st.mtimeMs)}`, cacheF = path.join(T, "name_recheck.json"), cache = rd(cacheF, {});
  const span = (r) => ({ id: `${toks(r.text).join("_")}@${r.t.toFixed(2)}`, s: +Math.max(0, r.t - 4).toFixed(2), e: +(r.t + 4).toFixed(2) });
  const key = (x) => `${sig}|${x.id}|${x.s}|${x.e}`, need = todo.map(span).filter((x) => cache[key(x)] == null);
  let fail = "";
  if (need.length) {
    const inF = path.join(T, "name_recheck_in.json"), outF = path.join(T, "name_recheck_out.json");
    fs.writeFileSync(inF, JSON.stringify(need));
    const r = spawnSync(PY, ["-I", path.join(ROOT, "tools", "span_recheck.py"), audioF, inF, outF], { encoding: "utf8", windowsHide: true, env: { ...process.env, PYTHONIOENCODING: "utf-8" }, timeout: 300000 });
    if (r.status !== 0) fail = (r.stderr || r.stdout || "").trim().split("\n").pop()?.slice(0, 120) ?? "?";
    for (const x of r.status === 0 ? rd(outF, []) : []) { const sp = need.find((y) => y.id === x.id); if (sp) cache[key(sp)] = x.words; }
    fs.writeFileSync(cacheF, JSON.stringify(cache));
    for (const f of [inF, outF]) fs.rmSync(f, { force: true });
  }
  for (const r of todo) {
    const R = cache[key(span(r))];
    if (!R) { Object.assign(r, { verdict: "doubt", why: `${r.why} — تعذّر السماع الثاني${fail ? ` (${fail})` : ""}` }); continue; }
    const W = R.map((w) => ({ ...w, b: bare(w.w) })), h = [...hitsIn(W, toks(r.said ?? r.text)), ...hitsIn(W, toks(r.text))].find((x) => Math.abs(x.s - r.t) <= 4);
    const text = W.map((w) => w.w).join(" ");
    if (h && (h.p ?? 1) >= 0.5) Object.assign(r, { verdict: "ok", why: `السماع الثاني سمع «${h.w}» (ثقة ${h.p})`, heard: text });
    else Object.assign(r, { verdict: "doubt", why: `${r.why}؛ والسماع الثاني: «${text}»${h ? ` (سمعه بثقة ${h.p} فقط)` : ""}`, heard: text });
  }
  return res;
}
export const doubtLine = (r, p) => `مشكوك «${r.text}» عند ${mm(r.t)} (${(+r.t).toFixed(1)}ث): ${r.why} — استمع: إن قاله فأضف "${r.text}@${Math.round(r.t)}" إلى "namesHeard" في data/specs/${p}.json، وإلا فلا عنصر له`;

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  const [p, ...xs] = process.argv.slice(2);
  if (!p || !xs.length) { console.error('usage: node tools/name_doubt.mjs <p> "<name>@<cut s>" …'); process.exit(2); }
  for (const r of nameDoubts(p, xs.map((x) => { const [text, t] = x.split("@"); return { text, t: Number(t), kind: "?" }; }))) console.log(r.verdict === "doubt" ? `⚠ ${doubtLine(r, p)}` : `✔ «${r.text}» عند ${mm(r.t)}: ${r.why}`);
}
