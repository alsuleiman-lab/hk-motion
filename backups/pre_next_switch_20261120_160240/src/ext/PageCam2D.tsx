import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

export type PageKey = { frame: number; cx: number; cy: number; zoom: number; rotX?: number; rotY?: number; rotZ?: number; persp?: number };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * كاميرا صفحة: صورة صفحة كاملة (كتاب، موقع، وثيقة) تُعامل مستوياً في الفضاء، والكاميرا تجول عليها.
 * (cx, cy) نقطة الصفحة المصوَّبة إلى مركز الإطار، و`zoom` التقريب، ودوران اختياري لزاوية جانبية.
 * مكيّفة من مكتبة خارجية: تقيس الإطار من إعداد التركيبة (عرضي أو طولي) لا من 1920×1080 ثابتة.
 * أبناؤها بإحداثيات الصفحة (بكسل) فيوضعون عليها: تظليل سطر، إطار، سهم.
 */
export const PageCam2D: React.FC<{
  src: string;
  pageW: number;
  pageH: number;
  keys: PageKey[];
  children?: React.ReactNode;
  bg?: string;
  ease?: (t: number) => number;
}> = ({ src, pageW, pageH, keys, children, bg = "#faf7f2", ease = Easing.bezier(0.33, 0, 0.15, 1) }) => {
  const frame = useCurrentFrame();
  const { width: vw, height: vh } = useVideoConfig();
  let a = keys[0];
  let b = keys[keys.length - 1];
  for (let i = 0; i < keys.length - 1; i++) {
    if (frame >= keys[i].frame && frame <= keys[i + 1].frame) {
      a = keys[i];
      b = keys[i + 1];
      break;
    }
  }
  const t =
    a.frame === b.frame
      ? 1
      : interpolate(frame, [a.frame, b.frame], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const cx = lerp(a.cx, b.cx, t);
  const cy = lerp(a.cy, b.cy, t);
  const zoom = lerp(a.zoom, b.zoom, t);
  const rotX = lerp(a.rotX ?? 0, b.rotX ?? 0, t);
  const rotY = lerp(a.rotY ?? 0, b.rotY ?? 0, t);
  const rotZ = lerp(a.rotZ ?? 0, b.rotZ ?? 0, t);
  const persp = lerp(a.persp ?? 1400, b.persp ?? 1400, t);
  const has3D = keys.some((k) => k.rotX !== undefined || k.rotY !== undefined || k.rotZ !== undefined);
  const img = <Img src={staticFile(src)} style={{ position: "absolute", width: pageW, height: pageH }} />;
  if (!has3D) {
    return (
      <AbsoluteFill style={{ overflow: "hidden", backgroundColor: bg }}>
        <div
          style={{
            position: "absolute",
            width: pageW,
            height: pageH,
            transformOrigin: "0 0",
            transform: `translate(${vw / 2 - cx * zoom}px, ${vh / 2 - cy * zoom}px) scale(${zoom})`,
          }}
        >
          {img}
          {children}
        </div>
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: bg }}>
      <div style={{ position: "absolute", inset: 0, perspective: `${persp * zoom}px`, perspectiveOrigin: `${vw / 2}px ${vh / 2}px` }}>
        <div
          style={{
            position: "absolute",
            width: pageW,
            height: pageH,
            zoom,
            transform: `translate(${vw / 2 / zoom - cx}px, ${vh / 2 / zoom - cy}px) rotateY(${rotY}deg) rotateX(${rotX}deg) rotateZ(${rotZ}deg)`,
            transformOrigin: `${cx}px ${cy}px`,
            transformStyle: "preserve-3d",
          }}
        >
          {img}
          {children}
        </div>
      </div>
    </AbsoluteFill>
  );
};
