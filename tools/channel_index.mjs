// Local index of the Sheikh's YouTube channels (titles only, no transcripts) so «تكلمتُ عن كذا في حلقة سابقة» resolves instantly without re-fetching.
//   node tools/channel_index.mjs refresh            re-reads both channels (videos / streams / shorts) with yt-dlp and rewrites data/channel/episodes.json
//   node tools/channel_index.mjs find "<موضوع>" [-n 8]   ranks titles by Arabic-normalised word match; prints title, kind, duration, URL
// Channels: @MShmsDin and @MShmsDin1 (user 2026-10-27). Honest limit: titles only; a topic that appears inside an episode but not in its title is not found
// (then a transcript index is needed: ask the user before transcribing).
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const CHANNELS = ["MShmsDin", "MShmsDin1"], TABS = ["videos", "streams", "shorts"], DIR = "data/channel", OUT = `${DIR}/episodes.json`;
const [cmd, ...rest] = process.argv.slice(2);

const norm = (s) => String(s ?? "")
  .replace(/[ً-ٰٟـ]/g, "")        // tashkeel + tatweel
  .replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/ؤ/g, "و").replace(/ئ/g, "ي")
  .replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim().toLowerCase();
const stripAl = (w) => w.replace(/^(وال|بال|كال|فال|لل|ال)/, "");

if (cmd === "refresh") {
  fs.mkdirSync(DIR, { recursive: true });
  const all = new Map();
  for (const h of CHANNELS) for (const tab of TABS) {
    const r = spawnSync("yt-dlp", ["--flat-playlist", "--no-warnings", "--add-headers", "Accept-Language:ar", "--extractor-args", "youtube:lang=ar", "-J", `https://www.youtube.com/@${h}/${tab}`], { encoding: "utf8", maxBuffer: 1 << 29 });
    let j; try { j = JSON.parse(r.stdout); } catch { console.log(`@${h}/${tab}: لا قائمة`); continue; }
    let n = 0;
    for (const e of j.entries ?? []) {
      if (!e?.id || all.has(e.id)) continue;
      all.set(e.id, { id: e.id, title: e.title, channel: h, kind: tab === "videos" ? "فيديو" : tab === "streams" ? "بث" : "شورت", duration: e.duration ?? null, views: e.view_count ?? null, url: `https://www.youtube.com/watch?v=${e.id}` });
      n++;
    }
    console.log(`@${h}/${tab}: ${n}`);
  }
  const list = [...all.values()];
  fs.writeFileSync(OUT, JSON.stringify({ updated: new Date().toISOString(), count: list.length, episodes: list }));
  console.log(`حُفظ ${list.length} عنواناً في ${OUT}`);
} else if (cmd === "find") {
  const q = rest.filter((x) => !/^-n$/.test(x) && isNaN(Number(x)) ).join(" ");
  const nI = rest.indexOf("-n"), top = nI >= 0 ? Number(rest[nI + 1]) : 8;
  if (!q || !fs.existsSync(OUT)) { console.error("usage: find \"<موضوع>\" (يحتاج refresh أولاً)"); process.exit(2); }
  const { episodes, updated } = JSON.parse(fs.readFileSync(OUT, "utf8"));
  const words = norm(q).split(" ").filter((w) => w.length > 1).map(stripAl);
  const scored = episodes.map((e) => {
    const t = norm(e.title), tw = t.split(" ").map(stripAl);
    let s = 0; for (const w of words) { if (tw.includes(w)) s += 3; else if (tw.some((x) => x.includes(w) || w.includes(x) && x.length > 2)) s += 1.5; }
    if (t.includes(norm(q))) s += 4;
    return { e, s };
  }).filter((x) => x.s > 0).sort((a, b) => b.s - a.s || (b.e.views ?? 0) - (a.e.views ?? 0)).slice(0, top);
  console.log(`فهرس ${episodes.length} عنواناً (حُدّث ${updated.slice(0, 10)})؛ أقرب ${scored.length} لـ«${q}»:`);
  for (const { e, s } of scored) console.log(`• [${s}] ${e.title}\n    ${e.kind} @${e.channel}${e.duration ? " · " + Math.round(e.duration / 60) + " د" : ""} · ${e.url}`);
  if (!scored.length) console.log("لا عنوان مطابق (قد يكون الكلام داخل الحلقة لا في عنوانها).");
} else console.error("usage: node tools/channel_index.mjs refresh | find \"<موضوع>\" [-n 8]");
