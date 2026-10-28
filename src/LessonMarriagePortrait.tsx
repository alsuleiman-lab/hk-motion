import React from "react";
import { AbsoluteFill, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, Img } from "remotion";
import { loadFont as loadCairo } from "@remotion/google-fonts/Cairo";
import { loadFont as loadLalezar } from "@remotion/google-fonts/Lalezar";
import wordsData from "../public/marriage_words.json";

const { fontFamily: cairo } = loadCairo("normal", { weights: ["700", "800", "900"], subsets: ["arabic", "latin"] });
const { fontFamily: lalezar } = loadLalezar("normal", { weights: ["400"], subsets: ["arabic", "latin"] });

export const MARRIAGE_FPS = 30;
export const MARRIAGE_DURATION_FRAMES = 3963; // 132.1s * 30 fps

const sec = (t: number) => Math.round(t * MARRIAGE_FPS);

// User-specified Library & Parchment Palette:
const P = {
  parchment: "#f7f2e7",
  cream: "#ede3ce",
  sand: "#dfd2b5",
  leather: "#4a2e1b",
  walnut: "#382113",
  oak: "#6e472a",
  olive: "#4f6345",
  sage: "#6b805f",
  deepOlive: "#2d3b27",
  gold: "#cda04f",
  amber: "#b87d2a",
  ink: "#1d140e",
};

interface WordCue {
  s: number;
  e: number;
  w: number | string;
  p?: number;
}

const words: WordCue[] = wordsData as WordCue[];

const usePop = (at: number, damping = 14) => {
  const f = useCurrentFrame();
  return spring({ frame: f - sec(at), fps: MARRIAGE_FPS, config: { damping, stiffness: 180, mass: 0.8 } });
};

const Pop: React.FC<{ at: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ at, children, style }) => {
  const p = usePop(at);
  const opacity = interpolate(p, [0, 0.4, 1], [0, 0.9, 1], { extrapolateRight: "clamp" });
  const scale = interpolate(p, [0, 1], [0.85, 1], { extrapolateRight: "clamp" });
  return <div style={{ opacity, transform: `scale(${scale})`, ...style }}>{children}</div>;
};

export const LessonMarriagePortrait: React.FC = () => {
  const frame = useCurrentFrame();
  const currentTime = frame / MARRIAGE_FPS;

  // Cover image for the very first 3 frames (0.10s)
  if (frame < 3) {
    return (
      <AbsoluteFill
        style={{
          background: `linear-gradient(135deg, ${P.walnut} 0%, ${P.leather} 60%, ${P.deepOlive} 100%)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 60,
          textAlign: "center",
          direction: "rtl",
        }}
      >
        <div
          style={{
            width: 440,
            height: 440,
            borderRadius: "50%",
            overflow: "hidden",
            border: `10px solid ${P.gold}`,
            boxShadow: `0 25px 60px rgba(0,0,0,0.6)`,
            marginBottom: 50,
          }}
        >
          <Img
            src={staticFile("cover_sheikh_25_sq.jpg")}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>

        <div
          style={{
            background: P.gold,
            color: P.walnut,
            fontFamily: cairo,
            fontSize: 40,
            fontWeight: 900,
            padding: "10px 40px",
            borderRadius: 50,
            marginBottom: 35,
            boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
          }}
        >
          ⚠️ للمتزوجين فقط
        </div>

        <h1
          style={{
            fontFamily: lalezar,
            fontSize: 66,
            color: P.parchment,
            lineHeight: 1.35,
            margin: "0 0 25px 0",
            textShadow: `0 4px 15px rgba(0,0,0,0.5)`,
          }}
        >
          استدفاء الرجل بزوجته بعد الغسل قبل أن تغتسل
        </h1>

        <div
          style={{
            fontFamily: cairo,
            fontSize: 34,
            fontWeight: 800,
            color: P.cream,
            opacity: 0.95,
          }}
        >
          شرح جامع الترمذي • الشيخ محمد بن شمس الدين
        </div>
      </AbsoluteFill>
    );
  }

  // Active word detection
  const activeWord = words.find((item) => currentTime >= item.s && currentTime <= item.e);

  return (
    <AbsoluteFill style={{ backgroundColor: P.walnut, overflow: "hidden" }}>
      {/* Main Video Stream */}
      <OffthreadVideo
        src={staticFile("marriage_portrait_video.mp4")}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />

      {/* Gentle gradient at bottom to ground the graphics */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(to top, rgba(29,20,14,0.96) 0%, rgba(29,20,14,0.85) 25%, rgba(29,20,14,0.4) 42%, rgba(29,20,14,0) 58%)`,
          pointerEvents: "none",
        }}
      />

      {/* Card 1: 0.8s - 12.0s | Intro Warning */}
      {currentTime >= 0.8 && currentTime < 12.0 && (
        <Sequence from={sec(0.8)} durationInFrames={sec(12.0) - sec(0.8)}>
          <AbsoluteFill style={{ top: 1240, bottom: 250, padding: "0 45px", direction: "rtl", pointerEvents: "none" }}>
            <Pop at={0.8}>
              <div
                style={{
                  background: `linear-gradient(145deg, ${P.parchment} 0%, ${P.cream} 100%)`,
                  borderRadius: 28,
                  padding: "26px 36px",
                  border: `3px solid ${P.gold}`,
                  boxShadow: `0 20px 50px rgba(0,0,0,0.6)`,
                }}
              >
                <div style={{ display: "inline-block", background: P.leather, color: P.gold, fontFamily: cairo, fontSize: 24, fontWeight: 900, padding: "6px 20px", borderRadius: 20, marginBottom: 14 }}>
                  ⚠️ تنبيه لطيف • للمتزوجين فقط
                </div>
                <div style={{ fontFamily: lalezar, fontSize: 44, color: P.walnut, lineHeight: 1.3, marginBottom: 10 }}>
                  إذا فيه حدا عازب يروح يعمل فنجان قهوة! ☕
                </div>
                <div style={{ fontFamily: cairo, fontSize: 25, fontWeight: 700, color: P.oak, lineHeight: 1.5 }}>
                  مسألة فقهية خاصة بالمتزوجين في أحكام الغسل والعشرة الزوجية
                </div>
              </div>
            </Pop>
          </AbsoluteFill>
        </Sequence>
      )}

      {/* Card 2: 16.0s - 31.5s | The Chapter Title & Issue */}
      {currentTime >= 16.0 && currentTime < 31.5 && (
        <Sequence from={sec(16.0)} durationInFrames={sec(31.5) - sec(16.0)}>
          <AbsoluteFill style={{ top: 1240, bottom: 250, padding: "0 45px", direction: "rtl", pointerEvents: "none" }}>
            <Pop at={16.0}>
              <div
                style={{
                  background: `linear-gradient(145deg, ${P.parchment} 0%, ${P.cream} 100%)`,
                  borderRadius: 28,
                  padding: "26px 36px",
                  border: `3px solid ${P.olive}`,
                  boxShadow: `0 20px 50px rgba(0,0,0,0.6)`,
                }}
              >
                <div style={{ display: "inline-block", background: P.olive, color: P.parchment, fontFamily: cairo, fontSize: 23, fontWeight: 900, padding: "6px 20px", borderRadius: 20, marginBottom: 14 }}>
                  📖 جامع الترمذي • كتاب الطهارة
                </div>
                <div style={{ fontFamily: lalezar, fontSize: 42, color: P.walnut, lineHeight: 1.3, marginBottom: 12 }}>
                  باب في الرجل يستدفئ بالمرأة بعد الغسل
                </div>
                <div style={{ fontFamily: cairo, fontSize: 25, fontWeight: 800, color: P.leather, lineHeight: 1.5 }}>
                  تحرير المسألة: إذا اغتسل الرجل بعد الجماع واحتضن زوجته قبل أن تغتسل، هل هذا جائز؟
                </div>
              </div>
            </Pop>
          </AbsoluteFill>
        </Sequence>
      )}

      {/* Card 3: 33.0s - 48.0s | Isnad & Hurayth */}
      {currentTime >= 33.0 && currentTime < 48.0 && (
        <Sequence from={sec(33.0)} durationInFrames={sec(48.0) - sec(33.0)}>
          <AbsoluteFill style={{ top: 1240, bottom: 250, padding: "0 45px", direction: "rtl", pointerEvents: "none" }}>
            <Pop at={33.0}>
              <div
                style={{
                  background: `linear-gradient(145deg, ${P.parchment} 0%, ${P.cream} 100%)`,
                  borderRadius: 28,
                  padding: "24px 34px",
                  border: `3px solid ${P.gold}`,
                  boxShadow: `0 20px 50px rgba(0,0,0,0.6)`,
                }}
              >
                <div style={{ display: "inline-block", background: P.leather, color: P.parchment, fontFamily: cairo, fontSize: 23, fontWeight: 900, padding: "6px 20px", borderRadius: 20, marginBottom: 12 }}>
                  🔍 تحقيق الإسناد • الجرح والتعديل
                </div>
                <div style={{ fontFamily: lalezar, fontSize: 38, color: P.walnut, lineHeight: 1.3, marginBottom: 10 }}>
                  حُريث بن أبي مطر (ت ١٥٠ هـ)
                </div>
                <div style={{ fontFamily: cairo, fontSize: 24, fontWeight: 700, color: P.leather, lineHeight: 1.5 }}>
                  روى الحديث عن الشعبي، وهو «مُنكر الحديث» عند أئمة الصنعة ولهذا فالإسناد ضعيف.
                </div>
              </div>
            </Pop>
          </AbsoluteFill>
        </Sequence>
      )}

      {/* Card 4: 50.0s - 59.5s | Al-Sha'bi & Masrooq */}
      {currentTime >= 50.0 && currentTime < 59.5 && (
        <Sequence from={sec(50.0)} durationInFrames={sec(59.5) - sec(50.0)}>
          <AbsoluteFill style={{ top: 1240, bottom: 250, padding: "0 45px", direction: "rtl", pointerEvents: "none" }}>
            <Pop at={50.0}>
              <div
                style={{
                  background: `linear-gradient(145deg, ${P.parchment} 0%, ${P.cream} 100%)`,
                  borderRadius: 28,
                  padding: "24px 34px",
                  border: `3px solid ${P.olive}`,
                  boxShadow: `0 20px 50px rgba(0,0,0,0.6)`,
                }}
              >
                <div style={{ display: "inline-block", background: P.olive, color: P.parchment, fontFamily: cairo, fontSize: 23, fontWeight: 900, padding: "6px 20px", borderRadius: 20, marginBottom: 12 }}>
                  📜 أئمة التابعين في السند
                </div>
                <div style={{ fontFamily: lalezar, fontSize: 38, color: P.walnut, lineHeight: 1.3, marginBottom: 10 }}>
                  الإمام الشعبي (ت ١٠٥ هـ) • مسروق (ت ٦٢ هـ)
                </div>
                <div style={{ fontFamily: cairo, fontSize: 24, fontWeight: 700, color: P.leather, lineHeight: 1.5 }}>
                  مسروق بن الأجدع والشعبي كلاهما من كبار الأئمة الثقات الأثبات.
                </div>
              </div>
            </Pop>
          </AbsoluteFill>
        </Sequence>
      )}

      {/* Card 5: 60.5s - 70.5s | Hadith of Aisha */}
      {currentTime >= 60.5 && currentTime < 70.5 && (
        <Sequence from={sec(60.5)} durationInFrames={sec(70.5) - sec(60.5)}>
          <AbsoluteFill style={{ top: 1240, bottom: 250, padding: "0 45px", direction: "rtl", pointerEvents: "none" }}>
            <Pop at={60.5}>
              <div
                style={{
                  background: `linear-gradient(145deg, ${P.parchment} 0%, ${P.cream} 100%)`,
                  borderRadius: 28,
                  padding: "26px 36px",
                  border: `3px solid ${P.gold}`,
                  boxShadow: `0 20px 50px rgba(0,0,0,0.6)`,
                }}
              >
                <div style={{ display: "inline-block", background: P.leather, color: P.gold, fontFamily: cairo, fontSize: 23, fontWeight: 900, padding: "6px 20px", borderRadius: 20, marginBottom: 12 }}>
                  ✨ حديث أم المؤمنين عائشة رضي الله عنها
                </div>
                <div style={{ fontFamily: lalezar, fontSize: 36, color: P.walnut, lineHeight: 1.45, textAlign: "justify" }}>
                  «رُبَمَا اغْتَسَلَ النَّبِيُّ ﷺ مِنَ الجَنَابَةِ ثُمَّ جَاءَ فَاسْتَدْفَأَ بِي، فَضَمَمْتُهُ إِلَيَّ وَلَمْ أَغْتَسِلْ»
                </div>
              </div>
            </Pop>
          </AbsoluteFill>
        </Sequence>
      )}

      {/* Card 6: 72.0s - 100.0s | Linguistic benefit: Rubbama */}
      {currentTime >= 72.0 && currentTime < 100.0 && (
        <Sequence from={sec(72.0)} durationInFrames={sec(100.0) - sec(72.0)}>
          <AbsoluteFill style={{ top: 1240, bottom: 250, padding: "0 45px", direction: "rtl", pointerEvents: "none" }}>
            <Pop at={72.0}>
              <div
                style={{
                  background: `linear-gradient(145deg, ${P.parchment} 0%, ${P.cream} 100%)`,
                  borderRadius: 28,
                  padding: "24px 34px",
                  border: `3px solid ${P.olive}`,
                  boxShadow: `0 20px 50px rgba(0,0,0,0.6)`,
                }}
              >
                <div style={{ display: "inline-block", background: P.deepOlive, color: P.gold, fontFamily: cairo, fontSize: 23, fontWeight: 900, padding: "6px 20px", borderRadius: 20, marginBottom: 12 }}>
                  💡 دلالة لفظ «رُبَّمَا» في لغة العرب
                </div>
                <div style={{ fontFamily: lalezar, fontSize: 38, color: P.walnut, lineHeight: 1.3, marginBottom: 10 }}>
                  تأتي للشك والتقليل، وتأتي للتكثير!
                </div>
                <div style={{ fontFamily: cairo, fontSize: 24, fontWeight: 700, color: P.leather, lineHeight: 1.5 }}>
                  المعنى المقصود هنا: <span style={{ color: P.olive, fontWeight: 900 }}>«كثيراً ما كان يحدث ذلك»</span> في بيت النبوة، وتفهم من سياق الكلام.
                </div>
              </div>
            </Pop>
          </AbsoluteFill>
        </Sequence>
      )}

      {/* Card 7: 104.0s - 115.5s | Prophetic warmth and affection */}
      {currentTime >= 104.0 && currentTime < 115.5 && (
        <Sequence from={sec(104.0)} durationInFrames={sec(115.5) - sec(104.0)}>
          <AbsoluteFill style={{ top: 1240, bottom: 250, padding: "0 45px", direction: "rtl", pointerEvents: "none" }}>
            <Pop at={104.0}>
              <div
                style={{
                  background: `linear-gradient(145deg, ${P.parchment} 0%, ${P.cream} 100%)`,
                  borderRadius: 28,
                  padding: "26px 36px",
                  border: `3px solid ${P.gold}`,
                  boxShadow: `0 20px 50px rgba(0,0,0,0.6)`,
                }}
              >
                <div style={{ display: "inline-block", background: P.leather, color: P.gold, fontFamily: cairo, fontSize: 23, fontWeight: 900, padding: "6px 20px", borderRadius: 20, marginBottom: 12 }}>
                  ❤️ من هدي النبوة في البيت
                </div>
                <div style={{ fontFamily: lalezar, fontSize: 38, color: P.walnut, lineHeight: 1.35, marginBottom: 10 }}>
                  «فَاسْتَدْفَأَ بِي، فَضَمَمْتُهُ إِلَيَّ وَلَمْ أَغْتَسِلْ»
                </div>
                <div style={{ fontFamily: cairo, fontSize: 24, fontWeight: 700, color: P.oak, lineHeight: 1.5 }}>
                  أي احتضنها النبي ﷺ واستدفأ بها قبل أن تغتسل هي رضي الله عنها، من تمام الألفة والمودة.
                </div>
              </div>
            </Pop>
          </AbsoluteFill>
        </Sequence>
      )}

      {/* Card 8: 117.0s - 131.6s | The Fiqh Ruling & Conclusion */}
      {currentTime >= 117.0 && (
        <Sequence from={sec(117.0)} durationInFrames={sec(131.6) - sec(117.0)}>
          <AbsoluteFill style={{ top: 1240, bottom: 250, padding: "0 45px", direction: "rtl", pointerEvents: "none" }}>
            <Pop at={117.0}>
              <div
                style={{
                  background: `linear-gradient(145deg, ${P.parchment} 0%, ${P.cream} 100%)`,
                  borderRadius: 28,
                  padding: "26px 36px",
                  border: `3px solid ${P.gold}`,
                  boxShadow: `0 20px 50px rgba(0,0,0,0.6)`,
                }}
              >
                <div style={{ display: "inline-block", background: P.olive, color: P.parchment, fontFamily: cairo, fontSize: 23, fontWeight: 900, padding: "6px 20px", borderRadius: 20, marginBottom: 12 }}>
                  ⚖️ الحكم الفقهي وخلاصة الباب
                </div>
                <div style={{ fontFamily: lalezar, fontSize: 40, color: P.walnut, lineHeight: 1.3, marginBottom: 10 }}>
                  الحكم: جائز باتفاق أهل العلم
                </div>
                <div style={{ fontFamily: cairo, fontSize: 24, fontWeight: 700, color: P.leather, lineHeight: 1.5, marginBottom: 10 }}>
                  الحديث ضعيف الإسناد، لكن معناه مقبول عند العلماء: فالمسلم لا ينجس وبدن الجنب طاهر.
                </div>
                <div style={{ fontFamily: cairo, fontSize: 22, fontWeight: 800, color: P.deepOlive }}>
                  قال الإمام الترمذي: «وهو قول غير واحد من أهل العلم»
                </div>
              </div>
            </Pop>
          </AbsoluteFill>
        </Sequence>
      )}

      {/* Subtitles: Placed at bottom (y ~ 1700) with safe padding */}
      {activeWord && (
        <div
          style={{
            position: "absolute",
            bottom: 70,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            padding: "0 40px",
            direction: "rtl",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              background: "rgba(29, 20, 14, 0.92)",
              border: `2px solid ${P.gold}`,
              borderRadius: 22,
              padding: "12px 30px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span
              style={{
                fontFamily: cairo,
                fontSize: 34,
                fontWeight: 900,
                color: P.parchment,
                textShadow: "0 2px 8px rgba(0,0,0,0.8)",
              }}
            >
              {activeWord.w}
            </span>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
