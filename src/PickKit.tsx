import React from "react";
import { kufiF, naskhF, useT } from "./MG";
import { BRAND } from "./brand";
import { Pic } from "./EuKit";

/**
 * PickKit — the 12 elements the user picked from the temporary gallery of 50 (2026-11-14), in the channel identity (src/brand.ts, read at draw time).
 * Spec: { t: "pick", el: "<Name>", at, until, ...props, land?: {...landscape overrides} } (src/MontageSpec.tsx). When each one is due: PREFERENCES.md
 * «عناصر المعرض المؤقت المعتمدة» and data/elements_lab.json `where`. All times in SECONDS; nothing appears before its `at`; exits are wipes/scales, never a fade.
 */
const clamp = (x: number) => Math.max(0, Math.min(1, x));
const ease = (x: number) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const back = (x: number) => { x = clamp(x); const c = 1.7; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const AR = "٠١٢٣٤٥٦٧٨٩";
export const arDigits = (s: string | number) => String(s).replace(/[0-9]/g, (d) => AR[+d]);
/** entrance progress at `a` over `d`, collapsing over the last 0.35 s before `until` */
const useK = () => { const t = useT(0); return { t, k: (a: number, d: number, until: number) => Math.min(clamp((t - a) / d), clamp((until - t) / 0.35)) }; };
const wipe = (k: number): React.CSSProperties => ({ visibility: k > 0 ? "visible" : "hidden", clipPath: `inset(-30% 0 -30% ${(1 - clamp(k)) * 100}%)` });   // right → left (Arabic)
const pop = (k: number, from = 0.4, extra = ""): React.CSSProperties => ({ visibility: k > 0 ? "visible" : "hidden", transform: `scale(${from + (1 - from) * back(k)}) ${extra}` });
const abs = (s: React.CSSProperties): React.CSSProperties => ({ position: "absolute", ...s });
const dash = (len: number, k: number) => ({ strokeDasharray: len, strokeDashoffset: len * (1 - clamp(k)) });
type Base = { at: number; until: number; x: number; y: number };

/** 1 · اقتباس يُكتب بالحبر — the quote written line by line behind a gold nib, under a big quotation sign (user note: a quote sign, not «» brackets) */
export const InkQuote: React.FC<Base & { w?: number; size?: number; lines: { text: string; at: number }[]; source?: string }> = ({ at, until, x, y, w = 960, size = 96, lines, source }) => {
  const { t, k } = useK(); const lh = size * 1.55;
  const cur = lines.map((l, i) => clamp((t - l.at) / Math.max(0.5, l.text.length * 0.06))).map((u, i) => [u, i] as const).find(([u]) => u > 0 && u < 1);
  return (
    <div style={abs({ left: x, top: y, width: w })}>
      <div style={abs({ right: -10, top: -size * 1.35, fontFamily: naskhF, fontSize: size * 2.2, lineHeight: 1, color: BRAND.accent, ...pop(k(at, 0.4, until), 0.3) })}>❝</div>
      {lines.map((l, i) => { const u = Math.min(clamp((t - l.at) / Math.max(0.5, l.text.length * 0.06)), clamp((until - t) / 0.35));
        return <div key={i} style={abs({ left: 0, width: w, top: i * lh, textAlign: "center", fontFamily: naskhF, fontSize: size, lineHeight: 1.3, color: i === lines.length - 1 && lines.length > 1 ? BRAND.accent : BRAND.card, ...wipe(ease(u)) })}>{l.text}</div>; })}
      {cur && t < until ? <div style={abs({ width: 28, height: 28, background: BRAND.accent, transform: "rotate(45deg)", boxShadow: `0 0 22px ${BRAND.accent}`, top: cur[1] * lh + size * 0.6, left: w * (0.9 - 0.8 * cur[0]) })} /> : null}
      {source ? <div style={abs({ left: 0, width: w, top: lines.length * lh + 10, textAlign: "center", fontFamily: kufiF, fontSize: size * 0.36, color: BRAND.light, ...wipe(ease(k(lines[lines.length - 1].at + 0.8, 0.4, until))) })}>{source}</div> : null}
    </div>
  );
};

/** 2 · علامة استفهام عملاقة — a huge question mark spins in and settles, the question written under it when he asks it */
export const BigQuestion: React.FC<Base & { text: string; textAt: number; size?: number; w?: number }> = ({ at, until, x, y, text, textAt, size = 500, w = 960 }) => {
  const { k } = useK(); const a = k(at, 0.7, until);
  return (
    <div style={abs({ left: x, top: y, width: w })}>
      <div style={abs({ left: 0, width: w, top: 0, height: size * 1.1, lineHeight: `${size * 1.1}px`, textAlign: "center", fontFamily: kufiF, fontSize: size, color: BRAND.accent, textShadow: `0 ${size * 0.03}px 0 ${BRAND.accentDeep}`, visibility: a > 0 ? "visible" : "hidden", transform: `rotate(${(1 - back(a)) * -220}deg) scale(${0.2 + 0.8 * back(a)})` })}>؟</div>
      <div style={abs({ left: 0, width: w, top: size * 1.15, textAlign: "center", fontFamily: kufiF, fontSize: size * 0.17, color: BRAND.card, ...wipe(ease(k(textAt, 0.5, until))) })}>{text}</div>
    </div>
  );
};

/** 3 · محادثة رسائل — chat bubbles one by one; «يكتب الآن» dots before each reply (me = his side, accent colour) */
export const ChatThread: React.FC<Base & { w?: number; size?: number; msgs: { text: string; at: number; me?: boolean }[] }> = ({ at, until, x, y, w = 940, size = 46, msgs }) => {
  const { t, k } = useK(); const gap = size * 4.1;
  return (
    <div style={abs({ left: x, top: y, width: w })}>
      {msgs.map((m, i) => {
        const kk = k(m.at, 0.35, until), typing = m.me && t > m.at - 0.7 && t < m.at && t >= at;
        const side: React.CSSProperties = m.me ? { left: 0, borderBottomLeftRadius: 8, background: BRAND.accent, color: BRAND.onAccent, transformOrigin: "0 100%" } : { right: 0, borderBottomRightRadius: 8, background: BRAND.card, color: BRAND.ink, transformOrigin: "100% 100%" };
        return <React.Fragment key={i}>
          <div style={abs({ top: i * gap, maxWidth: w * 0.78, padding: `${size * 0.5}px ${size * 0.8}px`, borderRadius: size * 0.85, fontFamily: kufiF, fontSize: size, lineHeight: 1.35, ...side, ...pop(kk, 0.3) })}>{m.text}</div>
          {typing ? <div style={abs({ top: i * gap, left: 0, padding: `${size * 0.3}px ${size * 0.7}px`, borderRadius: size * 0.85, borderBottomLeftRadius: 8, background: BRAND.accent, color: BRAND.onAccent, fontFamily: kufiF, fontSize: size * 1.3, lineHeight: 1, letterSpacing: 4 + Math.sin(t * 12) * 4 })}>• • •</div> : null}
        </React.Fragment>;
      })}
    </div>
  );
};

/** 4 · أوراق لاصقة (improved): paper sticky notes slapped on one by one — curled lower corner, tape strip, a small settle wobble, the word in a pen hand */
export const StickyNotes: React.FC<{ until: number; size?: number; notes: { text: string; at: number; x: number; y: number; rot?: number; tint?: "card" | "paper" | "accent" }[] }> = ({ until, size = 300, notes }) => {
  const { t, k } = useK();
  return <>{notes.map((n, i) => {
    const kk = k(n.at, 0.28, until), s = t - n.at, wob = s > 0.28 && s < 0.9 ? Math.sin((s - 0.28) * 26) * 2.2 * (1 - (s - 0.28) / 0.62) : 0;
    const bg = n.tint === "accent" ? BRAND.accent : n.tint === "paper" ? BRAND.paper : BRAND.card, fg = n.tint === "accent" ? BRAND.onAccent : BRAND.ink, rot = n.rot ?? [-5, 4, -2, 3][i % 4];
    return (
      <div key={i} style={abs({ left: n.x, top: n.y, width: size, height: size, visibility: kk > 0 ? "visible" : "hidden", transform: `scale(${1.6 - 0.6 * ease(kk)}) rotate(${rot + (1 - kk) * 14 + wob}deg)`, filter: `drop-shadow(0 ${6 + 14 * kk}px ${10 + 14 * kk}px rgba(0,0,0,.45))` })}>
        <div style={abs({ inset: 0, background: `linear-gradient(160deg, ${bg} 0%, ${bg} 72%, rgba(0,0,0,.12) 100%)`, clipPath: "polygon(0 0,100% 0,100% 84%,84% 100%,0 100%)" })} />
        <div style={abs({ right: 0, bottom: 0, width: size * 0.16, height: size * 0.16, background: "linear-gradient(135deg, rgba(0,0,0,.28), rgba(255,255,255,.55) 55%)", clipPath: "polygon(0 0,100% 0,0 100%)" })} />
        <div style={abs({ left: size * 0.3, top: -size * 0.06, width: size * 0.4, height: size * 0.13, background: "rgba(255,255,255,.55)", transform: "rotate(-4deg)", boxShadow: "0 1px 3px rgba(0,0,0,.15)" })} />
        <div style={abs({ inset: size * 0.1, display: "grid", placeItems: "center", textAlign: "center", fontFamily: naskhF, fontSize: size * (n.text.length > 9 ? 0.15 : 0.2), lineHeight: 1.3, color: fg })}>{n.text}</div>
        <div style={abs({ left: size * 0.12, right: size * 0.12, top: size * 0.78, height: 3, background: fg, opacity: 0.18 })} />
      </div>
    );
  })}</>;
};

/** 5 · لوحة المطار الدوّارة (in our colours): rows flutter through random letters, then settle on each line when it is said */
export const FlapBoard: React.FC<Base & { w?: number; size?: number; rows: { text: string; at: number }[] }> = ({ at, until, x, y, w = 980, size = 66, rows }) => {
  const { t, k } = useK(); const rh = size * 2, pool = [...new Set(rows.map((r) => r.text).join("").replace(/\s/g, ""))];
  const kb = k(at, 0.4, until);
  return (
    <div style={abs({ left: x, top: y, width: w, height: rows.length * (rh + 20) + 60, background: BRAND.base3, borderRadius: 18, border: `4px solid ${BRAND.navy}`, boxShadow: "0 24px 60px rgba(0,0,0,.55)", ...pop(kb, 0.8) })}>
      {rows.map((r, i) => { const done = t >= r.at, spin = !done && t > at + 0.2;
        const txt = done ? r.text : spin ? r.text.split("").map((c, j) => (c === " " ? " " : pool[Math.floor(t * 14 + j * 7 + i * 3) % pool.length])).join("") : "";
        return (
          <div key={i} style={abs({ left: 30, right: 30, top: 30 + i * (rh + 20), height: rh, background: BRAND.navy, borderRadius: 10, overflow: "hidden" })}>
            <div style={abs({ inset: 0, display: "grid", placeItems: "center", fontFamily: kufiF, fontSize: size, color: done ? BRAND.card : BRAND.light, transform: spin ? `scaleY(${0.2 + 0.8 * Math.abs(Math.cos(t * 44 + i))})` : "none" })}>{txt}</div>
            <div style={abs({ left: 0, right: 0, top: rh / 2 - 2, height: 4, background: BRAND.base3 })} />
            {done ? <div style={abs({ right: 0, top: 0, bottom: 0, width: 12, background: BRAND.accent })} /> : null}
          </div>
        );
      })}
    </div>
  );
};

/** 6 · شريط البحث — when he names one of HIS episodes or books: its picture above, then the search bar types how to find it (optional suggestion rows) */
export const SearchBar: React.FC<Base & { w?: number; query: string; typeAt: number; cps?: number; img?: string; imgAt?: number; imgH?: number; imgCaption?: string; results?: string[]; resultsAt?: number }> = ({ at, until, x, y, w = 900, query, typeAt, cps = 12, img, imgAt, imgH = 380, imgCaption, results, resultsAt }) => {
  const { t, k } = useK(); const top = img ? imgH + 40 : 0, h = 116;
  const n = Math.max(0, Math.min(query.length, Math.floor((t - typeAt) * cps)));
  return (
    <div style={abs({ left: x, top: y, width: w })}>
      {img ? <div style={abs({ left: w * 0.1, width: w * 0.8, top: 0, height: imgH, borderRadius: 14, overflow: "hidden", background: BRAND.base3, border: `6px solid ${BRAND.card}`, boxShadow: "0 20px 50px rgba(0,0,0,.5)", ...pop(k(imgAt ?? at, 0.4, until), 0.6) })}>
        <Pic src={img} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        {imgCaption ? <div style={abs({ left: 0, right: 0, bottom: 0, padding: "10px 18px", background: BRAND.navy, color: BRAND.card, fontFamily: kufiF, fontSize: 32, textAlign: "center" })}>{imgCaption}</div> : null}
      </div> : null}
      <div style={abs({ left: 0, width: w, top, height: h, background: BRAND.card, borderRadius: h / 2, boxShadow: "0 16px 40px rgba(0,0,0,.45)", ...pop(k(typeAt - 0.4, 0.4, until), 0.7) })}>
        <svg viewBox="0 0 24 24" width={54} height={54} style={{ position: "absolute", right: 38, top: 31 }}><circle cx="10" cy="10" r="7" fill="none" stroke={BRAND.gray} strokeWidth="2.4" /><path d="M15 15 L21 21" stroke={BRAND.gray} strokeWidth="2.6" strokeLinecap="round" /></svg>
        <div style={abs({ right: 120, left: 40, top: 0, height: h, lineHeight: `${h}px`, fontFamily: kufiF, fontSize: Math.min(48, (w - 170) / Math.max(1, query.length * 0.56)), direction: "rtl", textAlign: "right", color: BRAND.ink, whiteSpace: "nowrap", overflow: "hidden" })}>{query.slice(0, n)}{n < query.length && Math.floor(t * 3) % 2 ? <span style={{ color: BRAND.accent }}>|</span> : null}</div>
      </div>
      {results?.length ? <div style={abs({ left: 20, width: w - 40, top: top + h + 14, background: BRAND.card, borderRadius: 22, boxShadow: "0 16px 40px rgba(0,0,0,.45)", padding: "14px 0", visibility: k(resultsAt ?? typeAt + query.length / cps + 0.3, 0.5, until) > 0 ? "visible" : "hidden", clipPath: `inset(-5% -5% ${(1 - ease(k(resultsAt ?? typeAt + query.length / cps + 0.3, 0.5, until))) * 105}% -5%)` })}>
        {results.map((r, i) => <div key={i} style={{ padding: "16px 40px", fontFamily: kufiF, fontSize: 40, color: BRAND.ink, display: "flex", gap: 24, alignItems: "center" }}><span style={{ color: BRAND.gray }}>⌕</span>{r}</div>)}
      </div> : null}
    </div>
  );
};

/** 7 · خرافة وحقيقة — correcting ANY wrong idea: the wrong saying (red tag) is struck, then the truth (green tag) with a tick */
export const MythFact: React.FC<{ until: number; x: number; y: number; w?: number; size?: number; myth: string; mythAt: number; fact: string; factAt: number; mythTag?: string; factTag?: string }> = ({ until, x, y, w = 940, size = 60, myth, mythAt, fact, factAt, mythTag = "خطأ شائع", factTag = "الصواب" }) => {
  const { k } = useK(); const rh = size * 2.8;
  const row = (top: number, tag: string, c: string, text: string, kk: number, mark: string, mk: number, strike?: number) => (
    <div style={abs({ left: 0, width: w, top, height: rh, background: "rgba(255,255,255,.07)", borderRadius: 18, borderRight: `12px solid ${c}`, visibility: kk > 0 ? "visible" : "hidden", transform: `translateX(${(1 - ease(kk)) * -700}px)` })}>
      <div style={abs({ right: 30, top: -size * 0.5, padding: "6px 26px", background: c, borderRadius: 10, color: "#fff", fontFamily: kufiF, fontSize: size * 0.6 })}>{tag}</div>
      <div style={abs({ right: 40, left: size * 1.8, top: 0, height: rh, display: "flex", alignItems: "center", fontFamily: kufiF, fontSize: size, lineHeight: 1.3, color: BRAND.card })}>
        <span style={{ position: "relative" }}>{text}{strike !== undefined ? <i style={{ position: "absolute", right: -6, left: -6, top: "52%", height: size * 0.15, borderRadius: 5, background: c, transformOrigin: "100% 50%", transform: `scaleX(${strike})` }} /> : null}</span>
      </div>
      <div style={abs({ left: size * 0.4, top: 0, height: rh, display: "flex", alignItems: "center", fontFamily: kufiF, fontSize: size * 1.3, color: c, ...pop(mk, 0.4) })}>{mark}</div>
    </div>
  );
  return (
    <div style={abs({ left: x, top: y, width: w })}>
      {row(0, mythTag, BRAND.mark, myth, k(mythAt, 0.45, until), "✗", k(mythAt + 1, 0.3, until), ease(k(mythAt + 0.8, 0.4, until)))}
      {row(rh + size * 1.2, factTag, BRAND.green, fact, k(factAt, 0.45, until), "✓", k(factAt + 0.6, 0.3, until))}
    </div>
  );
};

/** 8 · الحلقة الممتلئة — one percentage: the ring fills to it while the number counts, the label under it */
export const RingStat: React.FC<Base & { r?: number; value: number; label: string; labelAt?: number; suffix?: string }> = ({ at, until, x, y, r = 220, value, label, labelAt, suffix = "٪" }) => {
  const { t, k } = useK(); const kk = k(at, 0.4, until), u = ease(clamp((t - at - 0.4) / 1.6)) * clamp((until - t) / 0.35), C = 2 * Math.PI * r, sw = r * 0.25;
  return (
    <div style={abs({ left: x - r - sw, top: y - r - sw, width: 2 * (r + sw), ...pop(kk, 0.6) })}>
      <svg width={2 * (r + sw)} height={2 * (r + sw)} style={{ overflow: "visible" }}>
        <circle cx={r + sw} cy={r + sw} r={r} fill="none" stroke="rgba(255,255,255,.12)" strokeWidth={sw} />
        <circle cx={r + sw} cy={r + sw} r={r} fill="none" stroke={BRAND.accent} strokeWidth={sw} strokeLinecap="round" transform={`rotate(-90 ${r + sw} ${r + sw})`} style={dash(C, (u * value) / 100 + 0.001)} />
      </svg>
      <div style={abs({ left: 0, right: 0, top: r + sw - r * 0.36, textAlign: "center", fontFamily: kufiF, fontSize: r * 0.62, color: BRAND.card })}>{arDigits(Math.round(value * u))}{suffix}</div>
      <div style={abs({ left: -300, right: -300, top: 2 * (r + sw) + 30, textAlign: "center", fontFamily: kufiF, fontSize: r * 0.26, color: BRAND.light, ...wipe(ease(k(labelAt ?? at + 2, 0.5, until))) })}>{label}</div>
    </div>
  );
};

/** 9 · الخط البياني الصاعد — growth over years: the line is drawn up through its points, shaded under, the increase tag at its end */
export const LineGrowth: React.FC<Base & { w?: number; h?: number; values: number[]; fromLabel: string; toLabel: string; tag: string; tagAt?: number; title?: string }> = ({ at, until, x, y, w = 940, h = 660, values, fromLabel, toLabel, tag, tagAt, title }) => {
  const { t, k } = useK(); const kk = k(at, 0.45, until), u = clamp((t - at - 0.5) / 1.6) * clamp((until - t) / 0.35);
  const lo = Math.min(...values), hi = Math.max(...values), X0 = w * 0.9, X1 = w * 0.2, Y0 = h * 0.82, Y1 = h * 0.2;
  const pts = values.map((v, i) => [X0 - ((X0 - X1) * i) / (values.length - 1), Y0 - ((Y0 - Y1) * (v - lo)) / Math.max(1e-9, hi - lo)]);
  const d = "M" + pts.map((p) => p.join(" ")).join(" L"); let len = 0; for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return (
    <div style={abs({ left: x, top: y, width: w, height: h, background: BRAND.base3, borderRadius: 20, boxShadow: "0 26px 60px rgba(0,0,0,.5)", ...pop(kk, 0.85) })}>
      <svg width={w} height={h} style={{ position: "absolute", inset: 0 }}>
        <defs><linearGradient id="lgFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={BRAND.accent} stopOpacity=".45" /><stop offset="1" stopColor={BRAND.accent} stopOpacity="0" /></linearGradient></defs>
        <path d={`M${X0 + 20} ${Y0} H${X1 - 100} M${X0 + 20} ${Y0} V${Y1 - 60}`} stroke="rgba(255,255,255,.35)" strokeWidth={4} fill="none" />
        <path d={`${d} L${X1} ${Y0} L${X0} ${Y0}Z`} fill="url(#lgFill)" style={{ clipPath: `inset(0 0 0 ${(1 - u) * 100}%)` }} />
        <path d={d} fill="none" stroke={BRAND.accent} strokeWidth={12} strokeLinejoin="round" strokeLinecap="round" style={dash(len, u)} />
        {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={16} fill={BRAND.card} stroke={BRAND.accent} strokeWidth={6} visibility={u > 0 && u >= (i / (pts.length - 1)) * 0.98 ? "visible" : "hidden"} />)}
      </svg>
      <div style={abs({ left: X0 - 60, top: Y0 + 20, fontFamily: kufiF, fontSize: 34, color: BRAND.light })}>{fromLabel}</div>
      <div style={abs({ left: X1 - 60, top: Y0 + 20, fontFamily: kufiF, fontSize: 34, color: BRAND.light })}>{toLabel}</div>
      {title ? <div style={abs({ right: 40, top: 30, fontFamily: kufiF, fontSize: 40, color: BRAND.card })}>{title}</div> : null}
      <div style={abs({ left: X1 - 80, top: Math.max(10, pts[pts.length - 1][1] - 120), padding: "8px 26px", borderRadius: 14, background: BRAND.accent, fontFamily: kufiF, fontSize: 58, color: BRAND.onAccent, ...pop(k(tagAt ?? at + 2.2, 0.35, until), 0.3) })}>{tag}</div>
    </div>
  );
};

/** 10 · مخطط القرار — a conditional ruling: the case → a diamond question → «نعم» and «لا» each to its result */
export const DecisionFlow: React.FC<Base & { start: string; q: string; qAt: number; yes: string; no: string; yesAt: number; noAt?: number; yesTag?: string; noTag?: string }> = ({ at, until, x, y, start, q, qAt, yes, no, yesAt, noAt, yesTag = "نعم", noTag = "لا" }) => {
  const { k } = useK(); const W = 980, kk = k(at, 0.4, until), dq = k(qAt, 0.35, until), ky = k(yesAt, 0.35, until), kn = k(noAt ?? yesAt + 0.25, 0.35, until);
  const box = (s: React.CSSProperties, bg: string, fg: string, txt: string, kx: number) => <div style={abs({ ...s, borderRadius: 18, background: bg, display: "grid", placeItems: "center", textAlign: "center", padding: "0 16px", fontFamily: kufiF, fontSize: 42, lineHeight: 1.3, color: fg, ...pop(kx, 0.4) })}>{txt}</div>;
  return (
    <div style={abs({ left: x, top: y, width: W, height: 780, background: BRAND.base3, borderRadius: 22, ...pop(kk, 0.9) })}>
      <svg width={W} height={780} style={{ position: "absolute", inset: 0 }} fill="none" stroke={BRAND.light} strokeWidth={8} strokeLinecap="round">
        <path d="M490 170 V250" style={dash(80, k(at + 0.4, 0.35, until))} />
        <path d="M650 420 H810 V560" style={dash(300, k(yesAt - 0.4, 0.4, until))} />
        <path d="M330 420 H170 V560" style={dash(300, k((noAt ?? yesAt + 0.25) - 0.4, 0.4, until))} />
      </svg>
      {box({ left: 300, top: 60, width: 380, height: 110 }, BRAND.navy, BRAND.card, start, k(at + 0.2, 0.35, until))}
      <div style={abs({ left: 350, top: 280, width: 280, height: 280, background: BRAND.accent, visibility: dq > 0 ? "visible" : "hidden", transform: `rotate(45deg) scale(${0.7 * back(dq)})` })} />
      <div style={abs({ left: 320, top: 380, width: 340, textAlign: "center", fontFamily: kufiF, fontSize: 42, lineHeight: 1.25, color: BRAND.onAccent, ...pop(dq) })}>{q}</div>
      <div style={abs({ left: 690, top: 360, fontFamily: kufiF, fontSize: 34, color: BRAND.green, ...pop(ky) })}>{yesTag}</div>
      <div style={abs({ left: 230, top: 360, fontFamily: kufiF, fontSize: 34, color: BRAND.mark, ...pop(kn) })}>{noTag}</div>
      {box({ left: 640, top: 570, width: 340, height: 140 }, BRAND.green, "#fff", yes, ky)}
      {box({ left: 0, top: 570, width: 340, height: 140 }, BRAND.mark, "#fff", no, kn)}
    </div>
  );
};

/** 11 · الخريطة الذهنية — a topic split into its parts: the centre node, curved branches out to each part as he names it */
export const MindMap: React.FC<Base & { center: string; nodes: { text: string; at: number }[]; r?: number }> = ({ at, until, x, y, center, nodes, r = 380 }) => {
  const { k } = useK(); const n = nodes.length;
  const pos = nodes.map((_, i) => { const a = -Math.PI / 2 - Math.PI * 0.75 + (i * Math.PI * 1.5) / Math.max(1, n - 1) + (n === 1 ? Math.PI * 0.75 : 0); return [Math.cos(a) * r, Math.sin(a) * r * 0.82]; });
  return (
    <div style={abs({ left: x, top: y })}>
      <svg width={1} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {pos.map(([px, py], i) => <path key={i} d={`M0 0 Q${px / 2 + py * 0.3} ${py / 2 - px * 0.2} ${px} ${py}`} fill="none" stroke={BRAND.accent} strokeWidth={9} strokeLinecap="round" style={dash(Math.hypot(px, py) * 1.15, k(nodes[i].at - 0.35, 0.4, until))} />)}
      </svg>
      <div style={abs({ left: -150, top: -80, width: 300, height: 160, borderRadius: 80, background: BRAND.accent, display: "grid", placeItems: "center", fontFamily: kufiF, fontSize: 54, color: BRAND.onAccent, ...pop(k(at, 0.4, until), 0.3) })}>{center}</div>
      {nodes.map((nd, i) => <div key={i} style={abs({ left: pos[i][0] - 140, top: pos[i][1] - 50, width: 280, height: 100, borderRadius: 50, background: BRAND.navy, border: `4px solid ${BRAND.light}`, display: "grid", placeItems: "center", fontFamily: kufiF, fontSize: 42, color: BRAND.card, ...pop(k(nd.at, 0.3, until), 0.3) })}>{nd.text}</div>)}
    </div>
  );
};

/** 12 · الحلقة المفرغة — a habit that repeats itself: stations on a circle joined by arrows, then a light runs round it without end */
export const ViciousCycle: React.FC<Base & { r?: number; steps: { text: string; at: number }[]; spinAt?: number }> = ({ at, until, x, y, r = 260, steps, spinAt }) => {
  const { t, k } = useK(); const n = steps.length, A = steps.map((_, i) => -Math.PI / 2 + (i * 2 * Math.PI) / n), gap = 0.32, sAt = spinAt ?? steps[n - 1].at + 0.6;
  const arcD = (a0: number, a1: number) => `M${r * Math.cos(a0)} ${r * Math.sin(a0)} A${r} ${r} 0 0 1 ${r * Math.cos(a1)} ${r * Math.sin(a1)}`;
  const ang = -Math.PI / 2 + (t - sAt) * 2.4;
  return (
    <div style={abs({ left: x, top: y, visibility: t >= at && t < until ? "visible" : "hidden" })}>
      <svg width={1} height={1} style={{ position: "absolute", overflow: "visible" }}>
        <defs><marker id="vcM" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6Z" fill={BRAND.accent} /></marker></defs>
        {A.map((a, i) => <path key={i} d={arcD(a + gap, a + (2 * Math.PI) / n - gap)} fill="none" stroke={BRAND.accent} strokeWidth={10} strokeLinecap="round" markerEnd={k(steps[(i + 1) % n].at - 0.3, 0.4, until) >= 1 ? "url(#vcM)" : undefined} style={dash(r * ((2 * Math.PI) / n - 2 * gap) + 2, k((steps[(i + 1) % n].at || at) - 0.3, 0.4, until))} />)}
      </svg>
      {steps.map((s, i) => <div key={i} style={abs({ left: r * Math.cos(A[i]) - 120, top: r * Math.sin(A[i]) - 50, width: 240, height: 100, borderRadius: 50, background: BRAND.navy, border: `4px solid ${BRAND.light}`, display: "grid", placeItems: "center", fontFamily: kufiF, fontSize: 44, color: BRAND.card, ...pop(k(s.at, 0.3, until), 0.3) })}>{s.text}</div>)}
      {t > sAt && t < until ? <div style={abs({ left: r * Math.cos(ang) - 18, top: r * Math.sin(ang) - 18, width: 36, height: 36, borderRadius: "50%", background: BRAND.card, boxShadow: `0 0 24px ${BRAND.card}, 0 0 50px ${BRAND.accent}` })} /> : null}
    </div>
  );
};

export const PICK_KIT = { InkQuote, BigQuestion, ChatThread, StickyNotes, FlapBoard, SearchBar, MythFact, RingStat, LineGrowth, DecisionFlow, MindMap, ViciousCycle } as const;
export type PickName = keyof typeof PICK_KIT;
