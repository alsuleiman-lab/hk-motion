// صفحة تصحيح نصوص التوليد الصوتي (أمر المستخدم 2026-11-21): يصحح المستخدم التشكيل وعلامات الترقيم من جواله،
// وكل تعديل يُحفظ فوراً في ملف على الكمبيوتر (لا في ذاكرة المتصفح؛ درس ضياع تصحيح السوراني 2026-11-20)،
// وزر «تمّ التصحيح» يكتب ok.json فيبدأ التوليد على النص المصحَّح.
//   node tools/text_review.mjs <مجلد فيه texts.json> [المنفذ=8795]
//   texts.json = [{ "id": "burj", "title": "برج خليفة", "text": "…" }, …]
//   ينتظر كلود الملف <المجلد>/ok.json ثم يقرأ texts.json (وكل حفظ له نسخة في history/).
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import os from "node:os";
const dir = path.resolve(process.argv[2] || "."), port = Number(process.argv[3] || 8795);
const F = path.join(dir, "texts.json"), OK = path.join(dir, "ok.json"), H = path.join(dir, "history");
if (!fs.existsSync(F)) { console.error("✘ لا يوجد " + F); process.exit(2); }
fs.mkdirSync(H, { recursive: true });
const page = () => `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>تصحيح نص الصوت</title><style>
body{margin:0;background:#f4efe6;color:#2a1c14;font-family:"Segoe UI",Tahoma,sans-serif}
header{position:sticky;top:0;background:#7a2e1f;color:#fff;padding:12px 16px;display:flex;gap:12px;align-items:center;justify-content:space-between;z-index:2}
h1{font-size:18px;margin:0}#st{font-size:14px;opacity:.95}
main{padding:16px;max-width:900px;margin:auto}
.card{background:#fff;border-radius:12px;padding:14px;margin:0 0 16px;box-shadow:0 2px 8px rgba(0,0,0,.08)}
.card h2{font-size:17px;margin:0 0 8px;color:#7a2e1f}
textarea{width:100%;box-sizing:border-box;min-height:160px;font-size:24px;line-height:2;font-family:"Traditional Arabic","Amiri","Segoe UI",serif;border:1px solid #d8cdbb;border-radius:8px;padding:10px;resize:vertical}
.tools{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0 0}.tools button{font-size:22px;min-width:44px;padding:4px 8px;border:1px solid #d8cdbb;background:#faf6ef;border-radius:8px}
#ok{background:#2f6b3a;color:#fff;border:0;border-radius:10px;padding:10px 18px;font-size:17px;font-weight:700}
#ok.done{background:#555}
</style></head><body>
<header><h1>تصحيح التشكيل وعلامات الترقيم</h1><span id="st">…</span><button id="ok">تمّ التصحيح</button></header>
<main id="m"></main>
<script>
const marks=["َ","ُ","ِ","ْ","ّ","ً","ٌ","ٍ","،","؟",".","!",":"];
let data=[],timer=null;const st=document.getElementById("st");
function save(){clearTimeout(timer);timer=setTimeout(()=>{fetch("save",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(data)})
 .then(r=>r.ok?st.textContent="✓ حُفظ على الكمبيوتر":st.textContent="✘ لم يُحفظ").catch(()=>st.textContent="✘ لا اتصال بالكمبيوتر")},500);st.textContent="… يُحفظ"}
fetch("texts").then(r=>r.json()).then(d=>{data=d;const m=document.getElementById("m");
 d.forEach((t,i)=>{const c=document.createElement("div");c.className="card";c.innerHTML="<h2></h2><textarea></textarea><div class=tools></div>";
  c.querySelector("h2").textContent=t.title||t.id;const ta=c.querySelector("textarea");ta.value=t.text;
  ta.addEventListener("input",()=>{data[i].text=ta.value;save()});
  const tl=c.querySelector(".tools");marks.forEach(k=>{const b=document.createElement("button");b.textContent=k==="ّ"?"ـّ":k.length===1&&k.charCodeAt(0)>1600&&k.charCodeAt(0)<1620?"ـ"+k:k;
   b.onclick=()=>{const s=ta.selectionStart,e=ta.selectionEnd;ta.value=ta.value.slice(0,s)+k+ta.value.slice(e);ta.selectionStart=ta.selectionEnd=s+k.length;ta.focus();data[i].text=ta.value;save()};tl.appendChild(b)});
  m.appendChild(c)});st.textContent="جاهز — كل تعديل يُحفظ وحده"});
document.getElementById("ok").onclick=()=>fetch("ok",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(data)})
 .then(r=>{if(r.ok){st.textContent="✓ وصل «تمّ» — يبدأ التوليد";const b=document.getElementById("ok");b.textContent="أُرسل ✓";b.classList.add("done")}});
</script></body></html>`;
const body = (q) => new Promise((res) => { let b = ""; q.on("data", (c) => (b += c)); q.on("end", () => res(b)); });
const write = (rows) => { const s = JSON.stringify(rows, null, 1); fs.writeFileSync(F, s, "utf8"); fs.writeFileSync(path.join(H, `texts_${Date.now()}.json`), s, "utf8"); };
http.createServer(async (q, r) => {
  try {
    if (q.method === "GET" && (q.url === "/" || q.url.startsWith("/?"))) { r.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" }); return r.end(page()); }
    if (q.method === "GET" && q.url === "/texts") { r.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }); return r.end(fs.readFileSync(F)); }
    if (q.method === "POST" && q.url === "/save") { write(JSON.parse(await body(q))); r.writeHead(200); return r.end("ok"); }
    if (q.method === "POST" && q.url === "/ok") { write(JSON.parse(await body(q))); fs.writeFileSync(OK, JSON.stringify({ at: new Date().toISOString() })); console.log("OK_RECEIVED"); r.writeHead(200); return r.end("ok"); }
    r.writeHead(404); r.end();
  } catch (e) { r.writeHead(500); r.end(String(e)); }
}).listen(port, "0.0.0.0", () => {
  const ips = Object.values(os.networkInterfaces()).flat().filter((a) => a && a.family === "IPv4" && !a.internal).map((a) => a.address);
  console.log(`صفحة التصحيح: ${ips.map((ip) => `http://${ip}:${port}/`).join("  ")}`);
});
