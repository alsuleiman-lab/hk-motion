// REQUIREMENTS LEDGER — everything the video must show, extracted BEFORE the build (user 2026-11-11: «أريد منك أن تشتغل صح من البداية:
// مدن، أماكن… لا تنتظر التصحيح»). The spec is built FROM this ledger, and the build is not shown while one row is unmet.
//   node tools/requirements.mjs <project>            → .tmp/<p>/requirements.json + requirements.md (run by `stage.mjs cut`)
//   node tools/requirements.mjs <project> --check    → exit 1 on any unmet row (run by `stage.mjs check` and before any link)
// Rows (time = cut seconds):
//   place   every place the Arabic NER (tools/ner_scan.py, CAMeL BERT) or the world-cities list (data/geo) finds → a MAP (pmap) at its first mention,
//           again if named > 180 s after the last map of it; coordinates from data/geo/cities15000.txt when found
//   person  every named person (NER PERS + data/mention_lexicon.json people) → his real picture (pic/tphoto/scholar/peek/bgclip/full/person)
//   date    every year / century / date (سنة 1997، عام، القرن، 9 مارس، هـ، م) → the DATE element (date/timeline)
//   depict  every described group / job / building / act / animal of data/depict_lexicon.json (أسرة، مزارع، معبد، اعتقال، قرد…) → a picture
//   order   every «مونتاج … انتهى» order of .tmp/<p>/montage_notes.json → the elements it was planned into (`montage_notes plan`); a note with no plan fails
//   ordercand  every stretch of the ORIGINAL recording that talks to the editor (حط/ضع/اعرض/صورة/خلفية/زووم/احذف/مونتاج… ≥ 3 cues in 12 s)
//           → must be a montage note (add --at <src sec>) or waived in the spec "waiveOrders": ["<src sec>: reason"]  (Whisper wrote «مونتاج» as «مرحبا» once)
// A row that is right to leave out is waived in the spec: "skipRequired": ["<text>@<cut sec>"] — every waiver is listed to the user with the preview link.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const p = process.argv[2], CHECK = process.argv.includes("--check");
if (!p) { console.error("usage: node tools/requirements.mjs <project> [--check]"); process.exit(2); }
process.chdir(path.resolve(import.meta.dirname, ".."));
const T = path.join(".tmp", p), PY = process.env.PY ?? "S:/AI_Tools/ComfyUI_windows_portable/python_embeded/python.exe";
const read = (f, d) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return d; } };
const mm = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const norm = (s) => String(s).replace(/[ً-ْٰـ]/g, "").replace(/[إأآٱا]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/[^\p{L}\p{N} ]/gu, " ").replace(/\s+/g, " ").trim();
const bare = (w) => norm(w).replace(/^(و|ف)?(ب|ل|ك)?(ال)?/, "");
const reqF = path.join(T, "requirements.json");

// ───────────── build the ledger ─────────────
function build() {
  // the text is a FULL large-v3 pass over the final cut audio (drift_fresh.json), not the per-segment pass: that one wrote «لأسرة تعمل بالزراعة» as «لأسرطين تعملوا بزيارةها»
  const cutWav = path.join(T, "cut.wav"), w16 = path.join(T, "cut16k.wav"), freshF = path.join(T, "drift_fresh.json");
  if (!fs.existsSync(path.join(T, "cut_words.json"))) { console.error(`✘ ${T}/cut_words.json missing — run the cut first`); process.exit(1); }
  if (fs.existsSync(cutWav) && (!fs.existsSync(freshF) || fs.statSync(freshF).mtimeMs < fs.statSync(cutWav).mtimeMs)) {
    if (!fs.existsSync(w16) || fs.statSync(w16).mtimeMs < fs.statSync(cutWav).mtimeMs) spawnSync("ffmpeg", ["-v", "error", "-y", "-threads", "4", "-i", cutWav, "-ar", "16000", "-ac", "1", w16], { stdio: "inherit" });
    spawnSync(PY, ["tools/words_drift.py", w16, freshF], { stdio: "inherit", env: { ...process.env, PYTHONIOENCODING: "utf-8" } });
  }
  // both texts are scanned (fresh full pass + the per-segment pass): each pass mishears different words, the union misses less
  const SOURCES = [[freshF, "ner.json"], [path.join(T, "cut_words.json"), "ner_cut.json"]].filter(([f]) => fs.existsSync(f));
  const W = read(SOURCES[0][0], []);
  const rows = [];
  const FIX = Object.fromEntries(Object.entries(read("data/requirements_fixes.json", {})).filter(([k]) => k !== "_").map(([k, v]) => [bare(k), v]));
  const VISL = ["pic", "tphoto", "scholar", "peek", "bgclip", "full", "person", "pmap", "flash", "crop", "scene", "flag", "news"];
  const add = (r) => {
    if (r.kind === "person" && (NO_PICTURE.test(r.text) || NO_PICTURE.test(norm(r.text)) || NO_PICTURE.test(String(r.text).replace(/ى/g, "ي")))) return;
    const f = FIX[bare(r.text)] ?? FIX[bare(String(r.text).split(" ")[0])];
    if (f && ["place", "person", "depict"].includes(r.kind)) {
      if (f.kind === "none") return;
      if (f.kind !== r.kind) { if (rows.some((x) => x.kind === f.kind && bare(x.text) === bare(f.name) && Math.abs(x.t - r.t) < 180)) return; r = { ...r, kind: f.kind, need: f.kind === "place" ? ["pmap"] : VISL }; }
      r = { ...r, text: f.name ?? r.text, ...(f.geo ? { geo: f.geo } : {}) };
    }
    if (rows.some((x) => x.kind === r.kind && bare(x.text) === bare(r.text))) return;
    if (r.kind === "person" && rows.some((x) => x.kind === "person" && norm(x.text).split(" ").some((a) => a.length >= 4 && norm(r.text).split(" ").includes(a)))) return;
    if (r.kind === "depict") { const root = (t) => bare(t).replace(/(يين|يه|ين|ي|ه)$/, ""); if (rows.some((x) => x.kind === "depict" && root(x.text) === root(r.text))) return; }   // الهندوسية = الهندوسي = الهندوس   // a name / thing is pictured once, at its first mention
    if (r.t != null && ["date", "place", "person", "state"].includes(r.kind) && rows.some((x) => x.kind === r.kind && x.t != null && Math.abs(x.t - r.t) < (r.kind === "date" ? 4 : 2.5))) return;   // the same moment heard by both passes
    rows.push({ id: rows.length + 1, ...r });
  };

  const scan = (W, cw, nerF) => {
  // 1) NER (places, people, organisations)
  if (!fs.existsSync(nerF) || fs.statSync(nerF).mtimeMs < fs.statSync(cw).mtimeMs) {
    const r = spawnSync(PY, ["tools/ner_scan.py", cw, nerF], { stdio: "inherit", env: { ...process.env, PYTHONIOENCODING: "utf-8" } });
    if (r.status !== 0) { console.error("✘ ner_scan failed"); process.exit(1); }
  }
  const ner = read(nerF, []);
  // world cities with Arabic names → coordinates
  const geo = new Map();
  for (const line of fs.readFileSync("data/geo/cities15000.txt", "utf8").split("\n")) {
    const c = line.split("\t"); if (c.length < 15) continue;
    for (const n of c[3].split(",")) if (/[ء-ي]/.test(n)) { const k = bare(n); if (k.length > 2 && (!geo.has(k) || Number(c[14]) > geo.get(k).pop)) geo.set(k, { name: n, lat: +c[4], lon: +c[5], cc: c[8], pop: Number(c[14]) }); }
  }
  const lex = read("data/mention_lexicon.json", {});
  const lexPeople = Object.entries(lex).filter(([k]) => /أشخاص|علماء|شخصيات/.test(k)).flatMap(([, v]) => Object.entries(v));
  const lexPlaces = Object.entries(lex).filter(([k]) => /دول|أماكن|مدن|بلدان/.test(k)).flatMap(([, v]) => Object.entries(v));

  const placeLast = new Map(), personLast = new Map();
  const STOP = new Set(["الله", "الرب", "النبي", "الرسول", "المدينه", "الجديده", "العالم", "الارض", "السماء", "الدنيا", "البلد", "الدوله"].map(bare));
  // whole words only: a fragment («رم» of «رمبل», «اش» of «اشنو») is a tokenizer slice, not a name
  const ok = (e) => { const c = bare(e.core || ""), w = bare(e.text || ""); return c.length >= 3 && c === w && !STOP.has(c); };   // «المصري» → «مصر» is an adjective, not the place
  const locKeys = new Set(ner.filter((e) => e.type === "LOC" && ok(e)).map((e) => bare(e.core)));
  for (const e of ner) {
    if (!ok(e)) continue;
    const key = bare(e.core);
    if (e.type === "PERS" && (locKeys.has(key) || geo.has(key))) continue;
    if (NO_PICTURE.test(norm(e.text))) continue;   // «هاريانا» tagged both → it is a place
    if (e.type === "LOC" && (lexPeople.some(([n, f]) => [n, ...f].some((x) => bare(x) === key)) || ner.some((o) => o.type === "PERS" && bare(o.core) === key && o.score > e.score))) continue;
    if (e.type === "LOC") {
      const last = placeLast.get(key);
      if (last != null) continue;   // first mention only («لا تكرر صورته كل ما يذكر»)
      placeLast.set(key, e.s);
      const g = geo.get(key);
      add({ kind: "place", text: e.core || e.text, t: e.s, need: ["pmap"], before: 2, after: 6, geo: g ? { lat: g.lat, lon: g.lon, cc: g.cc } : null, ctx: ctx(W, e.s) });
    } else if (e.type === "PERS") {
      const last = personLast.get(key);
      if (last != null) continue;   // first mention only («لا تكرر صورته كل ما يذكر»)
      personLast.set(key, e.s);
      add({ kind: "person", text: e.core || e.text, t: e.s, need: ["pic", "tphoto", "scholar", "peek", "bgclip", "full", "person", "rows"], before: 3, after: 5, ctx: ctx(W, e.s) });
    } else if (e.type === "ORG") {
      add({ kind: "depict", text: e.core || e.text, t: e.s, need: VIS, before: 3, after: 5, ctx: ctx(W, e.s) });
    }
  }
  // lexicon places/people the model missed, and world cities by name
  const N = W.map((w) => bare(w.w));
  N.forEach((k, i) => {
    const t = W[i].s;
    // the lexicon form keeps its «ال»: «مدينة» (a city) is not «المدينة» (Medina)
    const wn = norm(W[i].w).replace(/^(و|ف)?(ب|ل|ك)?/, ""), hitPlace = lexPlaces.find(([, forms]) => forms.some((f) => { const fn = norm(f); return fn.startsWith("ال") ? wn === fn || "ال" + wn === fn && false : bare(f) === k; }))?.[0] ?? (geo.has(k) && k.length > 3 && geo.get(k).pop > 200000 && wn.startsWith("ال") === norm(geo.get(k).name).startsWith("ال") && /^(في|مدينه|الى|من|ولايه|بلد|دوله|عاصمه|بمدينه|لمدينه|اسمها)$/.test(norm(W[i - 1]?.w ?? "")) ? geo.get(k).name : null);
    if (hitPlace) { const key = bare(hitPlace), last = placeLast.get(key); if (last == null) { placeLast.set(key, t); const g = geo.get(key); add({ kind: "place", text: hitPlace, t, need: ["pmap"], before: 2, after: 6, geo: g ? { lat: g.lat, lon: g.lon, cc: g.cc } : null, ctx: ctx(W, t) }); } }
    const hitPerson = lexPeople.find(([, forms]) => forms.some((f) => { const fw = norm(f).split(" "); return fw.every((x, j) => bare(x) === N[i + j]); }))?.[0];
    if (hitPerson) { const key = bare(hitPerson), last = personLast.get(key); if (last == null) { personLast.set(key, t); add({ kind: "person", text: hitPerson, t, need: ["pic", "tphoto", "scholar", "peek", "bgclip", "full", "person", "rows"], before: 3, after: 5, ctx: ctx(W, t) }); } }
  });

  // 2) dates
  const MONTHS = /^(يناير|فبراير|مارس|ابريل|مايو|يونيو|يوليو|اغسطس|سبتمبر|اكتوبر|نوفمبر|ديسمبر|محرم|صفر|ربيع|جمادى|رجب|شعبان|رمضان|شوال|ذو|كانون|شباط|اذار|نيسان|ايار|حزيران|تموز|اب|ايلول|تشرين)$/;
  let lastDate = -99;
  W.forEach((w, i) => {
    const k = norm(w.w), prev = norm(W[i - 1]?.w ?? ""), next = norm(W[i + 1]?.w ?? "");
    const num = Number(k.replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d)));
    const year = Number.isFinite(num) && num >= 1 && num <= 2100 && (/^(سنه|عام|سنة|في|منذ|حتى|الى)$/.test(prev) || /^(ه|هـ|م|ميلادي|ميلاديه|هجري|هجريه|للميلاد|للهجره)$/.test(next) || (num >= 600 && num <= 2100 && String(k).length >= 3));
    // spoken years: «سنة ألفين وأربعة عشر», «عام تسعة عشر»
    const NUMW = /^(الف|الفين|الفان|واحد|اثنين|ثلاث|ثلاثه|اربع|اربعه|خمس|خمسه|ست|سته|سبع|سبعه|ثمان|ثماني|ثمانيه|تسع|تسعه|عشر|عشره|عشرين|ثلاثين|اربعين|خمسين|ستين|سبعين|ثمانين|تسعين|مئه|مائه|ميه|تسعمئه|تسعمائه)$/;
    const spokenYear = /^(سنه|عام)$/.test(prev) && NUMW.test(k.replace(/^و/, ""));
    const isDate = year || spokenYear || bare(w.w) === "قرن" || MONTHS.test(bare(w.w)) && /^\d/.test(prev + next);
    if (isDate && w.s - lastDate > 8) { lastDate = w.s; add({ kind: "date", text: W.slice(Math.max(0, i - 2), i + 3).map((x) => x.w).join(" "), t: w.s, need: ["date", "timeline"], before: 1, after: 5, ctx: ctx(W, w.s) }); }
  });

  // 2b) STATES (user 2026-11-12: «واقف على الجسر، يسجدون له، يستلقي على الأرض ويرفع يديه إلى السماء — هذه تسمى حالات… تولَّد لها صور»): a scene of a posture or an act
  //     described in the speech → a picture of that scene at its words; a locally generated still is allowed for a state (faceless, no women). One row per scene (30 s apart).
  {
    const STATE = /^(يسجد|يسجدون|سجد|سجدوا|ساجد|ساجدين|السجود|واقف|واقفا|وقف|يقف|يقفون|يستلقي|مستلق|مستلقيا|استلقى|يرفع|رافعا|يقبل|يقبلون|يقبلوا|قبلوا|تقبيل|ينحني|ينحنون|انحنى|ينبطح|الانبطاح|بالانبطاح|يركع|راكع|يركعون|يبكي|يبكون|يصرخ|يرقص|يرقصون|يجلس|جالس|جالسا|قاعد|يصلي|يصلون|يتعبد|يتعبدون|يطوف|يطوفون|يتضرع|يتمرغ|يزحف|يزحفون|يتهافتون|طوابير|يحمل|يحملون|يهرب|صعد|اصعده|نزل|يمشي|يمشون|يغتسل|يأكل|يشرب|يرضع|رضيع|رضيعا)$/;
    let lastState = -99;
    W.forEach((w, i) => {
      const k = bare(w.w);
      if (!STATE.test(k) && !STATE.test(norm(w.w))) return;
      if (w.s - lastState < 30) return;
      lastState = w.s;
      add({ kind: "state", text: W.slice(Math.max(0, i - 2), i + 4).map((x) => x.w).join(" "), t: w.s, need: VISL, before: 2, after: 5, ctx: ctx(W, w.s) });
    });
  }
  // 2c) QUESTION SERIES (user 2026-11-12, frame 1411: «كنت أطرح مجموعة من الأسئلة… تكتب السؤال الأول، الثاني، الثالث»; rule: الأسئلة والقوائم ← StatRow):
  //     two or more of HIS questions (a word ending in ؟/?) within 12 s of each other, outside the opponent's clip windows → a listing card (rows) over them
  {
    const sp = read(`data/specs/${p}.json`, {}), inClip = (t) => (sp.splits ?? []).some((x) => t >= x.from && t < x.to);
    /* questions are read from the accurate large-model pass of the final audio when present (2026-11-12: the weak pass put «؟» on statements) */
    const QW = fs.existsSync(path.join(T, "drift_fresh.json")) ? read(path.join(T, "drift_fresh.json"), W) : W;
    const qs = QW.filter((w) => /[؟?]$/.test(String(w.w)) && !inClip(w.s)).map((w) => w.s);
    let g = [];
    const flush = () => { if (g.length >= 2) add({ kind: "questions", text: `سلسلة ${g.length} أسئلة`, t: g[0], need: ["rows"], before: 8, after: 2, ctx: ctx(W, g[0]) }); g = []; };
    for (const t of qs) { if (g.length && t - g[g.length - 1] > 12) flush(); g.push(t); }   /* 12 s: a rhetorical question answered at once is not a list */
    flush();
  }
  // 2d) CONDITIONS AND THEIR CONSEQUENCES (user 2026-11-12, frame 6758: «إذا قلت كذا سيكون كذا، إذا قلت كذا سيكون كذا»): «إن قلت / وإن قلت / فإن قلت» twice or
  //     more within 45 s (outside the clip windows) → his video slid right with a transparent left edge + one listing card of condition → consequence boxes
  {
    const sp = read(`data/specs/${p}.json`, {}), inClip = (t) => (sp.splits ?? []).some((x) => t >= x.from && t < x.to);
    const cs = []; for (let i = 0; i < W.length - 1; i++) { const a = bare(String(W[i].w)), b = bare(String(W[i + 1].w)); if (/^(و|ف)?ان$/.test(a) && b === "قلت" && !inClip(W[i].s)) cs.push(W[i].s); }
    let g = [];
    const flush = () => { if (g.length >= 2) add({ kind: "conditions", text: `${g.length} شروط «إن قلت»`, t: g[0], need: ["rows"], before: 3, after: 3, ctx: ctx(W, g[0]) }); g = []; };
    for (const t of cs) { if (g.length && t - g[g.length - 1] > 45) flush(); g.push(t); }
    flush();
  }
  // 3) described people / groups / buildings / acts / animals
  const dep = read("data/depict_lexicon.json", {});
  const terms = new Map(); for (const [g, list] of Object.entries(dep)) if (g !== "_") for (const f of list) terms.set(bare(f), g);
  const depLast = new Map();
  N.forEach((k, i) => {
    if (!terms.has(k)) return;
    const t = W[i].s, last = depLast.get(k);
    if (last != null) return;   // first mention only
    depLast.set(k, t);
    add({ kind: "depict", text: W[i].w, group: terms.get(k), t, need: VIS, before: 3, after: 5, ctx: ctx(W, t) });
  });

  };
  for (const [f, nf] of SOURCES) scan(read(f, []), f, path.join(T, nf));
  rows.sort((a, b) => (a.t ?? 1e9) - (b.t ?? 1e9)); rows.forEach((r, i) => (r.id = i + 1));
  // 4) the user's «مونتاج» orders, and stretches of the original that talk to the editor
  const notes = read(path.join(T, "montage_notes.json"), []);
  for (const n of notes) add({ kind: "order", text: n.text, n: n.n, plan: n.plan ?? null, t: n.plan?.[0]?.at ?? null, need: null });
  const O = read(path.join(T, "words.json"), []);
  const CUE = /^(حط|حطو|حطها|حطه|ضع|ضعها|اعرض|اعرضها|خلي|خليها|جيب|جيبلي|نزل|احذف|شيل|شيلها|قص|زوم|زووم|كبر|صغر|صوره|صور|خلفيه|الخلفيه|فيديو|فيديوهات|تاثير|اكتب|العنوان|مونتاج|موتاج|منتاج|انتهى|الاطار|الشاشه|الزاويه|عزل|اعزل|مقطع|لقطه)$/;
  const cues = O.map((w) => ({ s: w.s, c: CUE.test(bare(w.w)) || CUE.test(norm(w.w)) })).filter((x) => x.c);
  let lastCand = -99;
  for (let i = 0; i < cues.length; i++) {
    const win = cues.filter((x) => x.s >= cues[i].s && x.s <= cues[i].s + 12);
    if (win.length >= 3 && cues[i].s - lastCand > 20) {
      lastCand = cues[i].s;
      const covered = notes.some((n) => n.at_src != null && Math.abs(n.at_src - cues[i].s) < 40) || notes.some((n) => { const m = String(n.text).match(/^\[(\d+):(\d+)(?::(\d+))?/); if (!m) return false; const s = m[3] ? +m[1] * 3600 + +m[2] * 60 + +m[3] : +m[1] * 60 + +m[2]; return Math.abs(s - cues[i].s) < 60; });
      add({ kind: "ordercand", text: O.filter((w) => w.s >= cues[i].s - 3 && w.s <= cues[i].s + 15).map((w) => w.w).join(" "), src: cues[i].s, t: null, covered, need: null });
    }
  }
  fs.writeFileSync(reqF, JSON.stringify(rows, null, 1));
  const md = ["# ما يجب أن يظهر في الفيديو (يُستخرج قبل البناء)", "", "| # | النوع | الكلمة | الوقت | العنصر المطلوب | السياق |", "|---|---|---|---|---|---|",
    ...rows.map((r) => `| ${r.id} | ${KIND[r.kind]} | ${r.kind === "order" ? r.text.slice(0, 60) : r.text} | ${r.t != null ? mm(r.t) : r.src != null ? "أصل " + mm(r.src) : "—"} | ${r.need ? r.need.slice(0, 3).join("/") : r.kind === "order" ? (r.plan ? r.plan.map((x) => x.arg != null ? `${x.type}:${x.arg}` : `${x.type}@${mm(x.at)}`).join("، ") : "✘ بلا خطة") : r.covered ? "✔ تعليمة مسجلة" : "✘ اسمعها"} | ${(r.ctx ?? "").slice(0, 70)} |`)];
  fs.writeFileSync(path.join(T, "requirements.md"), md.join("\n") + "\n");
  const by = (k) => rows.filter((r) => r.kind === k).length;
  console.log(`requirements: ${rows.length} صفاً — أماكن ${by("place")}، أشخاص ${by("person")}، تواريخ ${by("date")}، أوصاف ${by("depict")}، تعليمات ${by("order")}، مواضع تخاطب المونتير ${by("ordercand")} → ${path.join(T, "requirements.md")}`);
  return rows;
}
// prophets, God and angels are never drawn or photographed
const NO_PICTURE = /(وسلم|صلى الله|عيسى|عيسي|المسيح|موسى|موسي|ابراهيم|نوح|يوسف|يعقوب|اسحاق|اسماعيل|داود|سليمان|يونس|ايوب|زكريا|يحيى|هارون|ادم|محمد ﷺ|رسول الله|النبي|جبريل|ميكائيل|الله)/;
const VIS = ["pic", "tphoto", "scholar", "peek", "bgclip", "full", "person", "pmap", "flash", "crop", "scene", "flag", "news", "rows"];   /* rows: a listing card item with a photo (2026-11-12) */
const KIND = { conditions: "شروط ونتائجها ← فيديوه يميناً + بطاقة شروط", questions: "سلسلة أسئلة ← بطاقة بنود", state: "حالة ← صورة المشهد (التوليد مسموح)", place: "مكان ← خريطة", person: "شخص ← صورته", date: "تاريخ ← عنصر التاريخ", depict: "وصف ← صورة", order: "تعليمة مونتاج", ordercand: "كلام للمونتير؟" };
function ctx(W, t) { const i = W.findIndex((w) => w.s >= t); return W.slice(Math.max(0, i - 5), i + 8).map((w) => w.w).join(" "); }

// ───────────── check the spec against it ─────────────
function check(rows) {
  const spec = read(path.join("data", "specs", `${p}.json`), null);
  if (!spec) { console.log(`✘ data/specs/${p}.json missing`); process.exit(1); }
  const span = (it) => { const a = it.at ?? it.from ?? it.times?.[0]; const b = it.until ?? it.to ?? (it.dur != null && a != null ? a + it.dur : a != null ? a + 3 : null); return a == null ? null : [a, b]; };
  const items = (spec.items ?? []).filter((i) => i.t !== "cover").map((i) => ({ t: i.t, sp: span(i), i }));
  /* a map `move` (names_scan: later mentions of a country/neighbour/city ride on the same pmap item) is a map window of its own (2026-11-19) */
  for (const i of spec.items ?? []) if (i.t === "pmap") for (const m of i.moves ?? []) items.push({ t: "pmap", sp: [m.from, m.to], i: m });
  const behind = (spec.behind ?? []).map((w) => [w.from, w.to]);
  const skip = new Set(spec.skipRequired ?? []), waive = (spec.waiveOrders ?? []).map((s) => Number(String(s).split(":")[0]));
  // "peek.say" = a peek item that carries a `say` bubble (a type with a required field)
  const has = (types, a, b) => items.some((x) => x.sp && types.some((ty) => { const [t, fld] = ty.split("."); return x.t === t && (!fld || x.i[fld] != null); }) && x.sp[0] <= b && x.sp[1] >= a);
  const miss = [];
  for (const r of rows) {
    if (r.kind === "ordercand") { if (!r.covered && !waive.some((s) => Math.abs(s - r.src) < 20)) miss.push(`${KIND[r.kind]} عند أصل ${mm(r.src)}: «${r.text.slice(0, 70)}» — اسمعها: تعليمة؟ (montage_notes add … --at ${r.src.toFixed(0)}) أو "waiveOrders"`); continue; }
    if (r.kind === "order") {
      if (!r.plan?.length) { miss.push(`التعليمة ${r.n} بلا خطة تنفيذ («${r.text.slice(0, 50)}…») — montage_notes plan ${p} ${r.n} "type@sec,…"`); continue; }
      const fw = (read(path.join(T, "drift_fresh.json"), []) ?? []).map((w) => bare(w.w));
      for (const x of r.plan) if (x.type === "none" || x.type === "proc") continue; else if (x.type === "cut") { const ph = norm(x.arg).split(" ").map(bare); if (fw.some((_, i) => ph.every((y, j) => fw[i + j] === y))) miss.push(`التعليمة ${r.n}: «${x.arg}» ما زالت مسموعة في الصوت النهائي`); } else if (!has([x.type], x.at - 0.5, x.at + 0.5) && !(x.type === "behind" && behind.some(([a, b]) => a <= x.at && b >= x.at))) miss.push(`التعليمة ${r.n}: لا «${x.type}» عند ${mm(x.at)}`);
      continue;
    }
    if (skip.has(`${r.text}@${Math.round(r.t)}`) || [...skip].some((s) => s.split("@")[0] === r.text && Math.abs(Number(s.split("@")[1]) - r.t) < 3)) continue;
    /* a listing card whose row with a PHOTO names this person / thing at its word counts as its picture (2026-11-12: six names with their photos) */
    const rowPic = (r.kind === "person" || r.kind === "depict") && items.some((x) => x.t === "rows" && (x.i.rows ?? []).some((q) => q.photo && Math.abs(q.at - r.t) < 3 && (bare(q.label).includes(bare(r.text)) || bare(r.text).includes(bare(q.label)))));
    /* a mosaic (custom item: words that gather into a cover) shows each of its words[].text at its `at` — that word is pictured there, as a pic would (2026-11-20, gta6 «مخدرات» at 1:05) */
    const mosaicPic = ["person", "depict", "state"].includes(r.kind) && items.some((x) => x.t === "mosaic" && (x.i.words ?? []).some((q) => q.text && typeof q.at === "number" && Math.abs(q.at - r.t) < 3 && (bare(q.text).includes(bare(r.text)) || bare(r.text).includes(bare(q.text)))));
    if (!rowPic && !mosaicPic && !has(r.need, r.t - r.before, r.t + r.after)) miss.push(`${KIND[r.kind]}: «${r.text}» عند ${mm(r.t)} (${r.t.toFixed(1)}ث) بلا ${r.need.slice(0, 2).join("/")}${r.geo ? ` [${r.geo.lat},${r.geo.lon}]` : ""}`);
  }
  console.log(miss.length ? `✘ requirements: ${miss.length} من ${rows.length} لم يتحقق:\n  ` + miss.join("\n  ") : `✔ requirements: كل الصفوف (${rows.length}) متحققة في المواصفة`);
  if ((spec.skipRequired ?? []).length) console.log(`  ⚠ مستثنى بقرار (يُذكر للمستخدم مع الرابط): ${spec.skipRequired.join("، ")}`);
  process.exit(miss.length ? 1 : 0);
}

const rows = CHECK && fs.existsSync(reqF) && fs.statSync(reqF).mtimeMs > fs.statSync(path.join(T, "cut_words.json")).mtimeMs && (!fs.existsSync(path.join(T, "montage_notes.json")) || fs.statSync(reqF).mtimeMs > fs.statSync(path.join(T, "montage_notes.json")).mtimeMs) ? read(reqF, []) : build();
if (CHECK) check(rows);
