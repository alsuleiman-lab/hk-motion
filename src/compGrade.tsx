import React from "react";
import { AbsoluteFill } from "remotion";
import data from "../data/comp_grades.json";
import { gradeMatrix, isNeutralGrade, svgValues } from "./gradeMatrix";
import type { Grade } from "./gradeMatrix";
import { GradeCtx } from "./hybrid/Slot";

/* THE COLOUR SHEET FOR EVERY COMPOSITION (user 2026-11-21: «عليه يتعرف على كل شيء ويفعل ميزات لكل شيء»). A montage spec keeps its grade in the spec
   (src/MontageSpec.tsx). Any other composition (شيخ الردود، الدبلجة، المناظرة…) gets it from data/comp_grades.json (written by the Studio's ☀️ sheet through
   tools/hk_server.mjs → tools/hk_grade.mjs setCompGrade; tools/comp_kinds.mjs decides the scope) without touching its own component file:
     scope "video"  its <VSlot> video layers only: GradeCtx with cut "*" (src/hybrid/Slot.tsx) — the Studio's SVG filter and the GPU compositor's matrix, the same numbers;
     scope "frame"  the whole picture (a composition without HybridHost: the GPU engine renders its whole frame as the graphics layer, so the Studio = the render).
   No entry (or a neutral grade) = the component itself, untouched: nothing changes for any composition until a grade is set. */
type Entry = { scope?: "video" | "frame"; grade?: Grade };
const ALL: Record<string, Entry> = ((data as { comps?: Record<string, Entry> }).comps ?? {});
const cache = new Map<string, { C: unknown; G: React.ComponentType<Record<string, unknown>> }>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const graded = (id: string, C: any): any => {
  const e = ALL[id];
  if (!C || !e || isNeutralGrade(e.grade)) return C;
  const have = cache.get(id); if (have && have.C === C) return have.G;
  const gm = gradeMatrix(e.grade ?? {}), fid = "hkcg_" + id.replace(/[^a-z0-9]/gi, "_");
  const Inner = C as React.ComponentType<Record<string, unknown>>;
  const G: React.FC<Record<string, unknown>> = e.scope === "video"
    ? (p) => <GradeCtx.Provider value={{ cut: "*", gm }}><Inner {...p} /></GradeCtx.Provider>
    : (p) => (
      <>
        <svg width={0} height={0} style={{ position: "absolute" }}><filter id={fid} colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values={svgValues(gm)} /></filter></svg>
        <AbsoluteFill style={{ filter: `url(#${fid})` }}><Inner {...p} /></AbsoluteFill>
      </>
    );
  cache.set(id, { C, G }); return G;
};

/** every <Composition> under these nodes (inside Folders and fragments too) gets its grade; with no grade anywhere the nodes are returned as they are */
export const gradeTree = (node: React.ReactNode): React.ReactNode => {
  if (!Object.keys(ALL).length) return node;
  const walk = (n: React.ReactNode): React.ReactNode => React.Children.map(n, (c) => {
    if (!React.isValidElement(c)) return c;
    const p = c.props as { id?: unknown; component?: unknown; children?: React.ReactNode };
    if (typeof p.id === "string" && p.component) { const G = graded(p.id, p.component); return G === p.component ? c : React.cloneElement(c as React.ReactElement<{ component?: unknown }>, { component: G }); }
    if (p.children !== undefined) return React.cloneElement(c, undefined, walk(p.children));
    return c;
  });
  return walk(node);
};
