/* THE STUDIO'S LEFT LIST = FOLDERS BY KIND, ONE SUB-FOLDER PER PROJECT (user order 2026-11-22, mandatory: «خيري موشن يكون في مجلد… مجلد حلقات، مجلد بثوث إلى آخره، وكل واحدة
   داخل هذا المجلد مجلد باسم الحلقة التي نعملها أو باسم البث، وهكذا حتى الكرتون إلى آخره، حتى يكون عندنا ترتيب ووضوح»).
   Only the Studio's grouping lives here: composition IDS never change (renders, the queue, tools and links use them).
   PURE and import-free ON PURPOSE: the Studio bundle (src/SpecComps.tsx, src/ByRecency.tsx) and tools/studio_tree.mjs (Node strips the types) read this same file,
   so the folder a spec lands in is decided in one place and the tool that prints/checks the tree cannot disagree with the Studio.
   The kind of a composition is tools/comp_kinds.mjs's (specKind below mirrors it; tools/studio_tree.mjs fails when they differ).
   Folder names: Remotion (patched by tools/patch_remotion.mjs) allows anything except «/» — Arabic names, spaces and brackets are fine (the repo already has them). */

export type SpecLike = { kind?: string; title?: string; project?: string; stream?: string; slicedFrom?: string; date?: string; fromEpisode?: { project?: string } };
export type SpecEntry = { p: string; id: string; spec: SpecLike };   // one per spec FILE (its forms — طولي، عرضي، الاثنان — are listed by the caller)

/** top-level folder names (what the user sees first) */
export const TOP = {
  motion: "موشن", full: "حلقات", reel: "ريلز", stream: "بثوث", lesson: "دروس", cartoon: "كرتون", dubbing: "دبلجة", explainer: "موشن توضيحي", scholars: "موشن مشايخ",
  haitham: "موشن هيثم", paper: "مونتاج ورقي", silent: "تعليق صامت", reference: "نماذج مرجعية", demo: "عروض وتجارب", archive: "الأرشيف",
  engine: "أصول الهجين (مخفية)", loose: "غير مصنّف — ضعه في مجلد نوعه",
};

/** folders that live INSIDE another (user 2026-11-22: motion is one folder — توضيحي، هيثم، مشايخ، النماذج المرجعية inside «موشن»; the demos and the archive inside the hidden utility group «أصول الهجين (مخفية)») */
export const PARENT: Record<string, string> = {
  [TOP.explainer]: TOP.motion, [TOP.haitham]: TOP.motion, [TOP.scholars]: TOP.motion, [TOP.reference]: TOP.motion, [TOP.demo]: TOP.engine, [TOP.archive]: TOP.engine,
};
/** a kind-folder name → its path from the top of the list: ["موشن", "موشن هيثم"] or just ["حلقات"] */
export const pathOfTop = (name: string): string[] => (PARENT[name] ? [PARENT[name], name] : [name]);

/** kind (tools/comp_kinds.mjs) → its kind folder (the LAST name of its path; see PARENT) */
export const KIND_TOP: Record<string, string> = {
  "hk-full": TOP.full, "hk-reel": TOP.reel, "debate-reel": TOP.reel, stream: TOP.stream, lesson: TOP.lesson, cartoon: TOP.cartoon, rudood: TOP.cartoon,
  dubbing: TOP.dubbing, explainer: TOP.explainer, scholars: TOP.scholars, paper: TOP.paper, silent: TOP.silent, reference: TOP.reference, still: TOP.reference,
  demo: TOP.demo, "spec-demo": TOP.demo, archive: TOP.archive, "engine-asset": TOP.engine, unknown: TOP.loose,
};

/** compositions that live with their FAMILY, not with their kind's folder: [id pattern, top folder]. First match wins. */
export const ID_TOP: [RegExp, string][] = [
  [/^Haitham|^Ref-Haitham/, TOP.haitham],                          // موشن هيثم: his own folder
  [/^DebateThumb$/, TOP.reel],                                       // the debate reels' thumbnail sits with the debate reels
  [/^Ref-Sheikh|^FamilyStickCast$|^DodoFamilyCast$/, TOP.cartoon],   // the sheikh-of-replies / stick-family character libraries are cartoon material
];

/** the top folder of a NON-spec composition: its family rule, else its kind's folder */
export const topOfStatic = (id: string, kind: string): string => { for (const [re, t] of ID_TOP) if (re.test(id)) return t; return KIND_TOP[kind] ?? TOP.loose; };

/** a spec's kind — the SAME rule as specKind in tools/comp_kinds.mjs (checked by tools/studio_tree.mjs); `over` = data/comp_kinds.json kinds[<comp id>] */
export const specKind = (p: string, s: SpecLike = {}, over?: string): string => {
  if (over) return over;
  if (p === "demo") return "spec-demo";
  if (s.kind === "stream" || /^stream[_-]/i.test(p)) return "stream";
  if (s.kind === "lesson" || /^q\d/i.test(p) || /^[a-z]+\d+_\d+[a-z0-9]*$/i.test(p)) return "lesson";
  if (s.kind === "reel") return "hk-reel";
  return "hk-full";
};

/** the PROJECT a spec belongs to = its source recording (tools/lib/projdir.mjs rootOf, here on names alone: the Studio bundle cannot see the disk).
    A spec may say it outright ("project", fromEpisode.project, "stream", "slicedFrom"); else the name rules: -reel/_reel/-r/_r2 are outputs of the project; a stream short id
    s1122_shia belongs to stream_1122; <root>_<n> (clip of a stream/lesson, or one of several siblings) belongs to <root>. */
export const projectRootOf = (p: string, s: SpecLike, names: string[]): string => {
  const ex = s.project || s.fromEpisode?.project || s.stream || s.slicedFrom;
  if (typeof ex === "string" && ex) return ex.toLowerCase();
  let c = p.toLowerCase();
  for (const re of [/-reel\d*$/, /_reel\d*$/, /-r$/, /_r\d+$/]) c = c.replace(re, "");
  const short = /^s(\d{3,4})_/.exec(c); if (short) return "stream_" + short[1];
  const clip = /^(.*[^_])_\d+[a-z]?$/.exec(c);
  if (clip) {
    const k = specKind(p, s), sib = names.filter((n) => n.toLowerCase().indexOf(clip[1] + "_") === 0 && /^\d+[a-z]?$/.test(n.toLowerCase().slice(clip[1].length + 1))).length;
    if (k === "stream" || k === "lesson" || sib >= 2 || names.some((n) => n.toLowerCase() === clip[1])) c = clip[1];
  }
  return c;
};

/** which top-level kind-folder a spec goes to: its kind, except that anything of a stream (root stream_*) is under «بثوث» (the stream's clips group under the stream) */
export const topKeyOf = (kind: string, root: string): string => (/^stream[_-]/.test(root) ? "stream" : kind);

const TAG = /\s*#محمد_بن_شمس_الدين\s*-?\s*$/u;
/** a composition title → a folder name: no orientation suffix, no hashtag, no «/», not too long */
export const cleanTitle = (t: string): string => {
  let s = String(t ?? "").replace(TAG, "").replace(/\s+/g, " ").trim();
  s = s.replace(/\s*[(（][^)）]*[)）]\s*$/, "").replace(/\s*[—–-]\s*(عرضي|طولي)(\s*[(（][^)）]*[)）])?\s*$/, "").trim();
  s = s.replace(/\//g, "-");
  return s.length > 70 ? s.slice(0, 69).trim() + "…" : s;
};

export type Project = { root: string; label: string; ps: string[]; top: string };
type Over = Record<string, string>;
const FORMS = ["", "-L", "-Both", "-BothV"];

/** every project of one top-level kind: [{root, label, ps: spec files}] newest first. `all` = EVERY spec (the label of a reel's project comes from its episode, which sits in another kind). */
export const projectsOfKind = (all: SpecEntry[], key: string, titles: Record<string, string>, over: Over = {}): Project[] => {
  const names = all.map((e) => e.p);
  const info = all.map((e) => { const root = projectRootOf(e.p, e.spec, names), kind = specKind(e.p, e.spec, over[e.id]); return { e, root, key: topKeyOf(kind, root) }; });
  const titled = (e: SpecEntry): string => { for (const f of FORMS) { const t = titles[e.id + f]; if (t) return cleanTitle(t); } return cleanTitle(e.spec.title ?? ""); };
  const groups = new Map<string, typeof info>();
  for (const x of info) if (x.key === key) { const g = groups.get(x.root); if (g) g.push(x); else groups.set(x.root, [x]); }
  const out: Project[] = [];
  groups.forEach((members, root) => {
    const own = all.find((e) => e.p.toLowerCase() === root);
    const m = /^stream_(\d\d)(\d\d)$/.exec(root);
    const label = (own && titled(own)) || (m ? `بث ${m[2]}-${m[1]}` : "") || (info.filter((x) => x.root === root).length === 1 && titled(members[0].e)) || root;
    out.push({ root, label, ps: members.map((x) => x.e.p).sort(), top: KIND_TOP[key] ?? TOP.loose });
  });
  const dateOf = (pr: Project) => pr.ps.map((p) => all.find((e) => e.p === p)?.spec.date ?? "").sort().pop() ?? "";
  out.sort((a, b) => (dateOf(a) < dateOf(b) ? 1 : dateOf(a) > dateOf(b) ? -1 : a.root < b.root ? -1 : 1));
  const used: Record<string, number> = {};
  for (const pr of out) { used[pr.label] = (used[pr.label] ?? 0) + 1; }
  for (const pr of out) if (used[pr.label] > 1) pr.label = `${pr.label} (${pr.root})`;   // two projects with one title must not merge into one folder
  return out;
};

/** the kind-folder key → folder name (for the callers that name the folder from a kind key) */
export const topName = (key: string): string => KIND_TOP[key] ?? TOP.loose;
