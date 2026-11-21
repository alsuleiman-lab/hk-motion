// ELEMENT CONSTRAINTS BEFORE THE PLAN (user 2026-11-20, gta6: «لماذا لا تقرأ كل التعليمات؟… ألزم نفسك إلزاماً صارماً»). On gta6 the gate refused SIX element
// batches in a row, one hidden constraint at a time: the key-word chip is half-screen only, a picture needs a free photo slot in full mode, WordScraps need one
// time per word, written text must be the spoken words. The constraints existed only inside the gates. This tool prints them BEFORE a plan is written and
// checks a whole plan at once, every problem with its fix, in ~3 s — no spec is touched.
//   node tools/el_rules.mjs rules <code|اسمه> [more…] [--all]     the hard constraints of each element, as the gates enforce them
//   node tools/el_rules.mjs plan-check <p> <ops.json>             the ops of `el.mjs batch` checked together on a COPY of the spec: static checks (fields,
//                                                                 times, mode, text = speech, one time per scrap word) + grid_plan and writing_sync on the
//                                                                 copy; prints ALL problems grouped by op with the fix of each; exit 1 when any.
// The hook (tools/hooks/guard.mjs) runs plan-check before every `el.mjs batch` / `el.mjs add` of a montage and refuses the command while it fails.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { takeSpecArg } from "./lib/selftest_spec.mjs";

/* (2026-11-21) plan-check --spec <file>: the guard self-test's scratch spec (under .tmp/selftest/ only) — tools/lib/selftest_spec.mjs */
const SPEC_FILE = takeSpecArg(path.resolve(import.meta.dirname, ".."));
process.chdir(path.resolve(import.meta.dirname, ".."));
const [cmd, ...args] = process.argv.slice(2);
const read = (f) => fs.readFileSync(f, "utf8");
const json = (f, d) => { try { return JSON.parse(read(f)); } catch { return d; } };
const mm = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

// ── data the gates use (one source each; nothing copied by hand)
const LAB = Object.fromEntries(json("data/elements_lab.json", []).map((m) => [m.id, m]));
const G = json("data/layout_grids.json", {});
const KIND = {}; for (const [k, ts] of Object.entries(G.kinds ?? {})) for (const t of ts) KIND[t] = k;
const TYPE_OF = (() => { const gp = read("src/galleryPlace.ts"), o = {}; for (const m of gp.slice(gp.indexOf("TYPE_OF"), gp.indexOf("};", gp.indexOf("TYPE_OF"))).matchAll(/(\w+):\s*"([\w:]+)"/g)) o[m[1]] = m[2]; return o; })();
const PICK_FULL = (() => { const m = read("tools/grid_plan.mjs").match(/const PICK_FULL = new Set\(\[([^\]]*)\]/); return new Set([...(m?.[1] ?? "").matchAll(/"(\w+)"/g)].map((x) => x[1])); })();
/* grid_plan.mjs ELEMENT_OF: spec types whose screen mode the grid enforces through another gallery card (the half-screen-only elements the user named) */
const GATE_MODE_OF = (() => { const m = read("tools/grid_plan.mjs").match(/const ELEMENT_OF = \{([^}]*)\}/); const o = {}; for (const x of (m?.[1] ?? "").matchAll(/(\w+):\s*"(\w+)"/g)) o[x[1]] = x[2]; return o; })();
const WRITING = new Set(["torn", "scraps", "rewrite", "rows", "note"]);   // tools/writing_sync.mjs: written items, never before their words
const MODE_AR = { full: "ملء الشاشة", half: "نصف الشاشة (نافذة تقسيم)", iso: "عزل الخلفية" };
const O_AR = { land: "العرضي", port: "الطولي" };
let CAT = null;
const catalog = () => {
  if (CAT) return CAT;
  const r = spawnSync(process.execPath, ["tools/el.mjs", "list", "--json"], { encoding: "utf8", maxBuffer: 1 << 26 });
  CAT = Object.fromEntries(JSON.parse(r.stdout || "[]").map((e) => [e.code, e]));
  return CAT;
};
const find = (q) => { const c = catalog(); if (c[q]) return c[q]; const all = Object.values(c), ex = all.find((e) => e.ar === q); if (ex) return ex; const part = all.filter((e) => (e.ar ?? "").includes(q)); return part.length === 1 ? part[0] : null; };
/* the same resolution as el.mjs catalog(): a gallery code of TYPE_OF, a PickKit element (t "pick"), or a spec type named after a card (data/element_names.json codeOf) */
const CODE_TYPE = Object.fromEntries(Object.entries(json("data/element_names.json", {}).codeOf ?? {}).map(([t, c]) => [c, t]));
const typeOf = (e) => { const t0 = TYPE_OF[e.code]; if (t0) return { t: t0.split(":")[0], style: t0.split(":")[1] }; if (/^PickKit/.test(LAB[e.code]?.kit ?? "") || /^[A-Z]/.test(e.code) && !CODE_TYPE[e.code]) return { t: "pick", el: e.code }; return { t: CODE_TYPE[e.code] ?? e.code }; };
/** the grid kind of an item in an orientation (grid_plan.mjs rules) */
const kindOf = (it, o) => (it.t === "verse" && it.full ? "exclusive" : o === "port" && it.t === "pick" && !PICK_FULL.has(it.el) ? "ignore" : it.t === "pick" ? (PICK_FULL.has(it.el) ? "exclusive" : "ignore") : KIND[it.t] ?? "ignore");
const slotsFor = (kind, o) => Object.entries(G[o] ?? {}).filter(([, g]) => g?.slots).map(([mode, g]) => [mode, Object.entries(g.slots).filter(([, s]) => s.kinds.includes(kind)).map(([n]) => n)]).filter(([, ns]) => ns.length);
/** the screen modes the grid allows this element in (null = any mode that has a slot of its kind) */
const gateMode = (t) => { const lab = LAB[GATE_MODE_OF[t]]; return lab?.mode ? { mode: lab.mode, via: GATE_MODE_OF[t], orient: lab.orient } : null; };

const rulesOf = (e) => {
  const { t, el } = typeOf(e), it = { t, el }, lab = LAB[e.code] ?? {}, out = [];
  out.push(`${e.code} · ${e.ar ?? "—"} · نوعه في المواصفة «${t}»${el ? ` (${el})` : ""}`);
  if (e.where) out.push(`  متى: ${e.where}`);
  const req = e.fields.filter((f) => !f.opt).map((f) => f.name), opt = e.fields.filter((f) => f.opt).map((f) => f.name);
  out.push(`  الحقول الإلزامية: ${req.join("، ") || "—"}${opt.length ? ` · الاختيارية: ${opt.join("، ")}` : ""}`);
  const orient = lab.orient ?? e.orient; if (orient && orient !== "both") out.push(`  ✱ الاتجاه: ${O_AR[orient] ?? orient} فقط`);
  const gm = gateMode(t);
  if (gm) out.push(`  ✱ الوضع: الشبكة تقبله في ${MODE_AR[gm.mode]} فقط (بحكم بطاقة ${gm.via}) — في غيره يُرفض${lab.mode && lab.mode !== gm.mode ? ` ⚠ بطاقته في المعرض تقول «${MODE_AR[lab.mode]}»: الحَكَم هو الشبكة` : ""}`);
  else if (lab.mode) out.push(`  الوضع في المعرض: ${MODE_AR[lab.mode]}`);
  for (const o of ["land", "port"]) {
    const k = kindOf(it, o);
    if (k === "ignore") { out.push(`  ${O_AR[o]}: خارج الشبكة (يرسمه المحرك في مكانه)`); continue; }
    if (k === "exclusive") { out.push(`  ✱ ${O_AR[o]}: عنصر كبير يحتل المحتوى كله في وقته — لا عنصر آخر فوقه ولا معه`); continue; }
    if (k === "solo") { out.push(`  ✱ ${O_AR[o]}: وحده في وقته (لا عنصر آخر معه)، في خانة solo`); continue; }
    const sl = slotsFor(k, o); out.push(`  ${O_AR[o]}: صنف «${k}» — خاناته: ${sl.map(([m, ns]) => `${{ full: "ملء الشاشة", half: "نصف الشاشة", iso: "العزل" }[m] ?? m} [${ns.join("، ")}]`).join(" · ") || "لا خانة!"}؛ خانة واحدة لعنصر واحد في الوقت نفسه، وفوق الوجه يُرفض`);
  }
  if (WRITING.has(t)) out.push("  ✱ الكتابة = كلامه المنطوق حرفياً في نافذتها، وتبدأ عند أول كلمة منطوقة منها (لا قبلها بأكثر من 0.3ث)، وتبقى 1.5ث بعد اكتمالها");
  if (t === "scraps") out.push("  ✱ times: وقت لكل كلمة من النص بالترتيب (عددها = عدد الكلمات)، كل وقت عند نطق كلمته — node tools/scraps_times.mjs data/specs/<p>.json");
  if (t === "date") out.push("  ✱ text نص لا رقم (\"2005\")؛ ويحتاج خانة صورة (photo) فارغة في وقته");
  if (["tphoto", "scholar", "pic", "news", "flag"].includes(t)) out.push("  ✱ صورة: src داخل public/ (تُقاس نسبتها)، لا امرأة غير مطموسة، وتحتاج خانة photo فارغة في وقتها");
  if (t === "pick" && e.fields.some((f) => f.name === "textAt")) out.push("  ✱ textAt = ثانية نطق النص (لا قبلها)");
  out.push("  القاعدة العامة: لا عنصر قبل نطقه؛ عنصر واحد في كل مساحة في كل وقت (الحديث والآية ثم الصورة ثم الكتابة)");
  return out.join("\n");
};

if (cmd === "rules") {
  const codes = args.includes("--all") ? Object.keys(catalog()) : args.filter((a) => !a.startsWith("--"));
  if (!codes.length) { console.error("usage: node tools/el_rules.mjs rules <code|اسمه> [more…] | --all"); process.exit(2); }
  let bad = 0;
  for (const c of codes) { const e = find(c); if (!e) { console.log(`✘ لا عنصر «${c}» (node tools/el.mjs list)`); bad++; continue; } console.log(rulesOf(e) + "\n"); }
  process.exit(bad ? 2 : 0);
}

if (cmd === "plan-check") {
  const [p, opsFile] = args.filter((a) => !a.startsWith("--"));
  const specF = SPEC_FILE ?? path.join("data", "specs", `${p}.json`);
  if (!p || !opsFile) { console.error("usage: node tools/el_rules.mjs plan-check <p> <ops.json>"); process.exit(2); }
  if (!fs.existsSync(specF)) { console.error(`✘ لا مواصفة: ${specF}`); process.exit(2); }
  const ops = json(opsFile, null); if (!Array.isArray(ops)) { console.error(`✘ ${opsFile} ليس قائمة عمليات JSON`); process.exit(2); }
  const spec = JSON.parse(read(specF)), W0 = json(path.join(".tmp", p, "cut_words.json"), []), words = Array.isArray(W0) ? W0 : W0.words ?? [];
  const forms = Array.isArray(spec.forms) && spec.forms.length ? spec.forms : ["port", "land"];
  const inW = (ws, t) => (ws ?? []).some((w) => t >= w.from && t < w.to);
  const modeAt = (t, o) => (inW(spec.splits, t) || (o === "port" && inW(spec.psplits, t)) || (o === "land" && (inW(spec.shifts, t) || (spec.behind ?? []).some((b) => b.dx !== undefined && t >= b.from && t < b.to))) ? "half" : (spec.behind ?? []).some((b) => t >= b.from && t < b.to) ? "iso" : "full");
  const norm = (s) => String(s).replace(/[ً-ٰٟـ]/g, "").replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/[^\p{L}\p{N}]/gu, "");
  const strip = (w) => norm(w).replace(/^(وال|بال|كال|فال|لل|ال|و|ف|ب|ل|ك)(?=.{3,})/, "");
  /* writing_sync.mjs decides «the first spoken word» without its stop words: read its own list (one source) */
  const STOP = (() => { const m = read("tools/writing_sync.mjs").match(/const STOP = new Set\(\[([^\]]*)\]/); return new Set([...(m?.[1] ?? "").matchAll(/"([^"]+)"/g)].map((x) => x[1])); })();
  const same = (a, b) => a === b || (a.length >= 4 && b.length >= 4 && (a.startsWith(b) || b.startsWith(a)));
  const probs = ops.map(() => []), copy = JSON.parse(JSON.stringify(spec)), touched = new Map();   // op index → item in the copy
  const { align } = await import("./lib/scraps_times.mjs");
  for (const [i, o] of ops.entries()) {
    const P = probs[i], add = (m, fix) => P.push({ m, fix });
    if (o.op === "add") {
      const e = find(o.code); if (!e) { add(`لا عنصر «${o.code}»`, "node tools/el.mjs list"); continue; }
      const v = o.vals ?? {}, names = new Set(e.fields.map((f) => f.name));
      const miss = e.fields.filter((f) => !f.opt && v[f.name] === undefined).map((f) => f.name); if (miss.length) add(`ينقصه ${miss.join("، ")}`, `node tools/el.mjs show ${e.code}`);
      const unk = Object.keys(v).filter((k) => !names.has(k)); if (unk.length) add(`حقول لا يقبلها: ${unk.join("، ")} (المكان والمقاس من المعرض)`, `الحقول: ${[...names].join(" ")}`);
      const tt = typeOf(e), it = { id: `pc${i}`, t: tt.t, ...(tt.el ? { el: tt.el } : {}), ...(tt.style ? { style: tt.style } : {}), ...v };
      for (const f of e.fields) if (/^string$/.test(f.type) && typeof it[f.name] === "number") P.push({ warn: true, m: `${f.name}=${it[f.name]} رقم والحقل نص`, fix: `اكتبه نصاً: "${it[f.name]}"` });
      copy.items.push(it); touched.set(i, it);
    } else if (o.op === "set" || o.op === "del") {
      const id = String(o.id ?? "").replace(/^#|^id=/, ""), k = copy.items.findIndex((x) => x.id === id);
      if (k < 0) { add(`لا عنصر #${id} في المواصفة`, `node tools/el.mjs items ${p}`); continue; }
      if (o.op === "del") { copy.items.splice(k, 1); continue; }
      Object.assign(copy.items[k], o.vals ?? {}); touched.set(i, copy.items[k]);
    } else add(`نوع عملية غير معروف «${o.op}»`, "add | set | del");
  }
  // static checks on every added/changed item
  for (const [i, it] of touched) {
    const P = probs[i], add = (m, fix) => P.push({ m, fix }), warn = (m, fix) => P.push({ m, fix, warn: true });
    const a = it.at ?? it.from, b = it.until ?? it.to ?? (it.dur != null ? a + it.dur : undefined);
    if (a == null || b == null) continue;
    if (!(b > a)) { add(`النهاية ${b} ليست بعد البداية ${a}`, "until > at"); continue; }
    if (b - a < 1.2) warn(`مدته ${(b - a).toFixed(1)}ث أقل من 1.2ث`, "أطِله حتى 1.5ث بعد اكتمال كلامه");
    const lab = LAB[it.el ?? Object.keys(TYPE_OF).find((c) => TYPE_OF[c].split(":")[0] === it.t)] ?? {};
    if (lab.orient && lab.orient !== "both" && !forms.includes(lab.orient)) add(`عنصر ${O_AR[lab.orient]} فقط والمونتاج ${forms.map((f) => O_AR[f]).join(" و")}`, "اختر عنصراً للاتجاهين (el_rules rules)");
    const gm = gateMode(it.t);
    for (const o of forms) { const md = modeAt(a + 0.05, o); if (gm && (!gm.orient || gm.orient === "both" || gm.orient === o) && gm.mode !== md) add(`${O_AR[o]} ${mm(a)}: يُقبل في ${MODE_AR[gm.mode]} فقط، والشاشة هنا ${MODE_AR[md]}`, md === "full" ? "في ملء الشاشة استعمل TornNote أو WordScraps أو StatRow للعبارة" : "ضعه حيث الشاشة في وضعه"); }
    const text = it.text ?? (Array.isArray(it.lines) ? it.lines.map((l) => l.text).join(" ") : null);
    if (WRITING.has(it.t) && typeof text === "string" && words.length) {
      const toks = [...new Set(text.split(/\s+/).map(strip).filter((x) => x.length >= 3 && !STOP.has(x)))];
      const win = words.filter((w) => w.s >= a - 0.6 && w.s <= b + 0.3).map((w) => ({ s: w.s, t: strip(w.w) }));
      const hit = toks.filter((q) => win.some((w) => same(q, w.t))), first = win.find((w) => toks.some((q) => same(q, w.t)));
      if (toks.length && !hit.length) add(`النص «${text.slice(0, 40)}» لا يطابق كلامه في ${mm(a)}–${mm(b)}`, `انسخه من cut_transcript حرفياً، أو انقله إلى وقت نطقه`);
      else if (toks.length && hit.length < toks.length) warn(`كلمات ليست في كلامه هنا: ${toks.filter((q) => !hit.includes(q)).join("، ")}`, "الكتابة كلماته المنطوقة حرفياً (بلا تشكيل ولا تصحيح)");
      if (first && a < first.s - 0.3) add(`يبدأ ${a}ث قبل أول كلمة منطوقة منه (${first.s.toFixed(2)}ث)`, `at=${Math.max(0, first.s - 0.15).toFixed(2)}`);
      if (it.t === "scraps") {
        const n = text.split(" ").length, tm = align(text, a, b, words);
        if (!Array.isArray(it.times)) add(`بلا times (وقت لكل كلمة، ${n} كلمات)`, `times=${JSON.stringify(tm.map((x) => x ?? null))}`);
        else if (it.times.length !== n) add(`times فيها ${it.times.length} والنص ${n} كلمات`, `times=${JSON.stringify(tm)}`);
        else it.times.forEach((x, k) => { if (tm[k] != null && x < tm[k] - 0.3) add(`الكلمة ${k + 1} «${text.split(" ")[k]}» عند ${x} قبل نطقها ${tm[k]}`, `times=${JSON.stringify(tm)}`); });
      }
    }
    if (it.t === "pick" && it.textAt != null && it.textAt < a) add(`textAt ${it.textAt} قبل بدايته ${a}`, "textAt = ثانية نطق النص");
  }
  // the grid and the writing check on the copy, compared with the spec as it is now: only what the plan ADDS counts
  const dir = path.join(".tmp", p, "plancheck"); fs.mkdirSync(dir, { recursive: true });
  const tmpF = path.join(dir, `${path.basename(p)}.json`);   /* basename: the self-test's project is "selftest/<run>/<case>" (a real name has no slash) */ fs.writeFileSync(tmpF, JSON.stringify(copy, null, 1));
  const gate = (f) => { const outs = []; for (const o of forms) outs.push(spawnSync(process.execPath, ["tools/grid_plan.mjs", f, "--o", o], { encoding: "utf8" }).stdout ?? ""); outs.push(spawnSync(process.execPath, ["tools/writing_sync.mjs", f], { encoding: "utf8" }).stdout ?? ""); return outs.join("\n").split(/\r?\n/).map((l) => l.trim()).filter((l) => l.startsWith("✘") && !/FAILED|مشكلة ·|^✘ \d+ /.test(l)).map((l) => l.replace(/#\d+/g, "").replace(/\s*\([^)]*∩[^)]*\)/g, "")); };
  /* grid_plan writes .tmp/<p>/grid.md: the copy runs FIRST and the real spec last, so the table left behind is the real one */
  const afterAll = gate(tmpF), before = new Set(gate(specF)), after = afterAll.filter((l) => !before.has(l));
  fs.rmSync(dir, { recursive: true, force: true });
  const HINT = [
    [/نصف الشاشة وهو هنا في ملء الشاشة/, "عنصر نصف شاشة في ملء الشاشة: استعمل TornNote أو WordScraps، أو ضعه داخل نافذة تقسيم"],
    [/لا خانة (\w+) فارغة في وضع (\w+)/, (m) => `خانات «${m[1]}» في ${MODE_AR[m[2]] ?? m[2]}: ${(slotsFor(m[1], "land").find(([md]) => md === m[2])?.[1] ?? []).join("، ") || "لا شيء"} (العرضي) — مشغولة في هذا الوقت: قدّمه أو أخّره، أو احذف ما يشغلها`],
    [/فوق الوجه/, "وجهه في مكان الخانة في هذا الوقت: غيّر الوقت أو الخانة (node tools/el.mjs slot)"],
    [/فوق عنصر كبير/, "لا شيء فوق عنصر كبير: أخّره إلى ما بعد نهايته"],
    [/متأخر|قبل/, "ابدأه عند أول كلمة منطوقة منه"],
    [/غير مطابق/, "النص كلماته المنطوقة حرفياً"],
    [/بطاقة الاسم|بطاقة الاشتراك/, "بطاقة الاسم والاشتراك وحدهما في وقتهما"],
    [/شريط العنوان/, "لا شيء تحت شريط العنوان"],
  ];
  const hintOf = (l) => { for (const [re, h] of HINT) { const m = re.exec(l); if (m) return typeof h === "function" ? h(m) : h; } return ""; };
  // each new grid/writing failure goes to the op whose item it names (type + start minute)
  const general = [];
  for (const l of after) {
    const m = /^✘\s*(\w+)\s+(\d+:\d{2})/.exec(l) ?? /^✘\s*(\w+)\s+(\d+:\d{2})/.exec(l.replace(/^✘\s*\w+\s+/, "✘ "));
    const i = m ? [...touched].find(([, it]) => it.t === m[1] && mm(it.at ?? it.from ?? -9) === m[2])?.[0] : undefined;
    (i != null ? probs[i] : general).push({ m: l.replace(/^✘\s*/, ""), fix: hintOf(l) });
  }
  let n = 0, w = 0;
  for (const [i, P] of probs.entries()) {
    if (!P.length) continue; const o = ops[i]; const e0 = P.filter((x) => !x.warn).length; n += e0; w += P.length - e0;
    console.log(`${e0 ? "✘" : "⚠"} العملية ${i + 1} (${o.op} ${o.code ?? o.id}${o.vals?.at != null ? ` عند ${mm(o.vals.at)}` : ""}):`);
    for (const x of P) console.log(`    ${x.warn ? "⚠" : "-"} ${x.m}${x.fix ? `\n      ← ${x.fix}` : ""}`);
  }
  if (general.length) { n += general.length; console.log("✘ مخالفات جديدة في الخطة:"); for (const x of general) console.log(`    - ${x.m}${x.fix ? `\n      ← ${x.fix}` : ""}`); }
  if (n) {
    const codes = [...new Set(ops.filter((o, i) => o.op === "add" && probs[i].some((x) => !x.warn)).map((o) => o.code))];
    if (codes.length) console.log(`\nقيود هذه العناصر: node tools/el_rules.mjs rules ${codes.join(" ")}`);
    console.log(`✘ plan-check: ${n} مشكلة في ${ops.length} عملية — أصلحها كلها ثم أعد (لا تجرّب الدفعة على الحارس)`);
    process.exit(1);
  }
  console.log(`✔ plan-check: ${ops.length} عملية بلا مشكلة معروفة${w ? ` (${w} تنبيه ⚠ لا يمنع)` : ""} (الحارس يفحص الباقي: مساحة كل عنصر بالأرقام)`);
  process.exit(0);
}

console.error("usage: node tools/el_rules.mjs rules <code…> | --all  ·  plan-check <p> <ops.json>");
process.exit(2);
