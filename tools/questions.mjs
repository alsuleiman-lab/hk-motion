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
:root{--bg:#14161b;--card:#1d2027;--line:#2c313b;--txt:#e9e6df;--mut:#9aa0aa;--acc:#d9a441;--ok:#5fb37a}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--txt);font:17px/1.6 "Segoe UI",Tahoma,sans-serif}
header{position:sticky;top:0;background:var(--bg);border-bottom:1px solid var(--line);padding:12px 16px;display:flex;gap:12px;align-items:center;z-index:2}
h1{font-size:19px;margin:0;flex:1}select{background:var(--card);color:var(--txt);border:1px solid var(--line);border-radius:8px;padding:6px 10px;font:inherit}
.pill{font-size:14px;color:var(--mut)}main{max-width:880px;margin:0 auto;padding:16px}
.q{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px;margin:0 0 14px}
.q.done{opacity:.55}.kind{display:inline-block;font-size:13px;color:var(--acc);border:1px solid var(--acc);border-radius:20px;padding:0 10px;margin-bottom:6px}
.txt{white-space:pre-wrap;margin:4px 0 10px}img{max-width:100%;max-height:420px;border-radius:10px;display:block;margin:8px 0}
video{width:100%;max-height:420px;border-radius:10px;background:#000;margin:8px 0}a{color:var(--acc)}
.opts{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}button{font:inherit;background:#262a33;color:var(--txt);border:1px solid var(--line);border-radius:10px;padding:8px 14px;cursor:pointer}
button:hover{border-color:var(--acc)}button.sel{background:var(--acc);color:#14161b;border-color:var(--acc)}
textarea{width:100%;min-height:44px;margin-top:8px;background:#262a33;color:var(--txt);border:1px solid var(--line);border-radius:10px;padding:8px;font:inherit}
.ans{color:var(--ok);font-size:15px;margin-top:6px}.empty{color:var(--mut);text-align:center;padding:40px}
</style></head><body><header><h1>أسئلة المونتاج</h1><select id="proj"></select><span class="pill" id="count"></span></header><main id="list"></main>
<script>
const qs=new URLSearchParams(location.search);let P=qs.get("p")||"";let last="";
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c]);
async function projects(){const r=await fetch("/api/projects");const ps=await r.json();const s=document.getElementById("proj");s.innerHTML=ps.map(x=>'<option'+(x.p===P?' selected':'')+'>'+esc(x.p)+'</option>').join("");if(!P&&ps[0]){P=ps[0].p;}s.onchange=()=>{P=s.value;history.replaceState(0,"","?p="+encodeURIComponent(P));last="";load()};}
async function send(id,answer,note){await fetch("/api/answer?p="+encodeURIComponent(P),{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({id,answer,note})});last="";load();}
function card(q,a){const done=a&&a.answer!=null;const f=s=>"/file?path="+encodeURIComponent(s);
let h='<div class="q'+(done?' done':'')+'" id="q_'+esc(q.id)+'">'+(q.kind?'<span class="kind">'+esc(q.kind)+'</span>':'')+'<div class="txt">'+esc(q.q)+'</div>';
for(const im of [].concat(q.img||[]))h+='<img loading="lazy" src="'+f(im)+'">';
if(q.video)h+='<video controls preload="metadata" src="'+f(q.video.src)+'#t='+(q.video.t0||0)+(q.video.t1?','+q.video.t1:'')+'"></video>';
for(const l of [].concat(q.link||[]))h+='<div><a target="_blank" href="'+esc(l)+'">'+esc(l)+'</a></div>';
const sel=done?[].concat(a.answer):[];
if(q.opts)h+='<div class="opts">'+q.opts.map(o=>'<button class="'+(sel.includes(o)?'sel':'')+'" data-o="'+esc(o)+'">'+esc(o)+'</button>').join("")+(q.multi?'<button data-send="1">إرسال</button>':'')+'</div>';
h+='<textarea placeholder="ملاحظة أو جواب آخر…">'+esc(a&&a.note||"")+'</textarea>'+(q.opts?'':'<div class="opts"><button data-send="1">إرسال</button></div>');
if(done)h+='<div class="ans">✔ '+esc([].concat(a.answer).join("، "))+(a.note?' — '+esc(a.note):'')+'</div>';
return h+'</div>';}
async function load(){if(!P)return;const r=await fetch("/api/q?p="+encodeURIComponent(P));const d=await r.json();const sig=JSON.stringify(d);if(sig===last)return;last=sig;
const open=d.questions.filter(q=>!d.answers[q.id]),done=d.questions.filter(q=>d.answers[q.id]);
document.getElementById("count").textContent=open.length+" بانتظارك · "+done.length+" مُجاب";
const L=document.getElementById("list");const keep=document.activeElement&&document.activeElement.tagName==="TEXTAREA";if(keep)return;
L.innerHTML=(open.concat(done.reverse())).map(q=>card(q,d.answers[q.id])).join("")||'<div class="empty">لا أسئلة الآن — أعمل في الخلفية</div>';
for(const el of L.querySelectorAll(".q")){const id=el.id.slice(2),q=d.questions.find(x=>x.id===id),ta=el.querySelector("textarea");
el.querySelectorAll("button[data-o]").forEach(b=>b.onclick=()=>{if(q.multi){b.classList.toggle("sel");}else send(id,b.dataset.o,ta.value.trim()||undefined);});
const sb=el.querySelector("button[data-send]");if(sb)sb.onclick=()=>{const s=[...el.querySelectorAll("button.sel")].map(b=>b.dataset.o);send(id,q.opts?s:(ta.value.trim()||""),q.opts?(ta.value.trim()||undefined):undefined);};}}
projects().then(load);setInterval(load,3000);
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
        const { id, answer, note } = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"); const all = read(aFile(p), {});
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
