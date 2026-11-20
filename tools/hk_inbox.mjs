// THE «راسلني» INBOX (user 2026-11-20: «اجعل لي زر أراسلك من هناك أكتب لك صحح أو غير العنصر… من صفحة ريموشن»).
// The Studio's «راسلني» sheet posts to tools/hk_server.mjs, which appends to .tmp/hk_inbox.jsonl: {id, at, comp, frame, time, elements, text, reply}.
//   node tools/hk_inbox.mjs wait [--max MIN]    blocks until a message without a reply exists, prints it, exits 0 (run in the background: its end wakes
//                                               the agent's session). Nothing new before --max minutes (default 240) → exits 3 quietly.
//   node tools/hk_inbox.mjs open                the messages still without a reply
//   node tools/hk_inbox.mjs reply <id> "<text>"  writes the reply under that message (the Studio sheet shows it on its next refresh)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const F = path.join(ROOT, ".tmp", "hk_inbox.jsonl");
const read = () => { try { return fs.readFileSync(F, "utf8").split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l)); } catch { return []; } };
const open = () => read().filter((m) => !m.reply);
const show = (m) => `#${m.id} · ${m.comp} · ${m.time} (الإطار ${m.frame})${m.elements ? ` · على الشاشة: ${m.elements}` : ""}\n  «${m.text}»`;
const [cmd, ...a] = process.argv.slice(2);

if (cmd === "wait") {
  const max = Number(a.includes("--max") ? a[a.indexOf("--max") + 1] : 240) * 60e3, t0 = Date.now();
  const tick = () => {
    const o = open();
    if (o.length) { console.log(`رسالة من الاستوديو (${o.length}):\n` + o.map(show).join("\n")); process.exit(0); }
    if (Date.now() - t0 > max) process.exit(3);
    setTimeout(tick, 3000);
  };
  tick();
} else if (cmd === "open") {
  const o = open(); console.log(o.length ? o.map(show).join("\n") : "لا رسائل بلا رد");
} else if (cmd === "reply") {
  const [id, ...rest] = a, text = rest.join(" ").trim();
  if (!id || !text) { console.error('usage: node tools/hk_inbox.mjs reply <id> "<text>"'); process.exit(2); }
  const all = read(), m = all.find((x) => x.id === id.replace(/^#/, ""));
  if (!m) { console.error(`✘ لا رسالة ${id}`); process.exit(1); }
  m.reply = { at: new Date().toISOString(), text };
  fs.writeFileSync(F + ".tmp", all.map((x) => JSON.stringify(x)).join("\n") + "\n"); fs.renameSync(F + ".tmp", F);
  console.log(`✔ كُتب الرد تحت #${m.id}`);
} else { console.error("usage: node tools/hk_inbox.mjs wait [--max MIN] | open | reply <id> \"<text>\""); process.exit(2); }
