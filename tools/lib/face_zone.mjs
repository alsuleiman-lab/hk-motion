// His face + hair + beard zone in composition pixels at any time, from the cached face track of the cut — no rendering.
// Same geometry as tools/face_fast.mjs (src/MontageSpec.tsx + PortraitKit.SheikhLayers; keep in sync), plus the portrait split (`psplits`: scale s about 50% 0%).
//   const zoneAt = faceZoner(spec);  zoneAt(t, "land" | "port") → [x0, y0, x1, y1]
import fs from "node:fs"; import path from "node:path"; import { spawnSync } from "node:child_process";
import { isLazy, faceTrackFile } from "./lazy_clip.mjs";   // a lazy stream clip has no cut video: his face is tracked on the ORIGINAL through its list

const PY ="C:/Users/mshms/AppData/Local/Programs/Python/Python310/python.exe";
const clamp = (v) => Math.max(0, Math.min(1, v));

export function faceZoner(spec) {
  let trackF;
  if (spec.id && isLazy(spec.id)) trackF = faceTrackFile(spec.id);
  else {
    const cut = path.join("public", spec.cut);
    const st = fs.statSync(cut);
    trackF = path.join(".tmp", "facetrack", `${path.basename(cut, ".mp4")}_${st.size}_${Math.round(st.mtimeMs)}.json`);
    if (!fs.existsSync(trackF)) {
      fs.mkdirSync(path.dirname(trackF), { recursive: true });
      const r = spawnSync(PY, ["tools/face_track.py", cut, trackF], { encoding: "utf8", windowsHide: true });
      if (r.status !== 0) throw new Error("face_track failed: " + (r.stderr || "").slice(-300));
    }
  }
  const track = JSON.parse(fs.readFileSync(trackF, "utf8"));
  const found = track.boxes.filter((b) => b[1] != null);
  const med = (k) => found.map((b) => b[k]).sort((a, b) => a - b)[found.length >> 1];
  const fallback = [null, med(1), med(2), med(3), med(4)];
  const splitAt = (t) => { const sp = (spec.splits ?? []).find((s) => t >= s.from && t < s.to); if (sp) return sp; const so = (spec.solos ?? []).find((s) => t >= s.from && t < s.to); return so ? { ...so, clip: { x: 0, w: so.sheikh.x }, solo: true } : undefined; };
  const boxAt = (t) => {
    const i = Math.round(t * track.fps), sp = splitAt(t);
    const oddSize = (b) => b[3] > 1.6 * fallback[3] || b[3] < 0.5 * fallback[3];
    const inClip = (b) => oddSize(b) || (sp ? (b[1] + b[3] / 2) >= sp.clip.x && (b[1] + b[3] / 2) < sp.clip.x + sp.clip.w : Math.abs((b[1] + b[3] / 2) - (fallback[1] + fallback[3] / 2)) > 350);
    const cw = (spec.cams ?? []).find((c) => t >= c.from && t < c.to), w0 = sp ? sp.from : cw ? cw.from : 0, w1 = sp ? sp.to : cw ? cw.to : 1e9;
    const inWin = (k) => k / track.fps >= w0 && k / track.fps < w1;
    for (let d = 0; d <= 2 * track.fps; d++) for (const k of [i - d, i + d]) if (track.boxes[k]?.[1] != null && !inClip(track.boxes[k]) && inWin(k)) {
      const nb = []; for (let q = k - 2; q <= k + 2; q++) if (track.boxes[q]?.[1] != null && !inClip(track.boxes[q]) && inWin(q)) nb.push(track.boxes[q]);
      const m = (j) => nb.map((b) => b[j]).sort((a, b) => a - b)[nb.length >> 1];
      return [track.boxes[k][0], m(1), m(2), m(3), m(4)];
    }
    return sp ? [null, sp.sheikh.x + sp.sheikh.w / 2 - fallback[3] / 2, fallback[2], fallback[3], fallback[4]] : fallback;
  };
  const zoomAt = (t, land = true) => { const zz = (spec.zooms ?? []).find((z) => t >= z.from - 0.01 && t <= z.to + 0.5); return zz ? 1 + (zz.amt ?? (land ? 0.104 : 0.08)) * Math.min(clamp((t - zz.from) / 0.35), clamp((zz.to + 0.5 - t) / 0.45)) : 1; };
  const CARD_BORDER = 14, CARD_H = 800;
  return (t, o) => {
    const land = o === "land", W = land ? 1920 : 1080, H = land ? 1080 : 1920;
    const [, x, y, w, h] = boxAt(t);
    /* (user rule 2026-11-18: «لا بأس أن يمسّ العنصرُ النصفَ الأسفل من اللحية من أسفل»; corrected 2026-11-20, gta6 reels) the zone is the face and the UPPER half
       of the beard only. It ran to 1.9 face-heights under the top of the face box — his whole beard and his chest (portrait: y ≈ 1378 while the beard ends ≈ 1200),
       so every lower-band item of a reel was refused. Measured on his stills: face box ends at 1.0h, beard at ≈1.6h → its upper half at ≈1.3h; 1.35h with a margin. */
    const z0 = [x - 0.08 * w, y - 0.38 * h], z1 = [x + 1.08 * w, y + 1.35 * h];
    const sp = splitAt(t);
    let map;
    if (land && sp?.solo) {
      const sc = sp.scale ?? 1, sw = sp.sheikh.w * sc, sh = H * sc, centered = (sp.center ?? []).some((c) => t >= c.from && t < c.to);
      const left = sp.align === "right" && !centered ? W - sw : (W - sw) / 2, top = Math.min(0, H - sh) / 2, zm = zoomAt(t), cx0 = sw / 2, cy0 = 0.28 * sh;
      map = ([px, py]) => [left + cx0 + ((px - sp.sheikh.x) * sc - cx0) * zm, top + cy0 + (py * sc - cy0) * zm];
    } else if (land && sp) {
      const k = CARD_H / 1080, cw = Math.round(sp.clip.w * k) + CARD_BORDER * 2, sw = Math.round(sp.sheikh.w * k) + CARD_BORDER * 2, gap = 110;
      const x0 = Math.round((W - (cw + sw + gap)) / 2), left = x0 + cw + gap + CARD_BORDER, top = 60 + CARD_BORDER;
      map = ([px, py]) => [left + (px - sp.sheikh.x) * k, top + py * k];
    } else if (land) {
      const zm = zoomAt(t), ox = 0.516 * W, oy = 0.305 * H;
      /* (2026-11-20) `shifts` slide his whole video right (half-screen ways): judged at its slid place, like a shifted isolation window */
      const bw = (spec.behind ?? []).find((b) => b.dx !== undefined && t >= b.from && t < b.to);
      const sh = (spec.shifts ?? []).find((s) => t >= s.from && t <= s.to + 0.4), shK = sh ? Math.min(Math.max(0, Math.min(1, (t - sh.from) / 0.4)), Math.max(0, Math.min(1, (sh.to + 0.4 - t) / 0.4))) : 0;
      const dx = bw ? bw.dx : sh ? sh.dx * shK : 0;
      map = ([px, py]) => [ox + (px - ox) * zm + dx, oy + (py - oy) * zm];
    } else {
      const cams = spec.cams?.length ? spec.cams : [{ from: 0, to: 9999, cx: 990 }];   /* an empty list too (a reel from an episode had cams: [] and grid_plan crashed, rehearsal 2026-11-21) */
      const cam = cams.find((c) => t >= c.from && t < c.to) ?? cams[cams.length - 1];
      const K = 1920 / 1080, zm = zoomAt(t, false), ps = (spec.psplits ?? []).find((q) => t >= q.from - 0.01 && t <= q.to + 0.4), s = ps ? ps.s ?? 0.66 : 1;
      map = ([px, py]) => { const X = (px - (cam.cx - 304)) * K, Y = py * K, a = 540 + (X - 540) * zm, b = 600 + (Y - 600) * zm; return [540 + (a - 540) * s, b * s]; };
    }
    const pad = (spec.shake ?? []).some((s) => t >= s.from && t <= s.to) ? 8 : 0;
    const [a, b] = [map(z0), map(z1)];
    return [Math.max(0, a[0] - pad), Math.max(0, a[1] - pad), Math.min(W, b[0] + pad), Math.min(H, b[1] + pad)];
  };
}
