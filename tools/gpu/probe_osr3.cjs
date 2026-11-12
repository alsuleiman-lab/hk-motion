/* paint-rate / size probe: page changes every 10 ms, count paints and texture sizes for 3 s */
const { app, BrowserWindow, screen } = require("electron");
app.commandLine.appendSwitch("use-angle", "d3d11");
app.commandLine.appendSwitch("ignore-gpu-blocklist");
app.commandLine.appendSwitch("enable-gpu-rasterization");
app.commandLine.appendSwitch("force-device-scale-factor", "1");

const W = 1920, H = 1088;
app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, width: W, height: H, useContentSize: true, enableLargerThanScreen: true, transparent: true, frame: false, webPreferences: { offscreen: { useSharedTexture: true }, backgroundThrottling: false } });
  win.setContentSize(W, H);
  win.webContents.setFrameRate(240); if (process.env.SHOW) win.show(); win.webContents.startPainting();
  const sizes = new Map(); let n = 0, t0 = 0;
  win.webContents.on("paint", (e) => { const tex = e.texture; if (!tex) return; n++; const k = tex.textureInfo.codedSize.width + "x" + tex.textureInfo.codedSize.height; sizes.set(k, (sizes.get(k) || 0) + 1); tex.release(); });
  await win.loadURL("data:text/html,"+encodeURIComponent("<body style='margin:0'><div id=d style='width:100px;height:100px;background:red;position:absolute'></div><script>let i=0;setInterval(()=>{d.style.left=(i++%500)+'px'},5)</script></body>"));
  n = 0; t0 = Date.now();
  setTimeout(() => { console.log("paints/s", (n / ((Date.now() - t0) / 1000)).toFixed(1), JSON.stringify([...sizes]), "content", JSON.stringify(win.getContentSize()), "display", JSON.stringify(screen.getPrimaryDisplay().size), screen.getPrimaryDisplay().scaleFactor); app.quit(); }, 3000);
});


