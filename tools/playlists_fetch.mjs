// Playlists of both channels (publishing skill, 2026-11-17): the video goes into the playlist of its topic when one matches.
//   node tools/playlists_fetch.mjs            → data/playlists.json { main: [{id,title,count}], replies: [...] } from the PUBLIC playlists pages (no login)
//   node tools/playlists_fetch.mjs match "<title or topic>" [--channel main|replies]   → best playlists by shared words (none = say so to the user)
import fs from "node:fs";
import path from "node:path";

process.chdir(path.resolve(import.meta.dirname, ".."));
const F = "data/playlists.json";
const norm = (s) => String(s).replace(/[ً-ْٰـ]/g, "").replace(/[إأآٱ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/[^\p{L}\p{N} ]/gu, " ").replace(/\s+/g, " ").trim();
const STOP = new Set(["في", "من", "على", "عن", "الى", "و", "ما", "لا", "هل", "مع", "هذا", "هذه", "الشيخ", "محمد", "بن", "شمس", "الدين", "علي", "الي", "شيخ", "دين"]);   /* normalized forms (على → علي) */
const toks = (s) => norm(s).split(" ").map((w) => w.replace(/^(و|ف)?(ال)/, "")).filter((w) => w.length > 2 && !STOP.has(w));

if (process.argv[2] === "match") {
  const q = toks(process.argv[3] ?? ""), ci = process.argv.indexOf("--channel"), ch = ci > 0 ? process.argv[ci + 1] : "main";
  const P = JSON.parse(fs.readFileSync(F, "utf8"))[ch] ?? [];
  const scored = P.map((x) => ({ ...x, score: toks(x.title).filter((t) => q.some((u) => u === t || (t.length > 3 && (u.startsWith(t) || t.startsWith(u))))).length })).filter((x) => x.score > 0).sort((a, b) => b.score - a.score).slice(0, 3);
  if (!scored.length) { console.log("لا قائمة تشغيل مطابقة"); process.exit(1); }
  for (const x of scored) console.log(`${x.score}  ${x.title}  https://www.youtube.com/playlist?list=${x.id}`);
  process.exit(0);
}

const T = JSON.parse(fs.readFileSync("data/publish_targets.json", "utf8")).youtube;
const out = { _at: new Date().toISOString() };
for (const [k, v] of Object.entries(T)) {
  const r = await fetch(`https://www.youtube.com/channel/${v.channelId}/playlists?view=1&sort=lad&hl=ar`, { headers: { "accept-language": "ar" } });
  const html = await r.text();
  const m = html.match(/var ytInitialData = (\{.*?\});<\/script>/s);
  if (!m) { console.error(`✘ ${k}: لم أقرأ صفحة القوائم`); continue; }
  const found = new Map();
  const walk = (o) => {
    if (!o || typeof o !== "object") return;
    const lv = o.lockupViewModel;
    if (lv?.contentId && lv.contentType === "LOCKUP_CONTENT_TYPE_PLAYLIST") {
      const title = lv.metadata?.lockupMetadataViewModel?.title?.content;
      const count = JSON.stringify(lv).match(/"text":"(\d+)\s*(?:فيديو|videos?|مقاطع)/)?.[1];
      if (title) found.set(lv.contentId, { id: lv.contentId, title, ...(count ? { count: +count } : {}) });
    }
    const gp = o.gridPlaylistRenderer;
    if (gp?.playlistId) found.set(gp.playlistId, { id: gp.playlistId, title: gp.title?.runs?.[0]?.text ?? gp.title?.simpleText });
    for (const x of Object.values(o)) walk(x);
  };
  walk(JSON.parse(m[1]));
  /* the next pages: the public browse endpoint with the page's continuation token */
  const key = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/)?.[1], ver = html.match(/"INNERTUBE_CLIENT_VERSION":"([^"]+)"/)?.[1];
  const nextTok = (o) => JSON.stringify(o).match(/"continuationCommand":\{"token":"([^"]+)"/)?.[1];
  let tok = nextTok(JSON.parse(m[1])), pages = 1;
  while (tok && key && pages < 30) {
    const rr = await fetch(`https://www.youtube.com/youtubei/v1/browse?key=${key}&prettyPrint=false`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ context: { client: { clientName: "WEB", clientVersion: ver, hl: "ar" } }, continuation: tok }) });
    const j = await rr.json(); walk(j); pages++;
    const t2 = nextTok(j); tok = t2 && t2 !== tok ? t2 : null;
  }
  out[k] = [...found.values()];
  console.log(`${k}: ${out[k].length} قائمة تشغيل (${pages} صفحة${tok ? "، بقي المزيد" : ""})`);
}
fs.writeFileSync(F, JSON.stringify(out, null, 1));
