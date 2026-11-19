// Fast face check for data-spec montages (user 2026-10-27: «فحص الوجه يأخذ وقتاً طويلاً، بدي آلية سريعة»). Replaces face_check.mjs for compositions built by MontageFromSpec.
//   node tools/face_fast.mjs <CompositionId> --spec data/specs/<p>.json [--step 15] [--scale 0.25] [--out .tmp/<p>/ff] [--thr 0.008]
// 1) his face is TRACKED once from the cut video (tools/face_track.py: keyframes on NVDEC, one OpenCV process), cached per cut file
// 2) the face+hair+beard zone is mapped into composition pixels with the same geometry MontageSpec uses (landscape push-in about
//    LANDSCAPE.faceOrigin, split polaroid cards; portrait 608-px camera slice ×1920/1080 + push-in about 540,600)
// 3) the composition is rendered ONCE with inputProps {gfxOnly:true}: only <Gfx> overlays on a transparent page, no video decoded
// 4) overlap = share of the zone covered by drawn pixels (alpha); > thr (0.8 %) = FAIL. No second render, so no false alarm from a push-in
//    or a video frame that differs between two renders. Skipped by design: the cover (first 35 frames), full-screen sources, the closing audio card.
import { cachedServeUrl, privateTemp } from "./lib/cached_bundle.mjs";
import { writePass } from "./lib/pass_stamp.mjs";
privateTemp("facefast");
const { openBrowser, renderFrames, selectComposition } = await import("@remotion/renderer");
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const argv = process.argv.slice(2);
const id = argv[0];
const opt = (n, d) => (argv.includes("--" + n) ? argv[argv.indexOf("--" + n) + 1] : d);
const specF = opt("spec", "");
if (!id || !specF) { console.error("usage: node tools/face_fast.mjs <CompositionId> --spec data/specs/<p>.json [--step 15]"); process.exit(2); }
const spec = JSON.parse(fs.readFileSync(specF, "utf8"));
(await import("./cut_lazy.mjs")).ensureCut(spec.id);   // the cut video matches the cut list (tools/cut_lazy.mjs)
const step = Number(opt("step", 15)), SC = Number(opt("scale", 0.25)), THR = Number(opt("thr", 0.008));
const outDir = opt("out", path.join(".tmp", spec.id ?? id, "ff"));
const PY = "C:/Users/mshms/AppData/Local/Programs/Python/Python310/python.exe";
const port = Number(opt("port", process.env.FACE_CHECK_PORT ?? "3452"));
const t0 = Date.now(), lap = {};
fs.rmSync(outDir, { recursive: true, force: true }); fs.mkdirSync(outDir, { recursive: true });

// ---- 1) face track of the cut (cached by file size + mtime)
const cut = path.join("public", spec.cut);
const st = fs.statSync(cut);
const trackF = path.join((await import("./lib/projdir.mjs")).projTmp(path.basename(cut, ".mp4"), "facetrack"), `${path.basename(cut, ".mp4")}_${st.size}_${Math.round(st.mtimeMs)}.json`);
if (!fs.existsSync(trackF)) {
  fs.mkdirSync(path.dirname(trackF), { recursive: true });
  const r = spawnSync(PY, ["tools/face_track.py", cut, trackF], { encoding: "utf8", windowsHide: true });
  if (r.status !== 0) { console.error("face_track failed:", (r.stderr || "").slice(-400)); process.exit(2); }
}
lap.track = Date.now() - t0;
const track = JSON.parse(fs.readFileSync(trackF, "utf8"));
const found = track.boxes.filter((b) => b[1] != null);
const med = (k) => found.map((b) => b[k]).sort((a, b) => a - b)[found.length >> 1];
const fallback = [null, med(1), med(2), med(3), med(4)];
// `solos` (MontageSpec SoloLand, 2026-10-29): a baked-split recording shown as HIS slice only → the left half counts as «clip» for the detections, his slice is mapped with the SoloLand geometry
const splitAt = (t) => { const sp = (spec.splits ?? []).find((s) => t >= s.from && t < s.to); if (sp) return sp; const so = (spec.solos ?? []).find((s) => t >= s.from && t < s.to); return so ? { ...so, clip: { x: 0, w: so.sheikh.x }, solo: true } : undefined; };
const boxAt = (t) => { // nearest detection within 2 s (camera fixed), else the median position; faces inside a split's clip half are not his
  const i = Math.round(t * track.fps);
  const sp = splitAt(t);
  const oddSize = (b) => b[3] > 1.6 * fallback[3] || b[3] < 0.5 * fallback[3];   // a detection far larger/smaller than his usual face (a false positive on the wall/books) is not his
  const inClip = (b) => oddSize(b) || (sp ? (b[1] + b[3] / 2) >= sp.clip.x && (b[1] + b[3] / 2) < sp.clip.x + sp.clip.w : Math.abs((b[1] + b[3] / 2) - (fallback[1] + fallback[3] / 2)) > 350);   // outside a split window his face stays near its usual place: a far box is the guest's clip starting a moment early
  const cw = (spec.cams ?? []).find((c) => t >= c.from && t < c.to), w0 = sp ? sp.from : cw ? cw.from : 0, w1 = sp ? sp.to : cw ? cw.to : 1e9;
  const inWin = (k) => k / track.fps >= w0 && k / track.fps < w1;   // his face moves to the right half inside a split window: take detections of the same stretch only
  for (let d = 0; d <= 2 * track.fps; d++) for (const k of [i - d, i + d]) if (track.boxes[k]?.[1] != null && !inClip(track.boxes[k]) && inWin(k)) {
    // median of the neighbouring detections (±2 samples) so one false positive does not throw the zone across the page
    const nb = []; for (let q = k - 2; q <= k + 2; q++) if (track.boxes[q]?.[1] != null && !inClip(track.boxes[q]) && inWin(q)) nb.push(track.boxes[q]);
    const m = (j) => nb.map((b) => b[j]).sort((a, b) => a - b)[nb.length >> 1];
    return [track.boxes[k][0], m(1), m(2), m(3), m(4)];
  }
  return sp ? [null, sp.sheikh.x + sp.sheikh.w / 2 - fallback[3] / 2, fallback[2], fallback[3], fallback[4]] : fallback;
};

// ---- 2) face zone in composition pixels (mirrors src/MontageSpec.tsx + PortraitKit.SheikhLayers; keep in sync)
const clamp = (v) => Math.max(0, Math.min(1, v));
const zoomAt = (t) => { const zz = (spec.zooms ?? []).find((z) => t >= z.from - 0.01 && t <= z.to + 0.5); return zz ? 1 + (zz.amt ?? 0.08) * Math.min(clamp((t - zz.from) / 0.35), clamp((zz.to + 0.5 - t) / 0.45)) : 1; };
const CARD_BORDER = 14, CARD_H = 800;
const zoneAt = (t, land, W, H) => {
  const [, x, y, w, h] = boxAt(t);
  let z0 = [x - 0.08 * w, y - 0.38 * h], z1 = [x + 1.08 * w, y + 1.9 * h];   // face + hair + beard (as face_check.py)
  const sp = splitAt(t);
  let map;
  if (land && sp?.solo) {   // SoloLand: his slice scaled, right-aligned (centred inside `center` windows), container push-in about 50% 28%
    const sc = sp.scale ?? 1, w = sp.sheikh.w * sc, h = H * sc, centered = (sp.center ?? []).some((c) => t >= c.from && t < c.to);
    const left = sp.align === "right" && !centered ? W - w : (W - w) / 2, top = Math.min(0, H - h) / 2, zm = zoomAt(t), cx0 = w / 2, cy0 = 0.28 * h;
    map = ([px, py]) => [left + cx0 + ((px - sp.sheikh.x) * sc - cx0) * zm, top + cy0 + (py * sc - cy0) * zm];
  } else if (land && sp) {   // reply layouts (DebateLayouts): his column [sheikh.x, +w) in the right-hand polaroid at height CARD_H
    const k = CARD_H / 1080, cw = Math.round(sp.clip.w * k) + CARD_BORDER * 2, sw = Math.round(sp.sheikh.w * k) + CARD_BORDER * 2, gap = 110;
    const x0 = Math.round((W - (cw + sw + gap)) / 2), left = x0 + cw + gap + CARD_BORDER, top = 60 + CARD_BORDER;
    map = ([px, py]) => [left + (px - sp.sheikh.x) * k, top + py * k];
  } else if (land) {  // whole frame, push-in about faceOrigin 51.6% 30.5%
    const z = zoomAt(t), ox = 0.516 * W, oy = 0.305 * H;
    const bw = (spec.behind ?? []).find((b) => b.dx !== undefined && t >= b.from && t < b.to), dx = bw ? bw.dx : 0;   // isolated and shifted right inside a `behind` window
    map = ([px, py]) => [ox + (px * W / 1920 - ox) * z + dx, oy + (py * H / 1080 - oy) * z];
  } else {            // portrait: 608-px slice around cam.cx scaled to 1920 high, push-in about 540,600
    const cams = spec.cams ?? [{ from: 0, to: 9999, cx: 990 }];
    const cam = cams.find((c) => t >= c.from && t < c.to) ?? cams[cams.length - 1];
    const K = 1920 / 1080, z = zoomAt(t);
    const pw = (spec.psplits ?? []).find((q) => t >= q.from - 0.01 && t <= q.to + 0.4), pk = pw ? Math.min(clamp((t - pw.from) / 0.4), clamp((pw.to + 0.4 - t) / 0.4)) : 0, ps = 1 + ((pw?.s ?? 0.66) - 1) * pk;   // portrait split screen: his video shrinks to the top (scale about 50% 0%)
    map = ([px, py]) => { const X = (px - (cam.cx - 304)) * K, Y = py * K, x1 = 540 + (X - 540) * z, y1 = 600 + (Y - 600) * z; return [540 + (x1 - 540) * ps, y1 * ps]; };
  }
  const pad = (spec.shake ?? []).some((s) => t >= s.from && t <= s.to) ? 8 : 0;   // HandheldShake amplitude
  const [a, b] = [map(z0), map(z1)];
  return [Math.max(0, a[0] - pad), Math.max(0, a[1] - pad), Math.min(W, b[0] + pad), Math.min(H, b[1] + pad)];
};

// ---- 3) one gfx-only render (transparent, no video decoded)
const { serveUrl } = await cachedServeUrl(id, { tag: "facefast" });
const comp = await selectComposition({ serveUrl, id, inputProps: { gfxOnly: true }, port });
const land = comp.width > comp.height, o = land ? "land" : "port";
const fps = comp.fps;
const skip = (fr) => {
  const t = fr / fps, cover = spec.items.find((i) => i.t === "cover" && (!i.only || i.only === o));
  if (cover && fr < (["paper", "pro"].includes(cover.style ?? "paper") ? 35 : cover.frames ?? 3)) return "cover";
  if (spec.items.some((i) => i.t === "full" && (!i.only || i.only === o) && t >= i.from && t <= i.to)) return "full-screen source";
  if (!land && spec.items.some((i) => i.t === "verse" && (!i.only || i.only === o) && t >= i.times[0] - 1.2 && t <= (i.until ?? i.times[i.times.length - 1] + 1.2))) return "verse (his picture is hidden by design, full-screen opaque still)";
  if (spec.tail && t >= spec.tail.from) return "closing audio card";
  return null;
};
const frames = [];
const RANGES = (opt("range", "") || "").split(",").filter(Boolean).map((r) => r.split("-").map(Number));   // --range a-b,c-d (seconds): check only the edited spans (edit-as-one-block rule)
for (let fr = 3; fr < comp.durationInFrames; fr += step) if (!skip(fr) && (!RANGES.length || RANGES.some(([a, b]) => fr / fps >= a && fr / fps <= b))) frames.push(fr);
const browser = await openBrowser("chrome", { chromiumOptions: { gl: "angle" } });
await renderFrames({
  composition: comp, serveUrl, inputProps: { gfxOnly: true }, imageFormat: "png", scale: SC, frameRange: [3, comp.durationInFrames - 1], everyNthFrame: step, outputDir: null,
  onFrameBuffer: (buf, fr) => { if (!skip(fr)) fs.writeFileSync(path.join(outDir, `f${fr}.png`), buf); }, onStart: () => {},
  concurrency: Number(process.env.FC_CONC || 6), port, puppeteerInstance: browser, chromiumOptions: { gl: "angle" }, timeoutInMilliseconds: 60000,
});
await browser.close({ silent: true }).catch(() => {});
lap.render = Date.now() - t0 - lap.track;

// ---- 4) overlap per still, one Python process
const jobs = frames.map((fr) => ({ fr, png: path.join(outDir, `f${fr}.png`), zone: zoneAt(fr / fps, land, comp.width, comp.height).map((v) => Math.round(v * SC)) }));
const jf = path.join(outDir, "jobs.json");
fs.writeFileSync(jf, JSON.stringify(jobs));
const r = spawnSync(PY, ["tools/face_alpha.py", jf], { encoding: "utf8", windowsHide: true, maxBuffer: 1 << 26 });
const ov = JSON.parse(r.stdout.trim().split("\n").pop() || "[]");
const active = (t) => spec.items.filter((i) => { const a = i.at ?? i.from ?? i.oldAt, b = i.until ?? i.to ?? (a != null ? a + (i.dur ?? 3) : null); return a != null && t >= a - 0.2 && t <= b + 0.5; }).map((i) => i.t + (i.text ? `«${String(i.text).slice(0, 18)}»` : i.name ? `«${i.name}»` : "")).slice(0, 4).join(", ");
let fails = 0, missing = 0;
jobs.forEach((j, k) => {
  if (ov[k] == null) { missing++; return; }
  if (ov[k] > THR) { fails++; console.log(`frame ${j.fr} (${(j.fr / fps).toFixed(1)}s): FAIL overlap ${(ov[k] * 100).toFixed(1)}% → ${j.png}  [${active(j.fr / fps)}]`); }
});
const secs = ((Date.now() - t0) / 1000).toFixed(1);
console.log(`\n${fails ? `FAILED: ${fails} frame(s) have graphics over the face/hair/beard — move them and re-run.` : missing ? `FAILED: ${missing} still(s) not rendered — re-run.` : `PASSED (${jobs.length} frames every ${step} frames, ${((jobs.length * step) / fps / 60).toFixed(1)} min checked)`} in ${secs} s (track ${(lap.track / 1000).toFixed(1)} s${fs.existsSync(trackF) ? "" : ""}, render ${(lap.render / 1000).toFixed(1)} s)`);
if (!fails && !missing) { fs.rmSync(outDir, { recursive: true, force: true }); writePass("face_fast", id, specF); }
process.exit(fails || missing ? 1 : 0);
