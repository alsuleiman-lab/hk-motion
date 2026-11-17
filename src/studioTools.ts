import { getRemotionEnvironment } from "remotion";
import { saveDefaultProps } from "@remotion/studio";
import { COMPOSITION_TITLES } from "./compositionTitles";

type FilterSettings = { brightness: number; contrast: number; saturation: number; sepia: number; temperature: number; tint: number; shadowLift: number; highlightRollOff: number; warmth: number; vignette: number; glow: number };
type SavedFilter = { name: string; settings: FilterSettings };

/**
 * Studio-only helper (user request 2026-10-20, corrected 2026-10-21): a COPY of the current-frame counter sits in the preview toolbar, just LEFT of the transport buttons
 * (the spot the user marked with a red arrow). It shows «الإطار <n>» live; clicking it copies that text to the clipboard and shows a small toast.
 * The ORIGINAL frame number under the timeline timecode is left untouched (it toggles frames/time ticks). Runs only inside Remotion Studio (never in renders) and is
 * wrapped in try/catch so it can never break the Studio.
 */
// نسخ النص يعمل حتى عند فتح الاستوديو برقم الشبكة (http غير آمن لا يوفّر navigator.clipboard فيفشل نسخ الاستوديو نفسه «reading 'writeText'»)
try {
  if (typeof navigator !== "undefined" && !navigator.clipboard) {
    const legacyCopy = (text: string) => { const ta = document.createElement("textarea"); ta.value = text; ta.style.cssText = "position:fixed;top:-1000px;opacity:0"; document.body.appendChild(ta); ta.select(); const ok = document.execCommand("copy"); ta.remove(); if (!ok) throw new Error("copy failed"); };
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async (t: string) => legacyCopy(String(t)), write: async () => { throw new Error("clipboard.write غير متاح خارج الاتصال الآمن"); } } });
  }
} catch { /* لا يكسر الاستوديو */ }
const MOBILE_MQ = "(max-width: 900px)";
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
  badge.title = "انقر لنسخ رقم الإطار — كليك يمين للذهاب إلى إطار محدد";
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

  // right-click on the badge (user 2026-11-09): a small box to type a frame number; Enter jumps there (Studio clamps to the composition length), Esc / click elsewhere closes it
  const seek = (f: number) => {
    const comp = decodeURIComponent(location.pathname.split("/").filter(Boolean)[0] ?? "");
    try { (window as unknown as { remotion_setFrame?: (f: number, c: string, a: number) => void }).remotion_setFrame?.(Math.max(0, Math.round(f)), comp, 1); } catch { /* ignore */ }
  };
  const closeJump = () => { document.getElementById("__frame_jump_box")?.remove(); };
  badge.addEventListener("contextmenu", (e) => {
    try {
      e.preventDefault(); e.stopPropagation();
      closeJump();
      const box = document.createElement("div");
      box.id = "__frame_jump_box";
      const r = badge.getBoundingClientRect();
      box.style.cssText = `position:fixed;z-index:2147483646;left:${Math.round(r.left)}px;top:${Math.round(r.bottom + 6)}px;width:${Math.max(160, Math.round(r.width))}px;box-sizing:border-box;padding:8px;border-radius:10px;background:#16365c;border:1px solid rgba(255,255,255,.35);box-shadow:0 8px 24px rgba(0,0,0,.5);direction:rtl;font:600 13px Tahoma,Arial,sans-serif;color:#fff`;
      const label = document.createElement("div");
      label.textContent = "اذهب إلى الإطار رقم:";
      label.style.cssText = "margin-bottom:6px";
      const input = document.createElement("input");
      input.type = "text"; input.inputMode = "numeric"; input.value = currentFrame() ?? "";
      input.style.cssText = "width:100%;box-sizing:border-box;padding:4px 8px;border-radius:6px;border:1px solid rgba(255,255,255,.4);background:#0d2340;color:#fff;font:600 14px Tahoma,Arial,sans-serif;text-align:center;direction:ltr;outline:none";
      box.append(label, input);
      document.body.appendChild(box);
      input.focus(); input.select();
      const go = () => {
        // accept Arabic-Indic digits too
        const t = input.value.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660)).replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0)).replace(/\D/g, "");
        if (t === "") { toast("اكتب رقم إطار"); return; }
        seek(Number(t)); closeJump(); toast(`الإطار ${Number(t)}`);
      };
      input.addEventListener("keydown", (k) => { k.stopPropagation(); if (k.key === "Enter") go(); else if (k.key === "Escape") closeJump(); });
      input.addEventListener("keyup", (k) => k.stopPropagation());
      const away = (m: MouseEvent) => { if (!box.contains(m.target as Node)) { closeJump(); document.removeEventListener("mousedown", away, true); } };
      window.setTimeout(() => document.addEventListener("mousedown", away, true), 0);
    } catch { /* never break the Studio */ }
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
      // phone layout (user 2026-11-12): the badge sits at the far left, ends before the «go to start» button, and never overlaps the other transport buttons
      const nat = document.querySelector<HTMLElement>('button[aria-label="Go to beginning"]');
      const mob = window.matchMedia(MOBILE_MQ).matches && !(nat && nat.getBoundingClientRect().width > 0);
      const l = mob ? 6 : Math.round(Math.max(minLeft, pc - OFFSET)), tp = Math.round(pr.top + (pr.height - 24) / 2);
      const bw = mob ? `${Math.max(60, Math.round(pc - 94 - 6))}px` : "118px", bf = mob ? "12px" : "13px", bp = mob ? "0 3px" : "0 6px";
      if (badge.style.width !== bw) badge.style.width = bw;
      if (badge.style.fontSize !== bf) badge.style.fontSize = bf;
      if (badge.style.padding !== bp) badge.style.padding = bp;
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

/**
 * Mobile Studio (user request 2026-11-06): on a phone the timeline's left column (layer names: <Sequence>, files…) is hidden and the transport row gets three buttons beside Play:
 * go to start, back 10 s, forward 10 s. Seeking uses Studio's own window.remotion_setFrame (clamped by Studio). Desktop width / Studio's own navigation buttons stay untouched.
 * Studio-only, try/catch everywhere. Fixed geometry from the Play button, same pattern as the frame badge.
 */
const installMobile = () => {
  const w = window as unknown as { __mobileTools?: { timer?: number; box?: HTMLElement | null } };
  if (w.__mobileTools?.timer) window.clearInterval(w.__mobileTools.timer);
  w.__mobileTools?.box?.remove();
  document.getElementById("__mobile_tools_css")?.remove();
  w.__mobileTools = {};
  const MQ = "(max-width: 900px)";
  const css = document.createElement("style");
  css.id = "__mobile_tools_css";
  // Phone layout (user 2026-11-12): (1) the layer column goes away so the tracks use the full width; (2) the timecode + zoom bar sits alone on top; (3) the navigation ruler is a full-width bar under it;
  // (4) touch-action:none on the ruler so a finger can drag the red playhead (Studio's own scrub handler needs it; otherwise the browser turns the drag into a page pan); (5) the Render rocket + arrow are hidden
  // (a speed button replaces them), Studio's left cluster (more actions, mute) moves to the right edge.
  css.textContent = `@media ${MQ}{`
    + `[data-mt="left"],[data-mt="split"],[data-mt="rside"]{display:none !important}`
    + `[data-mt="head"]{width:100% !important}`
    + `[data-mt="ruler"]{left:0 !important;width:100% !important;top:39px !important}`
    + `[data-mt="tracks"]>div:first-child{margin-top:39px !important;height:calc(100% - 39px) !important}`
    + `[data-mt="ruler"],[data-mt="ruler"] *,[data-timeline-scrubber],[data-timeline-scrubber] *{touch-action:none !important}`
    + `[data-mt="lside"]{position:absolute !important;right:4px !important;left:auto !important;top:5px !important;width:auto !important}`
    + `[data-mt="lside"]>div:first-child{display:none !important}`
    + `}`;
  document.head.appendChild(css);

  const FPS = 30;
  const BW = 36;
  const comp = () => decodeURIComponent(location.pathname.split("/").filter(Boolean)[0] ?? "");
  const frameNow = (): number | null => {
    const real = document.querySelector<HTMLElement>('button[aria-label^="Show timeline ticks"]');
    const t = (real?.textContent ?? "").trim();
    return /^\d{1,7}$/.test(t) ? Number(t) : null;
  };
  const seekTo = (f: number) => {
    try { (window as unknown as { remotion_setFrame?: (f: number, c: string, a: number) => void }).remotion_setFrame?.(Math.max(0, Math.round(f)), comp(), 1); } catch { /* ignore */ }
  };
  const mk = (id: string, label: string, svg: string, on: () => void) => {
    const b = document.createElement("button");
    b.id = id; b.type = "button"; b.title = label; b.setAttribute("aria-label", label);
    b.style.cssText = `position:fixed;z-index:2147483000;display:none;width:${BW}px;height:${BW}px;padding:0;border:0;border-radius:18px;background:transparent;color:#fff;cursor:pointer;align-items:center;justify-content:center;touch-action:manipulation`;
    b.innerHTML = svg;
    b.addEventListener("click", (e) => { e.stopPropagation(); on(); });
    document.body.appendChild(b);
    return b;
  };
  // playback speed (replaces the Render rocket): tap cycles 0.5 → 1 → 1.5 → 2 → 4. Studio keeps the rate in a React state whose setter is passed as a prop to its «More actions» button,
  // so we read that prop from the React fiber of that button; the current value is read back from Studio's own persisted key.
  const RATES = [0.5, 1, 1.5, 2, 4];
  const rateNow = (): number => { try { const n = Number(localStorage.getItem("remotion.playbackrate")); return Number.isFinite(n) && n !== 0 ? n : 1; } catch { return 1; } };
  const rateSetter = (): ((v: number) => void) | null => {
    try {
      const btn = document.querySelector<HTMLElement>('button[aria-label="More actions"]');
      if (!btn) return null;
      const key = Object.keys(btn).find((k) => k.startsWith("__reactFiber$"));
      let f = key ? (btn as unknown as Record<string, unknown>)[key] as { memoizedProps?: Record<string, unknown>; return?: unknown } | null : null;
      for (let i = 0; f && i < 40; i++, f = f.return as typeof f) {
        const p = f.memoizedProps;
        if (p && typeof p.setPlaybackRate === "function") return p.setPlaybackRate as (v: number) => void;
      }
    } catch { /* ignore */ }
    return null;
  };
  const cycleRate = () => {
    const set = rateSetter(); if (!set) return;
    const cur = rateNow(), i = RATES.indexOf(cur);
    set(RATES[i < 0 ? 1 : (i + 1) % RATES.length]);
  };
  const arrow = (dir: 1 | -1) => `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="transform:${dir === 1 ? "scaleX(-1)" : "none"}"><path d="M4 12a8 8 0 1 0 2.6-5.9"/><path d="M4 4v4.2h4.2"/><text x="12" y="15.6" text-anchor="middle" font-size="8.5" font-weight="700" fill="currentColor" stroke="none" font-family="Arial,sans-serif">10</text></svg>`;
  const startSvg = `<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="5" width="2.6" height="14" rx="1"/><path d="M19 5.5v13a1 1 0 0 1-1.6.8l-9-6.5a1 1 0 0 1 0-1.6l9-6.5A1 1 0 0 1 19 5.5z"/></svg>`;
  const bStart = mk("__mt_start", "رجوع للبداية", startSvg, () => seekTo(0));
  const bBack = mk("__mt_back", "رجوع 10 ثوانٍ", arrow(-1), () => { const n = frameNow(); if (n !== null) seekTo(n - 10 * FPS); });
  const bFwd = mk("__mt_fwd", "تقديم 10 ثوانٍ", arrow(1), () => { const n = frameNow(); if (n !== null) seekTo(n + 10 * FPS); });
  const bSpeed = mk("__mt_speed", "سرعة التشغيل", "", cycleRate);
  bSpeed.style.width = "42px"; bSpeed.style.height = "28px"; bSpeed.style.borderRadius = "14px";
  bSpeed.style.border = "1px solid rgba(255,255,255,.35)"; bSpeed.style.background = "rgba(22,54,92,.96)";
  bSpeed.style.font = "700 13px Tahoma,Arial,sans-serif"; bSpeed.style.direction = "ltr";
  const all = [bStart, bBack, bFwd, bSpeed];
  w.__mobileTools.box = bStart;
  const hideAll = () => { for (const b of all) if (b.style.display !== "none") b.style.display = "none"; };
  const show = (b: HTMLElement, left: number, top: number) => { if (b.style.display !== "flex") b.style.display = "flex"; b.style.left = `${left}px`; b.style.top = `${top}px`; };
  // the layout CSS depends on widths Studio measures at mount: ask it to re-measure after we re-flow the panes
  let resizeTimers: number[] = [];
  const remeasure = () => { for (const id of resizeTimers) window.clearTimeout(id); resizeTimers = [150, 600].map((ms) => window.setTimeout(() => window.dispatchEvent(new Event("resize")), ms)); };
  let lastMq = window.matchMedia(MQ).matches;

  const tick = () => {
    try {
      // ---- mark the timeline panes by structure (CSS above re-flows them on narrow screens only)
      const t = document.querySelector<HTMLElement>('button[aria-label^="Show timeline ticks"]');
      let H: HTMLElement | null = t;
      while (H && !(H.style.position === "absolute" && H.style.left === "0%")) H = H.parentElement;
      let changed = false;
      const mark = (el: HTMLElement, v: string) => { if (el.getAttribute("data-mt") !== v) { el.setAttribute("data-mt", v); changed = true; } };
      if (H?.parentElement) {
        mark(H, "head");
        for (const c of Array.from(H.parentElement.children) as HTMLElement[]) {
          if (c === H) continue;
          if (c.classList.contains("remotion-splitter")) mark(c, "split");
          else if (c.style.position === "absolute" && c.style.left !== "0%") mark(c, "ruler");
          else if (c.style.minWidth === "240px") mark(c, "left");
          else if (c.style.position !== "absolute") mark(c, "tracks");
        }
      }
      // transport row: Studio's left cluster (more actions, mute) and right cluster (Render rocket + arrow)
      const pl = document.querySelector<HTMLElement>('button[aria-label="Play"], button[aria-label="Pause"]');
      const trow = pl?.closest<HTMLElement>(".css-reset");
      if (trow && trow.children.length > 3) { mark(trow.children[0] as HTMLElement, "lside"); mark(trow.children[trow.children.length - 1] as HTMLElement, "rside"); }
      const mq = window.matchMedia(MQ).matches;
      if (changed || mq !== lastMq) { lastMq = mq; remeasure(); }
      // ---- buttons beside Play (only when Studio's own navigation buttons are not shown)
      const play = document.querySelector<HTMLElement>('button[aria-label="Play"], button[aria-label="Pause"]');
      const nat = document.querySelector<HTMLElement>('button[aria-label="Go to beginning"]');
      if (!play || !window.matchMedia(MQ).matches || (nat && nat.getBoundingClientRect().width > 0)) { hideAll(); return; }
      const pr = play.getBoundingClientRect();
      if (pr.width === 0) { hideAll(); return; }
      const pc = pr.left + pr.width / 2, top = Math.round(pr.top + (pr.height - BW) / 2);
      show(bBack, Math.round(pc - 52), top);
      show(bStart, Math.round(pc - 90), top);
      show(bFwd, Math.round(pc + 16), top);
      show(bSpeed, Math.round(pc + 56), Math.round(pr.top + (pr.height - 28) / 2));
      const label = `${rateNow()}x`;
      if (bSpeed.textContent !== label) bSpeed.textContent = label;
    } catch { /* never break the Studio */ }
  };
  w.__mobileTools.timer = window.setInterval(tick, 200);
  tick();
};
/**
 * Frame bookmarks (user request 2026-11-09): in the empty strip LEFT of the preview canvas (the spot the user marked in red) a «تحديد» button saves the current frame;
 * each saved frame appears as a button under it showing its number — click = jump back there, right-click (or the ×) = delete. Saved per composition in localStorage.
 * Seeking uses Studio's own window.remotion_setFrame. Studio-only, try/catch everywhere.
 */
const installMarks = () => {
  const w = window as unknown as { __frameMarks?: { timer?: number; box?: HTMLElement | null } };
  if (w.__frameMarks?.timer) window.clearInterval(w.__frameMarks.timer);
  w.__frameMarks?.box?.remove();
  w.__frameMarks = {};
  const comp = () => decodeURIComponent(location.pathname.split("/").filter(Boolean)[0] ?? "");
  const KEY = (c: string) => `__frame_marks:${c}`;
  const load = (c: string): number[] => { try { const a = JSON.parse(localStorage.getItem(KEY(c)) ?? "[]"); return Array.isArray(a) ? a.filter((n) => Number.isFinite(n)) : []; } catch { return []; } };
  const save = (c: string, a: number[]) => { try { localStorage.setItem(KEY(c), JSON.stringify(a)); } catch { /* ignore */ } };
  const frameNow = (): number | null => {
    const real = document.querySelector<HTMLElement>('button[aria-label^="Show timeline ticks"]');
    const t = (real?.textContent ?? "").trim();
    return /^\d{1,7}$/.test(t) ? Number(t) : null;
  };
  const seekTo = (f: number) => {
    try { (window as unknown as { remotion_setFrame?: (f: number, c: string, a: number) => void }).remotion_setFrame?.(Math.max(0, Math.round(f)), comp(), 1); } catch { /* ignore */ }
  };

  const box = document.createElement("div");
  box.id = "__frame_marks_box";
  box.style.cssText = "position:fixed;z-index:2147483000;display:none;box-sizing:border-box;width:100px;max-height:320px;flex-direction:column;gap:6px;direction:rtl;font:600 13px Tahoma,Arial,sans-serif;color:#fff";
  const addBtn = document.createElement("button");
  addBtn.type = "button"; addBtn.textContent = "تحديد"; addBtn.title = "احفظ الموضع الحالي لتعود إليه لاحقاً";
  addBtn.style.cssText = "flex:0 0 auto;height:30px;border:1px solid rgba(255,255,255,.35);border-radius:8px;background:#1f6feb;color:#fff;font:700 14px Tahoma,Arial,sans-serif;cursor:pointer";
  const list = document.createElement("div");
  list.style.cssText = "display:flex;flex-direction:column;gap:5px;overflow-y:auto;min-height:0;padding-bottom:2px";
  box.append(addBtn, list);
  document.body.appendChild(box);
  w.__frameMarks.box = box;

  let shown = "";
  const render = () => {
    const c = comp(), marks = load(c);
    const sig = c + "|" + marks.join(",");
    if (sig === shown) return;
    shown = sig;
    list.textContent = "";
    for (const f of marks) {
      const row = document.createElement("div");
      row.style.cssText = "display:flex;gap:3px;flex:0 0 auto";
      const go = document.createElement("button");
      go.type = "button"; go.textContent = String(f); go.title = `ارجع إلى الإطار ${f} — كليك يمين للحذف`;
      go.style.cssText = "flex:1;height:26px;border:1px solid rgba(255,255,255,.3);border-radius:7px;background:rgba(22,54,92,.96);color:#fff;font:600 13px Tahoma,Arial,sans-serif;font-variant-numeric:tabular-nums;cursor:pointer";
      go.addEventListener("click", (e) => { e.stopPropagation(); seekTo(f); });
      const del = document.createElement("button");
      del.type = "button"; del.textContent = "×"; del.title = "حذف";
      del.style.cssText = "flex:0 0 22px;height:26px;padding:0;border:1px solid rgba(255,255,255,.2);border-radius:7px;background:rgba(80,30,30,.9);color:#fff;font:700 14px Arial,sans-serif;cursor:pointer";
      const remove = () => { save(c, load(c).filter((n) => n !== f)); render(); };
      del.addEventListener("click", (e) => { e.stopPropagation(); remove(); });
      go.addEventListener("contextmenu", (e) => { e.preventDefault(); e.stopPropagation(); remove(); });
      row.append(go, del);
      list.appendChild(row);
    }
  };
  addBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const n = frameNow(); if (n === null) return;
    const c = comp(), a = load(c);
    if (!a.includes(n)) { a.push(n); a.sort((x, y) => x - y); save(c, a); }
    render();
  });

  const tick = () => {
    try {
      const cont = document.querySelector<HTMLElement>(".remotion-studio-composition-container");
      const area = cont?.parentElement;
      if (!cont || !area) { if (box.style.display !== "none") box.style.display = "none"; return; }
      const ar = area.getBoundingClientRect();
      if (ar.width < 140) { if (box.style.display !== "none") box.style.display = "none"; return; }
      render();
      /* the two-screens preview (src/MontageBoth.tsx) draws a black column for this box: sit on it, as wide as it is */
      const col = document.getElementById("__both_col")?.getBoundingClientRect();
      const onCol = !!col && col.width > 40;
      const l = onCol ? Math.round(col!.left + 4) : Math.round(ar.left + 8), t = onCol ? Math.round(col!.top + 4) : Math.round(ar.top + 8);
      const bw = onCol ? `${Math.min(150, Math.round(col!.width - 8))}px` : "100px";
      if (box.style.width !== bw) box.style.width = bw;
      if (box.style.display !== "flex") box.style.display = "flex";
      if (box.style.left !== `${l}px`) box.style.left = `${l}px`;
      if (box.style.top !== `${t}px`) box.style.top = `${t}px`;
    } catch { /* never break the Studio */ }
  };
  w.__frameMarks.timer = window.setInterval(tick, 250);
  tick();
};
/**
 * ELEMENT NAMES UNDER THE SCREEN (user 2026-11-17: «اجعل كل عنصر في المعرض له اسم، وهذا الاسم يظهر في ريموشن تحت الشاشة… عشان لما اطلب تعديله اعرف ايش اطلب»).
 * The montage engine publishes the Arabic names of the elements on screen at the current frame (window.__elNow, src/elementNames.ts); this writes them in a strip
 * in a row of its own at the foot of the viewer (the viewer shrinks above it): one part under each screen of a «-Both» composition, the whole row otherwise.
 * Selectable text, to copy. Studio-only, never breaks the Studio.
 */
const installElementNames = () => {
  const w = window as unknown as { __elNames?: { timer?: number; row?: HTMLElement }; __elNow?: Partial<Record<"port" | "land", string[]>> };
  if (w.__elNames?.timer) window.clearInterval(w.__elNames.timer);
  w.__elNames?.row?.remove();
  /* its OWN row of the Studio's layout (user 2026-11-17: «يأخذ مساحته الخاصة مثل مكان التوقيتات والأزرار… واجعله قابلاً للنسخ»): a strip at the foot of the
     viewer column, so the viewer shrinks above it instead of being covered; plain selectable text (select + Ctrl+C) */
  const row = document.createElement("div");
  row.id = "__el_names_row";
  row.style.cssText = "flex:0 0 22px;height:22px;position:relative;display:none;box-sizing:border-box;border-top:1px solid rgba(255,255,255,.12);background:#1f2428;direction:rtl;font:600 11px Tahoma,Arial,sans-serif;color:#e8e8e8;overflow:hidden;user-select:text;-webkit-user-select:text;cursor:text";
  const cell = () => { const c = document.createElement("div"); c.style.cssText = "position:absolute;top:0;height:21px;line-height:21px;padding:0 8px;box-sizing:border-box;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:center;user-select:text;-webkit-user-select:text"; row.appendChild(c); return c; };
  const cells = [cell(), cell()];
  w.__elNames = { row };
  const text = (names?: string[]) => { if (!names?.length) return "لا عنصر من المعرض الآن"; const c = new Map<string, number>(); for (const n of names) c.set(n, (c.get(n) ?? 0) + 1); return "مستخدم: " + [...c].map(([n, k]) => (k > 1 ? n + " ×" + k : n)).join(" · "); };
  const set = (c: HTMLElement, s: string, left: number, width: number, top = 0, h = 21) => {
    c.style.top = top + "px"; c.style.height = h + "px"; c.style.lineHeight = h + "px";
    if (c.textContent !== s && !(window.getSelection()?.toString() && c.contains(window.getSelection()?.anchorNode ?? null))) { c.textContent = s; c.title = s; }   // never replaced under a selection being copied
    c.style.left = Math.round(left) + "px"; c.style.width = Math.max(40, Math.round(width)) + "px"; c.style.display = "block";
  };
  /** the Studio's viewer column (tabs + canvas): the closest column-flex ancestor of the canvas that also holds the tabs */
  const column = (): HTMLElement | null => {
    const cc = document.querySelector<HTMLElement>(".remotion-studio-composition-container");
    for (let n = cc?.parentElement ?? null; n && n !== document.body; n = n.parentElement) if (getComputedStyle(n).flexDirection === "column" && n.querySelector(".__remotion-canvas-tab")) return n;
    return null;
  };
  const tick = () => {
    try {
      const now = w.__elNow ?? {}, col = column(), any = !!(now.port || now.land);
      if (!col || !any) { if (row.style.display !== "none") row.style.display = "none"; return; }
      if (row.parentElement !== col || col.lastElementChild !== row) col.appendChild(row);
      if (row.style.display !== "block") row.style.display = "block";
      const rr = row.getBoundingClientRect(), P = document.getElementById("__both_port"), L = document.getElementById("__both_land");
      /* the two-screen preview: ONE line — the same elements serve both screens, each at its own size (user 2026-11-17); a name counted as often as on the screen that shows it most */
      const names = P && L ? (() => { const m = new Map<string, number>(); for (const k of ["port", "land"] as const) { const c = new Map<string, number>(); for (const n of now[k] ?? []) c.set(n, (c.get(n) ?? 0) + 1); for (const [n, v] of c) m.set(n, Math.max(m.get(n) ?? 0, v)); } return [...m].flatMap(([n, v]) => Array(v).fill(n) as string[]); })() : now[now.land ? "land" : "port"];
      set(cells[0], text(names), 0, rr.width);
      cells[1].style.display = "none";
    } catch { /* never break the Studio */ }
  };
  w.__elNames.timer = window.setInterval(tick, 250);
  tick();
};
/**
 * Deep link (user 2026-11-09): /<CompId>?<frame> jumps to that frame, /<CompId>?<m>.<ss> to minute m, second ss (e.g. ?1.10 = 1:10). Studio-only; retries until the composition
 * is loaded (the frame counter exists), seeks, and stops once the jump took effect. Never breaks the Studio.
 */
const installDeepLink = () => {
  const q = decodeURIComponent(location.search.replace(/^\?/, "")).replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660)).trim();
  const m = /^(\d+)\.(\d{1,2})$/.exec(q), f = /^\d+$/.test(q) ? Number(q) : m ? (Number(m[1]) * 60 + Number(m[2])) * 30 : null;
  if (f === null) return;
  const comp = decodeURIComponent(location.pathname.split("/").filter(Boolean)[0] ?? "");
  let tries = 0, sent = 0;
  const timer = window.setInterval(() => {
    try {
      const real = document.querySelector<HTMLElement>('button[aria-label^="Show timeline ticks"]');
      const cur = (real?.textContent ?? "").trim();
      const set = (window as unknown as { remotion_setFrame?: (f: number, c: string, a: number) => void }).remotion_setFrame;
      if (/^\d{1,7}$/.test(cur) && set) {
        if (sent && Number(cur) === f) { window.clearInterval(timer); return; }
        set(f, comp, 1);
        if (++sent > 10) window.clearInterval(timer);
      }
    } catch { /* ignore */ }
    if (++tries > 120) window.clearInterval(timer);
  }, 500);
};

/** A Studio-only grading panel for the current montage, with named presets saved in this browser. */
const installFilterPanel = () => {
  const w = window as unknown as {
    __filterPanel?: { timer?: number; root?: HTMLElement; autoSelected?: boolean };
    __remotionFilterCurrent?: FilterSettings;
  };
  if (w.__filterPanel?.timer) window.clearInterval(w.__filterPanel.timer);
  w.__filterPanel?.root?.remove();
  w.__filterPanel = {};

  const key = "remotion.filter-presets.v1";
  const neutral: FilterSettings = { brightness: 100, contrast: 100, saturation: 100, sepia: 0, temperature: 0, tint: 0, shadowLift: 0, highlightRollOff: 0, warmth: 0, vignette: 0, glow: 0 };
  const cinematic: FilterSettings = { brightness: 82, contrast: 123, saturation: 78, sepia: 10, temperature: 45, tint: 2, shadowLift: 3, highlightRollOff: 68, warmth: 10, vignette: 42, glow: 0 };
  const getComposition = () => decodeURIComponent(location.pathname.split("/").filter(Boolean)[0] ?? "");
  const isTarget = () => ["Idlib-Imam", "Idlib-Imam-L"].includes(getComposition());
  const getSaved = (): SavedFilter[] => {
    try { return JSON.parse(localStorage.getItem(key) ?? "[]") as SavedFilter[]; } catch { return []; }
  };
  const normalize = (settings?: Partial<FilterSettings>): FilterSettings => ({ ...neutral, ...(settings ?? {}) });
  let values = normalize(w.__remotionFilterCurrent);

  const root = document.createElement("section");
  root.id = "__remotion_filter_panel";
  root.dir = "rtl";
  root.setAttribute("aria-label", "لوحة Filter");
  root.style.cssText = "width:100%;min-height:100%;box-sizing:border-box;padding:14px;overflow:auto;background:#191d24;color:#f4f7fb;font:14px/1.45 Tahoma,Arial,sans-serif;color-scheme:dark";
  root.innerHTML = `
    <div role="tablist" aria-label="أقسام الفلتر" style="display:flex;gap:6px;margin-bottom:10px">
      <button type="button" role="tab" data-tab="ready" aria-selected="true" style="flex:1;padding:8px;border:1px solid #68aaff;border-radius:6px;background:#155b99;color:#fff;font-weight:600;cursor:pointer">فلاتر جاهزة</button>
      <button type="button" role="tab" data-tab="adjust" aria-selected="false" style="flex:1;padding:8px;border:1px solid #667181;border-radius:6px;background:#252b34;color:#f4f7fb;cursor:pointer">الضبط</button>
    </div>
    <div data-view="ready" role="tabpanel">
      <button type="button" data-cinematic style="width:100%;padding:10px;border:1px solid #a96c3d;border-radius:7px;background:linear-gradient(110deg,#68452f,#28221e);color:#fff;text-align:right;font-weight:600;cursor:pointer">مقابلة دافئة: ظلال أعمق وإضاءات محفوظة</button>
      <div style="margin:6px 2px 12px;color:#cbd5e1;font-size:12px">دفء لوني مضبوط مع الحفاظ على تفاصيل الوجه والإضاءات. لا يضيف مصدر ضوء غير موجود في اللقطة.</div>
      <div data-saved-list style="display:grid;gap:7px"></div>
      <button type="button" data-save style="width:100%;margin-top:10px;padding:8px;border:1px solid #3779bd;border-radius:6px;background:#155b99;color:#fff;font-weight:600;cursor:pointer">حفظ الإعداد الحالي كفلتر جاهز</button>
    </div>
    <div data-view="adjust" role="tabpanel" hidden><div data-controls></div>
      <button type="button" data-save style="width:100%;margin-top:8px;padding:8px;border:1px solid #3779bd;border-radius:6px;background:#155b99;color:#fff;font-weight:600;cursor:pointer">حفظ الإعداد الحالي كفلتر جاهز</button>
      <button type="button" data-reset style="width:100%;margin-top:8px;padding:7px;border:1px solid #667181;border-radius:6px;background:#252b34;color:#f4f7fb;cursor:pointer">إعادة للوضع الطبيعي</button>
    </div>
    <div data-status role="status" aria-live="polite" style="min-height:20px;margin-top:8px;color:#cbd5e1;font-size:12px"></div>
  `;
  w.__filterPanel.root = root;

  const sliders: { key: keyof FilterSettings; label: string; min: number; max: number }[] = [
    { key: "brightness", label: "السطوع", min: 0, max: 200 },
    { key: "contrast", label: "التباين", min: 0, max: 200 },
    { key: "saturation", label: "تشبع الألوان", min: 0, max: 200 },
    { key: "sepia", label: "الدفء البني (Sepia)", min: 0, max: 100 },
    { key: "temperature", label: "حرارة اللون (بارد ← دافئ)", min: -100, max: 100 },
    { key: "tint", label: "الصبغة (أخضر ← أرجواني)", min: -100, max: 100 },
    { key: "shadowLift", label: "رفع تفاصيل الظلال", min: 0, max: 100 },
    { key: "highlightRollOff", label: "حماية الإضاءات الساطعة", min: 0, max: 100 },
    { key: "warmth", label: "دفء الإضاءة", min: 0, max: 100 },
    { key: "vignette", label: "تظليل الأطراف", min: 0, max: 100 },
    { key: "glow", label: "وهج الإضاءة", min: 0, max: 100 },
  ];
  const controls = root.querySelector<HTMLElement>("[data-controls]")!;
  for (const slider of sliders) {
    const row = document.createElement("label");
    row.style.cssText = "display:block;margin:12px 0 14px;color:#f4f7fb";
    row.innerHTML = `<span style="display:flex;justify-content:space-between;gap:8px;margin-bottom:5px"><span>${slider.label}</span><output data-value="${slider.key}"></output></span><input data-slider="${slider.key}" type="range" min="${slider.min}" max="${slider.max}" step="1" style="display:block;width:100%;height:24px;accent-color:#68aaff;cursor:pointer">`;
    controls.appendChild(row);
  }
  const status = root.querySelector<HTMLElement>("[data-status]")!;
  const savedList = root.querySelector<HTMLElement>("[data-saved-list]")!;
  const refreshSavedFilters = () => {
    const saved = getSaved();
    savedList.replaceChildren();
    if (!saved.length) {
      const empty = document.createElement("div"); empty.textContent = "فلاترك المحفوظة ستظهر هنا.";
      empty.style.cssText = "padding:10px;border:1px dashed #667181;border-radius:7px;color:#cbd5e1;font-size:12px";
      savedList.appendChild(empty);
    }
    for (const preset of saved) {
      const card = document.createElement("div");
      card.style.cssText = "display:grid;grid-template-columns:1fr auto auto;align-items:center;gap:6px;padding:7px;border:1px solid #596575;border-radius:7px;background:#202630;color:#f4f7fb";
      const name = document.createElement("span"); name.textContent = preset.name; name.title = preset.name;
      const apply = document.createElement("button"); apply.type = "button"; apply.textContent = "تطبيق";
      apply.style.cssText = "padding:6px 8px;border:1px solid #3779bd;border-radius:5px;background:#155b99;color:#fff;cursor:pointer";
      apply.addEventListener("click", () => { void applyToStudio(normalize(preset.settings)); });
      const remove = document.createElement("button"); remove.type = "button"; remove.textContent = "حذف";
      remove.setAttribute("aria-label", `حذف الفلتر ${preset.name}`);
      remove.style.cssText = "padding:6px 8px;border:1px solid #667181;border-radius:5px;background:#252b34;color:#f4f7fb;cursor:pointer";
      remove.addEventListener("click", () => {
        const fresh = getSaved().filter((item) => item.name !== preset.name);
        localStorage.setItem(key, JSON.stringify(fresh)); refreshSavedFilters(); status.textContent = `حُذف الفلتر «${preset.name}».`;
      });
      card.append(name, apply, remove); savedList.appendChild(card);
    }
  };
  const paint = (next: Partial<FilterSettings>) => {
    values = normalize(next);
    w.__remotionFilterCurrent = values;
    for (const slider of sliders) {
      const input = root.querySelector<HTMLInputElement>(`[data-slider="${slider.key}"]`)!;
      const output = root.querySelector<HTMLOutputElement>(`[data-value="${slider.key}"]`)!;
      input.value = String(values[slider.key]);
      output.value = `${values[slider.key]}%`;
      output.textContent = `${values[slider.key]}%`;
    }
  };
  const applyToStudio = async (next: FilterSettings) => {
    paint(next);
    status.textContent = "جارٍ تحديث المعاينة…";
    try {
      for (const compositionId of ["Idlib-Imam-L", "Idlib-Imam"]) {
        await saveDefaultProps({
          compositionId,
          defaultProps: ({ savedDefaultProps }) => ({ ...savedDefaultProps, Filter: { ...neutral, ...(savedDefaultProps.Filter as Partial<FilterSettings>), ...next } }),
        });
      }
      status.textContent = "حُدّثت المعاينة وحُفظت القيم في التركيبة.";
    } catch {
      status.textContent = "تعذّر حفظ القيم. تأكد أن Studio يعمل بوضع التحرير.";
    }
  };

  refreshSavedFilters();
  paint(values);
  for (const slider of sliders) {
    const input = root.querySelector<HTMLInputElement>(`[data-slider="${slider.key}"]`)!;
    input.addEventListener("input", () => {
      values = { ...values, [slider.key]: Number(input.value) };
      w.__remotionFilterCurrent = values;
      const output = root.querySelector<HTMLOutputElement>(`[data-value="${slider.key}"]`)!;
      output.value = `${input.value}%`; output.textContent = `${input.value}%`;
    });
    input.addEventListener("change", () => { void applyToStudio(values); });
  }
  for (const saveButton of root.querySelectorAll<HTMLButtonElement>("[data-save]")) {
    saveButton.addEventListener("click", () => {
      const name = window.prompt("اكتب اسمًا لهذا الفلتر:")?.trim();
      if (!name) return;
      const saved = getSaved();
      const existing = saved.findIndex((preset) => preset.name === name);
      const entry = { name, settings: { ...values } };
      if (existing >= 0) saved[existing] = entry; else saved.push(entry);
      localStorage.setItem(key, JSON.stringify(saved)); refreshSavedFilters();
      status.textContent = `حُفظ الفلتر «${name}» على هذا الجهاز.`;
    });
  }
  root.querySelector<HTMLButtonElement>("[data-cinematic]")!.addEventListener("click", () => { void applyToStudio(cinematic); });
  root.querySelector<HTMLButtonElement>("[data-reset]")!.addEventListener("click", () => { void applyToStudio(neutral); });
  for (const tabButton of root.querySelectorAll<HTMLButtonElement>("[data-tab]")) {
    tabButton.addEventListener("click", () => {
      const selected = tabButton.dataset.tab;
      for (const candidate of root.querySelectorAll<HTMLButtonElement>("[data-tab]")) {
        const active = candidate === tabButton;
        candidate.setAttribute("aria-selected", String(active));
        candidate.style.background = active ? "#155b99" : "#252b34";
        candidate.style.borderColor = active ? "#68aaff" : "#667181";
      }
      for (const view of root.querySelectorAll<HTMLElement>("[data-view]")) view.hidden = view.dataset.view !== selected;
    });
  }
  const tick = () => {
    try {
      const visible = isTarget();
      const nativeTab = Array.from(document.querySelectorAll<HTMLElement>("[role=button]")).find((element) => element.textContent?.trim() === "Filter");
      const nativePanel = document.getElementById("remotion-native-filter-panel");
      if (nativeTab) nativeTab.style.display = visible ? "flex" : "none";
      if (nativePanel && root.parentElement !== nativePanel) nativePanel.appendChild(root);
      if (!visible) root.remove();
      if (visible && w.__filterPanel && !w.__filterPanel.autoSelected && nativeTab) {
        w.__filterPanel.autoSelected = true;
        nativeTab.click();
      }
      const current = w.__remotionFilterCurrent;
      if (visible && current && sliders.every(({ key: field }) => Number(root.querySelector<HTMLInputElement>(`[data-slider="${field}"]`)?.value) === current[field])) return;
      if (visible && current) paint(current);
    } catch { /* never break the Studio */ }
  };
  w.__filterPanel.timer = window.setInterval(tick, 400);
  tick();
};

try {
  if (typeof window !== "undefined" && typeof document !== "undefined" && getRemotionEnvironment().isStudio) { install(); installTitles(); installMobile(); installMarks(); installElementNames(); installDeepLink(); installFilterPanel(); }
} catch { /* ignore */ }
