import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { CameraRig, buildKeys, camAt } from "./CameraRig";
import { NameTag, NAME_FONT_LAT } from "./NameTag";
import { DigitRoll, } from "./DigitRoll";
import { QAProbe } from "./QAProbe";
import { easeOut } from "./motion";

/**
 * عرض تجريبي لأدوات الموشن التوضيحي المستقل (مرجعي): كاميرا مشتركة تسافر ثبات ← سفر ← ثبات بين محطات،
 * وبطاقات أسماء ثنائية اللغة لا تظهر إلا حين يقترب التقريب منها بما يكفي لقراءتها، وعدّاد سنة، ومسار يُرسم.
 * الأسماء هنا مثال فقط (حطين، القدس، صلاح الدين).
 */
export const EXT_DEMO_FRAMES = 290;
const VIEW = { w: 1920, h: 1080 };
const WORLD = { w: 3000, h: 1800 };
const C = { sea: "#a9d4e2", land: "#f7f0dc", land2: "#efe3c3", accent: "#d98a1f", red: "#c8402f", ink: "#1f3550", panel: "rgba(255,252,244,0.96)" };

const HATTIN = { x: 1900, y: 700 };
const QUDS = { x: 1000, y: 1100 };

const KEYS = buildKeys(
  [
    { fx: 1500, fy: 900, zoom: 0.64, hold: 40 },
    { fx: HATTIN.x, fy: HATTIN.y - 40, zoom: 1.1, hold: 70 },
    { fx: QUDS.x + 300, fy: QUDS.y - 60, zoom: 0.95, hold: 70 },
    { fx: 1500, fy: 900, zoom: 0.64, hold: 40 },
  ],
  22,
);

const Pop: React.FC<{ at: number; children: React.ReactNode; x: number; y: number }> = ({ at, children, x, y }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const k = easeOut((f - at) / 14);
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) translateY(${(1 - k) * 40}px) scale(${0.9 + 0.1 * k})` }}>{children}</div>
  );
};

export const ExtDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const { zoom } = camAt(KEYS, frame);
  const readable = zoom >= 0.9;
  const routeLen = 1100;
  const draw = interpolate(frame, [150, 205], [routeLen, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: C.sea }}>
      <CameraRig viewW={VIEW.w} viewH={VIEW.h} keys={KEYS} bg={C.sea}>
        <svg width={WORLD.w} height={WORLD.h} style={{ position: "absolute", left: 0, top: 0 }}>
          <path d="M300 1500 C 500 900, 900 700, 1300 650 S 2100 300, 2500 500 S 2800 1200, 2300 1500 S 800 1700, 300 1500 Z" fill={C.land} />
          <path d="M1250 1100 C 1500 900, 1900 950, 2100 1100 S 1800 1400, 1250 1100 Z" fill={C.land2} />
          <path d={`M ${QUDS.x} ${QUDS.y} C 1300 1000, 1600 850, ${HATTIN.x} ${HATTIN.y}`} fill="none" stroke={C.red} strokeWidth={10} strokeLinecap="round" strokeDasharray={routeLen} strokeDashoffset={draw} />
          <circle cx={HATTIN.x} cy={HATTIN.y} r={26} fill={C.accent} />
          <circle cx={QUDS.x} cy={QUDS.y} r={26} fill={C.ink} />
        </svg>
        {readable && frame >= 62 && frame < 150 && (
          <Pop at={62} x={HATTIN.x} y={HATTIN.y - 150}>
            <NameTag id="حطين" ar="حطين" lat="Hattin" panel={C.panel} ink={C.ink} accent={C.accent} />
          </Pop>
        )}
        {readable && frame >= 70 && frame < 150 && (
          <Pop at={70} x={HATTIN.x + 330} y={HATTIN.y + 20}>
            <span data-qa="سنة حطين" style={{ display: "inline-block", padding: "10px 30px", background: "rgba(255,252,244,0.96)", borderRadius: 18, borderBottom: `6px solid ${C.red}` }}>
              <DigitRoll value="1187" fontSize={84} color={C.ink} delay={0} fontFamily={NAME_FONT_LAT} />
            </span>
          </Pop>
        )}
        {readable && frame >= 170 && (
          <Pop at={170} x={QUDS.x} y={QUDS.y - 150}>
            <NameTag id="القدس" ar="القدس" lat="Jerusalem" panel={C.panel} ink={C.ink} accent={C.accent} />
          </Pop>
        )}
        {readable && frame >= 185 && (
          <Pop at={185} x={QUDS.x + 620} y={QUDS.y + 190}>
            <NameTag id="صلاح الدين" ar="صلاح الدين" lat="Salah ad-Din" panel={C.panel} ink={C.ink} accent={C.red} scale={0.9} />
          </Pop>
        )}
      </CameraRig>
      <QAProbe margin={30} />
    </AbsoluteFill>
  );
};
