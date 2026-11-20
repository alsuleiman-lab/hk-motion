/**
 * «تحريك» (user 2026-11-20: «التحريك لا يحتاج إلى الوصف، يحتاج فقط إلى حساب مواقع، ولا تحتاج أن تأخذ صور»), opened from the HK row (src/studioTools.ts).
 * The elements on screen at the playhead, each with the grid slots of this orientation (data/layout_grids.json): the one it is in, the free ones, the taken
 * ones (greyed). A tap on a free slot moves it (tools/hk_server.mjs POST /api/slot → tools/el.mjs slot): the place gates compute where it is then drawn,
 * as numbers, in about a second; a move over his face, a card, the screen edge or another element is refused and undone, with the reason shown here.
 * The Studio redraws from the saved spec by itself. Studio-only, never breaks the Studio.
 */
import type { GalleryCtx } from "./hkGalleryPanel";

type Choice = { name: string; state: "here" | "free" | "taken" };
type Item = { id: string; name: string; slot: string; choices: Choice[] };
let open: { close: () => void } | null = null;
const AR: Record<string, string> = { key: "الكتابة", left: "اليسار", right: "اليمين", solo: "الوسط السفلي", panel: "الفتحة الوسطى", under: "تحت", versebox: "صندوق الآية", band: "الشريط", frame: "الإطار" };

export const openMovePanel = (ctx: GalleryCtx): void => {
  if (open) { open.close(); return; }
  const mk = <K extends keyof HTMLElementTagNameMap>(tag: K, css = "", text?: string): HTMLElementTagNameMap[K] => { const e = document.createElement(tag); if (css) e.style.cssText = css; if (text !== undefined) e.textContent = text; return e; };
  const root = mk("div", "position:fixed;left:0;right:0;bottom:0;height:min(60vh,520px);z-index:2147483200;display:flex;flex-direction:column;box-sizing:border-box;background:var(--hk-bg);border-top:2px solid var(--hk-accent);direction:rtl;font:14px Tahoma,Arial,sans-serif;color:var(--hk-text)");
  root.id = "__hk_move";
  const head = mk("div", "flex:0 0 44px;display:flex;align-items:center;gap:8px;padding:0 10px;border-bottom:1px solid var(--hk-line)");
  const status = mk("span", "flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px");
  const btn = (label: string, bg: string) => { const b = mk("button", `flex:0 0 auto;height:32px;min-width:36px;padding:0 10px;border:1px solid var(--hk-line-strong);border-radius:8px;background:${bg};color:var(--hk-text);font:700 13px Tahoma,Arial,sans-serif;cursor:pointer`, label); b.type = "button"; return b; };
  const reloadB = btn("هذه اللحظة", "var(--hk-btn)"), closeB = btn("×", "var(--hk-danger)");
  head.append(mk("span", "flex:0 0 auto;color:var(--hk-accent);font:800 15px Tahoma,Arial,sans-serif", "تحريك"), status, reloadB, closeB);
  const body = mk("div", "flex:1 1 0;min-height:0;overflow-y:auto;padding:10px;box-sizing:border-box;display:flex;flex-direction:column;gap:10px");
  root.append(head, body); document.body.appendChild(root);
  const say = (m: string, c = "var(--hk-text)") => { status.textContent = m; status.style.color = c; status.title = m; };

  const load = async () => {
    say("… أحسب", "var(--hk-warn)"); body.textContent = "";
    try {
      const res = await fetch(ctx.api("/api/slots"), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ comp: ctx.comp(), frame: ctx.frameNow() ?? 0 }) });
      const j = (await res.json()) as { items?: Item[]; t?: number; error?: string };
      if (!res.ok) throw new Error(j.error ?? String(res.status));
      const items = j.items ?? [];
      if (!items.length) { body.appendChild(mk("div", "color:var(--hk-dim)", "لا عنصر له خانة في هذه اللحظة")); say(`ثانية القص ${j.t}`); return; }
      for (const it of items) {
        const card = mk("div", "border:1px solid var(--hk-line);border-radius:10px;padding:8px 10px;background:var(--hk-bg2)");
        card.appendChild(mk("div", "font-weight:700;margin-bottom:6px", `${it.name} — الآن في «${AR[it.slot] ?? it.slot}»`));
        const row = mk("div", "display:flex;flex-wrap:wrap;gap:6px");
        for (const c of it.choices) {
          const b = btn(AR[c.name] ?? c.name, c.state === "here" ? "var(--hk-accent)" : c.state === "taken" ? "var(--hk-bg)" : "var(--hk-btn)");
          if (c.state !== "free") { b.disabled = true; b.style.opacity = c.state === "taken" ? "0.4" : "1"; b.style.cursor = "default"; b.title = c.state === "taken" ? "مشغولة بعنصر آخر في الوقت نفسه" : "هنا الآن"; }
          else b.addEventListener("click", async () => {
            say("… أنقل وأحسب", "var(--hk-warn)"); row.querySelectorAll("button").forEach((x) => { (x as HTMLButtonElement).disabled = true; });
            try {
              const r = await fetch(ctx.api("/api/slot"), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ comp: ctx.comp(), id: it.id, slot: c.name }) });
              const k = (await r.json()) as { text?: string; error?: string };
              if (!r.ok) { say(k.error ?? "رُفض", "var(--hk-danger)"); await new Promise((z) => setTimeout(z, 2500)); }
              else say(k.text ?? "✔ نُقل", "var(--hk-ok)");
            } catch (e) { say(String((e as Error).message), "var(--hk-danger)"); }
            const keep = status.textContent, color = status.style.color; await load(); say(keep ?? "", color);
          });
          row.appendChild(b);
        }
        card.appendChild(row); body.appendChild(card);
      }
      say(`ثانية القص ${j.t}`);
    } catch (e) { say(String((e as Error).message) || "خادم الأدوات لا يجيب", "var(--hk-danger)"); }
  };
  const close = () => { root.remove(); open = null; };
  closeB.addEventListener("click", close);
  reloadB.addEventListener("click", () => { void load(); });
  open = { close };
  void load();
};
