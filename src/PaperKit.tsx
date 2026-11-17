import React from "react";
import { AbsoluteFill, random, useCurrentFrame, useVideoConfig } from "remotion";
import { noise2D } from "@remotion/noise";
import { kufiF, zainF } from "./MG";
import { Pic } from "./EuKit";
import { BRAND } from "./brand";

/**
 * Paper shapes for the talk montages (user 2026-10-29: «زيادة في عمل الأشكال الورقية واستخدامها في الفيديوهات»).
 * One paper language: stop-motion (the picture holds 3 frames), hand-torn edges (seeded, never two alike), tape in the identity's light tone, a soft drop shadow,
 * and a small organic wobble from @remotion/noise while a piece rests. Paper stock is the palette's card/paper tones, ink is BRAND.ink, marks BRAND.mark,
 * so every piece follows the video's palette (spec field `brand`). Times are seconds on the composition.
 */
const FPS = 30;
const clamp = (x: number) => Math.max(0, Math.min(1, x));
const easeOut = (u: number) => 1 - Math.pow(1 - clamp(u), 3);
/** stop-motion clock: seconds, quantised to 3-frame holds */
const useStep = () => Math.floor(useCurrentFrame() / 3) * 3 / FPS;
const shadow = "drop-shadow(0 10px 14px rgba(20,14,6,.38))";

/** a hand-torn outline as a clip-path polygon (px): every edge jagged by `amp`, seeded so the same piece keeps its shape */
export const tornClip = (w: number, h: number, seed: string, amp = 7, step = 22) => {
  const pts: string[] = [];
  const j = (k: string) => (random(seed + k) - 0.5) * 2 * amp;
  for (let x = 0; x <= w; x += step) pts.push(`${x}px ${Math.max(0, amp + j("t" + x))}px`);
  for (let y = 0; y <= h; y += step) pts.push(`${w - Math.max(0, amp + j("r" + y))}px ${y}px`);
  for (let x = w; x >= 0; x -= step) pts.push(`${x}px ${h - Math.max(0, amp + j("b" + x))}px`);
  for (let y = h; y >= 0; y -= step) pts.push(`${Math.max(0, amp + j("l" + y))}px ${y}px`);
  return `polygon(${pts.join(",")})`;
};
/** stop-motion arrival from a side + organic rest wobble; null before `at` and after `until` (+0.3 s) */
const useArrive = (at: number, until: number | undefined, seed: string, from: "left" | "right" | "top" | "bottom" = "right", rot = 0) => {
  const t = useStep(), f = useCurrentFrame();
  if (t < at || (until !== undefined && t > until + 0.3)) return null;
  const inn = easeOut((t - at) / 0.4), out = until === undefined ? 0 : easeOut((t - until) / 0.3);
  const d = 900 * (1 - inn) + 900 * out, sx = from === "left" ? -1 : from === "right" ? 1 : 0, sy = from === "top" ? -1 : from === "bottom" ? 1 : 0;
  const wob = noise2D(seed, f / 90, 0) * 0.6;
  return { transform: `translate(${sx * d}px, ${sy * d}px) rotate(${rot + wob + (1 - inn) * 6 * (sx || sy)}deg)` } as React.CSSProperties;
};
/** a strip of tape */
export const Tape: React.FC<{ x: number; y: number; w?: number; rot?: number }> = ({ x, y, w = 120, rot = -8 }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, height: 34, background: BRAND.paper, opacity: 0.82, transform: `rotate(${rot}deg)`, boxShadow: "0 2px 4px rgba(0,0,0,.18)", clipPath: "polygon(3% 0,97% 4%,100% 50%,97% 100%,2% 96%,0 50%)" }} />
);

/** a newspaper clipping of a real news screenshot: torn edges, the headline above in ink, the source under it, taped on two corners */
export const NewsClip: React.FC<{ at: number; until?: number; x: number; y: number; w: number; h: number; src: string; headline?: string; source: string; rot?: number }> = ({ at, until, x, y, w, h, src, headline, source, rot = -2 }) => {
  const s = useArrive(at, until, "nc" + src, "left", rot);
  if (!s) return null;
  const head = headline ? 108 : 0, foot = 64, H = h + head + foot;   // wider paper margins around the headline, picture and credit (user 2026-10-30: «كبر الهوامش»)
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: H, filter: shadow, ...s }}>
      <div style={{ position: "absolute", inset: 0, background: BRAND.card, clipPath: tornClip(w, H, "nc" + src, 8), direction: "rtl" }}>
        {headline ? <div style={{ position: "absolute", left: 44, right: 44, top: 32, fontFamily: kufiF, fontSize: 34, color: BRAND.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", borderBottom: `3px double ${BRAND.ink}`, paddingBottom: 8 }}>{headline}</div> : null}
        <div style={{ position: "absolute", left: 40, right: 40, top: head + 14, height: h - 14, overflow: "hidden" }}><Pic src={src} style={{ width: "100%", height: "100%", objectFit: "contain", filter: "grayscale(.25) contrast(1.05)" }} />   {/* (user 2026-11-17, frame 4545: «صور الأخبار يجب أن تظهر صفحة كاملة») the whole page, never cropped */}</div>
        <div style={{ position: "absolute", left: 44, right: 44, bottom: 22, fontFamily: "Almarai", fontWeight: 800, fontSize: 20, color: BRAND.gray }}>المصدر: {source}</div>
      </div>
      <Tape x={-30} y={-6} rot={-28} /><Tape x={w - 90} y={H - 30} rot={-24} />
    </div>
  );
};

/** a torn note for the key phrase: cream paper strip with ragged ends, the phrase in Zain, one word underlined by hand in BRAND.mark */
export const TornNote: React.FC<{ at: number; until?: number; x: number; y: number; w: number; text: string; size?: number; underline?: number; rot?: number }> = ({ at, until, x, y, w, text, size = 72, underline, rot = 1.5 }) => {
  const s = useArrive(at, until, "tn" + text, "bottom", rot), t = useStep();
  if (!s) return null;
  // the note grows with its text: a phrase longer than one line gets one more line of height per wrap (user 2026-10-30: «العبارة غير ظاهرة لأن صندوقها أصغر منها»)
  // + a bigger white base again (side ×1.8, height ×3.2: user 2026-10-31 «كبّر القاعدة البيضاء قليلاً لإضافة هوامش للخط»)
  // + a white side margin of one text height on each side PLUS the ragged ends' depth (tornClip amp 12 → up to 24 px), so the letters never reach the tear
  //   (user 2026-10-30: «لا يوجد هامش للخط»، «لابد من هامش ابيض قبل التعرج»)
  const pad = Math.round(size * 1.8), lines = Math.max(1, Math.ceil(text.replace(/[ً-ٰٟۖ-ۭ]/g, "").length / Math.max(1, Math.floor((w - 2 * pad) / (size * 0.52))))), h = Math.round(size * 3.2 + (lines - 1) * size * 1.2), u = easeOut((t - at - 0.5) / 0.4);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, filter: shadow, ...s }}>
      <div style={{ position: "absolute", inset: 0, background: BRAND.card, clipPath: tornClip(w, h, "tn" + text, 12, 18), display: "flex", alignItems: "center", justifyContent: "center", direction: "rtl", padding: `0 ${pad}px`, boxSizing: "border-box" }}>
        <span style={{ fontFamily: zainF, fontSize: size, color: BRAND.ink, lineHeight: 1, textAlign: "center" }}>
          {text.split(" ").map((wd, i) => <span key={i} style={i === underline ? { backgroundImage: `linear-gradient(${BRAND.mark},${BRAND.mark})`, backgroundSize: `${u * 100}% 7px`, backgroundPosition: "right bottom", backgroundRepeat: "no-repeat", paddingBottom: 6 } : undefined}>{wd} </span>)}
        </span>
      </div>
      <Tape x={w / 2 - 60} y={-16} rot={3} />
    </div>
  );
};

/** a title made of torn paper scraps, one word per scrap (Arabic letters keep their joins), each arriving in stop-motion with its own tilt and stock */
/** without x it is centred across the width (user 2026-10-29); without y too it sits in the writing area: the third quarter of the height */
export const WordScraps: React.FC<{ at: number; until?: number; x?: number; y?: number; text: string; size?: number; gap?: number; times?: number[] }> = ({ at, until, x, y, text, size = 50, gap = 0.18, times }) => {
  const ta = (i: number) => times?.[i] ?? at + i * gap;   // each scrap is written the moment its word is spoken (user 2026-11-06)
  const t = useStep(), f = useCurrentFrame(), { width, height } = useVideoConfig();
  const place: React.CSSProperties = x === undefined ? { left: 0, top: y ?? height * 0.5, width, ...(y === undefined ? { height: height * 0.25 } : {}), justifyContent: "center", boxSizing: "border-box", padding: `0 ${Math.round(width * 0.05)}px` } : { left: x, top: y ?? height * 0.5 };
  if (t < at || (until !== undefined && t > until + 0.3)) return null;
  // at most 4 scraps at once: the first goes when a fifth arrives (user 2026-11-05)
  const shown = text.split(" ").map((wd, i, all) => ({ wd, i, gone: i + 4 < all.length ? ta(i + 4) : Infinity })).filter(({ i, gone }) => t >= ta(i) && t < gone);
  const cur = shown.length ? shown[shown.length - 1].i : -1;   // the word being spoken now = the newest scrap
  return (
    <div style={{ position: "absolute", display: "flex", flexDirection: "row-reverse", flexWrap: "wrap", gap: size * 0.3, alignItems: "center", ...place }}>
      {shown.map(({ wd, i }) => {
        const a = ta(i), inn = easeOut((t - a) / 0.25), out = until === undefined ? 0 : easeOut((t - until) / 0.3);
        const dark = i === cur, bg = dark ? BRAND.accent : "#ffffff";   // every scrap white, the current word in the video's palette colour (user 2026-11-08)
        const rot = (random("wr" + wd + i) - 0.5) * 10 + noise2D("ws" + i, f / 80, 0) * 0.8;
        const w = Math.round(size * 0.8 * wd.length + 100), h = Math.round(size * 1.8);   // paper taller and wider so the writing never touches the torn edges (user 2026-11-06)
        return (
          <span key={i} style={{ position: "relative", width: w, height: h, transform: `scale(${0.6 + 0.4 * inn}) rotate(${rot}deg) translateY(${out * 600}px)`, opacity: Math.min(1, inn * 2), filter: shadow, display: "inline-block" }}>
            <span style={{ position: "absolute", inset: 0, background: bg, clipPath: tornClip(w, h, "ws" + wd + i, 6, 16), display: "flex", alignItems: "center", justifyContent: "center", fontFamily: zainF, fontSize: size, color: dark ? BRAND.onAccent : BRAND.ink, direction: "rtl" }}>{wd}</span>
          </span>
        );
      })}
    </div>
  );
};

/** a photo of the person or place in a torn white border with tape and a hand-written-style name strip */
export const TornPhoto: React.FC<{ at: number; until?: number; x: number; y: number; w: number; h: number; src: string; name?: string; pos?: string; rot?: number }> = ({ at, until, x, y, w, h, src, name, pos = "50% 25%", rot = 2.5 }) => {
  // no sliding across the frame (user 2026-10-31): it pops up in place from small and leaves the same way (shrinks back), never travelling over his face
  const t = useStep(), f = useCurrentFrame();
  if (t < at || (until !== undefined && t > until + 0.3)) return null;
  const grow = easeOut((t - at) / 0.4) * (until === undefined ? 1 : 1 - easeOut((t - until) / 0.3));
  const s = { transform: `scale(${0.15 + 0.85 * grow}) rotate(${rot + noise2D("tp" + src, f / 90, 0) * 0.6}deg)`, transformOrigin: "50% 50%", opacity: Math.min(1, grow * 2.5) } as React.CSSProperties;
  // the name strip grows with its lines so the text always sits in the white strip below the picture, never over it (user 2026-11-08)
  const nameLines = name ? Math.max(1, Math.ceil([...name].length * 28 * 0.55 / (w - 24))) : 0;
  const H = h + (name ? Math.max(70, nameLines * 36 + 34) : 28);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: H, filter: shadow, ...s }}>
      <div style={{ position: "absolute", inset: 0, background: BRAND.card, clipPath: tornClip(w, H, "tp" + src, 9, 18) }}>
        <div style={{ position: "absolute", left: 20, right: 20, top: 20, height: h - 20, overflow: "hidden" }}><Pic src={src} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: pos }} /></div>
        {name ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 12, padding: "0 12px", lineHeight: "36px", textAlign: "center", fontFamily: kufiF, fontSize: 28, color: BRAND.ink, direction: "rtl" }}>{name}</div> : null}
      </div>
      <Tape x={w / 2 - 60} y={-14} rot={-4} />
    </div>
  );
};

/** paper grain over a paper scene (multiply, faint), so cut-outs and cards read as one sheet of material */
export const PaperGrain: React.FC<{ opacity?: number }> = ({ opacity = 0.09 }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "multiply", opacity }}>
      <svg width="100%" height="100%"><filter id="pk-grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={Math.floor(f / 3) % 40} stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter><rect width="100%" height="100%" filter="url(#pk-grain)" /></svg>
    </AbsoluteFill>
  );
};

/** the calendar icon is DRAWN IN CODE (2026-11-09: the downloaded frames public/halloween/date were gone, so the card showed a broken picture): rings, an accent header, pages that flip three times then settle.
 *  Formerly: a ready-made calendar motion graphic from the internet (LottieFiles free animation «calendar» by Zakaria Boukernafa, frames keyed to transparent) with the date written under it (user 2026-10-31: «جيب عنصر يعبر عن التاريخ… موشن جرافيك جاهز من الإنترنت») */
/** the calendar shows ONLY true data (user 2026-11-10: «تضع فيه أرقام عشوائية… مو أسماء أشهر صحيحة»): the header = the real month name (a date), or the unit (سنة / أيام…),
 *  or the era (هـ / م) of a year; the page = the exact number spoken. `from` (optional) = a spoken starting number: the pages then count from it to the number (e.g. 1418 → 1421).
 *  Text forms: «١٠ محرّم ٦١ هـ» (date) · «١٤٢١ هـ» / «سنة ١٤٢١ هـ» (year) · «١٠ سنوات» / «٣ أيام» (a count). A month name outside the real lists stops the render. */
const AR = "٠١٢٣٤٥٦٧٨٩";
const num = (s: string) => +s.replace(/[٠-٩]/g, (d) => String(AR.indexOf(d)));
const ar = (n: number) => String(n).replace(/[0-9]/g, (d) => AR[+d]);
const plain = (s: string) => s.replace(/[ً-ْ]/g, "").replace(/[أإآ]/g, "ا").trim();
const MONTHS = ["محرم", "صفر", "ربيع الاول", "ربيع الاخر", "ربيع الثاني", "جمادى الاولى", "جمادى الاخرة", "جمادى الثانية", "رجب", "شعبان", "رمضان", "شوال", "ذو القعدة", "ذو الحجة",
  "يناير", "فبراير", "مارس", "ابريل", "مايو", "يونيو", "يوليو", "اغسطس", "سبتمبر", "اكتوبر", "نوفمبر", "ديسمبر",
  "كانون الثاني", "شباط", "اذار", "نيسان", "ايار", "حزيران", "تموز", "اب", "ايلول", "تشرين الاول", "تشرين الثاني", "كانون الاول"];
const D = "([0-9٠-٩]+)";
export const parseCalendar = (text: string): { head: string; value: number } => {
  const t = text.trim();
  let m = t.match(new RegExp(`^${D}\\s+(.+?)\\s+${D}\\s*(هـ|م)?$`));
  if (m) { if (!MONTHS.includes(plain(m[2]))) throw new Error(`التقويم: «${m[2]}» ليس اسم شهر صحيحاً (${text})`); return { head: m[2], value: num(m[1]) }; }
  m = t.match(new RegExp(`^(?:سنة|عام)?\\s*${D}\\s*(هـ|م)$`)); if (m) return { head: m[2] === "م" ? "ميلادي" : "هجري", value: num(m[1]) };
  m = t.match(new RegExp(`^القرن\\s+${D}\\s*(هـ|م)?$`)); if (m) return { head: m[2] === "هـ" ? "قرن هجري" : "قرن", value: num(m[1]) };
  m = t.match(new RegExp(`^${D}\\s+(.+)$`)); if (m) return { head: m[2], value: num(m[1]) };
  throw new Error(`التقويم: لا أعرف قراءة «${text}» — اكتب «١٠ محرّم ٦١ هـ» أو «١٤٢١ هـ» أو «١٠ سنوات»`);
};
const CalendarIcon: React.FC<{ w: number; h: number; t: number; head: string; value: number; from?: number }> = ({ w, h, t, head, value, from }) => {
  // pages: a blank page turns over to the number, or (with `from`) every true number from `from` up to it, at most 8 turns
  const all = from !== undefined && from !== value ? Array.from({ length: Math.abs(value - from) + 1 }, (_, i) => from + Math.sign(value - from) * i) : [NaN, value];
  const seq = all.length > 8 ? [all[0], ...all.slice(-7)] : all;
  const flips = seq.length - 1, per = 0.28, k = Math.min(flips, Math.max(0, t / per)), cur = Math.floor(k), ph = k - cur;
  const turn = cur < flips ? Math.sin(Math.min(1, ph) * Math.PI / 2) * 180 : 0;   // the top page swings up and over
  const fs = (n: number) => h * (String(n).length > 3 ? 0.2 : String(n).length > 2 ? 0.26 : 0.32);
  const page = (n: number) => <div style={{ position: "absolute", left: "8%", right: "8%", top: "30%", bottom: "8%", background: "#fffaf0", borderRadius: 10, display: "grid", placeItems: "center", fontFamily: kufiF, fontWeight: 800, fontSize: fs(n), color: BRAND.ink }}>{Number.isNaN(n) ? "" : ar(n)}</div>;
  return (
    <div style={{ position: "relative", width: w, height: h, margin: "0 auto", perspective: 900 }}>
      <div style={{ position: "absolute", left: "4%", right: "4%", top: "10%", bottom: 0, background: BRAND.paper, borderRadius: 16, boxShadow: "0 8px 0 rgba(0,0,0,.12)" }} />
      <div style={{ position: "absolute", left: "4%", right: "4%", top: "10%", height: "18%", background: BRAND.accent, borderRadius: "16px 16px 0 0", display: "grid", placeItems: "center", fontFamily: kufiF, fontWeight: 800, fontSize: h * 0.1, color: BRAND.onAccent, whiteSpace: "nowrap", overflow: "hidden" }}>{head}</div>
      {[0.2, 0.8].map((x) => <div key={x} style={{ position: "absolute", left: `${x * 100 - 3}%`, top: "2%", width: "6%", height: "14%", background: BRAND.ink, borderRadius: 8 }} />)}
      {page(seq[Math.min(cur + 1, flips)])}
      {cur < flips ? <div style={{ position: "absolute", inset: 0, transformOrigin: "50% 30%", transform: `rotateX(${turn}deg)`, backfaceVisibility: "hidden" }}>{page(seq[cur])}</div> : null}
    </div>
  );
};
export const DateCalendar: React.FC<{ at: number; until?: number; x: number; y: number; w: number; text: string; sub?: string; from?: number }> = ({ at, until, x, y, w, text, sub, from }) => {
  const cal = parseCalendar(text);
  const f = useCurrentFrame(), { fps } = useVideoConfig(), t = f / fps;
  if (t < at || (until !== undefined && t > until + 0.3)) return null;
  const grow = easeOut((t - at) / 0.35) * (until === undefined ? 1 : 1 - easeOut((t - until) / 0.3));
  const iw = Math.round(w * 0.72), ih = Math.round(iw * 277 / 268), size = Math.round(Math.min(w * 0.13, (w * 0.88) / ([...text].length * 0.5)));   // a long date shrinks to stay inside the card
  // an opaque cream card in the identity (user 2026-10-31: «شفافية التقويم مزعجة… كريمي مع لون مناسب للكود اللوني»): the white frames multiply onto the card, the orange is turned to the accent hue
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, padding: "18px 0 22px", background: "#f4ecda", borderRadius: 26, borderTop: `10px solid ${BRAND.accent}`, boxShadow: "0 18px 36px rgba(0,0,0,.4)", transform: `scale(${0.2 + 0.8 * grow}) rotate(-2deg)`, transformOrigin: "50% 40%", opacity: Math.min(1, grow * 2.5), direction: "rtl", textAlign: "center" }}>
      <CalendarIcon w={iw} h={ih} t={t - at} head={cal.head} value={cal.value} from={from} />
      <div style={{ fontFamily: kufiF, fontWeight: 800, fontSize: size, color: BRAND.ink, lineHeight: 1.2, marginTop: 4, whiteSpace: "nowrap", padding: "0 10px" }}>{text}</div>
      {sub ? <div style={{ fontFamily: kufiF, fontSize: Math.round(size * 0.55), color: BRAND.gray }}>{sub}</div> : null}
    </div>
  );
};
