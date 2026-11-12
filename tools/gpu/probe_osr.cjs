/* Feasibility probe: Electron offscreen rendering with a shared GPU texture. Run: <electron.exe> tools/gpu/probe_osr.cjs */
const { app, BrowserWindow } = require("electron");
app.commandLine.appendSwitch("ignore-gpu-blocklist");
app.commandLine.appendSwitch("enable-gpu-rasterization");
app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, width: 1920, height: 1080, transparent: true, frame: false, webPreferences: { offscreen: { useSharedTexture: true }, backgroundThrottling: false } });
  win.webContents.setFrameRate(60);
  let n = 0;
  win.webContents.on("paint", (e) => {
    const tex = e.texture;
    if (n++ < 3) {
      console.log("paint", Object.keys(e), tex ? JSON.stringify(Object.keys(tex)) : "no texture");
      if (tex) {
        const ti = tex.textureInfo;
        console.log("textureInfo", JSON.stringify({ ...ti, handle: ti && ti.handle ? Object.fromEntries(Object.entries(ti.handle).map(([k, v]) => [k, Buffer.isBuffer(v) ? "Buffer(" + v.length + ")" + v.toString("hex") : v])) : undefined }));
      }
    }
    if (tex) tex.release();
  });
  await win.loadURL("data:text/html,<body style='margin:0;background:transparent'><div style='width:300px;height:200px;background:rgba(255,0,0,.5);font:60px sans-serif'>hello</div></body>");
  setTimeout(() => { console.log("paints", n, "gpuinfo", JSON.stringify(app.getGPUFeatureStatus())); app.quit(); }, 2500);
});
