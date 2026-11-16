import React from "react";
import { kufiF, naskhF, useT } from "./MG";
import { BRAND } from "./brand";
import { Pic } from "./EuKit";
import { PICK_KIT, PICK_FULL_FRAME, arDigits, fitGroup, FitLabel } from "./PickKit";

/**
 * PickKit2 — round 4 picks of the temporary gallery (user 2026-11-14) + the drawn METAPHORS the user praised («الجذور، الإيمان يزيد، الكأس الذي يمتلئ»):
 * meanings he says in an episode are drawn in code (no picture asset, no generated image). Spec: { t: "pick", el, at, until, … } like PickKit.
 * When each one is due: PREFERENCES.md «عناصر المعرض المؤقت المعتمدة» + «المعاني المجسّدة». Times in SECONDS; nothing before its `at`; exits are wipes/scales.
 */
const clamp = (x: number) => Math.max(0, Math.min(1, x));
const ease = (x: number) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const back = (x: number) => { x = clamp(x); const c = 1.7; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const bounce = (x: number) => { x = clamp(x); const n = 7.5625, d = 2.75; if (x < 1 / d) return n * x * x; if (x < 2 / d) return n * (x -= 1.5 / d) * x + 0.75; if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + 0.9375; return n * (x -= 2.625 / d) * x + 0.984375; };
const rnd = (i: number) => { const v = Math.sin(i * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
const useK = () => { const t = useT(0); return { t, k: (a: number, d: number, until: number) => Math.min(clamp((t - a) / d), clamp((until - t) / 0.35)) }; };
const abs = (s: React.CSSProperties): React.CSSProperties => ({ position: "absolute", ...s });
const wipe = (k: number): React.CSSProperties => ({ visibility: k > 0 ? "visible" : "hidden", clipPath: `inset(-30% 0 -30% ${(1 - clamp(k)) * 100}%)` });
const pop = (k: number, from = 0.4, extra = ""): React.CSSProperties => ({ visibility: k > 0 ? "visible" : "hidden", transform: `scale(${from + (1 - from) * back(k)}) ${extra}` });
const dash = (len: number, k: number) => ({ strokeDasharray: len, strokeDashoffset: len * (1 - clamp(k)) });
type Base = { at: number; until: number; x: number; y: number };

/** 26 · بطاقة السؤال والجواب — the question on a card, which flips to show the short answer on its back */
export const QACard: React.FC<Base & { w?: number; h?: number; q: string; a: string; flipAt: number; qTag?: string; aTag?: string }> = ({ at, until, x, y, w = 800, h = 440, q, a, flipAt, qTag = "سؤال", aTag = "الجواب" }) => {
  const { t, k } = useK(); const kk = k(at, 0.4, until), r = 180 * ease(clamp((t - flipAt) / 0.7));
  const face = (back2: boolean, tag: string, txt: string): React.CSSProperties => ({ position: "absolute", inset: 0, backfaceVisibility: "hidden", transform: back2 ? "rotateY(180deg)" : "none", borderRadius: 24, background: back2 ? BRAND.navy : BRAND.card, display: "grid", placeItems: "center", textAlign: "center", padding: 40 });
  return (
    <div style={abs({ left: x, top: y, width: w, height: h, perspective: 2200 })}>
      <div style={abs({ inset: 0, transformStyle: "preserve-3d", visibility: kk > 0 ? "visible" : "hidden", transform: `scale(${0.6 + 0.4 * back(kk)}) rotateY(${r}deg)` })}>
        <div style={face(false, qTag, q)}><div><div style={{ fontFamily: kufiF, fontSize: 40, color: BRAND.accent }}>{qTag}</div><div style={{ fontFamily: kufiF, fontSize: 58, lineHeight: 1.4, marginTop: 10, color: BRAND.ink }}>{q}</div></div></div>
        <div style={face(true, aTag, a)}><div><div style={{ fontFamily: kufiF, fontSize: 40, color: BRAND.light }}>{aTag}</div><div style={{ fontFamily: kufiF, fontSize: 54, lineHeight: 1.4, marginTop: 10, color: BRAND.card }}>{a}</div></div></div>
      </div>
    </div>
  );
};

/** 27 · فقاعة التفكير مع شخص (user note «اجعله مع شخصية»): the person (his real photo when there is one, else a plain faceless silhouette) with a speech
 *  bubble of what he SAYS, then dots up to a thought bubble of what he MEANS */
export const ThoughtBubble: React.FC<Base & { img?: string; name?: string; say: string; sayAt: number; think: string; thinkAt: number; sayTag?: string; thinkTag?: string }> = ({ at, until, x, y, img, name, say, sayAt, think, thinkAt, sayTag = "يقول:", thinkTag = "ويقصد:" }) => {
  const { k } = useK();
  return (
    <div style={abs({ left: x, top: y, width: 940, height: 760 })}>
      <div style={abs({ left: 0, top: 420, width: 260, height: 320, borderRadius: 16, overflow: "hidden", background: BRAND.base3, border: `6px solid ${BRAND.card}`, boxShadow: "0 16px 40px rgba(0,0,0,.5)", ...pop(k(at, 0.4, until), 0.6) })}>
        {img ? <Pic src={img} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 20%" }} /> :
          <svg viewBox="0 0 260 320" width={260} height={320}><circle cx="130" cy="120" r="62" fill={BRAND.gray} /><path d="M20 320 C20 230 70 200 130 200 C190 200 240 230 240 320Z" fill={BRAND.gray} /></svg>}
        {name ? <div style={abs({ left: 0, right: 0, bottom: 0, padding: "6px 10px", background: BRAND.navy, color: BRAND.card, fontFamily: kufiF, fontSize: 30, textAlign: "center" })}>{name}</div> : null}
      </div>
      <div style={abs({ left: 300, top: 470, width: 620, padding: "26px 36px", borderRadius: 40, borderBottomLeftRadius: 8, background: BRAND.card, textAlign: "center", fontFamily: kufiF, fontSize: 46, lineHeight: 1.4, color: BRAND.ink, transformOrigin: "0 100%", ...pop(k(sayAt, 0.35, until), 0.4) })}><div style={{ fontSize: 28, color: BRAND.gray }}>{sayTag}</div>«{say}»</div>
      {[0, 1, 2].map((i) => <div key={i} style={abs({ left: 230 + i * 50, top: 380 - i * 56, width: 28 + i * 16, height: 28 + i * 16, borderRadius: "50%", background: "rgba(255,255,255,.88)", ...pop(k(thinkAt - 0.45 + i * 0.12, 0.2, until), 0.2) })} />)}
      <div style={abs({ left: 320, top: 60, width: 600, padding: 40, borderRadius: 120, background: "rgba(255,255,255,.92)", boxShadow: "0 0 0 14px rgba(255,255,255,.35)", textAlign: "center", fontFamily: kufiF, fontSize: 46, lineHeight: 1.4, color: BRAND.mark, ...pop(k(thinkAt, 0.4, until), 0.3) })}><div style={{ fontSize: 28, color: BRAND.gray }}>{thinkTag}</div>«{think}»</div>
    </div>
  );
};

/** 28 · سحابة الكلمات — the words most said in a speech/topic, sized by weight (1–5), the heaviest in the middle */
const SLOTS = [[0, 0], [-230, -110], [240, -120], [-260, 110], [250, 120], [0, -200], [0, 210], [-430, 0], [440, 0], [-200, 270], [210, -280], [-210, -280]];
export const WordCloud: React.FC<Base & { words: { text: string; weight: number; at: number }[]; title?: string; titleAt?: number }> = ({ until, x, y, words, title, titleAt }) => {
  const { k } = useK(); const sorted = [...words].sort((a, b) => b.weight - a.weight);
  const cols = [BRAND.card, BRAND.light, BRAND.card, BRAND.light, BRAND.light];
  return (
    <div style={abs({ left: x, top: y })}>
      {sorted.slice(0, SLOTS.length).map((w, i) => <div key={i} style={abs({ left: SLOTS[i][0] - 220, top: SLOTS[i][1] - 40, width: 440, textAlign: "center", fontFamily: kufiF, fontSize: 30 + w.weight * 16, color: cols[i % 5], textShadow: i === 0 ? `0 0 24px ${BRAND.accent}` : "none", whiteSpace: "nowrap", ...pop(k(w.at, 0.35, until), 0.2) })}>{w.text}</div>)}
      {title ? <div style={abs({ left: -450, width: 900, top: 340, textAlign: "center", fontFamily: kufiF, fontSize: 34, color: BRAND.light, ...wipe(ease(k(titleAt ?? words[words.length - 1].at + 0.4, 0.4, until))) })}>{title}</div> : null}
    </div>
  );
};

/** 29 · الرسالة المنسوخة / الطلبات الكثيرة — one message multiplying into many forwarded copies with a count (user: «عندما أقول طُلب مني عمل حلقة… أو سألني ناس») */
export const CopiedMessages: React.FC<Base & { text: string; tag?: string; count?: number; label?: string; n?: number }> = ({ at, until, x, y, text, tag = "رسالة", count, label = "طلب", n = 14 }) => {
  const { k } = useK(); let shown = 0;
  const cards = Array.from({ length: n }, (_, i) => { const kk = k(at + i * 0.15, 0.25, until); if (kk > 0) shown++; return (
    <div key={i} style={abs({ left: 40 + rnd(i) * 420, top: rnd(i + 30) * 440, width: 420, padding: "20px 26px", borderRadius: 24, borderBottomRightRadius: 6, background: BRAND.card, boxShadow: "0 10px 24px rgba(0,0,0,.35)", fontFamily: kufiF, fontSize: 30, lineHeight: 1.5, color: BRAND.ink, ...pop(kk, 0.4, `rotate(${(rnd(i + 9) - 0.5) * 14}deg)`) })}>
      <div style={{ fontSize: 22, color: BRAND.gray }}>↪ {tag}</div>{text}
    </div>); });
  const total = count ?? n * 100;
  return (
    <div style={abs({ left: x, top: y, width: 900, height: 700 })}>
      {cards}
      <div style={abs({ left: 0, width: 900, top: 640, textAlign: "center", fontFamily: kufiF, fontSize: 52, color: BRAND.card, visibility: shown > 0 ? "visible" : "hidden" })}>{arDigits(Math.round((total * shown) / n))} {label}</div>
    </div>
  );
};

/** 30 · الجبل الجليدي (user note: words in front of the ice): the small tip above the water with its word(s), then the water clears and the huge hidden part shows its words */
export const Iceberg: React.FC<Base & { top: string[]; hidden: string[]; revealAt: number; topLabel?: string; hiddenLabel?: string; s?: number }> = ({ at, until, x, y, top, hidden, revealAt, topLabel = "ما يظهر", hiddenLabel = "ما يخفونه", s = 1 }) => {
  const { t, k } = useK(); const u = ease(clamp((t - revealAt) / 1)), kk = k(at, 0.4, until);
  return (
    <div style={{ ...abs({ left: x, top: y, width: 900, height: 840, visibility: kk > 0 ? "visible" : "hidden" }), transform: s !== 1 ? `scale(${s})` : undefined, transformOrigin: "0 0" }}>
      <svg width={900} height={840} style={{ position: "absolute", inset: 0 }}>
        <path d="M450 20 L540 150 L600 170 L660 240 L340 240 L370 150Z" fill="#eef6fb" />
        <path d="M340 240 L660 240 L800 380 L850 600 L740 800 L450 840 L160 770 L80 570 L170 380Z" fill="#41687f" opacity={0.3 + 0.5 * u} />
      </svg>
      <div style={abs({ left: 0, top: 240, width: 900, height: 600, background: "linear-gradient(rgba(0,0,0,.30), rgba(0,0,0,.52))", borderTop: "3px solid #bfe3f5" })} />
      <div style={abs({ left: 580, top: 78, width: 300, textAlign: "center", fontFamily: kufiF, fontSize: 38, color: "#fff", lineHeight: 1.3, background: "rgba(0,0,0,.6)", borderRadius: 18, padding: "10px 14px", boxSizing: "border-box", textShadow: "0 2px 6px rgba(0,0,0,.8)", ...pop(k(at + 0.5, 0.35, until), 0.4) })}>{top.join("، ")}</div>
      <div style={abs({ left: 580, top: 24, fontFamily: kufiF, fontSize: 32, color: "#fff", textShadow: "0 2px 6px rgba(0,0,0,.8)", whiteSpace: "nowrap", ...wipe(ease(k(at + 0.7, 0.4, until))) })}>← {topLabel}</div>
      {hidden.map((w, i) => <div key={i} style={abs({ left: 450 - 170 + (i % 2 ? 120 : -120), top: 330 + i * 90, width: 340, textAlign: "center", fontFamily: kufiF, fontSize: 40, color: "#fff", textShadow: "0 2px 7px rgba(0,0,0,.85)", ...pop(k(revealAt + 0.5 + i * 0.25, 0.3, until), 0.3) })}>{w}</div>)}
      <div style={abs({ left: 0, top: 780, fontFamily: kufiF, fontSize: 38, color: BRAND.card, whiteSpace: "nowrap", ...wipe(ease(k(revealAt + 0.3, 0.4, until))) })}>{hiddenLabel} ←</div>
    </div>
  );
};

/** 31 · سيل التعليقات — viewers' comments rising fast like a live chat (what people ask or say about the topic) */
export const CommentsFlood: React.FC<Base & { comments: string[]; speed?: number; gap?: number }> = ({ at, until, x, y, comments, speed = 420, gap = 0.3 }) => {
  const { t } = useK(); const cols = [BRAND.blue, BRAND.accent, BRAND.green, BRAND.light];
  return (
    <div style={abs({ left: x, top: y, width: 820, height: 860, overflow: "hidden" })}>
      {comments.map((c, i) => { const yy = 860 - (t - at - i * gap) * speed; return yy > -100 && yy < 860 && t < until ? (
        <div key={i} style={abs({ left: (i % 2) * 60, top: yy, width: 760, padding: "16px 24px", borderRadius: 20, background: "rgba(255,255,255,.12)", border: "2px solid rgba(255,255,255,.18)", display: "flex", gap: 16, alignItems: "center", fontFamily: kufiF, fontSize: 34, color: BRAND.card })}>
          <span style={{ width: 50, height: 50, borderRadius: "50%", background: cols[i % 4], flex: "none" }} />{c}
        </div>) : null; })}
    </div>
  );
};

/** 32 · ضربة الفرشاة — a rough brush stroke sweeps across the WHOLE frame and off again, a title shown while it covers: a lively passage between two topics */
export const BrushWipe: React.FC<{ at: number; until: number; title?: string; W?: number; H?: number }> = ({ at, W = 1920, H = 1080, title }) => {
  const t = useT(0); const u = ease(clamp((t - at) / 0.7)), v = ease(clamp((t - at - 1.1) / 0.7)); if (t < at || v >= 1) return null;
  const xpos = W + 40 - (W + 480) * u - (W + 480) * v, id = "bw" + Math.round(at * 100);
  return (
    <div style={abs({ left: 0, top: 0, width: W, height: H })}>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <defs><filter id={id}><feTurbulence baseFrequency="0.04" numOctaves="2" seed="3" /><feDisplacementMap in="SourceGraphic" scale="60" /></filter></defs>
        <rect x={xpos} y={-100} width={W + 480} height={H + 200} fill={BRAND.accent} filter={`url(#${id})`} />
      </svg>
      {title && u >= 1 && v <= 0.05 ? <div style={abs({ inset: 0, display: "grid", placeItems: "center", fontFamily: naskhF, fontSize: 110, color: BRAND.onAccent })}>{title}</div> : null}
    </div>
  );
};

/** 33 · الجذور والفروع (metaphor) — the ground line; roots below with the roots/causes, branches above with what grows from them */
export const RootsTree: React.FC<Base & { roots: { text: string; at: number }[]; branches: { text: string; at: number }[]; trunkAt?: number }> = ({ at, until, x, y, roots, branches, trunkAt }) => {
  const { k } = useK(); const dx = (i: number, n: number) => (n === 1 ? 0 : -300 + (600 * i) / (n - 1)), tk = trunkAt ?? (roots[roots.length - 1]?.at ?? at) + 0.3;
  const all = [...roots, ...branches].map((q) => q.text), FG = fitGroup(all, { font: 32, minFont: 22, minW: 170, maxW: 240, padX: 16, padY: 8 });
  const lab = (txt: string, bg: string, kk: number, l: number, tp: number) => { const f = FG[all.indexOf(txt)]; return <FitLabel text={txt} cx={l} cy={tp + f.h / 2} fit={f} css={{ borderRadius: 10, background: bg, color: "#fff", ...pop(kk, 0.3) }} />; };
  return (
    <div style={abs({ left: x, top: y, width: 900, height: 840 })}>
      <div style={abs({ left: 0, top: 400, width: 900, height: 8, background: "#6b4a2a", ...wipe(ease(k(at, 0.4, until))) })} />
      <svg width={900} height={840} style={{ position: "absolute", inset: 0, overflow: "visible" }} fill="none" strokeLinecap="round">
        {roots.map((r, i) => { const d = dx(i, roots.length); return <path key={"r" + i} d={`M450 404 Q${450 + d * 0.4} 500 ${450 + d} 600`} stroke="#8a5a2a" strokeWidth={12} style={dash(320, ease(k(r.at - 0.4, 0.5, until)))} />; })}
        <path d="M450 404 V180" stroke="#6b4a2a" strokeWidth={30} style={dash(230, ease(k(tk, 0.4, until)))} />
        {branches.map((b, i) => { const d = dx(i, branches.length); return <path key={"b" + i} d={`M450 ${300 - (i % 2) * 40} Q${450 + d * 0.5} 230 ${450 + d} 130`} stroke={BRAND.green} strokeWidth={12} style={dash(340, ease(k(b.at - 0.4, 0.5, until)))} />; })}
      </svg>
      {roots.map((r, i) => <React.Fragment key={"rl" + i}>{lab(r.text, "#8a5a2a", k(r.at, 0.3, until), 450 + dx(i, roots.length), 610)}</React.Fragment>)}
      {branches.map((b, i) => <React.Fragment key={"bl" + i}>{lab(b.text, BRAND.green, k(b.at, 0.3, until), 450 + dx(i, branches.length), 70)}</React.Fragment>)}
    </div>
  );
};

/** 34 · البطارية (metaphor) — a big battery whose charge changes step by step (0–5 cells), each step with its label: faith rises with obedience and falls with sins */
export const Battery: React.FC<Base & { title?: string; s?: number; steps: { level: number; at: number; label: string }[] }> = ({ at, until, x, y, title, steps, s = 1 }) => {
  const { t, k } = useK(); const cur = steps.reduce((c, s) => (t >= s.at ? s : c), steps[0]), sc = steps.every((q) => q.level <= 1) ? 5 : 1;   /* levels are cells 0–5; a spec that wrote 0–1 fractions (user 2026-11-16: the battery showed less when it meant more) is scaled */
  const lv = t >= steps[0].at ? cur.level * sc : 5;
  const col = lv <= 1 ? BRAND.mark : lv <= 2 ? BRAND.accent : BRAND.green;
  return (
    <div style={{ ...abs({ left: x, top: y, width: 900 }), transform: s !== 1 ? `scale(${s})` : undefined, transformOrigin: "0 0" }}>
      {title ? <div style={abs({ left: 0, width: 900, top: 0, textAlign: "center", fontFamily: kufiF, fontSize: 46, color: BRAND.light, ...wipe(ease(k(at, 0.4, until))) })}>{title}</div> : null}
      <div style={abs({ left: 150, top: 100, width: 560, height: 260, border: `14px solid ${BRAND.card}`, borderRadius: 30, ...pop(k(at, 0.4, until), 0.7) })}>
        {[0, 1, 2, 3, 4].map((i) => <div key={i} style={abs({ left: 20 + i * 104, top: 20, width: 92, height: 192, borderRadius: 10, background: i < lv ? col : "rgba(255,255,255,.08)" })} />)}
        <div style={abs({ left: 546, top: 66, width: 40, height: 100, borderRadius: "0 12px 12px 0", background: BRAND.card })} />
      </div>
      <div style={abs({ left: 0, width: 900, top: 400, textAlign: "center", fontFamily: kufiF, fontSize: 52, color: col, visibility: t >= steps[0].at && t < until ? "visible" : "hidden" })}>{cur.label}</div>
    </div>
  );
};

/** 35 · الكأس يمتلئ (metaphor) — 1 to 3 glasses filling with gold to their share (0–100), the share above each and its name below */
export const FillGlasses: React.FC<Base & { items: { label: string; value: number; at: number }[] }> = ({ until, x, y, items }) => {
  const { t, k } = useK(); const n = items.length, gap = n === 1 ? 0 : 640 / (n - 1);
  return (
    <div style={abs({ left: x, top: y, width: 900, height: 620 })}>
      {items.map((it, i) => { const cx = n === 1 ? 450 : 770 - i * gap, u = ease(clamp((t - it.at - 0.3) / 1.4)) * clamp((until - t) / 0.35), kk = k(it.at, 0.4, until);
        return <React.Fragment key={i}>
          <div style={abs({ left: cx - 140, top: 80, width: 280, height: 420, border: "8px solid rgba(255,255,255,.75)", borderTop: "none", borderRadius: "0 0 40px 40px", overflow: "hidden", ...pop(kk, 0.7) })}>
            <div style={abs({ left: 0, right: 0, bottom: 0, height: `${it.value * u}%`, background: `linear-gradient(${BRAND.accent}, ${BRAND.accentDeep})` })} />
          </div>
          <div style={abs({ left: cx - 140, top: 10, width: 280, textAlign: "center", fontFamily: kufiF, fontSize: 56, color: BRAND.card, visibility: u > 0 ? "visible" : "hidden" })}>{arDigits(Math.round(it.value * u))}٪</div>
          <div style={abs({ left: cx - 160, top: 520, width: 320, textAlign: "center", fontFamily: kufiF, fontSize: 42, color: BRAND.card, ...wipe(ease(kk)) })}>{it.label}</div>
        </React.Fragment>; })}
    </div>
  );
};

/** a dark left-to-right gradient behind an element that is NOT a split screen (user 2026-11-14, frames 10458/11903): he stays in the middle; the shade wipes in (no opacity fade) */
export const LeftShade: React.FC<{ at: number; until: number }> = ({ at, until }) => {
  const t = useT(0), c = (x: number) => Math.max(0, Math.min(1, x)), e = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2), k = e(Math.min(c((t - at) / 0.5), c((until - t) / 0.4)));
  return <div style={{ position: "absolute", left: 0, top: 0, width: 1250, height: 1080, pointerEvents: "none", visibility: k > 0 ? "visible" : "hidden", clipPath: `inset(0 ${(1 - k) * 100}% 0 0)`, background: "linear-gradient(90deg, rgba(0,0,0,.82) 0%, rgba(0,0,0,.62) 45%, rgba(0,0,0,0) 100%)" }} />;
};
/** portrait twin of LeftShade: a dark gradient under the lower-half element (wipes in from the bottom, never an opacity fade) so white text reads over his robe */
export const BottomShade: React.FC<{ at: number; until: number }> = ({ at, until }) => {
  const t = useT(0), c = (x: number) => Math.max(0, Math.min(1, x)), e = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2), k = e(Math.min(c((t - at) / 0.5), c((until - t) / 0.4)));
  return <div style={{ position: "absolute", left: 0, top: 900, width: 1080, height: 1020, pointerEvents: "none", visibility: k > 0 ? "visible" : "hidden", clipPath: `inset(${(1 - k) * 100}% 0 0 0)`, background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,.6) 35%, rgba(0,0,0,.82) 100%)" }} />;
};
export const PICK_KIT2 = { QACard, ThoughtBubble, WordCloud, CopiedMessages, Iceberg, CommentsFlood, BrushWipe, RootsTree, Battery, FillGlasses } as const;
/** every picked element (PickKit + PickKit2) by spec name */
/** the gallery's own x,y of every picked element (src/ElementsLab.tsx): used when a spec item gives none, so a spec never invents a place (user 2026-11-14: «لابد أن تنتبه إلى أماكن العناصر»). StickyNotes carry their own per-note x,y. */
export const PICK_XY: Record<string, [number, number]> = { MinuteTeaser: [150, 150], Battery: [110, 250], NoProof: [100, 200], FlapBoard: [80, 260], BigQuestion: [90, 150], NeverMeet: [110, 260], ThoughtBubble: [90, 170], RootsTree: [110, 120], Iceberg: [110, 130], Crossroads: [110, 150], MythFact: [90, 300], InkQuote: [90, 380], ChatThread: [110, 250], MindMap: [560, 560], RingStat: [560, 470], QACard: [160, 300], ViciousCycle: [560, 520], FillGlasses: [110, 220], DecisionFlow: [80, 150], Footnote: [90, 230], ClaimWall: [110, 300], CopiedMessages: [110, 150], WordCloud: [560, 480], CommentsFlood: [110, 150] };
/** PORTRAIT place of a picked element (user 2026-11-16, marked screenshot: the elements in the band 1400–1880 under the caption, never on his beard):
 *  the element is drawn in its landscape 1920×1080 board; PICK_PORT_BOX = the part of that board it really uses [top, height] (estimated from its layout),
 *  and the board is scaled (≤ 0.95) and placed so that part fills the band, centred (the board's content column is centred on x ≈ 590). */
export const PICK_PORT_BOX: Record<string, [number, number]> = {
  BigQuestion: [170, 200], NeverMeet: [250, 550], RingStat: [220, 630], ClaimWall: [300, 700], Crossroads: [150, 800], MythFact: [270, 440], DecisionFlow: [150, 780],
  MindMap: [180, 670], ViciousCycle: [180, 680], WordCloud: [200, 560], InkQuote: [380, 400], MinuteTeaser: [150, 600], Battery: [250, 650], NoProof: [200, 600],
  FlapBoard: [260, 420], ThoughtBubble: [170, 600], RootsTree: [120, 800], Iceberg: [130, 800], ChatThread: [250, 560], QACard: [300, 480], FillGlasses: [220, 620],
  Footnote: [230, 520], CopiedMessages: [150, 720], CommentsFlood: [150, 760],
};
export const pickPortBoard = (el: string): React.CSSProperties => {
  const [bt, bh] = PICK_PORT_BOX[el] ?? [(PICK_XY[el]?.[1] ?? 150), 700], s = Math.min(0.95, 610 / bh, 1000 / 1000);   /* (user 2026-11-16) the ELEMENTS zone: y 1100–1760, under the caption, his video in the upper half */
  const top = 1135 + (630 - bh * s) / 2 - bt * s, left = 540 - 590 * s;
  return { position: "absolute", left, top, width: 1920, height: 1080, transform: `scale(${s})`, transformOrigin: "0 0" };
};
/** NOT a split screen (user 2026-11-14, frames 8341/10458/11903/13009/14105): he stays centred, the element sits small in the left third over a dark gradient (LeftShade); these are its LANDSCAPE props. The engine and the gallery both read this table. */
export const PICK_NOSPLIT: Record<string, Record<string, number>> = { RingStat: { x: 330, y: 470 }, MythFact: { x: 40, y: 300, w: 760, size: 40 }, ChatThread: { x: 40, y: 250, w: 580 }, FlapBoard: { x: 40, y: 260, w: 600, size: 44 }, Battery: { x: 108, y: 737, s: 0.7 }, BigQuestion: { x: 40, y: 250, w: 600, size: 330 } };   /* BigQuestion beside him with no split (user 2026-11-16) */   /* the user's red box, lower left (2026-11-15) */
export const PICK_ALL = { ...PICK_KIT, ...PICK_KIT2 } as const;
export type PickAllName = keyof typeof PICK_ALL;
export const PICK_ALL_FULL_FRAME = new Set<string>([...PICK_FULL_FRAME, "BrushWipe"]);
/** the drawn metaphors (user 2026-11-14: «كن مبدعاً … بإضافة المعاني والتعبير عنها بهذه الطريقة»): pick_triggers counts them per minute */
export const METAPHOR_ELS = ["RootsTree", "Battery", "FillGlasses", "Iceberg", "ViciousCycle", "Crossroads", "ClaimWall", "NeverMeet", "MindMap", "DecisionFlow", "StickyNotes", "WordCloud"];
void bounce;
