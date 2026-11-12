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
  css.textContent = `@media ${MQ}{[data-mt="left"]{flex:0 0 170px !important;min-width:170px !important}[data-mt="left"]>*{display:none !important}[data-mt="head"]{width:170px !important}[data-mt="ruler"]{left:173px !important;width:calc(100% - 173px) !important}}`;
  document.head.appendChild(css);

  const FPS = 30;
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
    b.style.cssText = "position:fixed;z-index:2147483000;display:none;width:40px;height:40px;padding:0;border:0;border-radius:20px;background:transparent;color:#fff;cursor:pointer;align-items:center;justify-content:center;touch-action:manipulation";
    b.innerHTML = svg;
    b.addEventListener("click", (e) => { e.stopPropagation(); on(); });
    document.body.appendChild(b);
    return b;
  };
  const arrow = (dir: 1 | -1) => `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="transform:${dir === 1 ? "scaleX(-1)" : "none"}"><path d="M4 12a8 8 0 1 0 2.6-5.9"/><path d="M4 4v4.2h4.2"/><text x="12" y="15.6" text-anchor="middle" font-size="8.5" font-weight="700" fill="currentColor" stroke="none" font-family="Arial,sans-serif">10</text></svg>`;
  const startSvg = `<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="5" width="2.6" height="14" rx="1"/><path d="M19 5.5v13a1 1 0 0 1-1.6.8l-9-6.5a1 1 0 0 1 0-1.6l9-6.5A1 1 0 0 1 19 5.5z"/></svg>`;
  const bStart = mk("__mt_start", "رجوع للبداية", startSvg, () => seekTo(0));
  const bBack = mk("__mt_back", "رجوع 10 ثوانٍ", arrow(-1), () => { const n = frameNow(); if (n !== null) seekTo(n - 10 * FPS); });
  const bFwd = mk("__mt_fwd", "تقديم 10 ثوانٍ", arrow(1), () => { const n = frameNow(); if (n !== null) seekTo(n + 10 * FPS); });
  const all = [bStart, bBack, bFwd];
  w.__mobileTools.box = bStart;
  const hideAll = () => { for (const b of all) if (b.style.display !== "none") b.style.display = "none"; };
  const show = (b: HTMLElement, left: number, top: number) => { if (b.style.display !== "flex") b.style.display = "flex"; b.style.left = `${left}px`; b.style.top = `${top}px`; };

  const tick = () => {
    try {
      // ---- hide the layer column (narrow screens only): mark the split panes by structure
      const t = document.querySelector<HTMLElement>('button[aria-label^="Show timeline ticks"]');
      let H: HTMLElement | null = t;
      while (H && !(H.style.position === "absolute" && H.style.left === "0%")) H = H.parentElement;
      if (H?.parentElement) {
        H.setAttribute("data-mt", "head");
        for (const c of Array.from(H.parentElement.children) as HTMLElement[]) {
          if (c === H) continue;
          if (c.style.position === "absolute" && c.style.left !== "0%") c.setAttribute("data-mt", "ruler");
          else if (c.style.minWidth === "240px") c.setAttribute("data-mt", "left");
        }
      }
      // ---- buttons beside Play (only when Studio's own navigation buttons are not shown)
      const play = document.querySelector<HTMLElement>('button[aria-label="Play"], button[aria-label="Pause"]');
      const nat = document.querySelector<HTMLElement>('button[aria-label="Go to beginning"]');
      if (!play || !window.matchMedia(MQ).matches || (nat && nat.getBoundingClientRect().width > 0)) { hideAll(); return; }
      const pr = play.getBoundingClientRect();
      if (pr.width === 0) { hideAll(); return; }
      const top = Math.round(pr.top + (pr.height - 40) / 2);
      show(bBack, Math.round(pr.left + pr.width / 2 - 20 - 46), top);
      show(bStart, Math.round(pr.left + pr.width / 2 - 20 - 92), top);
      show(bFwd, Math.round(pr.left + pr.width / 2 - 20 + 46), top);
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
      const l = Math.round(ar.left + 8), t = Math.round(ar.top + 8);
      if (box.style.display !== "flex") box.style.display = "flex";
      if (box.style.left !== `${l}px`) box.style.left = `${l}px`;
      if (box.style.top !== `${t}px`) box.style.top = `${t}px`;
    } catch { /* never break the Studio */ }
  };
  w.__frameMarks.timer = window.setInterval(tick, 250);
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
try {
  if (typeof window !== "undefined" && typeof document !== "undefined" && getRemotionEnvironment().isStudio) { install(); installTitles(); installMobile(); installMarks(); installDeepLink(); }
} catch { /* ignore */ }
