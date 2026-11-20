/**
 * «راسلني» (user 2026-11-20: «اجعل لي زر أراسلك من هناك، أكتب لك صحّح أو غيّر العنصر أو شيء كهذا، من صفحة ريموشن»), opened from the HK row
 * (src/studioTools.ts). What he writes goes to the agent with the composition, the frame, the time and the elements on screen at that moment
 * (tools/hk_server.mjs POST /api/msg → .tmp/hk_inbox.jsonl; tools/hk_inbox.mjs wakes the agent). His past messages and the agent's replies are listed
 * under the box and refreshed every 4 s while the sheet is open. Works from the phone. Studio-only, never breaks the Studio.
 */
import type { GalleryCtx } from "./hkGalleryPanel";

type Msg = { id: string; at: string; comp: string; frame: number; time: string; elements: string; text: string; reply: { at: string; text: string } | null };
let open: { close: () => void } | null = null;
const mmss = (f: number) => { const s = Math.floor(f / 30); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };

export const openMsgPanel = (ctx: GalleryCtx): void => {
  if (open) { open.close(); return; }
  const mk = <K extends keyof HTMLElementTagNameMap>(tag: K, css = "", text?: string): HTMLElementTagNameMap[K] => { const e = document.createElement(tag); if (css) e.style.cssText = css; if (text !== undefined) e.textContent = text; return e; };
  const root = mk("div", "position:fixed;left:0;right:0;bottom:0;height:min(70vh,620px);z-index:2147483200;display:flex;flex-direction:column;box-sizing:border-box;background:var(--hk-bg);border-top:2px solid var(--hk-accent);direction:rtl;font:14px Tahoma,Arial,sans-serif;color:var(--hk-text)");
  root.id = "__hk_msg";
  const head = mk("div", "flex:0 0 44px;display:flex;align-items:center;gap:8px;padding:0 10px;border-bottom:1px solid var(--hk-line)");
  const status = mk("span", "flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px");
  const closeB = mk("button", "flex:0 0 auto;height:32px;min-width:36px;border:1px solid var(--hk-line-strong);border-radius:8px;background:var(--hk-danger);color:var(--hk-text);font:700 14px Tahoma,Arial,sans-serif;cursor:pointer", "×"); closeB.type = "button";
  head.append(mk("span", "flex:0 0 auto;color:var(--hk-accent);font:800 15px Tahoma,Arial,sans-serif", "راسلني"), status, closeB);
  const body = mk("div", "flex:1 1 0;min-height:0;overflow-y:auto;padding:10px;box-sizing:border-box;display:flex;flex-direction:column;gap:8px");
  const ctxLine = mk("div", "font-size:12px;color:var(--hk-dim);line-height:1.6");
  const ta = mk("textarea", "width:100%;min-height:84px;box-sizing:border-box;resize:vertical;border:1px solid var(--hk-line-strong);border-radius:10px;background:var(--hk-bg2);color:var(--hk-text);font:15px Tahoma,Arial,sans-serif;padding:10px;direction:rtl");
  ta.placeholder = "اكتب: صحّح، غيّر هذا العنصر، احذف، كبّر الصورة…";
  const sendB = mk("button", "align-self:flex-start;height:38px;padding:0 22px;border:1px solid var(--hk-line-strong);border-radius:10px;background:var(--hk-accent);color:var(--hk-bg);font:800 15px Tahoma,Arial,sans-serif;cursor:pointer", "أرسل"); sendB.type = "button";
  const list = mk("div", "display:flex;flex-direction:column;gap:8px;margin-top:6px");
  body.append(ctxLine, ta, sendB, list);
  root.append(head, body); document.body.appendChild(root);
  const say = (m: string, c = "var(--hk-text)") => { status.textContent = m; status.style.color = c; };

  // what is attached: the composition, the frame and the elements under the playhead (the names row the Studio already shows)
  const context = () => {
    const f = ctx.frameNow() ?? 0, names = (document.getElementById("__el_names_row")?.textContent ?? "").replace(/^\s*مستخدم:\s*/, "").trim();
    return { comp: ctx.comp(), frame: f, time: mmss(f), elements: names };
  };
  const paintCtx = () => { const c = context(); ctxLine.textContent = `يُرفق تلقائياً: ${c.comp || "—"} · ${c.time} (الإطار ${c.frame})${c.elements ? ` · على الشاشة: ${c.elements}` : ""}`; };

  const paint = (ms: Msg[]) => {
    list.textContent = "";
    for (const m of [...ms].reverse()) {
      const card = mk("div", "border:1px solid var(--hk-line);border-radius:10px;padding:8px 10px;background:var(--hk-bg2)");
      card.append(mk("div", "font-size:11px;color:var(--hk-dim)", `${m.time} · ${m.comp}${m.elements ? " · " + m.elements : ""}`), mk("div", "margin:4px 0;white-space:pre-wrap", m.text));
      card.append(m.reply ? mk("div", "border-top:1px dashed var(--hk-line);padding-top:6px;color:var(--hk-ok);white-space:pre-wrap", `↩ ${m.reply.text}`) : mk("div", "font-size:12px;color:var(--hk-warn)", "… وصلت، أعمل عليها"));
      list.appendChild(card);
    }
  };
  const refresh = async () => { try { paint(((await (await fetch(ctx.api("/api/msg"), { cache: "no-store" })).json()) as { messages: Msg[] }).messages ?? []); } catch { say("خادم الأدوات لا يجيب", "var(--hk-danger)"); } };

  sendB.addEventListener("click", async () => {
    const text = ta.value.trim(); if (!text) { say("اكتب الرسالة أولاً", "var(--hk-danger)"); return; }
    sendB.disabled = true; say("… أرسل", "var(--hk-warn)");
    try {
      const res = await fetch(ctx.api("/api/msg"), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...context(), text }) });
      const j = (await res.json()) as { messages?: Msg[]; error?: string };
      if (!res.ok) throw new Error(j.error ?? String(res.status));
      ta.value = ""; paint(j.messages ?? []); say("✔ وصلت", "var(--hk-ok)");
      window.setTimeout(() => { if (open) open.close(); }, 700);   /* (user 2026-11-20: «لما أرسل لك شيء تغلق إطار راسلني») the sheet closes itself once the message is in */
    } catch (e) { say(String((e as Error).message), "var(--hk-danger)"); }
    finally { sendB.disabled = false; }
  });
  const timer = window.setInterval(() => { paintCtx(); void refresh(); }, 4000);
  const close = () => { window.clearInterval(timer); root.remove(); open = null; };
  closeB.addEventListener("click", close);
  open = { close };
  paintCtx(); void refresh(); ta.focus();
};
