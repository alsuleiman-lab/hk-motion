import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";

/** مفتاح كاميرا: عند `frame` تكون الكاميرا مركّزة على النقطة (fx, fy) من العالم بتقريب `zoom`. */
export type CamKey = { frame: number; fx: number; fy: number; zoom: number };

/**
 * يبني مفاتيح «ثبات ← سفر ← ثبات» من محطات: كل محطة تُمسك `hold` إطاراً ثم تسافر إلى التالية في `travel` إطاراً (14–24 المعتاد).
 * المحطة الأخيرة تُمسك فقط. مفتاحان متجاوران بالقيمة نفسها = ثبات.
 */
export const buildKeys = (
  stops: { fx: number; fy: number; zoom: number; hold: number }[],
  travel = 20,
  start = 0,
): CamKey[] => {
  const keys: CamKey[] = [];
  let f = start;
  stops.forEach((s, i) => {
    keys.push({ frame: f, fx: s.fx, fy: s.fy, zoom: s.zoom });
    f += s.hold;
    keys.push({ frame: f, fx: s.fx, fy: s.fy, zoom: s.zoom });
    if (i < stops.length - 1) f += travel;
  });
  return keys;
};

/** حالة الكاميرا عند إطار معيّن (دالة نقية) — بتخفيف تكعيبي بين المفتاحين المحيطين. */
export const camAt = (keys: CamKey[], frame: number, ease: (t: number) => number = Easing.inOut(Easing.cubic)) => {
  const frames = keys.map((k) => k.frame);
  const e = (key: "fx" | "fy" | "zoom") =>
    interpolate(frame, frames, keys.map((k) => k[key]), { easing: ease, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return { fx: e("fx"), fy: e("fy"), zoom: e("zoom") };
};

/**
 * حامل كاميرا مشترك: عالم واحد أكبر من الإطار (عادة 2–2.5 مثل عرضه) وكاميرا واحدة تتحرك فيه.
 * أبناؤه يُموضَعون بإحداثيات العالم (بكسل، الأصل أعلى اليسار). لا ارتجاف: الكاميرا ثابتة إلا في السفر.
 */
export const CameraRig: React.FC<{
  viewW: number;
  viewH: number;
  keys: CamKey[];
  bg?: string;
  children: React.ReactNode;
}> = ({ viewW, viewH, keys, bg = "transparent", children }) => {
  const frame = useCurrentFrame();
  const { fx, fy, zoom } = camAt(keys, frame);
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: bg }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          transformOrigin: "0 0",
          transform: `translate(${viewW / 2 - fx * zoom}px, ${viewH / 2 - fy * zoom}px) scale(${zoom})`,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};
