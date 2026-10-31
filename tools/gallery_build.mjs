// Builds the LIVE elements gallery (user 2026-10-28: «الصفحة تكتب العناصر برمجياً لا صوراً؛ أي تعديل يكون في الكود»).
//   node tools/gallery_build.mjs   →  scratch/gallery_site/{index.html, gallery.js, <assets>}   then publish index.html with the Artifact tool
//                                     (the reference is the local page: node tools/gallery_serve.mjs → http://localhost:5601; a claude.ai copy is view-only and per account)
// The page runs the montage's own components (src/ElementsLab.tsx → LabScene, src/TransitionsLab.tsx → TransitionScene) in Remotion Player,
// so editing MG.tsx / EuKit.tsx / MontageSpec.tsx and rebuilding changes the page and the montage together. Names/places come from
// data/elements_lab.json and TRANSITIONS; the code line under each card is cut from those source files.
import { build } from "esbuild";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const OUT = "scratch/gallery_site", PUB = "public";
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const t0 = Date.now();

// ── 1) one script: React + Remotion Player + the montage kit
const res = await build({
  entryPoints: ["src/gallery/GalleryApp.tsx"], bundle: true, minify: true, format: "iife", platform: "browser", target: "es2020",
  outfile: path.join(OUT, "gallery.js"), jsx: "automatic", loader: { ".json": "json" }, metafile: true, logLevel: "warning",
  define: { "process.env.NODE_ENV": '"production"' }, banner: { js: "window.process=window.process||{env:{}};" },
});

// ── 2) the assets the bundled source names (same idea as tools/lib/cached_bundle.mjs neededAssets, limited to the bundled files)
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const MEDIA = /\.(mp4|webm|mov|png|jpe?g|svg|gif|webp|avif|ttf|otf|woff2?)$/i;
const srcFiles = Object.keys(res.metafile.inputs).filter((f) => f.startsWith("src/"));
const assets = new Set(), skipped = [];   // a template prefix (`fr/${…}`) that would pull a whole folder of frames/clips is skipped and named
let allPub = null;
for (const f of srcFiles) {
  const t = fs.readFileSync(f, "utf8");
  // every path-shaped word ending in a media extension, and every `prefix/${…}` template (quotes are not paired: `src: ""` broke that)
  const words = [...t.matchAll(/[A-Za-z0-9_\-./]+\.(?:mp4|webm|mov|png|jpe?g|svg|gif|webp|avif|ttf|otf|woff2?)\b/gi)].map((m) => [m[0], ""]);
  const tpls = [...t.matchAll(/`([^`$\n]*)\$\{/g)].map((m) => [m[1], "${"]);
  for (const m of [...words, ...tpls].map(([a, b]) => [null, a, b])) {
    const s = m[1].replace(/^\/+/, "");
    if (m[2] === "${") { if (s.includes("/") && s.length > 2) { allPub ??= walk(PUB).map((p) => path.relative(PUB, p).replace(/\\/g, "/")); const hit = allPub.filter((p) => p.startsWith(s) && MEDIA.test(p)); const mb = hit.reduce((n, p) => n + fs.statSync(path.join(PUB, p)).size, 0) / 1048576;
      if (hit.length <= 300 && mb <= 8) hit.forEach((p) => assets.add(p)); else skipped.push(`${s}… (${hit.length} files, ${mb.toFixed(0)} MB)`); } continue; }
    if (!MEDIA.test(s)) continue;
    if (fs.existsSync(path.join(PUB, s))) assets.add(s);
    else if (fs.existsSync(path.join(PUB, "fonts", s))) assets.add("fonts/" + s);   // localFonts.ts names bare font files
  }
}
let bytes = 0;
for (const a of assets) {
  const from = path.join(PUB, a), to = path.join(OUT, a);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  if (/\.(mp4|webm|mov)$/i.test(a)) {   // a scene lasts 3 s: a 4-second 960-wide preview copy keeps the page light
    spawnSync("ffmpeg", ["-v", "error", "-y", "-hwaccel", "cuda", "-t", "4", "-i", from, "-an", "-vf", "scale=960:-2", "-c:v", "h264_nvenc", "-preset", "p5", "-cq", "30", "-movflags", "+faststart", to.replace(/\.(webm|mov)$/i, ".mp4")], { windowsHide: true });
  } else fs.copyFileSync(from, to);
  bytes += fs.statSync(to).size;
}

// ── 3) the list: elements from data/elements_lab.json, transitions from TRANSITIONS; the code line cut from the source
const cut = (file, id) => {   // the "  Id: { … }," entry of a Record literal, without the wrapper
  const L = fs.readFileSync(file, "utf8").split("\n");
  const i = L.findIndex((l) => l.startsWith(`  ${id}: {`));
  if (i < 0) return "";
  let j = i + 1; while (j < L.length && !/^  [A-Za-z0-9]+: \{/.test(L[j]) && !/^};/.test(L[j])) j++;
  const txt = L.slice(i, j).join("\n").replace(new RegExp(`^  ${id}: \\{\\s*`), "").replace(/\s*\},?\s*$/, "");
  const node = txt.match(/node:\s*([\s\S]*)$/);
  return (node ? node[1] : txt).trim();
};
const TL = fs.readFileSync("src/TransitionsLab.tsx", "utf8").replace(/\r\n/g, "\n");
const transitions = [...TL.matchAll(/^  (\w+): \{ ar: "([^"]+)", kit: "([^"]+)", where: "([^"]+)",\n    node: ([\s\S]*?) \},\n/gm)]
  .map((m) => ({ id: m[1], kind: "transition", ar: m[2], kit: m[3], group: m[3] === "Transitions" ? "انتقالات جديدة للاختيار" : "الانتقالات الحالية", where: m[4], note: "", code: m[5].trim(), still: { PaperCover: 20, PushIn: 40, HandheldShake: 40, TrSection: 40 }[m[1]] ?? 45 }));
const tIds = new Set(transitions.map((t) => t.id));
const lab = JSON.parse(fs.readFileSync("data/elements_lab.json", "utf8"));
const elements = lab.filter((m) => !tIds.has(m.id)).map((m) => ({
  id: m.id, kind: "element", ar: m.ar, kit: m.kit, group: m.group, where: m.where, note: m.note ?? "", still: m.still ?? 72,
  code: /^NameCard\d+$/.test(m.id) ? `<${m.id} at={0.2} x={960} y={880} />   // src/NameCards.tsx` : cut("src/ElementsLab.tsx", m.id),
}));
for (const t of transitions) { const m = lab.find((x) => x.id === t.id); if (m?.note) t.note = m.note; }
// sections (user 2026-10-30): 1 backgrounds · 2 transitions (scene↔scene) · 3 motion styles (an element whose character is its movement, text or not) · 4 text/number elements · 5 picture/source elements · 6 the grid
const IN = (s) => new Set(s.split(/\s+/));
const BG = IN("BgFullImage BgKh BgPaperDark BgMashrabiya PaperGrain");
const MOVES = IN("PushIn HandheldShake FlashCut SakugaMove SpotlightCard TimelineTravel ConvergeMerge PanelToCanvas DashArc CollageAssemble DimLayer PhoneChips");
const IMAGES = IN("PaperScene BrowserFrame VideoFrame PostCard CommentCard BookPage NewsClip TornPhoto PinnedPhoto MapRoute PaperMap PhotoFrame PopCard TailVoice DebateDossier DebateBlocks");
const SECTION_OF = (it) => (BG.has(it.id) ? "bg" : it.kind === "transition" || ["Curtain", "PaperCover"].includes(it.id) ? "transition" : MOVES.has(it.id) ? "move" : IMAGES.has(it.id) ? "image" : "text");
// where each kind of the grid (data/layout_grids.json "kinds") is drawn by which gallery elements (approximate: one kind covers several)
const KIND_ELEMENTS = {
  key: IN("Word BlurRise GlowCaption TornNote WordScraps TypeBox"),
  photo: IN("PinnedPhoto PopCard TornPhoto NewsClip FlashCut PhoneChips PaperScene RewriteWindow BrowserFrame PostCard CommentCard BookPage PhotoFrame VideoFrame"),
  list: IN("StatRow"), solo: IN("NameCard1 NameCard3 Subscribe"),
  exclusive: IN("VerseWords ReelVerseFull MapRoute PaperMap TimelineTravel PanelToCanvas"),
  ignore: IN("Sources CitationTag PaperCover"),
};
const GRIDS = JSON.parse(fs.readFileSync("data/layout_grids.json", "utf8"));
const MODE_AR = { normal: "عادي", source: "مصدر معروض", solo: "أنا وحدي", half: "نصف الشاشة" }, OR_AR = { land: "عرضي", port: "طولي" };
const placesOf = (id) => {
  const ks = Object.keys(KIND_ELEMENTS).filter((k) => KIND_ELEMENTS[k].has(id));
  if (!ks.length) return "";
  if (ks.includes("exclusive")) return "تحجز المحتوى كله في وقتها (لا عنصر معها).";
  if (ks.includes("ignore")) return "على حافة الإطار، لا تحجز خانة.";
  const out = [];
  for (const o of ["land", "port"]) for (const m of Object.keys(MODE_AR)) {
    const slots = Object.entries(GRIDS[o]?.[m]?.slots ?? {}).filter(([, s]) => s.kinds.some((k) => ks.includes(k))).map(([n]) => n);
    if (slots.length) out.push(`${OR_AR[o]}/${MODE_AR[m]}: ${slots.join("، ")}`);
  }
  return out.join(" · ");
};
const items = [...elements, ...transitions].map((it) => ({ ...it, section: SECTION_OF(it), places: placesOf(it.id) }));

// the grid page (tools/grid_page.mjs) embedded as the 6th tab: css / body / script split from tools/grid_page.html, data from its build
// the grid tab and the face zone drawn in each card's grid mode come from the gallery's real frame (his silent recording, src/galleryCut.ts)
fs.mkdirSync("scratch", { recursive: true });
fs.writeFileSync("scratch/gallery_spec.json", JSON.stringify({ cut: "gallery_silent_clip.mp4", cams: [], zooms: [], behind: [], shake: [], splits: [], solos: [] }));
spawnSync("node", ["tools/grid_page.mjs", "scratch/gallery_spec.json", "--at", "0"], { stdio: "inherit", windowsHide: true });
const gdata = JSON.parse(fs.readFileSync("scratch/grid_site/data.json", "utf8"));
gdata.clip = "grid_clip.mp4"; fs.copyFileSync("scratch/grid_site/clip.mp4", path.join(OUT, "grid_clip.mp4"));
gdata.kindEls = Object.fromEntries(Object.entries(KIND_ELEMENTS).map(([k, s]) => [k, [...s]]));
gdata.elNames = Object.fromEntries(items.map((i) => [i.id, i.ar]));
const GH = fs.readFileSync("tools/grid_page.html", "utf8").replace(/\r\n/g, "\n");
const gcss = GH.match(/<style>([\s\S]*?)<\/style>/)[1]
  .replace(/:root:not\(\[data-theme="light"\]\)/g, ":host").replace(/:root\[data-theme="dark"\]/g, ':host-context([data-theme="dark"])').replace(/:root \{/g, ":host {")
  .replace(/\nbody \{[^}]*\}/, "\n.gbody { background: var(--bg); color: var(--ink); font-family: var(--f-body); direction: rtl; padding: 14px; border-radius: 12px; }")
  .replace(/\nh1 \{[^}]*\}/, "").replace(/\n\.lede \{[^}]*\}/, "");
const gbody = GH.slice(GH.indexOf("</style>") + 8, GH.indexOf("<script>")).replace(/<header>[\s\S]*?<\/header>/, '<p class="small" style="margin:0 0 6px">لكل وضع شاشة خانات ثابتة. الأحمر منطقة وجهك ولحيتك من تتبّع وجهك في التسجيل. في كل خانة أسماء العناصر التي تُوضع فيها؛ انقر اسماً لتنتقل إلى بطاقته. عدّل الخانة بالسحب ثم «احفظ».</p>');
const gscript = GH.slice(GH.indexOf("<script>") + 8, GH.indexOf("</script>")).replace("const DATA = /*GRID_DATA*/null;", "");
const grid = { css: gcss, body: gbody, script: gscript, data: gdata };

// ── 4) the page: the old gallery's look + tabs, live stages and code blocks
const oldCss = fs.readFileSync("tools/elements_page.mjs", "utf8").match(/<style>([\s\S]*?)<\/style>/)[1];
const css = oldCss + `
.tabs{display:flex;gap:8px;flex-wrap:wrap;margin:6px 0 4px}.tabs button{font:inherit;font-family:var(--f-title);font-size:18px;border:1px solid var(--line);background:var(--panel);color:var(--ink);padding:8px 18px;border-radius:12px;cursor:pointer}
.tabs button[aria-selected="true"]{background:var(--accent);color:var(--on-accent);border-color:var(--accent)}
.stage{background:var(--stage);width:100%;min-height:120px;direction:ltr}
.code-btn{justify-self:start;font:inherit;font-size:13px;border:1px solid var(--line);background:transparent;color:var(--accent);padding:3px 10px;border-radius:8px;cursor:pointer}
pre.code{margin:0;max-height:220px;overflow:auto;background:var(--bg);border:1px solid var(--line);border-radius:8px;padding:10px 12px;font-family:ui-monospace,Consolas,monospace;font-size:12.5px;line-height:1.5;white-space:pre-wrap;word-break:break-word;color:var(--ink)}
#conn{margin:-10px 0 18px;font-size:14px;font-weight:700;padding:6px 12px;border-radius:8px;background:var(--panel);border:1px solid var(--line);color:var(--drop)}#conn[data-ok="1"]{color:var(--keep)}
textarea.when{width:100%;box-sizing:border-box;min-height:64px;font:inherit;font-size:14px;line-height:1.55;padding:8px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--ink);resize:vertical;margin-top:4px}.whenlbl{display:block;font-size:13px;font-weight:700;color:var(--mute)}.card.flash{box-shadow:0 0 0 4px var(--accent)}
footer{margin-top:28px;color:var(--mute);font-size:13px}
.gridbar{display:flex;gap:6px;flex-wrap:wrap;align-items:center;padding:6px 14px 0}.gridbar .code-btn[aria-pressed="true"]{background:var(--accent);color:var(--on-accent)}.gridlayer{position:absolute;inset:0;cursor:grab;touch-action:none;outline:3px solid var(--accent)}.gridlayer:active{cursor:grabbing}.gridlayer .slot{position:absolute;box-sizing:border-box;border:2px dashed rgba(255,255,255,.85);background:rgba(80,160,255,.16);color:#fff;font-size:13px;display:flex;flex-direction:column;padding:4px 8px;pointer-events:none;direction:rtl}.gridlayer .slot.hot{background:rgba(255,200,60,.35);border-color:#ffc83c}.gridlayer .slot i{font-style:normal;opacity:.8;font-size:11px}.gridlayer b{background:none;color:#fff;padding:0;font-size:13px}.gridlayer .face{position:absolute;box-sizing:border-box;border:2px solid #ff4d4d;background:rgba(255,60,60,.14);color:#fff;font-size:13px;padding:3px 6px;pointer-events:none;direction:rtl}.palette-top{position:sticky;top:env(safe-area-inset-top,0px);z-index:20;background:var(--bg);margin:0 0 10px;padding-block:10px;border-bottom:1px solid var(--line);font-weight:700}`;
const data = JSON.stringify({ items, grid, built: new Date().toISOString().slice(0, 16).replace("T", " ") }).replace(/</g, "\\u003c");
const html = `<title>معرض عناصر المونتاج</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Almarai:wght@400;700;800&family=Noto+Kufi+Arabic:wght@600;800&display=swap">
<style>${css}</style>
<div id="root"></div>
<script id="gallery-data" type="application/json">${data}</script>
<script>window.remotion_staticBase = "."; window.remotion_inputProps = "{}";   /* the kit reads getInputProps() at load (face check / fast render modes): none here */</script>
<script src="gallery.js"></script>
`;
fs.writeFileSync(path.join(OUT, "index.html"), html);
const js = fs.statSync(path.join(OUT, "gallery.js")).size;
console.log(`gallery: ${["bg", "transition", "move", "text", "image"].map((s) => s + " " + items.filter((i) => i.section === s).length).join(" · ")} · gallery.js ${(js / 1048576).toFixed(2)} MB · ${assets.size} assets ${(bytes / 1048576).toFixed(1)} MB · ${((Date.now() - t0) / 1000).toFixed(1)} s`);
if (skipped.length) console.log(`skipped prefixes: ${skipped.join(" · ")}`);
console.log(`files: ${["gallery.js", ...[...assets].map((a) => a.replace(/\.(webm|mov)$/i, ".mp4"))].join(" ")}`);
