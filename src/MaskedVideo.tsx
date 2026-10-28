import React, { useEffect, useLayoutEffect, useRef } from "react";
import { AbsoluteFill, continueRender, delayRender, getRemotionEnvironment, staticFile, useCurrentFrame, useVideoConfig, Video } from "remotion";

/**
 * MaskedVideo — the isolated Sheikh WITHOUT a transparent video (2026-10-22): the ORIGINAL video + a saved gray MATTE (tools/matte_cache.mjs, white = person) are combined on a WebGL
 * canvas (rgb from the video, alpha from the matte). Put the backgrounds / graphics UNDER it in the layer order: original video → backgrounds & elements → <MaskedVideo/>.
 * Changing the background never needs the matte to be recomputed. Both videos are muted <video> elements kept in sync by Remotion (seeked per frame while rendering).
 *   video / matte : paths under public/ ; videoStartFrom / matteStartFrom : first frame of each file to show at frame 0 of the enclosing Sequence (matte_cache prints offsetFrames).
 */
const VS = `attribute vec2 p; varying vec2 uv; void main(){ uv = vec2(p.x * .5 + .5, 1.0 - (p.y * .5 + .5)); gl_Position = vec4(p, 0, 1); }`;
const FS = `precision mediump float; varying vec2 uv; uniform sampler2D v; uniform sampler2D m; void main(){ vec4 c = texture2D(v, uv); float a = texture2D(m, uv).r; gl_FragColor = vec4(c.rgb * a, a); }`;
type Src = CanvasImageSource | HTMLVideoElement;

export const MaskedVideo: React.FC<{ video: string; matte: string; videoStartFrom?: number; matteStartFrom?: number; width?: number; height?: number; style?: React.CSSProperties }> = ({ video, matte, videoStartFrom = 0, matteStartFrom = 0, width = 1920, height = 1080, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rendering = getRemotionEnvironment().isRendering;
  const canvas = useRef<HTMLCanvasElement>(null);
  const gl = useRef<WebGLRenderingContext | null>(null);
  const tex = useRef<{ v: WebGLTexture; m: WebGLTexture } | null>(null);
  const got = useRef<{ v: Src | null; m: Src | null; fv: number; fm: number }>({ v: null, m: null, fv: -1, fm: -1 });
  const frameRef = useRef(frame); frameRef.current = frame;
  const handle = useRef<number | null>(null);

  // one delayRender per frame while rendering: released when BOTH the video frame and the matte frame of THIS frame have been drawn
  useLayoutEffect(() => {
    if (!rendering) return;
    handle.current = delayRender(`MaskedVideo frame ${frame}`, { timeoutInMilliseconds: 60000 });
    return () => { if (handle.current !== null) { continueRender(handle.current); handle.current = null; } };
  }, [frame, rendering]);

  useEffect(() => {
    const c = canvas.current; if (!c) return;
    const g = c.getContext("webgl", { premultipliedAlpha: true, alpha: true, preserveDrawingBuffer: true }); if (!g) return;
    const sh = (t: number, s: string) => { const o = g.createShader(t)!; g.shaderSource(o, s); g.compileShader(o); return o; };
    const pr = g.createProgram()!; g.attachShader(pr, sh(g.VERTEX_SHADER, VS)); g.attachShader(pr, sh(g.FRAGMENT_SHADER, FS)); g.linkProgram(pr); g.useProgram(pr);
    const b = g.createBuffer(); g.bindBuffer(g.ARRAY_BUFFER, b); g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), g.STATIC_DRAW);
    const loc = g.getAttribLocation(pr, "p"); g.enableVertexAttribArray(loc); g.vertexAttribPointer(loc, 2, g.FLOAT, false, 0, 0);
    const mk = (unit: number, name: string) => { const t = g.createTexture()!; g.activeTexture(g.TEXTURE0 + unit); g.bindTexture(g.TEXTURE_2D, t); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE); g.uniform1i(g.getUniformLocation(pr, name), unit); return t; };
    tex.current = { v: mk(0, "v"), m: mk(1, "m") }; gl.current = g;
  }, []);

  const draw = () => {
    const g = gl.current, t = tex.current, s = got.current; if (!g || !t || !s.v || !s.m) return false;
    g.viewport(0, 0, width, height); g.clearColor(0, 0, 0, 0); g.clear(g.COLOR_BUFFER_BIT);
    g.activeTexture(g.TEXTURE0); g.bindTexture(g.TEXTURE_2D, t.v); g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, g.RGBA, g.UNSIGNED_BYTE, s.v as TexImageSource);
    g.activeTexture(g.TEXTURE1); g.bindTexture(g.TEXTURE_2D, t.m); g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, g.RGBA, g.UNSIGNED_BYTE, s.m as TexImageSource);
    g.drawArrays(g.TRIANGLE_STRIP, 0, 4);
    return true;
  };
  const tryDraw = () => {
    const s = got.current, f = frameRef.current;
    if (rendering && !(s.fv === f && s.fm === f)) return;       // render: wait until both sources show THIS frame
    if (draw() && handle.current !== null) { continueRender(handle.current); handle.current = null; }
  };
  // 2026-10-23 fix: Remotion calls onVideoFrame ONCE right after mount (no metadata, the element has not decoded anything yet) and then from requestVideoFrameCallback with metadata.mediaTime = the
  // time of the frame really presented. The mount call made a stale picture count as "this frame" (3 of 20 stills were wrong). While rendering we now accept a frame only if its mediaTime is the
  // time this frame needs (± half a frame); in the Studio (playback) every callback is accepted.
  const onTime = (meta: { mediaTime?: number } | undefined, startFrom: number) => !rendering || (meta?.mediaTime !== undefined && Math.abs(meta.mediaTime - (startFrom + frameRef.current) / fps) <= 0.55 / fps);
  // 2026-10-25 (user: «أين أنا» — the isolated Sheikh was missing in the Studio after jumping to a frame): when paused/seeking in the Studio the frame callback may not fire, so the canvas stayed
  // empty. Studio only: after every frame change, draw straight from the two <video> elements once they have data (rendering keeps the exact per-frame path above).
  const vEl = useRef<HTMLVideoElement>(null), mEl = useRef<HTMLVideoElement>(null);
  // 2026-10-25 (user: «صحح وجودي» — a BLACK silhouette in the Studio): an element whose decoder the browser has suspended hands WebGL a black picture. Never draw such a frame.
  const probe = useRef<HTMLCanvasElement | null>(null);
  const isBlack = (v: HTMLVideoElement) => {
    try {
      const c = probe.current ?? (probe.current = document.createElement("canvas")); c.width = 16; c.height = 9;
      const x = c.getContext("2d", { willReadFrequently: true }); if (!x) return false;
      x.drawImage(v, 0, 0, 16, 9); const d = x.getImageData(0, 0, 16, 9).data;
      let sum = 0; for (let i = 0; i < d.length; i += 4) sum += d[i] + d[i + 1] + d[i + 2];
      return sum < 16 * 9 * 3 * 8;
    } catch { return false; }
  };
  useEffect(() => {
    if (rendering) return;
    let n = 0;
    const id = setInterval(() => {
      const v = vEl.current, m = mEl.current;
      if (v && m && v.readyState >= 2 && m.readyState >= 2 && !isBlack(v)) { got.current.v = v; got.current.m = m; draw(); }
      if (++n >= 8) clearInterval(id);
    }, 60);
    return () => clearInterval(id);
  }, [frame, rendering]);
  // not 2×2/opacity 0: browsers suspend decoding of «invisible» videos (black frames, no frame callbacks) — keep them a small, barely visible thumbnail under the canvas
  const hidden: React.CSSProperties = { position: "absolute", left: 0, top: 0, width: 32, height: 18, opacity: 0.01, pointerEvents: "none" };
  return (
    <AbsoluteFill style={style}>
      <canvas ref={canvas} width={width} height={height} style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%" }} />
      <Video ref={vEl} src={staticFile(video)} startFrom={videoStartFrom} muted style={hidden} onVideoFrame={(f, _n?: number, meta?: { mediaTime: number }) => { if (!onTime(meta, videoStartFrom)) return; got.current.v = f; got.current.fv = frameRef.current; tryDraw(); }} />
      <Video ref={mEl} src={staticFile(matte)} startFrom={matteStartFrom} muted style={hidden} onVideoFrame={(f, _n?: number, meta?: { mediaTime: number }) => { if (!onTime(meta, matteStartFrom)) return; got.current.m = f; got.current.fm = frameRef.current; tryDraw(); }} />
    </AbsoluteFill>
  );
};

/** test composition (Studio id «MaskedVideo-Demo»): flat colour background + the masked Sheikh — compare it with the old alpha-WebM path */
export const MaskTest: React.FC = () => (
  <AbsoluteFill style={{ background: "#2f7a4a" }}>
    <MaskedVideo video="kh_cut_s.mp4" videoStartFrom={Math.round(2.6 * 30)} matte="kh/mask_test.mp4" />
  </AbsoluteFill>
);
export const MASKTEST_FRAMES = 360;
