/* test rig for bridge.dll: animated page + marker strip, every paint is announced on stdout (JSON line), the texture is held until Python writes "release <n>" on stdin */
const { app, BrowserWindow } = require("electron");
const readline = require("node:readline");
app.commandLine.appendSwitch("use-angle", "d3d11");
app.commandLine.appendSwitch("ignore-gpu-blocklist");
app.commandLine.appendSwitch("enable-gpu-rasterization");
const W = 1920, H = 1080, MR = 8;
const held = new Map();
let n = 0;
app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, width: W, height: H + MR, useContentSize: true, enableLargerThanScreen: true, transparent: true, frame: false, webPreferences: { offscreen: { useSharedTexture: true }, backgroundThrottling: false } });
  win.webContents.setFrameRate(60);
  win.webContents.on("paint", (e) => {
    const tex = e.texture; if (!tex) return;
    const id = n++; held.set(id, tex);
    process.stdout.write(JSON.stringify({ n: id, pid: process.pid, handle: tex.textureInfo.handle.ntHandle.readBigUInt64LE(0).toString(), w: tex.textureInfo.codedSize.width, h: tex.textureInfo.codedSize.height }) + "\n");
  });
  readline.createInterface({ input: process.stdin }).on("line", (l) => {
    const [cmd, a] = l.split(" ");
    if (cmd === "release") { const t = held.get(+a); if (t) { t.release(); held.delete(+a); } }
    if (cmd === "mark") win.webContents.executeJavaScript(`window.setMark(${a})`);
    if (cmd === "quit") app.quit();
  });
  const page = `<body style="margin:0;background:transparent;overflow:hidden"><div style="position:absolute;left:100px;top:100px;width:600px;height:300px;background:rgba(255,0,0,.5);font:80px sans-serif;color:#00f">hello</div>
<div style="position:absolute;left:400px;top:250px;width:300px;height:300px;background:#0a0;border-radius:40px"></div>
<div id=m style="position:fixed;left:0;top:${H}px;width:512px;height:${MR}px"></div>
<script>window.setMark=(v)=>{const m=document.getElementById('m');m.innerHTML='';for(let i=0;i<32;i++){const c=document.createElement('div');c.style.cssText='position:absolute;top:0;height:${MR}px;width:16px;left:'+i*16+'px;background:'+(((v>>>i)&1)?'#fff':'#000');m.appendChild(c)}};window.setMark(0)</script>`;
  await win.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(page));
  win.webContents.executeJavaScript("window.setMark(1234567)");
});
