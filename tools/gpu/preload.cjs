/* Electron preload of the GPU renderer (tools/gpu/electron_worker.cjs). With contextIsolation the preload runs in its own world, so the setup is
   injected into the page's main world with contextBridge.executeInMainWorld (synchronously, before the bundle's scripts). It does what
   @remotion/renderer's setPropsAndEnv / seekToFrame / collectAssets do over the DevTools protocol.
   (A plain contextIsolation:false preload does not work: Electron deletes window.process after the preload, and Remotion then believes it is not rendering.) */
const { contextBridge } = require("electron");
const arg = process.argv.find((a) => a.startsWith("--gr="));
const cfg = JSON.parse(Buffer.from(arg.slice(5), "base64").toString("utf8"));

function setup(cfg) {
  const w = window;
  w.remotion_puppeteerTimeout = cfg.timeout;
  w.remotion_isMainTab = cfg.mainTab;
  w.remotion_mediaCacheSizeInBytes = cfg.mediaCache;
  w.remotion_initialMemoryAvailable = cfg.memory;
  w.remotion_sampleRate = cfg.sampleRate;
  if (w.process === undefined) w.process = {};
  if (w.process.env === undefined) w.process.env = {};
  w.process.env.NODE_ENV = "production";
  w.remotion_broadcastChannel = new BroadcastChannel("remotion-video-frame-extraction");
  w.remotion_inputProps = cfg.inputProps;
  w.remotion_initialFrame = cfg.initialFrame;
  w.remotion_attempt = 1;
  w.remotion_proxyPort = cfg.proxyPort;
  w.remotion_audioEnabled = true;
  w.remotion_videoEnabled = true;
  w.remotion_logLevel = "error";
  /* React commit counter (a minimal devtools hook, the interface React DOM calls on every commit). remotion_setFrame() lets readiness return on
     the next requestAnimationFrame; offscreen windows tick rAF at up to 240 Hz, faster than a time-sliced React render (~14 ms here), so "ready"
     can come before the new frame is committed and a paint would carry the new marker over the OLD picture (seen: frame 9198 had no geometry).
     A changed frame is accepted only after a commit that followed setFrame (and, in the top layer, after its slot geometry arrived). */
  let commits = 0;
  if (!w.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    w.__REACT_DEVTOOLS_GLOBAL_HOOK__ = { supportsFiber: true, isDisabled: false, renderers: new Map(), inject() { return 1; }, checkDCE() {}, onScheduleFiberRoot() {}, onCommitFiberRoot() { commits++; }, onCommitFiberUnmount() {}, onPostCommitFiberRoot() {}, setStrictMode() {} };
  }
  /* video-slot geometry: src/hybrid/Slot.tsx posts it with a SYNCHRONOUS XHR to 127.0.0.1:<hybridPort>/g (~7 ms per call, twice a frame).
     Those requests are answered here, in the page, without any network: the body is kept for the frame and travels with it over the worker's
     control channel. Nothing in src/ changes. */
  const geoms = new Map();
  let hyPort = null; try { hyPort = JSON.parse(cfg.inputProps).hybridPort; } catch { /* no hybrid port: nothing to catch */ }
  const XO = XMLHttpRequest.prototype.open, XS = XMLHttpRequest.prototype.send, XH = XMLHttpRequest.prototype.setRequestHeader;
  XMLHttpRequest.prototype.open = function (m, url, ...r) { this.__gr = hyPort != null && String(url) === `http://127.0.0.1:${hyPort}/g`; return this.__gr ? undefined : XO.call(this, m, url, ...r); };
  XMLHttpRequest.prototype.setRequestHeader = function (...a) { return this.__gr ? undefined : XH.apply(this, a); };
  XMLHttpRequest.prototype.send = function (body) { if (!this.__gr) return XS.call(this, body); const p = JSON.parse(body); geoms.set(p.frame, p); };
  w.alert = (m) => { w.remotion_cancelledError = new Error(`alert("${m}") was called`).stack; };
  w.confirm = (m) => { w.remotion_cancelledError = new Error(`confirm("${m}") was called`).stack; return false; };

  /* the same condition @remotion/renderer's waitForReady polls */
  const ready = (what) => new Promise((res, rej) => {
    const t0 = performance.now();
    const tick = () => {
      if (w.remotion_cancelledError !== undefined) return rej(new Error(String(w.remotion_cancelledError)));
      if (w.remotion_renderReady === true) return res();
      if (performance.now() - t0 > cfg.timeout) {
        const open = Object.values(w.remotion_delayRenderTimeouts || {}).map((x) => x.label).join(", ");
        return rej(new Error(`timeout ${what}: open delayRender() handles: ${open}`));
      }
      setTimeout(tick, 0);
    };
    tick();
  });

  /* frame marker: 32 black/white cells of 16 px in the rows BELOW the composition (the viewport is cfg.markRows taller); never inside the picture */
  let markEl = null;
  const cells = [];
  const setMarker = (v) => {
    if (!markEl) {
      markEl = document.createElement("div");
      markEl.style.cssText = `position:fixed;left:0;top:${cfg.height}px;width:512px;height:${cfg.markRows}px;z-index:2147483647;pointer-events:none;contain:strict`;
      for (let i = 0; i < 32; i++) {
        const c = document.createElement("div");
        c.style.cssText = `position:absolute;top:0;left:${i * 16}px;width:16px;height:${cfg.markRows}px`;
        markEl.appendChild(c); cells.push(c);
      }
      document.documentElement.appendChild(markEl);
    }
    for (let i = 0; i < 32; i++) cells[i].style.background = (v >>> i) & 1 ? "#fff" : "#000";
  };

  w.__gr_init = async (bundleMode) => {
    await ready("initial load");
    /* the viewport is cfg.markRows taller than the composition (marker strip). Elements anchored to the bottom of the INITIAL containing block
       (position:absolute; bottom:… with no positioned ancestor, e.g. TitleBar) would move down by those rows: #remotion-canvas (0,0, exactly
       W x H) becomes their containing block instead, i.e. the same box as the headless renderer's W x H viewport. */
    const st = document.createElement("style");
    st.textContent = "#remotion-canvas{position:relative}";
    document.head.appendChild(st);
    w.remotion_setBundleMode(bundleMode);
    await ready("bundle mode");
    setMarker(0xFFFFFFFE);
    return true;
  };

  /* seek, wait for every delayRender(), fonts; collect the audio assets of the frame; then stamp the marker (same DOM state as the picture) */
  const T = { n: 0, pre: 0, set: 0, ready: 0, fonts: 0, assets: 0 };
  w.__gr_prof = () => { const o = {}; for (const k in T) o[k] = k === "n" ? T[k] : +(T[k] / Math.max(1, T.n)).toFixed(2); return o; };
  let shown = cfg.initialFrame;   /* the frame the page shows (Remotion's timeline state) */
  /* audio/video assets of a frame (what renderFrames collects after each screenshot). remotion_collectAssets() empties a React state, which costs a
     second render of the tree per frame (measured: 47 -> 24 ms per frame without it). So the assets of frame f are collected at the start of the
     next step, in the SAME task as setFrame(f+1): React batches both updates into one render. The set collected is still the one of frame f. */
  let pendingFrame = null;
  const collect = () => {
    if (pendingFrame === null || cfg.noAssets || typeof w.remotion_collectAssets !== "function") { pendingFrame = null; return null; }
    const out = { frame: pendingFrame, assets: w.remotion_collectAssets().filter((a) => a.type === "audio" || a.type === "video") };
    pendingFrame = null;
    return out;
  };
  w.__gr_flush_assets = async () => { await ready("flush assets"); return collect(); };   /* end of a block: the last frame's assets */
  w.__gr_frame = async (f, comp) => {
    const t0 = performance.now();
    await ready("before frame " + f);
    const t1 = performance.now();
    const c0 = commits;
    const prev = collect();
    w.remotion_setFrame(f, comp, 1);
    const t2 = performance.now();
    await ready("frame " + f);
    /* wait for React's commit of frame f (a changed frame) and, in the top layer, for its slot geometry (posted in HybridHost's layout effect of
       that commit), then for readiness again */
    /* a composition without <HybridHost> (data-hyhost, src/hybrid/Slot.tsx) posts no geometry: nothing to wait for, the compositor puts its frame on black */
    const hosted = () => !!document.querySelector("[data-hyhost]");
    for (let tries = 0; (f !== shown && commits === c0) || (cfg.mode === "top" && !geoms.has(f) && hosted()); tries++) {
      if (tries > 5000) throw new Error(`frame ${f} was never committed (commits ${c0} -> ${commits}, geometry ${geoms.has(f)})`);
      await new Promise((r) => setTimeout(r, 1));
      await ready("frame " + f + " (after commit)");
    }
    shown = f;
    const t3 = performance.now();
    await document.fonts.ready;
    const t4 = performance.now();
    document.body.style.background = "transparent";   /* what @remotion/renderer's takeFrame does before every PNG capture (the bundle's page is Studio-dark) */
    setMarker(f);
    pendingFrame = f;
    const t5 = performance.now();
    T.n++; T.pre += t1 - t0; T.set += t2 - t1; T.ready += t3 - t2; T.fonts += t4 - t3; T.assets += t5 - t4;
    const g = geoms.get(f) || (cfg.mode === "top" && !hosted() ? { frame: f, slots: [], nohost: true } : null);
    const seen = [...geoms.keys()];
    geoms.clear();
    /* videos still decoded by CHROMIUM in this frame (not a VSlot): <OffthreadVideo> fetches /proxy?src=…, <Video>/<Html5Video> are <video> elements */
    let chrome = null;
    const px = performance.getEntriesByType("resource").filter((e) => e.name.includes("/proxy?src="));
    if (px.length) performance.clearResourceTimings();
    const vids = document.querySelectorAll("video");
    if (px.length || vids.length) {
      chrome = {};
      const name = (u) => { try { return decodeURIComponent(String(u)).replace(/^.*\/public\//, "").replace(/[?&].*$/, ""); } catch { return String(u); } };
      for (const e of px) { const s = name(new URL(e.name).searchParams.get("src") || e.name); chrome["proxy:" + s] = 1; }
      for (const v of vids) chrome["video:" + name(v.currentSrc || v.src)] = 1;
    }
    return { prev, geom: g, seen, chrome };
  };
}

contextBridge.executeInMainWorld({ func: setup, args: [cfg] });
