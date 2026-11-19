// THE READINESS ANNOUNCEMENT (user 2026-11-19: «أنت ما أرسلت لي إنه الفيديو جاهز ولا مو جاهز. التعليمات تقول لك أن ترسل لي رابط الفيديو عندما يكون جاهزاً»).
// Step 10 of شجرة_العمليات.md ends ONLY with this: it checks that the review link really opens (tools/lan_link.mjs: the current LAN address, answered),
// records .tmp/<p>/ready.json and prints the message to send AS IS — the first line says plainly ready or not, the link alone on its own line.
// Then a phone notification with the same first line (the agent's push-notification tool).
//   node tools/ready.mjs <p> <CompositionId> [--port 3200] [--not "ما الذي بقي"]
// --not: the video is NOT ready yet → the message says so and what is left (no link is offered as if it were finished).
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const a = process.argv.slice(2), [p, comp] = a, opt = (k, d) => (a.includes("--" + k) ? a[a.indexOf("--" + k) + 1] : d);
if (!p || !comp) { console.error("usage: node tools/ready.mjs <p> <CompositionId> [--port 3200] [--not \"…\"]"); process.exit(2); }
const notYet = opt("not", "");
const titles = (() => { try { return fs.readFileSync("src/compositionTitles.ts", "utf8"); } catch { return ""; } })();
const m = new RegExp(`["']${comp.replace(/[-]/g, "\\-")}["']\\s*:\\s*["']([^"']+)["']`).exec(titles);
const name = m?.[1] ?? (() => { try { return JSON.parse(fs.readFileSync(path.join("data", "specs", `${p}.json`), "utf8")).title; } catch { return p; } })();
const out = (lines) => { console.log(lines.join("\n")); };

if (notYet) {
  fs.writeFileSync(path.join(".tmp", p, "ready.json"), JSON.stringify({ comp, ready: false, left: notYet, at: new Date().toISOString() }, null, 1));
  out([`ليس جاهزاً بعد: «${name}»`, `بقي: ${notYet}`]);
  process.exit(0);
}
const r = spawnSync(process.execPath, ["tools/lan_link.mjs", comp, "--port", opt("port", "3200")], { encoding: "utf8" });
const link = (r.stdout || "").trim().split("\n").filter((l) => /^https?:\/\//.test(l)).pop();
if (r.status !== 0 || !link) {
  out([`✘ لا يُعلن: الرابط لا يفتح (${(r.stderr || r.stdout || "").trim().slice(0, 160)})`, "شغّل الاستوديو أولاً (bash tools/bg.sh studio -- npx remotion studio --port=3200 --no-open) ثم أعد"]);
  process.exit(1);
}
fs.writeFileSync(path.join(".tmp", p, "ready.json"), JSON.stringify({ comp, ready: true, link, at: new Date().toISOString() }, null, 1));
out([`الفيديو جاهز للمراجعة: «${name}»`, link]);
