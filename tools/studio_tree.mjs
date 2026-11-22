// THE STUDIO'S LEFT LIST AS A TREE, READ FROM THE CODE, AND ITS GUARD (user order 2026-11-22, mandatory: «القائمة الموجودة على اليسار: مجلد حلقات، مجلد بثوث إلى آخره، وكل واحدة داخل
// هذا المجلد مجلد باسم الحلقة التي نعملها أو باسم البث … حتى يكون عندنا ترتيب ووضوح»).
//   node tools/studio_tree.mjs                 the tree: kind folder → project folder → composition ids (counts), then the verdict
//   node tools/studio_tree.mjs --json          the same as JSON ({ ok, problems, comps: [{ id, path, kind, hidden }] })
//   node tools/studio_tree.mjs --vs <git-ref>  also fail when an id the ref (e.g. HEAD) registers in Root/ReelsComps/ArchiveComps is gone or renamed (ids must never change with the folders)
// Exit 1 when: a composition is at the TOP of the list or in «غير مصنّف», one id appears twice, a kind folder holds a composition of another kind (the kind is tools/comp_kinds.mjs's;
// the spec rule in src/studioFolders.ts must agree with it), a composition has no project folder, two sibling folders share a name (the Studio would merge them), a folder name has «/»,
// or the registries (comp_kinds) and the tree disagree on the set of ids.
// How it reads the code: src/Root.tsx, src/ReelsComps.tsx and src/ArchiveComps.tsx are walked tag by tag (<Folder name="…">, <Composition id="…">); <SpecComps kind="…"/> is EXPANDED with
// the same pure functions the Studio runs (src/studioFolders.ts projectsOfKind) over every data/specs/*.json that tools/comp_kinds.mjs registers; <ReelsComps/> and <Archive/> are expanded
// from their files. Read-only: no Studio, no browser, no GPU.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
/* the shared rule file is TypeScript (the Studio bundle reads it too); Node strips the types — its «module type not specified» notice is silenced for this one load */
const SF = await (async () => { const ew = process.emitWarning; process.emitWarning = () => {}; try { return await import(pathToFileURL(path.join(ROOT, "src", "studioFolders.ts")).href); } finally { process.emitWarning = ew; } })();
const K = await import(pathToFileURL(path.join(ROOT, "tools", "comp_kinds.mjs")).href);
const { TOP, KIND_TOP, pathOfTop } = SF;

const rd = (f, d) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return d; } };
const txt = (f) => { try { return fs.readFileSync(f, "utf8"); } catch { return ""; } };
const titlesOf = (root) => { const m = {}; for (const x of txt(path.join(root, "src", "compositionTitles.ts")).matchAll(/"([^"]+)"\s*:\s*"((?:[^"\\]|\\.)*)"/g)) m[x[1]] = x[2]; return m; };
const noComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const TOKENS = /(\{SHOW_REFERENCE\s*&&\s*)?<Folder\s+name="([^"]*)"[^>]*>|<\/Folder>(\})?|(\{SHOW_REFERENCE\s*&&\s*)?<Composition\b([\s\S]*?)\/>|<SpecComps\s+kind="([^"]+)"\s*\/>|<ReelsComps\s*\/>|<Archive\s*\/>/g;

/** the composition tree of the code. o = { root, specDir } (the fake workspaces of the self-test pass their own) */
export const buildTree = (o = {}) => {
  const root = o.root ?? ROOT, specDir = o.specDir ?? path.join(root, "data", "specs");
  const reg = K.registry({ root, specDir }), T = titlesOf(root), over = rd(path.join(root, "data", "comp_kinds.json"), {}).kinds ?? {};
  const problems = [], comps = [], folderSeen = new Map();   // parent path → names
  const specs = [...new Map([...reg.values()].filter((e) => e.spec).map((e) => [e.spec, { p: e.spec, id: e.specData.compId || K.compIdOf(e.spec), spec: e.specData }])).values()];
  const names = specs.map((s) => s.p);
  const folder = (stack, name) => {
    const key = stack.join("/"), seen = folderSeen.get(key) ?? folderSeen.set(key, new Set()).get(key);
    if (!name || /\//.test(name)) problems.push(`اسم مجلد غير صالح: «${name}» (فارغ أو فيه «/»)`);
    if (seen.has(name)) problems.push(`مجلدان بالاسم نفسه تحت «${key || "أعلى القائمة"}»: «${name}» (يدمجهما الاستوديو)`); seen.add(name);
  };
  const walk = (file, stack0, hidden0) => {
    const s = noComments(txt(path.join(root, file))); if (!s) return;
    const stack = [...stack0], refStack = [];
    for (const x of s.matchAll(TOKENS)) {
      if (x[2] !== undefined) { folder(stack, x[2]); stack.push(x[2]); refStack.push(!!x[1]); continue; }
      if (x[0].startsWith("</Folder")) { stack.pop(); refStack.pop(); continue; }
      if (x[6] !== undefined) {   // <SpecComps kind="…"/>: the project folders of that kind, expanded with the Studio's own function
        for (const pr of SF.projectsOfKind(specs, x[6] === "full" ? "hk-full" : x[6] === "reel" ? "hk-reel" : x[6], T, over)) {
          folder(stack, pr.label);
          for (const p of pr.ps) for (const e of reg.values()) if (e.spec === p) comps.push({ id: e.id, path: [...stack, pr.label], hidden: null, via: "spec" });
        }
        continue;
      }
      if (/^<ReelsComps/.test(x[0])) { walk("src/ReelsComps.tsx", stack, hidden0); continue; }
      if (/^<Archive/.test(x[0])) { walk("src/ArchiveComps.tsx", stack, "archive"); continue; }
      const id = (x[5] ?? "").match(/\bid="([^"]+)"/)?.[1]; if (!id) continue;
      comps.push({ id, path: [...stack], hidden: hidden0 ?? (x[4] || refStack.some(Boolean) ? "reference" : null), via: "static" });
    }
  };
  walk("src/Root.tsx", [], null);

  /* ── the checks ── */
  const seenId = new Map();
  for (const c of comps) {
    if (seenId.has(c.id)) problems.push(`المعرّف «${c.id}» مكرر في القائمة`); seenId.set(c.id, c);
    const r = K.resolve(c.id, { root, registry: reg }); c.kind = r.kind;
    if (c.path.length === 0) { problems.push(`«${c.id}» في أعلى القائمة بلا مجلد`); continue; }
    if (c.path[0] === TOP.loose) problems.push(`«${c.id}» في «${TOP.loose}»: ضعه في مجلد نوعه (${r.kind}) داخل مجلد مشروعه`);
    const e = reg.get(c.id), kf = e?.spec ? KIND_TOP[SF.topKeyOf(r.kind, SF.projectRootOf(e.spec, e.specData, names))] : SF.topOfStatic(c.id, r.kind), want = pathOfTop(kf);
    if (c.path[0] !== TOP.loose && want.some((w, i) => c.path[i] !== w)) problems.push(`«${c.id}» نوعه ${r.kind} ومكانه «${c.path.join(" / ")}» والمفروض تحت «${want.join(" / ")}»`);
    if (c.path.length <= want.length && kf !== TOP.engine) problems.push(`«${c.id}» بلا مجلد مشروع داخل «${c.path.join(" / ")}»`);
  }
  for (const id of reg.keys()) if (!seenId.has(id)) problems.push(`«${id}» في سجل الأنواع وليس في قائمة الاستوديو`);
  for (const id of seenId.keys()) if (!reg.has(id)) problems.push(`«${id}» في قائمة الاستوديو وليس في سجل الأنواع`);
  return { problems: [...new Set(problems)], comps, reg };
};

/** ids a git ref registered by hand (Root/ReelsComps/ArchiveComps) that the working tree no longer has */
export const idsGone = (ref, comps, root = ROOT) => {
  const gone = [], now = new Set(comps.map((c) => c.id));
  for (const f of ["src/Root.tsx", "src/ReelsComps.tsx", "src/ArchiveComps.tsx"]) {
    const r = spawnSync("git", ["show", `${ref}:${f}`], { cwd: root, encoding: "utf8", windowsHide: true, maxBuffer: 1 << 26 }); if (r.status !== 0) continue;
    for (const m of noComments(r.stdout).matchAll(/<Composition\b[^>]*?\bid="([^"]+)"/g)) if (!now.has(m[1])) gone.push(`${m[1]} (كان في ${f} عند ${ref})`);
  }
  return gone;
};

const show = (comps) => {
  const out = [], top = new Map();
  for (const c of comps) { const t = c.path[0] ?? "(أعلى القائمة)"; (top.get(t) ?? top.set(t, new Map()).get(t)); const pj = c.path.slice(1).join(" / ") || "(بلا مجلد مشروع)"; const m = top.get(t); (m.get(pj) ?? m.set(pj, []).get(pj)).push(c); }
  for (const [t, pm] of top) {
    const n = [...pm.values()].reduce((a, l) => a + l.length, 0);
    out.push(`■ ${t} — ${pm.size} مجلد مشروع، ${n} تركيبة`);
    for (const [pj, l] of pm) out.push(`    ▸ ${pj} (${l.length}): ${l.map((c) => c.id + (c.hidden ? `[${c.hidden === "archive" ? "أرشيف" : "مخفي"}]` : "")).join("، ")}`);
  }
  return out.join("\n");
};

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const a = process.argv.slice(2), vs = a.includes("--vs") ? a[a.indexOf("--vs") + 1] : null;
  const { problems, comps } = buildTree();
  if (vs) for (const g of idsGone(vs, comps)) problems.push(`معرّف اختفى أو تغيّر: ${g}`);
  const ok = problems.length === 0;
  if (a.includes("--json")) console.log(JSON.stringify({ ok, problems, comps: comps.map((c) => ({ id: c.id, path: c.path, kind: c.kind, hidden: c.hidden })) }, null, 1));
  else { console.log(show(comps)); console.log(`\n${comps.length} تركيبة${vs ? `، مقارنة بـ${vs}` : ""}`); console.log(ok ? "✔ القائمة مجلدات بالنوع ثم المشروع، لا تركيبة في الأعلى، ولا معرّف مكرر أو مفقود" : problems.map((p) => "✘ " + p).join("\n")); }
  process.exit(ok ? 0 : 1);
}
