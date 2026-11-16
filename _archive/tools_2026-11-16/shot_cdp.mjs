// Screenshot a news page through headless Chrome (CDP). node tools/shot_cdp.mjs <url> <out.png> [w=1000] [h=1500]
import { spawn } from "node:child_process"; import fs from "node:fs";
const [url, out, W = "1000", H = "1500", needle] = process.argv.slice(2);
const port = 9400 + Math.floor(Math.random() * 400);
const ch = spawn("C:/Program Files/Google/Chrome/Application/chrome.exe", ["--headless=new", "--no-sandbox", "--disable-gpu", `--remote-debugging-port=${port}`, `--user-data-dir=S:/AI_Tools/Remotion_Workspace/.tmp/cdp_${port}`, `--window-size=${W},${H}`, "--hide-scrollbars", "--disable-blink-features=AutomationControlled", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let targets; for (let i = 0; i < 40; i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (targets.length) break; } catch {} await sleep(500); }
const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pend = new Map();
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } };
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await send("Emulation.setDeviceMetricsOverride", { width: Number(W), height: Number(H), deviceScaleFactor: 1, mobile: false });
await send("Network.setUserAgentOverride", { userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36" });
await send("Page.navigate", { url });
await sleep(9000);
// remove cookie walls / overlays (hiding them, never accepting) and un-blur the article
await send("Runtime.evaluate", { expression: `(()=>{const kill=[...document.querySelectorAll("*")].filter(e=>{const c=getComputedStyle(e);return (c.position==="fixed"||c.position==="sticky")&&(parseInt(c.zIndex)||0)>=10&&e!==document.body}); kill.forEach(e=>e.remove()); document.querySelectorAll("[class*=cookie],[id*=cookie],[class*=consent],[id*=consent],[class*=onetrust],[id*=onetrust],[class*=cmp],[id*=sp_message],[class*=modal],[class*=overlay],[class*=paywall]").forEach(e=>{if(e.offsetHeight>0&&e!==document.body&&!e.contains(document.querySelector("h1")))e.remove()}); document.querySelectorAll("*").forEach(e=>{const c=getComputedStyle(e); if(c.filter&&c.filter.includes("blur"))e.style.filter="none"}); [...document.querySelectorAll("div,section,aside")].filter(e=>/Support Independent Journalism|We Care About Your Privacy/.test(e.innerText||"")&&(e.innerText||"").length<1500).forEach(e=>e.remove()); document.documentElement.style.overflow="visible"; document.body.style.overflow="visible"; document.body.style.filter="none";})()` });
await sleep(800);
if (needle) { const q = await send("Runtime.evaluate", { returnByValue: true, expression: `(()=>{const out=[];const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode()){const i=n.textContent.search(/${needle}/i);if(i>=0){const rg=document.createRange();rg.setStart(n,i);rg.setEnd(n,Math.min(n.textContent.length,i+12));const b=rg.getBoundingClientRect();const p=n.parentElement.getBoundingClientRect();out.push({word:[Math.round(b.x),Math.round(b.y+scrollY),Math.round(b.width),Math.round(b.height)],para:[Math.round(p.x),Math.round(p.y+scrollY),Math.round(p.width),Math.round(p.height)]})}}return JSON.stringify(out)})()` }); console.log("RECT", q.result.result.value); }
const r = await send("Page.captureScreenshot", { format: "png" });
fs.writeFileSync(out, Buffer.from(r.result.data, "base64"));
const t = await send("Runtime.evaluate", { expression: "document.title" });
console.log("saved", out, t.result?.result?.value);
ws.close(); ch.kill();
