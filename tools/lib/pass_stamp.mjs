// A passed check is not re-run while nothing it looked at changed (user 2026-10-29: «فحوصك تافهة وطويلة» — face_fast passed, then stage check ran it again for 7 min).
//   stampOf(id, specF)            sha1 of the composition id + the spec file content + every src/** file (size|mtime)
//   isFresh(name, id, specF)      true when .tmp/gates/<name>.<id>.pass holds the same stamp
//   writePass(name, id, specF)    record a pass
import fs from "node:fs"; import path from "node:path"; import crypto from "node:crypto";

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
export function stampOf(id, specF) {
  const h = crypto.createHash("sha1").update(`${id}\n`);
  try { h.update(fs.readFileSync(specF)); } catch { h.update("no-spec"); }
  for (const f of walk("src").sort()) { const st = fs.statSync(f); h.update(`${f}|${st.size}|${Math.round(st.mtimeMs)}\n`); }
  return h.digest("hex");
}
const fileOf = (name, id) => path.join(".tmp", "gates", `${name}.${id}.pass`);
export const isFresh = (name, id, specF) => { try { return fs.readFileSync(fileOf(name, id), "utf8") === stampOf(id, specF); } catch { return false; } };
export function writePass(name, id, specF) { fs.mkdirSync(path.join(".tmp", "gates"), { recursive: true }); fs.writeFileSync(fileOf(name, id), stampOf(id, specF)); }
