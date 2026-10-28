import React from "react";
import { AbsoluteFill } from "remotion";
import { loadFont as fRakkas } from "@remotion/google-fonts/Rakkas";
import { loadFont as fBaloo } from "@remotion/google-fonts/BalooBhaijaan2";
import { loadFont as fKufam } from "@remotion/google-fonts/Kufam";
import { BehindWord2 } from "./BehindWord2";
import words from "../public/tir_behind.json";
import headX from "../public/tir_headx.json";

/** Graphics-only layer (transparent) for the lesson's "behind the body" words. Each window is `len` seconds; its word appears 0.35 s in and leaves before the window ends.
 *  Rendered to ProRes 4444 and composited behind the speaker with tools/behind_compose.mjs. Fonts: the three the user picked, rotated. */
const FONTS = [
  { f: fRakkas(), w: 400, size: 440 },
  { f: fBaloo(), w: 800, size: 460 },
  { f: fKufam(), w: 800, size: 420 },
];
export const TIR_WINDOW = 3.8;
export const TirBehind: React.FC = () => (
  <AbsoluteFill>
    {words.map((k, i) => {
      const ft = FONTS[i % 3];
      return <BehindWord2 key={i} text={k.word} font={ft.f} weight={ft.w} nominal={ft.size} fps={30} from={k.offset + 0.35} to={k.offset + 3.45} headX={(headX as number[])[i]} />;
    })}
  </AbsoluteFill>
);
