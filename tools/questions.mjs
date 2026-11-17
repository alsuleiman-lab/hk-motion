// QUESTIONS PAGE (user order 2026-11-10: «صفحة HTML تكتب فيها أسئلتك وتفتحها بجنب المحادثة، أجاوب وقت ما بدي، المهم أنك تظل شغال»).
// Questions that do not block the work (is this the right picture? a verse slip, a hadith number, a source) go here; the work goes on and the answers are read when they come.
//   node tools/questions.mjs serve                         → http://localhost:3110/?p=<project>  (open it in the preview pane beside the chat; LAN IP for the phone)
//   node tools/questions.mjs add <p> --id ID --q "النص" [--img public/…] [--video public/…mp4 --t0 12 --t1 20] [--link URL] [--opts "أ|ب|ج"] [--multi]
//   node tools/questions.mjs answers <p>                   → prints the answers (also .tmp/<p>/answers.json)
//   node tools/questions.mjs open <p>                      → prints unanswered questions
// Files: .tmp/<p>/questions.json (mine) and .tmp/<p>/answers.json (the page writes it; each answer appended to answers.log for a Monitor).
import fs from "node:fs"; import path from "node:path"; import http from "node:http";

const root = path.resolve(import.meta.dirname, "..");
const qFile = (p) => path.join(root, ".tmp", p, "questions.json"), aFile = (p) => path.join(root, ".tmp", p, "answers.json");
const read = (f, d) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return d; } };
const write = (f, v) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f + ".part", JSON.stringify(v, null, 1)); fs.renameSync(f + ".part", f); };

export function addQuestion(p, q) {
  if (!q.id || !q.q) throw new Error("question needs id and q");
  const all = read(qFile(p), []), i = all.findIndex((x) => x.id === q.id), item = { added: new Date().toISOString(), ...q };
  if (i >= 0) all[i] = { ...all[i], ...item }; else all.push(item);
  write(qFile(p), all);
  return item;
}
export const answers = (p) => read(aFile(p), {});

const PAGE = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>أسئلة المونتاج</title>
<style>
/* (user 2026-11-18: «ما أدري أنا عم أكتب ملاحظات وتختفي… حطلي خيارات… خلية… يحفظ ملاحظاتي») a sheet: one row per item, a choice cell and a note cell; notes save as you type, nothing is redrawn under your hands, the order never changes */
:root{--bg:#14161b;--card:#1d2027;--line:#2c313b;--txt:#e9e6df;--mut:#9aa0aa;--acc:#d9a441;--ok:#5fb37a;--warn:#e07b5f}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--txt);font:16px/1.6 "Segoe UI",Tahoma,sans-serif}
header{position:sticky;top:0;background:var(--bg);border-bottom:1px solid var(--line);padding:10px 16px;display:flex;gap:12px;align-items:center;z-index:2;flex-wrap:wrap}
h1{font-size:18px;margin:0;flex:1}select{background:var(--card);color:var(--txt);border:1px solid var(--line);border-radius:8px;padding:6px 10px;font:inherit}
.pill{font-size:14px;color:var(--mut)}main{max-width:1400px;margin:0 auto;padding:12px 16px}
.row{display:grid;grid-template-columns:44px minmax(0,2.2fr) minmax(0,1fr) minmax(0,1.6fr);border:1px solid var(--line);border-top:none;background:var(--card)}
.row.head{position:sticky;top:57px;z-index:1;background:#232733;font-weight:600;border-top:1px solid var(--line);border-radius:10px 10px 0 0}
.row>div{padding:10px 12px;border-inline-start:1px solid var(--line);min-width:0}.row>div:first-child{border-inline-start:none;color:var(--mut);text-align:center}
.row.answered{background:#1b2420}.txt{white-space:pre-wrap}.kind{display:inline-block;font-size:12px;color:var(--acc);border:1px solid var(--acc);border-radius:20px;padding:0 8px;margin-bottom:4px}
img{max-width:100%;max-height:320px;border-radius:8px;display:block;margin:6px 0}video{width:100%;max-height:320px;border-radius:8px;background:#000;margin:6px 0}a{color:var(--acc)}
.opts{display:flex;flex-direction:column;gap:6px}button{font:inherit;font-size:15px;background:#262a33;color:var(--txt);border:1px solid var(--line);border-radius:8px;padding:6px 10px;cursor:pointer;text-align:start}
button:hover{border-color:var(--acc)}button.sel{background:var(--acc);color:#14161b;border-color:var(--acc);font-weight:600}
textarea{width:100%;min-height:70px;background:#262a33;color:var(--txt);border:1px solid var(--line);border-radius:8px;padding:8px;font:inherit;resize:vertical}
textarea:focus{outline:none;border-color:var(--acc)}.st{font-size:13px;color:var(--mut);margin-top:4px;min-height:18px}.st.ok{color:var(--ok)}.st.err{color:var(--warn)}
.empty{color:var(--mut);text-align:center;padding:40px}
@media (max-width:760px){.row{grid-template-columns:1fr;border-top:1px solid var(--line);border-radius:10px;margin-bottom:12px}.row.head{display:none}.row>div{border-inline-start:none;border-top:1px solid var(--line)}.row>div:first-child{text-align:start;border-top:none}}
</style></head><body><header><h1>أسئلة المونتاج</h1><select id="proj"></select><span class="pill" id="count"></span></header><main id="list"></main>
<script>
const qs=new URLSearchParams(location.search);let P=qs.get("p")||"";let built="";const dirty={};const timers={};
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c]);
async function projects(){const r=await fetch("/api/projects");const ps=await r.json();const s=document.getElementById("proj");s.innerHTML=ps.map(x=>'<option'+(x.p===P?' selected':'')+'>'+esc(x.p)+'</option>').join("");if(!P&&ps[0]){P=ps[0].p;}s.onchange=()=>{P=s.value;history.replaceState(0,"","?p="+encodeURIComponent(P));built="";load()};}
async function save(id,body,st){try{const r=await fetch("/api/answer?p="+encodeURIComponent(P),{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(Object.assign({id},body))});if(!r.ok)throw 0;if(st){st.textContent="✔ حُفظت";st.className="st ok";}return true;}catch(e){if(st){st.textContent="✘ لم تُحفظ — أعيد المحاولة";st.className="st err";}await new Promise(z=>setTimeout(z,3000));return save(id,body,st);}}
function row(q,a,n){const f=s=>"/file?path="+encodeURIComponent(s);const sel=a&&a.answer!=null?[].concat(a.answer):[];
let c='<div class="txt">'+(q.kind?'<span class="kind">'+esc(q.kind)+'</span><br>':'')+esc(q.q)+'</div>';
for(const im of [].concat(q.img||[]))c+='<img loading="lazy" src="'+f(im)+'">';
if(q.video)c+='<video controls preload="metadata" src="'+f(q.video.src)+'#t='+(q.video.t0||0)+(q.video.t1?','+q.video.t1:'')+'"></video>';
for(const l of [].concat(q.link||[]))c+='<div><a target="_blank" href="'+esc(l)+'">'+esc(l)+'</a></div>';
const o=q.opts?'<div class="opts">'+q.opts.map(x=>'<button class="'+(sel.includes(x)?'sel':'')+'" data-o="'+esc(x)+'">'+esc(x)+'</button>').join("")+'</div>':'<div class="pill">اكتب جوابك في الملاحظة</div>';
return '<div class="row'+(sel.length||(a&&a.note)?' answered':'')+'" id="q_'+esc(q.id)+'"><div>'+n+'</div><div>'+c+'</div><div>'+o+'</div><div><textarea placeholder="ملاحظتك هنا — تُحفظ وحدها أثناء الكتابة">'+esc(a&&a.note||"")+'</textarea><div class="st">'+(a&&a.note?'✔ محفوظة':'')+'</div></div></div>';}
function counts(d){const n=d.questions.length,k=d.questions.filter(q=>{const a=d.answers[q.id];return a&&(a.answer!=null||a.note);}).length;document.getElementById("count").textContent=k+" من "+n+" مُجاب — كل شيء يُحفظ وحده";}
async function load(){if(!P)return;let d;try{d=await (await fetch("/api/q?p="+encodeURIComponent(P))).json();}catch(e){return;}
const key=P+"|"+d.questions.map(q=>q.id+q.q).join("|");const L=document.getElementById("list");counts(d);
if(key!==built){built=key;
L.innerHTML=d.questions.length?'<div class="row head"><div>#</div><div>البند</div><div>اختيارك</div><div>ملاحظتك</div></div>'+d.questions.map((q,i)=>row(q,d.answers[q.id],i+1)).join(""):'<div class="empty">لا أسئلة الآن — أعمل في الخلفية</div>';
for(const q of d.questions){const el=document.getElementById("q_"+q.id);if(!el)continue;const ta=el.querySelector("textarea"),st=el.querySelector(".st");
el.querySelectorAll("button[data-o]").forEach(b=>b.onclick=()=>{if(q.multi){b.classList.toggle("sel");}else{el.querySelectorAll("button[data-o]").forEach(x=>x.classList.remove("sel"));b.classList.add("sel");}
const s=[...el.querySelectorAll("button.sel")].map(x=>x.dataset.o);el.classList.add("answered");save(q.id,{answer:q.multi?s:(s[0]??null),note:ta.value.trim()},st);});
ta.oninput=()=>{dirty[q.id]=1;st.textContent="… أحفظ";st.className="st";clearTimeout(timers[q.id]);timers[q.id]=setTimeout(async()=>{if(await save(q.id,{note:ta.value.trim()},st)){delete dirty[q.id];if(ta.value.trim())el.classList.add("answered");}},700);};
ta.onblur=()=>{if(dirty[q.id]){clearTimeout(timers[q.id]);save(q.id,{note:ta.value.trim()},st).then(ok=>{if(ok)delete dirty[q.id];});}};}
return;}
/* later polls never rebuild the list: they only refresh rows you are not editing (an answer given from another device) */
for(const q of d.questions){const el=document.getElementById("q_"+q.id);if(!el)continue;const a=d.answers[q.id]||{};const ta=el.querySelector("textarea");
if(!dirty[q.id]&&document.activeElement!==ta&&a.note!=null&&(a.note||"")!==ta.value.trim())ta.value=a.note;
const sel=a.answer!=null?[].concat(a.answer):null;if(sel)el.querySelectorAll("button[data-o]").forEach(b=>b.classList.toggle("sel",sel.includes(b.dataset.o)));}}
window.addEventListener("beforeunload",e=>{if(Object.keys(dirty).length){e.preventDefault();e.returnValue="";}});
projects().then(load);setInterval(load,5000);
</script></body></html>`;

const mime = { ".mp4": "video/mp4", ".webm": "video/webm", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif", ".svg": "image/svg+xml", ".wav": "audio/wav", ".mp3": "audio/mpeg" };
function serve(port = 3110) {
  http.createServer((req, res) => {
    const u = new URL(req.url, "http://x"), p = (u.searchParams.get("p") ?? "").replace(/[^\w\-]/g, "");
    const json = (v) => { res.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }); res.end(JSON.stringify(v)); };
    if (u.pathname === "/") { res.writeHead(200, { "content-type": "text/html; charset=utf-8" }); return res.end(PAGE); }
    if (u.pathname === "/api/projects") {
      const dirs = fs.readdirSync(path.join(root, ".tmp"), { withFileTypes: true }).filter((d) => d.isDirectory() && fs.existsSync(qFile(d.name)));
      return json(dirs.map((d) => ({ p: d.name, t: fs.statSync(qFile(d.name)).mtimeMs })).sort((a, b) => b.t - a.t));
    }
    if (u.pathname === "/api/q") return json({ questions: read(qFile(p), []), answers: read(aFile(p), {}) });
    if (u.pathname === "/api/answer" && req.method === "POST") {
      const chunks = []; req.on("data", (d) => chunks.push(d)); req.on("end", () => {
        const body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"), { id } = body; const all = read(aFile(p), {});
        /* (2026-11-18) a note saves on its own and never erases the chosen answer, and a choice never erases the note */
        const prev = all[id] ?? {}, answer = "answer" in body ? body.answer : prev.answer, note = "note" in body ? body.note : prev.note;
        all[id] = { answer, note, at: new Date().toISOString() }; write(aFile(p), all);
        fs.appendFileSync(path.join(root, ".tmp", p, "answers.log"), `${new Date().toLocaleTimeString()} ${id}: ${[].concat(answer).join("، ")}${note ? " — " + note : ""}\n`);
        json({ ok: true });
      }); return;
    }
    if (u.pathname === "/file") {
      const f = path.resolve(root, u.searchParams.get("path") ?? "");
      if (!(f.startsWith(path.join(root, "public")) || f.startsWith(path.join(root, ".tmp"))) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
      const size = fs.statSync(f).size, type = mime[path.extname(f).toLowerCase()] ?? "application/octet-stream", r = /bytes=(\d*)-(\d*)/.exec(req.headers.range ?? "");
      if (r) { const a = r[1] ? Number(r[1]) : 0, b = r[2] ? Number(r[2]) : Math.min(size - 1, a + 8e6); res.writeHead(206, { "content-type": type, "content-range": `bytes ${a}-${b}/${size}`, "accept-ranges": "bytes", "content-length": b - a + 1 }); return fs.createReadStream(f, { start: a, end: b }).pipe(res); }
      res.writeHead(200, { "content-type": type, "content-length": size, "accept-ranges": "bytes" }); return fs.createReadStream(f).pipe(res);
    }
    res.writeHead(404); res.end();
  }).listen(port, "0.0.0.0", () => console.log(`questions page: http://localhost:${port}/`));
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, "/")}` || process.argv[1]?.endsWith("questions.mjs")) {
  const [cmd, p, ...rest] = process.argv.slice(2), opt = (k) => { const i = rest.indexOf("--" + k); return i < 0 ? undefined : rest[i + 1]; };
  if (cmd === "serve") serve(Number(p) || 3110);
  else if (cmd === "add" && p) {
    const video = opt("video") ? { src: opt("video"), t0: Number(opt("t0") ?? 0), t1: opt("t1") ? Number(opt("t1")) : undefined } : undefined;
    const q = addQuestion(p, { id: opt("id"), kind: opt("kind"), q: opt("q"), img: opt("img")?.split(","), video, link: opt("link")?.split(","), opts: opt("opts")?.split("|"), multi: rest.includes("--multi") || undefined });
    console.log(`+ ${q.id} → http://localhost:3110/?p=${p}`);
  } else if (cmd === "answers" && p) { for (const [id, a] of Object.entries(answers(p))) console.log(`${id}: ${[].concat(a.answer).join("، ")}${a.note ? " — " + a.note : ""}`); }
  else if (cmd === "open" && p) { const a = answers(p); for (const q of read(qFile(p), []).filter((x) => !a[x.id])) console.log(`${q.id}: ${q.q}`); }
  else { console.error("usage: node tools/questions.mjs serve | add <p> --id … --q … | answers <p> | open <p>"); process.exit(2); }
}
