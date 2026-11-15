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
        return <div key={i} style={abs({ left: 0, width: w, top: i * lh, textAlign: "center", fontFamily: kufiF, fontWeight: 800, fontSize: size * 0.82, lineHeight: 1.45, color: i === lines.length - 1 && lines.length > 1 ? BRAND.accent : BRAND.card, textShadow: "0 4px 18px rgba(0,0,0,.55)", ...wipe(ease(u)) })}>{l.text}</div>; })}   /* user 2026-11-14 (frame 9200): bolder Kufi so the quote reads at a glance */
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

/* ───────── round 2 picks (user 2026-11-14) ───────── */

/** 13 · حاشية على الكلمة — a strange word of a hadith/text: gold underline under it, a thread down to a margin note with its meaning */
export const Footnote: React.FC<Base & { w?: number; size?: number; before: string; word: string; after?: string; wordAt: number; meaning: string; noteAt: number; source?: string }> = ({ at, until, x, y, w = 940, size = 72, before, word, after = "", wordAt, meaning, noteAt, source }) => {
  const { k } = useK(); const u = ease(k(wordAt, 0.4, until)), n = k(noteAt, 0.45, until);
  return (
    <div style={abs({ left: x, top: y, width: w })}>
      <div style={abs({ left: 0, width: w, top: 0, textAlign: "center", fontFamily: naskhF, fontSize: size, lineHeight: 1.5, color: BRAND.card, ...wipe(ease(k(at, 0.6, until))) })}>
        {before} <span style={{ position: "relative", color: u > 0 ? BRAND.accent : BRAND.card }}>{word}<i style={{ position: "absolute", right: 0, left: 0, bottom: -6, height: 7, borderRadius: 4, background: BRAND.accent, transformOrigin: "100% 50%", transform: `scaleX(${u})` }} /></span> {after}
      </div>
      <div style={abs({ left: w / 2 - 3, top: size * 1.6, width: 6, height: 70 * ease(n), background: BRAND.accent })} />
      <div style={abs({ left: w * 0.1, width: w * 0.8, top: size * 1.6 + 70, padding: "26px 34px", borderRadius: 14, background: BRAND.card, borderRight: `12px solid ${BRAND.accent}`, boxShadow: "0 20px 50px rgba(0,0,0,.45)", fontFamily: kufiF, fontSize: size * 0.58, lineHeight: 1.6, color: BRAND.ink, ...pop(n, 0.6) })}>
        <b style={{ color: BRAND.accentDeep }}>{word}:</b> {meaning}
      </div>
      {source ? <div style={abs({ left: w * 0.1, top: size * 1.6 + 70 + size * 2.6, fontFamily: kufiF, fontSize: size * 0.4, color: BRAND.light, ...wipe(ease(k(noteAt + 0.6, 0.4, until))) })}>{source}</div> : null}
    </div>
  );
};

const rnd1 = (i: number) => { const v = Math.sin(i * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
/** 14 · جدار الشبهة ينهار — the doubt's words on a brick wall; the evidence card rams it and the bricks fall */
export const ClaimWall: React.FC<{ at: number; until: number; x: number; y: number; words: string[]; hitAt: number; ram?: string }> = ({ at, until, x, y, words, hitAt, ram = "الدليل" }) => {
  const { t, k } = useK(); const bricks: { c: number; r: number; txt: string; i: number }[] = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { const i = r * 4 + c; bricks.push({ c, r, i, txt: i % 3 === 1 ? words[Math.floor(i / 3) % words.length] ?? "" : "" }); }
  const m = clamp((t - (hitAt - 0.8)) / 0.8);
  return (
    <div style={abs({ left: x, top: y })}>
      {bricks.map((b) => { const kb = k(at + b.i * 0.03, 0.35, until), f = Math.max(0, t - hitAt - rnd1(b.i) * 0.3);
        return <div key={b.i} style={abs({ left: 630 - b.c * 190 - (b.r % 2) * 90, top: b.r * 110, width: 180, height: 100, borderRadius: 6, background: `linear-gradient(${BRAND.mark}, ${BRAND.navyDeep})`, boxShadow: "inset 0 -8px 0 rgba(0,0,0,.25)", display: "grid", placeItems: "center", fontFamily: kufiF, fontSize: 36, color: BRAND.card, visibility: kb > 0 && t < until ? "visible" : "hidden", transform: `scale(${0.6 + 0.4 * back(kb)}) translate(${f * (rnd1(b.i + 9) - 0.3) * 300}px,${f * f * 900}px) rotate(${f * (rnd1(b.i + 3) - 0.5) * 400}deg)` })}>{b.txt}</div>; })}
      <div style={abs({ left: -330 + 520 * ease(m), top: 170, width: 300, height: 120, borderRadius: 14, background: BRAND.green, display: "grid", placeItems: "center", fontFamily: kufiF, fontSize: 52, color: "#fff", boxShadow: "0 16px 40px rgba(0,0,0,.5)", visibility: m > 0 && t < until ? "visible" : "hidden" })}>{ram}</div>
    </div>
  );
};

/** 15 · دعوى بلا برهان (redesigned on the user's note «فكرة جميلة لكن الشكل فاسد»): their claim quoted on top; under it the evidence box stays empty
 *  while a lens searches it, then «لا يوجد» inside the box and the stamp under it */
export const NoProof: React.FC<Base & { w?: number; claim: string; claimAt?: number; searchAt: number; verdictAt: number; box?: string; empty?: string; stamp?: string }> = ({ at, until, x, y, w = 920, claim, claimAt, searchAt, verdictAt, box = "الدليل", empty = "لا يوجد", stamp = "دعوى بلا برهان" }) => {
  const { t, k } = useK(); const s = clamp((t - searchAt) / Math.max(0.6, verdictAt - searchAt)), v = k(verdictAt, 0.35, until), st = k(verdictAt + 0.5, 0.3, until);
  const lx = w * 0.5 + Math.sin(s * Math.PI * 3) * w * 0.28, ly = 330 + Math.cos(s * Math.PI * 2) * 50;
  return (
    <div style={abs({ left: x, top: y, width: w })}>
      <div style={abs({ left: 0, width: w, top: 0, padding: "26px 40px", borderRadius: 16, background: BRAND.navy, borderRight: `12px solid ${BRAND.mark}`, fontFamily: naskhF, fontSize: 56, lineHeight: 1.5, color: BRAND.card, textAlign: "center", ...wipe(ease(k(claimAt ?? at, 0.5, until))) })}>«{claim}»</div>
      <div style={abs({ left: w * 0.12, width: w * 0.76, top: 220, height: 240, borderRadius: 16, border: `6px dashed ${BRAND.light}`, ...pop(k(searchAt - 0.3, 0.35, until), 0.7) })}>
        <div style={abs({ right: 24, top: -30, padding: "2px 18px", background: BRAND.base3, fontFamily: kufiF, fontSize: 38, color: BRAND.light })}>{box}</div>
        <div style={abs({ inset: 0, display: "grid", placeItems: "center", fontFamily: kufiF, fontSize: 70, color: BRAND.mark, ...pop(v, 0.3) })}>{empty}</div>
      </div>
      {s > 0 && s < 1 && t < until ? <div style={abs({ left: lx - 60, top: ly - 60, width: 120, height: 120, borderRadius: "50%", border: `12px solid ${BRAND.card}`, background: "rgba(255,255,255,.12)" })}><div style={abs({ left: 92, top: 92, width: 22, height: 70, borderRadius: 10, background: BRAND.card, transform: "rotate(-45deg)" })} /></div> : null}
      <div style={abs({ left: 0, width: w, top: 500, textAlign: "center" })}><span style={{ display: "inline-block", padding: "10px 40px", border: `8px solid ${BRAND.mark}`, borderRadius: 14, fontFamily: kufiF, fontSize: 60, color: BRAND.mark, visibility: st > 0 ? "visible" : "hidden", transform: `rotate(-6deg) scale(${2.2 - 1.2 * ease(st)})` }}>{stamp}</span></div>
    </div>
  );
};

/** 16 · السند المنقطع — the chain from the compiler down; the link after `breakAfter` breaks red, the reason beside it */
export const BrokenIsnad: React.FC<Base & { names: { name: string; at: number }[]; breakAfter: number; breakAt: number; reason: string }> = ({ until, x, y, names, breakAfter, breakAt, reason }) => {
  const { t, k } = useK(); const step = Math.min(165, 820 / names.length), b = t > breakAt, gapH = step - 100;
  return (
    <div style={abs({ left: x, top: y })}>
      {names.slice(1).map((_, i) => { const kl = ease(k(names[i + 1].at - 0.2, 0.3, until)), br = i === breakAfter && b;
        return <div key={i} style={abs({ left: 220, top: i * step + 100, width: 20, height: gapH * kl, background: br ? BRAND.mark : BRAND.light, transform: br ? `scaleY(${t > breakAt + 0.2 ? 0.3 : 1}) translateX(${Math.sin(t * 40) * 4 * clamp(breakAt + 0.4 - t)}px)` : "none" })} />; })}
      {names.map((n, i) => <div key={i} style={abs({ left: 0, top: i * step, width: 460, height: 100, borderRadius: 50, background: BRAND.card, display: "grid", placeItems: "center", fontFamily: kufiF, fontSize: 42, color: BRAND.ink, boxShadow: "0 10px 26px rgba(0,0,0,.4)", ...pop(k(n.at, 0.35, until), 0.5) })}>{n.name}</div>)}
      <div style={abs({ left: 150, top: breakAfter * step + 100 + gapH / 2 - 50, width: 160, textAlign: "center", fontFamily: kufiF, fontSize: 80, color: BRAND.mark, ...pop(k(breakAt + 0.1, 0.3, until), 0.2) })}>✕</div>
      <div style={abs({ left: 480, top: breakAfter * step + 100 + gapH / 2 - 30, width: "auto", maxWidth: 440, padding: "8px 20px", borderRadius: 10, background: BRAND.mark, fontFamily: kufiF, fontSize: 38, lineHeight: 1.4, color: "#fff", ...wipe(ease(k(breakAt + 0.4, 0.4, until))) })}>{reason}</div>
    </div>
  );
};

/** 17 · سُلّم درجة الحديث — the grades from «صحيح» to «موضوع»; a pointer comes down to this narration's grade (index) and lights it */
export const GradeLadder: React.FC<Base & { grade: number; pointerAt: number; grades?: string[] }> = ({ at, until, x, y, grade, pointerAt, grades = ["صحيح", "حسن", "ضعيف", "ضعيف جداً", "موضوع"] }) => {
  const { t, k } = useK(); const cols = [BRAND.green, BRAND.blue, BRAND.accent, BRAND.mark, BRAND.navyDeep], u = ease(clamp((t - pointerAt) / 1.2)), on = t > pointerAt + 1.2;
  return (
    <div style={abs({ left: x, top: y })}>
      {grades.map((g, i) => <div key={i} style={abs({ left: 180, top: i * 140, width: 560, height: 110, borderRadius: 12, background: "rgba(255,255,255,.08)", borderRight: `16px solid ${cols[i % 5]}`, display: "flex", alignItems: "center", paddingRight: 40, fontFamily: kufiF, fontSize: 54, color: BRAND.card, boxShadow: on && i === grade ? `0 0 40px ${cols[i % 5]}` : "none", transform: on && i === grade ? "scale(1.06)" : "none", ...wipe(ease(k(at + i * 0.1, 0.35, until))) })}>{g}</div>)}
      <div style={abs({ left: 20, top: grade * 140 * u, width: 140, height: 110, display: "grid", placeItems: "center", fontFamily: kufiF, fontSize: 90, color: BRAND.accent, visibility: t > pointerAt && t < until ? "visible" : "hidden" })}>◀</div>
    </div>
  );
};

/** 18 · الفجوة بين تاريخين — two dates on a line, an arc rises between them and counts the years (a narrator who did not meet the one he narrates from) */
export const YearsGap: React.FC<Base & { a: { label: string; year: number }; b: { label: string; year: number }; arcAt: number; unit?: string; suffix?: string }> = ({ at, until, x, y, a, b, arcAt, unit = "سنة", suffix = "بينهما" }) => {
  const { t, k } = useK(); const d = Math.abs(b.year - a.year), u = ease(clamp((t - arcAt) / 1.2)) * clamp((until - t) / 0.35), lk = ease(k(at, 0.5, until));
  return (
    <div style={abs({ left: x, top: y, width: 940 })}>
      <svg width={940} height={500} style={{ position: "absolute", overflow: "visible" }}>
        <path d="M0 400 H900" stroke={BRAND.light} strokeWidth={6} fill="none" style={dash(900, lk)} />
        <path d="M770 400 C770 90 130 90 130 400" fill="none" stroke={BRAND.accent} strokeWidth={8} style={dash(1250, u)} />
        <circle cx={770} cy={400} r={20} fill={BRAND.green} visibility={k(at + 0.4, 0.3, until) > 0 ? "visible" : "hidden"} />
        <circle cx={130} cy={400} r={20} fill={BRAND.mark} visibility={k(at + 0.8, 0.3, until) > 0 ? "visible" : "hidden"} />
      </svg>
      <div style={abs({ left: 610, top: 440, width: 320, textAlign: "center", fontFamily: kufiF, fontSize: 38, lineHeight: 1.5, color: BRAND.card, ...wipe(ease(k(at + 0.4, 0.4, until))) })}>{a.label}<br />{arDigits(a.year)} هـ</div>
      <div style={abs({ left: -30, top: 440, width: 320, textAlign: "center", fontFamily: kufiF, fontSize: 38, lineHeight: 1.5, color: BRAND.card, ...wipe(ease(k(at + 0.8, 0.4, until))) })}>{b.label}<br />{arDigits(b.year)} هـ</div>
      <div style={abs({ left: 150, width: 600, top: -40, textAlign: "center", fontFamily: kufiF, fontSize: 72, color: BRAND.accent, visibility: u > 0 ? "visible" : "hidden" })}>{arDigits(Math.round(d * u))} {unit} {suffix}</div>
    </div>
  );
};

/** 19 · أعمار الأئمة المتقاطعة — life bars on the Hijri axis (birth → death); the shared years of two of them are framed: who met whom */
export const Lifespans: React.FC<Base & { people: { name: string; from: number; to: number; at: number }[]; overlap?: [number, number]; overlapAt?: number; label?: string; labelAt?: number }> = ({ at, until, x, y, people, overlap, overlapAt, label, labelAt }) => {
  const { k } = useK(); const Y0 = Math.floor(Math.min(...people.map((p) => p.from)) / 50) * 50, Y1 = Math.ceil(Math.max(...people.map((p) => p.to)) / 50) * 50, X = (v: number) => 900 - ((v - Y0) / Math.max(1, Y1 - Y0)) * 880;
  const ticks: number[] = []; for (let v = Y0; v <= Y1; v += 50) ticks.push(v);
  const cols = [BRAND.blue, BRAND.accent, BRAND.green, BRAND.light], ka = ease(k(at, 0.5, until));
  const ov = overlap ? [Math.max(people[overlap[0]].from, people[overlap[1]].from), Math.min(people[overlap[0]].to, people[overlap[1]].to)] : null;
  return (
    <div style={abs({ left: x, top: y, width: 940 })}>
      {label ? <div style={abs({ left: 0, width: 920, top: 0, textAlign: "center", fontFamily: kufiF, fontSize: 46, color: BRAND.card, ...wipe(ease(k(labelAt ?? at + 2.5, 0.5, until))) })}>{label}</div> : null}
      {people.map((p, i) => <div key={i} style={abs({ left: X(p.to), top: 110 + i * 150, width: X(p.from) - X(p.to), height: 100, borderRadius: 12, background: cols[i % 4], display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 22px", fontFamily: kufiF, fontSize: 38, color: BRAND.ink, overflow: "hidden", whiteSpace: "nowrap", ...wipe(ease(k(p.at, 0.6, until))) })}><span>{p.name}</span><span style={{ fontSize: 28 }}>{arDigits(p.from)}–{arDigits(p.to)}</span></div>)}
      {ov && overlap && ov[1] > ov[0] ? <div style={abs({ left: X(ov[1]), top: 110 + Math.min(...overlap) * 150 - 14, width: X(ov[0]) - X(ov[1]), height: (Math.abs(overlap[1] - overlap[0]) + 1) * 150 - 22, border: `5px dashed ${BRAND.card}`, borderRadius: 12, ...pop(k(overlapAt ?? at + 2, 0.4, until), 0.8) })} /> : null}
      <div style={abs({ left: 0, top: 110 + people.length * 150, width: 920, height: 4, background: BRAND.light, ...wipe(ka) })} />
      {ticks.map((v) => <div key={v} style={abs({ left: X(v) - 60, top: 130 + people.length * 150, width: 120, textAlign: "center", fontFamily: kufiF, fontSize: 28, color: BRAND.light, ...wipe(ka) })}>{arDigits(v)} هـ</div>)}
    </div>
  );
};

/** 20 · مفترق الطريقين — the road splits in two, a sign on each, and a light walks the chosen one */
export const Crossroads: React.FC<Base & { right: string; left: string; signsAt: number; go?: "right" | "left"; goAt?: number; rightGood?: boolean }> = ({ at, until, x, y, right, left, signsAt, go = "right", goAt, rightGood = true }) => {
  const { t, k } = useK();
  const bz = (q: number, a: number, b2: number, c: number, d: number) => (1 - q) ** 3 * a + 3 * (1 - q) ** 2 * q * b2 + 3 * (1 - q) * q * q * c + q ** 3 * d;
  const pt = (u: number): [number, number] => { if (u < 0.4) return [450, 760 - 300 * (u / 0.4)]; const v = (u - 0.4) / 0.6, s = go === "right" ? 1 : -1; return [450 + s * bz(v, 0, 0, 260, 300), bz(v, 460, 310, 280, 90)]; };
  const g = clamp((t - (goAt ?? signsAt + 0.8)) / 1.6), [dx, dy] = pt(g);
  const sign = (txt: string, good: boolean, lx: number, kk: number) => <div style={abs({ left: lx, top: 0, width: 280, padding: 14, textAlign: "center", borderRadius: 10, background: good ? BRAND.green : BRAND.mark, fontFamily: kufiF, fontSize: 40, color: "#fff", ...pop(kk, 0.3) })}>{txt}</div>;
  return (
    <div style={abs({ left: x, top: y, width: 900 })}>
      <svg width={900} height={800} style={{ position: "absolute", overflow: "visible" }} fill="none" stroke={BRAND.light} strokeOpacity={0.55} strokeWidth={70} strokeLinecap="round">
        <path d="M450 760 V460" style={dash(300, ease(k(at, 0.5, until)))} />
        <path d="M450 460 C450 310 710 280 750 90" style={dash(520, ease(k(at + 0.5, 0.5, until)))} />
        <path d="M450 460 C450 310 190 280 150 90" style={dash(520, ease(k(at + 0.5, 0.5, until)))} />
      </svg>
      {sign(right, rightGood, 610, k(signsAt, 0.3, until))}{sign(left, !rightGood, 10, k(signsAt + 0.2, 0.3, until))}
      {g > 0 && t < until ? <div style={abs({ left: dx - 20, top: dy - 20, width: 40, height: 40, borderRadius: "50%", background: BRAND.card, boxShadow: `0 0 30px ${BRAND.accent}` })} /> : null}
    </div>
  );
};

/** 21 · إطار التنبيه — red corners close in on the WHOLE frame and pulse, a «تنبيه مهم» bar drops at the top: before a grave warning (full frame: he is not slid) */
export const AlertFrame: React.FC<{ at: number; until: number; text?: string; barAt?: number; W?: number; H?: number }> = ({ at, until, text = "تنبيه مهم", barAt, W = 1920, H = 1080 }) => {
  const { t, k } = useK(); const kk = ease(k(at, 0.4, until)), pulse = 1 + 0.04 * Math.sin(t * 9), RED = "#c0453a", kb = ease(k(barAt ?? at + 0.4, 0.4, until));
  const corner = (sx: boolean, sy: boolean) => {
    const css: React.CSSProperties = { width: 180, height: 180, visibility: kk > 0 ? "visible" : "hidden", transform: `translate(${(sx ? 1 : -1) * (1 - kk) * 200}px,${(sy ? 1 : -1) * (1 - kk) * 200}px) scale(${pulse})` };
    if (sx) { css.right = 40; css.borderRight = `16px solid ${RED}`; } else { css.left = 40; css.borderLeft = `16px solid ${RED}`; }
    if (sy) { css.bottom = 40; css.borderBottom = `16px solid ${RED}`; } else { css.top = 40; css.borderTop = `16px solid ${RED}`; }
    return <div style={abs(css)} />;
  };
  return (
    <div style={abs({ left: 0, top: 0, width: W, height: H, pointerEvents: "none" })}>
      {corner(false, false)}{corner(true, false)}{corner(false, true)}{corner(true, true)}
      <div style={abs({ left: W / 2 - 300, top: 40, width: 600, padding: 16, textAlign: "center", borderRadius: "0 0 18px 18px", background: RED, fontFamily: kufiF, fontSize: 52, color: "#fff", visibility: kb > 0 ? "visible" : "hidden", transform: `translateY(${(1 - kb) * -160}px)` })}>⚠ {text}</div>
    </div>
  );
};

/* ───────── round 3 picks (user 2026-11-14) ───────── */

/** 22 · خطّان لا يلتقيان — two parallel lines with a name each; an arrow tries to join them and bounces back: what never meets (التوحيد والشرك) */
export const NeverMeet: React.FC<Base & { a: string; b: string; joinAt: number; label?: string; labelAt?: number; aGood?: boolean }> = ({ at, until, x, y, a, b, joinAt, label = "لا يجتمعان", labelAt, aGood = true }) => {
  const { t, k } = useK(); const s = clamp((t - joinAt) / 1), ca = aGood ? BRAND.green : BRAND.mark, cb = aGood ? BRAND.mark : BRAND.green;
  return (
    <div style={abs({ left: x, top: y, width: 900 })}>
      <div style={abs({ left: 0, width: 900, top: -30, textAlign: "center", fontFamily: kufiF, fontSize: 56, color: BRAND.card, ...wipe(ease(k(at + 0.4, 0.4, until))) })}>{a}</div>
      <div style={abs({ left: 0, top: 80, width: 900, height: 14, borderRadius: 7, background: ca, ...wipe(ease(k(at, 0.7, until))) })} />
      <div style={abs({ left: 0, top: 320, width: 900, height: 14, borderRadius: 7, background: cb, ...wipe(ease(k(at + 0.2, 0.7, until))) })} />
      <div style={abs({ left: 0, width: 900, top: 360, textAlign: "center", fontFamily: kufiF, fontSize: 56, color: BRAND.card, ...wipe(ease(k(at + 0.6, 0.4, until))) })}>{b}</div>
      <div style={abs({ left: 420, top: 110, width: 60, height: 190, display: "grid", placeItems: "center", fontFamily: kufiF, fontSize: 110, color: BRAND.card, visibility: s > 0 && t < until ? "visible" : "hidden", transform: `scaleY(${1 - 0.5 * Math.abs(Math.sin(s * Math.PI * 3)) * (1 - s)})` })}>⇕</div>
      <div style={abs({ left: 0, width: 900, top: 470, textAlign: "center", fontFamily: kufiF, fontSize: 46, color: BRAND.card, ...wipe(ease(k(labelAt ?? joinAt + 1, 0.4, until))) })}>{label}</div>
    </div>
  );
};

/** 23 · الخط الزمني الصاعد — a vertical timeline rising; each event (date + title) passes the centre mark and is enlarged while it is the current one */
export const RisingTimeline: React.FC<Base & { events: { date: string; title: string; at: number }[]; h?: number }> = ({ at, until, x, y, events, h = 840 }) => {
  const { t, k } = useK(); const step = 220, mid = h * 0.45;
  // the rail scrolls so the event being spoken sits at the centre mark
  const idx = events.reduce((n, e, i) => (t >= e.at ? i : n), 0), prev = events[Math.max(0, idx)], nxt = events[idx + 1];
  const f = nxt ? ease(clamp((t - (nxt.at - 0.5)) / 0.5)) : 0, off = (idx + f) * step;
  return (
    <div style={abs({ left: x, top: y, width: 1000, height: h, overflow: "hidden", ...wipe(ease(k(at, 0.4, until))) })}>
      <div style={abs({ left: 476, top: 0, width: 8, height: h, background: BRAND.light })} />
      {events.map((e, i) => { const ty = mid + i * step - off, cur = i === idx && t >= e.at, kk = k(e.at - 0.6, 0.35, until);
        return <div key={i} style={abs({ left: 0, top: ty - 60, width: 1000, height: 120, transform: cur ? "scale(1.08)" : "none", transformOrigin: "480px 60px", visibility: kk > 0 ? "visible" : "hidden" })}>
          <div style={abs({ left: 460, top: 40, width: 40, height: 40, borderRadius: "50%", background: cur ? BRAND.card : BRAND.light, boxShadow: cur ? `0 0 20px ${BRAND.card}` : "none" })} />
          <div style={abs({ left: 540, top: 30, fontFamily: kufiF, fontSize: 50, color: BRAND.light, whiteSpace: "nowrap" })}>{e.date}</div>
          <div style={abs({ right: 560, top: 30, fontFamily: kufiF, fontSize: 48, color: BRAND.card, whiteSpace: "nowrap" })}>{e.title}</div>
        </div>; })}
      {prev ? null : null}
    </div>
  );
};

/** 24 · الدقيقة في المقطع — OPENING TEASER (user note: «اضفه في أول الفيديو كتشويق، لموضوع في آخره»): a player bar whose knob runs to the minute where the
 *  topic comes later in THIS video, a thumbnail of that moment pops above it with the time, and the teaser line under the bar */
export const MinuteTeaser: React.FC<Base & { w?: number; img?: string; time: string; frac: number; text: string; textAt?: number; thumbAt?: number }> = ({ at, until, x, y, w = 820, img, time, frac, text, textAt, thumbAt }) => {
  const { t, k } = useK(); const u = ease(clamp((t - at - 0.5) / 1.4)) * frac, kx = w - u * w, kt = k(thumbAt ?? at + 2, 0.35, until);
  return (
    <div style={abs({ left: x, top: y, width: w })}>
      <div style={abs({ left: 0, top: 0, width: w, height: 460, borderRadius: 14, background: "#0b0d10", overflow: "hidden", ...pop(k(at, 0.4, until), 0.9) })}>
        {img ? <Pic src={img} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(.55)" }} /> : null}
        <div style={abs({ inset: 0, display: "grid", placeItems: "center", fontFamily: kufiF, fontSize: 120, color: "rgba(255,255,255,.8)" })}>▶</div>
      </div>
      <div style={abs({ left: 0, top: 490, width: w, height: 12, borderRadius: 6, background: "rgba(255,255,255,.25)", ...wipe(ease(k(at + 0.2, 0.4, until))) })}>
        <div style={abs({ right: 0, top: 0, bottom: 0, width: u * w, borderRadius: 6, background: BRAND.mark })} />
      </div>
      <div style={abs({ left: kx - 16, top: 480, width: 32, height: 32, borderRadius: "50%", background: BRAND.mark, boxShadow: "0 0 0 6px rgba(192,69,58,.3)", visibility: t > at + 0.5 && t < until ? "visible" : "hidden" })} />
      <div style={abs({ left: Math.max(0, Math.min(w - 280, kx - 140)), top: 200, width: 280, padding: 8, borderRadius: 10, background: BRAND.card, textAlign: "center", fontFamily: kufiF, fontSize: 40, color: BRAND.ink, boxShadow: "0 16px 40px rgba(0,0,0,.5)", ...pop(kt, 0.3) })}>
        <div style={{ height: 130, borderRadius: 6, overflow: "hidden", background: BRAND.navy, marginBottom: 6 }}>{img ? <Pic src={img} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}</div>{time}
      </div>
      <div style={abs({ left: 0, width: w, top: 540, textAlign: "center", fontFamily: kufiF, fontSize: 48, lineHeight: 1.4, color: BRAND.card, ...wipe(ease(k(textAt ?? at + 2.4, 0.5, until))) })}>{text}</div>
    </div>
  );
};

/** 25 · الصورة في الزاوية — the source fills the screen while HE shrinks into a framed window in the top-right corner (the engine scales his footage:
 *  LandFootage `pips`); this draws the source around the window hole and the window's white frame. Landscape only. */
export const PIP = { s: 0.3, m: 40, W: 1920, H: 1080 };
export const pipK = (t: number, at: number, until: number) => ease(Math.min(clamp((t - at) / 0.7), clamp((until - t) / 0.6)));
export const PipSource: React.FC<{ at: number; until: number; src?: string; title?: string; fit?: "contain" | "cover" }> = ({ at, until, src, title, fit = "contain" }) => {
  const { t } = useK(); const u = pipK(t, at, until); if (u <= 0) return null;
  const sc = 1 - (1 - PIP.s) * u, w = PIP.W * sc, h = PIP.H * sc, x0 = PIP.W - PIP.m * u - w, y0 = PIP.m * u;
  const hole = `polygon(evenodd, 0 0, ${PIP.W}px 0, ${PIP.W}px ${PIP.H}px, 0 ${PIP.H}px, 0 0, ${x0}px ${y0}px, ${x0}px ${y0 + h}px, ${x0 + w}px ${y0 + h}px, ${x0 + w}px ${y0}px, ${x0}px ${y0}px)`;
  return (
    <div style={abs({ left: 0, top: 0, width: PIP.W, height: PIP.H })}>
      <div style={abs({ inset: 0, clipPath: hole, background: `radial-gradient(ellipse at 40% 50%, ${BRAND.base2}, ${BRAND.base3})` })}>
        {src ? <Pic src={src} style={{ position: "absolute", left: 80, top: 80, width: PIP.W * 0.62, height: PIP.H - 160, objectFit: fit }} /> : null}
        {title ? <div style={abs({ left: 80, width: PIP.W * 0.62, top: src ? PIP.H - 150 : PIP.H / 2 - 60, textAlign: "center", fontFamily: naskhF, fontSize: src ? 56 : 110, color: BRAND.accent })}>{title}</div> : null}
      </div>
      <div style={abs({ left: x0 - 12, top: y0 - 12, width: w + 24, height: h + 24, border: "12px solid #fff", borderRadius: 18 * u, boxShadow: "0 20px 60px rgba(0,0,0,.6)", pointerEvents: "none" })} />
    </div>
  );
};

export const PICK_KIT = { InkQuote, BigQuestion, ChatThread, StickyNotes, FlapBoard, SearchBar, MythFact, RingStat, LineGrowth, DecisionFlow, MindMap, ViciousCycle, Footnote, ClaimWall, NoProof, BrokenIsnad, GradeLadder, YearsGap, Lifespans, Crossroads, AlertFrame, NeverMeet, RisingTimeline, MinuteTeaser, PipSource } as const;
export type PickName = keyof typeof PICK_KIT;
/** drawn over the whole frame: he is NOT slid right and no panel is blended behind it */
export const PICK_FULL_FRAME = new Set<string>(["AlertFrame", "PipSource"]);
