import React from "react";
import { getRemotionEnvironment } from "remotion";
import lab from "../data/elements_lab.json";
import extra from "../data/element_names.json";
import { TYPE_OF } from "./galleryPlace";

/**
 * EVERY ELEMENT HAS ONE ARABIC NAME, SHOWN UNDER THE SCREEN (user 2026-11-17: «اجعل كل عنصر في المعرض له اسم، وهذا الاسم يظهر في ريموشن تحت الشاشة…
 * عشان لما اطلب تعديله اعرف ايش اطلب»). The name is the gallery's (data/elements_lab.json `ar`), else data/element_names.json. While the Studio shows a montage,
 * the engine publishes the names of the elements on screen at the current frame (per orientation) and src/studioTools.ts writes them under each screen.
 * The same names are accepted by tools/el.mjs (show / add) in place of the code. Studio only: renders never publish anything.
 */
const AR: Record<string, string> = Object.fromEntries((lab as { id: string; ar: string }[]).map((m) => [m.id, m.ar]));
const X = extra as unknown as { codeOf: Record<string, string>; names: Record<string, string> };
const CODE_OF: Record<string, string> = {};
for (const [code, t] of Object.entries(TYPE_OF)) CODE_OF[t] ??= code;
type It = { t: string; el?: unknown; style?: unknown };
export const elementCode = (it: It): string =>
  it.t === "pick" && typeof it.el === "string" ? it.el : CODE_OF[it.t === "nameTag" && it.style === "pinned" ? "nameTag:pinned" : it.t] ?? X.codeOf[it.t] ?? it.t;
export const elementName = (it: It): string => { const c = elementCode(it); return AR[c] ?? X.names[c] ?? X.names[it.t] ?? c; };

const spanOf = (it: Record<string, unknown>): [number, number] | null => {
  const n = (v: unknown) => (typeof v === "number" ? v : undefined);
  const times = Array.isArray(it.times) ? (it.times as number[]) : null;
  const a = it.t === "rewrite" ? (n(it.oldAt) ?? 0) - 0.4 : n(it.at) ?? n(it.from) ?? times?.[0];
  if (a == null) return null;
  const b = n(it.until) ?? n(it.to) ?? (n(it.dur) != null ? a + (n(it.dur) as number) : times ? times[times.length - 1] + 1.2 : it.t === "scholar" || it.t === "tphoto" ? a + 6 : a + 3);
  return [a, b];
};
type W = { __elNow?: Partial<Record<"port" | "land", string[]>> };
/** publishes, in the Studio, the names of the elements on screen at montage second t for orientation o (src/studioTools.ts shows them) */
/** `layers` = gallery codes of what the montage draws on every frame (the title bar…), named like the elements */
export const usePublishOnScreen = (items: unknown[], o: "port" | "land", t: number, layers: string[] = []) => {
  const env = getRemotionEnvironment(), on = env.isStudio && !env.isRendering && typeof window !== "undefined";
  React.useEffect(() => {
    if (!on) return;
    const names: string[] = layers.map((c) => AR[c] ?? X.names[c] ?? c);
    for (const raw of items) {
      const it = raw as Record<string, unknown> & It;
      if ((it.only && it.only !== o) || (o === "land" && (it.land as { skip?: boolean } | undefined)?.skip) || it.t === "cover") continue;
      const sp = spanOf(it); if (!sp || t < sp[0] || t > sp[1]) continue;
      names.push(elementName(it));
    }
    const w = window as unknown as W; (w.__elNow ??= {})[o] = names;
    return () => { delete (window as unknown as W).__elNow?.[o]; };
  });
};
