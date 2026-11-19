/**
 * HK-MOTION RENDER QUEUE SHEET (user 2026-11-19: «ادمج طابور الرندر مع مستوى التقدم في البرنامج الجديد تبعنا»), opened from the «الطابور» button of the HK row
 * (src/studioTools.ts). One place for what used to be two: the render queue (tools/render_queue.mjs) and the progress page (tools/render_progress.mjs :3105).
 *   · «أضف هذا الفيديو» = the user asks for the render of the montage open in the Studio (landscape when its id ends in -L): the queue's admission gate runs
 *     first, a refused montage says why; the export goes to «جاهز».
 *   · every job of the queue with its state, and a live bar for every render running or just finished (measured from the renderer's own lines, no guess);
 *   · «أعد» / «احذف» per job.
 * It asks the tools server every 2 s only while it is open (tools/hk_server.mjs GET /api/queue). Studio-only, never breaks the Studio.
 */
import type { GalleryCtx } from "./hkGalleryPanel";

type Job = { spec: string; comp: string; orient: string; state: string; why?: string; err?: string; to?: string; ar?: string; at?: string };
type Prog = { id: string; title: string; pct: number; done: boolean; stalled: boolean; part: { i: number; n: number; p: number } | null; min: number | null; eta: number | null; out: string | null };
type Q = { jobs: Job[]; worker: number; progress: Prog[]; now: { item?: string }; log: string; dest: string };

const STATE_AR: Record<string, string> = { queued: "بالانتظار", rendering: "يُخرج الآن", done: "اكتمل", failed: "فشل", rejected: "مرفوض" };
let open: { close: () => void } | null = null;

export const openQueuePanel = (ctx: GalleryCtx): void => {
  if (open) { open.close(); return; }
  const mk = <K extends keyof HTMLElementTagNameMap>(tag: K, css = "", text?: string): HTMLElementTagNameMap[K] => { const e = document.createElement(tag); if (css) e.style.cssText = css; if (text !== undefined) e.textContent = text; return e; };
  const btn = (label: string, bg = "var(--hk-btn)") => { const b = mk("button", `flex:0 0 auto;height:30px;padding:0 11px;border:1px solid var(--hk-line-strong);border-radius:8px;background:${bg};color:var(--hk-text);font:700 12px Tahoma,Arial,sans-serif;cursor:pointer`, label); b.type = "button"; return b; };
  const root = mk("div", "position:fixed;left:0;right:0;bottom:0;height:min(62vh,560px);z-index:2147483200;display:flex;flex-direction:column;box-sizing:border-box;background:var(--hk-bg);border-top:2px solid var(--hk-accent);direction:rtl;font:13px Tahoma,Arial,sans-serif;color:var(--hk-text)");
  root.id = "__hk_queue";
  const head = mk("div", "flex:0 0 42px;display:flex;align-items:center;gap:8px;padding:0 10px;border-bottom:1px solid var(--hk-line);overflow-x:auto;white-space:nowrap");
  const status = mk("span", "flex:1 0 auto;min-width:60px;overflow:hidden;text-overflow:ellipsis;font-size:12px");
  const addB = btn("+ أضف هذا الفيديو", "var(--hk-accent)");
  const closeB = btn("×", "var(--hk-danger)"); closeB.style.minWidth = "34px";
  head.append(mk("span", "flex:0 0 auto;color:var(--hk-accent);font:800 14px Tahoma,Arial,sans-serif", "طابور الرندر"), addB, status, closeB);
  const body = mk("div", "flex:1 1 0;min-height:0;overflow-y:auto;padding:10px;box-sizing:border-box");
  root.append(head, body); document.body.appendChild(root);
  const say = (m: string, c = "var(--hk-text)") => { status.textContent = m; status.style.color = c; };
  const post = async (path: string, data: unknown): Promise<Q & { message?: string }> => {
    const res = await fetch(ctx.api(path), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
    const j = (await res.json().catch(() => ({}))) as Q & { error?: string; message?: string };
    if (!res.ok) throw new Error(String(j.error ?? res.status));
    return j;
  };
  const mins = (n: number | null) => (n == null ? "—" : n < 1 ? "أقل من دقيقة" : `${Math.round(n)} د`);
  const bar = (pct: number, color: string) => { const b = mk("div", "height:12px;background:var(--hk-bg2);border:1px solid var(--hk-line);border-radius:99px;overflow:hidden;margin:7px 0 5px"); b.appendChild(mk("div", `height:100%;width:${Math.max(0, Math.min(100, pct))}%;background:${color};border-radius:99px;transition:width .8s`)); return b; };

  const paint = (q: Q) => {
    body.textContent = "";
    const top = mk("div", "font-size:12px;color:var(--hk-dim);margin-bottom:8px", `${q.worker ? "العامل يعمل" : "العامل متوقف (يبدأ وحده عند الإضافة)"} · الوجهة: ${q.dest}`);
    body.appendChild(top);
    // the live bars: every render running or just finished
    for (const r of q.progress) {
      const card = mk("div", "background:var(--hk-bg2);border:1px solid var(--hk-line);border-radius:10px;padding:9px 11px;margin:0 0 8px");
      const t = mk("div", "display:flex;justify-content:space-between;gap:10px;font-weight:700");
      t.append(mk("span", "", r.title), mk("span", `color:${r.done ? "var(--hk-ok)" : r.stalled ? "var(--hk-danger)" : "var(--hk-accent)"}`, r.done ? "اكتمل" : `${Math.round(r.pct)}%`));
      const m = mk("div", "font-size:12px;color:var(--hk-dim);display:flex;flex-wrap:wrap;gap:4px 14px");
      if (r.part && !r.done) m.appendChild(mk("span", "", `الجزء ${r.part.i} من ${r.part.n}`));
      if (r.min != null && !r.done) m.appendChild(mk("span", "", `مضى ${mins(r.min)}`));
      if (r.eta != null && !r.done) m.appendChild(mk("span", "", `المتبقي نحو ${mins(r.eta)}`));
      if (r.stalled) m.appendChild(mk("span", "color:var(--hk-danger)", "لا تقدّم منذ دقائق"));
      if (r.done && r.out) m.appendChild(mk("span", "", r.out));
      card.append(t, bar(r.done ? 100 : r.pct, r.done ? "var(--hk-ok)" : r.stalled ? "var(--hk-danger)" : "var(--hk-accent)"), m);
      body.appendChild(card);
    }
    // the queue itself
    if (!q.jobs.length) body.appendChild(mk("div", "color:var(--hk-dim);text-align:center;padding:18px 0", "الطابور فارغ"));
    for (const j of q.jobs) {
      const row = mk("div", "display:flex;align-items:center;gap:8px;padding:7px 4px;border-bottom:1px solid var(--hk-line)");
      const col = j.state === "done" ? "var(--hk-ok)" : j.state === "failed" || j.state === "rejected" ? "var(--hk-danger)" : j.state === "rendering" ? "var(--hk-accent)" : "var(--hk-text)";
      row.append(mk("span", "flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap", `${j.ar ?? j.comp}`), mk("span", `flex:0 0 auto;color:${col};font-weight:700`, STATE_AR[j.state] ?? j.state));
      const why = j.why ?? j.err; if (why) row.title = why;
      if (j.state === "failed" || j.state === "rejected" || j.state === "done") { const b = btn("أعد"); b.addEventListener("click", () => { void act("/api/queue/retry", j); }); row.appendChild(b); }
      if (j.state !== "rendering") { const b = btn("احذف", "var(--hk-danger)"); b.addEventListener("click", () => { if (window.confirm(`إزالة «${j.ar ?? j.comp}» من الطابور؟ (لا يمسّ ملفاً)`)) void act("/api/queue/drop", j); }); row.appendChild(b); }
      body.appendChild(row);
      if (why && j.state !== "done") body.appendChild(mk("div", "font-size:11px;color:var(--hk-danger);padding:0 4px 6px", why.slice(0, 220)));
    }
    if (q.log) body.appendChild(mk("pre", "font:11px Consolas,monospace;color:var(--hk-dim);white-space:pre-wrap;margin:10px 0 0;direction:ltr;text-align:left", q.log));
  };
  const act = async (path: string, j: Job) => { try { say("…", "var(--hk-warn)"); paint(await post(path, { spec: j.spec, orient: j.orient })); say("✔", "var(--hk-ok)"); } catch (e) { say(String((e as Error).message), "var(--hk-danger)"); } };
  const refresh = async () => { try { const q = (await (await fetch(ctx.api("/api/queue"), { cache: "no-store" })).json()) as Q; paint(q); } catch { say("خادم الأدوات لا يجيب", "var(--hk-danger)"); } };

  addB.addEventListener("click", async () => {
    const comp = ctx.comp(); if (!comp) { say("افتح مونتاجاً أولاً", "var(--hk-danger)"); return; }
    if (!window.confirm(`إخراج «${comp}» إلى «جاهز»؟ يمرّ بفحص القبول أولاً.`)) return;
    addB.disabled = true; say("… فحص القبول", "var(--hk-warn)");
    try { const r = await post("/api/queue/add", { comp }); paint(r); say(r.message ?? "✔", "var(--hk-ok)"); }
    catch (e) { say(String((e as Error).message).slice(0, 300), "var(--hk-danger)"); }
    finally { addB.disabled = false; }
  });
  const timer = window.setInterval(() => { void refresh(); }, 2000);
  const close = () => { window.clearInterval(timer); root.remove(); open = null; };
  closeB.addEventListener("click", close);
  open = { close };
  void refresh();
};
