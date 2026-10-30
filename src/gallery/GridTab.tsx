import React, { useEffect, useRef } from "react";

/**
 * The layout grid inside the gallery (user 2026-10-30: «تضع الشبكة في نفس الملف»). tools/gallery_build.mjs splits tools/grid_page.html into css / body / script
 * and passes them here; the page runs unchanged inside a shadow root, so its styles and ids never touch the gallery's. «احفظ» writes the same db doc as the
 * stand-alone grid page (grids/current). A click on an element name inside it fires `gallery-go` and the gallery jumps to that element's card.
 */
export type GridEmbed = { css: string; body: string; script: string; data: unknown };

export const GridTab: React.FC<{ g: GridEmbed; active: boolean; onGo: (id: string) => void }> = ({ g, active, onGo }) => {
  const host = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);
  const go = useRef(onGo); go.current = onGo;
  useEffect(() => {
    const el = host.current; if (!el || !active || mounted.current) return;
    mounted.current = true;
    const root = el.attachShadow({ mode: "open" });
    root.innerHTML = `<style>${g.css}</style><div class="gbody">${g.body}</div>`;
    el.addEventListener("gallery-go", (e) => go.current((e as CustomEvent<string>).detail));
    try { new Function("__ROOT__", "DATA", g.script)(root, g.data); } catch (err) { root.innerHTML = `<p style="color:#b33">تعذّر تشغيل الشبكة: ${String(err)}</p>`; }
  }, [active, g]);
  return <div ref={host} style={{ display: active ? "block" : "none" }} />;
};
