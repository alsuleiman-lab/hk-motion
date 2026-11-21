// A SCRATCH WORKSPACE FOR THE GATES (tools/montage_build.mjs, 2026-11-21). Most gates read data/specs/<p>.json by project name and chdir to their own
// workspace root, so a candidate spec cannot be judged without writing the real one. This builds a scratch root under .tmp/selftest/montage_build/<p>/
// whose tools/ is a fresh COPY of the real tools (so each gate's own root = the scratch root), whose data/specs holds only the candidate, and whose
// src/, public/, node_modules/ and data sub-folders are junctions to the real ones (read by the gates, never written by them). .tmp/<p>/ gets a copy of the
// project's small files (json/md/txt, mtimes kept: requirements --check rebuilds when its ledger looks older than cut_words) and the face track of the cut.
// The gates run there UNCHANGED: the same code, the same numbers, the candidate in place of the real spec. Nothing outside .tmp/selftest/ is written.
//   const sb = makeSandbox(p);  sb.writeSpec(spec);  sb.root  sb.specFile
import fs from "node:fs";
import path from "node:path";

export const WS = path.resolve(import.meta.dirname, "..", "..");
const SCR = path.join(WS, ".tmp", "selftest");
const inScr = (f) => path.resolve(f).toLowerCase().startsWith(SCR.toLowerCase() + path.sep);
const SMALL = /\.(json|md|txt|jsonl)$/i;
const SKIP_TOOLS = /(__pycache__|\.log$|\.pyc$)/;

/* every junction of the scratch root is remembered and unlinked by sb.release() when the run ends: a scratch folder left with junctions inside would let a
   cleaner that follows them (statSync + recursive delete, e.g. tools/clean_temp.mjs removeDirOrFile) reach the real src/, public/ or node_modules/ */
let LINKS = [];
const junction = (target, link) => { try { if (fs.lstatSync(link).isSymbolicLink()) { LINKS.push(link); return; } return; } catch { /* absent */ } fs.symlinkSync(target, link, "junction"); LINKS.push(link); };
/** unlink every junction this module made or found (never follows one); the copies and hard links stay — deleting those never touches a real file */
export const releaseLinks = () => { for (const l of LINKS.splice(0)) { try { if (inScr(l) && fs.lstatSync(l).isSymbolicLink()) fs.unlinkSync(l); } catch { /* gone */ } } };
process.on("exit", releaseLinks);
const copyKeep = (a, b) => { fs.copyFileSync(a, b); const st = fs.statSync(a); fs.utimesSync(b, st.atime, st.mtime); };
const copyTree = (src, dst, skip) => {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    if (skip?.test(e.name)) continue;
    const a = path.join(src, e.name), b = path.join(dst, e.name);
    if (e.isDirectory()) copyTree(a, b, skip); else if (e.isFile()) copyKeep(a, b);
  }
};
/** remove a path only when it is inside .tmp/selftest (junctions are unlinked, never followed) */
const wipe = (f) => {
  if (!inScr(f)) throw new Error("gate_sandbox: refusing to remove outside .tmp/selftest: " + f);
  let st; try { st = fs.lstatSync(f); } catch { return; }
  if (st.isSymbolicLink()) { fs.unlinkSync(f); return; }
  if (st.isDirectory()) { for (const e of fs.readdirSync(f)) wipe(path.join(f, e)); fs.rmdirSync(f); return; }
  fs.unlinkSync(f);
};

/** a public/ of links: every entry of the real public/ linked (folders = junctions, files = hard links, same S: volume, no copy), the project's own folder a
    real folder of links — so a file a tool writes there (a matte, a test still) stays in the scratch tree and never reaches the real public/ */
const linkPublic = (root, p) => {
  const P0 = path.join(WS, "public"), P = path.join(root, "public");
  try { if (fs.lstatSync(P).isSymbolicLink()) fs.unlinkSync(P); } catch { /* none */ }
  fs.mkdirSync(P, { recursive: true });
  /* a hard link shares the real file: a tool that rewrote one IN PLACE would change the real public/. The project's own folder is where the generators
     write (mattes in <p>/mt/), so its sub-folders are real empty folders here (never junctions), and only its top files are linked (read by the gates). */
  const linkInto = (from, to, own, inOwn) => {
    for (const e of fs.readdirSync(from, { withFileTypes: true })) {
      const a = path.join(from, e.name), b = path.join(to, e.name);
      if (fs.existsSync(b)) continue;
      if (e.isDirectory()) { if (own === e.name) { fs.mkdirSync(b, { recursive: true }); linkInto(a, b, null, true); } else if (inOwn) fs.mkdirSync(b, { recursive: true }); else junction(a, b); }
      else if (e.isFile()) { try { fs.linkSync(a, b); } catch { copyKeep(a, b); } }
    }
  };
  linkInto(P0, P, p, false);
};

export function makeSandbox(p, { name, ownPublic = false } = {}) {
  const root = path.join(SCR, "montage_build", name ?? p.replace(/[\\/]/g, "_"));
  if (!inScr(root)) throw new Error("gate_sandbox: bad root " + root);
  fs.mkdirSync(root, { recursive: true });
  // tools: always a fresh copy (a gate edited a minute ago is judged as it is now)
  wipe(path.join(root, "tools"));
  copyTree(path.join(WS, "tools"), path.join(root, "tools"), SKIP_TOOLS);
  for (const d of ["src", "node_modules", "models"]) if (fs.existsSync(path.join(WS, d))) junction(path.join(WS, d), path.join(root, d));   /* models: the matte model (tools/matte_cache.mjs, matte_windows.mjs) */
  if (ownPublic) linkPublic(root, p);
  else { try { if (!fs.lstatSync(path.join(root, "public")).isSymbolicLink()) throw new Error("gate_sandbox: public/ of links here; pass ownPublic"); } catch (e) { if (e.code !== "ENOENT") throw e; } junction(path.join(WS, "public"), path.join(root, "public")); }
  for (const f of ["package.json", "tsconfig.json", "remotion.config.ts"]) if (fs.existsSync(path.join(WS, f))) copyKeep(path.join(WS, f), path.join(root, f));
  // data: top-level files copied (small, and some gates write theirs: gallery_geo.json), sub-folders linked, specs = the candidate only
  const D = path.join(root, "data"); fs.mkdirSync(D, { recursive: true });
  for (const e of fs.readdirSync(path.join(WS, "data"), { withFileTypes: true })) {
    const a = path.join(WS, "data", e.name), b = path.join(D, e.name);
    if (e.name === "specs") continue;
    if (e.isDirectory()) junction(a, b); else if (e.isFile()) copyKeep(a, b);
  }
  wipe(path.join(D, "specs")); fs.mkdirSync(path.join(D, "specs"), { recursive: true });
  // .tmp/<p>: the project's small files, mtimes kept
  const T0 = path.join(WS, ".tmp", p), T = path.join(root, ".tmp", p);
  wipe(T); fs.mkdirSync(T, { recursive: true });
  if (fs.existsSync(T0)) for (const e of fs.readdirSync(T0, { withFileTypes: true })) if (e.isFile() && SMALL.test(e.name)) copyKeep(path.join(T0, e.name), path.join(T, e.name));
  fs.mkdirSync(path.join(root, ".tmp", "gates"), { recursive: true });
  for (const f of ["active_montage.json"]) if (fs.existsSync(path.join(WS, ".tmp", f))) copyKeep(path.join(WS, ".tmp", f), path.join(root, ".tmp", f));
  const sb = {
    root, p, specFile: path.join(D, "specs", `${p}.json`), tmp: T, pub: path.join(root, "public"),
    /** the face track of the spec's cut (tools/lib/face_zone.mjs reads it by the cut's size + mtime; without it the gate would run the face tracker) */
    linkFace(spec) {
      const FT0 = path.join(WS, ".tmp", "facetrack"), FT = path.join(root, ".tmp", "facetrack"); fs.mkdirSync(FT, { recursive: true });
      if (!spec?.cut || !fs.existsSync(FT0)) return;
      const base = path.basename(spec.cut, ".mp4");
      for (const f of fs.readdirSync(FT0)) if (f.startsWith(base + "_") && !fs.existsSync(path.join(FT, f))) copyKeep(path.join(FT0, f), path.join(FT, f));
    },
    writeSpec(spec) { sb.linkFace(spec); fs.mkdirSync(path.dirname(sb.specFile), { recursive: true }); fs.writeFileSync(sb.specFile, JSON.stringify(spec, null, 1)); return sb.specFile; },
    release: releaseLinks,
    readSpec() { return JSON.parse(fs.readFileSync(sb.specFile, "utf8")); },
  };
  return sb;
}
