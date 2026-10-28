import React from "react";
import { AbsoluteFill, Audio, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, Img } from "remotion";
import { loadFont as loadCairo } from "@remotion/google-fonts/Cairo";
import { loadFont as loadLalezar } from "@remotion/google-fonts/Lalezar";
import { SFX_LEVELS } from "./sfxConfig";
import { UterusVectorDiagram, EndometriumLayersDiagram } from "./MedicalVectors";

const { fontFamily: cairo } = loadCairo("normal", { weights: ["700", "800", "900"], subsets: ["arabic", "latin"] });
const { fontFamily: lalezar } = loadLalezar("normal", { weights: ["400"], subsets: ["arabic", "latin"] });

export const MIRACLE_FPS = 30;
export const MIRACLE_DURATION_FRAMES = 10529; // 350.96 s * 30 fps

const sec = (t: number) => Math.round(t * MIRACLE_FPS);

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

const usePop = (at: number, damping = 15) => {
  const f = useCurrentFrame();
  return spring({ frame: f - sec(at), fps: MIRACLE_FPS, config: { damping, stiffness: 170, mass: 0.8 } });
};

const Pop: React.FC<{ at: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ at, children, style }) => {
  const p = usePop(at);
  const opacity = interpolate(p, [0, 0.4, 1], [0, 0.9, 1], { extrapolateRight: "clamp" });
  const scale = interpolate(p, [0, 1], [0.88, 1], { extrapolateRight: "clamp" });
  return <div style={{ opacity, transform: `scale(${scale})`, ...style }}>{children}</div>;
};

/** Cover art in first 3 frames (0.10s) */
const MiracleCover: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 75% 50%, #4a2e1b, #2d1b10 60%, #170d07 100%)`,
        direction: "rtl",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 80px",
        overflow: "hidden",
      }}
    >
      <AbsoluteFill
        style={{
          backgroundImage: "radial-gradient(rgba(247,242,231,0.12) 2px, transparent 2px)",
          backgroundSize: "40px 40px",
          opacity: 0.5,
        }}
      />

      <div style={{ flex: 1.1, zIndex: 2, display: "flex", flexDirection: "column", gap: 24 }}>
        <div
          style={{
            alignSelf: "flex-start",
            background: P.gold,
            color: P.ink,
            fontFamily: cairo,
            fontWeight: 900,
            fontSize: 32,
            padding: "8px 28px",
            borderRadius: 999,
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
          }}
        >
          شرح جامع الترمذي — حديث 125
        </div>

        <div
          style={{
            fontFamily: lalezar,
            fontSize: 92,
            lineHeight: 1.15,
            color: "#ffffff",
            textShadow: "0 10px 30px rgba(0,0,0,0.6)",
          }}
        >
          الإعجاز النبوي الطبي:
          <br />
          <span style={{ color: P.gold }}>«إنما ذلك عِرق»</span>
        </div>

        <div
          style={{
            fontFamily: cairo,
            fontWeight: 800,
            fontSize: 34,
            color: P.parchment,
            maxWidth: 820,
            lineHeight: 1.6,
          }}
        >
          كيف فرّق النبي ﷺ بدقة طبية مذهلة بين دم الحيض والاستحاضة قبل 1400 عام؟
        </div>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 16,
            background: "rgba(255,255,255,0.12)",
            backdropFilter: "blur(10px)",
            border: `2px solid ${P.gold}`,
            padding: "10px 26px",
            borderRadius: 16,
            width: "fit-content",
            marginTop: 10,
          }}
        >
          <div style={{ fontFamily: cairo, fontWeight: 800, fontSize: 26, color: "#ffffff" }}>
            فضيلة الشيخ محمد بن شمس الدين
          </div>
        </div>
      </div>

      <div
        style={{
          width: 580,
          height: 780,
          borderRadius: 40,
          overflow: "hidden",
          border: `8px solid ${P.gold}`,
          boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
          position: "relative",
          zIndex: 2,
        }}
      >
        <Img
          src={staticFile("cover_sheikh.jpg")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "50% 25%",
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

export const LessonMiracleLandscape: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / MIRACLE_FPS;

  return (
    <AbsoluteFill style={{ background: "#150d08" }}>
      {/* 1. Main cut video */}
      <AbsoluteFill>
        <OffthreadVideo src={staticFile("miracle_cut_cut.mp4")} />
      </AbsoluteFill>

      {/* Lower Third for Sheikh's Name (Strictly on the left side at bottom: x=40, y=940) */}
      {((t >= 5 && t < 15) || (t >= 140 && t < 150) || (t >= 310 && t < 320)) && (
        <div
          style={{
            position: "absolute",
            bottom: 34,
            left: 40,
            zIndex: 10,
            pointerEvents: "none",
            direction: "rtl",
          }}
        >
          <Pop at={t < 20 ? 5 : t < 160 ? 140 : 310}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                background: `linear-gradient(90deg, ${P.leather}, ${P.walnut})`,
                border: `2px solid ${P.gold}`,
                borderRadius: 18,
                padding: "8px 24px",
                boxShadow: "0 10px 25px rgba(0,0,0,0.4)",
              }}
            >
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: P.gold }} />
              <div style={{ fontFamily: cairo, fontWeight: 900, fontSize: 24, color: "#ffffff" }}>
                فضيلة الشيخ محمد بن شمس الدين
              </div>
            </div>
          </Pop>
        </div>
      )}

      {/* 2. Left-Side Presentation Panels (Strictly on left: x=40 to 1080. Sheikh is on right x=1150 to 1920) */}
      <div
        style={{
          position: "absolute",
          top: 80,
          left: 40,
          width: 1040,
          height: 860,
          direction: "rtl",
          zIndex: 15,
          pointerEvents: "none",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        {/* Scene 1 (t=1.0s to 22.0s): Hadith Question */}
        {t >= 1.0 && t < 22.0 && (
          <Pop at={1.0}>
            <div
              style={{
                background: `linear-gradient(135deg, ${P.parchment}, ${P.cream})`,
                border: `4px solid ${P.leather}`,
                borderRadius: 32,
                padding: "36px 44px",
                boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
                <span style={{ background: P.leather, color: P.parchment, fontFamily: cairo, fontWeight: 900, fontSize: 24, padding: "4px 18px", borderRadius: 999 }}>
                  سؤال الصحابية
                </span>
                <span style={{ fontFamily: lalezar, fontSize: 40, color: P.walnut }}>
                  فاطمة بنت أبي حبيش رضي الله عنها
                </span>
              </div>
              <div style={{ fontFamily: cairo, fontWeight: 800, fontSize: 36, color: P.ink, lineHeight: 1.6 }}>
                جاءت إلى النبي ﷺ فقالت:
                <br />
                <span style={{ color: P.amber, fontSize: 44, fontWeight: 900 }}>
                  «إني أستحاض فلا أطهر، أفأدع الصلاة؟»
                </span>
              </div>
              <div style={{ marginTop: 20, borderTop: `2px dashed ${P.sand}`, paddingTop: 16, fontFamily: cairo, fontWeight: 700, fontSize: 26, color: P.oak }}>
                دم مستمر دائم النزول، فظنت رضي الله عنها أنه حيض دائم يمنع الصلاة مطلقاً.
              </div>
            </div>
          </Pop>
        )}

        {/* Scene 2 (t=22.5s to 37.5s): The Prophetic Pronouncement */}
        {t >= 22.5 && t < 37.5 && (
          <Pop at={22.5}>
            <div
              style={{
                background: `linear-gradient(135deg, ${P.leather}, ${P.walnut})`,
                border: `4px solid ${P.gold}`,
                borderRadius: 32,
                padding: "40px 48px",
                boxShadow: "0 20px 50px rgba(0,0,0,0.55)",
                textAlign: "center",
              }}
            >
              <div style={{ fontFamily: cairo, fontWeight: 800, fontSize: 32, color: P.sand, marginBottom: 12 }}>
                جواب النبي ﷺ الحاسم:
              </div>
              <div style={{ fontFamily: lalezar, fontSize: 78, color: P.gold, lineHeight: 1.2, textShadow: "0 8px 20px rgba(0,0,0,0.5)" }}>
                «لا، إنما ذلك عِـرْق!»
              </div>
              <div style={{ fontFamily: cairo, fontWeight: 800, fontSize: 34, color: "#ffffff", marginTop: 20, lineHeight: 1.6 }}>
                تشخيص طبي نبوي معجز: ليس دم حيض، بل نزيف وعاء دموي (عِرق) منفجر!
              </div>
            </div>
          </Pop>
        )}

        {/* Scene 3 (t=38.0s to 68.0s): Scientific Wonder Comparison */}
        {t >= 38.0 && t < 68.0 && (
          <Pop at={38.0}>
            <div
              style={{
                background: `linear-gradient(135deg, ${P.parchment}, ${P.cream})`,
                border: `4px solid ${P.olive}`,
                borderRadius: 32,
                padding: "36px 44px",
                boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
              }}
            >
              <div style={{ fontFamily: lalezar, fontSize: 48, color: P.walnut, marginBottom: 14 }}>
                دقة التعبير النبوي ودلائل الوحي:
              </div>
              <div style={{ fontFamily: cairo, fontWeight: 800, fontSize: 30, color: P.ink, lineHeight: 1.6 }}>
                كيف فرّق النبي ﷺ بين منشأ دم الحيض ومنشأ دم الاستحاضة قبل 1400 عام؟
              </div>
              <div style={{ marginTop: 24, display: "flex", gap: 20 }}>
                <div style={{ flex: 1, background: "#ffffff", padding: "18px 22px", borderRadius: 20, border: `2px solid ${P.sand}`, boxShadow: "0 6px 16px rgba(0,0,0,0.06)" }}>
                  <div style={{ fontFamily: lalezar, fontSize: 32, color: P.oak }}>دم الحيض (Menses)</div>
                  <div style={{ fontFamily: cairo, fontWeight: 700, fontSize: 24, color: P.ink, marginTop: 6 }}>
                    انسلاخ وتفتت بطانة الرحم المخاطية الإسفنجية
                  </div>
                </div>
                <div style={{ flex: 1, background: `rgba(79, 99, 69, 0.15)`, padding: "18px 22px", borderRadius: 20, border: `2px solid ${P.olive}`, boxShadow: "0 6px 16px rgba(0,0,0,0.06)" }}>
                  <div style={{ fontFamily: lalezar, fontSize: 32, color: P.deepOlive }}>دم الاستحاضة (AUB)</div>
                  <div style={{ fontFamily: cairo, fontWeight: 700, fontSize: 24, color: P.ink, marginTop: 6 }}>
                    تمزق وعاء دموي / شُرين دقيق («عِـرْق»)
                  </div>
                </div>
              </div>
            </div>
          </Pop>
        )}

        {/* Scene 4 (t=68.5s to 101.0s): Vector Illustration of Uterus & Endometrium */}
        {t >= 68.5 && t < 101.0 && (
          <Pop at={68.5}>
            <div
              style={{
                background: `linear-gradient(135deg, ${P.parchment}, ${P.cream})`,
                border: `4px solid ${P.leather}`,
                borderRadius: 32,
                padding: "28px 36px",
                boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                gap: 28,
              }}
            >
              {/* Left Side: Medical Vector Diagram */}
              <div style={{ flex: "0 0 460px" }}>
                <UterusVectorDiagram highlightEndometrium={true} w={450} h={340} />
              </div>

              {/* Right Side: Scientific Explanation */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ fontFamily: lalezar, fontSize: 40, color: P.walnut, lineHeight: 1.2 }}>
                  تشريح بطانة الرحم (Endometrium)
                </div>
                <div style={{ fontFamily: cairo, fontWeight: 800, fontSize: 26, color: P.ink, lineHeight: 1.6 }}>
                  طبقة مخاطية إسفنجية تبطن جدار الرحم الداخلي، تتضخم وتستعد بعد كل مرحلة تبويض لاستقبال وتغذية البويضة.
                </div>
                <div style={{ background: `rgba(110, 71, 42, 0.1)`, padding: "12px 20px", borderRadius: 14, borderRight: `5px solid ${P.leather}` }}>
                  <div style={{ fontFamily: cairo, fontWeight: 900, fontSize: 22, color: P.leather }}>
                    عروق دموية خاصة:
                  </div>
                  <div style={{ fontFamily: cairo, fontWeight: 700, fontSize: 20, color: P.oak, marginTop: 4 }}>
                    تحتوي البطانة على شبكة أوعية دموية دقيقة متخصصة لتغذية أنسجة الحمل.
                  </div>
                </div>
              </div>
            </div>
          </Pop>
        )}

        {/* Scene 5 (t=101.5s to 131.5s): Estrogen Hormone & Microscopic Endometrium Layers */}
        {t >= 101.5 && t < 131.5 && (
          <Pop at={101.5}>
            <div
              style={{
                background: `linear-gradient(135deg, ${P.parchment}, ${P.cream})`,
                border: `4px solid ${P.olive}`,
                borderRadius: 32,
                padding: "24px 34px",
                boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                gap: 24,
              }}
            >
              {/* Vector diagram of Endometrium growing */}
              <div style={{ flex: "0 0 500px" }}>
                <EndometriumLayersDiagram thicknessMm={12} showSpiralVessels={true} w={490} h={350} />
              </div>

              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ fontFamily: lalezar, fontSize: 38, color: P.deepOlive, lineHeight: 1.2 }}>
                  هرمون الإستروجين (Estrogen)
                </div>
                <div style={{ fontFamily: cairo, fontWeight: 800, fontSize: 25, color: P.ink, lineHeight: 1.5 }}>
                  الهرمون المسؤول عن بناء البطانة وتحفيز نموها وزيادة سماكتها:
                </div>
                <div style={{ background: "#ffffff", padding: "14px 20px", borderRadius: 16, border: `2px solid ${P.sand}` }}>
                  <div style={{ fontFamily: cairo, fontWeight: 900, fontSize: 24, color: P.amber }}>
                    تدرج السماكة:
                  </div>
                  <div style={{ fontFamily: cairo, fontWeight: 800, fontSize: 22, color: P.walnut, marginTop: 4 }}>
                    تبدأ من 1 ملم ثم تصل إلى 10 ملم وحتى 15 ملم بحسب جسم المرأة.
                  </div>
                </div>
              </div>
            </div>
          </Pop>
        )}

        {/* Scene 6 (t=132.0s to 152.0s): Progesterone Hormone Card */}
        {t >= 132.0 && t < 152.0 && (
          <Pop at={132.0}>
            <div
              style={{
                background: `linear-gradient(135deg, ${P.parchment}, ${P.cream})`,
                border: `4px solid ${P.leather}`,
                borderRadius: 32,
                padding: "36px 44px",
                boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
              }}
            >
              <div style={{ fontFamily: lalezar, fontSize: 46, color: P.walnut, marginBottom: 12 }}>
                هرمون البروجستيرون (Progesterone):
              </div>
              <div style={{ fontFamily: cairo, fontWeight: 800, fontSize: 32, color: P.ink, lineHeight: 1.6 }}>
                الهرمون المسؤول عن <span style={{ color: P.amber, fontWeight: 900 }}>تثبيت وتماسك</span> بطانة الرحم:
              </div>
              <div style={{ marginTop: 24, display: "flex", gap: 20 }}>
                <div style={{ flex: 1, background: "#ffffff", padding: "18px 24px", borderRadius: 20, border: `2px solid ${P.sand}` }}>
                  <div style={{ fontFamily: lalezar, fontSize: 32, color: P.amber }}>الإستروجين:</div>
                  <div style={{ fontFamily: cairo, fontWeight: 700, fontSize: 24, color: P.ink, marginTop: 4 }}>
                    يبني البطانة ويحفز نموها وتضخمها
                  </div>
                </div>
                <div style={{ flex: 1, background: `rgba(79, 99, 69, 0.15)`, padding: "18px 24px", borderRadius: 20, border: `2px solid ${P.olive}` }}>
                  <div style={{ fontFamily: lalezar, fontSize: 32, color: P.deepOlive }}>البروجستيرون:</div>
                  <div style={{ fontFamily: cairo, fontWeight: 700, fontSize: 24, color: P.ink, marginTop: 4 }}>
                    يثبت البطانة ويجعلها متماسكة وقوية
                  </div>
                </div>
              </div>
            </div>
          </Pop>
        )}

        {/* Scene 7 (t=152.5s to 180.5s): Normal Menses Mechanism */}
        {t >= 152.5 && t < 180.5 && (
          <Pop at={152.5}>
            <div
              style={{
                background: `linear-gradient(135deg, ${P.parchment}, ${P.cream})`,
                border: `4px solid ${P.leather}`,
                borderRadius: 32,
                padding: "36px 44px",
                boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
              }}
            >
              <div style={{ fontFamily: lalezar, fontSize: 44, color: P.walnut, marginBottom: 12 }}>
                كيف يحدث الحيض الطبيعي؟
              </div>
              <div style={{ fontFamily: cairo, fontWeight: 800, fontSize: 30, color: P.ink, lineHeight: 1.6 }}>
                عند عدم حدوث حمل، يهبط هرمونا الإستروجين والبروجستيرون هبوطاً مفاجئاً:
              </div>
              <div style={{ marginTop: 20, background: "#ffffff", borderRadius: 20, padding: "20px 28px", border: `2px solid ${P.sand}` }}>
                <div style={{ fontFamily: cairo, fontWeight: 900, fontSize: 28, color: P.amber }}>
                  تفتت أنسجة البطانة وسيلانها:
                </div>
                <div style={{ fontFamily: cairo, fontWeight: 700, fontSize: 24, color: P.ink, marginTop: 6, lineHeight: 1.5 }}>
                  تتحلل أنسجة البطانة الإسفنجية بفعل إنزيمات إلى بروتينات مجهرية، فتسيل مع الدم مؤكسدة ثخينة غليظة، وليست مثل الدم الطبيعي الجاري.
                </div>
              </div>
            </div>
          </Pop>
        )}

        {/* Scene 8 (t=181.0s to 207.5s): Spiral Arterioles Vector */}
        {t >= 181.0 && t < 207.5 && (
          <Pop at={181.0}>
            <div
              style={{
                background: `linear-gradient(135deg, ${P.parchment}, ${P.cream})`,
                border: `4px solid ${P.olive}`,
                borderRadius: 32,
                padding: "24px 34px",
                boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                gap: 24,
              }}
            >
              <div style={{ flex: "0 0 500px" }}>
                <EndometriumLayersDiagram thicknessMm={14} showSpiralVessels={true} w={490} h={350} />
              </div>

              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ fontFamily: lalezar, fontSize: 38, color: P.deepOlive, lineHeight: 1.2 }}>
                  الشُّرينات الحلزونية (Spiral Arterioles)
                </div>
                <div style={{ fontFamily: cairo, fontWeight: 800, fontSize: 25, color: P.ink, lineHeight: 1.5 }}>
                  عروق دقيقة ملتفة على شكل حلزوني قابلة للتمدد لتواكب نمو البطانة.
                </div>
                <div style={{ background: `rgba(79, 99, 69, 0.12)`, padding: "14px 20px", borderRadius: 16, borderRight: `5px solid ${P.olive}` }}>
                  <div style={{ fontFamily: cairo, fontWeight: 900, fontSize: 22, color: P.deepOlive }}>
                    إعجاز الوصف النبوي:
                  </div>
                  <div style={{ fontFamily: cairo, fontWeight: 700, fontSize: 20, color: P.ink, marginTop: 4 }}>
                    هذه العروق الدقيقة هي أصل الدم في الاستحاضة: «إنما ذلك عِرق»!
                  </div>
                </div>
              </div>
            </div>
          </Pop>
        )}

        {/* Scene 9 (t=208.0s to 247.5s): Abnormal Uterine Bleeding (AUB) */}
        {t >= 208.0 && t < 247.5 && (
          <Pop at={208.0}>
            <div
              style={{
                background: `linear-gradient(135deg, ${P.parchment}, ${P.cream})`,
                border: `4px solid ${P.leather}`,
                borderRadius: 32,
                padding: "36px 44px",
                boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <span style={{ fontFamily: lalezar, fontSize: 44, color: P.walnut }}>
                  الاستحاضة: نزيف الرحم غير الطبيعي
                </span>
                <span style={{ background: P.leather, color: P.parchment, fontFamily: cairo, fontWeight: 900, fontSize: 22, padding: "4px 18px", borderRadius: 999 }}>
                  AUB
                </span>
              </div>
              <div style={{ fontFamily: cairo, fontWeight: 800, fontSize: 30, color: P.ink, lineHeight: 1.6 }}>
                خلل هرموني: إفراز الإستروجين دون إفراز البروجستيرون (لغياب التبويض):
              </div>
              <div style={{ marginTop: 20, background: "#ffffff", padding: "20px 28px", borderRadius: 20, border: `2px solid ${P.sand}` }}>
                <div style={{ fontFamily: cairo, fontWeight: 900, fontSize: 26, color: P.amber }}>
                  تضخم البطانة دون تثبيت!
                </div>
                <div style={{ fontFamily: cairo, fontWeight: 700, fontSize: 24, color: P.ink, marginTop: 6, lineHeight: 1.5 }}>
                  تظل البطانة تكبر بفعل الإستروجين حتى تعجز الشُرينات الحلزونية عن التمدد، فتصبح هشة وعرضة للانفجار في أي لحظة.
                </div>
              </div>
            </div>
          </Pop>
        )}

        {/* Scene 10 (t=248.0s to 282.5s): Ruptured Vessel Vector Diagram */}
        {t >= 248.0 && t < 282.5 && (
          <Pop at={248.0}>
            <div
              style={{
                background: `linear-gradient(135deg, ${P.parchment}, ${P.cream})`,
                border: `4px solid ${P.amber}`,
                borderRadius: 32,
                padding: "24px 34px",
                boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                gap: 24,
              }}
            >
              {/* Ruptured Vessel Vector Diagram */}
              <div style={{ flex: "0 0 500px" }}>
                <EndometriumLayersDiagram thicknessMm={15} showSpiralVessels={true} ruptured={true} w={490} h={350} />
              </div>

              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ fontFamily: lalezar, fontSize: 40, color: P.walnut, lineHeight: 1.2 }}>
                  «إنما ذلك عِــرْق!»
                </div>
                <div style={{ fontFamily: cairo, fontWeight: 800, fontSize: 25, color: P.ink, lineHeight: 1.5 }}>
                  تنجرح الشُرينات الحلزونية الدقيقة وتتمزق، فيخرج منها دم أحمر ناصع سائل.
                </div>
                <div style={{ background: `rgba(184, 125, 42, 0.15)`, padding: "14px 20px", borderRadius: 16, borderRight: `5px solid ${P.amber}` }}>
                  <div style={{ fontFamily: cairo, fontWeight: 900, fontSize: 22, color: P.amber }}>
                    نزيف وعائي حقيقي:
                  </div>
                  <div style={{ fontFamily: cairo, fontWeight: 700, fontSize: 20, color: P.ink, marginTop: 4 }}>
                    ليس حيضاً ولا انسلاخ بطانة، بل جرح وعاء دموي منفجر.
                  </div>
                </div>
              </div>
            </div>
          </Pop>
        )}

        {/* Scene 11 (t=283.0s to 321.5s): Doctors Testimony */}
        {t >= 283.0 && t < 321.5 && (
          <Pop at={283.0}>
            <div
              style={{
                background: `linear-gradient(135deg, ${P.parchment}, ${P.cream})`,
                border: `4px solid ${P.olive}`,
                borderRadius: 32,
                padding: "36px 44px",
                boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
              }}
            >
              <div style={{ fontFamily: lalezar, fontSize: 46, color: P.walnut, marginBottom: 12 }}>
                شهادة الأطباء وأسرار النبوة:
              </div>
              <div style={{ fontFamily: cairo, fontWeight: 800, fontSize: 30, color: P.ink, lineHeight: 1.6 }}>
                لو سألت طبيباً غير مختص بالنسائية عن منشأ دم الاستحاضة لربما خفي عليه سببها..
              </div>
              <div style={{ marginTop: 20, background: "#ffffff", padding: "20px 28px", borderRadius: 20, border: `2px solid ${P.sand}` }}>
                <div style={{ fontFamily: cairo, fontWeight: 900, fontSize: 28, color: P.deepOlive }}>
                  فما بالك بنبي أُمّي ﷺ قبل 1400 عام؟!
                </div>
                <div style={{ fontFamily: cairo, fontWeight: 700, fontSize: 24, color: P.ink, marginTop: 6, lineHeight: 1.5 }}>
                  ينطق بالحق والوحي الصادق: ليس حيضاً، بل خروج دم من «عِرق».
                </div>
              </div>
            </div>
          </Pop>
        )}

        {/* Scene 12 (t=322.0s to 350.5s): Final Summary Comparison */}
        {t >= 322.0 && (
          <Pop at={322.0}>
            <div
              style={{
                background: `linear-gradient(135deg, ${P.parchment}, ${P.cream})`,
                border: `4px solid ${P.leather}`,
                borderRadius: 32,
                padding: "36px 44px",
                boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
              }}
            >
              <div style={{ fontFamily: lalezar, fontSize: 48, color: P.walnut, textAlign: "center", marginBottom: 16 }}>
                خلاصة الإعجاز الطبي النبوي:
              </div>
              <div style={{ display: "flex", gap: 20, marginTop: 12 }}>
                <div style={{ flex: 1, background: "#ffffff", padding: "20px 24px", borderRadius: 20, border: `2px solid ${P.sand}` }}>
                  <div style={{ fontFamily: lalezar, fontSize: 34, color: P.oak }}>دم الحيضة:</div>
                  <div style={{ fontFamily: cairo, fontWeight: 700, fontSize: 24, color: P.ink, marginTop: 6, lineHeight: 1.5 }}>
                    تفتت وانسلاخ بطانة الرحم بأكملها مع هبوط الهرمونات.
                  </div>
                </div>
                <div style={{ flex: 1, background: `rgba(79, 99, 69, 0.15)`, padding: "20px 24px", borderRadius: 20, border: `2px solid ${P.olive}` }}>
                  <div style={{ fontFamily: lalezar, fontSize: 34, color: P.deepOlive }}>دم الاستحاضة:</div>
                  <div style={{ fontFamily: cairo, fontWeight: 700, fontSize: 24, color: P.ink, marginTop: 6, lineHeight: 1.5 }}>
                    سيلان دم ناصع مستمر ناتج عن تمزق وعاء دموي («عِـرْق»).
                  </div>
                </div>
              </div>
            </div>
          </Pop>
        )}
      </div>

      {/* 3. Audio Sound Effects at key beats */}
      <Sequence from={sec(22.5)} durationInFrames={sec(1.5)}>
        <Audio src={staticFile("sfx/chime.wav")} volume={SFX_LEVELS.chime} />
      </Sequence>
      <Sequence from={sec(38.0)} durationInFrames={sec(1.5)}>
        <Audio src={staticFile("sfx/whoosh.wav")} volume={SFX_LEVELS.whoosh} />
      </Sequence>
      <Sequence from={sec(68.5)} durationInFrames={sec(1.5)}>
        <Audio src={staticFile("sfx/whoosh.wav")} volume={SFX_LEVELS.whoosh} />
      </Sequence>
      <Sequence from={sec(101.5)} durationInFrames={sec(1.5)}>
        <Audio src={staticFile("sfx/chime.wav")} volume={SFX_LEVELS.chime} />
      </Sequence>
      <Sequence from={sec(152.5)} durationInFrames={sec(1.5)}>
        <Audio src={staticFile("sfx/whoosh.wav")} volume={SFX_LEVELS.whoosh} />
      </Sequence>
      <Sequence from={sec(181.0)} durationInFrames={sec(1.5)}>
        <Audio src={staticFile("sfx/whoosh.wav")} volume={SFX_LEVELS.whoosh} />
      </Sequence>
      <Sequence from={sec(248.0)} durationInFrames={sec(1.5)}>
        <Audio src={staticFile("sfx/chime.wav")} volume={SFX_LEVELS.chime} />
      </Sequence>
      <Sequence from={sec(322.0)} durationInFrames={sec(1.5)}>
        <Audio src={staticFile("sfx/whoosh.wav")} volume={SFX_LEVELS.whoosh} />
      </Sequence>

      {/* 4. Cover Image in first 3 frames (0.10s) */}
      <Sequence  durationInFrames={3} layout="none">
        <MiracleCover />
      </Sequence>
    </AbsoluteFill>
  );
};
