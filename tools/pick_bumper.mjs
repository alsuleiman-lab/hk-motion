// فواصل الافتتاح (أمر المستخدم 2026-11-11): قبل أول كلمة في أي فيديو (بسم الله / السلام عليكم) يُوضع فاصل 5ث يُختار عشوائياً من public/fawasel.
//   node tools/pick_bumper.mjs pick [--not <id>]           -> يطبع JSON للفاصل المختار (من المرندَرة فقط): {id,title,file,path,seconds}
//   node tools/pick_bumper.mjs list                        -> يعدّد الفواصل وحالتها
//   node tools/pick_bumper.mjs add <id> <ملف.mp4>          -> ينسخ الملف العرضي إلى public/fawasel/<file> ويعلّم الفاصل مرندَراً
//   node tools/pick_bumper.mjs addp <id> <ملف.mp4>         -> النسخة الطولية (fileP)
import fs from "node:fs";
import path from "node:path";
const root = path.resolve(import.meta.dirname, "..");
const dir = path.join(root, "public", "fawasel"), mf = path.join(dir, "manifest.json");
const data = JSON.parse(fs.readFileSync(mf, "utf8"));
const [cmd, a, b] = process.argv.slice(2);
if (cmd === "list") { for (const x of data.bumpers) console.log(`${x.rendered && fs.existsSync(path.join(dir, x.file)) ? "✔" : "✘"} ${x.id} (${x.title}) ${x.file}`); }
else if (cmd === "addp") {
  const x = data.bumpers.find((y) => y.id === a); if (!x || !b || !fs.existsSync(b)) { console.error("usage: addp <id> <file.mp4>"); process.exit(2); }
  fs.copyFileSync(b, path.join(dir, x.fileP)); x.renderedP = true; fs.writeFileSync(mf, JSON.stringify(data, null, 2) + "\n"); console.log("added portrait", x.id);
} else if (cmd === "add") {
  const x = data.bumpers.find((y) => y.id === a); if (!x || !b || !fs.existsSync(b)) { console.error("usage: add <id> <file.mp4>"); process.exit(2); }
  fs.copyFileSync(b, path.join(dir, x.file)); x.rendered = true; fs.writeFileSync(mf, JSON.stringify(data, null, 2) + "\n"); console.log("added", x.id);
} else if (cmd === "pick") {
  const skip = process.argv.includes("--not") ? process.argv[process.argv.indexOf("--not") + 1] : "";
  const ok = data.bumpers.filter((x) => x.rendered && x.id !== skip && fs.existsSync(path.join(dir, x.file)));
  if (!ok.length) { console.error("لا فاصل مرندَر في public/fawasel"); process.exit(1); }
  const x = ok[Math.floor(Math.random() * ok.length)];
  console.log(JSON.stringify({ id: x.id, title: x.title, file: `fawasel/${x.file}`, path: path.join(dir, x.file), seconds: x.seconds }));
} else { console.error("usage: pick_bumper.mjs pick|list|add"); process.exit(2); }
