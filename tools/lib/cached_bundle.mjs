// Shared by tools/stills.mjs, tools/face_check.mjs and tools/frame_audit.mjs (2026-10-25: face_check/frame_audit bundled the real public/ = 5.4 GB per run
// and every renderStill left a remotion-*-assets folder behind; together they filled S: to 61 MB free).
//   cachedServeUrl(id, { manifest })  code bundled with an EMPTY publicDir and CACHED in .tmp/stills_bundle/<Id> (re-bundled only when src/** or package.json changed);
//                                     the assets the composition uses are HARD-LINKED into <bundle>/public (instant, no copy, same S: volume).
//   privateTemp(tag)                  points TEMP/TMP of THIS process at .tmp/run_<tag>_<pid> and deletes it on exit, so the per-still asset folders never pile up
//                                     (and never touch another session's temp files).
// Which assets? Root.tsx -> the composition's component file -> every local import (recursively); each string / template literal in them that names a file
// (or a folder prefix like `kh/alpha_${n}.webm`, `fonts/${f}`) and exists under public/. Add more with a manifest (one path or folder per line, relative to public/; # comments).
import { bundle } from "@remotion/bundler";
import path from "path"; import fs from "fs"; import crypto from "crypto";
import { rootOf, projTmp, sweepDeadRuns } from "./projdir.mjs";

const ROOT = process.cwd(), SRC = path.join(ROOT, "src"), PUB = path.join(ROOT, "public");
const ENTRY = path.resolve(process.env.ENTRY ?? "src/index.ts");
const MEDIA = /\.(mp4|webm|mov|m4v|png|jpe?g|svg|gif|webp|avif|wav|mp3|m4a|ogg|ttf|otf|woff2?|json|txt|csv)$/i;
const readSrc = (f) => { try { return fs.readFileSync(f, "utf8"); } catch { return ""; } };
const walk = (dir) => { const out = []; for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, e.name); if (e.isDirectory() || (e.isSymbolicLink() && fs.statSync(p).isDirectory())) { for (const q of walk(p)) out.push(q); } else out.push(p); } return out; };
const resolveImport = (from, spec) => {
  const base = path.resolve(path.dirname(from), spec);
  for (const c of [base, base + ".tsx", base + ".ts", base + ".jsx", base + ".js", path.join(base, "index.tsx"), path.join(base, "index.ts")]) {
    try { if (fs.statSync(c).isFile()) return c; } catch { /* next */ }
  }
  return null;
};

// montage specs (data/specs/*.json, rendered by src/MontageSpec.tsx) name their assets in JSON, not in code: scan them too (2026-10-26)
const SPEC_DIR = path.join(ROOT, "data", "specs");
const withSpecs = (files) => { try { for (const f of fs.readdirSync(SPEC_DIR)) if (f.endsWith(".json")) files.add(path.join(SPEC_DIR, f)); } catch { /* no specs yet */ } return files; };

function collectSources(id) {
  const rootFile = path.join(SRC, "Root.tsx");
  const root = readSrc(rootFile);
  const m = root.match(new RegExp(`id=["']${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'][^>]*?component=\\{([A-Za-z0-9_]+)\\}`));
  const files = new Set([rootFile]);
  const all = () => { for (const f of fs.readdirSync(SRC)) if (/\.(tsx?|jsx?)$/.test(f)) files.add(path.join(SRC, f)); return withSpecs(files); };
  if (!m) { console.warn(`[bundle] could not find <Composition id="${id}"> in src/Root.tsx; scanning src/ entirely`); return all(); }
  const comp = m[1];
  const im = root.match(new RegExp(`import\\s*\\{[^}]*\\b${comp}\\b[^}]*\\}\\s*from\\s*["'](\\.[^"']+)["']`));
  let start = im ? resolveImport(rootFile, im[1]) : null;
  // data-spec montage defined in Root.tsx (`const XVideo = () => <MontageFromSpec spec={xSpec …} />`): start at MontageSpec.tsx and add ONLY its own spec
  // (2026-10-29: the fallback scanned all of src/ + every spec → 65–94k files / up to 19 GB hard-linked on every still, face check and probe)
  const sm = !start && root.match(new RegExp(`const\\s+${comp}\\b[^\\n]*<MontageFromSpec\\s+spec=\\{([A-Za-z0-9_]+)`));
  if (sm) {
    const sj = root.match(new RegExp(`import\\s+${sm[1]}\\s+from\\s*["'](\\.[^"']+\\.json)["']`));
    const specFile = sj ? resolveImport(rootFile, sj[1]) : null;
    start = resolveImport(rootFile, "./MontageSpec");
    if (specFile && start) files.add(specFile);
  }
  files.delete(rootFile);
  if (!start) { console.warn(`[bundle] could not resolve the file of component ${comp}; scanning src/ entirely`); return all(); }
  const stack = [start];
  while (stack.length) {
    const f = stack.pop();
    if (files.has(f)) continue;
    files.add(f);
    for (const x of readSrc(f).matchAll(/(?:from\s+|import\s*\(\s*|import\s+)["'](\.[^"']+)["']/g)) { const r = resolveImport(f, x[1]); if (r && !files.has(r) && !/[\\/]data[\\/]specs[\\/]/.test(r)) stack.push(r); }
  }
  return sm ? files : withSpecs(files);
}

export function neededAssets(id, manifest, manifestOnly = false) {
  const rel = new Set();
  const add = (p) => { // p relative to public/ (file or folder)
    const abs = path.join(PUB, p);
    try { const st = fs.statSync(abs); if (st.isDirectory()) for (const f of walk(abs)) rel.add(path.relative(PUB, f).replace(/\\/g, "/")); else rel.add(p.replace(/\\/g, "/")); } catch { /* not a public path */ }
  };
  if (manifestOnly) {
    if (!manifest || !fs.existsSync(manifest)) throw new Error('manifest-only requires an existing asset manifest');
    for (const line of readSrc(manifest).split(/\r?\n/)) {
      const item = line.replace(/#.*/, '').trim();
      if (item) add(item.replace(/^public[\\/]/, ''));
    }
    return [...rel].sort();
  }
  let allPub = null;
  const sources = collectSources(id);
  const specText = [...sources].filter((f) => /[\\/]data[\\/]specs[\\/]/.test(f)).map(readSrc).join("\n");
  const prefix = (pre) => { // `kh/alpha_${n}.webm` -> every public file whose path starts with "kh/alpha_"
    // `fr/${base}/…` (a folder per video): only the folders the montage's own spec names (all projects' extracted frames = 94k files)
    if (pre.endsWith("/") && specText) {
      let subs = []; try { subs = fs.readdirSync(path.join(PUB, pre), { withFileTypes: true }).filter((d) => d.isDirectory() || (d.isSymbolicLink() && fs.statSync(path.join(PUB, pre, d.name)).isDirectory())).map((d) => d.name); } catch { /* none */ }
      for (const d of subs) if (specText.includes(d)) add(pre + d);
      return;
    }
    allPub ??= walk(PUB).map((f) => path.relative(PUB, f).replace(/\\/g, "/"));
    for (const f of allPub) if (f.startsWith(pre)) rel.add(f);
  };
  for (const f of sources) {
    const t = readSrc(f);
    for (const m of t.matchAll(/["'`]([^"'`\n$]+?)(\$\{|["'`])/g)) {
      const s = m[1].replace(/^\/+/, "").replace(/^\.\.\/public\//, "");
      if (m[2] === "${") { if (s.includes("/") && s.length > 2) prefix(s); continue; }
      if (MEDIA.test(s) || /\/$/.test(s)) add(s);
    }
  }
  if (manifest) for (const line of readSrc(manifest).split(/\r?\n/)) { const l = line.replace(/#.*/, "").trim(); if (l) add(l.replace(/^public[\\/]/, "")); }
  return [...rel].sort();
}

function linkInto(destPublic, files) {
  let linked = 0, copied = 0, bytes = 0;
  for (const f of files) {
    const from = path.join(PUB, f), to = path.join(destPublic, f);
    // an existing link is reused only while it is still the same file (a re-made asset under the same name must not show the old picture)
    if (fs.existsSync(to)) { const a = fs.statSync(from), b = fs.statSync(to); if (a.ino === b.ino && a.size === b.size) continue; fs.rmSync(to, { force: true }); }
    fs.mkdirSync(path.dirname(to), { recursive: true });
    try { fs.linkSync(from, to); linked++; } catch { fs.copyFileSync(from, to); copied++; }
    bytes += fs.statSync(from).size;
  }
  return { linked, copied, mb: Math.round(bytes / 1048576) };
}

export async function cachedServeUrl(id, { manifest = "", tag = "bundle", manifestOnly = false } = {}) {
  const cacheDir = projTmp(id, "stills_bundle", id);   // in the project's own folder (was .tmp/stills_bundle/<Id>, 1.6 GB left there for mufti-hiraba)
  const emptyPub = path.join(ROOT, ".tmp", "stills_empty_public"); fs.mkdirSync(emptyPub, { recursive: true });
  const h = crypto.createHash("sha1");
  h.update(`${ENTRY}|manifestOnly=${manifestOnly}\n`);
  for (const f of walk(SRC).sort()) { const st = fs.statSync(f); h.update(`${path.relative(ROOT, f)}|${st.size}|${Math.round(st.mtimeMs)}\n`); }
  try { for (const f of walk(path.join(ROOT, "data", "specs")).sort()) { const st = fs.statSync(f); h.update(`${path.relative(ROOT, f)}|${st.size}|${Math.round(st.mtimeMs)}
`); } } catch { /* no specs */ }   // montage specs are imported JSON: a spec edit must rebuild the bundle
  for (const f of ["package.json", "tsconfig.json", "remotion.config.ts"]) { try { const st = fs.statSync(path.join(ROOT, f)); h.update(`${f}|${st.size}|${Math.round(st.mtimeMs)}\n`); } catch { /* optional */ } }
  const stamp = h.digest("hex"), stampFile = path.join(cacheDir, ".stills_stamp");
  const fresh = fs.existsSync(stampFile) && readSrc(stampFile) === stamp && fs.existsSync(path.join(cacheDir, "index.html"));
  if (fresh) console.log(`[${tag}] bundle reused (code unchanged)`);
  else {
    // keep the hard-linked public/ across a re-bundle (a spec edit re-bundles; re-linking thousands of assets each time cost minutes)
    const keep = path.join(path.dirname(cacheDir), `.${id}_public_keep`);
    fs.rmSync(keep, { recursive: true, force: true });
    try { fs.renameSync(path.join(cacheDir, "public"), keep); } catch { /* first bundle */ }
    fs.rmSync(cacheDir, { recursive: true, force: true });
    fs.mkdirSync(path.dirname(cacheDir), { recursive: true });
    await bundle({ entryPoint: ENTRY, publicDir: emptyPub, outDir: cacheDir, onProgress: () => {} });
    if (fs.existsSync(keep)) { fs.rmSync(path.join(cacheDir, "public"), { recursive: true, force: true }); fs.renameSync(keep, path.join(cacheDir, "public")); }
    fs.writeFileSync(stampFile, stamp);
    console.log(`[${tag}] bundle built`);
  }
  const need = neededAssets(id, manifest, manifestOnly);
  const r = linkInto(path.join(cacheDir, "public"), need);
  console.log(`[${tag}] assets: ${need.length} files (${r.linked} hard-linked, ${r.copied} copied, ${r.mb} MB) — not the whole public/`);
  return { serveUrl: cacheDir, cacheDir };
}

export function privateTemp(tag) {
  /* (user 2026-11-19: every temporary thing of a project in its own place) the run folder goes under the project named on the command line
     (.tmp/<root>/run_<tag>_<pid>, deleted with the project); runs killed by force skip the exit cleanup, so dead runs' folders are swept first
     (7.9 GB of them had piled up in .tmp/ from four killed stills runs) */
  const base = (() => { for (const a of process.argv.slice(2)) { if (a.startsWith("-")) continue; const r = rootOf(a); if (fs.existsSync(path.join(ROOT, ".tmp", r)) && fs.statSync(path.join(ROOT, ".tmp", r)).isDirectory()) return path.join(ROOT, ".tmp", r); } return path.join(ROOT, ".tmp"); })();
  sweepDeadRuns(path.join(ROOT, ".tmp")); if (base !== path.join(ROOT, ".tmp")) sweepDeadRuns(base);
  const dir = path.join(base, `run_${tag}_${process.pid}`);
  fs.mkdirSync(dir, { recursive: true });
  process.env.TEMP = process.env.TMP = process.env.TMPDIR = dir;
  const rm = () => { try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* best effort; clean_temp catches leftovers */ } };
  process.on("exit", rm);
  for (const s of ["SIGINT", "SIGTERM"]) process.on(s, () => { rm(); process.exit(130); });
  return dir;
}
