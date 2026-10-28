import React from "react";
import { AbsoluteFill } from "remotion";
import { loadFont as fRakkas } from "@remotion/google-fonts/Rakkas";
import { loadFont as fBaloo } from "@remotion/google-fonts/BalooBhaijaan2";
import { loadFont as fKufam } from "@remotion/google-fonts/Kufam";
import { BehindWord2 } from "./BehindWord2";
import { AZ_BEHIND } from "./azPlan";
import headX from "../public/azwin/headx.json";

/** Graphics-only layer (transparent) of the words written BEHIND the speaker (landscape). One 3.8 s window per word; composed behind him with tools/behind_compose.mjs. */
const FONTS = [
  { f: fRakkas(), w: 400, size: 440 },
  { f: fBaloo(), w: 800, size: 460 },
  { f: fKufam(), w: 800, size: 420 },
];
export const AzBehind: React.FC = () => (
  <AbsoluteFill>
    {AZ_BEHIND.map((k, i) => {
      const ft = FONTS[i % 3];
      return <BehindWord2 key={i} text={k.word} font={ft.f} weight={ft.w} nominal={ft.size} fps={30} from={k.offset + 0.35} to={k.offset + 3.45} headX={(headX as number[])[i] ?? 1080} />;
    })}
  </AbsoluteFill>
);
