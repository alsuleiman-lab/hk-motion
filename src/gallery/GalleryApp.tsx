import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Player } from "@remotion/player";
import { LabScene } from "../ElementsLab";
import { TransitionScene } from "../TransitionsLab";
import { PALETTES, BRAND_NAMES } from "../brand";
import type { BrandName } from "../brand";
import { GridTab } from "./GridTab";
import type { GridEmbed } from "./GridTab";

/**
 * The live elements gallery (user 2026-10-28: «الصفحة تكتب العناصر برمجياً لا صوراً»). Built by tools/gallery_build.mjs into one script.
 * Every card plays the SAME component the montage uses (LabScene / TransitionScene) in Remotion Player, shows the code line that draws it,
 * and keeps the user's keep/change/drop mark + note in the page's db (collection "notes", doc id = element id), with a local copy.
 */
type Section = "bg" | "transition" | "move" | "text" | "image" | "grid";
type Item = { id: string; kind: "element" | "transition"; section: Section; ar: string; kit: string; group: string; where: string; note: string; code: string; still: number; places?: string };
type Note = { status?: string; note?: string; request?: string; when?: string };
type Db = { collection: (p: string) => { doc: (id: string) => { set: (d: Record<string, unknown>) => Promise<void> }; onSnapshot: (n: (s: { docs: { id: string; data: () => Record<string, unknown> | undefined }[] }) => void, e?: () => void) => () => void } };

const DATA: { items: Item[]; built: string; grid?: GridEmbed } = JSON.parse(document.getElementById("gallery-data")!.textContent!);
const LABEL: Record<string, string> = { keep: "أبقِه", change: "عدّله", drop: "احذفه" };
const LS = "elements-notes-v1", LSP = "elements-notes-pending-v1";   // local copy, and the ids edited but not yet saved to the db
const readLocal = (): Record<string, Note> => { try { return JSON.parse(localStorage.getItem(LS) || "{}"); } catch { return {}; } };
const pendingIds = (): Set<string> => { try { return new Set(JSON.parse(localStorage.getItem(LSP) || "[]")); } catch { return new Set(); } };
const setPending = (s: Set<string>) => { try { localStorage.setItem(LSP, JSON.stringify([...s])); } catch { /* blocked */ } };

/** mounts the player only when the card scrolls into view (dozens of players at once would be heavy) */
const Live: React.FC<{ it: Item; brand: BrandName }> = ({ it, brand }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { setOn(true); io.disconnect(); } }, { rootMargin: "300px" });
    io.observe(el); return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className="stage">
      {on ? (
        <Player
          component={it.kind === "transition" ? TransitionScene : LabScene}
          inputProps={{ id: it.id, brand }}
          durationInFrames={90} fps={30} compositionWidth={1920} compositionHeight={1080}
          initialFrame={it.still} controls loop clickToPlay
          style={{ width: "100%" }}
          acknowledgeRemotionLicense
        />
      ) : null}
    </div>
  );
};

const Card: React.FC<{ it: Item; n: Note; brand: BrandName; onSave: (id: string, p: Note) => void }> = ({ it, n, brand, onSave }) => {
  const [text, setText] = useState(n.note ?? "");
  const [when, setWhen] = useState(n.when ?? it.where);
  const typingW = useRef(false);
  useEffect(() => { if (!typingW.current) setWhen(n.when ?? it.where); }, [n.when, it.where]);
  const [showCode, setShowCode] = useState(false);
  const typing = useRef(false);
  useEffect(() => { if (!typing.current) setText(n.note ?? ""); }, [n.note]);
  return (
    <article id={"card-" + it.id} className={"card" + (n.status ? " s-" + n.status : "")}>
      <Live it={it} brand={brand} />
      <div className="body">
        <div className="name"><h2>{it.ar}</h2><code>{it.id} · {it.kit}</code></div>
        <label className="whenlbl">متى تستخدمه (عدّل النص كما تريد)
          <textarea className="when" value={when} aria-label={"متى يُستعمل " + it.ar}
            onFocus={() => { typingW.current = true; }} onBlur={() => { typingW.current = false; }}
            onChange={(e) => { setWhen(e.target.value); onSave(it.id, { when: e.target.value }); }} />
        </label>
        {it.places ? <p className="where"><b>أين يوضع في الشبكة:</b> {it.places}</p> : null}
        {it.note ? <p className="note">{it.note}</p> : null}
        <button type="button" className="code-btn" aria-expanded={showCode} onClick={() => setShowCode(!showCode)}>{showCode ? "إخفاء الكود" : "الكود الذي يرسمه"}</button>
        {showCode ? <pre className="code" dir="ltr">{it.code}</pre> : null}
        {n.request ? <p className="note">طلبك: {n.request}</p> : null}
        <div className="marks" role="group" aria-label="القرار">
          {(["keep", "change", "drop"] as const).map((s) => (
            <button key={s} type="button" data-s={s} aria-pressed={n.status === s} onClick={() => onSave(it.id, { status: n.status === s ? "" : s })}>{LABEL[s]}</button>
          ))}
        </div>
        <textarea value={text} placeholder="ملاحظتك على هذا العنصر" aria-label={"ملاحظة على " + it.ar}
          onFocus={() => { typing.current = true; }} onBlur={() => { typing.current = false; }}
          onChange={(e) => { setText(e.target.value); onSave(it.id, { note: e.target.value }); }} />
      </div>
    </article>
  );
};

const App: React.FC = () => {
  const [notes, setNotes] = useState<Record<string, Note>>(readLocal);
  const [conn, setConn] = useState<"wait" | "on" | "local" | "off" | "fail">("wait");
  const [tab, setTab] = useState<Section>("bg");
  const [group, setGroup] = useState("الكل");
  const [q, setQ] = useState("");
  const [copied, setCopied] = useState(false);
  const [brand, setBrand] = useState<BrandName>(() => { try { const b = localStorage.getItem("gallery-brand") as BrandName; return BRAND_NAMES.includes(b) ? b : "steel"; } catch { return "steel"; } });
  const pickBrand = (b: BrandName) => { setBrand(b); try { localStorage.setItem("gallery-brand", b); } catch { /* blocked */ } };
  const dbc = useRef<ReturnType<Db["collection"]> | null>(null);
  const timers = useRef<Record<string, number>>({});
  const notesRef = useRef(notes); notesRef.current = notes;

  const local = useRef(false);   // served by tools/gallery_serve.mjs: notes go to data/gallery_notes.json, which Claude reads
  const push = (id: string) => {
    if (local.current) {
      window.clearTimeout(timers.current[id]);
      timers.current[id] = window.setTimeout(() => {
        const v = notesRef.current[id] ?? {};
        fetch("/api/notes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: v.status ?? "", note: v.note ?? "", ...(v.request ? { request: v.request } : {}), ...(v.when !== undefined ? { when: v.when } : {}) }) })
          .then((r) => { if (!r.ok) throw new Error(); const s = pendingIds(); s.delete(id); setPending(s); })
          .catch(() => setConn("fail"));
      }, 500);
      return;
    }
    const c = dbc.current; if (!c) return;
    window.clearTimeout(timers.current[id]);
    timers.current[id] = window.setTimeout(() => {
      const v = notesRef.current[id] ?? {};
      c.doc(id).set({ status: v.status ?? "", note: v.note ?? "", ...(v.request ? { request: v.request } : {}), ...(v.when !== undefined ? { when: v.when } : {}), at: Date.now() })
        .then(() => { const s = pendingIds(); s.delete(id); setPending(s); })
        .catch(() => setConn("fail"));
    }, 500);
  };
  const onSave = (id: string, p: Note) => {
    setNotes((cur) => { const nx = { ...cur, [id]: { ...cur[id], ...p } }; try { localStorage.setItem(LS, JSON.stringify(nx)); } catch { /* blocked */ } return nx; });
    const s = pendingIds(); s.add(id); setPending(s);
    push(id);
  };

  useEffect(() => {
    let off: (() => void) | undefined;
    const w = window as unknown as { claude?: { use?: (n: string) => Promise<unknown> } };
    /** no claude.ai db: try the local server (tools/gallery_serve.mjs) — its file is the record; what was edited offline is pushed up */
    const goLocal = () => fetch("/api/notes").then((r) => { if (!r.ok) throw new Error(); return r.json(); }).then((srv: Record<string, Note>) => {
      local.current = true; setConn("local");
      const pend = pendingIds();
      setNotes((cur) => { const nx = { ...cur }; for (const [id, v] of Object.entries(srv)) if (!pend.has(id)) nx[id] = { status: String(v.status ?? ""), note: String(v.note ?? ""), request: v.request ? String(v.request) : undefined, when: v.when !== undefined ? String(v.when) : undefined }; return nx; });
      for (const id of pend) push(id);
    }).catch(() => setConn("off"));
    (w.claude?.use ? w.claude.use("db") : Promise.resolve(null)).then((db) => {
      if (!db) { goLocal(); return; }
      dbc.current = (db as Db).collection("notes");
      setConn("on");
      for (const id of pendingIds()) push(id);   // only what was edited while offline; the db is the record for everything else
      off = dbc.current.onSnapshot((snap) => {
        setNotes((cur) => {
          const nx = { ...cur };
          for (const d of snap.docs) { const v = d.data() ?? {}; nx[d.id] = { status: String(v.status ?? ""), note: String(v.note ?? ""), request: v.request ? String(v.request) : undefined, when: v.when !== undefined ? String(v.when) : undefined }; }
          return nx;
        });
      }, () => setConn("fail"));
    }).catch(() => goLocal());
    return () => off?.();
  }, []);

  const [goId, setGoId] = useState("");
  const goTo = (id: string) => { const it = DATA.items.find((i) => i.id === id); if (!it) return; setTab(it.section); setGroup("الكل"); setQ(""); setGoId(id); };
  useEffect(() => { if (!goId) return; const el = document.getElementById("card-" + goId); if (el) { el.scrollIntoView({ block: "center" }); el.classList.add("flash"); window.setTimeout(() => el.classList.remove("flash"), 2200); setGoId(""); } }, [goId, tab]);
  const items = DATA.items.filter((i) => i.section === tab);
  const groups = useMemo(() => ["الكل", ...new Set(items.map((i) => i.group))], [tab]);
  const shown = items.filter((i) => (group === "الكل" || i.group === group) && (!q || (i.ar + " " + i.id).toLowerCase().includes(q.toLowerCase())));
  const count = (s: string) => DATA.items.filter((i) => notes[i.id]?.status === s).length;
  const copyAll = () => {
    const txt = DATA.items.filter((i) => notes[i.id]?.status || notes[i.id]?.note || notes[i.id]?.when).map((i) => `${i.id} (${i.ar}): ${LABEL[notes[i.id].status ?? ""] ?? "-"}${notes[i.id].note ? " — " + notes[i.id].note : ""}${notes[i.id].when ? " | متى يُستعمل: " + notes[i.id].when : ""}`).join("\n") || "لا ملاحظات بعد";
    (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }, () => window.prompt("انسخ ملاحظاتك:", txt));
  };
  const connText = { wait: "جارٍ الاتصال بقاعدة الملاحظات…", on: "متصل: كل علامة وملاحظة تُحفظ ويقرؤها كلود", local: "متصل بالجهاز: كل علامة وملاحظة تُحفظ في data/gallery_notes.json ويقرؤها كلود", off: "غير متصل (افتح الصفحة داخل claude.ai) — ملاحظاتك تُحفظ في هذا المتصفح؛ اضغط «نسخ ملاحظاتي» وألصقها في المحادثة", fail: "تعذّر الحفظ عند كلود — ملاحظاتك في هذا المتصفح؛ اضغط «نسخ ملاحظاتي» وألصقها في المحادثة" }[conn];

  return (
    <>
      <div className="bar palette-top" role="group" aria-label="النمط اللوني">
        <span>النمط اللوني:</span>
        {BRAND_NAMES.map((b) => <button key={b} type="button" className="chip" aria-pressed={b === brand} onClick={() => pickBrand(b)}><i style={{ display: "inline-block", width: 12, height: 12, borderRadius: 3, marginInlineEnd: 6, verticalAlign: -1, background: PALETTES[b].accent, boxShadow: `inset 0 0 0 3px ${PALETTES[b].base}` }} />{PALETTES[b].label}</button>)}
      </div>
      <header>
        <div>
          <h1>معرض عناصر المونتاج</h1>
          <p>كل بطاقة تشغّل الكود نفسه الذي يرسم المونتاج، فما تراه هنا هو ما يظهر في الفيديو. علّم كل عنصر واكتب ملاحظتك، فأعدّل الكود نفسه.</p>
        </div>
        <div className="tally"><span>للإبقاء <b>{count("keep")}</b></span><span>للتعديل <b>{count("change")}</b></span><span>للحذف <b>{count("drop")}</b></span></div>
      </header>
      <nav className="tabs" role="tablist">
        {([["bg", "1 الخلفيات"], ["transition", "2 الانتقالات"], ["move", "3 أساليب الحركة"], ["text", "4 عناصر الكتابة"], ["image", "5 عناصر الصور"], ["grid", "6 الشبكة"]] as const).map(([k, l]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => { setTab(k); setGroup("الكل"); }}>{l} {k === "grid" ? null : <b>{DATA.items.filter((i) => i.section === k).length}</b>}</button>
        ))}
      </nav>
      <div className="bar" style={tab === "grid" ? { display: "none" } : undefined}>
        {groups.length > 2 ? groups.map((g) => <button key={g} type="button" className="chip" aria-pressed={g === group} onClick={() => setGroup(g)}>{g}</button>) : null}
        <input type="search" placeholder="بحث بالاسم أو الكود" value={q} onChange={(e) => setQ(e.target.value)} />
        <button type="button" className="theme-btn" onClick={copyAll}>{copied ? "نُسخ ✓" : "نسخ ملاحظاتي"}</button>
      </div>
      <p id="conn" data-ok={conn === "on" || conn === "local" ? "1" : "0"} role="status">{connText}</p>
      {DATA.grid ? <GridTab g={DATA.grid} active={tab === "grid"} onGo={goTo} /> : null}
      <main className="grid" style={tab === "grid" ? { display: "none" } : undefined}>{shown.map((it) => <Card key={it.id} it={it} n={notes[it.id] ?? {}} brand={brand} onSave={onSave} />)}</main>
      <footer>بُني من الكود في {DATA.built}</footer>
    </>
  );
};

createRoot(document.getElementById("root")!).render(<App />);
