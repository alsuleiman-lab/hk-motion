/**
 * HK-MOTION GALLERY PANEL (user 2026-11-19: «ادمج نسختنا مع المعرض… يسهّل على برنامج المونتاج أن يأخذ شيئاً معيّناً من المعرض ويضيفه مباشرة، والتواصل مع المعرض من أساس البرنامج،
 * مع أريحية المقاسات»). A bottom sheet inside the Studio, opened from the «المعرض» button of the HK row (src/studioTools.ts):
 *   · «إضافة»   the gallery's elements (tools/hk_gallery.mjs registry: Arabic name, what it is for, its fields), a search box; pick one, fill its content, press «أضف» — it is added
 *               to the montage at the Studio's CURRENT frame (tools/hk_server.mjs → tools/el.mjs add: content and timing only, size and place stay the gallery's); the Studio shows it at once.
 *               Under each element the user's decision about it (أبقِه / عدّله / احذفه + a note) is saved in the gallery's notes: how the gallery is updated and developed.
 *   · «الآن»    the elements on screen at the current frame: delete, bigger / smaller (small / medium / large steps), nudge in four directions, for the portrait, the landscape or both
 *               (this element's own size, on top of the gallery's), and reset.
 *   · «مقاس المعرض»  the gallery's size of an element type for one orientation: it applies to EVERY video (asks first).
 * Studio-only; every call goes to the tools server at the page's own host (the Studio's port + 99). Never breaks the Studio.
 */
export type GalleryCtx = { comp: () => string; frameNow: () => number | null; api: (p: string) => string };
type Field = { name: string; required: boolean; type: string };
type El = { code: string; ar: string; group: string; orient: string; when: string; fields: Field[]; status: string; uses: number; place: Record<"land" | "port", { dx: number; dy: number; scale: number }> };
type Presets = { presets: { name: string; k: number }[]; step: number; kStep: number; bounds: { k: number[]; d: number } };
type Item = { id: string; code: string; ar: string; from: number | null; to: number | null; text: string; dx: number; dy: number; k: number; land: { dx: number; dy: number; k: number } };

const TIMING = new Set(["at", "until", "from", "to", "dur"]);
const NOT_CONTENT = new Set(["t", "id", "el", "x", "y", "w", "h", "W", "H", "size", "land", "only", "dx", "dy", "k", "placeOwn", "noShift", "slot", "ratio", "galleryRef", "right", "side"]);
const ORIENT = { both: "الاثنان", port: "الطولي", land: "العرضي" } as const;

let openState: { root: HTMLElement; close: () => void } | null = null;

export const openGalleryPanel = (ctx: GalleryCtx): void => {
  if (openState) { openState.close(); return; }
  const mk = <K extends keyof HTMLElementTagNameMap>(tag: K, css = "", text?: string): HTMLElementTagNameMap[K] => { const e = document.createElement(tag); if (css) e.style.cssText = css; if (text !== undefined) e.textContent = text; return e; };
  const btn = (label: string, bg = "var(--hk-btn)", extra = "") => { const b = mk("button", `flex:0 0 auto;height:30px;padding:0 11px;border:1px solid var(--hk-line-strong);border-radius:8px;background:${bg};color:${bg.includes('accent') ? 'var(--hk-accent-text)' : 'var(--hk-text)'};font:700 13px Tahoma,Arial,sans-serif;cursor:pointer;${extra}`, label); b.type = "button"; return b; };
  const input = (ph: string, extra = "") => { const i = mk("input", `width:100%;box-sizing:border-box;height:32px;padding:0 9px;border:1px solid var(--hk-line-strong);border-radius:8px;background:var(--hk-input);color:var(--hk-text);font:600 13px Tahoma,Arial,sans-serif;direction:rtl;${extra}`); i.placeholder = ph; return i; };

  const root = mk("div", "position:fixed;left:0;right:0;bottom:0;height:min(58vh,520px);z-index:2147483200;display:flex;flex-direction:column;box-sizing:border-box;background:var(--hk-bg);border-top:2px solid var(--hk-accent);box-shadow:0 -10px 30px rgba(0,0,0,.55);direction:rtl;font:600 13px Tahoma,Arial,sans-serif;color:var(--hk-text)");
  root.id = "__hk_gallery";
  const head = mk("div", "flex:0 0 42px;display:flex;align-items:center;gap:6px;padding:0 10px;border-bottom:1px solid var(--hk-line);overflow-x:auto;white-space:nowrap");
  const title = mk("span", "flex:0 0 auto;color:var(--hk-accent);font:800 14px Tahoma,Arial,sans-serif", "معرض HK");
  const tabs: Record<string, HTMLButtonElement> = { add: btn("إضافة"), now: btn("الآن"), gal: btn("مقاس المعرض") };
  const status = mk("span", "flex:1 0 auto;min-width:60px;overflow:hidden;text-overflow:ellipsis;font-size:12px");
  const closeB = btn("×", "var(--hk-danger)"); closeB.style.minWidth = "34px";
  head.append(title, tabs.add, tabs.now, tabs.gal, status, closeB);
  const body = mk("div", "flex:1 1 0;min-height:0;overflow-y:auto;padding:10px;box-sizing:border-box");
  root.append(head, body); document.body.appendChild(root);
  const say = (m: string, c = "var(--hk-text)") => { status.textContent = m; status.style.color = c; };

  const post = async <T = Record<string, unknown>>(path: string, data: unknown): Promise<T> => {
    const res = await fetch(ctx.api(path), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
    const j = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) throw new Error(String(j.error ?? res.status));
    return j as T;
  };

  let elements: El[] = [], presets: Presets | null = null, tab: "add" | "now" | "gal" = "add";
  let picked: El | null = null, query = "";

  const loadCatalog = async () => {
    const j = await post<{ elements: El[]; sizePresets: Presets; version: number }>("/api/gallery/list", {});
    elements = j.elements; presets = j.sizePresets; say(`${elements.length} عنصراً · الإصدار ${j.version}`);
  };

  const paintTabs = () => { for (const [k, b] of Object.entries(tabs)) { b.style.background = k === tab ? "var(--hk-btn-on)" : "var(--hk-btn)"; } };

  /* ---------- إضافة ---------- */
  const viewAdd = () => {
    body.textContent = "";
    if (!picked) {
      const q = input("ابحث بالاسم أو الرمز أو المجموعة…"); q.value = query; body.appendChild(q);
      const list = mk("div", "display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:7px;margin-top:9px"); body.appendChild(list);
      const paint = () => {
        list.textContent = "";
        const needle = q.value.trim(); query = q.value;
        for (const e of elements.filter((x) => !needle || `${x.ar} ${x.code} ${x.group}`.includes(needle))) {
          const c = mk("button", "text-align:right;padding:8px 10px;border:1px solid var(--hk-line-strong);border-radius:10px;background:var(--hk-card);color:var(--hk-text);cursor:pointer;display:flex;flex-direction:column;gap:3px"); c.type = "button";
          const dot = e.status === "keep" ? "var(--hk-ok)" : e.status === "change" ? "var(--hk-warn)" : e.status === "drop" ? "#e05555" : "#566";
          c.append(mk("span", "font:800 13px Tahoma,Arial,sans-serif", e.ar || e.code), mk("span", "font:600 11px Arial,sans-serif;color:var(--hk-dim);direction:ltr;text-align:right", `${e.code} · ${e.group || "—"}`), mk("span", `font:600 11px Tahoma,Arial,sans-serif;color:${dot}`, `● استُعمل ${e.uses}${e.orient && e.orient !== "both" ? ` · ${e.orient === "land" ? "عرضي" : "طولي"} فقط` : ""}`));
          c.addEventListener("click", () => { picked = e; viewAdd(); });
          list.appendChild(c);
        }
      };
      q.addEventListener("input", paint); paint(); return;
    }
    const e = picked;
    const back = btn("← العناصر"); back.addEventListener("click", () => { picked = null; viewAdd(); });
    body.append(back, mk("div", "margin:8px 0 2px;font:800 15px Tahoma,Arial,sans-serif;color:var(--hk-accent)", e.ar || e.code), mk("div", "font:600 11px Arial,sans-serif;color:var(--hk-dim);direction:ltr;text-align:right", `${e.code} · ${e.group}`));
    if (e.when) body.appendChild(mk("div", "margin:6px 0 10px;line-height:1.6;color:var(--hk-text)", e.when));
    const form = mk("div", "display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:9px"); body.appendChild(form);
    const fields = e.fields.filter((f) => !TIMING.has(f.name) && !NOT_CONTENT.has(f.name));
    const ins: Record<string, HTMLInputElement | HTMLTextAreaElement> = {};
    for (const f of fields) {
      const wrap = mk("label", "display:flex;flex-direction:column;gap:4px");
      const structured = /\[\]|\{/.test(f.type);
      wrap.appendChild(mk("span", "font-size:12px;color:var(--hk-dim)", `${f.name}${f.required ? " *" : ""}${structured ? " (قائمة JSON)" : f.type === "number" ? " (رقم)" : ""}`));
      let el: HTMLInputElement | HTMLTextAreaElement;
      if (structured) { const t = mk("textarea", "min-height:64px;box-sizing:border-box;padding:7px 9px;border:1px solid var(--hk-line-strong);border-radius:8px;background:var(--hk-input);color:var(--hk-text);font:600 12px Consolas,monospace;direction:ltr"); t.placeholder = '[{"text":"…","at":1.2}]'; el = t; }
      else { const i = input(f.required ? "إلزامي" : "اختياري"); if (f.type === "number") { i.type = "number"; i.step = "any"; i.style.direction = "ltr"; } el = i; }
      ins[f.name] = el; wrap.appendChild(el); form.appendChild(wrap);
    }
    const len = input("المدة بالثواني"); len.type = "number"; len.value = "4"; len.step = "0.5"; len.style.maxWidth = "120px"; len.style.direction = "ltr";
    const at = mk("div", "margin:12px 0 6px;display:flex;align-items:center;gap:10px;flex-wrap:wrap");
    const go = btn("أضف عند الإطار الحالي", "var(--hk-accent)");
    const lenWrap = mk("label", "display:flex;align-items:center;gap:6px", "المدة (ث)"); lenWrap.appendChild(len);
    at.append(go, lenWrap); body.appendChild(at);
    go.addEventListener("click", async () => {
      const f = ctx.frameNow(); if (f === null) { say("لا أقرأ إطار الاستوديو الحالي", "#ff9a9a"); return; }
      const values: Record<string, unknown> = {};
      for (const fl of fields) { const v = ins[fl.name].value.trim(); if (!v) continue; if (/\[\]|\{/.test(fl.type)) { try { values[fl.name] = JSON.parse(v); } catch { say(`«${fl.name}»: JSON غير صالح`, "#ff9a9a"); return; } } else values[fl.name] = fl.type === "number" ? Number(v) : v; }
      go.disabled = true; say("… أضيف", "var(--hk-warn)");
      try { const r = await post<{ message: string }>("/api/gallery/add", { comp: ctx.comp(), code: e.code, frame: f, len: Number(len.value) || 4, fields: values }); say(r.message, "var(--hk-ok)"); }
      catch (err) { say(String((err as Error).message), "#ff9a9a"); }
      finally { go.disabled = false; }
    });
    // the user's decision about this element: the gallery's own notes (how it is updated and developed)
    const dec = mk("div", "margin-top:16px;padding-top:10px;border-top:1px solid var(--hk-line);display:flex;align-items:center;gap:7px;flex-wrap:wrap");
    dec.appendChild(mk("span", "font-size:12px;color:var(--hk-dim)", "قراري في هذا العنصر:"));
    const note = input("ملاحظة (اختيارية)"); note.style.maxWidth = "260px";
    const mkSt = (label: string, st: string, bg: string) => { const b = btn(label, e.status === st ? bg : "var(--hk-btn)"); b.addEventListener("click", async () => { try { const r = await post<{ message: string }>("/api/gallery/status", { code: e.code, status: st, note: note.value.trim() }); e.status = st; say(r.message, "var(--hk-ok)"); viewAdd(); } catch (err) { say(String((err as Error).message), "#ff9a9a"); } }); return b; };
    dec.append(mkSt("أبقِه", "keep", "#1f6a3a"), mkSt("عدّله", "change", "#8a6a12"), mkSt("احذفه", "drop", "var(--hk-danger)"), mkSt("بلا حالة", "none", "var(--hk-btn)"), note);
    body.appendChild(dec);
  };

  /* ---------- الآن ---------- */
  const viewNow = async () => {
    body.textContent = "";
    const f = ctx.frameNow(); if (f === null) { body.textContent = "لا أقرأ إطار الاستوديو الحالي"; return; }
    let items: Item[] = [];
    try { items = (await post<{ items: Item[] }>("/api/gallery/items", { comp: ctx.comp(), frame: f })).items; } catch (err) { say(String((err as Error).message), "#ff9a9a"); return; }
    body.appendChild(mk("div", "margin-bottom:8px;color:var(--hk-dim)", `العناصر على الشاشة عند الإطار ${f}: ${items.length}`));
    if (!items.length) body.appendChild(mk("div", "color:var(--hk-dim)", "لا عنصر من المعرض الآن. انتقل إلى إطار فيه عنصر، أو أضف من «إضافة»."));
    let orient: keyof typeof ORIENT = "both";
    const ob = mk("div", "display:flex;gap:6px;margin-bottom:10px;align-items:center"); ob.appendChild(mk("span", "color:var(--hk-dim)", "المقاس يُضبط على:"));
    const obs: Record<string, HTMLButtonElement> = {};
    const paintO = () => { for (const [k, b] of Object.entries(obs)) b.style.background = k === orient ? "var(--hk-btn-on)" : "var(--hk-btn)"; };
    for (const k of Object.keys(ORIENT) as (keyof typeof ORIENT)[]) { const b = btn(ORIENT[k]); obs[k] = b; b.addEventListener("click", () => { orient = k; paintO(); }); ob.appendChild(b); }
    paintO(); if (items.length) body.appendChild(ob);
    const P = presets ?? { presets: [], step: 30, kStep: 0.05, bounds: { k: [0.4, 2.5], d: 1600 } };
    const clampK = (k: number) => Math.min(P.bounds.k[1], Math.max(P.bounds.k[0], Math.round(k * 100) / 100));
    const apply = async (it: Item, change: (cur: { dx: number; dy: number; k: number }) => Partial<{ dx: number; dy: number; k: number }> | "reset") => {
      try {
        for (const o of orient === "both" ? (["port", "land"] as const) : ([orient] as const)) {
          const cur = o === "land" ? it.land : { dx: it.dx, dy: it.dy, k: it.k }, ch = change(cur);
          await post("/api/gallery/size", { comp: ctx.comp(), id: it.id, orient: o, ...(ch === "reset" ? { reset: true } : ch) });
        }
        say("✔ ضُبط", "var(--hk-ok)"); await viewNow();
      } catch (err) { say(String((err as Error).message), "#ff9a9a"); }
    };
    for (const it of items) {
      const card = mk("div", "padding:9px 10px;margin-bottom:9px;border:1px solid var(--hk-line-strong);border-radius:10px;background:var(--hk-card)");
      const top = mk("div", "display:flex;align-items:center;gap:8px;flex-wrap:wrap");
      top.append(mk("span", "font:800 13px Tahoma,Arial,sans-serif;color:var(--hk-accent)", it.ar || it.code), mk("span", "color:var(--hk-dim);font-size:12px", `${it.from?.toFixed(1)}–${it.to?.toFixed(1)} ث${it.text ? ` · «${it.text}»` : ""}`));
      const sz = mk("div", "margin-top:8px;display:flex;gap:6px;flex-wrap:wrap;align-items:center");
      const b = (label: string, fn: () => void, bg = "var(--hk-btn)") => { const x = btn(label, bg); x.addEventListener("click", fn); return x; };
      sz.appendChild(mk("span", "color:var(--hk-dim);font-size:12px", "الحجم:"));
      for (const pr of P.presets) sz.appendChild(b(pr.name, () => apply(it, () => ({ k: pr.k }))));
      sz.append(b("−", () => apply(it, (c) => ({ k: clampK(c.k - P.kStep) }))), b("+", () => apply(it, (c) => ({ k: clampK(c.k + P.kStep) }))));
      const nv = mk("div", "margin-top:8px;display:flex;gap:6px;flex-wrap:wrap;align-items:center");
      nv.appendChild(mk("span", "color:var(--hk-dim);font-size:12px", "الإزاحة:"));
      nv.append(b("◀", () => apply(it, (c) => ({ dx: c.dx - P.step }))), b("▶", () => apply(it, (c) => ({ dx: c.dx + P.step }))), b("▲", () => apply(it, (c) => ({ dy: c.dy - P.step }))), b("▼", () => apply(it, (c) => ({ dy: c.dy + P.step }))), b("إعادة", () => apply(it, () => "reset"), "var(--hk-btn)"));
      const del = b("حذف العنصر", async () => { if (!window.confirm(`حذف «${it.ar || it.code}» من المونتاج؟`)) return; try { const r = await post<{ message: string }>("/api/gallery/del", { comp: ctx.comp(), id: it.id }); say(r.message, "var(--hk-ok)"); await viewNow(); } catch (err) { say(String((err as Error).message), "#ff9a9a"); } }, "var(--hk-danger)");
      nv.appendChild(del);
      const cur = mk("div", "margin-top:6px;color:var(--hk-dim);font-size:11px;direction:ltr;text-align:right", `طولي k=${it.k} dx=${it.dx} dy=${it.dy}  ·  عرضي k=${it.land.k} dx=${it.land.dx} dy=${it.land.dy}`);
      card.append(top, sz, nv, cur); body.appendChild(card);
    }
  };

  /* ---------- مقاس المعرض ---------- */
  const viewGal = () => {
    body.textContent = "";
    body.appendChild(mk("div", "margin-bottom:8px;color:var(--hk-warn);line-height:1.6", "تنبيه: هذا مقاس العنصر في المعرض، ويسري على كل المونتاجات (لا على هذا وحده). لمقاس عنصر واحد في هذا المونتاج استعمل «الآن»."));
    const sel = mk("select", "width:100%;height:34px;border-radius:8px;background:var(--hk-input);color:var(--hk-text);border:1px solid var(--hk-line-strong);font:600 13px Tahoma,Arial,sans-serif;direction:rtl");
    for (const e of elements) { const o = mk("option", "", `${e.ar || e.code} — ${e.code}`); o.value = e.code; sel.appendChild(o); }
    let orient: "land" | "port" = "land";
    const ob = mk("div", "display:flex;gap:6px;margin:10px 0;align-items:center"); ob.appendChild(mk("span", "color:var(--hk-dim)", "الاتجاه:"));
    const obs: Record<string, HTMLButtonElement> = {};
    const info = mk("div", "margin:8px 0;color:var(--hk-dim);direction:ltr;text-align:right;font-size:12px");
    const cur = () => elements.find((x) => x.code === sel.value);
    const paintI = () => { const e = cur(); const p = e?.place[orient]; info.textContent = p ? `${orient}: scale=${p.scale} dx=${p.dx} dy=${p.dy}` : ""; for (const [k, b] of Object.entries(obs)) b.style.background = k === orient ? "var(--hk-btn-on)" : "var(--hk-btn)"; };
    for (const k of ["land", "port"] as const) { const b = btn(k === "land" ? "العرضي" : "الطولي"); obs[k] = b; b.addEventListener("click", () => { orient = k; paintI(); }); ob.appendChild(b); }
    sel.addEventListener("change", paintI);
    const P = presets ?? { presets: [], step: 30, kStep: 0.05, bounds: { k: [0.4, 2.5], d: 1600 } };
    const run = async (data: Record<string, unknown>, what: string) => {
      const e = cur(); if (!e) return;
      if (!window.confirm(`${what} «${e.ar || e.code}» في المعرض (${orient === "land" ? "العرضي" : "الطولي"}) لكل المونتاجات؟`)) return;
      try { const r = await post<{ message: string }>("/api/gallery/size", { gallery: true, code: e.code, orient, ...data }); say(r.message, "var(--hk-ok)"); const j = await post<{ elements: El[] }>("/api/gallery/list", {}); elements = j.elements; paintI(); }
      catch (err) { say(String((err as Error).message), "#ff9a9a"); }
    };
    const row1 = mk("div", "display:flex;gap:6px;flex-wrap:wrap;margin-top:8px"), row2 = mk("div", "display:flex;gap:6px;flex-wrap:wrap;margin-top:8px");
    for (const pr of P.presets) { const x = btn(`${pr.name} ${pr.k}`); x.addEventListener("click", () => run({ scale: pr.k }, `ضبط الحجم ${pr.k} لـ`)); row1.appendChild(x); }
    const nudge = (label: string, d: () => Record<string, number>) => { const x = btn(label); x.addEventListener("click", () => { const e = cur(); const p = e?.place[orient]; if (!p) return; run(d.call(null), "إزاحة"); }); return x; };
    row2.append(nudge("◀", () => ({ dx: (cur()?.place[orient]?.dx ?? 0) - P.step })), nudge("▶", () => ({ dx: (cur()?.place[orient]?.dx ?? 0) + P.step })), nudge("▲", () => ({ dy: (cur()?.place[orient]?.dy ?? 0) - P.step })), nudge("▼", () => ({ dy: (cur()?.place[orient]?.dy ?? 0) + P.step })));
    const rs = btn("إعادة", "var(--hk-btn)"); rs.addEventListener("click", () => run({ reset: true }, "إعادة مقاس")); row2.appendChild(rs);
    body.append(sel, ob, info, row1, row2); paintI();
  };

  const show = async (t: typeof tab) => {
    tab = t; paintTabs();
    try { if (!elements.length) await loadCatalog(); } catch { say("خادم HK غير مشغّل", "#ff9a9a"); body.textContent = "خادم HK غير مشغّل: يبدأ مع الاستوديو، أو شغّل tools/hk_server.mjs."; return; }
    if (t === "add") viewAdd(); else if (t === "now") await viewNow(); else viewGal();
  };
  for (const [k, b] of Object.entries(tabs)) b.addEventListener("click", () => { void show(k as typeof tab); });
  const close = () => { root.remove(); openState = null; };
  closeB.addEventListener("click", close);
  openState = { root, close };
  void show("add");
};
