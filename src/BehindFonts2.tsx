import React from "react";
import { AbsoluteFill } from "remotion";
import { loadFont as fRakkas } from "@remotion/google-fonts/Rakkas";
import { loadFont as fBaloo } from "@remotion/google-fonts/BalooBhaijaan2";
import { loadFont as fKufam } from "@remotion/google-fonts/Kufam";
import { BehindWord2 } from "./BehindWord2";

/** The user's 3 chosen fonts (from the audition): Rakkas (3), Baloo Bhaijaan 2 (8), Kufam (9). One tatweel in the middle only. */
const RAKKAS = fRakkas();
const BALOO = fBaloo();
const KUFAM = fKufam();
const fps = 30;
export const BehindFonts2: React.FC = () => (
  <AbsoluteFill>
    <BehindWord2 text="منظمة واحدة؟" font={RAKKAS} from={0.3} to={2.9} fps={fps} nominal={440} />
    <BehindWord2 text="منظمة واحدة؟" font={BALOO} weight={800} from={3.0} to={5.6} fps={fps} nominal={460} />
    <BehindWord2 text="منظمة واحدة؟" font={KUFAM} weight={800} from={5.7} to={8.3} fps={fps} nominal={420} />
    <div style={{ position: "absolute", left: 40, bottom: 40 }} />
  </AbsoluteFill>
);
