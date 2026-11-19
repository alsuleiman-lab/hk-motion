/**
 * HK-MOTION COLOUR SHEET (user 2026-11-19: «أداة الألوان نضيفها أساسية»), opened from the «ألوان» button of the HK row (src/studioTools.ts).
 * The colour tool is no longer tied to one montage: it grades ANY montage. The settings are written to the montage's spec (`grade`, through tools/hk_server.mjs → tools/hk_grade.mjs)
 * and the Studio shows them at once on the recording's layers (an SVG colour matrix, src/hybrid/Slot.tsx); the GPU render applies the same matrix (tools/gpu_compositor.py), so the export
 * matches the preview. Only the recording is graded, never the cards, pictures or graphics over it. Looks («ألوان جاهزة») are saved on the server (data/grade_presets.json): the same
 * on the phone and the computer. Studio-only, never breaks the Studio.
 */
import type { GalleryCtx } from "./hkGalleryPanel";
type G = Record<"brightness" | "contrast" | "saturation" | "sepia" | "temperature" | "tint" | "warmth", number>;
const SLIDERS: { key: keyof G; label: string; min: number; max: number; hint: string }[] = [
  { key: "brightness", label: "السطوع", min: 0, max: 200, hint: "100 = كما هو" },
  { key: "contrast", label: "التباين", min: 0, max: 200, hint: "100 = كما هو" },
  { key: "saturation", label: "تشبّع الألوان", min: 0, max: 200, hint: "0 = أبيض وأسود" },
  { key: "sepia", label: "الدفء البني (سيبيا)", min: 0, max: 100, hint: "0 = بلا" },
  { key: "temperature", label: "حرارة اللون", min: -100, max: 100, hint: "بارد ← دافئ" },
  { key: "tint", label: "الصبغة", min: -100, max: 100, hint: "أخضر ← أرجواني" },
  { key: "warmth", label: "دفء الإضاءة", min: 0, max: 100, hint: "لمسة عنبرية" },
];
const NEUTRAL: G = { brightness: 100, contrast: 100, saturation: 100, sepia: 0, temperature: 0, tint: 0, warmth: 0 };
let open: { close: () => void } | null = null;

export const openColorPanel = (ctx: GalleryCtx): void => {
  if (open) { open.close(); return; }
  const mk = <K extends keyof HTMLElementTagNameMap>(tag: K, css = "", text?: string): HTMLElementTagNameMap[K] => { const e = document.createElement(tag); if (css) e.style.cssText = css; if (text !== undefined) e.textContent = text; return e; };
  const btn = (label: string, bg = "var(--hk-btn)", extra = "") => { const b = mk("button", `flex:0 0 auto;height:30px;padding:0 11px;border:1px solid var(--hk-line-strong);border-radius:8px;background:${bg};color:${bg.includes("accent") ? "var(--hk-accent-text)" : "var(--hk-text)"};font:700 13px Tahoma,Arial,sans-serif;cursor:pointer;${extra}`, label); b.type = "button"; return b; };
  const root = mk("div", "position:fixed;left:0;right:0;bottom:0;height:min(62vh,560px);z-index:2147483200;display:flex;flex-direction:column;box-sizing:border-box;background:var(--hk-bg);border-top:2px solid var(--hk-accent);box-shadow:0 -10px 30px rgba(0,0,0,.45);direction:rtl;font:600 13px Tahoma,Arial,sans-serif;color:var(--hk-text)");
  root.id = "__hk_color";
  const head = mk("div", "flex:0 0 42px;display:flex;align-items:center;gap:8px;padding:0 10px;border-bottom:1px solid var(--hk-line);overflow-x:auto;white-space:nowrap");
  const status = mk("span", "flex:1 0 auto;min-width:60px;overflow:hidden;text-overflow:ellipsis;font-size:12px");
  const closeB = btn("×", "var(--hk-danger)"); closeB.style.minWidth = "34px";
  head.append(mk("span", "flex:0 0 auto;color:var(--hk-accent);font:800 14px Tahoma,Arial,sans-serif", "ألوان HK"), status, closeB);
  const body = mk("div", "flex:1 1 0;min-height:0;overflow-y:auto;padding:10px;box-sizing:border-box");
  root.append(head, body); document.body.appendChild(root);
  const say = (m: string, c = "var(--hk-text)") => { status.textContent = m; status.style.color = c; };
  const post = async <T = Record<string, unknown>>(path: string, data: unknown): Promise<T> => {
    const res = await fetch(ctx.api(path), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
    const j = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) throw new Error(String(j.error ?? res.status));
    return j as T;
  };

  let values: G = { ...NEUTRAL }, presets: Record<string, G> = {};
  const outs: Record<string, HTMLOutputElement> = {}, ins: Record<string, HTMLInputElement> = {};
  const chips = mk("div", "display:flex;gap:7px;flex-wrap:wrap;align-items:center;margin-bottom:12px");
  const paint = () => { for (const s of SLIDERS) { ins[s.key].value = String(values[s.key]); outs[s.key].textContent = `${values[s.key]}`; } };
  const write = async (grade: Partial<G>, replace = false) => {
    say("… أطبّق", "var(--hk-warn)");
    try { const r = await post<{ grade: G }>("/api/grade/set", { comp: ctx.comp(), grade, replace }); values = { ...NEUTRAL, ...r.grade }; paint(); say("✔ طُبّق على تسجيل الشيخ", "var(--hk-ok)"); }
    catch (e) { say(String((e as Error).message), "var(--hk-danger)"); }
  };
  const paintChips = () => {
    chips.textContent = "";
    chips.appendChild(mk("span", "color:var(--hk-dim);font-size:12px", "ألوان جاهزة:"));
    for (const [name, g] of Object.entries(presets)) {
      const c = btn(name); c.addEventListener("click", () => { void write(g, true); });
      c.addEventListener("contextmenu", async (e) => { e.preventDefault(); if (!window.confirm(`حذف اللون «${name}» من القائمة؟`)) return; try { presets = (await post<{ presets: Record<string, G> }>("/api/grade/delpreset", { name })).presets; paintChips(); } catch (err) { say(String((err as Error).message), "var(--hk-danger)"); } });
      chips.appendChild(c);
    }
    const save = btn("+ احفظ الحالي", "var(--hk-accent)");
    save.addEventListener("click", async () => { const name = window.prompt("اسم هذا اللون:")?.trim(); if (!name) return; try { presets = (await post<{ presets: Record<string, G> }>("/api/grade/savepreset", { name, grade: values })).presets; paintChips(); say(`حُفظ «${name}»`, "var(--hk-ok)"); } catch (err) { say(String((err as Error).message), "var(--hk-danger)"); } });
    chips.appendChild(save);
  };

  body.appendChild(mk("div", "margin-bottom:10px;color:var(--hk-dim);line-height:1.6;font-size:12px", "يُطبَّق على تسجيل الشيخ وحده (لا على العناصر والصور والبطاقات)، وفي المعاينة والتصدير بالمقدار نفسه. اضغط مطوّلاً (أو زر الفأرة الأيمن) على لون جاهز لحذفه."));
  body.appendChild(chips);
  for (const s of SLIDERS) {
    const row = mk("label", "display:block;margin:10px 0 14px");
    const top = mk("span", "display:flex;justify-content:space-between;gap:8px;margin-bottom:5px");
    const out = mk("output", "direction:ltr;color:var(--hk-accent)"); outs[s.key] = out;
    top.append(mk("span", "", `${s.label}  ·  ${s.hint}`), out);
    const inp = mk("input", "width:100%;accent-color:var(--hk-accent)"); inp.type = "range"; inp.min = String(s.min); inp.max = String(s.max); inp.step = "1"; ins[s.key] = inp;
    inp.addEventListener("input", () => { out.textContent = inp.value; });
    inp.addEventListener("change", () => { void write({ [s.key]: Number(inp.value) }); });
    row.append(top, inp); body.appendChild(row);
  }
  const reset = btn("إعادة الألوان إلى الأصل", "var(--hk-btn)", "width:100%"); reset.addEventListener("click", () => { void write(NEUTRAL, true); });
  body.appendChild(reset);

  void (async () => {
    try {
      presets = (await post<{ presets: Record<string, G> }>("/api/grade/presets", {})).presets; paintChips();
      values = { ...NEUTRAL, ...(await post<{ grade: G }>("/api/grade/get", { comp: ctx.comp() })).grade }; paint();
      say("");
    } catch (e) { say(/Failed to fetch/.test(String(e)) ? "خادم HK غير مشغّل" : String((e as Error).message), "var(--hk-danger)"); paint(); }
  })();
  const close = () => { root.remove(); open = null; };
  closeB.addEventListener("click", close);
  open = { close };
};
