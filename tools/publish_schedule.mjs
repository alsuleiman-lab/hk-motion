// YouTube scheduling ledger (user 2026-11-16: «إذا جدولت ما يصير نجدول … بنفس اليوم أكثر من فيديو، فأنت تنتبه»). data/publish_schedule.json.
//   node tools/publish_schedule.mjs check <yyyy-mm-dd> [--channel main|replies]   → exit 1 + the video(s) already on that day for that channel
//   node tools/publish_schedule.mjs add <p> <yyyy-mm-dd> <hh:mm> --channel main|replies --title "…"   (after the schedule is set in Studio and verified)
//   node tools/publish_schedule.mjs free [--channel …] [--from yyyy-mm-dd]   → the next 5 days with nothing scheduled
//   node tools/publish_schedule.mjs list
import fs from "node:fs";
const F = "data/publish_schedule.json";
const argv = process.argv.slice(2), opt = (k, d) => (argv.includes("--" + k) ? argv[argv.indexOf("--" + k) + 1] : d);
const rows = fs.existsSync(F) ? JSON.parse(fs.readFileSync(F, "utf8")) : [];
const [cmd, a, b, c] = argv;
const ch = opt("channel", null), same = (r) => !ch || r.channel === ch;
if (cmd === "check") {
  const hit = rows.filter((r) => r.date === a && same(r));
  if (!hit.length) { console.log(`✔ ${a}: لا فيديو مجدول${ch ? " في هذه القناة" : ""}`); process.exit(0); }
  console.log(`✘ ${a}: مجدول فيه من قبل: ${hit.map((r) => `«${r.title}» ${r.time}`).join("، ")}`); process.exit(1);
} else if (cmd === "add") {
  if (!a || !b || !c || !ch) { console.error('usage: add <p> <yyyy-mm-dd> <hh:mm> --channel main|replies --title "…"'); process.exit(2); }
  rows.push({ p: a, date: b, time: c, channel: ch, title: opt("title", a), at: new Date().toISOString() });
  fs.writeFileSync(F, JSON.stringify(rows, null, 1)); console.log(`✔ سُجّل «${opt("title", a)}» في ${b} ${c}`);
} else if (cmd === "free") {
  const d = new Date(opt("from", new Date().toLocaleDateString("sv"))), out = [];
  for (let k = 0; out.length < 5 && k < 60; k++) { const s = new Date(d.getTime() + k * 864e5).toISOString().slice(0, 10); if (!rows.some((r) => r.date === s && same(r))) out.push(s); }
  console.log(out.join(" "));
} else if (cmd === "list") { for (const r of rows.sort((x, y) => (x.date + x.time).localeCompare(y.date + y.time))) console.log(`${r.date} ${r.time} [${r.channel}] ${r.title}`); }
else { console.error("usage: check|add|free|list (see header)"); process.exit(2); }
