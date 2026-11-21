// WHAT EVERY STUDIO COMPOSITION IS, AND HOW EACH HK TOOL DOES ITS JOB ON IT (user 2026-11-21, after «رندر» refused a «شيخ الردود» video:
// «عليه يتعرف على كل شيء ويفعل ميزات لكل شيء، لأن المسألة نحن عندنا الآن برنامج متكامل»).
// One resolver for the Studio's right strip (src/studioTools.ts → tools/hk_server.mjs): resolve(<composition id>) →
//   { id, kind, project, label, owner, file,
//     render: { ok, why, mode: "spec"|"comp"|"still", jobs: [{comp, orient, dest, name, bumper, spec?}], check: "prerender"|"final_review" },
//     cut:    { ok, why, tool, source },
//     grade:  { ok, why, where: "spec"|"registry", file, scope: "recording"|"video"|"frame", note } }
// The kinds are read from the code, never guessed: the compositions of src/Root.tsx, src/ReelsComps.tsx, src/ArchiveComps.tsx (their component's source
// file decides the kind: HybridHost / OffthreadVideo / PaperKit / SilentReaction …) and every montage spec in data/specs (src/SpecComps.tsx rule).
// Where a skill states the destination and the name it is used here (hk-motion, lessons-and-streams, cartoon-animation, dubbing, explainer-motion,
// scholars-motion, paper-montage, silent-reaction, remotion-render); what no skill states is in data/comp_kinds.json (names taken from جاهز).
//   node tools/comp_kinds.mjs <CompId> [--json]          the resolver's answer
//   node tools/comp_kinds.mjs list [--json]              every composition with its kind; the unknown ones at the end
//   node tools/comp_kinds.mjs queue <CompId> [--frame N] [--dry]   queue the right render job(s) (tools/render_queue.mjs add …; --dry adds nothing)
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = path.resolve(import.meta.dirname, "..");
export const READY = "C:/Users/mshms/Videos/جاهز";
const TAG = " #محمد_بن_شمس_الدين";
const rd = (f, d) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return d; } };
const txt = (f) => { try { return fs.readFileSync(f, "utf8"); } catch { return ""; } };
const safeName = (n) => { let s = String(n).replace(/[<>:"/\\|?*\u0000-\u001f]/g, "").replace(/\s+/g, " ").trim(); if (!/\.mp4$/i.test(s)) s += ".mp4"; return s; };

/* ── the registries of the Studio, read as source ── */
const srcFile = (from, rel) => { const b = path.resolve(path.dirname(from), rel); for (const c of [b + ".tsx", b + ".ts", path.join(b, "index.tsx"), b]) if (fs.existsSync(c) && fs.statSync(c).isFile()) return c; return null; };
const importsOf = (file, s) => {
  const m = new Map();
  for (const x of s.matchAll(/import\s*\{([^}]+)\}\s*from\s*"(\.[^"]+)"/g)) for (const n of x[1].split(",")) { const [a, b] = n.trim().split(/\s+as\s+/); if (a) m.set((b ?? a).trim(), srcFile(file, x[2])); }
  return m;
};
const compsIn = (file, hiddenAll, root) => {
  const s = txt(file); if (!s) return [];
  const imp = importsOf(file, s), out = [], toks = [];
  for (const x of s.matchAll(/(\{SHOW_REFERENCE\s*&&\s*)?<Folder\s+name="([^"]*)"[^>]*>|<\/Folder>(\})?|(\{SHOW_REFERENCE\s*&&\s*)?<Composition\b([\s\S]*?)\/>/g)) toks.push(x);
  const stack = [];
  for (const x of toks) {
    if (x[2] !== undefined) { stack.push({ name: x[2], ref: !!x[1] }); continue; }
    if (x[0].startsWith("</Folder")) { stack.pop(); continue; }
    const a = x[5] ?? "", id = a.match(/\bid="([^"]+)"/)?.[1]; if (!id) continue;
    const comp = a.match(/component=\{(\w+)\}/)?.[1] ?? "", dur = a.match(/durationInFrames=\{([^}]+)\}/)?.[1] ?? "";
    const f = imp.get(comp) ?? null;
    out.push({ id, component: comp, file: f ? path.relative(root, f).replace(/\\/g, "/") : null, frames: /^\d+$/.test(dur) ? Number(dur) : null,
      folder: stack.map((q) => q.name).join(" / "), hidden: hiddenAll ?? (x[4] || stack.some((q) => q.ref) ? "reference" : null), registry: path.relative(root, file).replace(/\\/g, "/") });
  }
  return out;
};
export const compIdOf = (p) => p.split("-").map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w)).join("-");   // = src/SpecComps.tsx compIdOf
const FORMS = { port: "", land: "-L", both: "-Both", bothv: "-BothV" };
const specsOf = (specDir) => {
  const out = [];
  let fl = []; try { fl = fs.readdirSync(specDir).filter((n) => n.endsWith(".json")); } catch { /* none */ }
  for (const n of fl) {
    const p = n.slice(0, -5), s = rd(path.join(specDir, n), {});
    if (typeof s.frames !== "number" || typeof s.cut !== "string" || s.studio === false) continue;   // = src/SpecComps.tsx: not a montage, or kept out of the Studio
    const reel = s.kind === "reel", id = s.compId || compIdOf(p);
    for (const f of s.forms ?? (reel ? ["port"] : ["port", "land", "both", "bothv"])) if (f in FORMS) out.push({ id: id + FORMS[f], p, form: f, spec: s });
  }
  return out;
};
/** every composition the Studio can show (and the hidden ones: reference = SHOW_REFERENCE, archive = SHOW_ARCHIVE) */
export const registry = (o = {}) => {
  const root = o.root ?? ROOT, specDir = o.specDir ?? path.join(root, "data", "specs");
  const m = new Map();
  for (const e of specsOf(specDir)) m.set(e.id, { id: e.id, spec: e.p, form: e.form, specData: e.spec, file: "src/MontageSpec.tsx", registry: "src/SpecComps.tsx", folder: e.spec.kind === "reel" ? "ريلز" : "مونتاج الجلسة", hidden: null });
  for (const [f, h] of [["src/Root.tsx", undefined], ["src/ReelsComps.tsx", undefined], ["src/ArchiveComps.tsx", "archive"]]) for (const e of compsIn(path.join(root, f), h, root)) if (!m.has(e.id)) m.set(e.id, e);
  return m;
};

/* ── the kinds ── */
const titles = (root) => { const s = txt(path.join(root, "src", "compositionTitles.ts")), m = {}; for (const x of s.matchAll(/"([^"]+)"\s*:\s*"((?:[^"\\]|\\.)*)"/g)) m[x[1]] = x[2]; return m; };
const afterColon = (t) => String(t ?? "").replace(/^[^:：]*[:：]\s*/, "").trim();
const noParen = (t) => String(t ?? "").replace(/\s*\([^)]*\)\s*$/, "").trim();
const strip = (t) => String(t ?? "").replace(/[:?؟«»"]/g, "").replace(/\s*#محمد_بن_شمس_الدين\s*-?\s*$/u, "").replace(/\s*-\s*$/, "").trim();
/** a spec's kind (pure: also used by the self-test on fake specs) */
export const specKind = (p, s = {}) => {
  if (s.kind === "stream" || /^stream[_-]/i.test(p)) return "stream";
  if (s.kind === "lesson" || /^q\d/i.test(p) || /^[a-z]+\d+_\d+[a-z0-9]*$/i.test(p)) return "lesson";   // Q2-01 …; <book><lesson>_<clip> (tirmidhi32_3) — tools/lib/projdir.mjs rootOf
  if (s.kind === "reel") return "hk-reel";
  return "hk-full";
};
/** a non-spec composition's kind, from its id, its registry folder and its component's source (pure on the entry + the source text) */
export const compKind = (e, source = "") => {
  const id = e.id;
  if (e.hidden === "archive") return "archive";
  if (/^Hybrid/.test(id) && /hybrid\/HybridAssets/.test(e.file ?? "")) return "engine-asset";
  if (/^Rudood-/.test(id)) return "rudood";
  if (/^(Stick|Dodo)-/.test(id) || (/src\/cartoon\//.test(e.file ?? "") && /\bFilm\b/.test(source))) return "cartoon";
  if (/^Dub-/.test(id)) return "dubbing";
  if (/^Silent-/.test(id) || /SilentReaction/.test(e.file ?? "")) return "silent";
  if (/^Reel-Aqida|^Scholar/i.test(id) || /AqidaReel/.test(e.file ?? "")) return "scholars";
  if (/-Demo$|^ElementsLab$|-Practice$|Trial$|Lab$/.test(id) || /عروض مرجعية|تجارب/.test(e.folder ?? "")) return "demo";
  if (/from\s+"\.\/(PaperKit|PaperPuppets)"/.test(source) && !/^Ref-/.test(id)) return "paper";
  if (/^DebateR\d+$/.test(id)) return "debate-reel";
  if (e.frames != null && e.frames <= 2) return "still";
  if (/Thumb$|^KeyArt/.test(id)) return "still";
  if (/^Ref-|^Ext-Demo$|FamilyStickCast|DodoFamilyCast/.test(id)) return "reference";
  if (/موشن توضيحي مستقل/.test(e.folder ?? "") || /Explainer|Detain/.test(id)) return "explainer";
  return "unknown";
};
const OWNER = { "hk-full": "المونتاج (مهارة المونتاج)", "hk-reel": "المونتاج (الريلز)", lesson: "الدروس والبثوث", stream: "الدروس والبثوث", "spec-demo": "المونتاج",
  rudood: "شيخ الردود (جلسة الكرتون)", cartoon: "الكرتون", dubbing: "الدبلجة", silent: "التعليق الصامت", scholars: "موشن المشايخ", paper: "المونتاج الورقي",
  explainer: "الموشن التوضيحي", "debate-reel": "المناظرة (موشن غرافيك)", still: "الصور الثابتة", reference: "النماذج المرجعية", demo: "العروض والتجارب",
  "engine-asset": "محرك الرندر", archive: "الأرشيف", unknown: "غير معروف" };
const LABEL = { "hk-full": "حلقة مونتاج", "hk-reel": "ريل من حلقة", lesson: "مقطع درس", stream: "مقطع بث", "spec-demo": "عرض قالب المونتاج", rudood: "شيخ الردود",
  cartoon: "فيلم كرتون", dubbing: "دبلجة", silent: "تعليق صامت", scholars: "موشن مشايخ", paper: "مونتاج ورقي", explainer: "موشن توضيحي", "debate-reel": "ريل مناظرة",
  still: "صورة ثابتة", reference: "نموذج مرجعي", demo: "عرض أو تجربة", "engine-asset": "أصل داخلي لمحرك الرندر", archive: "مشروع مؤرشف", unknown: "تركيب غير معروف" };

/** how a component draws video: HybridHost (its VSlot layers go to the GPU compositor), a plain <OffthreadVideo>/<Video> (the whole frame is one graphics layer), or none */
const videoOf = (source) => (/<HybridHost\b/.test(source) ? "hybrid" : /<(OffthreadVideo|Video)\b|<VSlot\b/.test(source) ? "plain" : "none");

const NA = (why) => ({ ok: false, why });
/** the resolver */
export const resolve = (compId, o = {}) => {
  const root = o.root ?? ROOT, reg = o.registry ?? registry(o), over = rd(path.join(root, "data", "comp_kinds.json"), {}), T = titles(root);
  const id = String(compId ?? ""), e = reg.get(id);
  const base = { id, title: T[id] ?? null };
  if (!e) return { ...base, kind: "unknown", project: null, label: LABEL.unknown, owner: OWNER.unknown, file: null, render: NA("لا أجد هذا التركيب في سجلات الاستوديو"), cut: NA("تركيب غير معروف"), grade: NA("تركيب غير معروف") };
  const source = e.file ? txt(path.join(root, e.file)) : "";
  let kind = over.kinds?.[id] ?? (e.spec ? specKind(e.spec, e.specData) : compKind(e, source));
  if (e.spec && e.spec === "demo") kind = over.kinds?.[id] ?? "spec-demo";
  const r = { ...base, kind, project: e.spec ?? null, label: LABEL[kind] ?? kind, owner: OWNER[kind] ?? kind, file: e.file ?? null, folder: e.folder ?? "", hidden: e.hidden ?? null };
  const title = T[id] ?? id, name = over.names?.[id];

  /* ── spec montages (hk-full, hk-reel, lesson, stream, spec-demo): the queue with its pre-render check; the cut and the grade are the montage's own ── */
  if (e.spec) {
    const s = e.specData, p = e.spec, idBase = s.compId || compIdOf(p);
    const nameOf = (or) => { const et = s.exportTitle && typeof s.exportTitle === "object" ? (or === "L" ? s.exportTitle.L ?? s.exportTitle.land : s.exportTitle.R ?? s.exportTitle.port) : s.exportTitle; return typeof et === "string" && et.trim() ? safeName(et) : safeName(strip(s.title ?? p) + (or === "R" ? TAG : TAG + "-")); };   // = tools/render_job.sh
    const job = (comp, orient, dest, bumper = "") => ({ spec: p, comp, orient, dest, bumper, name: nameOf(orient) });
    let render;
    if (kind === "spec-demo") render = NA("عرض لقالب المونتاج من بيانات، لا يُسلَّم");
    else if (kind === "lesson") render = { ok: true, mode: "spec", check: "prerender", jobs: [job(idBase, "R", `${READY}/دروس`, "end")] };   // lessons-and-streams: portrait only, the bumper at the end, جاهز\دروس
    else if (kind === "stream") { const o2 = s.kind === "reel" || s.frames / 30 <= 120 ? "R" : "L"; render = { ok: true, mode: "spec", check: "prerender", jobs: [job(idBase + (o2 === "L" ? "-L" : ""), o2, `${READY}/بثوث/${o2 === "L" ? "عرضي" : "طولي"}`, "end")] }; }
    else if (kind === "hk-reel") render = { ok: true, mode: "spec", check: "prerender", jobs: [job(idBase, "R", READY)] };
    else render = { ok: true, mode: "spec", check: "prerender", jobs: e.form === "land" ? [job(idBase + "-L", "L", READY)] : e.form === "port" ? [job(idBase, "R", READY)] : [job(idBase + "-L", "L", READY), job(idBase, "R", READY)] };   // the side-by-side review forms: both files, landscape first (remotion-render)
    if (render.jobs?.length === 2 && render.jobs[0].name === render.jobs[1].name) render.note = `اسم الملف في المونتاج واحد للعرضي والطولي («${render.jobs[0].name}»): الثاني يكتب فوق الأول في جاهز — يُكتب exportTitle بصيغة {L, R} في المونتاج`;
    return { ...r, render,
      cut: kind === "spec-demo" ? NA("عرض قالب: لا تسجيل يُقصّ") : { ok: true, tool: "tools/cut_blocks.mjs --snap-words", source: `${p}_src.mp4 + public/${p}_map.json (القص الكسول)` },
      grade: { ok: true, where: "spec", file: `data/specs/${p}.json`, scope: "recording", note: "يُطبَّق على تسجيل الشيخ وحده (لا على العناصر والصور والبطاقات)، وفي المعاينة والتصدير بالمقدار نفسه." } };
  }

  /* ── every other composition: the render is a generic --comp job of the queue (tools/gpu_render.mjs), checked after it by its own kind (tools/kind_review.mjs) ── */
  const v = videoOf(source);
  const grade = kind === "engine-asset" || kind === "archive" ? NA(kind === "archive" ? "مشروع مؤرشف مخفي" : "أصل داخلي لمحرك الرندر")
    : v === "hybrid" ? { ok: true, where: "registry", file: "data/comp_grades.json", scope: "video", note: "يُطبَّق على طبقات الفيديو في هذا التركيب وحدها (لا على الرسوم والكتابة)، وفي المعاينة والتصدير بالمقدار نفسه." }
    : v === "plain" ? { ok: true, where: "registry", file: "data/comp_grades.json", scope: "frame", note: "يُطبَّق على الصورة كلها في هذا التركيب (الرسم والمقطع معاً)، وفي المعاينة والتصدير بالمقدار نفسه." }
    : NA("لا طبقة فيديو في هذا التركيب (رسوم وكتابة فقط)");
  const comp = (dest, nm, bumper = "none", orient = "R") => ({ ok: true, mode: "comp", check: "kind_review", jobs: [{ comp: id, orient, dest, name: safeName(nm), bumper }] });
  const orient = /-L$|Landscape$/.test(id) ? "L" : "R";
  let render, cut = NA(`لا قصّ لـ«${LABEL[kind] ?? kind}» من الاستوديو`);
  switch (kind) {
    case "rudood": {
      const m = source.match(new RegExp(`export const ${e.component}\\b[\\s\\S]*?clip="([^"]+)"[\\s\\S]*?clipFrames=\\{(\\d+)\\}`));
      render = comp(`${READY}/كرتون`, name ?? `شيخ الردود - ${afterColon(title)}`);   // cartoon-animation: جاهز\كرتون, no channel tag, never a bumper
      cut = NA(`مقطع الخصم ${m ? `public/${m[1]} (${m[2]} إطاراً)` : ""} يُنظَّف بأداة جلسة شيخ الردود، وطول المقطع مكتوب بيدها في ملف التركيب؛ القصّ عندها`);
      r.clip = m ? { file: `public/${m[1]}`, frames: Number(m[2]), tool: ".tmp/rudood_clip.sh <المصدر> <مجلد العمل> <مجلد public> [END]" } : null;
      break;
    }
    case "cartoon": render = comp(`${READY}/كرتون`, name ?? noParen(title)); cut = NA("القصّ في الكرتون بخريطة الزمن داخل الفيلم (FilmKit timeMap) عند جلسته"); break;
    case "dubbing": {
      const lang = /^Dub-Ckb/.test(id) ? "سورانية" : "كرمنجية", t = afterColon(title), topic = noParen(t), variant = (t.match(/\(([^)]*)\)\s*$/)?.[1] ?? "");
      const model = /نموذج|قالب|لوحة|متزامنة/.test(variant + t) && !/الشيخ في إطار/.test(variant);
      render = comp(READY, name ?? `${topic.replace(/^دفع الحسد$/, "دفع الحسد وتسريع الزواج")} - دبلجة ${lang}${model ? ` - ${variant}` : ""}${TAG}`);   // dubbing detail: «<العنوان> - دبلجة كرمنجية|سورانية #محمد_بن_شمس_الدين»
      cut = NA("الفيديو الأصلي في الدبلجة لا يُمسّ؛ التعديل في خلطة الصوت عند جلسة الدبلجة"); break;
    }
    case "silent": render = comp(READY, name ?? `${noParen(title)}${TAG}`, "end"); cut = NA("قصّ التعليق الصامت على مصدره وصوته بأداة المرحلة عند جلسته"); break;   // silent-reaction: the bumper at the end
    case "scholars": render = comp(`${READY}/موشن مشايخ`, name ?? noParen(title)); cut = NA("قصّ موشن المشايخ على المصدر بأداة المرحلة عند جلسته"); break;
    case "paper": render = comp(READY, name ?? `${noParen(title)}${TAG}`); cut = NA("قصّ المونتاج الورقي على صوت الراوي عند جلسته"); break;
    case "explainer": render = comp(READY, name ?? noParen(title)); cut = NA("الموشن التوضيحي مشاهد مرسومة بالكود، لا تسجيل يُقصّ"); break;
    case "debate-reel": render = comp(READY, name ?? `${afterColon(afterColon(title))}${TAG}`, "end"); cut = NA("ريل المناظرة مبني من ملف بياناته، يُعدَّل عند جلسته"); break;   // a portrait reel: the bumper at the end (render_job.sh legacy rule)
    case "still": render = { ok: true, mode: "still", check: null, jobs: [{ comp: id, orient, dest: `.tmp/stills/${id}` }] }; cut = NA("صورة ثابتة: لا زمن يُقصّ"); break;
    case "demo": case "reference": render = { ok: true, mode: "still", check: null, jobs: [{ comp: id, orient, dest: `.tmp/stills/${id}` }], note: "نموذج أو عرض لا يُسلَّم فيديو: الرندر لقطة ثابتة من الإطار الحالي" }; cut = NA("نموذج أو عرض: لا تسجيل يُقصّ"); break;
    case "engine-asset": render = NA("أصل داخلي لمحرك الرندر، لا يُرندر وحده"); cut = NA("أصل داخلي"); break;
    case "archive": render = NA("مشروع مؤرشف مخفي (يُرندر بإظهار الأرشيف عند صاحبه)"); cut = NA("مشروع مؤرشف"); break;
    default: render = NA("نوع غير معروف: يُرسل لصاحبه"); cut = NA("نوع غير معروف");
  }
  return { ...r, render, cut, grade };
};

/** what the Studio strip shows for a composition: each tool applies or not, and why (never throws) */
export const tools = (compId, o) => {
  try {
    const r = resolve(compId, o), one = (x) => ({ ok: !!x.ok, why: x.ok ? "" : x.why });
    return { comp: compId, kind: r.kind, label: r.label, owner: r.owner, render: { ...one(r.render), mode: r.render.mode ?? null, note: r.render.note ?? "" }, cut: one(r.cut), grade: { ...one(r.grade), scope: r.grade.scope ?? null, note: r.grade.note ?? "" }, msg: { ok: true, why: "" } };
  } catch (err) { return { comp: compId, kind: "unknown", label: "؟", owner: "", render: { ok: false, why: String(err.message) }, cut: { ok: false, why: String(err.message) }, grade: { ok: false, why: String(err.message) }, msg: { ok: true, why: "" } }; }
};

/** the argv of each job (render_queue add / stills), for the server and the self-test */
export const jobArgs = (r, j, { frame = 0, dry = false } = {}) => {
  if (r.render.mode === "spec") return ["tools/render_queue.mjs", "add", "--spec", j.spec, "--comp", j.comp, "--orient", j.orient, "--dest", j.dest, ...(j.bumper ? ["--bumper", j.bumper] : []), "--prerender", ...(dry ? ["--dry"] : [])];
  if (r.render.mode === "comp") return ["tools/render_queue.mjs", "add", "--comp", j.comp, "--orient", j.orient, "--dest", j.dest, "--name", j.name, "--bumper", j.bumper || "none", "--kind", r.kind, ...(dry ? ["--dry"] : [])];
  if (r.render.mode === "still") return ["tools/stills.mjs", j.comp, j.dest, `f${Math.max(0, Math.round(frame))}:${Math.max(0, Math.round(frame))}`];
  return null;
};

/** the server's decision for one action (pure: the self-test checks the routing on it) → {do: "queue"|"cut"|"grade"|"inbox"|"na", …} */
export const route = (action, compId, body = {}, o) => {
  const r = resolve(compId, o);
  if (action === "render") {
    if (r.kind === "unknown") return { do: "inbox", r, text: "رندر هذا", message: `✔ «${r.title ?? compId}» تركيب لا أعرف نوعه — وصل طلب الرندر لصاحبه في «راسلني»` };
    if (!r.render.ok) return { do: "na", r, message: `هذا النوع (${r.label}) لا يُرندر هنا: ${r.render.why}` };
    return { do: "queue", r, argv: ["tools/comp_kinds.mjs", "queue", compId, "--frame", String(Math.round(Number(body.frame ?? 0)))] };
  }
  if (action === "cut") {
    if (r.cut.ok) return { do: "cut", r };
    const a = Math.round(Number(body.a)), b = Math.round(Number(body.b)), secs = Number.isFinite(a) && Number.isFinite(b) ? (Math.abs(b - a) / 30).toFixed(1) : "?";
    return { do: "inbox", r, text: `قصّ هذا: من الإطار ${Math.min(a, b)} إلى ${Math.max(a, b)} (${secs} ث)${r.clip ? ` — المقطع ${r.clip.file}` : ""}`, message: `هذا النوع لا يُقصّ هنا: ${r.cut.why} — أرسلتُ طلب القصّ لصاحبه (${r.owner}) في «راسلني»` };
  }
  if (action === "grade") return r.grade.ok ? { do: "grade", r, where: r.grade.where, scope: r.grade.scope, note: r.grade.note } : { do: "na", r, message: `لا ألوان لهذا التركيب: ${r.grade.why}` };
  return { do: "na", r, message: "إجراء مجهول" };
};

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  process.chdir(ROOT);
  const [cmd, ...rest] = process.argv.slice(2), json = rest.includes("--json") || process.argv.includes("--json");
  const opt = (n) => (rest.includes("--" + n) ? rest[rest.indexOf("--" + n) + 1] : null);
  if (!cmd) { console.error("usage: node tools/comp_kinds.mjs <CompId> | list | queue <CompId> [--frame N] [--dry]"); process.exit(2); }
  if (cmd === "list") {
    const reg = registry(), all = [...reg.keys()].map((id) => resolve(id, { registry: reg }));
    if (json) { console.log(JSON.stringify(all.map((r) => ({ id: r.id, kind: r.kind, project: r.project, hidden: r.hidden, render: r.render.ok ? r.render.mode : null, cut: r.cut.ok, grade: r.grade.ok ? r.grade.scope : null })), null, 1)); process.exit(0); }
    const by = {}; for (const r of all) (by[r.kind] ??= []).push(r);
    for (const [k, l] of Object.entries(by).sort((a, b) => (a[0] === "unknown") - (b[0] === "unknown"))) {
      console.log(`${k === "unknown" ? "✘" : "■"} ${LABEL[k] ?? k} (${k}) — ${l.length}`);
      for (const r of l) console.log(`   ${r.id}${r.hidden ? ` [${r.hidden === "archive" ? "أرشيف" : "مرجعي مخفي"}]` : ""}  رندر: ${r.render.ok ? r.render.mode : "✘"}  قصّ: ${r.cut.ok ? "✔" : "✘"}  ألوان: ${r.grade.ok ? r.grade.scope : "✘"}`);
    }
    const unk = by.unknown?.length ?? 0; console.log(unk ? `\n✘ ${unk} تركيب بلا نوع معروف: ${by.unknown.map((r) => r.id).join("، ")}` : "\n✔ كل التركيبات معروفة النوع");
    process.exit(0);
  }
  if (cmd === "queue") {
    const id = rest[0], dry = rest.includes("--dry"), frame = Number(opt("frame") ?? 0), r = resolve(id);
    if (!r.render.ok) { console.log(`✘ مرفوض ${id}: ${r.render.why}`); process.exit(1); }
    let bad = 0;
    for (const j of r.render.jobs) {
      const a = jobArgs(r, j, { frame, dry });
      if (r.render.mode === "still" && dry) { console.log(`DRY still ${id}: node ${a.join(" ")}`); continue; }
      if (r.render.mode === "still") fs.mkdirSync(path.join(ROOT, j.dest), { recursive: true });
      const x = spawnSync(process.execPath, a, { cwd: ROOT, encoding: "utf8", windowsHide: true, timeout: 600000 });
      const out = ((x.stdout || "") + (x.stderr || "")).trim(); console.log(out);
      if (x.status !== 0 || /✘ مرفوض/.test(out)) bad++;
      else if (r.render.mode === "still" && !dry) console.log(`✔ لقطة ثابتة: ${j.dest}/f${Math.round(frame)}.png`);
    }
    process.exit(bad ? 1 : 0);
  }
  const r = resolve(cmd);
  if (json) console.log(JSON.stringify(r, null, 1));
  else console.log([`${r.id} — ${r.label} (${r.kind})${r.project ? ` · المشروع ${r.project}` : ""} · صاحبه: ${r.owner}`,
    `  رندر: ${r.render.ok ? `${r.render.mode} → ${(r.render.jobs ?? []).map((j) => `${j.comp} ${j.orient} → ${j.dest}${j.name ? "/" + j.name : ""}${j.bumper ? ` (فاصل ${j.bumper})` : ""}`).join(" ؛ ")}${r.render.check ? ` · الفحص: ${r.render.check}` : ""}` : "✘ " + r.render.why}`,
    `  قصّ: ${r.cut.ok ? r.cut.tool : "✘ " + r.cut.why}`, `  ألوان: ${r.grade.ok ? `${r.grade.where} (${r.grade.scope})` : "✘ " + r.grade.why}`].join("\n"));
}
