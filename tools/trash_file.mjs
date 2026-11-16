// Send finished files to the Windows Recycle Bin AFTER their uploads are verified (skill approval; user 2026-11-16 «بعد الرفع … يتم حذف الملف من الكمبيوتر»).
//   node tools/trash_file.mjs "<file>" ["<file>" …]     (Recycle Bin, never a permanent delete; prints the space freed)
import fs from "node:fs";
import { spawnSync } from "node:child_process";
const files = process.argv.slice(2);
if (!files.length) { console.error('usage: node tools/trash_file.mjs "<file>" …'); process.exit(2); }
let freed = 0, bad = 0;
for (const f of files) {
  if (!fs.existsSync(f)) { console.log(`– غير موجود: ${f}`); continue; }
  const size = fs.statSync(f).size;
  const r = spawnSync("powershell", ["-NoProfile", "-Command", "Add-Type -AssemblyName Microsoft.VisualBasic; [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile($env:TF, 'OnlyErrorDialogs', 'SendToRecycleBin')"], { env: { ...process.env, TF: f }, encoding: "utf8", windowsHide: true });
  if (r.status === 0 && !fs.existsSync(f)) { freed += size; console.log(`✔ إلى سلة المحذوفات: ${f}`); } else { bad++; console.log(`✘ لم يُحذف: ${f} ${(r.stderr || "").trim().split("\n")[0]}`); }
}
console.log(`أُفرغ ${(freed / 1e9).toFixed(2)} غيغا`);
process.exit(bad ? 1 : 0);
