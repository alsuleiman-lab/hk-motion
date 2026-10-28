import { getRemotionEnvironment } from "remotion";
import { COMPOSITION_TITLES } from "./compositionTitles";

/**
 * Studio-only helper (user request 2026-10-20, corrected 2026-10-21): a COPY of the current-frame counter sits in the preview toolbar, just LEFT of the transport buttons
 * (the spot the user marked with a red arrow). It shows «الإطار <n>» live; clicking it copies that text to the clipboard and shows a small toast.
 * The ORIGINAL frame number under the timeline timecode is left untouched (it toggles frames/time ticks). Runs only inside Remotion Studio (never in renders) and is
 * wrapped in try/catch so it can never break the Studio.
 */
const install = () => {
  const w = window as unknown as { __frameCopy?: { timer?: number; badge?: HTMLElement | null; toast?: HTMLElement | null } };
  if (w.__frameCopy?.timer) window.clearInterval(w.__frameCopy.timer);
  w.__frameCopy?.badge?.remove();
  w.__frameCopy = {};

  const currentFrame = (): string | null => {
    // the real frame counter is the button under the timecode (its aria-label is stable); other numeric buttons (e.g. 1080 = height) must never match
    const real = document.querySelector<HTMLElement>('button[aria-label^="Show timeline ticks"]');
    const rt = (real?.textContent ?? "").trim();
    if (/^\d{1,7}$/.test(rt)) return rt;
    for (const b of Array.from(document.querySelectorAll("button"))) {
      if (b.closest("#__frame_copy_badge")) continue;
      if (!/^\d{1,7}$/.test((b.textContent ?? "").trim())) continue;
      let p: HTMLElement | null = b;
      for (let i = 0; i < 5 && p; i++) { p = p.parentElement; if (p?.querySelector(".__remotion_input_dragger")) return (b.textContent ?? "").trim(); }
    }
    return null;
  };
  const toast = (msg: string) => {
    let el = document.getElementById("__frame_copy_toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "__frame_copy_toast";
      el.style.cssText = "position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:2147483647;background:#16365c;color:#fff;font:600 15px Tahoma,Arial,sans-serif;padding:8px 18px;border-radius:20px;box-shadow:0 6px 18px rgba(0,0,0,.4);direction:rtl;transition:opacity .25s;pointer-events:none";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = "1";
    window.clearTimeout((el as unknown as { _t?: number })._t);
    (el as unknown as { _t?: number })._t = window.setTimeout(() => { el!.style.opacity = "0"; }, 1500);
  };
  // synchronous execCommand FIRST (stays inside the click gesture), then the async Clipboard API
  const execCopy = (text: string) => {
    try {
      const ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", ""); ta.style.cssText = "position:fixed;top:0;left:0;opacity:0"; document.body.appendChild(ta); ta.focus(); ta.select();
      const ok = document.execCommand("copy"); ta.remove(); return ok;
    } catch { return false; }
  };
  const copy = async (text: string) => {
    if (execCopy(text)) return true;
    try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
  };

  const badge = document.createElement("button");
  badge.id = "__frame_copy_badge";
  badge.type = "button";
  badge.title = "انقر لنسخ رقم الإطار";
  badge.style.cssText = "position:fixed;z-index:2147483000;display:none;box-sizing:border-box;width:118px;height:24px;padding:0 6px;text-align:center;font-variant-numeric:tabular-nums;overflow:hidden;border:1px solid rgba(255,255,255,.35);border-radius:12px;background:rgba(22,54,92,.96);color:#fff;font:600 13px Tahoma,Arial,sans-serif;direction:rtl;cursor:pointer;white-space:nowrap;line-height:22px";
  document.body.appendChild(badge);
  w.__frameCopy.badge = badge;
  badge.addEventListener("click", (e) => {
    e.stopPropagation();
    const n = currentFrame();
    if (n === null) return;
    const text = `الإطار ${n}`;
    void copy(text).then((ok) => { (w.__frameCopy as { last?: unknown }).last = { ok, text, at: Date.now() }; toast(ok ? `تم النسخ: ${text}` : `تعذّر النسخ — ${text}`); });
  });

  // FIXED geometry (no jumping): fixed width, centred text; the position depends only on the Play button centre and the left-hand buttons, never on the changing transport cluster
  const OFFSET = 330;
  let last: { l: number; t: number } | null = null, missing = 0;
  const tick = () => {
    try {
      const play = document.querySelector<HTMLElement>('button[aria-label="Play"], button[aria-label="Pause"]');
      const n = currentFrame();
      if (!play || n === null) { if (++missing > 8) badge.style.display = "none"; return; }
      const pr = play.getBoundingClientRect();
      if (pr.width === 0) { if (++missing > 8) badge.style.display = "none"; return; }
      missing = 0;
      const pc = pr.left + pr.width / 2;
      let minLeft = 8;
      for (const b2 of Array.from(document.querySelectorAll("button"))) {
        if (b2 === badge) continue; // never measure ourselves (that caused the jumping)
        const r = b2.getBoundingClientRect();
        if (r.width > 0 && Math.abs(r.top - pr.top) < 8 && r.left + r.width / 2 < pc - 200 && r.left + r.width / 2 < pc - 40) minLeft = Math.max(minLeft, r.right + 12);
      }
      const l = Math.round(Math.max(minLeft, pc - OFFSET)), tp = Math.round(pr.top + (pr.height - 24) / 2);
      const txt = `الإطار ${n}`;
      if (badge.textContent !== txt) badge.textContent = txt;
      if (badge.style.display !== "block") badge.style.display = "block";
      if (!last || Math.abs(last.l - l) > 1 || Math.abs(last.t - tp) > 1) { badge.style.left = `${l}px`; badge.style.top = `${tp}px`; last = { l, t: tp }; }
    } catch { /* never break the Studio */ }
  };
  w.__frameCopy.timer = window.setInterval(tick, 150);
  tick();
};
/**
 * Arabic titles in Studio (user request 2026-10-22). Remotion ids must be Latin, so src/compositionTitles.ts maps id → Arabic title. We NEVER edit React-owned text nodes
 * (that can crash React on re-render): the original id text is hidden with CSS and the Arabic title is drawn through ::after from a data attribute on the same element.
 * Covers: sidebar list, Inspector heading, browser-tab title. The Latin id stays as a tooltip. Studio-only, wrapped in try/catch.
 */
const installTitles = () => {
  const w = window as unknown as { __arTitles?: { timer?: number; onInput?: (e: Event) => void } };
  if (w.__arTitles?.timer) window.clearInterval(w.__arTitles.timer);
  if (w.__arTitles?.onInput) document.removeEventListener("input", w.__arTitles.onInput, true);
  w.__arTitles = {};
  document.getElementById("__ar_titles_css")?.remove();
  const css = document.createElement("style");
  css.id = "__ar_titles_css";
  css.textContent = "[data-ar]{font-size:0 !important;line-height:0 !important;position:relative}[data-ar]::after{content:attr(data-ar);display:inline-block;direction:rtl;unicode-bidi:plaintext;font-family:Tahoma,Arial,sans-serif;font-size:14px;line-height:1.4;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;vertical-align:middle}";
  document.head.appendChild(css);
  const ids = Object.keys(COMPOSITION_TITLES);
  const stamp = () => {
    try {
      const sidebar = Array.from(document.querySelectorAll("a.__remotion-composition"));
      for (const a of sidebar) {
        const leaf = Array.from(a.querySelectorAll("div,span")).find((e) => e.children.length === 0 && ids.includes((e.textContent ?? "").trim()));
        if (leaf && !leaf.hasAttribute("data-ar")) { const id = (leaf.textContent ?? "").trim(); leaf.setAttribute("data-ar", COMPOSITION_TITLES[id]); leaf.setAttribute("title", id); }
      }
      // Inspector heading + any other chrome label that is exactly a known id (outside the canvas / compositions sidebar)
      for (const e of Array.from(document.querySelectorAll("div,span"))) {
        if (e.children.length !== 0 || e.hasAttribute("data-ar") || e.closest("a.__remotion-composition")) continue;
        const id = (e.textContent ?? "").trim();
        if (id && ids.includes(id) && !e.closest("[data-ar]")) { e.setAttribute("data-ar", COMPOSITION_TITLES[id]); e.setAttribute("title", id); }
      }
      // browser tab title: «العنوان العربي — id / …»
      const m = decodeURIComponent(location.pathname.split("/").filter(Boolean)[0] ?? "");
      if (m && COMPOSITION_TITLES[m] && !document.title.startsWith(COMPOSITION_TITLES[m])) document.title = `${COMPOSITION_TITLES[m]} — ${m} / Remotion_Workspace - Remotion Studio`;
    } catch { /* never break the Studio */ }
  };
  // ---- Arabic search in the Studio search box (Studio filters by Latin id only): block Studio's own handler for Arabic text and filter the sidebar rows by their Arabic titles ourselves.
  const norm = (s: string) => s.replace(/[ً-ْـ]/g, "").replace(/[إأآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").toLowerCase().trim();
  const hasArabic = (s: string) => /[؀-ۿ]/.test(s);
  const isSearch = (el: EventTarget | null) => el instanceof HTMLInputElement && /search|بحث/i.test(el.placeholder ?? "");
  const onInput = (e: Event) => { try { if (isSearch(e.target) && hasArabic((e.target as HTMLInputElement).value)) e.stopImmediatePropagation(); } catch { /* ignore */ } };
  document.addEventListener("input", onInput, true);
  w.__arTitles.onInput = onInput;
  const applyFilter = () => {
    try {
      const input = Array.from(document.querySelectorAll("input")).find(isSearch) as HTMLInputElement | undefined;
      const q = input && hasArabic(input.value) ? norm(input.value) : "";
      for (const a of Array.from(document.querySelectorAll<HTMLElement>("a.__remotion-composition"))) {
        const label = norm(a.querySelector("[data-ar]")?.getAttribute("data-ar") ?? a.textContent ?? "");
        const hide = q !== "" && !label.includes(q);
        if (hide && a.getAttribute("data-arhide") !== "1") { a.style.display = "none"; a.setAttribute("data-arhide", "1"); }
        else if (!hide && a.getAttribute("data-arhide") === "1") { a.style.display = ""; a.removeAttribute("data-arhide"); }
      }
      // the quick-search popup lists every composition as a hoverable row: hide the rows whose Arabic title does not contain the query
      for (const leaf of Array.from(document.querySelectorAll<HTMLElement>("[data-ar]"))) {
        if (leaf.closest("a.__remotion-composition")) continue;
        const row = leaf.closest<HTMLElement>(".__remotion-hoverable");
        if (!row) continue;
        const hide = q !== "" && !norm(leaf.getAttribute("data-ar") ?? "").includes(q);
        if (hide && row.getAttribute("data-arhide") !== "1") { row.style.display = "none"; row.setAttribute("data-arhide", "1"); }
        else if (!hide && row.getAttribute("data-arhide") === "1") { row.style.display = ""; row.removeAttribute("data-arhide"); }
      }
    } catch { /* never break the Studio */ }
  };
  w.__arTitles.timer = window.setInterval(() => { stamp(); applyFilter(); }, 300);
  stamp();
};
try {
  if (typeof window !== "undefined" && typeof document !== "undefined" && getRemotionEnvironment().isStudio) { install(); installTitles(); }
} catch { /* ignore */ }
