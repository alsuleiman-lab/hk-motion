import React from "react";
import { useVideoConfig } from "remotion";
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

/** 32 · العرى المتسلسلة (user 2026-11-18, in-recording order of «فرسان الفجر»: «زرد أو سلسلة كبيرة واضحة؛ لما أقول تنقض عرى الإسلام عروة عروة
 *  تتكسر واحدة واحدة وتذهب هباء، وناس صغار يتمسكون بها وينتقلون إلى التي بعدها، وآخر واحدة الصلاة، فإذا تكسرت يسقطون»).
 *  A big chain anchored to a wall on the left; link 0 sits at the wall (the LAST to break), the far link breaks first. Small faceless people hang under the
 *  outermost whole link; when it breaks they swing to the next one; when link 0 breaks they fall. Each break = a crack flash, then the two halves fly and fall
 *  and scatter to dust. labels: a tag under a link (or at its empty place) from its `at` — never before he says it. Times in seconds. */
export const ChainLinks: React.FC<Base & { n?: number; breaks: { i: number; at: number }[]; labels?: { i: number; text: string; at: number; gold?: boolean }[]; people?: number; hold?: number }> = ({ at, until, x, y, n = 6, breaks, labels = [], people = 3, hold = 0.45 }) => {
  const { t, k } = useK(); const kk = k(at, 0.45, until);
  const W = 1100, H = 720, X0 = 170, STEP = n > 5 ? 165 : 195, CY = 270, LW = n > 5 ? 215 : 245, LH = n > 5 ? 128 : 146;   /* big and clear (his order: «وعملها كبيرة لكي تكون واضحة») */
  const brokeAt = (i: number) => breaks.find((b) => b.i === i)?.at ?? Infinity;
  const whole = (i: number) => t < brokeAt(i);
  /* where the people hang: the outermost link still whole; they arrive `hold` s after the break of the one before */
  const order = [...breaks].sort((a, b) => a.at - b.at);
  let cur = n - 1, sinceMove = 99, prev = n - 1;
  for (const b of order) { if (t < b.at) break; if (b.i === cur) { prev = cur; cur = cur - 1; sinceMove = t - b.at; } }
  const falling = cur < 0, fallT = falling ? sinceMove : 0;
  const swing = falling ? 1 : ease(clamp((sinceMove - 0.05) / hold));
  const hx = (i: number) => X0 + i * STEP;
  const pX = (falling ? hx(0) : hx(prev) + (hx(cur) - hx(prev)) * swing), pY = CY + 70 + (falling ? 0.5 * 2600 * fallT * fallT : -Math.sin(Math.PI * swing) * 40);
  const link = (i: number) => {
    const ba = brokeAt(i), d = t - ba, cx = hx(i), side = i % 2 === 1;
    const steel = `url(#chainSteel)`;
    if (d < 0) return <g key={i}>{side
      ? <rect x={cx - LW / 2} y={CY - 30} width={LW} height={60} rx={30} fill="none" stroke={steel} strokeWidth={26} />
      : <ellipse cx={cx} cy={CY} rx={LW / 2} ry={LH / 2} fill="none" stroke={steel} strokeWidth={28} />}</g>;
    if (d > 1.6) return null;
    const crack = d < 0.18, g = 0.5 * 2200 * Math.max(0, d - 0.12) ** 2, dust = clamp((d - 0.7) / 0.9);
    const half = (sgn: number) => <g key={sgn} transform={`translate(${sgn * 60 * d} ${g}) rotate(${sgn * 140 * d} ${cx + sgn * LW / 4} ${CY})`} opacity={1 - dust}>
      <path d={side ? `M ${cx} ${CY - 26} H ${cx + sgn * (LW / 2 - 26)} A 26 26 0 0 ${sgn > 0 ? 1 : 0} ${cx + sgn * (LW / 2 - 26)} ${CY + 26} H ${cx}` : `M ${cx} ${CY - LH / 2} A ${LW / 2} ${LH / 2} 0 0 ${sgn > 0 ? 1 : 0} ${cx} ${CY + LH / 2}`} fill="none" stroke={steel} strokeWidth={side ? 20 : 22} strokeLinecap="round" />
      {Array.from({ length: 7 }, (_, j) => <circle key={j} cx={cx + sgn * (20 + rnd(i * 13 + j) * 70)} cy={CY - 40 + rnd(i * 7 + j) * 80 + 160 * dust * rnd(j + 3)} r={4 + 6 * rnd(j + i)} fill="#b9b2a6" opacity={dust} />)}
    </g>;
    return <g key={i}>{crack ? <g stroke="#ffd36b" strokeWidth={6} strokeLinecap="round"><path d={`M ${cx - 10} ${CY - 70} L ${cx + 6} ${CY - 18} L ${cx - 8} ${CY + 14} L ${cx + 10} ${CY + 70}`} fill="none" /><circle cx={cx} cy={CY} r={40 + 220 * d} fill="none" stroke="#fff3c4" strokeWidth={8 * (1 - d / 0.18)} /></g> : null}{half(-1)}{half(1)}</g>;
  };
  const person = (j: number) => { const ox = (j - (people - 1) / 2) * 56, sw = Math.sin(t * 3.1 + j) * 4, px = pX + ox + (falling ? (j - 1) * 120 * fallT : 0), py = pY + (falling ? j * 30 * fallT : 0);
    return <g key={"p" + j} transform={`translate(${px} ${py}) rotate(${falling ? (j - 1) * 160 * fallT : sw} 0 -40)`}>
      <line x1={-12} y1={-58} x2={-6} y2={0} stroke={BRAND.card} strokeWidth={9} strokeLinecap="round" /><line x1={12} y1={-58} x2={6} y2={0} stroke={BRAND.card} strokeWidth={9} strokeLinecap="round" />
      <circle cx={0} cy={18} r={17} fill={BRAND.card} /><rect x={-15} y={34} width={30} height={52} rx={12} fill={BRAND.accent} />
      <line x1={-8} y1={84} x2={-14} y2={130} stroke={BRAND.card} strokeWidth={9} strokeLinecap="round" /><line x1={8} y1={84} x2={14} y2={130} stroke={BRAND.card} strokeWidth={9} strokeLinecap="round" />
    </g>; };
  return (
    <div style={abs({ left: x, top: y, width: W, height: H, ...pop(kk, 0.75) })}>
      <svg width={W} height={H + 400} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <defs><linearGradient id="chainSteel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f2efe8" /><stop offset=".45" stopColor="#a9a39a" /><stop offset=".55" stopColor="#7d776f" /><stop offset="1" stopColor="#d9d4cb" /></linearGradient></defs>
        <rect x={0} y={CY - 190} width={60} height={380} rx={8} fill="#6b5a45" stroke="#3b2f22" strokeWidth={6} />
        <circle cx={60} cy={CY} r={26} fill="url(#chainSteel)" /><line x1={60} y1={CY} x2={X0 - LW / 2 + 8} y2={CY} stroke="url(#chainSteel)" strokeWidth={26} />
        {Array.from({ length: n }, (_, i) => link(i))}
        {pY < H + 380 && t >= at ? Array.from({ length: people }, (_, j) => person(j)) : null}
      </svg>
      {labels.map((l, i) => { const lk = clamp((t - l.at) / 0.35); if (lk <= 0 || l.i >= n) return null; const gone = !whole(l.i);
        return <div key={"l" + i} style={abs({ left: hx(l.i) - 130, top: CY - 210, width: 260, textAlign: "center", fontFamily: kufiF, fontSize: 52, color: l.gold ? "#3a2608" : BRAND.card,
          background: l.gold ? "linear-gradient(#ffe7a3, #e2b34f)" : gone ? "rgba(24,16,8,.82)" : BRAND.accent, border: gone ? `4px dashed ${BRAND.card}` : "none", borderRadius: 16, padding: "6px 10px", ...pop(lk, 0.5) })}>{l.text}</div>; })}
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
/** 37 · بوابة السجن (user order in «اعتقالات الدعاة في الأردن», 2026-11-17: «كل ما أذكر شخص تحط صورته… بعدين لما أقول كلهم معتقلون تسكر عليهم
 *  بوابة السجن مع صوت إغلاق… خطوط السجن، موشن جرافيك احترافي»): every named person's photo in a white frame with his name pops in WHEN he is named,
 *  the cards fill a grid; at `closeAt` iron bars slam down over all of them (a jolt on impact), then stay. Sound: spec sfx at closeAt (a metal slam). */
/* (user 2026-11-17, frames 13341/14760) `closeAt` is OPTIONAL: without it there are no bars (a plain group of pictures) — a far closeAt kept the element on screen to the end;
 *  every picture keeps its whole image: its white frame follows the picture's own proportions (`ratio` = height/width), never a crop («برمج الإطار ليناسب الصورة لا العكس») */
export const PrisonBars: React.FC<Base & { people: { src: string; name: string; at: number; ratio?: number }[]; closeAt?: number; cols?: number }> = ({ at, until, x, y, people, closeAt, cols = 4 }) => {
  const { t, k } = useK(); const n0 = people.length, cw = n0 <= 2 ? 330 : n0 <= 3 ? 260 : 180, ch = Math.round(cw * 1.22), gap = 22, n = n0;   /* few people = bigger cards (user 2026-11-17: two pictures under him in portrait) */
  const rows = Math.ceil(n / cols), W = cols * cw + (cols - 1) * gap;
  const ph = (i: number) => { const r = people[i].ratio; return r ? Math.round(Math.min(cw * 1.6, Math.max(cw * 0.45, (cw - 16) * r + 16))) : ch; };
  const rowH = Array.from({ length: rows }, (_, r) => Math.max(...people.slice(r * cols, r * cols + cols).map((_, j) => ph(r * cols + j)))), rowTop = rowH.map((_, r) => 30 + rowH.slice(0, r).reduce((a, h) => a + h + 56 + gap, 0));
  const H = rowH.reduce((a, h) => a + h + 56, 0) + (rows - 1) * gap;
  const CA = closeAt ?? Infinity;
  const drop = clamp((t - CA) / 0.45), fall = drop < 1 ? drop * drop : 1, jolt = t > CA + 0.45 && t < CA + 0.75 ? Math.sin((t - CA - 0.45) * 60) * 6 * (1 - (t - CA - 0.45) / 0.3) : 0;
  const tilt = (i: number) => ((i * 37) % 7) - 3;
  return (
    <div style={abs({ left: x, top: y, width: W + 60, height: H + 60, transform: `translateY(${jolt}px)` })}>
      {people.map((p, i) => { const kk = k(p.at, 0.35, until), r = Math.floor(i / cols), c = i % cols;
        const left = 30 + c * (cw + gap) + (r === rows - 1 && n % cols ? ((cols - (n % cols)) * (cw + gap)) / 2 : 0), top = rowTop[r] + (rowH[r] - ph(i));
        return <div key={i} style={abs({ left, top, width: cw, visibility: kk > 0 ? "visible" : "hidden", transform: `rotate(${tilt(i)}deg) scale(${0.3 + 0.7 * ease(kk)})` })}>
          <div style={{ width: cw, height: ph(i), background: "#fff", padding: 8, boxSizing: "border-box", boxShadow: "0 14px 34px rgba(0,0,0,.55)" }}><Pic src={p.src} style={{ width: "100%", height: "100%", objectFit: p.ratio ? "contain" : "cover", objectPosition: "50% 20%" }} /></div>
          <div style={{ marginTop: 8, padding: "6px 8px", background: BRAND.navy, color: BRAND.card, fontFamily: kufiF, fontSize: 24, lineHeight: 1.25, textAlign: "center", borderRadius: 6 }}>{p.name}</div>
        </div>; })}
      {t >= CA && t < until ? <div style={abs({ left: 0, top: 0, width: W + 60, height: H + 60, overflow: "hidden" })}>
        <div style={abs({ left: 0, top: -(H + 60) * (1 - fall), width: W + 60, height: H + 60 })}>
          {Array.from({ length: Math.round((W + 60) / 64) + 1 }).map((_, b) => <div key={b} style={abs({ left: 10 + b * 64, top: 0, width: 18, height: H + 60, borderRadius: 9, background: "linear-gradient(90deg, #2a2d31, #9aa2aa 45%, #3a3e43 70%, #1c1e21)", boxShadow: "4px 0 10px rgba(0,0,0,.6)" })} />)}
          {[0.18, 0.82].map((f, j) => <div key={j} style={abs({ left: 0, top: (H + 60) * f - 14, width: W + 60, height: 28, borderRadius: 6, background: "linear-gradient(180deg, #2a2d31, #9aa2aa 45%, #3a3e43 70%, #1c1e21)", boxShadow: "0 6px 12px rgba(0,0,0,.6)" })} />)}
        </div>
      </div> : null}
    </div>
  );
};

/** 36 · خط الأقسام (user 2026-11-17: «على اليمين خط طولي وفيه نقاط والأقسام عندها وخلفه ظل أسود متدرج»; in the first seconds of the video):
 *  a black gradient shade slides in from the right edge, a vertical rail draws down near the right edge, a dot lands on it for every section and the
 *  section's title appears beside its dot (right-aligned, all titles one fitted font). `current` (optional) lights one section. Whole frame, both orientations. */
/** PORTRAIT (user 2026-11-17: «فوق رأسي لكن الفيديو الخاص بي يكون نازل قليلاً عنه»): the rail sits in a band ABOVE his head and his video slides down by
 *  railPortDrop(n) while it shows (spec psplits window {s: 1, dy}, added by the engine; the gallery does the same) — the band never covers his face */
export const railPortBand = (n: number) => { const gap = Math.max(46, Math.min(80, 640 / Math.max(1, n))), top = 110; return { top, gap, bottom: top + gap * (Math.max(1, n) - 1) }; };
const PORT_HEAD_TOP = 60;   /* his head's top in the portrait frame (cams crop of the 1080×1920 slice) */
export const railPortDrop = (n: number) => Math.max(0, Math.round(railPortBand(n).bottom + 90 - PORT_HEAD_TOP));
export const SectionsRail: React.FC<{ at: number; until: number; sections: { title: string; at?: number }[]; current?: number; W?: number; H?: number }> = ({ at, until, sections, current, W: W0, H: H0 }) => {
  const { k } = useK(); const vc = useVideoConfig(), W = W0 ?? vc.width, H = H0 ?? vc.height, port = H > W;
  /* never on his face or beard: landscape titles end left at x ≥ 1150 (gallery face zone 811–1121); portrait = the band above his head (his video drops under it) */
  const n = Math.max(1, sections.length), pb = railPortBand(n), top = port ? pb.top : H * 0.1, bot = port ? pb.bottom : H * 0.76,   /* the episode bar sits at the bottom right: the rail ends above it (user 2026-11-19) */ span = bot - top, gap = n > 1 ? span / (n - 1) : 0;
  const railX = W - (port ? 60 : 80), lineK = ease(k(at + 0.15, 0.6, until)), stag = Math.min(0.3, 1.4 / n);
  const font = Math.round(Math.max(24, Math.min(port ? 46 : 50, (n > 1 ? gap : 80) * 0.55)));
  const FG = fitGroup(sections.map((s) => s.title), { font, minFont: Math.max(20, Math.round(font * 0.7)), minW: 80, maxW: port ? W * 0.82 : railX - 34 - 1150, padX: 10, padY: 4, maxLines: 1 });
  const shade = ease(k(at, 0.45, until));
  return (
    <div style={abs({ left: 0, top: 0, width: W, height: H, pointerEvents: "none" })}>
      {port
        ? <div style={abs({ left: 0, top: 0, width: W, height: bot + 170, background: "linear-gradient(to bottom, rgba(0,0,0,.88), rgba(0,0,0,.6) 70%, rgba(0,0,0,0))", opacity: shade > 0 ? 1 : 0, transform: `translateY(${-(1 - shade) * 100}%)` })} />
        : <div style={abs({ right: 0, top: 0, width: W * 0.5, height: H, background: "linear-gradient(to left, rgba(0,0,0,.88), rgba(0,0,0,.6) 45%, rgba(0,0,0,0))", opacity: shade > 0 ? 1 : 0, transform: `translateX(${(1 - shade) * 100}%)` })} />}
      <div style={abs({ left: railX - 3, top, width: 6, height: span * lineK, borderRadius: 3, background: BRAND.light })} />
      {sections.map((s, i) => {
        const y = top + i * gap, ka = s.at ?? at + 0.35 + i * stag, kk = k(ka, 0.3, until), on = current === i, done = current !== undefined && i < current, f = FG[i];   /* (user 2026-11-19) the part we reached: green mark; the parts above it faded; the ones below as before */
        if (kk <= 0 || lineK * span < y - top - 1) return null;
        return <React.Fragment key={i}>
          <div style={abs({ left: railX - 15, top: y - 15, width: 30, height: 30, borderRadius: "50%", background: on || done ? "#2fbf5f" : BRAND.card, border: `4px solid ${on || done ? "#2fbf5f" : BRAND.light}`, boxSizing: "border-box", transform: `scale(${0.3 + 0.7 * ease(kk)})`, boxShadow: on ? "0 0 18px #2fbf5f" : "none", opacity: done ? 0.55 : 1, color: "#fff", fontSize: 18, lineHeight: "22px", textAlign: "center", fontWeight: 900 })}>{on || done ? "✓" : null}</div>
          <div style={abs({ right: W - railX + 34, top: y - f.h / 2, height: f.h, display: "flex", alignItems: "center", gap: 14, fontFamily: kufiF, fontSize: f.fs, lineHeight: 1.3, color: on ? "#7dffa8" : "#fff", opacity: done ? 0.5 : 1, whiteSpace: "nowrap", direction: "rtl", clipPath: `inset(-20% 0 -20% ${(1 - ease(kk)) * 100}%)` })}>
            <span style={{ color: BRAND.light, fontSize: f.fs * 0.8 }}>{arDigits(i + 1)}</span><span>{s.title}</span>
          </div>
        </React.Fragment>;
      })}
    </div>
  );
};

/** 37 · عدّاد البطاقة (user 2026-11-20, gta6: «أنت بدك تضيف 150,000، حط عداد. في عندنا في المعرض عداد أرقام») — the gallery's number counter
 *  (src/MG.tsx GlowCounter: the gold number on a paper card) as a spec element, timed by his words: it counts up from 0 and lands on `value` just after
 *  he says it (`valueAt`), his words under it (`label` from `labelAt`). `text` (optional): a spoken amount that is not one number («مئات الآلاف»): the digits
 *  race up to `value` and the card then shows his words instead. Not a split screen: he stays centred, the card in the left third (PICK_NOSPLIT). */
export const GlowCounter: React.FC<Base & { value: number; valueAt: number; label?: string; labelAt?: number; text?: string; suffix?: string }> = ({ at, until, x, y, value, valueAt, label, labelAt, text, suffix = "" }) => {
  const { t, k } = useK(); const kk = k(at, 0.45, until);
  const t0 = Math.min(at + 0.35, valueAt - 0.3), t1 = valueAt + 0.45, u = clamp((t - t0) / Math.max(0.3, t1 - t0)), n = Math.round(value * (1 - Math.pow(1 - u, 3)));
  const showText = !!text && t >= t1, num = arDigits(n.toLocaleString("en-US")).replace(/,/g, "٬") + suffix;
  return (
    <div style={abs({ left: x - 300, top: y - 110, width: 600, ...pop(kk, 0.5) })}>
      <div style={{ margin: "0 auto", width: 560, height: 200, display: "grid", placeItems: "center", background: BRAND.card, borderRadius: 22, boxShadow: "0 22px 44px rgba(0,0,0,.35)", fontFamily: kufiF, fontSize: showText ? 96 : 128, lineHeight: 1, color: BRAND.accent, direction: showText ? "rtl" : "ltr", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>{showText ? text : num}</div>
      {label ? <div style={abs({ left: -60, right: -60, top: 226, textAlign: "center", fontFamily: kufiF, fontSize: 50, lineHeight: 1.25, color: BRAND.card, direction: "rtl", ...wipe(ease(k(labelAt ?? at, 0.5, until))) })}>{label}</div> : null}
    </div>
  );
};

export const PICK_KIT2 = { QACard, ThoughtBubble, WordCloud, CopiedMessages, Iceberg, CommentsFlood, BrushWipe, RootsTree, FillGlasses, SectionsRail, PrisonBars, ChainLinks, GlowCounter } as const;
/** every picked element (PickKit + PickKit2) by spec name */
/** the gallery's own x,y of every picked element (src/ElementsLab.tsx): used when a spec item gives none, so a spec never invents a place (user 2026-11-14: «لابد أن تنتبه إلى أماكن العناصر»). StickyNotes carry their own per-note x,y. */
export const PICK_XY: Record<string, [number, number]> = { ChainLinks: [60, 200], PrisonBars: [60, 120], MinuteTeaser: [150, 150], NoProof: [100, 200], FlapBoard: [80, 260], BigQuestion: [90, 150], NeverMeet: [110, 260], ThoughtBubble: [90, 170], RootsTree: [110, 120], Iceberg: [110, 130], Crossroads: [110, 150], MythFact: [90, 300], InkQuote: [90, 380], ChatThread: [110, 250], MindMap: [560, 560], RingStat: [560, 470], GlowCounter: [560, 470], QACard: [160, 300], ViciousCycle: [560, 520], FillGlasses: [110, 220], DecisionFlow: [80, 150], Footnote: [90, 230], ClaimWall: [110, 300], CopiedMessages: [110, 150], WordCloud: [560, 480], CommentsFlood: [110, 150] };
/** PORTRAIT place of a picked element (user 2026-11-16, marked screenshot: the elements in the band 1400–1880 under the caption, never on his beard):
 *  the element is drawn in its landscape 1920×1080 board; PICK_PORT_BOX = the part of that board it really uses [top, height] (estimated from its layout),
 *  and the board is scaled (≤ 0.95) and placed so that part fills the band, centred (the board's content column is centred on x ≈ 590). */
export const PICK_PORT_BOX: Record<string, [number, number]> = {
  PrisonBars: [120, 620], ChainLinks: [160, 700],
  BigQuestion: [170, 650], NeverMeet: [250, 550], RingStat: [220, 630], ClaimWall: [300, 700], Crossroads: [150, 800], MythFact: [270, 440], DecisionFlow: [150, 780],
  MindMap: [180, 670], ViciousCycle: [180, 680], WordCloud: [200, 560], InkQuote: [380, 400], MinuteTeaser: [150, 600], NoProof: [200, 600],
  FlapBoard: [260, 420], ThoughtBubble: [170, 600], RootsTree: [120, 800], Iceberg: [130, 800], ChatThread: [250, 560], QACard: [300, 480], FillGlasses: [220, 620],
  Footnote: [230, 520], CopiedMessages: [150, 720], CommentsFlood: [150, 760], GlowCounter: [340, 420],
};
export const pickPortBoard = (el: string): React.CSSProperties => {
  const [bt, bh] = PICK_PORT_BOX[el] ?? [(PICK_XY[el]?.[1] ?? 150), 700], s = Math.min(0.95, 610 / bh, 1000 / 1000);   /* (user 2026-11-16) the ELEMENTS zone: y 1100–1760, under the caption, his video in the upper half */
  const top = 1135 + (630 - bh * s) / 2 - bt * s, left = 540 - 590 * s;
  return { position: "absolute", left, top, width: 1920, height: 1080, transform: `scale(${s})`, transformOrigin: "0 0" };
};
/** NOT a split screen (user 2026-11-14, frames 8341/10458/11903/13009/14105): he stays centred, the element sits small in the left third over a dark gradient (LeftShade); these are its LANDSCAPE props. The engine and the gallery both read this table. */
export const PICK_NOSPLIT: Record<string, Record<string, number>> = { RingStat: { x: 330, y: 470 }, GlowCounter: { x: 330, y: 470 }, MythFact: { x: 40, y: 300, w: 760, size: 40 }, ChatThread: { x: 40, y: 250, w: 580 }, FlapBoard: { x: 40, y: 260, w: 600, size: 44 }, BigQuestion: { x: 40, y: 250, w: 600, size: 330 }, GradeLadder: { x: 40, y: 190 }, DecisionFlow: { x: 30, y: 180, s: 0.72, bare: 1 } };   /* GradeLadder, DecisionFlow: the dark gradient, no split (gallery notes 2026-11-17) */   /* BigQuestion beside him with no split (user 2026-11-16) */   /* the user's red box, lower left (2026-11-15) */
export const PICK_ALL = { ...PICK_KIT, ...PICK_KIT2 } as const;
export type PickAllName = keyof typeof PICK_ALL;
export const PICK_ALL_FULL_FRAME = new Set<string>([...PICK_FULL_FRAME, "BrushWipe", "SectionsRail"]);
/** the drawn metaphors (user 2026-11-14: «كن مبدعاً … بإضافة المعاني والتعبير عنها بهذه الطريقة»): pick_triggers counts them per minute */
export const METAPHOR_ELS = ["ChainLinks", "RootsTree", "FillGlasses", "Iceberg", "ViciousCycle", "Crossroads", "ClaimWall", "NeverMeet", "MindMap", "DecisionFlow", "StickyNotes", "WordCloud"];
void bounce;
