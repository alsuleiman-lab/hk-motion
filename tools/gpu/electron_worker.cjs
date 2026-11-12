/* GPU renderer — graphics worker (Electron main process). Started by tools/gpu_render.mjs:  electron.exe tools/gpu/electron_worker.cjs <config.json>
   Opens N offscreen windows (Chromium draws on the GPU, D3D11/ANGLE), loads the Remotion bundle in each, and on request of the compositor
   (tools/gpu_compositor.py, TCP control port) steps a window frame by frame exactly like @remotion/renderer (setFrame -> every delayRender -> fonts).
   Every painted frame stays on the GPU: its shared-texture NT handle is sent to the compositor, which copies it GPU -> GPU (tools/gpu/bridge.dll)
   and answers with the frame number it read from the marker strip below the picture; the texture is released after that answer.
   No screenshot, no PNG/JPEG, no frame pixels through the CPU. */
const { app, BrowserWindow, contentTracing } = require("electron");
const fs = require("node:fs");
const net = require("node:net");
const os = require("node:os");
const path = require("node:path");

const cfg = JSON.parse(fs.readFileSync(process.argv[process.argv.length - 1], "utf8"));
/* the switches @remotion/renderer gives its headless Chromium (open-browser.js) that affect what is drawn or how fast, so the picture is the same:
   --hide-scrollbars matters twice — without it an element overflowing the viewport (a scaled layer) makes the page scrollable, Electron draws
   scrollbars and its frame capturer stalls (measured: 0 textured paints in 2 s, 200 with it); --font-render-hinting=none = the same glyph outlines */
for (const s of ["ignore-gpu-blocklist", "enable-gpu-rasterization", "disable-renderer-backgrounding", "disable-background-timer-throttling", "disable-backgrounding-occluded-windows",
  "hide-scrollbars", "font-render-hinting=none", "force-gpu-mem-available-mb=4096", "mute-audio", "disable-ipc-flooding-protection", "disable-hang-monitor", "allow-running-insecure-content",
  "disable-background-media-suspend", "intensive-wake-up-throttling-policy=0",
  "disable-features=CalculateNativeWinOcclusion,AudioServiceOutOfProcess,IsolateOrigins,site-per-process,Translate,BackForwardCache,IntensiveWakeUpThrottling,LocalNetworkAccessChecks,BlockInsecurePrivateNetworkRequests,PrivateNetworkAccessSendPreflights,PrivateNetworkAccessRespectPreflightResults"]) {
  const i = s.indexOf("="); i > 0 ? app.commandLine.appendSwitch(s.slice(0, i), s.slice(i + 1)) : app.commandLine.appendSwitch(s);
}
/* profile, caches and logs on S: (project rule: nothing on C:); no HTTP disk cache, so a re-bundled project is never served stale */
app.setPath("userData", path.join(cfg.workDir, "electron_profile_" + process.pid));
app.setPath("sessionData", path.join(cfg.workDir, "electron_profile_" + process.pid));
app.commandLine.appendSwitch("disk-cache-size", "1");
app.commandLine.appendSwitch("use-angle", "d3d11");
if (process.env.GR_ELOG) { app.commandLine.appendSwitch("enable-logging", "stderr"); app.commandLine.appendSwitch("v", process.env.GR_ELOG); }
app.commandLine.appendSwitch("force-device-scale-factor", "1");
app.commandLine.appendSwitch("force-color-profile", "srgb");
try { os.setPriority(process.pid, os.constants.priority.PRIORITY_BELOW_NORMAL); } catch { /* project rule: low priority */ }
const DEBUG = !!process.env.GR_DEBUG;
const log = (m) => process.stderr.write(`[gpu-worker ${process.pid}] ${m}\n`);

const W = cfg.width, H = cfg.height, MR = cfg.markRows;
let sock, sbuf = "";
const send = (o) => sock.write(JSON.stringify(o) + "\n");
const held = new Map();   /* paint id -> texture, until the compositor has copied it */
let paintSeq = 0;
const wins = [];

const makeWindow = async (k, spec) => {
  const pre = {
    timeout: cfg.timeout, mainTab: k === 0, mediaCache: cfg.mediaCache, memory: os.freemem(), sampleRate: cfg.sampleRate, inputProps: spec.inputProps, mode: spec.mode, noAssets: !!process.env.GR_NOASSETS,
    initialFrame: spec.initialFrame, proxyPort: cfg.proxyPort, height: H, markRows: MR, profile: !!process.env.GR_PROFILE,
  };
  const win = new BrowserWindow({
    show: false, width: W, height: H + MR, useContentSize: true, enableLargerThanScreen: true, transparent: true, frame: false, backgroundColor: "#00000000",
    webPreferences: { offscreen: process.env.GR_BITMAP ? true : { useSharedTexture: true }, backgroundThrottling: false, contextIsolation: true, nodeIntegration: false, sandbox: false, preload: path.join(__dirname, "preload.cjs"), additionalArguments: ["--gr=" + Buffer.from(JSON.stringify(pre)).toString("base64")], spellcheck: false },
  });
  win.setContentSize(W, H + MR);
  win.webContents.setFrameRate(cfg.paintRate || 240);
  const st = { k, win, mode: spec.mode, expect: -1, waiter: null, queue: [], busy: false, assets: [], frames: 0, tSeek: 0, tPaint: 0 };
  win.webContents.on("paint", (e) => {
    const tex = e.texture;
    if (DEBUG) log(`w${k} paint tex=${!!tex} img=${e.image && !e.image.isEmpty() ? JSON.stringify(e.image.getSize()) : "-"} dirty=${JSON.stringify(e.dirtyRect||null)} expect=${st.expect}`);
    if (!tex) return;
    if (st.expect < 0) { tex.release(); return; }    /* nothing asked: drop at once */
    const id = paintSeq++;
    held.set(id, { tex, st });
    send({ t: "tex", w: k, id, pid: process.pid, h: tex.textureInfo.handle.ntHandle.readBigUInt64LE(0).toString(), e: st.expect });
  });
  win.webContents.on("console-message", (e) => { if (DEBUG || e.level === "error" || e.level === 3) log(`w${k} console[${e.level}]: ${String(e.message).slice(0, 300)}`); });
  win.webContents.on("render-process-gone", (_e, d) => { log(`w${k} renderer gone: ${d.reason}`); send({ t: "fatal", w: k, msg: "renderer gone " + d.reason }); });
  await win.loadURL(cfg.url + "/index.html");
  await win.webContents.executeJavaScript(`window.__gr_init(${JSON.stringify(cfg.bundleMode)})`);
  if (DEBUG) log(`w${k} page: ` + await win.webContents.executeJavaScript(`(() => { let x = "?"; try { const port = JSON.parse(window.remotion_inputProps).hybridPort; const r = new XMLHttpRequest(); r.open("POST", "http://127.0.0.1:" + port + "/g", false); r.send(JSON.stringify({ frame: -5, slots: [] })); x = "xhr " + r.status; } catch (e) { x = "xhr error " + e; } return x + " props " + String(window.remotion_inputProps).slice(0, 120); })()`));
  if (process.env.GR_PAINTTEST) {   /* debug: how many textured paints does a changing page produce? (GR_PAINTTEST = JS run first, e.g. hiding a subtree) */
    let n0 = 0; const h = (e) => { if (e.texture) n0++; }; win.webContents.on("paint", h);
    await new Promise((r) => setTimeout(r, 1500));
    if (process.env.GR_PAINTTEST.length > 1) log(`w${k} PAINTTEST pre: ` + await win.webContents.executeJavaScript(process.env.GR_PAINTTEST));
    await win.webContents.executeJavaScript(`window.__pt = setInterval(() => { const m = document.documentElement.lastElementChild; m.style.opacity = m.style.opacity === "0.5" ? "1" : "0.5"; }, 10); 1`);
    await new Promise((r) => setTimeout(r, 2000));
    await win.webContents.executeJavaScript("clearInterval(window.__pt); 1");
    win.webContents.off("paint", h); log(`w${k} PAINTTEST textured paints in 2 s: ${n0}`);
  }
  if (process.env.GR_PAINTBISECT) {   /* debug: show only child i of the element at path GR_PAINTBISECT, count textured paints of a changing marker */
    let n0 = 0; const h = (e) => { if (e.texture) n0++; }; win.webContents.on("paint", h);
    const pth = process.env.GR_PAINTBISECT;
    await new Promise((r) => setTimeout(r, 1500));
    const nk = await win.webContents.executeJavaScript(`(() => { let el = document.getElementById("remotion-canvas"); const tr = []; for (const i of "${pth}".split(".").slice(1)) { tr.push(el ? el.children.length : -1); el = el && el.children[+i]; } window.__bis = el; return el ? el.children.length : -100 - tr.length; })()`);
    log("bisect kids " + nk);
    await win.webContents.executeJavaScript(`window.__pt = setInterval(() => { const m = document.documentElement.lastElementChild; m.style.opacity = m.style.opacity === "0.5" ? "1" : "0.5"; }, 10); 1`);
    const res = [];
    for (let i = -1; i < nk; i++) {
      const desc = await win.webContents.executeJavaScript(`(() => { const p = window.__bis; [...p.children].forEach((c, j) => c.style.display = j === ${i} ? "" : "none"); const c = p.children[${i}]; if (!c) return "none"; const cs = getComputedStyle(c); const r = c.getBoundingClientRect(); return c.tagName + " " + Math.round(r.width) + "x" + Math.round(r.height) + " " + (c.getAttribute("style") || "").slice(0, 90) + " n=" + c.querySelectorAll("*").length; })()`);
      await new Promise((r) => setTimeout(r, 300)); n0 = 0;
      await new Promise((r) => setTimeout(r, 500));
      res.push(`${i}: ${n0} paints  ${desc}`);
    }
    win.webContents.off("paint", h);
    log(`w${k} PAINTBISECT ${pth}\n` + res.join("\n"));
  }
  return st;
};

const doFrame = async (st, f) => {
  const t0 = performance.now();
  if (DEBUG) log(`w${st.k} frame ${f}: seek…`);
  /* expect the frame BEFORE the page stamps its marker: its paint can arrive before executeJavaScript returns */
  let rejectWait;
  const painted = new Promise((res, rej) => { st.waiter = { f, res }; rejectWait = rej; });
  st.expect = f;
  const { prev, geom, seen } = await st.win.webContents.executeJavaScript(`window.__gr_frame(${f}, ${JSON.stringify(cfg.compId)})`);
  const t1 = performance.now();
  if (st.mode === "top") send({ t: "geom", f, g: geom, seen });   /* the video-slot geometry of this frame (src/hybrid/Slot.tsx), before the compositor needs it */
  if (DEBUG) log(`w${st.k} frame ${f}: ready in ${(t1 - t0).toFixed(0)} ms, prev assets ${prev ? prev.assets.length : "-"}, geometry ${geom ? geom.slots.length + " slots" : "none"}; waiting for its paint`);
  /* every frame is recorded, even with no asset (the audio mix closes a segment on a frame where its asset is absent) */
  if (st.mode === "top" && prev) st.assets.push({ frame: prev.frame, audioAndVideoAssets: prev.assets });
  let tries = 0;
  const kick = () => {   /* a paint normally arrives within one frame interval; nudge the compositor if it does not */
    if (st.waiter?.f !== f) return;
    if (++tries > 40) { rejectWait(new Error(`no painted frame with marker ${f} (window ${st.k})`)); return; }
    st.win.webContents.invalidate();
    st.kickTimer = setTimeout(kick, 250);
  };
  st.kickTimer = setTimeout(kick, 250);
  await painted;
  clearTimeout(st.kickTimer);
  st.tSeek += t1 - t0; st.tPaint += performance.now() - t1; st.frames++;
};

const runQueue = async (st) => {
  if (st.busy) return;
  st.busy = true;
  try {
    while (st.queue.length) {
      const [a, b] = st.queue[0];
      for (let f = a; f <= b; f++) await doFrame(st, f);
      const last = await st.win.webContents.executeJavaScript("window.__gr_flush_assets()");
      if (st.mode === "top" && last) st.assets.push({ frame: last.frame, audioAndVideoAssets: last.assets });
      st.queue.shift();
      st.expect = -1;
      if (process.env.GR_PROFILE) log(`w${st.k} block ${a}-${b} page profile (ms/frame): ` + JSON.stringify(await st.win.webContents.executeJavaScript("window.__gr_prof()")));
      send({ t: "done", w: st.k, a, b, seekMs: +(st.tSeek / st.frames).toFixed(1), paintMs: +(st.tPaint / st.frames).toFixed(1) });
    }
  } catch (e) {
    log(`w${st.k}: ${e.stack || e}`);
    send({ t: "fatal", w: st.k, msg: String(e.message || e).slice(0, 2000) });
  }
  st.busy = false;
};

const onMsg = (m) => {
  if (m.t === "rel") {   /* the compositor copied paint m.id; m.ok = it carried the frame the window waits for */
    const h = held.get(m.id);
    if (DEBUG) log(`rel ${m.id} mk=${m.mk} ok=${m.ok} expect=${h?.st.expect}`);
    if (!h) return;
    held.delete(m.id);
    h.tex.release();
    const st = h.st;
    if (m.ok && st.waiter && st.waiter.f === m.mk) { const w = st.waiter; st.waiter = null; st.expect = -1; w.res(); }
  } else if (m.t === "do") {
    const st = wins[m.w];
    if (DEBUG) log(`do w${m.w} ${m.a}-${m.b} (window known: ${!!st})`);
    st.queue.push([m.a, m.b]);
    runQueue(st);
  } else if (m.t === "quit") {
    for (const st of wins) if (st.mode === "top") fs.writeFileSync(path.join(cfg.workDir, `assets_${process.pid}_${st.k}.json`), JSON.stringify(st.assets));
    send({ t: "bye" });
    setTimeout(() => app.exit(0), 200);
  }
};

app.on("child-process-gone", (_e, d) => log(`child process gone: ${d.type} ${d.reason} ${d.exitCode}`));
app.on("gpu-info-update", () => { if (DEBUG) log("gpu-info-update: compositing=" + app.getGPUFeatureStatus().gpu_compositing); });
app.whenReady().then(async () => {
  sock = net.connect(cfg.ctlPort, "127.0.0.1");
  sock.setNoDelay(true);
  await new Promise((res, rej) => { sock.once("connect", res); sock.once("error", rej); });
  sock.on("data", (d) => { sbuf += d; let i; while ((i = sbuf.indexOf("\n")) >= 0) { const l = sbuf.slice(0, i); sbuf = sbuf.slice(i + 1); if (l) onMsg(JSON.parse(l)); } });
  sock.on("close", () => app.exit(0));
  const t0 = Date.now();
  const specs = cfg.windows;
  const made = await Promise.all(specs.map((s, k) => makeWindow(k + (cfg.windowBase || 0), s)));
  made.forEach((st) => (wins[st.k] = st));
  if (process.env.GR_TRACE) {   /* debug: a Chromium trace of GR_TRACE_SEC seconds, starting GR_TRACE_AT seconds after the windows are ready */
    setTimeout(async () => {
      await contentTracing.startRecording({ included_categories: ["toplevel", "cc", "gpu", "viz", "blink", "v8", "disabled-by-default-devtools.timeline", "base"] });
      setTimeout(async () => { const p = await contentTracing.stopRecording(process.env.GR_TRACE.replace("PID", process.pid)); log("trace written: " + p); }, 1000 * Number(process.env.GR_TRACE_SEC || 3));
    }, 1000 * Number(process.env.GR_TRACE_AT || 4));
  }
  if (process.env.GR_CDPTRACE) {   /* debug: DevTools-protocol trace (JSON) of window 0 for GR_TRACE_SEC s, GR_TRACE_AT s after start */
    const wc = made[0].win.webContents, dbg = wc.debugger; dbg.attach("1.3");
    const chunks = [];
    dbg.on("message", (_e, method, params) => { if (method === "Tracing.dataCollected") chunks.push(...params.value); if (method === "Tracing.tracingComplete") { fs.writeFileSync(process.env.GR_CDPTRACE.replace("PID", process.pid), JSON.stringify({ traceEvents: chunks })); log("cdp trace written: " + chunks.length + " events"); } });
    setTimeout(async () => {
      await dbg.sendCommand("Tracing.start", { traceConfig: { includedCategories: ["toplevel", "cc", "blink", "v8", "gpu", "viz", "disabled-by-default-devtools.timeline", "devtools.timeline", "blink.user_timing", "loading"] }, transferMode: "ReportEvents" });
      setTimeout(() => dbg.sendCommand("Tracing.end"), 1000 * Number(process.env.GR_TRACE_SEC || 3));
    }, 1000 * Number(process.env.GR_TRACE_AT || 4));
  }
  if (process.env.GR_JSPROF) {   /* debug: V8 sampling profile of window 0 (DevTools protocol), GR_TRACE_SEC s from GR_TRACE_AT s */
    const dbg = made[0].win.webContents.debugger; try { dbg.attach("1.3"); } catch {}
    setTimeout(async () => {
      await dbg.sendCommand("Profiler.enable"); await dbg.sendCommand("Profiler.setSamplingInterval", { interval: 200 }); await dbg.sendCommand("Profiler.start");
      setTimeout(async () => { const { profile } = await dbg.sendCommand("Profiler.stop"); fs.writeFileSync(process.env.GR_JSPROF.replace("PID", process.pid), JSON.stringify(profile)); log("js profile written"); }, 1000 * Number(process.env.GR_TRACE_SEC || 3));
    }, 1000 * Number(process.env.GR_TRACE_AT || 4));
  }
  send({ t: "hello", pid: process.pid, windows: made.map((st) => ({ w: st.k, mode: st.mode })), loadSec: (Date.now() - t0) / 1000 });
}).catch((e) => { log(e.stack || String(e)); app.exit(3); });
app.on("window-all-closed", () => {});
