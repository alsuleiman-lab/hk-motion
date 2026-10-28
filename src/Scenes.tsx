import React from "react";
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as loadCairo } from "@remotion/google-fonts/Cairo";
import { loadFont as loadAmiri } from "@remotion/google-fonts/Amiri";
import { loadFont as loadDeva } from "@remotion/google-fonts/NotoSansDevanagari";
import { Icon } from "./Icon";
import { CHANNEL_NAME, FPS, Photo, Scene } from "./data";

export const { fontFamily: cairo } = loadCairo("normal", { weights: ["500", "700", "900"], subsets: ["arabic", "latin"] });
export const { fontFamily: amiri } = loadAmiri("normal", { weights: ["400", "700"], subsets: ["arabic"] });
loadDeva("normal", { weights: ["400"], subsets: ["devanagari"] });

export const C = {
  bg: "#0b1f2a",
  card: "rgba(255,255,255,0.06)",
  gold: "#e0bb62",
  cream: "#f6ecd3",
  teal: "#3cc1b3",
  red: "#ee6a58",
};
const tone = (t?: string) => (t === "red" ? C.red : t === "teal" ? C.teal : C.gold);

/** spring 0→1 starting at `at` seconds (scene-local). */
const useReveal = (atSec: number, damping = 16) => {
  const frame = useCurrentFrame();
  return spring({ frame: frame - Math.round(atSec * FPS), fps: FPS, config: { damping, stiffness: 120 } });
};

const stagger = (n: number, dur: number, at?: number[], start = 0.8) => (i: number) =>
  at?.[i] ?? start + i * Math.min(1.1, (dur * 0.6) / Math.max(n, 1));

const Reveal: React.FC<{ at: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ at, children, style }) => {
  const p = useReveal(at);
  return <div style={{ opacity: p, transform: `translateY(${(1 - p) * 40}px) scale(${0.94 + 0.06 * p})`, ...style }}>{children}</div>;
};

const Title: React.FC<{ children: React.ReactNode; size?: number; color?: string }> = ({ children, size = 64, color = C.cream }) => {
  const p = useReveal(0.15);
  return <div style={{ fontSize: size, fontWeight: 900, color, lineHeight: 1.3, textAlign: "center", opacity: p, transform: `translateY(${(1 - p) * 30}px)` }}>{children}</div>;
};

const Pill: React.FC<{ children: React.ReactNode; color: string }> = ({ children, color }) => (
  <div style={{ border: `2px solid ${color}`, color: C.cream, background: `${color}22`, borderRadius: 999, padding: "10px 28px", fontSize: 34, fontWeight: 700 }}>{children}</div>
);

const Wrap: React.FC<{ children: React.ReactNode; gap?: number }> = ({ children, gap = 26 }) => (
  <div style={{ position: "absolute", inset: 0, padding: "70px 60px 150px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap }}>{children}</div>
);

const IconBadge: React.FC<{ icon: React.ComponentProps<typeof Icon>["name"]; color: string }> = ({ icon, color }) => {
  const p = useReveal(0);
  const f = useCurrentFrame();
  return (
    <div style={{ width: 210, height: 210, borderRadius: "50%", background: `radial-gradient(circle, ${color}33, transparent 70%)`, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${p}) rotate(${Math.sin(f / 40) * 3}deg)` }}>
      <Icon name={icon} size={150} color={color} />
    </div>
  );
};

export const SceneBody: React.FC<{ scene: Scene }> = ({ scene }) => {
  const dur = scene.to - scene.from;
  switch (scene.type) {
    case "hero": {
      const col = tone(scene.tone);
      const t = stagger(scene.chips?.length ?? 0, dur, scene.at?.map((x) => x - scene.from), 1.2);
      return (
        <Wrap>
          <IconBadge icon={scene.icon} color={col} />
          <Title>{scene.title}</Title>
          {scene.sub && (
            <Reveal at={0.6}>
              <div style={{ fontSize: 36, color: "#cfd8d6", textAlign: "center", maxWidth: 820, lineHeight: 1.5 }}>{scene.sub}</div>
            </Reveal>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center", maxWidth: 860 }}>
            {scene.chips?.map((c, i) => (
              <Reveal key={c} at={t(i)}>
                <Pill color={col}>{c}</Pill>
              </Reveal>
            ))}
          </div>
        </Wrap>
      );
    }
    case "list": {
      const t = stagger(scene.items.length, dur, scene.at?.map((x) => x - scene.from), 1.5);
      return (
        <Wrap gap={20}>
          <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
            <IconSmall icon={scene.icon} />
            <div>
              {scene.kicker && <div style={{ fontSize: 30, color: C.gold, fontWeight: 700 }}>{scene.kicker}</div>}
              <Title size={58}>{scene.title}</Title>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, width: 860 }}>
            {scene.items.map((it, i) => (
              <Reveal key={it} at={t(i)}>
                <div style={{ display: "flex", alignItems: "center", gap: 18, background: C.card, borderRight: `6px solid ${C.gold}`, borderRadius: 16, padding: "16px 26px", fontSize: 36, fontWeight: 700, color: C.cream }}>
                  <span style={{ color: C.gold, fontSize: 30 }}>◆</span>
                  {it}
                </div>
              </Reveal>
            ))}
          </div>
          {scene.footer && (
            <Reveal at={Math.min(dur - 3, t(scene.items.length - 1) + 2.2)}>
              <div style={{ marginTop: 6, background: C.gold, color: "#241a05", padding: "12px 34px", borderRadius: 14, fontSize: 36, fontWeight: 900 }}>{scene.footer}</div>
            </Reveal>
          )}
        </Wrap>
      );
    }
    case "flow": {
      const t = stagger(scene.steps.length, dur, undefined, 1.4);
      return (
        <Wrap gap={14}>
          {scene.title && <Title size={54}>{scene.title}</Title>}
          {scene.steps.map((s, i) => (
            <React.Fragment key={s}>
              <Reveal at={t(i)}>
                <div style={{ width: 800, textAlign: "center", fontSize: 38, fontWeight: 800, color: i === scene.steps.length - 1 ? "#241a05" : C.cream, background: i === scene.steps.length - 1 ? C.red : C.card, border: `2px solid ${i === scene.steps.length - 1 ? C.red : "#ffffff22"}`, borderRadius: 18, padding: "18px 24px" }}>{s}</div>
              </Reveal>
              {i < scene.steps.length - 1 && (
                <Reveal at={t(i) + 0.4}>
                  <div style={{ color: C.gold, fontSize: 40, lineHeight: 1 }}>▼</div>
                </Reveal>
              )}
            </React.Fragment>
          ))}
          {scene.footer && (
            <Reveal at={Math.min(dur - 2.5, t(scene.steps.length - 1) + 1.5)}>
              <div style={{ color: C.gold, fontSize: 34, fontWeight: 700, marginTop: 8 }}>{scene.footer}</div>
            </Reveal>
          )}
        </Wrap>
      );
    }
    case "timeline": {
      const t = stagger(scene.nodes.length, dur, undefined, 1.4);
      const frame = useCurrentFrame(); // eslint-disable-line react-hooks/rules-of-hooks
      const line = interpolate(frame, [30, dur * FPS * 0.8], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });  
      return (
        <Wrap gap={30}>
          <Title size={54}>{scene.title}</Title>
          <div style={{ position: "relative", width: 840, display: "flex", flexDirection: "column", gap: 28, paddingRight: 56 }}>
            <div style={{ position: "absolute", right: 14, top: 10, width: 6, height: `${line * 96}%`, background: C.gold, borderRadius: 3 }} />
            {scene.nodes.map((n, i) => (
              <Reveal key={n.k} at={t(i)}>
                <div style={{ position: "relative", background: C.card, borderRadius: 18, padding: "18px 28px" }}>
                  <div style={{ position: "absolute", right: -52, top: 30, width: 24, height: 24, borderRadius: "50%", background: C.gold, border: `5px solid ${C.bg}` }} />
                  <div style={{ fontSize: 40, fontWeight: 900, color: C.gold }}>{n.k}</div>
                  <div style={{ fontSize: 34, color: C.cream, fontWeight: 500, lineHeight: 1.4 }}>{n.v}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </Wrap>
      );
    }
    case "verse": {
      const p = useReveal(0.3); // eslint-disable-line react-hooks/rules-of-hooks
      return (
        <Wrap>
          <Reveal at={0.1}>
            <div style={{ color: C.gold, fontSize: 36, fontWeight: 700 }}>{scene.label}</div>
          </Reveal>
          <div style={{ border: `3px solid ${C.gold}`, borderRadius: 28, padding: "50px 46px", width: 840, background: "rgba(224,187,98,0.07)", textAlign: "center", opacity: p, transform: `scale(${0.92 + 0.08 * p})`, position: "relative" }}>
            <div style={{ position: "absolute", top: -34, left: "50%", marginLeft: -34, background: C.bg, padding: "0 8px" }}>
              <Icon name="star" size={68} />
            </div>
            <div style={{ fontFamily: amiri, fontSize: scene.text.length > 60 ? 54 : 64, lineHeight: 1.9, color: C.cream, fontWeight: 700 }}>
              {scene.type === "verse" && `﴿ ${scene.text} ﴾`}
            </div>
          </div>
          <Reveal at={1.2}>
            <div style={{ color: "#cfd8d6", fontSize: 30, textAlign: "center", maxWidth: 840 }}>{scene.ref}</div>
          </Reveal>
        </Wrap>
      );
    }
    case "compare": {
      const t = stagger(scene.rows.length, dur, undefined, 2);
      const ca = tone(scene.aTone);
      const cb = tone(scene.bTone);
      return (
        <Wrap gap={22}>
          {scene.heading && <Title size={46}>{scene.heading}</Title>}
          <div style={{ width: 900, display: "flex", flexDirection: "column", gap: 14 }}>
            <Reveal at={0.7}>
              <div style={{ display: "flex", gap: 14 }}>
                <Head color={ca}>{scene.aTitle}</Head>
                <div style={{ width: 60, display: "flex", alignItems: "center", justifyContent: "center", color: C.gold, fontSize: 28, fontWeight: 900 }}>VS</div>
                <Head color={cb}>{scene.bTitle}</Head>
              </div>
            </Reveal>
            {scene.rows.map(([a, b], i) => (
              <Reveal key={a} at={t(i)}>
                <div style={{ display: "flex", gap: 14, alignItems: "stretch" }}>
                  <Cell color={ca}>{a}</Cell>
                  <div style={{ width: 60 }} />
                  <Cell color={cb}>{b}</Cell>
                </div>
              </Reveal>
            ))}
          </div>
        </Wrap>
      );
    }
    case "photo": {
      return <PhotoScene photos={scene.photos} caption={scene.caption} dur={dur} layout={scene.layout} />;
    }
    case "closing": {
      return <Closing />;
    }
    case "cloud": {
      const t = stagger(scene.terms.length, dur, undefined, 1.4);
      const f = useCurrentFrame(); // eslint-disable-line react-hooks/rules-of-hooks
      return (
        <Wrap gap={34}>
          <Title size={46}>{scene.title}</Title>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 20, justifyContent: "center", width: 860 }}>
            {scene.terms.map((x, i) => (
              <Reveal key={x} at={t(i)} style={{ transform: undefined }}>
                <div style={{ transform: `translateY(${Math.sin(f / 18 + i) * 6}px)` }}>
                  <Pill color={i % 2 ? C.teal : C.gold}>{x}</Pill>
                </div>
              </Reveal>
            ))}
          </div>
        </Wrap>
      );
    }
  }
};

const IconSmall: React.FC<{ icon: React.ComponentProps<typeof Icon>["name"] }> = ({ icon }) => {
  const p = useReveal(0);
  return (
    <div style={{ transform: `scale(${p})` }}>
      <Icon name={icon} size={120} />
    </div>
  );
};

const Head: React.FC<{ color: string; children: React.ReactNode }> = ({ color, children }) => (
  <div style={{ flex: 1, textAlign: "center", background: color, color: "#10161a", fontSize: 38, fontWeight: 900, borderRadius: 16, padding: "12px 10px" }}>{children}</div>
);
const Cell: React.FC<{ color: string; children: React.ReactNode }> = ({ color, children }) => (
  <div style={{ flex: 1, background: C.card, borderTop: `5px solid ${color}`, color: C.cream, fontSize: 32, fontWeight: 700, lineHeight: 1.45, borderRadius: 14, padding: "16px 18px", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div>
);

export const useSceneFx = () => useVideoConfig();

const PhotoBox: React.FC<{ p: Photo; i: number; n: number; dur: number; h?: number }> = ({ p, i, n, dur, h }) => {
  const f = useCurrentFrame();
  const r = useReveal(0.15 + i * 0.35, 18);
  const zoom = interpolate(f, [0, dur * FPS], [1.0, 1.12]);
  const isRow = n === 3;
  const tall = n >= 2;
  const style = { objectViewBox: p.crop ? `inset(${p.crop})` : undefined } as React.CSSProperties;
  return (
    <div style={{ flex: 1, minWidth: 0, height: h ?? (isRow ? 560 : tall ? 640 : 720), borderRadius: 22, overflow: "hidden", border: `3px solid ${C.gold}`, boxShadow: "0 18px 44px rgba(0,0,0,0.5)", opacity: r, transform: `translateY(${(1 - r) * 60}px) scale(${0.92 + 0.08 * r})`, background: "#000" }}>
      <Img src={staticFile(p.src)} style={{ width: "100%", height: "100%", objectFit: isRow && !h ? "contain" : "cover", transform: `scale(${isRow ? 1 + (zoom - 1) / 3 : zoom})`, ...style }} />
    </div>
  );
};

const PhotoScene: React.FC<{ photos: Photo[]; caption: string; dur: number; layout?: "feature" }> = ({ photos, caption, dur, layout }) => (
  <Wrap gap={30}>
    {layout === "feature" ? (
      <div style={{ display: "flex", flexDirection: "column", gap: 20, width: 900 }}>
        <div style={{ display: "flex" }}>
          <PhotoBox p={photos[0]} i={0} n={1} dur={dur} h={400} />
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          {photos.slice(1).map((p, i) => (
            <PhotoBox key={p.src} p={p} i={i + 1} n={2} dur={dur} h={290} />
          ))}
        </div>
      </div>
    ) : (
      <div style={{ display: "flex", gap: 22, width: 900, alignItems: "center" }}>
        {photos.map((p, i) => (
          <PhotoBox key={p.src} p={p} i={i} n={photos.length} dur={dur} />
        ))}
      </div>
    )}
    <Reveal at={0.9}>
      <div style={{ background: C.gold, color: "#241a05", padding: "12px 34px", borderRadius: 14, fontSize: 36, fontWeight: 900, textAlign: "center", maxWidth: 900 }}>{caption}</div>
    </Reveal>
  </Wrap>
);

const Closing: React.FC = () => {
  const f = useCurrentFrame();
  const bell = Math.sin(f / 4) * 14 * Math.exp(-(f % 60) / 18);
  return (
    <Wrap gap={22}>
      <div style={{ width: 760, height: 330, borderRadius: 24, overflow: "hidden", border: `3px solid ${C.gold}`, opacity: useReveal(0.1) }}>
        <Img src={staticFile("broll/kaaba.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 78%", transform: `scale(${1 + f / 900})` }} />
      </div>
      <Title size={58}>{CHANNEL_NAME}</Title>
      <Reveal at={0.8}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, background: C.red, color: "#fff", borderRadius: 18, padding: "14px 36px", fontSize: 44, fontWeight: 900 }}>
          <span style={{ display: "inline-block", transform: `rotate(${bell}deg)`, transformOrigin: "top center" }}>🔔</span>
          اشترك في القناة وفعّل الجرس
        </div>
      </Reveal>
      <Reveal at={1.6}>
        <div style={{ color: "#9fb0ad", fontSize: 24, textAlign: "center", maxWidth: 860 }}>الصور: Wikimedia Commons (تراخيص CC / ملكية عامة) — التفاصيل في public/broll/credits.json</div>
      </Reveal>
    </Wrap>
  );
};

/** Absolute times (seconds) when sub-elements of a scene appear — used to place pop sound effects. */
export const revealTimes = (scene: Scene): number[] => {
  const dur = scene.to - scene.from;
  const rel = (n: number, at: number[] | undefined, start: number) => {
    const t = stagger(n, dur, at?.map((x) => x - scene.from), start);
    return Array.from({ length: n }, (_, i) => scene.from + t(i));
  };
  switch (scene.type) {
    case "hero":
      return rel(scene.chips?.length ?? 0, scene.at, 1.2);
    case "list":
      return rel(scene.items.length, scene.at, 1.5);
    case "flow":
      return rel(scene.steps.length, undefined, 1.4);
    case "timeline":
      return rel(scene.nodes.length, undefined, 1.4);
    case "compare":
      return rel(scene.rows.length, undefined, 2);
    case "cloud":
      return rel(scene.terms.length, undefined, 1.4);
    default:
      return [];
  }
};
