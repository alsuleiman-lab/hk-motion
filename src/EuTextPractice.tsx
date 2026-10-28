import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile } from "remotion";
import { BlurRise, Gfx, MGTheme, kufiF, useSp, useT } from "./MG";
import { Banner, Sources, StatRow, useFonts } from "./EuKit";

/**
 * Practice: the WRITTEN-TEXT style of EU-Protests-Landscape (user 2026-10-24: «تدرّب على أسلوب النصوص المكتوبة فيها»),
 * shown WITHOUT splitting the screen (user 2026-10-24: «لا أريد تقسيم الشاشة إلا بنسبة يسيرة، ويمكن عرض البطاقات دون تقسيم»):
 * the Sheikh's video stays full frame and untouched; the EU pieces (Banner title → StatRow cards one per spoken item → stamp
 * conclusion; Chip phrases; Sources strip) float in the empty side of his frame, never over the face or beard.
 * Placeholder text only; times are fake "spoken" seconds.
 */
export const EU_TEXT_PRACTICE_FRAMES = 20 * 30;

const COL = { x: 40, w: 700 };          // empty side of HIS frame (his face/beard sit at x≈870–1150)
const SCENE_OUT = 10.4;                  // written scene ends; cards leave together (EU `Sc` window)

/** written scene window: everything leaves together with a short fade */
const Scene: React.FC<{ b: number; children: React.ReactNode }> = ({ b, children }) => {
  const t = useT();
  if (t > b + 0.35) return null;
  const o = Math.max(0, Math.min(1, (b + 0.35 - t) / 0.35));
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};

/** EU stamp, but on a cream backing so it stays readable over a busy video (the EU original sat on paper) */
const StampV: React.FC<{ at: number; x: number; y: number; text: string; size?: number }> = ({ at, x, y, text, size = 52 }) => {
  const s = useSp(at, 7, 260);
  if (useT() < at) return null;
  return <div style={{ position: "absolute", left: x, top: y, transform: `rotate(-6deg) scale(${2.2 - 1.2 * s})`, opacity: Math.min(1, s * 3), background: "rgba(250,246,236,.95)", border: "6px solid #b8432f", color: "#b8432f", fontFamily: kufiF, fontWeight: 800, fontSize: size, padding: "2px 24px 8px", borderRadius: 12, boxShadow: "0 12px 24px rgba(0,0,0,.3)", direction: "rtl", whiteSpace: "nowrap" }}>{text}</div>;
};

/**
 * key phrase WITHOUT a box (user 2026-10-24: «صندوق العبارة لا يعجبني»): words rise one by one (BlurRise) with a dark text
 * shadow, over a soft bottom shade that fades with the phrase (a gradient, not a box), so it reads even over his white robe.
 */
const Phrases: React.FC<{ items: { text: string; at: number }[]; end: number; y?: number; size?: number }> = ({ items, end, y = 900, size = 100 }) => {
  const t = useT();
  const i = items.filter((p) => p.at <= t).length - 1;
  if (i < 0 || t > end + 0.3) return null;
  const p = items[i], next = items[i + 1]?.at ?? end;
  const o = Math.min(1, (t - p.at) / 0.2, (next + 0.05 - t) / 0.25);
  const shade = Math.min(1, (t - items[0].at) / 0.4, (end + 0.3 - t) / 0.3);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ opacity: Math.max(0, shade), background: "linear-gradient(to top, rgba(10,14,20,.62) 0%, rgba(10,14,20,.32) 16%, rgba(10,14,20,0) 30%)" }} />
      <div key={i} style={{ position: "absolute", inset: 0, opacity: Math.max(0, o), textShadow: "0 3px 10px rgba(0,0,0,.85), 0 0 26px rgba(0,0,0,.55)" }}>
        <BlurRise at={p.at} text={p.text} x={260} w={1400} y={y} size={size} />
      </div>
    </AbsoluteFill>
  );
};

export const EuTextPractice: React.FC = () => {
  useFonts();
  return (
    <MGTheme theme="steel">
      <AbsoluteFill style={{ background: "#16202c" }}>
        <OffthreadVideo src={staticFile("kit_sample_sheikh.mp4")} muted />
        <Gfx>
          <Scene b={SCENE_OUT}>
            {/* 1) title first: «البلد/الموضوع: …» or a short question */}
            <Banner at={0.8} x={COL.x} y={150} w={COL.w} text="عنوان المشهد: سؤال قصير؟" size={40} />
            {/* 2) one card per spoken item, stacked in ONE column, each at its word, alternating tilt */}
            <StatRow at={2.0} x={COL.x} y={285} w={COL.w} h={160} icon="Wallet" label="البند الأول بكلماته" sub="سطر صغير يوضّح عند الحاجة" rot={-1} />
            <StatRow at={4.0} countAt={4.7} x={COL.x} y={470} w={COL.w} h={160} icon="Banknote" label="بند فيه رقم (2024)" to={322} unit="مليون" rot={1} big={84} />
            <StatRow at={6.0} x={COL.x} y={655} w={COL.w} h={160} icon="TrendingUp" label="والبند الثالث يكمل الجملة" rot={-1} />
            {/* 3) the emotional conclusion as a stamp, below the column (cream backing over video) */}
            <StampV at={8.0} x={170} y={860} text="خلاصة من كلامه" />
            {/* 4) source of the figure, bottom-left, while it is discussed */}
            <Sources x={COL.x} bottom={20} w={COL.w} size={22} links={[{ at: 4.0, url: "https://example.org/source-of-the-figure" }]} />
          </Scene>
          {/* 5) after the cards: one key phrase at a time, NO box, bottom centre, below the beard */}
          <Phrases end={19.6} items={[{ text: "عبارة مفتاحية من كلامه", at: 11.4 }, { text: "عبارة ثانية قصيرة", at: 13.8 }, { text: "سؤال يختم الفكرة؟", at: 16.4 }]} />
        </Gfx>
      </AbsoluteFill>
    </MGTheme>
  );
};
