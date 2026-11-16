// Episode date for the counter bar (TitleBar): the RECORDING's date (user order 2026-11-16: «التاريخ من تاريخ التسجيل»).
//   node tools/episode_date.mjs <p> [--write]      prints yyyy-mm-dd; --write puts it in data/specs/<p>.json as "date"
// Source: .tmp/<p>/prep_config.json "original" (the file given to stage prep) → its container creation_time (ffprobe), else its modified time.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

export const recordingDate = (p) => {
  let orig = null;
  /* a reel or a stream slice has no prep of its own: use the project it was cut from */
  for (const q of [p, p.replace(/[-_]reel$/, ""), p.replace(/_(d+[a-z]?|rd+)$/, "")]) {
    try { orig = JSON.parse(fs.readFileSync(path.join(".tmp", q, "prep_config.json"), "utf8")).original; break; } catch { /* next */ }
  }
  if (!orig || !fs.existsSync(orig)) return null;
  const r = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format_tags=creation_time", "-of", "default=nw=1:nk=1", orig], { encoding: "utf8", windowsHide: true });
  const ct = (r.stdout || "").trim();
  const d = /^\d{4}-\d{2}-\d{2}/.test(ct) && !ct.startsWith("1970") ? new Date(ct) : fs.statSync(orig).mtime;
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve("tools/episode_date.mjs")) {
  const p = process.argv[2];
  if (!p) { console.error("usage: node tools/episode_date.mjs <p> [--write]"); process.exit(2); }
  const d = recordingDate(p);
  if (!d) { console.log(`✘ ${p}: لا أجد التسجيل الأصلي (prep_config.json)`); process.exit(1); }
  if (process.argv.includes("--write")) {
    const f = path.join("data", "specs", `${p}.json`), raw = fs.readFileSync(f, "utf8"), crlf = raw.includes("\r\n"), s = JSON.parse(raw);
    s.date = d; let out = JSON.stringify(s, null, /\n  "/.test(raw) ? 2 : 1); if (crlf) out = out.replace(/\n/g, "\r\n");
    fs.writeFileSync(f, out + (raw.endsWith("\n") ? (crlf ? "\r\n" : "\n") : ""));
  }
  console.log(`✔ ${p}: ${d}`);
}
