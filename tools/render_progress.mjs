// شريط تقدّم الرندر الحي (طلب المستخدم 2026-10-31): صفحة محلية تقرأ سجلات render_work/progress_chunked_*.log وتعرض شريطاً لكل رندر جارٍ أو منتهٍ حديثاً.
//   node tools/render_progress.mjs [--port 3105]      ثم افتح http://localhost:3105 (أو عنوان الشبكة) في لوحة المتصفح أو من الجوال.
// النسبة مقيسة من سطور المرندِر نفسها `[جزء i/n] p%` (لا تقدير)، و`DONE` = 100%. السجلات الأقدم من 12 ساعة لا تُعرض.
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const port = Number(process.argv.includes("--port") ? process.argv[process.argv.indexOf("--port") + 1] : 3105);
const DIR = path.resolve("render_work");
const MAX_AGE = 12 * 3600e3;

/* Arabic title of a composition id from src/compositionTitles.ts */
const arTitle = (id) => { try { const m = fs.readFileSync("src/compositionTitles.ts", "utf8").match(new RegExp(`"${id}"\\s*:\\s*"([^"]+)"`)); return m ? m[1] : id; } catch { return id; } };
const parse = (file) => {
  const st = fs.statSync(file);
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean);
  let part = null, done = null, head = null, fr = null;
  for (const raw of lines) for (const l of raw.split("\r")) {
    if (/^TITLE\s/.test(l)) head = l.replace(/^TITLE\s+/, "");
    /* hybrid render (.tmp/b2_render_<p>.log): «SaintRambal-L: 1920x1080 …» names it, «frame a/b  f fps» measures it, the final mux ends it */
    const hc = l.match(/\]\s*([\w-]+):\s*\d+x\d+ @/); if (hc) head = arTitle(hc[1]);
    const fm = l.match(/frame (\d+)\/(\d+)\s+([\d.]+) fps/); if (fm) fr = { a: +fm[1], b: +fm[2], fps: +fm[3] };
    if (/HYBRID FAILED/.test(l)) done = null;
    if (/^\[hybrid-any[^\]]*\]\s*(done|✔)/i.test(l)) done = head ?? "done";
    const m = l.match(/\[جزء (\d+)\/(\d+)\]\s*(\d+)%(?:\s+([\d.]+)\s*د)?/);
    if (m) part = { i: +m[1], n: +m[2], p: +m[3], min: m[4] ? +m[4] : null };
    if (/^DONE\b/.test(l)) done = l.replace(/^DONE\s+/, "");
  }
  const pct = done ? 100 : part ? Math.min(99, ((part.i - 1) * 100 + part.p) / part.n) : 0;
  const idleMin = (Date.now() - st.mtimeMs) / 60000;
  const min = part?.min ?? null;
  let eta = !done && part && min && pct > 1 ? Math.max(0, (min / pct) * (100 - pct)) : null;
  if (!done && fr && fr.fps > 0) eta = (fr.b - fr.a) / fr.fps / 60;
  return {
    id: path.basename(file).replace(/^progress_chunked_|\.log$/g, ""),
    title: (done && done.match(/->\s*(.+?)\s*\(/)?.[1]?.split(/[\\/]/).pop()?.replace(/\.mp4$/, "")) || head || path.basename(file).replace(/^progress_chunked_|\.log$/g, ""),
    pct: +pct.toFixed(1), part, done: !!done, out: done, idleMin: +idleMin.toFixed(1), min, eta: eta === null ? null : +eta.toFixed(1),
    stalled: !done && idleMin > 5, mtime: st.mtimeMs,
  };
};
const state = () => {
  const files = [];
  if (fs.existsSync(DIR)) files.push(...fs.readdirSync(DIR).filter((f) => /^progress_chunked_.*\.log$/.test(f)).map((f) => path.join(DIR, f)));
  const TMP = path.resolve(".tmp"); /* hybrid renders of the render queue */
  if (fs.existsSync(TMP)) files.push(...fs.readdirSync(TMP).filter((f) => /^b2_render_.*\.log$/.test(f)).map((f) => path.join(TMP, f)));
  return files
    .filter((f) => Date.now() - fs.statSync(f).mtimeMs < MAX_AGE).map(parse).filter((r) => !/_probe.mp4|probe.mp4/.test(r.out ?? "")).filter((r) => r.done ? Date.now() - r.mtime < 3600e3 : !r.stalled)
    .sort((a, b) => (a.done - b.done) || (b.mtime - a.mtime));
};

const PAGE = `<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>تقدّم الرندر</title>
<style>
:root{--bg:#1d1a1c;--card:#2b2629;--ink:#f2e9e4;--mut:#b9aaa3;--bar:#6b2d3a;--fill:#d6a45a;--ok:#7bbf8e;--warn:#e0816b}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font-family:"Segoe UI",Tahoma,sans-serif;padding:16px;max-width:760px;margin-inline:auto}
h1{font-size:20px;margin:4px 0 14px}.card{background:var(--card);border-radius:14px;padding:14px 16px;margin:12px 0}
.t{display:flex;justify-content:space-between;gap:10px;font-weight:700}.pct{font-variant-numeric:tabular-nums;color:var(--fill)}
.bar{height:16px;background:var(--bar);border-radius:99px;overflow:hidden;margin:10px 0 8px}.fill{height:100%;background:var(--fill);border-radius:99px;transition:width .8s}
.done .fill{background:var(--ok)}.done .pct{color:var(--ok)}.stalled .fill{background:var(--warn)}
.m{font-size:13px;color:var(--mut);display:flex;flex-wrap:wrap;gap:6px 16px}.empty{color:var(--mut);text-align:center;padding:30px 0}
</style><h1>تقدّم الرندر</h1><div id="n"></div><div id="c"><div class="empty">لا يوجد رندر حديث…</div></div>
<script>
const f1=(n)=>n==null?"—":(n<1?"أقل من دقيقة":Math.round(n)+" د");
async function tick(){try{const r=await (await fetch("/api",{cache:"no-store"})).json();const nw=await (await fetch("/now",{cache:"no-store"})).json();document.getElementById("n").innerHTML=nw.item?'<div class="card"><div class="t"><span>الآن: '+nw.stage+'</span><span class="pct">'+nw.n+'</span></div><div class="m"><span>'+nw.title+'</span></div></div>':"";const c=document.getElementById("c");
c.innerHTML=r.length?r.map(x=>'<div class="card '+(x.done?"done":x.stalled?"stalled":"")+'"><div class="t"><span>'+x.title+'</span><span class="pct">'+(x.done?"اكتمل":x.pct.toFixed(0)+"%")+'</span></div><div class="bar"><div class="fill" style="width:'+x.pct+'%"></div></div><div class="m">'+
(x.part&&!x.done?'<span>الجزء '+x.part.i+' من '+x.part.n+' ('+x.part.p+'%)</span>':'')+(x.min!=null&&!x.done?'<span>مضى '+f1(x.min)+'</span>':'')+(x.eta!=null&&!x.done?'<span>المتبقي نحو '+f1(x.eta)+'</span>':'')+
(x.stalled?'<span>لا تقدّم منذ '+f1(x.idleMin)+'</span>':'')+(x.done&&x.out?'<span>'+x.out+'</span>':'')+(!x.part&&!x.done?'<span>في الانتظار…</span>':'')+'</div></div>').join(""):'<div class="empty">لا يوجد رندر حديث…</div>'}catch(e){}}
tick();setInterval(tick,2000);
</script></html>`;

http.createServer((req, res) => {
  if (req.url.startsWith("/now")) { let j = {}; try { j = JSON.parse(fs.readFileSync(path.join(DIR, "queue_now.json"), "utf8")); if (Date.now() - j.t > 30 * 60e3 || j.end) j = {}; } catch { /* none */ } res.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }); res.end(JSON.stringify(j)); return; }
  if (req.url.startsWith("/api")) { res.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }); res.end(JSON.stringify(state())); return; }
  res.writeHead(200, { "content-type": "text/html; charset=utf-8" }); res.end(PAGE);
}).listen(port, "0.0.0.0", () => {
  const ip = Object.values(os.networkInterfaces()).flat().find((i) => i && i.family === "IPv4" && !i.internal)?.address ?? "localhost";
  console.log(`render progress: http://localhost:${port}  |  http://${ip}:${port}`);
});
