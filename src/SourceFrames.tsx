import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { useT, useSp, kufiF } from "./MG";
import { Pic } from "./EuKit";
import { BRAND } from "./brand";

/**
 * Source frames — one family for showing what he cites (user 2026-10-29: «أشكال حين أعرض فيديو أو مصدر تكون أجمل وتوافق الهوية البصرية»).
 * Every frame shares the identity's shape: a light card (BRAND.card) with 18 px corners and a soft shadow, a dark identity strip on top or bottom (BRAND.navy),
 * the accent (BRAND.accent) for the one live detail (progress, highlight, link), and the same entrance (rise + settle, 0.5 s) and exit (0.3 s fade).
 * Colours are read from BRAND while rendering, so each frame follows the video's palette (spec field `brand`).
 * Ideas from Motionstash browser-chrome / minimal-video-frame / x-post-card / youtube-comment-highlight / source-highlight / citation-tag (MIT); drawn here in our identity.
 */
const R = 18;
const shadow = "0 18px 40px rgba(0,0,0,.42)";
const clamp = (x: number) => Math.max(0, Math.min(1, x));
const ease = (u: number) => 1 - Math.pow(1 - clamp(u), 3);
type Box = { at: number; until?: number; x: number; y: number; w: number };
/** shared entrance/exit: rises 40 px with a spring and settles from a 2° tilt; fades out over the last 0.3 s */
const useEnter = (at: number, until?: number, tilt = -1.2) => {
  const t = useT(0), sp = useSp(at, 14, 140);
  const out = until === undefined ? 1 : clamp((until - t) / 0.3);
  return { show: t >= at && out > 0, style: { opacity: Math.min(1, sp * 1.4) * out, transform: `translateY(${(1 - sp) * 40}px) rotate(${tilt * (1 - sp) + tilt * 0.4}deg)` } as React.CSSProperties };
};
const Card: React.FC<{ b: Box; h?: number; tilt?: number; children: React.ReactNode }> = ({ b, h, tilt, children }) => {
  const e = useEnter(b.at, b.until, tilt);
  if (!e.show) return null;
  return <div style={{ position: "absolute", left: b.x, top: b.y, width: b.w, height: h, background: BRAND.card, borderRadius: R, boxShadow: shadow, overflow: "hidden", ...e.style }}>{children}</div>;
};

/** a web page in an identity browser frame: tab with the site name, address bar with the link, the page scrolls slowly by `scroll` px */
export const BrowserFrame: React.FC<Box & { h: number; url: string; site: string; src?: string; scroll?: number; children?: React.ReactNode }> = ({ h, url, site, src, scroll = 0, children, ...b }) => {
  const t = useT(b.at), top = 92, y = -scroll * ease((t - 0.6) / Math.max(1, (b.until ?? b.at + 6) - b.at - 1));
  return (
    <Card b={b} h={h}>
      <div style={{ height: top, background: BRAND.navy, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "0 18px 12px", gap: 10, boxSizing: "border-box" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", direction: "ltr" }}>
          {[BRAND.mark, BRAND.accent, BRAND.light].map((c, i) => <i key={i} style={{ width: 12, height: 12, borderRadius: 6, background: c }} />)}
          <span style={{ marginLeft: 14, background: BRAND.card, color: BRAND.ink, fontFamily: kufiF, fontSize: 18, padding: "4px 18px", borderRadius: "10px 10px 0 0" }}>{site}</span>
        </div>
        <div style={{ direction: "ltr", background: BRAND.navyDeep, color: BRAND.light, fontFamily: "Almarai", fontSize: 20, padding: "6px 14px", borderRadius: 10, display: "flex", gap: 10, alignItems: "center", overflow: "hidden", whiteSpace: "nowrap" }}>
          <svg width="14" height="16" viewBox="0 0 14 16"><rect x="1" y="7" width="12" height="9" rx="2" fill={BRAND.accent} /><path d="M4 7V5a3 3 0 0 1 6 0v2" stroke={BRAND.accent} strokeWidth="2" fill="none" /></svg>
          <span>{url}</span>
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: top, bottom: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: y }}>{src ? <Pic src={src} style={{ width: "100%", display: "block" }} /> : children}</div>
      </div>
    </Card>
  );
};

/** the answered clip in a player frame: channel chip on top, a thin progress line in the accent and the elapsed time at the bottom */
export const VideoFrame: React.FC<Box & { h: number; src: string; channel: string; title?: string; startFrom?: number }> = ({ h, src, channel, title, startFrom = 0, ...b }) => {
  const f = useCurrentFrame(), t = Math.max(0, useT(b.at)), dur = (b.until ?? b.at + 8) - b.at;
  const mm = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const isVid = /\.(mp4|webm|mov)$/i.test(src);
  return (
    <Card b={b} h={h} tilt={1}>
      <div style={{ position: "absolute", left: 12, top: 12, right: 12, bottom: 64, borderRadius: 12, overflow: "hidden", background: BRAND.ink }}>
        {isVid ? <OffthreadVideo src={staticFile(src)} muted startFrom={startFrom + Math.max(0, f - Math.round(b.at * 30))} style={{ width: "100%", height: "100%", objectFit: "contain" }} /> : <Pic src={src} style={{ width: "100%", height: "100%", objectFit: "contain" }} />}
        <div style={{ position: "absolute", right: 14, top: 14, direction: "rtl", background: BRAND.navy, color: BRAND.card, fontFamily: kufiF, fontSize: 20, padding: "4px 14px 8px", borderRadius: 10 }}>{channel}</div>
      </div>
      <div style={{ position: "absolute", left: 22, right: 22, bottom: 14, height: 38, display: "flex", alignItems: "center", gap: 14, direction: "ltr" }}>
        <svg width="20" height="22" viewBox="0 0 20 22"><path d="M2 1 L19 11 L2 21 Z" fill={BRAND.ink} /></svg>
        <div style={{ flex: 1, height: 6, borderRadius: 3, background: BRAND.paper2, position: "relative" }}><div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${clamp(t / dur) * 100}%`, borderRadius: 3, background: BRAND.accent }} /></div>
        <span style={{ fontFamily: "Almarai", fontSize: 18, color: BRAND.gray }}>{mm(t)}</span>
        {title ? <span style={{ direction: "rtl", fontFamily: kufiF, fontSize: 18, color: BRAND.ink, maxWidth: "45%", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{title}</span> : null}
      </div>
    </Card>
  );
};

/** a post from an account: avatar, name, handle and date in the identity; `mark` words get the accent highlight one after another */
export const PostCard: React.FC<Box & { name: string; handle: string; avatar: string; text: string; date: string; mark?: string[] }> = ({ name, handle, avatar, text, date, mark = [], ...b }) => {
  const t = useT(b.at);
  return (
    <Card b={b}>
      <div style={{ padding: "26px 30px 22px", direction: "rtl", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: 32, overflow: "hidden", boxShadow: `0 0 0 3px ${BRAND.paper2}` }}><Pic src={avatar} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontFamily: kufiF, fontSize: 26, color: BRAND.ink }}>{name}</span>
            <span style={{ fontFamily: "Almarai", fontSize: 19, color: BRAND.gray, direction: "ltr", textAlign: "right" }}>{handle}</span>
          </div>
        </div>
        <p style={{ margin: 0, fontFamily: "Almarai", fontWeight: 700, fontSize: 30, lineHeight: 1.6, color: BRAND.ink }}>
          {text.split(" ").map((w, i) => {
            const k = mark.indexOf(w), on = k >= 0 ? ease((t - 0.8 - k * 0.5) / 0.3) : 0;
            return <span key={i} style={{ backgroundImage: `linear-gradient(${BRAND.accent}, ${BRAND.accent})`, backgroundSize: `${on * 100}% 100%`, backgroundRepeat: "no-repeat", backgroundPosition: "right", color: on > 0.5 ? BRAND.onAccent : BRAND.ink, borderRadius: 6, padding: "0 4px" }}>{w} </span>;
          })}
        </p>
        <div style={{ borderTop: `2px solid ${BRAND.paper}`, paddingTop: 12, fontFamily: "Almarai", fontSize: 18, color: BRAND.gray }}>{date}</div>
      </div>
    </Card>
  );
};

/** a viewer's comment he answers: the comment card, then a hand-drawn underline in BRAND.mark under the words he quotes */
export const CommentCard: React.FC<Box & { name: string; avatar: string; text: string; likes?: number; underline?: [number, number] }> = ({ name, avatar, text, likes, underline, ...b }) => {
  const t = useT(b.at), words = text.split(" "), u = ease((t - 0.9) / 0.5);
  return (
    <Card b={b} tilt={0.8}>
      <div style={{ padding: "22px 26px", direction: "rtl", display: "flex", gap: 16 }}>
        <div style={{ flex: "none", width: 56, height: 56, borderRadius: 28, overflow: "hidden" }}><Pic src={avatar} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
          <span style={{ fontFamily: kufiF, fontSize: 21, color: BRAND.ink }}>{name} <span style={{ fontFamily: "Almarai", fontSize: 17, color: BRAND.gray }}>· تعليق</span></span>
          <p style={{ margin: 0, fontFamily: "Almarai", fontWeight: 700, fontSize: 28, lineHeight: 1.6, color: BRAND.ink }}>
            {words.map((w, i) => {
              const on = underline && i >= underline[0] && i <= underline[1];
              return <span key={i} style={on ? { backgroundImage: `linear-gradient(${BRAND.mark}, ${BRAND.mark})`, backgroundSize: `${u * 100}% 5px`, backgroundPosition: "right bottom", backgroundRepeat: "no-repeat", paddingBottom: 4 } : undefined}>{w} </span>;
            })}
          </p>
          {likes !== undefined ? <span style={{ fontFamily: "Almarai", fontSize: 18, color: BRAND.gray }}>👍 {likes.toLocaleString("en-US")}</span> : null}
        </div>
      </div>
    </Card>
  );
};

/** a page of a book or document: the page image, a band in the accent sweeps over the quoted line (`line` = y and height in page px at width w) (the pinned citation tag was cancelled by the user, 2026-11-17) */
export const BookPage: React.FC<Box & { h: number; src: string; line: { y: number; h: number }; book: string; part?: string; page?: string }> = ({ h, src, line, ...b }) => {
  const t = useT(b.at), sweep = ease((t - 0.8) / 0.7);
  return (
    <>
      <Card b={b} h={h} tilt={-0.8}>
        <div style={{ position: "absolute", inset: 14, borderRadius: 10, overflow: "hidden", background: BRAND.paper }}>
          <Pic src={src} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
          <div style={{ position: "absolute", right: 0, top: line.y, height: line.h, width: `${sweep * 100}%`, background: BRAND.accent, opacity: 0.32, mixBlendMode: "multiply" }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, background: `rgba(0,0,0,${0.22 * sweep})`, clipPath: `polygon(0 0, 100% 0, 100% ${line.y}px, 0 ${line.y}px, 0 ${line.y + line.h}px, 100% ${line.y + line.h}px, 100% 100%, 0 100%)` }} />
        </div>
      </Card>
    </>
  );
};


/** demo page content for the browser frame (an article laid out in the identity) */
export const ArticleMock: React.FC<{ w: number; img: string; title: string }> = ({ w, img, title }) => (
  <AbsoluteFill style={{ position: "relative", width: w, background: BRAND.card, direction: "rtl", padding: "26px 34px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 16 }}>
    <div style={{ fontFamily: kufiF, fontSize: 34, color: BRAND.ink, lineHeight: 1.5 }}>{title}</div>
    <div style={{ height: 300, borderRadius: 12, overflow: "hidden" }}><Pic src={img} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>
    {Array.from({ length: 12 }).map((_, i) => <div key={i} style={{ height: 14, width: `${72 + ((i * 23) % 28)}%`, background: BRAND.paper2, borderRadius: 4 }} />)}
  </AbsoluteFill>
);
