import React from "react";
import { Audio, Sequence, staticFile } from "remotion";

/**
 * مؤثرات التمارين المرجعية (طلب المستخدم 2026-11-19: «والمؤثرات الصوتية؟»): لكل حركة كبرى مؤثرها عند إطارها.
 * الملفات في public/ref_sfx من مكتبتنا المعتمدة (khaam_sfx)، مهدّأة إلى قمة −26 dBFS بأداة sfx_soft. بلا موسيقى.
 * cue = [إطار البداية، اسم الملف بلا امتداد، الحجم الاختياري]
 */
export type Cue = [number, string, number?];
export const SfxTrack: React.FC<{ cues: Cue[] }> = ({ cues }) => (
  <>
    {cues.map(([at, name, vol = 1], i) => (
      <Sequence key={i} from={at} durationInFrames={150} layout="none">
        <Audio src={staticFile(`ref_sfx/${name}.wav`)} volume={vol} />
      </Sequence>
    ))}
  </>
);
