// شاشة صغيرة: اسم الفيديو + شريط تقدم الرندر. node tools/render_monitor.mjs  ثم افتح http://localhost:3199
// تقرأ سجلات render_work/eu_port.log (طولي) وأي سجل آخر يُمرَّر: LOGS="اسم=مسار,..."
import http from "node:http"; import fs from "node:fs";
const NAME = "اشتعال أوروبي - مظاهرات في فرنسا وإيطاليا وبلجيكا";
const logs = (process.env.LOGS ?? `${NAME} (طولي)=render_work/eu_port.log`).split(",").map(s => { const i = s.lastIndexOf("="); return { name: s.slice(0, i), file: s.slice(i + 1) }; });
const status = () => logs.map(({ name, file }) => {
  let t = ""; try { t = fs.readFileSync(file, "utf8"); } catch {}
  const m = [...t.matchAll(/\[\w+\] (\d+)%\s+([\d.]+) min/g)].pop();
  const done = /DONE ([\d.]+) min/.exec(t); const failed = /attempt 3 failed/.test(t);
  const pct = done ? 100 : m ? +m[1] : 0, min = done ? +done[1] : m ? +m[2] : 0;
  return { name, pct, min, eta: pct > 0 && !done ? min * (100 - pct) / pct : 0, state: done ? "done" : failed ? "failed" : "running" };
});
const page = `<!doctype html><meta charset=utf-8><title>تقدم الرندر</title><style>
body{margin:0;background:#e8eef5;font-family:Almarai,Tahoma,sans-serif;direction:rtl;padding:14px}
.c{background:#fff;border-radius:12px;padding:12px 14px;margin-bottom:10px;box-shadow:0 1px 4px #0002}
.n{font-weight:800;font-size:15px;color:#27425e;margin-bottom:8px}.b{height:14px;background:#d5dee9;border-radius:8px;overflow:hidden}
.f{height:100%;background:#3d7ab8;transition:width .6s}.done .f{background:#3a9a6a}.failed .f{background:#c0504d}
.i{display:flex;justify-content:space-between;font-size:12px;color:#456;margin-top:6px}</style><div id=r></div><script>
async function t(){const s=await (await fetch('/s')).json();r.innerHTML=s.map(x=>'<div class="c '+x.state+'"><div class=n>'+x.name+'</div><div class=b><div class=f style="width:'+x.pct+'%"></div></div><div class=i><span>'+x.pct+'%</span><span>'+(x.state=='done'?'اكتمل':x.state=='failed'?'فشل':'متبقٍ ≈ '+Math.round(x.eta)+' د')+'</span><span>مضى '+x.min.toFixed(1)+' د</span></div></div>').join('')}
t();setInterval(t,3000)</script>`;
http.createServer((q, s) => q.url === "/s" ? (s.setHeader("content-type", "application/json"), s.end(JSON.stringify(status()))) : (s.setHeader("content-type", "text/html;charset=utf-8"), s.end(page))).listen(3199);
