import React from "react";
import { Folder } from "remotion";
import { Composition } from "./SafeComposition";
import { COMPOSITION_TITLES } from "./compositionTitles";
import compKindsData from "../data/comp_kinds.json";
import { projectsOfKind } from "./studioFolders";
import type { SpecEntry } from "./studioFolders";
import { MontageFromSpec, specFrames } from "./MontageSpec";
import type { MontageSpec } from "./MontageSpec";
import { MontageBoth, BOTH, BOTHV } from "./MontageBoth";

/* EVERY MONTAGE SPEC IS A COMPOSITION BY ITSELF (2026-11-20, readiness audit). Root.tsx used to import each data/specs/<p>.json by name (tools/spec_register.mjs
   wrote the lines, tools/approve_purge.mjs removed them): a spec deleted on approval while Root still imported it broke the whole Studio bundle, and the
   committed Root depended on files git does not keep. Now webpack lists the folder (require.context): a spec added appears, a spec deleted disappears,
   nothing to write or remove. Every full montage gets its four forms (user 2026-11-16: «أريد العرضي والطولي جنب بعض، ويبنيهما بنفس الوقت»):
     <Id> طولي 1080×1920 · <Id>-L عرضي 1920×1080 · <Id>-Both الاثنان معاً · <Id>-BothV الاثنان معاً للجوال;   a reel (kind "reel"): <Id> only.
   <Id> = spec.compId, else the file name with each «-» word capitalised (mufti-hiraba → Mufti-Hiraba, tirmidhi32_1 → Tirmidhi32_1) — the same rule as
   tools/spec_register.mjs and tools/cut_lazy.mjs projectOf (lower-cased id → spec). A spec that is not a montage (no frames/cut) or has "studio": false is skipped. */
type Ctx = { keys(): string[]; (k: string): unknown };
declare global { namespace NodeJS { interface Require { context(dir: string, sub: boolean, re: RegExp): Ctx } } interface NodeRequire { context(dir: string, sub: boolean, re: RegExp): Ctx } }
const ctx = require.context("../data/specs", false, /\.json$/);

export const compIdOf = (p: string) => p.split("-").map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w)).join("-");
type Entry = { p: string; id: string; spec: MontageSpec; reel: boolean; forms: string[] };
const entries = (): Entry[] => {
  const seen = new Set<string>(), out: Entry[] = [];
  for (const k of ctx.keys()) {
    const p = k.replace(/^.*[\\/]/, "").replace(/\.json$/, ""); if (seen.has(p)) continue; seen.add(p);
    const raw = ctx(k) as { default?: unknown }, s = ((raw && typeof raw === "object" && "default" in raw ? raw.default : raw) ?? {}) as MontageSpec & { compId?: string; studio?: boolean; kind?: string; forms?: string[] };
    if (typeof s.frames !== "number" || typeof s.cut !== "string" || s.studio === false) continue;
    const reel = s.kind === "reel";
    out.push({ p, id: s.compId || compIdOf(p), spec: s, reel, forms: s.forms ?? (reel ? ["port"] : ["port", "land", "both", "bothv"]) });
  }
  return out;
};

/* one stable component per spec and form (a new function each render would remount the composition) */
const comps = new Map<string, React.FC>();
const compFor = (e: Entry, form: string): React.FC => {
  const key = `${e.p}:${form}`, have = comps.get(key);
  if (have) return have;
  const C: React.FC = form === "both" ? () => <MontageBoth spec={e.spec} /> : form === "bothv" ? () => <MontageBoth spec={e.spec} phone /> : () => <MontageFromSpec spec={e.spec} />;
  comps.set(key, C); return C;
};
const SIZE: Record<string, { width: number; height: number; suffix: string }> = {
  port: { width: 1080, height: 1920, suffix: "" }, land: { width: 1920, height: 1080, suffix: "-L" },
  both: { width: BOTH.W, height: BOTH.H, suffix: "-Both" }, bothv: { width: BOTHV.W, height: BOTHV.H, suffix: "-BothV" },
};

/* THE STUDIO'S LEFT LIST (user order 2026-11-22: folders by kind, one sub-folder per project — src/studioFolders.ts decides which). <SpecComps kind=… /> renders the PROJECT folders of one kind
   (src/Root.tsx puts it inside that kind's folder): "hk-full" → حلقات, "hk-reel" → ريلز, "stream" → بثوث (every clip of a stream under the stream's folder), "lesson" → دروس, "spec-demo" → عروض وتجارب.
   A spec added later lands in its kind's folder and its project's folder by itself; the composition ids are untouched. «full»/«reel» are the old names of the first two. */
const KIND_KEY: Record<string, string> = { full: "hk-full", reel: "hk-reel" };
const OVER = ((compKindsData as { kinds?: Record<string, string> }).kinds ?? {});

/** the project folders (with their compositions) of one kind of spec */
export const SpecComps: React.FC<{ kind: "hk-full" | "hk-reel" | "stream" | "lesson" | "spec-demo" | "full" | "reel" }> = ({ kind }) => {
  const all = entries(), byP = new Map(all.map((e) => [e.p, e] as [string, Entry]));
  const specs: SpecEntry[] = all.map((e) => ({ p: e.p, id: e.id, spec: e.spec as SpecEntry["spec"] }));
  return (
    <>
      {projectsOfKind(specs, KIND_KEY[kind] ?? kind, COMPOSITION_TITLES, OVER).map((pr) => (
        <Folder key={pr.root} name={pr.label}>
          {pr.ps.flatMap((p) => { const e = byP.get(p) as Entry; return e.forms.filter((f) => SIZE[f]).map((f) => (
            <Composition key={`${e.p}:${f}`} id={`${e.id}${SIZE[f].suffix}`} component={compFor(e, f)} durationInFrames={specFrames(e.spec)} fps={30} width={SIZE[f].width} height={SIZE[f].height} />
          )); })}
        </Folder>
      ))}
    </>
  );
};
