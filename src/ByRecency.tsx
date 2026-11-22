import React from "react";
import { COMPOSITION_DATES } from "./compositionDates";
import { Folder } from "remotion";
import { gradeTree } from "./compGrade";
import { TOP } from "./studioFolders";

/**
 * Wraps the Root's children and lists the top-level <Composition>s newest → oldest (user request 2026-10-22). Order key = COMPOSITION_DATES[id] (tools/stamp_dates.mjs);
 * ids that are not stamped yet (brand-new) go FIRST. Everything that is not a plain Composition (Folder, Archive, other nodes) keeps its place AFTER the sorted compositions.
 *
 * (2026-11-22, user order: the left list is folders by kind, one folder per project — src/studioFolders.ts, src/Root.tsx) a composition left at the TOP of the list is a mistake: it is gathered into
 * «غير مصنّف — ضعه في مجلد نوعه» (TOP.loose) so the Studio never shows a loose row, and node tools/studio_tree.mjs fails until it is placed in its kind's folder.
 */
export const ByRecency: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const nodes = React.Children.toArray(gradeTree(children));   // (2026-11-21) every composition's own colour grade, if one is set (src/compGrade.tsx)
  const isComp = (n: React.ReactNode): n is React.ReactElement<{ id?: string }> => React.isValidElement(n) && typeof (n.props as { id?: string }).id === "string" && "component" in (n.props as object);
  const comps = nodes.filter(isComp).sort((a, b) => (COMPOSITION_DATES[b.props.id as string] ?? Number.MAX_SAFE_INTEGER) - (COMPOSITION_DATES[a.props.id as string] ?? Number.MAX_SAFE_INTEGER));
  return <>{comps.length > 0 && <Folder name={TOP.loose}>{comps}</Folder>}{nodes.filter((n) => !isComp(n))}</>;
};
