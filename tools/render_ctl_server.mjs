// Tiny local control page for a running render: pause / resume (suspends the render process tree). Open http://localhost:3199/
// The Janib side panel card links here, so clicking the card opens the two big buttons.
import http from "node:http";
import { spawn } from "node:child_process";
import fs from "node:fs";
const match = process.argv[2] ?? "baraka_render";
const logFile = process.argv[3] ?? "render_work/baraka_render_port.log";
let state = "جارٍ";
const ps = (action) => new Promise((res) => { const p = spawn("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", "tools/render_ctl.ps1", action, match]); let o = ""; p.stdout.on("data", (d) => (o += d)); p.on("close", () => res(o.trim())); });
const progress = () => { try { const l = fs.readFileSync(logFile, "utf8").split(/\r?\n/).filter((x) => /^\[(land|port)\]/.test(x)).pop(); return l ?? "—"; } catch { return "—"; } };
http.createServer(async (req, res) => {
  const u = req.url ?? "/";
  if (u.startsWith("/pause")) { const r = await ps("pause"); if (r !== "none") state = "متوقَّف مؤقتاً"; }
  if (u.startsWith("/resume")) { const r = await ps("resume"); if (r !== "none") state = "جارٍ"; }
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>التحكم بالرندر</title>
<body style="font-family:Segoe UI,Tahoma,sans-serif;background:#143357;color:#fff;text-align:center;padding:30px;direction:rtl">
<h2>رندر «بركة وزير الأوقاف»</h2><p style="font-size:22px">الحالة: <b>${state}</b></p><p style="direction:ltr;font-size:20px;opacity:.85">${progress()}</p>
<a href="/pause" style="display:block;margin:18px auto;max-width:360px;padding:22px;background:#f3c34a;color:#10282a;font-size:28px;border-radius:16px;text-decoration:none">⏸ إيقاف مؤقت</a>
<a href="/resume" style="display:block;margin:18px auto;max-width:360px;padding:22px;background:#6fe3d8;color:#10282a;font-size:28px;border-radius:16px;text-decoration:none">▶ إكمال</a>
<a href="/" style="color:#bcd0e8">تحديث</a></body>`);
}).listen(3199, "127.0.0.1", () => console.log("render control on http://localhost:3199/"));
