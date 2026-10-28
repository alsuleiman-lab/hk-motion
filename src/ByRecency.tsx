import React from "react";
import { COMPOSITION_DATES } from "./compositionDates";

/**
 * Wraps the Root's children and lists the top-level <Composition>s newest → oldest (user request 2026-10-22). Order key = COMPOSITION_DATES[id] (tools/stamp_dates.mjs);
 * ids that are not stamped yet (brand-new) go FIRST. Everything that is not a plain Composition (Folder, Archive, other nodes) keeps its place AFTER the sorted compositions.
 */
export const ByRecency: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const nodes = React.Children.toArray(children);
  const isComp = (n: React.ReactNode): n is React.ReactElement<{ id?: string }> => React.isValidElement(n) && typeof (n.props as { id?: string }).id === "string" && "component" in (n.props as object);
  const comps = nodes.filter(isComp).sort((a, b) => (COMPOSITION_DATES[b.props.id as string] ?? Number.MAX_SAFE_INTEGER) - (COMPOSITION_DATES[a.props.id as string] ?? Number.MAX_SAFE_INTEGER));
  return <>{comps}{nodes.filter((n) => !isComp(n))}</>;
};
