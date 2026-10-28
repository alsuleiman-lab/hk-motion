// Builds the shared elements page (artifact HTML) from data/elements_lab.json + the ElementsLab stills.
//   node tools/stills.mjs ElementsLab scratch/lab_stills <id>:<frame> … --scale 0.4     (frame = index*90 + (still||72); see src/ElementsLab.tsx)
//   node tools/elements_page.mjs  →  scratch/elements_page.html   (publish with the Artifact tool; notes/status are kept in its db)
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const L = JSON.parse(fs.readFileSync("data/elements_lab.json", "utf8"));
fs.mkdirSync("scratch/lab_jpg", { recursive: true });
const items = L.map((m) => {
  const png = `scratch/lab_stills/${m.id}.png`, jpg = `scratch/lab_jpg/${m.id}.jpg`;
  if (fs.existsSync(png)) spawnSync("ffmpeg", ["-v", "error", "-y", "-i", png, "-vf", "scale=640:-1", "-q:v", "5", jpg]);
  const img = fs.existsSync(jpg) ? "data:image/jpeg;base64," + fs.readFileSync(jpg).toString("base64") : "";
  return { id: m.id, ar: m.ar, kit: m.kit, group: m.group, where: m.where, note: m.note, img };
});
const groups = [...new Set(items.map((i) => i.group))];

const html = `<title>معرض عناصر المونتاج</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Almarai:wght@400;700;800&family=Noto+Kufi+Arabic:wght@600;800&display=swap">
<style>
/* layout: a calm gallery. Each element is drawn alone, with its Arabic name, where it goes, and a keep/change/remove mark we edit together. */
:root{--bg:#eef1f4;--panel:#ffffff;--ink:#1b2430;--mute:#5d6b7a;--line:#d5dce4;--accent:#2f5a8a;--on-accent:#fff;--keep:#2d7a55;--change:#b9791f;--drop:#b4423a;--stage:#1d2b3b;--f-title:"Noto Kufi Arabic","Segoe UI",Tahoma,sans-serif;--f-body:"Almarai","Segoe UI",Tahoma,sans-serif}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#121a23;--panel:#1a2531;--ink:#e8edf2;--mute:#9aa8b6;--line:#2b3a4a;--accent:#7fb0e0;--on-accent:#10202f;--keep:#58c28c;--change:#e0a64a;--drop:#e5786f;--stage:#0e1620;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#121a23;--panel:#1a2531;--ink:#e8edf2;--mute:#9aa8b6;--line:#2b3a4a;--accent:#7fb0e0;--on-accent:#10202f;--keep:#58c28c;--change:#e0a64a;--drop:#e5786f;--stage:#0e1620;color-scheme:dark}
html{direction:rtl}body{background:var(--bg);color:var(--ink);font-family:var(--f-body);line-height:1.7;padding-inline:max(16px,env(safe-area-inset-left,0px)) max(16px,env(safe-area-inset-right,0px));padding-block:20px 48px;max-width:1280px;margin-inline:auto}
header{display:flex;flex-wrap:wrap;gap:12px 24px;align-items:end;justify-content:space-between;margin-bottom:18px}
h1{font-family:var(--f-title);font-weight:800;font-size:clamp(26px,4vw,38px);margin:0;text-wrap:balance}
header p{margin:4px 0 0;color:var(--mute);max-width:60ch}
.tally{display:flex;gap:8px;flex-wrap:wrap}.tally span{background:var(--panel);border:1px solid var(--line);border-radius:999px;padding:4px 14px;font-weight:700;font-size:14px}
.tally b{font-variant-numeric:tabular-nums}
.bar{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0 22px;align-items:center}
.bar button,.bar input{font:inherit}
.chip{border:1px solid var(--line);background:var(--panel);color:var(--ink);padding:6px 14px;border-radius:999px;cursor:pointer}
.chip[aria-pressed="true"]{background:var(--accent);color:var(--on-accent);border-color:var(--accent)}
.bar input{flex:1 1 200px;min-width:0;padding:8px 14px;border-radius:10px;border:1px solid var(--line);background:var(--panel);color:var(--ink)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,520px),1fr));gap:18px}
.card{background:var(--panel);border:1px solid var(--line);border-radius:12px;overflow:hidden;display:flex;flex-direction:column;min-width:0}
.card.s-keep{border-top:4px solid var(--keep)}.card.s-change{border-top:4px solid var(--change)}.card.s-drop{border-top:4px solid var(--drop)}
.stage{background:var(--stage);aspect-ratio:16/9;display:block;width:100%;object-fit:cover}
.body{padding:14px 16px 16px;display:grid;gap:8px;min-width:0}
.name{display:flex;gap:10px;align-items:baseline;flex-wrap:wrap}.name h2{font-family:var(--f-title);font-size:21px;margin:0}
code{font-family:ui-monospace,Consolas,monospace;font-size:12.5px;color:var(--mute);direction:ltr;unicode-bidi:isolate}
.where{margin:0}.note{margin:0;color:var(--mute);font-size:14px}
.marks{display:flex;gap:6px;flex-wrap:wrap}
.marks button{font:inherit;font-size:14px;border:1px solid var(--line);background:transparent;color:var(--ink);padding:4px 12px;border-radius:8px;cursor:pointer}
.marks button[aria-pressed="true"][data-s="keep"]{background:var(--keep);color:#fff;border-color:var(--keep)}
.marks button[aria-pressed="true"][data-s="change"]{background:var(--change);color:#fff;border-color:var(--change)}
.marks button[aria-pressed="true"][data-s="drop"]{background:var(--drop);color:#fff;border-color:var(--drop)}
textarea{font:inherit;font-size:14px;width:100%;min-height:54px;resize:vertical;padding:8px 10px;border-radius:8px;border:1px solid var(--line);background:var(--bg);color:var(--ink);box-sizing:border-box}
.who{font-size:12px;color:var(--mute)}
.saved{font-size:12px;color:var(--keep);min-height:1em}
.theme-btn{font:inherit;border:1px solid var(--line);background:var(--panel);color:var(--ink);border-radius:8px;padding:6px 12px;cursor:pointer}
#conn{margin:-10px 0 18px;font-size:14px;font-weight:700;padding:6px 12px;border-radius:8px;background:var(--panel);border:1px solid var(--line);color:var(--drop)}#conn[data-ok="1"]{color:var(--keep)}
:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
@media (prefers-reduced-motion:no-preference){.card{transition:border-color .2s}}
</style>
<header>
  <div><h1>معرض عناصر المونتاج</h1><p>كل عنصر مرسوم وحده، معه اسمه العربي وأين يوضع. علّم كل عنصر (أبقِه، عدّله، احذفه) واكتب ملاحظتك، فتُحفظ هنا وأقرؤها أنا وأعدّل عليها. الألوان في الصور من ثيم هذا الفيديو التجريبي؛ كل فيديو يأخذ ثيمه الخاص.</p></div>
  <div class="tally" id="tally"></div>
</header>
<div class="bar" id="bar"></div>
<p id="conn" data-ok="0" role="status">جارٍ الاتصال بقاعدة الملاحظات…</p>
<main class="grid" id="grid"></main>
<script>
const ITEMS = ${JSON.stringify(items)};
const GROUPS = ${JSON.stringify(groups)};
const grid = document.getElementById("grid"), bar = document.getElementById("bar"), tally = document.getElementById("tally");
let filter = "الكل", q = "", notes = {}, dbc = null;
const LABEL = { keep: "أبقِه", change: "عدّله", drop: "احذفه" };

const LS = "elements-notes-v1";
const pending = new Set();
function keepLocal() { try { localStorage.setItem(LS, JSON.stringify(notes)); } catch (e) { /* storage blocked */ } }
function setConn(ok, text) { const c = document.getElementById("conn"); if (c) { c.textContent = text; c.dataset.ok = ok ? "1" : "0"; } }
function save(id, patch) {
  notes[id] = Object.assign({}, notes[id], patch);
  keepLocal();
  if (!dbc) { pending.add(id); return; }
  clearTimeout(save.t[id]);
  save.t[id] = setTimeout(() => {
    dbc.doc(id).set({ status: notes[id].status || "", note: notes[id].note || "", at: Date.now() })
      .then(() => { const el = document.querySelector('[data-saved="' + id + '"]'); if (el) { el.textContent = "حُفظ"; setTimeout(() => { el.textContent = ""; }, 1500); } })
      .catch(() => { pending.add(id); setConn(false, "تعذّر الحفظ عند كلود — ملاحظاتك محفوظة في هذا المتصفح، واضغط «نسخ ملاحظاتي» وألصقها في المحادثة"); const el = document.querySelector('[data-saved="' + id + '"]'); if (el) el.textContent = "لم يُحفظ عند كلود"; });
  }, 500);
}
save.t = {};

function renderTally() {
  const c = { keep: 0, change: 0, drop: 0 };
  for (const k in notes) if (c[notes[k].status] !== undefined) c[notes[k].status]++;
  tally.innerHTML = '<span>للإبقاء <b>' + c.keep + '</b></span><span>للتعديل <b>' + c.change + '</b></span><span>للحذف <b>' + c.drop + '</b></span><span>الكل <b>' + ITEMS.length + '</b></span>';
}
function renderBar() {
  bar.innerHTML = "";
  for (const g of ["الكل", ...GROUPS]) {
    const b = document.createElement("button"); b.className = "chip"; b.type = "button"; b.textContent = g; b.setAttribute("aria-pressed", String(g === filter));
    b.onclick = () => { filter = g; renderBar(); renderGrid(); }; bar.appendChild(b);
  }
  const s = document.createElement("input"); s.id = "search"; s.type = "search"; s.placeholder = "بحث بالاسم أو الكود"; s.value = q;
  s.oninput = () => { q = s.value; renderGrid(); }; bar.appendChild(s);
  const cp = document.createElement("button"); cp.className = "theme-btn"; cp.type = "button"; cp.textContent = "نسخ ملاحظاتي";
  cp.onclick = () => {
    const lines = ITEMS.filter((it) => notes[it.id] && (notes[it.id].status || notes[it.id].note)).map((it) => it.id + " (" + it.ar + "): " + (LABEL[notes[it.id].status] || "-") + (notes[it.id].note ? " — " + notes[it.id].note : ""));
    const txt = lines.join("\\n") || "لا ملاحظات بعد";
    (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => { cp.textContent = "نُسخ ✓"; setTimeout(() => { cp.textContent = "نسخ ملاحظاتي"; }, 1500); }, () => { prompt("انسخ ملاحظاتك:", txt); });
  };
  bar.appendChild(cp);
  const t = document.createElement("button"); t.className = "theme-btn"; t.type = "button"; t.textContent = "فاتح / داكن";
  t.onclick = () => { const r = document.documentElement; const dark = r.dataset.theme ? r.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches; r.dataset.theme = dark ? "light" : "dark"; };
  bar.appendChild(t);
}
function card(it) {
  const n = notes[it.id] || {};
  const el = document.createElement("article"); el.className = "card" + (n.status ? " s-" + n.status : ""); el.dataset.id = it.id;
  const img = it.img ? '<img class="stage" alt="' + it.ar + '" src="' + it.img + '">' : '<div class="stage"></div>';
  el.innerHTML = img + '<div class="body"><div class="name"><h2></h2><code></code></div><p class="where"></p><p class="note"></p>'
    + '<div class="marks" role="group"></div><textarea id="n-' + it.id + '" placeholder="ملاحظتك على هذا العنصر"></textarea><div class="saved" data-saved="' + it.id + '"></div></div>';
  el.querySelector("h2").textContent = it.ar; el.querySelector("code").textContent = it.id + " · " + it.kit;
  el.querySelector(".where").textContent = it.where; const nt = el.querySelector(".note"); if (it.note) nt.textContent = it.note; else nt.remove();
  const m = el.querySelector(".marks");
  for (const s of ["keep", "change", "drop"]) {
    const b = document.createElement("button"); b.type = "button"; b.dataset.s = s; b.textContent = LABEL[s]; b.setAttribute("aria-pressed", String(n.status === s));
    b.onclick = () => { const cur = (notes[it.id] || {}).status; const nx = cur === s ? "" : s; save(it.id, { status: nx }); el.className = "card" + (nx ? " s-" + nx : ""); m.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.s === nx))); renderTally(); };
    m.appendChild(b);
  }
  const ta = el.querySelector("textarea"); ta.value = n.note || ""; ta.oninput = () => save(it.id, { note: ta.value });
  return el;
}
function renderGrid() {
  const active = document.activeElement && document.activeElement.id;
  grid.innerHTML = "";
  const qq = q.trim().toLowerCase();
  for (const it of ITEMS) {
    if (filter !== "الكل" && it.group !== filter) continue;
    if (qq && !(it.ar + " " + it.id + " " + it.where).toLowerCase().includes(qq)) continue;
    grid.appendChild(card(it));
  }
  renderTally();
  if (active) { const a = document.getElementById(active); if (a) a.focus(); }
}
renderBar(); renderGrid();
(async () => {
  try {
    try { const loc = JSON.parse(localStorage.getItem(LS) || "{}"); for (const k in loc) { notes[k] = loc[k]; pending.add(k); } renderGrid(); } catch (e) { /* none */ }
    const db = await (window.claude && window.claude.use ? window.claude.use("db") : null);
    if (!db) { setConn(false, "غير متصل بقاعدة الملاحظات (افتح الصفحة من رابطها على claude.ai) — ملاحظاتك تُحفظ في هذا المتصفح فقط؛ اضغط «نسخ ملاحظاتي» وألصقها في المحادثة"); return; }
    dbc = db.collection("notes");
    setConn(true, "متصل: كل علامة وملاحظة تُحفظ ويقرؤها كلود");
    for (const id of [...pending]) { pending.delete(id); save(id, {}); }
    dbc.onSnapshot((snap) => {
      const typing = document.activeElement && document.activeElement.tagName === "TEXTAREA";
      snap.docs.forEach((d) => { const v = d.data(); if (!typing || !notes[d.id]) notes[d.id] = { status: v.status || "", note: v.note || "" }; });
      if (!typing) renderGrid(); else renderTally();
    }, () => {});
  } catch (e) { /* page works without the shared store */ }
})();
</script>
`;
fs.writeFileSync("scratch/elements_page.html", html);
console.log("page:", (html.length / 1048576).toFixed(2), "MB,", items.length, "elements,", items.filter((i) => !i.img).length, "without image");
