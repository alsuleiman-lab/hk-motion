import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { HybridHost, VSlot } from "../hybrid/Slot";
import { Captions, Watermark, capPages, type CapWord } from "../cartoon/Overlays";

/**
 * «مبارزة علي» بالأنمي المولَّد محلياً (٢٠٢٦-١١-٢٠): صور بنموذج الصور المحلي ثم تحريك بنموذج الفيديو المحلي، تُلصق بالقطع الحاد في ملف واحد
 * (public/duel/duel_gen_video.mp4) يوضع على كرت الشاشة، وفوقه كابشن كلمات الحوار وعلامة التواصل. الصوت: بدر لعليّ وصوت حسن للكافر + مؤثرات خافتة (≤ ٦).
 */
export const DUELGEN_FPS = 24;
export const DUELGEN_FRAMES = 1440;
const W = 1080, H = 1920;
const KAFIR_AT = 110 / 24, ALI_AT = 226 / 24;

const mk = (start: number, arr: [string, number, number][]): { words: CapWord[] } => ({ words: arr.map(([t, a, b]) => ({ t, at: start + a, to: start + b })) });
const PAGES = capPages([
  mk(KAFIR_AT, [["هل", 0, 0.28], ["من", 0.28, 0.5], ["مبارز؟", 0.5, 1.01]]),
  mk(KAFIR_AT, [["ابرزوا", 1.39, 1.84], ["لنا", 1.84, 2.02], ["أحداً", 2.02, 2.3]]),
  mk(ALI_AT, [["أنا", 0, 0.42], ["أبرز", 0.42, 0.98], ["إليك", 0.98, 1.7]]),
]);

export const AnimeDuelGen: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / DUELGEN_FPS;
  const fade = Math.max(Math.max(0, Math.min(1, 1 - frame / 8)), Math.max(0, Math.min(1, (frame - (DUELGEN_FRAMES - 14)) / 14)));
  return (
    <HybridHost>
      <AbsoluteFill style={{ background: "#000" }}>
        <VSlot src="duel/duel_gen_video.mp4" w={W} h={H} radius={0} vx={0} vy={0} vw={W} vh={H} style={{ left: 0, top: 0 }} grow={0} />
        <Audio src={staticFile("duel/duel_gen_mix.wav")} />
        <Captions t={t} pages={PAGES} />
        <Watermark />
        <AbsoluteFill style={{ background: "#0d0a08", opacity: fade }} />
      </AbsoluteFill>
    </HybridHost>
  );
};
