// A montage's «previous episode» references, picked automatically and swappable in seconds (user 2026-10-27: «اعتمد أعلى احتمال، وبعد المونتاج اسألني؛ إن غيّرتَ فاسحب الصورة والعنوان والرابط الجدد مكان القديمة، تبديل سريع بلا فحص»).
//   node tools/episode_ref.mjs pick <project> <slot> "<الموضوع>"          best title match from data/channel/episodes.json → thumbnail + title + link into the slot
//   node tools/episode_ref.mjs swap <project> <slot> <videoId|url>         replace the slot with that episode (no other check)
//   node tools/episode_ref.mjs swap <project> <slot> "<الموضوع>" --nth 2   the 2nd best match for the topic
//   node tools/episode_ref.mjs show <project>                              the slots with title / link / candidates (for the «is this the right episode?» question after the montage)
// Data: data/episode_refs/<project>.json = { slots: { <slot>: { id, title, url, kind, img, topic } } }; thumbnails: public/episodes/<videoId>.jpg (named by video id, never overwritten).
// A composition imports the JSON (hot-reloads in Studio) and shows `staticFile(slot.img)` + slot.title + slot.url in `Sources`; swapping changes only that JSON entry.
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const [cmd, project, slot, ...rest] = process.argv.slice(2);
const IDX = "data/channel/episodes.json", DIR = "data/episode_refs", FILE = `${DIR}/${project}.json`;
const norm = (s) => String(s ?? "").replace(/[ً-ٰٟـ]/g, "").replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/ؤ/g, "و").replace(/ئ/g, "ي").replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim().toLowerCase();
const stripAl = (w) => w.replace(/^(وال|بال|كال|فال|لل|ال)/, "");
const nthI = rest.indexOf("--nth"), nth = nthI >= 0 ? Number(rest[nthI + 1]) : 1;
const arg = rest.filter((x, i) => x !== "--nth" && i !== nthI + 1 || nthI < 0 && x !== "--nth").join(" ").trim();

function candidates(q, top = 5) {
  const { episodes } = JSON.parse(fs.readFileSync(IDX, "utf8"));
  const words = norm(q).split(" ").filter((w) => w.length > 1).map(stripAl);
  return episodes.map((e) => { const t = norm(e.title), tw = t.split(" ").map(stripAl); let s = 0; for (const w of words) { if (tw.includes(w)) s += 3; else if (tw.some((x) => x.includes(w) || (w.includes(x) && x.length > 2))) s += 1.5; } if (t.includes(norm(q))) s += 4; return { e, s }; })
    .filter((x) => x.s > 0).sort((a, b) => b.s - a.s || (b.e.views ?? 0) - (a.e.views ?? 0)).slice(0, top).map((x) => x.e);
}
function thumb(id) {
  fs.mkdirSync("public/episodes", { recursive: true });
  const out = `public/episodes/${id}.jpg`;
  if (fs.existsSync(out) && fs.statSync(out).size > 2000) return `episodes/${id}.jpg`;
  for (const v of ["maxresdefault", "sddefault", "hqdefault"]) {
    const r = spawnSync("curl", ["-sL", "-m", "30", "-o", out, "-w", "%{http_code}", `https://i.ytimg.com/vi/${id}/${v}.jpg`], { encoding: "utf8" });
    if (r.stdout.trim() === "200" && fs.statSync(out).size > 2000) return `episodes/${id}.jpg`;
  }
  throw new Error("no thumbnail for " + id);
}
const load = () => { try { return JSON.parse(fs.readFileSync(FILE, "utf8")); } catch { return { slots: {} }; } };
function put(ep, topic) {
  const data = load(); const old = data.slots[slot];
  data.slots[slot] = { id: ep.id, title: ep.title, url: ep.url, kind: ep.kind, img: thumb(ep.id), topic: topic ?? old?.topic ?? "" };
  fs.mkdirSync(DIR, { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(data, null, 1));
  console.log(`${old ? "بُدّلت" : "وُضعت"} «${slot}»: ${ep.title}\n  ${ep.url}\n  الصورة: ${data.slots[slot].img}${old ? `\n  (كانت: ${old.title})` : ""}`);
}

if (!cmd || !project) { console.error("usage: pick|swap <project> <slot> …  |  show <project>"); process.exit(2); }
if (cmd === "pick") {
  const c = candidates(arg, 5); if (!c.length) { console.error("لا عنوان مطابق: الكلام داخل الحلقة؛ اسأل المستخدم قبل بناء فهرس تفريغ."); process.exit(1); }
  put(c[0], arg);
} else if (cmd === "swap") {
  const m = arg.match(/(?:v=|youtu\.be\/|shorts\/)([\w-]{11})|^([\w-]{11})$/);
  if (m) { const id = m[1] ?? m[2]; const { episodes } = JSON.parse(fs.readFileSync(IDX, "utf8")); const ep = episodes.find((e) => e.id === id) ?? { id, title: `(حلقة ${id})`, url: `https://www.youtube.com/watch?v=${id}`, kind: "" }; put(ep); }
  else { const c = candidates(arg, 8); const ep = c[nth - 1]; if (!ep) { console.error("لا مرشح بهذا الترتيب"); process.exit(1); } put(ep, arg); }
} else if (cmd === "show") {
  const d = load(); const keys = Object.keys(d.slots); if (!keys.length) console.log("لا مراجع لهذا المشروع");
  for (const k of keys) { const s = d.slots[k]; console.log(`• ${k}: ${s.title}\n    ${s.url}  (موضوع: «${s.topic}»)`); const alt = candidates(s.topic, 4).filter((e) => e.id !== s.id); alt.forEach((e, i) => console.log(`    بديل ${i + 2}: ${e.title} — ${e.url}`)); }
} else { console.error("unknown command"); process.exit(2); }
