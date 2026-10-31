import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Player } from "@remotion/player";
import { LabScene } from "../ElementsLab";
import { PALETTES, BRAND_NAMES } from "../brand";
import type { BrandName } from "../brand";
import { GridTab } from "./GridTab";
import type { GridEmbed } from "./GridTab";

/**
 * The live elements gallery (user 2026-10-28: «الصفحة تكتب العناصر برمجياً لا صوراً»). Built by tools/gallery_build.mjs into one script.
 * Every card plays the SAME scene the montage draws (LabScene: the engine's own item, or the kit component placed in its grid slot) over his real silent
 * recording, in its screen mode (user 2026-10-31: full screen / half screen = a source beside him / isolated background) and in the chosen orientation.
 * Marks, notes and grid-mode places are saved per element (doc id = element id) to data/gallery_notes.json through tools/gallery_serve.mjs, or to the
 * claude.ai page db; only the fields the user changed are sent, so an edit never overwrites what Claude wrote meanwhile.
 */
type Section = "bg" | "transition" | "move" | "text" | "image" | "grid";
type Orient = "land" | "port";
type Mode = "full" | "half" | "iso";
type Item = { id: string; kind: "element" | "transition"; section: Section; ar: string; kit: string; group: string; where: string; note: string; code: string; still: number; mode: Mode; slot: { land: string; port: string }; orient: "both" | Orient };
type Place = { slot?: string; dx: number; dy: number };
type Note = { status?: string; note?: string; request?: string; when?: string; place?: Partial<Record<Orient, Place>> & { dx?: number; dy?: number; slot?: string; mode?: string } };
type Rect = [number, number, number, number];
type GridData = { grids?: Record<Orient, Record<string, { slots?: Record<string, { rect: Rect; kinds: string[] }> }>>; zone?: Rect };
type Db = { collection: (p: string) => { doc: (id: string) => { set: (d: Record<string, unknown>, o?: { merge: boolean }) => Promise<void> }; onSnapshot: (n: (s: { docs: { id: string; data: () => Record<string, unknown> | undefined }[] }) => void, e?: () => void) => () => void } };

const DATA: { items: Item[]; built: string; grid?: GridEmbed } = JSON.parse(document.getElementById("gallery-data")!.textContent!);
const GD: GridData = (DATA.grid?.data as GridData) ?? {};
const LABEL: Record<string, string> = { keep: "أبقِه", change: "عدّله", drop: "احذفه" };
const MODE_AR: Record<Mode, string> = { full: "ملء الشاشة", half: "نصف الشاشة", iso: "عزل الخلفية" };
const MODE_HINT: Record<Mode, string> = { full: "أنت كامل الإطار", half: "مصدر معروض بجانبك (مقطع، صفحة كتاب، خبر)", iso: "خلفيتك معزولة وخلفك صورة أو خريطة" };
const OR_AR: Record<Orient, string> = { land: "العرضي", port: "الطولي" };
const SECTIONS: [Exclude<Section, "grid">, string][] = [["text", "عناصر الكتابة"], ["image", "عناصر الصور والمصادر"], ["move", "أساليب الحركة"], ["transition", "الانتقالات"], ["bg", "الخلفيات"]];
/** the order the groups are shown in: the text elements by role first (his words, the quote, the opponent's words, verses, lists, numbers, marks, the fixed pieces) */
const GROUP_ORDER = ["العبارات والكلمات", "الاقتباس والسؤال", "كلام الخصم", "الآيات", "البنود والقوائم", "الأرقام والزمن", "علامات على النص", "الهوية الثابتة",
  "الأشخاص والأماكن", "المصادر المعروضة", "علامات على الصور", "القصاصات", "الخرائط", "نماذج الرد", "نهاية الفيديو",
  "عرض الصورة", "التدفق والربط", "الزمن والمراحل", "افتتاح الفيديو", "حركات الكاميرا", "بين الأوضاع", "بين الفصول", "خلفيات", "طبقات"];
const LS = "elements-notes-v2", LSP = "elements-notes-pending-v2";   // local copy, and the fields edited but not yet sent
const readLocal = (): Record<string, Note> => { try { return JSON.parse(localStorage.getItem(LS) || "{}"); } catch { return {}; } };
const readPending = (): Record<string, Note> => { try { return JSON.parse(localStorage.getItem(LSP) || "{}"); } catch { return {}; } };
const writePending = (p: Record<string, Note>) => { try { localStorage.setItem(LSP, JSON.stringify(p)); } catch { /* blocked */ } };
/** a place saved before the orientation split (2026-10-31) was a landscape one */
const placeOf = (n: Note, o: Orient): Place => { const p = n.place; if (!p) return { dx: 0, dy: 0 }; if (p[o]) return p[o]!; return o === "land" && (p.dx !== undefined || p.slot) ? { slot: p.slot || undefined, dx: p.dx ?? 0, dy: p.dy ?? 0 } : { dx: 0, dy: 0 }; };
const W = (o: Orient) => (o === "land" ? 1920 : 1080), H = (o: Orient) => (o === "land" ? 1080 : 1920);
/** his face in each orientation: the landscape face zone of the gallery clip; portrait = the crop the portrait stage uses (src/ElementsLab.tsx) */
const PK = 1920 / 1080, PORT_LEFT = Math.round(540 - 966 * PK);
const faceZone = (o: Orient, mode: Mode): Rect | null => {
  const z = GD.zone; if (!z) return null;
  if (mode === "half") return o === "land" ? [653 + z[0] * 0.64, 169 + z[1] * 0.64, 653 + z[2] * 0.64, 169 + z[3] * 0.64]   // inside his window of the dossier split
    : [540 + (z[0] * PK + PORT_LEFT - 540) * 0.66, z[1] * PK * 0.66, 540 + (z[2] * PK + PORT_LEFT - 540) * 0.66, z[3] * PK * 0.66];   // psplits: scaled 0.66 from the top centre
  return o === "land" ? z : [z[0] * PK + PORT_LEFT, z[1] * PK, z[2] * PK + PORT_LEFT, z[3] * PK];
};

/** the player mounts when the card scrolls into view; in grid mode a layer over it shows the slots of the element's own mode and drags the element */
const Live: React.FC<{ it: Item; o: Orient; brand: BrandName; pos: Place; gridOn: boolean; onMove: (p: Place, commit: boolean) => void }> = ({ it, o, brand, pos, gridOn, onMove }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  const [hot, setHot] = useState("");
  const drag = useRef<{ x: number; y: number; dx: number; dy: number } | null>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { setOn(true); io.disconnect(); } }, { rootMargin: "300px" });
    io.observe(el); return () => io.disconnect();
  }, []);
  const engine = it.slot[o] === "engine" || it.slot[o] === "frame";
  const slots = Object.entries(GD.grids?.[o]?.[it.mode]?.slots ?? {});
  const at = (e: React.PointerEvent) => { const r = ref.current!.getBoundingClientRect(), k = W(o) / r.width; return { x: (e.clientX - r.left) * k, y: (e.clientY - r.top) * k }; };
  const slotAt = (x: number, y: number) => slots.find(([, v]) => x >= v.rect[0] && x <= v.rect[2] && y >= v.rect[1] && y <= v.rect[3])?.[0] ?? "";
  const pct = (v: number, D: number) => (v / D * 100) + "%";
  const z = faceZone(o, it.mode), cur = pos.slot ?? it.slot[o];
  // an element with its own grid slot snaps to the slot it is dropped in; an engine-placed (or whole-frame) one moves freely
  const drop = (x: number, y: number, d: { x: number; y: number; dx: number; dy: number }): Place => {
    const s = slotAt(x, y);
    if (!engine && s) return { slot: s, dx: 0, dy: 0 };
    return { slot: pos.slot, dx: d.dx + x - d.x, dy: d.dy + y - d.y };
  };
  return (
    <div ref={ref} className={"stage " + o} style={{ position: "relative" }}>
      {on ? (
        <Player
          component={LabScene}
          inputProps={{ id: it.id, brand, slot: pos.slot, dx: Math.round(pos.dx), dy: Math.round(pos.dy) }}
          durationInFrames={90} fps={30} compositionWidth={W(o)} compositionHeight={H(o)}
          initialFrame={it.still} controls={!gridOn} loop autoPlay={gridOn} clickToPlay={!gridOn}
          style={{ width: "100%" }}
          acknowledgeRemotionLicense
        />
      ) : null}
      {gridOn ? (
        <div className="gridlayer" aria-label="وضع الشبكة: اسحب العنصر إلى خانة"
          onPointerDown={(e) => { const q = at(e); drag.current = { x: q.x, y: q.y, dx: pos.dx, dy: pos.dy }; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); }}
          onPointerMove={(e) => { const q = at(e); setHot(slotAt(q.x, q.y)); const d = drag.current; if (d && engine) onMove({ slot: pos.slot, dx: d.dx + q.x - d.x, dy: d.dy + q.y - d.y }, false); }}
          onPointerUp={(e) => { const q = at(e), d = drag.current; drag.current = null; if (d) onMove(drop(q.x, q.y, d), true); }}>
          {slots.map(([name, v]) => (
            <div key={name} className={"slot" + (hot === name ? " hot" : "") + (cur === name ? " cur" : "")} style={{ left: pct(v.rect[0], W(o)), top: pct(v.rect[1], H(o)), width: pct(v.rect[2] - v.rect[0], W(o)), height: pct(v.rect[3] - v.rect[1], H(o)) }}>
              <b>{name}</b><i>{v.kinds.join(" · ")}</i>
            </div>
          ))}
          {z ? <div className="face" style={{ left: pct(z[0], W(o)), top: pct(z[1], H(o)), width: pct(z[2] - z[0], W(o)), height: pct(z[3] - z[1], H(o)) }}><b>وجهك</b></div> : null}
        </div>
      ) : null}
    </div>
  );
};

const Card: React.FC<{ it: Item; o: Orient; n: Note; brand: BrandName; onSave: (id: string, p: Note) => void }> = ({ it, o, n, brand, onSave }) => {
  const [gridOn, setGridOn] = useState(false);
  const [pos, setPos] = useState<Place>(placeOf(n, o));
  const dragging = useRef(false);
  useEffect(() => { if (!dragging.current) setPos(placeOf(n, o)); }, [JSON.stringify(n.place), o]);
  /** the place is kept per orientation; a legacy (landscape) place is carried into `land` */
  const putPlace = (p: Place) => { const c = n.place ?? {}; const base = c.land || c.port ? { land: c.land, port: c.port } : { land: c.dx !== undefined || c.slot ? placeOf(n, "land") : undefined }; onSave(it.id, { place: { ...base, [o]: p } }); };
  const move = (p: Place, commit: boolean) => { dragging.current = !commit; setPos(p); if (commit) putPlace(p); };
  const reset = () => { const z = { dx: 0, dy: 0 }; setPos(z); putPlace(z); };
  const canGrid = it.section !== "bg" && it.section !== "transition";
  const slotNow = pos.slot ?? it.slot[o];
  const [text, setText] = useState(n.note ?? "");
  const [when, setWhen] = useState(n.when ?? it.where);
  const typingW = useRef(false);
  useEffect(() => { if (!typingW.current) setWhen(n.when ?? it.where); }, [n.when, it.where]);
  const [showCode, setShowCode] = useState(false);
  const typing = useRef(false);
  useEffect(() => { if (!typing.current) setText(n.note ?? ""); }, [n.note]);
  return (
    <article id={"card-" + it.id} className={"card" + (n.status ? " s-" + n.status : "")}>
      <Live it={it} o={o} brand={brand} pos={pos} gridOn={gridOn} onMove={move} />
      <div className="gridbar">
        <span className={"mode m-" + it.mode} title={MODE_HINT[it.mode]}>{MODE_AR[it.mode]}</span>
        {canGrid ? <button type="button" className="code-btn" aria-pressed={gridOn} onClick={() => setGridOn(!gridOn)}>{gridOn ? "إغلاق وضع الشبكة" : "وضع الشبكة: غيّر مكانه"}</button> : null}
        {gridOn && (pos.slot || pos.dx || pos.dy) ? <button type="button" className="chip" onClick={reset}>إعادته لمكانه</button> : null}
        <span className="small">{slotNow === "engine" ? "مكانه من محرك المونتاج" : slotNow === "frame" ? "يملأ الإطار" : "الخانة: " + slotNow}{pos.dx || pos.dy ? ` · إزاحة ${Math.round(pos.dx)}، ${Math.round(pos.dy)}` : ""}</span>
      </div>
      <div className="body">
        <div className="name"><h2>{it.ar}</h2><code>{it.id} · {it.kit}</code></div>
        <label className="whenlbl">متى تستخدمه (عدّل النص كما تريد)
          <textarea className="when" value={when} aria-label={"متى يُستعمل " + it.ar}
            onFocus={() => { typingW.current = true; }} onBlur={() => { typingW.current = false; }}
            onChange={(e) => { setWhen(e.target.value); onSave(it.id, { when: e.target.value }); }} />
        </label>
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
  const pref = (k: string, d: string) => { try { return localStorage.getItem(k) || d; } catch { return d; } };
  const remember = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* blocked */ } };
  const [o, setO] = useState<Orient>(() => (pref("gallery-orient", "land") === "port" ? "port" : "land"));
  // the page always opens on a list of cards (the grids tab is not remembered)
  const [tab, setTab] = useState<Section>(() => (["bg", "transition", "move", "text", "image"].includes(pref("gallery-tab", "text")) ? pref("gallery-tab", "text") as Section : "text"));
  const [q, setQ] = useState("");
  const [copied, setCopied] = useState(false);
  const [brand, setBrand] = useState<BrandName>(() => { const b = pref("gallery-brand", "steel") as BrandName; return BRAND_NAMES.includes(b) ? b : "steel"; });
  const pickBrand = (b: BrandName) => { setBrand(b); remember("gallery-brand", b); };
  const pickO = (v: Orient) => { setO(v); remember("gallery-orient", v); };
  const pickTab = (v: Section) => { setTab(v); remember("gallery-tab", v); };
  const dbc = useRef<ReturnType<Db["collection"]> | null>(null);
  const timers = useRef<Record<string, number>>({});
  const local = useRef(false);   // served by tools/gallery_serve.mjs: notes go to data/gallery_notes.json, which Claude reads

  /** sends only the fields changed since the last send (the server merges them), so Claude's own edits to other fields are never overwritten */
  const push = (id: string) => {
    window.clearTimeout(timers.current[id]);
    timers.current[id] = window.setTimeout(() => {
      const v = readPending()[id]; if (!v) return;
      const done = () => { const p = readPending(); if (JSON.stringify(p[id]) === JSON.stringify(v)) { delete p[id]; writePending(p); } };
      if (local.current) fetch("/api/notes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...v }) }).then((r) => { if (!r.ok) throw new Error(); done(); }).catch(() => setConn("fail"));
      else if (dbc.current) dbc.current.doc(id).set({ ...v, at: Date.now() }, { merge: true }).then(done).catch(() => setConn("fail"));
    }, 500);
  };
  const onSave = (id: string, p: Note) => {
    setNotes((cur) => { const nx = { ...cur, [id]: { ...cur[id], ...p } }; try { localStorage.setItem(LS, JSON.stringify(nx)); } catch { /* blocked */ } return nx; });
    const pend = readPending(); pend[id] = { ...pend[id], ...p }; writePending(pend);
    push(id);
  };
  const fromSrv = (v: Record<string, unknown>): Note => ({ status: String(v.status ?? ""), note: String(v.note ?? ""), request: v.request ? String(v.request) : undefined, when: v.when !== undefined ? String(v.when) : undefined, place: v.place as Note["place"] });

  useEffect(() => {
    let off: (() => void) | undefined;
    const w = window as unknown as { claude?: { use?: (n: string) => Promise<unknown> } };
    /** no claude.ai db: the local server (tools/gallery_serve.mjs) — its file is the record; fields edited offline are laid over it and sent */
    const goLocal = () => fetch("/api/notes").then((r) => { if (!r.ok) throw new Error(); return r.json(); }).then((srv: Record<string, Record<string, unknown>>) => {
      local.current = true; setConn("local");
      const pend = readPending();
      setNotes((cur) => { const nx = { ...cur }; for (const [id, v] of Object.entries(srv)) nx[id] = { ...fromSrv(v), ...(pend[id] ?? {}) }; return nx; });
      for (const id of Object.keys(pend)) push(id);
    }).catch(() => setConn("off"));
    (w.claude?.use ? w.claude.use("db") : Promise.resolve(null)).then((db) => {
      if (!db) { goLocal(); return; }
      dbc.current = (db as Db).collection("notes");
      setConn("on");
      for (const id of Object.keys(readPending())) push(id);
      off = dbc.current.onSnapshot((snap) => {
        const pend = readPending();
        setNotes((cur) => { const nx = { ...cur }; for (const d of snap.docs) nx[d.id] = { ...fromSrv(d.data() ?? {}), ...(pend[d.id] ?? {}) }; return nx; });
      }, () => setConn("fail"));
    }).catch(() => goLocal());
    return () => off?.();
  }, []);

  const [goId, setGoId] = useState("");
  const goTo = (id: string) => { const it = DATA.items.find((i) => i.id === id); if (!it) return; if (it.orient !== "both") setO(it.orient); setTab(it.section); setQ(""); setGoId(id); };
  useEffect(() => { if (!goId) return; const el = document.getElementById("card-" + goId); if (el) { el.scrollIntoView({ block: "center" }); el.classList.add("flash"); window.setTimeout(() => el.classList.remove("flash"), 2200); setGoId(""); } }, [goId, tab, o]);
  const inO = (i: Item) => i.orient === "both" || i.orient === o;
  const items = DATA.items.filter((i) => i.section === tab && inO(i) && (!q || (i.ar + " " + i.id).toLowerCase().includes(q.toLowerCase())));
  const groups = useMemo(() => [...new Set(items.map((i) => i.group))].sort((a, b) => (GROUP_ORDER.indexOf(a) + 1 || 99) - (GROUP_ORDER.indexOf(b) + 1 || 99)), [tab, o, q]);
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
          <p>كل بطاقة تشغّل الكود نفسه الذي يرسم المونتاج فوق تسجيلك الصامت، في وضع الشاشة الذي يخصّه وفي الاتجاه الذي تختاره. علّم كل عنصر واكتب ملاحظتك، أو افتح وضع الشبكة وانقله إلى خانة، فأعدّل الكود نفسه.</p>
        </div>
        <div className="tally"><span>للإبقاء <b>{count("keep")}</b></span><span>للتعديل <b>{count("change")}</b></span><span>للحذف <b>{count("drop")}</b></span></div>
      </header>
      <nav className="orient" role="tablist" aria-label="الاتجاه">
        {(["land", "port"] as const).map((v) => <button key={v} type="button" role="tab" aria-selected={o === v} onClick={() => pickO(v)}><span className={"shape " + v} aria-hidden="true" />{OR_AR[v]} <b>{DATA.items.filter((i) => i.orient === "both" || i.orient === v).length}</b></button>)}
      </nav>
      <nav className="tabs" role="tablist" aria-label="الأقسام">
        {SECTIONS.map(([k, l]) => <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => pickTab(k)}>{l} <b>{DATA.items.filter((i) => i.section === k && inO(i)).length}</b></button>)}
        <button type="button" role="tab" aria-selected={tab === "grid"} onClick={() => pickTab("grid")}>الشبكات</button>
      </nav>
      <div className="bar" style={tab === "grid" ? { display: "none" } : undefined}>
        <span className="legend">{(Object.keys(MODE_AR) as Mode[]).map((m) => <span key={m} className={"mode m-" + m} title={MODE_HINT[m]}>{MODE_AR[m]}</span>)}</span>
        <input type="search" placeholder="بحث بالاسم أو الكود" value={q} onChange={(e) => setQ(e.target.value)} />
        <button type="button" className="theme-btn" onClick={copyAll}>{copied ? "نُسخ ✓" : "نسخ ملاحظاتي"}</button>
      </div>
      <p id="conn" data-ok={conn === "on" || conn === "local" ? "1" : "0"} role="status">{connText}</p>
      {DATA.grid ? <GridTab g={DATA.grid} active={tab === "grid"} onGo={goTo} /> : null}
      {tab === "grid" ? null : groups.map((g) => (
        <section key={o + tab + g} className="group">
          <h3>{g} <small>{items.filter((i) => i.group === g).length}</small></h3>
          <main className={"grid " + o}>{items.filter((i) => i.group === g).map((it) => <Card key={o + it.id} it={it} o={o} n={notes[it.id] ?? {}} brand={brand} onSave={onSave} />)}</main>
        </section>
      ))}
      <footer>بُني من الكود في {DATA.built}</footer>
    </>
  );
};

createRoot(document.getElementById("root")!).render(<App />);
