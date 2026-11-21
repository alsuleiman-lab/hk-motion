#!/usr/bin/env node
// THE MONTAGE BUILT CORRECT BY CONSTRUCTION (user 2026-11-21: «في عندك عناصر وفي عندك آلية عمل معينة، لما تمشي وفق هذه الآلية لازم الأخطاء ما تظهر… لازم حل جذري»).
// On gta6 the agent wrote every item by hand and ~20 gates refused them one by one (6 refused batches, 17 failed checks, ~6 hours): the rules lived in the
// checkers only. This tool takes the creative choices alone (one «picks» file) and COMPUTES everything the gates judge, from the gates' own sources:
//   node tools/montage_build.mjs <p> --picks-template [--out <file>]        every moment and requirement that needs a choice, in ONE file, with a default each
//   node tools/montage_build.mjs <p> --picks <picks.json> [--out <spec>]    the full items of data/specs/<p>.json (or --out), then the whole gate set once
//        [--base <spec>]  the spec whose non-item fields are kept (default: data/specs/<p>.json, else .tmp/<p>/spec_draft.json)
//        [--no-mattes]    do not compute the isolation mattes of new map windows (tools/matte_windows.mjs, GPU) — a map then has no window and is not used
//        [--rounds N]     solver rounds on the scratch copy (default 6)    [--json] the report as JSON on the last line
// What it computes (design note: data/montage_build_design.md): start = the first spoken word (never before it; never later than late_check allows),
// duration (pictures ≤ late_check's warn limit, scene effects ≤ its limit, writing = words + the hold, cards typed at their cps + the hold), the slot
// (grid_plan --write on the scratch copy: face zone + free slot of its kind), one element per area per moment (element_slots areas and ranks), the cover
// first, the sections rail in the first free seconds, a counter for spoken counts, the warning frame for a warning, writing for the remaining gaps
// (≤ 1 torn and 1 scraps a minute, writing_place), every requirement row filled (requirements --check), the due gallery picks and the drawn-meaning quota.
// It never writes an invalid item: every candidate is judged on a scratch workspace (tools/lib/gate_sandbox.mjs: the gates' own code on a copy), a refused
// one moves to its next valid option (later start inside its window, the other side, a shorter stay, another element) or, if optional, is left out.
// A gate that still fails on the final spec is a BUILDER BUG and is printed as such. Defaults it chose for missing picks are listed for the agent.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { makeSandbox, WS } from "./lib/gate_sandbox.mjs";
import { runGateSet, runIn } from "./lib/gate_set.mjs";
import { coverItem, coverNames, NO_COVER_KINDS } from "./cover_item.mjs";
import { RAIL_MAX, appliesToEpisode } from "./prepublish_gates.mjs";
import { align as alignScraps } from "./lib/scraps_times.mjs";

process.chdir(WS);
const argv = process.argv.slice(2), p = argv[0];
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : argv[i + 1]; };
const has = (k) => argv.includes(`--${k}`);
if (!p || p.startsWith("--")) { console.error("usage: node tools/montage_build.mjs <p> --picks-template | --picks <picks.json> [--out <spec>] [--base <spec>] [--no-mattes]"); process.exit(2); }
const T = path.join(".tmp", p);
const OUT = path.resolve(opt("out", path.join("data", "specs", `${p}.json`)));
const REAL = OUT.toLowerCase() === path.resolve("data", "specs", `${p}.json`).toLowerCase();
/* a scratch --out (a test) gets a scratch public/ of links: a matte or a test still made for it never reaches the real public/ (tools/lib/gate_sandbox.mjs) */
const SB = has("picks-template") ? null : makeSandbox(p, { name: `build_${p}`, ownPublic: !REAL });
const PUB = SB && !REAL ? SB.pub : "public";
const readJ = (f, d) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return d; } };
const mm = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const r2 = (v) => +(+v).toFixed(2);
const BUGS = [];
const TRACE = argv.includes("--trace");
const bug = (m) => { BUGS.push(m); throw new Error("BUILDER BUG: " + m); };

// ───────────── 1) THE RULE SOURCES: every number and list read from the gate that enforces it (a changed gate = a loud builder bug, never a stale copy)
const src = (f) => fs.readFileSync(path.join("tools", f), "utf8");
const grab = (f, re, name, conv = Number) => { const m = re.exec(src(f)); if (!m) bug(`مصدر القاعدة تغيّر: «${name}» لم يُعثر عليه في tools/${f}`); return conv(m[1]); };
const list = (s) => [...s.matchAll(/"([^"]+)"/g)].map((x) => x[1]);
const evalLit = (f, start, end, name) => { const s = src(f), a = s.indexOf(start), b = s.indexOf(end, a + start.length); if (a < 0 || b < 0) bug(`مصدر القاعدة تغيّر: «${name}» في tools/${f}`); return Function(`return ${s.slice(a + start.length - 1, b + end.length)}`)(); };
const RULE = {
  HOLD: grab("element_slots.mjs", /const HOLD = ([\d.]+)/, "HOLD"),
  LATE: grab("late_check.mjs", /\$\{late > ([\d.]+) \? "✘"/, "late limit"),
  SAID_BEFORE: grab("late_check.mjs", /w\.s >= show - ([\d.]+) && w\.s <= show \+/, "said window"),
  PIC_WARN: grab("late_check.mjs", /if \(d <= (\d+(?:\.\d+)?)\) continue;/, "picture warn"),
  PIC_MAX: grab("late_check.mjs", /\$\{d > (\d+(?:\.\d+)?) \? "✘" : "⚠"\} باقٍ/, "picture max"),
  FX_MAX: grab("late_check.mjs", /if \(d > (\d+(?:\.\d+)?)\) out\.push\(`✘ مؤثر خلفية/, "scene fx max"),
  GAP: grab("coverage_check.mjs", /const GAP = Number\(opt\("gap", (\d+(?:\.\d+)?)\)\)/, "gap"),
  FIRST_GAP: grab("coverage_check.mjs", /FIRST_GAP = Number\(opt\("first-gap", (\d+(?:\.\d+)?)\)\)/, "first-minute gap"),
  FIRST_LEN: grab("coverage_check.mjs", /const FIRST_LEN = Math\.min\((\d+), dur\)/, "first-minute length"),
  SLACK: grab("writing_sync.mjs", /Number\(opt\("slack", ([\d.]+)\)\)/, "writing slack"),
  SPLIT_OK: new Set(grab("coverage_check.mjs", /const OKS = new Set\(\[([^\]]*)\]\)/, "split-window types", list)),
  VISUAL: new Set(grab("coverage_check.mjs", /const VISUAL = new Set\(\[([^\]]*)\]\)/, "visual types", list)),
  W_DANGLE: grab("writing_place.mjs", /const DANGLE = new Set\(\[([^\]]*)\]/, "writing_place dangling words", list),
  S_DANGLE: grab("writing_sync.mjs", /const DANGLE = (\/\^\([^\n]*?\)\$\/);/, "writing_sync dangling words", (x) => Function(`return ${x}`)()),
  SCRAPS_MAX: grab("writing_place.mjs", /it\.t === "scraps" && q\.length > (\d+)\)/, "scraps word limit"),
  OVER: grab("mg_usage_audit.mjs", /n > (\d+) && !EXEMPT\.has\(k\)/, "kind repeat limit"),
  PT_RULES: evalLit("pick_triggers.mjs", "const RULES = [", "\n];", "pick_triggers RULES"),
  METAPHORS: evalLit("pick_triggers.mjs", "const METAPHORS = [", "];", "METAPHORS"),
  PT_NORM: grab("pick_triggers.mjs", /const norm = (\(s\) => [^\r\n]*?);\r?\n/, "pick_triggers norm", (x) => Function(`return ${x}`)()),
  COUNTRIES: evalLit("names_scan.mjs", "const COUNTRIES = [", "\n];", "names_scan COUNTRIES"),
  ATLAS: new Set(grab("names_scan.mjs", /const ATLAS = new Set\(\[([^\]]*)\]/, "map atlas", list)),
  PICK_FULL: new Set(grab("grid_plan.mjs", /const PICK_FULL = new Set\(\[([^\]]*)\]/, "full-frame picks", list)),
  SLOT_MARGIN: grab("grid_plan.mjs", /p < b \+ ([\d.]+) && q > a - [\d.]+\)/, "slot busy margin"),
  SAID_AFTER: grab("late_check.mjs", /w\.s <= show \+ ([\d.]+)\)\)/, "said window after"),
  LATE_LOOK: grab("late_check.mjs", /w\.s >= show - (\d+)\)\.pop\(\)/, "late look-back"),
  LC_LABEL: grab("late_check.mjs", /const LABEL = \[([^\]]*)\]/, "late_check labels", list),
  LC_STOP: new Set(grab("late_check.mjs", /const STOP = new Set\(\[([^\]]*)\]\)/, "late_check STOP", list)),
  WS_STOP: new Set(grab("writing_sync.mjs", /const STOP = new Set\(\[([^\]]*)\]\)/, "writing_sync STOP", list)),
};
const SLOT_GAP = RULE.SLOT_MARGIN + 0.05;
/* the token match of writing_sync / late_check (same normalisation, their own stop lists) */
const tokMatch = (q, t) => t === q || (q.length >= 4 && t.length >= 4 && (t.startsWith(q) || q.startsWith(t)));
const toksOf = (text, STOP) => [...new Set(String(text ?? "").split(/\s+/).map((w) => bare(w)).filter((t) => t.length >= 3 && !STOP.has(t)))];
/** writing_sync: the first spoken content word of a written text inside its window (null = nothing to judge) */
const firstSpokenWS = (text, a, b) => { const T = toksOf(text, RULE.WS_STOP); for (const w of WORDS) { if (w.s < a - 0.6 || w.s > b + 0.3) continue; const t = bare(w.w); if (T.some((q) => tokMatch(q, t))) return w.s; } return null; };
/** an item's timing made to satisfy writing_sync (never before its words) and late_check (never later than its words) together */
function syncTiming(it) {
  const S = RULE.SLACK - 0.08;
  if (it.t === "rows") { for (const r of it.rows ?? []) { const t0 = firstSpokenWS(r.label, r.at, it.to); if (t0 != null && r.at < t0 - S) r.at = r2(t0 - S); } it.from = r2(Math.min(it.from, ...it.rows.map((r) => r.at)) - 0.05); it.to = r2(Math.max(it.to, it.rows.at(-1).at + RULE.HOLD + 0.6)); }
  if (it.t === "note") { const t0 = firstSpokenWS(it.title, it.at, it.until); if (t0 != null && it.at < t0 - S) { const b = it.until; setSpan(it, r2(t0 - S), b); } }
  if (["torn", "scraps"].includes(it.t)) { const t0 = firstSpokenWS(it.text, it.at, it.until); if (t0 != null && it.at < t0 - S) it.at = r2(t0 - S); }
  const show = it.t === "pick" && it.typeAt != null ? it.typeAt : it.at ?? it.from;
  const label = RULE.LC_LABEL.map((k) => it[k]).find((v) => typeof v === "string" && v.trim());
  if (show != null && label && !["subscribe", "cover", "wm"].includes(it.t)) {
    const T = toksOf(label, RULE.LC_STOP), said = T.length ? WORDS.filter((w) => T.some((q) => tokMatch(q, bare(w.w)))) : [];
    if (said.length && !said.some((w) => w.s >= show - RULE.SAID_BEFORE && w.s <= show + RULE.SAID_AFTER)) {
      const before = said.filter((w) => w.s < show - RULE.SAID_BEFORE && w.s >= show - RULE.LATE_LOOK).pop();
      if (before && show - before.s > RULE.LATE - 0.7) { const [a, b] = spanOf(it); setSpan(it, r2(a - (show - before.s) + 0.1), b); }
    }
  }
  /* writing_sync: a hadith card stays the hold after its typing ends (typed from at + 0.25 at its cps) */
  if (it.t === "note") { const typeEnd = it.at + 0.25 + [...it.title].length / (it.cps ?? 16); if (it.until - typeEnd < RULE.HOLD + 0.1) it.until = r2(typeEnd + RULE.HOLD + 0.2); }
  return it;
}
const PR = readJ("data/element_priority.json", { rank: {}, exempt: [] });
const GRID = readJ("data/layout_grids.json", {});
const KIND_OF = {}; for (const [k, ts] of Object.entries(GRID.kinds ?? {})) for (const t of ts) KIND_OF[t] ??= k;
const rankOf = (it) => PR.rank[it.t] ?? 2;

// ───────────── 2) THE PROJECT
const W0 = readJ(path.join(T, "cut_words.json"), null);
if (!W0) { console.error(`✘ لا تفريغ للقص: ${T}/cut_words.json — القص أولاً (stage cut)`); process.exit(2); }
const WORDS = (Array.isArray(W0) ? W0 : W0.words).map((w) => ({ s: +(w.s ?? w.start), e: +(w.e ?? w.end), w: String(w.w ?? w.word ?? "") }));
const baseF = opt("base", fs.existsSync(path.join("data", "specs", `${p}.json`)) ? path.join("data", "specs", `${p}.json`) : path.join(T, "spec_draft.json"));
const BASE = readJ(baseF, null);
if (!BASE) { console.error(`✘ لا مواصفة أساس (${baseF}): node tools/spec_draft.mjs ${p} --title "…" أولاً`); process.exit(2); }
const DUR = (BASE.frames ?? 0) / (BASE.fps ?? 30);
const FORMS = Array.isArray(BASE.forms) && BASE.forms.length ? BASE.forms : BASE.kind === "reel" ? ["port"] : ["land", "port"];
const REQ = readJ(path.join(T, "requirements.json"), []);
const SECTIONS = readJ(path.join(T, "sections.json"), null);
const VERSES = readJ(path.join(T, "verses.json"), []);
const HADITH = readJ(path.join(T, "hadith.json"), []);
const IMAGES = readJ(path.join(T, "images.json"), []);
const WRITING = readJ(path.join(T, "writing.json"), null);
const EPREF = readJ(path.join("data", "episode_refs", `${p}.json`), { slots: {} });
const SPLITS = BASE.splits ?? [];
const inSplit = (a, b = a) => SPLITS.some((w) => a < w.to - 0.05 && b > w.from + 0.05);
const splitAt = (t) => SPLITS.find((w) => t >= w.from - 0.05 && t < w.to);

// words: the same normalisation as the writing checks (writing_sync / late_check)
const norm = (s) => String(s).replace(/[ً-ٰٟـ]/g, "").replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/[^\p{L}\p{N}]/gu, "");
const bare = (w) => norm(w).replace(/^(وال|بال|كال|فال|لل|ال|و|ف|ب|ل|ك)(?=.{3,})/, "");
const NW = WORDS.map((w) => bare(w.w));
const DANGLE_N = new Set(RULE.W_DANGLE.map(norm));
const clean = (w) => String(w).replace(/^[«"(]+|[»")،,.:!?؟]+$/g, "");
const wordsIn = (a, b) => WORDS.filter((w) => w.s >= a - 0.01 && w.s < b);
const wordAt = (t) => WORDS.find((w) => w.s >= t - 0.05) ?? WORDS[WORDS.length - 1];
const endsSentence = (w) => /[.?!؟]$/.test(w.w);
/** consecutive spoken phrases in [a, b): sentence by sentence, ≤ max words, never starting or ending on a dangling word (writing_place / writing_sync) */
function phrasesIn(a, b, max = 5, min = 2) {
  const ws = wordsIn(a, b), out = []; let cur = [];
  const flush = () => {
    let q = cur.slice(); cur = [];
    const bad = (w) => DANGLE_N.has(norm(clean(w.w))) || RULE.S_DANGLE.test(clean(w.w));
    while (q.length && bad(q[q.length - 1])) q.pop();
    while (q.length && DANGLE_N.has(norm(clean(q[0].w))) && !["و", "ولكن", "لكن", "هو", "هي"].includes(clean(q[0].w).replace(/[إأآ]/g, "ا"))) q.shift();
    if (q.length >= min && q.some((w) => norm(w.w).length >= 3)) out.push({ text: q.map((w) => clean(w.w)).join(" "), at: r2(q[0].s), end: r2(q[q.length - 1].e), n: q.length, ws: q });
  };
  for (const w of ws) { cur.push(w); if (endsSentence(w) || cur.length >= max) flush(); }
  flush();
  return out.filter((x) => x.text.split(" ").every((t) => norm(t)));
}
/** first time a phrase (normalised words) is spoken at or after t0 */
const findSpoken = (text, t0 = 0, t1 = 1e9) => { const q = String(text).split(/\s+/).map(bare).filter(Boolean); for (let i = 0; i < NW.length; i++) { if (WORDS[i].s < t0 - 0.5 || WORDS[i].s > t1) continue; if (q.length && q.every((x, j) => NW[i + j] === x || (x.length >= 4 && NW[i + j]?.startsWith(x)))) return { at: WORDS[i].s, end: WORDS[i + q.length - 1].e }; } return null; };

// ───────────── 3) THE GALLERY (one source: tools/el.mjs list --json)
const CAT = (() => { const r = spawnSync(process.execPath, ["tools/el.mjs", "list", "--json"], { encoding: "utf8", maxBuffer: 1 << 26 }); const a = JSON.parse(r.stdout || "[]"); if (!a.length || !a[0].t) bug("el.mjs list --json لا يعطي نوع العنصر (t)"); return Object.fromEntries(a.map((e) => [e.code, e])); })();
const RATIO = new Map();
const ratioOf = (s) => { if (RATIO.has(s)) return RATIO.get(s); const r = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", path.join(PUB, s)], { encoding: "utf8" }); const [w, h] = String(r.stdout).trim().split(",").map(Number); const v = w && h ? +(h / w).toFixed(4) : null; RATIO.set(s, v); return v; };
let ID = 0;
/** an item exactly as `el.mjs add` builds it: the gallery type + content + timing; refuses unknown / missing fields (an invalid item is never made) */
function mk(code, vals, why) {
  const e = CAT[code]; if (!e) throw new PickError(`لا عنصر «${code}» في المعرض (node tools/el.mjs list)`);
  const names = new Set(e.fields.map((f) => f.name)), unk = Object.keys(vals).filter((k) => !names.has(k));
  if (unk.length) throw new PickError(`${code}: حقول لا يقبلها: ${unk.join("، ")} (الحقول: ${[...names].join(" ")})`);
  const miss = e.fields.filter((f) => !f.opt && vals[f.name] === undefined).map((f) => f.name);
  if (miss.length) throw new PickError(`${code}: ينقصه ${miss.join("، ")}`);
  const v = { ...vals }; for (const f of e.fields) if (/^string$/.test(f.type) && typeof v[f.name] === "number") v[f.name] = String(v[f.name]);
  const it = { id: `mb${(++ID).toString(36)}`, t: e.t, ...(e.el ? { el: e.el } : {}), ...(e.fixed ?? {}), ...v };
  if (typeof it.src === "string" && ["tphoto", "scholar", "pic", "news"].includes(it.t)) { if (!fs.existsSync(path.join(PUB, it.src))) throw new PickError(`${code}: لا صورة public/${it.src}`); const r = ratioOf(it.src); if (!r) throw new PickError(`${code}: لا أقرأ الصورة public/${it.src}`); it.ratio = r; }
  Object.defineProperty(it, "_why", { value: why, enumerable: false, writable: true });
  return syncTiming(it);
}
class PickError extends Error {}
/** the builder's own marks ride on an item without ever reaching the spec (non-enumerable) */
const markOpt = (it) => Object.defineProperty(it, "_opt", { value: true, enumerable: false, writable: true, configurable: true });
/** the last moment a label word of the item is said after its start (late_check judges a shown label by its words) */
const labelLastSaid = (it) => { const label = RULE.LC_LABEL.map((k) => it[k]).find((v) => typeof v === "string" && v.trim()); if (!label) return null; const T = toksOf(label, RULE.LC_STOP), [a, b] = spanOf(it), end = (it.until ?? b) - RULE.HOLD + 0.3; /* its own sentence only: the same word said again later is another moment */ const ws = WORDS.filter((w) => w.s >= a - 0.5 && w.s <= end && T.some((q) => tokMatch(q, bare(w.w)))); return ws.length ? ws.at(-1).s : null; };

// ───────────── 4) THE MOMENTS (everything that needs a choice)
const matchImage = (text, t) => {
  const q = bare(text); if (!q || q.length < 3) return null;
  const hit = (s) => { const b = bare(s); return b.length >= 3 && (b.includes(q) || q.includes(b) || String(s).split(/\s+/).some((x) => bare(x).length >= 4 && bare(x) === q)); };
  return IMAGES.find((im) => hit(im.name) || (im.said ?? []).some(hit)) ?? null;
};
const imgSrc = (im) => im ? String(im.file).replace(/^public[\\/]/, "").replace(/\\/g, "/") : null;
/** the person named last before t (for «this man…» states with no picture of their own): a default the agent should check */
const lastPersonBefore = (t) => { let best = null; for (const im of IMAGES.filter((x) => x.person && fs.existsSync(String(x.file)))) for (const s of [im.name, ...(im.said ?? [])]) { const h = findSpoken(s, 0, t); if (h && h.at < t && (!best || h.at > best.at)) best = { at: h.at, im }; } return best?.im ?? null; };
const dueOf = () => {   // pick_triggers' own rules on the cut words: every hit time of every due element
  let text = ""; const at = [];
  for (const w of WORDS) { const n = RULE.PT_NORM(w.w); if (!n) continue; if (text) { text += " "; at.push(w.s); } for (const _ of n) at.push(w.s); text += n; }
  return RULE.PT_RULES.map((r) => ({ el: r.el, also: r.also ?? [], why: r.why, hits: [...text.matchAll(new RegExp(r.re.source, r.re.flags))].map((m) => at[m.index] ?? 0) })).filter((r) => r.hits.length);
};
const COUNT_W = /^(الف|الاف|آلاف|ألف|مليون|ملايين|مليار|مئه|مائه|مئات)$/;
const numbersOf = () => { const out = []; WORDS.forEach((w, i) => { const n = norm(w.w); const nx = norm(WORDS[i + 1]?.w ?? ""); if (/^[0-9٠-٩]{2,}$/.test(n) && COUNT_W.test(nx)) out.push({ at: w.s, value: Number(n.replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d))), label: clean(WORDS[i + 1].w) }); }); return out; };

function moments() {
  const M = [];
  const add = (m) => M.push(m);
  if (!NO_COVER_KINDS.includes(BASE.kind)) add({ id: "cover", kind: "cover", t: 0, need: "صورة الغلاف أول عنصر" });
  if (Array.isArray(SECTIONS) && SECTIONS.length && BASE.kind !== "reel") add({ id: "sections", kind: "rail", t: 0, need: `خط الأقسام (${SECTIONS.length}) في أول ${RAIL_MAX} ثوانٍ`, sections: SECTIONS });
  for (const r of REQ) {
    if (r.kind === "ordercand") continue;
    if (r.kind === "order") { for (const [k, x] of (r.plan ?? []).entries()) if (!["none", "proc", "cut", "behind"].includes(x.type) && Number.isFinite(x.at)) add({ id: `order:${r.id}:${k}`, kind: "order", t: x.at, type: x.type, text: r.text, need: `تعليمة: «${x.type}» عند ${mm(x.at)}`, req: r.id }); continue; }
    if (r.t == null) continue;
    add({ id: `req:${r.id}`, kind: r.kind, t: r.t, text: r.text, ctx: r.ctx, needTypes: r.need, before: r.before, after: r.after, geo: r.geo, req: r.id, need: `${r.kind}: «${r.text}»` });
  }
  /* coverage_check §1: every term of data/mention_lexicon.json and every fetched picture has a PICTURE on screen −3…+4 s of its first mention */
  {
    const lex = readJ("data/mention_lexicon.json", {}), terms = [];
    for (const [cat, g] of Object.entries(lex)) if (cat !== "_") for (const [name, forms] of Object.entries(g)) terms.push({ name, forms });
    for (const im of IMAGES) terms.push({ name: im.name, forms: [im.name, ...(im.said ?? [])] });
    const skipM = new Set((BASE.skipMentions ?? []).filter((x) => typeof BASE.waiverOK?.[x] === "string")), seen = new Set();
    for (const tm of terms) {
      if (seen.has(tm.name) || skipM.has(tm.name)) continue; seen.add(tm.name);
      const at = tm.forms.map((f) => findSpoken(f)?.at).filter((x) => x != null).sort((a, b) => a - b)[0]; if (at == null) continue;
      const r = M.find((m) => ["person", "depict", "state", "place"].includes(m.kind) && Math.abs(m.t - at) <= 3);
      if (r) { r.visual = true; continue; }
      add({ id: `mention:${tm.name}`, kind: "mention", t: at, text: tm.name, forms: tm.forms, visual: true, after: 4, need: `مذكور: «${tm.name}» (صورة)` });
    }
  }
  for (const [i, v] of VERSES.entries()) if (v.inCut && v.cut?.length) add({ id: `verse:${i}`, kind: "verse", t: v.cut[0], v, need: `آية ${v.sura}:${v.aya}` });
  for (const [i, h] of HADITH.entries()) if (h.verified !== false && Number.isFinite(h.at)) add({ id: `hadith:${i}`, kind: "hadith", t: h.at, h, need: `حديث: ${h.book ?? ""} ${h.n ?? ""}` });
  const due = dueOf(), skipP = new Set((BASE.skipPicks ?? []).map((s) => s.el ?? s).filter((e) => typeof BASE.waiverOK?.[e] === "string"));
  for (const d of due) if (!skipP.has(d.el)) add({ id: `due:${d.el}`, kind: "due", el: d.el, also: d.also, t: d.hits[0], hits: d.hits, need: `${d.el}: ${d.why}` });
  const req = readJ("data/required_elements.json", { rules: [] }).rules;
  for (const r of req.filter((x) => x.srcPrefix === "episodes/")) for (const [k, s] of Object.entries(EPREF.slots ?? {})) if (Number.isFinite(s.at)) add({ id: `episode:${k}`, kind: "episode", t: s.at, slot: s, need: `حلقة سابقة: ${s.topic ?? s.title}` });
  /* coverage_check §1b: every trip, date, news report, previous episode and hadith mention carries its element (data/required_elements.json, its own matching) */
  {
    const skipR = new Set((BASE.skipRequired ?? []).filter((x) => typeof BASE.waiverOK?.[x] === "string"));
    for (const r of req) for (const at of reqHits(r)) {
      if (skipR.has(`${r.name}@${Math.round(at)}`)) continue;
      const near = (k) => M.some((m) => m.kind === k && m.t <= at + (r.after ?? 6) && m.t >= at - (r.before ?? 3));
      if (r.srcPrefix === "episodes/" && near("episode")) continue;
      if (r.types.some((x) => x === "note" || x === "hadith") && near("hadith")) continue;
      add({ id: `required:${r.name}@${Math.round(at)}`, kind: "required", t: at, rule: r, needTypes: r.types, before: r.before ?? 3, after: r.after ?? 6, need: `${r.name} عند ${mm(at)}` });
    }
  }
  for (const [i, n] of numbersOf().entries()) add({ id: `number:${i}`, kind: "number", t: n.at, n, need: `رقم: ${n.value} ${n.label}`, optional: true });
  const mins = DUR / 60, needM = Math.max(1, Math.ceil(mins / 2));
  for (let k = 0; k < needM; k++) add({ id: `metaphor:${k}`, kind: "metaphor", t: null, need: `معنى مجسّد ${k + 1} من ${needM} (${RULE.METAPHORS.join("، ")})` });
  return M;
}

// ───────────── 5) DEFAULT PICKS (a sensible gallery choice for every moment the agent did not fill; each one is listed)
const phraseNear = (t, max = 6, span = 6) => phrasesIn(t - 0.2, t + span, max)[0] ?? null;
function defaultPick(m) {
  switch (m.kind) {
    case "cover": return { el: "PaperCover" };
    case "rail": return { el: "SectionsRail", sections: m.sections };
    case "person": case "depict": case "state": case "order": case "mention": {
      // an order names its element type (montage_notes plan: «tphoto@3:21»): the gallery code that draws that type
      const want = m.kind === "order" ? Object.values(CAT).find((e) => e.t === m.type && !e.el)?.code : null;
      if (m.kind === "order" && !want) return { el: null, media: true, note: `لا عنصر في المعرض يرسم «${m.type}»` };
      const own = matchImage(m.text, m.t) ?? (m.forms ?? []).map((f) => matchImage(f, m.t)).find(Boolean);
      const im = own ?? (m.kind === "order" || m.kind === "mention" || m.kind === "state" || m.visual ? nearImage(m.t) : null);
      const photo = (x) => ({ el: want ?? (x.person ? "TornPhoto" : "PhotoFrame"), vals: { src: imgSrc(x), ...(x.person && (want ?? "TornPhoto") !== "PhotoFrame" ? { name: x.name } : {}) } });
      if (im) return { ...photo(im), note: own ? `صورة «${im.name}» من images.json` : `صورة «${im.name}» المذكور قربه — تحقّق أنها المقصودة` };
      if (!m.visual && m.kind !== "order" && (m.needTypes ?? []).includes("rows")) return { el: "StatRow", vals: { label: m.text }, note: "بلا صورة: بطاقة بند بكلمته (أضف صورة إن وُجدت)" };
      const lp = lastPersonBefore(m.t);
      if (lp) return { ...photo(lp), note: `بلا صورة له: صورة آخر من ذُكر قبله «${lp.name}» — تحقّق` };
      return { el: null, media: true, note: "يلزمه صورة: node tools/fetch_images.mjs أو src في الاختيارات" };
    }
    case "place": return { el: "PaperMap", note: "خريطة البلد" };
    case "required": {
      const ty = m.needTypes ?? [];
      if (ty.includes("date")) return { el: "DateCalendar", vals: { text: phrasesIn(m.t - 0.1, m.t + 3, 3, 1)[0]?.text ?? "" }, note: "التاريخ كما نطقه" };
      if (ty.includes("news")) return { el: null, media: true, note: "لقطة الخبر (NewsClip src=…): صورة الخبر أو لقطة من المقطع المعروض" };
      if (ty.includes("pmap")) return { el: null, media: true, note: "رحلة: خريطة المكان (PaperMap center/highlight)" };
      if (m.rule?.srcPrefix) return { el: null, media: true, note: `بطاقة الحلقة: node tools/episode_ref.mjs pick ${p} <slot> "<الموضوع>"` };
      return { el: null, media: true, note: `يلزمه ${ty.join("/")}` };
    }
    case "questions": case "conditions": return { el: "StatRow", note: "الأسئلة بنوداً بكلماته" };
    case "date": return { el: "DateCalendar", note: "التاريخ المنطوق" };
    case "verse": return { el: "VerseWords" };
    case "hadith": return { el: "NoteCard" };
    case "episode": return { el: "SearchBar", note: `حلقة «${m.slot.topic ?? m.slot.title}»` };
    case "number": return { el: "GlowCounter" };
    case "due": return { el: m.el };
    case "metaphor": return { el: null, note: "يختاره الباني في فراغ" };
    default: return { el: null };
  }
}
const nearImage = (t) => { let best = null; for (const im of IMAGES.filter((x) => fs.existsSync(String(x.file)))) for (const s of [im.name, ...(im.said ?? [])]) for (let from = t - 40; ;) { const h = findSpoken(s, from, t + 15); if (!h) break; if (!best || Math.abs(h.at - t) < Math.abs(best.d)) best = { d: h.at - t, im }; from = h.at + 1; } return best?.im ?? null; };
/* the matching of coverage_check §1b, on its own normalisation (read from it) */
const C_NORM = grab("coverage_check.mjs", /const norm = (\(s\) => [^\r\n]*?);\r?\n/, "coverage norm", (x) => Function(`return ${x}`)());
const C_BARE = grab("coverage_check.mjs", /const bare = (\(w\) => [^\r\n]*?);\r?\n/, "coverage bare", (x) => Function(`return ${x}`)());
function reqHits(r) {
  const nw = WORDS.map((w) => C_NORM(w.w)), nb = nw.map(C_BARE), hits = [];
  const COUNT = new Set(["الف", "الاف", "الالاف", "مليون", "ملايين", "مليار"]), notNext = new Set((r.notNext ?? []).map(C_NORM));
  const cancelled = (j) => j < nw.length && (notNext.has(nw[j]) || (notNext.has("#num") && /^[0-9٠-٩]/.test(nw[j])));
  for (const f of r.forms) {
    if (f === "#year") { const notYear = new Set(["صفحه", "ص", "الصفحه", "الجزء", "جزء", "المجلد", "مجلد", "رقم", "حديث", "الحديث", "ايه", "الايه"]); WORDS.forEach((w, i) => { if (/^(1[0-9]{3}|20[0-9]{2}|[1-9][0-9]{2})$/.test(nw[i]) && !notYear.has(nw[i - 1]) && !COUNT.has(nw[i + 1])) hits.push(w.s); }); continue; }
    const q = C_NORM(f).split(" ");
    for (let i = 0; i + q.length <= nw.length; i++) if (q.every((x, k) => nw[i + k] === x || (C_BARE(x).length >= 3 && nb[i + k] === C_BARE(x))) && !cancelled(i + q.length)) hits.push(WORDS[i].s);
  }
  hits.sort((a, b) => a - b); const out = []; let last = -1e9;
  for (const at of hits) { if (at - last < (r.merge ?? 20)) continue; last = at; out.push(at); }
  return out;
}

// ───────────── 6) CANDIDATE ITEMS from a moment + its pick (content filled from his words where the pick left it out)
const holdEnd = (lastEnd) => r2(lastEnd + RULE.HOLD);
const picEnd = (a, spoken) => r2(Math.min(a + RULE.PIC_WARN - 0.2, Math.max(a + 4, spoken + RULE.HOLD)));
const pickEndFor = (it) => { let m = it.at ?? 0; const walk = (v, k) => { if (typeof v === "number" && (k === "at" || /At$/.test(k))) m = Math.max(m, v); else if (Array.isArray(v)) v.forEach((x) => walk(x, k)); else if (v && typeof v === "object") Object.entries(v).forEach(([kk, x]) => walk(x, kk)); }; Object.entries(it).forEach(([k, v]) => { if (k !== "until" && k !== "land") walk(v, k); }); return m + 0.8 + RULE.HOLD; };
/** phrases after t for list-like picks: [{text, at}] */
let CUR_SPAN = 14;   // the stretch a list-like pick may take its phrases from (a gap's length for a drawn meaning)
const steps = (t, n, max = 3, span = CUR_SPAN) => phrasesIn(t, t + span, max, 1).slice(0, n).map((x) => ({ text: x.text, at: x.at }));
function contentFor(code, m, given = {}) {
  const t = given.at ?? m.t, v = { ...given };
  CUR_SPAN = m.span ?? 14;
  const ph = phraseNear(t, 6);
  switch (code) {
    case "TornPhoto": case "PinnedPhoto": case "PhotoFrame": case "NewsClip": { const sp = findSpoken(m.text ?? "", t - 1, t + 3); v.at ??= r2(sp?.at ?? t); v.until ??= picEnd(v.at, sp?.end ?? v.at + 2); if (code === "NewsClip") v.source ??= "—"; return v; }
    case "StatRow": {
      if (!v.rows) {
        if (m.kind === "questions" || m.kind === "conditions") { const qs = phrasesIn(t - 0.3, t + (m.after ?? 4) + 8, 6, 2).slice(0, 6); v.rows = qs.map((q) => ({ at: q.at, label: q.text })); }
        else { const sp = findSpoken(v.label ?? m.text, t - 1, t + 3) ?? { at: t, end: t + 1 }; v.rows = [{ at: r2(sp.at), label: clean(v.label ?? m.text) }]; }
      }
      delete v.label;
      v.from ??= r2(Math.max(0, v.rows[0].at - 0.1)); v.to ??= holdEnd((wordsIn(v.rows.at(-1).at, v.rows.at(-1).at + 4).find((w, i, a) => i === a.length - 1 || endsSentence(w))?.e ?? v.rows.at(-1).at + 1) + 0.5);
      return v;
    }
    case "DateCalendar": { const sp = findSpoken(m.text ?? "", t - 1, t + 3); v.text ??= String(m.text ?? ""); v.at ??= r2(sp?.at ?? t); v.until ??= r2(Math.max(v.at + 3, (sp?.end ?? t) + RULE.HOLD)); return v; }
    case "GlowCounter": { v.value ??= m.n?.value; v.valueAt ??= r2(m.n?.at ?? t); v.label ??= m.n?.label; v.at ??= r2(Math.max(0, (m.n?.at ?? t) - 0.1)); v.until ??= r2(v.valueAt + 2.5 + RULE.HOLD); return v; }
    case "AlertFrame": { const q = phraseNear(t, 5, 5); v.text ??= q?.text; v.at ??= r2(q?.at ?? t); v.barAt ??= v.at; v.until ??= r2(Math.max(v.at + 3, (q?.end ?? t) + RULE.HOLD)); return v; }
    case "BigQuestion": { const ws = wordsIn(t - 0.1, t + 8); const k = ws.findIndex((w) => /[?؟]$/.test(w.w)); const q = (k >= 0 ? ws.slice(0, k + 1) : ws.slice(0, 6)).slice(-8); v.text ??= q.map((w) => clean(w.w)).join(" ") + "؟"; v.at ??= r2(q[0]?.s ?? t); v.textAt ??= v.at; v.until ??= r2(Math.max(v.at + 3, (q.at(-1)?.e ?? t) + RULE.HOLD)); return v; }
    case "SearchBar": { v.query ??= m.slot?.topic ?? ph?.text ?? ""; v.at ??= r2(m.t); v.typeAt ??= r2(v.at + 0.1); if (m.slot?.img) { v.img ??= m.slot.img; v.imgAt ??= r2(v.typeAt + 0.6); } v.until ??= r2(Math.max(v.at + 3, (v.imgAt ?? v.typeAt + 1) + RULE.HOLD + 0.8)); return v; }
    case "MindMap": { const ss = steps(t + 0.3, 4, 3); v.center ??= (ph?.text ?? "").split(" ").slice(0, 3).join(" "); v.nodes ??= ss; v.at ??= r2(t); break; }
    case "WordCloud": { const ss = steps(t, 6, 2); v.words ??= ss.map((x, k) => ({ text: x.text, weight: k % 3 === 0 ? 3 : 2, at: x.at })); v.at ??= r2(ss[0]?.at ?? t); break; }
    case "RootsTree": { const ss = steps(t, 4, 3); v.branches ??= ss.slice(0, 1); v.roots ??= ss.slice(1); v.trunkAt ??= r2((ss[1]?.at ?? t + 1) - 0.3); v.at ??= r2(t); break; }
    case "Iceberg": { const ss = steps(t, 3, 3); v.top ??= [ss[0]?.text ?? ""]; v.hidden ??= ss.slice(1).map((x) => x.text); v.revealAt ??= r2(ss[1]?.at ?? t + 2); v.at ??= r2(t); break; }
    case "FillGlasses": { const ss = steps(t, 2, 3); v.items ??= ss.map((x, k) => ({ label: x.text, value: k ? 0.25 : 0.85, at: x.at })); v.at ??= r2(t); break; }
    case "ViciousCycle": { const ss = steps(t, 4, 3); v.steps ??= ss.map((x) => x.text); v.at ??= r2(t); break; }
    case "StickyNotes": { const ss = steps(t, 4, 3); v.notes ??= ss; v.at ??= r2(t); break; }
    case "VerseWords": { const x = m.v; v.words ??= x.words; v.times ??= x.cut; v.title ??= x.name; v.refText ??= x.ref; v.aya ??= x.aya; v.until ??= r2(x.cut.at(-1) + 0.6 + RULE.HOLD); return v; }
    case "NoteCard": {
      const h = m.h, title = v.title ?? h.text, cps = v.cps ?? 16;
      v.title = title; v.label ??= "حديث شريف"; v.tag ??= `${h.book ?? ""}${h.n ? ` (${h.n})` : ""}`.trim() || "حديث"; if (h.narrator) v.narrator ??= h.narrator; if (h.book) v.books ??= [{ book: h.book, n: h.n }];
      v.cps = cps; v.at ??= r2(h.at); v.until ??= r2(Math.max((h.until ?? h.at) + RULE.HOLD, v.at + 0.25 + [...title].length / cps + RULE.HOLD + 0.2)); return v;
    }
    case "PaperCover": return v;
    case "SectionsRail": return v;
    default: v.at ??= r2(t);
  }
  if (v.until == null) v.until = r2(Math.max(v.at + 4, pickEndFor(v)));
  return v;
}

// ───────────── 7) THE AREA MODEL (element_slots: one element per area per moment; ranks data/element_priority.json; areas from the grid kinds)
const ALL = { land: ["key", "left", "right"], port: ["band", "video"] };
const WRITING_T = new Set(["torn", "scraps", "blur", "stamp", "text", "words", "word", "title"]);
const spanOf = (it) => { const a = it.at ?? it.from ?? it.times?.[0] ?? it.oldAt; let b = it.until ?? it.to ?? (it.dur != null ? a + it.dur : a + 3); if (it.t === "pick") b = Math.max(b, pickEndFor(it)); if (it.t === "verse" && it.until == null) b = it.times.at(-1) + 1.2; return [a, b]; };
function areasOf(it, o) {
  if (it.t === "verse") return o === "land" || it.full ? ALL[o] : ["band"];
  if (["note", "hadith", "quote", "map", "pmap", "pick", "nameTag", "subscribe", "cover"].includes(it.t)) return ALL[o];   /* panels, maps, picks; the name card and the reminder are alone (coverage 2a / grid solo) */
  if (WRITING_T.has(it.t)) return o === "land" ? ["key"] : ["band"];
  const k = KIND_OF[it.t];
  if (k === "key") return o === "land" ? ["key"] : ["band"];
  if (k === "photo" || k === "list") { if (o !== "land") return ["band"]; if (it.t === "tphoto" && it.also?.length) return ["left", "right"]; return [it.side === "right" || it.slot?.land === "right" ? "right" : it.slot?.land === "panel" ? "key" : "left"]; }
  return ALL[o];
}
/* grid_plan.mjs PORT_ZONES (the portrait split the engine adds for picks, hadith cards and verses) — mirrored; tools/selftest_cases/d_builder.mjs compares it */
const gridPickLast = (it) => { let m = pickEndFor(it) - 0.8 - RULE.HOLD; if (it.typeAt != null && it.query) m = Math.max(m, it.typeAt + it.query.length / (it.cps ?? 12)); (it.lines ?? []).forEach((l) => { if (l && typeof l.at === "number" && typeof l.text === "string") m = Math.max(m, l.at + Math.max(0.5, l.text.length * 0.06)); }); return m + 0.8; };
function portZones(items) {
  return items.flatMap((it) => {
    if (it.only === "land") return [];
    if (it.t === "pick" && !RULE.PICK_FULL.has(it.el)) return [[it.at - 0.35, Math.max(it.until ?? it.at, gridPickLast(it) + 2)]];
    if (it.t === "note" && (it.phrases?.length || (it.way !== "card" && it.only !== "port"))) return [[(it.phrases?.[0]?.at ?? it.at) - 0.35, it.until]];
    if (it.t === "verse" && !it.full && (it.way === "noor" || it.way === "bigword" || (!it.way && it.only !== "port")) && it.times?.length) return [[it.times[0] - 0.35, it.until ?? it.times.at(-1) + 1.2]];
    return [];
  }).filter(([a, b]) => b > a);
}
class Board {
  constructor() { this.items = []; }
  clash(it, a, b) {
    const out = [];
    if (!RULE.SPLIT_OK.has(it.t) && inSplit(a, b)) out.push({ split: true });
    for (const x of this.items) {
      const [xa, xb] = spanOf(x); if (!(xa < b + SLOT_GAP && xb > a - SLOT_GAP)) continue;   // grid_plan: a slot is busy ±its margin around an item
      if (it.t === "nameTag" || x.t === "nameTag") { out.push(x); continue; }
      for (const o of FORMS) { const A = areasOf(it, o), B = areasOf(x, o); if (A.some((q) => B.includes(q))) { out.push(x); break; } }
    }
    if (it.t === "nameTag" && inSplit(a, b)) out.push({ split: true });
    /* grid_plan, portrait: while a gallery pick / hadith / verse is up (and around it) the portrait screen is split (PORT_ZONES), and a split portrait has no
       slot for a list card or the name / subscribe card */
    if (FORMS.includes("port") && ["rows", "nameTag", "subscribe"].includes(it.t)) for (const z of portZones(this.items)) if (a < z[1] + SLOT_GAP && b > z[0] - SLOT_GAP) { out.push({ split: true, port: true }); break; }
    /* …and the other way: a pick / hadith / verse brings its own portrait split, which may not fall on a list card or a name / subscribe card already placed */
    if (FORMS.includes("port") && ["pick", "note", "verse"].includes(it.t)) { const z = portZones([{ ...it, ...(it.until != null || it.t === "pick" ? { until: b } : {}), at: it.at != null ? a : it.at }])[0]; if (z) for (const x of this.items) if (["rows", "nameTag", "subscribe"].includes(x.t)) { const [xa, xb] = spanOf(x); if (xa < z[1] + SLOT_GAP && xb > z[0] - SLOT_GAP && !out.includes(x)) out.push(x); } }
    return out;
  }
  add(it) { this.items.push(it); }
  remove(it) { this.items = this.items.filter((x) => x !== it); }
}
const setSpan = (it, a, b) => {
  const [a0] = spanOf(it), d = r2(a - a0);
  const shift = (v, k) => { if (typeof v === "number" && (k === "at" || /At$/.test(k) || k === "from")) return r2(v + d); if (Array.isArray(v)) return v.map((x) => (typeof x === "number" && k === "times" ? r2(x + d) : shift(x, k))); if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([kk, x]) => [kk, shift(x, /At$/.test(k) && typeof x === "number" ? "at" : kk)])); return v; };
  if (d) for (const k of Object.keys(it)) if (!["until", "to", "dur", "id", "t", "el"].includes(k)) it[k] = shift(it[k], k);
  if (it.until != null) it.until = r2(b); else if (it.to != null) it.to = r2(b); else if (it.dur != null) it.dur = r2(b - a); else it.until = r2(b);
};
/** place one item: its own time, else later inside its lateness window (late_check / the requirement window), else shorter; optional ones may yield */
function place(board, it, { maxShift = RULE.LATE - 1.1, minDur = 1.6, canShift = true } = {}) {
  const [a0, b0] = spanOf(it), d0 = b0 - a0;
  const tries = [];
  for (let s = 0; s <= (canShift ? maxShift : 0) + 1e-9; s += 0.25) tries.push([a0 + s, a0 + s + d0]);
  for (const [a, b] of tries) if (!board.clash(it, a, b).length) { setSpan(it, a, b); board.add(it); return { ok: true }; }
  // shorter: end before the first clash that starts after our start
  for (const [a] of tries.slice(0, 1)) {
    const c = board.clash(it, a, a + d0).filter((x) => !x.split).map((x) => spanOf(x)[0]).filter((s) => s > a + minDur).sort((x, y) => x - y)[0];
    if (c == null || board.clash(it, a, c - 0.3).length) continue;
    const keep = JSON.stringify(it); setSpan(it, a, c - 0.3);
    /* an element whose stay follows its own events (a pick: its last «…At» + the hold) cannot be cut shorter than them: put back */
    if (spanOf(it)[1] > c - 0.3 + 0.01 || board.clash(it, ...spanOf(it)).length) { const back = JSON.parse(keep); for (const k of Object.keys(it)) delete it[k]; Object.assign(it, back); continue; }
    board.add(it); return { ok: true, trimmed: true };
  }
  return { ok: false, clashes: board.clash(it, a0, b0) };
}

// ───────────── 8) BUILD
function buildItems(picks, log) {
  const M = moments(), board = new Board(), out = [], defaults = [], dropped = [], media = [], notes = [];
  const P = picks?.moments ?? {};
  const choice = (m) => { const g = P[m.id]; if (g && (g.el || g.code)) return { el: g.el ?? g.code, vals: g.vals ?? {}, given: true }; const d = defaultPick(m); if (m.kind !== "metaphor" && m.kind !== "cover" && m.kind !== "rail") defaults.push({ id: m.id, el: d.el, note: d.note ?? "", t: m.t }); return { el: d.el, vals: d.vals ?? {}, media: d.media, sections: d.sections, note: d.note }; };
  /* an item remembers its own spoken start and how late it may go, so a later required item can push it inside that allowance (never beyond) */
  const tryPlace = (it, m, o = {}) => { const a0 = spanOf(it)[0]; const r = place(board, it, o); if (r.ok) { Object.defineProperty(it, "_org", { value: a0, enumerable: false, writable: true }); Object.defineProperty(it, "_maxShift", { value: o.maxShift ?? RULE.LATE - 1.1, enumerable: false, writable: true }); out.push(it); return true; } return false; };
  // (a) the cover first (cover_item.mjs: the project's cover picture; an existing cover picture in public/<p>/ when the agent's file has another name)
  const mc = M.find((m) => m.kind === "cover");
  let cover = null;
  if (mc) {
    const g = P.cover?.vals ?? {}; cover = { ...coverItem(p, BASE), ...g };
    if (!fs.existsSync(path.join(PUB, cover.src))) { const alt = fs.existsSync(path.join(PUB, p)) ? fs.readdirSync(path.join(PUB, p)).find((f) => /^cover.*\.(png|jpe?g|webp)$/i.test(f)) : null; if (alt) { cover.src = `${p}/${alt}`; if (!cover.srcPort || !fs.existsSync(path.join(PUB, cover.srcPort))) cover.srcPort = cover.src; defaults.push({ id: "cover", el: "PaperCover", note: `صورة الغلاف المتاحة public/${cover.src} (الاسم المنتظر ${coverNames(p, BASE).src})`, t: 0 }); } else media.push({ id: "cover", need: `صورة الغلاف public/${coverNames(p, BASE).src} (وكيل الغلاف)` }); }
    if (fs.existsSync(path.join(PUB, cover.src)) && (!cover.srcPort || !fs.existsSync(path.join(PUB, cover.srcPort)))) cover.srcPort = cover.src;   // cover_item: every picture the cover names must exist
    cover.id = "cover";
  }
  // (b) required content, most important first: verse/hadith (4) → pictures/maps/picks (3) → lists/dates (2)
  const order = M.filter((m) => !["cover", "metaphor", "rail"].includes(m.kind)).map((m) => ({ m, c: choice(m) }));
  /* a row that falls back to a list card (no picture) goes after the question series: one list card there serves both */
  const rk = ({ m, c }) => (c.el === "StatRow" && !["questions", "conditions"].includes(m.kind) ? 2.5 : null) ?? ({ verse: 4, hadith: 4, order: 3.6, person: 3.5, place: 3.4, mention: 3.3, required: 3.3, depict: 3.2, state: 3.2, episode: 3.1, due: 2.4, questions: 2.6, conditions: 2.6, date: 2.5, number: 1.5 }[m.kind] ?? 2);
  order.sort((x, y) => rk(y) - rk(x) || x.m.t - y.m.t);
  const metaUsed = [];
  const placeOne = ({ m, c }) => {
    if (!c.el) { if (c.media) media.push({ id: m.id, need: `${m.need} عند ${mm(m.t)} — ${c.note}` }); return; }
    /* a due gallery pick is satisfied by any item of it (pick_triggers: used anywhere, or an allowed alternative) */
    if (m.kind === "due" && out.some((x) => x.el === m.el || m.also.includes(x.el) || m.also.includes(x.t))) return;
    /* two orders for one moment («tphoto@3:36» twice): one item of that type there serves both (requirements: has(type, at ± 0.5)) */
    if (m.kind === "order" && out.some((x) => x.t === m.type && spanOf(x)[0] <= m.t + 0.5 && spanOf(x)[1] >= m.t - 0.5)) return;
    /* a required element of the same kind already there (a news card, a date) serves the rule too (coverage §1b window) */
    if (m.kind === "required" && out.some((x) => (m.needTypes.includes(x.t) || m.needTypes.includes("*")) && (!m.rule?.srcPrefix || String(x.src ?? x.img ?? "").startsWith(m.rule.srcPrefix)) && spanOf(x)[0] <= m.t + m.after && spanOf(x)[1] >= m.t - m.before)) return;
    /* a picture already on screen at this moment (an order or a person row placed it) serves the mention / row too (requirements + coverage: any visual there) */
    if (["mention", "person", "depict", "state"].includes(m.kind) && out.some((x) => (m.visual ? RULE.VISUAL.has(x.t) : (m.needTypes ?? []).includes(x.t) || RULE.VISUAL.has(x.t)) && spanOf(x)[0] <= m.t + Math.min(4, m.after ?? 4) && spanOf(x)[1] >= m.t - Math.min(3, m.before ?? 3))) { const d = defaults.findIndex((x) => x.id === m.id); if (d >= 0) defaults.splice(d, 1); return; }
    let it;
    try {
      if (c.el === "PaperMap") it = mapItem(m, c.vals);
      else it = mk(c.el, contentFor(c.el, m, c.vals), m.id);
    } catch (e) { if (e instanceof PickError) { notes.push(`✘ ${m.id}: ${e.message}`); media.push({ id: m.id, need: `${m.need}: ${e.message}` }); return; } throw e; }
    it._why = m.id;
    if (it.t === "pick" && RULE.METAPHORS.includes(it.el)) metaUsed.push(it.el);
    // a picture inside a clip window sits in the gap «panel» (el.mjs add); else the free side
    if (["tphoto", "scholar", "pic", "news", "date", "flag", "clock"].includes(it.t)) it.slot = { land: inSplit(spanOf(it)[0], spanOf(it)[0] + 0.1) ? "panel" : "left" };
    const win = m.kind === "due" ? m.hits : [m.t];
    let ok = false;
    for (const h of win) {
      if (m.kind === "due" && h !== m.t) { const it2 = mk(c.el, contentFor(c.el, { ...m, t: h }, c.vals), m.id); Object.assign(it, it2, { id: it.id }); }
      const [a] = spanOf(it);
      /* a due pick shows the sentence that made it due: it may start later while that sentence is still being said (late_check judges its words, not its trigger) */
      const maxShift = m.kind === "due" ? Math.max(RULE.LATE - 1.1, (labelLastSaid(it) ?? spanOf(it)[0]) + RULE.SAID_BEFORE - 0.2 - spanOf(it)[0]) : m.after != null ? Math.max(0, Math.min(m.after - 0.5, RULE.LATE - 1.1)) : RULE.LATE - 1.1;
      if (tryPlace(it, m, { maxShift })) { ok = true; break; }
      if (it.slot?.land === "left") { it.slot.land = "right"; it.side = "right"; if (tryPlace(it, m, { maxShift })) { ok = true; break; } it.slot.land = "left"; delete it.side; }
      // a non-picture element over a clip window: after the window, inside the requirement window
      const sp = splitAt(a); if (sp && !RULE.SPLIT_OK.has(it.t) && m.after != null && sp.to < m.t + m.after - 1) { const it3 = JSON.parse(JSON.stringify(it)); Object.defineProperty(it3, "_why", { value: m.id, enumerable: false, writable: true }); const [, b0] = spanOf(it); setSpan(it3, r2(sp.to + 0.1), r2(sp.to + 0.1 + (b0 - a))); if (tryPlace(it3, m, { maxShift: 1 })) { ok = true; it = it3; break; } }
    }
    if (!ok) {
      // the next valid option: a picture/list requirement as writing of its own words in the band (torn), when the requirement accepts it; else a lower-ranked
      // item that holds the place yields (element_slots: the more important stays)
      const all = board.clash(it, ...spanOf(it)), blockers = all.filter((x) => !x.split && x._opt);   /* only an optional item yields: a required one keeps its place */
      if (blockers.length && blockers.length === all.length) { for (const x of blockers) { board.remove(x); out.splice(out.indexOf(x), 1); dropped.push({ id: x._why ?? x.id, why: `أخلى مكانه لـ${m.id}` }); } if (tryPlace(it, m)) ok = true; }
    }
    if (!ok) {
      // both required: the one already placed moves inside ITS own window (its lateness allowance) to make room — one step of backtracking, undone if it fails
      const all = board.clash(it, ...spanOf(it)).filter((x) => !x.split);
      if (all.length === 1 && !all[0]._opt) {
        const x = all[0], keepX = JSON.stringify(x), [xa0] = spanOf(x), org = x._org ?? xa0;
        board.remove(x);
        if (place(board, it, { maxShift: 0 }).ok) {
          const back = JSON.parse(keepX); for (const k of Object.keys(x)) delete x[k]; Object.assign(x, back);
          const left = (x._maxShift ?? RULE.LATE - 1.1) - (xa0 - org);
          if (place(board, x, { maxShift: Math.max(0, left) }).ok) { out.push(it); ok = true; }
          else { board.remove(it); const back2 = JSON.parse(keepX); for (const k of Object.keys(x)) delete x[k]; Object.assign(x, back2); board.add(x); }
        } else board.add(x);
      }
    }
    if (!ok && m.kind === "due" && !P[m.id]) {   // pick_triggers asks for the element in the video, not at one second: the first empty stretch whose words suit it
      const g = placeInGaps(c.el, m.id, board, (x) => out.push(x));
      if (g) { ok = true; it = g; defaults.push({ id: m.id, el: c.el, note: `مواضعه مشغولة (${m.hits.map(mm).join("، ")}): وُضع في فراغ ${mm(spanOf(g)[0])} بكلماته هناك`, t: spanOf(g)[0] }); }
    }
    if (!ok) { const who = board.clash(it, ...spanOf(it)).map((x) => (x.split ? "نافذة مقطع" : `${x.el ?? x.t} ${mm(spanOf(x)[0])}–${mm(spanOf(x)[1])} (${x._why ?? ""})`)); (m.optional ? dropped : media).push({ id: m.id, need: `${m.need} عند ${mm(m.t)} [${spanOf(it).map((v) => v.toFixed(1)).join("–")}]`, why: `لا مكان خالٍ في نافذته: ${who.join("، ") || "—"}` }); return; }
    if (m.optional) markOpt(it);
    if (TRACE) console.error(`[place] ${m.id} → ${it.el ?? it.t} ${spanOf(it).map((v) => v.toFixed(2)).join("–")}`);
  };
  /* fixed windows first (their words are now), then the sections rail in the first seconds, then the picks that may stand anywhere their words suit */
  for (const x of order.filter((x) => !["due", "number"].includes(x.m.kind))) placeOne(x);
  // (c) the sections rail: the first free stretch (no clip window, nothing else on screen) — RAIL_MAX s at most when the start allows it
  const mr = M.find((m) => m.kind === "rail");
  if (mr) {
    const secs = (P.sections?.vals?.sections ?? P.sections ?? mr.sections).map((s) => ({ title: s.title }));
    const n = secs.length, len = 0.5 + n * 0.55 + RULE.HOLD + 1.2;
    let placed = false;
    for (let t0 = 0.3; t0 < Math.min(DUR - len, 120); t0 += 0.25) {
      const it = mk("SectionsRail", { at: r2(t0), until: r2(t0 + len), sections: secs.map((s, k) => ({ title: s.title, at: r2(t0 + 0.4 + k * 0.55) })) }, "sections");
      if (!board.clash(it, t0, t0 + len).length) { board.add(it); out.push(it); placed = true; if (t0 > RAIL_MAX) notes.push(`⚠ خط الأقسام عند ${t0.toFixed(1)}ث لا في أول ${RAIL_MAX} ثوانٍ: نافذة مقطع أو عنصر مطلوب يملأ البداية (${SPLITS.filter((w) => w.from < RAIL_MAX).map((w) => `${mm(w.from)}–${mm(w.to)}`).join("، ") || "—"})${appliesToEpisode(p, BASE) ? " — بوابة الأقسام ترفضه" : ""}`); break; }
    }
    if (!placed) media.push({ id: "sections", need: "خط الأقسام: لا فراغ له في أول دقيقتين" });
  }
  // (d) the name card and the subscribe reminder: their draft times, else the nearest stretch where nothing else is on screen
  /* spec_normalize step 3 adds a name card and a subscribe reminder to any episode without them (and drops what overlaps them) — so they are planned here:
     the draft's, else the normaliser's own default times (read from it) */
  const cards = (BASE.items ?? []).filter((x) => x.t === "nameTag" || x.t === "subscribe").map((x) => ({ ...x }));
  if (BASE.kind !== "reel") {
    const SN = src("spec_normalize.mjs"), nd = Number(/t: "nameTag", at: dur > 25 \? 15 : 0\.8,[^\n]*?dur: ([\d.]+)/.exec(SN)?.[1] ?? NaN), sd = Number(/t: "subscribe", at: \+Math\.max\(5, Math\.min\(40, dur - 4\.5\)\)\.toFixed\(2\),[^\n]*?dur: ([\d.]+)/.exec(SN)?.[1] ?? NaN);
    if (!Number.isFinite(nd) || !Number.isFinite(sd)) bug("مصدر القاعدة تغيّر: بطاقة الاسم والاشتراك الافتراضيتان في tools/spec_normalize.mjs");
    if (!cards.some((x) => x.t === "nameTag")) cards.push({ t: "nameTag", at: DUR > 25 ? 15 : 0.8, dur: nd });
    if (!cards.some((x) => x.t === "subscribe") && DUR >= 9 && !(FORMS.length === 1 && FORMS[0] === "land" && DUR < 60)) cards.push({ t: "subscribe", at: r2(Math.max(5, Math.min(40, DUR - 4.5))), dur: sd });
  }
  for (const b of cards) {
    const it = { id: `mb${(++ID).toString(36)}`, t: b.t, at: b.at, dur: b.dur ?? 3, ...(b.style ? { style: b.style } : {}) }; Object.defineProperty(it, "_why", { value: b.t, enumerable: false, writable: true });
    /* a card is not optional: spec_normalize puts one back and drops what overlaps it — so nothing evicts it */
    let ok = false;
    for (const d of [0, ...Array.from({ length: 160 }, (_, k) => (k % 2 ? 1 : -1) * Math.ceil((k + 1) / 2) * 0.5)]) { const a = r2(b.at + d); if (a < 1 || a + it.dur > DUR - 0.5) continue; if (!board.clash(it, a, a + it.dur).length) { it.at = a; board.add(it); out.push(it); ok = true; break; } }
    if (!ok && TRACE) console.error("[card]", b.t, b.at, it.dur, DUR, JSON.stringify(board.clash(it, b.at, b.at + it.dur).map((x) => x.split ? (x.port ? "portzone" : "split") : x.t + "@" + spanOf(x).join("-"))));
    if (!ok) dropped.push({ id: b.t, why: `لا فراغ قرب ${mm(b.at)}` });
  }
  /* the picks that may stand anywhere their sentence is still being said: after the cards, which must be alone */
  for (const x of order.filter((x) => ["due", "number"].includes(x.m.kind))) placeOne(x);
  // (e) the drawn meanings (pick_triggers quota), each in the longest empty stretch, on his words there
  const needM = M.filter((m) => m.kind === "metaphor").length - metaUsed.length;
  const metaPicks = (picks?.metaphors ?? []).slice();
  for (let k = 0; k < needM; k++) {
    const g = metaPicks.shift();
    const gaps = gapsOf(board.items, { minGap: 4 }).filter(([a, b]) => b - a >= 4.5).sort((x, y) => (y[1] - y[0]) - (x[1] - x[0]));
    let ok = false;
    for (const [a, b] of g?.vals?.at != null ? [[g.vals.at, g.vals.at + 30]] : gaps) {
      const el = g?.el ?? ["WordCloud", "MindMap", "RootsTree", "Iceberg", "FillGlasses", "ViciousCycle"].filter((x) => !metaUsed.includes(x))[0] ?? "WordCloud";
      const t0 = wordAt(a + 0.3)?.s ?? a;
      let it; try { it = mk(el, contentFor(el, { t: t0, kind: "metaphor", span: Math.max(4, Math.min(14, b - t0 - RULE.HOLD - 1)) }, g?.vals ?? {}), `metaphor:${k}`); } catch (e) { notes.push(`✘ metaphor:${k}: ${e.message}`); if (TRACE) console.error("[metaphor] mk", el, e.message); continue; }
      const [ia, ib] = spanOf(it); if (TRACE) console.error("[metaphor] try", el, ia, ib, "gap", a, b, JSON.stringify(it).slice(0, 200)); if (ib > b + 0.5 && !g) continue;
      if (tryPlace(it, null, { maxShift: 0.5 })) { metaUsed.push(el); ok = true; if (!g) defaults.push({ id: `metaphor:${k}`, el, note: `في فراغ ${mm(ia)}–${mm(ib)} بكلماته (حسّنه: اختر المعنى المجسّد الأنسب)`, t: ia }); break; }
    }
    if (!ok && TRACE) console.error("[metaphor] gaps", JSON.stringify(gapsOf(board.items, { minGap: 1 }).map((g) => g.map((v) => +v.toFixed(1)))));
    if (!ok) media.push({ id: `metaphor:${k}`, need: "معنى مجسّد: لا فراغ ٤٫٥ ث له — اختره في الاختيارات (metaphors) بوقته" });
  }
  // (f) the agent's free additions
  for (const [i, x] of (picks?.extra ?? []).entries()) {
    let it; try { it = mk(x.el ?? x.code, contentFor(x.el ?? x.code, { t: x.vals?.at ?? x.vals?.from ?? 0, kind: "extra" }, x.vals ?? {}), `extra:${i}`); } catch (e) { notes.push(`✘ extra:${i}: ${e.message}`); continue; }
    markOpt(it); if (!tryPlace(it, null)) dropped.push({ id: `extra:${i}`, why: "لا مكان خالٍ في وقته" });
  }
  return { items: out, cover, board, defaults, dropped, media, notes };
}
/** an element placed in the longest empty stretch that suits it, its content from his words there (a question for BigQuestion) */
function placeInGaps(code, why, board, push) {
  const gaps = gapsOf(board.items).filter(([a, b]) => b - a >= 5).sort((x, y) => (y[1] - y[0]) - (x[1] - x[0]));
  for (const [a, b] of gaps) {
    let t0 = wordAt(a + 0.3)?.s ?? a;
    if (code === "BigQuestion") { const q = wordsIn(a + 0.2, b - 2).find((w) => /[?؟]$/.test(w.w)); if (!q) continue; const ws = wordsIn(a + 0.2, q.s + 0.01); const k = ws.map((w) => endsSentence(w) && w !== q).lastIndexOf(true); t0 = ws[k + 1]?.s ?? ws[0]?.s ?? t0; }
    let it; try { it = mk(code, contentFor(code, { t: t0, kind: "gap", span: Math.max(4, Math.min(14, b - t0 - RULE.HOLD - 1)) }), why); } catch { continue; }
    const [ia, ib] = spanOf(it); if (ib > b + 0.3 || ia < a - 0.05) continue;
    if (place(board, it, { maxShift: 0.5 }).ok) { push(it); return it; }
  }
  return null;
}
function mapItem(m, vals) {
  const q = bare(m.text), C = RULE.COUNTRIES.find(([forms]) => forms.some((f) => { const b = bare(f); return b === q || q.startsWith(b) || b.startsWith(q); }));
  if (!C && !m.geo) throw new PickError(`لا أعرف موضع «${m.text}» على الخريطة (names_scan)`);
  const [, iso, center] = C ?? [null, null, [m.geo.lon, m.geo.lat]], from = r2(m.t - 0.1), to = r2(Math.max(m.t + RULE.HOLD + 1, from + 4));
  const it = mk("PaperMap", { from, to, center, spanLat: 14, landCenter: center, landSpan: 14, ...(iso ? { highlight: [iso], highlightAt: { [iso]: r2(m.t) }, flag: true } : {}), ...(iso && RULE.ATLAS.has(iso) ? { atlas: true } : { geo: "world" }), pts: [], ...vals }, m.id);
  it.auto = "montage_build";
  return it;
}
/** empty stretches exactly as coverage_check counts them (every item but the cover / watermark, and the clip windows) */
function gapsOf(items, { minGap = RULE.GAP } = {}) {
  const spans = [...items.filter((x) => !["wm", "cover"].includes(x.t)).map(spanOf), ...SPLITS.map((s) => [s.from, s.to]), ...(BASE.solos ?? []).map((s) => [s.from, s.to])].sort((a, b) => a[0] - b[0]);
  const out = []; let end = 0;
  for (const [a, b] of spans) { if (a - end > minGap) out.push([end, a]); end = Math.max(end, b); }
  if (DUR - 3 - end > minGap) out.push([end, DUR - 3]);
  return out;
}
/** the first minute as coverage_check §2b counts it: up to min(first-minute length, the whole video) — a short video is judged to its very end */
function firstGapsOf(items, slack = 0.3) {
  const spans = [...items.filter((x) => !["wm", "cover"].includes(x.t)).map(spanOf), ...SPLITS.map((s) => [s.from, s.to]), ...(BASE.solos ?? []).map((s) => [s.from, s.to])].sort((a, b) => a[0] - b[0]);
  const L = Math.min(RULE.FIRST_LEN, DUR), out = []; let e = 0;
  for (const [a, b] of spans) { if (a >= L) break; if (a - e > RULE.FIRST_GAP - slack) out.push([e, a]); e = Math.max(e, b); }
  if (e < L && L - e > RULE.FIRST_GAP - slack) out.push([e, L]);
  return out;
}
/** a phrase made to start on a content word (writing_sync judges a writing from its first content word; writing_place refuses a dangling start) */
const contentFirst = (ph) => {
  const ws = ph.ws.slice(), weak = (w) => { const b0 = bare(w.w); return b0.length < 3 || RULE.WS_STOP.has(b0) || DANGLE_N.has(norm(clean(w.w))); };
  while (ws.length > 2 && weak(ws[0])) ws.shift();
  if (weak(ws[0]) || ws.length < 2) return null;
  return { text: ws.map((w) => clean(w.w)).join(" "), at: r2(ws[0].s), end: ph.end, n: ws.length, ws };
};
/** writing for the empty stretches: ≤ one torn and one scraps a minute (writing_place), list cards of his phrases for the rest */
function fillGaps(board, writing, defaults, round) {
  const perMin = new Set(writing.map((w) => `${w.t}@${Math.floor((findSpoken(w.text, w.from ?? 0)?.at ?? w.from ?? 0) / 60)}`));
  const added = [];
  const first = (a, b) => b <= RULE.FIRST_LEN + 1;
  const gaps = [...gapsOf(board.items, { minGap: RULE.GAP - 1 }), ...firstGapsOf(board.items, 0.4)];
  const seen = new Set();
  for (const [a, b] of gaps.sort((x, y) => x[0] - y[0])) {
    const key = `${a.toFixed(1)}`; if (seen.has(key)) continue; seen.add(key);
    let t = a;
    const isFirst = first(a, b), endBy = b - SLOT_GAP - 0.05;
    while (t < b - (isFirst ? RULE.FIRST_GAP * 0.5 : RULE.GAP * 0.5)) {
      const ph = phrasesIn(t, b, RULE.SCRAPS_MAX, isFirst ? 2 : 3).map(contentFirst).filter(Boolean).find((x) => x.at >= t - 0.01);
      if (!ph) break;
      const minute = Math.floor(ph.at / 60);
      const tryWriting = () => {
        let it = null;
        for (const kind of ["scraps", "torn"]) {
          if (perMin.has(`${kind}@${minute}`)) continue;
          if (kind === "torn" && writing.filter((w) => w.t === "torn").length + 1 > (writing.length + 1) * 0.5) continue;
          const cand = { id: `mbw${round}_${added.length}`, t: kind, text: ph.text, at: ph.at, until: r2(Math.min(ph.end + RULE.HOLD, endBy)) };
          if (cand.until - cand.at >= 1.2 && !board.clash(cand, cand.at, cand.until).length) { it = cand; perMin.add(`${kind}@${minute}`); writing.push({ t: kind, text: ph.text, from: Math.floor(ph.at), auto: "montage_build" }); break; }
        }
        return it;
      };
      const tryRows = () => {
        let it = null;
        {   // a list card of his consecutive phrases (rows: no per-minute limit, its own kind), on the free side
          const from0 = Math.max(a + SLOT_GAP + 0.05, ph.at - 0.1);
          const rows = phrasesIn(ph.at, Math.min(endBy - RULE.HOLD - 0.6, ph.at + 12), 4, 2).map(contentFirst).filter(Boolean).filter((r) => r.at >= from0).slice(0, 3);
          if (rows.length) for (const side of ["left", "right"]) {
            const cand = mk("StatRow", { from: r2(Math.max(from0, rows[0].at - 0.1)), to: r2(Math.min(endBy, rows.at(-1).end + RULE.HOLD + 0.5)), rows: rows.map((r) => ({ at: r.at, label: r.text })) }, "gap");
            if (side === "right") cand.side = "right";
            const [ca, cb] = spanOf(cand);
            if (cb - ca >= 1.6 && cb <= endBy + 0.01 && ca >= a + SLOT_GAP && !board.clash(cand, ca, cb).length) { it = cand; break; }
          }
        }
        return it;
      };
      const tryCloud = () => {
        let it = null;
        if (endBy - ph.at >= 4) {   // a word cloud of his phrases there (a gallery pick: it holds every area, and the split portrait too)
          const ws = phrasesIn(ph.at, endBy - 0.8 - RULE.HOLD, 3, 2).map(contentFirst).filter(Boolean).slice(0, 5);
          if (ws.length >= 2) {
            const cand = mk("WordCloud", { at: r2(Math.max(a + SLOT_GAP + 0.05, ws[0].at - 0.1)), until: r2(Math.min(endBy, ws.at(-1).at + 0.8 + RULE.HOLD + 0.3)), words: ws.map((w, k) => ({ text: w.text, weight: k ? 2 : 3, at: w.at })) }, "gap");
            const [ca, cb] = spanOf(cand);
            for (let s0 = 0; s0 <= 1.5 && cb + s0 <= endBy + 0.01; s0 += 0.25) if (ca + s0 >= a + SLOT_GAP && !board.clash(cand, ca + s0, cb + s0).length) { if (s0) setSpan(cand, r2(ca + s0), r2(cb + s0)); it = cand; break; }   // a little later when its portrait split would touch the card before it
          }
        }
        return it;
      };
      /* variety (mg_usage_audit counts kinds): the filler kind used least so far goes first; a word cloud only when nothing lighter fits */
      const used = { w: board.items.filter((x) => x.t === "torn" || x.t === "scraps").length, r: board.items.filter((x) => x.t === "rows").length };
      let it = null;
      for (const g of used.r < used.w ? [tryRows, tryWriting, tryCloud] : [tryWriting, tryRows, tryCloud]) { it = g(); if (it) break; }
      if (!it) { if (TRACE) console.error(`[fill ${mm(a)}–${mm(b)}] «${ph.text}» ${ph.at}: ${["scraps", "torn"].map((k) => `${k}${perMin.has(`${k}@${minute}`) ? " مستعمل" : ""}`).join(" ")} · بنود: ${(() => { const rows = phrasesIn(ph.at, Math.min(endBy - RULE.HOLD - 0.6, ph.at + 12), 4, 2).map(contentFirst).filter(Boolean); if (!rows.length) return "لا عبارة"; const c = mk("StatRow", { from: r2(Math.max(a + SLOT_GAP, rows[0].at - 0.1)), to: r2(Math.min(endBy, rows.at(-1).end + RULE.HOLD + 0.5)), rows: rows.slice(0, 3).map((r) => ({ at: r.at, label: r.text })) }, "dbg"); return `${spanOf(c).map((v) => v.toFixed(2)).join("–")} endBy ${endBy.toFixed(2)} clash ${board.clash(c, ...spanOf(c)).map((x) => x.split ? (x.port ? "portzone" : "split") : x.t + "@" + spanOf(x)[0]).join(",")}`; })()}`); t = ph.end + 0.1; continue; }
      markOpt(it); Object.defineProperty(it, "_why", { value: "gap", enumerable: false, writable: true });
      board.add(it); added.push(it);
      t = spanOf(it)[1] - 0.1;
    }
  }
  if (added.length) defaults.push({ id: `fill:${round}`, el: "كتابة/بنود", note: `${added.length} عنصراً كتابياً في الفراغات من كلامه (${added.map((x) => mm(spanOf(x)[0])).join("، ")})`, t: 0 });
  return added;
}
/** a gap no phrase could fill: the element before it stays a little longer (never past its own limit: a picture's late_check warn limit, a scene effect's,
    the name / subscribe cards 4 s at most) — the next element still starts at its words */
function extendIntoGaps(board, defaults) {
  const ext = [];
  const lim = [...gapsOf(board.items, { minGap: RULE.GAP - 0.6 }), ...firstGapsOf(board.items, 0.3)];
  for (const [a, b] of lim) {
    const prev = board.items.filter((x) => Math.abs(spanOf(x)[1] - a) < 0.02 && !["cover", "wm"].includes(x.t));
    for (const x of prev) {
      const [xa, xb] = spanOf(x); let nb = r2(b - SLOT_GAP - 0.05);
      if (["tphoto", "scholar", "pic"].includes(x.t)) nb = Math.min(nb, r2(xa + RULE.PIC_WARN - 0.2));
      if (x.t === "scenefx") nb = Math.min(nb, r2(xa + RULE.FX_MAX - 0.5));
      if (x.t === "nameTag" || x.t === "subscribe") nb = Math.min(nb, r2(xa + 6));   // the name / reminder card: 6 s at most (spec_normalize gives ≈3 s; the reviewed anchor-kills-children episode held one 7 s)
      if (nb <= xb + 0.05) continue;
      const keep = JSON.stringify(x); board.remove(x);
      /* the longest stay that clears what follows (its slot margin, a portrait split that starts there): the far end first, then shorter, while the gap
         that remains is still within the rule */
      const need = a < Math.min(RULE.FIRST_LEN, DUR) ? RULE.FIRST_GAP - 0.2 : RULE.GAP - 0.5;
      let done = false;
      for (let e = nb; e > xb + 0.05 && b - e <= need + 1e-9; e = r2(e - 0.15)) {
        if (x.until != null || x.t === "pick") x.until = e; else if (x.to != null) x.to = e; else if (x.dur != null) x.dur = r2(e - xa); else x.until = e;
        if (spanOf(x)[1] <= e + 0.01 && !board.clash(x, ...spanOf(x)).length) { done = true; break; }
      }
      if (!done) { const back = JSON.parse(keep); for (const k of Object.keys(x)) delete x[k]; Object.assign(x, back); }
      else ext.push(`${x.el ?? x.t} ${mm(xa)}`);
      board.add(x);
      break;
    }
  }
  if (ext.length) defaults.push({ id: "extend", el: "إطالة", note: `${ext.length} عنصراً بقي أطول قليلاً ليسدّ فراغاً بلا كلام يصلح كتابة (${ext.join("، ")})`, t: 0 });
}

// ───────────── 9) THE SCRATCH WORKSPACE: generators that place (grid_plan --write, writing_place --write, matte_windows) and the gates that judge
const run = (sb, args) => runIn(sb.root, args);
function assemble(built, writingItems) {
  const spec = JSON.parse(JSON.stringify(BASE));
  for (const k of ["skipRequired", "skipMentions", "skipPicks"]) if (spec[k]) { spec[k] = spec[k].filter((x) => typeof spec.waiverOK?.[typeof x === "string" ? x : x.el] === "string"); if (!spec[k].length) delete spec[k]; }   // no waiver the user did not give (coverage_check)
  delete spec.skipReasons;
  const items = built.items.filter((x) => !["torn", "scraps"].includes(x.t)).map((x) => ({ ...x }));
  spec.items = [...(built.cover ? [built.cover] : []), ...items.sort((a, b) => spanOf(a)[0] - spanOf(b)[0])];
  spec.galleryRef = BASE.galleryRef ?? true;
  return spec;
}
async function onSandbox(sb, spec, writing, { mattes, board }) {
  // the writing: placed by writing_place itself (its hold, its gap, its per-minute rule) from the writing list
  fs.writeFileSync(path.join(sb.tmp, "writing.json"), JSON.stringify({ ...(WRITING ?? {}), items: writing }, null, 1));
  sb.writeSpec(spec);
  const wp = await run(sb, ["tools/writing_place.mjs", p, "--write"]);
  if (TRACE) console.error("[writing_place]", wp.out.trim().split(/\r?\n/).slice(-3).join(" | "));
  if (wp.code !== 0) return { fail: wp.out };
  let s = sb.readSpec();
  /* writing_place puts a phrase at its first word; writing_sync judges it from its first CONTENT word, and coverage_check aligns each scrap with its own
     reading (lib/scraps_times.mjs): the start and the scrap times are set so all three agree (the text and the order stay writing_place's) */
  for (const it of s.items.filter((x) => x.t === "torn" || x.t === "scraps")) {
    if (it.t === "scraps") { const al = alignScraps(it.text, it.at, it.until, Array.isArray(W0) ? W0 : W0.words); it.times = it.times.map((x, k) => (al[k] != null && Math.abs(x - al[k]) > 0.2 ? al[k] : x)); }
    syncTiming(it);
    const bw = board?.items.find((x) => x.t === it.t && x.text === it.text); if (bw && bw.until - it.at >= 1.2) it.until = bw.until;   // never into the next element of its area (the board planned it so)
  }
  sb.writeSpec(s);
  // maps: an isolation window behind each landscape map (coverage_check 1c), its matte computed once (matte_windows.mjs)
  const maps = s.items.filter((x) => x.t === "pmap" && !x.only);
  s.behind = (s.behind ?? []).filter((w) => !w._mb);
  for (const m of maps) if (!(s.behind ?? []).some((w) => (!w.only || w.only === "land") && w.from <= m.from + 0.3 && w.to >= m.to - 0.3)) {
    /* the matte of this very window, when matte_windows made it already (its own name: <p>/mt/w_<from>_<to>.mp4) — the GPU runs once per window */
    const mf = `${p}/mt/w_${m.from}_${m.to}.mp4`;
    (s.behind ??= []).push({ only: "land", from: m.from, to: m.to, ...(fs.existsSync(path.join(sb.pub, mf)) ? { matte: { src: mf, start: m.from } } : {}) });
  }
  sb.writeSpec(s);
  if (mattes && (s.behind ?? []).some((w) => !w.matte && !s.matte)) {
    const mw = await run(sb, ["tools/matte_windows.mjs", path.join("data", "specs", `${p}.json`)]);
    if (TRACE) console.error("[matte_windows]", mw.code, mw.out.trim().split(/\r?\n/).slice(-3).join(" | "));
    if (mw.code !== 0) return { fail: "matte_windows: " + mw.out.slice(-400) };
    s = sb.readSpec();
  }
  // the slots: grid_plan --write per orientation (face zone + the first free slot of its kind, the gallery's place)
  for (const o of FORMS) { const g = await run(sb, ["tools/grid_plan.mjs", path.join("data", "specs", `${p}.json`), "--o", o, "--write"]); if (TRACE) console.error(`[grid_plan --write ${o}]`, g.code, g.out.trim().split(/\r?\n/).slice(-2).join(" | ")); }
  if (TRACE) { const q = sb.readSpec(); console.error("[after generators] behind", (q.behind ?? []).length, "slots", q.items.filter((x) => x.slot).length); }
  return { spec: sb.readSpec() };
}
/** which built item a failing gate line names: #id, type#index, «type» (start–end), or type + m:ss */
function blame(line, spec) {
  const out = new Set(), items = spec.items;
  for (const m of line.matchAll(/#([a-z0-9_]{3,})/g)) { const i = items.findIndex((x) => x.id === m[1]); if (i >= 0) out.add(i); }
  for (const m of line.matchAll(/\b([a-zA-Z]+)#(\d+)\b/g)) { const i = Number(m[2]); if (items[i]?.t === m[1]) out.add(i); }
  for (const m of line.matchAll(/«(\w+)» \(([\d.]+)–/g)) { const i = items.findIndex((x) => x.t === m[1] && Math.abs(spanOf(x)[0] - Number(m[2])) < 0.06); if (i >= 0) out.add(i); }
  if (!out.size) for (const m of line.matchAll(/(\w+)\s+(\d+):(\d{2})/g)) { const s = Number(m[2]) * 60 + Number(m[3]); const i = items.findIndex((x) => (x.t === m[1] || x.el === m[1]) && Math.floor(spanOf(x)[0]) === s); if (i >= 0) out.add(i); }
  return [...out];
}

// ───────────── 10) THE TEMPLATE
function template() {
  const M = moments(), outF = opt("out", path.join(T, "picks_template.json"));
  const tpl = { project: p, _doc: "اختيارات المونتاج وحدها: لكل لحظة عنصرها (el = رمز المعرض) ومضمونه (vals). ما تتركه يملؤه الباني بالافتراضي المكتوب هنا ويذكره. لا مكان ولا مقاس ولا إعفاء: الباني يحسبها.", sections: SECTIONS, metaphors: [], extra: [], writing: WRITING?.items ?? [], moments: {} };
  for (const m of M) {
    if (m.kind === "metaphor") { tpl.metaphors.push({ el: null, vals: {}, _need: m.need, _options: RULE.METAPHORS }); continue; }
    const d = defaultPick(m);
    const say = m.t != null ? wordsIn(m.t - 2, m.t + 6).map((w) => w.w).join(" ") : "";
    tpl.moments[m.id] = { el: null, vals: {}, _at: m.t != null ? `${mm(m.t)} (${m.t.toFixed(2)}ث)` : "—", _need: m.need, _say: say, _default: d.el ? { el: d.el, ...(d.vals ? { vals: d.vals } : {}), note: d.note ?? "" } : null, ...(d.media ? { _media: d.note } : {}), ...(m.hits ? { _hits: m.hits.map(mm) } : {}), ...(m.needTypes ? { _types: m.needTypes } : {}) };
  }
  fs.mkdirSync(path.dirname(outF), { recursive: true });
  fs.writeFileSync(outF, JSON.stringify(tpl, null, 1));
  const media = Object.entries(tpl.moments).filter(([, v]) => v._media);
  console.log(`✔ قالب الاختيارات: ${Object.keys(tpl.moments).length} لحظة + ${tpl.metaphors.length} معنى مجسّد + ${tpl.writing.length} كتابة → ${outF}`);
  if (media.length) { console.log(`⚠ ${media.length} لحظة بلا وسائط (صورة) — املأ src أو اجلبها قبل البناء:`); for (const [k, v] of media) console.log(`   ${k} ${v._at}: ${v._need} — ${v._media}`); }
  process.exit(0);
}

// ───────────── 11) MAIN
if (has("picks-template")) template();
const picksF = opt("picks", null);
if (!picksF) { console.error("✘ --picks <picks.json> (أو --picks-template أولاً)"); process.exit(2); }
const PICKS = readJ(picksF, null); if (!PICKS) { console.error(`✘ لا أقرأ ${picksF}`); process.exit(2); }
const t0 = Date.now(), ROUNDS = Number(opt("rounds", 6));
const sb = SB;
let built, spec, writing = (PICKS.writing ?? WRITING?.items ?? []).map((w) => ({ ...w }));
try {
  built = buildItems(PICKS, console.log);
} catch (e) { console.log(`✘ ${e.message}`); process.exit(4); }
if (built.media.length) {
  console.log(`✘ ينقص البناءَ ما لا يصنعه الباني (${built.media.length}) — أضفه في الاختيارات أو اجلبه، ثم أعد:`);
  for (const m of built.media) console.log(`   ${m.id}: ${m.need}${m.why ? ` (${m.why})` : ""}`);
  process.exit(3);
}
// the writing list's own items take their places in the board (they are placed by writing_place); fillers for what stays empty
const wBoard = (list) => list.map((w, k) => { const sp = findSpoken(w.text, (w.from ?? 0) - 15) ?? { at: w.from ?? 0, end: (w.from ?? 0) + 2 }; return { id: `w${k}`, t: w.t, text: w.text, at: r2(sp.at), until: holdEnd(sp.end) }; });
for (const w of wBoard(writing)) { const c = built.board.clash(w, w.at, w.until).filter((x) => !x.split); if (!c.length) { built.board.add(w); markOpt(w); } else built.dropped.push({ id: `writing «${w.text.slice(0, 30)}»`, why: `مكانه مشغول بـ${c.map((x) => x.t).join("+")} — حُذفت الكتابة (الأهم يبقى)` }); }
writing = writing.filter((w, k) => built.board.items.some((x) => x.id === `w${k}`));
built.board.items.forEach((x) => { if (/^w\d+$/.test(x.id)) x.id = `wl_${x.id}`; });
let rounds = 0, gates = null, lastFails = [];
for (; rounds < ROUNDS; rounds++) {
  const fill = fillGaps(built.board, writing, built.defaults, rounds);
  extendIntoGaps(built.board, built.defaults);
  for (const x of fill.filter((x) => !["torn", "scraps"].includes(x.t))) built.items.push(x);
  spec = assemble(built, writing);
  const r = await onSandbox(sb, spec, writing, { mattes: !has("no-mattes"), board: built.board });
  if (r.fail) { console.log(`✘ مولّد على النسخة فشل: ${r.fail.trim().split(/\r?\n/).slice(-6).join(" | ")}`); BUGS.push("generator: " + r.fail.slice(0, 300)); break; }
  spec = r.spec;
  gates = await runGateSet(sb.root, p, { forms: FORMS, minutes: Math.max(1, Math.ceil(DUR / 60)) });
  const bad = gates.filter((g) => !g.ok);
  if (!bad.length) break;
  // repair: the items the failures name yield (optional ones go; required ones move to their next option on the next round)
  const lines = bad.flatMap((g) => g.fails.map((f) => `${g.name}: ${f}`));
  if (JSON.stringify(lines) === JSON.stringify(lastFails)) break;
  lastFails = lines;
  let acted = 0;
  for (const l of lines) {
    for (const i of blame(l, spec)) {
      const it = spec.items[i], b = built.board.items.find((x) => x.id === it.id) ?? (["torn", "scraps"].includes(it.t) ? built.board.items.find((x) => x.t === it.t && x.text === it.text) : built.board.items.find((x) => x.t === it.t && Math.abs(spanOf(x)[0] - spanOf(it)[0]) < 0.06));
      if (!b) continue;
      if (b._opt) { built.board.remove(b); const k = built.items.indexOf(b); if (k >= 0) built.items.splice(k, 1); if (["torn", "scraps"].includes(b.t)) writing = writing.filter((w) => w.text !== b.text); built.dropped.push({ id: b._why ?? b.id, why: l.slice(0, 140) }); acted++; }
      else if (/فوق الوجه|لا خانة/.test(l) && b.slot?.land === "left") { b.slot.land = "right"; b.side = "right"; acted++; }
      else if (/باقٍ طويلاً/.test(l)) { const [a] = spanOf(b); setSpan(b, a, a + RULE.PIC_WARN - 0.3); acted++; }
    }
  }
  if (!acted) break;
}
const secs = ((Date.now() - t0) / 1000).toFixed(1);
// write the result (the real spec only when every gate passed on the copy; a scratch --out always, for the record)
const bad = (gates ?? []).filter((g) => !g.ok);
if (!spec) { console.log("✘ لم يُبنَ شيء"); process.exit(1); }
if (REAL && bad.length) console.log(`✘ لم أكتب data/specs/${p}.json: ${bad.length} بوابة ما زالت تفشل على النسخة (خطأ في الباني — أدناه)`);
else {
  if (REAL && fs.existsSync(OUT)) { const bk = path.join(T, "montage_build", `spec.before.${Date.now()}.json`); fs.mkdirSync(path.dirname(bk), { recursive: true }); fs.copyFileSync(OUT, bk); }
  fs.mkdirSync(path.dirname(OUT), { recursive: true }); fs.writeFileSync(OUT, JSON.stringify(spec, null, 1));
  if (REAL) { fs.writeFileSync(path.join(T, "writing.json"), JSON.stringify({ ...(WRITING ?? {}), items: writing }, null, 1)); }
}
// the proof: the whole gate set once more on what was written (the real workspace for the real spec, the scratch copy for --out)
const proofT = Date.now();
let proof = gates;
if (REAL && !bad.length) proof = await runGateSet(WS, p, { forms: FORMS, minutes: Math.max(1, Math.ceil(DUR / 60)) });
else if (!REAL) {   // a fresh scratch workspace (tools and .tmp/<p> copied again), the written file as its spec, the gates once
  const pb = makeSandbox(p, { name: `build_${p}`, ownPublic: true });
  fs.writeFileSync(path.join(pb.tmp, "writing.json"), JSON.stringify({ ...(WRITING ?? {}), items: writing }, null, 1));
  pb.writeSpec(JSON.parse(fs.readFileSync(OUT, "utf8")));
  proof = await runGateSet(pb.root, p, { forms: FORMS, minutes: Math.max(1, Math.ceil(DUR / 60)) });
}
const pbad = (proof ?? []).filter((g) => !g.ok);
const by = {}; for (const it of spec.items) { const k = it.el ?? it.t; by[k] = (by[k] ?? 0) + 1; }
console.log(`\nالبناء: ${spec.items.length} عنصراً (${Object.entries(by).map(([k, n]) => `${k} ${n}`).join("، ")}) في ${secs}ث، ${rounds + 1} دورة على النسخة → ${path.relative(WS, OUT)}`);
console.log(`البوابات (${proof?.length ?? 0}) في ${((Date.now() - proofT) / 1000 + (REAL ? 0 : 0)).toFixed(1)}ث:`);
for (const g of proof ?? []) { console.log(`  ${g.ok ? "✔" : "✘"} ${g.name} (${g.secs.toFixed(1)}ث)`); if (!g.ok) for (const f of (g.fails.length ? g.fails : [g.tail]).slice(0, 8)) console.log(`      ${f.slice(0, 260)}`); }
if (built.defaults.length) { console.log(`\nافتراضيات اختارها الباني (${built.defaults.length}) — حسّنها في الاختيارات:`); for (const d of built.defaults) console.log(`  ${d.id}${d.t ? ` ${mm(d.t)}` : ""}: ${d.el ?? "—"} — ${d.note}`); }
if (built.dropped.length) { console.log(`\nما تُرك لأن مكانه لا يصح (${built.dropped.length}):`); for (const d of built.dropped) console.log(`  ${d.id}: ${d.why}`); }
for (const n of built.notes) console.log(n);
if (pbad.length) console.log(`\n✘ خطأ في الباني (BUILDER BUG): ${pbad.length} بوابة فشلت على ما بناه — ${pbad.map((g) => g.name).join("، ")}`);
else console.log(`\n✔ كل البوابات (${proof.length}) نجحت من أول تشغيل على المواصفة المكتوبة`);
if (has("json")) console.log(JSON.stringify({ ok: !pbad.length, items: spec.items.length, secs: +secs, rounds: rounds + 1, gates: (proof ?? []).map((g) => ({ name: g.name, ok: g.ok, secs: g.secs })), defaults: built.defaults, dropped: built.dropped }));
process.exit(pbad.length ? 1 : 0);
