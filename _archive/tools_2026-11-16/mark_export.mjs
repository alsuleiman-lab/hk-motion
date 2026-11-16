// Standing rule (user): leftovers of a project are deleted 12 hours AFTER its export.
//   node tools/mark_export.mjs <project-name> <file-prefix> [--hours 12] [--exported <ISO time of the export>] [--dry]
// Run right after the final export. It writes .cleanup/<name>.json (what will be deleted + when) and schedules a Windows task that runs
// tools/cleanup_leftovers.mjs at export+12h. Deleted: heavy DERIVED files only (cut proxies, mattes, composed windows, test stills, logs, .tmp, Remotion temp).
// Shared folders (out, .tmp, public/matte, public/stock/prep) are cleaned ONLY for files older than the export time, so another project still in progress is never touched.
// NEVER deleted: the original recordings, the final videos (out is cleaned except the final render, which is already copied to Videos\جاهز), code, JSON maps/transcripts, PREFERENCES, memory.
import fs from "fs"; import path from "path"; import { execFileSync } from "child_process";
const [name, prefix, ...rest] = process.argv.slice(2);
const hi = rest.indexOf("--hours"); const hours = hi >= 0 ? parseFloat(rest[hi + 1]) : 12; const dry = rest.includes("--dry"); const now = rest.includes("--now");
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const pub = path.join(root, "public");
const paths = [];
for (const f of fs.readdirSync(pub)) {
  const p = path.join(pub, f); const st = fs.statSync(p);
  if (f.startsWith(prefix) && st.isFile() && /\.(mp4|mov|wav|m4a|webm)$/i.test(f)) paths.push(p);              // cut proxies, audio
  if (f === prefix + "win" || f === "matte") paths.push(p);                                                         // composed windows, work folders
  if (f === prefix && st.isDirectory()) for (const g of fs.readdirSync(p)) if (/.(mp4|mov|wav|m4a|webm)$/i.test(g)) paths.push(path.join(p, g)); // heavy files only: NEVER the transcripts (words*.json) inside
}
paths.push(path.join(pub, "stock", "prep"), path.join(root, ".tmp"), path.join(root, "out"));
// the hybrid render's frame caches (public/fr/<cut name>, 52 GB of finished projects were left there until 2026-11-11) and render work folders of this project
for (const dir of [path.join(pub, "fr"), path.join(root, "render_work")]) if (fs.existsSync(dir)) for (const g of fs.readdirSync(dir)) if (g.startsWith(prefix)) paths.push(path.join(dir, g));
// the project's own matte windows (public/<prefix>/mt) are derived too
if (fs.existsSync(path.join(pub, prefix, "mt"))) paths.push(path.join(pub, prefix, "mt"));
const ei = rest.indexOf("--exported"); const exportedAt = ei >= 0 ? new Date(rest[ei + 1]) : new Date();
const when = new Date(exportedAt.getTime() + hours * 3600 * 1000);
const manifest = { name, prefix, exported: exportedAt.toISOString(), deleteAt: when.toISOString(), paths: [...new Set(paths)].filter(fs.existsSync), keepInOut: ["README"] };
fs.mkdirSync(path.join(root, ".cleanup"), { recursive: true });
const mf = path.join(root, ".cleanup", name + ".json");
fs.writeFileSync(mf, JSON.stringify(manifest, null, 1));
console.log("manifest:", mf, "\nwill delete at", when.toLocaleString(), "\n" + manifest.paths.map((p) => " - " + p).join("\n"));
if (dry) process.exit(0);
if (now) { // new rule: delete the project's temporary files as soon as the user approves the result
  execFileSync(process.execPath, [path.join(root, "tools", "cleanup_leftovers.mjs"), mf], { stdio: "inherit" });
  console.log("cleaned now:", name);
  process.exit(0);
}
const pad = (n) => String(n).padStart(2, "0");
const sd = `${pad(when.getMonth() + 1)}/${pad(when.getDate())}/${when.getFullYear()}`, st = `${pad(when.getHours())}:${pad(when.getMinutes())}`;
execFileSync("schtasks", ["/Create", "/F", "/TN", "RemotionCleanup_" + name, "/SC", "ONCE", "/SD", sd, "/ST", st, "/TR", `"${process.execPath}" "${path.join(root, "tools", "cleanup_leftovers.mjs")}" "${mf}"`], { stdio: "inherit" });
console.log("scheduled task RemotionCleanup_" + name, "at", sd, st);
